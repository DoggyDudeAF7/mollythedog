const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const {pathToFileURL}=require('node:url');
const root=require('node:path').resolve(__dirname,'..');
fs.mkdirSync(root+'/.tools/gtv-device-tests',{recursive:true});
const cases=[
 {name:'Windows x64',platform:'Win32',ua:'Windows NT 10.0; Win64; x64',hints:{platform:'Windows',architecture:'x86',bitness:'64'},ids:['windows-x64']},
 {name:'Windows ARM despite frozen x64 UA',platform:'Win32',ua:'Windows NT 10.0; Win64; x64',hints:{platform:'Windows',architecture:'arm',bitness:'64'},ids:['windows-arm64']},
 {name:'Mac Intel',platform:'MacIntel',ua:'Macintosh; Intel Mac OS X 10_15_7',hints:{platform:'macOS',architecture:'x86',bitness:'64'},ids:['mac-intel']},
 {name:'Mac Silicon despite Intel UA',platform:'MacIntel',ua:'Macintosh; Intel Mac OS X 10_15_7',hints:{platform:'macOS',architecture:'arm',bitness:'64'},ids:['mac-silicon']},
 {name:'Mac processor hidden',platform:'MacIntel',ua:'Macintosh; Intel Mac OS X 10_15_7',ids:[],text:'Choose Intel or Apple Silicon'},
 {name:'Linux x64 fallback',platform:'Linux x86_64',ua:'X11; Linux x86_64',ids:['linux-appimage','linux-deb']},
 {name:'Linux ARM unsupported',platform:'Linux aarch64',ua:'X11; Linux aarch64',ids:[],text:'no matching build'},
 {name:'Android',platform:'Linux armv8l',ua:'Linux; Android 14; Mobile',ids:[],text:'Android detected'},
 {name:'iPad desktop mode',platform:'MacIntel',ua:'Macintosh; Intel Mac OS X 10_15_7',touch:5,ids:[],text:'iPhone / iPad detected'},
 {name:'iPhone',platform:'iPhone',ua:'iPhone; CPU iPhone OS 17_0',touch:5,ids:[],text:'iPhone / iPad detected'},
 {name:'ChromeOS',platform:'Linux x86_64',ua:'X11; CrOS x86_64 14541',ids:[],text:'ChromeOS detected'},
 {name:'Privacy rejection',platform:'Win32',ua:'Windows NT 10.0; Win64; x64',hints:{platform:'Windows'},reject:true,ids:[],text:'Choose x64 or ARM64'},
 {name:'Hints timeout',platform:'Win32',ua:'Windows NT 10.0; Win64; x64',hints:{platform:'Windows'},hang:true,ids:[],text:'Choose x64 or ARM64'},
 {name:'32-bit Windows',platform:'Win32',ua:'Windows NT 10.0',hints:{platform:'Windows',architecture:'x86',bitness:'32'},ids:[],text:'no matching installer'},
 {name:'Unknown browser',platform:'',ua:'Unknown',ids:[],text:'doesn’t identify this device'},
];
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:fs.existsSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{})});
 const results=[],errors=[];
 for(const test of cases){
  const page=await browser.newPage({viewport:{width:test.name==='Android'?320:1280,height:900}});page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(test=>{
   for(const [name,value] of Object.entries({userAgent:test.ua,platform:test.platform,maxTouchPoints:test.touch||0,userAgentData:test.hints?{platform:test.hints.platform,getHighEntropyValues:()=>test.reject?Promise.reject(new Error('denied')):test.hang?new Promise(()=>{}):Promise.resolve(test.hints)}:undefined}))Object.defineProperty(navigator,name,{configurable:true,value});
  },test);
  await page.goto(pathToFileURL(root+'/html/gtv/index.html').href);
  await page.locator('.device-panel[data-ready="true"]').waitFor();
  assert.deepEqual(await page.locator('.device-recommended').evaluateAll(nodes=>nodes.map(n=>n.dataset.download)),test.ids,test.name);
  if(test.text)assert((await page.locator('#device-status').innerText()).includes(test.text),test.name);
  assert.equal(await page.locator('#device-download').isVisible(),test.ids.length===1,test.name);
  if(test.ids.length===1)assert.equal(await page.locator('#device-download').getAttribute('href'),await page.locator(`[data-download="${test.ids[0]}"]`).getAttribute('href'));
  for(const link of await page.locator('[data-download]').all())assert(await link.isVisible());
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  if(test.name==='Mac Silicon despite Intel UA')await page.screenshot({path:root+'/.tools/gtv-device-tests/device-detection-desktop.png',fullPage:true});
  if(test.name==='Android')await page.screenshot({path:root+'/.tools/gtv-device-tests/device-detection-mobile.png',fullPage:true});
  await page.locator('#device-choice').selectOption('windows-arm64');assert.equal(await page.locator('#device-download').getAttribute('href'),await page.locator('[data-download="windows-arm64"]').getAttribute('href'));
  await page.locator('#device-choice').selectOption('auto');assert.deepEqual(await page.locator('.device-recommended').evaluateAll(nodes=>nodes.map(n=>n.dataset.download)),test.ids);
  results.push({case:test.name,passed:true});await page.close();
 }
 const delayed=await browser.newPage();await delayed.addInitScript(()=>Object.defineProperty(navigator,'userAgentData',{value:{platform:'macOS',getHighEntropyValues:()=>new Promise(resolve=>setTimeout(()=>resolve({architecture:'arm',bitness:'64'}),300))}}));
 await delayed.goto(pathToFileURL(root+'/html/gtv/index.html').href);await delayed.locator('#device-choice').selectOption('windows-x64');await delayed.waitForTimeout(1700);assert.deepEqual(await delayed.locator('.device-recommended').evaluateAll(nodes=>nodes.map(n=>n.dataset.download)),['windows-x64']);await delayed.close();
 const noJS=await browser.newPage({javaScriptEnabled:false});await noJS.goto(pathToFileURL(root+'/html/gtv/index.html').href);assert.equal(await noJS.locator('[data-download]').count(),6);assert.equal(await noJS.locator('.device-panel').count(),0);await noJS.close();
 await browser.close();assert.deepEqual(errors,[]);fs.writeFileSync(root+'/.tools/gtv-device-tests/device-detection-verification.json',JSON.stringify({results,manualSelectionSurvivesDelayedDetection:true,noJavaScriptDownloadsPreserved:true,errors},null,2));console.log(JSON.stringify(results));
})().catch(e=>{console.error(e);process.exit(1)});
