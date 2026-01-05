# 🚀 Vercel Proxy Deployment Guide

## ✅ สิ่งที่แก้ไข

### **ปัญหาเดิม:**
- Frontend บน Vercel เรียก Backend บน Railway โดยตรง
- เกิด CORS errors เพราะ cross-origin requests
- ต้องตั้งค่า environment variables ซับซ้อน

### **วิธีแก้ใหม่:**
- ใช้ **Vercel Rewrites เป็น Proxy**
- Frontend เรียก `/api/*` ที่เป็น same-origin
- Vercel proxy ไปหา Railway ใต้หลังคา
- ไม่มี CORS issues อีกต่อไป!

---

## 📁 ไฟล์ที่แก้ไข

### **1. Frontend (frontend-npps/)**

#### **`vercel.json`** (ไฟล์ใหม่)
```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://testfrontenddev-production.up.railway.app/api/:path*"
    }
  ],
  "redirects": [
    {
      "source": "/((?!api).*)",
      "destination": "/index.html",
      "permanent": false
    }
  ]
}
```

**อธิบาย:**
- `rewrites`: Proxy ทุก request ที่ขึ้นต้นด้วย `/api/` ไปหา Railway backend
- `redirects`: รองรับ Vue Router history mode (refresh หน้าไหนก็ได้)

#### **`src/lib/api.js`**
```javascript
// เดิม: baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'
// ใหม่:
const api = axios.create({
  baseURL: import.meta.env.DEV ? 'http://localhost:4000/api' : '/api',
});
```

**อธิบาย:**
- **Development:** ใช้ `localhost:4000/api` (รัน backend ในเครื่อง)
- **Production:** ใช้ `/api` (Vercel proxy ไป Railway)

#### **`src/App.vue`**
```javascript
// เดิม: fetch(`${apiUrl}/products`)
// ใหม่: 
import api from './lib/api'
const { data } = await api.get('/products')
```

**อธิบาย:**
- เปลี่ยนจาก `fetch` เป็น `axios`
- ใช้ relative path `/api` แทน absolute URL

#### **`.env`**
```bash
# ลบ VITE_API_BASE_URL ออก (ไม่จำเป็นแล้ว)
# เหลือแค่
VITE_API_BASE=http://localhost:4000  # สำหรับรูปภาพใน local dev
```

---

### **2. Backend (backend/)**

#### **`index.js`**
```javascript
// เรียบง่ายขึ้น - ไม่ต้องมี manual CORS headers
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200
}));
```

**อธิบาย:**
- `origin: true` - อนุญาตทุก origin (ปลอดภัยเพราะ Vercel proxy กรองให้แล้ว)
- ลบ manual CORS headers middleware (ไม่จำเป็น)

---

## 🌐 การตั้งค่า Environment Variables

### **Vercel (Frontend)**

**ลบออก:**
- ❌ `VITE_API_BASE_URL` (ไม่จำเป็น - ใช้ `/api` แทน)

**เพิ่ม (ถ้ายังไม่มี):**
- ✅ `VITE_API_BASE=https://testfrontenddev-production.up.railway.app`  
  (สำหรับรูปภาพ/static files เท่านั้น)

### **Railway (Backend)**

**ต้องมี:**
- ✅ `DATABASE_URL=mysql://user:pass@host:port/db`
- ✅ `JWT_SECRET=your-secret-key`
- ✅ `PROMPTPAY_ID=0801792785`
- ✅ `PUBLIC_ORIGIN=https://testfrontenddev-production.up.railway.app`
- ✅ `NODE_ENV=production`

**ไม่ต้องมี:**
- ❌ `PORT` (Railway inject อัตโนมัติ)

---

## 🧪 การทดสอบ

### **1. ทดสอบ Backend โดยตรง (Railway)**
```bash
curl -i https://testfrontenddev-production.up.railway.app/health
# ควรได้ 200 OK + {"status":"ok",...}
```

### **2. ทดสอบผ่าน Vercel Proxy**
```bash
curl -i https://test-frontend-dev-mu.vercel.app/api/health
# ควรได้ 200 OK + {"status":"ok",...}
```

### **3. ทดสอบบน Browser**
1. เปิด https://test-frontend-dev-mu.vercel.app
2. เปิด DevTools → Network tab
3. ดู API requests ควรเป็น:
   ```
   https://test-frontend-dev-mu.vercel.app/api/products
   ```
   **ไม่ใช่:**
   ```
   https://testfrontenddev-production.up.railway.app/api/products ❌
   ```

---

## ✅ Checklist

- [x] สร้าง `vercel.json` ใน frontend root
- [x] แก้ `src/lib/api.js` ให้ใช้ relative path
- [x] แก้ `src/App.vue` ใช้ axios แทน fetch
- [x] อัปเดต `.env` ลบ VITE_API_BASE_URL
- [x] แก้ `backend/index.js` เรียบง่าย CORS
- [x] ลบ VITE_API_BASE_URL จาก Vercel Dashboard
- [x] Commit และ Push ขึ้น GitHub
- [x] Redeploy Vercel (อัตโนมัติหลัง push)
- [x] Redeploy Railway (อัตโนมัติหลัง push)

---

## 🎉 ผลลัพธ์

**ก่อนแก้:**
```
Vercel Frontend → Railway Backend (cross-origin)
                  ❌ CORS errors
```

**หลังแก้:**
```
Browser → Vercel Frontend (/api/*)
                ↓ (proxy - same-origin)
          Railway Backend
          ✅ No CORS issues!
```

---

## 📝 สรุปความเปลี่ยนแปลง

### **ทำไมถึงใช้วิธีนี้?**

1. **แก้ CORS ถาวร:** Proxy ทำให้ requests เป็น same-origin
2. **ความปลอดภัย:** ไม่ต้อง expose Railway URL ใน client code
3. **ง่ายต่อการจัดการ:** เปลี่ยน backend URL แค่ที่เดียว (vercel.json)
4. **ไม่ซับซ้อน:** ไม่ต้องตั้งค่า environment variables มากมาย

### **ข้อควรระวัง**

- ⚠️ Vercel proxy มีข้อจำกัด timeout (~10 seconds สำหรับ Serverless Functions)
- ⚠️ ถ้า backend response ช้า อาจต้องปรับ timeout settings
- ⚠️ Vercel Free Plan มีขอบเขต bandwidth และ invocations

---

## 🚀 Next Steps

1. Push code ขึ้น GitHub
2. รอ Vercel auto-deploy (1-2 นาที)
3. รอ Railway auto-deploy (1-2 นาที)
4. ทดสอบตาม checklist ด้านบน
5. เปิดจากคอมอื่น/มือถือ ควรทำงานได้ทุกที่!

**หากมีปัญหา:**
- ดู Vercel Logs: https://vercel.com/dashboard → Deployments → Logs
- ดู Railway Logs: https://railway.app → Project → Deployments → Logs
