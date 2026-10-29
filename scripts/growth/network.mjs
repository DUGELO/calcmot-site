import {lookup} from 'node:dns/promises';
import {isIP} from 'node:net';
import https from 'node:https';
import http from 'node:http';
export function publicAddress(ip) {
  if (isIP(ip) === 4) {
    const [a,b] = ip.split('.').map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && [0,2,88,168].includes(b)) || (a === 100 && b >= 64 && b <= 127) || (a === 198 && [18,19,51].includes(b)) || (a === 203 && b === 0));
  }
  // Only global unicast IPv6, excluding documentation and embedded IPv4 ranges.
  return isIP(ip) === 6 && /^[23]/.test(ip) && !/^2001:|^2002:|^3fff:/i.test(ip) && !ip.includes('.');
}
export async function validatePublicUrl(value, resolver = lookup) {
  const u = new URL(value);
  if (!['https:', 'http:'].includes(u.protocol) || u.username || u.password || (u.port && !['80', '443'].includes(u.port))) throw Error('Public HTTP(S) URLs only');
  const hostname = u.hostname.replace(/^\[|\]$/g, '');
  let timer;
  const addresses = isIP(hostname) ? [{address: hostname, family: isIP(hostname)}] : await Promise.race([
    resolver(hostname, {all: true}),
    new Promise((_, reject) => {timer = setTimeout(() => reject(Error('DNS timeout')), 10000);})
  ]).finally(() => clearTimeout(timer));
  if (!addresses.length || addresses.some(a => !publicAddress(a.address))) throw Error('Private or reserved network destination blocked');
  return {url: u, address: addresses[0]};
}
export async function fetchPublic(value, {timeoutMs = 10000, maxBytes = 1024 * 1024, maxRedirects = 4, resolver = lookup} = {}) {
  let current = value;
  for (let hop = 0; hop <= maxRedirects; hop++) {
    const {url, address} = await validatePublicUrl(current, resolver);
    const page = await new Promise((resolve, reject) => {
      // DNS is resolved and checked once, then pinned at connection time to avoid rebinding.
      const req = (url.protocol === 'https:' ? https : http).get(url, {headers: {'user-agent': 'CalcMotGrowthAudit/1.0', accept: 'text/html,text/plain', 'accept-encoding': 'identity'}, lookup: (_host, options, cb) => cb(null, options.all ? [address] : address.address, address.family)}, res => {
        const chunks = []; let size = 0;
        res.on('data', chunk => {size += chunk.length; if (size > maxBytes) {res.destroy(Error('Response size limit exceeded'));} else chunks.push(chunk);});
        res.on('error', reject);
        res.on('end', () => resolve({status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString('utf8'), url: url.href}));
      });
      const timer = setTimeout(() => req.destroy(Error('Request timeout')), timeoutMs);
      req.on('close', () => clearTimeout(timer)); req.on('error', reject);
    });
    if ([301,302,303,307,308].includes(page.status)) {
      if (!page.headers.location || hop === maxRedirects) throw Error('Redirect limit or missing location');
      current = new URL(page.headers.location, current).href; continue;
    }
    return page;
  }
}
