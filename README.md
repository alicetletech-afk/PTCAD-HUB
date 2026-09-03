# PTCAD Sales Hub — CF UTM Edition

ระบบสร้างลิงก์สำหรับทีม Sales / Reseller โดยใช้ Custom Fields สำหรับส่ง Attribution เข้า CRM

## CF UTM Standard

| Field | ความหมาย | ตัวอย่าง |
|---|---|---|
| `cf_utm_source` | ชื่อเซลล์ หรือชื่อบริษัท Reseller (Source Code) | `ball`, `abc-reseller` |
| `cf_utm_medium` | ช่องทาง | `line`, `facebook`, `email`, `qr` |
| `cf_utm_campaign` | Campaign ID | `CMP001` |
| `cf_utm_term` | CRM Software | `zoho-crm` |
| `cf_utm_content` | Creative / Content | `kv`, `banner`, `brochure` |

ค่า `cf_utm_term` ตั้งจาก `crmSoftware` ใน `js/config.js` และค่าเริ่มต้นคือ `zoho-crm`

## ตัวอย่างลิงก์

```text
https://ptcadthailand.com/pricing/?ref=ball&cf_utm_source=ball&cf_utm_medium=line&cf_utm_campaign=CMP001&cf_utm_term=zoho-crm&cf_utm_content=kv
```

`ref` ยังถูกเก็บไว้เพื่อรองรับระบบเดิม แต่ Attribution หลักใช้ `cf_utm_*` ทั้ง 5 fields

## หน้าใช้งาน

- `index.html` — Sales Hub สำหรับสร้างลิงก์ CF UTM
- `login.html` — เข้าสู่ CMS
- `admin.html` — จัดการ Campaign ID, Sales / Reseller, Channels และ Link History

## Mapping ข้อมูลเดิม

- Salespeople `ref_code` → `cf_utm_source`
- Channels `channel_code` หรือ fallback จาก `utm_source` → `cf_utm_medium`
- Campaigns `campaign_id` → `cf_utm_campaign`
- `PTCAD_CONFIG.crmSoftware` → `cf_utm_term`
- Creative ที่กรอกหน้า Generator → `cf_utm_content`

Frontend ยังส่ง legacy history fields (`utm_source`, `utm_medium`, ฯลฯ) คู่ไปกับข้อมูลใหม่เพื่อช่วยรองรับ Apps Script / Google Sheet เวอร์ชันเดิม แต่ URL ที่สร้างจะใช้ `cf_utm_*` เท่านั้น

## API

ไฟล์ `js/config.js` เชื่อมกับ Google Apps Script Web App ที่ตั้งไว้เดิม และ `demoMode: false`

## TinyURL

ระบบย่อลิงก์ทำงานผ่าน Google Apps Script เช่นเดิมเพื่อไม่เปิดเผย API Token ในหน้าเว็บ
