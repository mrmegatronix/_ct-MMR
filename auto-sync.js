import { exec } from 'child_process';
import { watch } from 'chokidar';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

let syncTimeout;
let isSyncing = false;
let pendingSync = false;

function sync() {
  if (isSyncing) {
    pendingSync = true;
    return;
  }
  
  isSyncing = true;
  console.log(`[${new Date().toLocaleTimeString()}] Changes detected! Syncing with GitHub...`);
  
  const commitMessage = `Auto sync: ${new Date().toISOString()}`;
  // We use git status to check if there are changes before committing
  const command = `git status --porcelain`;

  exec(command, { cwd: __dirname }, (error, stdout, stderr) => {
    if (error) {
       console.error(`Error checking git status: ${error.message}`);
       isSyncing = false;
       return;
    }
    
    if (stdout.trim().length === 0) {
      // No changes
      isSyncing = false;
      return;
    }

    const syncCommand = `git add . && git commit -m "${commitMessage}" && git push`;
    exec(syncCommand, { cwd: __dirname }, (syncError, syncStdout, syncStderr) => {
      isSyncing = false;
      
      if (syncError) {
         console.error(`Error during sync: ${syncError.message}`);
      } else {
         console.log(`[${new Date().toLocaleTimeString()}] Synced successfully!`);
      }
      
      if (pendingSync) {
        pendingSync = false;
        setTimeout(sync, 1000);
      }
    });
  });
}

// Watch the root directory
console.log('Watching for file changes...');
watch(__dirname, {
  ignored: /(^|[\/\\])\..|node_modules|dist/,
  persistent: true,
  ignoreInitial: true
}).on('all', (event, filePath) => {
  if (filePath) {
    if (syncTimeout) {
      clearTimeout(syncTimeout);
    }
    // Debounce to avoid multiple triggers on a single save
    syncTimeout = setTimeout(sync, 3000);
  }
});
