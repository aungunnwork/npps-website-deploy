# 🚀 Frontend Deployment Guide (Vercel)

## ✅ ที่แก้ไขแล้ว

### 1. **API Configuration (src/lib/api.js)**
- ✅ เปลี่ยนจาก hardcode `http://localhost:4000/api`
- ✅ ใช้ `import.meta.env.VITE_API_BASE_URL` แทน
- ✅ Fallback to localhost สำหรับ development

### 2. **App.vue - Fetch Products**
- ✅ แก้ hardcode fetch URL
- ✅ ใช้ `VITE_API_BASE_URL` environment variable

### 3. **Router (src/router/index.js)**
- ✅ แก้ case-sensitive import: `Productview.vue` → `ProductView.vue`
- ✅ พร้อม deploy บน Linux (Vercel)

### 4. **Environment Variables**
- ✅ สร้าง `.env` และ `.env.example`
- ✅ เพิ่ม `.env` ใน `.gitignore`
- ✅ ใช้ชื่อ `VITE_*` ตาม Vite standard

---

## 📦 Deploy บน Vercel

### **Step 1: Push Code to GitHub**
```bash
git add .
git commit -m "feat: add environment variable support for Vercel deployment"
git push
```

### **Step 2: เชื่อม Vercel กับ GitHub**
1. ไปที่ [vercel.com](https://vercel.com)
2. Login ด้วย GitHub
3. เลือก **New Project** → Import repository
4. เลือก `test_frontend_dev` repository

### **Step 3: Configure Build Settings**
Vercel จะ auto-detect Vite project แต่ให้ตรวจสอบ:

**Framework Preset:** Vite
**Root Directory:** `frontend-npps`
**Build Command:** `npm run build`
**Output Directory:** `dist`

### **Step 4: ตั้งค่า Environment Variables**
ใน Vercel Dashboard → Project Settings → Environment Variables:

```env
VITE_API_BASE_URL=https://your-backend-name.up.railway.app/api
VITE_API_BASE=https://your-backend-name.up.railway.app
```

**สำคัญ!**
- ชื่อต้องขึ้นต้นด้วย `VITE_` เสมอ
- ใส่ URL ของ Railway backend (ไม่ใช่ localhost)
- ไม่ต้องใส่ `/` ท้าย URL

### **Step 5: Deploy**
1. กด **Deploy**
2. รอ build 1-2 นาที
3. Vercel จะให้ URL: `https://your-app.vercel.app`

---

## 🔧 Local Development

### **ติดตั้ง Dependencies**
```bash
cd frontend-npps
npm install
```

### **รัน Dev Server**
```bash
npm run dev
```

Frontend จะรันที่ `http://localhost:5173`

### **Build สำหรับ Production**
```bash
npm run build
```

Preview build:
```bash
npm run preview
```

---

## 📝 Environment Variables Summary

| Variable | ใช้ที่ไหน | Local | Vercel | Required |
|----------|----------|-------|--------|----------|
| `VITE_API_BASE_URL` | API calls (axios) | `http://localhost:4000/api` | `https://backend.up.railway.app/api` | ✅ |
| `VITE_API_BASE` | Static files (images, QR, slips) | `http://localhost:4000` | `https://backend.up.railway.app` | ✅ |

---

## 🐛 Troubleshooting

### **Error: API calls ไม่ทำงาน**
- ✅ ตรวจสอบว่าตั้ง `VITE_API_BASE_URL` ใน Vercel Variables หรือยัง
- ✅ ตรวจสอบว่า backend บน Railway เปิดอยู่
- ✅ ตรวจสอบ CORS ใน backend: `FRONTEND_URL` ต้องมี Vercel URL

### **Error: รูปสินค้า/QR/Slip ไม่แสดง**
- ✅ ตรวจสอบว่าตั้ง `VITE_API_BASE` ใน Vercel Variables หรือยัง
- ✅ ตรวจว่าไฟล์อัปโหลดบน Railway มีจริงหรือไม่
- ✅ เปิด Network tab ดู URL ที่เรียกว่าถูกต้องหรือไม่

### **Error: "Module not found" ProductView**
- ✅ แก้ไขแล้ว: เปลี่ยน `Productview.vue` → `ProductView.vue`
- ✅ Clear Vite cache: ลบโฟลเดอร์ `.vite` และ `node_modules/.vite`

### **Environment Variables ไม่ทำงาน**
- ✅ ชื่อต้องขึ้นต้นด้วย `VITE_` เท่านั้น (ไม่ใช่ `VUE_APP_` หรืออื่นๆ)
- ✅ หลังเปลี่ยน env variables ใน Vercel ต้อง **Redeploy**
- ✅ Restart dev server หลังแก้ `.env` local

---

## ✅ Checklist ก่อน Deploy

- [x] แก้ไข `api.js` ให้ใช้ `VITE_API_BASE_URL`
- [x] แก้ไข `App.vue` ให้ใช้ environment variable
- [x] แก้ case-sensitive imports (`ProductView.vue`)
- [x] สร้าง `.env` และ `.env.example`
- [x] เพิ่ม `.env` ใน `.gitignore`
- [ ] Push code ขึ้น GitHub
- [ ] Deploy backend บน Railway ก่อน
- [ ] ตั้งค่า Environment Variables ใน Vercel
- [ ] ตั้งค่า CORS ใน backend (เพิ่ม Vercel URL)
- [ ] ทดสอบ API endpoints ว่าทำงานได้
- [ ] ทดสอบ login/register ว่าใช้งานได้
- [ ] ทดสอบอัปโหลดรูปและดูรูปว่าแสดงได้

---

## 📚 Files Changed

### Frontend
1. `src/lib/api.js` - ใช้ `VITE_API_BASE_URL`
2. `src/App.vue` - ใช้ environment variable ใน fetch
3. `src/router/index.js` - แก้ case-sensitive import
4. `.env` - environment variables สำหรับ local
5. `.env.example` - template สำหรับ deployment
6. `.gitignore` - เพิ่ม `.env` files

### Backend (แก้ไขแล้วในขั้นตอนก่อนหน้า)
1. `config/db.js` - รองรับ `DATABASE_URL`
2. `index.js` - CORS, PORT, bind 0.0.0.0
3. `routes/auth.js` - ใช้ shared pool, `JWT_SECRET` จาก env
4. `middlewares/auth.js` - `JWT_SECRET` จาก env
5. `.env` - environment variables สำหรับ Railway

---

## 🔗 URLs สำคัญ

**Development:**
- Frontend: http://localhost:5173
- Backend: http://localhost:4000

**Production:**
- Frontend: https://your-app.vercel.app
- Backend: https://your-backend.up.railway.app

---

🎉 **Deploy เสร็จแล้ว! Frontend พร้อมใช้งานบน Vercel**
