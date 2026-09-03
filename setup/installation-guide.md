# วิธีติดตั้ง PTCAD Sales Hub

## 1. สร้างฐานข้อมูลอัตโนมัติ

1. เข้า Google Apps Script และสร้าง **New project**
2. เปิดไฟล์ `Code.gs` ในโฟลเดอร์ `apps-script`
3. คัดลอกโค้ดทั้งหมดไปวางแทนโค้ดเดิม
4. เลือกฟังก์ชัน `setupPTCADSalesHub`
5. กด **Run** และอนุญาตสิทธิ์

ระบบจะสร้าง Google Spreadsheet ชื่อ **PTCAD Sales Hub Database** ให้อัตโนมัติ พร้อมแท็บ:

- Campaigns
- Salespeople
- Channels
- LinkHistory
- Settings

ระบบจะใส่หัวคอลัมน์ จัดรูปแบบ และเพิ่มข้อมูลตัวอย่างให้ด้วย

หลังรันสำเร็จ ให้เปิด **Execution log** เพื่อดู `spreadsheetUrl` หรือรันฟังก์ชัน `getSetupInfo`

## 2. เปลี่ยนรหัสผ่าน CMS

รหัสเริ่มต้นคือ:

```text
ptcad2026
```

เปลี่ยนได้ 2 วิธี:

- ไปที่ **Project Settings > Script Properties** แล้วแก้ `ADMIN_PASSWORD`
- หรือรันฟังก์ชัน `setAdminPassword('รหัสใหม่')` จาก Apps Script editor

## 3. Deploy เป็น Web App

1. กด **Deploy > New deployment**
2. เลือกประเภท **Web app**
3. Execute as: **Me**
4. Who has access: เลือกตามนโยบายบริษัท เช่น **Anyone** หรือผู้ใช้ในองค์กร
5. กด Deploy
6. คัดลอก Web App URL

## 4. เชื่อมหน้าเว็บไซต์

เปิดไฟล์ `js/config.js` แล้วแก้:

```javascript
apiUrl: 'ใส่ Web App URL ที่นี่',
demoMode: false
```

จากนั้นอัปโหลดไฟล์เว็บไซต์ทั้งหมดขึ้น Hosting

## ฟังก์ชันช่วยเหลือ

- `setupPTCADSalesHub()` — สร้าง Spreadsheet และข้อมูลทั้งหมดอัตโนมัติ
- `getSetupInfo()` — ดู URL และรายชื่อแท็บ
- `repairSheets()` — สร้างหรือซ่อมหัวตารางโดยไม่ลบข้อมูลเดิม
- `seedDefaultData()` — เพิ่มข้อมูลตัวอย่างในแท็บที่ยังว่าง
- `setAdminPassword(newPassword)` — เปลี่ยนรหัสผ่าน CMS


## ตรวจสอบหลังเชื่อม API

1. เปิด Web App URL โดยตรง ต้องเห็นข้อความ `PTCAD Sales Hub API is running`
2. เปิด Sales Hub และสร้างลิงก์ทดสอบ
3. ลิงก์ควรมี `ref` และ CF UTM เช่น `?ref=ball&cf_utm_source=ball&cf_utm_medium=line&cf_utm_campaign=CMP001&cf_utm_term=zoho-crm&cf_utm_content=kv`
4. ตรวจสอบแท็บ `LinkHistory` ว่ามีข้อมูลถูกบันทึก
5. Login CMS ด้วยรหัสเริ่มต้น `ptcad2026` แล้วเปลี่ยนรหัสผ่านด้วยฟังก์ชัน `setAdminPassword`
