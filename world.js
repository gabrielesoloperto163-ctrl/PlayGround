export function createWorld(THREE, scene, flags, random) {
  const W=2600,H=1800;
  const terrainHeight=(x,z)=>1.4*Math.sin(x*.0027)*Math.cos(z*.0023)+.65*Math.sin((x+z)*.006);
  const groundY=(mx,mz)=>terrainHeight(mx-W/2,mz-H/2);
  scene.background=new THREE.Color(0x9aa89a);
  scene.fog=new THREE.Fog(0x9aa89a,720,2450);
  scene.add(new THREE.HemisphereLight(0xdce9ee,0x354331,2.1));
  const sun=new THREE.DirectionalLight(0xffe6bd,3.2);sun.position.set(-500,1000,380);sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-1450;sun.shadow.camera.right=1450;sun.shadow.camera.top=1050;sun.shadow.camera.bottom=-1050;sun.shadow.bias=-.00015;scene.add(sun);
  const fill=new THREE.DirectionalLight(0x9fb9c9,.65);fill.position.set(700,300,-800);scene.add(fill);
  const segX=100,segZ=70,verts=[],colors=[],indices=[];
  for(let iz=0;iz<=segZ;iz++)for(let ix=0;ix<=segX;ix++){
    const x=-W/2+W*ix/segX,z=-H/2+H*iz/segZ,h=terrainHeight(x,z),tone=(random()-.5)*.075;
    verts.push(x,h,z);colors.push(.24+tone,.31+tone,.19+tone*.55);
    if(ix<segX&&iz<segZ){const a=iz*(segX+1)+ix,b=a+1,c=a+segX+1,d=c+1;indices.push(a,c,b,b,c,d)}
  }
  const terrainGeo=new THREE.BufferGeometry();terrainGeo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));terrainGeo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));terrainGeo.setIndex(indices);terrainGeo.computeVertexNormals();
  const terrain=new THREE.Mesh(terrainGeo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}));terrain.receiveShadow=true;scene.add(terrain);
  // Curving pale dirt road, built as a ribbon following the valley.
  const roadPoints=[[-1400,0],[-1000,-100],[-620,70],[-280,140],[100,55],[450,-110],[820,-30],[1100,100],[1400,0]].map(p=>new THREE.Vector3(p[0],0,p[1]));
  const curve=new THREE.CatmullRomCurve3(roadPoints),roadPos=[],roadIndex=[],steps=150;
  for(let i=0;i<=steps;i++){const t=i/steps,p=curve.getPoint(t),tan=curve.getTangent(t),nx=-tan.z,nz=tan.x,len=Math.hypot(nx,nz)||1;for(const side of [-1,1]){const x=p.x+nx/len*44*side,z=p.z+nz/len*44*side;roadPos.push(x,terrainHeight(x,z)+.35,z)}if(i<steps){const a=i*2;roadIndex.push(a,a+1,a+2,a+1,a+3,a+2)}}
  const roadGeo=new THREE.BufferGeometry();roadGeo.setAttribute('position',new THREE.Float32BufferAttribute(roadPos,3));roadGeo.setIndex(roadIndex);roadGeo.computeVertexNormals();const road=new THREE.Mesh(roadGeo,new THREE.MeshStandardMaterial({color:0x9a8b67,roughness:1,side:THREE.DoubleSide}));road.receiveShadow=true;scene.add(road);
  // Border markers and distant mountain silhouettes.
  const ridgeMat=new THREE.MeshStandardMaterial({color:0x667464,roughness:1});
  for(let i=0;i<18;i++){const x=-1450+i*170,z=-1000-(random()*100),h=90+random()*150,m=new THREE.Mesh(new THREE.ConeGeometry(110+random()*120,h,5),ridgeMat);m.position.set(x,h*.47,z);m.rotation.y=random()*6.28;scene.add(m)}
  const trunkGeo=new THREE.CylinderGeometry(3,5,28,5),crownGeo=new THREE.ConeGeometry(18,43,6);
  const trunkMat=new THREE.MeshStandardMaterial({color:0x4a3929,roughness:1}),leafMats=[0x243b2b,0x314b32,0x3e5637,0x29422e].map(c=>new THREE.MeshStandardMaterial({color:c,roughness:1}));
  const treeData=leafMats.map(()=>[]),trunks=[];
  for(let i=0;i<410;i++){
    const mx=30+random()*(W-60),mz=30+random()*(H-60);
    if(flags.some(f=>Math.hypot(f.x-mx,f.y-mz)<155))continue;
    const size=.7+random()*1.25,x=mx-W/2,z=mz-H/2,y=terrainHeight(x,z);trunks.push({x,y,z,size});treeData[Math.floor(random()*treeData.length)].push({x,y,z,size});
  }
  const trunkInst=new THREE.InstancedMesh(trunkGeo,trunkMat,trunks.length),dummy=new THREE.Object3D();
  trunks.forEach((t,i)=>{dummy.position.set(t.x,t.y+14*t.size,t.z);dummy.scale.set(t.size,t.size,t.size);dummy.rotation.y=random()*6;dummy.updateMatrix();trunkInst.setMatrixAt(i,dummy.matrix)});trunkInst.castShadow=true;scene.add(trunkInst);
  treeData.forEach((arr,index)=>{const mesh=new THREE.InstancedMesh(crownGeo,leafMats[index],arr.length);arr.forEach((t,i)=>{dummy.position.set(t.x,t.y+43*t.size,t.z);dummy.scale.set(t.size,t.size,t.size);dummy.rotation.y=random()*6;dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix)});mesh.castShadow=true;scene.add(mesh)});
  // Scattered scrub and boulders add scale without expensive individual models.
  const bushGeo=new THREE.DodecahedronGeometry(9,0),bushMat=new THREE.MeshStandardMaterial({color:0x617343,roughness:1}),bushes=new THREE.InstancedMesh(bushGeo,bushMat,240);
  for(let i=0;i<240;i++){const x=(random()*W-W/2),z=(random()*H-H/2);dummy.position.set(x,terrainHeight(x,z)+5,z);const s=.5+random()*1.4;dummy.scale.set(s,.45*s,s);dummy.rotation.y=random()*6;dummy.updateMatrix();bushes.setMatrixAt(i,dummy.matrix)}scene.add(bushes);
  const rockGeo=new THREE.DodecahedronGeometry(15,0),rockMat=new THREE.MeshStandardMaterial({color:0x777a6d,roughness:1});
  for(let i=0;i<42;i++){const x=random()*W-W/2,z=random()*H-H/2,s=.7+random()*1.8;if(flags.some(f=>Math.hypot(f.x-(x+W/2),f.y-(z+H/2))<140))continue;const rock=new THREE.Mesh(rockGeo,rockMat);rock.position.set(x,terrainHeight(x,z)+8*s,z);rock.scale.set(s,.65*s,.8*s);rock.rotation.set(random()*.2,random()*6,random()*.2);rock.castShadow=true;rock.receiveShadow=true;scene.add(rock)}
  // A few low sandbag revetments around the approaches.
  const sandMat=new THREE.MeshStandardMaterial({color:0x8c7953,roughness:1}),bagGeo=new THREE.BoxGeometry(34,12,17);
  for(let i=0;i<20;i++){const mx=180+random()*(W-360),mz=140+random()*(H-280);if(flags.some(f=>Math.hypot(f.x-mx,f.y-mz)<150))continue;const x=mx-W/2,z=mz-H/2;for(let j=0;j<3;j++){const b=new THREE.Mesh(bagGeo,sandMat);b.position.set(x+(j-1)*25,terrainHeight(x,z)+6,z);b.rotation.y=random()*.25;b.castShadow=true;b.receiveShadow=true;scene.add(b)}}
  const flagMeshes=[];
  flags.forEach(f=>{
    const x=f.x-W/2,z=f.y-H/2,y=groundY(f.x,f.y),g=new THREE.Group();g.position.set(x,y,z);scene.add(g);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(82,2.4,8,64),new THREE.MeshBasicMaterial({color:0xe9e4c4,transparent:true,opacity:.65}));ring.rotation.x=Math.PI/2;ring.position.y=.6;g.add(ring);
    const fill=new THREE.Mesh(new THREE.CircleGeometry(80,48),new THREE.MeshBasicMaterial({color:0xe8dfb2,transparent:true,opacity:.065,side:THREE.DoubleSide}));fill.rotation.x=-Math.PI/2;fill.position.y=.35;g.add(fill);
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(2.2,3,62,8),new THREE.MeshStandardMaterial({color:0xc2b894,metalness:.45,roughness:.5}));pole.position.set(0,31,0);pole.castShadow=true;g.add(pole);
    const cloth=new THREE.Mesh(new THREE.PlaneGeometry(38,23),new THREE.MeshStandardMaterial({color:0xd9d3ae,side:THREE.DoubleSide,roughness:.85}));cloth.position.set(20,49,0);g.add(cloth);
    const label=makeLabel(THREE,f.name);label.position.set(0,77,0);label.scale.set(74,23,1);g.add(label);
    const progress=new THREE.Mesh(new THREE.TorusGeometry(58,3,8,48),new THREE.MeshBasicMaterial({color:0x56d7e8,transparent:true,opacity:0}));progress.rotation.x=Math.PI/2;progress.position.y=1.3;g.add(progress);
    flagMeshes.push({group:g,ring,cloth,progress});
  });
  return {terrainHeight,groundY,flagMeshes};
}
function makeLabel(THREE,text){const c=document.createElement('canvas');c.width=256;c.height=80;const ctx=c.getContext('2d');ctx.fillStyle='#111b1dcc';ctx.fillRect(5,8,246,64);ctx.strokeStyle='#eee7ca88';ctx.strokeRect(5,8,246,64);ctx.fillStyle='#f0edda';ctx.font='bold 42px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,128,40);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false}));return sprite}
export function makeSoldier(THREE,team,isPlayer=false){
  const g=new THREE.Group(),blue=team===0,main=new THREE.MeshStandardMaterial({color:blue?0x315e5c:0x793d37,roughness:.82}),cloth=new THREE.MeshStandardMaterial({color:blue?0x537a70:0xa35748,roughness:.9}),dark=new THREE.MeshStandardMaterial({color:0x26302b,roughness:.8}),skin=new THREE.MeshStandardMaterial({color:0xb99776,roughness:.9}),helmet=new THREE.MeshStandardMaterial({color:blue?0x3d6660:0x70423a,roughness:.8});
  const add=(geo,mat,x,y,z)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m};
  add(new THREE.BoxGeometry(17,24,12),main,0,33,0);add(new THREE.BoxGeometry(20,9,13),dark,0,44,-2);add(new THREE.BoxGeometry(12,17,8),dark,0,32,-9);
  const head=add(new THREE.SphereGeometry(7.5,10,8),skin,0,53,1);head.scale.set(.9,1.05,.9);add(new THREE.SphereGeometry(8,10,7),helmet,0,58,1).scale.set(1.05,.55,1.05);
  add(new THREE.CylinderGeometry(4.5,4,16,7),dark,-5,9,1).rotation.x=.12;add(new THREE.CylinderGeometry(4.5,4,16,7),dark,5,9,1).rotation.x=.12;
  add(new THREE.CylinderGeometry(3.2,3.2,18,7),cloth,-12,34,2).rotation.z=-.2;add(new THREE.CylinderGeometry(3.2,3.2,18,7),cloth,12,34,2).rotation.z=.2;
  add(new THREE.BoxGeometry(25,5,5),dark,8,39,5);const barrel=add(new THREE.CylinderGeometry(1.2,1.2,25,6),dark,8,39,18);barrel.rotation.x=Math.PI/2;
  const muzzle=add(new THREE.CylinderGeometry(2.5,2.5,3,8),new THREE.MeshBasicMaterial({color:0xffe3a1}),8,39,31);muzzle.visible=false;
  g.userData.muzzle=muzzle;g.userData.main=main;g.userData.cloth=cloth;g.userData.isPlayer=isPlayer;
  if(isPlayer){const glow=new THREE.Mesh(new THREE.RingGeometry(18,21,32),new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide,transparent:true,opacity:.8}));glow.rotation.x=-Math.PI/2;glow.position.y=1;g.add(glow)}
  return g;
}
export function makeTracer(THREE,color){const g=new THREE.Group(),geo=new THREE.CylinderGeometry(.8,.8,1,6),mat=new THREE.MeshBasicMaterial({color});const m=new THREE.Mesh(geo,mat);m.rotation.x=Math.PI/2;g.add(m);return {group:g,mesh:m}}
