# PTCAD Sales Hub — Final

ระบบพร้อมใช้งานจริงสำหรับทีมขายและผู้ดูแล CMS

## หน้าใช้งาน

- `index.html` — Sales Hub สำหรับสร้างลิงก์
- `login.html` — เข้าสู่ CMS
- `admin.html` — จัดการ Campaign, Salespeople, Channels และ Link History

## รูปแบบลิงก์

ระบบสร้าง `ref` เป็นพารามิเตอร์แรกเสมอ เช่น:

```text
https://ptcadthailand.com/pricing/?ref=ball&utm_source=line&utm_medium=sales&utm_campaign=ptcad_lite_2026
```

## API

ไฟล์ `js/config.js` เชื่อมกับ Google Apps Script Web App แล้ว:

```text
https://script.google.com/macros/s/AKfycbwEh8xJd-XIDwHOCRRunC1CPYxYvBbrUrvxrUH5nLJlOVCCsEn2RXA3_vVIeSRUmCKn/exec
```

และตั้งค่า `demoMode: false` เรียบร้อย

## Google Apps Script

โค้ดอยู่ที่:

```text
apps-script/Code.gs
```

ฟังก์ชันสำคัญ:

- `setupPTCADSalesHub()` สร้าง Google Sheet และข้อมูลตั้งต้น
- `setAdminPassword("รหัสใหม่")` เปลี่ยนรหัส CMS
- `getDatabaseInfo()` ดูลิงก์ Google Sheet

## หมายเหตุด้านความปลอดภัย

ควรเปลี่ยนรหัส CMS จากค่าเริ่มต้นทันทีด้วย:

```javascript
setAdminPassword("รหัสใหม่ที่ต้องการ")
```

หลังแก้ `Code.gs` ให้สร้าง deployment version ใหม่ทุกครั้ง


## TinyURL

ระบบย่อลิงก์ทำงานผ่าน Google Apps Script เพื่อไม่เปิดเผย API Token ในหน้าเว็บ

1. สมัคร/เข้าสู่ระบบ TinyURL
2. ไปที่ Profile > API
3. สร้าง API Token ที่มีสิทธิ์ Create TinyURL
4. ใน Apps Script แก้บรรทัดตัวอย่างแล้วรันหนึ่งครั้ง:

```javascript
setTinyUrlApiToken("วาง_TOKEN_ตรงนี้")
```

5. Deploy โค้ด Apps Script เป็น New version

จากนั้นหน้า Sales Hub จะมีปุ่ม `ย่อลิงก์ TinyURL`
