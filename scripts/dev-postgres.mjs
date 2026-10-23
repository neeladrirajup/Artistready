import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

if (!process.env.ARTISTREADY_LOCAL_PG_URL) {
  throw new Error('Set ARTISTREADY_LOCAL_PG_URL to the artistready database connection URL.');
}
const env = {
  ...process.env,
  ARTISTREADY_LOCAL_POSTGRES: '1',
  VITE_ARTISTREADY_LOCAL_POSTGRES: '1',
};
const helper = spawn(process.execPath, [fileURLToPath(new URL('./local-body-types-server.mjs', import.meta.url))], {
  env, stdio: 'inherit',
});
let app;
const stop = () => {
  app?.kill();
  helper.kill();
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
try {
  let ready = false;
  for (let attempt = 0; attempt < 30; attempt++) {
    if (helper.exitCode !== null) throw new Error('Catalog helper stopped.');
    try {
      const response = await fetch('http://127.0.0.1:5174/health');
      if (response.ok) { ready = true; break; }
    } catch { /* Wait for local startup. */ }
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  if (!ready) throw new Error('Catalog helper did not start on port 5174.');
  app = spawn(process.execPath, [fileURLToPath(new URL('./run-framework.mjs', import.meta.url)), 'dev'], {
    env, stdio: 'inherit',
  });
  const code = await new Promise(resolve => app.once('exit', resolve));
  process.exitCode = code ?? 1;
} finally {
  helper.kill();
}
