const fs = require('fs');
const path = require('path');

const root = process.cwd();
const prismaDir = path.join(root, 'prisma');
const schemaFile = path.join(prismaDir, 'schema.prisma');
const schemaDir = path.join(prismaDir, 'schema');
const introspectedFile = path.join(prismaDir, 'introspected.prisma');
const outFile = path.join(prismaDir, 'combined.prisma');

function extractModels(content) {
  const regex = /model\s+([A-Za-z0-9_]+)\s*\{([\s\S]*?)\n\}/g;
  const models = [];
  let m;
  while ((m = regex.exec(content)) !== null) {
    const name = m[1];
    const body = m[0];
    models.push({ name, body });
  }
  return models;
}

function fileContentSafe(p) {
  try {
    return fs.readFileSync(p, 'utf-8');
  } catch (e) {
    return '';
  }
}

console.log('Building combined Prisma schema...');

const header = fileContentSafe(schemaFile);
if (!header) {
  console.error('Could not read prisma/schema.prisma header. Make sure it exists.');
  process.exit(1);
}

const files = [];
try {
  const schemaFiles = fs.readdirSync(schemaDir).filter(f => f.endsWith('.prisma')).map(f => path.join(schemaDir, f));
  files.push(...schemaFiles);
} catch (e) {
  console.warn('No prisma/schema directory or no files inside.');
}

if (fs.existsSync(introspectedFile)) files.push(introspectedFile);

const included = new Set();
let modelsContent = '';

for (const f of files) {
  const content = fileContentSafe(f);
  const models = extractModels(content);
  for (const m of models) {
    if (!included.has(m.name)) {
      included.add(m.name);
      modelsContent += m.body + '\n\n';
    }
  }
}

if (!modelsContent) {
  console.error('No models found to include.');
  process.exit(1);
}

const out = header.trim() + '\n\n' + modelsContent.trim() + '\n';
fs.writeFileSync(outFile, out);
console.log('Wrote', outFile);
