import { createServer } from 'node:http';
import { Client } from 'pg';

const fits = new Set(['male', 'female', 'neutral']);
const crafts = new Set(['Actor', 'Actress', 'Director', 'Writer', 'Cinematographer', 'Other creative']);
const connectionString = process.env.ARTISTREADY_LOCAL_PG_URL;
if (!connectionString) throw new Error('ARTISTREADY_LOCAL_PG_URL is required');

const server = createServer(async (request, response) => {
  const url = new URL(request.url || '/', 'http://127.0.0.1:5174');
  if (request.method !== 'GET') { response.writeHead(405).end(); return; }
  if (url.pathname === '/health') { response.writeHead(200, { 'Content-Type': 'text/plain' }).end('ready'); return; }
  const bodyTypes = url.pathname === '/api/local/body-types';
  if (!bodyTypes && url.pathname !== '/api/local/craft-roles') { response.writeHead(404).end(); return; }
  const fit = url.searchParams.get('fit') || 'neutral';
  const craft = url.searchParams.get('craft') || '';
  if (bodyTypes ? !fits.has(fit) : !crafts.has(craft)) { response.writeHead(400).end(); return; }

  const client = new Client({ connectionString, connectionTimeoutMillis: 5000 });
  try {
    await client.connect();
    await client.query('SET ROLE artistready_api');
    const result = await client.query(bodyTypes
      ? 'CALL artistready.read_body_types($1,NULL)'
      : 'CALL artistready.read_craft_roles($1,NULL)', [bodyTypes ? fit : craft]);
    const rows = result.rows[0]?.p_result;
    if (!Array.isArray(rows)) throw new Error('Unexpected catalog result');
    response.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }).end(JSON.stringify(rows));
  } catch {
    response.writeHead(503, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }).end('{"error":"Local catalog is unavailable"}');
  } finally {
    await client.end().catch(() => {});
  }
});

server.listen(5174, '127.0.0.1');
