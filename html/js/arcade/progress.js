import {catalog} from './data.js';
export const STORAGE_KEY='msArcadeV1';
export const DRAWING_KEY='msArcadeDrawingV1';
const blank=()=>({version:1,coins:0,results:{},achievements:{},muted:true});
const number=(v)=>typeof v==='number'&&Number.isFinite(v)&&v>=0?Math.min(1e9,Math.floor(v)):0;
let memory=blank(); let available=true;
function read(){try{const raw=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');if(!raw||raw.version!==1)return memory;const clean=blank();clean.coins=number(raw.coins);clean.muted=raw.muted!==false;for(const {id} of catalog){const r=raw.results?.[id];if(r&&typeof r==='object')clean.results[id]={best:number(r.best),plays:number(r.plays),wins:number(r.wins)};}for(const id of Object.keys(raw.achievements||{})){if(badges.some(b=>b.id===id))clean.achievements[id]=true;}return clean;}catch{available=false;return memory;}}
export const badges=[
 {id:'first-paw',icon:'🐾',title:'First Paw',description:'Finish your first game.',test:s=>Object.keys(s.results).length>=1},
 {id:'good-dog',icon:'⭐',title:'Very Good Dog',description:'Win your first challenge.',test:s=>Object.values(s.results).some(r=>r.wins>0)},
 {id:'curious',icon:'🧭',title:'Curious Canine',description:'Finish eight different games.',test:s=>Object.keys(s.results).length>=8},
 {id:'whole-pack',icon:'🎮',title:'The Whole Pack',description:'Finish all sixteen games.',test:s=>Object.keys(s.results).length===16},
 {id:'snack-fund',icon:'🦴',title:'Snack Fund',description:'Earn 250 Dog Coins.',test:s=>s.coins>=250},
 {id:'brain',icon:'🧠',title:'Big Dog Brain',description:'Win Memory, Trivia and Maze.',test:s=>['memory-match','trivia','pawprint-maze'].every(id=>s.results[id]?.wins>0)},
 {id:'artist',icon:'🎨',title:'Paw-casso',description:'Finish a Doggy Drawing.',test:s=>s.results['doggy-drawing']?.wins>0},
 {id:'champion',icon:'🏆',title:'Ultimate Good Dog',description:'Win the Ultimate Dog Challenge.',test:s=>s.results['ultimate-dog-challenge']?.wins>0}
];
export function getProgress(){memory=read();return structuredClone(memory);}
export function saveProgress(state){memory=state;try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));available=true;}catch{available=false;}window.dispatchEvent(new Event('ms:arcade-changed'));}
export function storageAvailable(){return available;}
export function setMuted(muted){const state=getProgress();state.muted=muted;saveProgress(state);}
export function recordResult(id,score,won){if(!catalog.some(g=>g.id===id))throw new Error('Unknown game');score=number(score);const state=getProgress();const previous=state.results[id];const newBest=!previous||score>previous.best;state.results[id]={best:Math.max(previous?.best||0,score),plays:(previous?.plays||0)+1,wins:(previous?.wins||0)+(won?1:0)};let coins=Math.min(20,Math.floor(score/50))+(won?15:0);state.coins+=coins;const unlocked=[];for(const badge of badges){if(!state.achievements[badge.id]&&badge.test(state)){state.achievements[badge.id]=true;unlocked.push(badge);state.coins+=10;coins+=10;}}saveProgress(state);return{coins,newBest,unlocked,best:state.results[id].best};}
