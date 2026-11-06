import fs from 'node:fs';
import {domainToASCII} from 'node:url';
import {isIP} from 'node:net';
const text = fs.readFileSync(new URL('../../docs/growth/data/public_suffix_list.dat', import.meta.url), 'utf8');
if (text.length > 1000000 || !text.includes('BEGIN ICANN DOMAINS') || !text.includes('BEGIN PRIVATE DOMAINS')) throw Error('Invalid public suffix snapshot');
const exact=new Set(), wildcard=new Set(), exceptions=new Set();
for (let rule of text.split(/\r?\n/)) {
 rule=rule.trim(); if(!rule||rule.startsWith('//'))continue;
 const target=rule.startsWith('!')?exceptions:rule.startsWith('*.')?wildcard:exact;
 rule=rule.replace(/^!|^\*\./,''); const ascii=domainToASCII(rule).toLowerCase(); if(ascii)target.add(ascii);
}
if(exact.size<1000)throw Error('Incomplete public suffix snapshot');
export function hostname(value) {
 try {
  const raw=String(value); const host=(raw.includes('://')?new URL(raw).hostname:raw).replace(/\.$/,'').toLowerCase();
  const ascii=domainToASCII(host);
  if(!ascii||isIP(ascii.replace(/^\[|\]$/g,''))||ascii.length>253||ascii.split('.').some(x=>!x||x.length>63||!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(x)))return null;
  return ascii;
 } catch{return null;}
}
export function registrableDomain(value) {
 const host=hostname(value); if(!host)return null;
 const labels=host.split('.'); let suffix=0,exception=0;
 for(let i=0;i<labels.length;i++){
  const tail=labels.slice(i).join('.'); const count=labels.length-i;
  if(exceptions.has(tail))exception=Math.max(exception,count-1);
  if(exact.has(tail))suffix=Math.max(suffix,count);
  if(i>0&&wildcard.has(tail))suffix=Math.max(suffix,count+1);
 }
 suffix=exception||suffix;
 if(!suffix||labels.length<=suffix)return null;
 return labels.slice(-(suffix+1)).join('.');
}
