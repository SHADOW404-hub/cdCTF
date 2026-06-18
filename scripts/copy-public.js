const fs = require('fs');
const path = require('path');

const src = path.resolve(__dirname, '..', 'artifacts', 'cyberplace', 'dist', 'public');
const dest = path.resolve(__dirname, '..', 'public');

async function exists(p) {
  try {
    await fs.promises.access(p);
    return true;
  } catch {
    return false;
  }
}

async function copyRecursive(s, d) {
  const stat = await fs.promises.stat(s);
  if (stat.isDirectory()) {
    await fs.promises.mkdir(d, { recursive: true });
    const entries = await fs.promises.readdir(s);
    for (const entry of entries) {
      await copyRecursive(path.join(s, entry), path.join(d, entry));
    }
  } else {
    await fs.promises.mkdir(path.dirname(d), { recursive: true });
    await fs.promises.copyFile(s, d);
  }
}

(async () => {
  try {
    if (!(await exists(src))) {
      console.log(`Source directory not found: ${src} — skipping copy.`);
      process.exit(0);
    }
    await copyRecursive(src, dest);
    console.log(`Copied ${src} -> ${dest}`);
    process.exit(0);
  } catch (err) {
    console.error('Copy failed:', err);
    process.exit(1);
  }
})();
