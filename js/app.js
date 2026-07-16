let state={campaigns:[],salespeople:[],channels:[],selected:null,currentUrl:"",shortUrl:"",currentCaption:"",originalCaption:""};
const $=s=>document.querySelector(s);const $$=s=>[...document.querySelectorAll(s)];
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200)}
function statusOf(c){const n=new Date(),s=new Date(c.start_date),e=new Date(c.end_date+"T23:59:59");if(n<s)return["Upcoming","badge-upcoming"];if(n>e)return["Expired","badge-expired"];return["Active","badge-active"]}
function fmtDate(d){return new Date(d).toLocaleDateString("th-TH",{day:"numeric",month:"short",year:"numeric"})}
async function init(){document.querySelectorAll(".ptcad-logo").forEach(i=>i.src=PTCAD_CONFIG.logoUrl);const [c,s,ch]=await Promise.all([PTCADApi.request("getActiveCampaigns"),PTCADApi.request("getSalespeople"),PTCADApi.request("getChannels")]);state.campaigns=c.data.sort((a,b)=>(a.display_order||99)-(b.display_order||99));state.salespeople=s.data;state.channels=ch.data;renderCampaigns();fillSelects();renderHistory();$("#campaignCount").textContent=state.campaigns.length}
function renderCampaigns(){const box=$("#campaignGrid");box.innerHTML=state.campaigns.map(c=>{const st=statusOf(c);return`<article class="campaign-card" data-id="${c.campaign_id}"><div class="campaign-image">${c.kv_image?`<img src="${c.kv_image}" alt="">`:`PTCAD<br>${c.product}`}</div><div class="campaign-body"><div class="campaign-top"><div><h3>${c.campaign_name}</h3><p>${c.description||""}</p></div><span class="badge ${st[1]}">${st[0]}</span></div><div class="campaign-footer"><span class="date">${fmtDate(c.start_date)} – ${fmtDate(c.end_date)}</span><button class="btn btn-secondary select-campaign" data-id="${c.campaign_id}">เลือก</button></div></div></article>`}).join("");$$('.select-campaign').forEach(b=>b.onclick=()=>selectCampaign(b.dataset.id))}
function fillSelects(){$("#salesperson").innerHTML='<option value="">เลือกชื่อเซลล์</option>'+state.salespeople.map(x=>`<option value="${x.sales_id}">${x.display_name}</option>`).join("");$("#channel").innerHTML='<option value="">เลือกช่องทาง</option>'+state.channels.map(x=>`<option value="${x.channel_id}">${x.display_name}</option>`).join("")}
function selectCampaign(id){state.selected=state.campaigns.find(x=>x.campaign_id===id);$$('.campaign-card').forEach(c=>c.classList.toggle('selected',c.dataset.id===id));$("#landingPage").value=state.selected.landing_page;$("#caption").value=state.selected.caption||"";$("#selectedCampaign").textContent=state.selected.campaign_name;window.scrollTo({top:$("#generator").offsetTop-80,behavior:"smooth"})}
function buildUrl(base,params){
  const u=new URL(base);
  const existing=[...u.searchParams.entries()].filter(([key])=>!["ref","utm_source","utm_medium","utm_campaign","utm_content","utm_term"].includes(key));
  u.search="";
  if(params.ref)u.searchParams.append("ref",params.ref);
  existing.forEach(([key,value])=>u.searchParams.append(key,value));
  ["utm_source","utm_medium","utm_campaign","utm_content","utm_term"].forEach(key=>{
    if(params[key])u.searchParams.append(key,params[key]);
  });
  return u.toString();
}
function replaceCaption(t,url,sales){return(t||"").replaceAll("{{generated_url}}",url).replaceAll("{{campaign_name}}",state.selected?.campaign_name||"").replaceAll("{{product}}",state.selected?.product||"").replaceAll("{{salesperson}}",sales?.display_name||"").replaceAll("{{start_date}}",state.selected?.start_date||"").replaceAll("{{end_date}}",state.selected?.end_date||"")}
async function generate(){
  if(!state.selected)return toast("กรุณาเลือกแคมเปญ");
  const sales=state.salespeople.find(x=>x.sales_id===$("#salesperson").value);
  const channel=state.channels.find(x=>x.channel_id===$("#channel").value);
  const base=$("#landingPage").value.trim();
  if(!sales)return toast("กรุณาเลือกชื่อเซลล์");
  if(!channel)return toast("กรุณาเลือกช่องทาง");
  try{new URL(base)}catch{return toast("กรุณาตรวจสอบ Landing Page")}
  const variant=$("#contentVariant").value.trim().toLowerCase().replace(/\s+/g,"-");
  const refCode=sales.ref_code||sales.utm_code||"";
  if(!refCode)return toast("รายชื่อเซลล์นี้ยังไม่มี Ref Code");
  state.shortUrl="";
  state.currentUrl=buildUrl(base,{
    ref:refCode,
    utm_source:channel.utm_source,
    utm_medium:channel.utm_medium,
    utm_campaign:state.selected.utm_campaign,
    utm_content:variant
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
  $("#metaCampaign").textContent=state.selected.campaign_name;
  $("#metaSales").textContent=sales.display_name;
  $("#metaChannel").textContent=channel.display_name;
  $("#metaTime").textContent=new Date().toLocaleString("th-TH");
  await PTCADApi.request("saveLinkHistory",{record:{
    campaign_id:state.selected.campaign_id,
    campaign_name:state.selected.campaign_name,
    product:state.selected.product,
    landing_page:base,
    salesperson:sales.display_name,
    channel:channel.display_name,
    utm_source:channel.utm_source,
    utm_medium:channel.utm_medium,
    utm_campaign:state.selected.utm_campaign,
    utm_content:variant,
    generated_url:state.currentUrl,
    caption:state.currentCaption,
    ref_code:refCode
  }});
  renderHistory();
  toast("สร้างลิงก์เรียบร้อยแล้ว");
}

function activeUrl(){
  return state.shortUrl||state.currentUrl;
}

async function shortenCurrentUrl(){
  if(!state.currentUrl)return toast("กรุณาสร้างลิงก์ก่อน");
  const button=$("#shortenBtn");
  button.disabled=true;
  button.textContent="กำลังย่อลิงก์...";

  try{
    const result=await PTCADApi.request("shortenUrl",{url:state.currentUrl});
    state.shortUrl=result.short_url;
    $("#shortUrl").textContent=state.shortUrl;
    $("#shortUrlBlock").classList.remove("hidden");

    const sales=state.salespeople.find(x=>x.sales_id===$("#salesperson").value);
    state.currentCaption=replaceCaption(state.originalCaption,state.shortUrl,sales);

    button.textContent="ย่อแล้ว ✓";
    toast("สร้าง TinyURL เรียบร้อยแล้ว");
  }catch(error){
    button.disabled=false;
    button.textContent="ย่อลิงก์ TinyURL";
    toast(error.message||"ย่อลิงก์ไม่สำเร็จ");
  }
}

async function copyText(text,msg){await navigator.clipboard.writeText(text);toast(msg)}
async function renderHistory(){const r=await PTCADApi.request("getLinkHistory");const rows=r.data.slice(0,20);$("#historyBody").innerHTML=rows.length?rows.map(x=>`<tr><td>${new Date(x.timestamp).toLocaleString("th-TH")}</td><td>${x.campaign_name}</td><td>${x.salesperson}</td><td>${x.channel}</td><td><button class="btn btn-ghost hist-copy" data-url="${encodeURIComponent(x.generated_url)}">Copy</button></td></tr>`).join(""):'<tr><td colspan="5" class="empty-row">ยังไม่มีประวัติการสร้างลิงก์</td></tr>';$$('.hist-copy').forEach(b=>b.onclick=()=>copyText(decodeURIComponent(b.dataset.url),"คัดลอกลิงก์แล้ว"))}
function showQR(){
  const url=activeUrl();
  if(!url)return;
  const modal=$("#qrModal");
  const canvas=$("#qrCanvas");
  canvas.innerHTML="";
  new QRCode(canvas,{
    text:url,
    width:280,
    height:280,
    correctLevel:QRCode.CorrectLevel.H
  });
  $("#qrLinkText").textContent=url;
  modal.classList.add("show");
  modal.setAttribute("aria-hidden","false");
  document.body.classList.add("modal-open");
}

function closeQRModal(){
  const modal=$("#qrModal");
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden","true");
  document.body.classList.remove("modal-open");
}
function downloadQR(){
  const img=$("#qrCanvas img");
  const canvas=$("#qrCanvas canvas");
  const src=img?.src||canvas?.toDataURL("image/png");
  if(!src)return;
  const link=document.createElement("a");
  link.href=src;
  link.download=`ptcad-${state.selected?.utm_campaign||"link"}-qr.png`;
  link.click();
}
document.addEventListener("DOMContentLoaded",()=>{
  init();
  $("#generateBtn").onclick=generate;
  $("#shortenBtn").onclick=shortenCurrentUrl;
  $("#copyLinkBtn").onclick=()=>copyText(activeUrl(),"คัดลอกลิงก์แล้ว");
  $("#copyCaptionBtn").onclick=()=>copyText(state.currentCaption,"คัดลอกแคปชันแล้ว");
  $("#copyAllBtn").onclick=()=>copyText(
    `${state.currentCaption}${state.currentCaption.includes(activeUrl())?"":"\n\n"+activeUrl()}`,
    "คัดลอกแคปชันและลิงก์แล้ว"
  );
  $("#openLinkBtn").onclick=()=>window.open(activeUrl(),"_blank");
  $("#qrBtn").onclick=showQR;
  $("#closeQR").onclick=closeQRModal;
  $("#qrBackdrop").onclick=closeQRModal;
  $("#downloadQR").onclick=downloadQR;
  $("#copyQRLink").onclick=()=>copyText(activeUrl(),"คัดลอกลิงก์แล้ว");
  $("#openQRLink").onclick=()=>window.open(activeUrl(),"_blank");

  document.addEventListener("keydown",event=>{
    if(event.key==="Escape"&&$("#qrModal").classList.contains("show")){
      closeQRModal();
    }
  });
});
