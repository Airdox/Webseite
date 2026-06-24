import path from 'node:path';

const WORKSPACE_ROOT = path.resolve('./');
const audioDir = 'D:\\Neuer Ordner (2)\\ratten_FXXXer\\Unknown Album(4)';
const audioMp3 = path.join(audioDir, '01 REC-2026-06-21.mp3');
const audioWav = path.join(audioDir, '01 REC-2026-06-21.wav');
const cueFile = path.join(audioDir, '01 REC-2026-06-21.cue');

(async () => {
  try {
    const pipeline = await import('../desktop/main/services/pipeline.mjs');
    const filePaths = [];
    // Prefer MP3 if available
    filePaths.push(audioMp3);
    // Add cue and wav as extras
    filePaths.push(cueFile);
    filePaths.push(audioWav);

    console.log('Workspace root:', WORKSPACE_ROOT);
    console.log('Files to import:', filePaths);

    const settings = {
      workspaceRoot: WORKSPACE_ROOT,
      uploadAudioToR2: false,
      autoSeedStats: false,
      autoBuild: true,
      autoDeploy: true,
      autoCommit: false,
      autoPush: false,
      requireTracklistForLive: false,
      safeMode: false,
      extractEmbeddedCover: false,
      verifyLiveAfterDeploy: true,
    };

    console.log('Preparing import bundle...');
    const prepared = await pipeline.prepareImportBundle({ filePaths, settings });
    console.log('Detected files:', prepared.detectedFiles);
    if (prepared.warnings && prepared.warnings.length) {
      console.log('Warnings:\n', prepared.warnings.join('\n'));
    }

    const draft = prepared.draft;
    console.log('Draft ID:', draft.id);
    console.log('Draft title:', draft.title);
    console.log('Draft file:', draft.file);

    console.log('Publishing set (this will trigger build + deploy)...');
    const result = await pipeline.publishSet({ workspaceRoot: WORKSPACE_ROOT, draft, settings });
    console.log('Publish result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Publish failed:', error && error.stack ? error.stack : error);
    process.exitCode = 1;
  }
})();
