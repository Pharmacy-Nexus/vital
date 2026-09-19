VITAL ID — ULTRA CINEMATIC
===========================

دي النسخة القوية الجديدة من الصفر.

الفرق عن النسخ القديمة:
- تصميم الكارت الأسود الحقيقي اللي بعته ظاهر كـ texture واضحة، مش مجرد جسم أسود.
- الكارت له جسم 3D بسمك وحواف وانعكاس Light Sweep.
- الموبايل له ظهر + Camera bump + NFC target.
- الكارت يقف BESIDE / IN FRONT OF الموبايل عند الـ NFC؛ لا يدخل داخل جسم الموبايل.
- NFC impact فيه: 5 rings + energy beam + bloom + flash + RGB split + camera punch.
- Card clone burst + product wall / orbit sequence زي إعلانات TikTok.
- Post-processing بـ UnrealBloomPass + cinematic RGB/vignette shader.
- Emergency Profile الحقيقي يظهر على الشاشة.
- UI callouts على Penicillin / O+ / Type 1 Diabetes + Asthma.
- Final Hero shot جاهز للموقع.
- Responsive للموبايل والـ Desktop.
- بدون موسيقى.

تشغيل محلي:
1. فك الضغط.
2. شغّل سيرفر محلي داخل الفولدر:
   python -m http.server 8080
3. افتح:
   http://localhost:8080

رفع على Vercel:
- Framework Preset = Other
- Build Command = فارغ
- Output Directory = فارغ
- Root Directory = الفولدر اللي فيه index.html
- ارفع الملفات كما هي.

Query options:
?loop=1        تشغيل Loop (default)
?loop=0        مرة واحدة
?controls=0    إخفاء أزرار Replay / Pause
?autoplay=0    عدم البدء تلقائيًا

للموقع:
<iframe
  src="/vital-id-ultra/?loop=1&controls=0"
  style="width:100%;height:min(900px,100svh);border:0;display:block;background:#030404"
></iframe>

ملاحظة:
Three.js و GSAP و Postprocessing يتحملوا من jsDelivr عند التشغيل.
لو الإنترنت غير متاح، الصفحة تعرض Poster fallback بدل شاشة فاضية.

التحكم:
Space = Pause / Play
R = Replay
