const A={campaigns:[],sales:[],channels:[],history:[]};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];function toast(m){const t=$("#toast");t.textContent=m;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),1800)}async function load(){
  try{
    const ok=await PTCADApi.request('validateSession');
    if(!ok.success)return location.href='login.html';
    document.querySelectorAll('.ptcad-logo').forEach(i=>i.src=PTCAD_CONFIG.logoUrl);
    const [c,s,ch,h]=await Promise.all([
      PTCADApi.request('getAllCampaigns'),
      PTCADApi.request('getAllSalespeople'),
      PTCADApi.request('getAllChannels'),
      PTCADApi.request('getLinkHistory')
    ]);
    A.campaigns=c.data||[];
    A.sales=s.data||[];
    A.channels=ch.data||[];
    A.history=h.data||[];
    renderAll();
  }catch(error){
    if(String(error.message||'').includes('Session CMS หมดอายุ')){
      sessionStorage.clear();
      location.href='login.html';
      return;
    }
    toast(error.message||'โหลดข้อมูลไม่สำเร็จ');
  }
}function renderAll(){renderCampaigns();renderSales();renderChannels();renderHistory();$('#stActive').textContent=A.campaigns.filter(x=>x.is_active).length;$('#stLinks').textContent=A.history.length;$('#stSales').textContent=A.sales.length;$('#stChannels').textContent=A.channels.length}
function renderCampaigns(){$('#campaignTable').innerHTML=A.campaigns.map(x=>`<tr><td>${x.campaign_name}</td><td>${x.product}</td><td>${x.utm_campaign}</td><td>${x.start_date} – ${x.end_date}</td><td><span class="badge ${x.is_active?'badge-active':'badge-expired'}">${x.is_active?'Active':'Inactive'}</span></td><td><button class="btn btn-ghost" onclick="editCampaign('${x.campaign_id}')">แก้ไข</button> <button class="btn btn-danger" onclick="deleteCampaign('${x.campaign_id}')">ลบ</button></td></tr>`).join('')||'<tr><td colspan="6" class="empty-row">ไม่มีข้อมูล</td></tr>'}
function renderSales(){$('#salesTable').innerHTML=A.sales.map(x=>`<tr><td>${x.display_name}</td><td>${x.ref_code||x.utm_code||""}</td><td>${x.team||'-'}</td><td>${x.is_active?'Active':'Inactive'}</td><td><button class="btn btn-ghost" onclick="openSalesModal('${x.sales_id}')">แก้ไข</button></td></tr>`).join('')}
function renderChannels(){$('#channelTable').innerHTML=A.channels.map(x=>`<tr><td>${x.display_name}</td><td>${x.utm_source}</td><td>${x.utm_medium}</td><td>${x.is_active?'Active':'Inactive'}</td><td><button class="btn btn-ghost" onclick="editChannel('${x.channel_id}')">แก้ไข</button></td></tr>`).join('')}
function renderHistory(){$('#adminHistoryTable').innerHTML=A.history.map(x=>`<tr><td>${new Date(x.timestamp).toLocaleString('th-TH')}</td><td>${x.campaign_name}</td><td>${x.salesperson}</td><td>${x.channel}</td><td style="max-width:300px;word-break:break-all">${x.generated_url}</td></tr>`).join('')||'<tr><td colspan="5" class="empty-row">ยังไม่มีข้อมูล</td></tr>'}
function input(label,value=''){return prompt(label,value)}async function editCampaign(id){const old=A.campaigns.find(x=>x.campaign_id===id)||{campaign_id:'CMP'+Date.now(),is_active:true,start_date:new Date().toISOString().slice(0,10),end_date:'2026-12-31'};const item={...old,campaign_name:input('ชื่อแคมเปญ',old.campaign_name||'')};if(item.campaign_name===null)return;item.product=input('สินค้า',old.product||'PTCAD');item.description=input('คำอธิบาย',old.description||'');item.landing_page=input('Landing Page',old.landing_page||'https://ptcadthailand.com/');item.utm_campaign=input('utm_campaign',old.utm_campaign||'ptcad_campaign');item.caption=input('Caption (Optional)',old.caption||'');item.start_date=input('วันเริ่ม YYYY-MM-DD',old.start_date);item.end_date=input('วันสิ้นสุด YYYY-MM-DD',old.end_date);item.is_active=confirm('เปิดใช้งานแคมเปญนี้หรือไม่?');await PTCADApi.request('saveCampaign',{item});toast('บันทึกแคมเปญแล้ว');load()}async function deleteCampaign(id){if(!confirm('ยืนยันลบแคมเปญ?'))return;await PTCADApi.request('deleteCampaign',{id});load()}
function openSalesModal(id=""){
  const old=A.sales.find(x=>x.sales_id===id)||{};
  document.querySelector("#salesModalTitle").textContent=id?"แก้ไขรายชื่อเซลล์":"เพิ่มรายชื่อเซลล์";
  document.querySelector("#salesId").value=old.sales_id||"";
  document.querySelector("#salesDisplayName").value=old.display_name||"";
  document.querySelector("#salesRefCode").value=old.ref_code||old.utm_code||"";
  document.querySelector("#salesTeam").value=old.team||"Sales";
  document.querySelector("#salesEmail").value=old.email||"";
  document.querySelector("#salesIsActive").checked=old.is_active!==false;
  document.querySelector("#salesFormError").classList.add("hidden");
  document.querySelector("#salesFormError").textContent="";
  const modal=document.querySelector("#salesModal");
  modal.classList.add("show");
  modal.setAttribute("aria-hidden","false");
  document.body.classList.add("modal-open");
  setTimeout(()=>document.querySelector("#salesDisplayName").focus(),80);
}

function closeSalesModal(){
  const modal=document.querySelector("#salesModal");
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden","true");
  document.body.classList.remove("modal-open");
}

async function saveSalesFromModal(event){
  event.preventDefault();
  const button=document.querySelector("#saveSalesBtn");
  const errorBox=document.querySelector("#salesFormError");
  const displayName=document.querySelector("#salesDisplayName").value.trim();
  const refCode=document.querySelector("#salesRefCode").value.trim().toLowerCase()
    .replace(/\s+/g,"-")
    .replace(/[^a-z0-9_-]/g,"");
  const existingId=document.querySelector("#salesId").value;

  errorBox.classList.add("hidden");
  errorBox.textContent="";

  if(!displayName){
    errorBox.textContent="กรุณากรอกชื่อที่แสดง";
    errorBox.classList.remove("hidden");
    return;
  }
  if(!refCode){
    errorBox.textContent="กรุณากรอก Ref Code เป็นภาษาอังกฤษ";
    errorBox.classList.remove("hidden");
    return;
  }
  const duplicate=A.sales.find(x=>(x.ref_code||x.utm_code||"").toLowerCase()===refCode&&x.sales_id!==existingId);
  if(duplicate){
    errorBox.textContent=`Ref Code “${refCode}” ถูกใช้โดย ${duplicate.display_name} แล้ว`;
    errorBox.classList.remove("hidden");
    return;
  }

  const item={
    sales_id:existingId||("S"+Date.now()),
    display_name:displayName,
    ref_code:refCode,
    team:document.querySelector("#salesTeam").value.trim(),
    email:document.querySelector("#salesEmail").value.trim(),
    is_active:document.querySelector("#salesIsActive").checked
  };

  button.disabled=true;
  button.textContent="กำลังบันทึก...";

  try{
    await PTCADApi.request("saveSalesperson",{item});
    const index=A.sales.findIndex(x=>x.sales_id===item.sales_id);
    if(index>=0)A.sales[index]=item;
    else A.sales.push(item);
    renderAll();
    closeSalesModal();
    toast(existingId?"แก้ไขรายชื่อเรียบร้อยแล้ว":"เพิ่มรายชื่อเรียบร้อยแล้ว");
  }catch(error){
    errorBox.textContent=error.message||"บันทึกข้อมูลไม่สำเร็จ";
    errorBox.classList.remove("hidden");
  }finally{
    button.disabled=false;
    button.textContent="บันทึกรายชื่อ";
  }
}

async function editChannel(id){const old=A.channels.find(x=>x.channel_id===id)||{channel_id:'CH'+Date.now(),is_active:true};const item={...old,display_name:input('ชื่อช่องทาง',old.display_name||'')};if(item.display_name===null)return;item.utm_source=input('utm_source',old.utm_source||'');item.utm_medium=input('utm_medium',old.utm_medium||'sales');item.is_active=confirm('เปิดใช้งานช่องทางนี้หรือไม่?');await PTCADApi.request('saveChannel',{item});load()}function exportCSV(){const rows=[['Timestamp','Campaign','Salesperson','Channel','URL'],...A.history.map(x=>[x.timestamp,x.campaign_name,x.salesperson,x.channel,x.generated_url])];const csv=rows.map(r=>r.map(v=>'"'+String(v||'').replaceAll('"','""')+'"').join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv'}));a.download='ptcad-link-history.csv';a.click()}
document.addEventListener('DOMContentLoaded',()=>{$$('.menu button').forEach(b=>b.onclick=()=>{$$('.menu button').forEach(x=>x.classList.remove('active'));b.classList.add('active');$$('.admin-view').forEach(v=>v.classList.remove('active'));$('#'+b.dataset.view).classList.add('active')});$('#addCampaign').onclick=()=>editCampaign('new');$('#addSales').onclick=()=>openSalesModal('new');$('#addChannel').onclick=()=>editChannel('new');$('#exportCSV').onclick=exportCSV;$('#logout').onclick=()=>{sessionStorage.clear();location.href='login.html'};load()});
