const fs = require('fs');
const path = require('path');
const specs = require('./swagger-config');
const { version } = require('../package.json');

// Ensure build directory exists
const buildDir = path.join(__dirname, '../build');
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

// Write OpenAPI spec to file
const outputFile = path.join(buildDir, `${version}.json`);
fs.writeFileSync(outputFile, JSON.stringify(specs, null, 2));

console.log(`OpenAPI specification generated: ${outputFile}`);
