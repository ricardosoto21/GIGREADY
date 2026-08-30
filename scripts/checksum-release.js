const { createHash } = require('crypto');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const releaseDir = path.join(root, 'release');
const vendorFfmpeg = path.join(root, 'vendor', 'ffmpeg', 'win-x64', 'ffmpeg.exe');
const vendorFfprobe = path.join(root, 'vendor', 'ffmpeg', 'win-x64', 'ffprobe.exe');

function hashFile(filePath) {
  const hash = createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex').toUpperCase();
}

function relative(filePath) {
  return path.relative(root, filePath).replace(/\\/g, '/');
}

function getLatestInstaller() {
  if (!fs.existsSync(releaseDir)) return null;
  const installers = fs.readdirSync(releaseDir)
    .filter((name) => /^GigReady Setup .*\.exe$/i.test(name))
    .map((name) => {
      const fullPath = path.join(releaseDir, name);
      return { fullPath, mtimeMs: fs.statSync(fullPath).mtimeMs };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);
  return installers[0]?.fullPath || null;
}

const targets = [];
if (fs.existsSync(vendorFfmpeg)) targets.push(vendorFfmpeg);
if (fs.existsSync(vendorFfprobe)) targets.push(vendorFfprobe);

const latestInstaller = getLatestInstaller();
if (latestInstaller) targets.push(latestInstaller);

if (targets.length === 0) {
  console.error('No files found for checksum generation.');
  process.exit(1);
}

const lines = targets.map((target) => `${hashFile(target)}  ${relative(target)}`);
console.log(lines.join('\n'));

if (fs.existsSync(releaseDir)) {
  fs.writeFileSync(path.join(releaseDir, 'checksums.sha256'), `${lines.join('\n')}\n`, 'utf8');
}
