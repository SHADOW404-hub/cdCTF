const { spawnSync } = require('child_process');

// Run the monorepo build non-interactively with CI=true
process.env.CI = 'true';

function run(cmd) {
  console.log('> ' + cmd);
  const res = spawnSync(cmd, { stdio: 'inherit', shell: true, env: process.env });
  if (res.status !== 0) {
    process.exit(res.status);
  }
}

try {
  // Run typecheck and workspace builds, then copy public
  run("corepack pnpm run typecheck && corepack pnpm -r --if-present run build && node ./scripts/copy-public.cjs");
  console.log('Build script finished successfully.');
} catch (err) {
  console.error('Build script failed:', err);
  process.exit(1);
}
