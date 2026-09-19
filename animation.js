
(() => {
  const qs = new URLSearchParams(location.search);
  const requestedFormat = (qs.get("format") || "auto").toLowerCase();
  const loop = ["1","true","yes"].includes((qs.get("loop") || "0").toLowerCase());
  const controls = !["0","false","no"].includes((qs.get("controls") || "1").toLowerCase());
  const autoplay = !["0","false","no"].includes((qs.get("autoplay") || "1").toLowerCase());
  const speed = Math.max(.35, Math.min(2.5, Number(qs.get("speed") || 1)));
  const D = 13000 / speed;

  document.body.classList.add(`format-${["portrait","landscape","square"].includes(requestedFormat) ? requestedFormat : "auto"}`);

  const stage = document.getElementById("stage");
  const intro = document.getElementById("intro");
  const card = document.getElementById("cardRig");
  const phone = document.getElementById("phoneRig");
  const nfc = document.getElementById("nfcZone");
  const chipsWrap = document.getElementById("featureChips");
  const chips = [...document.querySelectorAll(".chip")];
  const finalLockup = document.getElementById("finalLockup");
  const replay = document.getElementById("replayBtn");

  if (!controls) replay.style.display = "none";

  let animations = [];
  let timer = null;
  let isPaused = false;

  const kf = (el, frames, options={}) => {
    const a = el.animate(frames, {duration:D, fill:"forwards", easing:"linear", ...options});
    animations.push(a);
    return a;
  };

  function resetStyles(){
    replay.classList.remove("show");
    if (timer) { clearTimeout(timer); timer = null; }
    [intro,card,phone,nfc,chipsWrap,finalLockup,...chips,...nfc.querySelectorAll(".nfc-ring")]
      .forEach(el => el.getAnimations().forEach(a=>a.cancel()));
    animations = [];
  }

  function play(){
    resetStyles();
    isPaused = false;

    kf(intro,[
      {offset:0,opacity:0,transform:"translate(-50%,-50%) scale(.92)",filter:"blur(8px)"},
      {offset:.055,opacity:1,transform:"translate(-50%,-50%) scale(1)",filter:"blur(0px)"},
      {offset:.12,opacity:1,transform:"translate(-50%,-50%) scale(1.01)",filter:"blur(0px)"},
      {offset:.17,opacity:0,transform:"translate(-50%,-50%) scale(1.08)",filter:"blur(5px)"},
      {offset:1,opacity:0,transform:"translate(-50%,-50%) scale(1.08)",filter:"blur(5px)"}
    ]);

    kf(card,[
      {offset:0,opacity:0,transform:"translate(-50%,-50%) translate3d(-36vw,12vh,-420px) rotateX(26deg) rotateY(-120deg) rotateZ(-24deg) scale(.62)"},
      {offset:.13,opacity:0,transform:"translate(-50%,-50%) translate3d(-29vw,10vh,-320px) rotateX(20deg) rotateY(-90deg) rotateZ(-18deg) scale(.72)"},
      {offset:.19,opacity:1,transform:"translate(-50%,-50%) translate3d(-12vw,4vh,-80px) rotateX(12deg) rotateY(-18deg) rotateZ(-9deg) scale(.92)"},
      {offset:.28,opacity:1,transform:"translate(-50%,-50%) translate3d(-2vw,-2vh,40px) rotateX(8deg) rotateY(2deg) rotateZ(-5deg) scale(1.04)"},
      {offset:.36,opacity:1,transform:"translate(-50%,-50%) translate3d(3vw,-1vh,15px) rotateX(5deg) rotateY(182deg) rotateZ(4deg) scale(1.01)"},
      {offset:.43,opacity:1,transform:"translate(-50%,-50%) translate3d(7vw,4vh,-20px) rotateX(10deg) rotateY(205deg) rotateZ(8deg) scale(.88)"},
      {offset:.50,opacity:1,transform:"translate(-50%,-50%) translate3d(17vw,8vh,-80px) rotateX(6deg) rotateY(336deg) rotateZ(-4deg) scale(.72)"},
      {offset:.57,opacity:1,transform:"translate(-50%,-50%) translate3d(19vw,7vh,-55px) rotateX(7deg) rotateY(350deg) rotateZ(-3deg) scale(.68)"},
      {offset:.66,opacity:.2,transform:"translate(-50%,-50%) translate3d(27vw,11vh,-160px) rotateX(9deg) rotateY(355deg) rotateZ(3deg) scale(.56)"},
      {offset:.73,opacity:0,transform:"translate(-50%,-50%) translate3d(31vw,14vh,-210px) rotateX(12deg) rotateY(360deg) rotateZ(6deg) scale(.5)"},
      {offset:.80,opacity:0,transform:"translate(-50%,-50%) translate3d(33vw,14vh,-210px) rotateX(12deg) rotateY(360deg) rotateZ(6deg) scale(.5)"},
      {offset:.83,opacity:.1,transform:"translate(-50%,-50%) translate3d(32vw,12vh,-180px) rotateX(12deg) rotateY(350deg) rotateZ(2deg) scale(.54)"},
      {offset:.89,opacity:1,transform:"translate(-50%,-50%) translate3d(25vw,10vh,-60px) rotateX(7deg) rotateY(343deg) rotateZ(-3deg) scale(.62)"},
      {offset:1,opacity:1,transform:"translate(-50%,-50%) translate3d(25vw,10vh,-60px) rotateX(7deg) rotateY(343deg) rotateZ(-3deg) scale(.62)"}
    ]);

    kf(phone,[
      {offset:0,opacity:0,transform:"translate(-50%,-50%) translate3d(55vw,4vh,-380px) rotateX(8deg) rotateY(-78deg) rotateZ(8deg) scale(.7)"},
      {offset:.38,opacity:0,transform:"translate(-50%,-50%) translate3d(45vw,3vh,-280px) rotateX(6deg) rotateY(-64deg) rotateZ(7deg) scale(.76)"},
      {offset:.44,opacity:1,transform:"translate(-50%,-50%) translate3d(24vw,-2vh,-90px) rotateX(4deg) rotateY(-31deg) rotateZ(5deg) scale(.88)"},
      {offset:.52,opacity:1,transform:"translate(-50%,-50%) translate3d(10vw,-2vh,20px) rotateX(3deg) rotateY(-14deg) rotateZ(2deg) scale(.96)"},
      {offset:.60,opacity:1,transform:"translate(-50%,-50%) translate3d(3vw,-1vh,60px) rotateX(2deg) rotateY(-5deg) rotateZ(0deg) scale(1.06)"},
      {offset:.69,opacity:1,transform:"translate(-50%,-50%) translate3d(0vw,0vh,115px) rotateX(0deg) rotateY(0deg) rotateZ(0deg) scale(1.22)"},
      {offset:.78,opacity:1,transform:"translate(-50%,-50%) translate3d(1vw,0vh,100px) rotateX(0deg) rotateY(0deg) rotateZ(0deg) scale(1.18)"},
      {offset:.84,opacity:1,transform:"translate(-50%,-50%) translate3d(19vw,4vh,-15px) rotateX(3deg) rotateY(-11deg) rotateZ(2deg) scale(.9)"},
      {offset:.90,opacity:1,transform:"translate(-50%,-50%) translate3d(20vw,4vh,-15px) rotateX(3deg) rotateY(-11deg) rotateZ(2deg) scale(.9)"},
      {offset:1,opacity:1,transform:"translate(-50%,-50%) translate3d(20vw,4vh,-15px) rotateX(3deg) rotateY(-11deg) rotateZ(2deg) scale(.9)"}
    ]);

    kf(nfc,[
      {offset:0,opacity:0,transform:"translate(-50%,-50%) translate3d(0,0,0) scale(.65)"},
      {offset:.49,opacity:0,transform:"translate(-50%,-50%) translate3d(14vw,3vh,80px) scale(.65)"},
      {offset:.515,opacity:1,transform:"translate(-50%,-50%) translate3d(13vw,3vh,80px) scale(.9)"},
      {offset:.56,opacity:1,transform:"translate(-50%,-50%) translate3d(12vw,3vh,80px) scale(1.05)"},
      {offset:.61,opacity:0,transform:"translate(-50%,-50%) translate3d(10vw,2vh,80px) scale(1.35)"},
      {offset:1,opacity:0,transform:"translate(-50%,-50%) translate3d(10vw,2vh,80px) scale(1.35)"}
    ]);

    [...nfc.querySelectorAll(".nfc-ring")].forEach((ring,i)=>{
      const ra = ring.animate([
        {offset:0,transform:"translate(-50%,-50%) scale(.12)",opacity:0},
        {offset:.50+i*.006,transform:"translate(-50%,-50%) scale(.12)",opacity:0},
        {offset:.53+i*.008,transform:"translate(-50%,-50%) scale(.45)",opacity:1},
        {offset:.60+i*.012,transform:"translate(-50%,-50%) scale(1.18)",opacity:0},
        {offset:1,transform:"translate(-50%,-50%) scale(1.18)",opacity:0}
      ],{duration:D,fill:"forwards",easing:"linear"});
      animations.push(ra);
    });

    kf(chipsWrap,[
      {offset:0,opacity:0},
      {offset:.62,opacity:0},
      {offset:.67,opacity:1},
      {offset:.79,opacity:1},
      {offset:.84,opacity:0},
      {offset:1,opacity:0}
    ]);

    const starts=[.665,.69,.715,.74];
    chips.forEach((chip,i)=>{
      kf(chip,[
        {offset:0,opacity:0,transform:"translateY(14px) scale(.96)",filter:"blur(5px)"},
        {offset:starts[i],opacity:0,transform:"translateY(14px) scale(.96)",filter:"blur(5px)"},
        {offset:starts[i]+.025,opacity:1,transform:"translateY(0) scale(1)",filter:"blur(0px)"},
        {offset:.79,opacity:1,transform:"translateY(0) scale(1)",filter:"blur(0px)"},
        {offset:.835,opacity:0,transform:"translateY(-8px) scale(.98)",filter:"blur(3px)"},
        {offset:1,opacity:0,transform:"translateY(-8px) scale(.98)",filter:"blur(3px)"}
      ]);
    });

    if (document.body.classList.contains("format-portrait")) {
      kf(finalLockup,[
        {offset:0,opacity:0,transform:"translate(-50%,-50%) translateY(-12px) scale(.98)",filter:"blur(6px)"},
        {offset:.82,opacity:0,transform:"translate(-50%,-50%) translateY(-12px) scale(.98)",filter:"blur(6px)"},
        {offset:.88,opacity:1,transform:"translate(-50%,-50%) translateY(0) scale(1)",filter:"blur(0px)"},
        {offset:1,opacity:1,transform:"translate(-50%,-50%) translateY(0) scale(1)",filter:"blur(0px)"}
      ]);
    } else {
      kf(finalLockup,[
        {offset:0,opacity:0,transform:"translateY(-50%) translateX(-18px) scale(.98)",filter:"blur(6px)"},
        {offset:.82,opacity:0,transform:"translateY(-50%) translateX(-18px) scale(.98)",filter:"blur(6px)"},
        {offset:.88,opacity:1,transform:"translateY(-50%) translateX(0) scale(1)",filter:"blur(0px)"},
        {offset:1,opacity:1,transform:"translateY(-50%) translateX(0) scale(1)",filter:"blur(0px)"}
      ]);
    }

    timer = setTimeout(()=>{
      if (loop) play();
      else if (controls) replay.classList.add("show");
    },D+80);
  }

  function pauseToggle(){
    isPaused = !isPaused;
    animations.forEach(a => isPaused ? a.pause() : a.play());
  }

  replay.addEventListener("click",play);
  stage.addEventListener("dblclick",play);
  window.addEventListener("keydown",e=>{
    if (e.code==="Space"){ e.preventDefault(); pauseToggle(); }
    if (e.key.toLowerCase()==="r") play();
  });

  if (autoplay && !matchMedia("(prefers-reduced-motion: reduce)").matches) play();
  else if (matchMedia("(prefers-reduced-motion: reduce)").matches) replay.classList.remove("show");
})();
