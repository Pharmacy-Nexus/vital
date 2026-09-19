
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

const gsap = window.gsap;
if(!gsap) throw new Error('GSAP failed to load.');

const app = document.querySelector('#app');
const mount = document.querySelector('#webgl');
const loaderEl = document.querySelector('#loader');

const q = new URLSearchParams(location.search);
const LOOP = !/^(0|false|no)$/i.test(q.get('loop') || '1');
const CONTROLS = !/^(0|false|no)$/i.test(q.get('controls') || '1');
const AUTOPLAY = !/^(0|false|no)$/i.test(q.get('autoplay') || '1');
if(!CONTROLS) document.querySelector('.controls').style.display='none';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020303);
scene.fog = new THREE.FogExp2(0x040505, 0.015);

const camera = new THREE.PerspectiveCamera(34, innerWidth/innerHeight, .1, 100);
camera.position.set(0,.05,11.8);
const cameraRig = new THREE.Group();
scene.add(cameraRig);
cameraRig.add(camera);

const renderer = new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.98;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
mount.appendChild(renderer.domElement);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene,camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight), .18, .45, .92);
composer.addPass(bloom);

const CinematicShader = {
  uniforms:{
    tDiffuse:{value:null},
    rgbAmount:{value:0},
    vignette:{value:.10},
    pulse:{value:0}
  },
  vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader:`
    uniform sampler2D tDiffuse;
    uniform float rgbAmount;
    uniform float vignette;
    uniform float pulse;
    varying vec2 vUv;
    void main(){
      vec2 uv=vUv;
      vec2 p=uv-.5;
      float d=length(p);
      vec2 dir=normalize(p+0.0001);
      float amt=rgbAmount*(0.35+d*1.35);
      float r=texture2D(tDiffuse,uv+dir*amt).r;
      float g=texture2D(tDiffuse,uv).g;
      float b=texture2D(tDiffuse,uv-dir*amt).b;
      vec3 col=vec3(r,g,b);
      float vig=smoothstep(.86,.26,d);
      col*=mix(1.0,vig,vignette);
      col += pulse*vec3(.18,.32,.04)*(1.0-smoothstep(.0,.72,d));
      gl_FragColor=vec4(col,1.0);
    }`
};
const cinematicPass = new ShaderPass(CinematicShader);
composer.addPass(cinematicPass);

const texLoader = new THREE.TextureLoader();
function loadTexture(url){
  return new Promise((resolve,reject)=>{
    texLoader.load(url,t=>{
      t.colorSpace=THREE.SRGBColorSpace;
      t.anisotropy=Math.min(12,renderer.capabilities.getMaxAnisotropy());
      resolve(t);
    },undefined,reject);
  });
}

function roundedShape(w,h,r){
  const x=-w/2,y=-h/2,s=new THREE.Shape();
  s.moveTo(x+r,y);
  s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);
  s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);
  s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);
  return s;
}
function roundedPlane(w,h,r){
  const g=new THREE.ShapeGeometry(roundedShape(w,h,r),48);
  g.computeBoundingBox();
  const bb=g.boundingBox, p=g.attributes.position, uv=g.attributes.uv;
  for(let i=0;i<p.count;i++){
    uv.setXY(i,(p.getX(i)-bb.min.x)/(bb.max.x-bb.min.x),(p.getY(i)-bb.min.y)/(bb.max.y-bb.min.y));
  }
  uv.needsUpdate=true;
  return g;
}
function roundedExtrude(w,h,r,d){
  const g=new THREE.ExtrudeGeometry(roundedShape(w,h,r),{
    depth:d,bevelEnabled:true,bevelSegments:6,steps:1,bevelSize:.035,bevelThickness:.035
  });
  g.center();g.computeVertexNormals();return g;
}
function makeGlowTexture(){
  const c=document.createElement('canvas');c.width=c.height=256;
  const x=c.getContext('2d');
  const g=x.createRadialGradient(128,128,0,128,128,126);
  g.addColorStop(0,'rgba(220,255,150,.98)');
  g.addColorStop(.10,'rgba(150,223,18,.70)');
  g.addColorStop(.33,'rgba(85,170,0,.18)');
  g.addColorStop(1,'rgba(0,0,0,0)');
  x.fillStyle=g;x.fillRect(0,0,256,256);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
const glowTexture=makeGlowTexture();

function spriteGlow(scale=.8,opacity=.35,color=0xffffff){
  const mat=new THREE.SpriteMaterial({map:glowTexture,color,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending});
  const s=new THREE.Sprite(mat);s.scale.setScalar(scale);return s;
}

function artFace(tex,w,h,z,rotY=0){
  const m=new THREE.MeshBasicMaterial({
    map:tex,transparent:true,alphaTest:.01,toneMapped:false,side:THREE.DoubleSide,
    polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4
  });
  const mesh=new THREE.Mesh(roundedPlane(w,h,.16),m);
  mesh.position.z=z;mesh.rotation.y=rotY;mesh.renderOrder=5;
  return mesh;
}

function makeCard(frontTex,backTex){
  const g=new THREE.Group();
  const body=new THREE.Mesh(
    roundedExtrude(4.38,2.58,.19,.105),
    new THREE.MeshPhysicalMaterial({
      color:0x111312,metalness:.77,roughness:.19,clearcoat:1,clearcoatRoughness:.10
    })
  );
  body.castShadow=true;body.receiveShadow=true;g.add(body);

  const front=artFace(frontTex,4.32,2.54,.108,0);
  const back=artFace(backTex,4.32,2.54,-.108,Math.PI);
  g.add(front,back);

  const edge=new THREE.LineSegments(
    new THREE.EdgesGeometry(body.geometry,28),
    new THREE.LineBasicMaterial({color:0xb8ff43,transparent:true,opacity:.26,blending:THREE.AdditiveBlending})
  );
  g.add(edge);

  const glow=spriteGlow(6.0,.11,0xaaff33);
  glow.position.z=-.18;glow.scale.y=.55;g.add(glow);

  // travelling reflection sweep above the front face
  const sweepMat=new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    uniforms:{uX:{value:-1.2},uAlpha:{value:0}},
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader:`varying vec2 vUv;uniform float uX;uniform float uAlpha;void main(){
      float band=1.0-smoothstep(.0,.16,abs((vUv.x+vUv.y*.32)-uX));
      gl_FragColor=vec4(vec3(.72,1.0,.45)*band,uAlpha*band*.85);
    }`
  });
  const sweep=new THREE.Mesh(roundedPlane(4.30,2.52,.16),sweepMat);
  sweep.position.z=.116;sweep.renderOrder=8;g.add(sweep);

  g.userData={body,front,back,edge,glow,sweep,sweepMat};
  return g;
}

function makePhone(screenTex){
  const g=new THREE.Group();
  const body=new THREE.Mesh(
    roundedExtrude(2.50,5.18,.30,.24),
    new THREE.MeshPhysicalMaterial({
      color:0x171918,metalness:.96,roughness:.13,clearcoat:1,clearcoatRoughness:.07
    })
  );
  body.castShadow=true;g.add(body);

  // front display
  const screenGeo=roundedPlane(2.27,4.88,.25);
  const screenMat=new THREE.MeshBasicMaterial({map:screenTex,toneMapped:false,color:0xffffff});
  const screen=new THREE.Mesh(screenGeo,screenMat);
  screen.position.z=.178;screen.renderOrder=5;g.add(screen);

  const glass=new THREE.Mesh(screenGeo,new THREE.MeshPhysicalMaterial({
    color:0xffffff,transparent:true,opacity:.02,roughness:.02,clearcoat:1,clearcoatRoughness:.02
  }));
  glass.position.z=.184;glass.renderOrder=6;g.add(glass);

  // back panel
  const backPanel=new THREE.Mesh(
    roundedPlane(2.27,4.88,.25),
    new THREE.MeshPhysicalMaterial({color:0x111412,metalness:.68,roughness:.32,clearcoat:.7,side:THREE.DoubleSide})
  );
  backPanel.position.z=-.178;backPanel.rotation.y=Math.PI;g.add(backPanel);

  // camera bump
  const bump=new THREE.Mesh(
    roundedExtrude(.88,.88,.18,.082),
    new THREE.MeshPhysicalMaterial({color:0x202321,metalness:.86,roughness:.16,clearcoat:1})
  );
  bump.position.set(-.66,1.65,-.228);bump.rotation.y=Math.PI;g.add(bump);

  const lensMat=new THREE.MeshPhysicalMaterial({
    color:0x010202,metalness:.62,roughness:.035,clearcoat:1,clearcoatRoughness:.02
  });
  [[-.86,1.86],[-.49,1.86],[-.68,1.49]].forEach(([x,y])=>{
    const l=new THREE.Mesh(new THREE.CylinderGeometry(.118,.118,.052,40),lensMat);
    l.rotation.x=Math.PI/2;l.position.set(x,y,-.282);g.add(l);
    const ring=new THREE.Mesh(
      new THREE.TorusGeometry(.128,.014,8,32),
      new THREE.MeshBasicMaterial({color:0x737a74})
    );
    ring.position.set(x,y,-.309);ring.rotation.x=Math.PI/2;g.add(ring);
  });

  const flashDot=new THREE.Mesh(
    new THREE.CircleGeometry(.055,28),
    new THREE.MeshBasicMaterial({color:0xf4f1d8,toneMapped:false})
  );
  flashDot.position.set(-.43,1.49,-.311);flashDot.rotation.y=Math.PI;g.add(flashDot);

  const lidar=new THREE.Mesh(
    new THREE.CircleGeometry(.038,28),
    new THREE.MeshBasicMaterial({color:0x181a19,toneMapped:false})
  );
  lidar.position.set(-.42,1.63,-.312);lidar.rotation.y=Math.PI;g.add(lidar);

  // NFC mark on the back
  const nfc=new THREE.Group();
  for(let i=0;i<3;i++){
    const arc=new THREE.Mesh(
      new THREE.TorusGeometry(.13+i*.105,.018,8,48,Math.PI*1.06),
      new THREE.MeshBasicMaterial({color:0x9fe91f,toneMapped:false})
    );
    arc.rotation.z=-Math.PI*.53;nfc.add(arc);
  }
  nfc.position.set(.53,.88,-.207);nfc.rotation.y=Math.PI;g.add(nfc);

  // Dynamic island
  const island=new THREE.Mesh(new THREE.CapsuleGeometry(.10,.40,8,14),new THREE.MeshBasicMaterial({color:0x010101}));
  island.rotation.z=Math.PI/2;island.scale.set(1,1,.16);island.position.set(0,2.16,.205);g.add(island);

  // edge buttons
  const bm=new THREE.MeshStandardMaterial({color:0x2c2f2d,metalness:.85,roughness:.2});
  const b1=new THREE.Mesh(new THREE.BoxGeometry(.05,.60,.10),bm);b1.position.set(-1.29,.58,.03);g.add(b1);
  const b2=b1.clone();b2.scale.y=.52;b2.position.y=1.27;g.add(b2);
  const b3=b1.clone();b3.scale.y=.78;b3.position.set(1.29,.78,.03);g.add(b3);

  const frame=new THREE.LineSegments(
    new THREE.EdgesGeometry(body.geometry,26),
    new THREE.LineBasicMaterial({color:0xc7ccc8,transparent:true,opacity:.14})
  );
  g.add(frame);

  const glow=spriteGlow(5.1,.09,0xaaff33);glow.position.z=-.38;glow.scale.x=.70;g.add(glow);
  g.userData={body,screen,glass,backPanel,nfc,glow,frame};
  return g;
}

function makePulseRing(r=.4){
  const m=new THREE.Mesh(
    new THREE.TorusGeometry(r,.018,8,96),
    new THREE.MeshBasicMaterial({color:0xb8ff43,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false})
  );
  return m;
}

function makeEnergyBeam(){
  const geo=new THREE.PlaneGeometry(3.6,.028);
  const mat=new THREE.MeshBasicMaterial({color:0xcfff72,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});
  const m=new THREE.Mesh(geo,mat);
  return m;
}

function makeWorld(){
  const g=new THREE.Group();
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(34,24),new THREE.MeshPhysicalMaterial({
    color:0x050606,metalness:.40,roughness:.48,clearcoat:.22
  }));
  floor.rotation.x=-Math.PI/2;floor.position.y=-3.08;floor.receiveShadow=true;g.add(floor);

  const planeMat=(color,opacity)=>new THREE.MeshBasicMaterial({color,transparent:true,opacity,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending});
  const redSheet=new THREE.Mesh(new THREE.PlaneGeometry(7,17),planeMat(0x690d25,.14));
  redSheet.position.set(-6.2,1,-5.3);redSheet.rotation.z=-.40;g.add(redSheet);
  const limeSheet=new THREE.Mesh(new THREE.PlaneGeometry(8,17),planeMat(0x5a8f00,.09));
  limeSheet.position.set(6.7,1.7,-5.8);limeSheet.rotation.z=.32;g.add(limeSheet);

  // dust
  const count=160,pos=new Float32Array(count*3);
  for(let i=0;i<count;i++){
    pos[i*3]=(Math.random()-.5)*23;
    pos[i*3+1]=(Math.random()-.5)*13;
    pos[i*3+2]=-1.8-Math.random()*10;
  }
  const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const points=new THREE.Points(pg,new THREE.PointsMaterial({color:0xc9ff72,size:.022,transparent:true,opacity:.42,depthWrite:false}));
  g.add(points);g.userData.points=points;
  return g;
}
const world=makeWorld();scene.add(world);
const products=new THREE.Group();scene.add(products);

scene.add(new THREE.HemisphereLight(0xcfe7c0,0x13070b,1.05));
const key=new THREE.SpotLight(0xffffff,105,28,THREE.MathUtils.degToRad(31),.52,1.4);
key.position.set(-4.5,6.7,7.5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);scene.add(key);
const rimLime=new THREE.PointLight(0x9fea23,48,17,1.8);rimLime.position.set(5.4,2.5,4);scene.add(rimLime);
const rimRed=new THREE.PointLight(0xb61b41,35,16,1.7);rimRed.position.set(-5.7,-.2,3.0);scene.add(rimRed);
const frontFill=new THREE.PointLight(0xffffff,18,16,2);frontFill.position.set(0,0,6);scene.add(frontFill);

let card,phone,fan=[],rings=[],beam,tl;
const intro=document.querySelector('.copy-intro');
const tapCopy=document.querySelector('.copy-tap');
const screenCopy=document.querySelector('.copy-screen');
const finalCopy=document.querySelector('.copy-final');
const callouts=[...document.querySelectorAll('.ui-callout')];
const scanline=document.querySelector('.scanline');
const flash=document.querySelector('.flash');
const impactRing=document.querySelector('.impact-ring');

function cloneProduct(o){
  const c=o.clone(true);
  c.traverse(n=>{
    if(n.material)n.material=n.material.clone();
  });
  return c;
}
function layout(){
  const portrait=innerWidth/innerHeight<.82;
  return portrait?{
    cameraZ:13.7,
    reveal:{x:0,y:-.55,z:.35,s:.82},
    phone:{x:0,y:-.38,z:.25,s:.83},
    tapCard:{x:1.10,y:.25,z:1.18,s:.40},
    finalPhone:{x:0,y:-1.25,z:-.2,s:.66},
    finalCard:{x:0,y:1.65,z:.62,s:.50}
  }:{
    cameraZ:11.8,
    reveal:{x:1.25,y:.05,z:.45,s:1.02},
    phone:{x:1.85,y:.03,z:.25,s:.98},
    tapCard:{x:3.20,y:.70,z:1.18,s:.44},
    finalPhone:{x:2.40,y:.0,z:-.12,s:.80},
    finalCard:{x:2.65,y:-1.55,z:.62,s:.68}
  };
}
function setCardSweep(alpha=0,x=-1.2){
  card.userData.sweepMat.uniforms.uAlpha.value=alpha;
  card.userData.sweepMat.uniforms.uX.value=x;
}
function hideRings(){
  rings.forEach(r=>{r.visible=false;r.material.opacity=0;r.scale.setScalar(.2)});
}
function setFanHidden(){
  fan.forEach(c=>{c.visible=false;c.scale.setScalar(.05)});
}

function buildTimeline(){
  if(tl) tl.kill();
  const L=layout();
  camera.position.set(0,.06,L.cameraZ);camera.rotation.set(0,0,0);
  cameraRig.position.set(0,0,0);cameraRig.rotation.set(0,0,0);

  gsap.set([intro,tapCopy,screenCopy,finalCopy,...callouts],{autoAlpha:0});
  gsap.set(scanline,{opacity:0,yPercent:-120});
  gsap.set(flash,{opacity:0});
  gsap.set(impactRing,{opacity:0,scale:.1});
  cinematicPass.uniforms.rgbAmount.value=0;
  cinematicPass.uniforms.pulse.value=0;
  bloom.strength=.72;
  setCardSweep(0,-1.2);
  hideRings();setFanHidden();
  beam.visible=false;beam.material.opacity=0;

  card.visible=true;phone.visible=false;
  gsap.set(card.position,{x:-10.5,y:-1.8,z:-3.4});
  gsap.set(card.rotation,{x:THREE.MathUtils.degToRad(38),y:THREE.MathUtils.degToRad(-135),z:THREE.MathUtils.degToRad(-28)});
  gsap.set(card.scale,{x:.35,y:.35,z:.35});
  gsap.set(phone.position,{x:12.5,y:.8,z:-4.2});
  gsap.set(phone.rotation,{x:THREE.MathUtils.degToRad(9),y:THREE.MathUtils.degToRad(168),z:THREE.MathUtils.degToRad(11)});
  gsap.set(phone.scale,{x:.52,y:.52,z:.52});

  tl=gsap.timeline({paused:!AUTOPLAY,repeat:LOOP?-1:0,repeatDelay:.45,defaults:{ease:'power3.inOut'}});

  // 0 — premium hook
  tl.to(intro,{autoAlpha:1,duration:.55,ease:'power2.out'},.08)
    .fromTo(intro,{x:-28,filter:'blur(8px)'},{x:0,filter:'blur(0px)',duration:.70,ease:'expo.out'},.08)
    .to(intro,{autoAlpha:0,duration:.38,ease:'power2.in'},1.02);

  // 1.0 — card rises from black with a travelling highlight
  tl.to(card.position,{x:L.reveal.x,y:L.reveal.y,z:L.reveal.z,duration:1.18,ease:'expo.out'},1.0)
    .to(card.rotation,{x:THREE.MathUtils.degToRad(8),y:THREE.MathUtils.degToRad(-8),z:THREE.MathUtils.degToRad(-7),duration:1.18,ease:'expo.out'},1.0)
    .to(card.scale,{x:L.reveal.s,y:L.reveal.s,z:L.reveal.s,duration:1.08,ease:'expo.out'},1.0)
    .to(card.userData.sweepMat.uniforms.uAlpha,{value:.85,duration:.16},1.28)
    .to(card.userData.sweepMat.uniforms.uX,{value:2.0,duration:.70,ease:'power2.inOut'},1.30)
    .to(card.userData.sweepMat.uniforms.uAlpha,{value:0,duration:.18},1.93)
    .to(cameraRig.rotation,{y:THREE.MathUtils.degToRad(3.0),x:THREE.MathUtils.degToRad(-1.1),duration:1.20,ease:'sine.inOut'},1.10);

  // 2.25 — fast 3D hero flip: exact front then exact back
  tl.to(card.rotation,{y:THREE.MathUtils.degToRad(182),z:THREE.MathUtils.degToRad(4),x:THREE.MathUtils.degToRad(4),duration:.72,ease:'power2.inOut'},2.22)
    .to(card.rotation,{y:THREE.MathUtils.degToRad(358),z:THREE.MathUtils.degToRad(-4),x:THREE.MathUtils.degToRad(7),duration:.72,ease:'power2.inOut'},2.94);

  // 3.45 — explosive clone burst, then magnetic collapse
  fan.forEach((c,i)=>{
    const a=(-145+i*(290/(fan.length-1)))*Math.PI/180;
    const r=(innerWidth/innerHeight<.82?3.55:5.0);
    const cx=innerWidth/innerHeight<.82?0:.5, cy=.15;
    tl.set(c,{visible:true},3.44+i*.018);
    tl.set(c.position,{x:L.reveal.x,y:L.reveal.y,z:.0},3.44+i*.018);
    tl.set(c.rotation,{x:THREE.MathUtils.degToRad(6),y:THREE.MathUtils.degToRad(350),z:0},3.44+i*.018);
    tl.to(c.scale,{x:.41,y:.41,z:.41,duration:.52,ease:'back.out(1.8)'},3.45+i*.018);
    tl.to(c.position,{x:cx+Math.cos(a)*r,y:cy+Math.sin(a)*r*.53,z:-.35-Math.abs(i-(fan.length-1)/2)*.07,duration:.72,ease:'expo.out'},3.45+i*.018);
    tl.to(c.rotation,{z:a+Math.PI/2,y:THREE.MathUtils.degToRad(338-i*3),duration:.72,ease:'expo.out'},3.45+i*.018);
  });
  tl.to(card.scale,{x:.74,y:.74,z:.74,duration:.48,ease:'power2.inOut'},3.55)
    .to(bloom,{strength:.26,duration:.20},3.50)
    .to(bloom,{strength:.18,duration:.40},3.78);
  fan.forEach((c,i)=>{
    tl.to(c.position,{x:L.reveal.x,y:L.reveal.y,z:-.1,duration:.48,ease:'power3.in'},4.10+i*.008)
      .to(c.scale,{x:.03,y:.03,z:.03,duration:.42,ease:'power3.in'},4.10+i*.008)
      .set(c,{visible:false},4.54+i*.008);
  });

  // 4.35 — phone enters from RIGHT only at this moment; card approaches from LEFT.
  tl.set(phone,{visible:true},4.30)
    .to(phone.position,{x:L.phone.x,y:L.phone.y,z:L.phone.z,duration:1.00,ease:'expo.out'},4.36)
    .to(phone.rotation,{x:THREE.MathUtils.degToRad(3),y:THREE.MathUtils.degToRad(174),z:THREE.MathUtils.degToRad(2),duration:1.00,ease:'expo.out'},4.36)
    .to(phone.scale,{x:L.phone.s,y:L.phone.s,z:L.phone.s,duration:1.0,ease:'expo.out'},4.36)
    .to(card.position,{x:L.tapCard.x,y:L.tapCard.y,z:L.tapCard.z,duration:.84,ease:'power3.inOut'},4.88)
    .to(card.rotation,{x:THREE.MathUtils.degToRad(3),y:THREE.MathUtils.degToRad(166),z:THREE.MathUtils.degToRad(-7),duration:.84},4.88)
    .to(card.scale,{x:L.tapCard.s,y:L.tapCard.s,z:L.tapCard.s,duration:.84},4.88)
    .to(tapCopy,{autoAlpha:1,duration:.22,ease:'power1.out'},5.26);

  // 5.40 — NFC "impact": rings, beam, flash, bloom, RGB split, tiny camera punch
  const tapX = innerWidth/innerHeight<.82 ? .56 : .74;
  rings.forEach((r,i)=>{
    tl.set(r,{visible:true},5.40+i*.055)
      .fromTo(r.scale,{x:.16,y:.16,z:.16},{x:1.20+i*.18,y:1.20+i*.18,z:1.20+i*.18,duration:.64,ease:'power2.out'},5.40+i*.055)
      .fromTo(r.material,{opacity:.88},{opacity:0,duration:.68,ease:'power2.out'},5.40+i*.055)
      .set(r,{visible:false},6.15+i*.055);
  });
  tl.set(beam,{visible:true},5.38)
    .to(beam.material,{opacity:.82,duration:.10},5.40)
    .to(beam.scale,{x:1.25,duration:.22,ease:'power2.out'},5.40)
    .to(beam.material,{opacity:0,duration:.30},5.62)
    .set(beam,{visible:false},5.95)
    .to(flash,{opacity:.08,duration:.08,ease:'power1.out'},5.43)
    .to(flash,{opacity:0,duration:.22,ease:'power2.out'},5.51)
    .to(impactRing,{opacity:.9,scale:2.1,duration:.48,ease:'power2.out'},5.40)
    .to(impactRing,{opacity:0,duration:.22},5.68)
    .to(cinematicPass.uniforms.rgbAmount,{value:0,duration:.08},5.41)
    .to(cinematicPass.uniforms.rgbAmount,{value:0,duration:.28},5.51)
    .to(cinematicPass.uniforms.pulse,{value:.14,duration:.08},5.42)
    .to(cinematicPass.uniforms.pulse,{value:0,duration:.30},5.50)
    .to(bloom,{strength:.30,duration:.10},5.41)
    .to(bloom,{strength:.18,duration:.42},5.52)
    .to(camera.position,{z:L.cameraZ-.28,duration:.08,ease:'power1.out'},5.42)
    .to(camera.position,{z:L.cameraZ,duration:.26,ease:'elastic.out(1,.6)'},5.50)
    .to(tapCopy,{autoAlpha:0,duration:.24},5.86);

  // 6.0 — card exits OUTSIDE; phone flips to FRONT and screen becomes hero
  tl.to(card.position,{x:L.tapCard.x+(innerWidth/innerHeight<.82?2.0:2.8),y:L.tapCard.y-1.55,z:-.1,duration:.88,ease:'power3.inOut'},5.86)
    .to(card.rotation,{x:THREE.MathUtils.degToRad(8),y:THREE.MathUtils.degToRad(340),z:THREE.MathUtils.degToRad(10),duration:.88},5.86)
    .to(card.scale,{x:.31,y:.31,z:.31,duration:.88},5.86)
    .to(phone.rotation,{x:0,y:0,z:0,duration:.92,ease:'expo.inOut'},5.90)
    .to(phone.position,{x:L.phone.x,y:L.phone.y,z:1.08,duration:.92,ease:'expo.inOut'},5.90)
    .to(phone.scale,{x:L.phone.s*1.16,y:L.phone.s*1.16,z:L.phone.s*1.16,duration:.92},5.90)
    .to(screenCopy,{autoAlpha:1,duration:.45,ease:'power2.out'},6.68);

  // screen callouts synced to the real emergency profile
  callouts.forEach((el,i)=>{
    tl.fromTo(el,{autoAlpha:0,y:14,filter:'blur(5px)'},{autoAlpha:1,y:0,filter:'blur(0px)',duration:.34,ease:'power2.out'},6.92+i*.24);
  });
  tl.to(screenCopy,{autoAlpha:0,duration:.30},8.15);
  callouts.forEach((el,i)=>tl.to(el,{autoAlpha:0,y:-8,duration:.24},8.10+i*.035));

  // 8.35 — orbit cards around the phone: TikTok-style product wall
  fan.forEach((c,i)=>{
    const a=(i/fan.length)*Math.PI*2;
    const r=innerWidth/innerHeight<.82?3.1:4.4;
    tl.set(c,{visible:true},8.26+i*.018);
    tl.set(c.position,{x:L.phone.x,y:L.phone.y,z:-.25},8.26+i*.018);
    tl.set(c.scale,{x:.05,y:.05,z:.05},8.26+i*.018);
    tl.to(c.scale,{x:.33,y:.33,z:.33,duration:.45,ease:'back.out(1.8)'},8.28+i*.018);
    tl.to(c.position,{x:Math.cos(a)*r+(innerWidth/innerHeight<.82?0:.25),y:Math.sin(a)*r*.52,z:-.55-Math.sin(a)*.30,duration:.70,ease:'expo.out'},8.28+i*.018);
    tl.to(c.rotation,{x:THREE.MathUtils.degToRad(6+Math.sin(a)*7),y:THREE.MathUtils.degToRad(340+Math.cos(a)*18),z:a+Math.PI/2,duration:.70,ease:'expo.out'},8.28+i*.018);
  });
  tl.to(phone.scale,{x:.68,y:.68,z:.68,duration:.65,ease:'power3.inOut'},8.38)
    .to(phone.position,{x:0,y:.12,z:-.30,duration:.65,ease:'power3.inOut'},8.38)
    .to(camera.position,{z:L.cameraZ+.55,y:.10,duration:.65,ease:'power3.inOut'},8.38)
    .to(cameraRig.rotation,{y:THREE.MathUtils.degToRad(-2.6),duration:.85,ease:'sine.inOut'},8.55);

  // 9.55 — magnetic collapse into final hero composition
  fan.forEach((c,i)=>{
    tl.to(c.position,{x:0,y:.1,z:-.25,duration:.42,ease:'power3.in'},9.52+i*.009)
      .to(c.scale,{x:.02,y:.02,z:.02,duration:.38,ease:'power3.in'},9.52+i*.009)
      .set(c,{visible:false},9.94+i*.009);
  });

  tl.to(phone.position,{x:L.finalPhone.x,y:L.finalPhone.y,z:L.finalPhone.z,duration:.92,ease:'expo.inOut'},9.72)
    .to(phone.rotation,{x:THREE.MathUtils.degToRad(2),y:THREE.MathUtils.degToRad(-10),z:THREE.MathUtils.degToRad(2),duration:.92,ease:'expo.inOut'},9.72)
    .to(phone.scale,{x:L.finalPhone.s,y:L.finalPhone.s,z:L.finalPhone.s,duration:.92,ease:'expo.inOut'},9.72)
    .to(card.position,{x:L.finalCard.x,y:L.finalCard.y,z:L.finalCard.z,duration:.92,ease:'expo.inOut'},9.72)
    .to(card.rotation,{x:THREE.MathUtils.degToRad(14),y:THREE.MathUtils.degToRad(350),z:THREE.MathUtils.degToRad(-8),duration:.92,ease:'expo.inOut'},9.72)
    .to(card.scale,{x:L.finalCard.s,y:L.finalCard.s,z:L.finalCard.s,duration:.92,ease:'expo.inOut'},9.72)
    .to(camera.position,{z:L.cameraZ,y:.06,duration:.82,ease:'power2.inOut'},9.78)
    .to(cameraRig.rotation,{x:0,y:0,z:0,duration:.82,ease:'power2.inOut'},9.78)
    .to(finalCopy,{autoAlpha:1,duration:.55,ease:'power2.out'},10.42)
    .to(card.userData.sweepMat.uniforms.uAlpha,{value:.58,duration:.13},10.80)
    .set(card.userData.sweepMat.uniforms.uX,{value:-1.1},10.80)
    .to(card.userData.sweepMat.uniforms.uX,{value:1.9,duration:.66,ease:'sine.inOut'},10.82)
    .to(card.userData.sweepMat.uniforms.uAlpha,{value:0,duration:.18},11.42)
    .to(phone.rotation,{y:THREE.MathUtils.degToRad(-7),duration:1.0,ease:'sine.inOut'},11.28)
    .to(card.rotation,{y:THREE.MathUtils.degToRad(354),z:THREE.MathUtils.degToRad(-5),duration:1.0,ease:'sine.inOut'},11.28)
    .to(finalCopy,{autoAlpha:0,duration:.30,ease:'power2.in'},12.45);

  tl.duration(12.85);
  if(AUTOPLAY) tl.play(0);
}

function positionEffects(){
  const L=layout();
  rings.forEach(r=>r.position.set(
    L.phone.x+(innerWidth/innerHeight<.82?.48:.72),
    L.phone.y+.82,
    1.28
  ));
  beam.position.set(
    L.phone.x+(innerWidth/innerHeight<.82?.28:.40),
    L.phone.y+.73,
    1.32
  );
  beam.rotation.z=innerWidth/innerHeight<.82?THREE.MathUtils.degToRad(-10):THREE.MathUtils.degToRad(-4);
}

let paused=false;
document.querySelector('#replay').addEventListener('click',()=>{tl.restart();paused=false;document.querySelector('#pause').textContent='Ⅱ'});
document.querySelector('#pause').addEventListener('click',()=>{
  paused=!paused;
  paused?tl.pause():tl.play();
  document.querySelector('#pause').textContent=paused?'▶':'Ⅱ';
});
addEventListener('keydown',e=>{
  if(e.code==='Space'){e.preventDefault();document.querySelector('#pause').click()}
  if(e.key.toLowerCase()==='r')document.querySelector('#replay').click();
});

function resize(){
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  composer.setSize(innerWidth,innerHeight);
  buildTimeline();positionEffects();
}
addEventListener('resize',()=>{clearTimeout(window.__vitalResize);window.__vitalResize=setTimeout(resize,120)});

const clock=new THREE.Clock();
renderer.setAnimationLoop(()=>{
  const t=clock.getElapsedTime();
  world.userData.points.rotation.y=t*.006;
  world.userData.points.rotation.z=Math.sin(t*.14)*.012;
  if(card){
    card.userData.glow.material.opacity=.095+Math.sin(t*1.8)*.018;
  }
  if(phone){
    phone.userData.glow.material.opacity=.075+Math.sin(t*1.25+.6)*.015;
  }
  composer.render();
});

(async function init(){
  try{
    const [front,back,screen]=await Promise.all([
      loadTexture('./assets/card-front.png'),
      loadTexture('./assets/card-back.png'),
      loadTexture('./assets/emergency-screen.png')
    ]);

    card=makeCard(front,back);products.add(card);
    phone=makePhone(screen);products.add(phone);

    for(let i=0;i<12;i++){
      const c=cloneProduct(card);c.visible=false;products.add(c);fan.push(c);
    }
    for(let i=0;i<5;i++){
      const r=makePulseRing(.34+i*.16);r.visible=false;products.add(r);rings.push(r);
    }
    beam=makeEnergyBeam();products.add(beam);

    positionEffects();
    buildTimeline();
    app.classList.add('webgl-ready');
    loaderEl.classList.add('hide');
  }catch(err){
    console.error(err);
    loaderEl.querySelector('span').textContent='WEBGL MODULES OFFLINE — FALLBACK POSTER';
    setTimeout(()=>loaderEl.classList.add('hide'),1000);
  }
})();
