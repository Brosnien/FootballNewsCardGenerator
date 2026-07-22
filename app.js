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
const FIELDS=["cat","date","cname","c1","c2","c3","head","sub","player",
  "fee","quote","who","ctx","handle","outlet","tier","plate","crestBg","font","tpl","fmt","align",
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

const ANGLES={vert:"90deg",diag:"100deg",diag2:"125deg",diagr:"62deg"};
/* curved seams: a big off-canvas circle whose arc crosses the card. cx is the
   circle centre's x on the 1080-wide card; the seam always meets the vertical
   middle at x=540 and bows toward (convex) or away from (concave) that centre. */
const CURVES={
  curve: {cx:-1400},   /* soft bow to the right  */
  curved:{cx:-620},    /* deep bow to the right  */
  curver:{cx:2480},    /* bow the other way (reverse) */
};

/* builds the split background; also returns the bands so we know the contrast.
   Bands + their edge positions on a 0..1 axis (0 = left team's outer edge,
   1 = right team's outer edge) are the same whatever the seam shape — only the
   geometry (a straight linear-gradient vs. a curved radial-gradient) changes. */
function buildSplit(mode,A,B,dual,H){
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
  let css;
  if(CURVES[mode]){
    const cx=CURVES[mode].cx, cy=(H||1350)/2, mid=540, span=1080;
    const R=Math.abs(mid-cx), rightCentre=cx>mid;
    const rad=f=>Math.max(0,R+(rightCentre?-1:1)*(f-0.5)*span);
    let segs=cols.map((c,i)=>({c,a:rad(pos[i]),b:rad(pos[i+1])}));
    /* radial-gradient stops must increase; a right-hand centre reverses them */
    if(segs.length && segs[0].a>segs[0].b) segs=segs.reverse().map(s=>({c:s.c,a:s.b,b:s.a}));
    const stops=segs.map(s=>s.c+" "+s.a.toFixed(1)+"px "+s.b.toFixed(1)+"px");
    css="radial-gradient(circle at "+cx+"px "+cy.toFixed(1)+"px,"+stops.join(",")+")";
  }else{
    const ang=ANGLES[mode]||"100deg";
    const stops=cols.map((c,i)=>c+" "+(pos[i]*100)+"% "+(pos[i+1]*100)+"%");
    css="linear-gradient("+ang+","+stops.join(",")+")";
  }
  return {css:css, bands:cols.slice()};
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
    filtered=q?all.filter(o=>o.label.toLowerCase().includes(q)||(o.sub||"").toLowerCase().includes(q)):all;
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
  if(t)combos.club2.set(t[0]); render();});
combos.club2    =makeCombo("club2",    optTeamsIn("group2"), k=>render());

/* set the four pickers to reflect the current team 1 + team 2.
   a country box is always set before the team box beside it, because the team
   box's options are scoped to whatever its country box currently holds. */
function drawPickers(){
  const a=DB()[activeClub]||Object.values(DB())[0];
  const g1=groupKey(a);
  combos.groupPick.set(g1);
  combos.clubPick.set(DB()[activeClub]?activeClub:(teamsInGroup(g1)[0]?.[0]||""));

  let k2=$("club2").value;
  if(!DB()[k2]||k2===activeClub){
    const other=Object.entries(DB()).find(([k,c])=>k!==activeClub&&groupKey(c)!==g1)
              ||Object.entries(DB()).find(([k])=>k!==activeClub);
    k2=other?other[0]:activeClub;
  }
  combos.group2.set(groupKey(DB()[k2]||a));
  combos.club2.set(k2);
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
/* Bump whenever the artwork in crests/ changes. The filenames stay the same when
   a crest is replaced, so a browser that already has one keeps serving the old
   picture — which is how the placeholder shields survived the switch to real
   crests. The query string gives the new artwork a new URL. */
const CREST_V="2026-07-22";
const crestURL=key=>"crests/"+key+".png?v="+CREST_V;
/* where each crest sits per split shape. masks and clip-path don't survive
   html2canvas export, so instead of clipping the crest to the seam we place it
   deep inside its own team's colour region — a strong diagonal makes team 1 a
   top-left triangle, a curve pins each team to a side — so it never reaches
   (and never crosses) the seam.

   {x,y} is the crest's centre and d its diameter, as fractions of the card
   (x and d of the 1080 width, y of the height). Fractions, not the CSS
   background-position percentages this used to hold: each layer is only half
   the card wide, so once the crest is about as wide as its layer the percentage
   form divides by nearly zero and a small size change throws the crest across
   the card. Pixels are computed from these below, which is stable and let the
   diagonal/curve crests grow by roughly half.

   Every value clears the seam with >=20px to spare at both card formats; x is
   also kept >=d/2 from the x=540 layer edge, because on a diagonal or curve
   that edge is NOT the seam and a cut there reads as a mistake. */
const WALLPOS={
  vert:  {a:{x:0.275,y:0.886,d:0.54}, b:{x:0.725,y:0.886,d:0.54}},
  diag:  {a:{x:0.263,y:0.885,d:0.52}, b:{x:0.737,y:0.885,d:0.52}},
  diag2: {a:{x:0.20, y:0.30, d:0.54}, b:{x:0.80, y:0.70, d:0.54}},
  diagr: {a:{x:0.20, y:0.70, d:0.54}, b:{x:0.80, y:0.30, d:0.54}},
  curve: {a:{x:0.20, y:0.65, d:0.54}, b:{x:0.80, y:0.65, d:0.54}},
  curved:{a:{x:0.20, y:0.62, d:0.54}, b:{x:0.80, y:0.62, d:0.54}},
  curver:{a:{x:0.20, y:0.65, d:0.54}, b:{x:0.80, y:0.65, d:0.54}},
};
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
        const W=1080, H=+$("fmt").value||1350, d=g.d*W, left=(el===wb?W/2:0);
        el.style.backgroundSize=d.toFixed(1)+"px auto";
        el.style.backgroundPosition=(g.x*W-left-d/2).toFixed(1)+"px "+
                                    (g.y*H-d/2).toFixed(1)+"px";
      }
      el.style.setProperty("--wallOp",op); el.classList.remove("hide"); return;
    }
    hide(el);                                    /* until the file is confirmed */
    const img=new Image();
    img.onload =()=>{ crestSeen[key]="ok"; updateWall($("tpl").value); };
    img.onerror=()=>{ crestSeen[key]="no"; };
    img.src=crestURL(key);
  };
  if(single){ hide(wa); hide(wb); put(wall,activeClub); }
  else if(two){
    hide(wall);
    const pp=WALLPOS[tpl==="result"?"vert":$("split").value]||WALLPOS.vert;
    put(wa,activeClub,pp.a); put(wb,$("club2").value,pp.b);
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
  const B = DB()[$("club2").value] || DB()[activeClub];
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
  /* how much room is left in the left half, next to the bottom text. On
     diagonals/curves the seam moves toward the left edge near the card's base,
     so the ceiling is smaller the further it bows in. */
  const SAFE={vert:"420px",diag:"330px",diag2:"290px",diagr:"700px",
              curve:"390px",curved:"300px",curver:"620px"};
  r.setProperty("--subMax", split ? (SAFE[splitModeEff]||"330px") : "34ch");

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
[["c1","c1p"],["c2","c2p"],["c3","c3p"]].forEach(([tx,pk])=>{
  $(pk).addEventListener("input",e=>{$(tx).value=e.target.value.toUpperCase();render();});
  $(tx).addEventListener("input",e=>{
    if(/^#[0-9a-f]{6}$/i.test(e.target.value))$(pk).value=e.target.value;});
});
/* swap the two teams in one tap */
$("swapClubs").addEventListener("click",()=>{
  const right=$("club2").value, left=activeClub;
  if(!DB()[right]||right===left) return;
  loadClub(right);
  combos.group2.set(groupKey(DB()[left]));
  combos.club2.set(left);
  render();
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
  $("cname").value=c.name;$("c1").value=c.c1;$("c2").value=c.c2;$("c3").value=c.c3;
  $("c1p").value=c.c1;$("c2p").value=c.c2;$("c3p").value=c.c3;$("plate").value=c.plate;
  drawPickers();render();
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

function snapshot(){const o={};FIELDS.forEach(id=>{const el=$(id);if(el)o[id]=el.value;});
  o._club=activeClub;o._type=teamType;return o;}
function restore(o){
  if(o._type==="club"||o._type==="nation")teamType=o._type;
  /* club2 is derived from the group+team pair, so we set it after drawPickers */
  FIELDS.forEach(id=>{const el=$(id);if(!el||id==="club2")return;if(o[id]!==undefined)el.value=o[id];});
  activeClub=(o._club&&DB()[o._club])?o._club:
    (DB()[lastKey[teamType]]?lastKey[teamType]:Object.keys(DB())[0]);
  lastKey[teamType]=activeClub;
  [["c1","c1p"],["c2","c2p"],["c3","c3p"]].forEach(([tx,pk])=>{$(pk).value=$(tx).value;});
  updateTypeUI();drawPickers();
  if(o.club2&&DB()[o.club2]){
    combos.group2.set(groupKey(DB()[o.club2]));
    combos.club2.set(o.club2);
  }
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

  /* 1. html2canvas — no need to download the fonts */
  if(window.html2canvas){
    try{
      const cv=await html2canvas(card,{width:1080,height:H,scale:1,useCORS:true,
        allowTaint:true,backgroundColor:null,logging:false,
        windowWidth:1080,windowHeight:H,scrollX:0,scrollY:0});
      blob=await new Promise(r=>cv.toBlob(r,"image/png"));
    }catch(e){ errs.push("html2canvas: "+(e&&e.message||e)); }
  }

  /* 2. html-to-image with fonts */
  if(!blob && window.htmlToImage){
    try{ blob=await htmlToImage.toBlob(card,{width:1080,height:H,pixelRatio:1}); }
    catch(e){ errs.push("html-to-image: "+(e&&e.message||e)); }
  }

  /* 3. html-to-image without fonts — loses the font, but produces something */
  if(!blob && window.htmlToImage){
    try{ blob=await htmlToImage.toBlob(card,{width:1080,height:H,pixelRatio:1,skipFonts:true}); }
    catch(e){ errs.push("no fonts: "+(e&&e.message||e)); }
  }

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
/* build a tidy, de-duplicated set of ~5-8 hashtags from the card's info */
function buildTags(tpl,team,other){
  const out=[];
  const push=(...xs)=>xs.forEach(x=>{const t=tag(x);if(t&&!out.includes(t))out.push(t);});
  if(tpl==="stats"||tpl==="move") push($("player").value);   /* player name */
  push(team); if(tpl==="move"||tpl==="result") push(other);  /* teams */
  if(teamType==="nation") push("internationalfootball");     /* league / int'l */
  else push(LEAGUES[groupKey(DB()[activeClub])]);
  if(tpl==="news") push($("cat").value);                     /* category */
  (TPL_TAGS[tpl]||[]).forEach(x=>push(x));                   /* template flavour */
  push("football","soccer");                                 /* evergreen */
  return out.slice(0,8).join(" ");
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

/* which sections are open is remembered too */
function bindSections(){
  document.querySelectorAll("main details").forEach((d,i)=>{
    d.addEventListener("toggle",()=>{
      const open=[...document.querySelectorAll("main details")].map(x=>x.open?1:0);
      store.set("sections",open);
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
  CLUBS=structuredClone(DEFAULT_CLUBS);
  NATIONS=structuredClone(DEFAULT_NATIONS);

  if(!$("date").value){
    const d=new Date(), z=n=>String(n).padStart(2,"0");
    $("date").value=z(d.getDate())+"."+z(d.getMonth()+1)+"."+d.getFullYear();
  }
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
  const secs=await store.get("sections");
  if(Array.isArray(secs)) document.querySelectorAll("main details")
    .forEach((d,i)=>{ if(secs[i]!==undefined) d.open=!!secs[i]; });
  bindSections();
  applyLayout();
  activeClub=DB()[lastKey[teamType]]?lastKey[teamType]:
    (DB()[activeClub]?activeClub:Object.keys(DB())[0]);
  updateTypeUI();
  loadClub(activeClub);drawPresets();noteStore();
  const draft=await store.get("draft");
  if(draft && Object.keys(draft).length) restore(draft);
  ["head","sub","quote","goalsA","goalsB"].forEach(id=>grow($(id)));
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{fit();autofit();});
})();
