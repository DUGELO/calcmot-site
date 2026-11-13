import test from 'node:test';
import assert from 'node:assert/strict';
import {registrableDomain} from '../../scripts/growth/domains.mjs';
test('registrable domains use ICANN, private, wildcard and exception PSL rules',()=>{
 assert.equal(registrableDomain('news.foo.com.br'),'foo.com.br');
 assert.equal(registrableDomain('https://a.b.example.co.uk/path'),'example.co.uk');
 assert.equal(registrableDomain('foo.github.io'),'foo.github.io');
 assert.equal(registrableDomain('bar.github.io'),'bar.github.io');
 assert.equal(registrableDomain('x.www.ck'),'www.ck');
 assert.equal(registrableDomain('a.b.ck'),'a.b.ck');
 assert.equal(registrableDomain('食狮.com.cn'),'xn--85x722f.com.cn');
 assert.equal(registrableDomain('WWW.Example.COM.'),'example.com');
 for(const host of ['co.uk','com.br','github.io','localhost','example.invalidsuffix','127.0.0.1','[::1]','bad..com'])assert.equal(registrableDomain(host),null,host);
});
