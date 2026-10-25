import { PDFDocument, PDFDict, PDFArray, PDFName, PDFNumber } from 'pdf-lib';

export const MAX_PDF_BYTES = 4 * 1024 * 1024;
export const MAX_PDF_PAGES = 8;

// Parse structure without rendering, executing actions or fetching external resources.
// This is a format gate, not a malware scanner. Compressed object streams are
// deliberately unsupported: do not inflate an untrusted object-stream bomb.
export async function inspectPdf(bytes) {
  if (bytes.length < 16 || bytes.length > MAX_PDF_BYTES ||
      ![37,80,68,70,45].every((b,i)=>bytes[i]===b)) throw Error('INVALID_PDF');
  const text = new TextDecoder('latin1').decode(bytes);
  if (!/%%EOF\s*$/.test(text)) throw Error('INVALID_PDF');
  const names = [...text.matchAll(/\/([^\s\[\]()<>/%]+)/g)].map(m=>
    m[1].replace(/#([0-9a-f]{2})/gi,(_,h)=>String.fromCharCode(parseInt(h,16))));
  if (names.includes('ObjStm')) throw Error('PDF_FORMAT_UNSUPPORTED');
  const forbidden = new Set(['Encrypt','JS','JavaScript','Launch','EmbeddedFiles','EmbeddedFile','RichMedia','OpenAction','AA','XFA','SubmitForm','ImportData']);
  if (names.some(n=>forbidden.has(n))) throw Error('UNSAFE_PDF');
  let doc;
  try { doc = await PDFDocument.load(bytes,{ignoreEncryption:false,throwOnInvalidObject:true,updateMetadata:false}); }
  catch { throw Error('INVALID_PDF'); }
  const seen = new Set();
  const visit = (value, depth=0) => {
    if (seen.has(value)) return;
    seen.add(value);
    if (depth>40 || seen.size>20000) throw Error('PDF_FORMAT_UNSUPPORTED');
    if (value instanceof PDFDict) {
      for (const [key,child] of value.entries()) {
        if (forbidden.has(key.decodeText())) throw Error('UNSAFE_PDF');
        visit(child,depth+1);
      }
    } else if (value instanceof PDFArray) for (const child of value.asArray()) visit(child,depth+1);
  };
  for (const [,object] of doc.context.enumerateIndirectObjects()) visit(object);
  // Do not recurse through an attacker-controlled page tree in getPages().
  const walk=(ref,ancestors=new Set())=>{
    const node=doc.context.lookup(ref);
    if(!(node instanceof PDFDict)||ancestors.has(node)||ancestors.size>20)throw Error('INVALID_PDF');
    const path=new Set(ancestors);path.add(node);
    const type=node.get(PDFName.of('Type'))?.decodeText?.();
    if(type==='Page')return 1;
    if(type!=='Pages')throw Error('INVALID_PDF');
    const kids=doc.context.lookup(node.get(PDFName.of('Kids')));
    if(!(kids instanceof PDFArray)||kids.size()>MAX_PDF_PAGES)throw Error('PDF_PAGE_LIMIT');
    let total=0;
    for(const child of kids.asArray()){total+=walk(child,path);if(total>MAX_PDF_PAGES)throw Error('PDF_PAGE_LIMIT');}
    const count=node.get(PDFName.of('Count'));
    if(!(count instanceof PDFNumber)||count.asNumber()!==total)throw Error('INVALID_PDF');
    return total;
  };
  if(!(doc.catalog instanceof PDFDict))throw Error('INVALID_PDF');
  const pages=walk(doc.catalog.get(PDFName.of('Pages')));
  if (pages<1 || pages>MAX_PDF_PAGES) throw Error('PDF_PAGE_LIMIT');
  return {pages};
}
