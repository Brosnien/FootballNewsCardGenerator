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
const DEFAULT_CLUBS={
  /* ---- England ---- */
  arsenal:{country:"England",name:"Arsenal",c1:"#EF0107",c2:"#FFFFFF",c3:"#063672",plate:"none",crest:""},
  "man-city":{country:"England",name:"Man City",c1:"#6CABDD",c2:"#FFFFFF",c3:"#1C2C5B",plate:"#FFFFFF",crest:""},
  liverpool:{country:"England",name:"Liverpool",c1:"#C8102E",c2:"#FFFFFF",c3:"#00B2A9",plate:"none",crest:""},
  "man-united":{country:"England",name:"Man United",c1:"#DA291C",c2:"#FFFFFF",c3:"#FBE122",plate:"none",crest:""},
  chelsea:{country:"England",name:"Chelsea",c1:"#034694",c2:"#FFFFFF",c3:"#DBA111",plate:"none",crest:""},
  tottenham:{country:"England",name:"Tottenham",c1:"#132257",c2:"#FFFFFF",c3:"#C0C0C0",plate:"none",crest:""},
  newcastle:{country:"England",name:"Newcastle",c1:"#241F20",c2:"#FFFFFF",c3:"#41B6E6",plate:"none",crest:""},
  "aston-villa":{country:"England",name:"Aston Villa",c1:"#670E36",c2:"#95BFE5",c3:"#FDB913",plate:"none",crest:""},
  "west-ham":{country:"England",name:"West Ham",c1:"#7A263A",c2:"#1BB1E7",c3:"#FFFFFF",plate:"none",crest:""},
  everton:{country:"England",name:"Everton",c1:"#003399",c2:"#FFFFFF",c3:"#FCD400",plate:"none",crest:""},

  /* ---- Spain ---- */
  "real-madrid":{country:"Spain",name:"Real Madrid",c1:"#FFFFFF",c2:"#00529F",c3:"#FEBE10",plate:"none",crest:""},
  barcelona:{country:"Spain",name:"Barcelona",c1:"#A50044",c2:"#004D98",c3:"#EDBB00",plate:"none",crest:""},
  "atletico":{country:"Spain",name:"Atlético",c1:"#CB3524",c2:"#FFFFFF",c3:"#272E61",plate:"none",crest:""},
  sevilla:{country:"Spain",name:"Sevilla",c1:"#D81920",c2:"#FFFFFF",c3:"#000000",plate:"none",crest:""},
  villarreal:{country:"Spain",name:"Villarreal",c1:"#FFE667",c2:"#005187",c3:"#003DA5",plate:"none",crest:""},
  "athletic":{country:"Spain",name:"Athletic Club",c1:"#EE2523",c2:"#FFFFFF",c3:"#000000",plate:"none",crest:""},
  "real-sociedad":{country:"Spain",name:"Real Sociedad",c1:"#0067B1",c2:"#FFFFFF",c3:"#E30613",plate:"none",crest:""},
  valencia:{country:"Spain",name:"Valencia",c1:"#FFFFFF",c2:"#EE3524",c3:"#000000",plate:"none",crest:""},

  /* ---- Italy ---- */
  inter:{country:"Italy",name:"Inter",c1:"#010E80",c2:"#000000",c3:"#C8AA6E",plate:"none",crest:""},
  milan:{country:"Italy",name:"Milan",c1:"#FB090B",c2:"#000000",c3:"#FFFFFF",plate:"none",crest:""},
  juventus:{country:"Italy",name:"Juventus",c1:"#000000",c2:"#FFFFFF",c3:"#D4AF37",plate:"none",crest:""},
  napoli:{country:"Italy",name:"Napoli",c1:"#12A0D7",c2:"#FFFFFF",c3:"#003C82",plate:"none",crest:""},
  roma:{country:"Italy",name:"Roma",c1:"#8E1F2F",c2:"#F0BC42",c3:"#FFFFFF",plate:"none",crest:""},
  lazio:{country:"Italy",name:"Lazio",c1:"#87D8F7",c2:"#FFFFFF",c3:"#0B1F3A",plate:"none",crest:""},
  atalanta:{country:"Italy",name:"Atalanta",c1:"#1D71B8",c2:"#000000",c3:"#FFFFFF",plate:"none",crest:""},
  fiorentina:{country:"Italy",name:"Fiorentina",c1:"#59209C",c2:"#FFFFFF",c3:"#D4AF37",plate:"none",crest:""},

  /* ---- Germany ---- */
  bayern:{country:"Germany",name:"Bayern",c1:"#DC052D",c2:"#FFFFFF",c3:"#0066B2",plate:"none",crest:""},
  dortmund:{country:"Germany",name:"Dortmund",c1:"#FDE100",c2:"#000000",c3:"#FFFFFF",plate:"none",crest:""},
  leipzig:{country:"Germany",name:"RB Leipzig",c1:"#DD0741",c2:"#FFFFFF",c3:"#001F47",plate:"none",crest:""},
  leverkusen:{country:"Germany",name:"Leverkusen",c1:"#E32221",c2:"#000000",c3:"#FFFFFF",plate:"none",crest:""},
  frankfurt:{country:"Germany",name:"Frankfurt",c1:"#000000",c2:"#FFFFFF",c3:"#E1000F",plate:"none",crest:""},
  gladbach:{country:"Germany",name:"M'gladbach",c1:"#FFFFFF",c2:"#000000",c3:"#00A752",plate:"none",crest:""},
  stuttgart:{country:"Germany",name:"Stuttgart",c1:"#FFFFFF",c2:"#E32219",c3:"#000000",plate:"none",crest:""},

  /* ---- France ---- */
  psg:{country:"France",name:"PSG",c1:"#004170",c2:"#DA291C",c3:"#FFFFFF",plate:"none",crest:""},
  marseille:{country:"France",name:"Marseille",c1:"#2FAEE0",c2:"#FFFFFF",c3:"#D4AF37",plate:"none",crest:""},
  lyon:{country:"France",name:"Lyon",c1:"#FFFFFF",c2:"#DA291C",c3:"#1B458F",plate:"none",crest:""},
  monaco:{country:"France",name:"Monaco",c1:"#E63329",c2:"#FFFFFF",c3:"#000000",plate:"none",crest:""},
  lille:{country:"France",name:"Lille",c1:"#E01E13",c2:"#FFFFFF",c3:"#082A5E",plate:"none",crest:""},
  nice:{country:"France",name:"Nice",c1:"#DA291C",c2:"#000000",c3:"#FFFFFF",plate:"none",crest:""},

  /* ---- Portugal ---- */
  benfica:{country:"Portugal",name:"Benfica",c1:"#E00034",c2:"#FFFFFF",c3:"#000000",plate:"none",crest:""},
  porto:{country:"Portugal",name:"Porto",c1:"#003DA5",c2:"#FFFFFF",c3:"#00A0DF",plate:"none",crest:""},
  sporting:{country:"Portugal",name:"Sporting",c1:"#008057",c2:"#FFFFFF",c3:"#D4AF37",plate:"none",crest:""},

  /* ---- Netherlands ---- */
  ajax:{country:"Netherlands",name:"Ajax",c1:"#D2122E",c2:"#FFFFFF",c3:"#000000",plate:"none",crest:""},
  psv:{country:"Netherlands",name:"PSV",c1:"#EE2124",c2:"#FFFFFF",c3:"#000000",plate:"none",crest:""},
  feyenoord:{country:"Netherlands",name:"Feyenoord",c1:"#DA020E",c2:"#FFFFFF",c3:"#000000",plate:"none",crest:""},

  /* ---- Scotland ---- */
  celtic:{country:"Scotland",name:"Celtic",c1:"#018749",c2:"#FFFFFF",c3:"#F5C518",plate:"none",crest:""},
  rangers:{country:"Scotland",name:"Rangers",c1:"#1B458F",c2:"#FFFFFF",c3:"#DA291C",plate:"none",crest:""},

  /* ---- Turkey ---- */
  galatasaray:{country:"Turkey",name:"Galatasaray",c1:"#A90432",c2:"#FBB03F",c3:"#FFFFFF",plate:"none",crest:""},
  fenerbahce:{country:"Turkey",name:"Fenerbahçe",c1:"#073C7A",c2:"#FFED00",c3:"#FFFFFF",plate:"none",crest:""},

  /* ---- Rest of Europe ---- */
  brugge:{country:"Rest of Europe",name:"Club Brugge",c1:"#005BAC",c2:"#000000",c3:"#FFFFFF",plate:"none",crest:""},
  salzburg:{country:"Rest of Europe",name:"RB Salzburg",c1:"#C8102E",c2:"#FFFFFF",c3:"#000000",plate:"none",crest:""},
  olympiacos:{country:"Rest of Europe",name:"Olympiacos",c1:"#DA291C",c2:"#FFFFFF",c3:"#000000",plate:"none",crest:""},
  shakhtar:{country:"Rest of Europe",name:"Shakhtar",c1:"#FF6600",c2:"#000000",c3:"#FFFFFF",plate:"none",crest:""},
  "dinamo-zagreb":{country:"Rest of Europe",name:"Dinamo Zagreb",c1:"#0F4C9C",c2:"#FFFFFF",c3:"#000000",plate:"none",crest:""},

  /* ---- Romania ---- */
  fcsb:{country:"Romania",name:"FCSB",c1:"#E30613",c2:"#003DA5",c3:"#FFFFFF",plate:"none",crest:""},
  "cfr-cluj":{country:"Romania",name:"CFR Cluj",c1:"#7B0F1B",c2:"#FFFFFF",c3:"#000000",plate:"none",crest:""},
  rapid:{country:"Romania",name:"Rapid",c1:"#7C2231",c2:"#FFFFFF",c3:"#000000",plate:"none",crest:""},
  craiova:{country:"Romania",name:"U Craiova",c1:"#0057B8",c2:"#FFFFFF",c3:"#E30613",plate:"none",crest:""},
  "dinamo":{country:"Romania",name:"Dinamo",c1:"#DA291C",c2:"#FFFFFF",c3:"#000000",plate:"none",crest:""},
  "u-cluj":{country:"Romania",name:"U Cluj",c1:"#000000",c2:"#FFFFFF",c3:"#A50044",plate:"none",crest:""}
};
/* National teams, grouped by continent. Colors are the usual kit colors —
   double-check the ones that matter to you; you can edit and save over them. */
const DEFAULT_NATIONS={
  /* ---- Europe (30) ---- */
  romania:{continent:"Europe",name:"Romania",c1:"#FCD116",c2:"#002B7F",c3:"#CE1126",plate:"none",crest:""},
  france:{continent:"Europe",name:"France",c1:"#002654",c2:"#FFFFFF",c3:"#ED2939",plate:"none",crest:""},
  germany:{continent:"Europe",name:"Germany",c1:"#FFFFFF",c2:"#000000",c3:"#DD0000",plate:"none",crest:""},
  spain:{continent:"Europe",name:"Spain",c1:"#C60B1E",c2:"#FFFFFF",c3:"#FFC400",plate:"none",crest:""},
  italy:{continent:"Europe",name:"Italy",c1:"#0F4C9C",c2:"#FFFFFF",c3:"#009246",plate:"none",crest:""},
  england:{continent:"Europe",name:"England",c1:"#FFFFFF",c2:"#001489",c3:"#CE1124",plate:"none",crest:""},
  portugal:{continent:"Europe",name:"Portugal",c1:"#C5281C",c2:"#FFFFFF",c3:"#006600",plate:"none",crest:""},
  netherlands:{continent:"Europe",name:"Netherlands",c1:"#FF6C00",c2:"#FFFFFF",c3:"#21468B",plate:"none",crest:""},
  belgium:{continent:"Europe",name:"Belgium",c1:"#E30613",c2:"#FFFFFF",c3:"#FDDA24",plate:"none",crest:""},
  croatia:{continent:"Europe",name:"Croatia",c1:"#D9241C",c2:"#FFFFFF",c3:"#171796",plate:"none",crest:""},
  poland:{continent:"Europe",name:"Poland",c1:"#FFFFFF",c2:"#DC143C",c3:"#000000",plate:"none",crest:""},
  sweden:{continent:"Europe",name:"Sweden",c1:"#005B99",c2:"#FECB00",c3:"#FFFFFF",plate:"none",crest:""},
  denmark:{continent:"Europe",name:"Denmark",c1:"#C60C30",c2:"#FFFFFF",c3:"#000000",plate:"none",crest:""},
  switzerland:{continent:"Europe",name:"Switzerland",c1:"#D52B1E",c2:"#FFFFFF",c3:"#000000",plate:"none",crest:""},
  austria:{continent:"Europe",name:"Austria",c1:"#ED2939",c2:"#FFFFFF",c3:"#000000",plate:"none",crest:""},
  ukraine:{continent:"Europe",name:"Ukraine",c1:"#FFD500",c2:"#005BBB",c3:"#005BBB",plate:"none",crest:""},
  serbia:{continent:"Europe",name:"Serbia",c1:"#C6363C",c2:"#FFFFFF",c3:"#0C4076",plate:"none",crest:""},
  scotland:{continent:"Europe",name:"Scotland",c1:"#1B3A6B",c2:"#FFFFFF",c3:"#C8102E",plate:"none",crest:""},
  wales:{continent:"Europe",name:"Wales",c1:"#C8102E",c2:"#FFFFFF",c3:"#00AB39",plate:"none",crest:""},
  turkey:{continent:"Europe",name:"Turkey",c1:"#E30A17",c2:"#FFFFFF",c3:"#A50010",plate:"none",crest:""},
  norway:{continent:"Europe",name:"Norway",c1:"#BA0C2F",c2:"#FFFFFF",c3:"#00205B",plate:"none",crest:""},
  czechia:{continent:"Europe",name:"Czechia",c1:"#D7141A",c2:"#FFFFFF",c3:"#11457E",plate:"none",crest:""},
  greece:{continent:"Europe",name:"Greece",c1:"#0D5EAF",c2:"#FFFFFF",c3:"#041E42",plate:"none",crest:""},
  hungary:{continent:"Europe",name:"Hungary",c1:"#C8102E",c2:"#FFFFFF",c3:"#436F4D",plate:"none",crest:""},
  russia:{continent:"Europe",name:"Russia",c1:"#FFFFFF",c2:"#0039A6",c3:"#D52B1E",plate:"none",crest:""},
  ireland:{continent:"Europe",name:"Ireland",c1:"#009A44",c2:"#FFFFFF",c3:"#FF7900",plate:"none",crest:""},
  finland:{continent:"Europe",name:"Finland",c1:"#FFFFFF",c2:"#003580",c3:"#003580",plate:"none",crest:""},
  slovakia:{continent:"Europe",name:"Slovakia",c1:"#0B4EA2",c2:"#FFFFFF",c3:"#EE1C25",plate:"none",crest:""},
  slovenia:{continent:"Europe",name:"Slovenia",c1:"#FFFFFF",c2:"#005DA4",c3:"#ED1C24",plate:"none",crest:""},
  iceland:{continent:"Europe",name:"Iceland",c1:"#02529C",c2:"#FFFFFF",c3:"#DC1E35",plate:"none",crest:""},

  /* ---- South America (10) ---- */
  brazil:{continent:"South America",name:"Brazil",c1:"#FFDF00",c2:"#009739",c3:"#002776",plate:"none",crest:""},
  argentina:{continent:"South America",name:"Argentina",c1:"#75AADB",c2:"#FFFFFF",c3:"#F6B40E",plate:"none",crest:""},
  uruguay:{continent:"South America",name:"Uruguay",c1:"#5B9BD5",c2:"#FFFFFF",c3:"#FCD116",plate:"none",crest:""},
  colombia:{continent:"South America",name:"Colombia",c1:"#FCD116",c2:"#003893",c3:"#CE1126",plate:"none",crest:""},
  chile:{continent:"South America",name:"Chile",c1:"#D52B1E",c2:"#FFFFFF",c3:"#0039A6",plate:"none",crest:""},
  peru:{continent:"South America",name:"Peru",c1:"#FFFFFF",c2:"#D91023",c3:"#D91023",plate:"none",crest:""},
  ecuador:{continent:"South America",name:"Ecuador",c1:"#FFDD00",c2:"#003893",c3:"#ED1C24",plate:"none",crest:""},
  paraguay:{continent:"South America",name:"Paraguay",c1:"#D52B1E",c2:"#FFFFFF",c3:"#0038A8",plate:"none",crest:""},
  bolivia:{continent:"South America",name:"Bolivia",c1:"#007A33",c2:"#FFFFFF",c3:"#FFD100",plate:"none",crest:""},
  venezuela:{continent:"South America",name:"Venezuela",c1:"#7B1F3A",c2:"#FFFFFF",c3:"#FFCD00",plate:"none",crest:""},

  /* ---- North America (12) ---- */
  mexico:{continent:"North America",name:"Mexico",c1:"#006847",c2:"#FFFFFF",c3:"#CE1126",plate:"none",crest:""},
  usa:{continent:"North America",name:"USA",c1:"#0A3161",c2:"#FFFFFF",c3:"#B31942",plate:"none",crest:""},
  canada:{continent:"North America",name:"Canada",c1:"#D52B1E",c2:"#FFFFFF",c3:"#000000",plate:"none",crest:""},
  "costa-rica":{continent:"North America",name:"Costa Rica",c1:"#D80027",c2:"#FFFFFF",c3:"#002B7F",plate:"none",crest:""},
  panama:{continent:"North America",name:"Panama",c1:"#DA121A",c2:"#FFFFFF",c3:"#072357",plate:"none",crest:""},
  jamaica:{continent:"North America",name:"Jamaica",c1:"#009B3A",c2:"#FED100",c3:"#000000",plate:"none",crest:""},
  honduras:{continent:"North America",name:"Honduras",c1:"#0073CF",c2:"#FFFFFF",c3:"#18397A",plate:"none",crest:""},
  "el-salvador":{continent:"North America",name:"El Salvador",c1:"#0F47AF",c2:"#FFFFFF",c3:"#DA291C",plate:"none",crest:""},
  guatemala:{continent:"North America",name:"Guatemala",c1:"#4997D0",c2:"#FFFFFF",c3:"#164FA1",plate:"none",crest:""},
  trinidad:{continent:"North America",name:"Trinidad & Tobago",c1:"#DA1A35",c2:"#FFFFFF",c3:"#000000",plate:"none",crest:""},
  haiti:{continent:"North America",name:"Haiti",c1:"#00209F",c2:"#FFFFFF",c3:"#D21034",plate:"none",crest:""},
  curacao:{continent:"North America",name:"Curaçao",c1:"#002B7F",c2:"#FFFFFF",c3:"#F9D616",plate:"none",crest:""},

  /* ---- Africa (15) ---- */
  morocco:{continent:"Africa",name:"Morocco",c1:"#C1272D",c2:"#FFFFFF",c3:"#006233",plate:"none",crest:""},
  senegal:{continent:"Africa",name:"Senegal",c1:"#00853F",c2:"#FFFFFF",c3:"#FDEF42",plate:"none",crest:""},
  egypt:{continent:"Africa",name:"Egypt",c1:"#CE1126",c2:"#FFFFFF",c3:"#000000",plate:"none",crest:""},
  nigeria:{continent:"Africa",name:"Nigeria",c1:"#008751",c2:"#FFFFFF",c3:"#000000",plate:"none",crest:""},
  cameroon:{continent:"Africa",name:"Cameroon",c1:"#007A5E",c2:"#FFFFFF",c3:"#CE1126",plate:"none",crest:""},
  ghana:{continent:"Africa",name:"Ghana",c1:"#CE1126",c2:"#FFFFFF",c3:"#FCD116",plate:"none",crest:""},
  "ivory-coast":{continent:"Africa",name:"Ivory Coast",c1:"#F77F00",c2:"#FFFFFF",c3:"#009E60",plate:"none",crest:""},
  algeria:{continent:"Africa",name:"Algeria",c1:"#007A3D",c2:"#FFFFFF",c3:"#D21034",plate:"none",crest:""},
  tunisia:{continent:"Africa",name:"Tunisia",c1:"#E70013",c2:"#FFFFFF",c3:"#000000",plate:"none",crest:""},
  "south-africa":{continent:"Africa",name:"South Africa",c1:"#007A4D",c2:"#FFFFFF",c3:"#FFB915",plate:"none",crest:""},
  mali:{continent:"Africa",name:"Mali",c1:"#14B53A",c2:"#FFFFFF",c3:"#FCD116",plate:"none",crest:""},
  "dr-congo":{continent:"Africa",name:"DR Congo",c1:"#2D8FDF",c2:"#FFFFFF",c3:"#F7D618",plate:"none",crest:""},
  "burkina-faso":{continent:"Africa",name:"Burkina Faso",c1:"#EF2B2D",c2:"#FFFFFF",c3:"#009E49",plate:"none",crest:""},
  "cape-verde":{continent:"Africa",name:"Cape Verde",c1:"#003893",c2:"#FFFFFF",c3:"#CF2027",plate:"none",crest:""},
  guinea:{continent:"Africa",name:"Guinea",c1:"#CE1126",c2:"#FFFFFF",c3:"#FCD116",plate:"none",crest:""},

  /* ---- Asia (15) ---- */
  japan:{continent:"Asia",name:"Japan",c1:"#0A3D91",c2:"#FFFFFF",c3:"#BC002D",plate:"none",crest:""},
  "south-korea":{continent:"Asia",name:"South Korea",c1:"#C8102E",c2:"#FFFFFF",c3:"#003478",plate:"none",crest:""},
  iran:{continent:"Asia",name:"Iran",c1:"#FFFFFF",c2:"#239F40",c3:"#DA0000",plate:"none",crest:""},
  "saudi-arabia":{continent:"Asia",name:"Saudi Arabia",c1:"#006C35",c2:"#FFFFFF",c3:"#000000",plate:"none",crest:""},
  australia:{continent:"Asia",name:"Australia",c1:"#FFCD00",c2:"#00843D",c3:"#000000",plate:"none",crest:""},
  qatar:{continent:"Asia",name:"Qatar",c1:"#8A1538",c2:"#FFFFFF",c3:"#B0B0B0",plate:"none",crest:""},
  iraq:{continent:"Asia",name:"Iraq",c1:"#007A3D",c2:"#FFFFFF",c3:"#CE1126",plate:"none",crest:""},
  uae:{continent:"Asia",name:"UAE",c1:"#00732F",c2:"#FFFFFF",c3:"#FF0000",plate:"none",crest:""},
  china:{continent:"Asia",name:"China",c1:"#DE2910",c2:"#FFFFFF",c3:"#FFDE00",plate:"none",crest:""},
  uzbekistan:{continent:"Asia",name:"Uzbekistan",c1:"#FFFFFF",c2:"#0099B5",c3:"#1EB53A",plate:"none",crest:""},
  jordan:{continent:"Asia",name:"Jordan",c1:"#FFFFFF",c2:"#007A3D",c3:"#CE1126",plate:"none",crest:""},
  oman:{continent:"Asia",name:"Oman",c1:"#DB161B",c2:"#FFFFFF",c3:"#008000",plate:"none",crest:""},
  bahrain:{continent:"Asia",name:"Bahrain",c1:"#CE1126",c2:"#FFFFFF",c3:"#000000",plate:"none",crest:""},
  vietnam:{continent:"Asia",name:"Vietnam",c1:"#DA251D",c2:"#FFFFFF",c3:"#FFFF00",plate:"none",crest:""},
  thailand:{continent:"Asia",name:"Thailand",c1:"#241D4F",c2:"#FFFFFF",c3:"#A51931",plate:"none",crest:""},

  /* ---- Oceania (10) ---- */
  "new-zealand":{continent:"Oceania",name:"New Zealand",c1:"#FFFFFF",c2:"#000000",c3:"#000000",plate:"none",crest:""},
  fiji:{continent:"Oceania",name:"Fiji",c1:"#62B5E5",c2:"#FFFFFF",c3:"#000000",plate:"none",crest:""},
  png:{continent:"Oceania",name:"Papua New Guinea",c1:"#CE1126",c2:"#FFFFFF",c3:"#FCD116",plate:"none",crest:""},
  "new-caledonia":{continent:"Oceania",name:"New Caledonia",c1:"#002654",c2:"#FFFFFF",c3:"#ED2939",plate:"none",crest:""},
  "solomon-islands":{continent:"Oceania",name:"Solomon Islands",c1:"#0051BA",c2:"#FFFFFF",c3:"#FCD116",plate:"none",crest:""},
  vanuatu:{continent:"Oceania",name:"Vanuatu",c1:"#009543",c2:"#FFFFFF",c3:"#FCD116",plate:"none",crest:""},
  tahiti:{continent:"Oceania",name:"Tahiti",c1:"#CE1126",c2:"#FFFFFF",c3:"#002B7F",plate:"none",crest:""},
  samoa:{continent:"Oceania",name:"Samoa",c1:"#002B7F",c2:"#FFFFFF",c3:"#CE1126",plate:"none",crest:""},
  tonga:{continent:"Oceania",name:"Tonga",c1:"#C10000",c2:"#FFFFFF",c3:"#000000",plate:"none",crest:""},
  "cook-islands":{continent:"Oceania",name:"Cook Islands",c1:"#007A3D",c2:"#FFFFFF",c3:"#FCD116",plate:"none",crest:""}
};

let CLUBS=structuredClone(DEFAULT_CLUBS), PRESETS={};
let NATIONS=structuredClone(DEFAULT_NATIONS);
let teamType="club";                 /* "club" sau "nation" */
let activeClub="arsenal";            /* key of the active team in the current set */
let lastKey={club:"arsenal",nation:"romania"};
const DB=()=>teamType==="nation"?NATIONS:CLUBS;

const $=id=>document.getElementById(id);
const FIELDS=["cat","date","cname","c1","c2","c3","head","sub","player",
  "fee","quote","who","ctx","handle","outlet","tier","plate","font","tpl","fmt","align",
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

const ANGLES={vert:"90deg",diag:"100deg",diag2:"125deg",diagr:"62deg"};

/* builds the split background; also returns the bands so we know the contrast */
function buildSplit(mode,A,B,dual){
  const ang=ANGLES[mode]||"100deg";
  const W=0.5; /* seam width in percent */
  let bands,stops,seam;
  if(dual){
    /* color 1 toward the outside; toward the seam, each team shows whichever of
       its color 2 / color 3 is brighter — keeps the "brighten toward the middle"
       look even when a team's true color 2 is dark (e.g. Inter, Barcelona).
       The seam takes the other, darker one from the left-hand team. */
    const innerA=lum(A.c2)>=lum(A.c3)?A.c2:A.c3;
    const innerB=lum(B.c2)>=lum(B.c3)?B.c2:B.c3;
    seam=innerA===A.c2?A.c3:A.c2;
    bands=[A.c1,innerA,innerB,B.c1];
    stops=[
      A.c1+" 0 25%", innerA+" 25% "+(50-W)+"%",
      seam+" "+(50-W)+"% "+(50+W)+"%",
      innerB+" "+(50+W)+"% 75%", B.c1+" 75% 100%"
    ];
  }else{
    seam=A.c3;
    bands=[A.c1,B.c1];
    stops=[
      A.c1+" 0 "+(50-W)+"%",
      seam+" "+(50-W)+"% "+(50+W)+"%",
      B.c1+" "+(50+W)+"% 100%"
    ];
  }
  return {css:"linear-gradient("+ang+","+stops.join(",")+")", bands:bands.concat([seam])};
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
function fillEntity(sel,g){
  $(sel).innerHTML=teamsInGroup(g)
    .map(([k,c])=>'<option value="'+k+'">'+c.name+'</option>').join("");
}
/* sync the two pairs of selectors: group (country/continent) + team */
function drawPickers(){
  const gp=$("groupPick"), g2=$("group2"), p1=$("clubPick"), p2=$("club2");
  const groups=groupsOf();
  const gopts=groups.map(g=>'<option value="'+g+'">'+g+'</option>').join("");
  gp.innerHTML=gopts; g2.innerHTML=gopts;

  const g1=groupKey(DB()[activeClub]||Object.values(DB())[0]);
  gp.value=g1; fillEntity("clubPick",g1);
  p1.value=DB()[activeClub]?activeClub:(teamsInGroup(g1)[0]?.[0]||"");

  const cur2=DB()[p2.value]?p2.value:null;
  const g2v=cur2?groupKey(DB()[cur2]):(groups.find(g=>g!==g1)||g1);
  g2.value=g2v; fillEntity("club2",g2v);
  p2.value=cur2?cur2:(teamsInGroup(g2v).find(([k])=>k!==activeClub)?.[0]
                      ||teamsInGroup(g2v)[0]?.[0]||"");
}

const val=id=>$(id).value;
const esc=s=>String(s).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));
/* write the score in both layers: the colored echo + the figure itself */
function setFig(id,txt){
  const el=$(id);
  el.querySelector(".echo").textContent=txt;
  el.querySelector(".fig").textContent=txt;
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
  r.setProperty("--H",$("fmt").value+"px");

  const card=$("card");
  /* how much room is left in the left half, next to the bottom text.
     On diagonals the seam moves toward the left edge near the card's base,
     so the ceiling is smaller the larger the angle. */
  const SAFE={vert:"420px",diag:"330px",diag2:"290px",diagr:"700px"};
  r.setProperty("--subMax", split ? (SAFE[splitModeEff]||"330px") : "34ch");

  let sp=null;
  if(split){
    sp=buildSplit(splitModeEff,A,B,dual);
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
  $("vSrc").closest(".src").classList.toggle("hide",!srcParts.length);

  const t=+$("tier").value;
  $("vDots").innerHTML=[1,2,3].map(i=>'<i class="'+(i<=t?"on":"")+'"></i>').join("");
  $("vLab").textContent=L.tiers[t];

  const crest=DB()[activeClub]?.crest;
  $("vCrest").classList.toggle("hide",!crest);
  if(crest)$("vCrest").src=crest;

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
/* the right-side team also fills the "To" name */
$("club2").addEventListener("change",render);
/* swap the two teams in one tap */
$("swapClubs").addEventListener("click",()=>{
  const right=$("club2").value, left=activeClub;
  if(!DB()[right]||right===left) return;
  loadClub(right);
  $("group2").value=groupKey(DB()[left]);
  fillEntity("club2",$("group2").value);
  $("club2").value=left;
  render();
});

/* picking a stage fills in the category and reliability — you can change them after */
$("status").addEventListener("change",()=>{
  const k=$("status").value, s=STATUS[k];
  if(s){ $("cat").value=L.st[k]; $("tier").value=String(s.tier); }
  render();
});

let DELETED={club:[],nation:[]};
$("groupPick").addEventListener("change",()=>{
  fillEntity("clubPick",$("groupPick").value);
  loadClub($("clubPick").value);
});
$("clubPick").addEventListener("change",e=>loadClub(e.target.value));
$("group2").addEventListener("change",()=>{
  fillEntity("club2",$("group2").value); render();
});

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
    $("group2").value=groupKey(DB()[o.club2]);
    fillEntity("club2",$("group2").value);
    $("club2").value=o.club2;
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
