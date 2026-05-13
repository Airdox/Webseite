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

export const runCommand = async ({ command, cwd, env = {} }) => new Promise((resolve) => {
  const child = spawn(command, {
    cwd,
    shell: true,
    env: { ...process.env, ...env },
  });

  let stdout = '';
  let stderr = '';

  child.stdout?.on('data', (chunk) => {
    stdout += chunk.toString();
  });

  child.stderr?.on('data', (chunk) => {
    stderr += chunk.toString();
  });

  child.on('close', (code) => {
    resolve({
      ok: code === 0,
      code,
      stdout: stdout.trim(),
      stderr: stderr.trim(),
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
