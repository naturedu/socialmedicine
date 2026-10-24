import test from 'node:test';import assert from 'node:assert/strict';
import {filterNsfc,nsfcCsv} from '../nsfc-health-core.mjs';
test('health lookup filters public text and export cannot include private identifiers',()=>{
 const rows=[{date:'2025',title:'医保支付改革',organization:'甲校',project_type:'面上',topics:['医保'],keywords:['支付改革'],economics_policy:true,principal:'PRIVATE_PERSON',project_code:'PRIVATE_CODE'},{date:'2024',title:'老龄照护',organization:'乙校',topics:['养老'],keywords:[],economics_policy:false}];
 assert.equal(filterNsfc(rows,{economic:'yes'}).length,1);assert.equal(filterNsfc(rows,{query:'甲校 医保',year:'2025'}).length,1);assert.equal(filterNsfc(rows,{query:'PRIVATE_PERSON'}).length,0);
 assert.doesNotMatch(nsfcCsv(rows),/PRIVATE|principal|project_code/);assert.match(nsfcCsv([{title:'=1+1'}]),/'=1\+1/);
});
