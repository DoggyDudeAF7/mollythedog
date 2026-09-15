import {catalog,assets,photos} from './data.js';
import {getProgress,recordResult,setMuted,storageAvailable,badges,STORAGE_KEY} from './progress.js';
import {createSession,image,setSoundMuted,sound} from './engine.js';
import {games as puzzles} from './puzzles.js';
import {games as action} from './action.js';
import {games as adventures} from './adventures.js';
const games={...puzzles,...action,...adventures};
const $=id=>document.getElementById(id);
const stage=$('game-stage');
let session=null,current=null,filter='All',toastTimer;
const format=n=>n.toLocaleString();
function el(tag,text,className){const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(className)node.className=className;return node;}
function refreshProgress(){
 const state=getProgress();setSoundMuted(state.muted);
 $('coin-balance').textContent=format(state.coins);
 $('mute-toggle').textContent=state.muted?'Sound off':'Sound on';
 $('mute-toggle').setAttribute('aria-pressed',String(state.muted));
 $('mute-toggle').setAttribute('aria-label',state.muted?'Turn game sound on':'Mute game sound');
 $('played-count').textContent=`${Object.keys(state.results).length} / 16`;
 $('win-count').textContent=format(Object.values(state.results).reduce((sum,r)=>sum+r.wins,0));
 $('badge-count').textContent=`${Object.keys(state.achievements).length} / ${badges.length}`;
 $('storage-warning').hidden=storageAvailable();
 $('arcade-badges').replaceChildren(...badges.map(b=>{const item=el('div',undefined,'badge'+(state.achievements[b.id]?' unlocked':''));item.append(el('span',b.icon));const copy=el('div');copy.append(el('strong',b.title+(state.achievements[b.id]?' ✓':'')),el('p',b.description));item.append(copy);return item;}));
 for(const game of catalog){const card=document.querySelector(`[data-game="${game.id}"]`);if(card)card.querySelector('.personal-best').textContent=state.results[game.id]?`Best ${format(state.results[game.id].best)}`:'Set your first best';}
}
function renderCards(){
 $('game-cards').replaceChildren(...catalog.map(game=>{
 const card=el('article',undefined,'arcade-card'+(game.number===16?' finale':''));card.dataset.game=game.id;card.dataset.category=game.category;card.style.setProperty('--tint',game.tint);
 const art=el('div',undefined,'card-art');const photo=el('img');photo.src=game.image;photo.alt='';photo.loading='lazy';photo.width=112;photo.height=112;art.append(photo,el('span',String(game.number).padStart(2,'0'),'card-number'),el('span',game.symbol,'card-symbol'));card.append(art);
 const content=el('div',undefined,'card-content');content.append(el('span',`${game.difficulty} · ${game.category}`,'difficulty'),el('h3',game.title),el('p',game.description));
 const bottom=el('div',undefined,'card-bottom');bottom.append(el('span','Set your first best','personal-best'));const play=el('a','Play ↗');play.href=`#${game.id}`;play.setAttribute('aria-label',`Play ${game.title}`);bottom.append(play);content.append(bottom);card.append(content);return card;
 }));
}
function stop(){session?.dispose();session=null;stage.inert=false;$('pause-cover').hidden=true;$('pause-game').hidden=true;$('restart-game').hidden=true;}
function instructions(game){
 stop();current=game;$('hub-view').hidden=true;$('player-view').hidden=false;
 $('game-title').textContent=game.title;$('game-description').textContent=game.description;$('game-category').textContent=`${game.category} · ${game.difficulty}`;
 $('game-status').textContent='Ready when you are.';$('game-hud').replaceChildren();
 const intro=el('div',undefined,'instruction-screen');const img=el('img');img.src=game.image;img.alt=game.id.includes('shaina')?'Shaina':'Molly & Shaina arcade';intro.append(img);
 const copy=el('div');copy.append(el('h2','How to play'),el('p',game.instructions));const list=el('ul');game.controls.forEach(text=>list.append(el('li',text)));copy.append(list);
 const best=getProgress().results[game.id];copy.append(el('p',best?`Personal best: ${format(best.best)} · ${best.wins} wins`:'A fresh challenge. Your first best is waiting.','best-note'));
 const start=el('button','Let’s play','primary-button');start.id='start-game';start.type='button';start.addEventListener('click',startGame);copy.append(start);intro.append(copy);stage.replaceChildren(intro);
 document.title=`${game.title} · Molly & Shaina Arcade`;
 $('game-title').focus({preventScroll:true});
}
function resultScreen(result){
 const game=current;const reward=recordResult(game.id,result.score,Boolean(result.won));session=null;$('pause-game').hidden=true;$('restart-game').hidden=true;$('pause-cover').hidden=true;
 sound(result.won?'win':'tap');$('game-status').textContent=result.won?'Challenge complete.':'Another go is always welcome.';
 const view=el('div',undefined,'result-screen');view.append(el('div',result.won?'🏆':'🐾','result-icon'),el('h2',result.won?'Very good game.':'Good effort, good dog.'),el('p',result.message));
 const stats=el('div',undefined,'result-stats');for(const [value,label]of[[format(result.score),'Your score'],['+'+reward.coins,'Dog Coins'],[format(reward.best),'Personal best']]){const d=el('div');d.append(el('strong',value),el('span',label));stats.append(d);}view.append(stats);
 if(reward.newBest)view.append(el('p','New personal best!','new-best'));
 if(reward.unlocked.length)view.append(el('p','Achievements unlocked: '+reward.unlocked.map(b=>b.title).join(' · '),'new-best'));
 const buttons=el('div',undefined,'game-controls');const replay=el('button','Play again','primary-button');replay.id='play-again';replay.type='button';replay.addEventListener('click',startGame);const back=el('a','Back to arcade','game-button');back.href='/games/';back.addEventListener('click',toHub);buttons.append(replay,back);view.append(buttons);
 if(result.drawing){const art=el('img');art.src=result.drawing;art.alt='Your completed Molly and Shaina drawing';art.className='drawing-result';const download=el('a','Download your masterpiece','game-button');download.href=result.drawing;download.download='molly-and-shaina-masterpiece.png';view.append(art,download);}
 stage.replaceChildren(view);replay.focus({preventScroll:true});refreshProgress();
 if(reward.unlocked.length)toast(reward.unlocked.map(b=>`${b.icon} ${b.title}`).join(' · '));
}
function startGame(){
 if(!current)return;stop();stage.replaceChildren();$('game-status').textContent='';$('pause-game').hidden=false;$('restart-game').hidden=false;$('pause-game').textContent='Pause';
 Object.values(assets).forEach(image);sound('tap');
 session=createSession(stage,resultScreen);
 // Keep every session's cleanup and payout in the shared lifecycle.
 try{session.setCleanup(games[current.id](session));}catch(error){session.dispose();session=null;$('pause-game').hidden=true;$('game-status').textContent='This game could not start. Please reload and try again.';console.error(error);}
 stage.tabIndex=-1;stage.focus({preventScroll:true});
}
function pause(value){if(!session?.alive)return;session.pause(value);$('pause-cover').hidden=!value;$('pause-game').textContent=value?'Resume':'Pause';if(value)$('resume-game').focus({preventScroll:true});else stage.focus({preventScroll:true});}
function toast(text){clearTimeout(toastTimer);$('arcade-toast').textContent=text;$('arcade-toast').classList.add('show');toastTimer=setTimeout(()=>$('arcade-toast').classList.remove('show'),4500);}
function toHub(event){event?.preventDefault();if(location.hash){history.pushState(null,'',location.pathname+location.search);}route();}
function route(){const id=location.hash.slice(1),game=catalog.find(g=>g.id===id);if(game){instructions(game);}else{stop();current=null;$('hub-view').hidden=false;$('player-view').hidden=true;document.title='The Arcade · Molly & Shaina';refreshProgress();if(id)toast('Choose a game from the shelf to get started.');}}
$('back-to-arcade').addEventListener('click',toHub);
$('pause-game').addEventListener('click',()=>pause(!session?.paused));$('resume-game').addEventListener('click',()=>pause(false));$('restart-game').addEventListener('click',startGame);
$('mute-toggle').addEventListener('click',()=>{setMuted(!getProgress().muted);refreshProgress();sound('tap');});
for(const button of document.querySelectorAll('[data-filter]'))button.addEventListener('click',()=>{filter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));document.querySelectorAll('[data-game]').forEach(card=>card.hidden=filter!=='All'&&card.dataset.category!==filter);});
window.addEventListener('hashchange',route);window.addEventListener('popstate',route);window.addEventListener('ms:arcade-changed',refreshProgress);window.addEventListener('storage',event=>{if(event.key===STORAGE_KEY||event.key===null)refreshProgress();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause(true);});window.addEventListener('blur',()=>pause(true));
for(const id of ['navToggle','searchBtn'])$(id)?.addEventListener('click',()=>pause(true));
document.addEventListener('keydown',event=>{if(event.code==='Escape'&&session?.alive&&!document.querySelector('#searchBox:not(.hidden)')&&!$('navLinks')?.classList.contains('open')){event.preventDefault();pause(!session.paused);}});
renderCards();refreshProgress();route();
