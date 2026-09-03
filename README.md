# PTCAD Sales Hub — Standard UTM Edition

ระบบสร้างลิงก์ UTM มาตรฐานสำหรับทีม Sales / Reseller โดย Landing Page จะรับ `utm_*` จาก URL แล้วส่งต่อเข้า CRM เป็น `cf_utm_*` ผ่าน lead-api

## UTM Standard

| Field | ความหมาย | ตัวอย่าง |
|---|---|---|
| `utm_source` | ชื่อเซลล์ หรือชื่อบริษัท Reseller (Source Code) | `ball`, `abc-reseller` |
| `utm_medium` | ช่องทาง | `line`, `facebook`, `email`, `qr` |
| `utm_campaign` | Campaign ID | `CMP001` |
| `utm_term` | CRM Software | `zoho-crm` |
| `utm_content` | Creative / Content | `kv`, `banner`, `brochure` |

ค่า `utm_term` ตั้งจาก `crmSoftware` ใน `js/config.js` และค่าเริ่มต้นคือ `zoho-crm`

## ตัวอย่างลิงก์

```text
https://ptcadthailand.com/pricing/?ref=ball&utm_source=ball&utm_medium=line&utm_campaign=CMP001&utm_term=zoho-crm&utm_content=kv
```

`ref` ยังถูกเก็บไว้เพื่อรองรับระบบเดิม ส่วน URL ใช้ `utm_*` ทั้ง 5 fields จากนั้นหน้า Landing Page จะ map ค่าเป็น `cf_utm_*` ตอน POST เข้า lead-api

## หน้าใช้งาน

- `index.html` — Sales Hub สำหรับสร้างลิงก์ UTM
- `login.html` — เข้าสู่ CMS
- `admin.html` — จัดการ Campaign ID, Sales / Reseller, Channels และ Link History

## Mapping ข้อมูลเดิม

- Salespeople `ref_code` → `utm_source`
- Channels `channel_code` หรือ fallback จาก `utm_source` → `utm_medium`
- Campaigns `campaign_id` → `utm_campaign`
- `PTCAD_CONFIG.crmSoftware` → `utm_term`
- Creative ที่กรอกหน้า Generator → `utm_content`

Frontend บันทึกทั้ง `utm_*` และ `cf_utm_*` ลง Link History เพื่อรองรับ Apps Script / Google Sheet เดิม แต่ URL ที่สร้างสำหรับลูกค้าจะใช้ `utm_*` เท่านั้น

## API

ไฟล์ `js/config.js` เชื่อมกับ Google Apps Script Web App ที่ตั้งไว้เดิม และ `demoMode: false`

## TinyURL

ระบบย่อลิงก์ทำงานผ่าน Google Apps Script เช่นเดิมเพื่อไม่เปิดเผย API Token ในหน้าเว็บ
