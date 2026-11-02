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

/* ---------- language state ---------- */
const DEFAULT = { name:'Velnari', seed: 7741, inv: ['a','e','i','o','u','ë','p','t','k','d','g','m','n','ŋ','s','š','v','z','l','ř','j','x','c'],
  onset:.85, coda:.35, cluster:.12, maxSyl:4, voice:{pitch:150,speed:1,formant:1.12,breath:.3,jitter:.45,growl:0,choir:0,ring:0,vib:.15,space:.25},
  style:'tendril', pen:'brush', weird:.35, slant:.1, gseed:20251102, weight:9, glyphs:{}, lexicon:{} };
const PRESETS = {
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
};
let L = structuredClone(DEFAULT);
let recs = {}; // key -> {buf, b64}
let wordCache = new Map();

function C(){ return L.inv.filter(k => !isV(k)); }
function V(){ return L.inv.filter(isV); }
function clusterSeconds(){ return C().filter(k => 'lrřwj'.includes(k)); }

function makeSyl(r, first, prevEndsV){
  const cs=C(), vs=V(); if (!vs.length) return '';
  let s='';
  const onsetP = cs.length ? L.onset : 0;
  if (r() < onsetP || (!first && prevEndsV && cs.length && r() < .7)) {
    const c1 = pick(r, cs); s += c1;
    const cl = clusterSeconds().filter(k => k !== c1);
    if (cl.length && PM[c1].t !== 'approx' && r() < L.cluster) s += pick(r, cl);
  }
  s += pick(r, vs);
  if (cs.length && r() < L.coda) { const c = pick(r, cs.filter(k => k !== 'ʔ' || cs.length === 1)); if (c) s += c; }
  return s;
}
function makeWord(r, n){ let w=''; for(let i=0;i<n;i++){ w += makeSyl(r, i===0, w ? isV(w[w.length-1]) : false); } return w; }
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
  let s = pick(r, vs); if (cs.length && r() < .75) s += pick(r, cs);
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
function translate(text, keepNames){
  const toks=[]; const re=/([A-Za-z]+(?:['’][A-Za-z]+)*)|(\n)|([.,!?;:]+)|([ \t]+)|(.)/g; let m, sentStart=true;
  while((m=re.exec(text))){
    if (m[1]) { const en=m[1]; const isCap = /^[A-Z]/.test(en);
      let al = (keepNames && isCap && !sentStart && en !== 'I') ? en : alienWord(en);
      if (isCap && al) al = cap(al);
      toks.push({t:'w', en, al}); sentStart=false; }
    else if (m[2]) { toks.push({t:'nl'}); sentStart=true; }
    else if (m[3]) { toks.push({t:'p', s:m[3]}); if (/[.!?]/.test(m[3])) sentStart=true; }
    else if (m[4]) toks.push({t:'sp'});
    else toks.push({t:'o', s:m[5]});
  }
  return toks;
}
const toKeys = w => [...w.toLowerCase()].filter(k => PM[k]);
const ipaOf = w => toKeys(w).map(k => PM[k].ipa).join('');

/* ---------- speech synth ---------- */
let actx=null; function getCtx(){ if(!actx) actx = new (window.AudioContext||window.webkitAudioContext)(); if (actx.state==='suspended') actx.resume(); return actx; }
function baseDur(p, stressed){ return p.t==='V' ? (stressed?.165:.1) : p.t==='stop' ? .09 : p.t==='click' ? .07 : p.t==='glottal' ? .07 : p.t==='fric' ? .1 : p.t==='trill' ? .1 : .07; }
// word list -> segments. words: [{al, end:'.'|','|'?'|'' }]
function wordsToSegs(words, voice, t0=0.12){
  const segs=[]; let t=t0; const sp=voice.speed;
  let phrase=[];
  const flush=(end)=>{
    const n=phrase.length;
    phrase.forEach((w, wi) => {
      const keys=toKeys(w); const decl = 1.1 - .24*(n>1? wi/(n-1) : 0);
      const wr=rngFrom(hash(w+wi)); const accent = 1 + (wr()-.4)*.12; // each word gets its own lilt
      const lastW = wi===n-1, lastQ = end==='?' && lastW;
      const sIdx = keys.findIndex(isV); const lastV = keys.length-1-[...keys].reverse().findIndex(isV);
      keys.forEach((k, ki) => {
        const p=PM[k]; const st = ki===sIdx;
        let d = recs[k] ? recs[k].buf.duration : baseDur(p, st)/sp;
        if (lastW && end && ki>=lastV) d *= 1.35;           // phrase-final lengthening
        d *= .92 + wr()*.16;                                 // no two syllables exactly alike
        let pitch = voice.pitch*decl*accent*(st?1.14:.97);
        if (lastQ) pitch = voice.pitch*(1 + .5*Math.pow((ki+1)/keys.length,1.5));
        else if (end && end!==',' && lastW) pitch *= 1 - .16*(ki/keys.length);
        segs.push({k, t, d, p:pitch, a: p.t==='V' ? (st?1:.72) : 1}); t+=d;
      });
      const gap=(.07+wr()*.05)/sp; segs.push({k:null, t, d:gap, p:voice.pitch*decl*.95}); t+=gap;
    });
    if (end) { const d = end===',' ? .22/sp : .48/sp; segs.push({k:null,t,d,p:voice.pitch}); t+=d; }
    phrase=[];
  };
  words.forEach(w => { if (w.al) phrase.push(w.al); if (w.end) flush(w.end); });
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
if(/[?&]debug\b/.test(location.search)||window.__xgDebug) window.__xg={ getLang:()=>L, setTrim:(n,v)=>{ NOISE_TRIM=n; VOICE_TRIM=v; }, run:(keys,voice)=>{ let t=.05; const segs=keys.map(([k,d])=>{ const s={k,t,d,p:(voice||L.voice).pitch,a:1}; t+=d; return s; }); return render(segs,t+.05,voice||L.voice,{raw:true}); } };
function smoothNoise(ctx, dur, rate, seed){ // slowly wandering random signal in -1..1, for jitter and shimmer
  const sr=ctx.sampleRate, n=Math.ceil(sr*dur)+1, b=ctx.createBuffer(1,n,sr), d=b.getChannelData(0), r=rngFrom(seed);
  const step=Math.max(1,Math.round(sr/rate)); let a=r()*2-1, z=r()*2-1;
  for(let i=0;i<n;i++){ if(i%step===0){ a=z; z=r()*2-1; } const u=(i%step)/step, s=u*u*(3-2*u); d[i]=a+(z-a)*s; }
  return b;
}
async function render(segs, dur, voice, extra={}){
  const led=document.getElementById('ledVoice'); led&&led.classList.add('on'); try{ return await renderInner(segs, dur, voice, extra); } finally { if(led&&!playing) led.classList.remove('on'); } }
async function renderInner(segs, dur, voice, extra={}){
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
    if (recs[s.k]){ vAmp.gain.setTargetAtTime(0,t,.004); nAmp.gain.setTargetAtTime(0,t,.004); const b=ctx.createBufferSource(); b.buffer=recs[s.k].buf; const g=ctx.createGain(); g.gain.value=.9; b.connect(g).connect(mix); b.start(t); continue; }
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
async function speakWords(words){ const {segs,dur}=wordsToSegs(words, L.voice); return render(segs,dur,L.voice); }

/* ---------- playback, waveform, export ---------- */
let playing=null;
function stopAudio(){ $('#ledVoice').classList.remove('on'); $('#tpSpeak').innerHTML='&#x25B6; speak'; if(playing){ try{ playing.src.stop(); }catch(e){} cancelAnimationFrame(playing.raf); const p=playing; playing=null; p.done&&p.done(); } }
function play(buf, canvas){
  setTimeout(()=>{ $('#ledVoice').classList.add('on'); $('#tpSpeak').innerHTML='&#x25A0; stop'; });
  stopAudio(); const ctx=getCtx(); const src=ctx.createBufferSource(); src.buffer=buf; src.connect(ctx.destination);
  const t0=ctx.currentTime; src.start();
  const st={src, raf:0, done:()=>canvas&&drawWave(canvas,buf,-1)}; playing=st;
  src.onended=()=>{ if(playing===st) stopAudio(); };
  if (canvas){ const tick=()=>{ if(playing!==st) return; drawWave(canvas,buf,(ctx.currentTime-t0)/buf.duration); st.raf=requestAnimationFrame(tick); }; tick(); }
}
function drawWave(cv, buf, pos){
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
const STYLES={angular:'Angular grid',round:'Flowing curves',runic:'Runic stems',dotted:'Dotted',circuit:'Circuit board',tendril:'Tendrils',orbital:'Orbits',shard:'Shards',hanging:'Hanging from a line',insect:'Insect bodies',knot:'Knots',glitch:'Glitch blocks',bloom:'Spirals',mixed:'Chaos: every letter its own style'};
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
  const used=new Set([0,32,44,46]);
  PAL.forEach(p=>{ const cp=p.k.codePointAt(0); const up=p.k.toUpperCase(); const ucp=up.length===1&&up!==p.k?up.codePointAt(0):null;
    const uni=[cp]; if(ucp&&!used.has(ucp)) uni.push(ucp); uni.forEach(u=>used.add(u));
    glyphs.push(new opentype.Glyph({name:'uni'+cp.toString(16).toUpperCase().padStart(4,'0'),unicode:cp,unicodes:uni,advanceWidth:800,path:glyphPath(p.k)})); });
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
    <div class="tools"><button type="button" data-a="play" aria-label="Play ${p.k}" title="Play">▶</button><button type="button" data-a="rec" title="Record your voice for this sound">rec</button><button type="button" data-a="up" title="Use an audio file for this sound">file</button>${recs[p.k]?`<span class="mine"><span class="led p"></span>yours</span><button type="button" data-a="clr" aria-label="Remove your recording" title="Back to the synthetic voice">×</button>`:''}</div></div>`; }).join('')}</div></div>`).join('');
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
  if(a==='play'){ const w = isV(k) ? k+k : 'a'+k+'a'; play(await render(...(()=>{ const {segs,dur}=wordsToSegs([{al:w,end:'.'}],L.voice); return [segs,dur]; })(),L.voice)); }
  if(a==='up'){ recTarget=k; $('#fileRec').click(); }
  if(a==='clr'){ delete recs[k]; saveRecs(); renderPalette(); }
  if(a==='rec'){ const btn=e.target; const ab=await micRecord(btn,1.6); if(ab) await setRec(k, ab); }
});
$('#fileRec').addEventListener('change', async e=>{ const f=e.target.files[0]; e.target.value=''; if(f&&recTarget) await setRec(recTarget, await f.arrayBuffer()); });

/* ---------- one take of every sound ---------- */
const invOrder=()=>PAL.filter(p=>L.inv.includes(p.k)).map(p=>p.k);
function renderTakeOrder(){ $('#takeOrder').innerHTML=invOrder().map((k,i)=>`<span><small>${i+1}</small>${esc(k)}</span>`).join(''); }
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
$('#recTop').addEventListener('click',async e=>{ if(!micStop){ location.hash='sounds'; setTimeout(()=>$('#takeOrder').scrollIntoView({block:'center'}),60); toast('say each sound in order with a short pause, then press stop'); } const ab=await micRecord(e.currentTarget,0); if(ab) await splitTake(ab); });

function syllableCount(){ const c=C().length, v=V().length, cl=clusterSeconds().length;
  const on=(L.onset<1?1:0)+(L.onset>0?c:0)+(L.cluster>0&&L.onset>0?c*Math.max(0,cl-0):0); const co=(L.coda<1?1:0)+(L.coda>0?c:0); return on*v*co; }
function updateCounts(){
  const c=C().length, v=V().length; $('#youN').textContent=c+v; $('#youL').textContent=`${c+v} sounds`; sideLcd();
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
  $('#tName').textContent='into '+(L.name||'your language').toLowerCase();
}
const romanText=()=>(lastT||[]).map(t=>t.t==='w'?t.al:t.t==='nl'?'\n':t.t==='sp'?' ':t.s).join('');
let tBuf=null;
async function getTBuf(){ if(!tBuf){ $('#tStatus').textContent='synthesizing…'; setStatus('synthesizing…'); tBuf=await speakWords(tokensToWords(lastT)); $('#tStatus').textContent=`${tBuf.duration.toFixed(1)} s of speech`; setStatus(`${tBuf.duration.toFixed(1)} s of speech`); } return tBuf; }
$('#tSpeak').addEventListener('click',async()=>{ getCtx(); play(await getTBuf(),$('#waveT')); });
$('#tStop').addEventListener('click',stopAudio);
$('#tSaveAudio').addEventListener('click',async()=>exportAudio(await getTBuf(), slug(L.name)+'-speech', $('#tStatus')));
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
    track={buf:b,name:f.name,an:analyse(b)};
    $('#dInfo').textContent=`${f.name}: ${b.duration.toFixed(1)} s, ${track.an.phrases.length} phrases, about ${track.an.phrases.reduce((a,p)=>a+p.syl,0)} syllables.`;
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
$('#dOrig').addEventListener('input',e=>$('#oOrig').textContent=Math.round(e.target.value*100)+'%');
$('#dGo').addEventListener('click',async()=>{
  if(!track) return; const an=track.an; const btn=$('#dGo'); btn.disabled=true; $('#dStatus').textContent='Building speech…';
  const r=rngFrom(hash(L.seed+'dub'+track.name));
  const tx=$('#dTranscript').value.trim();
  let perPhrase=an.phrases.map(()=>[]);
  const totalSyl=an.phrases.reduce((a,p)=>a+p.syl,0)||1;
  if(tx){
    const words=tokensToWords(translate(tx,false)); const ws=words.map(w=>Math.max(1,toKeys(w.al).filter(isV).length)); const tw=ws.reduce((a,b)=>a+b,0)||1;
    const bounds=[]; let acc=0; an.phrases.forEach(p=>{ acc+=p.syl; bounds.push(acc/totalSyl); });
    let cum=0; words.forEach((w,i)=>{ const mid=(cum+ws[i]/2)/tw; cum+=ws[i]; let pi=bounds.findIndex(b=>mid<=b); if(pi<0) pi=bounds.length-1; perPhrase[pi].push({al:w.al}); });
  } else {
    perPhrase=an.phrases.map(p=>{ const out=[]; let left=p.syl; while(left>0){ const k=Math.min(left,1+Math.floor(r()*Math.min(3,L.maxSyl))); out.push({al:makeWord(r,k)}); left-=k; } return out; });
  }
  const segs=[];
  an.phrases.forEach((p,i)=>{ const ws=perPhrase[i]; if(!ws.length) return; const {segs:s0}=wordsToSegs(ws,{...L.voice,speed:1},0); const D=s0.length? s0[s0.length-1].t : 1; const k=p.d/(D||1);
    s0.forEach(s=>segs.push({...s,t:p.t+s.t*k,d:s.d*k})); segs.push({k:null,t:p.t+p.d,d:.05,p:L.voice.pitch}); });
  const f0=[...an.f0]; const voiced=f0.filter(v=>v>0).sort((a,b)=>a-b); const med=voiced[Math.floor(voiced.length/2)]||L.voice.pitch; const ratio=L.voice.pitch/med;
  let last=L.voice.pitch; const curve=new Float32Array(Math.max(2,f0.length)); for(let i=0;i<f0.length;i++){ if(f0[i]>0) last=Math.min(520,Math.max(45,f0[i]*ratio)); curve[i]=last; } if(f0.length<2) curve.fill(L.voice.pitch);
  for(let i=1;i<curve.length-1;i++) curve[i]=(curve[i-1]+curve[i]+curve[i+1])/3;
  dBuf=await render(segs, track.buf.duration+.4, L.voice, {pitchCurve:curve, pitchCurveDur:Math.max(.05,curve.length*an.hop), under:+$('#dOrig').value>0?track.buf:null, underVol:+$('#dOrig').value});
  $('#dRoman').innerHTML=perPhrase.filter(p=>p.length).map(p=>esc(p.map(w=>w.al).join(' '))).join(' · ');
  $('#dOut').hidden=false; drawWave($('#waveD'),dBuf,-1); $('#dStatus').textContent=`${dBuf.duration.toFixed(1)} s, matched to the original timing`; btn.disabled=false;
});
$('#dPlay').addEventListener('click',()=>dBuf&&play(dBuf,$('#waveD')));
$('#dStop').addEventListener('click',stopAudio);
$('#dSave').addEventListener('click',()=>dBuf&&exportAudio(dBuf, slug(L.name)+'-'+slug(track.name.replace(/\.[^.]+$/,'')), $('#dStatus')));

/* ---------- UI: script ---------- */
let selK=null, cur=null;
function renderGlyphs(){
  const inv=PAL.filter(p=>L.inv.includes(p.k)); if(!selK||!L.inv.includes(selK)) selK=inv[0]?.k;
  $('#glyphs').innerHTML=inv.map(p=>`<button class="gcell${p.k===selK?' sel':''}" data-k="${p.k}" aria-label="Letter for ${p.k}"><svg viewBox="-14 -14 128 128">${glyphInner(p.k)}</svg><span>${p.k} /${p.ipa}/</span></button>`).join('');
  drawEditor(); refreshFontPreview();
}
$('#glyphs').addEventListener('click',e=>{ const b=e.target.closest('.gcell'); if(!b) return; selK=b.dataset.k; $$('.gcell').forEach(x=>x.classList.toggle('sel',x===b)); drawEditor(); });
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
$('#fSave').addEventListener('click',async()=>{ try{ const {font,fam}=buildFont(); await saveFile(slug(fam)+'.ttf', font.toArrayBuffer()); }catch(e){ toast(e.message); } });
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
const setPct=el=>el.style.setProperty('--pct',((el.value-el.min)/(el.max-el.min)*100)+'%');
$$('input.fad').forEach(el=>{ setPct(el); el.addEventListener('input',()=>setPct(el)); });
let statusHold=0;
function sideLcd(){ if(Date.now()<statusHold) return; const el=$('#statusLine'); if(!el) return; const c=C().length,v=V().length; const pr=presetOf();
  el.textContent=`${(L.name||'unnamed').toLowerCase()} · ${c+v} sounds · ${v} vowels · voice ${pr?pr.toLowerCase():'custom'} · script ${(STYLES[L.style]||'').split(':')[0].toLowerCase()}`;
  $('#ledMine').classList.toggle('on',Object.keys(recs).length>0); }
function setStatus(msg){ $('#statusLine').textContent=msg; statusHold=Date.now()+4000; setTimeout(sideLcd,4100); }
async function playSample(){ const words=tokensToWords(translate('Hello, traveler. We have been waiting for you. Will you speak with us?',false)); getCtx(); play(await speakWords(words)); }
$('#vTry').addEventListener('click',playSample);
function syncSliders(){ SL.forEach(([i,o,get,,f])=>{ $(i).value=get(); $(o).textContent=f(get()); setPct($(i)); }); markChip($('#gStyle'),L.style); markChip($('#gPen'),L.pen); markChip($('#vPreset'),presetOf()); sideLcd(); $('#langName').value=L.name; $('#fontName').value=L.name+' Script'; $('#gId').textContent='Alphabet #'+(L.gseed>>>0).toString(36).toUpperCase(); }

/* ---------- state changes ---------- */
let rerenderT=0;
function changed(){ wordCache=new Map(); tBuf=null; saveLang(); updateCounts(); clearTimeout(rerenderT); rerenderT=setTimeout(()=>{ renderTranslate(); renderAffixes(); if(!$('#v-words').hidden) renderLex(); if(!$('#v-script').hidden) renderGlyphs(); },120); }
$('#langName').addEventListener('input',e=>{ L.name=e.target.value; saveLang(); updateCounts(); $('#tName').textContent=L.name; });

function randomLanguage(){
  const r=rngFrom(Math.random()*4e9);
  // common sounds turn up far more often than rare ones, as they do across real languages
  const vPool=['a','a','i','i','u','u','e','e','o','o','ë','ä','y','ö','ů']; const nv=4+Math.floor(r()*4); const vs=new Set(['a','i','u']); while(vs.size<nv) vs.add(pick(r,vPool));
  const cPool='t t k k m m n n s s l l p p d d g b r r j j w h v z š f ŋ x ř ž þ q ł c ʔ'.split(' '); const nc=8+Math.floor(r()*10);
  const cs=new Set(['t','k','m','n'].filter(()=>r()<.85)); while(cs.size<nc) cs.add(pick(r,cPool));
  L={ name:'', seed:Math.floor(r()*1e6), inv:[...vs,...cs], onset:.75+r()*.25, coda:r()*.4, cluster:r()<.6?0:r()*.2, maxSyl:3+Math.floor(r()*2),
    voice:(()=>{ const speechy=['Natural voice','Natural voice','Soft and breathy','Giant','Small creature','Ethereal','Gravel beast','Hive choir']; const base=PRESETS[pick(r, r()<.85?speechy:Object.keys(PRESETS))]; const j=(v,a,lo,hi)=>+Math.max(lo,Math.min(hi,v+(r()-.5)*a)).toFixed(2);
      return {...base,pitch:Math.round(j(base.pitch,80,45,400)),formant:j(base.formant,.3,.6,1.7),breath:j(base.breath,.3,0,1),jitter:j(base.jitter,.3,0,1),vib:j(base.vib,.3,0,1)}; })(),
    style:pick(r,Object.keys(STYLES)), pen:pick(r,['round','nib','brush','hair']), weird:+(r()*.7).toFixed(2), slant:+((r()-.5)*.5).toFixed(2), gseed:Math.floor(r()*4294967295), weight:+(5+r()*9).toFixed(1), glyphs:{}, lexicon:{} };
  L.onset=+L.onset.toFixed(2); L.coda=+L.coda.toFixed(2); L.cluster=+L.cluster.toFixed(2);
  wordCache=new Map(); L.name=cap(root('our language people').slice(0,9)) || 'Unnamed';
  genAlphabet(false);
}
$('#btnRandom').addEventListener('click',async()=>{ randomLanguage(); await useLang(L,{fresh:true,recsObj:{}}); toast(`Meet ${L.name}: ${L.inv.length} sounds. Your other languages are under my languages.`); });


/* ---------- library: every language is kept in this browser ---------- */
const LIB_KEY='xenoglot-v1-library', RECS_KEY=id=>'xenoglot-v1-recs-'+id;
const newId=()=>Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4);
let lib={current:null, langs:{}};
function readLib(){ try{ const o=JSON.parse(store.get(LIB_KEY)||'null'); if(o&&o.langs) lib=o; }catch(e){} }
function writeLib(){ if(!store.set(LIB_KEY,JSON.stringify(lib))) toast('This browser’s storage is full. Save your languages as files to keep them.'); }
let saveT=0;
function saveLangNow(){ clearTimeout(saveT); if(!L.id) L.id=newId(); lib.langs[L.id]={...L, updated:Date.now()}; lib.current=L.id; writeLib(); renderLib(); }
function saveLang(){ clearTimeout(saveT); saveT=setTimeout(saveLangNow,300); }
function normaliseLang(o){ if(!o||!Array.isArray(o.inv)||!o.voice) throw new Error('not a language');
  const n={...structuredClone(DEFAULT),...structuredClone(o)}; n.voice={...DEFAULT.voice,...o.voice}; n.inv=n.inv.filter(k=>PM[k]); if(!n.inv.some(isV)) n.inv.push('a');
  n.glyphs=n.glyphs&&typeof n.glyphs==='object'?n.glyphs:{}; n.lexicon=n.lexicon&&typeof n.lexicon==='object'?n.lexicon:{}; delete n.recordings; delete n.xenoglot; delete n.updated; return n; }
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

/* ---------- routing ---------- */
const VIEWS=['sounds','words','translate','audio','script']; const visited=new Set();
function route(){ const v=VIEWS.includes(location.hash.slice(1))?location.hash.slice(1):'sounds';
  const was=VIEWS.find(x=>!$('#v-'+x).hidden);
  VIEWS.forEach(x=>$('#v-'+x).hidden=x!==v); $$('.steps a').forEach(a=>a.toggleAttribute('aria-current',false)); $(`.steps a[data-v="${v}"]`).setAttribute('aria-current','page');
  visited.add(v); $$('.steps .led').forEach(l=>l.className='led'+(visited.has(l.dataset.led)?' on':''));
  if(was && was!==v) window.scrollTo({top:0});
  if(v==='words') renderLex(); if(v==='script') renderGlyphs(); if(v==='translate') renderTranslate(); }
window.addEventListener('hashchange',route);
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

/* ---------- every control shown: sections start open ---------- */
$$('details.more').forEach(d=>d.open=true);

/* ---------- transport + shortcuts ---------- */
async function speakNow(){ if(playing){ stopAudio(); return; } getCtx(); if(!lastT) renderTranslate(); const buf=await getTBuf(); play(buf, $('#v-translate').hidden?null:$('#waveT')); }
$('#tpSpeak').addEventListener('click',speakNow);
$$('[data-proxy]').forEach(b=>b.addEventListener('click',()=>$('#'+b.dataset.proxy).click()));
document.addEventListener('keydown',e=>{ if(e.metaKey||e.ctrlKey||e.altKey) return; const t=e.target; if(t.closest&&t.closest('input,textarea,select,[contenteditable]')) return;
  if(e.code==='Space'){ e.preventDefault(); speakNow(); }
  else if(e.key==='n'||e.key==='N'){ $('#btnRandom').click(); }
  else if(/^[1-5]$/.test(e.key)){ location.hash=VIEWS[+e.key-1]; } });

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
    if(cur) await useLang(cur); else await useLang(structuredClone(DEFAULT),{fresh:true}); }
  loadExamples();
})();
addEventListener('resize',()=>{ drawWave($('#waveT'),tBuf,-1); if(dBuf) drawWave($('#waveD'),dBuf,-1); });
})();
