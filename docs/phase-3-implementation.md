# گزارش پیاده‌سازی فاز تجمیعی ۳ — هوش مصنوعی آفلاین

وضعیت: `READY_FOR_OWNER_REVIEW`؛ شواهد benchmark دستگاه اندرویدی هدف ثبت شده است، اما پذیرش صریح مالک برای عبور از gate فاز ۳ همچنان لازم است.

## محدوده انجام‌شده

- منبع `llama.cpp` نسخه `v0.3.0` در commit ثابت `c1d0e7a004015f23bc0233470b747b596f29b264` به‌صورت submodule ثبت شد.
- runtime ویندوز `b10621` و مدل آزمایشی `Qwen3.5-0.8B-Q4_0.gguf` فقط توسط اسکریپت نصب صریح، با اندازه و SHA-256 ثابت دریافت می‌شوند؛ artifactها در Git ثبت نمی‌شوند.
- adapter ویندوز فقط local process، بدون shell و با prompt، token، output و timeout محدود است. مدل پیش از load با SHA-256 بررسی می‌شود.
- پل native اندروید از binding رسمی `llama.android` استفاده می‌کند و مدل را فقط از app-private storage، پس از اندازه/SHA-256 و gate حافظه/حرارت load می‌کند.
- نقش‌های Analyst، Critic، Judge مشروط و Post-Trade Auditor با خروجی محدود پیاده شدند. Auditor فقط گزارش/مقایسه می‌کند.
- Judge فقط `APPROVE`، `REJECT` یا `REANALYZE` می‌دهد و reanalysis دوم ممنوع است.
- خروجی AI در مرز قرارداد با AJV بررسی می‌شود؛ timeout، خرابی process، JSON نامعتبر، schema نامعتبر یا evidence خارج از allowlist همگی fail-closed هستند.
- event جدید `POST_TRADE_AUDIT_REPORT` فقط داده‌ی read-only گزارش را می‌پذیرد و فیلد تغییر policy/risk را رد می‌کند.

## پروفایل artifact قفل‌شده

| Artifact | نسخه/commit | اندازه | SHA-256 |
|---|---:|---:|---|
| llama.cpp Windows CPU ZIP | `b10621` | `18,068,018` | `0e8b65e650e369f70f8307d890508886f171ef4fb00facccddd4a1b7ffdaca51` |
| Qwen3.5 0.8B Q4_0 GGUF | `8fea620810c4afa23dd6443f999a48574c1611a3` | `563,036,064` | `57d1997790d1744fba5b40a7317df71ea5e2acee28c47e78f0cce39c0703f8cf` |

این مدل صرفاً پروفایل آزمون معماری است و کیفیت تحلیلی یا مناسب‌بودن آن برای محصول تأیید نشده است.

## شواهد verification

- `pnpm typecheck`: موفق.
- `pnpm test`: موفق؛ ۳۷ آزمون (۱۶ قرارداد، ۱۵ هسته قطعی و ۶ هوش مصنوعی آفلاین).
- `pnpm lint`: موفق.
- `pnpm build`: موفق.
- نصب runtime/model ویندوز: موفق؛ اندازه و SHA-256 هر دو artifact تأیید شد.
- inference واقعی adapter روی CPU ویندوز: موفق؛ خروجی JSON با `REJECT` در `4,147 ms` تولید و توسط adapter parse شد.
- grammar توکنی `--json-schema` در `llama.cpp b10621` با chat-template مدل Qwen در شروع assistant ناسازگار بود. adapter از دستور صریح JSON استفاده می‌کند و خروجی را در مرز قرارداد به‌طور سخت اعتبارسنجی می‌کند؛ خروجی نامعتبر قابل مصرف نیست.
- build اندروید: با اجازه صریح مالک، مجوزهای Android SDK پذیرفته و NDK `29.0.13113456`، CMake `3.31.6` و Microsoft OpenJDK `17.0.20.1` استفاده شدند. `:llamaAndroid:assembleDebug` و `:bridge:assembleDebug` در `12m 41s` موفق شدند.
- `llamaAndroid-debug.aar`: اندازه `18,100,695` بایت، SHA-256 برابر `23d7a8ee98a220b52129c90c2f9941548e1457276c7212e94732b5d1e51bfef1` و شامل کتابخانه‌های native برای `arm64-v8a` و `x86_64` است.
- `bridge-debug.aar`: اندازه `14,809` بایت و SHA-256 برابر `2dc2d3cda22060767f671ed4402b280ca049713aa2137c801ce5c70dbd1fecec` است؛ وابستگی native از پروژه `llamaAndroid` به‌صورت `api` منتقل می‌شود.
- به‌دلیل محدودیت مسیر ۲۶۰ کاراکتری Ninja در ویندوز، اسکریپت build برای workspaceهای طولانی junction کوتاه موقت می‌سازد، مقصد را قبل از حذف کنترل می‌کند و آن را پس از build پاک می‌کند.
- build نهایی Android شامل `:llamaAndroid:assembleDebug`، `:bridge:assembleDebug` و `:benchmark:assembleDebug` موفق شد (`105` task؛ بدون dependency یا artifact جدیدِ ثبت‌شده در Git).
- benchmark فیزیکی Android روی `Pixel 9 Pro Fold` با Android `17` و ABI `arm64-v8a` انجام شد. مدل در مسیر app-private قرار گرفت، اندازه و SHA-256 آن روی خود دستگاه با پروفایل قفل‌شده برابر بود و فایل انتقال موقت پس از تأیید حذف شد.
- اجرای کاملاً محلی Android: خروجی schema-valid برابر `{"decision":"REJECT","reason":"no deterministic evidence"}` و زمان `35,618 ms` بود. وضعیت حرارتی پیش و پس از اجرا `0` (عادی) بود. هیچ منبع داده، اتصال شبکه، حساب یا مسیر execution در benchmark وجود نداشت.
- نخستین اجرای دستگاه نشان داد runtime برای یافتن backendهای native به libraryهای استخراج‌شده نیاز دارد؛ بسته‌بندی benchmark اکنون `jniLibs.useLegacyPackaging = true` دارد. نخستین پاسخ ۶۴-token نیز JSON تولید نکرد و به‌درستی fail-closed شد؛ آزمون نهایی با خروجی محدود `256` token و schema validation سخت موفق شد.

## قابلیت‌های همچنان ممنوع و خاموش

`LIVE_TRADING_ENABLED=false`، `BROKER_CONNECTORS_ENABLED=false`، `AI_ROUTER_ENABLED=false` و `MODEL_DOWNLOADS_ENABLED=false` باقی می‌مانند. هیچ اتصال broker/exchange/market-data/cloud، کلید، حساب، remote AI، paper/demo/testnet یا execution اضافه نشده است.

## ریسک باقیمانده و gate

- این benchmark فقط یک دستگاه با یک model profile را پوشش می‌دهد؛ تفاوت RAM، thermal throttling، ABI و نسخه Android در دستگاه‌های دیگر همچنان باید جداگانه benchmark شود.
- مدل 0.8B برای آزمون معماری انتخاب شده و کیفیت تصمیم تحلیلی آن تضمین نیست.
- با وجود موفقیت benchmark، کیفیت تحلیلی/تجاری مدل اثبات نشده است و رفتار امن هر خطای AI همچنان «عدم تحلیل قابل‌قبول و عدم معامله جدید» است.
- سبزشدن TypeScript، ویندوز یا Android به‌تنهایی مجوز شروع فاز ۴ نیست؛ پذیرش صریح فاز ۳ و declaration جداگانهٔ فاز ۴ لازم است.
