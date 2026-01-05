<script setup>
import { companyInfo, contactInfo, quickLinks, copyright } from '@/data/siteMeta.js'
</script>

<template>
  <footer class="site-footer">
    <div class="footer-container">
      <!-- Column 1: Company Description -->
      <div class="footer-section">
        <h4 class="footer-heading">{{ companyInfo.fullName }}</h4>
        <p class="footer-text">
          {{ companyInfo.description }}
        </p>
        <p class="footer-tagline">
          {{ companyInfo.tagline }}
        </p>
      </div>

      <!-- Column 2: Contact Us -->
      <div class="footer-section">
        <h4 class="footer-heading">ติดต่อเรา / Contact Us</h4>
        <ul class="footer-list">
          <li>
            <span class="icon">📧</span>
            <a :href="`mailto:${contactInfo.email}`">{{ contactInfo.email }}</a>
          </li>
          <li>
            <span class="icon">📞</span>
            <a :href="contactInfo.phoneLink">{{ contactInfo.phoneFormatted }}</a>
          </li>
          <li>
            <span class="icon">📍</span>
            <span>{{ contactInfo.address.full }}</span>
          </li>
        </ul>
      </div>

      <!-- Column 3: Quick Links -->
      <div class="footer-section">
        <h4 class="footer-heading">เมนูด่วน / Quick Links</h4>
        <ul class="footer-list">
          <li v-for="link in quickLinks" :key="link.path">
            <router-link :to="link.path">{{ link.name }}</router-link>
          </li>
        </ul>
      </div>
    </div>

    <!-- Bottom Copyright Bar -->
    <div class="footer-bottom">
      <p>© {{ copyright.year }} {{ copyright.company }}. {{ copyright.text }}</p>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  background: var(--bg-footer);
  color: var(--text-on-dark);
  border-top: 3px solid rgba(220, 38, 38, 0.3);
  margin-top: auto;
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 20px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 32px;
}

.footer-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.footer-heading {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 700;
  color: #FFFFFF;
  letter-spacing: 0.3px;
}

.footer-text {
  margin: 0 0 8px;
  font-size: 14px;
  line-height: 1.7;
  color: #D1D5DB;
}

.footer-tagline {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: #D1D5DB;
  font-style: italic;
  opacity: 0.85;
}

.footer-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.footer-list li {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 14px;
  color: #D1D5DB;
  line-height: 1.6;
}

.footer-list .icon {
  font-size: 16px;
  flex-shrink: 0;
  margin-top: 2px;
}

.footer-list a {
  color: #D1D5DB;
  text-decoration: none;
  transition: color var(--transition-fast) var(--ease);
}

.footer-list a:hover {
  color: #DC2626;
  text-decoration: underline;
}

.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 20px;
  text-align: center;
  background: rgba(0, 0, 0, 0.2);
}

.footer-bottom p {
  margin: 0;
  font-size: 13px;
  color: #D1D5DB;
}

/* Responsive: Stack on mobile */
@media (max-width: 768px) {
  .footer-container {
    grid-template-columns: 1fr;
    gap: 24px;
    padding: 24px 16px;
  }
  
  .footer-section {
    text-align: left;
  }
  
  .footer-bottom {
    padding: 16px;
  }
}

@media (max-width: 480px) {
  .footer-container {
    padding: 20px 12px;
    gap: 20px;
  }
  
  .footer-heading {
    font-size: 15px;
  }
  
  .footer-text, .footer-list li {
    font-size: 13px;
  }
  
  .footer-bottom p {
    font-size: 12px;
  }
}
</style>
