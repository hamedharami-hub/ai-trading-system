# نقشه راه فشرده شش‌مرحله‌ای

## اصل اجرایی

این نقشه با `DEC-069` جایگزین تقسیم‌بندی مدیریتی سیزده‌مرحله‌ای می‌شود، اما هیچ کنترل ایمنی، مدرک آزمون یا Live Gate حذف نمی‌شود. عبور هر مرحله به پذیرش صریح مالک نیاز دارد.

| مرحله                             | دامنه                                                                                                               | خروجی اصلی                                            | قابلیت‌های ممنوع تا پایان مرحله                 |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------- |
| ۱. بازیابی و ممیزی reuse          | جداسازی کد سالم Antigravity، حذف ادعاهای نادرست، تثبیت مرزهای ایمنی                                                 | شاخه پاک، ماتریس REUSE/REWRITE/QUARANTINE و نقشه جدید | همه اتصال‌ها، مدل‌ها، AI calls و execution      |
| ۲. هسته قطعی                      | قراردادها، Decimal/JCS صحیح، validation، replay fixtures، feature/strategy/policy/risk boundaries، ذخیره‌سازی و تست | هسته محلی قابل تکرار، بدون شبکه و بدون سفارش واقعی    | connector، cloud execution، AI authority و live |
| ۳. AI آفلاین چندسکویی             | `llama.cpp`/GGUF روی Windows و Android، نقش‌های Analyst/Critic/Judge/Auditor و benchmark                            | تحلیل آفلاین schema-valid روی داده Mock/Replay        | AI risk/OMS authority، broker و live            |
| ۴. محصول چندسکویی و Cloud Control | UI هم‌ارز Windows/Android، PWA، bridge بومی، Firebase/Vercel، pairing/sync/notification                             | تجربه یکپارچه با cloud control محدود و fail-closed    | cloud risk/execution، broker secret و live      |
| ۵. داده فقط‌خواندنی و Paper/Demo  | feedهای مجاز read-only، backtest/replay، هزینه‌ها، OMS شبیه‌سازی و سپس demo با مجوز جدا                             | شواهد آماری و عملیاتی قابل بازپخش                     | حساب واقعی و live execution                     |
| ۶. سخت‌سازی و Live Gate           | security/chaos/recovery، چهار هفته و ۵۰۰ سیگنال، پذیرش ریسک باقی‌مانده                                              | Live Candidate محدود                                  | Live تا تصمیم جداگانه هر بازار و استراتژی       |

## وضعیت

- مرحله ۱: با `DEC-074` پذیرفته و بسته شده است.
- مرحله ۲: با `DEC-076` پذیرفته و بسته شده است.
- مرحله ۳: با `DEC-079` پذیرفته و بسته شده است؛ benchmark فیزیکی Android ثبت شده است.
- مرحله ۴: با `DEC-083` پذیرفته و بسته شده است. Firebase فقط ورود مالک را انجام می‌دهد؛ `OPEN-021` همچنان pairing/sync/revoke/recovery/cloud lease را مسدود نگه می‌دارد.
- مرحله ۵A: با `DEC-085` پذیرفته و بسته شده است. Replay محلی معتبر/نامعتبر را گزارش می‌کند و هیچ artifact اجرایی نمی‌سازد.
- مرحله ۵B-I: با `DEC-087` پذیرفته و بسته شده است. اعتبارسنجی محلی `MOCK`/`REPLAY` هرگز freshness یا قابلیت اجرا اعلام نمی‌کند.
- مرحله ۵B-II: با `DEC-089` پذیرفته و بسته شده است. گزینه‌ها فقط `PREQUALIFIED_NOT_ACTIVE` هستند و هیچ provider فعال یا اتصالی ساخته نشده است.
- مرحله ۵B-III: با `DEC-091` پذیرفته و بسته شده است. قرارداد provider-specific و deny-list آماده‌اند، اما هیچ اتصال یا credential ندارند.
- مرحله ۵B-IV: با `DEC-093` پذیرفته و بسته شده است. fixtureهای snapshot/gap/reconnect فقط آفلاین و همیشه execution-ineligible هستند.
- مرحله فعال: ۵B-V با `DEC-094` آغاز شده است؛ فقط مرز adapter غیرفعال و deny-by-default، بدون اتصال یا credential.
- مرحله ۶: شروع نشده و به پذیرش صریح مرحلهٔ ۵ نیاز دارد.
- Firebase و Vercel برای مرحله ۴ تأیید شده‌اند، نه برای اختیار ریسک یا اجرا.
- AI آفلاین Windows و Android برای مرحله ۳ تأیید شده است؛ دانلود مدل در مرحله ۱ انجام نمی‌شود.
- Live Trading همچنان خاموش و نیازمند تصمیم مستقل آینده است.
