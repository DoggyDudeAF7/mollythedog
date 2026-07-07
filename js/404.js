/* =========================
CONFIG
========================= */

const size = 21;   // maze cells (odd number)
const cell = 28;   // pixel size
const fogRadius = 2;

const canvas = document.getElementById("maze");
const ctx = canvas.getContext("2d");

canvas.width = size * cell;
canvas.height = size * cell;

/* =========================
TIMER
========================= */

let seconds = 0;
setInterval(()=>{
seconds++;
document.getElementById("timer").textContent = "Time: "+seconds+"s";
},1000);

/* =========================
MAZE DATA
========================= */

let maze = [];
for(let y=0;y<size;y++){
maze[y]=[];
for(let x=0;x<size;x++){
maze[y][x]=1;
}
}

/* =========================
RANDOM MAZE GENERATOR
========================= */

function shuffle(arr){
for(let i=arr.length-1;i>0;i--){
const j=Math.floor(Math.random()*(i+1));
[arr[i],arr[j]]=[arr[j],arr[i]];
}
return arr;
}

function carve(x,y){

const dirs = shuffle([
[2,0],[-2,0],[0,2],[0,-2]
]);

dirs.forEach(d=>{
const nx = x + d[0];
const ny = y + d[1];

if(nx>0 && ny>0 && nx<size-1 && ny<size-1 && maze[ny][nx]===1){

maze[ny][nx]=0;
maze[y+d[1]/2][x+d[0]/2]=0;

carve(nx,ny);

}

});

}

maze[1][1]=0;
carve(1,1);

maze[size-2][size-2]=0;

/* =========================
PLAYER
========================= */

let player={
x:1,
y:1
};

/* =========================
DRAW
========================= */

function draw(){

ctx.clearRect(0,0,canvas.width,canvas.height);

for(let y=0;y<size;y++){
for(let x=0;x<size;x++){

if(maze[y][x]===1){
ctx.fillStyle="#222";
ctx.fillRect(x*cell,y*cell,cell,cell);
}

}

}

/* exit */

ctx.fillStyle="#3cff84";
ctx.fillRect((size-2)*cell,(size-2)*cell,cell,cell);

/* player */

ctx.fillStyle="#ffb7a5";
ctx.beginPath();
ctx.arc(
player.x*cell+cell/2,
player.y*cell+cell/2,
cell/3,
0,
Math.PI*2
);
ctx.fill();

/* fog of war */

ctx.fillStyle="rgba(0,0,0,.8)";

for(let y=0;y<size;y++){
for(let x=0;x<size;x++){

const dx=Math.abs(x-player.x);
const dy=Math.abs(y-player.y);

if(dx>fogRadius || dy>fogRadius){

ctx.fillRect(x*cell,y*cell,cell,cell);

}

}
}

}

draw();

/* =========================
MOVE
========================= */

function move(dx,dy){

const nx=player.x+dx;
const ny=player.y+dy;

if(nx<0||ny<0||nx>=size||ny>=size)return;

if(maze[ny][nx]===1)return;

player.x=nx;
player.y=ny;

draw();

checkWin();

}

function checkWin(){

if(player.x===size-2 && player.y===size-2){

document.getElementById("win").classList.add("show");

setTimeout(()=>{
location.href="/html/molly/";
},2000);

}

}

/* =========================
KEYS
========================= */

document.addEventListener("keydown",e=>{

if(e.key==="ArrowUp")move(0,-1);
if(e.key==="ArrowDown")move(0,1);
if(e.key==="ArrowLeft")move(-1,0);
if(e.key==="ArrowRight")move(1,0);

});
