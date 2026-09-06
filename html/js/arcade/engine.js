/* One lifecycle for every game: active-time clocks, input, audio, pause and disposal. */
let audioContext;let muted=true;const imageCache=new Map();
export function setSoundMuted(value){muted=value;if(value&&audioContext)audioContext.suspend().catch(()=>{});}
export function sound(kind='tap'){if(muted)return;try{audioContext??=new(window.AudioContext||window.webkitAudioContext)();if(audioContext.state==='suspended')audioContext.resume().catch(()=>{});const oscillator=audioContext.createOscillator(),gain=audioContext.createGain();const t=audioContext.currentTime;oscillator.type='sine';oscillator.frequency.setValueAtTime({good:660,bad:170,tap:420,win:880}[kind]||420,t);oscillator.frequency.exponentialRampToValueAtTime(kind==='bad'?100:990,t+.1);gain.gain.setValueAtTime(.035,t);gain.gain.exponentialRampToValueAtTime(.001,t+.14);oscillator.connect(gain).connect(audioContext.destination);oscillator.start(t);oscillator.stop(t+.15);}catch{}}
export function image(src){if(!imageCache.has(src)){const img=new Image();img.src=src;imageCache.set(src,img);}return imageCache.get(src);}
export function createSession(root,onFinish){let alive=true,paused=false,elapsed=0,last=performance.now(),request,cleanup;const listeners=[],timers=[],frames=[],keys=new Set();
 const ctx={root,keys,image,sound,get alive(){return alive;},get elapsed(){return elapsed;},get paused(){return paused;},
  hud(values){const hud=document.getElementById('game-hud');hud.replaceChildren(...Object.entries(values).map(([label,value])=>{const d=document.createElement('div'),s=document.createElement('small'),b=document.createElement('strong');s.textContent=label;b.textContent=value;d.append(s,b);return d;}));},
  status(message){const e=document.getElementById('game-status');if(e.textContent!==message)e.textContent=message;},
  on(target,event,fn,options){const guarded=e=>{if(alive&&!paused)fn(e);};target.addEventListener(event,guarded,options);listeners.push(()=>target.removeEventListener(event,guarded,options));return guarded;},
  later(fn,ms){const timer={fn,at:elapsed+ms/1000,repeat:0};timers.push(timer);return timer;},
  every(fn,ms){const timer={fn,at:elapsed+ms/1000,repeat:ms/1000};timers.push(timer);return timer;},
  frame(fn){frames.push(fn);},
  canvas(w=900,h=500){const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;canvas.setAttribute('aria-label','Game playfield; use the controls described above.');root.append(canvas);return{canvas,g:canvas.getContext('2d'),w,h,point(event){const r=canvas.getBoundingClientRect();return{x:(event.clientX-r.left)*w/r.width,y:(event.clientY-r.top)*h/r.height};}};},
  finish(result){if(!alive)return;dispose();onFinish({...result,score:Math.max(0,Math.floor(Number(result.score)||0))});},
  pause(value){if(!alive)return;paused=value;keys.clear();last=performance.now();root.inert=value;},
  dispose,
  setCleanup(fn){cleanup=fn;}
 };
 function dispose(){alive=false;cancelAnimationFrame(request);keys.clear();listeners.splice(0).forEach(fn=>fn());timers.length=0;frames.length=0;root.inert=false;cleanup?.();}
 ctx.on(document,'keydown',e=>{if(!['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)){keys.add(e.code);if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();}});
 ctx.on(document,'keyup',e=>keys.delete(e.code));ctx.on(window,'blur',()=>keys.clear());
 function tick(now){if(!alive)return;const dt=Math.min(.05,(now-last)/1000);last=now;if(!paused){elapsed+=dt;for(const timer of [...timers]){if(!alive)break;if(timer.at<=elapsed){if(timer.repeat)timer.at=elapsed+timer.repeat;else timers.splice(timers.indexOf(timer),1);timer.fn();}}for(const fn of [...frames]){if(!alive)break;fn(dt,elapsed);}}if(alive)request=requestAnimationFrame(tick);}
 request=requestAnimationFrame(tick);return ctx;
}
