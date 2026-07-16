const PTCADApi={
  async request(action,payload={}){
    const cfg=window.PTCAD_CONFIG||{};
    if(!cfg.apiUrl||cfg.demoMode){return this.demo(action,payload)}
    let res;
    try{
      res=await fetch(cfg.apiUrl,{
        method:"POST",
        headers:{"Content-Type":"text/plain;charset=utf-8"},
        body:JSON.stringify({
          action,
          ...payload,
          token:sessionStorage.getItem("ptcad_admin_token")||payload.token||""
        })
      });
    }catch(error){
      throw new Error("เชื่อมต่อระบบไม่สำเร็จ กรุณาลองใหม่");
    }
    const raw=await res.text();
    let data;
    try{
      data=JSON.parse(raw);
    }catch(error){
      throw new Error("API ตอบกลับไม่ถูกต้อง กรุณาตรวจสอบ Web App deployment");
    }
    if(!data.success)throw new Error(data.message||"เกิดข้อผิดพลาด");
    return data;
  },
  demo(action,payload){
    const store={
      campaigns:()=>JSON.parse(localStorage.getItem("ptcad_campaigns")||"null")||DEMO_CAMPAIGNS,
      salespeople:()=>JSON.parse(localStorage.getItem("ptcad_salespeople")||"null")||DEMO_SALES,
      channels:()=>JSON.parse(localStorage.getItem("ptcad_channels")||"null")||DEMO_CHANNELS,
      history:()=>JSON.parse(localStorage.getItem("ptcad_history")||"[]")
    };
    const save=(key,val)=>localStorage.setItem(key,JSON.stringify(val));
    switch(action){
      case"getActiveCampaigns":return Promise.resolve({success:true,data:store.campaigns().filter(c=>c.is_active&&new Date(c.end_date+"T23:59:59")>=new Date())});
      case"getAllCampaigns":return Promise.resolve({success:true,data:store.campaigns()});
      case"getSalespeople":return Promise.resolve({success:true,data:store.salespeople().filter(x=>x.is_active)});
      case"getAllSalespeople":return Promise.resolve({success:true,data:store.salespeople()});
      case"getChannels":return Promise.resolve({success:true,data:store.channels().filter(x=>x.is_active)});
      case"getAllChannels":return Promise.resolve({success:true,data:store.channels()});
      case"getLinkHistory":return Promise.resolve({success:true,data:store.history().slice().reverse()});
      case"saveLinkHistory":{const h=store.history();h.push({...payload.record,history_id:"H"+Date.now(),timestamp:new Date().toISOString()});save("ptcad_history",h);return Promise.resolve({success:true})}
      case"saveCampaign":{let a=store.campaigns();const i=a.findIndex(x=>x.campaign_id===payload.item.campaign_id);if(i>=0)a[i]=payload.item;else a.push(payload.item);save("ptcad_campaigns",a);return Promise.resolve({success:true})}
      case"deleteCampaign":save("ptcad_campaigns",store.campaigns().filter(x=>x.campaign_id!==payload.id));return Promise.resolve({success:true});
      case"saveSalesperson":{let a=store.salespeople();const i=a.findIndex(x=>x.sales_id===payload.item.sales_id);if(i>=0)a[i]=payload.item;else a.push(payload.item);save("ptcad_salespeople",a);return Promise.resolve({success:true})}
      case"saveChannel":{let a=store.channels();const i=a.findIndex(x=>x.channel_id===payload.item.channel_id);if(i>=0)a[i]=payload.item;else a.push(payload.item);save("ptcad_channels",a);return Promise.resolve({success:true})}
      case"adminLogin":return Promise.resolve({success:payload.password==="ptcad2026",token:"demo-token"});
      case"validateSession":return Promise.resolve({success:sessionStorage.getItem("ptcad_admin_token")==="demo-token"});
      default:return Promise.resolve({success:true,data:[]});
    }
  }
};
const DEMO_CAMPAIGNS=[
 {campaign_id:"CMP001",campaign_name:"PTCAD Lite 2026",product:"PTCAD Lite",description:"โปรแกรม CAD สำหรับงานเขียนแบบ 2D เริ่มเพียง 3,650 บาท",landing_page:"https://ptcadthailand.com/pricing/",kv_image:"",caption:"PTCAD Lite 2026 สำหรับงานเขียนแบบ 2D รองรับไฟล์ DWG และทดลองใช้ฟรี 30 วัน\n\nดูรายละเอียด: {{generated_url}}",utm_campaign:"ptcad_lite_2026",start_date:"2026-07-01",end_date:"2026-12-31",is_active:true,display_order:1},
 {campaign_id:"CMP002",campaign_name:"ทดลองใช้ฟรี 30 วัน",product:"PTCAD",description:"สร้างลิงก์สำหรับส่งลูกค้าที่ต้องการทดลองใช้ก่อนตัดสินใจ",landing_page:"https://ptcadthailand.com/sales-ptcad-th/",kv_image:"",caption:"ทดลองใช้ PTCAD ฟรี 30 วัน ไม่มีเงื่อนไข\n{{generated_url}}",utm_campaign:"ptcad_trial_30days",start_date:"2026-07-01",end_date:"2026-12-31",is_active:true,display_order:2},
 {campaign_id:"CMP003",campaign_name:"PTCAD สำหรับองค์กร",product:"PTCAD Business",description:"ขอใบเสนอราคาสำหรับองค์กรหรือซื้อหลาย License",landing_page:"https://ptcadthailand.com/contact/",kv_image:"",caption:"สนใจ PTCAD สำหรับองค์กรหรือหลาย License ติดต่อทีมงานเพื่อรับใบเสนอราคาได้ที่ {{generated_url}}",utm_campaign:"ptcad_business_2026",start_date:"2026-07-01",end_date:"2026-12-31",is_active:true,display_order:3}
];
const DEMO_SALES=[{sales_id:"S001",display_name:"Ball",ref_code:"ball",email:"",team:"Sales",is_active:true},{sales_id:"S002",display_name:"Aum",ref_code:"aum",email:"",team:"Sales",is_active:true},{sales_id:"S003",display_name:"Amnat",ref_code:"amnat",email:"",team:"Sales",is_active:true},{sales_id:"S004",display_name:"Gyokoi",ref_code:"gyokoi",email:"",team:"Marketing",is_active:true}];
const DEMO_CHANNELS=[{channel_id:"CH01",display_name:"LINE ส่วนตัว",utm_source:"line",utm_medium:"sales",is_active:true},{channel_id:"CH02",display_name:"LINE OA",utm_source:"line-oa",utm_medium:"broadcast",is_active:true},{channel_id:"CH03",display_name:"Facebook",utm_source:"facebook",utm_medium:"social",is_active:true},{channel_id:"CH04",display_name:"Messenger",utm_source:"messenger",utm_medium:"sales",is_active:true},{channel_id:"CH05",display_name:"Email",utm_source:"email",utm_medium:"sales-email",is_active:true},{channel_id:"CH06",display_name:"LinkedIn",utm_source:"linkedin",utm_medium:"social",is_active:true},{channel_id:"CH07",display_name:"Webinar",utm_source:"webinar",utm_medium:"event",is_active:true},{channel_id:"CH08",display_name:"Event / QR Code",utm_source:"qr",utm_medium:"offline",is_active:true}];
