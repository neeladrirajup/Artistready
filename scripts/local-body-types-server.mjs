import { createServer } from 'node:http';
import { spawnSync } from 'node:child_process';

const fits=new Set(['male','female','neutral']);
const psql=process.env.ARTISTREADY_PSQL_PATH||'C:\\Program Files\\PostgreSQL\\17\\bin\\psql.exe';
const server=createServer((request,response)=>{
 const url=new URL(request.url||'/', 'http://127.0.0.1:5174');
 if(request.method!=='GET'){response.writeHead(405).end();return;}
 if(url.pathname==='/health'){response.writeHead(200,{'Content-Type':'text/plain'}).end('ready');return;}
 if(url.pathname!=='/api/local/body-types'){response.writeHead(404).end();return;}
 const fit=url.searchParams.get('fit')||'neutral';
 if(!fits.has(fit)){response.writeHead(400).end();return;}
 const query=`SELECT artistready.list_body_types('${fit}')::text`;
 const result=spawnSync(psql,['-X','-h','127.0.0.1','-p','5432','-U','postgres','-d','artistready','-v','ON_ERROR_STOP=1','-tA','-c',query],{
  env:process.env,encoding:'utf8',timeout:10000,maxBuffer:1024*1024,
 });
 if(result.error||result.status!==0){response.writeHead(503,{'Content-Type':'application/json','Cache-Control':'no-store'}).end('{"error":"Local Body Type catalog is unavailable"}');return;}
 try{
  const rows=JSON.parse(result.stdout.trim());
  if(!Array.isArray(rows))throw new Error('Unexpected catalog result');
  response.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'}).end(JSON.stringify(rows));
 }catch{response.writeHead(503,{'Content-Type':'application/json','Cache-Control':'no-store'}).end('{"error":"Local Body Type catalog is unavailable"}');}
});
server.listen(5174,'127.0.0.1');
