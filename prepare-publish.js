#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Copy NPM_README.md to README.md for publishing
console.log('Copying NPM_README.md to README.md.npm...');
fs.copyFileSync(
  path.join(__dirname, 'NPM_README.md'),
  path.join(__dirname, 'README.md.npm')
);

// Rename original README.md to README.md.original
console.log('Renaming README.md to README.md.original...');
fs.renameSync(
  path.join(__dirname, 'README.md'),
  path.join(__dirname, 'README.md.original')
);

// Rename README.md.npm to README.md
console.log('Renaming README.md.npm to README.md...');
fs.renameSync(
  path.join(__dirname, 'README.md.npm'),
  path.join(__dirname, 'README.md')
);

console.log('Package prepared for publishing!');
console.log('Run "npm publish" to publish the package.');
console.log('After publishing, run "node restore-readme.js" to restore the original README.md.');
