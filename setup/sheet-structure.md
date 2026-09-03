# Google Sheet Structure — CF UTM

ใช้ Google Sheet เดิมได้ โดยระบบ frontend รักษา compatibility กับ field เดิมไว้

Tabs หลัก:
- Campaigns
- Salespeople
- Channels
- LinkHistory

## Mapping ที่ใช้ในระบบใหม่
- `Salespeople.ref_code` = `cf_utm_source` (รองรับทั้งชื่อเซลล์และ Reseller)
- `Channels.channel_code` = `cf_utm_medium` หาก Apps Script เก่ายังไม่มี column นี้ ระบบ fallback ไปที่ `utm_source`
- `Campaigns.campaign_id` = `cf_utm_campaign`
- `PTCAD_CONFIG.crmSoftware` = `cf_utm_term` (`zoho-crm`)
- `cf_utm_content` รับจาก Creative / Content ในหน้า Generator

แนะนำให้ LinkHistory เพิ่ม columns `cf_utm_source`, `cf_utm_medium`, `cf_utm_campaign`, `cf_utm_term`, `cf_utm_content` เมื่ออัปเดต Apps Script รอบถัดไป
