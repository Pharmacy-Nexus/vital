VITAL ID — Web Product Animation
================================

دي نسخة Animation بالكود بالكامل، من غير مكتبات خارجية ومن غير موسيقى.
بتستخدم صور الكارت الأسود + اللوجو + Emergency Profile اللي اتبعتوا في الشات.

الملفات:
- index.html
- styles.css
- animation.js
- assets/
  - card-front.png
  - card-back.png
  - emergency-screen.png
  - logo-black.png
  - logo-white.png

تشغيل سريع:
1) فك الـ ZIP.
2) افتح index.html في متصفح حديث.
3) الأفضل تشغيله من local server أثناء التطوير:
   python -m http.server 8080
   وبعدها افتح http://localhost:8080

إضافته للموقع:
أسهل طريقة:
<iframe
  src="/vital-id-animation/index.html?format=auto&controls=0"
  style="width:100%;height:100vh;border:0;display:block"
  loading="eager"
  allow="autoplay">
</iframe>

اختيارات الرابط:
- format=auto       مناسب كـ hero section على الموقع
- format=landscape  مقاس 16:9
- format=portrait   مقاس 9:16 للـ Reels / TikTok / Story
- format=square     مقاس 1:1
- loop=1            إعادة تلقائية
- controls=0        إخفاء زر Replay
- autoplay=0        إيقاف التشغيل التلقائي
- speed=1.2         أسرع شوية
- speed=0.8         أبطأ شوية

أمثلة:
index.html?format=landscape&controls=0
index.html?format=portrait&loop=1&controls=0
index.html?format=square&controls=0

التحكم:
- Space = Pause / Resume
- R = Replay
- Double click = Replay

للتصدير كفيديو:
افتح نسخة 16:9 أو 9:16 في المتصفح Full Screen وسجّلها من OBS أو أي Screen Recorder.
مدة الأنيميشن الأساسية حوالي 13 ثانية.

ملاحظات:
- كل الحركة Native Web Animations API، يعني مفيش CDN ولا Three.js ولا GSAP.
- التصميم Responsive.
- لو الجهاز مفعل Reduce Motion، الصفحة تعرض الحالة النهائية بدل الحركة.
