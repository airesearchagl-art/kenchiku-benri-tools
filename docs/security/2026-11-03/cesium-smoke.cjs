const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
const stage=process.argv[2]||'after';
const base='https://cesium.com/downloads/cesiumjs/releases/1.146/Build/Cesium/';
const assets=path.resolve(__dirname,'../../..','node_modules/cesium/Build/Cesium');
const output=path.resolve(process.env.CESIUM_EVIDENCE_DIR || process.cwd());
fs.mkdirSync(output,{recursive:true});
const local=process.env.CESIUM_TEST_ORIGIN||'http://127.0.0.1:3102';
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:1280,height:1000},serviceWorkers:'block'});
 const requested=[],served=[],blocked=[],failures=[],errors=[],consoleErrors=[];
 const safe=url=>{const u=new URL(url);return u.origin+u.pathname;};
 const mime=file=>({'.js':'text/javascript','.json':'application/json','.xml':'text/xml','.jpg':'image/jpeg','.png':'image/png','.wasm':'application/wasm','.css':'text/css'}[path.extname(file)]||'application/octet-stream');
 async function serve(route,relative){
  const file=path.resolve(assets,relative);assert(file.startsWith(assets+path.sep));
  if(!fs.existsSync(file)){failures.push({url:safe(route.request().url()),reason:'fixture asset absent'});return route.fulfill({status:404,body:'Missing local asset'});}
  served.push({url:safe(route.request().url()),packagePath:relative.replaceAll('\\','/')});
  return route.fulfill({contentType:mime(file),body:fs.readFileSync(file),headers:{'access-control-allow-origin':'*'}});
 }
 await context.route('**/*',route=>{
  const url=route.request().url(),u=new URL(url);requested.push(safe(url));
  if(url.startsWith(base))return serve(route,decodeURIComponent(u.pathname.slice(new URL(base).pathname.length)));
  if(url.startsWith(local+'/__mock__/world/'))return serve(route,'Assets/Textures/NaturalEarthII/'+u.pathname.slice('/__mock__/world/'.length));
  if(u.hostname==='api.cesium.com')return route.fulfill({contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({type:'IMAGERY',url:local+'/__mock__/world/',accessToken:'synthetic-unused',attributions:[]})});
  if(u.hostname==='assets.cms.plateau.reearth.io')return route.fulfill({contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({asset:{version:'1.0'},geometricError:0,root:{boundingVolume:{region:[-Math.PI,-Math.PI/2,Math.PI,Math.PI/2,0,100]},geometricError:0,refine:'ADD',children:[]}})});
  if(['127.0.0.1','localhost'].includes(u.hostname))return route.continue();
  blocked.push(safe(url));return route.abort('blockedbyclient');
 });
 await context.addInitScript(()=>{
  window.__cesiumWorkers=[];
  const OriginalWorker=window.Worker;
  window.Worker=class extends OriginalWorker {
   constructor(url,options){
    super(url,options);const record={url:String(url).startsWith('blob:')?'blob':String(url),imports:[],baseUrls:[],messages:0,errors:[]};window.__cesiumWorkers.push(record);this.record=record;
    if(String(url).startsWith('blob:'))fetch(url).then(r=>r.text()).then(text=>{record.imports=[...text.matchAll(/import\s+["']([^"']+)["']/g)].map(m=>m[1]);});
    this.addEventListener('message',()=>record.messages++);this.addEventListener('error',e=>record.errors.push(e.message));
   }
   postMessage(message,...args){if(message?.baseUrl)this.record.baseUrls.push(message.baseUrl);return super.postMessage(message,...args);}
  };
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text().replace(/access_token=[^\s&]+/g,'access_token=REDACTED'));});
 page.on('response',r=>{if(r.status()>=400)failures.push({url:safe(r.url()),status:r.status()});});
 let waitResult='not run';
 try{
  assert.equal((await page.goto(local+'/tools/plateau-shadow',{waitUntil:'networkidle'})).status(),200);
  assert.equal(await page.evaluate(()=>typeof window.CESIUM_BASE_URL),'undefined');
  await page.getByRole('button',{name:/3D.*Cesium/}).click();
  try{await page.waitForFunction(()=>window.__cesiumWorkers.some(w=>w.messages>0&&w.baseUrls.length>0),{},{timeout:15000});waitResult='worker response received';}catch(e){waitResult='worker response timeout';}
  const workers=await page.evaluate(()=>window.__cesiumWorkers);
  const canvases=await page.locator('.cesium-widget canvas').count();
  const result={stage,browser:browser.version(),mode:(stage==='webpack-dev'?'Next webpack development':'Next Turbopack production')+' bundle; real installed Cesium 1.146 assets fulfilled locally; synthetic imagery/empty tileset; all other external requests blocked',waitResult,canvases,workers,served,blocked,failures,errors,consoleErrors};
  fs.writeFileSync(path.join(output,`cesium-${stage}.json`),JSON.stringify(result,null,2));
  await page.screenshot({path:path.join(output,`cesium-${stage}.png`),fullPage:true});
  console.log(JSON.stringify({stage,waitResult,canvases,workers,servedCount:served.length,blocked,failures,errors,consoleErrors},null,2));
  if(stage!=='before'){
   assert(canvases>0);assert.equal(waitResult,'worker response received');assert.equal(errors.length,0);assert.equal(failures.length,0);assert.equal(blocked.length,0);
   assert(workers.some(w=>w.imports.some(u=>u.startsWith(base+'Workers/'))&&w.messages>0));
   assert(workers.some(w=>w.baseUrls.includes(base)));
   assert(served.some(x=>x.url.startsWith(base+'Assets/')));
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
