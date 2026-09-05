// Read-only layout smoke test: synthetic sessions/data, no backend requests.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'test-results/responsive');
const profile = { id: 'ui-test', full_name: 'Test Student', college: 'Delhi College', instagram_username: 'test', unimatch_profile_complete: true, is_verified: true, interests: ['Music', 'Reading'], role: 'student' };
const sdk = `window.supabase={createClient(){const profile=${JSON.stringify(profile)};const query=new Proxy(function(){},{get(_,key){if(key==='then')return resolve=>resolve({data:[],error:null,count:0});if(key==='single'||key==='maybeSingle')return async()=>({data:profile,error:null});return ()=>query;}});return {auth:{getSession:async()=>({data:{session:{user:{id:profile.id,email:'test@example.invalid'}}}}),getUser:async()=>({data:{user:{id:profile.id}}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},from:()=>query,rpc:async()=>({data:[],error:null}),channel:()=>query,removeChannel(){},storage:{from:()=>query}}}};`;
async function run() {
 fs.mkdirSync(out,{recursive:true});
 const server=http.createServer((req,res)=>{let file=path.join(root,decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');fs.readFile(file,(error,data)=>{if(error){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(data);});});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const results=[];
 try {
 const files=process.argv.slice(2).length?process.argv.slice(2):['index.html','core/dashboard.html','marketplace/marketplace.html','auth/login.html','core/profile.html','core/activity.html','roommates/flatmates.html','pghostels/pghostels.html','unimatch/index.html','unimatch/discover.html','unimatch/profile/my-profile.html'];
 for(const width of (process.env.AUDIT_WIDTHS || '320,390,768,1440').split(',').map(Number)) {
 const context=await browser.newContext({viewport:{width,height:844},isMobile:width<768,hasTouch:width<768,reducedMotion:process.env.AUDIT_MOTION || 'reduce'});
 await context.route('**/*',route=>{const url=route.request().url();if(url.includes('@supabase/supabase-js'))return route.fulfill({contentType:'text/javascript',body:sdk});if(/supabase\.co|onrender\.com|famgateway/.test(url))return route.abort();return route.continue();});
 for(const file of files){const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${server.address().port}/${file}`,{waitUntil:'networkidle',timeout:25000}).catch(e=>errors.push(e.message));await page.evaluate(()=>document.fonts.ready);const layout=await page.evaluate(()=>({url:location.pathname,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,font:getComputedStyle(document.body).fontFamily,overflow:[...document.querySelectorAll('body *')].filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&(r.right>innerWidth+2||r.left < -2)&&!el.closest('[class*="overflow-x-auto"], [class*="overflow-hidden"], [class*="overflow-x-scroll"]');}).slice(0,8).map(el=>({tag:el.tagName,id:el.id,classes:el.className}))}));await page.screenshot({path:path.join(out,`${file.replaceAll('/','_')}-${width}.png`),fullPage:true});results.push({file,width,...layout,errors});await page.close();}
 await context.close();
 }
 } finally {await browser.close();server.close();}
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(results,null,2));
 console.log(JSON.stringify(results.filter(r=>r.scrollWidth>r.width||r.errors.length||r.overflow.length),null,2));
 console.log(`Checked ${results.length} layouts. Screenshots/report: ${out}`);
}
run().catch(e=>{console.error(e);process.exitCode=1;});
