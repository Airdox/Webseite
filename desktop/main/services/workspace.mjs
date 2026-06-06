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

  for (const char of String(commandLine).trim()) {
    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }

    if (char === '\\' && quote !== "'") {
      escaped = true;
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
  let executable = command;
  let commandArgs = args;

  try {
    if (!Array.isArray(commandArgs)) {
      const parsed = parseCommandLine(command);
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
    resolve({
      ok: false,
      code: 1,
      stdout: '',
      stderr: 'Command is empty.',
    });
    return;
  }

  const child = spawn(resolveExecutable(executable), commandArgs, {
    cwd,
    env: { ...process.env, ...env },
  });

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
    resolve({
      ok: code === 0,
      code,
      stdout: stdout.trim(),
      stderr: stderr.trim(),
    });
  });

  child.on('error', (error) => {
    if (settled) return;
    settled = true;
    resolve({
      ok: false,
      code: 1,
      stdout: stdout.trim(),
      stderr: error.message,
    });
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
