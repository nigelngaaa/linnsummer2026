/* Selekt DSM dealer configurator — Advance Audio */
const D = window.SELEKT_DATA, V = D.vocab;
const CONFIGS = D.rows.map(r => ({
  chassis:V.chassis[r[0]],
  slot1_card:r[1]<0?null:V.cards[r[1]], slot1_dac:r[2]<0?null:V.dacs[r[2]],
  slot2_card:r[3]<0?null:V.cards[r[3]], slot2_dac:r[4]<0?null:V.dacs[r[4]],
  slot3_card:r[5]<0?null:V.cards[r[5]], slot3_dac:r[6]<0?null:V.dacs[r[6]],
  hdmi:r[7]?'HDMI Board':null, surround:r[8]?'Surround Board':null,
  price:{AUD:r[9], NZD:r[10]}
}));


/* ---------- Linn Summer Sales Incentive (promo edition) ----------
   Customer pays for one DAC level lower and receives this build: one DAC
   upgrade per Selekt DSM. Saving = difference between full Selekt DSM
   bundle prices (not individual cartridges). Stereo Organik to Dual Mono
   Organik: the customer pays the stereo Organik DSM (with stereo Line Out)
   plus the RRP difference to 2 x Mono Line Out cartridges. */
const PROMO={start:'16 November 2026',end:'5 January 2027',monoPair:{AUD:3695,NZD:3995},lineOut:{AUD:1100,NZD:1295}};
const DEALER=window.__DEALER||null; // only supplied by the promo page once dealer pricing is unlocked
const dmoney=v=>{const r=Math.round(v*100)/100;return (state.currency==='NZD'?'NZ$':'$')+r.toLocaleString('en-AU',{minimumFractionDigits:r%1?2:0,maximumFractionDigits:2})};
const dealerOf=v=>DEALER?Math.round(v*DEALER[state.currency]*100+1e-6)/100:null;
const dTag=()=>state.currency==='NZD'?'ex GST':'inc GST';
const DAC_DOWN={'Katalyst DAC':'Standard DAC','Organik Stereo DAC':'Katalyst DAC'};
const DAC_SHORT={'Standard DAC':'Standard DAC','Katalyst DAC':'Katalyst DAC','Organik Stereo DAC':'Organik (stereo) DAC','Organik Mono DAC':'Dual Mono Organik DACs'};
function cfgKey(c){return [c.chassis,c.slot1_card,c.slot1_dac,c.slot2_card,c.slot2_dac,c.slot3_card,c.slot3_dac,!!c.hdmi,!!c.surround].join('|')}
const CFG_BY_KEY=new Map(CONFIGS.map(c=>[cfgKey(c),c]));
function promoFor(cfg){
  if(!cfg)return null;
  // Dual mono Organik: from Line Out + stereo Organik, plus Mono Line Out pair at full price
  if(cfg.slot1_card===MONO_CARD){
    const base=CFG_BY_KEY.get(cfgKey({...cfg,slot1_card:'Line Out',slot1_dac:'Organik Stereo DAC',slot2_card:null,slot2_dac:null,slot3_card:null,slot3_dac:null}));
    if(!base)return null;
    const upg={AUD:PROMO.monoPair.AUD-PROMO.lineOut.AUD,NZD:PROMO.monoPair.NZD-PROMO.lineOut.NZD};
    const pay={AUD:base.price.AUD+upg.AUD,NZD:base.price.NZD+upg.NZD};
    return {pay,upg,base,mono:true,slot:0,from:'Organik Stereo DAC',to:'Organik Mono DAC',
      save:{AUD:cfg.price.AUD-pay.AUD,NZD:cfg.price.NZD-pay.NZD}};
  }
  let best=null;
  for(let i=1;i<=3;i++){
    const dac=cfg[`slot${i}_dac`], down=DAC_DOWN[dac];
    if(!down)continue;
    const alt=CFG_BY_KEY.get(cfgKey({...cfg,[`slot${i}_dac`]:down}));
    if(!alt)continue;
    const save={AUD:cfg.price.AUD-alt.price.AUD,NZD:cfg.price.NZD-alt.price.NZD};
    if(save.AUD<=0||save.NZD<=0)continue;
    if(!best||save.AUD>best.save.AUD)best={pay:{...alt.price},base:alt,slot:i-1,from:down,to:dac,save};
  }
  return best;
}
function promoReason(cfg){
  if(!cfg)return '';
  const dacs=[cfg.slot1_dac,cfg.slot2_dac,cfg.slot3_dac].filter(Boolean);
  if(dacs.every(d=>d==='Standard DAC'))return 'Standard DAC is the entry level, so there is no lower DAC to buy. Customers buying this build receive a Katalyst upgrade: select Katalyst to see that price.';
  return 'No valid one-level-lower DAC exists for this mix (Organik cannot share a Selekt DSM with Standard or Katalyst DACs), so this build is not eligible as configured.';
}
function promoOrderLine(p,cfg){
  if(!p)return '';
  const slot=p.mono?'Slots 1 + 2':`Slot ${p.slot+1}`;
  return p.mono
    ? `Order as ${cfg.chassis} with Line Out + Organik (stereo) DAC. Upgraded to Dual Mono Organik through the Summer Incentive; the customer pays the difference for 2 × Mono Line Out cartridges in place of the stereo Line Out.`
    : `Order as ${cfg.chassis} with ${DAC_SHORT[p.from]} in ${slot}. Upgraded to ${DAC_SHORT[p.to]} through the Summer Incentive.`;
}

/* ---------- currency ---------- */
const CURRENCIES = D.currencies || ['AUD'];
const MARKETS = (D.meta && D.meta.markets) || {};
const LOCALE = {AUD:'en-AU', NZD:'en-NZ'};

const MONO_CARD='Mono Line Out', MONO_DAC='Organik Mono DAC';
const STEPS=[
  {key:'chassis',title:'Chassis',h:'Choose the Selekt hub the build is based on.'},
  {key:'slots',title:'Configure slots',h:'Only next-valid cartridge and DAC choices are offered for each slot.'},
  {key:'expansion',title:'Expansion',h:'Surround mounts on the HDMI switching board, so it unlocks once HDMI is added.'},
  {key:'colour',title:'Colour',h:'Choose the finish, then export the dealer spec sheet.'}
];
const state={step:0,currency:'AUD',chassis:null,colour:null,hdmi:false,surround:false,
  slots:[{card:null,dac:null},{card:null,dac:null},{card:null,dac:null}],
  dealer:'', customer:'', terms:'', logo:null, logoName:''};

/* ---------- default branding + embed mode ---------- */
const DEFAULT_LOGO='img/aa-logo.png', DEFAULT_LOGO_NAME='Advance Audio (default)';
const QS=new URLSearchParams(window.__QS||location.search);
const EMBED=QS.get('embed')==='1';
const INPROMO=QS.get('inpromo')==='1'&&window.parent!==window;
if(INPROMO)document.documentElement.classList.add('inpromo');
function safeLogo(u){
  if(!u)return null;
  u=String(u).trim();
  return (/^https:\/\//i.test(u)||/^data:image\/(png|jpe?g|webp|svg\+xml);/i.test(u)||/^img\//.test(u))?u:null;
}
state.logo=DEFAULT_LOGO; state.logoName=DEFAULT_LOGO_NAME; state.logoIsDefault=true;
const qsCur=(QS.get('cur')||QS.get('currency')||'').toUpperCase();

/* ---------- which market is this visitor in? ----------
   Order of authority:
     1. an explicit ?cur= in the URL  - pinned, geo never overrides it
        (dealer embeds always pin, so their site keeps their own currency)
     2. the visitor's own toggle click - locks for the rest of the session
     3. Cloudflare's country for the request IP, read from the same-origin
        /cdn-cgi/trace endpoint (~80ms, no third-party service, no API key)
     4. device timezone / locale - synchronous, so it sets the very first
        paint and prevents a visible AUD-to-NZD flash while (3) is in flight
   Anything outside AU/NZ gets AUD, the home market. VPN users land on
   whichever country their exit node is in, which is expected and harmless -
   the toggle is always right there. */
const CUR_BY_COUNTRY={NZ:'NZD',AU:'AUD'};
let currencyPinned=false;   // explicit URL param
let currencyLocked=false;   // visitor chose manually
let currencySource='default';

function currencyFromDevice(){
  try{
    const tz=(Intl.DateTimeFormat().resolvedOptions().timeZone||'');
    if(/^Pacific\/(Auckland|Chatham)$/i.test(tz))return 'NZD';
    if(/^(Australia|Antarctica\/Macquarie)\//i.test(tz))return 'AUD';
    const langs=[navigator.language].concat(navigator.languages||[]);
    for(const l of langs){
      const m=/-([A-Z]{2})$/i.exec(l||'');
      if(m&&CUR_BY_COUNTRY[m[1].toUpperCase()])return CUR_BY_COUNTRY[m[1].toUpperCase()];
    }
  }catch(e){}
  return null;
}

async function currencyFromIP(){
  try{
    const ctl=('AbortController' in window)?new AbortController():null;
    if(ctl)setTimeout(()=>ctl.abort(),2500);
    const res=await fetch('/cdn-cgi/trace',{cache:'no-store',signal:ctl?ctl.signal:undefined});
    if(!res.ok)return null;
    const loc=((await res.text()).match(/^loc=([A-Z]{2})/m)||[])[1];
    return loc?(CUR_BY_COUNTRY[loc]||'AUD'):null;
  }catch(e){return null}
}

if(CURRENCIES.includes(qsCur)){
  state.currency=qsCur; currencyPinned=true; currencyLocked=true; currencySource='url';
}else{
  const dev=currencyFromDevice();
  if(dev&&CURRENCIES.includes(dev)){state.currency=dev;currencySource='device'}
}

async function resolveCurrencyByIP(){
  if(currencyPinned||currencyLocked)return;
  const ip=await currencyFromIP();
  if(!ip||currencyPinned||currencyLocked)return;
  currencySource='ip';
  if(CURRENCIES.includes(ip)&&ip!==state.currency){state.currency=ip;renderCurrency();render()}
  else renderCurrency();
}
if(EMBED){
  state.dealer=(QS.get('dealer')||'').slice(0,90);
  state.terms=(QS.get('terms')||'').slice(0,2500);
  const l=safeLogo(QS.get('logo'));
  if(l){state.logo=l;state.logoName='Dealer logo';state.logoIsDefault=false}
}

const $=id=>document.getElementById(id);
const money=(n,cur)=>{
  cur=cur||state.currency;
  if(!(n||n===0))return '—';
  const s=new Intl.NumberFormat(LOCALE[cur]||'en-AU',{style:'currency',currency:cur,maximumFractionDigits:0}).format(n);
  return s.replace(/^(NZ|A)?\$/, cur==='NZD'?'NZ$':'$');
};
const priceOf=cfg=>cfg?cfg.price[state.currency]:null;
const retailNote=()=>(MARKETS[state.currency]||{}).label||'Recommended retail, incl. GST';
const uniq=a=>[...new Set(a.filter(Boolean))];
const esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));

/* ---------- valid-choice engine ---------- */
function matches(c,{openSlots=[],openDacOf=-1,openExp=false}={}){
  if(state.chassis&&c.chassis!==state.chassis)return false;
  for(let i=0;i<3;i++){
    if(openSlots.includes(i))continue;
    if((c[`slot${i+1}_card`]||null)!==(state.slots[i].card||null))return false;
    if(i===openDacOf)continue;
    if((c[`slot${i+1}_dac`]||null)!==(state.slots[i].dac||null))return false;
  }
  if(!openExp){
    if(!!c.hdmi!==!!state.hdmi)return false;
    if(!!c.surround!==!!state.surround)return false;
  }
  return true;
}
const openFrom=i=>[0,1,2].filter(j=>j>=i);
function cardChoices(i){
  if(i>0&&!state.slots[i-1].card)return[];
  return uniq(CONFIGS.filter(c=>matches(c,{openSlots:openFrom(i),openExp:true})).map(c=>c[`slot${i+1}_card`]));
}
function dacChoices(i){
  if(!state.slots[i].card)return[];
  return uniq(CONFIGS.filter(c=>matches(c,{openSlots:openFrom(i+1),openDacOf:i,openExp:true})).map(c=>c[`slot${i+1}_dac`]));
}
const monoPair=()=>state.slots[0].card===MONO_CARD&&state.slots[1].card===MONO_CARD;
const slotsDone=()=>!!state.slots[0].card&&!!state.slots[0].dac&&state.slots.every(s=>(!s.card&&!s.dac)||(s.card&&s.dac));
const resolved=()=>slotsDone()?(CONFIGS.filter(c=>matches(c))[0]||null):null;
function expansionOptions(){
  const pool=CONFIGS.filter(c=>matches(c,{openExp:true}));
  return{hdmi:pool.some(c=>c.hdmi),noHdmi:pool.some(c=>!c.hdmi)};
}
const fitted=()=>state.slots.map((s,i)=>({...s,i})).filter(s=>s.card);

/* ---------- specification engine ---------- */
const CART={
  'Line Out':{amp:0,line:2,sub:0,out:'1 × XLR + 1 × RCA per channel'},
  'Mono Line Out':{amp:0,line:1,sub:0,out:'1 × XLR + 1 × RCA (single channel)'},
  'Power Out':{amp:2,line:0,sub:0,out:'4 mm / banana binding posts per channel'},
  'Hybrid Power Out':{amp:1,line:0,sub:1,out:'1 amplified channel + 1 line-level feed (2 × RCA)'}
};
function specs(){
  const f=fitted();
  const t=f.reduce((a,s)=>{const c=CART[s.card];a.amp+=c.amp;a.line+=c.line;a.sub+=c.sub;return a;},{amp:0,line:0,sub:0});
  const main=t.amp+t.line, layout=t.sub?`${main}.${t.sub}`:`${main}.0`;
  const dacs=uniq(f.map(s=>s.dac));
  const organik=dacs.some(d=>d.startsWith('Organik'));
  const ed=state.chassis==='Selekt Edition Hub';
  const rows=[
    ['Configuration',`${state.chassis||'—'} · ${state.colour||'finish TBC'} · ${f.length} of 3 slots fitted`],
    ['Output channels',`${layout} — ${t.amp} amplified, ${t.line} line-level${t.sub?`, ${t.sub} line-level sub feed`:''}`],
    ['Amplification',t.amp?`${t.amp} × Class-D channel${t.amp>1?'s':''}, 100 W into 4 Ω / 50 W into 8 Ω per channel. THD+N 0.001%, dynamic range 110 dB, gain 20 dB.`:'None — line-level output only'],
    ['Line output',t.line?'RCA 2 V rms at volume 80 (300 Ω); XLR 4 V rms at volume 80 (600 Ω)':(t.sub?'Line-level sub feed only (2 × RCA sharing one channel), 2 V rms at volume 80':'None')],
    ['DAC modules',dacs.join(' + ')+(organik?' (Organik architecture)':'')],
    ['Resolution',organik?'Up to 24-bit / 384 kHz PCM; DSD (DSF and DFF)':'Up to 24-bit / 192 kHz PCM; DSD (DSF and DFF)'],
    ['HDMI',state.hdmi?'HDMI switching board fitted — 4 × HDMI in, 1 × HDMI out (doubles as eARC). The hub\u2019s own HDMI ARC socket is not used once the board is fitted.':'Not fitted — hub provides 1 × HDMI ARC input'],
    ['Surround',state.surround?'Surround board fitted — multichannel decoding, mounted on the HDMI switching board':'Not fitted'],
    ['Subwoofer','2 × subwoofer outputs on hub (2.1 for stereo playback; bass reinforcement or redirect)'],
    ['Network','Ethernet 100BASE-T RJ45, Wi-Fi 802.11ac, Bluetooth 4.2, 2 × Exakt Link'],
    ['Streaming','Tidal, Qobuz, Deezer, Spotify Connect, AirPlay 2, Roon Ready, TuneIn, airable, Calm Radio, UPnP'],
    ['File formats','FLAC, ALAC, WAV, AIFF, DSD (64/128/256), MP3, AAC, OGG, WMA (except lossless)'],
    ['Digital inputs','2 × Toslink, 2 × SPDIF (one configurable as a fixed-volume stereo output), 1 × USB Type B (UAC2)'],
    ['Analogue inputs','3 × RCA pairs — MM phono, MC phono, line in'],
    ['Headphones','1 × 6.3 mm / ¼ in jack'],
    ['Dimensions',ed?'355 mm (W) × 119 mm (H) × 355 mm (D)':'350 mm (W) × 122.5 mm (H) × 355 mm (D)'],
    ['Weight',ed?'9.5 – 12.3 kg depending on cartridges fitted':'8.05 – 10.85 kg depending on cartridges fitted'],
    ['Power','Auto-ranging mains. Typically 200 W continuous depending on cartridges; 15 W sleep']
  ];
  return rows.filter(r=>r[1]);
}

/* ---------- product stage (SVG) ---------- */
function shot(view){
  const ch=state.chassis==='Selekt Edition Hub'?'edition':'classic';
  const col=(state.colour||'Black').toLowerCase();
  return `img/${ch}-${col}-${view}.webp`;
}
const GEO={frame:[3118,1080],bay:{1:[2672,232,354,690],2:[2309,232,354,690],3:[1946,232,354,690]},hdmi:[120,285,1020,250]};
const CODE={'Line Out':'lineout','Mono Line Out':'mono','Power Out':'power','Hybrid Power Out':'hybrid'};
function pct(box){const[fw,fh]=GEO.frame;const[x,y,w,h]=box;
  return `left:${x/fw*100}%;top:${y/fh*100}%;width:${w/fw*100}%;height:${h/fh*100}%`}
function rearHTML(focus){
  const bays=[1,2,3].map(n=>{
    const s=state.slots[n-1], code=s.card?CODE[s.card]:'blank';
    const hot=(focus==='slots'&&!!s.card);
    return `<img class="layer${hot?' hot':''}" style="${pct(GEO.bay[n])}" src="img/rear/s${n}-${code}.webp" alt="Slot ${n} — ${s.card||'not fitted'}">`;
  }).join('');
  const hdmi=state.hdmi?`<img class="layer${focus==='hdmi'?' hot':''}" style="${pct(GEO.hdmi)}" src="img/rear/hdmi-on.webp" alt="HDMI switching board">`:'';
  return `<div class="rear"><img class="plate" src="img/rear/base.webp" alt="Linn Selekt DSM rear panel">${hdmi}${bays}</div>`;
}
function renderStage(){
  const k=STEPS[state.step].key;
  const front=(k==='chassis'||k==='colour');
  $('stage').innerHTML=front
    ? `<div class="view on"><img class="shot" src="${shot(k==='colour'?'front':'34')}" alt="${esc(state.chassis||'Linn Selekt DSM')} ${esc(state.colour||'')} front view"></div>`
    : `<div class="view on">${rearHTML(k==='expansion'?'hdmi':'slots')}</div>`;
  $('stageBadge').textContent=`Step ${state.step+1} · ${STEPS[state.step].title}`;
  $('stageCaption').textContent=k==='slots'?'Rear view — live composite of the fitted cartridges. Linn product photography.'
    :k==='expansion'?'Rear view — HDMI switching board. Linn product photography.'
    :k==='colour'?`Front view — ${state.colour?state.colour.toLowerCase()+' finish':'choose a finish'}. Linn product photography.`
    :'Front three-quarter view — chassis selection. Linn product photography.';
}

/* ---------- render ---------- */
function renderStepper(){
  $('stepper').innerHTML=STEPS.map((s,i)=>`<div class="step-pill${i===state.step?' active':''}${i<state.step?' done':''}" ${i<state.step?`data-goto="${i}"`:''}><span class="n">${i+1}</span>${esc(s.title)}</div>`).join('');
  $('stepper').querySelectorAll('[data-goto]').forEach(el=>el.onclick=()=>goStep(+el.dataset.goto));
}
function head(i){return `<div class="section-head"><h2>${esc(STEPS[i].title)}</h2><p>${esc(STEPS[i].h)}</p></div>`}

function renderChassis(){
  $('stepBody').innerHTML=head(0)+`<div class="grid-2">${uniq(CONFIGS.map(c=>c.chassis)).map(n=>`
    <button class="choice ${state.chassis===n?'selected':''}" data-chassis="${esc(n)}">
      <img class="thumb" src="img/${n==='Selekt Edition Hub'?'edition':'classic'}-black-34.webp" alt="${esc(n)}">
      <span class="eyebrow">Hub</span><strong>${esc(n)}</strong>
      <span>${n==='Selekt Edition Hub'?'Edition hub — machined chassis, uprated power supply and casework.':'Classic hub — the standard Selekt DSM platform.'}</span>
    </button>`).join('')}</div>`;
  $('stepBody').querySelectorAll('[data-chassis]').forEach(b=>b.onclick=()=>{state.chassis=b.dataset.chassis;reset(0);render()});
}
function renderSlots(){
  let h=head(1)+'<div class="slot-grid">';
  for(let i=0;i<3;i++){
    const cards=cardChoices(i), dacs=dacChoices(i), s=state.slots[i];
    const lock=(i===2&&monoPair())||cards.length===0;
    const monoLock=(i===2&&monoPair());
    let note;
    if(monoLock)note='Slot 3 is unavailable — a pair of mono cartridges occupies Slots 1 and 2.';
    else if(cards.length===0)note=i>0&&!state.slots[i-1].card?`Fit Slot ${i} first.`:'No further cartridges are compatible with this build.';
    else if(s.card&&s.dac)note=`${s.card} · ${s.dac} — ${CART[s.card].out}`;
    else if(s.card)note='Now choose the DAC module for this cartridge.';
    else note=i===0?'Every build starts with a cartridge in Slot 1.':'Leave empty, or add the next compatible cartridge.';
    h+=`<div class="slot-row ${s.card?'filled':''} ${lock?'locked':''}">
      <div class="slot-no">Slot<b>${i+1}</b>${monoLock?'<span class="tag">Locked</span>':''}</div>
      <div class="field"><label>Cartridge</label>
        <select data-card="${i}" ${lock?'disabled':''}><option value="">${lock?'Unavailable':(i===0?'Choose card':'Not fitted')}</option>${cards.map(v=>`<option value="${esc(v)}" ${s.card===v?'selected':''}>${esc(v)}</option>`).join('')}</select></div>
      <div class="field"><label>DAC module</label>
        <select data-dac="${i}" ${s.card&&!lock?'':'disabled'}><option value="">${lock?'Unavailable':(s.card?'Choose DAC':'Choose card first')}</option>${dacs.map(v=>`<option value="${esc(v)}" ${s.dac===v?'selected':''}>${esc(v)}</option>`).join('')}</select></div>
      <div class="slot-note">${esc(note)}</div></div>`;
  }
  h+='</div><div class="rules"><div class="eyebrow">Build rules enforced</div><ul>'+D.meta.logic.map(l=>`<li>${esc(l)}</li>`).join('')+'</ul></div>';
  $('stepBody').innerHTML=h;
  $('stepBody').querySelectorAll('[data-card]').forEach(el=>el.onchange=e=>{
    const i=+e.target.dataset.card;
    state.slots[i]={card:e.target.value||null,dac:null};
    for(let j=i+1;j<3;j++)state.slots[j]={card:null,dac:null};
    if(state.slots[i].card===MONO_CARD){state.slots[i].dac=MONO_DAC;if(i===0)state.slots[1]={card:MONO_CARD,dac:MONO_DAC};}
    else if(dacChoices(i).length===1)state.slots[i].dac=dacChoices(i)[0];
    reset(1);render();
  });
  $('stepBody').querySelectorAll('[data-dac]').forEach(el=>el.onchange=e=>{
    const i=+e.target.dataset.dac;
    state.slots[i].dac=e.target.value||null;
    for(let j=i+1;j<3;j++)state.slots[j]={card:null,dac:null};
    reset(1);render();
  });
}
function renderExpansion(){
  const o=expansionOptions(), ed=state.chassis==='Selekt Edition Hub';
  $('stepBody').innerHTML=head(2)+`<div class="check-grid">
    <label class="check ${state.hdmi?'on':''} ${!o.hdmi&&!state.hdmi?'disabled':''}"><input type="checkbox" id="hdmi" ${state.hdmi?'checked':''} ${!o.hdmi&&!state.hdmi?'disabled':''}>
      <div><strong>HDMI Board</strong><span>HDMI 2 switching — 4 × HDMI in, 1 × HDMI out doubling as eARC. Replaces the hub\u2019s own HDMI ARC socket.</span></div></label>
    <label class="check ${state.surround?'on':''} ${!state.hdmi?'disabled':''}"><input type="checkbox" id="surr" ${state.surround?'checked':''} ${!state.hdmi?'disabled':''}>
      <div><strong>Surround Board</strong><span>${state.hdmi?'Multichannel decoding — mounts on the HDMI switching board.':'Add the HDMI board first — surround mounts on it.'}</span></div></label></div>
    <div class="rules"><div class="eyebrow">Note</div><ul><li>Cartridge mix drives the channel layout. This build currently resolves to ${esc(specs()[1][1])}.</li></ul></div>`;
  $('hdmi').onchange=e=>{state.hdmi=e.target.checked;if(!state.hdmi)state.surround=false;reset(2);render()};
  $('surr').onchange=e=>{state.surround=e.target.checked;reset(2);render()};
}
function renderColour(){
  $('stepBody').innerHTML=head(3)+`<div class="check-grid">${D.meta.colours.map(c=>`
    <button class="swatch ${state.colour===c?'selected':''}" data-colour="${c}">
      <img class="chip-shot" src="img/${state.chassis==='Selekt Edition Hub'?'edition':'classic'}-${c.toLowerCase()}-front.webp" alt="${c} finish">
      <div><strong>${c}</strong><span>${esc(state.chassis||'Selekt DSM')} in ${c.toLowerCase()} finish.</span></div></button>`).join('')}</div>
    ${EMBED||!DEALER?'':`<div class="rules dealer-box"><div class="eyebrow">Dealer details for the spec sheet</div>
      <div class="dealer-grid">
        <div class="field"><label for="dealer">Dealer / store</label>
          <input class="dlr" id="dealer" value="${esc(state.dealer)}" placeholder="e.g. Advance Audio — Sydney"></div>
        <div class="field"><label for="customer">Customer / reference</label>
          <input class="dlr" id="customer" value="${esc(state.customer)}" placeholder="Optional"></div>
      </div>
      <div class="field logo-field"><label for="logoFile">Dealer logo</label>
        <div class="logo-row">
          <div class="logo-prev ${state.logo?'has':''}">${state.logo
            ?`<img src="${state.logo}" alt="Dealer logo preview">`
            :'<span>No logo</span>'}</div>
          <div class="logo-act">
            <input type="file" id="logoFile" accept="image/png,image/jpeg,image/webp,image/svg+xml">
            <label class="btn small" for="logoFile">${state.logo?'Replace logo':'Upload logo'}</label>
            ${state.logo?`<button type="button" class="btn small ghost" id="logoClear">${state.logoIsDefault?'Remove':'Reset to Advance Audio'}</button>`:''}
            <div class="hint" id="logoHint">${state.logo?esc(state.logoName||'Logo added'):'PNG, JPG, WebP or SVG · up to 3 MB · prints top-left of the spec sheet'}</div>
          </div>
        </div>
      </div>
      <div class="field"><label for="terms">Terms &amp; conditions for this quote</label>
        <textarea class="dlr" id="terms" rows="5" maxlength="2500" placeholder="e.g. Quote valid 30 days. 30% deposit on order. Installation and calibration quoted separately. Prices include GST.">${esc(state.terms)}</textarea>
        <div class="hint">Prints as its own section on the spec sheet, above the signature block. They stay in place while this tab is open, so you can run several quotes without re-entering them.</div>
      </div>
    </div>`}`;
  $('stepBody').querySelectorAll('[data-colour]').forEach(b=>b.onclick=()=>{state.colour=b.dataset.colour;render()});
  if(EMBED||!DEALER)return;
  $('dealer').oninput=e=>{state.dealer=e.target.value};
  $('customer').oninput=e=>{state.customer=e.target.value};
  $('terms').oninput=e=>{state.terms=e.target.value};
  $('logoFile').onchange=e=>onLogo(e.target.files&&e.target.files[0]);
  if($('logoClear'))$('logoClear').onclick=()=>{
    if(state.logoIsDefault){setLogo(null,'')}else{setLogo(DEFAULT_LOGO,DEFAULT_LOGO_NAME)}
  };
}
function logoHint(msg,bad){const h=$('logoHint');if(h){h.textContent=msg;h.classList.toggle('bad',!!bad)}}
function onLogo(f){
  if(!f)return;
  if(!/^image\/(png|jpeg|webp|svg\+xml)$/.test(f.type)){logoHint('Use a PNG, JPG, WebP or SVG image.',true);return}
  if(f.size>3*1024*1024){logoHint('That file is over 3 MB — please use a smaller logo.',true);return}
  const r=new FileReader();
  r.onerror=()=>logoHint('That file could not be read.',true);
  r.onload=()=>{if(f.type==='image/svg+xml'){setLogo(r.result,f.name)}else{fitLogo(r.result,f.name)}};
  r.readAsDataURL(f);
}
function setLogo(src,name){state.logo=src;state.logoName=name;state.logoIsDefault=(src===DEFAULT_LOGO);render()}

/* ---------- dealer embed ---------- */
const EMBED_ID='linn-selekt-configurator';
const embedCfg={mode:'button',dealer:'',terms:'',logoUrl:'',logoData:'',logoName:''};
Object.defineProperty(embedCfg,'currency',{get:()=>state.currency});

/* ---------- can this host be framed? ----------
   pplx.app serves x-frame-options: DENY and CSP frame-ancestors 'none', so an
   in-page iframe can never load from there. Probe our own response headers
   (same-origin, so they are readable) and only offer the frame option when the
   host actually permits framing - i.e. once this is served from a dealer or
   Advance Audio domain. */
// In-page frame embedding is hidden from the dealer UI. The current host sends
// X-Frame-Options: DENY, so the option can never succeed and offering it only
// produces a "refused to connect" error on the dealer's page. Flip this to true
// once the configurator is served from a host that permits framing; the mode,
// its snippet builder and probeFraming() all remain intact below.
const FRAME_UI = false;
let FRAME_OK = !/(^|\.)pplx\.app$/i.test(location.hostname);
let FRAME_BLOCKED_BY = FRAME_OK ? '' : location.hostname;
async function probeFraming(){
  try{
    // HEAD gives us the headers without re-downloading the page body.
    let r = await fetch(location.href, {method:'HEAD', cache:'no-store'});
    if(!r.ok && r.status===405) r = await fetch(location.href, {method:'GET', cache:'no-store'});
    const xfo = (r.headers.get('x-frame-options')||'').toLowerCase();
    const csp = (r.headers.get('content-security-policy')||'').toLowerCase();
    const fa  = (csp.match(/frame-ancestors([^;]*)/)||[])[1]||'';
    const blocked = /deny|sameorigin/.test(xfo) || /'none'/.test(fa);
    const ok = !blocked;
    if(ok!==FRAME_OK){
      FRAME_OK = ok;
      FRAME_BLOCKED_BY = ok ? '' : location.hostname;
      if(!ok && embedCfg.mode==='frame') embedCfg.mode='button';
      if(!$('embedModal').hidden) renderEmbed();
    }
  }catch(e){/* probe is best-effort; keep the hostname heuristic */}
}
function openEmbed(){$('embedModal').hidden=false;document.body.classList.add('modal-open');renderEmbed()}
function closeEmbed(){$('embedModal').hidden=true;document.body.classList.remove('modal-open')}
function embedSrc(){
  const q=new URLSearchParams({embed:'1'});
  q.set('cur',state.currency); // always pin, so a dealer's page keeps their currency regardless of visitor location
  if(embedCfg.dealer)q.set('dealer',embedCfg.dealer.slice(0,90));
  if(embedCfg.terms)q.set('terms',embedCfg.terms.slice(0,2500));
  if(embedCfg.logoUrl)q.set('logo',embedCfg.logoUrl);
  return location.origin+location.pathname.replace(/index\.html$/,'')+'?'+q.toString();
}
function embedFrameCode(){
  const src=embedSrc(), useData=!embedCfg.logoUrl&&!!embedCfg.logoData;
  return `<!-- Linn Selekt DSM configurator${embedCfg.dealer?' \u2014 '+embedCfg.dealer:''} -->
<div style="max-width:1180px;margin:0 auto">
  <iframe id="${EMBED_ID}" src="${src}" title="Linn Selekt DSM configurator"
    style="width:100%;height:1900px;border:0;display:block" loading="lazy"></iframe>
</div>
<script>
(function(){
  var f=document.getElementById('${EMBED_ID}'), origin='${location.origin}';${useData?`
  var logo="${embedCfg.logoData}";
  f.addEventListener('load',function(){f.contentWindow.postMessage({type:'selekt-logo',logo:logo},origin)});`:''}
  window.addEventListener('message',function(e){
    if(e.origin!==origin||!f.contentWindow||e.source!==f.contentWindow)return;
    var d=e.data||{};
    if(d.type==='selekt-height'&&d.h)f.style.height=(d.h+24)+'px';
  });
})();
<\/script>`;
}
function embedButtonCode(){
  const src=embedSrc();
  return `<!-- Linn Selekt DSM configurator${embedCfg.dealer?' \u2014 '+embedCfg.dealer:''} -->
<a href="${src}" target="_blank" rel="noopener"
   style="display:inline-flex;align-items:center;gap:10px;padding:14px 22px;border-radius:999px;
          background:#1a1a16;color:#f4ecd9;font:600 15px/1 system-ui,sans-serif;text-decoration:none">
  Build your Linn Selekt DSM
  <span aria-hidden="true">&rarr;</span>
</a>`;
}
function embedCode(){return embedCfg.mode==='frame'?embedFrameCode():embedButtonCode()}
function renderEmbed(){
  const useData=!embedCfg.logoUrl&&!!embedCfg.logoData;
  $('embedBody').innerHTML=`
    <p class="modal-lead">Enter your store details, then paste the generated code into any page on your website. Customers see the full configurator and download a specification sheet carrying <strong>your</strong> logo — the dealer details panel is hidden from them.</p>
    <div class="dealer-grid">
      <div class="field"><label for="eDealer">Your store name</label>
        <input class="dlr" id="eDealer" value="${esc(embedCfg.dealer)}" placeholder="e.g. Northside Hi-Fi — Crows Nest"></div>
      <div class="field"><label for="eLogoUrl">Logo URL on your site (recommended)</label>
        <input class="dlr" id="eLogoUrl" value="${esc(embedCfg.logoUrl)}" placeholder="https://yourstore.com.au/logo.png"></div>
    </div>
    <div class="field logo-field"><label for="eLogoFile">… or upload your logo</label>
      <div class="logo-row">
        <div class="logo-prev ${useData?'has':''}">${useData?`<img src="${embedCfg.logoData}" alt="Logo preview">`:'<span>No file</span>'}</div>
        <div class="logo-act">
          <input type="file" id="eLogoFile" accept="image/png,image/jpeg,image/webp">
          <label class="btn small" for="eLogoFile">${useData?'Replace file':'Upload logo'}</label>
          ${useData?'<button type="button" class="btn small ghost" id="eLogoClear">Remove</button>':''}
          <div class="hint" id="eLogoHint">${embedCfg.logoUrl?'A logo URL is set, so the uploaded file is ignored.':(useData?esc(embedCfg.logoName)+' \u2014 embedded in the snippet below; it appears once the code is live on your site':(embedCfg.mode==='frame'?'A hosted URL keeps the snippet short. An upload is embedded in the code, which makes it longer.':'Paste a URL to a logo already hosted on your website \u2014 that is the logo that travels with the launch button.'))}</div>
        </div>
      </div>
    </div>
    <div class="field"><label for="eTerms">Your terms &amp; conditions (optional)</label>
      <textarea class="dlr" id="eTerms" rows="4" maxlength="2500" placeholder="Printed on every specification sheet your customers download.">${esc(embedCfg.terms)}</textarea></div>
    ${FRAME_UI?`<div class="field"><label>How it appears on your site</label>
      <div class="seg">
        <button type="button" class="seg-b ${embedCfg.mode==='button'?'on':''}" data-mode="button">Launch button</button>
        <button type="button" class="seg-b ${embedCfg.mode==='frame'?'on':''} ${FRAME_OK?'':'seg-b-off'}" data-mode="frame"${FRAME_OK?'':' title="Not available on this address \u2014 select to find out why"'}>In-page frame${FRAME_OK?'':' \u00b7 unavailable'}</button>
      </div>
      <div class="hint">${embedCfg.mode==='button'
        ?'A branded button that opens the configurator in a new tab. Works on any website, including Squarespace, Shopify and WordPress \u2014 paste and done.'
        :'Renders the configurator directly inside one of your own pages.'}</div>
    </div>`:''}
    ${(embedCfg.mode==='frame'&&!FRAME_OK)?`
    <div class="field">
      <div class="notice">
        <strong>In-page framing is blocked on this address.</strong>
        <p><code>${esc(FRAME_BLOCKED_BY||location.hostname)}</code> sends a <code>X-Frame-Options: DENY</code> header, so any browser will refuse to load it inside another site and your visitors would see \u201crefused to connect\u201d. This is set by the host, so it cannot be changed from this end.</p>
        <p>To run the configurator inside your own page, it needs to be served from a domain that allows it \u2014 for example <code>configurator.advanceaudio.com.au</code>. Contact Advance Audio to have it set up, then this option will switch on automatically.</p>
        <p>In the meantime the <strong>Launch button</strong> gives customers the identical configurator, branded with your logo and terms, and works on every website platform.</p>
      </div>
      <div class="modal-foot"><button class="btn primary" id="eUseBtn">Use the launch button instead</button></div>
    </div>`:`
    <div class="field"><label for="eCode">Embed code</label>
      <textarea class="dlr mono-ta" id="eCode" rows="${embedCfg.mode==='frame'?9:7}" readonly>${esc(embedCode())}</textarea>
      <div class="hint">No pricing rules, cost data or dealer margins are exposed \u2014 the code only carries your store name, logo and terms.</div>
    </div>`}
    <div class="modal-foot">
      ${(embedCfg.mode==='frame'&&!FRAME_OK)?'':'<button class="btn primary" id="eCopy">Copy embed code</button>'}
      <a class="btn" id="ePreview" href="${esc(embedSrc())}" target="_blank" rel="noopener">Preview customer view</a>
    </div>`;
  $('embedBody').querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{embedCfg.mode=b.dataset.mode;renderEmbed()});
  if($('eUseBtn'))$('eUseBtn').onclick=()=>{embedCfg.mode='button';renderEmbed()};
  $('eDealer').oninput=e=>{embedCfg.dealer=e.target.value;syncCode()};
  $('eTerms').oninput=e=>{embedCfg.terms=e.target.value;syncCode()};
  $('eLogoUrl').oninput=e=>{
    embedCfg.logoUrl=e.target.value.trim();
    const h=$('eLogoHint');
    if(embedCfg.logoUrl)h.textContent='A logo URL is set, so any uploaded file is ignored.';
    else if(embedCfg.logoData)h.textContent=embedCfg.logoName+' \u2014 embedded in the snippet below';
    else h.textContent=(embedCfg.mode==='frame'?'A hosted URL keeps the snippet short. An upload is embedded in the code, which makes it longer.':'Paste a URL to a logo already hosted on your website \u2014 that is the logo that travels with the launch button.');
    h.classList.remove('bad');
    syncCode();
  };
  $('eLogoFile').onchange=e=>{
    const f=e.target.files&&e.target.files[0]; if(!f)return;
    const hint=$('eLogoHint');
    if(!/^image\/(png|jpeg|webp)$/.test(f.type)){hint.textContent='Use a PNG, JPG or WebP file.';hint.classList.add('bad');return}
    if(f.size>1024*1024){hint.textContent='For an embed, keep the file under 1 MB — or host it on your site and paste the URL.';hint.classList.add('bad');return}
    const r=new FileReader();
    r.onload=()=>{const img=new Image();img.onload=()=>{
      const k=Math.min(1,520/img.width,200/img.height);
      const cv=document.createElement('canvas');
      cv.width=Math.max(1,Math.round(img.width*k));cv.height=Math.max(1,Math.round(img.height*k));
      cv.getContext('2d').drawImage(img,0,0,cv.width,cv.height);
      let out=r.result;try{out=cv.toDataURL('image/png')}catch(err){}
      embedCfg.logoData=out;embedCfg.logoName=f.name;renderEmbed();
    };img.onerror=()=>{embedCfg.logoData=r.result;embedCfg.logoName=f.name;renderEmbed()};img.src=r.result};
    r.readAsDataURL(f);
  };
  if($('eLogoClear'))$('eLogoClear').onclick=()=>{embedCfg.logoData='';embedCfg.logoName='';renderEmbed()};
  if($('eCopy'))$('eCopy').onclick=async()=>{
    const b=$('eCopy');
    try{await navigator.clipboard.writeText(embedCode())}
    catch(err){const t=$('eCode');t.removeAttribute('readonly');t.select();document.execCommand&&document.execCommand('copy');t.setAttribute('readonly','')}
    b.textContent='Copied';setTimeout(()=>b.textContent='Copy embed code',1600);
  };
}
function syncCode(){if($('eCode'))$('eCode').value=embedCode();if($('ePreview'))$('ePreview').href=embedSrc()}

/* ---------- embedded (customer) mode plumbing ---------- */
function postHeight(){
  if(!(EMBED||INPROMO)||window.parent===window)return;
  const sh=document.querySelector('.shell');const h=Math.ceil(sh?sh.getBoundingClientRect().bottom+window.scrollY:document.documentElement.scrollHeight);
  try{window.parent.postMessage({type:'selekt-height',h},'*')}catch(e){}
}
if(EMBED){
  window.addEventListener('message',e=>{
    const d=e.data||{};
    if(d.type==='selekt-logo'&&typeof d.logo==='string'&&/^data:image\/(png|jpe?g|webp);/i.test(d.logo)){
      state.logo=d.logo;state.logoName='Dealer logo';state.logoIsDefault=false;render();
    }
  });
  window.addEventListener('resize',postHeight);
  document.documentElement.classList.add('embedded');
}
function fitLogo(src,name){
  const img=new Image();
  img.onload=()=>{
    const k=Math.min(1,720/img.width,280/img.height);
    const cv=document.createElement('canvas');
    cv.width=Math.max(1,Math.round(img.width*k));cv.height=Math.max(1,Math.round(img.height*k));
    cv.getContext('2d').drawImage(img,0,0,cv.width,cv.height);
    let out=src;try{out=cv.toDataURL('image/png')}catch(e){}
    setLogo(out,name);
  };
  img.onerror=()=>setLogo(src,name);
  img.src=src;
}
function renderSummary(){
  const line=i=>state.slots[i].card?`${state.slots[i].card} · ${state.slots[i].dac||'DAC pending'}`:(i===2&&monoPair()?'Unavailable — mono pair':'Not fitted');
  const rows=[['Chassis',state.chassis||'—'],['Slot 1',line(0)],['Slot 2',line(1)],['Slot 3',line(2)],
    ['Expansion',[state.hdmi?'HDMI Board':null,state.surround?'Surround Board':null].filter(Boolean).join(' · ')||'None'],
    ['Colour',state.colour||'—']];
  $('sumRows').innerHTML=rows.map(([a,b])=>`<div class="srow"><span>${a}</span><strong>${esc(b)}</strong></div>`).join('');
  const cfg=resolved();
  const p=promoFor(cfg);
  if(cfg&&p){
    $('amount').innerHTML=`<span class="was">Was <s>${money(priceOf(cfg))}</s></span><span class="is">${money(p.pay[state.currency])}</span>`;
    $('priceNote').innerHTML=`<span class="save">${DEALER?'Customer saves':'You save'} ${money(p.save[state.currency])}</span><span class="pn">${esc(retailNote())} · Summer Incentive price</span>${DEALER?`<span class="dlr-px">Dealer: was <s>${dmoney(dealerOf(priceOf(cfg)))}</s> · is <b>${p.mono?dmoney(dealerOf(p.base.price[state.currency])+dealerOf(p.upg[state.currency])):dmoney(dealerOf(p.pay[state.currency]))}</b> ${dTag()}</span>`:''}${DEALER?`<span class="ord">${esc(promoOrderLine(p,cfg))}</span>`:''}`;
  }else if(cfg){
    $('amount').textContent=money(priceOf(cfg));
    $('priceNote').innerHTML=`<span class="pn">${esc(retailNote())}</span>${DEALER?`<span class="dlr-px">Dealer: <b>${dmoney(dealerOf(priceOf(cfg)))}</b> ${dTag()}</span>`:''}<span class="ord nb">${esc(promoReason(cfg))}</span>`;
  }else{
    $('amount').textContent='—';
    $('priceNote').textContent='Complete the build to resolve pricing';
  }
  $('specPreview').innerHTML=cfg?specs().slice(0,6).map(([a,b])=>`<div class="spec-item"><span>${esc(a)}</span><div>${esc(b)}</div></div>`).join(''):'<div class="spec-item"><span>Pending</span><div>Specifications appear once the build resolves.</div></div>';
  $('pdfBtn').disabled=!(cfg&&state.colour);
}
function componentLines(){
  const out=[{name:state.chassis,sku:D.sku[state.chassis]||''}];
  fitted().forEach(s=>{
    out.push({name:`Slot ${s.i+1} — ${s.card}`,sku:D.sku[s.card]});
    out.push({name:`Slot ${s.i+1} — ${s.dac}`,sku:D.sku[s.dac]});
  });
  if(state.hdmi)out.push({name:'HDMI Board',sku:D.sku['HDMI Board']});
  if(state.surround)out.push({name:'Surround Board',sku:D.sku['Surround Board']});
  return out;
}
function reset(step){
  if(step<=0){state.slots=[{card:null,dac:null},{card:null,dac:null},{card:null,dac:null}];state.hdmi=false;state.surround=false;state.colour=null}
  else if(step===1){state.hdmi=false;state.surround=false;state.colour=null}
  else if(step===2){state.colour=null}
}
function canNext(){
  if(state.step===0)return!!state.chassis;
  if(state.step===1)return slotsDone();
  if(state.step===2)return!!resolved();
  return !!state.colour;
}
function render(){
  renderStepper();
  [renderChassis,renderSlots,renderExpansion,renderColour][state.step]();
  renderStage();renderSummary();
  $('back').disabled=state.step===0;
  $('next').disabled=!canNext();
  $('next').textContent=state.step===3?'Build complete':'Continue';
  $('next').style.visibility=state.step===3?'hidden':'visible';
  postHeight();
}

/* ---------- PDF / spec sheet ---------- */
function ref(){
  const c=[state.chassis==='Selekt Edition Hub'?'ED':'CL',...fitted().map(s=>D.sku[s.card].split(' ')[1].slice(1,4)+D.sku[s.dac].slice(-1)),state.hdmi?'H':'',state.surround?'S':'',(state.colour||'')[0]||''];
  return 'SEL-'+c.filter(Boolean).join('-').toUpperCase();
}
/* ---------- lifestyle photography on the spec sheet ----------
   Every generated PDF carries a different Linn lifestyle photograph. The printed
   banner is about 6.7:1 while the source frames are 3:2, so object-fit:cover
   crops vertically only; the per-image y value was read off a gridded overlay of
   each frame so the crop lands on the Selekt rather than on bare cabinetry or
   wallpaper. Selection uses a shuffled bag - every photograph appears once
   before any repeat, and a fresh shuffle never leads with the image just used,
   so two consecutive spec sheets are never the same. */
const LIFE=[
  {f:'img/life/walnut-black.jpg', y:25},
  {f:'img/life/walnut-silver.jpg', y:25},
  {f:'img/life/walnut-close.jpg', y:46},
  {f:'img/life/white-wide.jpg', y:66},
  {f:'img/life/black-close.jpg', y:68},
  {f:'img/life/black-wide.jpg', y:36},
  {f:'img/life/white-angled.jpg', y:55},
  {f:'img/life/white-close.jpg', y:52},
  {f:'img/life/white-front.jpg', y:55},
  {f:'img/life/classic-top.jpg', y:48}
];
let lifeBag=[], lifeLast=-1;
function pickLife(){
  if(!lifeBag.length){
    lifeBag=LIFE.map((_,i)=>i);
    for(let i=lifeBag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=lifeBag[i];lifeBag[i]=lifeBag[j];lifeBag[j]=t}
    if(LIFE.length>1&&lifeBag[0]===lifeLast)lifeBag.push(lifeBag.shift());
  }
  lifeLast=lifeBag.shift();
  return LIFE[lifeLast];
}
function imgReady(im){
  return (im.complete&&im.naturalWidth)?Promise.resolve()
    :new Promise(r=>{im.addEventListener('load',r,{once:true});im.addEventListener('error',r,{once:true})});
}
function buildPrintDoc(){
  const cfg=resolved(); if(!cfg)return;
  const pp=promoFor(cfg);
  const lines=componentLines();
  const life=pickLife();
  const d=new Date().toLocaleDateString('en-AU',{day:'numeric',month:'long',year:'numeric'});
  $('print-doc').innerHTML=`
  <div class="pd-head">
    <div>${state.logo?`<img class="pd-logo" src="${state.logo}" alt="${esc(state.dealer||'Dealer')} logo">`:''}<div class="eyebrow">Advance Audio · Linn dealer configuration</div><h1>Linn Selekt DSM — Configured Specification</h1></div>
    <div class="pd-meta"><strong>${esc(ref())}</strong><br>${d}${state.dealer?'<br>'+esc(state.dealer):''}${state.customer?'<br>'+esc(state.customer):''}</div>
  </div>
  <img class="pd-banner" src="${life.f}" style="object-position:50% ${life.y}%" alt="Linn Selekt DSM in a domestic listening room">
  <img class="pd-shot" src="${shot('front')}" alt="${esc(state.chassis)} ${esc(state.colour)}">
  <div class="pd-rear">${rearHTML('none')}<div class="pd-rearcap">Rear panel as configured</div></div>
  <div class="pd-hero">
    <div><h2>${esc(state.chassis)} — ${esc(state.colour)}</h2>
      <div class="sub">${esc(specs()[1][1])} · ${fitted().length} of 3 cartridge slots fitted${state.hdmi?' · HDMI board':''}${state.surround?' · Surround board':''}</div></div>
    <div class="pd-price">${pp?`<div class="w">Was <s>${money(priceOf(cfg))}</s></div><div class="v">${money(pp.pay[state.currency])}</div><div class="b">Summer Incentive · saves ${money(pp.save[state.currency])}</div>`:`<div class="v">${money(priceOf(cfg))}</div><div class="b">${esc(retailNote().replace(', incl. GST',' · incl. GST'))}</div>`}</div>
  </div>
  <section><h3>Configuration</h3>
    <table><thead><tr><th>Component</th><th>SKU</th></tr></thead><tbody>
    ${lines.map(l=>`<tr><td>${esc(l.name)}</td><td>${esc(l.sku)}</td></tr>`).join('')}
    </tbody><tfoot>
      <tr><td>Configured bundle price (${state.currency} RRP, incl. GST)</td><td class="num">${pp?`<s>${money(priceOf(cfg))}</s>`:money(priceOf(cfg))}</td></tr>
      ${pp?`<tr><td>Linn Summer Incentive price (${PROMO.start} to ${PROMO.end})<br><small>${esc(promoOrderLine(pp,cfg))}</small></td><td class="num">${money(pp.pay[state.currency])}</td></tr>`:''}
    </tfoot></table>
  </section>
  <section><h3>Specification</h3>
    <table class="pd-specs"><tbody>${specs().map(([a,b])=>`<tr><th>${esc(a)}</th><td>${esc(b)}</td></tr>`).join('')}</tbody></table>
  </section>
  <section><h3>Configuration rules applied</h3>
    <p class="pd-note">${D.meta.logic.map(esc).join('<br>')}</p>
  </section>
  ${state.terms?`<section><h3>Terms &amp; conditions</h3>
    <p class="pd-note pd-terms">${esc(state.terms).replace(/\n/g,'<br>')}</p></section>`:''}
  <div class="pd-sign"><div>Dealer signature / date</div><div>Customer signature / date</div></div>
  <div class="pd-foot">
    ${pp?`Summer Incentive pricing applies to new customer orders placed ${PROMO.start} to ${PROMO.end}, one DAC upgrade per Selekt DSM, not demo purchases.${pp.mono?' The customer pays the difference between 2 × Mono Line Out cartridges and the stereo Line Out cartridge.':''} `:''}Prices are ${state.currency==='NZD'?'New Zealand':'Australian'} recommended retail in ${state.currency} including GST and are subject to change. This document is a configuration summary, not a tax invoice.
    Specifications sourced from Linn technical documentation: docs.linn.co.uk/wiki/index.php/Technical_Specification:Selekt_DSM_Classic/1 ·
    docs.linn.co.uk/wiki/index.php/Technical_Specification:Selekt_DSM_Edition ·
    docs.linn.co.uk/wiki/index.php/Selekt_DSM_/0_Classic_Hub ·
    docs.linn.co.uk/wiki/index.php/Selekt_DSM_FAQ's · Linn Selekt DSM Classic 2024 fact sheet.
    <br>Product photography \u00a9 Linn Products Ltd, supplied for dealer use. Advance Audio Australia \u2014 Linn distributor for Australia and New Zealand. Generated ${d}.
  </div>`;
}
async function exportPDF(){
  buildPrintDoc();
  document.title=ref()+' \u2014 Linn Selekt DSM specification';
  const btn=$('pdfBtn'), label=btn.textContent;
  const imgs=Array.prototype.slice.call($('print-doc').querySelectorAll('img'));
  btn.disabled=true; btn.textContent='Preparing\u2026';
  // The chosen photograph is usually not in cache yet. Printing before it
  // decodes would produce a spec sheet with a blank banner.
  await Promise.race([Promise.all(imgs.map(imgReady)), new Promise(r=>setTimeout(r,4000))]);
  btn.disabled=false; btn.textContent=label;
  window.print();
  const nxt=LIFE[lifeBag[0]]; if(nxt){const pre=new Image(); pre.src=nxt.f}
}

/* ---------- boot ---------- */
$('pdfBtn').textContent=EMBED?'Download your Linn Selekt configuration':'Export PDF spec sheet';
if(EMBED){
  $('embedBtn').remove();
  // Don't push a dealer's customer out to another site from inside their page.
  if($('lp12Btn'))$('lp12Btn').remove();
  if(state.dealer)$('brandEyebrow').textContent=state.dealer;
}else if(true){
  $('embedBtn').remove();
}else{
  $('embedBtn').onclick=openEmbed;
  $('embedClose').onclick=closeEmbed;
  $('embedModal').onclick=e=>{if(e.target.id==='embedModal')closeEmbed()};
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('embedModal').hidden)closeEmbed()});
}

/* ---------- keep the active step in view when the step changes ----------
   Steps differ a lot in height: on a phone "Configure slots" is ~700px taller
   than "Expansion". The browser preserves scrollY across a re-render, so
   advancing from the bottom of a tall step left the whole builder panel above
   the viewport and the price box filling the screen. Realign on step change
   only - never on the re-renders that happen while choosing within a step. */
function revealStep(){
  const el=document.querySelector('main.panel');
  if(!el)return;
  const r=el.getBoundingClientRect(), vh=window.innerHeight||0;
  /* Only realign when the step is genuinely hard to see: its top has scrolled
     off the screen, or it begins so low that almost none of it is visible.
     On desktop the panel sits below the hero and is fine as-is - don't move it. */
  const needs = r.top < 0 || r.top > vh - 220;
  if(!needs){ if(el.focus)el.focus({preventScroll:true}); return; }
  const y=Math.max(0,r.top+window.scrollY-14);
  const reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  try{window.scrollTo({top:y,behavior:reduce?'auto':'smooth'})}
  catch(e){window.scrollTo(0,y)}
  if(el.focus)el.focus({preventScroll:true});
}
function goStep(n){
  if(n===state.step)return;
  state.step=n; render(); revealStep();
}

$('back').onclick=()=>{if(state.step>0)goStep(state.step-1)};
$('next').onclick=()=>{if(state.step<3&&canNext())goStep(state.step+1)};
$('pdfBtn').onclick=exportPDF;
$('themeBtn').onclick=()=>{const r=document.documentElement;r.setAttribute('data-theme',r.getAttribute('data-theme')==='dark'?'light':'dark')};

if(INPROMO){
  window.addEventListener('message',e=>{const d=e.data||{};if(d.type==='promo-cur'&&CURRENCIES.includes(d.cur))setCurrency(d.cur,true)});
  window.addEventListener('resize',postHeight);
  new ResizeObserver(postHeight).observe(document.body);
}
/* ---------- currency toggle ---------- */
function renderCurrency(){
  const wrap=$('curSeg');
  if(!wrap)return;
  wrap.querySelectorAll('.seg-b').forEach(b=>{
    const on=b.dataset.cur===state.currency;
    b.classList.toggle('on',on);
    b.setAttribute('aria-pressed',on?'true':'false');
  });
  document.documentElement.setAttribute('data-currency',state.currency);
  const h=$('heroNote');
  if(h)h.textContent=state.currency==='NZD'
    ? 'Every valid Selekt DSM build with New Zealand retail pricing, shown as was and is under the Linn Summer Incentive (16 November 2026 to 5 January 2027).'
    : 'Every valid Selekt DSM build with Australian retail pricing, shown as was and is under the Linn Summer Incentive (16 November 2026 to 5 January 2027).';
  const e=$('heroEyebrow');
  if(e)e.textContent=state.currency==='NZD'
    ? 'Linn Selekt DSM \u00b7 New Zealand '+(DEALER?'dealer configurator':'pricing')
    : 'Linn Selekt DSM \u00b7 Australian '+(DEALER?'dealer configurator':'pricing');
  const c=$('curEyebrow');
  if(c)c.textContent=state.currency+' retail incl. GST';
  const n=$('curNote');
  if(n){
    // Only explain an auto-detected switch away from the AU default; once the
    // visitor picks a currency themselves the note is redundant.
    const auto=!currencyLocked&&(currencySource==='ip'||currencySource==='device');
    const show=auto&&state.currency==='NZD';
    n.textContent=show?'New Zealand pricing detected':'';
    n.hidden=!show;
  }
}
function setCurrency(cur,manual){
  if(manual)currencyLocked=true;
  if(!CURRENCIES.includes(cur)||cur===state.currency){if(manual)renderCurrency();return}
  state.currency=cur;
  renderCurrency();
  render();
  if($('embedModal')&&!$('embedModal').hidden)renderEmbed();
}
if($('curSeg')){
  $('curSeg').querySelectorAll('.seg-b').forEach(b=>{b.onclick=()=>setCurrency(b.dataset.cur,true)});
}
renderCurrency();
render();
resolveCurrencyByIP();
