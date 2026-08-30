# تصمیم های تفویض شده مالک برای تکمیل مرحله ۱

## اعتبار و روش

مالک در این گفتگو اختیار انتخاب Defaultهای باقی مانده را با اولویت ایمنی واگذار کرده است. این سند همان پاسخ کامل پرسش نامه و تصمیم های P0/P1 است. در تعارض با هر تصمیم آینده مالک، تصمیم آینده مالک اولویت دارد.

این تصمیم ها قواعد مهندسی و ایمنی اند، نه توصیه معامله یا تضمین سود. هیچ موردی مجوز اتصال خارجی، Secret، AI call، دانلود مدل، Demo، Paper یا Live نیست.

## P0-1: Feature definitions - DEC-047

- Swing context با ۵ کندل تأیید شده در هر سمت، setup با ۳ و entry با ۲ کندل در هر سمت تعیین می شود.
- BOS فقط با بسته شدن کندل فراتر از Swing تأیید شده به اندازه حداقل `max(2 ticks, 0.10 ATR)` معتبر است. CHoCH نخستین BOS معتبر خلاف جهت ساختار تأیید شده است.
- Displacement نیازمند بدنه حداقل `1.0 ATR` و نسبت بدنه به range حداقل ۶۰٪ است.
- Sweep/Raid عبور wick از سطح نقدینگی و بسته شدن مجدد داخل سطح در همان کندل یا کندل بعد است.
- Order Block آخرین کندل مخالف پیش از BOS معتبر است؛ zone بدنه کندل است، با Close فراتر از مرز دور invalid و با لمس zone mitigated می شود.
- FVG شکاف سه کندلی بزرگ تر از `max(2 ticks, 0.10 ATR)` است؛ با پرشدن ۵۰٪ mitigated و با پرشدن کامل invalid می شود.
- OFI/CVD/Depth Imbalance فقط برای Entry با window ۶۰ ثانیه ای در 1M و ۱۸۰ ثانیه ای در 5M محاسبه می شوند. Absorption به حجم تهاجمی حداقل ۱.۵ برابر median window بدون پیشروی قیمت بیش از ۰.۲۵ ATR نیاز دارد.
- Grade A+ نیازمند همه پنج شرط نقدینگی، displacement+BOS/CHoCH، OB/FVG معتبر، تایید Order Flow و نبود conflict شدید است. Grade A دقیقاً چهار شرط را دارد؛ سایر موارد REJECT هستند. B برای تحلیل نگهداری می شود و نمایش/اجرا نمی شود.
- Golden Dataset از داده ثبت شده نسخه دار به همراه برچسب مالک ساخته می شود؛ هر اصلاح مالک یک نسخه جدید و audit event می سازد.

## P0-2: Council policy - DEC-048

- conflict مادی شامل اختلاف جهت، تفاوت بیش از ۰.۲۵ ATR در entry-zone midpoint یا stop، تفاوت بیش از ۰.۲۵ R در net R:R، یا evidence متناقض در موضوع حیاتی است.
- هر A+ و هر conflict مادی به Judge می رود. Judge فقط `APPROVE`، `REJECT` یا `REANALYZE` برمی گرداند.
- `REANALYZE` فقط یک بار مجاز است و باید با FeatureSnapshot جدید یا evidence جدید انجام شود. نتیجه reanalysis دوم یا timeout هر نقش برابر `NO_TRADE` است.
- اگر Analyst و Critic هر دو `NO_TRADE` باشند Judge اجرا نمی شود. توافق جهت با اختلاف مادی entry/stop همچنان conflict مادی است.
- `APPROVE` فقط proposalهای دارای همان `correlation_id` و همان نسخه evidence را تأیید تحلیلی می کند و هرگز Policy/Risk/Execution approval نیست.
- uncertainty بالا، evidence ناکافی یا schema نامعتبر همواره `NO_TRADE` است.

## P0-3: Contracts - DEC-045

- JSON Schema 2020-12 منبع wire contract است؛ `additionalProperties: false` و enum ناشناخته یا version پشتیبانی نشده fail-closed است.
- `Price` در quote currency، `Quantity` در base/contract unit، `Money` با `currency_code` صریح، `Percent` به صورت percent decimal string و `R:R` به صورت ratio decimal string حمل می شوند. exponent notation ممنوع است.
- precision از metadata نسخه دار نماد می آید. هر پیام financial شامل `instrument_id` و `instrument_metadata_version` است.
- timestampها RFC3339 UTC با میلی ثانیه، همراه با `timestamp_exchange` و `timestamp_local` جداگانه هستند.
- شناسه های event/device/correlation/candidate/order-intent UUIDv7 هستند. `correlation_id` برای یک چرخه تصمیم ثابت است.
- فیلد اختیاری حذف می شود، نه `null`؛ `null` فقط وقتی Schema صریحاً اجازه دهد. صفر هرگز معادل absence نیست.
- `LONG`/`SHORT` نیازمند entry_zone، stop، حداقل یک target، net_rr و evidence_ids هستند. `NO_TRADE`/`REJECT` این فیلدها را ندارد و حداقل یک reason_code دارد. targets حداکثر سه مورد و صعودی بر اساس جهت هستند.
- evidence_id به immutable FeatureSnapshot همان correlation_id اشاره می کند. schema_version با SemVer مدیریت می شود؛ تغییر major مصرف کننده قدیمی را fail-closed می کند. JSON Canonicalization Scheme برای hash/replay استفاده می شود.

## P0-4: Currency, Decimal and sizing - DEC-044

- package برنامه ریزی شده برای Decimal، `decimal.js` است؛ نصب آن فقط در مرحله ۲ و با dependency approval انجام می شود.
- Decimal precision داخلی ۳۴ رقم significant است. محاسبات میانی دقیق هستند و فقط در مرز venue quantize می شوند.
- مقدار اولیه quantity به سمت پایین تا stepSize گرد می شود. اگر زیر حداقل venue باشد، طبق DEC-042 فقط تا کمترین مقدار معتبر بالا می رود و تمام گیت ها دوباره اجرا می شوند.
- price ورودی باید از ابتدا tick-valid باشد؛ هر price off-tick رد می شود و هیچ rounding جهت دار پنهانی برای entry/stop انجام نمی شود.
- fee، FX و risk amount با Decimal و `ROUND_HALF_EVEN` در precision نهایی metadata محاسبه می شوند. quantity فقط `ROUND_DOWN` دارد.
- FX از quote مستقیم یا triangulated mid-price در feedهای validated Local Node می آید. حداکثر سن FX ۳۰ ثانیه است؛ stale یا missing FX تمام ورودهای جدید نیازمند آن تبدیل را متوقف می کند.
- contract_value، tickSize، stepSize، minQty، minNotional و margin rule فقط از canonical versioned instrument metadata خوانده می شوند. metadata تغییر کرده Candidateهای در حال انتظار را invalid می کند.
- ترتیب sizing: validate price/tick -> calculate risk -> floor quantity to step -> enforce minQty/minNotional exception -> revalidate margin -> correlation -> open-risk cap -> final venue validation. هر خطای Decimal/zero/NaN/Infinity/overflow برابر reject است.

## P0-5: Adaptive risk and correlation - DEC-049

- A با risk ثابت ۰.۲۵٪، A+ با ۰.۵٪ و A+ ممتاز با ۰.۷۵٪ مجاز است. A+ ممتاز فقط وقتی مجاز است که data health سبز، spread کمتر یا مساوی median ۷۵٪ اخیر، بدون خبر high-impact در ۶۰ دقیقه، drawdown کمتر از ۱٪، daily loss کمتر از ۰.۵٪، open risk کمتر از ۰.۲۵٪ و correlation group کمتر از ۰.۲۵٪ باشد.
- portfolio_equity_AUD برابر مجموع cash، realized PnL و unrealized PnL mark-to-market همه حساب های فعال است. stale بودن هر حساب فعال ورود جدید کل portfolio را متوقف می کند.
- گروه های correlation عبارت اند از: USD-FX، precious-metals، BTC exposure شامل BTC Spot/Futures، ETH exposure شامل ETH Spot/Futures. سقف هر گروه ۰.۵٪ open risk است.
- Manual size edit فقط کاهش حجم/ریسک را مجاز می کند؛ هر افزایش از mapping تعیین شده رد می شود.
- همه محدودیت ها با مقدار محافظه کارانه تر بین equity، margin، correlation و open-risk اعمال می شوند.

## P0-6: Daily loss and drawdown - DEC-050

- روز معاملاتی از ساعت ۰۰:۰۰ `Australia/Sydney` آغاز می شود و DST خودکار است.
- Daily Loss کاهش net equity شامل realized PnL، unrealized PnL، commission و funding نسبت به equity ابتدای روز است.
- high-water mark برای drawdown از بیشترین equity تعدیل شده با cashflow در کل عمر portfolio نگهداری می شود. deposit/withdrawal baseline را دقیقاً به همان اندازه تعدیل می کند.
- افت ۳٪ risk تمام حساب ها و گروه ها را نصف می کند و فقط در شروع روز Sydney بعدی، در صورت بازگشت equity بالاتر از ۹۸٪ high-water mark، رفع می شود.
- افت ۵٪ ورود جدید را تا تأیید دستی مالک متوقف می کند. پوزیشن باز محافظت و مدیریت می شود ولی Forced Flatten خودکار ندارد مگر Emergency Flatten صریح.
- Daily Stop تا شروع روز Sydney بعدی قفل است. تغییر تنظیمات حساس نیازمند biometric+PIN در دستگاه trusted و audit event است.

## P0-7: Market-data validity - DEC-046

- حداکثر سن داده: cTrader Tick/DOM پنج ثانیه، Binance Trades/L2 دو ثانیه، Mark Price/Funding پانزده ثانیه، FX سی ثانیه و Calendar شش ساعت است.
- clock drift مجاز یک ثانیه است. بیشتر از آن Candidate جدید را متوقف می کند.
- هر gap sequence یا checksum mismatch feed دارای sequence، feed را stale می کند و snapshot کامل لازم است. feed بدون sequence با expiry freshness کنترل می شود.
- out-of-order buffer حداکثر ۵۰۰ میلی ثانیه است؛ event دیرتر reject/audit می شود مگر sequence معتبر آن را مجاز کند.
- پس از reconnect، snapshot معتبر و حداقل ده ثانیه event پیوسته معتبر برای healthy شدن لازم است.
- duplicate با event_id و sequence شناسایی و فقط audit می شود. stale شدن feed، فقط symbol/market وابسته را متوقف می کند مگر portfolio equity/FX باشد که کل ورودهای وابسته را متوقف می کند.

## P0-8: OMS - DEC-051

- stateها: `DRAFT -> POLICY_ALLOWED -> RISK_APPROVED -> INTENT_CREATED -> SUBMITTING -> ACKNOWLEDGED -> PARTIALLY_FILLED|FILLED|REJECTED|CANCELLED|UNKNOWN -> RECONCILED` هستند. terminal state فقط پس از reconciliation معتبر است.
- idempotency key UUIDv7 OrderIntent به صورت دائمی در audit نگهداری و برای همان account/action/intent هرگز reuse نمی شود.
- timeout در ارسال برابر `UNKNOWN` است، نه reject؛ ارسال دوباره تا reconciliation با Broker ممنوع است.
- برای هر partial fill، SL/TP بلافاصله برای filled quantity ثبت می شود. race cancel/replace با Broker truth حل می شود.
- Broker truth پس از restart/failover مرجع execution state است. اختلاف unresolved ورود جدید را متوقف می کند.
- اگر protective order رد شود، ورودهای جدید متوقف و Position exposure از طریق مسیر emergency محافظت/بسته می شود. Emergency Flatten فقط با مالک یا invariant بحرانی تایید شده فعال است.
- قبل از Candidate جدید پس از restart: reconciliation کامل، بررسی position/order orphan، health داده و lease معتبر الزامی است.

## P0-9: Device authority - DEC-052

- cloud control plane آینده مرجع lease است ولی execution authority نیست. lease دارای epoch افزایشی و fencing token است.
- TTL lease پانزده ثانیه، renewal هر پنج ثانیه و grace period صفر است. token قدیمی هرگز فرمان جدید را نمی پذیرد.
- failover minimum پس از loss: 1M سی ثانیه، 5M چهل و پنج ثانیه، 15M شصت ثانیه و 30M/60M نود ثانیه است.
- در network partition، executor فعلی فقط مدیریت پوزیشن باز را ادامه می دهد و ورود جدید را متوقف می کند؛ standby بدون lease معتبر حق takeover ندارد.
- Android تا مرحله ۱۲ executor نیست. پس از آن نیازمند battery حداقل ۳۰٪، Foreground Service، thermal status سبز، data health سبز و fencing token معتبر است.
- split-brain مشکوک برابر stop new entries، reconciliation و owner acknowledgement است.

## P1-10: Market scope - DEC-053

- V1 instruments: `EURUSD`, `GBPUSD`, `USDJPY`, `AUDUSD`, `USDCHF`, `USDCAD`, `NZDUSD`, `XAUUSD`, `BTCUSDT` و `ETHUSDT` در Spot و USD-M Futures.
- canonical instrument ID شامل venue، market type، base، quote و contract type است؛ هیچ symbol string خام بین سیستم ها مرجع نیست.

## P1-11: Sessions - DEC-054

- time authority exchange timestamp است؛ نمایش و daily reset با `Australia/Sydney` است.
- Default schedule برای هر Symbol تا زمانی که مالک schedule مشخصی ایجاد نکرده `NO_NEW_ENTRIES` است. پوزیشن باز همچنان مدیریت می شود.
- تعطیلی/maintenance venue، silence period یا schedule نامعتبر برابر توقف ورود است. تنها هشدار مجاز silence، unavailable شدن همزمان Windows و Android است.

## P1-12: News - DEC-055

- Provider برنامه ریزی شده `Trading Economics` است و فقط در مرحله ۳ با approval جداگانه متصل می شود.
- رویدادهای high-impact currencies مرتبط، نرخ بهره، سخنرانی بانک مرکزی، CPI، employment و NFP ورودی را ۳۰ دقیقه قبل و ۱۵ دقیقه بعد متوقف می کنند.
- crypto به رویدادهای USD high-impact وابسته است. revision فوری اعمال و eventها با provider-event-id/currency/time dedupe می شوند. Calendar بالای شش ساعت stale است.

## P1-13: Candidate lifecycle - DEC-056

- Scalp از 1M و Intraday از 5M برای expiry سه کندلی استفاده می کنند. هر Candidate حداکثر یک reanalysis دارد.
- retrace به OB/FVG فقط Limit، breakout معتبر فقط Stop و Market order در V1 غیرفعال است. هر تغییر قیمت بیش از یک tick یا ۰.۰۵ ATR (هرکدام بزرگ تر) Candidate را invalid می کند.
- price chasing ممنوع است؛ stale/expired/repriced approval فقط با Candidate جدید قابل ادامه است.

## P1-14: Cost model - DEC-057

- Spread از best bid/ask validated، commission از metadata venue، funding از بدترین نرخ شناخته شده تا پایان holding window و slippage محافظه کارانه استفاده می کند.
- slippage baseline: Forex سه bps، XAU پنج bps، Crypto Spot ده bps و Crypto Futures پانزده bps. هر هزینه نامشخص برابر `NO_TRADE` است.
- latency budget ۲۵۰ms است. بیشتر از آن در Scalp Candidate را invalid می کند؛ در Intraday فقط اگر spread/slippage budget نقض شود invalid است.
- Backtest/Paper همواره هزینه و partial fill را گزارش می کنند و fill داخلی هرگز معادل Demo/Live اعلام نمی شود.

## P1-15: Position management - DEC-058

- V1 فقط SL/TP ثابت broker-side را فعال می کند. partial TP1 و trailing after 1R تا زمان اثبات در Demo/Paper غیرفعال هستند.
- gap یا reject محافظ برابر توقف ورود، alert و مسیر OMS safety است. Position باز بدون محافظ هدف مجاز نیست.

## P1-16: AI boundary - DEC-059

- AI می تواند scenario و proposal zone/stop/target ارائه کند، اما مقدار قابل اجرا فقط از StrategyCandidate قطعی و Risk Core تولید می شود.
- AI هیچ authority برای اصلاح numeric input، risk، order type، expiry، policy یا execution ندارد. proposal ناسازگار با candidate قطعی رد می شود.

## P1-17: Human revisions - DEC-060

- scope پیش فرض فقط تحلیل جاری است. symbol/timeframe scope نیازمند تایید صریح UI و permanent rule نیازمند biometric+PIN است.
- هر تغییر human یک immutable revision با owner، scope، reason و parent version می سازد. rollback یک revision جدید است.
- تغییر human همیشه reanalysis می سازد و هرگز Risk/OMS bypass یا OrderIntent مستقیم ایجاد نمی کند.

## P1-18: Events and audit - DEC-061

- هر event immutable، schema-versioned، canonical-serialized و append-only است. ordering با exchange sequence در هر stream و سپس local receipt order تعیین می شود.
- dedupe با event_id دائمی و sequence per stream است. checkpoint replay هر پنج دقیقه یا هر ۱۰٬۰۰۰ event، هرکدام زودتر، ذخیره می شود.
- unknown event/schema fail-closed است. audit export شامل hash chain و correlation links خواندنی است.

## P1-19: Local transport - DEC-062

- PWA فقط به `localhost` Local Trading Node با HTTPS/WSS متصل می شود؛ LAN binding ممنوع است.
- هر install certificate محلی و session device-bound دارد. UI commandها anti-CSRF، nonce، origin allowlist و explicit authorization می خواهند.
- API version negotiation mandatory است؛ mismatch فقط read-only compatibility view و بدون command است. offline PWA هیچ authority ندارد.

## P1-20: Android bridge - DEC-063

- Android در V1 UI-only است. Native Bridge فقط مرحله ۱۲ و پس از benchmark/approval اضافه می شود.
- Bridge آینده برای keystore، notification، foreground lifecycle و executor محدود است؛ battery زیر ۳۰٪، thermal warning، stale data یا lease نامعتبر برابر no new entries است.

## P1-21: Cloud/security/data - DEC-064

- C0 Public، C1 Internal، C2 Sensitive و C3 Restricted Secret اکنون طبقه بندی رسمی هستند.
- C3 هرگز در cloud، PWA، prompt، log، crash report یا analytics قرار نمی گیرد. C2 sync فقط end-to-end encrypted است.
- cloud control آینده از PostgreSQL/Realtme/FCM استفاده می کند، credential broker را decrypt نمی کند و execution authority نیست.
- TLS 1.3 in transit، AES-256-GCM at rest، device-bound envelope encryption برای C2، revoke فوری device و recovery C2 با recovery key مالک الزامی است. C3 recovery با re-pair/revoke است، نه cloud backup.

## P1-22: Storage - DEC-065

- Raw L2 سی روز، derived data پنج سال و audit/event log به صورت نامحدود تا حذف صریح مالک نگهداری می شوند.
- Backup رمزگذاری شده روزانه، integrity check هفتگی و restore test ماهانه دارد.
- فشار disk: oldest raw L2 -> recomputable derived -> توقف ingestion کم اولویت. audit، state پوزیشن باز و تنظیمات ایمنی هرگز خودکار حذف نمی شوند. کمتر از ۱۰٪ فضای آزاد یا ۱۰GB، هرکدام بزرگ تر، ورود جدید متوقف می شود.

## P1-23: Statistical gate - DEC-066

- هر Market+Strategy فعال حداقل ۱۰۰ signal معتبر دارد و تعداد کل حداقل `max(500, sum(active market+strategy minimums))` است.
- چهار هفته متوالی Paper/Demo، expectancy پس از هزینه با lower bound ۹۵٪ بالاتر از صفر، Profit Factor نقطه ای حداقل ۱.۲ و lower bound ۹۵٪ بالاتر از ۱.۰ لازم است.
- split زمانی Walk-forward ۷۰٪ in-sample و ۳۰٪ out-of-sample است؛ calibration باید هر grade را با expectancy واقعی گزارش کند.
- قبولی هر Market+Strategy مستقل است و به دیگری گسترش نمی یابد.

## P1-24: Determinism - DEC-067

- Decimal ۳۴ رقمی، JSON Canonicalization Scheme، RFC3339 UTC milliseconds و timezone database version pinned، پایه determinism هستند.
- Feature/Risk/Policy/OMS replay بین Windows و Android باید byte-identical event serialization و exact decimal output داشته باشد. هر mismatch برابر fail-closed و incident است.
- timezone database یا metadata version تغییر کرده، replay baseline جدید و migration audit می خواهد.

## پوشش پرسش نامه

| پرسش ها | پاسخ مرجع |
| --- | --- |
| Q-003-01 تا Q-003-12 | DEC-045 و DEC-067 |
| Q-006-01 تا Q-006-10 | DEC-038، DEC-040، DEC-041، DEC-042 و DEC-044 |
| Q-007-01 تا Q-007-10 | DEC-046 |
| Q-001-01 تا Q-001-14 | DEC-047 |
| Q-002-01 تا Q-002-10 | DEC-048 |
| Q-004-01 تا Q-004-10 | DEC-049 |
| Q-005-01 تا Q-005-10 | DEC-050 |
| Q-008-01 تا Q-008-12 | DEC-051 |
| Q-009-01 تا Q-009-10 | DEC-052 |

## نتیجه

تمام P0/P1های مرحله ۱ پاسخ طراحی دارند. اجرای هر تصمیم فقط در مرحله مجاز خودش و پس از تست های همان مرحله ممکن است.
