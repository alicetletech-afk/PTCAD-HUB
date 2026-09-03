let state={campaigns:[],salespeople:[],channels:[],selected:null,currentUrl:"",shortUrl:"",currentCaption:"",originalCaption:""};
const $=s=>document.querySelector(s);const $$=s=>[...document.querySelectorAll(s)];
const CF_KEYS=["cf_utm_source","cf_utm_medium","cf_utm_campaign","cf_utm_term","cf_utm_content"];
const LEGACY_UTM_KEYS=["utm_source","utm_medium","utm_campaign","utm_term","utm_content"];

function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200)}
function statusOf(c){const n=new Date(),s=new Date(c.start_date),e=new Date(c.end_date+"T23:59:59");if(n<s)return["Upcoming","badge-upcoming"];if(n>e)return["Expired","badge-expired"];return["Active","badge-active"]}
function fmtDate(d){return new Date(d).toLocaleDateString("th-TH",{day:"numeric",month:"short",year:"numeric"})}
function slug(value=""){return String(value).trim().toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9_-]/g,"")}
function sourceCode(item){return item?.cf_utm_source||item?.source_code||item?.ref_code||item?.utm_code||slug(item?.display_name||"")}
function channelCode(item){return item?.cf_utm_medium||item?.channel_code||item?.utm_source||slug(item?.display_name||"")}
function crmSoftware(){return slug(PTCAD_CONFIG.crmSoftware||"zoho-crm")||"zoho-crm"}

async function init(){
  document.querySelectorAll(".ptcad-logo").forEach(i=>i.src=PTCAD_CONFIG.logoUrl);
  const [c,s,ch]=await Promise.all([PTCADApi.request("getActiveCampaigns"),PTCADApi.request("getSalespeople"),PTCADApi.request("getChannels")]);
  state.campaigns=(c.data||[]).sort((a,b)=>(a.display_order||99)-(b.display_order||99));
  state.salespeople=s.data||[];
  state.channels=ch.data||[];
  renderCampaigns();fillSelects();renderHistory();
  const remembered=sessionStorage.getItem("ptcad_selected_campaign");
  if(remembered&&state.campaigns.some(x=>campaignKey(x.campaign_id)===campaignKey(remembered)))selectCampaign(remembered);
  $("#campaignCount").textContent=state.campaigns.length;
  $("#crmSoftwareValue").textContent=crmSoftware();
}
function campaignKey(value){return String(value??"").trim()}
function renderCampaigns(){
  const box=$("#campaignGrid");
  box.innerHTML=state.campaigns.map(c=>{
    const st=statusOf(c), id=campaignKey(c.campaign_id);
    return`<article class="campaign-card" data-id="${id}" role="button" tabindex="0" aria-label="เลือกแคมเปญ ${c.campaign_name}"><div class="campaign-image">${c.kv_image?`<img src="${c.kv_image}" alt="">`:`PTCAD<br>${c.product}`}</div><div class="campaign-body"><div class="campaign-top"><div><h3>${c.campaign_name}</h3><p>${c.description||""}</p></div><span class="badge ${st[1]}">${st[0]}</span></div><div class="campaign-footer"><span class="date">${fmtDate(c.start_date)} – ${fmtDate(c.end_date)}</span><button type="button" class="btn btn-secondary select-campaign" data-id="${id}">เลือก</button></div></div></article>`
  }).join("");
  box.onclick=e=>{const card=e.target.closest('.campaign-card');if(card)selectCampaign(card.dataset.id)};
  box.onkeydown=e=>{if((e.key==='Enter'||e.key===' ')&&e.target.closest('.campaign-card')){e.preventDefault();selectCampaign(e.target.closest('.campaign-card').dataset.id)}};
}
function fillSelects(){
  $("#salesperson").innerHTML='<option value="">เลือกเซลล์ / Reseller</option>'+state.salespeople.map(x=>`<option value="${x.sales_id}">${x.display_name}</option>`).join("");
  $("#channel").innerHTML='<option value="">เลือกช่องทาง</option>'+state.channels.map(x=>`<option value="${x.channel_id}">${x.display_name}</option>`).join("")
}
function selectCampaign(id){
  const key=campaignKey(id);
  const selected=state.campaigns.find(x=>campaignKey(x.campaign_id)===key);
  if(!selected){toast("ไม่พบข้อมูลแคมเปญ กรุณารีเฟรชหน้า");return}
  state.selected=selected;
  sessionStorage.setItem("ptcad_selected_campaign",key);
  $$('.campaign-card').forEach(c=>{
    const active=campaignKey(c.dataset.id)===key;
    c.classList.toggle('selected',active);
    const btn=c.querySelector('.select-campaign');
    if(btn){btn.textContent=active?'เลือกแล้ว ✓':'เลือก';btn.classList.toggle('is-selected',active)}
  });
  $("#landingPage").value=selected.landing_page||"";
  $("#caption").value=selected.caption||"";
  $("#selectedCampaign").textContent=selected.campaign_name||key;
  $("#generator").classList.add("has-campaign");
  window.scrollTo({top:$("#generator").offsetTop-80,behavior:"smooth"});
}
function buildUrl(base,params){
  const u=new URL(base);
  const removeKeys=new Set(["ref",...CF_KEYS,...LEGACY_UTM_KEYS]);
  const existing=[...u.searchParams.entries()].filter(([key])=>!removeKeys.has(key));
  u.search="";
  if(params.ref)u.searchParams.append("ref",params.ref);
  existing.forEach(([key,value])=>u.searchParams.append(key,value));
  CF_KEYS.forEach(key=>{if(params[key])u.searchParams.append(key,params[key])});
  return u.toString();
}
function replaceCaption(t,url,sales){return(t||"").replaceAll("{{generated_url}}",url).replaceAll("{{campaign_name}}",state.selected?.campaign_name||"").replaceAll("{{product}}",state.selected?.product||"").replaceAll("{{salesperson}}",sales?.display_name||"").replaceAll("{{start_date}}",state.selected?.start_date||"").replaceAll("{{end_date}}",state.selected?.end_date||"")}
async function generate(){
  if(!state.selected)return toast("กรุณาเลือกแคมเปญ");
  const sales=state.salespeople.find(x=>x.sales_id===$("#salesperson").value);
  const channel=state.channels.find(x=>x.channel_id===$("#channel").value);
  const base=$("#landingPage").value.trim();
  if(!sales)return toast("กรุณาเลือกเซลล์ / Reseller");
  if(!channel)return toast("กรุณาเลือกช่องทาง");
  try{new URL(base)}catch{return toast("กรุณาตรวจสอบ Landing Page")}

  const content=slug($("#contentVariant").value);
  const source=sourceCode(sales);
  const medium=channelCode(channel);
  const campaignId=String(state.selected.campaign_id||"").trim();
  const term=crmSoftware();
  const refCode=sales.ref_code||sales.utm_code||source;

  if(!source)return toast("รายการนี้ยังไม่มี Source Code");
  if(!medium)return toast("ช่องทางนี้ยังไม่มี Channel Code");
  if(!campaignId)return toast("แคมเปญนี้ยังไม่มี Campaign ID");

  state.shortUrl="";
  state.currentUrl=buildUrl(base,{
    ref:refCode,
    cf_utm_source:source,
    cf_utm_medium:medium,
    cf_utm_campaign:campaignId,
    cf_utm_term:term,
    cf_utm_content:content
  });
  state.originalCaption=$("#caption").value;
  state.currentCaption=replaceCaption(state.originalCaption,state.currentUrl,sales);
  $("#resultEmpty").classList.add("hidden");
  $("#resultBox").classList.add("show");
  $("#resultUrl").textContent=state.currentUrl;
  $("#shortUrlBlock").classList.add("hidden");
  $("#shortUrl").textContent="";
  $("#shortenBtn").disabled=false;
  $("#shortenBtn").textContent="ย่อลิงก์ TinyURL";
  $("#metaCampaign").textContent=`${state.selected.campaign_name} (${campaignId})`;
  $("#metaSales").textContent=sales.display_name;
  $("#metaChannel").textContent=channel.display_name;
  $("#metaTime").textContent=new Date().toLocaleString("th-TH");
  // Friendly CF UTM preview in the redesigned result panel
  if($("#previewSource")) $("#previewSource").textContent=source||"—";
  if($("#previewMedium")) $("#previewMedium").textContent=medium||"—";
  if($("#previewCampaign")) $("#previewCampaign").textContent=campaignId||"—";
  if($("#previewTerm")) $("#previewTerm").textContent=term||"—";
  if($("#previewContent")) $("#previewContent").textContent=content||"—";

  await PTCADApi.request("saveLinkHistory",{record:{
    campaign_id:campaignId,
    campaign_name:state.selected.campaign_name,
    product:state.selected.product,
    landing_page:base,
    salesperson:sales.display_name,
    channel:channel.display_name,
    cf_utm_source:source,
    cf_utm_medium:medium,
    cf_utm_campaign:campaignId,
    cf_utm_term:term,
    cf_utm_content:content,
    // legacy history fields kept for compatibility with an older Apps Script sheet schema
    utm_source:source,
    utm_medium:medium,
    utm_campaign:campaignId,
    utm_term:term,
    utm_content:content,
    generated_url:state.currentUrl,
    caption:state.currentCaption,
    ref_code:refCode
  }});
  renderHistory();
  toast("สร้างลิงก์ CF UTM เรียบร้อยแล้ว");
}

function activeUrl(){return state.shortUrl||state.currentUrl}
async function shortenCurrentUrl(){
  if(!state.currentUrl)return toast("กรุณาสร้างลิงก์ก่อน");
  const button=$("#shortenBtn");button.disabled=true;button.textContent="กำลังย่อลิงก์...";
  try{
    const result=await PTCADApi.request("shortenUrl",{url:state.currentUrl});
    state.shortUrl=result.short_url;
    $("#shortUrl").textContent=state.shortUrl;$("#shortUrlBlock").classList.remove("hidden");
    const sales=state.salespeople.find(x=>x.sales_id===$("#salesperson").value);
    state.currentCaption=replaceCaption(state.originalCaption,state.shortUrl,sales);
    button.textContent="ย่อแล้ว ✓";toast("สร้าง TinyURL เรียบร้อยแล้ว");
  }catch(error){button.disabled=false;button.textContent="ย่อลิงก์ TinyURL";toast(error.message||"ย่อลิงก์ไม่สำเร็จ")}
}
async function copyText(text,msg){await navigator.clipboard.writeText(text);toast(msg)}
async function renderHistory(){const r=await PTCADApi.request("getLinkHistory");const rows=(r.data||[]).slice(0,20);$("#historyBody").innerHTML=rows.length?rows.map(x=>`<tr><td>${new Date(x.timestamp).toLocaleString("th-TH")}</td><td>${x.campaign_name}</td><td>${x.salesperson}</td><td>${x.channel}</td><td><button class="btn btn-ghost hist-copy" data-url="${encodeURIComponent(x.generated_url)}">Copy</button></td></tr>`).join(""):'<tr><td colspan="5" class="empty-row">ยังไม่มีประวัติการสร้างลิงก์</td></tr>';$$('.hist-copy').forEach(b=>b.onclick=()=>copyText(decodeURIComponent(b.dataset.url),"คัดลอกลิงก์แล้ว"))}
function showQR(){const url=activeUrl();if(!url)return;const modal=$("#qrModal");const canvas=$("#qrCanvas");canvas.innerHTML="";new QRCode(canvas,{text:url,width:240,height:240,correctLevel:QRCode.CorrectLevel.H});$("#qrLinkText").textContent=url;modal.classList.add("show");modal.setAttribute("aria-hidden","false");document.body.classList.add("modal-open")}
function closeQRModal(){const modal=$("#qrModal");modal.classList.remove("show");modal.setAttribute("aria-hidden","true");document.body.classList.remove("modal-open")}
function downloadQR(){const img=$("#qrCanvas img");const canvas=$("#qrCanvas canvas");const src=img?.src||canvas?.toDataURL("image/png");if(!src)return;const link=document.createElement("a");link.href=src;link.download=`ptcad-${state.selected?.campaign_id||"link"}-qr.png`;link.click()}

document.addEventListener("DOMContentLoaded",()=>{
  init();
  $("#generateBtn").onclick=generate;$("#shortenBtn").onclick=shortenCurrentUrl;
  $("#copyLinkBtn").onclick=()=>copyText(activeUrl(),"คัดลอกลิงก์แล้ว");
  $("#copyCaptionBtn").onclick=()=>copyText(state.currentCaption,"คัดลอกแคปชันแล้ว");
  $("#copyAllBtn").onclick=()=>copyText(`${state.currentCaption}${state.currentCaption.includes(activeUrl())?"":"\n\n"+activeUrl()}`,"คัดลอกแคปชันและลิงก์แล้ว");
  $("#openLinkBtn").onclick=()=>window.open(activeUrl(),"_blank");$("#qrBtn").onclick=showQR;$("#closeQR").onclick=closeQRModal;$("#qrBackdrop").onclick=closeQRModal;$("#downloadQR").onclick=downloadQR;$("#copyQRLink").onclick=()=>copyText(activeUrl(),"คัดลอกลิงก์แล้ว");$("#openQRLink").onclick=()=>window.open(activeUrl(),"_blank");
  document.addEventListener("keydown",event=>{if(event.key==="Escape"&&$("#qrModal").classList.contains("show"))closeQRModal()});
});
