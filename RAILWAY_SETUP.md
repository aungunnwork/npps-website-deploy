# 🎯 Railway Setup - แก้ไขรูปภาพไม่แสดงบน Vercel

## ✅ สิ่งที่แก้ไขแล้ว

### 1. **Backend แปลง image_url เป็น Absolute URL**
- ✅ ไฟล์: `backend/routes/products.js`
- ✅ Logic: แปลง relative path เป็น `https://testfrontenddev-production.up.railway.app/uploads/xxx.jpg`
- ✅ รองรับทั้ง:
  - `http://...` (ใช้ของเดิม)
  - `/uploads/xxx.jpg` (เพิ่ม baseUrl ข้างหน้า)
  - `xxx.jpg` (เพิ่ม `/uploads/` ข้างหน้า)

### 2. **Environment Variable ใหม่: PUBLIC_ORIGIN**
- ✅ Local: `PUBLIC_ORIGIN=http://localhost:4000`
- ✅ Railway: `PUBLIC_ORIGIN=https://testfrontenddev-production.up.railway.app`

---

## 🚀 ขั้นตอนการตั้งค่าใน Railway

### **Step 1: ตั้งค่า Environment Variable**

1. เปิด **Railway Dashboard**: https://railway.app
2. เลือก backend project
3. ไปที่ **Variables** tab
4. **เพิ่มตัวแปรนี้:**

```env
PUBLIC_ORIGIN=https://testfrontenddev-production.up.railway.app
```

5. กด **Add Variable**
6. Railway จะ **redeploy อัตโนมัติ** (รอ 1-2 นาที)

### **Step 2: ตรวจสอบ Variables ทั้งหมด**

ตรวจสอบว่ามี environment variables ครบ:

```env
✅ DATABASE_URL=mysql://...
✅ JWT_SECRET=...
✅ PROMPTPAY_ID=0801792785
✅ FRONTEND_URL=https://test-frontend-dev-mu.vercel.app
✅ PUBLIC_ORIGIN=https://testfrontenddev-production.up.railway.app
✅ NODE_ENV=production
```

---

## 🧪 ทดสอบหลัง Deploy

### **1. ทดสอบ API Response**

เปิด browser console และรัน:

```javascript
fetch('https://testfrontenddev-production.up.railway.app/api/products')
  .then(res => res.json())
  .then(products => {
    console.log('Product 1:', products[0]);
    console.log('Image URL:', products[0].image_url);
    // ✅ ควรได้: "https://testfrontenddev-production.up.railway.app/uploads/xxx.jpg"
  });
```

### **2. ทดสอบเปิดรูปโดยตรง**

ลองเปิด URL นี้:
```
https://testfrontenddev-production.up.railway.app/uploads/ชื่อไฟล์รูป.jpg
```

- ✅ **ถ้าเห็นรูป** = Static file serving ทำงานถูกต้อง
- ❌ **404 Not Found** = ไฟล์ไม่มีใน uploads/ หรือ path ผิด

### **3. ทดสอบบน Vercel**

1. เปิด https://test-frontend-dev-mu.vercel.app
2. ตรวจ Console (F12) ไม่ควรมี error:
   - ❌ CORS error
   - ❌ 404 image not found
3. รูปสินค้าควรแสดงครบทุกรายการ! 🎉

---

## 📋 Checklist

- [ ] Push code ขึ้น GitHub (เสร็จแล้ว ✅)
- [ ] Railway auto-deploy (รอ 1-2 นาที)
- [ ] ตั้งค่า `PUBLIC_ORIGIN` ใน Railway Variables
- [ ] ตรวจสอบ Railway Logs ไม่มี error
- [ ] ทดสอบ `/api/products` ได้ absolute URL
- [ ] ทดสอบเปิดรูปโดยตรง (https://...up.railway.app/uploads/xxx.jpg)
- [ ] เปิด Vercel แล้วรูปแสดงครบ

---

## 🐛 Troubleshooting

### **ปัญหา: รูปยังไม่แสดงบน Vercel**

1. **ตรวจสอบ Railway Logs:**
   ```
   Railway Dashboard → Deployments → View Logs
   ```
   ควรเห็น:
   ```
   ✅ Backend running on port XXXX
   🔐 PromptPay ID: 0801792785
   ```

2. **ตรวจสอบ API Response:**
   ```javascript
   // Console บน Vercel
   fetch('https://testfrontenddev-production.up.railway.app/api/products')
     .then(r => r.json())
     .then(d => console.log(d[0].image_url));
   ```
   
   ✅ **ถูกต้อง:** `https://testfrontenddev-production.up.railway.app/uploads/xxx.jpg`
   ❌ **ผิด:** `/uploads/xxx.jpg` หรือ `xxx.jpg`

3. **ลอง Manual Redeploy:**
   - Railway Dashboard → Deployments → เลือก deployment ล่าสุด
   - กด **⋯** → **Redeploy**

### **ปัญหา: 404 เมื่อเปิดรูปโดยตรง**

ไฟล์รูปไม่มีใน server จริง ๆ:

1. ตรวจสอบว่ามีโฟลเดอร์ `backend/uploads/` และมีไฟล์รูปอยู่หรือไม่
2. ตรวจสอบว่า `backend/public/uploads/` มีไฟล์หรือไม่
3. อาจต้อง upload รูปใหม่ผ่าน admin panel

---

## 📝 หมายเหตุ

- **Local Development:** ใช้ `PUBLIC_ORIGIN=http://localhost:4000`
- **Production (Railway):** ใช้ `PUBLIC_ORIGIN=https://testfrontenddev-production.up.railway.app`
- **Frontend (Vercel):** ไม่ต้องแก้อะไร จะอ่าน absolute URL จาก API อัตโนมัติ

🎉 **เสร็จสิ้น! รูปภาพควรแสดงบน Vercel แล้ว**
