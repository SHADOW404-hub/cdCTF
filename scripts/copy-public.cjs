const fs = require('fs');
const path = require('path');

const src = path.resolve(__dirname, '..', 'artifacts', 'cyberplace', 'dist', 'public');
const dest = path.resolve(__dirname, '..', 'public');

function exists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

function copyRecursiveSync(s, d) {
  const stat = fs.statSync(s);
  if (stat.isDirectory()) {
    fs.mkdirSync(d, { recursive: true });
    const entries = fs.readdirSync(s);
    for (const entry of entries) {
      copyRecursiveSync(path.join(s, entry), path.join(d, entry));
    }
  } else {
    fs.mkdirSync(path.dirname(d), { recursive: true });
    fs.copyFileSync(s, d);
  }
}

try {
  if (!exists(src)) {
    console.log(`Source directory not found: ${src} — skipping copy.`);
    process.exit(0);
  }
  copyRecursiveSync(src, dest);
  console.log(`Copied ${src} -> ${dest}`);
  process.exit(0);
} catch (err) {
  console.error('Copy failed:', err);
  process.exit(1);
}
