/**
 * Remove broken lodash and reinstall lodash@4.17.21 at repo root.
 * Run from repo root: node scripts/fix-lodash.js
 */
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const lodashPath = path.join(root, 'node_modules', 'lodash');

if (fs.existsSync(lodashPath)) {
  console.log('Removing node_modules/lodash...');
  fs.rmSync(lodashPath, { recursive: true });
  console.log('Done.');
} else {
  console.log('node_modules/lodash not found.');
}

console.log('Installing lodash@4.17.21...');
execSync('npm install lodash@4.17.21 --save-dev --legacy-peer-deps', {
  cwd: root,
  stdio: 'inherit'
});
console.log('Lodash reinstalled. Run: cd backend && npm run start:dev');
