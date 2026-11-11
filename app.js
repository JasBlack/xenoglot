// Xenoglot - JAS.BLACK · https://xenoglot.jas.black · MIT licence
// Everything runs in the browser: synthesis (Web Audio), word generation, alphabet and font (opentype.js).
(() => {
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---------- sound palette ---------- */
const PAL = [
 {g:'Vowels',k:'a',ipa:'a',t:'V',f:[750,1300,2500],h:'f<b>a</b>ther'},
 {k:'e',ipa:'e',t:'V',f:[450,2000,2600],h:'b<b>ay</b>, held pure'},
 {k:'i',ipa:'i',t:'V',f:[280,2300,3000],h:'s<b>ee</b>'},
 {k:'o',ipa:'o',t:'V',f:[450,850,2500],h:'g<b>o</b>, held pure'},
 {k:'u',ipa:'u',t:'V',f:[310,750,2300],h:'b<b>oo</b>t'},
 {k:'ä',ipa:'æ',t:'V',f:[680,1720,2450],h:'c<b>a</b>t'},
 {k:'ë',ipa:'ə',t:'V',f:[500,1450,2500],h:'<b>a</b>bout'},
 {k:'y',ipa:'y',t:'V',f:[280,1800,2250],h:'French t<b>u</b>'},
 {k:'ö',ipa:'ø',t:'V',f:[400,1500,2300],h:'German sch<b>ö</b>n'},
 {k:'ů',ipa:'ɯ',t:'V',f:[330,1300,2400],h:'oo with flat lips'},
 {g:'Stops',k:'p',ipa:'p',t:'stop',b:900,h:'<b>p</b>in'},
 {k:'b',ipa:'b',t:'stop',v:1,b:900,h:'<b>b</b>in'},
 {k:'t',ipa:'t',t:'stop',b:4200,h:'<b>t</b>op'},
 {k:'d',ipa:'d',t:'stop',v:1,b:3800,h:'<b>d</b>og'},
 {k:'k',ipa:'k',t:'stop',b:1900,h:'<b>k</b>ite'},
 {k:'g',ipa:'g',t:'stop',v:1,b:1800,h:'<b>g</b>o'},
 {k:'q',ipa:'q',t:'stop',b:1100,h:'k from deep in the throat'},
 {g:'Nasals',k:'m',ipa:'m',t:'nasal',f:[280,1100,2400],h:'<b>m</b>oon'},
 {k:'n',ipa:'n',t:'nasal',f:[280,1600,2600],h:'<b>n</b>ose'},
 {k:'ŋ',ipa:'ŋ',t:'nasal',f:[280,2000,2700],h:'si<b>ng</b>'},
 {g:'Fricatives (hissing and buzzing)',k:'f',ipa:'f',t:'fric',nf:7000,nq:.8,ng:.07,h:'<b>f</b>an'},
 {k:'v',ipa:'v',t:'fric',v:1,nf:7000,nq:.8,ng:.05,h:'<b>v</b>an'},
 {k:'þ',ipa:'θ',t:'fric',nf:6500,nq:.6,ng:.06,h:'<b>th</b>in'},
 {k:'s',ipa:'s',t:'fric',nf:6200,nq:4,ng:.7,h:'<b>s</b>un'},
 {k:'z',ipa:'z',t:'fric',v:1,nf:6000,nq:4,ng:.45,h:'<b>z</b>oo'},
 {k:'š',ipa:'ʃ',t:'fric',nf:3000,nq:3,ng:1,h:'<b>sh</b>ip'},
 {k:'ž',ipa:'ʒ',t:'fric',v:1,nf:2900,nq:3,ng:.6,h:'mea<b>s</b>ure'},
 {k:'ł',ipa:'ɬ',t:'fric',nf:4200,nq:1.6,ng:.5,h:'Welsh <b>ll</b>'},
 {k:'x',ipa:'x',t:'fric',nf:1500,nq:2,ng:.42,h:'Scottish lo<b>ch</b>'},
 {k:'h',ipa:'h',t:'fric',nf:1700,nq:.5,ng:.2,h:'<b>h</b>at'},
 {g:'Liquids and glides',k:'l',ipa:'l',t:'approx',f:[360,1300,2700],h:'<b>l</b>ip'},
 {k:'r',ipa:'ɹ',t:'approx',f:[420,1250,1600],h:'<b>r</b>ed'},
 {k:'ř',ipa:'r',t:'trill',f:[450,1300,2500],h:'rolled r'},
 {k:'w',ipa:'w',t:'approx',f:[300,650,2200],h:'<b>w</b>et'},
 {k:'j',ipa:'j',t:'approx',f:[280,2250,2950],h:'<b>y</b>es'},
 {g:'Clicks and catches',k:'c',ipa:'ǀ',t:'click',b:2800,h:'the “tsk” click'},
 {k:'ʔ',ipa:'ʔ',t:'glottal',h:'the catch in uh<b>-</b>oh'},
];
let gcur; PAL.forEach(p => { if (p.g) gcur = p.g; else p.g = gcur; });
const PM = Object.fromEntries(PAL.map(p => [p.k, p]));
// How each kind of sound is recorded and played back. "hold" sounds are trimmed to the length the word
// needs; "short" ones play as recorded. level = loudness next to a vowel, from the synth's measured mix.
const REC={V:{hold:1,level:1,hint:'hold it steady, about half a second'},
  nasal:{hold:1,level:.32,hint:'hum it with your lips or tongue closed, about half a second'},
  approx:{hold:1,level:.38,hint:'hold it as a steady glide, about half a second'},
  trill:{hold:1,level:.36,hint:'roll it for about half a second'},
  fric:{hold:1,level:.24,hint:'hiss or buzz it steadily, about half a second'},
  stop:{hold:0,level:.22,hint:'just the pop, as short as you can, no vowel after it'},
  click:{hold:0,level:.5,hint:'one sharp click'},
  glottal:{hold:0,level:.12,hint:'the tiny catch in “uh-oh”, as short as you can'}};
const recHint=k=>{ const p=PM[k]; return `say “${k}” (as in ${p.h.replace(/<\/?b>/g,'')}): ${REC[p.t].hint}`; };
const isV = k => PM[k] && PM[k].t === 'V';
const ENG44 = [['p','pin'],['b','bat'],['t','top'],['d','dog'],['k','cat'],['ɡ','go'],['f','fan'],['v','van'],['θ','thin'],['ð','this'],['s','sun'],['z','zoo'],['ʃ','ship'],['ʒ','measure'],['h','hat'],['tʃ','chip'],['dʒ','jam'],['m','man'],['n','no'],['ŋ','sing'],['l','leg'],['r','red'],['w','wet'],['j','yes'],
 ['ɪ','sit'],['e','bed'],['æ','cat'],['ʌ','cup'],['ɒ','hot'],['ʊ','book'],['ə','about'],['iː','see'],['ɑː','car'],['ɔː','saw'],['uː','blue'],['ɜː','bird'],['eɪ','day'],['aɪ','my'],['ɔɪ','boy'],['əʊ','go'],['aʊ','now'],['ɪə','near'],['eə','hair'],['ʊə','tour']];
const COMMON = 'the be to of and a in that have i it for not on with he as you do at this but his by from they we say her she or an will my one all would there their what so up out if about who get which go me when make can like time no just him know take people into year your good some could them see other than then now look only come its over think also back after use two how our work first well way even new want because any these give day most us man woman child world life hand eye place thing find tell ask feel try leave call water fire sky star moon sun ship home city light dark friend enemy war peace love speak language name stranger travel walk run quiet slowly fast watch nobody everyone yes hello goodbye please thank'.split(' ');
const FUNC = new Set('the a an of to in and or is am are was were be it i you he she we they me him her us them my your his our their this that at on by for with from as but if so not no do does did has have had will can'.split(' '));
const NOPL = new Set('this thus his hers its ours yours theirs yes us bus plus minus perhaps always news series lens chaos gas was has does is as across less unless'.split(' '));

/* ---------- utilities ---------- */
function hash(str){ let h1=0xdeadbeef,h2=0x41c6ce57; for(let i=0;i<str.length;i++){const c=str.charCodeAt(i);h1=Math.imul(h1^c,2654435761);h2=Math.imul(h2^c,1597334677);} h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909); h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909); return ((h1>>>0)^(h2>>>0))>>>0; }
function rngFrom(seed){ let a=seed>>>0; return ()=>{ a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const pick = (r, arr) => arr[Math.floor(r()*arr.length)];
const fmt = n => n >= 1e12 ? (n/1e12).toFixed(1)+' trillion' : n >= 1e9 ? (n/1e9).toFixed(1)+' billion' : n >= 1e6 ? (n/1e6).toFixed(1)+' million' : Math.round(n).toLocaleString();
const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
let toastTimer=0; function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.add('visible'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.classList.remove('visible'),3200); }
const store = { get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }, set(k,v){ try{ localStorage.setItem(k,v); return true; }catch(e){ return false; } } };

/* ---------- accent: how a language is spoken, apart from which sounds it has ----------
   Where the stress falls, how long vowels are held, how the pitch moves across a phrase (or carries tones),
   how tightly words run together, and the pace. Two languages with the same sounds and the same voice
   still sound like different languages. Stored on the language as L.accent and carried in share links. */
const ACCENT0={stress:'first',stressLen:1.65,vLen:1,cLen:1,longV:0,melody:'fall',range:1,gap:1,tempo:1,final:1.35,qRise:true};   // how every language was spoken before 2.2.0
const MELODY={fall:'falling',rise:'rising',wave:'sing-song',tone:'tonal',flat:'level',step:'stepping down'};
function makeAccent(r){ const f=(lo,hi)=>+(lo+r()*(hi-lo)).toFixed(2);
  return { stress:pick(r,['first','first','last','last','penult','penult','even']), stressLen:f(1.15,2.1), vLen:f(.78,1.35), cLen:f(.8,1.3), longV:r()<.5?f(.12,.38):0,
    melody:pick(r,['fall','rise','wave','wave','tone','tone','flat','step']), range:f(.6,2.1), gap:f(.3,1.9), tempo:f(.82,1.22), final:f(1.05,1.9), qRise:r()<.65 }; }
const acc=()=>({...ACCENT0,...(L&&L.accent||{})});
// for one word: where its vowels are, which one is stressed, which are held long, and each syllable's tone
function sylInfo(keys, A, w){ const vs=[]; keys.forEach((k,i)=>{ if(isV(k)) vs.push(i); }); const n=vs.length;
  const si=!n||A.stress==='even' ? -1 : A.stress==='last' ? n-1 : A.stress==='penult' ? Math.max(0,n-2) : 0;
  const hr=rngFrom(hash('len|'+w)), tr=rngFrom(hash('tone|'+w));
  return { vs, stressAt:si<0?-1:vs[si], long:vs.map((_,j)=>A.longV>0 && j!==si && hr()<A.longV), tone:vs.map(()=>tr()<.5?1:-1) }; }

/* ---------- language state ---------- */
const DEFAULT = { name:'Velnari', seed: 7741, inv: ['a','e','i','o','u','ë','p','t','k','d','g','m','n','ŋ','s','š','v','z','l','ř','j','x','c'],
  onset:.85, coda:.35, cluster:.12, maxSyl:4, voice:{pitch:150,speed:1,formant:1.12,breath:.3,jitter:.45,growl:0,choir:0,ring:0,vib:.15,space:.25},
  style:'tendril', pen:'brush', weird:.35, slant:.1, gseed:20251102, weight:9, glyphs:{}, lexicon:{}, engine:'synth', accent:{...ACCENT0} };
const PRESETS = {
  'Elder giant':        {pitch:45,speed:.8,formant:.72,breath:.14,jitter:.61,growl:.35,choir:0,ring:0,vib:.04,space:.55},   // the voice every visitor starts with (chosen by Jas, Nov 2026)
  'Natural voice':      {pitch:130,speed:1,formant:1,breath:.22,jitter:.45,growl:0,choir:0,ring:0,vib:.1,space:.2},
  'Soft and breathy':   {pitch:200,speed:.92,formant:1.15,breath:.55,jitter:.35,growl:0,choir:0,ring:0,vib:.15,space:.35},
  'Giant':              {pitch:58,speed:.8,formant:.68,breath:.25,jitter:.6,growl:.35,choir:0,ring:0,vib:.1,space:.55},
  'Small creature':     {pitch:330,speed:1.35,formant:1.6,breath:.25,jitter:.5,growl:0,choir:0,ring:0,vib:.45,space:.15},
  'Whispering spirit':  {pitch:160,speed:.85,formant:1.1,breath:1,jitter:.3,growl:0,choir:0,ring:0,vib:0,space:.8},
  'Hive choir':         {pitch:175,speed:.95,formant:1.25,breath:.3,jitter:.4,growl:0,choir:1,ring:0,vib:.35,space:.55},
  'Gravel beast':       {pitch:80,speed:.9,formant:.8,breath:.45,jitter:1,growl:.9,choir:0,ring:.1,vib:0,space:.3},
  'Machine oracle':     {pitch:110,speed:.95,formant:1.05,breath:0,jitter:0,growl:0,choir:.3,ring:.75,vib:0,space:.45},
  'Ethereal':           {pitch:240,speed:.85,formant:1.3,breath:.5,jitter:.2,growl:0,choir:.6,ring:0,vib:.3,space:.95},
  'Insectoid':          {pitch:390,speed:1.6,formant:1.7,breath:.1,jitter:.8,growl:.3,choir:.4,ring:.35,vib:.9,space:.1},
  'Deep ocean':         {pitch:70,speed:.72,formant:.74,breath:.35,jitter:.3,growl:.15,choir:.25,ring:0,vib:.2,space:1},
  'Glass child':        {pitch:300,speed:1.05,formant:1.45,breath:.15,jitter:.15,growl:0,choir:.15,ring:.28,vib:.2,space:.5},
  'Old radio':          {pitch:140,speed:1.05,formant:1.2,breath:.05,jitter:.7,growl:.2,choir:0,ring:.45,vib:.05,space:.05},
  'Swarm queen':        {pitch:260,speed:1.25,formant:1.4,breath:.2,jitter:.9,growl:.45,choir:1,ring:.2,vib:.7,space:.3},
  'Stone elder':        {pitch:66,speed:.68,formant:.7,breath:.5,jitter:.85,growl:.6,choir:0,ring:0,vib:.05,space:.7},
  'Wind spirit':        {pitch:210,speed:.8,formant:1.35,breath:.95,jitter:.2,growl:0,choir:.5,ring:0,vib:.5,space:1},
  'Cathedral':          {pitch:120,speed:.82,formant:.95,breath:.25,jitter:.25,growl:0,choir:.85,ring:0,vib:.2,space:1},
  'Broken machine':     {pitch:95,speed:1.15,formant:.9,breath:0,jitter:1,growl:.5,choir:.2,ring:.9,vib:.6,space:.2},
  'Chittering':         {pitch:340,speed:1.75,formant:1.55,breath:.3,jitter:1,growl:.15,choir:.2,ring:.1,vib:1,space:.05},
  'Dream voice':        {pitch:185,speed:.78,formant:1.1,breath:.6,jitter:.1,growl:0,choir:.7,ring:.12,vib:.4,space:.85},
  'Throat singer':      {pitch:88,speed:.85,formant:.82,breath:.2,jitter:.5,growl:.75,choir:.5,ring:.15,vib:.3,space:.45},
  'Little bell':        {pitch:360,speed:1.1,formant:1.65,breath:.1,jitter:.1,growl:0,choir:0,ring:.5,vib:.3,space:.6},
};
let L = structuredClone(DEFAULT);
let recs = {}; // key -> {buf, b64}
let wordCache = new Map();

function C(){ return L.inv.filter(k => !isV(k)); }
function V(){ return L.inv.filter(isV); }
function clusterSeconds(){ return C().filter(k => 'lrřwj'.includes(k)); }

/* Word shapes, generation 2. Rules borrowed from how real languages (and conlang word generators) behave:
   - sounds are weighted: common ones (t k m n a i) turn up far more than rare ones (q ö clicks),
     and every language gets its own favourites on top, so two languages with the same sounds still differ
   - syllable endings use only sounds that sit well there (nasals, liquids, s, t, k…), never clicks
   - clusters only rise in loudness (tr, pl, kw), as in most languages
   - at most one click or catch per word, and only after a vowel or at the start
   - vowels rarely collide across syllables, no doubled consonant across a join, no "tata" stutters */
const FREQ={a:10,i:8,u:7,e:6,o:6,'ë':3,'ä':2,y:1.5,'ö':1.2,'ů':1,
  t:9,k:9,m:9,n:9,p:7,s:7,l:6,j:6,w:6,b:5,d:5,g:5,h:5,r:5,'ŋ':4,f:4,v:3,z:3,'š':3,'ř':3,x:2,'ʔ':2,q:1.5,'ž':1.5,'þ':1.2,'ł':1,c:1};
const CODA={n:4,m:3,l:3,'ŋ':2.5,r:2.5,s:2.5,t:1.5,k:1.5,'š':1.2,'ř':1,p:.8,j:.8,f:.6,x:.6,w:.6,z:.5,'ł':.5,d:.4,v:.4,b:.3,g:.3,'þ':.3,'ž':.3,'ʔ':.3,h:.2,q:.2};
const HARD=k=>k==='c'||k==='ʔ';
let wCacheKey='', wCache={};
function langWeights(){ const key=L.seed+'|'+L.inv.join(''); if(key===wCacheKey) return wCache;
  wCache={}; for(const k of L.inv){ const r=rngFrom(hash(L.seed+'~'+k)); wCache[k]=(FREQ[k]||1)*(.4+r()*1.2); } wCacheKey=key; return wCache; }
function pickW(r, items, wf){ let tot=0; const ws=items.map(k=>{ const w=Math.max(0,wf(k)); tot+=w; return w; }); if(tot<=0) return pick(r,items);
  let x=r()*tot; for(let i=0;i<items.length;i++){ x-=ws[i]; if(x<=0) return items[i]; } return items[items.length-1]; }
function makeSyl(r, first, prev){
  const W=langWeights(), cs=C(), vs=V(); if(!vs.length) return '';
  const chars=[...prev], last=chars[chars.length-1]||'', prevV=last?isV(last):false;
  let s='';
  if(cs.length && (r()<L.onset || (prevV && r()<.93))){
    let pool=cs.filter(k=>k!==last);
    if(chars.some(HARD) || (last && !prevV)) pool=pool.filter(k=>!HARD(k));
    if(pool.length){ const c1=pickW(r,pool,k=>W[k]); s+=c1;
      const cl=clusterSeconds().filter(k=>k!==c1);
      if(cl.length && (PM[c1].t==='stop'||PM[c1].t==='fric') && c1!=='h' && r()<L.cluster) s+=pickW(r,cl,k=>W[k]); }
  }
  const pv=[...chars].reverse().find(isV);
  let vpool=(!s && prevV) ? vs.filter(v=>v!==last) : vs; if(!vpool.length) vpool=vs;
  s+=pickW(r,vpool,k=>W[k]*(k===pv?.6:1));
  if(cs.length && r()<L.coda){ const pool=cs.filter(k=>CODA[k]); if(pool.length) s+=pickW(r,pool,k=>W[k]*CODA[k]); }
  return s;
}
function makeWord(r, n){ let w='', lastSyl='';
  for(let i=0;i<n;i++){ let syl, tries=0; do{ syl=makeSyl(r,i===0,w); tries++; } while(syl===lastSyl && tries<4); w+=syl; lastSyl=syl; }
  return w; }
function engSyl(w){ const m = w.match(/[aeiouy]+/g); let n = m ? m.length : 1; if (/[^aeiou]e$/.test(w) && n > 1) n--; return Math.max(1, n); }
function normKey(w){ let s=w; if (s.length>3 && s.endsWith('e')) s=s.slice(0,-1); if (/([bcdfghjklmnpqrstvwxz])\1$/.test(s) && s.length>3) s=s.slice(0,-1); return s; }
function root(w){
  const key = normKey(w);
  const r = rngFrom(hash(L.seed + ':' + key));
  let n = FUNC.has(w) ? 1 : Math.min(L.maxSyl, engSyl(w) + (w.length > 3 && r() < .35 ? 1 : 0));
  return makeWord(r, Math.max(1, n));
}
const AFFIX = [['PL','plural','-s','stars'],['PAST','past tense','-ed','walked'],['ING','ongoing','-ing','walking'],['POSS','belongs to','’s','ship’s'],['NEG','not',"n’t",'can’t'],['ADV','manner','-ly','slowly']];
function affix(tag){
  const r = rngFrom(hash(L.seed + '#' + tag));
  const vs=V(), cs=C(); if(!vs.length) return '';
  const W=langWeights(); let s = pickW(r, vs, k=>W[k]);
  const pool=cs.filter(k=>CODA[k]); if (pool.length && r() < .75) s += pickW(r, pool, k=>W[k]*CODA[k]);
  return s;
}
function lexRoot(stem){ if (L.lexicon[stem]) return L.lexicon[stem]; if (L.lexicon[stem+'e']) return L.lexicon[stem+'e']; return root(stem); }
function alienWord(en){
  const w = en.toLowerCase().replace(/’/g,"'");
  if (L.lexicon[w]) return L.lexicon[w];
  if (wordCache.has(w)) return wordCache.get(w);
  let out;
  if (w.endsWith("n't") && w.length > 4) { const base = w === "won't" ? 'will' : w === "can't" ? 'can' : w.slice(0,-3); out = alienWord(base) + affix('NEG'); }
  else if (w.endsWith("'s") && w.length > 3) out = alienWord(w.slice(0,-2)) + affix('POSS');
  else if (w.includes("'")) out = w.split("'").map(p => p ? alienWord(p) : '').join('');
  else if (/^[a-z]{3,}ing$/.test(w)) out = lexRoot(w.slice(0,-3)) + affix('ING');
  else if (/^[a-z]{3,}ed$/.test(w)) out = lexRoot(w.slice(0,-2)) + affix('PAST');
  else if (/^[a-z]{3,}ly$/.test(w)) out = lexRoot(w.slice(0,-2)) + affix('ADV');
  else if (/^[a-z]{2,}[^su]s$/.test(w) && !NOPL.has(w)) out = (w.endsWith('ies') ? lexRoot(w.slice(0,-3)+'y') : lexRoot(w.slice(0,-1))) + affix('PL');
  else out = root(w);
  wordCache.set(w, out);
  return out;
}

/* ---------- translation ---------- */
// numbers are read out: "42" becomes "forty two", and each of those words is translated
const ONES='zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split(' ');
const TENS=',,twenty,thirty,forty,fifty,sixty,seventy,eighty,ninety'.split(',');
function numberWords(str){ const [whole,frac]=str.replace(/,(?=\d{3})/g,'').split(/[.,]/);
  const digits=d=>[...d].map(c=>ONES[+c]);
  if(whole.length>15 || (whole.length>1 && whole[0]==='0')) return digits(whole).concat(frac?['point',...digits(frac)]:[]); // phone numbers, codes
  const under1000=n=>{ const o=[]; if(n>=100){ o.push(ONES[Math.floor(n/100)],'hundred'); n%=100; } if(n>=20){ o.push(TENS[Math.floor(n/10)]); n%=10; if(n) o.push(ONES[n]); } else if(n||!o.length) o.push(ONES[n]); return o; };
  let n=+whole, out=[]; if(!n) out=['zero'];
  else [['trillion',1e12],['billion',1e9],['million',1e6],['thousand',1e3],['',1]].forEach(([name,v])=>{ const k=Math.floor(n/v); if(k){ out.push(...under1000(k)); if(name) out.push(name); n-=k*v; } });
  return out.concat(frac?['point',...digits(frac)]:[]); }
function translate(text, keepNames){
  const toks=[]; const re=/([A-Za-z]+(?:['’][A-Za-z]+)*)|(\n)|(\d+(?:[.,]\d+)*)|([.,!?;:]+)|([ \t]+)|(.)/g; let m, sentStart=true;
  while((m=re.exec(text))){
    if (m[3]) { numberWords(m[3]).forEach((w,i)=>{ if(i) toks.push({t:'sp'}); toks.push({t:'w', en:w, al:alienWord(w)}); }); sentStart=false; continue; }
    if (m[1]) { const en=m[1]; const isCap = /^[A-Z]/.test(en);
      let al = (keepNames && isCap && !sentStart && en !== 'I') ? en : alienWord(en);
      if (isCap && al) al = cap(al);
      toks.push({t:'w', en, al}); sentStart=false; }
    else if (m[2]) { toks.push({t:'nl'}); sentStart=true; }
    else if (m[4]) { toks.push({t:'p', s:m[4]}); if (/[.!?]/.test(m[4])) sentStart=true; }
    else if (m[5]) toks.push({t:'sp'});
    else toks.push({t:'o', s:m[6]});
  }
  return toks;
}
const toKeys = w => [...w.toLowerCase()].filter(k => PM[k]);
const ipaOf = w => toKeys(w).map(k => PM[k].ipa).join('');

/* ---------- speech synth ---------- */
let actx=null; function getCtx(){ if(!actx) actx = new (window.AudioContext||window.webkitAudioContext)(); if (actx.state!=='running') actx.resume().catch(()=>{}); return actx; }
// Phones only let a page make sound from inside a tap, and an iPhone with its ringer switch off mutes Web Audio altogether.
// So every tap or key press wakes the audio engine, and on iOS a silent <audio> element is kept playing, which moves the page
// into the "playback" category that the ringer switch doesn't mute.
const IOS=/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.maxTouchPoints>1&&/Mac/.test(navigator.platform||''));
let silentEl=null, unlocked=false;
function silentWav(){ const n=2000, b=new Uint8Array(44+n), v=new DataView(b.buffer), w=(o,t)=>[...t].forEach((c,i)=>b[o+i]=c.charCodeAt(0));
  w(0,'RIFF'); v.setUint32(4,36+n,true); w(8,'WAVEfmt '); v.setUint32(16,16,true); v.setUint16(20,1,true); v.setUint16(22,1,true); v.setUint32(24,8000,true); v.setUint32(28,8000,true); v.setUint16(32,1,true); v.setUint16(34,8,true); w(36,'data'); v.setUint32(40,n,true); b.fill(128,44);
  return URL.createObjectURL(new Blob([b],{type:'audio/wav'})); }
function unlockAudio(){ let c; try{ c=getCtx(); }catch(e){ return; }
  try{ if(navigator.audioSession) navigator.audioSession.type='playback'; }catch(e){}
  if(IOS){ if(!silentEl){ silentEl=new Audio(silentWav()); silentEl.loop=true; silentEl.setAttribute('playsinline',''); } if(silentEl.paused) silentEl.play().catch(()=>{}); }
  if(!unlocked){ try{ const s0=c.createBufferSource(); s0.buffer=c.createBuffer(1,1,c.sampleRate); s0.connect(c.destination); s0.start(0); unlocked=c.state==='running'; }catch(e){} } }
['pointerdown','touchend','keydown','click'].forEach(ev=>document.addEventListener(ev,unlockAudio,{capture:true,passive:true}));
document.addEventListener('visibilitychange',()=>{ if(silentEl){ if(document.hidden) silentEl.pause(); else if(unlocked) silentEl.play().catch(()=>{}); } });
function baseDur(p, stressed){ return p.t==='V' ? (stressed?.165:.1) : p.t==='stop' ? .09 : p.t==='click' ? .07 : p.t==='glottal' ? .07 : p.t==='fric' ? .1 : p.t==='trill' ? .1 : .07; }
// word list -> segments. words: [{al, end:'.'|','|'?'|'' }]
function wordsToSegs(words, voice, t0=0.12){
  const segs=[]; let t=t0; const A=acc(), sp=voice.speed*A.tempo, R=A.range, base=voice.pitch;
  let phrase=[];
  const flush=(end)=>{
    const n=phrase.length; let sylNo=0;
    phrase.forEach((wo, wi) => { const w=wo.al;
      const keys=toKeys(w), pos=n>1? wi/(n-1) : 0, si=sylInfo(keys,A,w);
      // the phrase's tune: falling, rising, stepping down word by word, or held level for the tunes that move per syllable
      const decl = A.melody==='fall' ? 1+.1*R-.24*R*pos : A.melody==='rise' ? 1-.1*R+.22*R*pos : A.melody==='step' ? Math.max(.68, 1+.12*R-.085*R*wi) : 1.03-.06*pos;
      const wr=rngFrom(hash(w+wi)); const accent = 1 + (wr()-.4)*.12; // each word gets its own lilt
      const lastW = wi===n-1, lastQ = end==='?' && lastW;
      const lastV = si.vs.length ? si.vs[si.vs.length-1] : keys.length;
      keys.forEach((k, ki) => {
        const p=PM[k], st = ki===si.stressAt, vj=si.vs.indexOf(ki), syl=Math.min(Math.max(si.vs.length-1,0), si.vs.filter(x=>x<ki).length);
        let d = p.t==='V' ? .1*A.vLen*(st?A.stressLen : A.stress==='even'?1.25 : 1)*(vj>=0&&si.long[vj]?1.8:1) : baseDur(p,false)*A.cLen; d/=sp;
        if (recs[k] && !REC[p.t].hold) d = Math.min(recs[k].buf.duration, .16);
        if (lastW && end && ki>=lastV) d *= A.final*(lastQ&&!A.qRise?1.25:1);   // phrase-final lengthening
        d *= .92 + wr()*.16;                                 // no two syllables exactly alike
        const move = A.melody==='wave' ? 1+.13*R*Math.sin((sylNo+syl)*1.9) : A.melody==='tone' ? 1+.16*R*(si.tone[syl]||0) : 1;
        let pitch = base*decl*accent*move*(st ? 1+(A.melody==='flat'?.05:A.melody==='tone'?.05:.14*Math.min(R,1.4)) : .97);
        if (lastQ && A.qRise) pitch = base*(1 + .5*Math.pow((ki+1)/keys.length,1.5));
        else if (end && end!==',' && lastW) pitch *= 1 - (lastQ?.26:.16)*(ki/keys.length);
        pitch=Math.max(base*.55,Math.min(base*1.9,pitch));
        segs.push({k, t, d, p:pitch, a: p.t==='V' ? (st||A.stress==='even'&&vj>=0?1:.72) : 1, w, en:wo.en}); t+=d;
      });
      sylNo+=si.vs.length;
      const gap=(.07+wr()*.05)*A.gap/sp; segs.push({k:null, t, d:gap, p:base*decl*.95}); t+=gap;
    });
    if (end) { const d = end===',' ? .22/sp : .48/sp; segs.push({k:null,t,d,p:base}); t+=d; }
    phrase=[];
  };
  words.forEach(w => { if (w.al) phrase.push(w); if (w.end) flush(w.end); });
  flush('');
  return {segs, dur:t+.3};
}
function tokensToWords(toks){
  const out=[];
  toks.forEach(tk => {
    if (tk.t==='w') out.push({al:tk.al, en:tk.en});
    else if (tk.t==='p' || tk.t==='nl') { const s = tk.t==='nl' ? '.' : tk.s; const end = /\?/.test(s)?'?': /[.!;:]/.test(s)?'.':','; if (out.length) out[out.length-1].end = end; }
  });
  return out;
}
let noiseBuf=null, NOISE_TRIM=.15, VOICE_TRIM=1; // trims measured so hiss sits 10-20 dB under the vowels, as in real speech
if(/[?&]debug\b/.test(location.search)||window.__xgDebug) window.__xg={ head:()=>head, getLang:()=>L, setTrim:(n,v)=>{ NOISE_TRIM=n; VOICE_TRIM=v; }, run:(keys,voice)=>{ let t=.05; const segs=keys.map(([k,d])=>{ const s={k,t,d,p:(voice||L.voice).pitch,a:1}; t+=d; return s; }); return render(segs,t+.05,voice||L.voice,{raw:true}); } };
function smoothNoise(ctx, dur, rate, seed){ // slowly wandering random signal in -1..1, for jitter and shimmer
  const sr=ctx.sampleRate, n=Math.ceil(sr*dur)+1, b=ctx.createBuffer(1,n,sr), d=b.getChannelData(0), r=rngFrom(seed);
  const step=Math.max(1,Math.round(sr/rate)); let a=r()*2-1, z=r()*2-1;
  for(let i=0;i<n;i++){ if(i%step===0){ a=z; z=r()*2-1; } const u=(i%step)/step, s=u*u*(3-2*u); d[i]=a+(z-a)*s; }
  return b;
}
async function render(segs, dur, voice, extra={}){
  const led=document.getElementById('ledVoice'); led&&led.classList.add('on'); try{ return await renderInner(segs, dur, voice, extra); } finally { if(led&&!playing) led.classList.remove('on'); } }
const refCache=new Map();
function clipRms(buf){ const d=buf.getChannelData(0); let s=0; for(let i=0;i<d.length;i++) s+=d[i]*d[i]; return Math.sqrt(s/(d.length||1)); }
async function refLevel(voice){ const key=JSON.stringify(voice); if(refCache.has(key)) return refCache.get(key);
  const b=await renderInner([{k:'a',t:.05,d:.35,p:voice.pitch,a:1}], .45, voice, {raw:true,noRec:true});
  const d=b.getChannelData(0), sr=b.sampleRate; let s=0,n=0; for(let i=Math.floor(sr*.12);i<Math.floor(sr*.36);i++){ s+=d[i]*d[i]; n++; }
  const v=Math.sqrt(s/(n||1))||.1; refCache.set(key,v); return v; }
async function renderInner(segs, dur, voice, extra={}){
  if(!extra.noRec && Object.keys(recs).length && extra.ref==null) extra={...extra, ref:await refLevel({...DEFAULT.voice,...voice})};
  voice={...DEFAULT.voice, ...voice};
  const sr=44100, tail=voice.space>0 ? .2+voice.space*1.6 : 0;
  const ctx=new OfflineAudioContext(1, Math.ceil(sr*(dur+tail)), sr);
  if (!noiseBuf || noiseBuf.sampleRate!==sr){ noiseBuf = ctx.createBuffer(1, sr*3, sr); const d=noiseBuf.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1; }
  const fs=voice.formant, starts=[];
  // vocal-fold pulse: harmonics fall off like a real glottal source; breathier voices fall off faster
  const H=80, re=new Float32Array(H), im=new Float32Array(H), tilt=1.15+voice.breath*.9;
  for(let k=1;k<H;k++){ im[k]=Math.pow(k,-tilt)*(k%2?1:.85); re[k]=.15*Math.pow(k,-tilt-.4); }
  const wave=ctx.createPeriodicWave(re,im);
  const exc=ctx.createGain();               // excitation: everything that goes through the throat
  const voicedLevel=Math.max(0,1-voice.breath*1.05);
  const jit=ctx.createBufferSource(); jit.buffer=smoothNoise(ctx,dur+tail,9,hash('j'+dur)); starts.push(jit);
  const drift=ctx.createBufferSource(); drift.buffer=smoothNoise(ctx,dur+tail,1.5,hash('d'+dur)); starts.push(drift);
  const lfo=ctx.createOscillator(); lfo.frequency.value=4.6+voice.vib*2; starts.push(lfo);
  const oscs=[];
  const addOsc=(ratio,level,cents)=>{ if(level<=0.001) return; const o=ctx.createOscillator(); o.setPeriodicWave(wave); o.detune.value=cents||0; o.frequency.value=voice.pitch*ratio;
    const g=ctx.createGain(); g.gain.value=level; o.connect(g).connect(exc);
    const jg=ctx.createGain(); jg.gain.value=voice.pitch*ratio*(.006+voice.jitter*.035); jit.connect(jg).connect(o.frequency);
    const dg=ctx.createGain(); dg.gain.value=voice.pitch*ratio*.025; drift.connect(dg).connect(o.frequency);
    const vg=ctx.createGain(); vg.gain.value=voice.pitch*ratio*voice.vib*.07; lfo.connect(vg).connect(o.frequency);
    oscs.push({o,ratio}); starts.push(o); };
  addOsc(1, voicedLevel, 0);
  if (voice.choir>0){ const c=voice.choir; addOsc(1, voicedLevel*c*.75, 8+c*16); addOsc(1, voicedLevel*c*.75, -(10+c*15)); if(c>.55) addOsc(1.4983, voicedLevel*(c-.55)*1.1, 4); if(c>.8) addOsc(.5, voicedLevel*(c-.8)*2, -3); }
  if (voice.growl>0) addOsc(.5, voicedLevel*voice.growl*1.1, 0);
  if (voice.growl>.3) addOsc(.75, voicedLevel*(voice.growl-.3)*.7, 0);
  const br=ctx.createBufferSource(); br.buffer=noiseBuf; br.loop=true; starts.push(br);
  const brHP=ctx.createBiquadFilter(); brHP.type='highpass'; brHP.frequency.value=350;
  const brG=ctx.createGain(); brG.gain.value=.02+voice.breath*.25+voice.breath*voice.breath*.9; br.connect(brHP).connect(brG).connect(exc);
  // the throat: three moving resonances, two fixed upper ones, a nasal notch, lip radiation
  // cascade of resonators (as in classic formant synthesizers): each is a resonant 2-pole low-pass,
  // so the relative loudness of the formants comes out right by itself
  let node=exc;
  const qdb=(f,bw)=>Math.max(0,20*Math.log10(f/bw));
  const res=(f,bw)=>{ const b=ctx.createBiquadFilter(); b.type='lowpass'; b.frequency.value=f; b.Q.value=qdb(f,bw); node.connect(b); node=b; return b; };
  const F=[res(500*fs,70),res(1450*fs,90),res(2500*fs,130)]; res(3400*fs,250); res(4300*fs,320);
  const pre=ctx.createIIRFilter([1,-.94],[1]); node.connect(pre); node=pre;   // lip radiation
  const notch=ctx.createBiquadFilter(); notch.type='notch'; notch.frequency.value=19000; notch.Q.value=2; node.connect(notch); node=notch;
  const body=ctx.createBiquadFilter(); body.type='lowpass'; body.frequency.value=Math.min(16000,6500*fs); body.Q.value=.5; node.connect(body); node=body;
  const shim=ctx.createGain(); shim.gain.value=1; const sj=ctx.createBufferSource(); sj.buffer=smoothNoise(ctx,dur+tail,14,hash('s'+dur)); starts.push(sj);
  const sg=ctx.createGain(); sg.gain.value=.04+voice.jitter*.22; sj.connect(sg).connect(shim.gain); node.connect(shim);
  const vAmp=ctx.createGain(); vAmp.gain.value=0; const vt=ctx.createGain(); vt.gain.value=VOICE_TRIM; shim.connect(vt).connect(vAmp);
  // hiss and bursts for consonants
  const noise=ctx.createBufferSource(); noise.buffer=noiseBuf; noise.loop=true; noise.loopStart=1; starts.push(noise);
  const nF=ctx.createBiquadFilter(); nF.type='bandpass'; const nAmp=ctx.createGain(); nAmp.gain.value=0; noise.connect(nF).connect(nAmp);
  const mix=ctx.createGain(); mix.gain.value=1; vAmp.connect(mix);
  const nTrim=ctx.createGain(); nTrim.gain.value=NOISE_TRIM; nAmp.connect(nTrim).connect(mix);
  const out=ctx.createGain(); out.connect(ctx.destination);
  const dry=ctx.createGain(); dry.gain.value=1-voice.ring*.85; mix.connect(dry).connect(out);
  if (voice.ring>0){ const ring=ctx.createGain(); ring.gain.value=0; const rOsc=ctx.createOscillator(); rOsc.frequency.value=40+voice.formant*35; rOsc.connect(ring.gain); starts.push(rOsc);
    const wet=ctx.createGain(); wet.gain.value=voice.ring*1.5; mix.connect(ring).connect(wet).connect(out); }
  if (voice.space>0){ const len=Math.ceil(sr*(.25+voice.space*1.5)), ir=ctx.createBuffer(1,len,sr), d=ir.getChannelData(0); let lp=0;
    for(let i=0;i<len;i++){ lp=lp*.6+(Math.random()*2-1)*.4; d[i]=lp*Math.pow(1-i/len,2.2+ (1-voice.space)*2); }
    const cv=ctx.createConvolver(); cv.buffer=ir; const wg=ctx.createGain(); wg.gain.value=voice.space*.55; out.connect(cv).connect(wg).connect(ctx.destination); }
  // motion of the throat over time
  const nat=.018+(1-voice.ring)*.012;
  const setF=(fr,t,tc=nat)=>{ const bws=[55+fr[0]*.06,70+fr[1]*.03,110+fr[2]*.025]; F.forEach((f,i)=>{ f.frequency.setTargetAtTime(fr[i]*fs,t,tc); f.Q.setTargetAtTime(qdb(fr[i]*fs,bws[i]),t,tc); }); };
  const setP=(p,t,tc)=>oscs.forEach(({o,ratio})=>o.frequency.setTargetAtTime(p*ratio,t,tc));
  const nasal=(on,t)=>{ notch.frequency.setTargetAtTime(on?1100*fs:19000,t,.006); };
  setF([500,1450,2500],0,.001);
  if (extra.pitchCurve) oscs.forEach(({o,ratio})=>o.frequency.setValueCurveAtTime(extra.pitchCurve.map(v=>v*ratio), 0, extra.pitchCurveDur));
  for (const s of segs){
    const {t,d}=s;
    if (!extra.pitchCurve) setP(s.p, t, .045);
    if (!s.k){ vAmp.gain.setTargetAtTime(0,t,.025); nAmp.gain.setTargetAtTime(0,t,.012); nasal(false,t); continue; }
    const p=PM[s.k];
    if (recs[s.k] && !extra.noRec){ vAmp.gain.setTargetAtTime(0,t,.004); nAmp.gain.setTargetAtTime(0,t,.004);
      // your voice, fitted into the word: held sounds take the steady middle of the clip at the length
      // the word needs, short ones play whole; levelled so a recorded vowel matches a synth vowel
      const rc=recs[s.k], kind=REC[p.t], cd=rc.buf.duration; rc.rms ??= clipRms(rc.buf);
      const len=kind.hold ? Math.min(cd, d+.03) : cd, off=kind.hold ? Math.max(0,(cd-len)/2) : 0;
      const lvl=Math.min(8, (extra.ref||.1)*kind.level/(rc.rms||.1)) * (kind.hold ? (s.a||1) : 1);
      const b=ctx.createBufferSource(); b.buffer=rc.buf; const g=ctx.createGain(); const fade=Math.min(.015,len/4);
      g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(lvl,t+fade); g.gain.setValueAtTime(lvl,t+len-fade); g.gain.linearRampToValueAtTime(0,t+len);
      b.connect(g).connect(mix); b.start(t,off,len); continue; }
    nasal(p.t==='nasal',t);
    switch(p.t){
      case 'V': setF(p.f,t); vAmp.gain.setTargetAtTime(s.a||1,t,.016); nAmp.gain.setTargetAtTime(0,t,.01); break;
      case 'nasal': setF(p.f,t,.01); vAmp.gain.setTargetAtTime(.45,t,.012); nAmp.gain.setTargetAtTime(0,t,.008); break;
      case 'approx': setF(p.f,t,.025); vAmp.gain.setTargetAtTime(.62,t,.02); nAmp.gain.setTargetAtTime(0,t,.008); break;
      case 'trill': setF(p.f,t,.012); vAmp.gain.setTargetAtTime(.6,t,.006);
        for(let i=1;i<=3;i++){ const x=t+i*d/4-.01; vAmp.gain.setTargetAtTime(.1,x,.005); vAmp.gain.setTargetAtTime(.6,x+.017,.005); } nAmp.gain.setTargetAtTime(0,t,.008); break;
      case 'fric':
        nF.frequency.setValueAtTime(p.nf*Math.min(1.25,fs),t); nF.Q.setValueAtTime(p.nq,t);
        nAmp.gain.setTargetAtTime(p.ng*(p.nq>2?1.4:2.2),t,.014); nAmp.gain.setTargetAtTime(p.ng*(p.nq>2?1:1.6),t+d*.6,.02);
        if (p.v){ setF([250,1300,2500],t,.012); vAmp.gain.setTargetAtTime(.3,t,.012); } else vAmp.gain.setTargetAtTime(0,t,.01);
        break;
      case 'stop': { const c=t+d*.62;
        nAmp.gain.setTargetAtTime(0,t,.005);
        if (p.v){ setF([220,900,2400],t,.01); vAmp.gain.setTargetAtTime(.1,t,.008); } else vAmp.gain.setTargetAtTime(0,t,.006);
        nF.frequency.setValueAtTime(p.b*Math.min(1.25,fs),c); nF.Q.setValueAtTime(1.3,c);
        nAmp.gain.setValueAtTime(2,c); nAmp.gain.setTargetAtTime(p.v?0:.16,c+.004,.009);
        if(!p.v){ nF.frequency.setValueAtTime(1600*fs,c+.014); nF.Q.setValueAtTime(.6,c+.014); nAmp.gain.setTargetAtTime(0,c+.03,.02); }
        break; }
      case 'click': { const c=t+d*.35; vAmp.gain.setTargetAtTime(0,t,.003); nAmp.gain.setTargetAtTime(0,t,.003);
        nF.frequency.setValueAtTime(p.b,c); nF.Q.setValueAtTime(5,c); nAmp.gain.setValueAtTime(13,c); nAmp.gain.setTargetAtTime(0,c+.002,.004); break; }
      case 'glottal': vAmp.gain.setTargetAtTime(0,t,.002); nAmp.gain.setTargetAtTime(0,t,.003); break;
    }
  }
  if (extra.under){ const b=ctx.createBufferSource(); b.buffer=extra.under; const g=ctx.createGain(); g.gain.value=extra.underVol; b.connect(g).connect(ctx.destination); b.start(0); }
  starts.forEach(n=>n.start(0));
  const buf=await ctx.startRendering();
  if(!extra.raw) normalise(buf.getChannelData(0));
  return buf;
}
// loudness by the body of the speech, not its loudest click; soft-clip the rare spikes
function normalise(d){ const n=d.length, step=Math.max(1,Math.floor(n/60000)), a=[]; for(let i=0;i<n;i+=step) a.push(Math.abs(d[i])); a.sort((x,y)=>x-y);
  const ref=a[Math.floor(a.length*.985)]||0; if(!ref) return; const k=.62/ref; for(let i=0;i<n;i++){ const v=d[i]*k; d[i]=Math.tanh(v*1.15)/1.05; } }
/* ---------- natural voice: Piper neural voices, run in the browser with onnxruntime-web ----------
   The voice reads the language's IPA directly (no English spelling step). Models are public-domain Piper
   voices on Hugging Face, downloaded once and kept in Cache Storage. The built-in synth stays as the fallback. */
// kind 'piper': public-domain Piper voices. kind 'kokoro': Kokoro-82M (Apache-2.0), one shared model plus a small style file per voice.
// models come from Hugging Face; on localhost a ?hf= address can point at a local copy, for tests
const HF=(/^(127\.0\.0\.1|localhost)$/.test(location.hostname) && new URLSearchParams(location.search).get('hf')) || 'https://huggingface.co/';
const KOKORO=HF+'onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main/';
const PIPER=HF+'rhasspy/piper-voices/resolve/main/', KMODEL=KOKORO+'onnx/model_quantized.onnx';
// Voices trained on other languages speak the same sounds with a different mouth: the cheapest way to stop every language sounding English.
// quick = Piper (one 63 MB file each). lifelike = Kokoro (one 92 MB model shared by all, plus half a megabyte per voice), slower to make.
const NATURAL={
  kristin:{kind:'piper', label:'clarity', about:'quick · trained on an American woman', url:PIPER+'en/en_US/kristin/medium/en_US-kristin-medium', pitch:195, mb:63},
  norman:{kind:'piper', label:'gravity', about:'quick · trained on an American man', url:PIPER+'en/en_US/norman/medium/en_US-norman-medium', pitch:110, mb:63},
  harri:{kind:'piper', label:'patience', about:'quick · trained on a Finnish man', url:PIPER+'fi/fi_FI/harri/medium/fi_FI-harri-medium', pitch:105, mb:63},
  anna:{kind:'piper', label:'grace', about:'quick · trained on a Hungarian woman', url:PIPER+'hu/hu_HU/anna/medium/hu_HU-anna-medium', pitch:200, mb:63},
  vais:{kind:'piper', label:'haste', about:'quick · trained on a Vietnamese woman', url:PIPER+'vi/vi_VN/vais1000/medium/vi_VN-vais1000-medium', pitch:230, mb:63, len:1.35},   /* this voice rushes sounds it doesn't know, so it is slowed */
  heart:{kind:'kokoro', label:'wonder +', about:'lifelike, slow · American woman', model:KMODEL, style:KOKORO+'voices/af_heart.bin', pitch:205, mb:92},
  michael:{kind:'kokoro', label:'resolve +', about:'lifelike, slow · American man', model:KMODEL, style:KOKORO+'voices/am_michael.bin', pitch:115, mb:92},
  alpha:{kind:'kokoro', label:'reverie +', about:'lifelike, slow · Japanese woman', model:KMODEL, style:KOKORO+'voices/jf_alpha.bin', pitch:230, mb:92},
  yunjian:{kind:'kokoro', label:'valour +', about:'lifelike, slow · Mandarin man', model:KMODEL, style:KOKORO+'voices/zm_yunjian.bin', pitch:120, mb:92},
  hindi:{kind:'kokoro', label:'devotion +', about:'lifelike, slow · Hindi woman', model:KMODEL, style:KOKORO+'voices/hf_alpha.bin', pitch:210, mb:92},
  nicola:{kind:'kokoro', label:'longing +', about:'lifelike, slow · Italian man', model:KMODEL, style:KOKORO+'voices/im_nicola.bin', pitch:120, mb:92},
};
const modelUrl=v=>v.kind==='kokoro' ? v.model : v.url+'.onnx';
// Kokoro's sound set lacks three of Xenoglot's: g is written ɡ there; ɬ and the click get their nearest neighbours
const KOKORO_SUB={g:'ɡ', 'ɬ':'ʃ', 'ǀ':'t'};
const VOICE_CACHE='xenoglot-voices-v1';
const inArtifact=()=>!!(window.claude && window.claude.use);
// threads need cross-origin isolation (SharedArrayBuffer), which GitHub Pages doesn't provide, so this is 1 there.
// Measured with isolation on: Kokoro only gets about 20% faster, so no service worker is used to force it.
const THREADS = self.crossOriginIsolated ? Math.max(1, Math.min(4, (navigator.hardwareConcurrency||2)-1)) : 1;
let ortPromise=null; const piper={}, sessions={};
function loadOrt(){ return ortPromise ??= new Promise((res,rej)=>{ if(window.ort) return res(window.ort);
  const s=document.createElement('script'); s.src='vendor/ort/ort.wasm.min.js';
  // proxy: inference runs in a web worker, so the page stays responsive while a voice speaks
  s.onload=()=>{ ort.env.wasm.wasmPaths=new URL('vendor/ort/',location.href).href; ort.env.wasm.numThreads=THREADS; ort.env.wasm.proxy=true; res(ort); };
  s.onerror=()=>{ ortPromise=null; rej(new Error('The voice engine didn’t load.')); }; document.head.appendChild(s); }); }
async function fetchCached(url,onProgress){
  let cache=null; try{ cache=await caches.open(VOICE_CACHE); const hit=await cache.match(url); if(hit){ onProgress&&onProgress(1,1); return await hit.arrayBuffer(); } }catch(e){}
  const r=await fetch(url); if(!r.ok) throw new Error('The voice download failed ('+r.status+'). Check your connection and try again.');
  const total=+r.headers.get('content-length')||0, reader=r.body.getReader(), parts=[]; let got=0;
  for(;;){ const {done,value}=await reader.read(); if(done) break; parts.push(value); got+=value.length; onProgress&&onProgress(got,total); }
  const blob=new Blob(parts); try{ cache&&await cache.put(url,new Response(blob)); }catch(e){} return await blob.arrayBuffer(); }
function naturalStatus(msg){ const el=$('#engineStatus'); if(el) el.textContent=msg; }
async function piperVoice(id){
  if(piper[id]) return piper[id];
  if(inArtifact()) throw new Error('The natural voice needs the hosted site (xenoglot.jas.black). Using the built-in voice here.');
  return piper[id]=(async()=>{ try{
    const v=NATURAL[id]; naturalStatus('loading the voice engine…'); const O=await loadOrt();
    const progress=(g,t)=>naturalStatus(t>1?`downloading ${v.label}: ${(g/1e6).toFixed(0)} / ${(t/1e6).toFixed(0)} MB (once, then it works offline)`:'loading the voice…');
    let cfg, style=null;
    if(v.kind==='kokoro'){
      const tok=JSON.parse(new TextDecoder().decode(await fetchCached(KOKORO+'tokenizer.json')));
      cfg={vocab:tok.model.vocab, audio:{sample_rate:24000}};
      style=new Float32Array(await fetchCached(v.style));
    } else cfg=JSON.parse(new TextDecoder().decode(await fetchCached(v.url+'.onnx.json')));
    // both Kokoro voices share one model, so its session is shared too
    const key=modelUrl(v); sessions[key] ??= (async()=>{ const model=await fetchCached(key,progress); naturalStatus('starting the voice…'); return O.InferenceSession.create(model,{executionProviders:['wasm']}); })();
    let sess; try{ sess=await sessions[key]; }catch(e){ delete sessions[key]; throw e; }
    naturalStatus(`${v.label} ready`); voiceReady[id]=true; setTimeout(updateEst); return {sess,cfg,O,style,kind:v.kind};
  }catch(e){ delete piper[id]; naturalStatus(''); throw e; } })(); }
// a word in IPA for the neural voices: the stress mark goes where this language's accent puts it, and long vowels get a length mark
function wordIpa(w){ const keys=toKeys(w); if(!keys.length) return ''; const si=sylInfo(keys,acc(),w); let at=-1, out='';
  if(si.stressAt>=0){ at=si.stressAt; while(at>0 && !isV(keys[at-1])) at--; if(at>0 && si.stressAt-at>1) at++; }   /* of two consonants between vowels, the first closes the syllable before */
  keys.forEach((k,i)=>{ if(i===at) out+='ˈ'; out+=PM[k].ipa; const j=si.vs.indexOf(i); if(j>=0 && si.long[j]) out+='ː'; }); return out; }
// phrases of IPA, punctuation kept for phrasing
function ipaPhrases(words){ const out=[]; let cur=[], ws=[];
  words.forEach(w=>{ const ipa=wordIpa(w.al); if(ipa){ cur.push(ipa); ws.push({al:w.al,en:w.en}); }
    if(w.end){ if(cur.length) out.push({ipa:cur.join(' ')+(w.end===','?',':w.end==='?'?'?':'.'), end:w.end, words:ws}); cur=[]; ws=[]; } });
  if(cur.length) out.push({ipa:cur.join(' ')+'.', end:'.', words:ws}); return out; }
// A neural voice brings its own tune. The language's melody is laid over it as a gentle pitch bend across each phrase (cents).
function melodyCurve(dur, end, seed){ const A=acc(), R=Math.min(A.range,1.7), n=Math.max(8,Math.min(64,Math.round(dur*10))), c=new Float32Array(n), r=rngFrom(hash('mel|'+seed)); let lvl=0, hold=0;
  if(A.melody==='flat') return null;
  for(let i=0;i<n;i++){ const u=i/(n-1);
    c[i] = A.melody==='fall' ? (55-120*u)*R : A.melody==='rise' ? (-60+130*u)*R : A.melody==='step' ? (70-45*Math.floor(u*4))*R : A.melody==='wave' ? 85*R*Math.sin(u*dur*6.5) : 0;
    if(A.melody==='tone'){ if(hold--<=0){ lvl=(r()<.5?-1:1)*(70+r()*50)*R; hold=1+Math.floor(r()*2); } c[i]=lvl; }
    if(end==='?' && A.qRise && u>.75) c[i]+=260*(u-.75)*4*.6; }
  return c; }
// The neural voices don't report when each sound happens, so the head's lip-sync for them is worked out:
// the synthesizer's own timing for the same words, stretched over the clip. Loudness gating does the rest.
function spreadSegs(words, t0, dur){ const s0=wordsToSegs(words.map(w=>({al:w.al,en:w.en})),{...DEFAULT.voice,...L.voice,speed:1},0).segs.filter(s=>s.k||s.d<.2);
  while(s0.length && !s0[s0.length-1].k) s0.pop(); if(!s0.length) return [];
  const end=s0[s0.length-1].t+s0[s0.length-1].d, k=dur/(end||1); return s0.map(s=>({...s,t:t0+s.t*k,d:s.d*k})); }
function phonemeIds(ipa,cfg){ const m=cfg.phoneme_id_map, pad=m['_']; const ids=[...m['^'],...pad];
  for(const ch of [...ipa]){ const id=m[ch]||(ch==='g'?m['ɡ']:null); if(id) ids.push(...id,...pad); } ids.push(...m['$']); return ids; }
// Kokoro: one id per symbol, wrapped in the pad token 0; at most 510 tokens per run
function kokoroIds(ipa,cfg){ const v=cfg.vocab, ids=[0];
  for(const ch of [...ipa].slice(0,508)){ const c=KOKORO_SUB[ch]||ch; if(v[c]!=null) ids.push(v[c]); } ids.push(0); return ids; }
// long phrases are split at word boundaries: Kokoro takes at most 510 symbols, and shorter runs keep both voices quick
function splitIpa(ipa, max=170){ if([...ipa].length<=max) return [ipa]; const out=[]; let cur='';
  for(const w of ipa.split(' ')){ if(cur && [...cur].length+[...w].length+1>max){ out.push(cur); cur=w; } else cur=cur?cur+' '+w:w; }
  if(cur) out.push(cur); return out; }
// pitch and throat size both move a natural voice by resampling, so its speed is compensated through length_scale
const voiceRate=(voice,v)=>Math.min(2,Math.max(.5, Math.pow(voice.pitch/v.pitch,.6)*Math.pow(voice.formant,.8)));
// one run of the voice model: IPA in, raw samples out (before the pitch/throat resample)
async function naturalRun(V, ipa, lengthScale, voice){ const {sess,cfg,O,style,kind}=V, parts=[];
  lengthScale=Math.min(2.5,Math.max(.4,lengthScale));
  // noise_w varies Piper's timing at random; when fitting a length it's held low so a correction pass lands
  const noise=.35+voice.jitter*.6, noiseW=voice.fitting ? .1 : .4+voice.jitter*.8;
  for(const piece of splitIpa(ipa)){ let feeds;
    if(kind==='kokoro'){ const ids=kokoroIds(piece,cfg); if(ids.length<3) continue;
      // the style vector depends on the phrase length; Kokoro is deterministic, and its speed is the inverse of length_scale
      const at=Math.min(Math.max(ids.length-2,0),509)*256;
      feeds={ input_ids:new O.Tensor('int64',BigInt64Array.from(ids.map(BigInt)),[1,ids.length]),
        style:new O.Tensor('float32',style.slice(at,at+256),[1,256]),
        speed:new O.Tensor('float32',Float32Array.from([1/lengthScale]),[1]) };
    } else { const ids=phonemeIds(piece,cfg); if(ids.length<4) continue;
      feeds={ input:new O.Tensor('int64',BigInt64Array.from(ids.map(BigInt)),[1,ids.length]),
        input_lengths:new O.Tensor('int64',BigInt64Array.from([BigInt(ids.length)]),[1]),
        scales:new O.Tensor('float32',Float32Array.from([noise,lengthScale,noiseW]),[3]) }; }
    const res=await sess.run(feeds); parts.push(res[sess.outputNames[0]].data); }
  if(parts.length===1) return parts[0];
  const n=parts.reduce((a,c)=>a+c.length,0), raw=new Float32Array(n); let o=0; for(const c of parts){ raw.set(c,o); o+=c.length; } return raw; }
async function speakNatural(words, voice){
  voice={...DEFAULT.voice,...voice}; const V=await piperVoice(L.engine), v=NATURAL[L.engine], sr=V.cfg.audio.sample_rate;
  const rate=voiceRate(voice,v), lengthScale=Math.min(2.5,Math.max(.4, rate/(voice.speed*acc().tempo)*(v.len||1)));
  const clips=[], segs=[]; let t=0;
  for(const ph of ipaPhrases(words)){ const raw=await naturalRun(V, ph.ipa, lengthScale, voice); if(!raw.length) continue;
    const d=raw.length/sr/rate; clips.push({raw,t,curve:voice.fitting?null:melodyCurve(d,ph.end,ph.ipa)}); segs.push(...spreadSegs(ph.words,t+.03,d-.08)); t+=d+(ph.end===','?.12:.3)*lengthScale/rate; }
  if(!clips.length) throw new Error('Nothing to say yet. Type some English first.');
  const b=await naturalFx(clips, sr, voice, rate, t); b.timeline={segs}; return b;
}
// clips placed on a timeline, then the same alien effects as the built-in voice: warble, many voices, metallic, space
async function naturalFx(clips, srIn, voice, rate, dur, extra={}){
  const sr=44100, tail=voice.space>0?.2+voice.space*1.6:0;
  const ctx=new OfflineAudioContext(1, Math.ceil(sr*(dur+tail+.1)), sr);
  const mix=ctx.createGain(), out=ctx.createGain(); out.connect(ctx.destination);
  const lfo=ctx.createOscillator(); lfo.frequency.value=4.6+voice.vib*2; lfo.start(0);
  for(const c of clips){ const buf=ctx.createBuffer(1, c.raw.length, srIn); buf.copyToChannel(c.raw,0);
    const voiceSrc=(cents,gain,delay)=>{ const s=ctx.createBufferSource(); s.buffer=buf; s.playbackRate.value=rate*(c.squeeze||1); s.detune.value=cents;
      if(c.curve){ try{ s.detune.setValueCurveAtTime(c.curve.map(x=>x+cents), c.t+delay, Math.max(.05,c.raw.length/srIn/rate-.02)); }catch(e){} }
      const lg=ctx.createGain(); lg.gain.value=voice.vib*45; lfo.connect(lg).connect(s.detune); const g=ctx.createGain(); g.gain.value=gain; s.connect(g).connect(mix); s.start(c.t+delay); };
    voiceSrc(0,1,0);
    if(voice.choir>0){ voiceSrc(6+voice.choir*6, voice.choir*.7, .012); voiceSrc(-(7+voice.choir*6), voice.choir*.7, .021); } }
  // growl: the voice is shaken at half its pitch, like a second, rougher set of vocal folds
  let src=mix; if(voice.growl>0){ const gm=ctx.createGain(); gm.gain.value=1-voice.growl*.4; const go=ctx.createOscillator(); go.type='sawtooth'; go.frequency.value=Math.max(24,voice.pitch*.5); const gd=ctx.createGain(); gd.gain.value=voice.growl*.4; go.connect(gd).connect(gm.gain); go.start(0); mix.connect(gm); src=gm; }
  // breath: air on the voice. It follows the voice's own loudness (10 ms steps), so pauses and the silence around a phrase stay
  // silent; before 2.6.3 it was held at one level under each whole phrase, which sounded like a bed of white noise
  if(voice.breath>.05){ const nb=ctx.createBuffer(1,sr,sr), nd=nb.getChannelData(0); for(let i=0;i<sr;i++) nd[i]=Math.random()*2-1; const ns=ctx.createBufferSource(); ns.buffer=nb; ns.loop=true;
    const bp=ctx.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=2600*voice.formant; bp.Q.value=.9; const lp=ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=7000; const ng=ctx.createGain(); ng.gain.value=0;
    for(const c of clips){ const step=Math.round(srIn*.01), n=Math.floor(c.raw.length/step); if(n<2) continue; const env=new Float32Array(n); let top=1e-6;
      for(let i=0;i<n;i++){ let q=0; for(let j=i*step;j<(i+1)*step;j++) q+=c.raw[j]*c.raw[j]; env[i]=Math.sqrt(q/step); }
      const sorted=Float32Array.from(env).sort(); top=sorted[Math.floor(n*.95)]||1e-6;
      for(let i=0;i<n;i++){ const v=Math.min(1,env[i]/top); env[i]=voice.breath*.05*(v<.08?0:v); }   // nothing under the quiet parts
      try{ ng.gain.setValueCurveAtTime(env, c.t, c.raw.length/srIn/(rate*(c.squeeze||1))); }catch(e){} }
    ns.connect(bp).connect(lp).connect(ng).connect(out); ns.start(0); }
  const dry=ctx.createGain(); dry.gain.value=1-voice.ring*.85; src.connect(dry).connect(out);
  if(voice.ring>0){ const ring=ctx.createGain(); ring.gain.value=0; const ro=ctx.createOscillator(); ro.frequency.value=40+voice.formant*35; ro.connect(ring.gain); ro.start(0);
    const wet=ctx.createGain(); wet.gain.value=voice.ring*1.5; src.connect(ring).connect(wet).connect(out); }
  if(voice.space>0){ const len=Math.ceil(sr*(.25+voice.space*1.5)), ir=ctx.createBuffer(1,len,sr), d=ir.getChannelData(0); let lp=0;
    for(let i=0;i<len;i++){ lp=lp*.6+(Math.random()*2-1)*.4; d[i]=lp*Math.pow(1-i/len,2.2+(1-voice.space)*2); }
    const cv=ctx.createConvolver(); cv.buffer=ir; const wg=ctx.createGain(); wg.gain.value=voice.space*.55; out.connect(cv).connect(wg).connect(ctx.destination); }
  const b=await ctx.startRendering(); normalise(b.getChannelData(0));
  if(extra.under){ // the original track underneath, added after levelling so it doesn't change the voice's loudness
    const d=b.getChannelData(0), u=extra.under, x=new Float32Array(u.length); for(let c=0;c<u.numberOfChannels;c++){ const ch=u.getChannelData(c); for(let i=0;i<x.length;i++) x[i]+=ch[i]/u.numberOfChannels; }
    const k=u.sampleRate/sr; for(let i=0;i<d.length;i++){ const j=Math.floor(i*k); if(j>=x.length) break; d[i]=Math.max(-1,Math.min(1,d[i]+x[j]*extra.underVol)); } }
  return b;
}
async function speakWords(words, speedMul=1, fitting=false){
  const voice={...L.voice, speed:L.voice.speed*speedMul, fitting};
  if(L.engine && NATURAL[L.engine]){
    if(Object.keys(recs).length && !speakWords.warned){ speakWords.warned=true; toast('Recorded voices don’t use your own recordings. Pick origin to hear them.'); }
    const led=$('#ledVoice'); led&&led.classList.add('on');
    try{ return await speakNatural(words, voice); }
    catch(e){ toast(e.message||'The natural voice failed, so the built-in voice is speaking.'); }
    finally{ if(led&&!playing) led.classList.remove('on'); }
  }
  const {segs,dur}=wordsToSegs(words, voice), b=await render(segs,dur,voice); b.timeline={segs}; return b;
}


/* ---------- playback, waveform, export ---------- */
let playing=null;
// the speaking head on the monitor (head.js); every language has its own, grown from L.head
// the head's subtitles are written in the language's own script: one Path2D per letter, cached until the alphabet changes
const scriptPaths=new Map();
const headScript={ width:(word,h)=>toKeys(word).length*100*h/128,
  draw(ctx,word,x,y,h){ const s=h/128; toKeys(word).forEach((k,i)=>{ const key=k+'|'+gver; let p=scriptPaths.get(key); if(!p){ if(scriptPaths.size>400) scriptPaths.clear(); p=new Path2D(glyphD(k)); scriptPaths.set(key,p); }
    ctx.save(); ctx.translate(x+(i*100+10)*s, y+14*s); ctx.scale(s,s); ctx.fill(p); ctx.restore(); }); } };
const signature=new Image(); signature.src='jasblack.webp';   // the JAS.BLACK wordmark, drawn on the monitor as a signature
const head = window.XenoHead && $('#headCanvas') ? XenoHead.create($('#headCanvas'), {sounds:PM, script:headScript, signature}) : null;
let headSeed=null;
function speakKey(on){ const k=$('#tSpeak'); if(!k) return; k.innerHTML=on?'&#x25A0; stop':'&#x25B6; speak'; k.classList.toggle('playing',on); }
function applyHead(){ if(!head) return; if(headSeed!==L.head){ headSeed=L.head; head.setSeed(L.head>>>0); $('#headCanvas').dataset.seed=String(L.head>>>0); } head.setInfo({name:L.name||''}); }
function stopAudio(){ if(head) head.stop(); $('#ledVoice').classList.remove('on'); speakKey(false); if(playing){ try{ playing.src.stop(); }catch(e){} cancelAnimationFrame(playing.raf); const p=playing; playing=null; p.done&&p.done(); } }
let speechMute=false;
function play(buf, canvas, alsoTo, onEnd){
  setTimeout(()=>{ $('#ledVoice').classList.add('on'); speakKey(true); });
  stopAudio(); const ctx=getCtx(); const src=ctx.createBufferSource(); src.buffer=buf;
  const mute=speechMute; speechMute=false;   // with your video's own sound chosen, the speech plays silently: it only times the subtitles
  if(mute){ const z=ctx.createGain(); z.gain.value=0; src.connect(z).connect(ctx.destination); } else { src.connect(ctx.destination); if(alsoTo) src.connect(alsoTo); }
  const t0=ctx.currentTime; src.start();
  if(head) head.speak({buf, timeline:buf.timeline, clock:()=>ctx.currentTime-t0});
  const st={src, raf:0, done:()=>{ canvas&&drawWave(canvas,buf,-1); onEnd&&onEnd(); }}; playing=st;
  src.onended=()=>{ if(playing===st) stopAudio(); };
  if (canvas){ const tick=()=>{ if(playing!==st) return; drawWave(canvas,buf,(ctx.currentTime-t0)/buf.duration); st.raf=requestAnimationFrame(tick); }; tick(); }
}
function drawWave(cv, buf, pos){
  if(cv.id==='waveT') cv.closest('.well').classList.toggle('empty',!buf);   // with no speech yet, the panel says what it is for instead of sitting black
  const g=cv.getContext('2d'); const W=cv.width=(cv.clientWidth||600)*devicePixelRatio, H=cv.height=(cv.clientHeight||54)*devicePixelRatio;
  const cs=getComputedStyle(document.body); g.clearRect(0,0,W,H);
  if(!buf) return;
  const d=buf.getChannelData(0), step=Math.max(1,Math.floor(d.length/W));
  g.fillStyle='#39ff88';
  for(let x=0;x<W;x++){ let mn=0,mx=0; for(let i=x*step;i<(x+1)*step&&i<d.length;i++){ const v=d[i]; if(v<mn)mn=v; if(v>mx)mx=v; } g.globalAlpha = pos>=0 && x/W>pos ? .35 : 1; g.fillRect(x,H/2-mx*H/2,1,Math.max(1,(mx-mn)*H/2)); }
  g.globalAlpha=1;
  if(pos>=0){ g.fillStyle='#b36bff'; g.fillRect(pos*W,0,2*devicePixelRatio,H); }
}
let dl=null; try{ window.claude?.use?.('downloads').then(d=>{ dl=d; }).catch(()=>{}); }catch(e){}
async function saveFile(filename, data){
  if(!dl){ // opened as a local file or on another site: a normal browser download works there
    try{ const blob = data instanceof Blob ? data : new Blob([data]); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },4000); toast('Saved '+filename); return true; }
    catch(e){ toast('Saving files isn’t available in this view.'); return false; } }
  try{ await dl.save({filename, data}); toast('Saved '+filename); return true; }
  catch(e){ toast(e && e.code==='declined' ? 'Download cancelled' : 'Couldn’t save: '+(e && (e.message||e.code))); return false; }
}
async function exportAudio(buf, base, statusEl){
  // On the hosted site: an instant, lossless .wav. Inside a claude.ai artifact .wav isn't on the
  // download allowlist, so it records a .webm/.mp4 in real time instead.
  if(!(window.claude && window.claude.use)){
    stopAudio(); statusEl.textContent=`saving ${buf.duration.toFixed(1)} s as .wav…`;
    await saveFile(`${base}.wav`, new Blob([wavBytes(buf.getChannelData(0), buf.sampleRate)],{type:'audio/wav'}));
    statusEl.textContent=''; return;
  }
  const types=[['audio/webm;codecs=opus','webm'],['audio/webm','webm'],['audio/mp4','mp4']];
  const ty = window.MediaRecorder ? types.find(t=>MediaRecorder.isTypeSupported(t[0])) : null;
  if(!ty){ toast('This browser can’t encode audio files.'); return; }
  stopAudio(); const ctx=getCtx(); const dest=ctx.createMediaStreamDestination(); const src=ctx.createBufferSource(); src.buffer=buf; src.connect(dest);
  const rec=new MediaRecorder(dest.stream,{mimeType:ty[0]}); const chunks=[];
  rec.ondataavailable=e=>e.data.size&&chunks.push(e.data);
  const done=new Promise(res=>rec.onstop=res);
  statusEl.textContent=`Encoding ${buf.duration.toFixed(1)} s of audio…`;
  rec.start(); src.start(); src.onended=()=>setTimeout(()=>rec.stop(),150);
  await done; statusEl.textContent='';
  await saveFile(`${base}.${ty[1]}`, new Blob(chunks,{type:ty[0]}));
}
// .mp3 for sharing: plays inline in WhatsApp, messages and on any phone, which .wav doesn't.
// lamejs (LGPL-3.0, vendored as a separate file) loads only when it's first needed.
let lamePromise=null;
function loadLame(){ return lamePromise ??= new Promise((res,rej)=>{ if(window.lamejs) return res(window.lamejs);
  const s=document.createElement('script'); s.src='vendor/lame/lame.min.js'; s.onload=()=>res(window.lamejs);
  s.onerror=()=>{ lamePromise=null; rej(new Error('The mp3 encoder didn’t load. Check your connection and try again.')); }; document.head.appendChild(s); }); }
async function mp3Blob(buf){ const lame=await loadLame();
  const okRates=[48000,44100,32000,24000,22050,16000], sr=okRates.includes(buf.sampleRate)?buf.sampleRate:44100;
  let d=buf.getChannelData(0);
  if(sr!==buf.sampleRate){ const ratio=buf.sampleRate/sr, n=Math.floor(d.length/ratio), o=new Float32Array(n); for(let i=0;i<n;i++){ const x=i*ratio, j=Math.floor(x), f=x-j; o[i]=(d[j]||0)*(1-f)+(d[j+1]||0)*f; } d=o; }
  const pcm=new Int16Array(d.length); for(let i=0;i<d.length;i++){ const v=Math.max(-1,Math.min(1,d[i])); pcm[i]=v<0?v*32768:v*32767; }
  const enc=new lame.Mp3Encoder(1, sr, 128), parts=[];
  for(let i=0;i<pcm.length;i+=1152){ const out=enc.encodeBuffer(pcm.subarray(i,i+1152)); if(out.length) parts.push(new Uint8Array(out)); if(i%(1152*400)===0) await new Promise(r=>setTimeout(r)); }
  const end=enc.flush(); if(end.length) parts.push(new Uint8Array(end));
  return new Blob(parts,{type:'audio/mpeg'}); }
async function exportMp3(buf, base, statusEl){ stopAudio(); statusEl.textContent=`saving ${buf.duration.toFixed(1)} s as .mp3…`;
  try{ const blob=await mp3Blob(buf); statusEl.textContent=''; await saveFile(`${base}.mp3`, blob); }
  catch(e){ statusEl.textContent=''; toast(e.message||'The mp3 couldn’t be made. Save the .wav instead.'); } }
// on phones: hand the .mp3 straight to the share sheet (WhatsApp, messages…). The encoded file is kept, so a
// second tap shares at once if the first took too long for the browser to still count it as a tap.
const canShareFiles=(()=>{ try{ return !!navigator.canShare && navigator.canShare({files:[new File([new Uint8Array(4)],'a.mp3',{type:'audio/mpeg'})]}); }catch(e){ return false; } })();
let shareKeep={buf:null,file:null};
async function shareAudio(buf, base, statusEl){ stopAudio();
  try{ if(shareKeep.buf!==buf){ statusEl.textContent='getting it ready to share…'; shareKeep={buf, file:new File([await mp3Blob(buf)], base+'.mp3', {type:'audio/mpeg'})}; statusEl.textContent=''; }
    await navigator.share({files:[shareKeep.file], title:L.name+' (Xenoglot)'}); }
  catch(e){ statusEl.textContent=''; if(e&&e.name==='AbortError') return; toast(e&&e.name==='NotAllowedError' ? 'Ready. Tap share again to send it.' : 'Sharing didn’t work here. Use save .mp3 instead.'); } }
const slug = s => (s||'language').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'language';

/* ---------- recordings ---------- */
const b64enc = ab => { let s=''; const u=new Uint8Array(ab); for(let i=0;i<u.length;i+=0x8000) s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000)); return btoa(s); };
const b64dec = b => { const s=atob(b); const u=new Uint8Array(s.length); for(let i=0;i<s.length;i++) u[i]=s.charCodeAt(i); return u.buffer; };
async function decodeClip(ab){
  const ctx=getCtx(); const b=await ctx.decodeAudioData(ab.slice(0));
  const d=b.getChannelData(0); let mx=0; for(const v of d) mx=Math.max(mx,Math.abs(v)); const th=mx*.08;
  let s=0,e=d.length-1; while(s<e&&Math.abs(d[s])<th) s++; while(e>s&&Math.abs(d[e])<th) e--;
  s=Math.max(0,s-Math.round(b.sampleRate*.01)); e=Math.min(d.length,Math.min(e+Math.round(b.sampleRate*.02), s+Math.round(b.sampleRate*.8)));
  const o=ctx.createBuffer(1,Math.max(1,e-s),b.sampleRate); const od=o.getChannelData(0); for(let i=0;i<od.length;i++) od[i]=d[s+i]/(mx||1)*.9;
  return o;
}
async function setRec(k, ab){ try{ const buf=await decodeClip(ab); recs[k]={buf,b64:b64enc(ab)}; saveRecs(); renderPalette(); toast(`Your recording now voices “${k}”`); }catch(e){ toast('That file couldn’t be read as audio. Try wav, mp3 or m4a.'); } }
function saveRecs(){ const o={}; for(const k in recs) o[k]=recs[k].b64; const key='xenoglot-v1-recs-'+(L.id||'none');
  if(!Object.keys(o).length){ try{ localStorage.removeItem(key); }catch(e){} return; }
  if(!store.set(key,JSON.stringify(o))) toast('Your recordings are too large to keep in this browser. Save the language as a file to keep them.'); }
async function loadRecs(obj){ recs={}; for(const k in obj||{}){ try{ recs[k]={buf:await decodeClip(b64dec(obj[k])), b64:obj[k]}; }catch(e){} } }

/* ---------- glyphs ---------- */
const STYLES={angular:'Angular grid',round:'Flowing curves',runic:'Runic stems',dotted:'Dotted',circuit:'Circuit board',tendril:'Tendrils',orbital:'Orbits',shard:'Shards',hanging:'Hanging from a line',insect:'Insect bodies',knot:'Knots',glitch:'Glitch blocks',bloom:'Spirals',constellation:'Constellations',cuneiform:'Wedges',ogham:'Notched spine',rings:'Broken rings',braille:'Dot matrix',seismic:'Seismograph',petals:'Petals',crescent:'Crescents',fork:'Branching',mixed:'Chaos: every letter its own style'};
const SKEYS=Object.keys(STYLES).filter(k=>k!=='mixed');
function chaikin(pts,it=3){ for(let n=0;n<it;n++){ const o=[pts[0]]; for(let i=0;i<pts.length-1;i++){ const [a,b]=[pts[i],pts[i+1]]; o.push([a[0]*.75+b[0]*.25,a[1]*.75+b[1]*.25],[a[0]*.25+b[0]*.75,a[1]*.25+b[1]*.75]); } o.push(pts[pts.length-1]); pts=o; } return pts; }
function bow(a,b,amt){ const mx=(a[0]+b[0])/2, my=(a[1]+b[1])/2, dx=b[0]-a[0], dy=b[1]-a[1], l=Math.hypot(dx,dy)||1; const c=[mx-dy/l*amt, my+dx/l*amt]; const o=[]; for(let i=0;i<=10;i++){ const t=i/10; o.push([(1-t)*(1-t)*a[0]+2*(1-t)*t*c[0]+t*t*b[0],(1-t)*(1-t)*a[1]+2*(1-t)*t*c[1]+t*t*b[1]]); } return o; }
const arc=(cx,cy,rx,ry,a0,sweep,n=28)=>{ const o=[]; for(let i=0;i<=n;i++){ const a=a0+sweep*i/n; o.push([cx+Math.cos(a)*rx,cy+Math.sin(a)*ry]); } return o; };
// an alphabet's "DNA": shared traits that make its letters look related, different for every seed
function makeDNA(seed){ const r=rngFrom(seed^0x9e3779b9); return { gx:3+Math.floor(r()*3), gy:3+Math.floor(r()*3), sMin:1+Math.floor(r()*2), sExtra:1+Math.floor(r()*2), lenMax:3+Math.floor(r()*3), curl:.4+r()*1.6, aspect:.72+r()*.4, wave:r()*Math.PI*2, ortho:r()<.35, loops:r(), legs:2+Math.floor(r()*4), bar:6+r()*14 }; }
function gridPts(D){ return { xs:[...Array(D.gx)].map((_,i)=>10+i*80/(D.gx-1)), ys:[...Array(D.gy)].map((_,i)=>8+i*84/(D.gy-1)) }; }
function walk(r,D,len,ortho){ const {xs,ys}=gridPts(D); let cur=[Math.floor(r()*D.gx),Math.floor(r()*D.gy)]; const pts=[cur];
  for(let i=1;i<len;i++){ const opts=[]; for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){ if(!(dx||dy)||(ortho&&dx&&dy)) continue; const nx=cur[0]+dx,ny=cur[1]+dy; if(nx>=0&&nx<D.gx&&ny>=0&&ny<D.gy&&!pts.some(p=>p[0]===nx&&p[1]===ny)) opts.push([nx,ny]); }
    if(!opts.length) break; cur=pick(r,opts); pts.push(cur); }
  return pts.map(([i,j])=>[xs[i],ys[j]]); }
const GEN={
  angular(r,D,w){ const n=D.sMin+Math.floor(r()*(D.sExtra+1+w*2)); return [...Array(n)].map(()=>walk(r,D,2+Math.floor(r()*(D.lenMax-1)),D.ortho)); },
  round(r,D,w){ return GEN.angular(r,D,w).map(s=> s.length>2 ? chaikin(s) : bow(s[0],s[1],(r()<.5?-1:1)*(8+r()*16))); },
  runic(r,D,w){ const {ys}=gridPts(D); const x=pick(r,[30,50,50,70]); const S=[[[x,6],[x,94]]]; const nb=1+Math.floor(r()*(2+w*2));
    for(let i=0;i<nb;i++){ const y=pick(r,ys), side=r()<.5?8:92, y2=y+(r()-.5)*60*(r()<.7?1:0); S.push([[x,y],[side,Math.max(6,Math.min(94,y2))]]); if(r()<.25+w*.3) S[S.length-1].push([side+(side<50?12:-12),Math.max(6,Math.min(94,y2+18))]); } return S; },
  dotted(r,D,w){ const S=GEN.angular(r,{...D,sExtra:Math.max(1,D.sExtra-1)},w); const {xs,ys}=gridPts(D); const nd=1+Math.floor(r()*(2+w*3)); for(let i=0;i<nd;i++) S.push([[pick(r,xs)+(r()-.5)*12,pick(r,ys)+(r()-.5)*12]]); return S; },
  circuit(r,D,w){ const n=1+Math.floor(r()*(2+w*2)); const S=[]; for(let i=0;i<n;i++){ const s=walk(r,{...D,gx:Math.max(4,D.gx),gy:Math.max(4,D.gy)},3+Math.floor(r()*3),true); S.push(s); S.push([s[s.length-1]]); if(r()<.5) S.push([s[0]]); } return S; },
  tendril(r,D,w){ const S=[]; const n=1+Math.floor(r()*(1.4+w*2));
    for(let s=0;s<n;s++){ let x=20+r()*60,y=12+r()*76,h=r()*Math.PI*2,k=(r()-.5)*.3*D.curl; const pts=[[x,y]]; const steps=10+Math.floor(r()*(16+w*24));
      for(let i=0;i<steps;i++){ k+=(r()-.5)*.09*(1+w*2); if(i>steps*.55) k*=1.07+D.curl*.03; k=Math.max(-.9,Math.min(.9,k)); h+=k; x+=Math.cos(h)*4.2; y+=Math.sin(h)*4.2;
        if(x<6||x>94){ h=Math.PI-h; x=Math.max(6,Math.min(94,x)); } if(y<6||y>94){ h=-h; y=Math.max(6,Math.min(94,y)); } pts.push([x,y]); }
      S.push(pts); if(r()<.3) S.push([[x+Math.cos(h)*8,y+Math.sin(h)*8]]); } return S; },
  orbital(r,D,w){ const S=[]; const n=1+Math.floor(r()*(2+w*1.5)); const cx=50+(r()-.5)*20, cy=50+(r()-.5)*20;
    for(let i=0;i<n;i++){ const rad=12+r()*30, a0=r()*Math.PI*2, sw=(.35+r()*(.6+w*.4))*Math.PI*2*(r()<.5?1:-1); S.push(arc(cx+(r()-.5)*w*30,cy+(r()-.5)*w*30,rad,rad*(D.aspect+r()*.3),a0,sw));
      if(r()<.6){ const a=a0+sw; S.push([[cx+Math.cos(a)*(rad+9),cy+Math.sin(a)*(rad+9)]]); } }
    if(r()<.4){ const a=r()*Math.PI*2; S.push([[cx,cy],[cx+Math.cos(a)*44,cy+Math.sin(a)*44]]); } return S; },
  shard(r,D,w){ const S=[]; const n=1+Math.floor(r()*(1.5+w*2)); for(let i=0;i<n;i++){ const m=3+Math.floor(r()*(3+w*3)); let x=10+r()*80,y=8+r()*20; const pts=[[x,y]]; for(let j=1;j<m;j++){ x=10+r()*80; y=Math.min(94,y+8+r()*(84/m)*1.6); pts.push([x,y]); } S.push(pts); }
    if(r()<.5){ const x=15+r()*70,y=15+r()*70; S.push([[x,y],[x+(r()-.5)*24,y+16]]); } return S; },
  hanging(r,D,w){ const top=D.bar; const S=[[[-6,top],[106,top]]]; const n=1+Math.floor(r()*(2+w*1.5));
    for(let i=0;i<n;i++){ const x=14+r()*70, bot=40+r()*52, kind=Math.floor(r()*4);
      if(kind===0) S.push([[x,top],[x,bot]]);
      else if(kind===1) S.push([[x,top],[x,bot],...bow([x,bot],[x+(r()<.5?-1:1)*20,bot-10],12).slice(1)]);
      else if(kind===2){ S.push([[x,top],[x,bot-14]]); S.push(arc(x,bot-6,9,9,-Math.PI/2,Math.PI*2)); }
      else S.push(bow([x,top],[Math.max(6,Math.min(94,x+(r()-.5)*50)),bot],(r()-.5)*40)); }
    if(r()<.35) S.push([[20+r()*60,top-12]]); return S; },
  insect(r,D,w){ const cx=50+(r()-.5)*10, cy=38+r()*24, rx=7+r()*10, ry=9+r()*14; const S=[arc(cx,cy,rx*D.aspect,ry,0,Math.PI*2,24)]; const legs=D.legs+Math.floor(r()*(1+w*3));
    for(let i=0;i<legs;i++){ const side=i%2?1:-1, a=(side>0?0:Math.PI)+(r()-.5)*1.8, p0=[cx+Math.cos(a)*rx,cy+Math.sin(a)*ry], kn=[p0[0]+Math.cos(a)*14,p0[1]+Math.sin(a)*14-6], a2=a+side*(.6+r()*.8);
      S.push([p0,kn,[kn[0]+Math.cos(a2)*16,kn[1]+Math.sin(a2)*16]]); }
    if(r()<.5) S.push([[cx-6,cy-ry-10]],[[cx+6,cy-ry-10]]); return S; },
  knot(r,D,w){ let a=1+Math.floor(r()*3), b=1+Math.floor(r()*(3+w*2)); if(a===b) b++; const ph=r()*Math.PI, span=(.55+r()*.45)*Math.PI*2, n=50+b*10; const pts=[];
    for(let i=0;i<=n;i++){ const t=span*i/n; pts.push([50+38*D.aspect*Math.sin(a*t+ph),50+40*Math.sin(b*t)]); }
    const S=[pts]; if(r()<.3+w*.3){ const y=15+r()*70; S.push([[8,y],[92,y]]); } return S; },
  glitch(r,D,w){ const S=[]; const rows=3+Math.floor(r()*(3+w*3)); for(let i=0;i<rows;i++){ if(r()<.25) continue; const y=8+i*84/(rows-1||1); const x0=Math.round(r()*5)*10+8, x1=Math.min(94,x0+10+Math.round(r()*6)*10); S.push([[x0,y],[x1,y]]); if(r()<.2+w*.3) S.push([[x1+8,y]]); }
    if(r()<.6){ const x=8+Math.round(r()*8)*10; S.push([[x,8],[x,8+Math.round(r()*8+2)*8]]); } if(!S.length) S.push([[10,50],[90,50]]); return S; },
  bloom(r,D,w){ const S=[]; const n=1+Math.floor(r()*(1.3+w)); for(let i=0;i<n;i++){ const cx=30+r()*40, cy=30+r()*40, turns=1.2+r()*(1.5+w*2), dir=r()<.5?1:-1, R=18+r()*20, a0=r()*Math.PI*2, m=Math.round(turns*28); const pts=[];
      for(let j=0;j<=m;j++){ const t=j/m, a=a0+dir*t*turns*Math.PI*2, rad=2+R*t; pts.push([cx+Math.cos(a)*rad*D.aspect,cy+Math.sin(a)*rad]); }
      const e=pts[pts.length-1]; if(r()<.6) pts.push([e[0]+(r()-.5)*30,Math.min(94,e[1]+15+r()*20)]); S.push(pts); } return S; },
  // stars joined by lines
  constellation(r,D,w){ const n=3+Math.floor(r()*(3+w*3)), P=[]; for(let i=0;i<n;i++) P.push([10+r()*80,8+r()*84]); const S=P.map(p=>[p]); for(let i=1;i<n;i++) if(r()<.8) S.push([P[i-1],P[i]]); if(n>3&&r()<.4) S.push([P[0],P[n-1]]); return S; },
  // wedges pressed into clay: a stroke with a head
  cuneiform(r,D,w){ const S=[], n=2+Math.floor(r()*(3+w*3)); for(let i=0;i<n;i++){ const x=14+r()*72, y=10+r()*60, a=pick(r,[Math.PI/2,Math.PI/2,0,Math.PI/4,3*Math.PI/4]), L=16+r()*26, c=Math.cos(a), sn=Math.sin(a);
      S.push([[x,y],[Math.max(6,Math.min(94,x+c*L)),Math.max(6,Math.min(94,y+sn*L))]]); S.push([[x-sn*7-c*3,y+c*7-sn*3],[x,y],[x+sn*7-c*3,y-c*7-sn*3]]); } return S; },
  // a spine with groups of notches: left, right or right across
  ogham(r,D,w){ const x=50+(r()-.5)*16, S=[[[x,4],[x,96]]], groups=1+Math.floor(r()*(2+w*2)); for(let g=0;g<groups;g++){ const y0=12+r()*62, n=1+Math.floor(r()*4), side=pick(r,[-1,1,0]), tilt=(r()-.5)*14, len=14+r()*18;
      for(let i=0;i<n;i++){ const y=Math.min(92,y0+i*7); S.push(side ? [[x,y],[x+side*len,y+tilt]] : [[x-len*.7,y-tilt*.5],[x+len*.7,y+tilt*.5]]); } }
    if(r()<.3) S.push([[x+(r()<.5?-18:18),8+r()*84]]); return S; },
  // rings with gaps, and marks riding on them
  rings(r,D,w){ const cx=50, cy=50, S=[], n=1+Math.floor(r()*(2+w*1.5)); let rad=40; for(let i=0;i<n&&rad>8;i++){ const a0=r()*Math.PI*2, gap=(.1+r()*.35)*Math.PI*2; S.push(arc(cx,cy,rad*D.aspect,rad,a0,Math.PI*2-gap,36));
      if(r()<.7){ const a=a0+r()*(Math.PI*2-gap); S.push([[cx+Math.cos(a)*rad*D.aspect,cy+Math.sin(a)*rad]]); } if(r()<.4){ const a=a0-gap/2; S.push([[cx+Math.cos(a)*(rad-9)*D.aspect,cy+Math.sin(a)*(rad-9)],[cx+Math.cos(a)*(rad+7)*D.aspect,cy+Math.sin(a)*(rad+7)]]); } rad-=10+r()*8; }
    if(r()<.5) S.push([[cx,cy]]); return S; },
  // a grid of dots, some lit
  braille(r,D,w){ const cols=2+Math.floor(r()*2), rows=3+Math.floor(r()*2), S=[]; for(let i=0;i<cols;i++) for(let j=0;j<rows;j++) if(r()<.5+w*.1) S.push([[50+(i-(cols-1)/2)*26,14+j*72/(rows-1)]]); if(S.length<2) S.push([[37,14]],[[63,86]]); if(r()<.25+w*.3){ const y=14+Math.floor(r()*rows)*72/(rows-1); S.push([[24,y],[76,y]]); } return S; },
  // a trace across the page that jumps
  seismic(r,D,w){ const y0=30+r()*40, n=7+Math.floor(r()*(5+w*6)), pts=[[4,y0]], hot=r(); for(let i=1;i<n;i++){ const u=i/(n-1), env=Math.exp(-Math.pow((u-hot)/.22,2)); pts.push([4+92*u, Math.max(5,Math.min(95,y0+(i%2?-1:1)*(4+r()*40*env)))]); } pts.push([96,y0]);
    const S=[pts]; if(r()<.4) S.push([[10+r()*80,Math.min(94,y0+30+r()*12)]]); return S; },
  // loops opening out from one point
  petals(r,D,w){ const cx=50+(r()-.5)*14, cy=52+(r()-.5)*14, n=2+Math.floor(r()*(3+w*2)), a0=r()*Math.PI*2, S=[]; for(let i=0;i<n;i++){ const a=a0+i*Math.PI*2/n+(r()-.5)*.5*w, L=22+r()*20, wd=5+r()*9, pts=[];
      for(let k=0;k<=20;k++){ const t=k/20*Math.PI*2, lx=L*(1-Math.cos(t))/2, ly=wd*Math.sin(t); pts.push([cx+Math.cos(a)*lx-Math.sin(a)*ly, cy+Math.sin(a)*lx+Math.cos(a)*ly]); } S.push(pts); }
    if(r()<.5) S.push([[cx,cy],[cx+(r()-.5)*20,96]]); return S; },
  // moons
  crescent(r,D,w){ const S=[], n=1+Math.floor(r()*(2+w*2)); for(let i=0;i<n;i++){ const cx=34+r()*32, cy=34+r()*32, rad=18+r()*20, a0=r()*Math.PI*2, sw=(.9+r()*.8)*Math.PI; S.push(arc(cx,cy,rad*D.aspect,rad,a0,sw,22)); if(r()<.5) S.push(arc(cx+Math.cos(a0+sw/2)*rad*.45,cy+Math.sin(a0+sw/2)*rad*.45,rad*.75*D.aspect,rad*.75,a0+.25,sw-.5,18)); if(r()<.5) S.push([[cx,cy]]); } return S; },
  // a stem that forks, and forks again
  fork(r,D,w){ const S=[], grow=(x,y,a,L,depth)=>{ const x2=Math.max(5,Math.min(95,x+Math.cos(a)*L)), y2=Math.max(5,Math.min(95,y+Math.sin(a)*L)); S.push([[x,y],[x2,y2]]); if(depth<=0){ if(r()<.35) S.push([[x2,y2]]); return; } const k=r()<.25+w*.3?3:2; for(let i=0;i<k;i++) grow(x2,y2,a+(i-(k-1)/2)*(.5+r()*.5)+(r()-.5)*.3,L*(.55+r()*.2),depth-1); };
    grow(50+(r()-.5)*24,94,-Math.PI/2+(r()-.5)*.4,36+r()*12,1+Math.floor(r()*(1.4+w))); return S; },
};
function genGlyph(r, style, D, w){
  const st = style==='mixed' ? pick(r,SKEYS) : style;
  let S=GEN[st](r,D,w);
  // weirdness: bend the letter through a wavy field, then twist it
  const amp=w*9, f1=.04+r()*.06, f2=.04+r()*.06, p1=r()*7, p2=r()*7, rot=(r()-.5)*w*1.1, sx=(st==='glitch'||st==='circuit')?1:1+(r()-.5)*w*.5;
  const c=Math.cos(rot), s=Math.sin(rot);
  S=S.map(stk=>stk.map(([x,y])=>{ x+=amp*Math.sin(y*f1+p1); y+=amp*Math.sin(x*f2+p2); x=50+(x-50)*sx; const dx=x-50, dy=y-50; return [+(50+dx*c-dy*s).toFixed(1), +(50+dx*s+dy*c).toFixed(1)]; }));
  return S;
}
let gver=0;
function genAlphabet(onlyMissing){
  const D=makeDNA(L.gseed), r=rngFrom(hash(L.gseed+'|'+L.style)), seen=new Set();
  const sig=g=>g.map(s=>s.map(p=>Math.round(p[0]/6)+','+Math.round(p[1]/6)).join(' ')).join('|');
  PAL.forEach(p=>{ let g,tries=0; do{ g=genGlyph(r,L.style,D,L.weird); tries++; } while(seen.has(sig(g))&&tries<40); seen.add(sig(g)); if(!(onlyMissing&&L.glyphs[p.k])) L.glyphs[p.k]=g; });
  gver++;
}
// --- outlines: one shape model shared by the screen, the chart and the font file ---
const circlePts=(c,r,n=12)=>{ const o=[]; for(let i=0;i<n;i++){ const a=i/n*Math.PI*2; o.push([c[0]+Math.cos(a)*r,c[1]+Math.sin(a)*r]); } return o; };
const orient=p=>{ let a=0; for(let i=0;i<p.length;i++){ const [x1,y1]=p[i],[x2,y2]=p[(i+1)%p.length]; a+=x1*y2-x2*y1; } return a<0?p.slice().reverse():p; };
function outline(strokes){
  const w=L.weight, pen=L.pen, sl=L.slant, polys=[], nibA=-Math.PI/5, hx=Math.cos(nibA), hy=Math.sin(nibA);
  const T=p=>[p[0]+sl*(50-p[1]), p[1]];
  for(const s0 of strokes||[]){ const s=s0.map(T);
    if(s.length===1){ if(pen==='nib'){ const W=w*.85, q=s[0]; polys.push([[q[0]-W,q[1]+W*.3],[q[0]-W*.3,q[1]-W],[q[0]+W,q[1]-W*.3],[q[0]+W*.3,q[1]+W]]); } else polys.push(circlePts(s[0], pen==='hair'?Math.max(1.8,w*.3):w*.75)); continue; }
    if(pen==='nib'){ const W=w*1.3, h=[hx*W/2,hy*W/2];
      for(let i=0;i<s.length-1;i++){ const a=s[i],b=s[i+1]; polys.push([[a[0]+h[0],a[1]+h[1]],[b[0]+h[0],b[1]+h[1]],[b[0]-h[0],b[1]-h[1]],[a[0]-h[0],a[1]-h[1]]]);
        const dx=b[0]-a[0], dy=b[1]-a[1], l=Math.hypot(dx,dy); if(l>.01){ const t=.55, nx=-dy/l*t, ny=dx/l*t; polys.push([[a[0]+nx,a[1]+ny],[b[0]+nx,b[1]+ny],[b[0]-nx,b[1]-ny],[a[0]-nx,a[1]-ny]]); } }
      continue; }
    const cum=[0]; for(let i=1;i<s.length;i++) cum.push(cum[i-1]+Math.hypot(s[i][0]-s[i-1][0],s[i][1]-s[i-1][1])); const tot=cum[cum.length-1]||1;
    const rad=i=> pen==='hair' ? Math.max(.9,w*.16) : pen==='brush' ? w*.62*Math.max(.16,Math.pow(Math.sin(Math.PI*Math.min(.97,Math.max(.03,cum[i]/tot))),.55)) : w/2;
    for(let i=0;i<s.length;i++){ let corner=i===0||i===s.length-1;
      if(!corner){ const a=s[i-1],b=s[i],c=s[i+1]; const a1=Math.atan2(b[1]-a[1],b[0]-a[0]), a2=Math.atan2(c[1]-b[1],c[0]-b[0]); let d=Math.abs(a2-a1); if(d>Math.PI) d=2*Math.PI-d; corner=d>.3; }
      if(corner) polys.push(circlePts(s[i],rad(i),12)); }
    for(let i=0;i<s.length-1;i++){ const a=s[i],b=s[i+1],dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy); if(l<.01) continue; const ux=-dy/l, uy=dx/l, ra=rad(i), rb=rad(i+1);
      polys.push([[a[0]+ux*ra,a[1]+uy*ra],[b[0]+ux*rb,b[1]+uy*rb],[b[0]-ux*rb,b[1]-uy*rb],[a[0]-ux*ra,a[1]-uy*ra]]); }
  }
  return polys.map(orient);
}
const gCache=new Map();
function glyphD(k){ const key=k+'|'+gver; if(gCache.has(key)) return gCache.get(key); if(gCache.size>400) gCache.clear();
  const d=outline(L.glyphs[k]).map(p=>'M'+p.map(q=>q[0].toFixed(1)+' '+q[1].toFixed(1)).join('L')+'Z').join(''); gCache.set(key,d); return d; }
const glyphInner=(k,x=0)=>`<path transform="translate(${x} 0)" d="${glyphD(k)}" fill="currentColor"/>`;
function wordSVG(word, rtl){
  let keys=toKeys(word); if(rtl) keys=keys.reverse(); const adv=100;
  const inner=keys.map((k,i)=>glyphInner(k,i*adv)).join('');
  const w=Math.max(1,keys.length*adv);
  return `<svg viewBox="-10 -14 ${w+20} 128" role="img" aria-label="${esc(word)}">${inner}</svg>`;
}

/* ---------- font ---------- */
function buildFont(){
  if(!window.opentype) throw new Error('The font library didn’t load. Check your connection and reload.');
  const fam=($('#fontName').value||L.name+' Script').replace(/[^A-Za-z0-9 ]/g,'').trim()||'Xenoglot Script';
  const tf=p=>[50+p[0]*7, 740-p[1]*7]; const rr=L.weight*7/2;
  const poly=(path,pts)=>{ let a=0; for(let i=0;i<pts.length;i++){ const [x1,y1]=pts[i],[x2,y2]=pts[(i+1)%pts.length]; a+=x1*y2-x2*y1; } if(a<0) pts=pts.slice().reverse(); path.moveTo(pts[0][0],pts[0][1]); for(let i=1;i<pts.length;i++) path.lineTo(pts[i][0],pts[i][1]); path.close(); };
  const circ=(path,c,r)=>poly(path,circlePts(c,r,16));
  const glyphPath=k=>{ const path=new opentype.Path(); outline(L.glyphs[k]).forEach(pg=>poly(path,pg.map(tf).map(q=>[Math.round(q[0]),Math.round(q[1])]))); return path; };
  const glyphs=[new opentype.Glyph({name:'.notdef',unicode:0,advanceWidth:650,path:new opentype.Path()}), new opentype.Glyph({name:'space',unicode:32,advanceWidth:420,path:new opentype.Path()})];
  const dot=(cx,cy)=>{ const p=new opentype.Path(); circ(p,[cx,cy],rr*1.4); return p; };
  glyphs.push(new opentype.Glyph({name:'period',unicode:46,advanceWidth:320,path:dot(150,70)}));
  glyphs.push(new opentype.Glyph({name:'comma',unicode:44,advanceWidth:320,path:(()=>{ const p=dot(150,70); const r=rr; poly(p,[[150-r,70],[150+r,70],[110,-90]]); return p; })()}));
  const bar=(x0,y0,x1,y1)=>{ const p=new opentype.Path(); const dx=x1-x0, dy=y1-y0, l=Math.hypot(dx,dy)||1, nx=-dy/l*rr, ny=dx/l*rr; poly(p,[[x0+nx,y0+ny],[x1+nx,y1+ny],[x1-nx,y1-ny],[x0-nx,y0-ny]]); circ(p,[x0,y0],rr); circ(p,[x1,y1],rr); return p; };
  const merge=(...ps)=>{ const p=new opentype.Path(); ps.forEach(q=>p.extend(q)); return p; };
  glyphs.push(new opentype.Glyph({name:'exclam',unicode:33,advanceWidth:320,path:merge(bar(150,700,150,280),dot(150,70))}));
  glyphs.push(new opentype.Glyph({name:'question',unicode:63,advanceWidth:560,path:(()=>{ const p=new opentype.Path(); const pts=[]; for(let i=0;i<=12;i++){ const a=Math.PI*(1-i/12)-.15; pts.push([280+Math.cos(a)*170, 560+Math.sin(a)*150]); } pts.push([280,330]); for(let i=0;i<pts.length-1;i++) p.extend(bar(pts[i][0],pts[i][1],pts[i+1][0],pts[i+1][1])); p.extend(bar(280,330,280,270)); p.extend(dot(280,70)); return p; })()}));
  glyphs.push(new opentype.Glyph({name:'hyphen',unicode:45,advanceWidth:440,path:bar(90,330,350,330)}));
  glyphs.push(new opentype.Glyph({name:'quotesingle',unicode:39,advanceWidth:260,path:bar(130,720,130,540)}));
  // one glyph per character: opentype.js 1.3.4 writes only the first code of a glyph into cmap,
  // so capitals get their own copy of the letter (sentences start with one)
  const used=new Set([0,32,33,39,44,45,46,63]);
  PAL.forEach(p=>{ const cp=p.k.codePointAt(0); const hex=c=>c.toString(16).toUpperCase().padStart(4,'0');
    glyphs.push(new opentype.Glyph({name:'uni'+hex(cp),unicode:cp,advanceWidth:800,path:glyphPath(p.k)})); used.add(cp);
    const up=p.k.toUpperCase(); const ucp=up.length===1&&up!==p.k?up.codePointAt(0):null;
    if(ucp&&!used.has(ucp)){ glyphs.push(new opentype.Glyph({name:'uni'+hex(ucp),unicode:ucp,advanceWidth:800,path:glyphPath(p.k)})); used.add(ucp); } });
  const font=new opentype.Font({familyName:fam,styleName:'Regular',unitsPerEm:1000,ascender:860,descender:-220,glyphs});
  return {font, fam};
}
let fontSeq=0, fontTimer=0;
function refreshFontPreview(){ clearTimeout(fontTimer); fontTimer=setTimeout(async()=>{ try{ const {font}=buildFont(); const name='XenoPrev'+(++fontSeq); const ff=new FontFace(name, font.toArrayBuffer()); await ff.load(); document.fonts.add(ff); $('#fPrev').style.fontFamily=`"${name}", var(--ipa)`; $('#fStatus').textContent=''; }catch(e){ $('#fStatus').textContent=e.message; } },250); }

/* ---------- UI: sounds ---------- */
function renderPalette(){
  renderTakeOrder();
  const groups={}; PAL.forEach(p=>(groups[p.g]=groups[p.g]||[]).push(p));
  $('#palette').innerHTML=Object.entries(groups).map(([g,ps])=>`<div class="sgroup"><h3>${g.toLowerCase()}</h3><div class="sgrid">${ps.map(p=>{ const on=L.inv.includes(p.k);
    return `<div class="snd${on?' on':''}" data-k="${p.k}"><button type="button" class="main" aria-pressed="${on}" title="${on?'Remove from':'Add to'} your language"><span class="k">${p.k}</span><span class="ipa">/${p.ipa}/<span class="led"></span></span><span class="h">${p.h}</span></button>
    <div class="tools"><button type="button" data-a="play" aria-label="Play ${p.k}" title="Play">▶</button><button type="button" data-a="rec" title="${esc(recHint(p.k))}">rec</button><button type="button" data-a="up" title="Use an audio file for this sound">file</button>${recs[p.k]?`<span class="mine"><span class="led p"></span>yours</span><button type="button" data-a="clr" aria-label="Remove your recording" title="Back to the synthetic voice">×</button>`:''}</div></div>`; }).join('')}</div></div>`).join('');
  updateCounts();
}
let recTarget=null, micStop=null;
const MIC_BLOCKED='Your browser blocked the microphone in this view. Use Upload, or open the standalone copy of this page in Chrome, Edge or Firefox.';
async function micRecord(btn, secs){ // secs = fixed length; 0 = until the button is pressed again
  if(micStop){ micStop(); return null; }
  let st; try{ st=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:true}}); }catch(err){ toast(MIC_BLOCKED); return null; }
  return new Promise(res=>{ const mr=new MediaRecorder(st); const ch=[]; const label=btn.innerHTML; const dot=btn.classList.contains('ink')?'<span class="dot"></span> ':'';
    mr.ondataavailable=ev=>ev.data.size&&ch.push(ev.data);
    mr.onstop=async()=>{ st.getTracks().forEach(t=>t.stop()); micStop=null; btn.classList.remove('recording'); btn.innerHTML=label; $('#ledRec').classList.remove('on'); res(await new Blob(ch).arrayBuffer()); };
    micStop=()=>mr.state!=='inactive'&&mr.stop();
    btn.classList.add('recording'); $('#ledRec').classList.add('on'); btn.innerHTML=dot+(secs?'listening':'stop recording'); mr.start(); if(secs) setTimeout(micStop,secs*1000); });
}
$('#palette').addEventListener('click', async e=>{
  const card=e.target.closest('.snd'); if(!card) return; const k=card.dataset.k; const a=e.target.closest('[data-a]')?.dataset.a;
  if(!a && e.target.closest('.main')){ const i=L.inv.indexOf(k); if(i>=0){ if(isV(k)&&V().length<=1){ toast('A language needs at least one vowel.'); return; } L.inv.splice(i,1); } else L.inv.push(k); changed(); renderPalette(); return; }
  if(a==='play'){ const w = isV(k) ? k+k : 'a'+k+'a'; play(await speakWords([{al:w,end:'.'}])); }
  if(a==='up'){ recTarget=k; $('#fileRec').click(); }
  if(a==='clr'){ delete recs[k]; saveRecs(); renderPalette(); }
  if(a==='rec'){ const btn=e.target; if(!micStop) toast('recording: '+recHint(k)); const ab=await micRecord(btn, REC[PM[k].t].hold?1.4:1); if(ab) await setRec(k, ab); }
});
$('#fileRec').addEventListener('change', async e=>{ const f=e.target.files[0]; e.target.value=''; if(f&&recTarget) await setRec(recTarget, await f.arrayBuffer()); });

/* ---------- one take of every sound ---------- */
const invOrder=()=>PAL.filter(p=>L.inv.includes(p.k)).map(p=>p.k);
function renderTakeOrder(){ $('#takeOrder').innerHTML=invOrder().map((k,i)=>{ const hold=REC[PM[k].t].hold; return `<span title="${esc(recHint(k))}"><small>${i+1}</small>${esc(k)}<i class="len ${hold?'hold':'short'}" aria-label="${hold?'hold':'short'}"></i></span>`; }).join(''); }
function wavBytes(d, sr){ const n=d.length, b=new ArrayBuffer(44+n*2), v=new DataView(b); const w=(o,s)=>[...s].forEach((c,i)=>v.setUint8(o+i,c.charCodeAt(0)));
  w(0,'RIFF'); v.setUint32(4,36+n*2,true); w(8,'WAVE'); w(12,'fmt '); v.setUint32(16,16,true); v.setUint16(20,1,true); v.setUint16(22,1,true); v.setUint32(24,sr,true); v.setUint32(28,sr*2,true); v.setUint16(32,2,true); v.setUint16(34,16,true); w(36,'data'); v.setUint32(40,n*2,true);
  for(let i=0;i<n;i++) v.setInt16(44+i*2,Math.max(-1,Math.min(1,d[i]))*32767,true); return b; }
async function splitTake(ab){
  const st=$('#takeStatus'); st.textContent='Finding the sounds…';
  let b; try{ b=await getCtx().decodeAudioData(ab.slice(0)); }catch(e){ st.textContent='That file couldn’t be read as audio.'; return; }
  const sr=b.sampleRate, x=new Float32Array(b.length); for(let c=0;c<b.numberOfChannels;c++){ const d=b.getChannelData(c); for(let i=0;i<x.length;i++) x[i]+=d[i]/b.numberOfChannels; }
  const hop=Math.round(sr*.01), F=Math.floor(x.length/hop), env=new Float32Array(F);
  for(let f=0;f<F;f++){ let s=0; for(let i=0;i<hop;i++){ const v=x[f*hop+i]; s+=v*v; } env[f]=Math.sqrt(s/hop); }
  const srt=[...env].sort((a,c)=>a-c), floor=srt[Math.floor(F*.2)]||0, peak=srt[Math.floor(F*.98)]||0;
  const keys=invOrder(); let best=null;
  for(const frac of [.06,.1,.15,.04,.22,.03]){ // try a few sensitivities, keep the one closest to the number of sounds
    const thr=floor+(peak-floor)*frac; const segs=[]; let s0=-1, gap=0;
    for(let f=0;f<=F;f++){ const on=f<F&&env[f]>thr; if(on){ if(s0<0) s0=f; gap=0; } else if(s0>=0){ gap++; if(gap>=14||f===F){ const e=f-gap+1; if(e-s0>=4) segs.push([s0,e]); s0=-1; gap=0; } } }
    if(!best||Math.abs(segs.length-keys.length)<Math.abs(best.length-keys.length)) best=segs;
    if(segs.length===keys.length) break;
  }
  if(!best.length){ st.textContent='No separate sounds found. Leave clearer pauses and try again.'; return; }
  const n=Math.min(best.length,keys.length);
  for(let i=0;i<n;i++){ const [a,e]=best[i]; const s=Math.max(0,(a-2)*hop), en=Math.min(x.length,(e+3)*hop); const ab2=wavBytes(x.subarray(s,en),sr);
    try{ recs[keys[i]]={buf:await decodeClip(ab2), b64:b64enc(ab2)}; }catch(err){} }
  saveRecs(); renderPalette(); tBuf=null;
  st.textContent = best.length===keys.length ? `All ${n} sounds captured. Press ▶ on any sound to check it.` : `Found ${best.length} sounds but your language has ${keys.length}. The first ${n} were assigned in order; check them with ▶ and fix any with the per-sound buttons.`;
}
$('#takeBtn').addEventListener('click',()=>$('#fileTake').click());
$('#fileTake').addEventListener('change',async e=>{ const f=e.target.files[0]; e.target.value=''; if(f) await splitTake(await f.arrayBuffer()); });
$('#takeRec').addEventListener('click',async e=>{ const ab=await micRecord(e.currentTarget,0); if(ab) await splitTake(ab); });
function syllableCount(){ const c=C().length, v=V().length, cl=clusterSeconds().length;
  const on=(L.onset<1?1:0)+(L.onset>0?c:0)+(L.cluster>0&&L.onset>0?c*Math.max(0,cl-0):0); const co=(L.coda<1?1:0)+(L.coda>0?c:0); return on*v*co; }
function updateCounts(){
  const c=C().length, v=V().length; $('#youN').textContent=c+v; sideLcd();
  const S=syllableCount(); let words=0; for(let n=1;n<=L.maxSyl;n++) words+=Math.pow(S,n);
  const three=Math.pow(S,3);
  const html=`With your <b>${c+v}</b> sounds and current word rules there are <b>${fmt(S)}</b> possible syllables, <b>${fmt(three)}</b> three-syllable words and <b>${fmt(words)}</b> words of up to ${L.maxSyl} syllable${L.maxSyl>1?'s':''}. An adult English speaker uses about 20,000 words, so ${words>=20000?'that is plenty.':'you may want more sounds or longer words.'}<br><span class="muted">For comparison: Rotokas’ 11 sounds in simple consonant-vowel syllables give 30 syllables and 27,000 three-syllable words.</span>`.replace('<span class="muted">','<span class="dim">');
  $('#calc').innerHTML=html; $('#calc2').innerHTML=html;
}

/* ---------- UI: words ---------- */
function renderAffixes(){ $('#affixes').innerHTML=AFFIX.map(([tag,lab,en,ex])=>`<div><span class="f">-${esc(affix(tag))}</span>${lab} <span class="muted">(English ${esc(en)}, ${ex} → ${esc(alienWord(ex))})</span></div>`).join(''); }
function renderLex(){
  const f=$('#lexFilter').value.trim().toLowerCase();
  const words=[...new Set([...Object.keys(L.lexicon),...COMMON])].filter(w=>!f||w.includes(f));
  $('#lex').innerHTML=words.map(w=>`<div><label for="lx-${esc(w)}">${esc(w)}</label><input id="lx-${esc(w)}" data-w="${esc(w)}" value="${esc(alienWord(w))}" class="${L.lexicon[w]?'edited':''}"></div>`).join('') || '<p class="muted">No match. Press Add to give this word a translation.</p>';
}
$('#lex').addEventListener('change',e=>{ const w=e.target.dataset.w; if(!w) return; const v=e.target.value.trim(); if(v) L.lexicon[w]=v; else delete L.lexicon[w]; changed(); e.target.classList.toggle('edited',!!L.lexicon[w]); });
$('#lexFilter').addEventListener('input',renderLex);
$('#lexAdd').addEventListener('click',()=>{ const w=$('#lexFilter').value.trim().toLowerCase(); if(!/^[a-z']+$/.test(w)){ toast('Type one English word to add.'); return; } L.lexicon[w]=alienWord(w); changed(); renderLex(); });
$('#lexReset').addEventListener('click',()=>{ L.lexicon={}; changed(); renderLex(); toast('Dictionary back to generated words'); });

/* ---------- UI: translate ---------- */
let lastT=null;
function renderTranslate(){
  const toks=translate($('#enText').value, $('#keepNames').checked); lastT=toks; tBuf=null; drawWave($('#waveT'),null);
  const rtl=(document.querySelector('input[name=dir]:checked')||{}).value==='rtl';
  $('#outRoman').innerHTML=toks.map(t=>t.t==='w'?`<span class="w" title="${esc(t.en)}">${esc(t.al)}</span>`:t.t==='nl'?'<br>':t.t==='sp'?' ':esc(t.s)).join('');
  const sc=$('#outScript'); sc.classList.toggle('rtl',rtl);
  sc.innerHTML=toks.filter(t=>t.t!=='sp').map(t=>t.t==='w'?wordSVG(t.al,rtl):t.t==='nl'?'<span style="flex-basis:100%"></span>':`<span class="pn">${esc(t.s)}</span>`).join('');
  $('#outIpa').textContent='/'+toks.filter(t=>t.t==='w').map(t=>ipaOf(t.al)).join(' ')+'/';
  updateEst();
}
const romanText=()=>(lastT||[]).map(t=>t.t==='w'?t.al:t.t==='nl'?'\n':t.t==='sp'?' ':t.s).join('');
let tBuf=null;
/* ---------- length: an estimate as you type, and "fit to a length" ----------
   The built-in voice's length is known exactly from wordsToSegs. The natural voice's length is that times a
   learned ratio, refined after every real result, as is the time each engine takes to make a second of audio. */
const tailOf=v=>v.space>0 ? .2+v.space*1.6 : 0;
const pace={len:{synth:1,kristin:.82,norman:.66,heart:.8,michael:.8}, work:{synth:.08,kristin:.45,norman:.55,heart:.6,michael:.6}, passes:1.6}; // work = seconds per pass per second of audio; passes = average natural passes when fitting
for(const [id,v] of Object.entries(NATURAL)){ pace.len[id] ??= .8; pace.work[id] ??= v.kind==='kokoro' ? 2 : .45; }   // voices without measured figures start from a typical one and learn
try{ const s=JSON.parse(store.get('xenoglot-v1-pace')||'null'); if(s&&s.len&&s.work){ Object.assign(pace.len,s.len); Object.assign(pace.work,s.work); } }catch(e){}
const engineNow=()=>NATURAL[L.engine] ? L.engine : 'synth';
const fmtS=s=>s<60 ? (s<10?s.toFixed(1):Math.round(s))+' s' : Math.floor(s/60)+':'+String(Math.round(s%60)).padStart(2,'0');
const fit={on:false, secs:0};
const builtinLen=(words,voice)=>wordsToSegs(words,voice).dur;          // spoken length with the built-in voice
function fitSpeed(words){ // speed multiplier that lands the chosen length, kept to 0.5–2× so it still sounds natural
  const eng=engineNow(), tail=tailOf(L.voice), want=Math.max(.3, fit.secs-tail-(eng==='synth'?0:.1));
  let m=Math.min(2,Math.max(.5, builtinLen(words,L.voice)*pace.len[eng]/want));
  if(eng==='synth') for(let i=0;i<4;i++){ const got=builtinLen(words,{...L.voice,speed:L.voice.speed*m}); m=Math.min(2,Math.max(.5, m*got/want)); } // the built-in length is exact, so converge on it
  return m; }
let voiceReady={};
async function checkVoiceCache(){ for(const id of Object.keys(NATURAL)){ if(voiceReady[id]) continue; try{ const c=await caches.open(VOICE_CACHE); voiceReady[id]=!!(await c.match(modelUrl(NATURAL[id]))); }catch(e){} } updateEst(); }
function updateEst(){ const el=$('#tEst'); if(!el) return; const words=tokensToWords(lastT||[]);
  if(!words.length){ el.textContent='type some english to hear it'; return; }
  const eng=engineNow(), tail=tailOf(L.voice), m=fit.on?fitSpeed(words):1;
  const spoken=builtinLen(words,{...L.voice,speed:L.voice.speed*m})*pace.len[eng], total=spoken+tail+(eng==='synth'?0:.1);
  const work=Math.max(.3, spoken*pace.work[eng]*(fit.on&&eng!=='synth'?pace.passes:1));
  const first=eng!=='synth' && !piper[eng] && !voiceReady[eng] ? ` + a one-time ${NATURAL[eng].mb} MB voice download` : (eng!=='synth' && !piper[eng] ? ' + about 12 s to start the voice' : '');
  el.textContent=`≈ ${fmtS(total)} of speech${fit.on?` · speed ×${(L.voice.speed*m).toFixed(2)}`:''} · ready in about ${fmtS(work)}${first}`;
  const r=$('#fitSecs'); if(r){ const base=builtinLen(words,L.voice)*pace.len[eng]; const lo=Math.max(.5,Math.floor((base/2+tail)*2)/2), hi=Math.max(lo+.5,Math.ceil((base*2+tail)*2)/2);
    r.min=lo; r.max=hi; if(!fit.secs||fit.secs<lo||fit.secs>hi){ fit.secs=Math.min(hi,Math.max(lo,Math.round(total*2)/2)); } r.value=fit.secs; paintRange(r); $('#oFit').textContent=fmtS(fit.secs); } }
async function makeSpeech(){
  const words=tokensToWords(lastT||[]); const eng=engineNow(), t0=performance.now();
  let m=fit.on?fitSpeed(words):1, buf=await speakWords(words,m,fit.on), passes=1;
  const spokenOf=b=>b.duration-tailOf(L.voice)-(eng==='synth'?0:.1);
  if(eng!=='synth' && NATURAL[L.engine]){
    const predicted=builtinLen(words,{...L.voice,speed:L.voice.speed*m});
    pace.len[eng]=pace.len[eng]*.5+(spokenOf(buf)/predicted)*.5;                   // learn this voice's pace
    if(fit.on){ const want=fit.secs-tailOf(L.voice)-.1, got=spokenOf(buf);
      if(Math.abs(got-want)/fit.secs>.02){ m=Math.min(2,Math.max(.5,m*got/want)); buf=await speakWords(words,m,true); passes=2; }   // one correction pass
      pace.passes=pace.passes*.6+passes*.4;
      const short=fit.secs-buf.duration; if(short>.02){ const ctx=getCtx(); const nb=ctx.createBuffer(1,Math.round((buf.duration+short)*buf.sampleRate),buf.sampleRate); nb.copyToChannel(buf.getChannelData(0),0); buf=nb; } } }
  const secs=(performance.now()-t0)/1000; pace.work[eng]=pace.work[eng]*.5+(secs/passes/Math.max(.5,buf.duration))*.5;
  store.set('xenoglot-v1-pace',JSON.stringify(pace)); updateEst();
  return {buf,secs}; }
async function getTBuf(){ if(!tBuf){ $('#tStatus').textContent='synthesizing…'; setStatus('synthesizing…');
    const {buf,secs}=await makeSpeech(); tBuf=buf; drawWave($('#waveT'),tBuf,-1);   // the wave shows however the speech was made
    const msg=`${fmtS(tBuf.duration)} of speech${fit.on?` (asked for ${fmtS(fit.secs)})`:''} · made in ${fmtS(secs)}`;
    $('#tStatus').textContent=msg; setStatus(msg); } return tBuf; }
$('#fitOn').addEventListener('change',e=>{ fit.on=e.target.checked; $('#fitCtl').hidden=!fit.on; $('#fitHint').hidden=!fit.on; if(fit.on) fit.secs=0; tBuf=null; updateEst(); });
$('#fitSecs').addEventListener('input',e=>{ fit.secs=+e.target.value; tBuf=null; updateEst(); });
$('#tSpeak').addEventListener('click',()=>{ if(location.hash.slice(1)!=='translate' && !playing) location.hash='translate'; speakNow(); });
$('#tSaveAudio').addEventListener('click',async()=>exportAudio(await getTBuf(), slug(L.name)+'-speech', $('#tStatus')));
$('#tSaveMp3').addEventListener('click',async()=>exportMp3(await getTBuf(), slug(L.name)+'-speech', $('#tStatus')));
// the audio key under the head: the speech as an .mp3, or the converted track when the audio section has one
$('#headAudio').addEventListener('click',()=>{ getCtx(); (!$('#v-audio').hidden && dBuf ? $('#dSaveMp3') : $('#tSaveMp3')).click(); });
$('#tShare').addEventListener('click',async()=>shareAudio(await getTBuf(), slug(L.name)+'-speech', $('#tStatus')));
$('#dShare').addEventListener('click',()=>dBuf&&shareAudio(dBuf, slug(L.name)+'-'+slug(track.name.replace(/\.[^.]+$/,'')), $('#dStatus')));
if(canShareFiles && !(window.claude && window.claude.use)){ $('#tShare').hidden=false; $('#dShare').hidden=false; }
// inside a claude.ai artifact the download allowlist has no .mp3, so only the .wav button (recorded .webm there) is offered
if(window.claude && window.claude.use){ $('#tSaveMp3').hidden=true; $('#dSaveMp3').hidden=true; $('#tSaveAudio').textContent='save audio'; $('#dSave').textContent='save audio'; }
$('#tCopy').addEventListener('click',()=>{ const s=romanText(); navigator.clipboard.writeText(s).then(()=>toast('Copied'),()=>{ const r=document.createRange(); r.selectNodeContents($('#outRoman')); getSelection().removeAllRanges(); getSelection().addRange(r); toast('Selected. Press Ctrl+C or ⌘C to copy.'); }); });
$('#tSaveTxt').addEventListener('click',()=>saveFile(slug(L.name)+'.txt', `${L.name}\n\n${romanText()}\n\nIPA: ${$('#outIpa').textContent}\n\nEnglish:\n${$('#enText').value}\n`));
['#enText','#keepNames',...$$('input[name=dir]').map(x=>x)].forEach(s=>(typeof s==='string'?$(s):s).addEventListener('input',()=>{ renderTranslate(); store.set('xenoglot-v1-text',$('#enText').value); }));

/* ---------- UI: audio conversion ---------- */
let track=null, dBuf=null;
const drop=$('#drop');
drop.addEventListener('click',()=>$('#fileTrack').click());
drop.addEventListener('dragover',e=>{ e.preventDefault(); drop.classList.add('drag'); });
drop.addEventListener('dragleave',()=>drop.classList.remove('drag'));
drop.addEventListener('drop',e=>{ e.preventDefault(); e.stopPropagation(); document.body.classList.remove('dropping'); drop.classList.remove('drag'); const f=e.dataTransfer.files[0]; if(f) loadTrack(f); });
$('#fileTrack').addEventListener('change',e=>{ const f=e.target.files[0]; e.target.value=''; if(f) loadTrack(f); });
async function loadTrack(f){
  $('#dInfo').textContent='Reading '+f.name+'…';
  try{ const b=await getCtx().decodeAudioData(await f.arrayBuffer()); if(b.duration>600){ $('#dInfo').textContent='That track is over 10 minutes. Trim it and try again.'; return; }
    $('#dInfo').textContent='Analysing rhythm and pitch…'; await new Promise(r=>setTimeout(r,30));
    if(track && track.segs) $('#dTranscript').value='';   // that transcript belonged to the previous track
    stopAudio(); dBuf=null; $('#dOut').hidden=true; $('#dStatus').textContent='';   // and so did the previous result
    track={buf:b,name:f.name,an:analyse(b),segs:null}; $('#dAsr').textContent=''; $('#dTranscribe').disabled=false;
    $('#dInfo').textContent=`${f.name}: ${fmtS(b.duration)}, ${track.an.phrases.length} phrases, about ${track.an.phrases.reduce((a,p)=>a+p.syl,0)} syllables.`;
    $('#dGo').disabled=false; drop.classList.add('loaded'); drop.querySelector('span:not(.led)').textContent=f.name.length>34?f.name.slice(0,32)+'…':f.name;
  }catch(e){ $('#dInfo').textContent='That file couldn’t be decoded. Try mp3, wav or m4a.'; }
}
function analyse(buf){
  const sr=buf.sampleRate, n=buf.length; const x=new Float32Array(n);
  for(let c=0;c<buf.numberOfChannels;c++){ const d=buf.getChannelData(c); for(let i=0;i<n;i++) x[i]+=d[i]/buf.numberOfChannels; }
  const dec=Math.max(1,Math.floor(sr/11025)), sr2=sr/dec, m=Math.floor(n/dec); const y=new Float32Array(m);
  for(let i=0;i<m;i++){ let s=0; for(let j=0;j<dec;j++) s+=x[i*dec+j]; y[i]=s/dec; }
  const hop=Math.round(sr2*.02), win=Math.round(sr2*.04), F=Math.max(0,Math.floor((m-win)/hop));
  const rms=new Float32Array(F), f0=new Float32Array(F);
  for(let f=0;f<F;f++){ let s=0; const o=f*hop; for(let i=0;i<win;i++) s+=y[o+i]*y[o+i]; rms[f]=Math.sqrt(s/win); }
  const sorted=[...rms].sort((a,b)=>a-b); const p95=sorted[Math.floor(sorted.length*.95)]||0; const thr=Math.max(.003,p95*.12);
  const sm=rms.map((_,i)=>{ let s=0,c=0; for(let j=i-2;j<=i+2;j++) if(j>=0&&j<F){ s+=rms[j]; c++; } return s/c; });
  const minL=Math.floor(sr2/420), maxL=Math.ceil(sr2/70);
  for(let f=0;f<F;f++){ if(sm[f]<thr) continue; const o=f*hop; if(o+win+maxL>=m) continue; let r0=0; for(let i=0;i<win;i++) r0+=y[o+i]*y[o+i]; if(r0<=0) continue;
    let best=0,bl=0; for(let l=minL;l<=maxL;l++){ let r=0; for(let i=0;i<win;i++) r+=y[o+i]*y[o+i+l]; if(r>best){ best=r; bl=l; } }
    if(best/r0>.45) f0[f]=sr2/bl; }
  const phrases=[]; let st=-1, gap=0;
  for(let f=0;f<=F;f++){ const on=f<F&&sm[f]>thr; if(on){ if(st<0) st=f; gap=0; } else if(st>=0){ gap++; if(gap>12||f===F){ const en=f-gap+1; if(en-st>=6) phrases.push({s:st,e:en}); st=-1; gap=0; } } }
  phrases.forEach(p=>{ let c=0; for(let i=p.s;i<p.e;i++){ let pk=sm[i]>thr*1.6; for(let j=i-5;j<=i+5&&pk;j++) if(j!==i&&j>=0&&j<F&&sm[j]>sm[i]) pk=false; if(pk) c++; } p.syl=Math.max(1,c); p.t=p.s*.02; p.d=(p.e-p.s)*.02; });
  return {rms:sm,f0,phrases,hop:.02,frames:F};
}
/* ---------- speech-to-text: Whisper in a worker writes down what the track says, with timings ---------- */
let asrWorker=null;
async function transcribeTrack(){
  if(inArtifact()) throw new Error('Speech-to-text needs the hosted site (xenoglot.jas.black).');
  const st=$('#dAsr'), box=$('#dTranscript'); st.textContent='preparing the audio…';
  const b=track.buf, off=new OfflineAudioContext(1, Math.ceil(b.duration*16000), 16000), src=off.createBufferSource(); src.buffer=b; src.connect(off.destination); src.start();
  const pcm=(await off.startRendering()).getChannelData(0).slice();
  asrWorker ??= new Worker('asr-worker.js');
  const got=[]; $('#ledVoice').classList.add('on');
  try{ return await new Promise((res,rej)=>{
    asrWorker.onmessage=e=>{ const d=e.data;
      if(d.type==='status') st.textContent=d.text;
      else if(d.type==='progress'){ got.push(...d.segments); box.value=got.map(s=>s.text).join('\n'); st.textContent=`listening… ${fmtS(d.done)} of ${fmtS(d.total)}`; }
      else if(d.type==='done') res(d.segments); else if(d.type==='error') rej(new Error(d.message)); };
    asrWorker.onerror=()=>rej(new Error('Speech-to-text couldn’t start.'));
    asrWorker.postMessage({type:'transcribe',pcm,ortBase:new URL('vendor/ort/',location.href).href,hf:HF},[pcm.buffer]); });
  } finally { if(!playing) $('#ledVoice').classList.remove('on'); }
}
async function runTranscribe(){ const st=$('#dAsr'), t0=performance.now();
  const segs=await transcribeTrack(); track.segs=segs; $('#dTranscript').value=segs.map(s=>s.text).join('\n');
  st.textContent=segs.length ? `${segs.length} phrase${segs.length>1?'s':''} written down in ${fmtS((performance.now()-t0)/1000)}. edit the words if you like; keep the lines and the timing stays exact.` : 'no speech found in that track.';
  return segs; }
$('#dTranscribe').addEventListener('click',async e=>{ if(!track) return; const b=e.currentTarget; b.disabled=true;
  try{ await runTranscribe(); }catch(err){ $('#dAsr').textContent=''; toast(err.message); } finally{ b.disabled=false; } });

/* ---------- slots: where each phrase goes on the timeline, and the words that fill it ---------- */
function buildSlots(){ const an=track.an, lines=$('#dTranscript').value.split('\n').map(x=>x.trim()).filter(Boolean);
  if(track.segs && track.segs.length && lines.length===track.segs.length){ // one line per timed phrase
    const slots=track.segs.map((sg,i)=>{ let t=sg.s, e=sg.e;
      const inside=an.phrases.filter(p=>p.t+p.d>sg.s+.05 && p.t<sg.e-.05); // trim to where sound actually is
      if(inside.length){ const a=Math.max(t,inside[0].t), z=Math.min(e,inside[inside.length-1].t+inside[inside.length-1].d); if(z-a>=.3){ t=a; e=z; } }
      return {t, d:Math.max(.3,e-t), words:tokensToWords(translate(lines[i],false))}; }).filter(s=>s.words.length);
    return {slots, timed:true}; }
  const r=rngFrom(hash(L.seed+'dub'+track.name)), tx=lines.join(' ');
  let per=an.phrases.map(()=>[]); const totalSyl=an.phrases.reduce((a,p)=>a+p.syl,0)||1;
  if(tx){ // words without timings: shared out over the track's phrases by syllable count
    const words=tokensToWords(translate(tx,false)), ws=words.map(w=>Math.max(1,toKeys(w.al).filter(isV).length)), tw=ws.reduce((a,b)=>a+b,0)||1;
    const bounds=[]; let acc=0; an.phrases.forEach(p=>{ acc+=p.syl; bounds.push(acc/totalSyl); });
    let cum=0; words.forEach((w,i)=>{ const mid=(cum+ws[i]/2)/tw; cum+=ws[i]; let pi=bounds.findIndex(b=>mid<=b); if(pi<0) pi=bounds.length-1; per[pi].push({al:w.al}); });
  } else per=an.phrases.map(p=>{ const out=[]; let left=p.syl; while(left>0){ const k=Math.min(left,1+Math.floor(r()*Math.min(3,L.maxSyl))); out.push({al:makeWord(r,k)}); left-=k; } return out; });
  return {slots:an.phrases.map((p,i)=>({t:p.t,d:p.d,words:per[i]})).filter(s=>s.words.length), timed:false}; }
// built-in voice: every phrase stretched to its slot, following the original's melody
async function dubSynth(slots, under, underVol){ const an=track.an, segs=[];
  slots.forEach(sl=>{ const {segs:s0}=wordsToSegs(sl.words,{...L.voice,speed:1},0); const D=s0.length? s0[s0.length-1].t : 1, k=sl.d/(D||1);
    s0.forEach(s=>segs.push({...s,t:sl.t+s.t*k,d:s.d*k})); segs.push({k:null,t:sl.t+sl.d,d:.05,p:L.voice.pitch}); });
  const f0=[...an.f0], voiced=f0.filter(v=>v>0).sort((a,b)=>a-b), med=voiced[Math.floor(voiced.length/2)]||L.voice.pitch, ratio=L.voice.pitch/med;
  let last=L.voice.pitch; const curve=new Float32Array(Math.max(2,f0.length)); for(let i=0;i<f0.length;i++){ if(f0[i]>0) last=Math.min(520,Math.max(45,f0[i]*ratio)); curve[i]=last; } if(f0.length<2) curve.fill(L.voice.pitch);
  for(let i=1;i<curve.length-1;i++) curve[i]=(curve[i-1]+curve[i]+curve[i+1])/3;
  const b=await render(segs, track.buf.duration+.4, L.voice, {pitchCurve:curve, pitchCurveDur:Math.max(.05,curve.length*an.hop), under, underVol}); b.timeline={segs}; return b; }
// natural voices: each phrase is made at the pace that fills its slot, corrected once if it misses
async function dubNatural(slots, under, underVol, onStep){
  const eng=L.engine, voice={...DEFAULT.voice,...L.voice,fitting:true}, V=await piperVoice(eng), v=NATURAL[eng], sr=V.cfg.audio.sample_rate, rate=voiceRate(voice,v), clips=[], tl=[];
  const clampLs=x=>Math.min(2.3,Math.max(.45,x));
  for(let i=0;i<slots.length;i++){ const sl=slots[i]; onStep(i,slots.length);
    const last=sl.words[sl.words.length-1], ipa=sl.words.map((w,j)=>{ const x=toKeys(w.al).map(k=>PM[k].ipa).join(''); return x ? 'ˈ'+x+(w.end&&j<sl.words.length-1?',':'') : ''; }).filter(Boolean).join(' ')+(last&&last.end==='?'?'?':'.');
    if(ipa.length<3) continue;
    const est=Math.max(.2,(builtinLen(sl.words,{...voice,speed:1})-.42)*pace.len[eng]);
    let ls=clampLs(rate*sl.d/est), raw=await naturalRun(V, ipa, ls, voice), d=raw.length/sr/rate;
    if(Math.abs(d-sl.d)/sl.d>.1){ const ls2=clampLs(ls*sl.d/d); if(Math.abs(ls2-ls)>.02){ ls=ls2; raw=await naturalRun(V, ipa, ls, voice); d=raw.length/sr/rate; } }
    const room=(i+1<slots.length ? slots[i+1].t : track.buf.duration+.3)-sl.t-.04;
    const squeeze=d>room ? Math.min(1.3,d/room) : 1; clips.push({raw, t:sl.t, squeeze}); tl.push(...spreadSegs(sl.words, sl.t+.03, d/squeeze-.08)); }
  if(!clips.length) throw new Error('There was nothing to say.');
  const b=await naturalFx(clips, sr, voice, rate, track.buf.duration+.3, {under, underVol}); b.timeline={segs:tl}; return b; }
$('#dOrig').addEventListener('input',e=>$('#oOrig').textContent=Math.round(e.target.value*100)+'%');
$('#dGo').addEventListener('click',async()=>{
  if(!track) return; const btn=$('#dGo'), st=$('#dStatus'), t0=performance.now(); btn.disabled=true; $('#dTranscribe').disabled=true; stopAudio();
  try{
    if(!$('#dTranscript').value.trim() && $('#dAuto').checked && !inArtifact()){
      try{ await runTranscribe(); }catch(err){ $('#dAsr').textContent=''; toast(err.message+' Making rhythm-matched speech instead.'); } }
    const {slots,timed}=buildSlots(); if(!slots.length){ $('#dOut').hidden=false; st.textContent='no speech found in that track.'; return; }
    const underVol=+$('#dOrig').value, under=underVol>0?track.buf:null; let how='built-in voice';
    $('#dOut').hidden=false; st.textContent='building speech…';
    if(NATURAL[L.engine]){
      try{ $('#ledVoice').classList.add('on'); dBuf=await dubNatural(slots, under, underVol, (i,n)=>{ st.textContent=`voicing phrase ${i+1} of ${n}…`; }); how=NATURAL[L.engine].label; }
      catch(err){ toast((err.message||'The natural voice failed.')+' Using the built-in voice.'); dBuf=await dubSynth(slots, under, underVol); }
      finally{ if(!playing) $('#ledVoice').classList.remove('on'); }
    } else dBuf=await dubSynth(slots, under, underVol);
    $('#dRoman').innerHTML=slots.map(s=>esc(s.words.map(w=>w.al).join(' '))).join(' · ');
    drawWave($('#waveD'),dBuf,-1);
    st.textContent=`${fmtS(dBuf.duration)} · ${slots.length} phrase${slots.length>1?'s':''} ${timed?'placed on the original’s timing':'matched to the original’s rhythm'} · ${how} · made in ${fmtS((performance.now()-t0)/1000)}`;
  }catch(err){ st.textContent=''; toast(err.message||'The conversion failed.'); }
  finally{ btn.disabled=false; $('#dTranscribe').disabled=false; }
});
$('#dPlay').addEventListener('click',()=>dBuf&&play(dBuf,$('#waveD')));
$('#dStop').addEventListener('click',stopAudio);
$('#dSave').addEventListener('click',()=>dBuf&&exportAudio(dBuf, slug(L.name)+'-'+slug(track.name.replace(/\.[^.]+$/,'')), $('#dStatus')));
$('#dSaveMp3').addEventListener('click',()=>dBuf&&exportMp3(dBuf, slug(L.name)+'-'+slug(track.name.replace(/\.[^.]+$/,'')), $('#dStatus')));

/* ---------- UI: script ---------- */
let selK=null, cur=null;
function renderGlyphs(){
  const inv=PAL.filter(p=>L.inv.includes(p.k)); if(!selK||!L.inv.includes(selK)) selK=inv[0]?.k;
  $('#glyphs').innerHTML=inv.map(p=>`<button class="gcell${p.k===selK?' sel':''}" data-k="${p.k}" aria-label="Letter for ${p.k}"><svg viewBox="-14 -14 128 128">${glyphInner(p.k)}</svg><span>${p.k} /${p.ipa}/</span></button>`).join('');
  drawEditor(); refreshFontPreview();
}
$('#glyphs').addEventListener('click',e=>{ const b=e.target.closest('.gcell'); if(!b) return; selK=b.dataset.k; $$('.gcell').forEach(x=>x.classList.toggle('sel',x===b)); const fold=cv.closest('details'); if(fold) fold.open=true; drawEditor(); });
const cv=$('#gCanvas');
function drawEditor(){
  const g=cv.getContext('2d'); const W=cv.width, sc=W/150, cs=getComputedStyle(document.body);
  g.clearRect(0,0,W,W); g.save(); g.scale(sc,sc); g.translate(25,25);
  g.fillStyle='#929399'; g.globalAlpha=.5;
  for(const x of [10,30,50,70,90]) for(const y of [10,30,50,70,90]){ g.beginPath(); g.arc(x,y,.9,0,7); g.fill(); }
  g.globalAlpha=.25; g.fillRect(-25,90,150,.4); g.globalAlpha=1;
  g.strokeStyle=g.fillStyle='#e4e4e1';
  if(selK) g.fill(new Path2D(glyphD(selK)));
  if(cur){ g.strokeStyle='#39ff88'; g.lineWidth=Math.max(2,L.weight*.6); g.lineCap=g.lineJoin='round'; g.beginPath(); cur.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1])); g.stroke(); }
  g.restore();
  $('#eKey').textContent=selK||''; $('#eIpa').textContent=selK?'/'+PM[selK].ipa+'/ · '+PM[selK].h.replace(/<\/?b>/g,''):'';
}
const toG=e=>{ const r=cv.getBoundingClientRect(); return [ (e.clientX-r.left)/r.width*150-25, (e.clientY-r.top)/r.height*150-25 ]; };
const snapP=p=>[Math.min(90,Math.max(10,Math.round((p[0]-10)/20)*20+10)), Math.min(90,Math.max(10,Math.round((p[1]-10)/20)*20+10))];
cv.addEventListener('pointerdown',e=>{ if(!selK) return; cv.setPointerCapture(e.pointerId); let p=toG(e); if($('#snap').checked) p=snapP(p); cur=[p]; drawEditor(); });
cv.addEventListener('pointermove',e=>{ if(!cur) return; let p=toG(e); const snap=$('#snap').checked; if(snap){ p=snapP(p); const l=cur[cur.length-1]; if(l[0]!==p[0]||l[1]!==p[1]) cur.push(p); } else { const l=cur[cur.length-1]; if(Math.hypot(p[0]-l[0],p[1]-l[1])>2.5) cur.push(p.map(v=>+v.toFixed(1))); } drawEditor(); });
const endStroke=()=>{ if(!cur) return; (L.glyphs[selK]=L.glyphs[selK]||[]).push($('#snap').checked?cur:chaikin(cur,1).map(p=>p.map(v=>+v.toFixed(1)))); cur=null; glyphsChanged(); };
cv.addEventListener('pointerup',endStroke); cv.addEventListener('pointercancel',endStroke);
$('#eUndo').addEventListener('click',()=>{ if(selK&&L.glyphs[selK]){ L.glyphs[selK].pop(); glyphsChanged(); } });
$('#eClear').addEventListener('click',()=>{ if(selK){ L.glyphs[selK]=[]; glyphsChanged(); } });
$('#eRegen').addEventListener('click',()=>{ if(selK){ L.glyphs[selK]=genGlyph(rngFrom(Math.random()*4e9),L.style,makeDNA(L.gseed),L.weird); glyphsChanged(); } });
$('#ePlay').addEventListener('click',async()=>{ if(!selK) return; const w=isV(selK)?selK+selK:'a'+selK+'a'; const {segs,dur}=wordsToSegs([{al:w,end:'.'}],L.voice); play(await render(segs,dur,L.voice)); });
const PENS={round:'round pen',nib:'broad nib',brush:'tapered brush',hair:'hairline'};
function chipGroup(el, opts, cur, onPick){ el.innerHTML=Object.entries(opts).map(([k,v])=>`<button type="button" class="chip lp" data-v="${esc(k)}" aria-pressed="${k===cur}">${esc(v)}</button>`).join('');
  el.onclick=e=>{ const b=e.target.closest('.chip'); if(!b) return; $$('.chip',el).forEach(x=>x.setAttribute('aria-pressed',x===b)); onPick(b.dataset.v); }; }
const markChip=(el,v)=>$$('.chip',el).forEach(x=>x.setAttribute('aria-pressed',x.dataset.v===v));
function glyphsChanged(){ gver++; saveLang(); if(!$('#v-script').hidden) renderGlyphs(); renderTranslate(); }
function regenAlphabet(){ genAlphabet(false); glyphsChanged(); }
chipGroup($('#gStyle'), Object.fromEntries(Object.entries(STYLES).map(([k,v])=>[k,v.toLowerCase()])), L.style, v=>{ L.style=v; regenAlphabet(); });
chipGroup($('#gPen'), PENS, L.pen, v=>{ L.pen=v; glyphsChanged(); });
$('#gRegenAll').addEventListener('click',()=>{ L.gseed=Math.floor(Math.random()*4294967295); syncSliders(); regenAlphabet(); });
$('#gSurprise').addEventListener('click',()=>{ const r=Math.random; L.gseed=Math.floor(r()*4294967295); L.style=pick(r,Object.keys(STYLES)); L.pen=pick(r,['round','nib','brush','hair','brush','nib']); L.weird=+(r()*.85).toFixed(2); L.slant=+((r()-.5)*.6).toFixed(2); L.weight=+(4+r()*11).toFixed(1); syncSliders(); regenAlphabet(); toast(STYLES[L.style]+', '+PENS[L.pen]); });
$('#fontName').addEventListener('input',refreshFontPreview);
// opentype.js writes OpenType/CFF outlines, so the honest extension is .otf.
// Inside a claude.ai artifact the download allowlist has no .otf, so it falls back to .ttf there.
const FONT_EXT = (window.claude && window.claude.use) ? 'ttf' : 'otf';
$('#fSave').textContent=`save font (.${FONT_EXT})`;
$('#fSave').addEventListener('click',async()=>{ try{ const {font,fam}=buildFont(); await saveFile(slug(fam)+'.'+FONT_EXT, font.toArrayBuffer()); }catch(e){ toast(e.message); } });
$('#fChart').addEventListener('click',()=>{
  const inv=PAL.filter(p=>L.inv.includes(p.k)); const cols=8, cw=130, ch=170, rows=Math.ceil(inv.length/cols);
  const ink='#151A23';
  const cells=inv.map((p,i)=>{ const x=(i%cols)*cw+20, y=Math.floor(i/cols)*ch+90; return `<g transform="translate(${x} ${y})"><g transform="translate(15 0) scale(.8)" color="${ink}">${glyphInner(p.k)}</g><text x="55" y="118" text-anchor="middle" font-family="Charis SIL, Georgia, serif" font-size="22" fill="${ink}">${esc(p.k)}</text><text x="55" y="140" text-anchor="middle" font-family="Charis SIL, Georgia, serif" font-size="14" fill="#596170">/${esc(p.ipa)}/</text></g>`; }).join('');
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${cols*cw+40}" height="${rows*ch+110}" viewBox="0 0 ${cols*cw+40} ${rows*ch+110}"><rect width="100%" height="100%" fill="#F8F9F4"/><text x="20" y="50" font-family="Georgia, serif" font-size="32" font-weight="700" fill="${ink}">${esc(L.name)} alphabet</text>${cells}</svg>`;
  saveFile(slug(L.name)+'-alphabet.svg', svg);
});

/* ---------- voice + word sliders ---------- */
const pct=v=>Math.round(v*100)+'%';
const vs=(id,key,f)=>['#v'+id,'#o'+id,()=>L.voice[key],v=>L.voice[key]=v,f];
const SL=[vs('Pitch','pitch',v=>v+' Hz'),vs('Speed','speed',v=>v.toFixed(2)+'×'),vs('Formant','formant',v=>v<.8?'giant':v<.92?'large':v<1.1?'human':v<1.35?'small':'tiny'),
 vs('Breath','breath',v=>v>.9?'whisper':pct(v)),vs('Jitter','jitter',pct),vs('Growl','growl',pct),vs('Choir','choir',v=>v<.05?'one':v<.55?'a few':v<.8?'chord':'swarm'),vs('Ring','ring',pct),vs('Vib','vib',pct),vs('Space','space',v=>v<.05?'dry':v<.4?'room':v<.75?'hall':'cavern'),
 ['#wOnset','#oOnset',()=>L.onset,v=>L.onset=v,pct,1],['#wCoda','#oCoda',()=>L.coda,v=>L.coda=v,pct,1],['#wCluster','#oCluster',()=>L.cluster,v=>L.cluster=v,pct,1],['#wMax','#oMax',()=>L.maxSyl,v=>L.maxSyl=v,v=>v,1],
 ['#gWeird','#oWeird',()=>L.weird,v=>L.weird=v,v=>v<.15?'tame':v<.4?'odd':v<.7?'strange':'unhinged',2],['#gSlant','#oSlant',()=>L.slant,v=>L.slant=v,v=>Math.round(Math.atan(v)*180/Math.PI)+'°',3],['#gWeight','#oWeight',()=>L.weight,v=>L.weight=v,v=>v,3]];
SL.forEach(([i,o,get,set,f,kind])=>{ $(i).addEventListener('input',e=>{ set(+e.target.value); $(o).textContent=f(+e.target.value);
  if(kind===1) changed(); else if(kind===2){ regenAlphabet(); } else if(kind===3){ saveLang(); glyphsChanged(); } else { tBuf=null; markChip($('#vPreset'),''); sideLcd(); saveLang(); } setPct(e.target); }); });
const presetOf=()=>Object.keys(PRESETS).find(n=>Object.keys(PRESETS[n]).every(k=>Math.abs(PRESETS[n][k]-L.voice[k])<1e-6))||'';
chipGroup($('#vPreset'), Object.fromEntries(Object.keys(PRESETS).map(n=>[n,n.toLowerCase()])), '', n=>{ L.voice={...L.voice,...PRESETS[n]}; tBuf=null; saveLang(); syncSliders(); playSample(); });
const ENGINES={synth:'origin', ...Object.fromEntries(Object.entries(NATURAL).map(([k,v])=>[k,v.label]))};
function renderEngine(){ const cur=NATURAL[L.engine]?L.engine:'synth'; markChip($('#vEngine'),cur);
  $('#voiceNudge').hidden=cur!=='synth'; if(cur==='synth') naturalStatus(''); }
chipGroup($('#vEngine'), ENGINES, 'synth', async id=>{ L.engine=id; tBuf=null; saveLang(); renderEngine(); sideLcd();
  if(NATURAL[id]){ try{ await piperVoice(id); playSample(); }catch(e){ toast(e.message); L.engine='synth'; saveLang(); renderEngine(); } } else playSample(); });
$$('#vEngine .chip').forEach(b=>{ b.title=NATURAL[b.dataset.v] ? NATURAL[b.dataset.v].about+' · '+NATURAL[b.dataset.v].mb+' MB once' : 'instant · the built-in synthesizer: the most alien, the least real'; });
// the speak section's nudge: one tap switches from the synthesizer to a quick recorded voice (one already downloaded, if there is one)
$('#nudgeTry').addEventListener('click',()=>{ const quick=['kristin','norman','harri','anna'], have=quick.filter(id=>voiceReady[id]), id=pick(Math.random, have.length?have:quick); $(`#vEngine .chip[data-v="${id}"]`).click(); });
const setPct=el=>el.style.setProperty('--pct',((el.value-el.min)/(el.max-el.min)*100)+'%');
$$('input.fad').forEach(el=>{ setPct(el); el.addEventListener('input',()=>setPct(el)); });
let statusHold=0;
function sideLcd(){ applyHead(); $('#ledMine').classList.toggle('on',Object.keys(recs).length>0); if(lastT) updateEst(); if(Date.now()<statusHold) return; const el=$('#statusLine'); if(!el) return; const c=C().length,v=V().length; const pr=presetOf();
  el.textContent=`${(L.name||'unnamed').toLowerCase()} · ${c+v} sounds · ${v} vowels · voice ${pr?pr.toLowerCase():'custom'} · script ${(STYLES[L.style]||'').split(':')[0].toLowerCase()}`;
  $('#ledMine').classList.toggle('on',Object.keys(recs).length>0); }
function setStatus(msg){ $('#statusLine').textContent=msg; statusHold=Date.now()+4000; setTimeout(sideLcd,4100); }
// short on purpose: a slower voice is busy while it makes this, and anything asked for meanwhile waits behind it
async function playSample(){ if(playSample.busy) return; playSample.busy=true; const k=$('#vTry'), was=k.innerHTML; k.textContent=NATURAL[L.engine]&&NATURAL[L.engine].kind==='kokoro' ? 'making the sample (this voice is slow)…' : 'making the sample…';
  try{ const words=tokensToWords(translate('Hello, traveler. Will you speak with us?',false)); getCtx(); play(await speakWords(words)); }
  catch(e){ toast(e&&e.message||'The sample didn’t play.'); }
  finally { playSample.busy=false; k.innerHTML=was; } }
$('#vTry').addEventListener('click',playSample);
function syncSliders(){ renderAccent(); SL.forEach(([i,o,get,,f])=>{ $(i).value=get(); $(o).textContent=f(get()); setPct($(i)); }); markChip($('#gStyle'),L.style); markChip($('#gPen'),L.pen); renderEngine(); markChip($('#vPreset'),presetOf()); sideLcd(); $('#langName').value=L.name; $('#fontName').value=L.name+' Script'; $('#gId').textContent='Alphabet #'+(L.gseed>>>0).toString(36).toUpperCase(); }

/* ---------- state changes ---------- */
let rerenderT=0;
function changed(){ wordCache=new Map(); tBuf=null; saveLang(); updateCounts(); clearTimeout(rerenderT); rerenderT=setTimeout(()=>{ renderTranslate(); renderAffixes(); if(!$('#v-words').hidden) renderLex(); if(!$('#v-script').hidden) renderGlyphs(); },120); }
$('#langName').addEventListener('input',e=>{ L.name=e.target.value; saveLang(); updateCounts(); });

function renderAccent(){ const el=$('#accentInfo'); if(!el) return; const A=acc(), stress={first:'stress on the first syllable',last:'stress on the last syllable',penult:'stress on the second-to-last syllable',even:'every syllable even'}[A.stress];
  el.innerHTML=`<span><b>${MELODY[A.melody]}</b> melody${A.melody==='flat'?'':', '+(A.range>1.5?'wide':A.range<.95?'narrow':'medium')+' range'} · ${stress} · ${A.longV?'long and short vowels':'vowels all one length'} · ${A.gap<.8?'words run together':A.gap>1.35?'words set apart':'even spacing'} · ${A.tempo>1.08?'quick':A.tempo<.93?'slow':'steady'}</span>`; }
$('#accentNew').addEventListener('click',()=>{ L.accent=makeAccent(rngFrom(Math.random()*4e9)); tBuf=null; saveLang(); renderAccent(); sideLcd(); playSample(); });
const START_VOICE='Elder giant';
function randomVoice(r){ const speechy=['Natural voice','Soft and breathy','Giant','Small creature','Ethereal','Gravel beast','Hive choir','Deep ocean','Glass child','Stone elder','Wind spirit','Cathedral','Dream voice','Throat singer','Swarm queen','Little bell']; const base=PRESETS[pick(r, r()<.8?speechy:Object.keys(PRESETS))]; const j=(v,a,lo,hi)=>+Math.max(lo,Math.min(hi,v+(r()-.5)*a)).toFixed(2);
  return {...base,pitch:Math.round(j(base.pitch,90,45,400)),formant:j(base.formant,.35,.6,1.7),breath:j(base.breath,.3,0,1),jitter:j(base.jitter,.3,0,1),vib:j(base.vib,.3,0,1)}; }
function randomLanguage(){
  const r=rngFrom(Math.random()*4e9);
  // common sounds turn up far more often than rare ones, as they do across real languages
  const vPool=['a','a','i','i','u','u','e','e','o','o','ë','ä','y','ö','ů']; const nv=4+Math.floor(r()*4); const vs=new Set(['a','i','u']); while(vs.size<nv) vs.add(pick(r,vPool));
  const cPool='t t k k m m n n s s l l p p d d g b r r j j w h v z š f ŋ x ř ž þ q ł c ʔ'.split(' '); const nc=8+Math.floor(r()*10);
  const cs=new Set(['t','k','m','n'].filter(()=>r()<.85)); while(cs.size<nc) cs.add(pick(r,cPool));
  const keep={head:L.head, engine:L.engine, voice:{...L.voice}};   // the creature stays: same head, same voice. Only its language changes.
  L={ name:'', seed:Math.floor(r()*1e6), inv:[...vs,...cs], onset:.75+r()*.25, coda:r()*.4, cluster:r()<.6?0:r()*.2, maxSyl:3+Math.floor(r()*2),
    voice:keep.voice, engine:keep.engine, accent:makeAccent(r),
    style:pick(r,Object.keys(STYLES)), pen:pick(r,['round','nib','brush','hair']), weird:+(r()*.7).toFixed(2), slant:+((r()-.5)*.5).toFixed(2), gseed:Math.floor(r()*4294967295), weight:+(5+r()*9).toFixed(1), glyphs:{}, lexicon:{}, head:keep.head };
  L.onset=+L.onset.toFixed(2); L.coda=+L.coda.toFixed(2); L.cluster=+L.cluster.toFixed(2);
  wordCache=new Map(); L.name=cap(root('our language people').slice(0,9)) || 'Unnamed';
  genAlphabet(false);
}
$('#btnRandom').addEventListener('click',async()=>{ randomLanguage(); await useLang(L,{fresh:true,recsObj:{}}); toast(`${L.name}: ${L.inv.length} sounds, ${MELODY[acc().melody]} speech. The others are in the library.`); });


/* ---------- library: every language is kept in this browser ---------- */
const LIB_KEY='xenoglot-v1-library', RECS_KEY=id=>'xenoglot-v1-recs-'+id;
const newId=()=>Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4);
let lib={current:null, langs:{}};
function readLib(){ try{ const o=JSON.parse(store.get(LIB_KEY)||'null'); if(o&&o.langs) lib=o; }catch(e){} }
function writeLib(){ if(!store.set(LIB_KEY,JSON.stringify(lib))) toast('This browser’s storage is full. Save your languages as files to keep them.'); }
let saveT=0;
function saveLangNow(){ clearTimeout(saveT); if(!L.id) L.id=newId(); lib.langs[L.id]={...L, updated:Date.now()}; lib.current=L.id; writeLib(); renderLib(); }
function saveLang(){ delete L.auto; clearTimeout(saveT); saveT=setTimeout(saveLangNow,300); }   // any change you make turns a language the page made up into one of yours
function normaliseLang(o){ if(!o||!Array.isArray(o.inv)||!o.voice) throw new Error('not a language');
  const n={...structuredClone(DEFAULT),...structuredClone(o)}; n.voice={...DEFAULT.voice,...o.voice}; n.inv=n.inv.filter(k=>PM[k]); if(!n.inv.some(isV)) n.inv.push('a');
  if(!o.accent||typeof o.accent!=='object') n.accent=String(n.seed)===String(DEFAULT.seed)&&n.name===DEFAULT.name ? {...ACCENT0} : makeAccent(rngFrom(hash(String(n.seed)+'|accent')));   // languages from before accents get one of their own, the same every time
  else n.accent={...ACCENT0,...o.accent};
  if(typeof n.head!=='number') n.head=hash(String(n.seed)+'|head');   // older languages get a head of their own, the same one every time
  n.glyphs=n.glyphs&&typeof n.glyphs==='object'?n.glyphs:{}; n.lexicon=n.lexicon&&typeof n.lexicon==='object'?n.lexicon:{}; delete n.recordings; delete n.xenoglot; delete n.updated; delete n.auto; return n; }   /* a language that arrives by link or file is never one the page made up */
async function useLang(o,{recsObj=null,fresh=false}={}){
  stopAudio(); L=normaliseLang(o); if(fresh||!L.id) L.id=newId(); wordCache=new Map(); genAlphabet(true);
  recs={}; let rc=recsObj; if(!rc){ try{ rc=JSON.parse(store.get(RECS_KEY(L.id))||'null'); }catch(e){} }
  if(rc&&Object.keys(rc).length){ getCtx(); await loadRecs(rc); }
  saveRecs(); tBuf=null; syncSliders(); renderAll(); captureDefaults(); saveLangNow();
}
function renderLib(){ const sel=$('#libSel'); if(!sel) return; const items=Object.values(lib.langs).sort((a,b)=>(b.updated||0)-(a.updated||0));
  sel.innerHTML=items.map(l=>`<option value="${esc(l.id)}"${l.id===L.id?' selected':''}>${esc(l.name||'unnamed')} · ${l.inv.length} sounds</option>`).join('');
  $('#libCount').textContent=items.length+' saved'; }
$('#libSel').addEventListener('change',e=>{ const o=lib.langs[e.target.value]; if(o) useLang(o).then(()=>toast('Switched to '+L.name)); });
$('#libDup').addEventListener('click',async()=>{ const rc=Object.fromEntries(Object.entries(recs).map(([k,v])=>[k,v.b64])); await useLang({...L,name:(L.name||'Unnamed')+' 2'},{fresh:true,recsObj:rc}); toast('Made a copy: '+L.name); });
let delArm=0;
$('#libDel').addEventListener('click',async e=>{ const b=e.currentTarget;
  if(Date.now()>delArm){ delArm=Date.now()+3000; b.textContent='really delete?'; setTimeout(()=>{ b.textContent='delete'; },3000); return; }
  delArm=0; b.textContent='delete'; const gone=L.name; delete lib.langs[L.id]; try{ localStorage.removeItem(RECS_KEY(L.id)); }catch(err){}
  const next=Object.values(lib.langs).sort((a,b)=>(b.updated||0)-(a.updated||0))[0];
  if(next) await useLang(next); else { randomLanguage(); await useLang(L,{fresh:true}); }
  toast('Deleted '+gone); });

/* ---------- files ---------- */
function langFile(){ return {xenoglot:1, ...L, recordings:Object.fromEntries(Object.entries(recs).map(([k,v])=>[k,v.b64]))}; }
async function importFile(f){ try{ const o=JSON.parse(await f.text()); const known=o.id&&lib.langs[o.id]; await useLang(o,{recsObj:o.recordings||{},fresh:!o.id}); toast((known?'Updated ':'Opened ')+L.name); location.hash=location.hash||'translate'; }
  catch(err){ toast('That file isn’t a Xenoglot language. Language files end in .json and come from the save button.'); } }
$('#btnSave').addEventListener('click',()=>saveFile(slug(L.name)+'.json', JSON.stringify(langFile(),null,1)));
$('#btnLoad').addEventListener('click',()=>$('#fileLoad').click());
$('#fileLoad').addEventListener('change',async e=>{ const f=e.target.files[0]; e.target.value=''; if(f) await importFile(f); });

/* ---------- share links: the whole language packed into the address ---------- */
const b64uEnc=u8=>{ let s=''; for(let i=0;i<u8.length;i+=0x8000) s+=String.fromCharCode.apply(null,u8.subarray(i,i+0x8000)); return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); };
const b64uDec=s=>{ s=s.replace(/-/g,'+').replace(/_/g,'/'); while(s.length%4) s+='='; const b=atob(s), u=new Uint8Array(b.length); for(let i=0;i<b.length;i++) u[i]=b.charCodeAt(i); return u; };
async function packLang(){ const o={...L}; delete o.id; delete o.src;
  o.glyphs=Object.fromEntries(Object.entries(L.glyphs).filter(([k])=>L.inv.includes(k)).map(([k,g])=>[k,g.map(s=>s.map(p=>[Math.round(p[0]),Math.round(p[1])]))]));
  const bytes=new TextEncoder().encode(JSON.stringify(o));
  if(window.CompressionStream){ const st=new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw')); return 'z'+b64uEnc(new Uint8Array(await new Response(st).arrayBuffer())); }
  return 'j'+b64uEnc(bytes); }
async function unpackLang(s){ const bytes=b64uDec(s.slice(1)); let txt;
  if(s[0]==='z'){ const st=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw')); txt=await new Response(st).text(); } else txt=new TextDecoder().decode(bytes);
  return JSON.parse(txt); }
$('#btnShare').addEventListener('click',async()=>{ if(window.claude&&window.claude.use){ toast('Share links work on the hosted site (xenoglot.jas.black). Here, use save ↓ and send the .json file.'); return; } const url=location.origin+location.pathname+'?l='+(await packLang()); const out=$('#shareOut');
  out.value=url; out.hidden=false;
  try{ await navigator.clipboard.writeText(url); toast('Share link copied. Anyone who opens it gets '+L.name+' (recorded voice not included).'); }
  catch(e){ out.focus(); out.select(); toast('Link ready below. Select it and copy.'); } });

/* ---------- example languages (served with the site) ---------- */
async function loadExamples(){ try{ const r=await fetch('examples/index.json',{cache:'no-cache'}); if(!r.ok) return; const list=await r.json(); if(!list.length) return;
  $('#exList').innerHTML=list.map(x=>`<button type="button" class="chip" data-f="${esc(x.file)}" title="${esc(x.blurb||'')}">${esc(x.name)}</button>`).join(''); $('#exWrap').hidden=false;
  $('#exList').onclick=async e=>{ const b=e.target.closest('.chip'); if(!b) return; const src='example:'+b.dataset.f;
    const have=Object.values(lib.langs).find(l=>l.src===src); if(have){ await useLang(have); toast('Switched to '+L.name); return; }
    try{ const o=await (await fetch('examples/'+b.dataset.f)).json(); o.src=src; await useLang(o,{fresh:true,recsObj:o.recordings||{}}); toast('Opened example: '+L.name); }catch(err){ toast('That example couldn’t be loaded.'); } };
  }catch(e){} }

/* ---------- drop a language file or an audio track anywhere ---------- */
document.addEventListener('dragover',e=>{ if([...(e.dataTransfer?.types||[])].includes('Files')){ e.preventDefault(); document.body.classList.add('dropping'); } });
document.addEventListener('dragleave',e=>{ if(!e.relatedTarget) document.body.classList.remove('dropping'); });
document.addEventListener('drop',e=>{ document.body.classList.remove('dropping'); const f=e.dataTransfer?.files?.[0]; if(!f) return; e.preventDefault();
  if(/\.json$/i.test(f.name)||f.type==='application/json') importFile(f);
  else if(/^(audio|video)\//.test(f.type)||/\.(mp3|wav|m4a|ogg|oga|webm|flac|aac|mp4|mov)$/i.test(f.name)){ location.hash='audio'; loadTrack(f); }
  else toast('Drop a language file (.json) or an audio track.'); });

/* ---------- the monitor: a new head, and video of it speaking, recorded straight off the screen ---------- */
// a new creature: another head and another voice character, speaking the same language
$('#headNew').addEventListener('click',()=>{ const r=rngFrom(Math.random()*4e9); L.head=Math.floor(r()*4294967295); L.voice=randomVoice(r); tBuf=null; applyHead(); syncSliders(); saveLang(); playSample(); });
// H.264 + AAC in .mp4 plays everywhere (phones, WhatsApp, Instagram); browsers without that encoder fall back to .webm
const VIDEO_TYPES=[['video/mp4;codecs="avc1.42E01E,mp4a.40.2"','mp4'],['video/mp4;codecs="avc1.640028,mp4a.40.2"','mp4'],['video/webm;codecs=vp9,opus','webm'],['video/webm;codecs=vp8,opus','webm'],['video/webm','webm'],['video/mp4','mp4']];
const canShareFile=f=>{ try{ return !!navigator.canShare && navigator.canShare({files:[f]}); }catch(e){ return false; } };
let videoKeep=null, videoBusy=false;
// Social formats. Phones and slower machines record at 720 wide, others at 1080.
const VFMT={'9:16':[9,16],'4:5':[4,5]}; let vfmt=VFMT[store.get('xenoglot-v1-vfmt')]?store.get('xenoglot-v1-vfmt'):'9:16';
const markFmt=()=>$$('#vFmt .chip').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===vfmt));
$('#vFmt').addEventListener('click',e=>{ const b=e.target.closest('.chip'); if(!b) return; vfmt=b.dataset.v; store.set('xenoglot-v1-vfmt',vfmt); markFmt(); }); markFmt();
const videoSize=()=>{ const w=(matchMedia('(max-width:850px)').matches||(navigator.hardwareConcurrency||4)<=4)?720:1080, [a,b]=VFMT[vfmt]; return [w, Math.round(w*b/a/2)*2]; };
async function recordVideo(o={}){ if(videoBusy||!head) return; const st=$('#headStatus'), cv=$('#headCanvas'), key=o.subsOnly?$('#ovSubs'):$('#headVideo'), was=head.plate();
  const ty=window.MediaRecorder && cv.captureStream ? VIDEO_TYPES.find(t=>MediaRecorder.isTypeSupported(t[0])) : null;
  if(!ty){ toast('This browser can’t record video. Try Chrome, Edge or Safari.'); return; }
  videoBusy=true; key.disabled=true; let timer=0;
  try{ st.textContent='getting the speech ready…';
    const buf=(!$('#v-audio').hidden && dBuf) ? dBuf : await getTBuf();
    const size=videoSize(); head.setFormat(size); if(o.subsOnly) head.setPlate('subs'); await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));   // the monitor becomes the video frame while it records
    const ctx=getCtx(), dest=ctx.createMediaStreamDestination(), stream=new MediaStream([...cv.captureStream(30).getVideoTracks(), ...dest.stream.getAudioTracks()]);
    const rec=new MediaRecorder(stream,{mimeType:ty[0], videoBitsPerSecond:size[0]>=1080?8e6:5e6, audioBitsPerSecond:160000}), chunks=[]; rec.ondataavailable=e=>e.data.size&&chunks.push(e.data);
    const stopped=new Promise(r=>rec.onstop=r); rec.start(); key.classList.add('recording'); $('#ledRec').classList.add('on'); const t0=performance.now();
    timer=setInterval(()=>{ st.textContent=`recording video… ${fmtS((performance.now()-t0)/1000)} of ${fmtS(buf.duration+.8)}`; },250);
    const withVid=!o.subsOnly && back.vid; if(withVid && back.own){ backAudio(); back.gain.connect(dest); }
    if(o.subsOnly){} else if(withVid) await backStart(); else await new Promise(r=>setTimeout(r,350));   // subtitles alone start at once, to line up with the audio file; your video starts with its own lead-in; the creature gets a beat at rest
    speechMute=!!(withVid&&back.own); await new Promise(done=>play(buf, !$('#v-translate').hidden?$('#waveT'):!$('#v-audio').hidden?$('#waveD'):null, dest, done));
    if(withVid){ const v=back.vid, until=performance.now()+30000; while(!v.ended && !v.paused && performance.now()<until) await new Promise(r=>setTimeout(r,100)); }   // and runs to the end of your clip (up to 30 s more)
    else await new Promise(r=>setTimeout(r,o.subsOnly?150:450));
    rec.stop(); await stopped; if(withVid && back.own) back.gain.disconnect(dest); backPause();
    head.setFormat(null); head.setPlate(was, back.vid); const blob=new Blob(chunks,{type:ty[0].split(';')[0]}), name=slug(L.name)+(o.subsOnly?'-subtitles':withVid?'-'+slug(back.name.replace(/\.[^.]+$/,'')):'')+'-'+vfmt.replace(':','x')+'.'+ty[1];
    videoKeep=new File([blob],name,{type:blob.type}); st.textContent=`video ready · ${vfmt} · ${size[0]}×${size[1]} · ${(blob.size/1e6).toFixed(1)} MB · .${ty[1]}`+(ty[1]==='mp4'?'':' (this browser can’t make .mp4: use Chrome, Edge or Safari for Instagram)');
    $('#headShare').hidden=!canShareFile(videoKeep);
    await saveFile(name, blob);
  }catch(e){ st.textContent=''; head.setFormat(null); head.setPlate(was, back.vid); toast(e.message||'The video couldn’t be recorded.'); }
  finally{ clearInterval(timer); key.classList.remove('recording'); $('#ledRec').classList.remove('on'); videoBusy=false; key.disabled=false; } }
$('#headVideo').addEventListener('click',()=>recordVideo());

/* ---------- subtitles for your own video: a clip (made elsewhere, from this speech) plays behind the subtitles ---------- */
const back={vid:null, url:'', name:'', src:null, gain:null, own:false, offset:0};
function backPause(){ if(back.vid) back.vid.pause(); }
// the clip's own sound, routed through the page's audio so a recording can carry it (made once per clip)
function backAudio(){ getCtx(); if(!back.src){ back.src=actx.createMediaElementSource(back.vid); back.gain=actx.createGain(); back.src.connect(back.gain).connect(actx.destination); } }
// your clip starts from its beginning; the speech comes in `offset` seconds later (or that much before, if negative)
async function backStart(){ const v=back.vid; if(!v) return; v.pause(); v.currentTime=Math.max(0,-back.offset); v.muted=!back.own; if(back.own){ backAudio(); back.gain.gain.value=1; } else if(back.gain) back.gain.gain.value=0;
  try{ await v.play(); }catch(e){} if(back.offset>0) await new Promise(r=>setTimeout(r,back.offset*1000)); }
async function addBack(file){ if(!file) return; if(back.vid) clearBack();
  const v=document.createElement('video'); v.playsInline=true; v.muted=true; v.preload='auto'; v.crossOrigin='anonymous'; back.url=URL.createObjectURL(file); v.src=back.url;
  try{ await new Promise((res,rej)=>{ v.onloadeddata=res; v.onerror=()=>rej(new Error('That video won’t play in this browser. Try an .mp4.')); }); }catch(e){ URL.revokeObjectURL(back.url); toast(e.message); return; }
  back.vid=v; back.name=file.name; back.src=null; back.gain=null; v.currentTime=0; head&&head.setPlate('video',v);
  const ar=v.videoWidth/v.videoHeight; vfmt=Math.abs(ar-9/16)<Math.abs(ar-4/5)?'9:16':'4:5'; store.set('xenoglot-v1-vfmt',vfmt); markFmt();   // the video shape follows your clip
  $('#ovName').textContent=`${file.name} · ${fmtS(v.duration)} · ${v.videoWidth}×${v.videoHeight}`; $('#ovClear').hidden=false; $('#ovOpts').hidden=false;
  toast('Your video is behind the subtitles now. Press speak to see them together, or save video.'); }
function clearBack(){ backPause(); if(back.src){ try{ back.src.disconnect(); }catch(e){} } if(back.url) URL.revokeObjectURL(back.url); back.vid=null; back.src=null; back.gain=null; back.name='';
  head&&head.setPlate(null); $('#ovName').textContent=''; $('#ovClear').hidden=true; $('#ovOpts').hidden=true; }
$('#ovAdd').addEventListener('click',()=>$('#ovFile').click());
$('#ovFile').addEventListener('change',e=>{ addBack(e.target.files[0]); e.target.value=''; });
$('#ovClear').addEventListener('click',clearBack);
$('#ovOffset').addEventListener('input',e=>{ back.offset=+e.target.value; $('#oOvOffset').textContent=(back.offset>0?'+':'')+back.offset.toFixed(2)+' s'; });
$('#ovOwn').addEventListener('change',e=>{ back.own=e.target.checked; });
$('#ovSubs').addEventListener('click',()=>recordVideo({subsOnly:true}));
// subtitles as a file: the same lines as on screen, timed to the speech (shifted by the offset when your video is in)
$('#ovSrt').addEventListener('click',async()=>{ const buf=(!$('#v-audio').hidden && dBuf) ? dBuf : await getTBuf(), segs=(buf.timeline&&buf.timeline.segs)||[], kind=$('#ovSrtKind').value, sh=back.vid?back.offset:0;
  const words=[]; let cur=null; for(const s of segs){ if(s.k&&s.w){ if(!cur){ cur={w:s.w,en:s.en||'',t0:s.t,t1:s.t+s.d}; words.push(cur); } else cur.t1=s.t+s.d; } else cur=null; }
  const lines=[]; let ln=[]; words.forEach((w,i)=>{ ln.push(w); const nx=words[i+1], len=ln.reduce((a,x)=>a+Math.max(x.w.length,x.en.length)+1,0); if(!nx||ln.length>=6||len>34||nx.t0-w.t1>.3){ lines.push(ln); ln=[]; } });
  const ts=t=>{ t=Math.max(0,t+sh); const h=Math.floor(t/3600), m=Math.floor(t%3600/60), s=Math.floor(t%60), ms=Math.round((t%1)*1000)%1000; return [h,m,s].map(x=>String(x).padStart(2,'0')).join(':')+','+String(ms).padStart(3,'0'); };
  const body=lines.map((l,i)=>{ const en=l.map(w=>w.en.toLowerCase()).join(' '), al=l.map(w=>w.w).join(' '); return `${i+1}\n${ts(l[0].t0)} --> ${ts(l[l.length-1].t1+.15)}\n${kind==='en'?en:kind==='al'?al:en+'\n'+al}\n`; }).join('\n');
  if(!lines.length){ toast('Nothing to subtitle yet. Type some English first.'); return; }
  await saveFile(slug(L.name)+'-subtitles'+(kind==='both'?'':'-'+(kind==='en'?'english':'alien'))+'.srt', new Blob([body],{type:'text/plain'}));
  if(kind==='al') toast('Tip: install this language’s font (script tab) and set it as the subtitle font, and they show in its own letters.'); });
$('#headShare').addEventListener('click',async()=>{ if(!videoKeep) return; try{ await navigator.share({files:[videoKeep], title:L.name+' (Xenoglot)'}); }catch(e){ if(!e||e.name!=='AbortError') toast('Sharing didn’t work here. The video was saved instead.'); } });

/* ---------- first visit: a short welcome; on phones the language library folds away ---------- */
if(!store.get('xenoglot-v1-seen')) $('#intro').hidden=false;
const closeIntro=()=>{ $('#intro').hidden=true; store.set('xenoglot-v1-seen','1'); };
$('#introClose').addEventListener('click',closeIntro);
$('#introSpeak').addEventListener('click',()=>{ closeIntro(); location.hash='translate'; speakNow(); });
const setLib=open=>{ $('.langpanel').classList.toggle('open',open); $('#langToggle').setAttribute('aria-expanded',open); };
$('#langToggle').addEventListener('click',()=>setLib(!$('.langpanel').classList.contains('open')));
$$('.steps a').forEach(a=>a.addEventListener('click',()=>setLib(false)));   // picking a tab closes the library, even the tab already open

/* ---------- routing ---------- */
const VIEWS=['translate','sounds','words','audio','script']; const visited=new Set();
function route(){ const v=VIEWS.includes(location.hash.slice(1))?location.hash.slice(1):'translate'; // home is where the language gets used
  const was=VIEWS.find(x=>!$('#v-'+x).hidden);
  VIEWS.forEach(x=>$('#v-'+x).hidden=x!==v); $$('.steps a').forEach(a=>a.toggleAttribute('aria-current',false)); $(`.steps a[data-v="${v}"]`).setAttribute('aria-current','page');
  visited.add(v); document.body.dataset.view=v;
  if(was && was!==v) window.scrollTo({top:0});
  if(v==='words') renderLex(); if(v==='script') renderGlyphs(); if(v==='translate') renderTranslate(); }
window.addEventListener('hashchange',()=>{ setLib(false); route(); });   // moving to another section closes the library; loading a language doesn't
function renderAll(){ renderPalette(); renderAffixes(); renderTranslate(); route(); }

/* ---------- theme ---------- */
function setUI(m){ document.body.dataset.ui=m; document.documentElement.style.background=m==='light'?'#e7e7e4':'#121314'; document.documentElement.style.colorScheme=m; store.set('xenoglot-ui',m); drawWave($('#waveT'),tBuf,-1); if(dBuf) drawWave($('#waveD'),dBuf,-1); if(!$('#v-script').hidden) drawEditor(); }
$('#theme').addEventListener('click',()=>setUI(document.body.dataset.ui==='light'?'dark':'light'));
setUI(store.get('xenoglot-ui')==='light'?'light':'dark');

/* ---------- family behaviours: version on hover, slider fill, right-click reset ---------- */
const VERSION=document.body.dataset.version||'1.0.0'; $('.brand-ver').textContent='v'+VERSION;
const paintRange=el=>el.style.setProperty('--pct',((el.value-el.min)/((el.max-el.min)||1)*100)+'%');
document.addEventListener('input',e=>{ if(e.target.type==='range') paintRange(e.target); });
const rangeDefaults=new WeakMap();
const captureDefaults=()=>$$('input[type=range]').forEach(el=>{ rangeDefaults.set(el,el.value); paintRange(el); });
document.addEventListener('contextmenu',e=>{ const el=e.target; if(e.defaultPrevented||!(el instanceof HTMLInputElement)||el.type!=='range'||el.disabled) return;
  e.preventDefault(); const d=rangeDefaults.get(el)??el.defaultValue; if(el.value===d) return; el.value=d; el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); });


/* ---------- transport + shortcuts ---------- */
async function speakNow(){ if(playing){ stopAudio(); backPause(); return; } getCtx(); if(!lastT) renderTranslate(); const buf=await getTBuf(); await backStart(); speechMute=!!(back.vid&&back.own); play(buf, $('#v-translate').hidden?false:$('#waveT')); }
$$('[data-proxy]').forEach(b=>b.addEventListener('click',()=>$('#'+b.dataset.proxy).click()));
document.addEventListener('keydown',e=>{ if(e.metaKey||e.ctrlKey||e.altKey) return; const t=e.target; if(t.closest&&t.closest('input,textarea,select,[contenteditable]')) return;
  if(e.code==='Space'){ e.preventDefault(); speakNow(); }
  else if(e.key==='n'||e.key==='N'){ $('#btnRandom').click(); } });

/* ---------- boot ---------- */
$('#e44').innerHTML=ENG44.map(([i,w])=>`<div><span class="ipa">${i}</span><span>${w}</span></div>`).join('');
$('#enText').value=store.get('xenoglot-v1-text')||'The travelers walked slowly into the quiet city. Nobody knew their names, but everyone was watching them.\nAre you coming with us?';
(async()=>{
  readLib();
  const shared=new URLSearchParams(location.search).get('l');
  if(shared){
    try{ const src='link:'+hash(shared); const have=Object.values(lib.langs).find(l=>l.src===src);
      if(have) await useLang(have); else { const o=await unpackLang(shared); o.src=src; await useLang(o,{fresh:true}); }
      toast('Opened shared language: '+L.name); location.hash=location.hash||'translate'; }
    catch(e){ toast('That share link is damaged or cut short. Ask for a fresh one.'); }
    history.replaceState(null,'',location.pathname+location.hash);
  }
  if(!shared||!L.id){ const cur=lib.current&&lib.langs[lib.current];
    if(cur && !cur.auto) await useLang(cur);
    else { for(const id of Object.keys(lib.langs)) if(lib.langs[id].auto){ delete lib.langs[id]; try{ localStorage.removeItem(RECS_KEY(id)); }catch(e){} }   // the last made-up one, never touched, makes way
      const r=rngFrom(Math.random()*4e9); randomLanguage(); L.head=Math.floor(r()*4294967295); L.voice={...PRESETS[START_VOICE]}; L.engine='synth'; await useLang(L,{fresh:true}); L.auto=1; saveLangNow(); } }   // a new creature and language each time, always starting in the same voice
  loadExamples(); await checkVoiceCache();
  if(NATURAL[L.engine] && voiceReady[L.engine]) piperVoice(L.engine).catch(()=>{});   // a recorded voice that is already downloaded starts warming up at once
})();
addEventListener('resize',()=>{ drawWave($('#waveT'),tBuf,-1); if(dBuf) drawWave($('#waveD'),dBuf,-1); });
})();
