const mem={};
const store={
  mode:"memory",
  async get(k){
    try{if(window.storage){const r=await window.storage.get(k,false);return r?JSON.parse(r.value):null;}}catch(e){}
    try{if(window.localStorage){const v=localStorage.getItem(k);return v?JSON.parse(v):null;}}catch(e){}
    return mem[k]??null;
  },
  async set(k,v){
    const s=JSON.stringify(v);
    try{if(window.storage){await window.storage.set(k,s,false);this.mode="Claude";return;}}catch(e){}
    try{if(window.localStorage){localStorage.setItem(k,s);this.mode="browser";return;}}catch(e){}
    mem[k]=v;this.mode="memory (lost on refresh)";
  }
};

/* Predefined clubs. Colors are the usual ones, but double-check the ones
   that matter to you — you can edit and save over them. */
/* Team data lives in teams.json (loaded at startup) so it is easy to edit and
   grow with more clubs and nations. These start empty and are filled by the
   fetch in the init block at the bottom of this file. */
let DEFAULT_CLUBS={};
let DEFAULT_NATIONS={};

let CLUBS={}, PRESETS={};
let NATIONS={};
let teamType="club";                 /* "club" sau "nation" */
let activeClub="arsenal";            /* key of the active team in the current set */
let lastKey={club:"arsenal",nation:"romania"};
const DB=()=>teamType==="nation"?NATIONS:CLUBS;

const $=id=>document.getElementById(id);
const FIELDS=["cat","date","cname","c1","c2","c3","d1","d2","d3","head","sub","player",
  "fee","quote","who","ctx","handle","outlet","tier","rep","plate","crestBg","font","tpl","fmt","align",
  "split","club2","dual","status","scoreA","scoreB","goalsA","goalsB",
  "oppo","statPos","sRating","sMin","sGoals","sAssists","sShots","sPass","sKey",
  "sDribbles","sTackles","sDuels","gSaves","gConceded","gSavePct","gClean","gClaims","gSweep"];

/* which stat tiles to show, in order — [field id, on-card label] */
const STAT_FIELDS={
  outfield:[["sRating","Rating"],["sMin","Min"],["sGoals","Goals"],["sAssists","Assists"],
    ["sShots","Shots OT"],["sPass","Pass %"],["sKey","Key passes"],["sDribbles","Take-ons"],
    ["sTackles","Tackles"],["sDuels","Duels won"]],
  gk:[["sRating","Rating"],["sMin","Min"],["gSaves","Saves"],["gConceded","Conceded"],
    ["gSavePct","Save %"],["gClean","Clean sheet"],["gClaims","Claims"],["gSweep","Clearances"]]
};

/* fixed on-card labels */
const L={from:"From", to:"To", src:"Source:",
  tiers:{3:"Tier one",2:"Reliable",1:"Unconfirmed"},
  st:{zvon:"Rumour",interes:"Interest",negocieri:"Talks",acord:"Agreed",
      medicale:"Medical",oficial:"Official"}};

/* transfer stages — from rumour to signature */
const STATUS={
  zvon:      {style:"dashed", arrow:"⇢", tier:1},
  interes:   {style:"dashed", arrow:"⇢", tier:1},
  negocieri: {style:"line",   arrow:"→", tier:2},
  acord:     {style:"line",   arrow:"→", tier:2},
  medicale:  {style:"line",   arrow:"→", tier:3},
  oficial:   {style:"solid",  arrow:"→", tier:3}
};

/* Each side of the card has three colour inputs: a text box holding the hex and
   the native colour picker beside it. TRIO_A is the left/single team, TRIO_B the
   right-hand one (transfer / result only). */
const HEX=/^#[0-9a-f]{6}$/i;
const TRIO_A=[["c1","c1p"],["c2","c2p"],["c3","c3p"]];
const TRIO_B=[["d1","d1p"],["d2","d2p"],["d3","d3p"]];
const trioOf=c=>[c.c1||"#FFFFFF",c.c2||"#000000",c.c3||"#000000"];
const readTrio=trio=>trio.map(([tx])=>$(tx).value);
function setTrio(trio,vals){
  trio.forEach(([tx,pk],i)=>{
    const v=vals[i]||"";
    $(tx).value=v;
    if(HEX.test(v))$(pk).value=v;
  });
}
/* a half-typed hex must not take the card's background down with it */
const hexOr=(v,fb)=>HEX.test((v||"").trim())?v.trim():fb;

function lum(hex){
  if(!/^#[0-9a-f]{6}$/i.test(hex))return 0;
  const v=[1,3,5].map(i=>{const c=parseInt(hex.substr(i,2),16)/255;
    return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4);});
  return 0.2126*v[0]+0.7152*v[1]+0.0722*v[2];
}
const ratio=(a,b)=>{const l1=lum(a),l2=lum(b);
  return (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05);};
const onColor=bg=>ratio(bg,"#FFFFFF")>=ratio(bg,"#000000")?"#FFFFFF":"#000000";
const pickInk=(p,c1,c2,c3)=>[c2,c1,c3].find(x=>ratio(p,x)>=4.5)||onColor(p);
/* body text on a single-color card: use color 2 if it reads on color 1,
   else color 3, else fall back to plain black/white. lets c2 hold the team's
   true second color even when it's dark, without breaking legibility. */
const bodyInk=(c1,c2,c3)=>{const ok=x=>ratio(c1,x)>=3;return ok(c2)?c2:ok(c3)?c3:onColor(c1);};
/* pentru text care trece peste mai multe benzi: alb sau negru, cel cu cel mai bun minim */
function inkBoth(list){
  const w=Math.min(...list.map(c=>ratio(c,"#FFFFFF")));
  const k=Math.min(...list.map(c=>ratio(c,"#000000")));
  return w>=k?"#FFFFFF":"#000000";
}
/* result score: the figure/name take the team's identity color (readable on
   color 1); the offset "echo" behind takes a second team color that is both
   visible on color 1 and clearly distinct from the figure — so the layered
   look never collapses to white-on-white when a team's color 3 is white. */
function scoreInk(c1,c2,c3){
  const fig=bodyInk(c1,c2,c3);
  const oc=onColor(c1);
  const echo=[c3,c2].find(x=>ratio(c1,x)>=2.2 && ratio(x,fig)>=1.7)
    || (oc!==fig ? oc : (lum(fig)>=0.5?"#000000":"#FFFFFF"));
  return {fig,echo};
}

/* ---------- the split shapes ----------
   Every seam is straight. A shape is one band across the whole card, or two
   half-height bands for the chevrons, and a band is just an angle plus where its
   seam sits along that angle (s, where 0.5 is through the card's middle).
   Everything else is derived from those numbers — the CSS gradient AND how big a
   crest can be on each side without touching the seam — so a new shape is a few
   numbers here instead of a round of eyeballing.

   The curved seams were dropped on 2026-07-28: they were the shapes the crests
   sat worst on, and a radial seam can't be reasoned about the way this can.
   `git show 7a52ce9:app.js` still has them.

   a / b are the crest anchors, one per side. y is the crest's BOTTOM edge when
   mode is "foot" (past the card's edge on purpose — the crest bleeds off the
   bottom, and anchoring the foot means a tall badge grows upward instead of
   being cropped harder), or its centre when mode is "mid". x is not listed: the
   crest is centred in whatever room its own colour block has, which is what
   makes the pair symmetric on a symmetric shape.
   sub caps the width of the bottom-left text so it doesn't run into the seam. */
const SPLITS={
  vert:  {bands:[{deg:90, s:0.5}],  mode:"foot", a:{y:1.102}, b:{y:1.102}, sub:420},
  diag:  {bands:[{deg:100,s:0.5}],  mode:"foot", a:{y:1.102}, b:{y:1.102}, sub:330},
  diag2: {bands:[{deg:125,s:0.5}],  mode:"mid",  a:{y:0.30},  b:{y:0.70},  sub:290},
  diagr: {bands:[{deg:62, s:0.5}],  mode:"mid",  a:{y:0.70},  b:{y:0.30},  sub:700},
  /* the seam moved off centre: one team gets the bigger block */
  voff:  {bands:[{deg:90, s:0.60}], mode:"foot", a:{y:1.102}, b:{y:1.102}, sub:520},
  voffr: {bands:[{deg:90, s:0.40}], mode:"foot", a:{y:1.102}, b:{y:1.102}, sub:320},
  /* two half-height bands whose seams meet in the middle: a > or < shape */
  chevr: {bands:[{deg:65, s:0.5,y0:0,y1:0.5},{deg:115,s:0.5,y0:0.5,y1:1}],
          mode:"mid", a:{y:0.50}, b:{y:0.24}, sub:330},
  chevl: {bands:[{deg:115,s:0.5,y0:0,y1:0.5},{deg:65, s:0.5,y0:0.5,y1:1}],
          mode:"mid", a:{y:0.24}, b:{y:0.50}, sub:330},
};
const shapeOf=mode=>SPLITS[mode]||SPLITS.vert;
/* x of the seam at a given y, in card px. A band's gradient puts its seam where
   the projection on the gradient axis is s of the way along it, which is this
   line: x = centre + (offset + (y - band centre)·cos) / sin. */
function seamAt(sh,W,H){
  const segs=sh.bands.map(b=>{
    const y0=(b.y0||0)*H, y1=(b.y1===undefined?1:b.y1)*H;
    const th=b.deg*Math.PI/180, si=Math.sin(th), co=Math.cos(th);
    const L=Math.abs(W*si)+Math.abs((y1-y0)*co), off=(b.s-0.5)*L;
    return {y0,y1,at:y=>W/2+(off+(y-(y0+y1)/2)*co)/si};
  });
  return y=>(segs.find(s=>y>=s.y0&&y<=s.y1)||segs[segs.length-1]).at(y);
}

/* builds the split background; also returns the bands so we know the contrast.
   Bands + their edge positions on a 0..1 axis (0 = left team's outer edge,
   1 = right team's outer edge) are the same whatever the seam shape — the shape
   only decides the angle, where along that angle the seam falls, and (chevrons)
   which slice of the card the band covers. */
function buildSplit(mode,A,B,dual,H){
  const sh=shapeOf(mode), W=1080;
  const w=0.005; /* half seam width, as a fraction of the axis */
  let cols,pos,seam;
  if(dual){
    /* color 1 toward the outside; toward the seam, each team shows whichever of
       its color 2 / color 3 is brighter — keeps the "brighten toward the middle"
       look even when a team's true color 2 is dark (e.g. Inter, Barcelona).
       The seam takes the other, darker one from the left-hand team. */
    const innerA=lum(A.c2)>=lum(A.c3)?A.c2:A.c3;
    const innerB=lum(B.c2)>=lum(B.c3)?B.c2:B.c3;
    seam=innerA===A.c2?A.c3:A.c2;
    cols=[A.c1,innerA,seam,innerB,B.c1];
    pos =[0, 0.25, 0.5-w, 0.5+w, 0.75, 1];
  }else{
    seam=A.c3;
    cols=[A.c1,seam,B.c1];
    pos =[0, 0.5-w, 0.5+w, 1];
  }
  const layers=sh.bands.map(b=>{
    /* the bands were written for a seam at half way; s stretches each side of
       them to put it wherever the shape wants it */
    const at=t=>t<=0.5 ? t/0.5*b.s : b.s+(t-0.5)/0.5*(1-b.s);
    const stops=cols.map((c,i)=>c+" "+(at(pos[i])*100).toFixed(2)+"% "+(at(pos[i+1])*100).toFixed(2)+"%");
    const grad="linear-gradient("+b.deg+"deg,"+stops.join(",")+")";
    if(sh.bands.length===1) return grad;
    const y0=(b.y0||0)*(H||1350), y1=(b.y1===undefined?1:b.y1)*(H||1350);
    return grad+" 0px "+y0.toFixed(1)+"px/"+W+"px "+(y1-y0).toFixed(1)+"px no-repeat";
  });
  return {css:layers.join(","), bands:cols.slice()};
}

const RANGE={
  news:{el:"bHead",max:104,min:44},
  quote:{el:"bQuote",max:64,min:32},
  move:{el:"bPlayer",max:108,min:44},
  result:{el:"rscoreBox",max:340,min:150},
  stats:{el:"stnameBox",max:120,min:46}
};

function autofit(){
  const tpl=$("tpl").value,cfg=RANGE[tpl];
  const c=$("content"),el=$(cfg.el),sub=$("bSub");
  const subRatio = tpl==="news" ? 0.33 : (tpl==="move" ? 0.26 : 0);
  let size=cfg.max;
  el.style.fontSize=size+"px";
  if(subRatio)sub.style.fontSize=Math.round(size*subRatio)+"px";
  let g=0;
  while(c.scrollHeight>c.clientHeight&&size>cfg.min&&g++<60){
    size-=2;el.style.fontSize=size+"px";
    if(subRatio)sub.style.fontSize=Math.round(size*subRatio)+"px";
  }
  const fill=c.scrollHeight/Math.max(c.clientHeight,1);
  const mode=$("align").value;
  c.classList.toggle("center",mode==="center"||(mode==="auto"&&(fill<0.58||tpl==="result")));
  return {size,fill};
}

/* ---------- auto layout: web grid on wide screens, stacked on phones ---------- */
function isWeb(){ return matchMedia("(min-width:900px)").matches; }
function applyLayout(){
  document.body.classList.toggle("web",isWeb());
  fit();
}
matchMedia("(min-width:900px)").addEventListener("change",applyLayout);

let zoom=0.6;
function fit(){
  const H=+$("fmt").value;
  const web=document.body.classList.contains("web");
  const editing=!web && document.body.classList.contains("editing");
  const avail=document.querySelector(".preview").clientWidth-24;
  const maxH=web?innerHeight-200:(editing?Math.min(innerHeight*0.30,300):Math.min(innerHeight*0.46,460));
  const base=Math.min(avail/1080,maxH/H);
  const k=base*zoom;
  const st=$("stage");
  st.style.width=Math.round(1080*k)+"px";
  st.style.height=Math.round(H*k)+"px";
  $("card").style.transform="scale("+k+")";
}
function setZoom(v){
  zoom=Math.min(2,Math.max(0.5,v));
  $("zoom").value=Math.round(zoom*100);
  $("zoomLab").textContent=Math.round(zoom*100)+"%";
  fit();
}
$("zoom").addEventListener("input",e=>setZoom(+e.target.value/100));
$("zoomIn").onclick=()=>setZoom(zoom+0.1);
$("zoomOut").onclick=()=>setZoom(zoom-0.1);
/* double-tap the preview to reset to 100% */
$("stage").addEventListener("dblclick",()=>setZoom(1));
addEventListener("resize",()=>{fit();autofit();});
addEventListener("orientationchange",()=>setTimeout(()=>{fit();autofit();},250));

/* while typing in a text field, shrink the preview so the keyboard has room (mobile only) */
let editTO=null;
const isTextField=el=>el&&el.matches&&el.matches("input[type=text],textarea");
document.addEventListener("focusin",e=>{
  if(isWeb()||!isTextField(e.target)) return;
  clearTimeout(editTO);
  document.body.classList.add("editing"); fit();
});
document.addEventListener("focusout",e=>{
  if(!isTextField(e.target)) return;
  clearTimeout(editTO);
  editTO=setTimeout(()=>{
    if(!isTextField(document.activeElement)){ document.body.classList.remove("editing"); fit(); }
  },220);
});

/* group order: by country (clubs) or by continent (nationals) */
const GROUP_ORDER={
  club:["England","Spain","Italy","Germany","France","Portugal","Netherlands",
        "Scotland","Turkey","Rest of Europe","Romania","Saved"],
  nation:["Europe","South America","North America","Africa","Asia","Oceania","Saved"]
};
const groupKey=c=>(c&&(c.country||c.continent))||"Saved";
function groupsOf(){
  const seen=new Set();
  Object.values(DB()).forEach(c=>seen.add(groupKey(c)));
  const ord=GROUP_ORDER[teamType]||[];
  return [...seen].sort((a,b)=>
    (ord.indexOf(a)<0?99:ord.indexOf(a))-(ord.indexOf(b)<0?99:ord.indexOf(b)));
}
function teamsInGroup(g){
  return Object.entries(DB()).filter(([,c])=>groupKey(c)===g)
    .sort((x,y)=>x[1].name.localeCompare(y[1].name,"en"));
}
/* ---------- searchable comboboxes (country + team pickers) ----------
   Each combobox is a text input + a filtered list + a hidden input that keeps
   the same id as the old <select>, so everything reading $("club2").value etc.
   keeps working. A country box lists the groups; the team box next to it only
   offers clubs/nations from the country picked in that country box. */
function optGroups(){ return groupsOf().map(g=>({value:g,label:g})); }
/* teams limited to the country/continent chosen in the paired country box */
function optTeamsIn(groupId){
  return ()=>teamsInGroup($(groupId).value).map(([k,c])=>({value:k,label:c.name}));
}
function makeCombo(id,getOptions,onSelect){
  const input=$(id+"_in"), list=$(id+"_list"), hidden=$(id);
  let open=false, active=0, filtered=[];
  const labelFor=v=>{const o=getOptions().find(x=>x.value===v);return o?o.label:"";};
  function draw(){
    const q=input.value.trim().toLowerCase(), all=getOptions();
    /* `q` on an option is search-only text (a reporter's handle), matched but not shown */
    filtered=q?all.filter(o=>o.label.toLowerCase().includes(q)||(o.sub||"").toLowerCase().includes(q)
      ||(o.q||"").toLowerCase().includes(q)):all;
    if(active>=filtered.length)active=filtered.length-1;
    if(active<0)active=0;
    list.innerHTML=filtered.length?filtered.map((o,i)=>
      '<div class="comboOpt'+(i===active?' active':'')+'" role="option" data-v="'+esc(o.value)+'">'
      +'<span class="coName">'+esc(o.label)+'</span>'
      +(o.sub?'<span class="coSub">'+esc(o.sub)+'</span>':'')+'</div>').join('')
      :'<div class="comboEmpty">No matches</div>';
  }
  /* keep the open list within the space the on-screen keyboard leaves (iOS):
     size it to the room below the field, or flip it above when that is tight */
  function positionList(){
    const vv=window.visualViewport, r=input.getBoundingClientRect();
    const vTop=vv?vv.offsetTop:0, vBot=vv?vv.offsetTop+vv.height:window.innerHeight;
    const below=vBot-r.bottom-12, above=r.top-vTop-12;
    const up=below<230 && above>below;
    list.classList.toggle("up",up);
    list.style.maxHeight=Math.max(132,Math.min(360,up?above:below))+"px";
  }
  function openList(){open=true;list.classList.add("on");input.setAttribute("aria-expanded","true");
    positionList();requestAnimationFrame(positionList);setTimeout(positionList,300);}
  function closeList(){open=false;list.classList.remove("on","up");input.setAttribute("aria-expanded","false");}
  function scrollActive(){const el=list.children[active];if(el&&el.scrollIntoView)el.scrollIntoView({block:"nearest"});}
  function commit(v){hidden.value=v;input.value=labelFor(v);closeList();input.blur();onSelect(v);}
  input.addEventListener("focus",()=>{input.value="";active=0;openList();draw();});
  input.addEventListener("input",()=>{if(!open)openList();active=0;draw();positionList();});
  input.addEventListener("keydown",e=>{
    if(e.key==="ArrowDown"){e.preventDefault();if(!open){openList();draw();return;}active=Math.min(active+1,filtered.length-1);draw();scrollActive();}
    else if(e.key==="ArrowUp"){e.preventDefault();active=Math.max(active-1,0);draw();scrollActive();}
    else if(e.key==="Enter"){if(open&&filtered[active]){e.preventDefault();commit(filtered[active].value);}}
    else if(e.key==="Escape"){e.preventDefault();input.value=labelFor(hidden.value);closeList();input.blur();}
  });
  input.addEventListener("blur",()=>{setTimeout(()=>{if(!open)return;input.value=labelFor(hidden.value);closeList();},140);});
  /* pointerdown (fires before blur) so a tap selects on touch and desktop alike */
  list.addEventListener("pointerdown",e=>{const o=e.target.closest(".comboOpt");if(o){e.preventDefault();commit(o.dataset.v);}});
  if(window.visualViewport){const rz=()=>{if(open)positionList();};
    window.visualViewport.addEventListener("resize",rz);
    window.visualViewport.addEventListener("scroll",rz);}
  return {set(v){hidden.value=v;input.value=labelFor(v);}, get(){return hidden.value;}};
}
const combos={};
combos.groupPick=makeCombo("groupPick",optGroups,g=>{const t=teamsInGroup(g)[0];if(t)loadClub(t[0]);});
combos.clubPick =makeCombo("clubPick", optTeamsIn("groupPick"), k=>loadClub(k));
combos.group2   =makeCombo("group2",   optGroups,g=>{
  const t=teamsInGroup(g).find(([k])=>k!==activeClub)||teamsInGroup(g)[0];
  if(t){combos.club2.set(t[0]);loadClub2(t[0]);} else render();});
combos.club2    =makeCombo("club2",    optTeamsIn("group2"), k=>loadClub2(k));

/* ---------- reporters (reporters.json) ----------
   Handle + Outlet + Reliability are the three fields typed on every single card,
   so they get their own picker: one tap fills all three, with a link out to the
   profile. The list is data — add your own people to reporters.json. A missing or
   broken file is deliberately not fatal: the picker is simply empty and the three
   fields stay hand-typed, exactly as before. */
let REPORTERS=[];
const REP_NONE="— none · type it myself —";
/* an outlet cited without a person has no handle, so the name is the fallback key */
const repVal=r=>r.handle||r.name;
function optReporters(){
  return [{value:"",label:REP_NONE}].concat(REPORTERS.map(r=>({
    value:repVal(r), label:r.name, sub:r.outlet||"",
    q:(r.handle||"")+" "+(r.outlet||"")})));
}
const repOf=v=>REPORTERS.find(r=>repVal(r)===v);
/* the profile link is derived from the handle unless the entry names a url */
function repURL(r){
  if(r.url) return r.url;
  return /^@[A-Za-z0-9_]+$/.test(r.handle||"") ? "https://x.com/"+r.handle.slice(1) : "";
}
function updateRepLink(){
  const r=repOf($("rep").value), u=r?repURL(r):"", a=$("repLink");
  a.classList.toggle("hide",!u);
  if(u){ a.href=u; a.setAttribute("aria-label","Open "+r.name+" — opens in a new tab"); }
}
function pickReporter(v){
  const r=repOf(v);
  if(r){
    $("handle").value=r.handle||"";
    $("outlet").value=r.outlet||"";
    if(r.tier) $("tier").value=String(r.tier);
  }
  updateRepLink(); render(); saveDraft();
}
combos.rep=makeCombo("rep",optReporters,pickReporter);
/* editing the byline by hand un-picks the reporter, so the picker never claims a
   source the card no longer shows */
["handle","outlet"].forEach(id=>$(id).addEventListener("input",()=>{
  const r=repOf($("rep").value); if(!r) return;
  if($("handle").value!==(r.handle||"")||$("outlet").value!==(r.outlet||"")){
    combos.rep.set(""); updateRepLink();
  }
}));

/* set the four pickers to reflect the current team 1 + team 2.
   a country box is always set before the team box beside it, because the team
   box's options are scoped to whatever its country box currently holds. */
function drawPickers(){
  const a=DB()[activeClub]||Object.values(DB())[0];
  const g1=groupKey(a);
  combos.groupPick.set(g1);
  combos.clubPick.set(DB()[activeClub]?activeClub:(teamsInGroup(g1)[0]?.[0]||""));

  const prev2=$("club2").value;
  let k2=prev2;
  if(!DB()[k2]||k2===activeClub){
    const other=Object.entries(DB()).find(([k,c])=>k!==activeClub&&groupKey(c)!==g1)
              ||Object.entries(DB()).find(([k])=>k!==activeClub);
    k2=other?other[0]:activeClub;
  }
  combos.group2.set(groupKey(DB()[k2]||a));
  combos.club2.set(k2);
  /* if we had to move the right-side team (team type switched, or it collided
     with the left one), its colour inputs follow it — otherwise the card would
     paint the new club in the old one's colours. */
  if(k2!==prev2&&DB()[k2])setTrio(TRIO_B,trioOf(DB()[k2]));
}

const val=id=>$(id).value;
const esc=s=>String(s).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));
/* write the score in both layers: the colored echo + the figure itself */
function setFig(id,txt){
  const el=$(id);
  el.querySelector(".echo").textContent=txt;
  el.querySelector(".fig").textContent=txt;
}
/* faint crest backdrop, loaded on demand from crests/<team key>.png. One crest
   on single-team cards (News/Quote/Stats); on transfer & result both teams show,
   one per side. Teams without a file simply show nothing. */
const crestSeen={};   /* key -> "ok" | "no", so we probe each file once */
const crestFails={};  /* key -> failed probes, so a dropped request isn't fatal */
const CREST_TRIES=3;  /* attempts before a crest is treated as genuinely absent */
/* Bump whenever the artwork in crests/ changes. The filenames stay the same when
   a crest is replaced, so a browser that already has one keeps serving the old
   picture — which is how the placeholder shields survived the switch to real
   crests. The query string gives the new artwork a new URL. */
const CREST_V="2026-07-28";
const crestURL=key=>"crests/"+key+".png?v="+CREST_V;
/* ---------- how big each crest is, and where it goes ----------
   masks and clip-path don't survive html2canvas export, so instead of clipping a
   crest to the seam we place it deep inside its own team's colour region. This
   was a table of tuned {x,y,d} per shape until 2026-07-28 (`git show
   7a52ce9:app.js`); it is computed from the seam and the artwork now.

   What the tuned table got wrong: it gave every crest the same 583px box. But a
   crest layer is only 540px wide (half the card), so a box that wide can never
   fit — a badge whose artwork fills its file lost up to 76px off the card's edge,
   while a narrow one padded with transparency lost nothing. Same box, so a round
   badge also *looked* up to 2.4x the size of a tall shield beside it.

   Size now comes from the badge, not the box. Each file is measured once
   (crestBox: how much of its square the artwork fills — and all 334 are exactly
   centred in their file, so the artwork's centre is still the box's centre), then
   both crests on a card are scaled to the SAME visible size, matching the
   geometric mean of the visible artwork — which is what "identical size" can mean
   when one badge is a circle and the other a tall shield. Whichever side has less
   room sets that size for both, so the pair always matches. */
const CREST_TARGET=0.46;  /* the pair's visible size, as a fraction of card width */
const CREST_GAP=24;       /* px of clear colour to leave between a crest and the seam */
const CREST_TALL=0.65;    /* a foot-anchored crest may not be taller than this x H */
const crestBox={};        /* key -> {w,h}: the artwork's share of its square file */
const boxOf=key=>crestBox[key]||{w:1,h:1};
let _bcv=null;
/* the artwork's own bounding box inside the file, as fractions. Cheap: the file
   is drawn once into a 160px square and scanned for alpha, ~26k pixels. */
function measureCrest(img){
  try{
    const N=160;
    if(!_bcv){ _bcv=document.createElement("canvas"); _bcv.width=_bcv.height=N; }
    const cx=_bcv.getContext("2d",{willReadFrequently:true});
    cx.clearRect(0,0,N,N); cx.drawImage(img,0,0,N,N);
    const a=cx.getImageData(0,0,N,N).data;
    let x0=N,y0=N,x1=-1,y1=-1;
    for(let y=0;y<N;y++)for(let x=0;x<N;x++)
      if(a[(y*N+x)*4+3]>16){ if(x<x0)x0=x; if(x>x1)x1=x; if(y<y0)y0=y; if(y>y1)y1=y; }
    if(x1<0) return {w:1,h:1};
    return {w:(x1-x0+1)/N, h:(y1-y0+1)/N};
  }catch(e){ return {w:1,h:1}; }   /* an odd file just keeps the whole box */
}
/* the room one side has: the crest is centred between the card's outer edge and
   the seam (or the layer's edge, whichever comes first), measured across the
   whole height the crest could occupy — the seam is slanted, so the tightest
   point along that height is the one that counts. */
function crestRoom(sh,anch,isB,bx,W,H,chHint){
  const sx=seamAt(sh,W,H), foot=sh.mode==="foot", y=anch.y*H;
  const tall=foot?Math.min(CREST_TALL*H,y):2*Math.min(y,H-y);
  const ch=Math.min(chHint||tall,tall);
  const lo=foot?y-ch:y-ch/2, hi=foot?y:y+ch/2;
  let seam=null;
  for(let i=0;i<9;i++){
    const v=sx(Math.max(0,Math.min(H,lo+(hi-lo)*i/8)));
    seam=seam===null?v:(isB?Math.max(seam,v):Math.min(seam,v));
  }
  const x0=isB?Math.max(W/2,seam+CREST_GAP):0;
  const x1=isB?W:Math.min(W/2,seam-CREST_GAP);
  const hw=Math.max(40,(x1-x0)/2), g=Math.sqrt(bx.w*bx.h);
  /* the widest box this side could hold, and so the visible size it can show */
  return {cx:(x0+x1)/2, g, box:Math.min(2*hw/bx.w,tall/bx.h)};
}
/* both crests, in card px: {boxW,left,top} per side, plus the size they share.
   How tall a crest is decides how much of the slanted seam it has to clear, and
   how much room it has decides how tall it may be — so this settles the two by
   starting from the size we'd like and only ever taking less. Going the other way
   (measuring the seam over a generous height, then growing into the room that
   found) can grow a crest into a tighter part of the seam than it was measured
   against, which is how the chevrons first came out with 5px of clearance. */
function crestPlan(mode,H,keyA,keyB){
  const sh=shapeOf(mode), W=1080, bA=boxOf(keyA), bB=boxOf(keyB);
  let T=CREST_TARGET*W, A, B;
  for(let i=0;i<3;i++){
    A=crestRoom(sh,sh.a,false,bA,W,H,T*Math.sqrt(bA.h/bA.w));
    B=crestRoom(sh,sh.b,true, bB,W,H,T*Math.sqrt(bB.h/bB.w));
    T=Math.min(T, A.box*A.g, B.box*B.g);
  }
  const lay=(s,bx,anch,isB)=>{
    const boxW=T/s.g, y=anch.y*H;
    return {boxW, left:s.cx-boxW/2-(isB?W/2:0),
            top:(sh.mode==="foot"?y-boxW*bx.h/2:y)-boxW/2};
  };
  return {a:lay(A,bA,sh.a,false), b:lay(B,bB,sh.b,true), size:T};
}
function updateWall(tpl){
  const wall=$("vWall"), wa=$("vWallA"), wb=$("vWallB");
  const op=parseFloat($("crestBg").value)||0;
  const single=tpl==="news"||tpl==="quote"||tpl==="stats";
  const two=tpl==="move"||tpl==="result";
  const hide=e=>e.classList.add("hide");
  /* show team `key`'s crest on layer `el`; a first-seen file is probed once and,
     when it loads, updateWall re-runs so the show goes through this same
     synchronous path (no fragile async closures) */
  const put=(el,key,g)=>{
    if(!op||!key||crestSeen[key]==="no"){ hide(el); return; }
    if(crestSeen[key]==="ok"){
      el.style.backgroundImage="url('"+crestURL(key)+"')";
      if(g){
        /* the card is a fixed 1080 x H box (the preview only transform-scales
           it), so laying the crest out in card pixels is exact */
        el.style.backgroundSize=g.boxW.toFixed(1)+"px auto";
        el.style.backgroundPosition=g.left.toFixed(1)+"px "+g.top.toFixed(1)+"px";
      }
      el.style.setProperty("--wallOp",op); el.classList.remove("hide"); return;
    }
    hide(el);                                    /* until the file is confirmed */
    const img=new Image();
    /* measured on the probe, before anything is laid out, so the very first
       render of a crest already knows how much of its file the badge fills */
    img.onload =()=>{ crestSeen[key]="ok"; crestBox[key]=measureCrest(img);
                      updateWall($("tpl").value); };
    /* a failed probe used to mark the team "no" for the rest of the session, so
       one dropped request — a burst of them is normal on a phone, and replacing
       all 152 crests at once guarantees a burst — meant that crest never came
       back until reload. Only give up once it has really failed. */
    img.onerror=()=>{
      const n=crestFails[key]=(crestFails[key]||0)+1;
      if(n>=CREST_TRIES){ crestSeen[key]="no"; return; }   /* actually missing */
      setTimeout(()=>updateWall($("tpl").value),300*n);    /* likely transient */
    };
    img.src=crestURL(key);
  };
  if(single){ hide(wa); hide(wb); put(wall,activeClub); }
  else if(two){
    hide(wall);
    const k2=$("club2").value;
    const pp=crestPlan(tpl==="result"?"vert":$("split").value,+$("fmt").value||1350,
                       activeClub,k2);
    put(wa,activeClub,pp.a); put(wb,k2,pp.b);
  }
  else{ [wall,wa,wb].forEach(hide); }
}
/* one line = one event; "(R)" marks it as a red card */
function renderGoals(id,raw){
  const lines=(raw||"").split("\n").map(s=>s.trim()).filter(Boolean);
  $(id).innerHTML=lines.map(line=>{
    const red=/\(r\)/i.test(line);
    const label=line.replace(/\s*\(r\)\s*/i," ").trim();
    return '<div class="ev'+(red?" red":"")+'">'+
      (red?'<span class="rc"></span>':'<span class="gd"></span>')+
      '<span class="evt">'+esc(label)+'</span></div>';
  }).join("");
}
/* show outfield vs goalkeeper stat fields in the form */
function updateStatPos(){
  const gk=$("statPos").value==="gk";
  document.querySelectorAll(".pos-of").forEach(el=>el.classList.toggle("hide",gk));
  document.querySelectorAll(".pos-gk").forEach(el=>el.classList.toggle("hide",!gk));
}
function render(){
  const tpl=$("tpl").value;
  updateTypeUI();
  if(tpl==="move" && teamType==="nation"){ setTeamType("club"); return; }
  const isResult = tpl==="result";
  const isStats = tpl==="stats";
  const c1=$("c1").value.trim(),c2=$("c2").value.trim(),c3=$("c3").value.trim();
  const plate=$("plate").value,plated=plate!=="none"&&!isResult&&!isStats;
  const ink=plated?pickInk(plate,c1,c2,c3):c2;

  const splitMode=$("split").value;
  const splitModeEff = isResult ? "vert" : splitMode;   /* Rezultat: mereu vertical */
  const split = isResult || (tpl==="move" && splitMode!=="none");
  const dual = !isResult && $("dual").value==="2";
  /* the right team keeps its name from teams.json but takes its colours from the
     d1/d2/d3 inputs, which the picker fills in and you may then override */
  const B0 = DB()[$("club2").value] || DB()[activeClub];
  const d=trioOf(B0);
  const B = {name:B0.name,
             c1:hexOr($("d1").value,d[0]), c2:hexOr($("d2").value,d[1]),
             c3:hexOr($("d3").value,d[2])};
  const A = {c1:c1,c2:c2,c3:c3};

  const r=document.documentElement.style;
  const fg=bodyInk(c1,c2,c3);
  r.setProperty("--bg",c1);r.setProperty("--fg",fg);
  r.setProperty("--trim",c3);r.setProperty("--ontrim",onColor(c3));
  r.setProperty("--bg2",B.c1);
  r.setProperty("--trim2",B.c3);r.setProperty("--ontrim2",onColor(B.c3));
  /* on each half, text sits near the outside → contrast against color 1 */
  r.setProperty("--inkA",onColor(c1));
  r.setProperty("--inkB",onColor(B.c1));
  /* result score: identity-colored figure + distinct visible echo per team */
  const siA=scoreInk(c1,c2,c3), siB=scoreInk(B.c1,B.c2,B.c3);
  r.setProperty("--figA",siA.fig);r.setProperty("--echoA",siA.echo);
  r.setProperty("--figB",siB.fig);r.setProperty("--echoB",siB.echo);
  /* transfer team names: use each team's own color 2 (then color 3) if it
     reads on the background the name sits on, else fall back to white/black.
     On a split each name sits on its own team's color 1; otherwise both sit
     on the left team's color 1. */
  const bgNameB = split ? B.c1 : c1;
  r.setProperty("--nameA",bodyInk(c1,c2,c3));
  r.setProperty("--nameB",bodyInk(bgNameB,B.c2,B.c3));
  r.setProperty("--plate",plated?plate:"transparent");
  r.setProperty("--onplate",ink);
  r.setProperty("--display",'"'+$("font").value+'"');
  const H=+$("fmt").value;
  r.setProperty("--H",H+"px");

  const card=$("card");
  /* how much room is left in the left half, next to the bottom text. On a
     diagonal the seam moves toward the left edge near the card's base, so the
     ceiling is smaller the further it leans in (SPLITS[…].sub). */
  r.setProperty("--subMax", split ? (shapeOf(splitModeEff).sub||330)+"px" : "34ch");

  let sp=null;
  if(split){
    sp=buildSplit(splitModeEff,A,B,dual,H);
    card.style.background=sp.css;
    r.setProperty("--inkBoth",inkBoth(sp.bands));
  }else{
    card.style.background="";
  }

  card.classList.toggle("tpl-move",tpl==="move");
  card.classList.toggle("tpl-result",isResult);
  card.classList.toggle("tpl-stats",isStats);
  card.classList.toggle("plated",plated);
  card.classList.toggle("split",split);
  const stKey=$("status").value;
  const st=STATUS[stKey]||null;
  const bs=$("bStatus");
  bs.classList.toggle("hide", tpl!=="move" || !st);
  bs.classList.toggle("dashed", !!st && st.style==="dashed");
  bs.classList.toggle("solid",  !!st && st.style==="solid");
  if(st) $("vStatus").textContent=L.st[stKey];

  $("vRoleA").textContent=L.from;
  $("vRoleB").textContent=L.to;

  const baseArrow = st? st.arrow : "→";
  document.querySelector(".arrow").textContent = baseArrow;

  document.querySelectorAll("[data-for]").forEach(el=>
    el.classList.toggle("hide",!el.dataset.for.split(" ").includes(tpl)));
  autoSections(tpl);

  const show=(id,on)=>$(id).classList.toggle("hide",!on);
  const has=id=>!!(val(id)||"").trim();
  show("bHead",tpl==="news"&&has("head"));
  show("bSub",(tpl==="news"||tpl==="move")&&has("sub"));
  show("bMove",tpl==="move");
  show("bPlayer",tpl==="move"&&has("player"));
  show("bFee",tpl==="move"&&has("fee"));
  show("bQm",tpl==="quote"&&has("quote"));
  show("bQuote",tpl==="quote"&&has("quote"));
  show("bWho",tpl==="quote"&&(has("who")||has("ctx")));
  show("bResult",isResult);
  show("bStats",isStats);

  if(isResult){
    $("vRhome").textContent=$("cname").value;
    $("vRaway").textContent=B.name;
    setFig("rsA",$("scoreA").value.trim()||"0");
    setFig("rsB",$("scoreB").value.trim()||"0");
    renderGoals("vGoalsA",$("goalsA").value);
    renderGoals("vGoalsB",$("goalsB").value);
  }

  updateStatPos();
  if(isStats){
    $("vSName").textContent=$("player").value;
    const m=$("oppo").value.trim();
    $("vSMatch").textContent=m;
    $("vSMatch").classList.toggle("hide",!m);
    const list=STAT_FIELDS[$("statPos").value]||STAT_FIELDS.outfield;
    const tiles=list.map(([id,label])=>{
      const v=($(id).value||"").trim();
      return v?'<div class="stat"><div class="sv">'+esc(v)+'</div>'+
        '<div class="sl">'+esc(label)+'</div></div>':'';
    }).filter(Boolean);
    $("vStatGrid").innerHTML=tiles.join("");
    $("vStatGrid").classList.toggle("hide",!tiles.length);
  }

  $("vCat").textContent=$("cat").value;
  $("vDate").textContent=$("date").value;
  document.querySelector(".tier").classList.toggle("hide",isResult);
  $("bSlug").classList.toggle("hide",isResult);
  /* on transfer / result the team names appear in the card body */
  $("vClub").classList.toggle("hide",tpl==="move"||isResult);
  $("vClub").textContent=split?B.name:$("cname").value;
  $("vHead").textContent=val("head");
  $("vSub").textContent=val("sub");
  $("vPlayer").textContent=$("player").value;
  $("vFrom").textContent=$("cname").value;
  $("vTo").textContent=B.name;
  $("vFee").textContent=val("fee");
  $("vQuote").textContent=val("quote");
  $("vWho").textContent=$("who").value;
  $("vCtx").textContent=val("ctx");
  const srcParts=[$("handle").value.trim(),$("outlet").value.trim()].filter(Boolean);
  $("vSrc").textContent=srcParts.length?L.src+" "+srcParts.join(" · "):"";
  $("bSrc").classList.toggle("hide",!srcParts.length||isResult);

  const t=+$("tier").value;
  $("vDots").innerHTML=[1,2,3].map(i=>'<i class="'+(i<=t?"on":"")+'"></i>').join("");
  $("vLab").textContent=L.tiers[t];

  const crest=DB()[activeClub]?.crest;
  $("vCrest").classList.toggle("hide",!crest);
  if(crest)$("vCrest").src=crest;

  updateWall(tpl);

  fit();
  const f=autofit();

  const eff=plated?ratio(plate,ink):ratio(c1,fg);
  const box=$("ratioBox");
  box.classList.toggle("bad",eff<3);
  box.innerHTML="Contrast <b class='r'>"+eff.toFixed(2)+":1</b> — "+
    (eff>=4.5?"good everywhere":eff>=3?"large text only":"too weak")+
    (plated?"<br>Without a plate it would be "+ratio(c1,fg).toFixed(2)+":1":"")+
    "<br>Body <b>"+f.size+"px</b> · fill <b>"+Math.round(f.fill*100)+"%</b> · "+
    ($("content").classList.contains("center")?"centered":"bottom");

  if(split&&sp){
    const ib=inkBoth(sp.bands);
    const worst=Math.min(...sp.bands.map(c=>ratio(c,ib)));
    const sb=$("splitBox");
    sb.classList.toggle("bad",worst<3);
    sb.innerHTML="Bands: "+sp.bands.map(c=>'<b>'+c+'</b>').join(" · ")+"<br>"+
      "Text over the seam: <b>"+(ib==="#FFFFFF"?"white":"black")+"</b>, "+
      "weakest <b class='r'>"+worst.toFixed(2)+":1</b>"+
      (worst<3?"<br>Too weak on one band — add a text plate.":"");
  }
}

function grow(el){el.style.height="auto";el.style.height=Math.min(el.scrollHeight,220)+"px";}
["head","sub","quote","goalsA","goalsB"].forEach(id=>$(id).addEventListener("input",()=>grow($(id))));

/* coalesce rapid typing into one render per animation frame — keeps the preview smooth */
let _raf=0;
function scheduleRender(){ if(_raf) return; _raf=requestAnimationFrame(()=>{_raf=0;render();}); }
FIELDS.forEach(id=>{const el=$(id);if(!el)return;
  el.addEventListener("input",scheduleRender);el.addEventListener("change",render);});
[...TRIO_A,...TRIO_B].forEach(([tx,pk])=>{
  $(pk).addEventListener("input",e=>{$(tx).value=e.target.value.toUpperCase();render();});
  $(tx).addEventListener("input",e=>{
    if(HEX.test(e.target.value))$(pk).value=e.target.value;});
});
/* swap the two teams in one tap. The colours travel with their team, so a
   colour you fixed by hand isn't lost (or handed to the other club) on a swap. */
$("swapClubs").addEventListener("click",()=>{
  const right=$("club2").value, left=activeClub;
  if(!DB()[right]||right===left) return;
  const wasA=readTrio(TRIO_A), wasB=readTrio(TRIO_B);
  loadClub(right);
  combos.group2.set(groupKey(DB()[left]));
  combos.club2.set(left);
  setTrio(TRIO_A,wasB);setTrio(TRIO_B,wasA);
  render();saveDraft();
});

/* picking a stage fills in the category and reliability — you can change them after */
$("status").addEventListener("change",()=>{
  const k=$("status").value, s=STATUS[k];
  if(s){ $("cat").value=L.st[k]; $("tier").value=String(s.tier); }
  render();
});

let DELETED={club:[],nation:[]};
/* the country/team pickers are searchable comboboxes now — see makeCombo above */

function loadClub(k){
  if(!DB()[k])return;
  activeClub=k; lastKey[teamType]=k; const c=DB()[k];
  $("cname").value=c.name;
  setTrio(TRIO_A,[c.c1,c.c2,c.c3]);
  $("plate").value=c.plate;
  drawPickers();render();
}
/* The right-hand team's colours are editable too (B12), so they live in inputs
   instead of being read straight from teams.json on every render. Picking a
   right-side team refills them — the same contract as loadClub() on the left. */
function loadClub2(k){
  if(!DB()[k])return;
  setTrio(TRIO_B,trioOf(DB()[k]));
  render();saveDraft();
}

/* Clubs / Nationals toggle — Transfer is club-only (nations don't sign players) */
function updateTypeUI(){
  const lockClub=$("tpl").value==="move";
  document.querySelectorAll("#tt button").forEach(b=>
    b.classList.toggle("on",b.dataset.type===teamType));
  const natBtn=document.querySelector('#tt button[data-type="nation"]');
  natBtn.disabled=lockClub;
  $("ttNote").classList.toggle("hide",!lockClub);
  $("groupPickLab").textContent=teamType==="club"?"Country":"Continent";
  $("group2Lab").textContent=teamType==="club"?"Country — right":"Continent — right";
}
function setTeamType(t){
  if(t===teamType||(t!=="club"&&t!=="nation")) return;
  lastKey[teamType]=activeClub;
  teamType=t;
  activeClub=DB()[lastKey[teamType]]?lastKey[teamType]:Object.keys(DB())[0];
  $("club2").value="";                 /* force a valid right-side team in the new set */
  updateTypeUI();
  loadClub(activeClub);
  store.set("teamType",teamType);
}
$("tt").addEventListener("click",e=>{
  const b=e.target.closest("button"); if(!b||b.disabled) return;
  setTeamType(b.dataset.type);
});

/* The card should carry today's date unless you typed one yourself. The
   draft restore runs after the initial fill and `date` is a saved field,
   so without this flag a returning session stamps the *last* session's
   date on a news card. */
let dateAuto=true;
function stampToday(){
  const d=new Date(), z=n=>String(n).padStart(2,"0");
  $("date").value=z(d.getDate())+"."+z(d.getMonth()+1)+"."+d.getFullYear();
}
function snapshot(){const o={};FIELDS.forEach(id=>{const el=$(id);if(el)o[id]=el.value;});
  o._club=activeClub;o._type=teamType;o._dateAuto=dateAuto;return o;}
function restore(o){
  if(o._type==="club"||o._type==="nation")teamType=o._type;
  if(o._dateAuto===false) dateAuto=false;
  /* club2 is set here too, not just through its combo below: drawPickers refills
     the right-side colours whenever it has to move that team, and it must see the
     saved team to know it didn't. The combo call below adds the visible label. */
  FIELDS.forEach(id=>{const el=$(id);if(!el)return;if(o[id]!==undefined)el.value=o[id];});
  activeClub=(o._club&&DB()[o._club])?o._club:
    (DB()[lastKey[teamType]]?lastKey[teamType]:Object.keys(DB())[0]);
  lastKey[teamType]=activeClub;
  /* a card saved on one of the dropped curve seams: the select would come back
     showing nothing at all, so put it on the nearest shape we still have */
  if($("split").value!=="none"&&!SPLITS[$("split").value]) $("split").value="diag2";
  [...TRIO_A,...TRIO_B].forEach(([tx,pk])=>{if(HEX.test($(tx).value))$(pk).value=$(tx).value;});
  updateTypeUI();drawPickers();
  if(o.club2&&DB()[o.club2]){
    combos.group2.set(groupKey(DB()[o.club2]));
    combos.club2.set(o.club2);
  }
  /* a draft or preset saved before B12 has no right-side colours — take them from
     its right-side team, or the card would come back with the placeholder pair */
  if(o.d1===undefined&&DB()[$("club2").value])
    setTrio(TRIO_B,trioOf(DB()[$("club2").value]));
  /* the reporter combo shows a label, so the hidden value alone isn't enough */
  combos.rep.set(repOf($("rep").value)?$("rep").value:"");
  updateRepLink();
  ["head","sub","quote","goalsA","goalsB"].forEach(id=>grow($(id)));
  render();
}
/* ---------- "Paste" button on each text field ---------- */
const PASTE_FIELDS=["head","sub","player","fee","quote","who","ctx",
                    "handle","outlet","cat","date","oppo"];
function addPasteButtons(){
  PASTE_FIELDS.forEach(id=>{
    const el=$(id); if(!el||el.dataset.pw) return;
    el.dataset.pw="1";
    const wrap=document.createElement("div");
    wrap.className="pw";
    el.parentNode.insertBefore(wrap,el);
    wrap.appendChild(el);
    const b=document.createElement("button");
    b.type="button"; b.className="pb"; b.textContent="⧉";
    b.title="Paste from clipboard"; b.setAttribute("aria-label","Paste from clipboard");
    b.addEventListener("click",async()=>{
      let txt="";
      try{ txt=await navigator.clipboard.readText(); }catch(e){ el.focus(); return; }
      if(!txt){ el.focus(); return; }
      el.value=txt.replace(/https?:\/\/t\.co\/\S+/g,"")
                  .replace(/\s*\n+\s*/g," ")
                  .replace(/\s{2,}/g," ")
                  .trim();
      el.dispatchEvent(new Event("input",{bubbles:true}));
      b.classList.add("hit"); setTimeout(()=>b.classList.remove("hit"),350);
    });
    wrap.appendChild(b);
  });
}
addPasteButtons();

/* iOS input hygiene: don't autocorrect names, don't underline everything;
   capitalise sensibly per field so typed reporter text needs less cleanup */
document.querySelectorAll('input[type=text],textarea').forEach(el=>{
  el.setAttribute("autocorrect","off");
  el.setAttribute("spellcheck","false");
  const cap = el.id==="handle" ? "none"
    : /^(player|cname|who|oppo)$/.test(el.id) ? "words" : "sentences";
  el.setAttribute("autocapitalize",cap);
});

function drawPresets(){
  $("presets").innerHTML='<option value="">— choose —</option>'+
    Object.keys(PRESETS).map(k=>'<option value="'+k+'">'+k+'</option>').join("");
}
$("savePreset").onclick=async()=>{
  const nm=($("presetName").value||"").trim()||($("cname").value+" — "+$("tpl").value);
  PRESETS[nm]=snapshot();await store.set("cards",PRESETS);drawPresets();
  $("presets").value=nm;$("presetName").value="";noteStore();
};
$("presets").onchange=e=>{if(PRESETS[e.target.value])restore(PRESETS[e.target.value]);};
$("delPreset").onclick=async()=>{
  const k=$("presets").value;if(!k)return;
  delete PRESETS[k];await store.set("cards",PRESETS);drawPresets();noteStore();
};

$("expJson").onclick=()=>{
  const blob=new Blob([JSON.stringify({clubs:CLUBS,nations:NATIONS,cards:PRESETS},null,2)],
    {type:"application/json"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);a.download="cards-config.json";a.click();
};
$("impBtn").onclick=()=>$("impJson").click();
$("impJson").onchange=e=>{
  const f=e.target.files[0];if(!f)return;
  const rd=new FileReader();
  rd.onload=async()=>{
    try{
      const d=JSON.parse(rd.result);
      const clubs=d.clubs||d.cluburi, nations=d.nations||d.nationale, cards=d.cards||d.carduri;
      if(clubs)CLUBS=clubs;if(nations)NATIONS=nations;if(cards)PRESETS=cards;
      await store.set("clubs",{clubs:CLUBS,deleted:DELETED.club});
      await store.set("nations",{teams:NATIONS,deleted:DELETED.nation});
      await store.set("cards",PRESETS);
      activeClub=DB()[lastKey[teamType]]?lastKey[teamType]:Object.keys(DB())[0];
      updateTypeUI();loadClub(activeClub);drawPresets();noteStore();
    }catch(err){alert("Invalid file.");}
  };
  rd.readAsText(f);
};

const DEFAULT_TEXT=(()=>{const o={};FIELDS.forEach(id=>{const el=$(id);if(el)o[id]=el.value;});return o;})();
$("reset").onclick=()=>{ if(confirm("Reset all fields to defaults?")) restore(DEFAULT_TEXT); };

/* =========================================================
   EXPORT — the card is moved off-screen at full size,
   then we try the available engines in turn.
========================================================= */
/* Render above the 1080 x H layout size: Instagram re-compresses whatever we send, and
   downscaling a bigger image keeps serif text far crisper than compressing one that is
   already at target size. 2x = 2160 x 2700, 4x the pixels — the ceiling iOS Safari can
   still hold. Raising this without testing on a phone is how exports start failing. */
const EXPORT_SCALE=2;
/* below this a PNG cannot be a real card, only a blank canvas (bytes) */
const MIN_PNG=8000;

async function capture(){
  const card=$("card"), stage=$("stage"), H=+$("fmt").value;
  const prev={t:card.style.transform,p:stage.style.position,l:stage.style.left,
              tp:stage.style.top,w:stage.style.width,h:stage.style.height,o:stage.style.overflow};

  card.style.transform="none";
  stage.style.position="fixed"; stage.style.left="-20000px"; stage.style.top="0";
  stage.style.width="1080px"; stage.style.height=H+"px"; stage.style.overflow="visible";

  try{ if(document.fonts&&document.fonts.ready) await document.fonts.ready; }catch(e){}
  await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));

  let blob=null, errs=[];

  /* A card is never a near-empty PNG (the smallest real one measured is ~59 KB), so a
     tiny blob means a blank canvas — how iOS reports running out of memory instead of
     throwing. Treat it as a failure so the 1x retry below can rescue the export. */
  const ok=b=>b&&b.size>MIN_PNG;

  /* Every engine renders the same 1080 x H box; the scale is the only knob.
     All three paths must use it or the fallback silently ships a soft image. */
  async function engines(scale){
    let b=null;

    /* 1. html2canvas — no need to download the fonts */
    if(window.html2canvas){
      try{
        const cv=await html2canvas(card,{width:1080,height:H,scale:scale,useCORS:true,
          allowTaint:true,backgroundColor:null,logging:false,
          windowWidth:1080,windowHeight:H,scrollX:0,scrollY:0});
        b=await new Promise(r=>cv.toBlob(r,"image/png"));
      }catch(e){ errs.push("html2canvas@"+scale+"x: "+(e&&e.message||e)); }
    }

    /* 2. html-to-image with fonts */
    if(!ok(b) && window.htmlToImage){
      try{ b=await htmlToImage.toBlob(card,{width:1080,height:H,pixelRatio:scale}); }
      catch(e){ errs.push("html-to-image@"+scale+"x: "+(e&&e.message||e)); }
    }

    /* 3. html-to-image without fonts — loses the font, but produces something */
    if(!ok(b) && window.htmlToImage){
      try{ b=await htmlToImage.toBlob(card,{width:1080,height:H,pixelRatio:scale,skipFonts:true}); }
      catch(e){ errs.push("no fonts@"+scale+"x: "+(e&&e.message||e)); }
    }
    return ok(b)?b:null;
  }

  blob=await engines(EXPORT_SCALE);
  /* 2x is 4x the pixels; on an iPhone that can fail or come back blank. Ship 1x rather
     than nothing — the old behaviour, and still a usable card. */
  if(!blob && EXPORT_SCALE!==1) blob=await engines(1);

  card.style.transform=prev.t; stage.style.position=prev.p; stage.style.left=prev.l;
  stage.style.top=prev.tp; stage.style.width=prev.w; stage.style.height=prev.h;
  stage.style.overflow=prev.o;
  fit();

  if(!blob) throw new Error(errs.join(" | ")||"no export engine available");
  return blob;
}

let shots=[];
$("dl").onclick=async()=>{
  const btn=$("dl"), old=btn.textContent;
  btn.disabled=true; btn.textContent="Generating…";
  const name=($("cname").value||"card").toLowerCase().replace(/\s+/g,"-")+"-"+$("tpl").value+".png";
  shots=[];
  try{
    render();
    await new Promise(r=>setTimeout(r,60));
    const blob=await capture();
    shots.push({blob,name});
    showSheet();
  }catch(err){
    alert("Export failed.\n\n"+err.message+
      "\n\nIf you opened the file straight from disk (file://), put it on a local server "+
      "or open it from the app — some browsers block export on file://.");
  }
  btn.textContent=old; btn.disabled=false;
};

/* a hashtag from any label, or "" if nothing usable is left */
function tag(s){const t=(s||"").toLowerCase().replace(/[^a-z0-9]+/g,"");return t?"#"+t:"";}
/* club country → top-division hashtag */
const LEAGUES={England:"premierleague",Spain:"laliga",Italy:"seriea",Germany:"bundesliga",
  France:"ligue1",Portugal:"primeiraliga",Netherlands:"eredivisie",Scotland:"spfl",
  Turkey:"superlig",Romania:"superliga"};
/* per-template flavour hashtags */
const TPL_TAGS={news:["footballnews"],move:["transfers","transfernews"],
  quote:["footballquotes"],result:["matchday","fulltime"],stats:["playerratings","matchstats"]};
/* Instagram allows 5 hashtags per post/reel (hard cap since Dec 2025) */
const MAX_TAGS=5;
/* Build a tidy, de-duplicated set of at most MAX_TAGS hashtags from the card's info.
   Order is priority order: whatever is pushed last is what gets cut, so both teams and
   the player come before the league, the flavour tag and the evergreen pair. */
function buildTags(tpl,team,other){
  const out=[];
  const push=(...xs)=>xs.forEach(x=>{const t=tag(x);if(t&&!out.includes(t))out.push(t);});
  push(team);                                                /* teams — both on move/result */
  if(tpl==="move"||tpl==="result") push(other);
  if(tpl==="stats"||tpl==="move") push($("player").value);   /* player name */
  if(tpl==="news") push($("cat").value);                     /* category */
  if(teamType==="nation") push("internationalfootball");     /* league / int'l */
  else push(LEAGUES[groupKey(DB()[activeClub])]);
  (TPL_TAGS[tpl]||[]).forEach(x=>push(x));                   /* template flavour */
  push("football","soccer");                                 /* evergreen, cut first */
  return out.slice(0,MAX_TAGS).join(" ");
}
/* a suggested Instagram caption built from the current fields */
function buildCaption(){
  const tpl=$("tpl").value;
  const team=$("cname").value.trim();
  const other=(DB()[$("club2").value]||{}).name||"";
  const src=[$("handle").value.trim(),$("outlet").value.trim()].filter(Boolean).join(" · ");
  const lines=[];
  const oneLine=s=>(s||"").split("\n").map(x=>x.trim()).filter(Boolean).join(", ");

  if(tpl==="news"){
    const h=$("head").value.trim(), sub=$("sub").value.trim();
    if(h) lines.push("🚨 "+h);
    if(sub) lines.push(sub);
  }else if(tpl==="move"){
    const player=$("player").value.trim(), fee=$("fee").value.trim();
    const stLabel=L.st[$("status").value]||"";
    if(player) lines.push("🔁 "+player+(stLabel?" — "+stLabel:""));
    if(team&&other) lines.push(team+" ➡️ "+other);
    if(fee) lines.push("💰 "+fee);
  }else if(tpl==="quote"){
    const q=$("quote").value.trim(), who=$("who").value.trim(), ctx=$("ctx").value.trim();
    if(q) lines.push("“"+q+"”");
    if(who) lines.push("— "+who+(ctx?", "+ctx:""));
  }else if(tpl==="result"){
    const sa=$("scoreA").value.trim()||"0", sb=$("scoreB").value.trim()||"0";
    if(team&&other) lines.push("⏱️ FT — "+team+" "+sa+"–"+sb+" "+other);
    const ga=oneLine($("goalsA").value), gb=oneLine($("goalsB").value);
    if(ga) lines.push("⚽ "+team+": "+ga);
    if(gb) lines.push("⚽ "+other+": "+gb);
  }else if(tpl==="stats"){
    const player=$("player").value.trim(), oppo=$("oppo").value.trim();
    if(player) lines.push("📊 "+player+(oppo?" "+oppo:""));
    const list=STAT_FIELDS[$("statPos").value]||STAT_FIELDS.outfield;
    const parts=list.map(([id,label])=>{const v=$(id).value.trim();return v?label+" "+v:"";}).filter(Boolean);
    if(parts.length) lines.push(parts.join(" · "));
  }

  if(src) lines.push("📰 Source: "+src);
  const body=lines.join("\n\n");
  return [body, buildTags(tpl,team,other)].filter(Boolean).join("\n\n");
}

function showSheet(){
  const box=$("shots"); box.innerHTML="";
  shots.forEach(s=>{
    const fig=document.createElement("figure");
    const img=document.createElement("img");
    img.src=URL.createObjectURL(s.blob); img.alt="Card";
    fig.append(img); box.appendChild(fig);
  });
  $("capText").value=buildCaption();
  const files=shots.map(s=>new File([s.blob],s.name,{type:"image/png"}));
  const canShare=navigator.canShare&&navigator.canShare({files});
  $("sheetShare").classList.toggle("hide",!canShare);
  $("sheetHint").innerHTML = canShare
    ? "In the menu that opens choose <b>Save Image</b>. Then post from Instagram as usual."
    : "Long-press the image → Add to Photos.";
  $("sheet").classList.add("on");
}
$("capCopy").onclick=async()=>{
  const t=$("capText"), b=$("capCopy"), old=b.textContent;
  try{ await navigator.clipboard.writeText(t.value); }
  catch(e){ t.focus(); t.select(); try{document.execCommand("copy");}catch(_){} }
  b.textContent="Copied ✓"; b.classList.add("hit");
  setTimeout(()=>{ b.textContent=old; b.classList.remove("hit"); },1300);
};
/* iOS won't save via <a download>; the only path to Photos is the share sheet */
const IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform==="MacIntel" && navigator.maxTouchPoints>1);

async function saveOne(s){
  const file=new File([s.blob],s.name,{type:"image/png"});
  if(navigator.canShare && navigator.canShare({files:[file]})){
    try{ await navigator.share({files:[file]}); return true; }
    catch(e){ if(e.name==="AbortError") return true; }
  }
  if(IS_IOS){
    $("sheetHint").textContent="Safari didn't open the menu. Long-press the image → Add to Photos.";
    return false;
  }
  const a=document.createElement("a");
  a.href=URL.createObjectURL(s.blob); a.download=s.name; a.click();
  return true;
}
$("sheetShare").onclick=async()=>{
  if(!shots.length) return;
  /* no title/text/url: on iOS any text alongside the files hides the
     save-to-Photos option and leaves only messaging apps */
  const files=shots.map(s=>new File([s.blob],s.name,{type:"image/png"}));
  if(navigator.canShare&&navigator.canShare({files})){
    try{ await navigator.share({files}); return; }
    catch(e){ if(e.name==="AbortError") return; }
  }
  for(const s of shots) await saveOne(s);
};
$("sheetClose").onclick=()=>$("sheet").classList.remove("on");
/* the current draft auto-saves so you don't start over */
let draftT=null;
function saveDraft(){
  clearTimeout(draftT);
  draftT=setTimeout(()=>store.set("draft",snapshot()),600);
}
FIELDS.forEach(id=>{const el=$(id);if(!el)return;
  el.addEventListener("input",saveDraft);el.addEventListener("change",saveDraft);});
["input","change"].forEach(ev=>
  $("date").addEventListener(ev,()=>{dateAuto=false;}));

/* A section the current template can't use collapses itself. Your own
   open/closed choice is kept per section and restored the moment that
   section becomes relevant again, so collapsing is never destructive. */
let secPref=[], secLock=false, secTpl=null;
function secInit(){
  if(!secPref.length)
    secPref=[...document.querySelectorAll("main details")].map(d=>d.open?1:0);
}
/* used = the section is visible and still has at least one visible field.
   Sections with no data-for fields at all (Style, Saved cards…) always are. */
function secUsed(d){
  if(d.classList.contains("hide")) return false;
  const fs=[...d.querySelectorAll("[data-for]")];
  return !fs.length || fs.some(f=>!f.classList.contains("hide"));
}
function autoSections(tpl){
  secInit();
  if(tpl===secTpl) return;
  secTpl=tpl; secLock=true;
  document.querySelectorAll("main details").forEach((d,i)=>{
    d.open = secUsed(d) && secPref[i]!==0;
  });
  secLock=false;
}

/* which sections are open is remembered too */
function bindSections(){
  document.querySelectorAll("main details").forEach((d,i)=>{
    d.addEventListener("toggle",()=>{
      if(secLock) return;               /* auto-collapse must not overwrite your choice */
      if(!secUsed(d)) return;           /* a section you can't see isn't a preference */
      secPref[i]=d.open?1:0;
      store.set("sections2",secPref.slice());
    });
  });
}

function noteStore(){
  $("storeNote").textContent="Saved in "+store.mode+
    ". Export .json to move everything to another device.";
}

(async()=>{
  /* team lists come from teams.json — load them before anything reads DB() */
  try{
    const td=await fetch("teams.json",{cache:"no-cache"}).then(r=>r.json());
    DEFAULT_CLUBS=td.clubs||{};
    DEFAULT_NATIONS=td.nations||{};
  }catch(e){
    alert("Couldn't load teams.json — the team lists will be empty.\n"+(e&&e.message||e));
  }
  /* the reporter picker only saves typing, so a missing file must not stop the app */
  try{
    const rd=await fetch("reporters.json",{cache:"no-cache"}).then(r=>r.json());
    REPORTERS=(Array.isArray(rd)?rd:rd.reporters||[]).filter(r=>r&&r.name);
  }catch(e){ REPORTERS=[]; }
  CLUBS=structuredClone(DEFAULT_CLUBS);
  NATIONS=structuredClone(DEFAULT_NATIONS);

  if(!$("date").value) stampToday();
  const c=await store.get("clubs");
  if(c && c.clubs){                       /* new format: defaults + yours */
    CLUBS={...DEFAULT_CLUBS,...c.clubs};
    DELETED.club=c.deleted||[];
    DELETED.club.forEach(k=>delete CLUBS[k]);
  }else if(c){                            /* old file, only your clubs */
    CLUBS={...DEFAULT_CLUBS,...c};
  }
  const n=await store.get("nations");
  if(n && n.teams){
    NATIONS={...DEFAULT_NATIONS,...n.teams};
    DELETED.nation=n.deleted||[];
    DELETED.nation.forEach(k=>delete NATIONS[k]);
  }
  const tp=await store.get("teamType"); if(tp==="club"||tp==="nation") teamType=tp;
  const p=await store.get("cards");if(p)PRESETS=p;
  /* "sections2", not "sections": the old array recorded the state of every
     section including the hidden ones, which now reads as "you closed it" */
  const secs=await store.get("sections2");
  secInit();
  if(Array.isArray(secs)) secs.forEach((v,i)=>{ if(v!==undefined) secPref[i]=v?1:0; });
  secTpl=null;                          /* re-apply once the prefs are known */
  bindSections();
  applyLayout();
  activeClub=DB()[lastKey[teamType]]?lastKey[teamType]:
    (DB()[activeClub]?activeClub:Object.keys(DB())[0]);
  updateTypeUI();
  loadClub(activeClub);drawPresets();noteStore();
  combos.rep.set("");
  const draft=await store.get("draft");
  if(draft && Object.keys(draft).length) restore(draft);
  if(dateAuto) stampToday();            /* the draft must not carry yesterday over */
  ["head","sub","quote","goalsA","goalsB"].forEach(id=>grow($(id)));
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{fit();autofit();});
})();
