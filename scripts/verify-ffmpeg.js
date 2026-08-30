const { createHash } = require('crypto');
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const binaries = [
  { name: 'FFmpeg', relativePath: path.join('vendor', 'ffmpeg', 'win-x64', 'ffmpeg.exe') },
  { name: 'FFprobe', relativePath: path.join('vendor', 'ffmpeg', 'win-x64', 'ffprobe.exe') },
];

function fail(message) {
  console.error(`FFmpeg verification failed: ${message}`);
  process.exit(1);
}

function hashFile(filePath) {
  const hash = createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex').toUpperCase();
}

for (const binary of binaries) {
  const binaryPath = path.resolve(__dirname, '..', binary.relativePath);
  if (!fs.existsSync(binaryPath)) {
    fail(`missing ${binary.name} binary at ${binaryPath}`);
  }

  const licenseResult = spawnSync(binaryPath, ['-L'], { encoding: 'utf8' });
  const output = `${licenseResult.stdout || ''}\n${licenseResult.stderr || ''}`;

  if (licenseResult.error) {
    fail(`${binary.name}: ${licenseResult.error.message}`);
  }

  if (licenseResult.status !== 0) {
    fail(`${binary.name}: -L exited with ${licenseResult.status}`);
  }

  if (!/GNU Lesser General Public License/i.test(output)) {
    fail(`${binary.name}: license output does not mention LGPL`);
  }

  if (/--enable-gpl\b/i.test(output)) {
    fail(`${binary.name}: build flags include --enable-gpl`);
  }

  if (/--enable-nonfree\b/i.test(output)) {
    fail(`${binary.name}: build flags include --enable-nonfree`);
  }

  const versionResult = spawnSync(binaryPath, ['-version'], { encoding: 'utf8' });
  const versionLine = `${versionResult.stdout || ''}`.split(/\r?\n/).find(Boolean) || 'unknown version';

  console.log(`${binary.name} LGPL verification passed.`);
  console.log(versionLine);
  console.log(`SHA256 ${hashFile(binaryPath)}  ${binary.relativePath.replace(/\\/g, '/')}`);
}
