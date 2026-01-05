/**
 * Centralized Site Metadata & Contact Information
 * แก้ไขข้อมูลที่นี่แล้วจะอัปเดตทั้งหน้า About และ Footer พร้อมกัน
 */

export const companyInfo = {
  name: 'NPPS Supply',
  fullName: 'บริษัท เอ็นพีพีเอส ซัพพลาย',
  description: 'บริษัท ค้าขายอุปกรณ์ช่าง เครื่องมือที่ใช้ในโรงงานอุตสาหกรรมทุกชนิด รวมถึงอุปกรณ์ช่างมืออาชีพและเครื่องมือคุณภาพสูงสำหรับโรงงานอุตสาหกรรมทุกประเภท',
  tagline: 'Professional industrial equipment supply system'
}

export const contactInfo = {
  email: 'nppssupply@hotmail.com',
  phone: '098-280-0692',
  phoneFormatted: '098-280-0692',
  phoneLink: 'tel:+66982800692',
  address: {
    full: '55/35 หมู่บ้านแกรนด์กิตติยา ต.คลองโยง อ.พุทธมณฑล จ.นครปฐม 73170',
    line1: '55/35 หมู่บ้านแกรนด์กิตติยา',
    line2: 'ต.คลองโยง อ.พุทธมณฑล',
    line3: 'จ.นครปฐม 73170'
  },
  mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1151.71677654094!2d100.29700814674392!3d13.845158664909833!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x30e292fa4d0848a3%3A0x29764281746f38e2!2s35%2C%20Amphoe%20Phutthamonthon%2C%20Chang%20Wat%20Nakhon%20Pathom%2073170!5e0!3m2!1sen!2sth!4v1700000000000!5m2!1sen!2sth',
  socials: {
    // เพิ่มข้อมูลโซเชียลมีเดียได้ที่นี่
    facebook: '',
    line: '',
    instagram: ''
  }
}

export const quickLinks = [
  { name: 'หน้าแรก', path: '/' },
  { name: 'สินค้าทั้งหมด', path: '/product' },
  { name: 'เกี่ยวกับเรา', path: '/contact' },
  { name: 'ข้อมูลส่วนตัว', path: '/profile' }
]

export const copyright = {
  year: new Date().getFullYear(),
  company: 'NPPS Supply',
  text: 'All rights reserved.'
}
