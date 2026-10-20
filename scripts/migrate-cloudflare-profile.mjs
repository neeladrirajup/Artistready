import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const deployment = JSON.parse(readFileSync(new URL("../cloudflare-deploy.json", import.meta.url), "utf8"));
const privateDir = new URL("../.migration-private/", import.meta.url);
const source = JSON.parse(readFileSync(new URL("source-profile.json", privateDir), "utf8"));
const preferences = JSON.parse(readFileSync(new URL("source-preferences.json", privateDir), "utf8"));
const email = process.argv.find(arg => arg.startsWith("--access-email="))?.slice("--access-email=".length)?.trim().toLowerCase();
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  throw new Error("Pass --access-email=<verified Cloudflare Access email>.");
}
if (!process.argv.includes("--confirm-transfer")) {
  throw new Error("Profile transfer requires --confirm-transfer after reviewing the destination and private fields.");
}

const owner = createHash("sha256").update(`cloudflare-access:${email}`).digest("hex");
const hashFile = path => createHash("sha256").update(readFileSync(path)).digest("hex");
const sqlValue = value => `'${String(value).replaceAll("'", "''")}'`;
const run = (args, { capture = false } = {}) => {
  const result = spawnSync(process.execPath, ["node_modules/wrangler/bin/wrangler.js", ...args], {
    cwd: root,
    encoding: "utf8",
    stdio: capture ? ["ignore", "pipe", "inherit"] : "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Wrangler failed (${result.status}).`);
  return result.stdout;
};

const check = JSON.parse(run([
  "d1", "execute", deployment.databaseName, "--remote", "--json",
  "--command", `SELECT id FROM profiles WHERE id=${sqlValue(owner)} LIMIT 1`,
], { capture: true }));
if (check[0]?.results?.length) throw new Error("Destination profile already exists; no data was overwritten.");

const mediaRows = [];
for (const item of source.media) {
  if (item.kind !== "photo" && item.kind !== "video") throw new Error("Unexpected media kind.");
  const suffix = item.mime === "image/jpeg" ? ".jpg" : item.mime === "image/png" ? ".png" :
    item.mime === "image/webp" ? ".webp" : item.mime === "video/mp4" ? ".mp4" :
    item.mime === "video/webm" ? ".webm" : null;
  if (!suffix) throw new Error("Unexpected media format.");
  const path = fileURLToPath(new URL(`media/${item.id}${suffix}`, privateDir));
  if (!existsSync(path) || statSync(path).size !== item.size) throw new Error(`Missing or incomplete media ${item.id}.`);
  const key = `profiles/${owner}/${item.id}/${hashFile(path)}`;
  mediaRows.push({ item, path, key });
}

for (const { item, path, key } of mediaRows) {
  run(["r2", "object", "put", `${deployment.bucketName}/${key}`, "--remote", "--file", path, "--content-type", item.mime]);
}

const now = new Date().toISOString();
const statements = [
  `INSERT INTO profile_accounts(id,created_at) VALUES (${sqlValue(owner)},${sqlValue(now)});`,
  `INSERT INTO profiles(id,name,role,city,document,version,created_at,updated_at) VALUES (${[
    owner, source.draft.name, source.draft.role, source.draft.city, JSON.stringify(source.draft),
    source.version, now, source.updatedAt || now,
  ].map(sqlValue).join(",")});`,
  ...mediaRows.map(({ item, key }) => `INSERT INTO profile_media(key,owner_id,id,kind,storage_key,name,mime,size,created_at) VALUES (${[
    `${owner}:${item.id}`, owner, item.id, item.kind, key, item.name, item.mime, item.size,
    new Date(item.created).toISOString(),
  ].map(sqlValue).join(",")});`),
];
if (preferences.version !== null && preferences.preferences) {
  statements.push(`INSERT INTO artist_preferences(artist_id,document,version,created_at,updated_at) VALUES (${[
    owner, JSON.stringify(preferences.preferences), preferences.version, now, preferences.updatedAt || now,
  ].map(sqlValue).join(",")});`);
}
const sqlFile = new URL("cloudflare-import.sql", privateDir);
writeFileSync(sqlFile, `${statements.join("\n")}\n`);
run(["d1", "execute", deployment.databaseName, "--remote", "--file", fileURLToPath(sqlFile)]);
console.log("Profile, preferences, and media imported to the verified Cloudflare Access identity.");
