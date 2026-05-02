import fs from 'node:fs/promises';
import { diffSetEntries, insertOrReplaceSet, serializeSetsModule, toManifestSet } from '../../../src/desktop/lib/setManifest.js';
import { getWorkspacePaths, isWorkspaceRoot } from './workspace.mjs';

export const readSets = async (workspaceRoot) => {
  if (!(await isWorkspaceRoot(workspaceRoot))) {
    throw new Error('Workspace is not configured or invalid.');
  }

  const { manifestPath } = getWorkspacePaths(workspaceRoot);
  const source = await fs.readFile(manifestPath, 'utf8');
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}#cacheBust=${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const imported = await import(moduleUrl);
  return JSON.parse(JSON.stringify(imported.sets || []));
};

export const writeSets = async (workspaceRoot, sets) => {
  const { manifestPath } = getWorkspacePaths(workspaceRoot);
  await fs.writeFile(manifestPath, serializeSetsModule(sets), 'utf8');
  return sets;
};

export const upsertSet = async (workspaceRoot, draft, settings) => {
  const currentSets = await readSets(workspaceRoot);
  const previousEntry = currentSets.find((entry) => entry.id === draft.id) || null;
  const updatedSets = insertOrReplaceSet(currentSets, draft, settings);
  await writeSets(workspaceRoot, updatedSets);
  const nextEntry = updatedSets.find((entry) => entry.id === draft.id) || toManifestSet(draft);
  return {
    previousEntry,
    nextEntry,
    updatedSets,
    diff: diffSetEntries(previousEntry, nextEntry),
  };
};
