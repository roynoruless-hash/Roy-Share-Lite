import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageJsonPath = path.join(__dirname, '../package.json');
const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

let commitSha = 'Unavailable';
let commitMessage = 'Unavailable';
let commitDate = 'Unavailable';

try {
  // Check if we are inside a git repository
  execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
  
  commitSha = execSync('git rev-parse --short HEAD').toString().trim();
  commitMessage = execSync('git log -1 --format=%s').toString().trim();
  
  // Date and Time of the latest commit
  commitDate = execSync('git log -1 --format="%ad" --date=format:"%Y-%m-%d %H:%M UTC"').toString().trim();
} catch (e) {
  // Git metadata is unavailable, values default to 'Unavailable'
}

// Current UTC date and time for build
const buildDateTime = new Date().toISOString()
  .replace('T', ' ')
  .substring(0, 16) + ' UTC';

const buildInfo = {
  buildVersion: pkg.version || '0.0.0',
  commitSha,
  commitMessage,
  commitDate,
  buildDateTime,
};

const outputDir = path.join(__dirname, '../src');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(
  path.join(outputDir, 'build-info.json'),
  JSON.stringify(buildInfo, null, 2),
  'utf8'
);

console.log('Build info generated successfully:', buildInfo);
