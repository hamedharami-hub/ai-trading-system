# نقشه راه فشرده شش‌مرحله‌ای

## اصل اجرایی

این نقشه با `DEC-069` جایگزین تقسیم‌بندی مدیریتی سیزده‌مرحله‌ای می‌شود، اما هیچ کنترل ایمنی، مدرک آزمون یا Live Gate حذف نمی‌شود. عبور هر مرحله به پذیرش صریح مالک نیاز دارد.

| مرحله | دامنه | خروجی اصلی | قابلیت‌های ممنوع تا پایان مرحله |
| --- | --- | --- | --- |
| ۱. بازیابی و ممیزی reuse | جداسازی کد سالم Antigravity، حذف ادعاهای نادرست، تثبیت مرزهای ایمنی | شاخه پاک، ماتریس REUSE/REWRITE/QUARANTINE و نقشه جدید | همه اتصال‌ها، مدل‌ها، AI calls و execution |
| ۲. هسته قطعی | قراردادها، Decimal/JCS صحیح، validation، replay fixtures، feature/strategy/policy/risk boundaries، ذخیره‌سازی و تست | هسته محلی قابل تکرار، بدون شبکه و بدون سفارش واقعی | connector، cloud execution، AI authority و live |
| ۳. AI آفلاین چندسکویی | `llama.cpp`/GGUF روی Windows و Android، نقش‌های Analyst/Critic/Judge/Auditor و benchmark | تحلیل آفلاین schema-valid روی داده Mock/Replay | AI risk/OMS authority، broker و live |
| ۴. محصول چندسکویی و Cloud Control | UI هم‌ارز Windows/Android، PWA، bridge بومی، Firebase/Vercel، pairing/sync/notification | تجربه یکپارچه با cloud control محدود و fail-closed | cloud risk/execution، broker secret و live |
| ۵. داده فقط‌خواندنی و Paper/Demo | feedهای مجاز read-only، backtest/replay، هزینه‌ها، OMS شبیه‌سازی و سپس demo با مجوز جدا | شواهد آماری و عملیاتی قابل بازپخش | حساب واقعی و live execution |
| ۶. سخت‌سازی و Live Gate | security/chaos/recovery، چهار هفته و ۵۰۰ سیگنال، پذیرش ریسک باقی‌مانده | Live Candidate محدود | Live تا تصمیم جداگانه هر بازار و استراتژی |

## وضعیت

- مرحله ۱: با `DEC-074` پذیرفته و بسته شده است.
- مرحله فعال: مرحله ۲، هسته قطعی، با `DEC-075` مجاز شده است.
- مراحل ۳ تا ۶: شروع نشده
- Firebase و Vercel برای مرحله ۴ تأیید شده‌اند، نه برای اختیار ریسک یا اجرا.
- AI آفلاین Windows و Android برای مرحله ۳ تأیید شده است؛ دانلود مدل در مرحله ۱ انجام نمی‌شود.
- Live Trading همچنان خاموش و نیازمند تصمیم مستقل آینده است.
