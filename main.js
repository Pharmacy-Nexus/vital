
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js";

const gsap = window.gsap;
if (!gsap) throw new Error("GSAP failed to load.");

const app = document.getElementById("app");
const mount = document.getElementById("webgl");
const loading = document.getElementById("loading");
const replayBtn = document.getElementById("replay");
const pauseBtn = document.getElementById("pause");

const params = new URLSearchParams(location.search);
const LOOP = /^(1|true|yes)$/i.test(params.get("loop") || "1");
const AUTOPLAY = !/^(0|false|no)$/i.test(params.get("autoplay") || "1");
const CONTROLS = !/^(0|false|no)$/i.test(params.get("controls") || "1");
const INITIAL_PROGRESS = Math.min(1, Math.max(0, Number(params.get("progress") || "0")));
if (!CONTROLS) document.querySelector(".ui").style.display = "none";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x030404);
scene.fog = new THREE.FogExp2(0x050605, 0.034);

const camera = new THREE.PerspectiveCamera(36, innerWidth/innerHeight, 0.1, 100);
camera.position.set(0, 0.15, 11.8);

const renderer = new THREE.WebGLRenderer({antialias:true, powerPreference:"high-performance"});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.16;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
mount.appendChild(renderer.domElement);

const loader = new THREE.TextureLoader();
const loadTexture = (url) => new Promise((resolve,reject)=>{
  loader.load(url, t => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    resolve(t);
  }, undefined, reject);
});

function roundedShape(w,h,r){
  const x=-w/2, y=-h/2;
  const s=new THREE.Shape();
  s.moveTo(x+r,y);
  s.lineTo(x+w-r,y); s.quadraticCurveTo(x+w,y,x+w,y+r);
  s.lineTo(x+w,y+h-r); s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  s.lineTo(x+r,y+h); s.quadraticCurveTo(x,y+h,x,y+h-r);
  s.lineTo(x,y+r); s.quadraticCurveTo(x,y,x+r,y);
  return s;
}
function roundedExtrude(w,h,r,d,bevel=.035){
  const g = new THREE.ExtrudeGeometry(roundedShape(w,h,r),{
    depth:d, bevelEnabled:true, bevelSegments:5, steps:1,
    bevelSize:bevel, bevelThickness:bevel
  });
  g.center();
  g.computeVertexNormals();
  return g;
}
function roundedPlane(w,h,r,segments=40){
  const geo=new THREE.ShapeGeometry(roundedShape(w,h,r), segments);
  geo.computeBoundingBox();
  const bb=geo.boundingBox;
  const pos=geo.attributes.position;
  const uv=geo.attributes.uv;
  for(let i=0;i<pos.count;i++){
    uv.setXY(
      i,
      (pos.getX(i)-bb.min.x)/(bb.max.x-bb.min.x),
      (pos.getY(i)-bb.min.y)/(bb.max.y-bb.min.y)
    );
  }
  uv.needsUpdate=true;
  return geo;
}
function makeSprite(texture,scale=1,opacity=.4){
  const m=new THREE.SpriteMaterial({map:texture,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending});
  const s=new THREE.Sprite(m); s.scale.set(scale,scale,1); return s;
}
function makeTexturedFace(tex,w,h,z,rotY=0){
  const geo=roundedPlane(w,h,.16,40);
  const mat=new THREE.MeshBasicMaterial({map:tex,transparent:true,alphaTest:.02,side:THREE.DoubleSide,toneMapped:false});
  const mesh=new THREE.Mesh(geo,mat);
  mesh.position.z=z; mesh.rotation.y=rotY;
  return mesh;
}
function makeCard(frontTex,backTex,glowTex){
  const g=new THREE.Group();
  const body=new THREE.Mesh(
    roundedExtrude(4.35,2.57,.19,.105,.035),
    new THREE.MeshPhysicalMaterial({
      color:0x101110,metalness:.72,roughness:.22,
      clearcoat:1,clearcoatRoughness:.15
    })
  );
  body.castShadow=true; body.receiveShadow=true;
  g.add(body);
  const front=makeTexturedFace(frontTex,4.31,2.54,.075,0);
  const back=makeTexturedFace(backTex,4.31,2.54,-.075,Math.PI);
  g.add(front,back);

  const edge=new THREE.LineSegments(
    new THREE.EdgesGeometry(body.geometry,28),
    new THREE.LineBasicMaterial({color:0x90df12,transparent:true,opacity:.24,blending:THREE.AdditiveBlending})
  );
  g.add(edge);

  const glow=makeSprite(glowTex,5.8,.18);
  glow.position.z=-.22;
  glow.scale.y=.65;
  g.add(glow);
  g.userData={body,front,back,edge,glow};
  return g;
}
function makePhone(screenTex,glowTex){
  const g=new THREE.Group();
  const body=new THREE.Mesh(
    roundedExtrude(2.46,5.15,.29,.22,.055),
    new THREE.MeshPhysicalMaterial({
      color:0x111312,metalness:.92,roughness:.18,
      clearcoat:1,clearcoatRoughness:.12
    })
  );
  body.castShadow=true;
  g.add(body);

  const screenGeo=roundedPlane(2.25,4.86,.245,48);
  const screenMat=new THREE.MeshBasicMaterial({map:screenTex,toneMapped:false});
  const screen=new THREE.Mesh(screenGeo,screenMat);
  screen.position.z=.145;
  g.add(screen);

  const glass=new THREE.Mesh(screenGeo,new THREE.MeshPhysicalMaterial({
    color:0xffffff,transparent:true,opacity:.08,
    transmission:.1,roughness:.05,metalness:0,
    clearcoat:1,clearcoatRoughness:.05
  }));
  glass.position.z=.151;
  g.add(glass);

  const island=new THREE.Mesh(
    new THREE.CapsuleGeometry(.10,.38,6,12),
    new THREE.MeshBasicMaterial({color:0x020202})
  );
  island.rotation.z=Math.PI/2;
  island.scale.set(1,1,.15);
  island.position.set(0,2.15,.17);
  g.add(island);

  const buttonMat=new THREE.MeshStandardMaterial({color:0x2a2c2a,metalness:.85,roughness:.2});
  const b1=new THREE.Mesh(new THREE.BoxGeometry(.055,.58,.10),buttonMat);
  b1.position.set(-1.27,.55,.02); g.add(b1);
  const b2=b1.clone(); b2.scale.y=.55; b2.position.y=1.25; g.add(b2);
  const b3=b1.clone(); b3.scale.y=.78; b3.position.set(1.27,.75,.02); g.add(b3);

  const glow=makeSprite(glowTex,5.2,.12);
  glow.position.z=-.35;
  glow.scale.x=.75;
  g.add(glow);

  g.userData={body,screen,glass,glow};
  return g;
}
function makePulseRing(radius){
  const geo=new THREE.TorusGeometry(radius,.018,8,80);
  const mat=new THREE.MeshBasicMaterial({
    color:0xa8f032,transparent:true,opacity:0,
    blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false
  });
  const m=new THREE.Mesh(geo,mat);
  return m;
}
function makeBackground(){
  const group=new THREE.Group();
  // floor
  const floor=new THREE.Mesh(
    new THREE.PlaneGeometry(34,24),
    new THREE.MeshStandardMaterial({color:0x060706,metalness:.3,roughness:.62})
  );
  floor.rotation.x=-Math.PI/2;
  floor.position.y=-3.15;
  floor.receiveShadow=true;
  group.add(floor);

  // giant soft light sheets
  const sheetMat=(color,opacity)=>new THREE.MeshBasicMaterial({
    color,transparent:true,opacity,blending:THREE.AdditiveBlending,
    depthWrite:false,side:THREE.DoubleSide
  });
  const a=new THREE.Mesh(new THREE.PlaneGeometry(8,16),sheetMat(0x4a0718,.12));
  a.position.set(-7,1,-5); a.rotation.z=-.38; group.add(a);
  const b=new THREE.Mesh(new THREE.PlaneGeometry(7,15),sheetMat(0x5b9700,.075));
  b.position.set(7,2,-6); b.rotation.z=.28; group.add(b);

  // particles
  const count=110;
  const pos=new Float32Array(count*3);
  for(let i=0;i<count;i++){
    pos[i*3]=(Math.random()-.5)*22;
    pos[i*3+1]=(Math.random()-.5)*12;
    pos[i*3+2]=-2-Math.random()*9;
  }
  const pg=new THREE.BufferGeometry(); pg.setAttribute("position",new THREE.BufferAttribute(pos,3));
  const pm=new THREE.PointsMaterial({color:0xbef55c,size:.022,transparent:true,opacity:.42,depthWrite:false});
  const points=new THREE.Points(pg,pm); group.add(points);
  group.userData.points=points;
  return group;
}
function setVisibleRecursive(obj,v){obj.visible=v}
function deg(v){return THREE.MathUtils.degToRad(v)}

const ambient=new THREE.HemisphereLight(0xbfd2b1,0x15070b,1.2);
scene.add(ambient);
const key=new THREE.SpotLight(0xffffff,110,30,deg(34),.5,1.35);
key.position.set(-4.6,7.2,8.0); key.castShadow=true; key.shadow.mapSize.set(1024,1024); scene.add(key);
const lime=new THREE.PointLight(0x9be81c,42,18,1.8); lime.position.set(5.5,2.5,4); scene.add(lime);
const red=new THREE.PointLight(0x9b1733,32,17,1.8); red.position.set(-6,-1,3); scene.add(red);

const bg=makeBackground(); scene.add(bg);
const world=new THREE.Group(); scene.add(world);
const cameraRig=new THREE.Group(); scene.add(cameraRig); cameraRig.add(camera);

let mainCard, phone, fanCards=[], pulses=[], timeline;
let introEl=document.querySelector(".intro-copy");
let tapEl=document.querySelector(".tap-copy");
let screenCopyEl=document.querySelector(".screen-copy");
let finalEl=document.querySelector(".final-copy");

function cloneMaterialsDeep(obj){
  const c=obj.clone(true);
  c.traverse(n=>{
    if(n.isMesh || n.isLineSegments || n.isSprite){
      if(n.material) n.material=n.material.clone();
    }
  });
  return c;
}
function makeFan(card){
  const arr=[];
  for(let i=0;i<7;i++){
    const c=cloneMaterialsDeep(card);
    c.scale.setScalar(.46);
    c.visible=false;
    world.add(c); arr.push(c);
  }
  return arr;
}
function layout(){
  const portrait=innerWidth/innerHeight < .82;
  return portrait ? {
    introCard:{x:0,y:-.3,z:0,scale:.83},
    phoneHero:{x:0,y:-.45,z:.1,scale:.86},
    finalPhone:{x:0,y:-1.35,z:-.2,scale:.68},
    finalCard:{x:0,y:1.55,z:.65,scale:.55},
    cameraZ:13.3
  } : {
    introCard:{x:1.75,y:.05,z:0,scale:1.0},
    phoneHero:{x:1.7,y:.0,z:.05,scale:1.0},
    finalPhone:{x:2.25,y:.0,z:-.15,scale:.79},
    finalCard:{x:2.55,y:-1.45,z:.85,scale:.68},
    cameraZ:11.8
  };
}

function buildTimeline(){
  if(timeline) timeline.kill();
  const L=layout();
  camera.position.set(0,.15,L.cameraZ);
  camera.rotation.set(0,0,0);
  cameraRig.position.set(0,0,0);
  cameraRig.rotation.set(0,0,0);

  gsap.set([introEl,tapEl,screenCopyEl,finalEl],{autoAlpha:0});
  gsap.set(mainCard.position,{x:-7,y:-1.5,z:-3.5});
  gsap.set(mainCard.rotation,{x:deg(38),y:deg(-130),z:deg(-26)});
  gsap.set(mainCard.scale,{x:.38,y:.38,z:.38});
  mainCard.visible=true;

  gsap.set(phone.position,{x:8,y:.5,z:-4});
  gsap.set(phone.rotation,{x:deg(8),y:deg(170),z:deg(9)});
  gsap.set(phone.scale,{x:.55,y:.55,z:.55});
  phone.visible=true;

  pulses.forEach(p=>{
    p.visible=false;
    p.material.opacity=0;
    p.scale.setScalar(.2);
    p.position.set(L.phoneHero.x, L.phoneHero.y+.75, 1.55);
  });
  fanCards.forEach(c=>{c.visible=false;c.scale.setScalar(.15)});

  timeline=gsap.timeline({
    paused:!AUTOPLAY,
    repeat:LOOP ? -1 : 0,
    repeatDelay:.45,
    defaults:{ease:"power3.inOut"}
  });

  // 0.00–1.55: intro copy, mostly black.
  timeline
    .to(introEl,{autoAlpha:1,duration:.65,ease:"power2.out"},.12)
    .fromTo(introEl,{x:-24},{x:0,duration:.8,ease:"power3.out"},.12)
    .to(introEl,{autoAlpha:0,duration:.48,ease:"power2.in"},1.12);

  // 1.25–3.55: real 3D card reveal.
  timeline
    .to(mainCard.position,{x:L.introCard.x,y:L.introCard.y,z:L.introCard.z,duration:1.45,ease:"expo.out"},1.24)
    .to(mainCard.rotation,{x:deg(9),y:deg(-8),z:deg(-7),duration:1.45,ease:"expo.out"},1.24)
    .to(mainCard.scale,{x:L.introCard.scale,y:L.introCard.scale,z:L.introCard.scale,duration:1.35,ease:"expo.out"},1.24)
    .to(mainCard.rotation,{y:deg(183),z:deg(5),x:deg(5),duration:.95,ease:"power2.inOut"},2.72)
    .to(mainCard.rotation,{y:deg(340),z:deg(-3),x:deg(8),duration:.75,ease:"power2.inOut"},3.55);

  // small camera drift makes it feel like a product shot, not a DOM animation
  timeline
    .to(cameraRig.rotation,{y:deg(2.8),x:deg(-1.5),duration:2.3,ease:"sine.inOut"},1.4)
    .to(cameraRig.rotation,{y:deg(-1.6),x:deg(.7),duration:2.0,ease:"sine.inOut"},3.75);

  // 3.65–5.45: phone arrives showing its back, card approaches NFC zone.
  timeline
    .to(phone.position,{x:L.phoneHero.x,y:L.phoneHero.y,z:L.phoneHero.z,duration:1.15,ease:"expo.out"},3.65)
    .to(phone.rotation,{x:deg(4),y:deg(173),z:deg(2),duration:1.15,ease:"expo.out"},3.65)
    .to(phone.scale,{x:L.phoneHero.scale,y:L.phoneHero.scale,z:L.phoneHero.scale,duration:1.15,ease:"expo.out"},3.65)
    .to(mainCard.position,{
      x:L.phoneHero.x+(innerWidth/innerHeight<.82 ? .1:-.15),
      y:L.phoneHero.y+.35,z:1.25,duration:.95,ease:"power3.inOut"
    },4.45)
    .to(mainCard.rotation,{x:deg(1),y:deg(172),z:deg(-5),duration:.95},4.45)
    .to(mainCard.scale,{x:.49,y:.49,z:.49,duration:.95},4.45)
    .to(tapEl,{autoAlpha:1,duration:.25,ease:"power1.out"},4.92);

  // 5.05–5.95: NFC pulse
  pulses.forEach((p,i)=>{
    timeline.set(p,{visible:true},5.02+i*.07)
      .fromTo(p.scale,{x:.18,y:.18,z:.18},{x:1.2+i*.16,y:1.2+i*.16,z:1.2+i*.16,duration:.72,ease:"power2.out"},5.02+i*.07)
      .fromTo(p.material,{opacity:.86},{opacity:0,duration:.75,ease:"power2.out"},5.02+i*.07)
      .set(p,{visible:false},5.86+i*.07);
  });
  timeline
    .to(lime,{intensity:85,duration:.16,ease:"power1.out"},5.1)
    .to(lime,{intensity:42,duration:.45,ease:"power2.out"},5.28)
    .to(tapEl,{autoAlpha:0,duration:.28},5.65);

  // 5.65–8.25: phone flips to front and becomes the hero.
  timeline
    .to(mainCard.position,{x:L.phoneHero.x+(innerWidth/innerHeight<.82 ? 2.4:3.0),y:-2.1,z:-1.0,duration:1.0,ease:"power3.inOut"},5.58)
    .to(mainCard.rotation,{x:deg(8),y:deg(340),z:deg(10),duration:1.0},5.58)
    .to(mainCard.scale,{x:.35,y:.35,z:.35,duration:1.0},5.58)
    .to(phone.rotation,{x:deg(1),y:deg(0),z:deg(0),duration:1.05,ease:"expo.inOut"},5.62)
    .to(phone.position,{x:L.phoneHero.x,y:L.phoneHero.y,z:1.05,duration:1.05,ease:"expo.inOut"},5.62)
    .to(phone.scale,{x:L.phoneHero.scale*1.08,y:L.phoneHero.scale*1.08,z:L.phoneHero.scale*1.08,duration:1.05},5.62)
    .to(screenCopyEl,{autoAlpha:1,duration:.55,ease:"power2.out"},6.55)
    .to(screenCopyEl,{autoAlpha:0,duration:.35,ease:"power2.in"},8.04)
    .to(camera.position,{z:L.cameraZ-(innerWidth/innerHeight<.82 ? 1.0:1.55),duration:1.75,ease:"sine.inOut"},6.25)
    .to(camera.position,{y:.34,duration:1.75,ease:"sine.inOut"},6.25);

  // 8.35–10.15: the reference-video-inspired card fan/spiral.
  fanCards.forEach((c,i)=>{
    const a=(-115+i*(230/(fanCards.length-1)))*Math.PI/180;
    const r=(innerWidth/innerHeight<.82 ? 3.3:4.6);
    const cx=(innerWidth/innerHeight<.82 ? 0:L.phoneHero.x*.25);
    const cy=.15;
    timeline.set(c,{visible:true},8.28+i*.035);
    timeline.set(c.position,{x:L.phoneHero.x,y:L.phoneHero.y,z:-.3},8.28+i*.035);
    timeline.set(c.rotation,{x:deg(12),y:deg(345),z:0},8.28+i*.035);
    timeline.to(c.position,{
      x:cx+Math.cos(a)*r, y:cy+Math.sin(a)*r*.62, z:-.35-Math.abs(i-3)*.12,
      duration:.9,ease:"back.out(1.15)"
    },8.32+i*.04);
    timeline.to(c.rotation,{x:deg(4+i*2),y:deg(340-i*6),z:a+Math.PI/2,duration:.9,ease:"back.out(1.15)"},8.32+i*.04);
    timeline.to(c.scale,{x:.46,y:.46,z:.46,duration:.7,ease:"back.out(1.4)"},8.32+i*.04);
  });
  timeline
    .to(phone.scale,{x:.68,y:.68,z:.68,duration:.85,ease:"power3.inOut"},8.48)
    .to(phone.position,{x:0,y:.2,z:-.35,duration:.85,ease:"power3.inOut"},8.48)
    .to(camera.position,{z:L.cameraZ+.55,y:.12,duration:.85,ease:"power3.inOut"},8.48);

  // 10.05–12.65: settle to clean website hero composition.
  fanCards.forEach((c,i)=>{
    timeline.to(c.scale,{x:.08,y:.08,z:.08,duration:.48,ease:"power2.in"},10.0+i*.018)
      .set(c,{visible:false},10.49+i*.018);
  });
  timeline
    .to(phone.position,{x:L.finalPhone.x,y:L.finalPhone.y,z:L.finalPhone.z,duration:1.05,ease:"expo.inOut"},10.02)
    .to(phone.rotation,{x:deg(2),y:deg(-10),z:deg(2),duration:1.05,ease:"expo.inOut"},10.02)
    .to(phone.scale,{x:L.finalPhone.scale,y:L.finalPhone.scale,z:L.finalPhone.scale,duration:1.05,ease:"expo.inOut"},10.02)
    .to(mainCard.position,{x:L.finalCard.x,y:L.finalCard.y,z:L.finalCard.z,duration:1.05,ease:"expo.inOut"},10.02)
    .to(mainCard.rotation,{x:deg(14),y:deg(348),z:deg(-8),duration:1.05,ease:"expo.inOut"},10.02)
    .to(mainCard.scale,{x:L.finalCard.scale,y:L.finalCard.scale,z:L.finalCard.scale,duration:1.05,ease:"expo.inOut"},10.02)
    .to(finalEl,{autoAlpha:1,duration:.65,ease:"power2.out"},10.64)
    .to(camera.position,{z:L.cameraZ,y:.15,duration:.9,ease:"power2.inOut"},10.05);

  // end breathing movement
  timeline
    .to(phone.rotation,{y:deg(-7),duration:1.15,ease:"sine.inOut"},11.55)
    .to(mainCard.rotation,{z:deg(-5),y:deg(352),duration:1.15,ease:"sine.inOut"},11.55)
    .to(finalEl,{autoAlpha:0,duration:.38,ease:"power2.in"},12.75)
    .to(phone.position,{y:L.finalPhone.y+.08,duration:.35,ease:"power2.in"},12.75)
    .to(mainCard.position,{y:L.finalCard.y+.06,duration:.35,ease:"power2.in"},12.75);

  timeline.duration(13.15);

  if(INITIAL_PROGRESS>0){
    timeline.progress(INITIAL_PROGRESS).pause();
    pauseBtn.textContent="▶";
  } else if(AUTOPLAY) {
    timeline.play(0);
  }
}

function onResize(){
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.setSize(innerWidth,innerHeight);
  buildTimeline();
}
addEventListener("resize",()=>{clearTimeout(window.__vr);window.__vr=setTimeout(onResize,120)});

let paused=false;
replayBtn.addEventListener("click",()=>{timeline.restart();paused=false;pauseBtn.textContent="Ⅱ"});
pauseBtn.addEventListener("click",()=>{
  paused=!paused;
  if(paused){timeline.pause();pauseBtn.textContent="▶"}
  else{timeline.play();pauseBtn.textContent="Ⅱ"}
});
addEventListener("keydown",(e)=>{
  if(e.code==="Space"){e.preventDefault();pauseBtn.click()}
  if(e.key.toLowerCase()==="r") replayBtn.click();
});

(async function init(){
  try{
    const [front,back,screen]=await Promise.all([
      loadTexture("./assets/card-front.png"),
      loadTexture("./assets/card-back.png"),
      loadTexture("./assets/emergency-screen.png")
    ]);
    const glowTex=(()=>{
      const c=document.createElement("canvas"); c.width=c.height=256;
      const x=c.getContext("2d");
      const g=x.createRadialGradient(128,128,0,128,128,126);
      g.addColorStop(0,"rgba(213,255,140,.88)");
      g.addColorStop(.12,"rgba(151,234,22,.64)");
      g.addColorStop(.38,"rgba(95,184,0,.16)");
      g.addColorStop(1,"rgba(0,0,0,0)");
      x.fillStyle=g;x.fillRect(0,0,256,256);
      const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
    })();

    mainCard=makeCard(front,back,glowTex);
    world.add(mainCard);

    phone=makePhone(screen,glowTex);
    world.add(phone);

    // pulse rings in world space near the tap point
    for(let i=0;i<4;i++){
      const p=makePulseRing(.48+i*.19);
      p.position.set(0,0,1.7);
      p.rotation.x=deg(4);
      world.add(p); pulses.push(p);
    }

    fanCards=makeFan(mainCard);

    buildTimeline();
    app.classList.add("webgl-ready");
    loading.classList.add("hide");
  }catch(err){
    console.error(err);
    loading.querySelector("small").textContent="3D LIBRARY OFFLINE — STATIC POSTER SHOWN";
    setTimeout(()=>loading.classList.add("hide"),1000);
  }
})();

const clock=new THREE.Clock();
renderer.setAnimationLoop(()=>{
  const t=clock.getElapsedTime();
  if(bg?.userData?.points){
    bg.userData.points.rotation.y=t*.008;
    bg.userData.points.rotation.z=Math.sin(t*.15)*.015;
  }
  if(mainCard?.userData?.glow){
    mainCard.userData.glow.material.opacity=.13+Math.sin(t*1.7)*.025;
  }
  if(phone?.userData?.glow){
    phone.userData.glow.material.opacity=.08+Math.sin(t*1.25+.8)*.018;
  }
  renderer.render(scene,camera);
});
