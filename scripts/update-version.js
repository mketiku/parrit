import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageJsonPath = path.join(__dirname, '../package.json');
const versionJsonPath = path.join(__dirname, '../public/version.json');

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const version = packageJson.version;

const versionJson = {
  latest: version,
  min_required: version,
};

fs.writeFileSync(versionJsonPath, JSON.stringify(versionJson, null, 2) + '\n');
console.log(`Updated public/version.json to ${version}`);
