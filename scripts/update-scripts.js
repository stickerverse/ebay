const fs = require('fs');
const path = require('path');

const backendPackage = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
backendPackage.scripts = {
  ...backendPackage.scripts,
  "start": "node src/server.js",
  "dev": "nodemon src/server.js",
  "test": "jest",
  "migrate": "node ../scripts/migrate.js",
  "seed": "node ../scripts/seed.js",
  "lint": "eslint src/",
  "lint:fix": "eslint src/ --fix"
};

fs.writeFileSync('backend/package.json', JSON.stringify(backendPackage, null, 2));

const frontendPackage = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
frontendPackage.scripts = {
  ...frontendPackage.scripts,
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "test": "vitest",
  "lint": "eslint src/ --ext js,jsx",
  "lint:fix": "eslint src/ --ext js,jsx --fix"
};

fs.writeFileSync('frontend/package.json', JSON.stringify(frontendPackage, null, 2));

console.log('✅ Package.json scripts updated');
