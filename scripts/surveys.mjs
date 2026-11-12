import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { getDb,REPO_ROOT } from './lib/db.mjs';
import { readExport,surveyFields,date,integer,boolean } from './lib/wildnote.mjs';
import { page,table,writeOut } from './lib/render.mjs';

export const reads={
 projects:'select code,name,owner,jurisdiction,client,review_due from projects order by code',
 surveys:'select code,project,site,surveyed_on,observer,reviewed,revision,observation_count,open_actions from survey_register order by code',
 'review-queue':'select * from review_queue order by review_due,code',
 'evidence-gaps':"select code,rule,finding from record_checks where rule in ('EVIDENCE','OBSERVATION-EVIDENCE','LOCATION','EFFORT') order by code,rule",
 'permit-check':"select code,rule,finding from record_checks where rule in ('PERMISSION','APPLICABILITY') order by code,rule",
 'species-register':'select * from species_register order by project,scientific_name',
 'provisional-identifications':"select o.code,s.code survey,o.scientific_name,o.count from observations o join surveys s on s.id=o.survey_id where identification='provisional' order by o.code",
 'actions-due':'select * from actions_due order by due_on,code',
 'owner-workload':'select owner,count(*)::int open_actions,count(*) filter(where due_on<current_date)::int overdue_actions from actions_due group by owner order by owner',
 'stale-surveys':'select code,project,site,surveyed_on,review_due from survey_register where not reviewed and surveyed_on<current_date-30 order by surveyed_on',
 'sensitive-records':'select o.code,s.code survey,p.code project,o.scientific_name,o.identification from observations o join surveys s on s.id=o.survey_id join projects p on p.id=s.project_id where o.sensitive order by o.code',
 'survey-effort':'select project,method,count(*)::int surveys,count(effort_minutes)::int with_effort,sum(effort_minutes)::int effort_minutes from survey_register group by project,method order by project,method',
 'review-history':'select s.code survey,r.revision,s.revision current_revision,r.reviewer,r.evidence,r.created_at from reviews r join surveys s on s.id=r.survey_id order by r.created_at',
 compliance:'select code,rule,finding from record_checks order by code,rule',
 attention:"select code,'review overdue' issue,review_due due_on from survey_register where not reviewed and review_due<current_date union all select code,description,due_on from actions_due where due_on<current_date order by due_on,code",
 notes:'select s.code survey,n.actor,n.body,n.created_at from notes n join surveys s on s.id=n.survey_id order by n.created_at',
 audit:'select entity,entity_id,operation,actor,created_at from audit_log order by created_at,id',
 imports:'select filename,sha256,row_count,actor,created_at from import_batches order by created_at'
};
const entities=new Set(['projects','surveys','observations','actions']);
export async function resolve(db,entity,ref) {
 if(!entities.has(entity))throw Error('Unsupported entity');if(!ref)throw Error(`Missing ${entity} reference`);
 const label=entity==='projects'?'name':entity==='surveys'?'site':entity==='observations'?'scientific_name':'description';
 const rows=await db.query(`select id,code,${label} name from ${entity} order by code`);
 const s=String(ref).toLowerCase();let found=rows.filter(r=>r.id===s||r.code.toLowerCase()===s);
 if(!found.length)found=rows.filter(r=>r.id.startsWith(s)||r.code.toLowerCase().startsWith(s)||r.name.toLowerCase()===s);
 if(found.length!==1)throw Error(`${found.length?'Ambiguous':'Unknown'} ${entity} reference '${ref}'. Candidates: ${(found.length?found:rows).map(r=>r.code+' ('+r.name+')').join(', ')}`);
 return found[0].id;
}
const req=(o,k)=>{if(o[k]==null||String(o[k]).trim()==='')throw Error(`Missing --${k}`);return String(o[k]).trim();};
const row=async(db,entity,ref)=>(await db.query(`select * from ${entity} where id=$1`,[await resolve(db,entity,ref)]))[0];
async function insert(db,entity,o) {const keys=Object.keys(o);return db.query(`insert into ${entity} (${keys.join(',')}) values (${keys.map((_,i)=>'$'+(i+1)).join(',')}) returning *`,Object.values(o));}
export const writes=['add-project','add-survey','revise-survey','add-observation','revise-observation','add-action','complete-action','review-survey','log','import'];
const flags={
 'add-project':'code name owner jurisdiction client review-due actor',
 'add-survey':'project code site surveyed-on observer method latitude longitude effort-minutes evidence-ref permit-required permit-ref permit-from permit-until permit-scope applicability-basis review-due actor',
 'revise-survey':'survey reason code site surveyed-on observer method latitude longitude effort-minutes evidence-ref permit-required permit-ref permit-from permit-until permit-scope applicability-basis review-due actor',
 'add-observation':'survey code species count identification sensitive evidence actor',
 'revise-observation':'observation reason species count identification sensitive evidence actor',
 'add-action':'survey code description owner due actor', 'complete-action':'action evidence actor',
 'review-survey':'survey evidence actor',log:'survey body actor',import:'project file mapping dry-run actor',export:'out'
};
export async function run(db,args) {
 const positional=[],o={};for(const a of args){if(a.startsWith('--')){const i=a.indexOf('=');o[a.slice(2,i<0?undefined:i)]=i<0?true:a.slice(i+1);}else positional.push(a);}
 const [cmd='help',ref]=positional;
 const allowed=new Set(['json',...(flags[cmd]||'').split(' ')]);for(const k of Object.keys(o))if(!allowed.has(k))throw Error(`Unknown flag --${k} for ${cmd}`);
 for(const [k,v] of Object.entries(o))if(v===true&&!['json','dry-run'].includes(k))throw Error(`--${k} requires a value with =`);
 if(cmd==='help')return [{commands:[...Object.keys(reads),'project','survey',...writes,'export','weekly-review','draft-survey','draft-field-return'].join(', ')}];
 if(reads[cmd])return db.query(reads[cmd]);
 if(cmd==='project'){const p=await row(db,'projects',ref);return [{...p,surveys:await db.query('select * from survey_register where project_id=$1 order by code',[p.id])}];}
 if(cmd==='survey'){const s=await row(db,'surveys',ref);const children={};for(const t of ['observations','actions','reviews','notes'])children[t]=await db.query(`select * from ${t} where survey_id=$1 order by created_at,id`,[s.id]);return [{...s,...children,checks:await db.query('select * from record_checks where survey_id=$1',[s.id])}];}
 if(cmd==='export'){
  const out=path.resolve(req(o,'out'));if(fs.existsSync(out))throw Error('Export directory already exists');
  const all={};await db.exec('BEGIN READ ONLY');try{for(const t of ['projects','surveys','observations','actions','reviews','notes','import_batches','audit_log'])all[t]=await db.query(`select * from ${t} order by created_at,id`);}finally{await db.exec('ROLLBACK');}
  fs.mkdirSync(out,{recursive:true,mode:0o700});for(const [t,rows] of Object.entries(all))fs.writeFileSync(path.join(out,t+'.json'),JSON.stringify(rows,null,2)+'\n',{mode:0o600});return [{directory:out,collections:Object.keys(all).length}];
 }
 if(['weekly-review','draft-survey','draft-field-return'].includes(cmd)){
  let sections=[];if(cmd==='weekly-review'){for(const c of ['review-queue','compliance','actions-due'])sections.push({title:c,html:table(await run(db,[c]))});}
  else {const [s]=await run(db,['survey',ref]);sections=[{title:'Survey',html:table([{code:s.code,site:s.site,surveyed_on:s.surveyed_on,observer:s.observer,method:s.method,revision:s.revision}])},{title:'Recorded observations',html:table(s.observations,['code','scientific_name','count','identification','sensitive','evidence_ref'])},{title:'Checks to resolve',html:table(s.checks,['rule','finding'])},{title:'Follow-up work',html:table(s.actions,['code','description','owner','due_on','completion_evidence'])}];}
  return [{file:writeOut('drafts',`${cmd}-${Date.now()}`,page({title:'Draft '+cmd.replaceAll('-',' '),subtitle:'Internal working paper. Ecologist review required. Sensitive location records must remain private.',sections}))}];
 }
 if(!writes.includes(cmd))throw Error(`Unknown command ${cmd}`);
 const actor=req(o,'actor');await db.exec('BEGIN');
 try {
  await db.query("select set_config('app.actor',$1,true)",[actor]);let result;
  if(cmd==='add-project')result=await insert(db,'projects',{code:req(o,'code'),name:req(o,'name'),owner:req(o,'owner'),jurisdiction:o.jurisdiction||'NZ',client:o.client||'',review_due:o['review-due']?date(o['review-due']):null});
  if(cmd==='add-survey'||cmd==='revise-survey'){
   const existing=cmd==='revise-survey'?await row(db,'surveys',req(o,'survey')):null;
   if(existing)req(o,'reason');const input={...existing};for(const k of ['code','site','surveyed_on','observer','method','latitude','longitude','effort_minutes','evidence_ref','permit_required','permit_ref','permit_from','permit_until','permit_scope','applicability_basis','review_due'])if(o[k.replaceAll('_','-')]!==undefined)input[k]=o[k.replaceAll('_','-')];
   const data=surveyFields(input);
   if(existing){if(data.code!==existing.code)throw Error('Survey code is immutable');const keys=Object.keys(data);result=await db.query(`update surveys set ${keys.map((k,i)=>k+'=$'+(i+1)).join(',')} where id=$${keys.length+1} returning *`,[...Object.values(data),existing.id]);await insert(db,'notes',{survey_id:existing.id,actor,body:'Revision reason: '+o.reason});}
   else result=await insert(db,'surveys',{project_id:await resolve(db,'projects',req(o,'project')),...data});
  }
  if(cmd==='add-observation'||cmd==='revise-observation'){
   const old=cmd==='revise-observation'?await row(db,'observations',req(o,'observation')):null;
   if(old)req(o,'reason');const identification=o.identification||old?.identification||'provisional';if(!['provisional','confirmed'].includes(identification))throw Error('Identification must be provisional or confirmed');
   const data={scientific_name:o.species===undefined?(old?.scientific_name||req(o,'species')):req(o,'species'),count:o.count===undefined?(old?.count??integer(req(o,'count'))):integer(o.count),identification,sensitive:o.sensitive===undefined?(old?.sensitive||false):boolean(o.sensitive),evidence_ref:o.evidence??old?.evidence_ref??''};
   if(old){const keys=Object.keys(data);result=await db.query(`update observations set ${keys.map((k,i)=>k+'=$'+(i+1)).join(',')} where id=$${keys.length+1} returning *`,[...Object.values(data),old.id]);await insert(db,'notes',{survey_id:old.survey_id,actor,body:'Observation revision: '+o.reason});}
   else result=await insert(db,'observations',{survey_id:await resolve(db,'surveys',req(o,'survey')),code:req(o,'code'),...data});
  }
  if(cmd==='add-action')result=await insert(db,'actions',{survey_id:await resolve(db,'surveys',req(o,'survey')),code:req(o,'code'),description:req(o,'description'),owner:req(o,'owner'),due_on:date(req(o,'due'))});
  if(cmd==='complete-action'){const a=await row(db,'actions',req(o,'action'));if(a.completed_at)throw Error('Action already completed');result=await db.query('update actions set completed_at=now(),completion_evidence=$1 where id=$2 returning *',[req(o,'evidence'),a.id]);}
  if(cmd==='review-survey'){
   const id=await resolve(db,'surveys',req(o,'survey'));const [s]=await db.query('select * from surveys where id=$1 for update',[id]);
   if(s.observer.trim().toLowerCase()===actor.toLowerCase())throw Error('Reviewer must differ from field observer');
   const checks=await db.query('select * from record_checks where survey_id=$1',[id]);if(checks.length)throw Error('Resolve checks before review: '+checks.map(c=>c.rule).join(', '));
   if((await db.query('select id from actions where survey_id=$1 and completed_at is null',[id])).length)throw Error('Resolve open actions before review');
   result=await insert(db,'reviews',{survey_id:id,revision:s.revision,reviewer:actor,evidence:req(o,'evidence')});
  }
  if(cmd==='log')result=await insert(db,'notes',{survey_id:await resolve(db,'surveys',req(o,'survey')),actor,body:req(o,'body')});
  if(cmd==='import'){
   if(ref!=='wildnote')throw Error('Use import wildnote');const project=await resolve(db,'projects',req(o,'project'));
   const mapping=JSON.parse(fs.readFileSync(req(o,'mapping'),'utf8'));const parsed=await readExport(req(o,'file'),mapping);
   const prior=await db.query('select * from import_batches where project_id=$1 and sha256=$2',[project,parsed.sha256]);
   if(prior.length){
    // jsonb normalises key ordering; compare recursively rather than byte ordering.
    const stable=v=>v&&typeof v==='object'?JSON.stringify(Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])]))):JSON.stringify(v);
    if(stable(prior[0].mapping)!==stable(mapping))throw Error('Same source has changed mapping');
    result=[{imported:0,skipped:true,sha256:parsed.sha256}];}
   else {for(const s of parsed.rows)if((await db.query('select code from surveys where lower(code)=lower($1)',[s.code])).length)throw Error(`Survey ${s.code} already exists; import never overwrites records`);
    if(o['dry-run'])result=[{imported:parsed.rows.length,dry_run:true,sha256:parsed.sha256}];
    else {const [batch]=await insert(db,'import_batches',{project_id:project,sha256:parsed.sha256,filename:path.basename(o.file),source_base64:parsed.source_base64,mapping,actor,row_count:parsed.rows.length});for(const s of parsed.rows)await insert(db,'surveys',{project_id:project,...s,import_id:batch.id});result=[{imported:parsed.rows.length,sha256:parsed.sha256}];}
   }
  }
  await db.exec(o['dry-run']?'ROLLBACK':'COMMIT');return result;
 }catch(error){await db.exec('ROLLBACK');throw error;}
}
export function format(rows) {if(!rows.length)return 'No records.';const keys=Object.keys(rows[0]);const string=v=>v==null?'':typeof v==='object'?JSON.stringify(v):String(v);const cells=rows.map(r=>keys.map(k=>string(r[k]).slice(0,70)));const widths=keys.map((k,i)=>Math.max(k.length,...cells.map(r=>r[i].length)));return [keys.map((k,i)=>k.padEnd(widths[i])).join(' | '),widths.map(n=>'-'.repeat(n)).join('-+-'),...cells.map(r=>r.map((v,i)=>v.padEnd(widths[i])).join(' | '))].join('\n');}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){let db;try{db=await getDb();const rows=await run(db,process.argv.slice(2));console.log(process.argv.includes('--json')?JSON.stringify(rows,null,2):format(rows));}catch(e){console.error(e.message);process.exitCode=1;}finally{await db?.close();}}
