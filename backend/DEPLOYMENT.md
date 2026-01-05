# 🚀 Backend Deployment Guide (Railway)

## ✅ ที่แก้ไขแล้ว

### 1. **Database Connection (config/db.js)**
- ✅ รองรับ `DATABASE_URL` (Railway) และแบบแยก host/user/pass (Local)
- ✅ Auto-detect connection type
- ✅ Connection test on startup

### 2. **JWT Secret (middlewares/auth.js + routes/auth.js)**
- ✅ ใช้ `process.env.JWT_SECRET` แทน hardcode
- ✅ Fallback to dev secret ถ้าไม่ได้ตั้งค่า

### 3. **Server Port (index.js)**
- ✅ ใช้ `process.env.PORT` (Railway กำหนดให้อัตโนมัติ)
- ✅ Bind to `0.0.0.0` แทน `localhost`

### 4. **CORS (index.js)**
- ✅ รองรับ multiple origins
- ✅ ใช้ `FRONTEND_URL` จาก environment variable

---

## 📦 Deploy บน Railway

### **Step 1: เตรียม MySQL Database**
1. ไปที่ Railway Dashboard → New Project
2. เลือก **Add MySQL** (Railway จะสร้าง MySQL instance ให้)
3. คัดลอก `DATABASE_URL` ที่ Railway ให้มา (รูปแบบ: `mysql://user:pass@host:port/dbname`)

### **Step 2: Import Database Schema**
1. เปิด Railway MySQL console หรือใช้ MySQL client
2. Import schema จากไฟล์ `database/schema.sql`
```bash
mysql -h <host> -P <port> -u <user> -p<password> <dbname> < database/schema.sql
```

### **Step 3: Deploy Backend**
1. ใน Railway Dashboard เลือก **New** → **GitHub Repo**
2. เชื่อม repo นี้กับ Railway
3. Railway จะ detect `package.json` และรัน `npm start` อัตโนมัติ

### **Step 4: ตั้งค่า Environment Variables**
ใน Railway Dashboard → Variables → Add:

```env
DATABASE_URL=mysql://user:password@host:port/database
JWT_SECRET=your-super-secret-64-character-random-string-here
PROMPTPAY_ID=0801792785
FRONTEND_URL=https://test-frontend-dev-mu.vercel.app
PUBLIC_ORIGIN=https://testfrontenddev-production.up.railway.app
NODE_ENV=production
```

**หมายเหตุ:**
- `FRONTEND_URL` - URL ของ frontend บน Vercel (สำหรับ CORS)
- `PUBLIC_ORIGIN` - URL ของ backend บน Railway (สำหรับสร้าง absolute URL ของรูปภาพ)

**สร้าง JWT_SECRET แบบสุ่ม:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### **Step 5: Verify Deployment**
1. Railway จะให้ URL: `https://your-app.up.railway.app`
2. ทดสอบ API: `https://your-app.up.railway.app/api/products`
3. ตรวจ logs: Railway Dashboard → Deployments → Logs

---

## 🔧 Local Development

### **ใช้ Docker (แนะนำ)**
```bash
cd backend
docker compose up -d
npm run dev
```

### **ไม่ใช้ Docker**
1. ติดตั้ง MySQL local
2. Copy `.env.example` เป็น `.env`
3. แก้ `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
4. รัน `npm run dev`

---

## 📝 Environment Variables Summary

| Variable | Local | Railway | Required |
|----------|-------|---------|----------|
| `DATABASE_URL` | - | ✅ | ✅ |
| `DB_HOST` | ✅ | - | Local only |
| `DB_PORT` | ✅ | - | Local only |
| `DB_USER` | ✅ | - | Local only |
| `DB_PASSWORD` | ✅ | - | Local only |
| `DB_NAME` | ✅ | - | Local only |
| `JWT_SECRET` | ✅ | ✅ | ✅ |
| `PROMPTPAY_ID` | ✅ | ✅ | ✅ |
| `FRONTEND_URL` | - | ✅ | Production only |
| `PORT` | 4000 | Auto | Railway auto-assigns |
| `NODE_ENV` | development | production | ✅ |

---

## 🐛 Troubleshooting

### **Error: ECONNREFUSED**
- ✅ ตรวจว่าตั้ง `DATABASE_URL` ใน Railway Variables หรือยัง
- ✅ ตรวจว่า MySQL instance ใน Railway เปิดอยู่หรือไม่
- ✅ ดู logs ว่ามีข้อความ "MySQL connection successful" หรือไม่

### **Error: invalid token / jwt malformed**
- ✅ ตั้ง `JWT_SECRET` ให้ตรงกันทั้ง backend และที่เคย generate token ไว้
- ✅ Frontend ต้อง clear localStorage และ login ใหม่

### **Error: Not allowed by CORS**
- ✅ เพิ่ม URL ของ frontend ใน `FRONTEND_URL`
- ✅ ตรวจว่า frontend ส่ง request ไปที่ backend URL ที่ถูกต้องหรือไม่

---

## ✅ Checklist ก่อน Deploy

- [ ] Import database schema บน Railway MySQL
- [ ] ตั้งค่า `DATABASE_URL` ใน Railway Variables
- [ ] Generate และตั้งค่า `JWT_SECRET` แบบสุ่ม 64 characters
- [ ] ตั้งค่า `FRONTEND_URL` (URL ของ Vercel)
- [ ] ตั้งค่า `PROMPTPAY_ID`
- [ ] ตั้งค่า `NODE_ENV=production`
- [ ] ทดสอบ API endpoints ว่าทำงานได้
- [ ] ตรวจ logs ว่าไม่มี error

---

## 📚 Files Changed

1. `config/db.js` - รองรับ DATABASE_URL และ local config
2. `index.js` - PORT, CORS, bind 0.0.0.0
3. `middlewares/auth.js` - JWT_SECRET จาก env
4. `routes/auth.js` - ใช้ pool จาก config/db.js, JWT_SECRET จาก env
5. `package.json` - เพิ่ม start script
6. `.env` - เพิ่ม variables ทั้งหมด
7. `.env.example` - template สำหรับ deployment

---

🎉 **Deploy เสร็จแล้ว! Backend พร้อมใช้งานบน Railway**
