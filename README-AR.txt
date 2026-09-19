VITAL ID — CINEMATIC 3D WEB ANIMATION
=====================================

دي النسخة الجديدة من الصفر: Three.js + GSAP، مش مجرد PNGs بتتحرك بـ CSS.

الموجود جوه:
- كارت VITAL ID الأسود كـ 3D object بسمك وحواف وإضاءة.
- الوجه + الظهر الحقيقيين للكارت.
- موبايل 3D بخامة معدنية وشاشة Emergency Profile اللي بعتها.
- NFC pulse فعلي داخل مشهد Three.js.
- Camera drift / product-lighting / fog / particles.
- Fan / spiral للكروت مستوحى من الفيديو المرجعي.
- Final hero composition مناسب للموقع.
- Responsive: Desktop + Mobile portrait.
- Static fallback poster لو CDN أو WebGL مش شغال.

تشغيل النسخة:
1) فك الضغط.
2) على Windows شغّل START-VITAL-ID.bat.
   أو من Terminal داخل الفولدر:
       python -m http.server 8080
3) افتح:
       http://localhost:8080

مهم:
Three.js و GSAP بيتحملوا من jsDelivr، لذلك أول تشغيل يحتاج إنترنت.
بعد رفعه للموقع هيشتغل عادي.

Query parameters:
?loop=1          يعيد المشهد (default)
?loop=0          مرة واحدة
?controls=0      يخفي أزرار replay/pause
?autoplay=0      لا يبدأ تلقائيًا
?progress=0.78   يفتح على لقطة معينة من المشهد ويوقفها

أمثلة:
http://localhost:8080/?loop=1&controls=0
http://localhost:8080/?progress=0.52
http://localhost:8080/?progress=0.90

إضافة للموقع:
الأفضل تحط الملفات في /vital-id-3d/ وبعدين:

<iframe
  src="/vital-id-3d/?loop=1&controls=0"
  style="width:100%;height:min(850px,100svh);border:0;display:block;background:#030404"
  loading="eager"
></iframe>

أو تدمج section نفسها في الصفحة لو الموقع Vanilla/React/Vite.

Keyboard:
Space = Pause / Play
R = Replay

الأصول المستخدمة:
- card-front.png
- card-back.png
- emergency-screen.png
- logo-white.png

مدة المشهد ≈ 13.15 ثانية.
