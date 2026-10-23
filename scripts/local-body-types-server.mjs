import { createServer } from 'node:http';
import { spawnSync } from 'node:child_process';

const fits=new Set(['male','female','neutral']);
const crafts=new Set(['Actor','Actress','Director','Writer','Cinematographer','Other creative']);
const psql=process.env.ARTISTREADY_PSQL_PATH||'C:\\Program Files\\PostgreSQL\\17\\bin\\psql.exe';
const server=createServer((request,response)=>{
 const url=new URL(request.url||'/', 'http://127.0.0.1:5174');
 if(request.method!=='GET'){response.writeHead(405).end();return;}
 if(url.pathname==='/health'){response.writeHead(200,{'Content-Type':'text/plain'}).end('ready');return;}
 if(url.pathname!=='/api/local/body-types'&&url.pathname!=='/api/local/craft-roles'){response.writeHead(404).end();return;}
 const bodyTypes=url.pathname==='/api/local/body-types';
 const fit=url.searchParams.get('fit')||'neutral';
 const craft=url.searchParams.get('craft')||'';
 if(bodyTypes?!fits.has(fit):!crafts.has(craft)){response.writeHead(400).end();return;}
 const query=bodyTypes?`CALL artistready.read_body_types('${fit}',NULL)`:`CALL artistready.read_craft_roles('${craft}',NULL)`;
 const result=spawnSync(psql,['-X','-q','-h','127.0.0.1','-p','5432','-U','postgres','-d','artistready','-v','ON_ERROR_STOP=1','-tA','-c','SET ROLE artistready_api','-c',query],{
  env:process.env,encoding:'utf8',timeout:10000,maxBuffer:1024*1024,
 });
 if(result.error||result.status!==0){response.writeHead(503,{'Content-Type':'application/json','Cache-Control':'no-store'}).end('{"error":"Local catalog is unavailable"}');return;}
 try{
  const rows=JSON.parse(result.stdout.trim());
  if(!Array.isArray(rows))throw new Error('Unexpected catalog result');
  response.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'}).end(JSON.stringify(rows));
 }catch{response.writeHead(503,{'Content-Type':'application/json','Cache-Control':'no-store'}).end('{"error":"Local catalog is unavailable"}');}
});
server.listen(5174,'127.0.0.1');
