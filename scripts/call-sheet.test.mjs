import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
const require=createRequire(import.meta.url),ts=require('typescript');
function load(file,mocks={}){const exports={};new Function('require','exports',ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(name=>name in mocks?mocks[name]:require(name),exports);return exports;}
const schedule=load('src/lib/call-sheet.ts'),model=load('src/lib/profile-model.ts',{'./call-sheet':schedule});
const validation=load('src/lib/profile-validation.ts',{'./call-sheet':schedule,'./profile-model':model});
const block={id:'dates-1',from:'2026-11-01',to:'2026-11-05',status:'available',notes:''};
const draft={...model.empty,name:'Fixture Artist',role:'Actor',city:'Hyderabad',bodyBuild:'muscular',measurementFit:'male',bio:'Keep this bio',callSheet:{...schedule.emptyCallSheet,dates:[block]}};
assert.equal(validation.profileSchema.safeParse(draft).success,true);
for(const dates of [[{...block,from:'2026-11-10'}],[{...block,from:'2026-99-99'}],[{...block,from:'2026-02-30'}],[block,{...block,id:'dates-2'}]])assert.equal(schedule.callSheetSchema.safeParse({...schedule.emptyCallSheet,dates}).success,false);
assert.equal(schedule.callSheetSchema.safeParse({...schedule.emptyCallSheet,shootingStatus:'shooting',shootFrom:'2026-11-01',shootTo:''}).success,false);
assert.equal(schedule.callSheetSchema.safeParse({...schedule.emptyCallSheet,shootingStatus:'shooting',shootFrom:'2026-11-01',shootTo:'2026-11-06',dates:[block]}).success,false);
const sql=new DatabaseSync(':memory:');sql.exec(readFileSync('drizzle/0000_empty_wild_child.sql','utf8'));
const db={prepare(query){let params=[];return {bind(...args){params=args;return this;},async first(){return sql.prepare(query).get(...params)||null;},async all(){return {results:sql.prepare(query).all(...params)};},async run(){return {meta:{changes:Number(sql.prepare(query).run(...params).changes)}};}};}};
const api=load('src/app/api/profile/[[...path]]/route.ts',{'cloudflare:workers':{env:{DB:db,BUCKET:{}}},'../../../../../lib/profile-runtime':{getProfileRuntime:()=>null},'@/lib/profile-validation':validation,'@/lib/profile-model':model,'@/lib/artist-preferences':{}});
async function request(method,body,subject='schedule-fixture'){return api[method](new Request('https://test.example/api/profile/me',{method,headers:{'oai-authenticated-user-id':subject,origin:'https://test.example','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})}));}
assert.equal((await request('PUT',{draft,version:null})).status,200);
const saved=await (await request('GET')).json();assert.deepEqual(saved.draft.callSheet,draft.callSheet);assert.equal(saved.draft.bio,draft.bio);assert.equal(saved.draft.bodyBuild,'muscular');assert.equal(saved.draft.measurementFit,'male');
assert.equal(validation.profileSchema.safeParse({...draft,bodyBuild:'invalid'}).success,false);
assert.equal(validation.profileSchema.safeParse({...draft,bodyBuild:'self_describe',bodyBuildDescription:''}).success,false);
assert.equal(validation.profileSchema.safeParse({...draft,measurementFit:'female',bodyBuild:'curvy'}).success,true);
assert.equal((await request('PUT',{draft:{...draft,callSheet:{...schedule.emptyCallSheet,dates:[{...block,to:'2025-01-01'}]}},version:1})).status,400);
assert.equal((await request('PUT',{draft:{...draft,callSheet:schedule.emptyCallSheet},version:1})).status,200);
assert.equal((await request('PUT',{draft,version:1})).status,409);
assert.equal((await (await request('GET',null,'different-owner')).json()).draft,null);
assert.equal((await (await request('GET')).json()).draft.bio,'Keep this bio');
sql.close();console.log('Passed schedule validation, invalid dates, overlapping dates, shoot conflicts, API save/reload, clearing, unchanged bio, ownership and stale versions.');
