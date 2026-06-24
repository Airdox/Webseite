import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { parse as parseDotenv } from 'dotenv';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const bundledRepoRoot = path.resolve(__dirname, '../../..');
const REQUIRED_FILES = ['package.json', path.join('src', 'data', 'musicSets.js'), 'wrangler.jsonc'];

export const fileExists = async (targetPath) => {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
};

export const ensureDirectory = async (targetPath) => {
  await fs.mkdir(targetPath, { recursive: true });
  return targetPath;
};

export const isWorkspaceRoot = async (workspaceRoot) => {
  if (!workspaceRoot) return false;
  const checks = await Promise.all(
    REQUIRED_FILES.map((relativePath) => fileExists(path.join(workspaceRoot, relativePath))),
  );
  return checks.every(Boolean);
};

const walkParents = async (startPath) => {
  let current = path.resolve(startPath);
  while (true) {
    if (await isWorkspaceRoot(current)) return current;
    const parent = path.dirname(current);
    if (parent === current) return '';
    current = parent;
  }
};

export const findDefaultWorkspace = async (startPath = process.cwd()) => {
  if (await isWorkspaceRoot(bundledRepoRoot)) return bundledRepoRoot;
  return walkParents(startPath);
};

export const getWorkspacePaths = (workspaceRoot) => ({
  workspaceRoot,
  manifestPath: path.join(workspaceRoot, 'src', 'data', 'musicSets.js'),
  coverOutputDir: path.join(workspaceRoot, 'public', 'assets'),
  envPath: path.join(workspaceRoot, '.env'),
  envExamplePath: path.join(workspaceRoot, '.env.example'),
  packageJsonPath: path.join(workspaceRoot, 'package.json'),
  wranglerPath: path.join(workspaceRoot, 'wrangler.jsonc'),
});

export const getAgentSystemPaths = (
  workspaceRoot,
  {
    proposalFile = '',
    approvalStateFile = '',
  } = {},
) => {
  const agentSystemDir = path.join(workspaceRoot, 'docs', 'agent-system');
  return {
    agentSystemDir,
    proposalPath: proposalFile ? path.join(agentSystemDir, proposalFile) : '',
    approvalStatePath: approvalStateFile ? path.join(agentSystemDir, approvalStateFile) : '',
  };
};

export const readWorkspaceEnv = async (workspaceRoot) => {
  const { envExamplePath, envPath } = getWorkspacePaths(workspaceRoot);
  const merged = {};

  for (const candidate of [envExamplePath, envPath]) {
    if (!(await fileExists(candidate))) continue;
    const raw = await fs.readFile(candidate, 'utf8');
    Object.assign(merged, parseDotenv(raw));
  }

  return merged;
};

const parseCommandLine = (commandLine = '') => {
  const args = [];
  let current = '';
  let quote = '';
  let escaped = false;
  const str = String(commandLine).trim();

  for (let i = 0; i < str.length; i += 1) {
    const char = str[i];
    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }

    // Handle backslash: only treat as escape when it precedes a quote, whitespace or another backslash.
    // Otherwise preserve it (important for Windows paths like C:\\Dir\\file.wav).
    if (char === '\\' && quote !== "'") {
      const next = str[i + 1];
      if (next && (next === '"' || next === "'" || /\s/.test(next) || next === '\\')) {
        escaped = true;
        continue;
      }
      current += char;
      continue;
    }

    if ((char === '"' || char === "'") && (!quote || quote === char)) {
      quote = quote ? '' : char;
      continue;
    }

    if (/\s/.test(char) && !quote) {
      if (current) {
        args.push(current);
        current = '';
      }
      continue;
    }

    current += char;
  }

  if (current) args.push(current);
  if (quote) throw new Error(`Unclosed quote in command: ${commandLine}`);
  return args;
};

const resolveExecutable = (command) => {
  if (process.platform !== 'win32') return command;
  if (command === 'npm' || command === 'npx') return `${command}.cmd`;
  return command;
};

export const runCommand = async ({ command, args, cwd, env = {} }) => new Promise((resolve) => {
  let executable;
  let commandArgs;

  // Normalize when a caller passes an array as `command`.
  if (Array.isArray(command)) {
    executable = String(command[0] || '');
    commandArgs = command.slice(1).map((v) => String(v || ''));
  } else {
    executable = typeof command === 'string' ? command : String(command || '');
    commandArgs = args;
  }

  try {
    if (typeof commandArgs === 'string') {
      // If args were passed as a single string, parse into array form.
      commandArgs = parseCommandLine(commandArgs);
    } else if (!Array.isArray(commandArgs)) {
      // No explicit args array provided — parse the command string instead.
      const parsed = parseCommandLine(executable);
      [executable, ...commandArgs] = parsed;
    }
  } catch (error) {
    resolve({
      ok: false,
      code: 1,
      stdout: '',
      stderr: error.message,
    });
    return;
  }

  if (!executable) {
    resolve({ ok: false, code: 1, stdout: '', stderr: 'Command is empty.' });
    return;
  }

  if (typeof executable !== 'string') {
    resolve({ ok: false, code: 1, stdout: '', stderr: `Invalid executable type: ${typeof executable}` });
    return;
  }

  if (!Array.isArray(commandArgs)) commandArgs = [];

  let child;
  try {
    const resolvedExec = resolveExecutable(executable);
    try {
      process.stderr.write(`runCommand spawn: executable=${resolvedExec} args=${JSON.stringify(commandArgs)} cwd=${cwd}\n`);
    } catch {}

    try {
      child = spawn(resolvedExec, commandArgs, {
        cwd,
        env: { ...process.env, ...env },
      });
    } catch (innerErr) {
      // Fallback for Windows .cmd/.bat executables — try via cmd.exe /c
      if (process.platform === 'win32' && typeof resolvedExec === 'string'
        && (resolvedExec.toLowerCase().endsWith('.cmd') || resolvedExec.toLowerCase().endsWith('.bat')))
      {
        try {
          const cmd = process.env.ComSpec || 'cmd.exe';
          process.stderr.write(`runCommand spawn-fallback: cmd=${cmd} /c ${resolvedExec} args=${JSON.stringify(commandArgs)} cwd=${cwd}\n`);
          child = spawn(cmd, ['/c', resolvedExec, ...commandArgs], {
            cwd,
            env: { ...process.env, ...env },
          });
        } catch (cmdErr) {
          throw cmdErr;
        }
      } else {
        throw innerErr;
      }
    }
  } catch (error) {
    const errMsg = `${error.message}${error && error.stack ? '\n' + error.stack : ''} (executable=${String(executable)} args=${JSON.stringify(commandArgs)})`;
    try { process.stderr.write(`runCommand error: ${errMsg}\n`); } catch {}
    resolve({ ok: false, code: 1, stdout: '', stderr: errMsg });
    return;
  }

  let stdout = '';
  let stderr = '';
  let settled = false;

  child.stdout?.on('data', (chunk) => {
    stdout += chunk.toString();
  });

  child.stderr?.on('data', (chunk) => {
    stderr += chunk.toString();
  });

  child.on('close', (code) => {
    if (settled) return;
    settled = true;
    resolve({ ok: code === 0, code, stdout: stdout.trim(), stderr: stderr.trim() });
  });

  child.on('error', (error) => {
    if (settled) return;
    settled = true;
    const errMsg = `${error.message}${error && error.stack ? '\n' + error.stack : ''} (executable=${String(executable)} args=${JSON.stringify(commandArgs)})`;
    try { process.stderr.write(`runCommand error: ${errMsg}\n`); } catch {}
    resolve({ ok: false, code: 1, stdout: stdout.trim(), stderr: errMsg });
  });
});

export const getGitStatus = async (workspaceRoot) => {
  if (!(await isWorkspaceRoot(workspaceRoot))) {
    return { branch: '', dirty: false, summary: 'Workspace not configured' };
  }

  const branchResult = await runCommand({
    command: 'git branch --show-current',
    cwd: workspaceRoot,
  });

  const statusResult = await runCommand({
    command: 'git status --short',
    cwd: workspaceRoot,
  });

  return {
    branch: branchResult.stdout || '',
    dirty: Boolean(statusResult.stdout),
    summary: statusResult.stdout || 'Working tree clean',
  };
};
