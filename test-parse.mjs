import { runCommand } from './desktop/main/services/workspace.mjs';

(async () => {
  try {
    const cmd = 'node -e "console.log(JSON.stringify(process.argv.slice(1)))" "D:\\Neuer Ordner (2)\\ratten_FXXXerUnknown Album(4)\\01 REC-2026-06-21.wav"';
    const res = await runCommand({ command: cmd, cwd: process.cwd() });
    console.log('COMMAND:', cmd);
    console.log('RESULT:', JSON.stringify(res, null, 2));
  } catch (err) {
    console.error('ERROR', err);
    process.exit(1);
  }
})();
