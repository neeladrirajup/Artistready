import test from 'node:test';
import assert from 'node:assert/strict';
// This suite targets only the disposable loopback preview database.
const base='http://127.0.0.1:8787';
const owner='database-test-'+crypto.randomUUID(),other='database-test-'+crypto.randomUUID();
async function call(path,method='GET',body,identity=owner,extra={}){
 const headers={'oai-authenticated-user-id':identity,Origin:base,...extra};
 if(identity===null)delete headers['oai-authenticated-user-id'];
 if(body&&!(body instanceof Uint8Array)){headers['Content-Type']='application/json';body=JSON.stringify(body);}
 let response=await fetch(base+'/api/profile/'+path,{method,headers,body});if(response.status===503){const retryText=await response.clone().text();if(retryText.includes('worker restarted mid-request'))response=await fetch(base+'/api/profile/'+path,{method,headers,body});}
 const value=await response.text();let parsed;try{parsed=JSON.parse(value);}catch{parsed={error:value};}return {status:response.status,body:parsed};
}
test('account identity, validation, optimistic saves, isolation and media',async()=>{
 assert.equal((await call('me','GET',undefined,null)).status,401);
 assert.equal((await call('me','PUT',{},owner,{Origin:'https://other.example'})).status,403);
 assert.equal((await call('me','PUT',{draft:{name:'',role:'Actor',city:'Hyderabad'},version:null})).status,400);
 const input={name:'Isolated QA artist',role:'Actor',city:'Hyderabad',bio:'Original',bookingEmail:'private@example.test',showBookingContact:false};
 const created=await call('me','PUT',{draft:input,version:null});assert.equal(created.status,200);assert.equal(created.body.version,1);
 assert.equal((await call('me','PUT',{draft:input,version:null})).status,409);
 assert.equal((await call('me','GET')).body.draft.bio,'Original');
 const updated=await call('me','PUT',{draft:{...input,bio:'Updated'},version:1});assert.equal(updated.body.version,2);
 assert.equal((await call('me','PUT',{draft:input,version:1})).status,409);
 assert.equal((await call('me','GET')).body.draft.bio,'Updated');
 assert.equal((await call('me','GET',undefined,other)).body.draft,null);
 const listing=(await call('artists','GET',undefined,other)).body.profiles.find(p=>p.id===created.body.id);
 assert.equal(listing.draft.bookingEmail,'');assert.equal(listing.isOwner,false);
 const bytes=Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZRkAAAAASUVORK5CYII=','base64'));
 const upload=await call('media/test-photo','PUT',bytes,owner,{'Content-Type':'image/png','X-File-Name':'test.png'});assert.equal(upload.status,200);
 const repeat=await call('media/test-photo','PUT',bytes,owner,{'Content-Type':'image/png'});assert.equal(repeat.status,200);
 assert.equal((await call('me')).body.media.length,1);
 assert.equal((await call('media/bad-photo','PUT',new Uint8Array([1,2,3]),owner,{'Content-Type':'image/png'})).status,400);
 const file=await fetch(base+upload.body.url,{headers:{'oai-authenticated-user-id':owner}});assert.equal(file.status,200);assert.equal(file.headers.get('content-type'),'image/png');assert.equal((await file.arrayBuffer()).byteLength,bytes.length);
 const removed=await call('media/test-photo','DELETE');assert.equal(removed.status,200);assert.equal((await call('me')).body.media.length,0);
});



