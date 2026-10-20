import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const deployment = JSON.parse(readFileSync(new URL("../cloudflare-deploy.json", import.meta.url), "utf8"));
const environment = { ...process.env, ARTISTREADY_CLOUDFLARE: "1" };
const build = spawnSync(process.execPath, ["scripts/run-framework.mjs", "build"], {
  cwd: root,
  env: environment,
  stdio: "inherit",
});
if (build.error) throw build.error;
if (build.status !== 0) process.exit(build.status ?? 1);

const configUrl = new URL("../dist/server/wrangler.json", import.meta.url);
const config = JSON.parse(readFileSync(configUrl, "utf8"));
config.name = deployment.workerName;
config.d1_databases = [{
  binding: "DB",
  database_name: deployment.databaseName,
  database_id: deployment.databaseId,
}];
config.r2_buckets = [{ binding: "BUCKET", bucket_name: deployment.bucketName }];
const productionConfigUrl = new URL("../dist/server/wrangler.production.json", import.meta.url);
writeFileSync(productionConfigUrl, `${JSON.stringify(config, null, 2)}\n`);

if (process.argv.includes("--prepare-only")) {
  console.log(`Prepared ${fileURLToPath(productionConfigUrl)}`);
  process.exit(0);
}

const deploy = spawnSync(process.execPath, [
  "node_modules/wrangler/bin/wrangler.js",
  "deploy",
  "--config",
  fileURLToPath(productionConfigUrl),
], { cwd: root, env: environment, stdio: "inherit" });
if (deploy.error) throw deploy.error;
process.exit(deploy.status ?? 1);
