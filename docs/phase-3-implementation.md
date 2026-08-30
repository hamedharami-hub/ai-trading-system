# گزارش پیاده‌سازی فاز تجمیعی ۳ — هوش مصنوعی آفلاین

وضعیت: `READY_FOR_OWNER_REVIEW`؛ گذر کامل gate منوط به build و benchmark روی دستگاه اندرویدی هدف است.

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
- build اندروید: پیکربندی تا مرحله‌ی NDK رسید، اما NDK `29.0.13113456` نصب نیست و پذیرش مجوز Android SDK توسط مالک لازم است. هیچ مجوزی به نمایندگی مالک پذیرفته نشد.

## قابلیت‌های همچنان ممنوع و خاموش

`LIVE_TRADING_ENABLED=false`، `BROKER_CONNECTORS_ENABLED=false`، `AI_ROUTER_ENABLED=false` و `MODEL_DOWNLOADS_ENABLED=false` باقی می‌مانند. هیچ اتصال broker/exchange/market-data/cloud، کلید، حساب، remote AI، paper/demo/testnet یا execution اضافه نشده است.

## ریسک باقیمانده و gate

- build و benchmark روی دستگاه فیزیکی اندروید هنوز شواهد ندارد؛ تفاوت RAM، thermal throttling و ABI می‌تواند قابلیت اجرا را تغییر دهد.
- مدل 0.8B برای آزمون معماری انتخاب شده و کیفیت تصمیم تحلیلی آن تضمین نیست.
- تا تکمیل شواهد اندروید، رفتار امن «عدم تحلیل قابل‌قبول و عدم معامله جدید» است.
- سبزشدن TypeScript و ویندوز به‌تنهایی مجوز شروع فاز ۴ نیست.
