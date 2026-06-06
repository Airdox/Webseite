import fs from 'node:fs/promises';
import { diffSetEntries, insertOrReplaceSet, serializeSetsModule, toManifestSet } from '../../../src/desktop/lib/setManifest.js';
import { getWorkspacePaths, isWorkspaceRoot } from './workspace.mjs';

const extractExportedArrayLiteral = (source, exportName) => {
  const declarationPattern = new RegExp(`export\\s+const\\s+${exportName}\\s*=\\s*\\[`);
  const declaration = declarationPattern.exec(source);
  if (!declaration) {
    throw new Error(`Manifest does not export ${exportName}.`);
  }

  const start = declaration.index + declaration[0].lastIndexOf('[');
  let depth = 0;
  let quote = '';
  let escaped = false;

  for (let index = start; index < source.length; index += 1) {
    const char = source[index];

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        quote = '';
      }
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }

    if (char === '[') depth += 1;
    if (char === ']') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(start, index + 1);
      }
    }
  }

  throw new Error(`Manifest export ${exportName} is not a closed array literal.`);
};

export const readSets = async (workspaceRoot) => {
  if (!(await isWorkspaceRoot(workspaceRoot))) {
    throw new Error('Workspace is not configured or invalid.');
  }

  const { manifestPath } = getWorkspacePaths(workspaceRoot);
  const source = await fs.readFile(manifestPath, 'utf8');
  const { default: JSON5 } = await import('json5');
  const sets = JSON5.parse(extractExportedArrayLiteral(source, 'sets'));
  return JSON.parse(JSON.stringify(sets || []));
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
