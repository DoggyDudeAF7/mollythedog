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

const mollyImg = new Image();
const shainaImg = new Image();

mollyImg.src = "/images/molly/molly.webp";
shainaImg.src = "/images/shaina/shaina.webp";

mollyImg.addEventListener("load", draw);
shainaImg.addEventListener("load", draw);

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

drawDogMarker(shainaImg, size - 2, size - 2, "#3cff84");

/* player */

drawDogMarker(mollyImg, player.x, player.y, "#ffb7a5");

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

function drawDogMarker(image, x, y, fallbackColor) {
  const cx = x * cell + cell / 2;
  const cy = y * cell + cell / 2;
  const radius = cell * 0.43;

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();

  if (image.complete && image.naturalWidth) {
    const scale = Math.max((radius * 2) / image.naturalWidth, (radius * 2) / image.naturalHeight);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    ctx.drawImage(image, cx - width / 2, cy - height / 2, width, height);
  } else {
    ctx.fillStyle = fallbackColor;
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
  }

  ctx.restore();

  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
}

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
