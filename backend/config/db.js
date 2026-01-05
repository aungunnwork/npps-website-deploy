const mysql = require('mysql2/promise');

// ✅ รองรับทั้ง DATABASE_URL (Railway/Production) และแบบแยก host/user/pass (Local)
let pool;

if (process.env.DATABASE_URL) {
  // Production: ใช้ connection string จาก Railway
  pool = mysql.createPool({
    uri: process.env.DATABASE_URL,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  });
  console.log('✅ Connected to MySQL using DATABASE_URL (Railway)');
} else {
  // Local: ใช้แบบแยก host/user/pass
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 8830,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'npps',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
  console.log('✅ Connected to MySQL using local config');
}

// ทดสอบการเชื่อมต่อ
pool.getConnection()
  .then(connection => {
    console.log('✅ MySQL connection successful!');
    connection.release();
  })
  .catch(err => {
    console.error('❌ MySQL connection failed:', err.message);
    process.exit(1); // หยุด server ถ้าเชื่อมต่อไม่ได้
  });

module.exports = pool;
