/* Real browser input and rendered-canvas observations. No game-state testing hooks. */
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.ARCADE_BASE || 'http://127.0.0.1:8000';
const out = process.env.ARCADE_TEST_OUTPUT || '/tmp/ms-arcade-tests';
fs.mkdirSync(out, {recursive:true});
const records=[];
let browser, context, page, errors=[], mobile=false, started=0;
async function test(name,fn){try{await fn();records.push({name,pass:true});console.log('PASS '+name);}catch(error){records.push({name,pass:false,error:error.stack});console.log('FAIL '+name+': '+error.message);await page.screenshot({path:path.join(out,'action-'+name.replace(/[^a-z0-9]+/gi,'-')+'.png'),fullPage:true,animations:'disabled'}).catch(()=>{});}}
const advance = ms => page.clock.runFor(ms);
async function setup(touch=false){
 mobile=touch;
 context=await browser.newContext({viewport:touch?{width:390,height:844}:{width:1440,height:1000},isMobile:touch,hasTouch:touch,reducedMotion:'reduce'});
 await context.route('**/*',async route=>{const url=new URL(route.request().url());if(url.origin!==base)return route.fulfill({status:200,body:'',contentType:url.pathname.endsWith('.js')?'application/javascript':'text/css'});if(url.pathname==='/api/posts')return route.fulfill({path:path.resolve('html/blog/posts.json'),contentType:'application/json'});return route.continue();});
 page=await context.newPage();errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(base))errors.push(`${r.status()} ${r.url()}`);});
 await page.addInitScript(()=>{
   // Observe primitives already painted on the playfield, as an assistive test driver.
   const proto=CanvasRenderingContext2D.prototype;
   for(const name of ['fillRect','roundRect','arc','fill','drawImage']){
     const original=proto[name];
     proto[name]=function(...args){
       if(this.canvas.closest?.('#game-stage')){
         if(!this.__visual||(name==='fillRect'&&args[0]===0&&args[1]===0&&args[2]===this.canvas.width&&args[3]===this.canvas.height))this.__visual={images:[],rects:[],circles:[]};
         if(name==='roundRect')this.__lastPrimitive={kind:'rects',x:args[0],y:args[1],width:args[2],height:args[3]};
         if(name==='arc')this.__lastPrimitive={kind:'circles',x:args[0],y:args[1],radius:args[2]};
         if(name==='fill'&&this.__lastPrimitive){const p=this.__lastPrimitive;this.__visual[p.kind].push({...p,fill:this.fillStyle});this.__lastPrimitive=null;}
         if(name==='drawImage'){const matrix=this.getTransform();this.__visual.images.push({src:args[0].src,x:matrix.e,y:matrix.f});}
       }
       return original.apply(this,args);
     };
   }
 });
 await page.clock.install({time:new Date('2026-09-15T10:00:00Z')});await page.goto(base+'/games/',{waitUntil:'networkidle'});await page.locator('.arcade-card').first().waitFor();await page.clock.pauseAt(new Date('2026-09-15T10:10:00Z'));await advance(50);
}
async function start(id){
 await page.evaluate(id=>{location.hash=id;},id);await page.locator('#start-game').waitFor();
 await page.evaluate(()=>{let state=816;Math.random=()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state/4294967296;};});
 await page.locator('#start-game').click();started=await page.evaluate(()=>performance.now());await advance(32);
 await page.evaluate(async()=>{const {assets}=await import('/js/arcade/data.js');await Promise.all(Object.values(assets).map(src=>new Promise(resolve=>{const i=new Image();i.onload=i.onerror=resolve;i.src=src;})));});
}
async function visual(){return page.locator('#game-stage canvas').evaluate(c=>c.getContext('2d').__visual);}
async function tapCanvas(x,y){const c=page.locator('#game-stage canvas'),r=await c.boundingBox(),size=await c.evaluate(e=>({w:e.width,h:e.height}));const px=r.x+x/size.w*r.width,py=r.y+y/size.h*r.height;if(mobile)await page.touchscreen.tap(px,py);else await page.mouse.click(px,py);}
async function press(button,key='Space'){if(mobile)await page.locator(button).tap();else await page.keyboard.press(key);}
async function finished(id,won){await page.locator('#play-again').waitFor({timeout:3000});const text=await page.locator('.result-screen').innerText();assert.match(text,won?/You did it/ : /Good effort/);const progress=await page.evaluate(id=>JSON.parse(localStorage.getItem('msArcadeV1')).results[id],id);assert.ok(progress.plays>=1);assert.ok(progress.best>=0);if(won)assert.ok(progress.wins>=1);const saved=await page.evaluate(()=>localStorage.getItem('msArcadeV1'));await advance(3000);assert.equal(await page.evaluate(()=>localStorage.getItem('msArcadeV1')),saved,'result pays out only once');return text;}
async function catchRun(win){
 await start('treat-catch');
 // Explicit keyboard and held-touch steering, including release after pause.
 const initial=(await visual()).images.find(i=>i.src.endsWith('molly-emoji.webp')).x;
 if(!mobile){await page.keyboard.down('ArrowLeft');await advance(160);await page.keyboard.up('ArrowLeft');assert.ok((await visual()).images.find(i=>i.src.endsWith('molly-emoji.webp')).x<initial-30);}
 else {const left=page.locator('.action-arrow').first();await left.dispatchEvent('pointerdown',{pointerId:9,clientX:0,clientY:0,pointerType:'touch'});await advance(160);await left.dispatchEvent('pointerup',{pointerId:9});assert.ok((await visual()).images.find(i=>i.src.endsWith('molly-emoji.webp')).x<initial-30);}
 for(let i=0;i<465;i++){
   if(await page.locator('#play-again').count())break;
   const v=await visual(),dog=v.images.find(s=>s.src.endsWith('molly-emoji.webp'));
   const rain=v.circles.filter(c=>c.fill==='#82374c').sort((a,b)=>b.y-a.y);
   const bones=v.images.filter(s=>s.src.endsWith('dog-bone.webp')).sort((a,b)=>b.y-a.y);
   let x=dog?.x||360;
   if(win){const danger=rain.filter(r=>r.y>255&&r.y<495);const bone=bones.find(b=>b.y>80&&b.y<420&&danger.every(r=>Math.abs(b.x-r.x)>100));if(bone)x=bone.x;if(danger.some(r=>Math.abs(r.x-x)<95)){const choices=[50,170,290,430,550,670];x=choices.sort((a,b)=>Math.min(...danger.map(r=>Math.abs(r.x-b)))-Math.min(...danger.map(r=>Math.abs(r.x-a))))[0];}}
   else if(rain.length)x=rain[0].x;
   await tapCanvas(x,440);await advance(100);
 }
 await finished('treat-catch',win);
}
async function dashRun(win){
 await start('molly-dash');
 if(win){for(let time=0;time<61000;time+=80){
   if(await page.locator('#play-again').count())break;
   const v=await visual(),dog=v.images.find(i=>i.src.endsWith('molly-emoji.webp'));
   const next=v.rects.filter(r=>r.fill==='#bb7d62'&&r.x+r.width/2>110).sort((a,b)=>a.x-b.x)[0];
   const speed=245+(time/1000)*3.1;
   if(next&&next.x+next.width/2-125<speed*.36+15&&dog?.y>360)await press('.action-main-button');
   await advance(80);
 }}else await advance(61000);
 await finished('molly-dash',win);
}
async function setSlider(selector,value){await page.locator(selector).evaluate((e,v)=>{e.value=String(v);e.dispatchEvent(new Event('input',{bubbles:true}));},value);}
async function fetchRun(win){
 await start('fetch');
 await page.locator('#fetch-angle').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#fetch-angle').inputValue(),'51');
 for(let i=0;i<5;i++){
   let angle=20,power=30;
   if(win){const t=(await page.evaluate(()=>performance.now())-started)/1000;let best=Infinity;for(let a=20;a<=75;a++)for(let p=30;p<=100;p++){const v=270+p*5.5,rad=a*Math.PI/180,flight=(v*Math.sin(rad)+Math.sqrt((v*Math.sin(rad))**2+2*780*17))/780;const x=78+v*Math.cos(rad)*flight,target=525+Math.sin((t+flight)*.75)*135,d=Math.abs(x-target);if(d<best){best=d;angle=a;power=p;}}}
   await setSlider('#fetch-angle',angle);await setSlider('#fetch-power',power);
   if(mobile)await page.locator('.action-main-button').tap();else{await page.locator('.action-main-button').focus();await page.keyboard.press('Enter');}
   await advance(4200);
 }
 await finished('fetch',win);
}
async function stackRun(win){
 await start('treat-stacker');
 if(win){let lastDrop=-1;for(let i=0;i<2200;i++){
   if(await page.locator('#play-again').count())break;
   const blocks=(await visual()).rects.filter(r=>r.height===26&&['#805c59','#d59870','#e2b581','#bf8a70','#dbab80','#c69378'].includes(r.fill));
   const active=blocks.at(-1),top=blocks.at(-2),enabled=await page.locator('.action-main-button').isEnabled();
   if(active&&top&&enabled&&Math.abs(active.x-top.x)<=6){await press('.action-main-button');lastDrop=i;await advance(600);}
   else await advance(active&&top&&Math.abs(active.x-top.x)>55?80:16);
   if(i===2199)throw new Error('Tower failed to finish');
 }}else{await press('.action-main-button');await advance(700);await press('.action-main-button');await advance(1500);}
 await finished('treat-stacker',win);
}
async function reactionRun(win){
 await start('reaction-paws');
 if(win){for(let i=0;i<5;i++){for(let j=0;j<60;j++){if(await page.locator('.reaction-pad.is-go').count())break;await advance(100);}assert.equal(await page.locator('.reaction-pad.is-go').count(),1);await advance(160);await press('.reaction-pad');await advance(1150);}}
 else{for(let i=0;i<3;i++){await press('.reaction-pad');await advance(1250);}}
 const result=await finished('reaction-paws',win);if(win)assert.match(result,/Average \d+ ms/);
}
async function run(touch){await setup(touch);for(const [id,fn]of[['Treat Catch',catchRun],['Molly Dash',dashRun],['Fetch',fetchRun],['Treat Stacker',stackRun],['Reaction Paws',reactionRun]]){await test(`${touch?'touch':'keyboard'} ${id} full win`,()=>fn(true));if(!touch)await test(`${id} full loss`,()=>fn(false));}await test(`${touch?'mobile':'desktop'} action console and overflow`,async()=>{assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);});await context.close();}
(async()=>{browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});try{const mode=process.argv[2]||'all';if(mode==='all'||mode==='desktop')await run(false);if(mode==='all'||mode==='mobile')await run(true);}finally{await browser.close();fs.writeFileSync(path.join(out,'action-results-'+(process.argv[2]||'all')+'.json'),JSON.stringify(records,null,2));console.log(`${records.filter(r=>r.pass).length}/${records.length} passed`);process.exitCode=records.some(r=>!r.pass)?1:0;}})().catch(e=>{console.error(e);process.exitCode=1;browser?.close();});
