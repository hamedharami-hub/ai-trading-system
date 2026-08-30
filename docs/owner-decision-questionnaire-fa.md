# پرسش نامه تصمیم های مالک برای بستن P0های مرحله ۱

## روش پاسخ

این سند سؤال ها را ثبت می کند. پاسخ های کامل اولیه با اختیار صریح مالک برای انتخاب Defaultهای ایمن، در [تصمیم های تفویض شده مرحله ۱](phase-1-delegated-decisions-fa.md) و `DEC-043` تا `DEC-067` ثبت شده اند. هر دستور صریح بعدی مالک بر آن ها مقدم است.

در صورت پشتیبانی رابط، سؤال ها به شکل گزینه های تعاملی پرسیده می شوند. اگر کنترل تعاملی در دسترس نباشد، هر بار فقط یک سؤال کوتاه فارسی مطرح می شود.

ترتیب پیشنهادی پاسخ: `OPEN-003`، `OPEN-006`، `OPEN-007`، `OPEN-001`، `OPEN-002`، `OPEN-004`، `OPEN-005`، `OPEN-008` و `OPEN-009`.

## وضعیت حل پرسش نامه

همه پرسش های P0/P1 این پرسش نامه اکنون برای برنامه ریزی حل شده اند: `Q-003-*` با DEC-045، `Q-006-*` با DEC-044، `Q-007-*` با DEC-046، `Q-001-*` با DEC-047، `Q-002-*` با DEC-048، `Q-004-*` با DEC-049، `Q-005-*` با DEC-050، `Q-008-*` با DEC-051 و `Q-009-*` با DEC-052. این سند به عنوان تاریخچه سؤال حفظ می شود؛ بخش های قدیمیِ «باز» با این وضعیت جدید خوانده شوند.

## A. قراردادها و ساختار داده - OPEN-003

- `Q-003-01`: واحد رسمی هر فیلد قیمت، حجم، درصد، پول، زمان، فاصله Stop و R:R چیست؟
- `Q-003-02` - پاسخ داده شد در `DEC-038`: مقادیر `Price`، `Quantity`، `Money`، `Percent` و `R:R` در Wire Contract به صورت decimal string نمایش داده می شوند.
- `Q-003-03` - پاسخ جزئی در `DEC-038`: precision هر Symbol از metadata نسخه دار گرفته می شود. مرجع metadata و رفتار تغییر نسخه هنوز باز است.
- `Q-003-04`: timestampها دقیقاً با چه قالب، timezone و precision ثبت شوند؟
- `Q-003-05`: برای `event_id`، `device_id`، `correlation_id`، `candidate_id` و `order_intent_id` چه نوع شناسه ای استفاده شود؟
- `Q-003-06`: فیلدهای اختیاری چگونه از `null`، مقدار ناموجود و مقدار صفر تفکیک شوند؟
- `Q-003-07`: در `NO_TRADE` یا `REJECT` کدام فیلدهای entry/stop/targets باید غایب باشند و کدام باید وجود داشته باشند؟
- `Q-003-08`: حداقل و حداکثر تعداد Targetها و ترتیب آن ها چیست؟
- `Q-003-09`: مالکیت و عمر `evidence_id`ها چگونه تعریف شود تا به FeatureSnapshot صحیح اشاره کنند؟
- `Q-003-10`: قواعد backward/forward compatibility و deprecation برای `schema_version` چیست؟
- `Q-003-11`: با فیلد ناشناخته، enum ناشناخته یا نسخه پشتیبانی نشده چه رفتار fail-closed انجام شود؟
- `Q-003-12`: canonical serialization برای hash، signature و replay دقیقاً چگونه باشد؟

## B. ریاضیات مالی و تبدیل ارز - OPEN-006

- `Q-006-01` - پاسخ داده شد در `DEC-040`: محاسبات مالی قطعی داخلی از Decimal با دقت دلخواه استفاده می کنند. انتخاب package/runtime آن برای مرحله ۲ و تأیید dependency باز است.
- `Q-006-02` - پاسخ جزئی در `DEC-041`: final order quantity همیشه رو به پایین تا `stepSize` مجاز گرد می شود. rounding قیمت، fee، FX conversion و risk amount هنوز باز است.
- `Q-006-03`: ترتیب rounding در فرمول sizing چگونه باشد؟
- `Q-006-04`: منبع رسمی FX conversion به AUD برای هر بازار چیست؟
- `Q-006-05`: حداکثر سن مجاز نرخ FX چقدر است و stale FX چه دارایی هایی را متوقف می کند؟
- `Q-006-06`: `contract_value` برای Forex، Metals، Spot و Futures چگونه تعیین و version شود؟
- `Q-006-07` - پاسخ جزئی در `DEC-041`: final quantity بعد از اعمال محدودیت های تأییدشده رو به پایین تا `stepSize` گرد می شود. ترتیب کامل `tickSize`، `minQty` و `minNotional` هنوز باز است.
- `Q-006-08` - پاسخ داده شد در `DEC-042`: اگر حجم زیر `minQty` یا `minNotional` باشد، فقط تا کمترین حجم معتبر venue بالا می رود و سپس تمام گیت های policy، risk، margin، correlation و venue دوباره اجرا می شوند. شکست هر گیت برابر رد معامله است.
- `Q-006-09`: Margin available و leverage cap از چه snapshot زمانی خوانده شوند؟
- `Q-006-10`: Zero، NaN، Infinity، division-by-zero و overflow چه کد خطا و رفتار توقفی دارند؟

## C. اعتبار و زمان داده - OPEN-007

- `Q-007-01`: freshness limit برای Tick، Candle، L2، Trades، Funding، Mark Price و Calendar در هر timeframe چیست؟
- `Q-007-02`: حداکثر clock drift مجاز بین دستگاه، exchange و cloud چقدر است؟
- `Q-007-03`: source of truth برای زمان و روش همگام سازی چیست؟
- `Q-007-04`: gap چگونه برای هر feed شناسایی شود وقتی sequence رسمی وجود دارد یا ندارد؟
- `Q-007-05`: پس از gap چه زمانی snapshot کامل لازم است؟
- `Q-007-06`: out-of-order window مجاز چقدر است و داده دیررس چگونه مدیریت شود؟
- `Q-007-07`: duplicate event چگونه شناسایی و ثبت شود؟
- `Q-007-08`: stale شدن یک feed کدام Candidateها، Symbolها یا Marketها را invalid می کند؟
- `Q-007-09`: پس از reconnect چه شرایطی برای اعلام feed سالم لازم است؟
- `Q-007-10`: health status و دلیل توقف چگونه به UI و Audit منتقل شود؟

## D. تعریف Featureها و Golden Dataset - OPEN-001

- `Q-001-01`: تعریف عددی Swing High/Low و lookback چیست؟
- `Q-001-02`: BOS و CHoCH با Close، Wick یا ترکیب آن ها تأیید شوند؟
- `Q-001-03`: حداقل displacement بر اساس ATR، range، volume یا معیار دیگری چیست؟
- `Q-001-04`: Sweep/Raid دقیقاً چه فاصله، مدت و برگشت قیمتی لازم دارد؟
- `Q-001-05`: Order Block چگونه ایجاد، invalid، mitigated و expired می شود؟
- `Q-001-06`: FVG حداقل چه اندازه ای دارد و partial/full fill آن چگونه تعریف می شود؟
- `Q-001-07`: Premium/Discount و dealing range چگونه انتخاب می شوند؟
- `Q-001-08`: Liquidity pool و important High/Low چگونه درجه بندی می شوند؟
- `Q-001-09`: OFI، CVD/Delta و Depth Imbalance دقیقاً با چه سطوح و windowهایی محاسبه شوند؟
- `Q-001-10`: Absorption و Liquidity Wall چه threshold و persistence لازم دارند؟
- `Q-001-11`: Spread، ATR، VWAP و Volume Profile با چه قواعدی Candidate را رد می کنند؟
- `Q-001-12`: معیارهای دقیق B، A، A+ و REJECT چیست؟
- `Q-001-13`: Golden Dataset اولیه را مالک ارائه می کند، مشترک ساخته می شود یا از داده ثبت شده و برچسب گذاری مالک تولید می شود؟
- `Q-001-14`: اختلاف مالک با خروجی Golden Dataset چگونه version و audit شود؟

## E. Policy، A+ و Judge - OPEN-002

- `Q-002-01`: material conflict بین Analyst و Critic دقیقاً بر اساس کدام فیلدها و شدت اختلاف تعریف شود؟
- `Q-002-02`: آیا هر A+ حتی در توافق کامل باید Judge شود؟
- `Q-002-03`: اگر Judge `REANALYZE` داد، کدام نقش ها و با چه evidence جدیدی دوباره اجرا شوند؟
- `Q-002-04`: حداکثر دفعات `REANALYZE` چقدر است؟
- `Q-002-05`: پس از رسیدن به سقف reanalysis نتیجه قطعی `NO_TRADE` است؟
- `Q-002-06`: timeout یا unavailable بودن Judge در A+ چه نتیجه ای دارد؟
- `Q-002-07`: اگر Analyst و Critic هر دو NO_TRADE باشند، آیا Judge هرگز اجرا می شود؟
- `Q-002-08`: اگر Analyst/Critic روی Direction توافق ولی روی Entry/Stop اختلاف داشته باشند، نتیجه چیست؟
- `Q-002-09`: Judge `APPROVE` دقیقاً کدام proposal/version را تأیید تحلیلی می کند؟
- `Q-002-10`: evidence ناکافی یا uncertainty بالا با چه rule قطعی رد می شود؟

## F. Adaptive Risk و Correlation - OPEN-004

- `Q-004-01`: ۰.۲۵٪، ۰.۵٪ و ۰.۷۵٪ در چه شرایط قطعی انتخاب می شوند؟
- `Q-004-02`: آیا Risk mapping فقط به grade وابسته است یا volatility، spread، session و drawdown نیز دخیل اند؟
- `Q-004-03`: `portfolio_equity_AUD` شامل کدام حساب ها، unrealized PnL و cash balanceها است؟
- `Q-004-04`: اگر داده یک حساب stale باشد، کل portfolio risk متوقف شود یا فقط همان حساب؟
- `Q-004-05`: گروه های correlation برای FX majors، XAU، BTC Spot و BTC Futures چگونه تعریف شوند؟
- `Q-004-06`: بودجه هر correlation group چقدر است؟
- `Q-004-07`: همبستگی ثابت، rolling یا rule-based باشد؟
- `Q-004-08`: اگر سه پوزیشن زیر سقف ۱٪ باشند ولی highly correlated باشند، کاهش size یا رد کامل انجام شود؟
- `Q-004-09`: در اختلاف بین account equity و broker margin کدام محدودکننده اولویت دارد؟
- `Q-004-10`: Manual size edit تا چه سقفی مجاز و چه زمانی رد می شود؟

## G. Daily Loss و Drawdown - OPEN-005

- `Q-005-01`: Daily Loss بر اساس realized، unrealized یا هر دو محاسبه شود؟
- `Q-005-02`: روز معاملاتی در چه timezone و ساعتی reset شود؟
- `Q-005-03`: High-water mark برای Drawdown چه زمانی و بر اساس چه equity ثبت شود؟
- `Q-005-04`: Deposit، withdrawal، transfer و fee چه اثری روی high-water mark دارند؟
- `Q-005-05`: افت ۳٪ risk همه حساب ها را نصف می کند یا فقط مسیرهای زیان ده را؟
- `Q-005-06`: بازگشت از حالت نصف Risk چه معیار و تأیید مالکی لازم دارد؟
- `Q-005-07`: پس از توقف ۵٪، شرایط review و resume چیست؟
- `Q-005-08`: پوزیشن های باز هنگام فعال شدن Daily Stop یا ۵٪ Drawdown چگونه مدیریت شوند؟
- `Q-005-09`: اگر Daily Stop فعال شد و timezone/DST تغییر کرد، state چگونه حفظ شود؟
- `Q-005-10`: تنظیم Daily Loss با biometric+code دقیقاً چه زمان مؤثر شود؟

## H. OMS و رفتار سفارش - OPEN-008

- `Q-008-01`: stateهای دقیق OrderIntent، Order، Fill، Cancel، Reject و Reconciliation چیست؟
- `Q-008-02`: transitionهای مجاز و terminal stateها کدام اند؟
- `Q-008-03`: عمر و scope `idempotency_key` چیست؟
- `Q-008-04`: timeout ارسال سفارش چگونه از reject یا unknown جدا شود؟
- `Q-008-05`: partial fill چه اثری بر SL/TP، remaining quantity و risk budget دارد؟
- `Q-008-06`: cancel/replace در race با fill چگونه reconcile شود؟
- `Q-008-07`: مرجع حقیقت Broker با local event log چگونه تطبیق داده شود؟
- `Q-008-08`: protective SL/TP چه زمانی و با چه atomicity ثبت شوند؟
- `Q-008-09`: اگر Broker سفارش محافظ را رد کند، رفتار فوری چیست؟
- `Q-008-10`: Emergency Flatten دقیقاً در چه شرایطی فعال و چگونه محافظت شود؟
- `Q-008-11`: restart recovery قبل از پذیرش Candidate جدید چه checklistی دارد؟
- `Q-008-12`: duplicate یا orphan order چگونه شناسایی، گزارش و متوقف شود؟

## I. Device Authority و Fenced Lease - OPEN-009

- `Q-009-01`: مرجع authoritative lease کجاست و در قطع Cloud چه رفتاری دارد؟
- `Q-009-02`: هر lease چه TTL، renewal interval و grace period دارد؟
- `Q-009-03`: fencing token/epoch چگونه monotonic و غیرقابل بازگشت باشد؟
- `Q-009-04`: Local Node و Android چگونه stale executor را تشخیص و fence می کنند؟
- `Q-009-05`: failover برای 1M، 5M، 15M و تایم فریم های بالاتر چه زمان تأیید شده ای دارد؟
- `Q-009-06`: در network partition کدام طرف اجازه مدیریت پوزیشن باز دارد؟
- `Q-009-07`: آیا در نبود Cloud، commander فعلی فقط مدیریت پوزیشن را ادامه می دهد و ورود جدید را متوقف می کند؟
- `Q-009-08`: شرایط battery، thermal، app lifecycle و data freshness برای Android executor چیست؟
- `Q-009-09`: device pairing، revoke و recovery چگونه به lease authority متصل شوند؟
- `Q-009-10`: پس از split-brain مشکوک، چه reconciliation و owner acknowledgement لازم است؟

## وضعیت

تمام سؤال ها باز هستند. پاسخ شفاهی مبهم، پاسخ جزئی یا انتخاب سکوت به معنی تأیید Default نیست. هر تصمیم باید صریح، قابل ردیابی و دارای اثر ثبت شده باشد.
