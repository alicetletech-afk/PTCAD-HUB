# ตั้งค่า TinyURL แบบฟรี

TinyURL Free Plan รองรับ API แต่ต้องสมัครบัญชีและสร้าง API Token

## ขั้นตอน

1. เข้า TinyURL และสมัคร Free Plan
2. ไปที่ Profile > API
3. สร้าง Token โดยเปิดสิทธิ์ `Create TinyURL`
4. เปิด Google Apps Script ของ PTCAD Sales Hub
5. เลือกฟังก์ชันหรือสร้างฟังก์ชันทดสอบดังนี้:

```javascript
function setupTinyUrlToken() {
  return setTinyUrlApiToken("วาง_API_TOKEN_ตรงนี้");
}
```

6. Run `setupTinyUrlToken` หนึ่งครั้ง
7. ลบ Token ออกจากโค้ดหลังรันเสร็จ เพื่อไม่ให้ Token ค้างอยู่ใน Source
8. Deploy > Manage deployments > Edit
9. เลือก New version แล้วกด Deploy

API Token จะถูกเก็บใน Script Properties และไม่ถูกส่งไปยัง Browser
