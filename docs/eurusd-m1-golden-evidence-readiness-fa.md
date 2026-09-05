# آمادگی evidence Golden برای EURUSD / M1 / REPLAY

این evaluator فقط سه بررسی محلی را در یک خروجی immutable جمع می‌کند: پذیرش manifest، اتصال مجموعه‌برچسب opaque به cursorها، و تطبیق هش موردانتظار.

`GOLDEN_EVIDENCE_READY` تنها به معنی سازگاری داخلی همین evidence است؛ به معنی کیفیت داده، صحت معنای برچسب، صلاحیت استراتژی، Paper/Demo یا اجرای معامله نیست. هر نقص به `GOLDEN_EVIDENCE_REJECTED` ختم می‌شود و تمام خروجی‌ها execution-ineligible می‌مانند.

با `DEC-257` فقط نتیجهٔ immutable با وضعیت `GOLDEN_EVIDENCE_READY` می‌تواند با JCS و SHA-256 به digest ممیزی محلی تبدیل شود. نتیجهٔ `GOLDEN_EVIDENCE_REJECTED` fail-closed است و digest ندارد. این digest داده یا label را ذخیره، منتقل، تفسیر یا تغییر نمی‌دهد و هیچ candidate، Paper/Demo artifact، OrderIntent، درخواست خارجی یا قابلیت اجرا نمی‌سازد.

با `DEC-258` فقط همین digest readiness دوباره محاسبه و با SHA-256 موردانتظار caller مقایسه می‌شود. وضعیت‌ها فقط `MATCH`، `MISMATCH`، `INVALID_EXPECTED_DIGEST` یا برای readiness ردشده `DIGEST_UNAVAILABLE` هستند. این تطبیق کیفیت یا معنای داده و label را تأیید نمی‌کند و هیچ قابلیت اجرایی ندارد.
