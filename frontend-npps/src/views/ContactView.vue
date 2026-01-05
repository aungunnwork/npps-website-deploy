<script setup>
import { companyInfo, contactInfo } from '@/data/siteMeta.js'
</script>

<template>
  <div class="page">
    <div class="wrap">
      <!-- Header -->
      <header class="head">
        <div class="title-wrap">
          <h1>ติดต่อเรา</h1>
          <p class="sub">หากมีข้อสงสัยหรือต้องการสอบถาม สามารถติดต่อเราได้ตามช่องทางด้านล่าง</p>
        </div>
      </header>

      <section class="grid">
        <!-- Contact info -->
        <div class="card">
          <h3 class="card-title">ข้อมูลการติดต่อ</h3>
          <ul class="contact-list">
            <li>
              <span class="icon">✉️</span>
              <div class="meta">
                <div class="label">อีเมล</div>
                <a :href="`mailto:${contactInfo.email}`" class="value">{{ contactInfo.email }}</a>
              </div>
            </li>
            <li>
              <span class="icon">📞</span>
              <div class="meta">
                <div class="label">โทรศัพท์</div>
                <a :href="contactInfo.phoneLink" class="value">{{ contactInfo.phoneFormatted }}</a>
              </div>
            </li>
            <li>
              <span class="icon">📍</span>
              <div class="meta">
                <div class="label">ที่อยู่</div>
                <div class="value">{{ contactInfo.address.full }}</div>
              </div>
            </li>
          </ul>
        </div>

        <!-- Map -->
        <div class="card">
          <h3 class="card-title">แผนที่</h3>
          <!-- ✅ ฝังแผนที่เป็นการ์ด โค้งมน ขอบขาว -->
          <div class="map-wrap">
            <iframe
              class="map"
              :src="contactInfo.mapUrl"
              width="100%"
              height="100%"
              style="border:0;"
              allowfullscreen=""
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.page {
  background: var(--c-bg);
  min-height: 100vh;
}

.wrap {
  max-width: 1080px;
  margin: 0 auto;
  padding: var(--sp-8) var(--sp-4);
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-3);
  margin-bottom: var(--sp-5);
}

.title-wrap h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--c-text);
}

.title-wrap .sub {
  margin: var(--sp-1) 0 0;
  color: var(--c-text-muted);
  font-size: 14px;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-5);
  align-items: start;
}

/* Tablet & Below */
@media (max-width: 1024px) {
  .wrap {
    padding: var(--sp-6) var(--sp-4);
  }

  .grid {
    grid-template-columns: 1fr;
    gap: var(--sp-4);
  }
}

/* Mobile */
@media (max-width: 768px) {
  .wrap {
    padding: var(--sp-5) var(--sp-3);
  }

  h1 {
    font-size: 22px;
  }

  .sub {
    font-size: 13px;
  }

  .card {
    padding: var(--sp-4);
  }

  .card-title {
    font-size: 15px;
    margin-bottom: var(--sp-2);
  }

  .contact-list {
    gap: var(--sp-2);
  }

  .contact-list li {
    flex-direction: column;
    gap: var(--sp-2);
    padding: var(--sp-2);
  }

  .map-wrap {
    height: 300px;
  }
}

/* Small Mobile */
@media (max-width: 480px) {
  .wrap {
    padding: var(--sp-4) var(--sp-2);
  }

  h1 {
    font-size: 20px;
  }

  .sub {
    font-size: 12px;
  }

  .card {
    padding: var(--sp-3);
  }

  .card-title {
    font-size: 14px;
  }

  .contact-list li {
    padding: var(--sp-2);
  }

  .label {
    font-size: 12px;
  }

  .value {
    font-size: 13px;
  }

  .map-wrap {
    height: 250px;
  }
}

.card {
  background: var(--c-card);
  border-radius: var(--radius);
  box-shadow: var(--shadow-1);
  padding: var(--sp-5);
  transition: box-shadow var(--transition-fast) var(--ease);
}

.card:hover {
  box-shadow: var(--shadow-2);
}

.card-title {
  margin: 0 0 var(--sp-3);
  font-size: 16px;
  font-weight: 700;
  color: var(--c-text);
}

/* Contact list */
.contact-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: var(--sp-3);
}

.contact-list li {
  display: flex;
  gap: var(--sp-4);
  align-items: flex-start;
  background: var(--c-bg-soft);
  border-radius: 10px;
  padding: var(--sp-3);
  transition: all var(--transition-fast) var(--ease);
}

.contact-list li:hover {
  background: var(--c-border-light);
  transform: translateX(2px);
}

.icon {
  font-size: 18px;
  line-height: 1;
}

.meta {
  display: grid;
  gap: var(--sp-1);
}

.label {
  color: var(--c-text-muted);
  font-size: 13px;
  font-weight: 600;
}

.value {
  font-weight: 700;
  color: var(--c-text);
  text-decoration: none;
  transition: color var(--transition-fast) var(--ease);
}

.value:hover {
  color: var(--c-primary);
  text-decoration: underline;
}

/* Map */
.map-wrap {
  width: 100%;
  height: 320px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--c-border);
  background: var(--c-bg-soft);
  box-shadow: var(--shadow-1);
}

.map {
  display: block;
  width: 100%;
  height: 100%;
}

/* Buttons (เผื่อใช้ในอนาคต) */
.btn {
  padding: var(--sp-3) var(--sp-4);
  border-radius: 10px;
  border: 1px solid var(--c-primary);
  background: var(--c-primary);
  color: #fff;
  cursor: pointer;
  font-weight: 600;
  transition: all var(--transition-fast) var(--ease);
}

.btn:hover {
  background: var(--c-primary-700);
  transform: translateY(-1px);
}

.btn.primary {
  background: var(--c-primary);
  border-color: var(--c-primary);
  color: #fff;
}

.btn.ghost {
  background: transparent;
  color: var(--c-text);
  border-color: var(--c-border);
}

.btn.ghost:hover {
  background: var(--c-bg-soft);
  transform: none;
}
</style>
