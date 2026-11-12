import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { parseCsv } from './csv.mjs';

export function date(value) {
 const s=String(value??'').trim();
 if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||Number.isNaN(Date.parse(s))||new Date(s).toISOString().slice(0,10)!==s) throw Error(`Expected a real YYYY-MM-DD date: ${s}`);
 return s;
}
export function integer(value,min=0) {const s=String(value);if(!/^\d+$/.test(s)||!Number.isSafeInteger(Number(s))||Number(s)<min||Number(s)>2147483647)throw Error(`Expected integer >= ${min}: ${s}`);return Number(s);}
export function coordinate(value,min,max) {if(value===''||value==null)return null; const n=Number(value);if(!Number.isFinite(n)||n<min||n>max)throw Error(`Coordinate must be ${min} to ${max}`);return n;}
export function boolean(value) {if(['true','yes','1'].includes(String(value).toLowerCase()))return true;if(['false','no','0',''].includes(String(value??'').toLowerCase()))return false;throw Error(`Expected yes or no: ${value}`);}
const required=(v,k)=>{if(v==null||String(v).trim()==='')throw Error(`Missing ${k}`);return String(v).trim();};
export function surveyFields(o) {
 const latitude=coordinate(o.latitude,-90,90),longitude=coordinate(o.longitude,-180,180);
 if((latitude===null)!==(longitude===null))throw Error('Both coordinates are required together');
 const from=o.permit_from?date(o.permit_from):null,until=o.permit_until?date(o.permit_until):null;
 if(from&&until&&from>until)throw Error('Permit dates are reversed');
 return {code:required(o.code,'code'),site:required(o.site,'site'),surveyed_on:date(o.surveyed_on),observer:required(o.observer,'observer'),method:required(o.method,'method'),latitude,longitude,effort_minutes:o.effort_minutes===''||o.effort_minutes==null?null:integer(o.effort_minutes,1),evidence_ref:o.evidence_ref||'',permit_required:boolean(o.permit_required),permit_ref:o.permit_ref||'',permit_from:from,permit_until:until,permit_scope:o.permit_scope||'',applicability_basis:o.applicability_basis||'',review_due:date(o.review_due),source_fields:o.source_fields||{}};
}
export async function readExport(file,mapping) {
 const bytes=fs.readFileSync(file);if(bytes.length>25*1024*1024)throw Error('Import file exceeds 25 MB');
 let raw;
 if(path.extname(file).toLowerCase()==='.csv')raw=parseCsv(bytes.toString('utf8').replace(/^\uFEFF/,''));
 else if(path.extname(file).toLowerCase()==='.xlsx') {
  const {default:ExcelJS}=await import('exceljs');const book=new ExcelJS.Workbook();await book.xlsx.load(bytes);
  const sheet=book.getWorksheet(mapping.sheet);if(!sheet)throw Error('Mapping must name an existing worksheet');
  const headerRow=integer(mapping.header_row||1,1);
  const cell=(c)=>{if(c.type===6||c.value?.formula||c.value?.sharedFormula)throw Error('Formula cells require a values-only export');if(c.value instanceof Date)return c.value.toISOString().slice(0,10);return c.text;};
  if(sheet.rowCount>10000)throw Error('Split exports into batches of at most 10000 rows');
  const headers=Array.from({length:sheet.getRow(headerRow).cellCount},(_,i)=>cell(sheet.getRow(headerRow).getCell(i+1)).trim());
  if(!headers.length||headers.some(h=>!h)||new Set(headers).size!==headers.length)throw Error('Worksheet headers must be unique and nonempty');
  raw=[];for(let n=headerRow+1;n<=sheet.rowCount;n++){const row=sheet.getRow(n);if(!row.hasValues)continue;if(row.cellCount>headers.length)throw Error(`Row ${n} has data beyond named columns`);raw.push(Object.fromEntries(headers.map((h,i)=>[h,cell(row.getCell(i+1))])));}
 } else throw Error('Use a Wildnote Pivot Report XLSX or values-only CSV');
 if(!raw.length)throw Error('Export has no survey rows');
 const allowed=new Set(['code','site','surveyed_on','observer','method','latitude','longitude','effort_minutes','evidence_ref','permit_required','permit_ref','permit_from','permit_until','permit_scope','applicability_basis','review_due']);
 if(!mapping.columns||Object.keys(mapping.columns).some(k=>!allowed.has(k)))throw Error('Mapping contains unsupported fields');
 for(const k of ['code','site','surveyed_on','observer','method','review_due'])if(!mapping.columns[k]&&mapping.defaults?.[k]==null)throw Error(`Mapping missing ${k}`);
 const rows=raw.map((r,i)=>{const o={...mapping.defaults};for(const [key,col] of Object.entries(mapping.columns)){if(!(col in r))throw Error(`Missing source column ${col} at row ${i+1}`);o[key]=r[col];}return surveyFields({...o,source_fields:r});});
 if(new Set(rows.map(r=>r.code.toLowerCase())).size!==rows.length)throw Error('Duplicate survey codes in export; combine repeated answer rows before import');
 return {rows,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),source_base64:bytes.toString('base64')};
}
