import * as THREE from 'three';

const $ = id => document.getElementById(id);
const canvas = $('game');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x101f23);
scene.fog = new THREE.FogExp2(0x101f23, 0.016);
const camera = new THREE.PerspectiveCamera(73, innerWidth / innerHeight, 0.1, 100);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7)); renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.18;
scene.add(new THREE.HemisphereLight(0xb9e8e4, 0x18272a, 1.8));
const keyLight = new THREE.DirectionalLight(0xd8f7db, 2.5); keyLight.position.set(-7, 17, 7); keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024); keyLight.shadow.camera.left = -27; keyLight.shadow.camera.right = 27; keyLight.shadow.camera.top = 24; keyLight.shadow.camera.bottom = -24; keyLight.shadow.bias = -0.0005; scene.add(keyLight);
const fillLight = new THREE.PointLight(0x36aaa9, 36, 34); fillLight.position.set(1, 5, 0); scene.add(fillLight);
const mat = (color, roughness=.78, metalness=.05, emissive=0x000000) => new THREE.MeshStandardMaterial({color,roughness,metalness,emissive,emissiveIntensity:.7});
const floorMat=mat(0x25383b,.94), wallMat=mat(0x33474a,.86), trimMat=mat(0x6a8583,.64,.25), darkMat=mat(0x142427,.85,.12), acidMat=mat(0xd5f55b,.38,.08,0x354411);
const cyanGlow=new THREE.MeshStandardMaterial({color:0x71e9e1,emissive:0x1a7772,emissiveIntensity:1.6,roughness:.35});
const redGlow=new THREE.MeshStandardMaterial({color:0xff6a5e,emissive:0x721711,emissiveIntensity:1.4,roughness:.4});
function box(parent,name,size,position,material,options={}){const m=new THREE.Mesh(new THREE.BoxGeometry(...size),material);m.name=name;m.position.set(...position);m.castShadow=options.castShadow??true;m.receiveShadow=true;parent.add(m);return m;}
function cylinder(parent,r1,r2,h,position,material,segments=16){const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,segments),material);m.position.set(...position);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function buildWorld(){
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(48,34),floorMat);floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
 const grid=new THREE.GridHelper(48,48,0x58716e,0x405655);grid.position.y=.012;grid.material.opacity=.24;grid.material.transparent=true;scene.add(grid);
 // Framed perimeter with open airlock entrances.
 for(const [x,z,sx,sz] of [[-24,0,.7,34],[24,0,.7,34]]){box(scene,'Hull',[sx,5,sz],[x,2.5,z],wallMat);box(scene,'Hull trim',[sx+.03,.14,sz],[x,4.7,z],trimMat);}
 for(const [z,x,sx] of [[-17,0,48],[17,0,48]]){box(scene,'Hull',[sx,5,.7],[x,2.5,z],wallMat);box(scene,'Hull trim',[sx,.14,.72],[x,4.7,z],trimMat);}
 // Structural ribs and cover, leaving generous lanes through the arena.
 for(const [x,z] of [[-20,-13],[-12,-13],[-4,-13],[4,-13],[12,-13],[20,-13],[-20,13],[-12,13],[-4,13],[4,13],[12,13],[20,13]]){box(scene,'Rib',[.16,4.3,.28],[x,2.15,z],trimMat);}
 for(const [x,z,sx,sz] of [[-8,-4,5,.55],[8,4,5,.55],[-13,3,.55,4],[13,-3,.55,4],[-3,8,4,.5],[3,-8,4,.5]]){
   box(scene,'Cover',[sx,1.35,sz],[x,.68,z],darkMat);box(scene,'Cover edge',[sx,.09,sz],[x,1.33,z],trimMat);
   for(let i=-1;i<=1;i++)box(scene,'Marking',[.08,.015,.25],[x+i*.22,1.39,z],acidMat,{castShadow:false});
 }
 // Airlock and ceiling light strips.
 for(const [x,z] of [[-18,0],[18,0],[0,-12],[0,12]]){
  const lamp=box(scene,'Ceiling lamp',[2.2,.08,.28],[x,4.86,z],cyanGlow,{castShadow:false});
  const light=new THREE.PointLight(0x5be3dd,8,11);light.position.set(x,3.8,z);scene.add(light);
 }
 // Tactical stations, each with a luminous, unmistakable terminal.
 const stationData=[
  {id:'flight',name:'FLIGHT DATA',label:'UPLOAD FLIGHT DATA',position:new THREE.Vector3(-15,0,-8),color:0x5be3dd},
  {id:'reactor',name:'REACTOR CORE',label:'STABILIZE THE REACTOR',position:new THREE.Vector3(14,0,-8),color:0xd5f55b},
  {id:'comms',name:'COMMS ARRAY',label:'RESTORE SHIP COMMS',position:new THREE.Vector3(0,0,9),color:0xff9f58}
 ];
 const tasks=[];
 for(const data of stationData){
  const group=new THREE.Group();group.position.copy(data.position);scene.add(group);data.group=group;data.done=false;data.mesh=group;
  cylinder(group,1.38,1.55,.18,[0,.1,0],darkMat,24);cylinder(group,1.18,1.2,.1,[0,.23,0],trimMat,24);
  box(group,'terminal base',[.8,.9,.55],[0,.68,-.45],wallMat);
  const screenMat=new THREE.MeshStandardMaterial({color:data.color,emissive:data.color,emissiveIntensity:1.8,roughness:.3});
  const screen=box(group,'terminal screen',[.68,.46,.035],[0,1.15,-.15],screenMat,{castShadow:false});screen.rotation.x=-.14;
  box(group,'terminal foot',[.95,.07,.68],[0,.35,-.4],darkMat);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(1.05,.035,8,48),new THREE.MeshBasicMaterial({color:data.color,transparent:true,opacity:.65}));ring.rotation.x=Math.PI/2;ring.position.y=.32;group.add(ring);data.ring=ring;
  const beacon=cylinder(group,.075,.075,.5,[0,1.7,-.45],screenMat,10);data.beacon=beacon;
  const light=new THREE.PointLight(data.color,5,5);light.position.set(0,1.5,0);group.add(light);
  tasks.push(data);
 }
 // Scatter small service panels and floor lights to make the facility feel occupied.
 for(let x=-20;x<=20;x+=4){const strip=box(scene,'Floor guide',[.035,.018,1.2],[x,.025,0],(x%8===0)?acidMat:trimMat,{castShadow:false});}
 for(const [x,z] of [[-21,-9],[21,9],[-8,10],[8,-10]]){
  box(scene,'Cargo crate',[1.1,1.45,1.1],[x,.72,z],mat(0x304448,.9,.13));
  box(scene,'Crate band',[1.12,.08,1.13],[x,1.3,z],trimMat);
 }
 return tasks;
}
const tasks=buildWorld();
const palette=[0xef5b51,0x49d4cb,0xe8c75e,0x9c7ce8,0xf28a43,0x75b9f1,0x9edb64];
const names=['RUST','KITE','MOSS','VOLT','NOVA','PATCH','ECHO'];
const player={position:new THREE.Vector3(0,0,11),yaw:0,pitch:0,speed:5.2};
const clock=new THREE.Clock();const raycaster=new THREE.Raycaster();raycaster.far=25;
let bots=[],bodies=[],impostor=null,playerBot=null,playerRole='crew',gameState='menu',remaining=120,completed=0,killCount=0,meetingUsed=false,meetingTimer=0,selectedVote=null,actionCooldown=0,blackout=0,progressTask=null,progressTime=0,toastTimer=0,bannerTimer=0,mouseLocked=false;
const keys={};
function makeAstronaut(color,name,isPlayer=false){
 const root=new THREE.Group();root.userData.bot=null;
 const suit=mat(color,.48,.12),dark=mat(0x202c30,.55,.18),visor=new THREE.MeshStandardMaterial({color:0x8bd7df,roughness:.2,metalness:.45,emissive:0x17404a,emissiveIntensity:.55});
 const body=new THREE.Mesh(new THREE.CapsuleGeometry(.43,.58,5,10),suit);body.position.y=1.02;body.castShadow=true;body.receiveShadow=true;root.add(body);
 const pack=new THREE.Mesh(new THREE.BoxGeometry(.32,.54,.27),dark);pack.position.set(0,1.13,.37);pack.castShadow=true;root.add(pack);
 const glass=new THREE.Mesh(new THREE.BoxGeometry(.54,.32,.15),visor);glass.position.set(0,1.27,-.36);glass.castShadow=true;root.add(glass);
 const legGeo=new THREE.CapsuleGeometry(.14,.28,3,7);
 for(const x of [-.22,.22]){const leg=new THREE.Mesh(legGeo,suit);leg.position.set(x,.34,0);leg.castShadow=true;root.add(leg);}
 const shine=new THREE.Mesh(new THREE.SphereGeometry(.055,8,8),new THREE.MeshBasicMaterial({color:0xffffff}));shine.position.set(.13,1.36,-.45);root.add(shine);
 root.position.y=0;root.userData.name=name;root.userData.color=color;root.userData.legs=root.children.slice(3,5);root.userData.body=body;
 if(isPlayer){const point=new THREE.Group();point.position.set(0,1.6,0);root.add(point);}
 return root;
}
function makeBots(){
 const chosen=Math.floor(Math.random()*6);playerRole=chosen===0?'impostor':'crew';
 const all=[];
 for(let i=0;i<6;i++){
  const index=i===0?0:i;const bot={id:i,name:names[index],color:palette[index],role:(i===chosen?'impostor':'crew'),alive:true,kills:0,target:null,moveTarget:null,killCooldown:5+Math.random()*5,accusation:0,group:makeAstronaut(palette[index],names[index]),taskWait:0};
  bot.group.userData.bot=bot;bot.group.position.set(i===0?0:(Math.random()-.5)*18,0,i===0?11:(Math.random()-.5)*12);bot.moveTarget=randomWalkPoint();bot.group.rotation.y=Math.random()*Math.PI*2;scene.add(bot.group);all.push(bot);
 }
 const p=all[0];p.isPlayer=true;p.group.position.set(0,0,11);p.group.visible=false;player.position.set(0,0,11);playerBot=p;
 bots=all.slice(1);impostor=all[chosen];return all;
}
function randomWalkPoint(){return new THREE.Vector3((Math.random()-.5)*34,0,(Math.random()-.5)*23);}
function setToast(text){const el=$('toast');el.textContent=text;el.classList.add('show');toastTimer=2.1;}
function showBanner(text){$('banner-text').textContent=text;$('objective-banner').classList.add('show');bannerTimer=2;}
function updateTaskList(){
 $('task-count').textContent=`${String(completed).padStart(2,'0')} / 03`;
 $('task-list').innerHTML=tasks.map(t=>`<div class="task-row ${t.done?'done':''}"><span class="task-check">${t.done?'✓':''}</span><span>${t.label}</span></div>`).join('');
 $('mission-status').textContent=completed===3?'EXTRACTION WINDOW OPEN':'UPLOAD THE FLIGHT DATA';
}
function startRound(){
 bots.forEach(b=>scene.remove(b.group));bodies.forEach(b=>scene.remove(b.group));bots=[];bodies=[];
 tasks.forEach(task=>task.done=false);
 completed=0;remaining=120;killCount=0;meetingUsed=false;blackout=0;progressTask=null;progressTime=0;actionCooldown=0;
 scene.fog.density=.016;scene.background.set(0x101f23);$('round-state').classList.remove('alert');$('round-state').lastElementChild.textContent='NO CONTACT';
 $('start-screen').classList.remove('visible');$('result-screen').classList.remove('visible');$('pause-screen').classList.remove('visible');$('meeting-screen').classList.remove('visible');$('hud').classList.remove('hidden');
 makeBots();updateTaskList();remaining=120;gameState='playing';
 const imp=playerRole==='impostor';$('role-chip').textContent=imp?'IMPOSTOR':'CREW';$('role-chip').classList.toggle('impostor',imp);
 $('weapon-name').textContent=imp?'TACTICAL KNIFE':'MK.4 SIDEARM';$('weapon-status').textContent=imp?'MELEE · CLOSE RANGE':'SEMI-AUTO · UNLIMITED';$('weapon-key').textContent=imp?'F':'LMB';
 $('ability-title').textContent=imp?'SABOTAGE':'EMERGENCY';$('ability-caption').innerHTML=imp?'LIGHTS OUT <kbd>G</kbd>':'CALL MEETING <kbd>Q</kbd>';$('ability-symbol').textContent=imp?'⌁':'◉';
 $('status-line').textContent=imp?'BLEND IN. FIND A TARGET.':'READY FOR DEPLOYMENT';
 $('emergency-button').disabled=false;$('emergency-button').classList.toggle('hidden',imp);$('report-button').disabled=false;
 if(!isMobile())canvas.requestPointerLock?.();setToast(imp?'You are the impostor. Blend in, then strike.':'You are crew. Find the traitor and finish the objectives.');
}
function isMobile(){return matchMedia('(pointer:coarse)').matches||innerWidth<700;}
function nearestTask(){let best=null,dist=2.65;for(const t of tasks){if(t.done)continue;const d=player.position.distanceTo(t.position);if(d<dist){best=t;dist=d;}}return best;}
function nearestBody(){let best=null,dist=2.9;for(const b of bodies){if(b.reported)continue;const d=player.position.distanceTo(b.position);if(d<dist){best=b;dist=d;}}return best;}
function nearestBot(range=2.4){let best=null,dist=range;for(const b of bots){if(!b.alive)continue;const d=player.position.distanceTo(b.group.position);if(d<dist){best=b;dist=d;}}return best;}
function interact(){
 if(gameState!=='playing')return;
 const body=nearestBody();if(body){startMeeting(body);return;}
 const task=nearestTask();
 if(task){if(playerRole==='impostor'){setToast('Fake task logged. Keep moving.');return;}if(!progressTask){progressTask=task;progressTime=0;setToast(`${task.label} — HOLD POSITION`);}return;}
 setToast('No active objective in range.');
}
function reportBody(){if(gameState!=='playing')return;const b=nearestBody();if(b){b.reported=true;startMeeting(b);}else setToast('No body in reporting range.');}
function callEmergency(){if(gameState!=='playing')return;if(meetingUsed){setToast('Emergency call already used this round.');return;}meetingUsed=true;$('emergency-button').disabled=true;startMeeting(null);}
function startMeeting(body){
 if(gameState!=='playing')return;gameState='meeting';progressTask=null;selectedVote=null;meetingTimer=0;
 $('meeting-source').textContent=body?'BODY REPORTED':'EMERGENCY CALL';$('meeting-subtitle').textContent=body?`${body.victim.name} was found. Somebody here knows more.`:'One shot to eject the right suspect.';
 const all=[...bots.filter(b=>b.alive),{id:-1,name:'YOU',color:palette[0],alive:true,isPlayer:true}];
 $('vote-grid').innerHTML=all.map(b=>`<button class="vote-option" data-vote="${b.id}" style="--vote-color:#${b.color.toString(16).padStart(6,'0')}"><span class="vote-avatar" style="background:var(--vote-color)">✦</span><span class="vote-info"><b>${b.name}${b.isPlayer?' (YOU)':''}</b><small>${b.isPlayer?'OPERATIVE':'CREW MEMBER'}</small></span></button>`).join('');
 document.querySelectorAll('.vote-option').forEach(el=>el.addEventListener('click',()=>{selectedVote=Number(el.dataset.vote);document.querySelectorAll('.vote-option').forEach(x=>x.classList.toggle('selected',x===el));$('vote-button').disabled=false;}));
 $('vote-button').disabled=true;$('meeting-screen').classList.add('visible');document.exitPointerLock?.();
}
function castVote(){
 if(selectedVote===null||gameState!=='meeting')return;
 const attendees=[...bots.filter(b=>b.alive),{id:-1,name:'YOU',role:playerRole,isPlayer:true,alive:true}];
 const playerTarget=attendees.find(v=>v.id===selectedVote);
 if(!playerTarget)return;
 const tally=new Map(attendees.map(v=>[v.id,0]));
 tally.set(selectedVote,1);
 // Bots have imperfect reads, but a player who has been caught shooting crew draws suspicion.
 for(const b of bots){
  if(!b.alive)continue;
  const options=attendees.filter(v=>v.id!==b.id);
  if(!options.length)continue;
  const suspectChance=playerTarget.role==='impostor'?.72:.22;
  const chance=Math.min(.92,suspectChance+(b.accusation>0?.15:0));
  let choice;
  if(Math.random()<chance)choice=playerTarget;
  else{const alternatives=options.filter(v=>v.id!==playerTarget.id);choice=alternatives.length?alternatives[Math.floor(Math.random()*alternatives.length)]:playerTarget;}
  tally.set(choice.id,(tally.get(choice.id)||0)+1);
 }
 const high=Math.max(...tally.values());
 const leaders=attendees.filter(v=>tally.get(v.id)===high);
 $('meeting-screen').classList.remove('visible');
 if(leaders.length!==1){gameState='playing';setToast('Vote tied. No one was ejected.');return;}
 const target=leaders[0];
 if(target.role==='impostor'){
  if(target.isPlayer)finishRound(true,'You were voted out. The crew caught the impostor.');
  else{target.alive=false;target.group.visible=false;finishRound(true,`${target.name} was the impostor. The crew secured the ship.`);}
  return;
 }
 if(target.isPlayer){finishRound(false,'The crew voted you out. The impostor escaped.');return;}
 target.alive=false;target.group.visible=false;gameState='playing';
 setToast(`${target.name} was ejected. They were crew.`);
 const livingCrew=bots.filter(b=>b.alive&&b.role==='crew').length+(playerRole==='crew'?1:0);
 if(playerRole==='impostor'&&livingCrew<=1)finishRound(false,'The crew voted out its last ally. The ship is yours.');
}
function shoot(){
 if(gameState!=='playing'||playerRole==='impostor'||actionCooldown>0)return;actionCooldown=.32;
 camera.getWorldDirection(raycaster.ray.direction);raycaster.ray.origin.copy(camera.position);
 const targets=bots.filter(b=>b.alive).map(b=>b.group);const hits=raycaster.intersectObjects(targets,true);
 if(!hits.length){setToast('MISS — keep your sights up.');return;}
 let obj=hits[0].object;while(obj&&!obj.userData.bot)obj=obj.parent;const bot=obj?.userData.bot;
 if(!bot)return;
 if(bot===impostor){bot.alive=false;bot.group.visible=false;finishRound(true,`${bot.name} was the impostor. Clean shot, operative.`);}
 else {bot.accusation++;setToast(`${bot.name} is crew. Watch your fire.`);$('damage-flash').style.opacity='.16';setTimeout(()=>$('damage-flash').style.opacity='0',110);}
}
function knife(){
 if(gameState!=='playing'||playerRole!=='impostor'||actionCooldown>0)return;actionCooldown=1.1;
 const target=nearestBot(2.2);if(!target){setToast('Too far. Close the gap to strike.');return;}
 target.alive=false;target.group.visible=false;killCount++;spawnBody(target);$('damage-flash').style.opacity='.2';setTimeout(()=>$('damage-flash').style.opacity='0',140);setToast(`${target.name} eliminated. Move.`);
 if(bots.filter(b=>b.alive&&b!==impostor).length<=1||killCount>=4)finishRound(false,'The crew was eliminated. The ship is yours.');
}
function spawnBody(victim){
 const g=new THREE.Group();const corpse=makeAstronaut(victim.color,victim.name);corpse.rotation.z=Math.PI/2;corpse.scale.set(.78,.78,.78);corpse.position.y=.23;g.add(corpse);
 const marker=new THREE.Mesh(new THREE.CircleGeometry(.7,28),new THREE.MeshBasicMaterial({color:0xe7564e,transparent:true,opacity:.2,side:THREE.DoubleSide}));marker.rotation.x=-Math.PI/2;marker.position.y=.025;g.add(marker);
 g.position.copy(victim.group.position);scene.add(g);bodies.push({group:g,position:g.position,victim,reported:false});
}
function sabotage(){if(gameState!=='playing'||playerRole!=='impostor')return;if(blackout>0){setToast('Sabotage is recharging.');return;}blackout=13;scene.fog.density=.04;scene.background.set(0x080d12);setToast('LIGHTS OUT — use the confusion.');$('round-state').classList.add('alert');$('round-state').lastElementChild.textContent='LIGHTS SABOTAGED';}
function finishRound(crewWon,copy){
 if(gameState==='won'||gameState==='lost')return;gameState=crewWon?'won':'lost';document.exitPointerLock?.();
 $('meeting-screen').classList.remove('visible');$('pause-screen').classList.remove('visible');$('result-screen').classList.add('visible');
 $('result-icon').textContent=crewWon?'✦':'✕';$('result-icon').style.color=crewWon?'var(--acid)':'var(--red)';
 $('result-kicker').textContent=crewWon?'MISSION SUCCESS':'MISSION FAILED';$('result-title').innerHTML=crewWon?'CREW<br /><em>SECURED.</em>':'SHIP<br /><em>COMPROMISED.</em>';
 $('result-copy').textContent=copy;$('stat-objectives').textContent=`${completed}/3`;$('stat-survivors').textContent=String(bots.filter(b=>b.alive&&b!==impostor).length);$('stat-time').textContent=formatTime(remaining);
 $('result-role').textContent=`YOU WERE ${playerRole.toUpperCase()} · IMPOSTOR: ${impostor.name}`;
}
function formatTime(seconds){const s=Math.max(0,Math.ceil(seconds));return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;}
function clampPlayer(){
 player.position.x=THREE.MathUtils.clamp(player.position.x,-22.3,22.3);player.position.z=THREE.MathUtils.clamp(player.position.z,-15.3,15.3);
 const obstacles=[[-8,-4,2.7,.72],[8,4,2.7,.72],[-13,3,.72,2.5],[13,-3,.72,2.5],[-3,8,2.3,.7],[3,-8,2.3,.7],[-21,-9,.8,.8],[21,9,.8,.8],[-8,10,.8,.8],[8,-10,.8,.8]];
 for(const [x,z,hx,hz] of obstacles){if(Math.abs(player.position.x-x)<hx&&Math.abs(player.position.z-z)<hz){const dx=player.position.x-x,dz=player.position.z-z;if(Math.abs(dx/hx)>Math.abs(dz/hz))player.position.x=x+Math.sign(dx||1)*(hx+.04);else player.position.z=z+Math.sign(dz||1)*(hz+.04);}}
}
function updatePlayer(dt){
 if(gameState!=='playing')return;
 let forward=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0),side=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);
 forward+=touchMove.y;side+=touchMove.x;
 const mag=Math.hypot(forward,side);if(mag>1){forward/=mag;side/=mag;}
 const speed=keys.ShiftLeft||keys.ShiftRight?7.4:5.2;
 const dx=Math.sin(player.yaw)*forward+Math.cos(player.yaw)*side,dz=-Math.cos(player.yaw)*forward+Math.sin(player.yaw)*side;
 player.position.x+=dx*speed*dt;player.position.z+=dz*speed*dt;clampPlayer();
 camera.position.set(player.position.x,1.66,player.position.z);camera.rotation.order='YXZ';camera.rotation.y=player.yaw;camera.rotation.x=player.pitch;
 if(playerBot)playerBot.group.position.copy(player.position);
 const task=nearestTask();const body=nearestBody();const target=nearestBot(7);
 const prompt=$('interact-prompt');
 if(body){prompt.classList.remove('hidden');prompt.innerHTML='<kbd>E</kbd><span>REPORT BODY</span>';}
 else if(task&&playerRole==='crew'){prompt.classList.remove('hidden');prompt.innerHTML=`<kbd>E</kbd><span>${progressTask===task?'UPLOADING…':task.label}</span>`;}
 else prompt.classList.add('hidden');
 const label=$('target-label');if(target){label.textContent=`${target.name} · ${target.group.position.distanceTo(player.position).toFixed(1)}m`;label.style.color=target===impostor?'#f35e55':'#d5f55b';}else label.textContent='';
 if(progressTask){if(player.position.distanceTo(progressTask.position)>3.4){progressTask=null;progressTime=0;setToast('Objective interrupted.');}
  else{progressTime+=dt;if(progressTime>=2.6){progressTask.done=true;completed++;const finished=progressTask;progressTask=null;progressTime=0;updateTaskList();showBanner(`${finished.name} COMPLETE`);if(completed>=3){finishRound(true,'All ship objectives are complete. Extraction secured.');return;}}}}
}
function updateBots(dt){
 for(const b of bots){if(!b.alive)continue;b.killCooldown-=dt;b.taskWait-=dt;
  if(b===impostor){
   let prey=null,dist=100;
   if(playerRole==='crew'){const d=b.group.position.distanceTo(player.position);if(d<dist){dist=d;prey=playerBot;}}
   for(const c of bots){if(c===b||!c.alive||c.role==='impostor')continue;const d=b.group.position.distanceTo(c.group.position);if(d<dist){dist=d;prey=c;}}
   if(prey&&dist<10)b.moveTarget=prey.group.position.clone();
   if(prey&&dist<1.6&&b.killCooldown<=0){b.killCooldown=10+Math.random()*3;
    if(prey.isPlayer){$('damage-flash').style.opacity='.8';finishRound(false,'The impostor caught you alone. The ship is compromised.');return;}
    prey.alive=false;prey.group.visible=false;spawnBody(prey);b.kills++;if(b.kills>=4)finishRound(false,'The impostor eliminated the crew. The ship is compromised.');
   }
  }else if(b.taskWait<=0){b.taskWait=3+Math.random()*5;b.moveTarget=randomWalkPoint();}
  const pos=b.group.position,target=b.moveTarget;if(!target)continue;const d=pos.distanceTo(target);
  if(d<.65){if(b!==impostor&&Math.random()<.38){const t=tasks[Math.floor(Math.random()*tasks.length)];b.moveTarget=t.position.clone().add(new THREE.Vector3((Math.random()-.5)*2,0,(Math.random()-.5)*2));}else b.moveTarget=randomWalkPoint();continue;}
  const direction=target.clone().sub(pos);direction.y=0;direction.normalize();const speed=b===impostor?2.45:1.75;
  pos.addScaledVector(direction,speed*dt);pos.x=THREE.MathUtils.clamp(pos.x,-21.7,21.7);pos.z=THREE.MathUtils.clamp(pos.z,-14.5,14.5);b.group.rotation.y=Math.atan2(direction.x,direction.z);
  const legs=b.group.userData.legs;const swing=Math.sin(performance.now()*.009+b.id)*.28;legs[0].rotation.x=swing;legs[1].rotation.x=-swing;
 }
}
function updateUI(dt){
 if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)$('toast').classList.remove('show');}
 if(bannerTimer>0){bannerTimer-=dt;if(bannerTimer<=0)$('objective-banner').classList.remove('show');}
 if(gameState==='playing'){
  remaining-=dt;$('timer').textContent=formatTime(remaining);$('timer-fill').style.width=`${Math.max(0,remaining/120*100)}%`;
  $('round-clock').classList.toggle('urgent',remaining<25);
  if(blackout>0){blackout-=dt;if(blackout<=0){scene.fog.density=.016;scene.background.set(0x101f23);$('round-state').classList.remove('alert');$('round-state').lastElementChild.textContent='NO CONTACT';}}
  if(remaining<=0){if(playerRole==='crew'&&completed>=3)finishRound(true,'You held the drop zone until extraction.');else finishRound(false,'Round time expired. The impostor escaped with the ship.');}
 }
}
const touchMove={x:0,y:0};let stickPointer=null,lookPointer=null,lastTouchX=0,lastTouchY=0;
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.05);const time=performance.now()*.001;
 for(const t of tasks){if(t.ring)t.ring.rotation.z=time*.55;if(t.beacon)t.beacon.material.emissiveIntensity=1.1+Math.sin(time*3)*.65;}
 if(gameState==='playing'){updatePlayer(dt);updateBots(dt);}
 updateUI(dt);renderer.render(scene,camera);
}
function onResize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));}
$('start-button').addEventListener('click',startRound);$('restart-button').addEventListener('click',startRound);
$('vote-button').addEventListener('click',castVote);$('report-button').addEventListener('click',reportBody);$('emergency-button').addEventListener('click',callEmergency);
$('ability-button').addEventListener('click',()=>playerRole==='impostor'?sabotage():callEmergency());
$('pause-button').addEventListener('click',()=>{if(gameState==='playing'){gameState='paused';$('pause-screen').classList.add('visible');document.exitPointerLock?.();}});
$('resume-button').addEventListener('click',()=>{if(gameState==='paused'){gameState='playing';$('pause-screen').classList.remove('visible');if(!isMobile())canvas.requestPointerLock?.();}});
window.addEventListener('keydown',e=>{keys[e.code]=true;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
 if(e.repeat)return;
 if(e.code==='KeyE')interact();if(e.code==='KeyR')reportBody();if(e.code==='KeyQ')playerRole==='impostor'?sabotage():callEmergency();if(e.code==='KeyF')knife();if(e.code==='KeyG')sabotage();if(e.code==='Escape'&&gameState==='playing'){gameState='paused';$('pause-screen').classList.add('visible');}
});window.addEventListener('keyup',e=>{keys[e.code]=false;});
canvas.addEventListener('click',()=>{if(gameState==='playing'&&!isMobile()&&!mouseLocked)canvas.requestPointerLock?.();else if(gameState==='playing'&&mouseLocked)shoot();});
document.addEventListener('pointerlockchange',()=>{mouseLocked=document.pointerLockElement===canvas;if(!mouseLocked&&!isMobile()&&gameState==='playing'&&$('pause-screen')){$('pause-screen').classList.add('visible');gameState='paused';}});
document.addEventListener('mousemove',e=>{if(!mouseLocked||gameState!=='playing')return;player.yaw-=e.movementX*.0022;player.pitch=THREE.MathUtils.clamp(player.pitch-e.movementY*.0018,-1.15,1.15);});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('touchstart',e=>{if(gameState!=='playing')return;for(const t of e.changedTouches){if(t.clientX<innerWidth*.45){lookPointer=t.identifier;}else{lookPointer=t.identifier;lastTouchX=t.clientX;lastTouchY=t.clientY;}}},{passive:true});
canvas.addEventListener('touchmove',e=>{for(const t of e.changedTouches){if(t.identifier===lookPointer){if(lastTouchX||lastTouchY){player.yaw-=(t.clientX-lastTouchX)*.004;player.pitch=THREE.MathUtils.clamp(player.pitch-(t.clientY-lastTouchY)*.003,-1.1,1.1);}lastTouchX=t.clientX;lastTouchY=t.clientY;}}},{passive:true});
canvas.addEventListener('touchend',e=>{for(const t of e.changedTouches)if(t.identifier===lookPointer){lookPointer=null;lastTouchX=0;lastTouchY=0;}},{passive:true});
const zone=$('stick-zone'),knob=$('stick-knob');
zone.addEventListener('pointerdown',e=>{stickPointer=e.pointerId;zone.setPointerCapture(e.pointerId);updateStick(e);});
zone.addEventListener('pointermove',e=>{if(e.pointerId===stickPointer)updateStick(e);});
function updateStick(e){const r=zone.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,dx=e.clientX-cx,dy=e.clientY-cy,len=Math.hypot(dx,dy),max=r.width*.34,s=len>max?max/len:1;touchMove.x=dx*s/max;touchMove.y=-dy*s/max;knob.style.transform=`translate(${dx*s}px,${dy*s}px)`;}
zone.addEventListener('pointerup',resetStick);zone.addEventListener('pointercancel',resetStick);
function resetStick(){stickPointer=null;touchMove.x=touchMove.y=0;knob.style.transform='translate(0,0)';}
$('mobile-use').addEventListener('click',interact);$('mobile-fire').addEventListener('click',()=>playerRole==='impostor'?knife():shoot());$('mobile-report').addEventListener('click',reportBody);
window.addEventListener('resize',onResize);
$('loading').classList.add('done');setTimeout(()=>$('loading').remove(),600);
updateTaskList();animate();
