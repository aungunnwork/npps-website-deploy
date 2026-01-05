<template>
  <div class="page">
    <!-- Hero -->
    <section class="hero">
      <div class="hero-overlay"></div>
      <div class="hero-inner">
        <h1>ยินดีต้อนรับสู่ NPPS Supply</h1>
        <p class="tagline">
           สินค้าคุณภาพ บริการไว ส่งทั่วประเทศ
        </p>
        <div class="cta">
          <router-link to="/product" class="btn primary">ดูสินค้า</router-link>
          <router-link to="/contact" class="btn ghost">ติดต่อเรา</router-link>
        </div>
      </div>
    </section>

    <div class="wrap">
      <!-- Highlights -->
      <section class="metrics">
        <div class="card metric">
          <div class="icon">🏭</div>
          <div class="title">มีสินค้ามากกว่า</div>
          <div class="value">30 รายการ</div>
          <div class="muted">รายการพร้อมส่ง</div>
        </div>
        <div class="card metric">
          <div class="icon">🚚</div>
          <div class="title">จัดส่งทั่วไทย</div>
          <div class="value">1–3 วัน</div>
          <div class="muted">ตามพื้นที่ให้บริการ</div>
        </div>
        <div class="card metric">
          <div class="icon">🛠️</div>
          <div class="title">บริการหลังการขาย</div>
          <div class="value">มืออาชีพ</div>
          <div class="muted">ให้คำแนะนำโดยผู้เชี่ยวชาญ</div>
        </div>
      </section>

      <!-- About -->
      <section class="card about">
        <h3>เกี่ยวกับบริษัท</h3>
        <p>
          เราคัดสรรสินค้าอุตสาหกรรมและอะไหล่มาตรฐาน รับประกันคุณภาพ
          พร้อมทีมซัพพอร์ตที่เข้าใจหน้างานจริง ช่วยให้ธุรกิจของคุณเดินได้ต่อเนื่อง
        </p>
        <ul class="bullets">
          <li>สินค้าแท้ </li>
          <li>สต็อกพร้อม ส่งไว</li>
          <li>ให้คำแนะนำการใช้งานและการดูแลรักษา</li>
        </ul>
      </section>


    </div>
  </div>
</template>

<script setup>
// ไม่มี logic ในหน้านี้
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--c-bg-soft);
}

/* Hero Section */
.hero {
  position: relative;
  min-height: min(65vh, 600px);
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    linear-gradient(135deg, rgba(30, 41, 59, 0.92) 0%, rgba(15, 23, 42, 0.88) 100%),
    url('/images/bannernpps.jpg');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  background-image: url('/images/bannernpps.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.hero-overlay::after {
  content: "";
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.25);
  z-index: 0;
}

.hero-inner {
  position: relative;
  z-index: 1;
  max-width: 900px;
  margin: 0 auto;
  padding: var(--sp-8) var(--sp-5);
  text-align: center;
  color: #fff;
}

.hero h1 {
  margin: 0 0 var(--sp-4) 0;
  font-size: clamp(32px, 5vw, 52px);
  font-weight: 800;
  line-height: 1.2;
  text-shadow: 0 4px 20px rgba(0,0,0,.2);
}

.tagline {
  margin: 0 auto var(--sp-6);
  max-width: 500px;
  font-size: clamp(16px, 2.5vw, 20px);
  opacity: .95;
  line-height: 1.6;
  text-shadow: 0 2px 10px rgba(0,0,0,.15);
}

.cta {
  display: flex;
  gap: var(--sp-3);
  justify-content: center;
  flex-wrap: wrap;
}

.wrap {
  max-width: 1100px;
  margin: 0 auto;
  padding: var(--sp-8) var(--sp-4);
}

.card {
  background: var(--c-card);
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-1);
  padding: var(--sp-5);
  transition: all var(--transition-base) var(--ease);
}

.card:hover {
  box-shadow: var(--shadow-2);
  transform: translateY(-2px);
}

/* Metrics Section */
.metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--sp-5);
  margin-bottom: var(--sp-7);
}

.metric {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--sp-6);
  gap: var(--sp-2);
}

.metric .icon {
  font-size: 42px;
  margin-bottom: var(--sp-2);
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(30, 58, 138, 0.1), rgba(30, 64, 175, 0.12));
  border-radius: 16px;
}

.metric .title {
  color: var(--c-text-muted);
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metric .value {
  font-size: 26px;
  font-weight: 700;
  color: var(--c-primary);
  margin: var(--sp-1) 0;
}

.metric .muted {
  color: var(--c-text-muted);
  font-size: 14px;
  line-height: 1.5;
}

/* About Section */
.about {
  border-left: 4px solid var(--c-accent);
  background: linear-gradient(135deg, rgba(30, 58, 138, 0.03), rgba(220, 38, 38, 0.02));
}

.about h3 {
  margin: 0 0 var(--sp-4);
  font-size: 24px;
  font-weight: 700;
  color: var(--c-primary);
}

.about p {
  margin: 0 0 var(--sp-4);
  color: var(--c-text);
  font-size: 15px;
  line-height: 1.7;
}

.bullets {
  margin: 0;
  padding-left: var(--sp-6);
  color: var(--c-text);
}

.bullets li {
  margin: var(--sp-3) 0;
  line-height: 1.6;
}

/* Buttons */
.btn {
  padding: 12px 24px;
  border-radius: 10px;
  border: 2px solid transparent;
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: var(--sp-2);
  transition: all var(--transition-base) var(--ease);
}

.btn:hover {
  transform: translateY(-2px);
}

.btn.primary {
  background: linear-gradient(90deg, #1E3A8A, #1E40AF);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 6px 20px rgba(30, 58, 138, 0.4);
}

.btn.primary:hover {
  background: linear-gradient(90deg, #1E40AF, #2563EB);
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.5);
}

.btn.ghost {
  background: rgba(255,255,255,.15);
  color: #fff;
  border-color: rgba(255,255,255,.5);
  backdrop-filter: blur(10px);
}

.btn.ghost:hover {
  background: rgba(255,255,255,.25);
  border-color: #DC2626;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
}

@media (max-width: 1024px) {
  .wrap {
    padding: var(--sp-6) var(--sp-5);
  }
  
  .metrics {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .hero {
    min-height: 50vh;
    background-attachment: scroll;
  }
  
  .hero-inner {
    padding: var(--sp-6) var(--sp-4);
  }
  
  .wrap {
    padding: var(--sp-6) var(--sp-4);
  }
  
  .metrics {
    grid-template-columns: 1fr;
    gap: var(--sp-4);
  }
  
  .cta {
    flex-direction: column;
    width: 100%;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .hero {
    min-height: 40vh;
  }
  
  .hero-inner {
    padding: var(--sp-5) var(--sp-3);
  }
  
  .wrap {
    padding: var(--sp-5) var(--sp-3);
  }
  
  .card {
    padding: var(--sp-4);
  }
  
  .metric {
    padding: var(--sp-4);
  }
  
  .metric .icon {
    width: 60px;
    height: 60px;
    font-size: 36px;
  }
}
</style>
