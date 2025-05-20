#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Rename README.md to README.md.npm
console.log('Renaming README.md to README.md.npm...');
fs.renameSync(
  path.join(__dirname, 'README.md'),
  path.join(__dirname, 'README.md.npm')
);

// Rename README.md.original to README.md
console.log('Restoring original README.md...');
fs.renameSync(
  path.join(__dirname, 'README.md.original'),
  path.join(__dirname, 'README.md')
);

console.log('Original README.md restored!');
