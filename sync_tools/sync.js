import { NodeSSH } from 'node-ssh';
import chokidar from 'chokidar';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ssh = new NodeSSH();
const config = {
  host: '192.168.1.150',
  username: 'owner',
  password: '781869'
};

const localDir = path.resolve(__dirname, '..');
const remoteTempDir = '/home/owner/app_sync_temp';
const remoteDeployDir = '/var/www/html';

async function setupServer() {
  console.log(`[${new Date().toLocaleTimeString()}] Connecting to Raspberry Pi...`);
  await ssh.connect(config);
  console.log(`[${new Date().toLocaleTimeString()}] Connected!`);

  console.log(`[${new Date().toLocaleTimeString()}] Ensuring Apache is installed...`);
  // Use sudo -S so it reads the password from stdin
  const installCmd = `echo "${config.password}" | sudo -S apt-get update && echo "${config.password}" | sudo -S DEBIAN_FRONTEND=noninteractive apt-get install -y apache2`;
  const result = await ssh.execCommand(installCmd);
  if (result.stdout && !result.stdout.includes('already the newest version')) {
    console.log(result.stdout);
  }
  if (result.stderr && !result.stderr.includes('password')) {
    // some apt-get output goes to stderr safely
    console.error(result.stderr);
  }

  console.log(`[${new Date().toLocaleTimeString()}] Preparing remote directories...`);
  await ssh.execCommand(`mkdir -p ${remoteTempDir}`);
}

async function syncFiles() {
  console.log(`[${new Date().toLocaleTimeString()}] Syncing files to Raspberry Pi...`);
  try {
    const failed = [];
    let uploadCount = 0;
    
    await ssh.putDirectory(localDir, remoteTempDir, {
      recursive: true,
      concurrency: 10,
      validate: function(itemPath) {
        const relativePath = path.relative(localDir, itemPath);
        const parts = relativePath.split(path.sep);
        const excluded = ['node_modules', '.git', '.github', 'sync_tools', 'dist'];
        return !parts.some(part => excluded.includes(part));
      },
      tick: function(localPath, remotePath, error) {
        if (error) {
          failed.push(localPath);
        } else {
          uploadCount++;
        }
      }
    });

    console.log(`[${new Date().toLocaleTimeString()}] Successfully uploaded ${uploadCount} files.`);
    if (failed.length > 0) {
      console.error(`[${new Date().toLocaleTimeString()}] Failed to upload ${failed.length} files.`);
    }

    console.log(`[${new Date().toLocaleTimeString()}] Deploying to Apache directory...`);
    // Copy the files to /var/www/html/ so Apache serves them
    const deployCmd = `echo "${config.password}" | sudo -S cp -r ${remoteTempDir}/* ${remoteDeployDir}/`;
    const deployResult = await ssh.execCommand(deployCmd);
    if (deployResult.stderr && !deployResult.stderr.includes('password')) {
      console.error(`[${new Date().toLocaleTimeString()}] Deploy stderr:`, deployResult.stderr);
    }

    console.log(`[${new Date().toLocaleTimeString()}] Sync complete. Apache is serving the app at http://${config.host}/`);
  } catch (err) {
    console.error(`[${new Date().toLocaleTimeString()}] Error during sync:`, err);
  }
}

let syncTimeout;

async function start() {
  try {
    await setupServer();
    await syncFiles();

    console.log(`[${new Date().toLocaleTimeString()}] Starting file watcher. Editing local files will trigger a sync...`);
    chokidar.watch(localDir, {
      ignored: /(^|[\/\\])\..|node_modules|dist|sync_tools/,
      persistent: true,
      ignoreInitial: true
    }).on('all', (event, filePath) => {
      console.log(`[${new Date().toLocaleTimeString()}] File change detected: ${event} ${filePath}`);
      if (syncTimeout) {
        clearTimeout(syncTimeout);
      }
      // Debounce the sync to group rapid file changes (e.g., from formatters)
      syncTimeout = setTimeout(() => {
        syncFiles();
      }, 2000);
    });
  } catch (err) {
    console.error('Initialization error:', err);
    process.exit(1);
  }
}

start();
