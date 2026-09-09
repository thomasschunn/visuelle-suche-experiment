const test = require('node:test'), assert = require('node:assert/strict'), vm = require('node:vm'), fs = require('node:fs');
function setup() {
 const nodes = {}, requests = [];
 const context = vm.createContext({ YES_NO_CODES:{yes:1,no:2}, VERDICT_CODES:{pass:1,reject:2}, dateiName:'unique.csv', OSF_EXPERIMENT_ID:'existing',
 document:{body:{innerHTML:''}, getElementById:id => nodes[id] ||= {}},
 fetch:async (url, options) => { requests.push({url,options}); return {ok:false}; }
 });
 vm.runInContext(fs.readFileSync('storage.js','utf8'),context);
 return {context,nodes,requests};
}
test('export validates every scale boundary and Yes/No; text and named selections survive CSV',()=>{
 const {context:c}=setup();
 for(let value=1;value<=7;value++) {
  const rows=c.prepareExportRows([{pre_ownership_1:value,ai_attitude_6:value,defect_pattern_noticed:1,ai_error_pattern_noticed:2,defect_pattern_text:'a,"b"\nline',standard_change_options:'["name"]',response:0}]);
  assert.equal(rows[0].pre_ownership_1,value); assert.equal(rows[0].standard_change_name_selected,true);
  assert.equal(rows[0].response,undefined);
  assert.match(c.analysisCsv(rows), /a,""b""\nline/);
 }
 for(const value of [0,8,-1,'1']) assert.throws(()=>c.prepareExportRows([{post_trust_1:value}]), /Invalid Likert/);
 for(const value of [0,3,'1']) assert.throws(()=>c.prepareExportRows([{defect_pattern_noticed:value}]), /Invalid Yes/);
});
test('failed upload retains identical CSV for retry; success only after confirmation',async()=>{
 const s=setup(); const psych={data:{get:()=>({values:()=>[{post_trust_1:7}]})}};
 s.context.showSubmission(psych,false); await new Promise(resolve=>setImmediate(resolve));
 assert.equal(s.requests.length,1); assert.equal(s.nodes['save-retry'].disabled,false);
 assert.match(s.nodes['save-status'].textContent,/could not be confirmed/);
 s.context.fetch=async(url,options)=>{s.requests.push({url,options}); return {ok:true,json:async()=>({message:'Success'})};};
 await s.nodes['save-retry'].onclick();
 assert.equal(s.requests[0].options.body,s.requests[1].options.body);
 assert.match(s.nodes['save-status'].textContent,/Data saved/);
 assert.equal(typeof s.nodes['save-download'].onclick,'function');
});
test('debug and invalid coding never upload and retain download',()=>{
 for(const [debug,row] of [[true,{pre_trust_1:1}],[false,{pre_trust_1:0}]]) {
  const s=setup(); s.context.showSubmission({data:{get:()=>({values:()=>[row]})}},debug);
  assert.equal(s.requests.length,0); assert.equal(s.nodes['save-retry'].hidden,true);
  assert.equal(typeof s.nodes['save-download'].onclick,'function');
 }
});

test('HTTP success with an error or malformed receipt never claims saved', async()=>{
 for (const receipt of [{error:'failure',message:'Success'}, {success:true}, {}, null]) {
  const s=setup();
  s.context.fetch=async()=>({ok:true,json:async()=>receipt});
  s.context.showSubmission({data:{get:()=>({values:()=>[{pre_trust_1:1}]})}},false);
  await new Promise(resolve=>setImmediate(resolve));
  assert.match(s.nodes['save-status'].textContent,/could not be confirmed/);
  assert.equal(s.nodes['save-retry'].disabled,false);
 }
});

test('local download preserves CSV contents, filename and text without a network request', async()=>{
 const s=setup(); let blob, filename, clicked=false, revoked=false;
 s.context.Blob=Blob;
 s.context.URL={createObjectURL(value){blob=value;return 'blob:test';},revokeObjectURL(){revoked=true;}};
 s.context.document.createElement=()=>({click(){clicked=true;filename=this.download;},remove(){}});
 s.context.document.body.appendChild=()=>{};
 s.context.showSubmission({data:{get:()=>({values:()=>[{pre_trust_1:7,defect_pattern_noticed:2,ai_error_pattern_noticed:1,ai_error_pattern_text:'quote " and\nnewline'}]})}},true);
 s.nodes['save-download'].onclick();
 assert.equal(filename,'unique.csv'); assert.ok(clicked && revoked);
 assert.equal(s.requests.length,0);
 const csv=await blob.text();
 assert.match(csv,/"7","2","1","quote "" and\nnewline"/);
 assert.ok(!csv.includes('"0"'));
});
