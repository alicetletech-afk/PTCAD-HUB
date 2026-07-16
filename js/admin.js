const A={campaigns:[],sales:[],channels:[],history:[]};
const $=selector=>document.querySelector(selector);
const $$=selector=>[...document.querySelectorAll(selector)];

function toast(message){
  const element=$("#toast");
  element.textContent=message;
  element.classList.add("show");
  setTimeout(()=>element.classList.remove("show"),2200);
}

function escapeHtml(value=""){
  return String(value)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

async function load(){
  try{
    const session=await PTCADApi.request("validateSession");
    if(!session.success){
      location.href="login.html";
      return;
    }

    $$(".ptcad-logo").forEach(image=>image.src=PTCAD_CONFIG.logoUrl);

    const [campaigns,sales,channels,history]=await Promise.all([
      PTCADApi.request("getAllCampaigns"),
      PTCADApi.request("getAllSalespeople"),
      PTCADApi.request("getAllChannels"),
      PTCADApi.request("getLinkHistory")
    ]);

    A.campaigns=campaigns.data||[];
    A.sales=sales.data||[];
    A.channels=channels.data||[];
    A.history=history.data||[];

    renderAll();
  }catch(error){
    if(String(error.message||"").includes("Session CMS หมดอายุ")){
      sessionStorage.clear();
      location.href="login.html";
      return;
    }
    toast(error.message||"โหลดข้อมูลไม่สำเร็จ");
  }
}

function renderAll(){
  renderCampaigns();
  renderSales();
  renderChannels();
  renderHistory();

  $("#stActive").textContent=A.campaigns.filter(item=>item.is_active===true||String(item.is_active).toLowerCase()==="true").length;
  $("#stLinks").textContent=A.history.length;
  $("#stSales").textContent=A.sales.length;
  $("#stChannels").textContent=A.channels.length;
}

function renderCampaigns(){
  const rows=A.campaigns.map(item=>{
    const active=item.is_active===true||String(item.is_active).toLowerCase()==="true";
    const period=[item.start_date,item.end_date].filter(Boolean).join(" – ")||"–";

    return `<tr>
      <td>${escapeHtml(item.campaign_name)}</td>
      <td>${escapeHtml(item.product||"-")}</td>
      <td>${escapeHtml(item.utm_campaign||"-")}</td>
      <td>${escapeHtml(period)}</td>
      <td>
        <label class="table-switch" title="${active?"ปิดแคมเปญ":"เปิดแคมเปญ"}">
          <input type="checkbox" ${active?"checked":""}
            onchange="toggleCampaign('${escapeHtml(item.campaign_id)}',this.checked,this)">
          <span class="table-switch-track"></span>
          <span class="table-switch-text">${active?"Active":"Inactive"}</span>
        </label>
      </td>
      <td class="table-actions">
        <button class="btn btn-ghost" onclick="openCampaignModal('${escapeHtml(item.campaign_id)}')">แก้ไข</button>
        <button class="btn btn-danger" onclick="deleteCampaign('${escapeHtml(item.campaign_id)}')">ลบ</button>
      </td>
    </tr>`;
  }).join("");

  $("#campaignTable").innerHTML=rows||'<tr><td colspan="6" class="empty-row">ไม่มีข้อมูล</td></tr>';
}

function openCampaignModal(id=""){
  const old=A.campaigns.find(item=>item.campaign_id===id)||{};
  const today=new Date().toISOString().slice(0,10);

  $("#campaignModalTitle").textContent=id?"แก้ไขแคมเปญ":"เพิ่มแคมเปญ";
  $("#campaignId").value=old.campaign_id||"";
  $("#campaignName").value=old.campaign_name||"";
  $("#campaignProduct").value=old.product||"PTCAD";
  $("#campaignDescription").value=old.description||"";
  $("#campaignLandingPage").value=old.landing_page||"https://ptcadthailand.com/";
  $("#campaignKvImage").value=old.kv_image||"";
  $("#campaignUtm").value=old.utm_campaign||"";
  $("#campaignOrder").value=old.display_order||Math.max(A.campaigns.length+1,1);
  $("#campaignStartDate").value=old.start_date||today;
  $("#campaignEndDate").value=old.end_date||"";
  $("#campaignCaption").value=old.caption||"";
  $("#campaignIsActive").checked=old.is_active===undefined
    ? true
    : old.is_active===true||String(old.is_active).toLowerCase()==="true";

  $("#campaignFormError").textContent="";
  $("#campaignFormError").classList.add("hidden");

  const modal=$("#campaignModal");
  modal.classList.add("show");
  modal.setAttribute("aria-hidden","false");
  document.body.classList.add("modal-open");
  setTimeout(()=>$("#campaignName").focus(),80);
}

function closeCampaignModal(){
  const modal=$("#campaignModal");
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden","true");
  document.body.classList.remove("modal-open");
}

async function saveCampaignFromModal(event){
  event.preventDefault();

  const button=$("#saveCampaignBtn");
  const errorBox=$("#campaignFormError");
  const existingId=$("#campaignId").value;
  const campaignName=$("#campaignName").value.trim();
  const product=$("#campaignProduct").value.trim();
  const landingPage=$("#campaignLandingPage").value.trim();
  const utmCampaign=$("#campaignUtm").value.trim().toLowerCase()
    .replace(/\s+/g,"_")
    .replace(/[^a-z0-9_-]/g,"");

  errorBox.textContent="";
  errorBox.classList.add("hidden");

  if(!campaignName||!product||!landingPage||!utmCampaign){
    errorBox.textContent="กรุณากรอกชื่อแคมเปญ สินค้า Landing Page และ UTM Campaign ให้ครบ";
    errorBox.classList.remove("hidden");
    return;
  }

  try{
    new URL(landingPage);
  }catch(error){
    errorBox.textContent="Landing Page ไม่ถูกต้อง กรุณาใส่ URL ที่ขึ้นต้นด้วย http หรือ https";
    errorBox.classList.remove("hidden");
    return;
  }

  const startDate=$("#campaignStartDate").value;
  const endDate=$("#campaignEndDate").value;
  if(startDate&&endDate&&endDate<startDate){
    errorBox.textContent="วันสิ้นสุดต้องไม่น้อยกว่าวันเริ่ม";
    errorBox.classList.remove("hidden");
    return;
  }

  const duplicate=A.campaigns.find(item=>
    String(item.utm_campaign||"").toLowerCase()===utmCampaign&&
    item.campaign_id!==existingId
  );

  if(duplicate){
    errorBox.textContent=`UTM Campaign “${utmCampaign}” ถูกใช้โดย ${duplicate.campaign_name} แล้ว`;
    errorBox.classList.remove("hidden");
    return;
  }

  const old=A.campaigns.find(item=>item.campaign_id===existingId)||{};
  const item={
    ...old,
    campaign_id:existingId||("CMP"+Date.now()),
    campaign_name:campaignName,
    product,
    description:$("#campaignDescription").value.trim(),
    landing_page:landingPage,
    kv_image:$("#campaignKvImage").value.trim(),
    utm_campaign:utmCampaign,
    display_order:Number($("#campaignOrder").value)||1,
    start_date:startDate,
    end_date:endDate,
    caption:$("#campaignCaption").value,
    is_active:$("#campaignIsActive").checked
  };

  button.disabled=true;
  button.textContent="กำลังบันทึก...";

  try{
    await PTCADApi.request("saveCampaign",{item});
    const index=A.campaigns.findIndex(campaign=>campaign.campaign_id===item.campaign_id);
    if(index>=0)A.campaigns[index]=item;
    else A.campaigns.push(item);

    A.campaigns.sort((a,b)=>(Number(a.display_order)||999)-(Number(b.display_order)||999));
    renderAll();
    closeCampaignModal();
    toast(existingId?"แก้ไขแคมเปญเรียบร้อยแล้ว":"เพิ่มแคมเปญเรียบร้อยแล้ว");
  }catch(error){
    errorBox.textContent=error.message||"บันทึกแคมเปญไม่สำเร็จ";
    errorBox.classList.remove("hidden");
  }finally{
    button.disabled=false;
    button.textContent="บันทึกแคมเปญ";
  }
}

async function toggleCampaign(id,isActive,checkbox){
  const item=A.campaigns.find(campaign=>campaign.campaign_id===id);
  if(!item)return;

  const previous=item.is_active===true||String(item.is_active).toLowerCase()==="true";
  checkbox.disabled=true;

  try{
    const updated={...item,is_active:isActive};
    await PTCADApi.request("saveCampaign",{item:updated});
    item.is_active=isActive;
    renderAll();
    toast(isActive?"เปิดแคมเปญแล้ว":"ปิดแคมเปญแล้ว");
  }catch(error){
    checkbox.checked=previous;
    toast(error.message||"เปลี่ยนสถานะแคมเปญไม่สำเร็จ");
  }finally{
    checkbox.disabled=false;
  }
}

async function deleteCampaign(id){
  const item=A.campaigns.find(campaign=>campaign.campaign_id===id);
  const name=item?.campaign_name||"แคมเปญนี้";

  if(!window.confirm(`ยืนยันลบ “${name}” หรือไม่?`))return;

  try{
    await PTCADApi.request("deleteCampaign",{id});
    A.campaigns=A.campaigns.filter(campaign=>campaign.campaign_id!==id);
    renderAll();
    toast("ลบแคมเปญแล้ว");
  }catch(error){
    toast(error.message||"ลบแคมเปญไม่สำเร็จ");
  }
}

function renderSales(){
  $("#salesTable").innerHTML=A.sales.map(item=>`
    <tr>
      <td>${escapeHtml(item.display_name)}</td>
      <td>${escapeHtml(item.ref_code||item.utm_code||"")}</td>
      <td>${escapeHtml(item.team||"-")}</td>
      <td>${item.is_active?"Active":"Inactive"}</td>
      <td><button class="btn btn-ghost" onclick="openSalesModal('${escapeHtml(item.sales_id)}')">แก้ไข</button></td>
    </tr>
  `).join("")||'<tr><td colspan="5" class="empty-row">ไม่มีข้อมูล</td></tr>';
}

function openSalesModal(id=""){
  const old=A.sales.find(item=>item.sales_id===id)||{};

  $("#salesModalTitle").textContent=id?"แก้ไขรายชื่อเซลล์":"เพิ่มรายชื่อเซลล์";
  $("#salesId").value=old.sales_id||"";
  $("#salesDisplayName").value=old.display_name||"";
  $("#salesRefCode").value=old.ref_code||old.utm_code||"";
  $("#salesTeam").value=old.team||"Sales";
  $("#salesEmail").value=old.email||"";
  $("#salesIsActive").checked=old.is_active!==false;
  $("#salesFormError").classList.add("hidden");
  $("#salesFormError").textContent="";

  const modal=$("#salesModal");
  modal.classList.add("show");
  modal.setAttribute("aria-hidden","false");
  document.body.classList.add("modal-open");
  setTimeout(()=>$("#salesDisplayName").focus(),80);
}

function closeSalesModal(){
  const modal=$("#salesModal");
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden","true");
  document.body.classList.remove("modal-open");
}

async function saveSalesFromModal(event){
  event.preventDefault();

  const button=$("#saveSalesBtn");
  const errorBox=$("#salesFormError");
  const displayName=$("#salesDisplayName").value.trim();
  const refCode=$("#salesRefCode").value.trim().toLowerCase()
    .replace(/\s+/g,"-")
    .replace(/[^a-z0-9_-]/g,"");
  const existingId=$("#salesId").value;

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

  const duplicate=A.sales.find(item=>
    String(item.ref_code||item.utm_code||"").toLowerCase()===refCode&&
    item.sales_id!==existingId
  );

  if(duplicate){
    errorBox.textContent=`Ref Code “${refCode}” ถูกใช้โดย ${duplicate.display_name} แล้ว`;
    errorBox.classList.remove("hidden");
    return;
  }

  const item={
    sales_id:existingId||("S"+Date.now()),
    display_name:displayName,
    ref_code:refCode,
    team:$("#salesTeam").value.trim(),
    email:$("#salesEmail").value.trim(),
    is_active:$("#salesIsActive").checked
  };

  button.disabled=true;
  button.textContent="กำลังบันทึก...";

  try{
    await PTCADApi.request("saveSalesperson",{item});
    const index=A.sales.findIndex(salesperson=>salesperson.sales_id===item.sales_id);
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

function renderChannels(){
  $("#channelTable").innerHTML=A.channels.map(item=>`
    <tr>
      <td>${escapeHtml(item.display_name)}</td>
      <td>${escapeHtml(item.utm_source)}</td>
      <td>${escapeHtml(item.utm_medium)}</td>
      <td>${item.is_active?"Active":"Inactive"}</td>
      <td><button class="btn btn-ghost" onclick="editChannel('${escapeHtml(item.channel_id)}')">แก้ไข</button></td>
    </tr>
  `).join("")||'<tr><td colspan="5" class="empty-row">ไม่มีข้อมูล</td></tr>';
}

function input(label,value=""){
  return prompt(label,value);
}

async function editChannel(id){
  const old=A.channels.find(item=>item.channel_id===id)||{
    channel_id:"CH"+Date.now(),
    is_active:true
  };

  const item={...old,display_name:input("ชื่อช่องทาง",old.display_name||"")};
  if(item.display_name===null)return;

  item.utm_source=input("utm_source",old.utm_source||"");
  item.utm_medium=input("utm_medium",old.utm_medium||"sales");
  item.is_active=confirm("เปิดใช้งานช่องทางนี้หรือไม่?");

  await PTCADApi.request("saveChannel",{item});
  await load();
}

function renderHistory(){
  $("#adminHistoryTable").innerHTML=A.history.map(item=>`
    <tr>
      <td>${new Date(item.timestamp).toLocaleString("th-TH")}</td>
      <td>${escapeHtml(item.campaign_name)}</td>
      <td>${escapeHtml(item.salesperson)}</td>
      <td>${escapeHtml(item.channel)}</td>
      <td style="max-width:300px;word-break:break-all">${escapeHtml(item.generated_url)}</td>
    </tr>
  `).join("")||'<tr><td colspan="5" class="empty-row">ยังไม่มีข้อมูล</td></tr>';
}

function exportCSV(){
  const rows=[
    ["Timestamp","Campaign","Salesperson","Channel","URL"],
    ...A.history.map(item=>[
      item.timestamp,
      item.campaign_name,
      item.salesperson,
      item.channel,
      item.generated_url
    ])
  ];

  const csv=rows.map(row=>
    row.map(value=>`"${String(value||"").replaceAll('"','""')}"`).join(",")
  ).join("\n");

  const link=document.createElement("a");
  link.href=URL.createObjectURL(new Blob(["\ufeff"+csv],{type:"text/csv"}));
  link.download="ptcad-link-history.csv";
  link.click();
}

document.addEventListener("DOMContentLoaded",()=>{
  $$(".menu button[data-view]").forEach(button=>{
    button.addEventListener("click",()=>{
      $$(".menu button[data-view]").forEach(item=>item.classList.remove("active"));
      button.classList.add("active");
      $$(".admin-view").forEach(view=>view.classList.remove("active"));
      $("#"+button.dataset.view).classList.add("active");
    });
  });

  $("#addCampaign").addEventListener("click",()=>openCampaignModal(""));
  $("#addSales").addEventListener("click",()=>openSalesModal(""));
  $("#addChannel").addEventListener("click",()=>editChannel("new"));
  $("#exportCSV").addEventListener("click",exportCSV);

  $("#logout").addEventListener("click",()=>{
    sessionStorage.clear();
    location.href="login.html";
  });

  $("#campaignForm")?.addEventListener("submit",saveCampaignFromModal);
  $$("[data-close-campaign-modal]").forEach(element=>
    element.addEventListener("click",closeCampaignModal)
  );

  $("#salesForm")?.addEventListener("submit",saveSalesFromModal);
  $$("[data-close-sales-modal]").forEach(element=>
    element.addEventListener("click",closeSalesModal)
  );

  document.addEventListener("keydown",event=>{
    if(event.key!=="Escape")return;
    if($("#campaignModal")?.classList.contains("show"))closeCampaignModal();
    if($("#salesModal")?.classList.contains("show"))closeSalesModal();
  });

  load();
});
