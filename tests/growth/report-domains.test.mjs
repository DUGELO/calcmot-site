import test from 'node:test';
import assert from 'node:assert/strict';
import {report} from '../../scripts/growth/report.mjs';
const now=new Date().toISOString();
const target=(id,url)=>({id,name:id,submitUrl:url,stage:'published',submissionStatus:'published',publishedUrl:url,verification:{outcome:'present',linkFound:true,httpStatus:200,checkedAt:now,referringDomain:new URL(url).hostname,finalUrl:url,noindex:false},lastAttempt:{outcome:'present',checkedAt:now}});
test('report deduplicates pages and registrable domains including private PSL tenants',()=>{
 const ts=[target('a','https://news.example.com.br/a'),target('b','https://blog.example.com.br/b'),target('c','https://alice.github.io/a'),target('d','https://bob.github.io/a'),target('e','https://news.example.com.br/a#extra'),target('own','https://calcmot.com.br/'),target('sub','https://blog.calcmot.com.br/post')];
 const r=report({targets:ts});assert.equal(r.verifiedLinks,4);assert.equal(r.referringDomains,3);assert.equal(r.currentVerifiedLinks,4);
});
test('temporary error preserves historic proof without current reconfirmation or confirmed loss',()=>{
 const t=target('a','https://indexflow.tech/directory');t.lastAttempt={outcome:'temporary_error',error:'HTTP 402',checkedAt:now};
 const r=report({targets:[t]});assert.equal(r.lastKnownVerifiedLinks,1);assert.equal(r.currentVerifiedLinks,0);assert.equal(r.unknownCurrentLinks,1);assert.equal(r.lostLinks,0);assert.equal(r.actualIndexation,null);
 t.lastAttempt={outcome:'present',checkedAt:'2026-01-01T00:00:00Z'};t.verification.checkedAt=t.lastAttempt.checkedAt;
 assert.equal(report({targets:[t]}).currentVerifiedLinks,0);
});
