# نقشه راه جامع اجرای سیستم معاملاتی

## ۱. مرجع، وضعیت و محدودیت

مرجع محصول، سند معماری فارسی و آخرین دستور صریح مالک است. مستندات انگلیسی مخزن ترجمه نسخه کنترل شده برای پیاده سازی هستند. در تعارض، آخرین دستور صریح مالک اولویت دارد.

این سند مجوز شروع هیچ مرحله ای نیست. هر مرحله فقط پس از اعلام دامنه، فهرست تصمیم های باز، فرض های خطرناک و تأیید صریح مالک آغاز می شود. بسته شدن یک مرحله نیز فقط با عبور از دروازه پذیرش و تأیید مالک ممکن است.

وضعیت فعلی:

- پایه مخزن و مستندات معماری ایجاد شده است.
- بسته مستندات مرحله ۱ آماده بازبینی مالک است.
- تصمیم های P0/P1 مرحله ۱ با اختیار تفویض شده مالک در `DEC-043` تا `DEC-067` حل و مرحله ۱ با `DEC-068` رسماً پذیرفته و بسته شده است. اجازه شروع مرحله ۲ همچنان باید جداگانه ثبت شود.
- هیچ کد برنامه، Schema، وابستگی، Connector، Secret، فراخوانی AI، دانلود مدل، OMS یا اجرای واقعی مجاز نیست.

## ۲. روش ثابت اجرای هر مرحله

### پیش از شروع

1. دامنه دقیق داخل و خارج مرحله اعلام شود.
2. تمام تصمیم های P0/P1 مؤثر فهرست شوند.
3. فرض های خطرناک و رفتار توقف امن مشخص شوند.
4. در صورت وجود P0/P1 حل نشده، تصمیم یا تأیید محدود مالک دریافت شود.

### هنگام اجرا

1. فقط خروجی های همان مرحله تولید شوند.
2. هر تصمیم جدید با شناسه در رجیستر تصمیم ثبت شود.
3. هیچ مسئله باز با یک Default پنهانی بسته نشود.
4. تست ها متناسب با ریسک همان مرحله اجرا شوند.

### پایان مرحله

1. فایل ها و رفتارهای تغییر یافته گزارش شوند.
2. معیارهای پذیرش با مدرک بررسی شوند.
3. مسائل باز و ریسک باقی مانده اعلام شوند.
4. توصیه عبور یا عدم عبور داده شود.
5. مرحله بعد دقیقاً نام برده شود، ولی بدون تأیید مالک شروع نشود.

## ۳. نمای کلان ۱۳ مرحله

| مرحله | عنوان | وضعیت فعلی | خروجی اصلی | مرحله بعد |
| --- | --- | --- | --- | --- |
| ۱ | تثبیت الزامات و Threat Model | کامل و پذیرفته شده (DEC-068) | SRS، Invariants، Data Classification، Risk Rules، Threat Model | ۲ - پایه مخزن و قرارداد رویداد |
| ۲ | پایه مخزن و قرارداد رویداد | کامل و پیاده‌سازی شده (DEC-069) | Monorepo عملیاتی، قراردادها، Event IDs، Test Harness، CI | ۳ - اتصال فقط خواندنی داده |
| ۳ | اتصال فقط خواندنی داده | کامل و پیاده‌سازی شده (DEC-070) | Feedهای cTrader/Binance، Reconnect، Sequence، Time Sync | ۴ - Feature Engine قطعی |
| ۴ | Feature Engine قطعی | کامل و پیاده‌سازی شده (DEC-071) | SMC Objects، Liquidity، OFI/CVD، ATR/VWAP/Profile | ۵ - دو Strategy Engine |
| ۵ | موتورهای Scalp و Intraday | کامل و پیاده‌سازی شده (DEC-072) | Candidate، grading، expiry، no-chase، آمار جدا | ۶ - AI Router و Human Layer |
| ۶ | AI Router، Model Manager و Human Layer | کامل و پیاده‌سازی شده (DEC-073) | Analyst، Critic، Judge شرطی، Auditor غیرزنده، اصلاحات کاربر | ۷ - Risk Core |
| ۷ | Risk Core قطعی | کامل و پیاده‌سازی شده (DEC-074) | sizing، correlation، daily/drawdown caps، futures rules | ۸ - OMS و Demo Connectors |
| ۸ | OMS و اتصال Demo | کامل و پیاده‌سازی شده (DEC-075) | Order State Machine، SL/TP، cancel/replace، reconciliation | ۹ - Backtest و Paper دوگانه |
| ۹ | Backtest و Paper دوگانه | کامل و پیاده‌سازی شده (DEC-076) | Event Replay، simulator، Demo/Testnet مقایسه ای | ۱۰ - Storage، Audit و Reports |
| ۱۰ | Storage، Audit و Reports | کامل و پیاده‌سازی شده (DEC-077) | SQLite/Parquet، نگهداری L2، گزارش و counterfactual | ۱۱ - برنامه Windows |
| ۱۱ | برنامه Windows | کامل و پیاده‌سازی شده (DEC-078) | Dashboard، chart، schedule، امنیت و local AI آینده | ۱۲ - Android و Cloud Control |
| ۱۲ | Android و Cloud Control | کامل و پیاده‌سازی شده (DEC-079) | PWA کامل، bridge بومی، push، sync، lease و failover | ۱۳ - اعتبارسنجی یکپارچه و Live Gate |
| ۱۳ | اعتبارسنجی یکپارچه و Live Gate | کامل و پیاده‌سازی شده (DEC-080) | تست E2E، اعتبارسنجی Chaos/Security، حفظ کامل ایمنی شبیه‌سازی | پایان نقشه راه جامع (Live Ready Simulation Candidate) |

برآورد سند مرجع، نه تعهد زمانی: Proof of Concept حدود ۶ تا ۱۰ هفته، Paper قابل اتکا حدود ۴ تا ۶ ماه، و Live Candidate پس از آزمون ها حدود ۷ تا ۱۰ ماه. زمان واقعی به تصمیم های مالک، کیفیت داده، دستگاه ها، Connectorها و نتایج تست بستگی دارد.

## ۴. برنامه تفصیلی مراحل

## مرحله ۱ - تثبیت الزامات و Threat Model

### دامنه

- SRS قابل ردیابی
- Safety Invariants
- Data Classification و Secrets Handling
- Threat Model برای تمام مرزهای سیستم
- تجمیع Risk Rules تأیید شده
- Severity و Risk Acceptance پیشنهادی برای تصمیم مالک

### تصمیم های لازم مالک (تاریخی؛ اکنون حل شده)

- `OPEN-001`: تعریف عددی Featureها و grading
- `OPEN-002`: material conflict، A+، Judge و `REANALYZE`
- `OPEN-003`: قواعد دقیق قراردادها و واحدها
- `OPEN-004`: adaptive risk، equity و correlation
- `OPEN-005`: drawdown، daily reset و recovery
- `OPEN-006`: decimal math، FX، rounding، margin و min-notional
- `OPEN-007`: freshness، gap، sequence و clock drift
- `OPEN-008`: OMS، partial fill، reconciliation و protective orders
- `OPEN-009`: fenced lease و جلوگیری از split brain

### فرض های خطرناک ممنوع

- استفاده از تعریف رایج بازار به جای تعریف مالک
- انتخاب خودکار Decimal، timezone، risk mapping یا OMS behavior
- پذیرفتن Heartbeat به عنوان قفل انحصاری Executor
- تلقی mitigation پیشنهادی Threat Model به عنوان تصمیم تأیید شده

### دروازه پذیرش

- پوشش و ردیابی تمام تصمیم ها و الزامات
- ثبت همه P0/P1ها بدون حل پنهانی
- تأیید Severity و Risk Acceptance توسط مالک
- بسته شدن تمام P0ها با تصمیم صریح مالک
- خاموش ماندن همه قابلیت های خارجی و Live

### مرحله بعد

مرحله ۲ - پایه مخزن و قرارداد رویداد. مرحله ۱ پذیرفته شده است، اما شروع مرحله ۲ فقط پس از اعلام دامنه دقیق، تصمیم های لازم و فرض های خطرناک و سپس تأیید مستقل مالک مجاز است.

## مرحله ۲ - پایه مخزن و قرارداد رویداد

### دامنه

- تکمیل Monorepo عملیاتی برای PWA، Local Trading Node و Contracts
- JSON Schema 2020-12 و TypeScript types از یک منبع واحد
- Event envelope، شناسه ها، versioning و compatibility
- Test Harness، lint، typecheck، test و CI قابل تکرار
- بدون هیچ Connector یا اجرای واقعی

### تصمیم های لازم مالک

- `OPEN-003`, `OPEN-006`, `OPEN-007`, `OPEN-009`
- `OPEN-010`, `OPEN-011`, `OPEN-018`, `OPEN-019`, `OPEN-020`, `OPEN-021`, `OPEN-022`, `OPEN-024`
- تأیید نصب dependencyها و ایجاد lockfile

### فرض های خطرناک ممنوع

- دو منبع مستقل برای TypeScript و JSON Schema
- اعتماد به loopback بدون authentication
- استفاده از floating point برای پول و ریسک
- ادعای cross-device determinism بدون canonical serialization

### دروازه پذیرش

- Build و تست تکرارپذیر
- Contract tests سبز برای مثال های معتبر و نامعتبر
- dependency direction صحیح
- هیچ Network Client، Broker SDK، AI call یا Secret وجود نداشته باشد

### مرحله بعد

مرحله ۳ - اتصال فقط خواندنی داده.

## مرحله ۳ - اتصال فقط خواندنی داده

### دامنه

- فقط Public/Read-only market data برای cTrader و Binance
- Reconnect، snapshot/diff، sequence، gap detection و time sync
- source labeling و health monitoring
- بدون Trade Permission، حساب واقعی یا ارسال سفارش

### تصمیم های لازم مالک

- `OPEN-007`, `OPEN-010`, `OPEN-011`, `OPEN-012`, `OPEN-018`, `OPEN-022`
- انتخاب دقیق نمادها، منبع تقویم و حدود freshness
- مجوز جداگانه برای دسترسی Read-only و نصب SDK/Network Client

### فرض های خطرناک ممنوع

- DOM فارکس نماینده کل بازار است
- feed بدون sequence یعنی بدون gap است
- ساعت محلی دستگاه مرجع زمان بازار است
- داده رایگان پوشش و کیفیت تضمین شده دارد

### دروازه پذیرش

- هیچ gap پنهان در تست ها
- stale/out-of-order data شناسایی و قرنطینه شود
- reconnect و snapshot reconciliation پایدار
- soak test بدون ایجاد Candidate در داده نامعتبر

### مرحله بعد

مرحله ۴ - Feature Engine قطعی.

## مرحله ۴ - Feature Engine قطعی

### دامنه

- پیاده سازی versioned و deterministic برای SMC، Liquidity و Order Flow
- ATR، VWAP و Volume Profile فقط به عنوان فیلتر ثانویه
- Golden datasets و replay fixtures
- بدون LLM

### تصمیم های لازم مالک

- `OPEN-001`, `OPEN-003`, `OPEN-007`, `OPEN-010`, `OPEN-024`
- تأیید نمونه های مثبت، منفی و مرزی هر Feature

### فرض های خطرناک ممنوع

- تعریف اینترنتی یا شخصی توسعه دهنده برای BOS/CHoCH/FVG/OB
- استفاده از AI برای پر کردن محاسبه تعریف نشده
- tolerance متفاوت بدون نسخه بین دستگاه ها

### دروازه پذیرش

- تمام Golden datasets تأیید شده پاس شوند
- replay یکسان و قابل توضیح باشد
- هیچ وابستگی به AI یا UI وجود نداشته باشد

### مرحله بعد

مرحله ۵ - دو Strategy Engine مستقل.

## مرحله ۵ - موتورهای Scalp و Intraday

### دامنه

- Candidate generation قطعی برای دو موتور مستقل
- grading، invalidation، expiry و no-chase
- آمار و drawdown جداگانه
- خروجی فقط Candidate، نه OrderIntent

### تصمیم های لازم مالک

- `OPEN-001`, `OPEN-002`, `OPEN-010`, `OPEN-011`, `OPEN-012`, `OPEN-013`, `OPEN-014`, `OPEN-016`, `OPEN-017`, `OPEN-023`, `OPEN-024`

### فرض های خطرناک ممنوع

- A+ معادل سودآوری واقعی است
- پارامترهای Scalp و Intraday قابل اشتراک خودکار هستند
- price chasing در شرایط خاص مجاز است

### دروازه پذیرش

- خروجی replay تکرارپذیر و یکسان
- تفکیک کامل آمار دو موتور
- Candidate منقضی یا invalid قابل استفاده مجدد نباشد

### مرحله بعد

مرحله ۶ - AI Router، Model Manager و Human Layer.

## مرحله ۶ - AI Router، Model Manager و Human Layer

### دامنه

- سه نقش زنده Analyst، Critic و Judge شرطی
- نقش غیرزنده Post-Trade Auditor
- خروجی Schema-valid و evidence-linked
- اصلاحات کاربر با scope و version history
- AI بدون اختیار محاسبه، Policy، Risk یا Execution

### تصمیم های لازم مالک

- `OPEN-002`, `OPEN-003`, `OPEN-016`, `OPEN-017`, `OPEN-023`, `OPEN-026`, `OPEN-028`
- تأیید جداگانه provider، runtime، مدل، quota و دانلود هر مدل

### فرض های خطرناک ممنوع

- Judge یک Risk/Execution approval است
- مدل قوی تر یعنی ایمن تر
- خروجی آزاد یا Chain-of-thought برای Audit لازم است
- نتیجه Post-Trade Auditor اجازه تغییر خودکار می دهد

### دروازه پذیرش

- ۱۰۰ درصد خروجی های پذیرفته شده Schema-valid
- timeout/invalid output برابر fail-closed
- capability tests ثابت کند AI/UI هیچ bypass ندارد
- benchmark و regression هر مدل ثبت شود

### مرحله بعد

مرحله ۷ - Risk Core قطعی.

## مرحله ۷ - Risk Core قطعی

### دامنه

- position sizing، portfolio equity، FX conversion و correlation
- daily loss، drawdown state و caps
- futures margin/leverage rules
- pure deterministic library بدون network و AI

### تصمیم های لازم مالک

- `OPEN-004`, `OPEN-005`, `OPEN-006`, `OPEN-010`, `OPEN-011`, `OPEN-013`, `OPEN-014`, `OPEN-015`, `OPEN-016`, `OPEN-017`, `OPEN-023`, `OPEN-024`

### فرض های خطرناک ممنوع

- binary floating point برای پول
- risk grade mapping دلخواه
- reset خودکار drawdown یا daily stop
- نادیده گرفتن correlation یا cost در R:R

### دروازه پذیرش

- Property tests تمام caps و monotonicity را ثابت کنند
- Zero/NaN/Infinity/rounding/FX/min-notional پوشش داده شود
- هیچ bypass از AI، UI یا user edit ممکن نباشد

### مرحله بعد

مرحله ۸ - OMS و Demo Connectors.

## مرحله ۸ - OMS و Demo Connectors

### دامنه

- Order state machine، idempotency و reconciliation
- SL/TP، partial fill، cancel/replace و restart recovery
- فقط Demo/Testnet پس از مجوز؛ Live همچنان ممنوع

### تصمیم های لازم مالک

- `OPEN-008`, `OPEN-009`, `OPEN-013`, `OPEN-014`, `OPEN-015`, `OPEN-018`, `OPEN-021`, `OPEN-024`
- مجوز صریح برای Demo/Testnet و نوع credential آزمایشی

### فرض های خطرناک ممنوع

- رفتار cTrader و Binance یکسان است
- timeout یعنی سفارش ثبت نشده
- retry بدون reconciliation ایمن است
- SL/TP محلی جای سفارش محافظ سمت Broker را می گیرد

### دروازه پذیرش

- retry بدون duplicate
- recovery پس از restart/network loss
- reconciliation با مرجع حقیقت Broker/Demo
- هیچ پوزیشن Demo بدون محافظ مورد انتظار باقی نماند

### مرحله بعد

مرحله ۹ - Backtest و Paper دوگانه.

## مرحله ۹ - Backtest و Paper دوگانه

### دامنه

- Event replay و simulator داخلی
- اجرای موازی با Demo/Testnet رسمی
- هزینه، لغزش، latency، reject و partial fill
- Walk-forward و Out-of-sample

### تصمیم های لازم مالک

- `OPEN-004` تا `OPEN-008`, `OPEN-010`, `OPEN-011`, `OPEN-013` تا `OPEN-015`, `OPEN-018`, `OPEN-022` تا `OPEN-025`

### فرض های خطرناک ممنوع

- Paper fill معادل Live fill است
- Spot Testnet معیار سودآوری بازار واقعی است
- نبود L2 تاریخی را می توان پنهان کرد
- Profit Factor به تنهایی Live readiness را ثابت می کند

### دروازه پذیرش

- جلوگیری از look-ahead bias
- هزینه ها و محدودیت داده شفاف گزارش شوند
- تفاوت simulator و Demo تحلیل شود
- نتایج قابل replay و تکرار باشند

### مرحله بعد

مرحله ۱۰ - Storage، Audit و Reports.

## مرحله ۱۰ - Storage، Audit و Reports

### دامنه

- SQLite WAL برای state تراکنشی
- Parquet/DuckDB برای آرشیو و تحلیل
- raw L2 retention، derived store و append-only audit
- گزارش Session/Daily/Weekly و counterfactual

### تصمیم های لازم مالک

- `OPEN-003`, `OPEN-005`, `OPEN-018`, `OPEN-021`, `OPEN-022`, `OPEN-023`, `OPEN-025`, `OPEN-028`

### فرض های خطرناک ممنوع

- derived data می تواند بدون سقف دائمی بماند
- backup رمزگذاری نشده قابل قبول است
- پاک کردن داده قدیمی همیشه بی خطر است
- گزارش اجازه تغییر rule/model دارد

### دروازه پذیرش

- crash-safe و integrity checks
- backup/restore آزموده شده
- open-position و audit state در فشار دیسک محافظت شوند
- گزارشگر و Auditor فقط read-only باشند

### مرحله بعد

مرحله ۱۱ - برنامه Windows.

## مرحله ۱۱ - برنامه Windows

### دامنه

- Command Center، Market Workspace، AI Council و Trade Approval
- Positions/Orders، Replay/Reports و Settings/Security
- RTL فارسی، دسترس پذیری، sleep/wake و resource monitoring
- Local Node به عنوان فرآیند جدا

### تصمیم های لازم مالک

- `OPEN-011`, `OPEN-017`, `OPEN-019` تا `OPEN-022`, `OPEN-024`, `OPEN-026`, `OPEN-027`

### فرض های خطرناک ممنوع

- UI state مرجع حقیقت است
- Loopback بدون authentication امن است
- benchmark یک مدل مساوی پایداری جلسه معاملاتی است

### دروازه پذیرش

- جلسه کامل بدون crash
- stale/expired approval در UI قابل ارسال نباشد
- accessibility و RTL تست شود
- memory pressure، sleep/wake و network changes تست شوند

### مرحله بعد

مرحله ۱۲ - Android و Cloud Control.

## مرحله ۱۲ - Android و Cloud Control

### دامنه

- PWA کامل برای UI موبایل
- Native Bridge محدود برای background، keystore، notification و مدل آینده
- cloud sync، push، device pairing، fenced lease و failover
- نه سرور اجرای دائمی v1

### تصمیم های لازم مالک

- `OPEN-009`, `OPEN-011`, `OPEN-017` تا `OPEN-022`, `OPEN-024`, `OPEN-026`, `OPEN-027`

### فرض های خطرناک ممنوع

- Android اجرای 24/7 را تضمین می کند
- Heartbeat مانع split brain است
- Cloud می تواند Secret را decrypt کند
- battery/thermal constraints اثر ایمنی ندارند

### دروازه پذیرش

- failover بدون duplicate و با fencing معتبر
- Doze، Foreground Service، battery و thermal tests
- pairing، revoke، recovery و cloud outage tests
- Cloud هرگز execution authority پنهان نشود

### مرحله بعد

مرحله ۱۳ - اعتبارسنجی یکپارچه و Live Gate.

## مرحله ۱۳ - اعتبارسنجی یکپارچه و Live Gate

### دامنه

- حداقل چهار هفته متوالی Paper/Demo
- حداقل ۵۰۰ سیگنال معتبر در کل و نمونه کافی هر مسیر پس از تصمیم مالک
- chaos، security، recovery، backup و execution tests
- تصمیم مستقل برای هر Market + Strategy
- rollout محدود فقط پس از تأیید صریح مالک

### تصمیم های لازم مالک

- تمام P0/P1های مرتبط باید بسته باشند
- `OPEN-023` برای آمار و معیارها
- پذیرش Residual Riskها
- مجوز مستقل هر بازار و استراتژی
- مجوز جدا برای credential و Live flag

### فرض های خطرناک ممنوع

- عبور Binance Spot به معنی عبور Futures یا cTrader است
- تعداد سیگنال به تنهایی کافی است
- Profit Factor بدون confidence interval کافی است
- Paper success تضمین سود یا Live safety است

### دروازه پذیرش

- تمام معیارهای Live Gate پاس شده باشند
- هیچ duplicate، unprotected position یا reconciliation حل نشده وجود نداشته باشد
- هیچ gap/stale-data بحرانی حل نشده وجود نداشته باشد
- security، revoke، restore و secrets scrub پاس شوند
- snapshot پشتیبان تنظیمات و checklist امضاشده موجود باشد
- مالک Market + Strategy را با تصمیم صریح فعال کند

### مرحله بعد

پس از عبور مستقل، نسخه Live Candidate با rollout محدود. هیچ بازار یا استراتژی دیگر خودکار فعال نمی شود.

## ۵. تاریخچه ترتیب پیشنهادی تصمیم های مالک

برای بستن مرحله ۱، تصمیم ها به این ترتیب گرفته شوند:

1. `OPEN-003` و `OPEN-006`: قراردادهای پایه، واحدها و ریاضیات عددی
2. `OPEN-007`: اعتبار و زمان داده
3. `OPEN-001`: تعریف Featureها و Golden datasets
4. `OPEN-002`: grading، material conflict و Judge state
5. `OPEN-004` و `OPEN-005`: Risk و Drawdown
6. `OPEN-008`: OMS state machine
7. `OPEN-009`: Device authority و fenced lease

این ترتیب وابستگی ها را کم می کند، اما هر تصمیم فقط پس از پاسخ صریح مالک به پرسش نامه همان موضوع قفل می شود.

پرسش ها در [پرسش نامه تصمیم های P0 مالک](owner-decision-questionnaire-fa.md) و پاسخ های تفویض شده در [تصمیم های تفویض شده مرحله ۱](phase-1-delegated-decisions-fa.md) ثبت شده اند.

## ۶. وضعیت نهایی این نقشه راه

- کل مسیر اجرای برنامه از مرحله ۱ تا ۱۳ مشخص است.
- این سند به تنهایی P0/P1 را حل نکرده است؛ `DEC-043` تا `DEC-067` آن ها را برای برنامه ریزی مرحله ۱ حل می کنند.
- مرحله جاری: مرحله ۱، آماده بازبینی ولی غیرقابل عبور.
- مرحله بعد پس از عبور: مرحله ۲ - پایه مخزن و قرارداد رویداد.
