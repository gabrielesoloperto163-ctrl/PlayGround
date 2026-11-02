import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
const canvas=document.querySelector('#game'), scene=new THREE.Scene();
scene.background=new THREE.Color('#081522'); scene.fog=new THREE.FogExp2('#081522',.015);
const camera=new THREE.PerspectiveCamera(45,1,.1,180);
const renderer=new THREE.WebGLRenderer({canvas,antialias:false,alpha:false,powerPreference:'low-power'});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.25)); renderer.shadowMap.enabled=false; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.18; renderer.outputColorSpace=THREE.SRGBColorSpace;
scene.add(new THREE.HemisphereLight(0xbde9ff,0x112136,2.1));
const keyLight=new THREE.DirectionalLight(0xe5f5ff,3.25); keyLight.position.set(-7,24,11); keyLight.castShadow=false; scene.add(keyLight);
const FIELD_X=18,FIELD_Z=10.5,GOAL_HALF=3.2,BALL_R=.85;
const mat=(color,roughness=.65,metalness=.05,emissive=null)=>new THREE.MeshLambertMaterial({color,...(emissive?{emissive:new THREE.Color(emissive),emissiveIntensity:.65}:{})});
const materials={turf:mat('#183d4b',.93),turfAlt:mat('#1b4653',.95),line:mat('#a6d9df',.45,.05),wall:mat('#152b3c',.38,.32),dark:mat('#07111b',.42,.3),blue:mat('#178cc7',.3,.4,'#0873b0'),blueLight:mat('#56d5ff',.26,.15,'#2cbcf6'),orange:mat('#dd672a',.3,.4,'#a93c16'),orangeLight:mat('#ffad62',.26,.15,'#ff6c30'),tire:mat('#101a23',.95),glass:mat('#10293a',.2,.35),white:mat('#e7f2f7',.3,.25),ball:mat('#f3f5ef',.34,.12),black:mat('#222b33',.5,.1),glowBlue:new THREE.MeshBasicMaterial({color:'#3dc6ff'}),glowOrange:new THREE.MeshBasicMaterial({color:'#ff833d'})};
function mesh(geo,material,parent=scene){const o=new THREE.Mesh(geo,material);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
function box(parent,material,pos,size){const o=mesh(new THREE.BoxGeometry(...size),material,parent);o.position.set(...pos);return o}
function cylinder(parent,material,pos,r1,r2,h,segments=16){const o=mesh(new THREE.CylinderGeometry(r1,r2,h,segments),material,parent);o.position.set(...pos);return o}
// Arena floor, alternating turf, markings and perimeter.
mesh(new THREE.PlaneGeometry(200,200),mat('#091722',1)).rotation.x=-Math.PI/2;
const floor=mesh(new THREE.PlaneGeometry(FIELD_X*2,FIELD_Z*2),materials.turf);floor.rotation.x=-Math.PI/2;floor.position.y=.02;
for(let i=0;i<8;i++){const stripe=mesh(new THREE.PlaneGeometry(FIELD_X/4,FIELD_Z*2),materials.turfAlt);stripe.rotation.x=-Math.PI/2;stripe.position.set(-FIELD_X+FIELD_X/8+i*FIELD_X/4,.025,0)}
function groundLine(x,z,w,d,opacity=.65){const o=mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshBasicMaterial({color:'#c7e9e9',transparent:true,opacity,side:THREE.DoubleSide}));o.rotation.x=-Math.PI/2;o.position.set(x,.04,z);return o}
groundLine(0,0,.055,FIELD_Z*2);groundLine(0,0,FIELD_X*2,.055);groundLine(0,0,6.6,6.6);const centerRing=mesh(new THREE.RingGeometry(3.22,3.28,64),materials.line);centerRing.rotation.x=-Math.PI/2;centerRing.position.y=.045;
for(const x of [-FIELD_X,FIELD_X]){groundLine(x,0,.12,FIELD_Z*2);groundLine(x,0,.14,GOAL_HALF*2+1);for(const z of [-GOAL_HALF,GOAL_HALF])groundLine(x/2,z,FIELD_X,.07)}
// Transparent side boards, corner posts, glowing goal frames.
for(const z of [-FIELD_Z,FIELD_Z]){box(scene,materials.wall,[0,.65,z],[FIELD_X*2,.9,.28]);box(scene,materials.glass,[0,3.1,z],[FIELD_X*2,.035,.08]);for(let x=-15;x<=15;x+=5)cylinder(scene,materials.glowBlue,[x,1.75,z],.035,.035,2.2,8)}
for(const x of [-FIELD_X,FIELD_X]){box(scene,materials.wall,[x,.7,0],[.35,1.2,FIELD_Z*2]);for(const sign of [-1,1]){box(scene,materials.dark,[x,1.7,sign*(GOAL_HALF+1.5)],[.5,2.4,.4]);for(let y=0;y<3;y++)box(scene,x<0?materials.glowBlue:materials.glowOrange,[x,1.05+y*.53,sign*(GOAL_HALF+1.5)],[.56,.055,.46])}}
function makeGoal(x,colorMat){const g=new THREE.Group();scene.add(g);const back=x<0?-1:1,depth=3.3;const frameMat=colorMat;for(const z of [-GOAL_HALF,GOAL_HALF]){const p=box(g,frameMat,[x,1.65,z],[.2,3.3,.2]);p.material=frameMat}box(g,frameMat,[x,3.25,0],[.2,.2,GOAL_HALF*2]);for(let d=0;d<=depth;d+=.65){const xx=x+back*d;box(g,materials.glass,[xx,0.06,0],[.035,.04,GOAL_HALF*2]);box(g,materials.glass,[xx,1.65,-GOAL_HALF],[.035,3.2,.035]);box(g,materials.glass,[xx,1.65,GOAL_HALF],[.035,3.2,.035])}return g}
makeGoal(-FIELD_X,materials.blueLight);makeGoal(FIELD_X,materials.orangeLight);
// Four stadium towers and cool roof beams.
for(const x of [-20,20])for(const z of [-12,12]){box(scene,materials.dark,[x,5,z],[.4,10,.4]);const lamp=cylinder(scene,materials.white,[x,10.15,z],.34,.34,.15,12);lamp.material=new THREE.MeshBasicMaterial({color:'#e4f8ff'})}
for(const z of [-12,12])box(scene,materials.wall,[0,9,z],[40,.25,.25]);
// Center ball and angular panel seams.
const ballGroup=new THREE.Group();scene.add(ballGroup);const ballMesh=mesh(new THREE.SphereGeometry(BALL_R,32,24),materials.ball,ballGroup);
const ballWire=mesh(new THREE.IcosahedronGeometry(BALL_R*1.005,1),new THREE.MeshBasicMaterial({color:'#4b5961',wireframe:true,transparent:true,opacity:.36}),ballGroup);ballWire.castShadow=false;
const ballAccent=mesh(new THREE.IcosahedronGeometry(BALL_R*.48,1),materials.black,ballGroup);ballAccent.castShadow=false;
const boostClock=new THREE.Clock();
function makeCar(color,accent,name){const root=new THREE.Group();scene.add(root);const shell=new THREE.Group();root.add(shell);
const body=box(shell,color,[0,.58,0],[1.45,.48,2.25]);body.geometry=new THREE.BoxGeometry(1.45,.48,2.25);body.rotation.x=-.02;
const hood=box(shell,color,[0,.72,.69],[1.27,.23,.78]);hood.rotation.x=-.08;
const cabin=mesh(new THREE.BoxGeometry(1.05,.48,.88),materials.glass,shell);cabin.position.set(0,.94,-.12);cabin.rotation.x=.1;
box(shell,accent,[0,1.06,-.13],[.93,.035,.54]);box(shell,materials.dark,[0,.33,.2],[1.2,.15,1.3]);
for(const x of [-.78,.78])for(const z of [-.7,.72]){const wheel=mesh(new THREE.CylinderGeometry(.31,.31,.2,16),materials.tire,shell);wheel.rotation.z=Math.PI/2;wheel.position.set(x,.35,z);const hub=mesh(new THREE.CylinderGeometry(.15,.15,.21,12),accent,shell);hub.rotation.z=Math.PI/2;hub.position.set(x,.35,z)}
for(const x of [-.47,.47]){const head=mesh(new THREE.BoxGeometry(.24,.09,.04),materials.white,shell);head.position.set(x,.61,1.14);const tail=mesh(new THREE.BoxGeometry(.25,.09,.04),materials.orangeLight,shell);tail.position.set(x,.6,-1.14)}
const wing=box(shell,color,[0,.74,-.91],[1.65,.12,.32]);wing.rotation.x=.08;
const flameGroup=new THREE.Group();shell.add(flameGroup);for(const x of [-.38,.38]){const flame=mesh(new THREE.ConeGeometry(.15,.67,10),accent,flameGroup);flame.rotation.x=-Math.PI/2;flame.position.set(x,.54,-1.48)}flameGroup.visible=false;
const under=mesh(new THREE.PlaneGeometry(2.5,3.1),new THREE.MeshBasicMaterial({color:accent.color,transparent:true,opacity:.16,side:THREE.DoubleSide}),root);under.rotation.x=-Math.PI/2;under.position.y=.035;under.castShadow=false;
return {root,shell,flameGroup,velocity:new THREE.Vector3(),y:0,vy:0,yaw:color===materials.blue?Math.PI/2:-Math.PI/2,boost:100,name,color,grounded:true,turning:0,score:0,under};}
const player=makeCar(materials.blue,materials.blueLight,'BLUE COMET'),bot=makeCar(materials.orange,materials.orangeLight,'EMBER AI');
// Wheel sparks and ground dust are intentionally light-weight.
const ball={pos:new THREE.Vector3(0,BALL_R,0),vel:new THREE.Vector3(),spin:new THREE.Vector3()};
const $=s=>document.querySelector(s), playerScoreEl=$('#playerScore'),botScoreEl=$('#botScore'),clockEl=$('#clock'),statusPill=$('#statusPill'),statusText=$('#statusText');
const menu=$('#menuOverlay'),pauseLayer=$('#pauseOverlay'),endLayer=$('#endOverlay'),goalFlash=$('#goalFlash');
let mode='menu',countdown=3,matchTime=180,scorePause=0,lastTime=0,elapsed=0,muted=false;
const keys=new Set(),touch=new Set();
function resetPositions(){player.root.position.set(-10,.04,0);player.y=0;player.vy=0;player.velocity.set(0,0,0);player.yaw=Math.PI/2;player.boost=100;player.grounded=true;bot.root.position.set(10,.04,0);bot.y=0;bot.vy=0;bot.velocity.set(0,0,0);bot.yaw=-Math.PI/2;bot.boost=100;bot.grounded=true;ball.pos.set(0,BALL_R,0);ball.vel.set(0,0,0);ball.spin.set(0,0,0);}
resetPositions();
function newMatch(){player.score=0;bot.score=0;matchTime=180;playerScoreEl.textContent='0';botScoreEl.textContent='0';menu.classList.add('hidden');pauseLayer.classList.add('hidden');endLayer.classList.add('hidden');mode='countdown';countdown=3;resetPositions();}
function pause(){if(mode==='playing'||mode==='countdown'){mode='paused';pauseLayer.classList.remove('hidden')}else if(mode==='paused'){mode='playing';pauseLayer.classList.add('hidden')}}
$('#playButton').addEventListener('click',newMatch);$('#rematchButton').addEventListener('click',newMatch);$('#pauseButton').addEventListener('click',pause);$('#resumeButton').addEventListener('click',pause);$('#restartButton').addEventListener('click',newMatch);
$('#soundButton').addEventListener('click',()=>{muted=!muted;$('#soundButton').querySelector('.sound-label').textContent=muted?'SOUND OFF':'SOUND ON';$('#soundButton').querySelector('.sound-icon').textContent=muted?'◌':'♪'});
window.addEventListener('keydown',e=>{if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.code==='Escape'||e.code==='KeyP')pause();if(e.code==='KeyR'&&mode!=='menu')newMatch()});window.addEventListener('keyup',e=>keys.delete(e.code));
for(const button of document.querySelectorAll('[data-control]')){const name=button.dataset.control;const down=e=>{e.preventDefault();touch.add(name);button.classList.add('active');button.setPointerCapture?.(e.pointerId)};const up=e=>{e.preventDefault();touch.delete(name);button.classList.remove('active')};button.addEventListener('pointerdown',down);button.addEventListener('pointerup',up);button.addEventListener('pointercancel',up);button.addEventListener('lostpointercapture',up)}
const input={};function readInput(){input.forward=keys.has('KeyW')||keys.has('ArrowUp')||touch.has('up');input.reverse=keys.has('KeyS')||keys.has('ArrowDown')||touch.has('down');input.left=keys.has('KeyA')||keys.has('ArrowLeft')||touch.has('left');input.right=keys.has('KeyD')||keys.has('ArrowRight')||touch.has('right');input.boost=keys.has('ShiftLeft')||keys.has('ShiftRight')||touch.has('boost');input.jump=keys.has('Space')||touch.has('jump')}
function driveCar(car,dt,controls,isBot=false){const throttle=controls.forward?1:controls.reverse?-.7:0;const speed=car.velocity.length();const steer=(controls.right?1:0)-(controls.left?1:0);const steerScale=.48+Math.min(speed/12,1)*.52;car.yaw-=steer*2.35*steerScale*dt*Math.sign(car.velocity.dot(new THREE.Vector3(Math.sin(car.yaw),0,Math.cos(car.yaw)))||1);
const forward=new THREE.Vector3(Math.sin(car.yaw),0,Math.cos(car.yaw));let boosting=controls.boost&&car.boost>0&&throttle>=0;
if(throttle){car.velocity.addScaledVector(forward,throttle*(boosting?18:10)*dt)}
if(boosting){car.velocity.addScaledVector(forward,20*dt);car.boost=Math.max(0,car.boost-31*dt)}else car.boost=Math.min(100,car.boost+(isBot?9:7)*dt);
car.velocity.multiplyScalar(Math.exp(-(throttle?.68:1.75)*dt));const maxSpeed=boosting?22:14;if(car.velocity.length()>maxSpeed)car.velocity.setLength(maxSpeed);
car.root.position.x+=car.velocity.x*dt;car.root.position.z+=car.velocity.z*dt;
if(controls.jump&&car.grounded){car.vy=8.5;car.grounded=false}car.vy-=22*dt;car.y+=car.vy*dt;if(car.y<0){car.y=0;car.vy=0;car.grounded=true}
car.root.position.y=car.y+.04;car.root.rotation.y=car.yaw;car.shell.rotation.z=THREE.MathUtils.damp(car.shell.rotation.z,-steer*.12,.9,dt);car.shell.rotation.x=THREE.MathUtils.damp(car.shell.rotation.x,throttle*.025,.8,dt);car.flameGroup.visible=boosting;car.under.material.opacity=boosting?.29:.13;
const side=FIELD_Z-.9;if(car.root.position.z>side){car.root.position.z=side;car.velocity.z*=-.42}if(car.root.position.z< -side){car.root.position.z=-side;car.velocity.z*=-.42}
const end=FIELD_X-1.1;if(Math.abs(car.root.position.x)>end){car.root.position.x=Math.sign(car.root.position.x)*end;car.velocity.x*=-.35}
}
function botControls(){const dx=ball.pos.x-bot.root.position.x,dz=ball.pos.z-bot.root.position.z;let tx=ball.pos.x, tz=ball.pos.z;
// Approach from behind the ball, lining up a shot toward the player's goal.
if(ball.pos.x<bot.root.position.x+1.4){tx=ball.pos.x+2.3;tz=ball.pos.z*.78}
const desired=Math.atan2(tx-bot.root.position.x,tz-bot.root.position.z);let diff=((desired-bot.yaw+Math.PI*3)%(Math.PI*2))-Math.PI;
const forward=diff>-1.2&&diff<1.2;return {left:diff<-.12,right:diff>.12,forward,reverse:!forward&&Math.abs(diff)>2.35,boost:Math.abs(diff)<.45&&Math.hypot(dx,dz)>5&&bot.boost>24,jump:ball.pos.y>2.3&&Math.hypot(dx,dz)<3.2}}
function collideCarBall(car){const center=new THREE.Vector3(car.root.position.x,car.y+.58,car.root.position.z),delta=ball.pos.clone().sub(center);const dist=delta.length(),radius=1.65;if(dist>=radius)return;delta.y+=.08;delta.normalize();const forward=new THREE.Vector3(Math.sin(car.yaw),0,Math.cos(car.yaw));const impact=Math.max(5,car.velocity.length()+4.5);ball.pos.addScaledVector(delta,radius-dist+.035);ball.vel.addScaledVector(delta,impact);ball.vel.addScaledVector(forward,4.2);ball.vel.y=Math.max(ball.vel.y,2.4+car.y*1.25);car.velocity.addScaledVector(forward,-.6);if(car.boost>0&&car.flameGroup.visible)ball.vel.addScaledVector(forward,5)}
function updateBall(dt){ball.vel.y-=13.8*dt;ball.pos.addScaledVector(ball.vel,dt);ball.vel.multiplyScalar(Math.exp(-.16*dt));ball.spin.x+=ball.vel.z*dt;ball.spin.z-=ball.vel.x*dt;
if(ball.pos.y<BALL_R){ball.pos.y=BALL_R;if(ball.vel.y<0)ball.vel.y*=-.68;ball.vel.x*=.992;ball.vel.z*=.992;if(Math.abs(ball.vel.y)<.45)ball.vel.y=0}
const wallZ=FIELD_Z-BALL_R;if(ball.pos.z>wallZ){ball.pos.z=wallZ;ball.vel.z=-Math.abs(ball.vel.z)*.73}if(ball.pos.z< -wallZ){ball.pos.z=-wallZ;ball.vel.z=Math.abs(ball.vel.z)*.73}
const end=FIELD_X+1.2;if(Math.abs(ball.pos.x)>end){const goal=Math.abs(ball.pos.x)>FIELD_X&&Math.abs(ball.pos.z)<GOAL_HALF&&ball.pos.y<3.25;if(goal){scoreGoal(ball.pos.x>0?'player':'bot');return}ball.pos.x=Math.sign(ball.pos.x)*end;ball.vel.x=-Math.sign(ball.pos.x)*Math.abs(ball.vel.x)*.72}
ball.vel.clampLength(0,27);ballGroup.position.copy(ball.pos);ballGroup.rotation.set(ball.spin.x,elapsed*.3,ball.spin.z);
}
function scoreGoal(who){if(mode!=='playing')return;if(who==='player'){player.score++;playerScoreEl.textContent=player.score}else{bot.score++;botScoreEl.textContent=bot.score}
const blue=who==='player';$('#goalScorer').textContent=blue?'BLUE COMET SCORES':'EMBER AI SCORES';$('#goalScorer').style.color=blue?'var(--blue)':'var(--orange)';goalFlash.classList.remove('show');void goalFlash.offsetWidth;goalFlash.classList.add('show');mode='goal';scorePause=2.2;countdown=3;
if(player.score>=3||bot.score>=3){setTimeout(()=>finish(who),1200)}else{resetPositions()}}
function finish(who){if(mode==='ended')return;mode='ended';$('#endTitle').innerHTML=who==='player'?'YOU DID<br><em>IT.</em>':'NICE<br><em>TRY.</em>';$('#endSubtitle').textContent=who==='player'?'The arena is yours. The bot never stood a chance.':'The machine takes this one. Run it back?';endLayer.classList.remove('hidden')}
function updateUI(dt){const inMatch=['countdown','playing','goal'].includes(mode);document.querySelector('.game-shell').classList.toggle('match-active',inMatch);document.querySelector('.touch-controls').style.display=inMatch?'':'none';if(mode==='playing'){matchTime=Math.max(0,matchTime-dt);if(matchTime===0){finish(player.score>bot.score?'player':'bot')}}const m=Math.floor(matchTime/60),s=Math.floor(matchTime%60);clockEl.textContent=`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
statusPill.style.opacity=mode==='playing'||mode==='menu'?'0':'1';if(mode==='countdown'){statusText.innerHTML=`KICKOFF IN <b>${Math.ceil(countdown)}</b>`}else if(mode==='goal'){statusText.innerHTML='GOAL! RESETTING'}else if(mode==='paused'){statusText.innerHTML='MATCH PAUSED'}else if(mode==='ended'){statusText.innerHTML='FINAL WHISTLE'}else statusText.innerHTML='MATCH LIVE';
$('#boostText').textContent=Math.round(player.boost);$('#boostFill').style.width=`${player.boost}%`;document.querySelectorAll('.boost-cells i').forEach((el,i)=>el.classList.toggle('active',player.boost>i*10));$('#speedValue').textContent=String(Math.round(player.velocity.length()*10)).padStart(3,'0')}
function resize(){const w=window.innerWidth,h=window.innerHeight,aspect=w/h;renderer.setSize(w,h,false);camera.aspect=aspect;camera.fov=aspect<.9?76:45;camera.updateProjectionMatrix();}
window.addEventListener('resize',resize);resize();
const lookTarget=new THREE.Vector3();
function animate(now){requestAnimationFrame(animate);const dt=Math.min(.12,(now-lastTime)/1000||.016);lastTime=now;elapsed+=dt;readInput();
if(mode==='countdown'){countdown-=dt;if(countdown<=0){mode='playing';countdown=0}}
if(mode==='goal'){scorePause-=dt;if(scorePause<=0&&player.score<3&&bot.score<3){mode='countdown';countdown=3}}
if(mode==='playing'){driveCar(player,dt,input);driveCar(bot,dt,botControls(),true);collideCarBall(player);collideCarBall(bot);updateBall(dt)}
else if(mode==='menu'){player.root.position.x=-8+Math.sin(elapsed*.35)*1.2;player.yaw=Math.PI/2+Math.sin(elapsed*.23)*.08;player.root.rotation.y=player.yaw;bot.root.position.x=8+Math.sin(elapsed*.3)*.8;bot.yaw=-Math.PI/2;bot.root.rotation.y=bot.yaw;ball.pos.set(Math.sin(elapsed*.46)*1.5,BALL_R+.12+Math.sin(elapsed*1.7)*.12,Math.cos(elapsed*.46)*1.3);ballGroup.position.copy(ball.pos);ballGroup.rotation.y=elapsed*.35}
updateUI(dt);const aspect=window.innerWidth/window.innerHeight;const zoom=aspect<.9?45:33;const centerX=mode==='playing'?THREE.MathUtils.clamp((player.root.position.x+ball.pos.x)*.12,-2.5,2.5):0;const centerZ=mode==='playing'?THREE.MathUtils.clamp((player.root.position.z+ball.pos.z)*.11,-2.2,2.2):0;
lookTarget.set(centerX,0,centerZ);const desiredCamera=new THREE.Vector3(centerX,zoom*.68,zoom*.83);camera.position.lerp(desiredCamera,1-Math.exp(-dt*1.5));camera.lookAt(lookTarget);
renderer.render(scene,camera)}
requestAnimationFrame(animate);
