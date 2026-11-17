/* Linn Selekt DSM Summer Incentive — Advance Audio / Advance One dealer page */
(function(){
const $=id=>document.getElementById(id);
let R=window.ROUTES.routes, DEALER=null;
const MONO=window.ROUTES.monoPair, LO=window.ROUTES.lineOut;
const MK={
  AUD:{co:'Advance Audio',full:'Advance Audio Australia',web:'advanceaudio.com.au',mail:'orders@advanceaudio.com.au',gst:'inc GST',retail:'Australian recommended retail in AUD, including GST',credGst:'inc GST'},
  NZD:{co:'Advance One',full:'Advance One',web:'advanceone.co.nz',mail:'Jason@advanceone.co.nz',gst:'ex GST',retail:'New Zealand recommended retail in NZD, including GST',credGst:'ex GST'}
};
const CREDIT={conv:200,mkt:100}, CAP={edm:2,social:2,web:1};
let cur='AUD', curSource='default', curLocked=false;

const money=(n,c)=>{c=c||cur;const s=Math.round(n).toLocaleString('en-AU');return (c==='NZD'?'NZ$':'$')+s};
const money2=(n,c)=>{c=c||cur;const r=Math.round(n*100)/100;const s=r.toLocaleString('en-AU',{minimumFractionDigits:r%1?2:0,maximumFractionDigits:2});return (c==='NZD'?'NZ$':'$')+s};
const dTag=c=>{c=c||cur;return c==='NZD'?'ex GST':'inc GST'};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const DACN={'Standard DAC':'Standard DAC','Katalyst DAC':'Katalyst','Organik Stereo DAC':'Organik','Dual Mono Organik':'Dual Mono Organik'};
const CARD={'Line Out':'Stereo line out cartridge','Power Out':'Stereo power amplifier cartridge','Hybrid Power Out':'Hybrid cartridge: one amplified channel plus a line feed'};
const route=(hub,card)=>R.find(r=>r.chassis===hub&&r.card===card);
const maxSave=(i,c)=>Math.max(...R.filter(r=>r.steps[i]&&r.card!=='Hybrid Power Out').map(r=>r.steps[i].save[c]));

/* ---------- currency: URL > visitor toggle > Cloudflare country > device timezone ---------- */
const QS=new URLSearchParams(location.search);
const qc=(QS.get('cur')||'').toUpperCase();
function fromDevice(){
  try{const tz=Intl.DateTimeFormat().resolvedOptions().timeZone||'';
    if(/^Pacific\/(Auckland|Chatham)$/i.test(tz))return'NZD';
    if(/^(Australia|Antarctica\/Macquarie)\//i.test(tz))return'AUD';
    for(const l of [navigator.language].concat(navigator.languages||[])){const m=/-([A-Z]{2})$/i.exec(l||'');if(m){const k=m[1].toUpperCase();if(k==='NZ')return'NZD';if(k==='AU')return'AUD'}}
  }catch(e){}return null}
async function fromIP(){
  try{const ctl=new AbortController();setTimeout(()=>ctl.abort(),2500);
    const r=await fetch('/cdn-cgi/trace',{cache:'no-store',signal:ctl.signal});if(!r.ok)return null;
    const loc=((await r.text()).match(/^loc=([A-Z]{2})/m)||[])[1];return loc?(loc==='NZ'?'NZD':'AUD'):null}catch(e){return null}}
if(qc==='AUD'||qc==='NZD'){cur=qc;curLocked=true;curSource='url'}else{const d=fromDevice();if(d){cur=d;curSource='device'}}

function setCur(c,manual){
  if(manual){curLocked=true;curSource='manual'}
  cur=c;document.documentElement.setAttribute('data-cur',c);
  document.querySelectorAll('.seg button').forEach(b=>{const on=b.dataset.cur===c;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on)});
  $('curNote').textContent=(!curLocked&&(curSource==='ip'||curSource==='device'))?(c==='NZD'?'New Zealand pricing detected':'Australian pricing detected'):'';
  const m=MK[c];
  document.querySelectorAll('[data-mail]').forEach(a=>{a.href='mailto:'+m.mail;a.textContent=m.mail});
  $('webTxt').textContent=m.web;
  renderAll();
  const f=$('cfgFrame');
  if(f.dataset.loaded){try{f.contentWindow.postMessage({type:'promo-cur',cur:c},'*')}catch(e){}}
  $('cfgOpen').href='selektor/?cur='+c;
}
document.querySelectorAll('.seg button').forEach(b=>b.onclick=()=>setCur(b.dataset.cur,true));

/* ---------- offer ladder ---------- */
function renderLadder(){
  const L=[['Standard DAC','Katalyst','Buy a Standard DAC and the customer receives Katalyst.'],
           ['Katalyst','Organik','Buy a Katalyst and the customer receives Organik.'],
           ['Stereo Organik','Dual Mono Organik','Buy stereo Organik and the customer receives dual mono Organik.*']];
  $('ladder').innerHTML=L.map((l,i)=>`<div class="rung r d${i+1}"><div class="n">0${i+1}</div><div class="buy">Customer buys</div><div class="from">${l[0]}</div><div class="arrow">&#8595;</div><div class="buy">Customer receives</div><div class="to"><em>${l[1]}</em></div>
    ${i===2?'<div class="foot">*Customer pays the difference to change the stereo Line Out cartridge for 2 × Mono Line Out cartridges.</div>':''}</div>`).join('');
}

/* ---------- savings ---------- */
let hub='Selekt Classic';
document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>{hub=b.dataset.hub;document.querySelectorAll('.tabs button').forEach(x=>{x.classList.toggle('on',x===b);x.setAttribute('aria-selected',x===b)});renderSavings()});
function renderSavings(){
  const hubName=hub==='Selekt Classic'?'Selekt DSM Classic':'Selekt DSM Edition';
  $('svGrid').innerHTML=['Line Out','Power Out'].map(card=>{
    const r=route(hub,card);
    return `<div class="sv-card"><h3>${card==='Hybrid Power Out'?'Hybrid':card}</h3><div class="sub">${hubName} · ${CARD[card]}</div>${r.steps.map(s=>`
      <div class="sv-row"><div class="rt">${DACN[s.from]} &#8594; ${DACN[s.to]}${s.mono?'*':''}<small>${s.mono?'Customer pays the Mono Line Out difference':'Next DAC level, no extra cost'}</small></div>
      <div class="amt">${money(s.mono?s.dsm[cur]+s.upg[cur]:s.pay[cur])}<small>Promotion price</small></div>
      <div class="px">${s.mono?`<span class="brk">${money(s.dsm[cur])} + ${money(s.upg[cur])} Mono Line Out difference</span> · `:''}Normally ${money(s.get[cur])}</div>
      ${DEALER?`<div class="px dl">Dealer: cost price ${cur==='NZD'?'ex':'inc'} <b>${money2(s.dpay[cur])}</b> · normally ${money2(s.dget[cur])}</div>`:''}</div>`).join('')}</div>`}).join('');
  $('svFine').innerHTML=`Prices are ${MK[cur].retail}, from the current Linn Selekt DSM retail list used in the Advance Audio Selekt DSM configurator. The promotion price is the full Selekt DSM bundle the customer pays for; the normal price is the bundle they receive with the next DAC level. ${DEALER?`Dealer prices are from the October 2026 Linn dealer list (${cur==='NZD'?'NZD, excluding GST':'AUD, including GST'}).`:''} *Dual mono: the customer orders a stereo Organik Selekt DSM with a stereo Line Out cartridge and receives dual mono Organik (2 × Organik Mono DAC). The Mono Line Out cartridges are not part of the upgrade, so the customer pays the difference between 2 × Mono Line Out cartridges (${money(MONO[cur])} RRP) and the stereo Line Out cartridge (${money(LO[cur])} RRP): ${money(MONO[cur]-LO[cur])}.`;
}

/* ---------- inline price tokens ---------- */
function renderTokens(){
  document.querySelectorAll('[data-max]').forEach(e=>e.textContent=money(Math.max(maxSave(0,cur),maxSave(1,cur),maxSave(2,cur))));
  document.querySelectorAll('[data-p]').forEach(e=>{const [h,c,i,k]=e.dataset.p.split('|');if(k[0]==='d'&&!DEALER){e.textContent='';return}e.textContent=(k[0]==='d'?money2:money)(route(h,c).steps[+i][k][cur])});
  document.querySelectorAll('[data-dtag]').forEach(e=>e.textContent=dTag());
  document.querySelectorAll('[data-cp]').forEach(e=>e.textContent=cur==='NZD'?'ex':'inc');
  document.querySelectorAll('[data-credit]').forEach(e=>e.textContent=money(+e.dataset.credit));
  document.querySelectorAll('[data-credit-txt]').forEach(e=>e.textContent=`${cur==='NZD'?'NZ$':'AU$'}${e.dataset.creditTxt} ${MK[cur].credGst}`);
}

/* ---------- plan ---------- */
let web=null;
const num=(id,max)=>{const v=parseInt($(id).value,10);let n=isFinite(v)&&v>0?v:0;if(max&&n>max){n=max;$(id).value=max}return n};
document.querySelectorAll('#qWeb button').forEach(b=>b.onclick=()=>{web=b.dataset.v==='1'?true:false;document.querySelectorAll('#qWeb button').forEach(x=>{x.classList.toggle('on',x===b);x.setAttribute('aria-pressed',x===b)});renderPlan()});
['qEntry','qOlder','qSell','qEdm','qSocial'].forEach(id=>$(id).addEventListener('input',renderPlan));
function plan(){
  const p={entry:num('qEntry'),older:num('qOlder'),sell:num('qSell'),edm:num('qEdm',CAP.edm),social:num('qSocial',CAP.social),web};
  p.conv=p.sell*CREDIT.conv; p.mkt=(p.edm+p.social+(web?1:0))*CREDIT.mkt; p.tot=p.conv+p.mkt; return p;
}
const dash=v=>v===null?'Not answered':v;
function renderPlan(){
  const p=plan();
  $('sConv').textContent=money(p.conv);$('sMkt').textContent=money(p.mkt);$('sTot').textContent=money(p.tot);
  const g=MK[cur].credGst;
  $('recap').innerHTML=[
    ['Entry or mid-level streamer customers ready to upgrade',p.entry],
    ['Customers with older Linn streamers',p.older],
    ['Selekt DSM systems you think you can sell',p.sell],
    ['EDMs you’ll send',p.edm],
    ['Social media posts you’ll publish',p.social],
    ['Listing the promotion on your website',web===null?'Not answered':(web?'Yes':'No')],
    ['Conversion credit ('+g+')',money(p.conv)],
    ['Marketing credit ('+g+')',money(p.mkt)]
  ].map(r=>`<div><span>${esc(r[0])}</span><b>${esc(r[1])}</b></div>`).join('')+`<div class="tot"><span>Potential credit towards new Linn floor stock (${g})</span><b>${money(p.tot)}</b></div>`;
}

/* ---------- terms ---------- */
function terms(){
  const g=MK[cur].credGst, co=MK[cur].co, c=cur==='NZD'?'NZ$':'AU$';
  return [
    ['Promotion period','Applies to new-customer Selekt DSM orders placed between 16 November 2026 and 5 January 2027.'],
    ['Eligible orders','Selekt DSM Classic or Edition Hub ordered with an output cartridge and a DAC. Customer orders only; demo purchases are not eligible for the DAC upgrade.'],
    ['The upgrade','The customer receives the next level of DAC at no extra cost: Standard to Katalyst, Katalyst to Organik, or stereo Organik to dual mono Organik.'],
    ['One per Selekt DSM','Limited to one DAC upgrade per Selekt DSM, even if the system has multiple DACs.'],
    ['Dual mono','For stereo Organik to dual mono Organik, the customer orders a stereo Organik Selekt DSM with a stereo Line Out cartridge and receives 2 × Organik Mono DAC. The customer pays the difference between 2 × Mono Line Out cartridges and the stereo Line Out cartridge at full retail.'],
    ['Ordering','Tell Orders you are using the Summer Incentive and clearly state what the customer is paying for and what they should receive. It will not be applied automatically.'],
    ['Dealer pricing','Dealer prices are from the October 2026 Linn dealer list ('+(cur==='NZD'?'NZD, excluding GST':'AUD, including GST')+'). You are invoiced for the build the customer pays for and receive the upgraded build.'],
    ['Customer savings','Savings shown are the difference between full Selekt DSM retail bundle prices ('+(cur==='NZD'?'NZD':'AUD')+', including GST), not individual module prices.'],
    ['Conversion credit',`${c}200 ${g} credit for every customer converted to a Selekt DSM order placed through the Summer Incentive during the promotion period.`],
    ['Marketing credit',`${c}100 ${g} credit for each EDM sent (up to 2), each social media post published (up to 2), and for listing the promotion on your website (1), during the promotion period. Maximum ${c}500 ${g} marketing credit per dealer. Share a copy, screenshot or link with your rep to confirm each one.`],
    ['Floor-stock bonus','Commit to floor stock in any Selekt DSM, cartridge or DAC during the promotion period and receive an additional 5% floor-stock allowance on top of your standard allowance.'],
    ['Using your credit',`Credit is applied to your ${co} account for use towards new Linn floor stock orders. It has no cash value. Credit will be calculated after the promotion finishes. You will be notified how much credit you have earnt and your rep will work out an order with you.`],
    ['Your plan','Numbers in your plan are your own estimates. Credit is based on the orders and marketing activity you actually deliver.']
  ].filter(t=>DEALER||t[0]!=='Dealer pricing');
}
function renderTerms(){$('termsList').innerHTML=terms().map(t=>`<li><b>${esc(t[0])}</b><span>${esc(t[1])}</span></li>`).join('')}

function renderAll(){renderLadder();renderSavings();renderTokens();renderPlan();renderTerms()}

/* ---------- dealer pricing unlock ----------
   The public page carries RRP only. Dealer prices live in dealer.js, AES-GCM encrypted
   (PBKDF2-SHA256) with the dealer password, and are only decrypted in the browser. */
let DSAVED=null;
const dlBtn=$('dealerBtn'), dlModal=$('dlModal'), dlPw=$('dlPw'), dlMsg=$('dlMsg');
function dlLabel(){const on=!!DEALER;document.documentElement.classList.toggle('dealer-on',on);
  dlBtn.querySelector('span').textContent=on?'Hide dealer pricing':(DSAVED?'Show dealer pricing':'Dealer pricing');
  dlBtn.setAttribute('aria-pressed',on?'true':'false');}
function dlApply(on){DEALER=on?DSAVED.dealer:null;R=on?DSAVED.routes:window.ROUTES.routes;dlLabel();renderAll();onScroll();
  if(frame.dataset.loaded){frame.dataset.loaded='';loadFrame()}}
function dlOpen(){dlModal.hidden=false;document.body.classList.add('modal-open');dlMsg.textContent='';dlPw.value='';setTimeout(()=>dlPw.focus(),30)}
function dlClose(){dlModal.hidden=true;document.body.classList.remove('modal-open');dlBtn.focus()}
async function dlUnlock(pw){
  const E=window.__DENC;if(!E)throw new Error('missing');
  const b64=x=>Uint8Array.from(atob(x),c=>c.charCodeAt(0));
  const base=await crypto.subtle.importKey('raw',new TextEncoder().encode(pw),'PBKDF2',false,['deriveKey']);
  const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:b64(E.salt),iterations:E.it,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['decrypt']);
  return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:b64(E.iv)},key,b64(E.ct))));
}
dlBtn.onclick=()=>{if(DEALER)dlApply(false);else if(DSAVED)dlApply(true);else dlOpen()};
$('dlClose').onclick=dlClose;
dlModal.onclick=e=>{if(e.target===dlModal)dlClose()};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!dlModal.hidden)dlClose()});
$('dlForm').onsubmit=async e=>{e.preventDefault();const go=$('dlGo');
  if(!window.crypto||!crypto.subtle){dlMsg.textContent='Please open this page over https in an up-to-date browser.';return}
  go.disabled=true;go.textContent='Checking…';dlMsg.textContent='';
  try{DSAVED=await dlUnlock(dlPw.value);dlClose();dlApply(true)}
  catch(err){dlMsg.textContent=window.__DENC?'That password isn’t right. Please try again.':'Dealer pricing is unavailable right now.';dlPw.select()}
  go.disabled=false;go.textContent='Unlock';};

/* ---------- configurator iframe ---------- */
const frame=$('cfgFrame');
/* pplx.app sends X-Frame-Options: DENY on every page (even same-origin), so the configurator
   is loaded as srcdoc (no response headers) with a <base> pointing at /selektor/. */
async function loadFrame(){if(frame.dataset.loaded)return;frame.dataset.loaded='1';
  const base=new URL('selektor/',location.href).href;
  try{const r=await fetch(base+'index.html',{cache:'no-store'});let h=await r.text();
    h=h.replace(/<head>/i,'<head><base href="'+base+'"><script>window.__QS="?inpromo=1&cur='+cur+'";window.__DEALER='+JSON.stringify(DEALER)+'<\/script>');
    frame.srcdoc=h;}
  catch(e){frame.src='selektor/?inpromo=1&cur='+cur}}
window.addEventListener('message',e=>{const d=e.data||{};if(d.type==='selekt-height'&&e.source===frame.contentWindow&&d.h>200)frame.style.height=Math.min(d.h+8,6000)+'px'});
new IntersectionObserver((es,o)=>{if(es.some(x=>x.isIntersecting)){loadFrame();o.disconnect()}},{rootMargin:'800px'}).observe(frame);

/* ---------- PDF ---------- */
const today=new Date();
const dateTxt=today.toLocaleDateString('en-AU',{day:'numeric',month:'long',year:'numeric'});
$('fDate').value=dateTxt;
const ref='LWI-'+today.toISOString().slice(2,10).replace(/-/g,'')+'-'+Math.random().toString(36).slice(2,6).toUpperCase();
const slug=s=>s.replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'');
let lastPdf=null;
function buildPdf(d){
  const A=window.PDFA;const {jsPDF}=window.jspdf;const doc=new jsPDF({unit:'mm',format:'a4'});
  doc.addFileToVFS('IS.ttf',A.isr);doc.addFont('IS.ttf','IS','normal');
  doc.addFileToVFS('ISI.ttf',A.isi);doc.addFont('ISI.ttf','IS','italic');
  doc.addFileToVFS('MR.ttf',A.mr);doc.addFont('MR.ttf','MR','normal');
  doc.addFileToVFS('MSB.ttf',A.msb);doc.addFont('MSB.ttf','MSB','normal');
  doc.addFileToVFS('MB.ttf',A.mb);doc.addFont('MB.ttf','MB','normal');
  const p=plan(), m=MK[cur], g=m.credGst, W=210, M=16, INK=[18,19,21], COP=[209,98,40], CS=[224,138,90], BODY=[74,71,65], MUT=[107,103,96], SAND=[233,227,216];
  const col=c=>doc.setTextColor(...c), fill=c=>doc.setFillColor(...c), draw=c=>doc.setDrawColor(...c);
  const f=(n,s)=>{doc.setFont(n,'normal');doc.setFontSize(s)};
  const sz=(src,h)=>{const q=doc.getImageProperties(src);return [h*q.width/q.height,h]};
  const LOGO=cur==='NZD'?A.ao:A.aa;
  let y=0;
  function header(first){
    fill(INK);doc.rect(0,0,W,first?58:22,'F');
    const [lw,lh]=sz(LOGO,first?7:6);doc.addImage(LOGO,'PNG',M,first?11:8,lw,lh);
    const [nw,nh]=sz(A.linn,first?15:9);doc.addImage(A.linn,'PNG',W-M-nw,first?8:6.5,nw,nh);
    if(first){
      f('MSB',7.5);col(CS);doc.setCharSpace(.9);doc.text('LINN SELEKT DSM · SUMMER INCENTIVE · 16 NOV 2026 – 5 JAN 2027',M,34);doc.setCharSpace(0);
      f('IS',26);col([235,236,237]);doc.text('Dealer plan',M,47);
      const tw=doc.getTextWidth('Dealer plan')+3;f('ISI',26);col(CS);doc.text('& credit summary',M+tw,47);
      y=68;
    } else y=32;
  }
  function footer(){
    const n=doc.getNumberOfPages();
    for(let i=1;i<=n;i++){doc.setPage(i);draw([220,214,204]);doc.setLineWidth(.2);doc.line(M,284,W-M,284);
      f('MR',7);col(MUT);doc.text(`${m.full} · ${m.web}`,M,289);
      doc.text(`${ref} · Page ${i} of ${n}`,W-M,289,{align:'right'})}
  }
  const need=h=>{if(y+h>278){doc.addPage();header(false)}};
  header(true);
  const det=[['Dealership',d.dealer],['Contact',d.name],['Email',d.email],['Date',dateTxt],['Reference',ref],['Market',cur==='NZD'?'New Zealand · NZD':'Australia · AUD']];
  det.forEach((r,i)=>{const x=M+(i%2)*((W-2*M)/2), yy=y+Math.floor(i/2)*11;f('MSB',6.5);col(MUT);doc.setCharSpace(.8);doc.text(r[0].toUpperCase(),x,yy);doc.setCharSpace(0);f('MR',10);col(INK);doc.text(doc.splitTextToSize(r[1],85)[0],x,yy+5)});
  y+=36;
  const table=(title,rows)=>{
    need(14+rows.length*9);f('IS',16);col(INK);doc.text(title,M,y);y+=4;
    rows.forEach((r,i)=>{const lines=doc.splitTextToSize(r[0],125);const h=Math.max(9,lines.length*4.2+4.6);
      if(i%2===0){fill([248,245,240]);doc.rect(M,y,W-2*M,h,'F')}
      f('MR',8.6);col(BODY);doc.text(lines,M+3,y+5.6,{lineHeightFactor:1.35});
      f('MSB',9.5);col(INK);doc.text(String(r[1]),W-M-3,y+5.6,{align:'right'});
      if(r[2]){f('MR',7.4);col(COP);doc.text(r[2],W-M-34,y+5.6,{align:'right'})}
      y+=h});
    draw([200,194,184]);doc.setLineWidth(.3);doc.line(M,y,W-M,y);y+=10;
  };
  table('Your opportunity',[
    ['Customers who bought an entry or mid-level streamer from you in the past 3–5 years who may be ready to upgrade',p.entry],
    ['Customers with older Linn streamers (for example Akurate or Majik DSM)',p.older],
    ['Selekt DSM systems you think you can sell during the promotion',p.sell,`× ${money(CREDIT.conv)} ${g}`]
  ]);
  table('Your marketing',[
    ['EDMs you’ll send (up to 2)',p.edm,`× ${money(CREDIT.mkt)} ${g}`],
    ['Social media posts you’ll publish (up to 2)',p.social,`× ${money(CREDIT.mkt)} ${g}`],
    ['Listing the promotion on your website',web===null?'Not answered':(web?'Yes':'No'),web?`${money(CREDIT.mkt)} ${g}`:'']
  ]);
  need(58);
  fill(INK);doc.roundedRect(M,y,W-2*M,52,2,2,'F');
  draw([60,62,66]);doc.setLineWidth(.2);doc.line(M+8,y+14,W-M-8,y+14);f('MSB',6.5);col(CS);doc.setCharSpace(1);doc.text('POTENTIAL CREDIT TOWARDS NEW LINN FLOOR STOCK',M+8,y+10);doc.setCharSpace(0);
  f('IS',34);col(CS);doc.text(money(p.tot),M+8,y+30);
  f('MR',7.6);col([201,203,206]);doc.text(doc.splitTextToSize(`${cur==='NZD'?'NZD, excluding GST':'AUD, including GST'}. Based on your plan. Credit is earned on converted Summer Incentive orders and confirmed marketing activity.`,72),M+8,y+37);
  const mx=M+96;[['Conversion credit',money(p.conv),`${p.sell} × ${money(CREDIT.conv)}`],['Marketing credit',money(p.mkt),`${p.edm+p.social+(web?1:0)} × ${money(CREDIT.mkt)}`]].forEach((r,i)=>{const yy=y+21+i*15;
    f('MSB',6.3);col([163,166,170]);doc.setCharSpace(.6);doc.text(r[0].toUpperCase(),mx,yy);doc.setCharSpace(0);
    f('IS',18);col([235,236,237]);doc.text(r[1],W-M-8,yy+2,{align:'right'});f('MR',7.4);col([163,166,170]);doc.text(r[2],mx,yy+5)});
  y+=60;
  if(d.floor||d.notes){
    const nl=d.notes?doc.splitTextToSize(d.notes,W-2*M-10):[];
    const h=8+(d.floor?6:0)+nl.length*4.2;need(h+6);fill(SAND);doc.roundedRect(M,y,W-2*M,h,1.5,1.5,'F');let yy=y+6.5;
    if(d.floor){f('MSB',8.4);col(COP);doc.text('Interested in Selekt DSM floor stock with the extra 5% floor-stock allowance.',M+5,yy);yy+=6}
    if(nl.length){f('MR',8.2);col(BODY);doc.text(nl,M+5,yy,{lineHeightFactor:1.4})}
    y+=h+8;
  }
  need(20);f('IS',16);col(INK);doc.text('Promotion terms',M,y);y+=6;
  terms().forEach((tm,i)=>{f('MR',7.6);const lines=doc.splitTextToSize(tm[1],W-2*M-44);const h=lines.length*3.8+3.2;need(h);
    f('MSB',7.6);col(INK);doc.text(`${String(i+1).padStart(2,'0')}  ${tm[0]}`,M,y+3);
    f('MR',7.6);col(BODY);doc.text(lines,M+44,y+3,{lineHeightFactor:1.4});y+=h});
  y+=3;need(16);fill(SAND);doc.roundedRect(M,y,W-2*M,13,1.5,1.5,'F');f('MR',7.8);col(BODY);
  doc.text(doc.splitTextToSize(`Next step: send this plan to your ${m.co} rep or ${m.mail}. When you place a Summer Incentive order, state what the customer is paying for and what they should receive.`,W-2*M-10),M+5,y+5.2,{lineHeightFactor:1.4});
  footer();
  return doc;
}
function vals(){return {dealer:$('fDealer').value.trim(),name:$('fName').value.trim(),email:$('fEmail').value.trim(),notes:$('fNotes').value.trim(),floor:$('fFloor').checked,agree:$('fAgree').checked}}
function save(){const a=document.createElement('a');a.href=URL.createObjectURL(lastPdf.blob);a.download=lastPdf.name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500)}
$('cform').addEventListener('submit',e=>{
  e.preventDefault();const d=vals(),msg=$('formMsg');
  ['fDealer','fName','fEmail'].forEach(id=>$(id).removeAttribute('aria-invalid'));
  const bad=[];if(!d.dealer)bad.push('fDealer');if(!d.name)bad.push('fName');if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email))bad.push('fEmail');
  bad.forEach(id=>$(id).setAttribute('aria-invalid','true'));
  if(bad.length){msg.textContent='Please add your dealership name, your name and a valid email address.';$(bad[0]).focus();return}
  if(!d.agree){msg.textContent='Please confirm you agree to the promotion terms.';return}
  if(!window.jspdf||!window.PDFA){msg.textContent='The PDF tools are still loading. Please try again in a moment.';return}
  msg.textContent='';
  try{const doc=buildPdf(d);lastPdf={blob:doc.output('blob'),name:`Linn-Summer-Incentive-Plan-${slug(d.dealer)||'Dealer'}-${ref}.pdf`,d,p:plan()};save();
    $('doneTxt').textContent=`${lastPdf.name} has downloaded. Email it to yourself, then forward it to your ${MK[cur].co} rep.`;
    $('done').classList.add('show')}
  catch(err){console.error(err);msg.textContent='Something went wrong generating the PDF. Please try again.'}
});
$('dlBtn').onclick=()=>lastPdf&&save();
$('mailBtn').onclick=async()=>{
  if(!lastPdf)return;const {d,p,name}=lastPdf, m=MK[cur], g=m.credGst;
  const file=new File([lastPdf.blob],name,{type:'application/pdf'});
  const subject=`Linn Summer Incentive plan – ${d.dealer} (${ref})`;
  const body=`Hi ${d.name},\n\nYour Linn Selekt DSM Summer Incentive plan is attached.\n\nDealership: ${d.dealer}\nReference: ${ref}\nDate: ${dateTxt}\n\nSelekt DSM systems you think you can sell: ${p.sell}\nEDMs: ${p.edm} · Social posts: ${p.social} · Website listing: ${web===null?'Not answered':(web?'Yes':'No')}\n\nPotential credit towards new Linn floor stock: ${money(p.tot)} ${g}\n\nNext step: forward this email and PDF to your ${m.co} rep or ${m.mail}.`;
  if(navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({files:[file],title:subject,text:body});return}catch(e){if(e.name==='AbortError')return}}
  location.href=`mailto:${encodeURIComponent(d.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body+`\n\nPlease attach: ${name} (saved to your Downloads folder).`)}`;
};

/* ---------- navigation ---------- */
const deck=$('deck'), slides=[...document.querySelectorAll('.slide')], prog=$('progress'), bar=$('bar');
const secMap={offer:'offer',savings:'savings',ordering:'ordering',targets:'targets',floorstock:'floorstock',configurator:'configurator',plan:'plan',confirm:'plan',terms:'terms'};
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('in')}),{threshold:.08});
slides.forEach(s=>io.observe(s));
function onScroll(){
  const mid=deck.scrollTop+window.innerHeight*.35;let cur=0;
  slides.forEach((s,i)=>{if(s.offsetParent&&s.offsetTop<=mid)cur=i});
  const s=slides[cur];
  document.body.classList.toggle('on-paper',s.classList.contains('paper'));
  bar.classList.toggle('solid',deck.scrollTop>40);
  document.querySelectorAll('.bar nav a').forEach(a=>a.classList.toggle('active',a.dataset.sec===secMap[s.id]));
  prog.style.width=Math.min(100,(deck.scrollTop/(deck.scrollHeight-deck.clientHeight||1))*100)+'%';
}
deck.addEventListener('scroll',onScroll,{passive:true});
document.addEventListener('click',e=>{const a=e.target.closest('a[href^="#"]');if(!a)return;const t=document.querySelector(a.getAttribute('href'));if(t){e.preventDefault();deck.scrollTo({top:t.offsetTop,behavior:'smooth'})}});
window.addEventListener('beforeprint',()=>slides.forEach(s=>s.classList.add('in')));

setCur(cur,false);onScroll();
if(!curLocked){fromIP().then(ip=>{if(!ip||curLocked)return;curSource='ip';setCur(ip,false)})}
})();
