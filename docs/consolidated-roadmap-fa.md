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
- مرحله ۵B-V: با `DEC-095` پذیرفته و بسته شده است. مرز adapter عمداً فاقد هر مسیر اتصال، credential، OMS یا سفارش است.
- مرحله ۵B-VI: با `DEC-097` پذیرفته و بسته شده است. آزمون یکپارچهٔ آفلاین نشان می‌دهد مسیر invalid/gapped هرگز به شبکه یا اجرا نمی‌رسد.
- مرحله ۵C-I: با `DEC-098` آغاز شد؛ manifest آمادگی آفلاین برای اتصال دادهٔ فقط‌خواندنی را ثبت کرد.
- مرحله ۵C-II: با `DEC-101` پذیرفته و بسته شده است. validator محلی همواره `NOT_READY` می‌ماند و نمی‌تواند فعال‌سازی یا اجرا را مجاز کند.
- مرحله ۵C-III: با `DEC-103` پذیرفته و بسته شده است. قالب evidence package در نبود هر مدرک، fail-closed است.
- مرحله ۵D: با `DEC-105` پذیرفته و بسته شده است. fixtureهای `MOCK` برای `EURUSD`، `GBPUSD`، `USDJPY` و `XAUUSD` فقط آفلاین و execution-ineligible هستند.
- مرحله ۵D-II: با `DEC-107` پذیرفته و بسته شده است. انتخاب‌گر PWA فقط شناسهٔ fixture محلی را تغییر می‌دهد و هیچ قیمت یا مسیر معاملاتی ندارد.
- مرحله ۵D-III: با `DEC-109` پذیرفته و بسته شده است. جزئیات ثابت fixture محلی نمایش داده می‌شود و وضعیت ناشناخته داده‌ای نشان نمی‌دهد.
- Phase 4: با تأیید صریح مالک در `DEC-110` همچنان پذیرفته است؛ تعارض دستور مخزن دربارهٔ وضعیت آن حل شد. این تأیید، هیچ مجوزی برای اتصال یا معامله ایجاد نمی‌کند.
- مرحله ۵D-IV: با `DEC-112` پذیرفته و بسته شده است. نمودار ثابت MOCK فقط در کنار fixture شناخته‌شده نمایش داده می‌شود.
- پیشروی خودکار محدود برای زیرمرحله‌های آفلاین/نمایشی Phase 5 با `DEC-113` مجاز است؛ گیت‌های اتصال، Paper/Demo، OMS و اجرا همچنان تأیید صریح مستقل می‌خواهند.
- مرحله ۵E: با `DEC-115` طبق مجوز پیشروی خودکار پذیرفته و بسته شده است. PWA فقط شواهد benchmark پیشین AI آفلاین را نمایش می‌دهد.
- مرحله ۵F: با `DEC-117` طبق مجوز پیشروی خودکار پذیرفته و بسته شده است. فرمان `pnpm verify:offline-ai` شش تست AI آفلاین و build PWA را با یک اجرا بررسی می‌کند.
- مرحله ۵G: با `DEC-119` طبق مجوز پیشروی خودکار پذیرفته و بسته شده است. فرمان `pnpm verify:offline-replay` ۳۳ تست Replay/هستهٔ قطعی و build PWA را با یک اجرا بررسی می‌کند.
- مرحله ۵H: با `DEC-121` طبق مجوز پیشروی خودکار پذیرفته و بسته شده است. فرمان `pnpm verify:offline` هر دو بستهٔ تست و build PWA را در یک گردش بررسی می‌کند.
- مرحله ۵I: با `DEC-123` طبق مجوز پیشروی خودکار پذیرفته و بسته شده است. ممیزی tracked-file نشان می‌دهد flagهای اجرایی خاموش و credential واقعی در فایل‌های tracked یافت نشده است.
- طراحی Paper Trading محلی: با `DEC-125` پذیرفته و بسته شده است؛ تنها سند fail-closed ثبت شده و Paper/OMS همچنان پیاده‌سازی نشده‌اند.
- مرحله ۵J: با `DEC-128` طبق مجوز پیشروی خودکار پذیرفته و بسته شده است. PWA کاری فقط حالت نبود dataset تاریخی Replay را نشان می‌دهد و MOCKها internal-test-only هستند.
- طراحی پذیرش dataset تاریخی: با `DEC-130` پذیرفته و بسته شده است؛ import یا acquisition داده همچنان پیاده‌سازی نشده است.
- مرحلهٔ ۵K: با `DEC-132` دریافت دستی و قرنطینه‌شدهٔ `EURUSD M1` از Dukascopy پذیرفته و بسته شده است. فایل خام با هش ثبت‌شده فقط محلی و untracked است؛ import، parser، نمایش PWA، Paper/OMS، connector و execution خارج از دامنه‌اند و به گیت جدا نیاز دارند.
- مرحلهٔ ۵L: با `DEC-134` پذیرفته و بسته شده است. فایل دقیق و قرنطینه‌شدهٔ `EURUSD M1` از آزمون ساختاریِ محلی عبور کرده، اما فقط `REPLAY` منبع‌برچسب‌خورده و execution-ineligible است؛ نمایش، import UI، Paper/OMS و اتصال همچنان خارج از دامنه‌اند.
- مرحلهٔ ۵M: با `DEC-136` پذیرفته و بسته شده است. PWA فقط evidence منبع‌برچسب‌خورده و coverage-bounded همان Replay پذیرفته‌شده را نمایش می‌دهد؛ فایل در مرورگر load نمی‌شود و نمودار، import UI، Paper/OMS و اتصال خارج از دامنه‌اند.
- مرحلهٔ ۵N: با `DEC-138` پذیرفته و بسته شده است. هستهٔ محلی فقط CSV پذیرفته‌شده را به candleهای immutable و cursor-based Replay تبدیل می‌کند؛ نمایش CSV/chart در PWA، AI، Paper/OMS و اتصال خارج از دامنه‌اند.
- مرحلهٔ ۵O: با `DEC-140` پذیرفته و بسته شده است. PWA فقط snapshot ثابت و فقط‌خواندنیِ پنج candle `OHLC` از cursorهای `0` تا `4` همان artifact تاریخی پذیرفته‌شده را همراه UTC نشان می‌دهد؛ CSV خام محلی، untracked و خارج از مرورگر می‌ماند. chart، کنترل بازپخش، import/export، AI، Paper/Demo، سود/زیان، ریسک، OMS، broker و هر اتصال خارج از دامنه‌اند.
- مرحلهٔ ۵P: با `DEC-142` پذیرفته و بسته شده است. helper قطعی و محلی فقط preview window immutable از یک تا پنج candleِ ثبت‌شده را می‌سازد، در انتهای داده `END` و برای Replay ردشده `UNAVAILABLE` می‌دهد؛ ورودی نامعتبر یا oversized هرگز candle حدسی یا wrap-around تولید نمی‌کند. PWA، فایل‌خوانی production، اتصال، AI، Paper/Demo، سود/زیان، ریسک، OMS، broker و اجرا خارج از دامنه‌اند.
- مرحلهٔ ۵Q: با `DEC-144` پذیرفته و بسته شده است. admission محلی اکنون ناسازگاری decimal-string میان `OHLC` را با evidence ردیف‌محور رد می‌کند؛ artifact تاریخی پذیرفته‌شده همچنان معتبر است. acquisition، PWA، اتصال، AI، Paper/Demo، سود/زیان، ریسک، OMS، broker و اجرا خارج از دامنه‌اند.
- مرحلهٔ ۵R: با `DEC-146` پذیرفته و بسته شده است. هستهٔ محلی summary فقط‌خواندنیِ dataset، وضعیت ready/unavailable، تعداد candle، coverage UTC و evidence ردشدن را بدون candle خام یا تغییر cursor/state برمی‌گرداند. فایل‌خوانی production، PWA، اتصال، AI، Paper/Demo، سود/زیان، ریسک، OMS، broker و اجرا خارج از دامنه‌اند.
- مرحلهٔ ۵S: با `DEC-148` پذیرفته و بسته شده است. evaluator قطعیِ admission برای Paper محلی تمام prerequisiteهای Replay، Policy/Risk، cost/partial-fill، محافظ و reconciliation را ثبت می‌کند، اما همیشه `NO_TRADE` با صفر record/fill/P&L می‌دهد تا lifecycle جداگانه گیت شود. PWA، اتصال، AI، broker، Demo/Testnet و اجرای واقعی خارج از دامنه‌اند.
- مرحلهٔ ۵T: با `DEC-150` پذیرفته و بسته شده است. audit record immutable و append-only برای `NO_TRADE / PAPER_LOCAL_ONLY` با پیوند Replay evidence ثبت می‌شود و duplicate ID رد می‌شود؛ هیچ record معاملاتی، lifecycle، OrderIntent، fill، position یا P&L ساخته نشده است. PWA، storage production، اتصال، AI، broker، Demo/Testnet و اجرای واقعی خارج از دامنه‌اند.
- مرحلهٔ ۵U: با `DEC-152` پذیرفته و بسته شده است. vocabulary و factory محلی فقط terminal evidence immutable برای `NO_TRADE`/`CANCELLED`/`REJECTED` می‌سازند و در همهٔ حالت‌ها صفر record/fill/position/P&L می‌مانند.
- مرحلهٔ ۵V: با `DEC-154` پذیرفته و بسته شده است. سه fixture قطعی و immutable فقط برای terminalهای `NO_TRADE`/`CANCELLED`/`REJECTED` با evidence identifier و خروجی صفرِ غیرمعاملاتی موجود است.
- مرحلهٔ ۵W: با `DEC-156` پذیرفته و بسته شده است. فقط presenceِ evidence فرض‌های cost/partial-fill/protective/reconciliation ارزیابی می‌شود و حتی در کامل‌بودن آن‌ها وضعیت `NO_TRADE` می‌ماند.
- مرحلهٔ ۵X: با `DEC-158` پذیرفته و بسته شده است. verifier محلی فقط log درون‌حافظه‌ای `NO_TRADE` را بدون mutation بازسازی می‌کند و link/timestamp/duplicate/zero-artifact را fail-closed می‌سنجد.
- مرحلهٔ ۵Y: با `DEC-160` پذیرفته و بسته شده است. evaluator فقط terminal evidence immutable برای `NO_TRADE`/`CANCELLED`/`REJECTED` را از source شناخته‌شده می‌پذیرد و هر source/target/reason نامعتبر را fail-closed رد می‌کند؛ خروجی در همهٔ حالات صفر record/fill/position/P&L دارد.
- مرحلهٔ فعال: ندارد؛ ایجاد simulated Paper record، OrderIntent، entry/fill/position/P&L، persistence، UI، AI signal و هر اتصال همچنان گیت مستقل و تأیید صریح مالک می‌خواهند.
- مرحلهٔ ۵Z: با `DEC-166` پذیرفته و بسته شده است. رکورد immutable محلی فقط با evidence کامل ساخته می‌شود و terminal/non-executable با صفر artifact می‌ماند.
- مرحلهٔ ۵AA: با `DEC-167` پذیرفته و بسته شده است. fixtureهای identifier-only برای accepted/rejected/expired/duplicate/cancelled/unknown موجود است؛ accepted نیز همچنان معامله نمی‌سازد.
- مرحلهٔ ۵AB: با `DEC-168` پذیرفته و بسته شده است. gate قطعی idempotency/expiry و assumption/replay در همهٔ حالت‌ها fail-closed و بدون artifact است.
- مرحلهٔ ۵AC: با `DEC-169` پذیرفته و بسته شده است. audit مخصوص رکورد شبیه‌سازی‌شده فقط درون‌حافظه‌ای، immutable، append-only و reconstructable است.
- مرحلهٔ ۵AD: با `DEC-170` پذیرفته و بسته شده است. integration آفلاین fixture/replay/assumption/idempotency/expiry همچنان فقط `NO_TRADE`/`REJECTED` و صفر OrderIntent/fill/position/P&L می‌دهد.
- مرحلهٔ فعال: ندارد؛ simulated entry، `OrderIntent`، fill، position، P&L، persistence، UI، AI signal و هر اتصال همچنان گیت مستقل و تأیید صریح مالک می‌خواهند.
- مرحلهٔ ۵AM: با `DEC-190` پذیرفته و بسته شده است. registry محلی تصمیم‌های expiry/idempotency/protective/reconciliation/evidence را صریحاً `OPEN` نگه می‌دارد.
- مرحلهٔ ۵AN: با `DEC-191` پذیرفته و بسته شده است. validator، decision IDهای unknown/duplicate را رد، موارد missing را ثبت و پذیرش ضمنی را ناممکن می‌کند.
- مرحلهٔ ۵AO: با `DEC-192` پذیرفته و بسته شده است. fixtureهای complete-but-open/missing/duplicate/unknown همگی fail-closed هستند و حتی complete set نیز `NO_TRADE` می‌ماند.
- تصمیم expiry: با `DEC-193` مالک صریحاً `paper-expiry-v1` را باز و بدون عدد نگه داشت؛ هیچ قانون فرضی اضافه نشد و readiness همچنان `NO_TRADE` است.
- تصمیم idempotency: با `DEC-194` تا پذیرش lifecycle پایدار و storage، `paper-idempotency-v1` باز و بدون lifetime/scope فرضی می‌ماند؛ readiness همچنان `NO_TRADE` است.
- تصمیم‌های protective/reconciliation/evidence: با `DEC-195` تا پذیرش مستقل، هر سه باز و بدون semantics فرضی می‌مانند؛ readiness همچنان `NO_TRADE` است.
- مرحلهٔ ۵AP: با `DEC-197` پذیرفته و بسته شده است. rule محدود expiry فقط برای Historical Replay پذیرفته‌شدهٔ EUR/USD M1 سه candle کامل بعدی را می‌پذیرد؛ قبل/بعد از expiry و هر gap/ورودی نامشخص فقط `NO_TRADE` است.
- مرحلهٔ ۵AQ: با `DEC-201` پذیرفته و بسته شده است. idempotency فقط در یک local Replay run و exact recordId است؛ duplicate فوراً `REJECTED` می‌شود.
- مرحلهٔ ۵AR و ۵AS: با `DEC-202` پذیرفته و بسته شده‌اند. protective فقط evidence presence و reconciliation فقط terminal evidence محلی است؛ هیچ action/fill/position ساخته نمی‌شود.
- مرحلهٔ ۵AT: با `DEC-203` پذیرفته و بسته شده است. pre-entry boundary evidence محلی کامل را می‌سنجد، duplicate را رد می‌کند و حتی در وضعیت کامل فقط `NO_TRADE` با صفر artifact می‌دهد.
- مرحلهٔ فعال: ندارد؛ Paper entry، `OrderIntent`، fill، position، P&L، persistence، UI، AI signal و هر اتصال همچنان گیت مستقل و تأیید صریح مالک می‌خواهند.
- مرحلهٔ ۵AX: با `DEC-211` پذیرفته و بسته شده است. PolicyGate محلی deny-only و immutable است؛ تا پذیرش strategy/policy/risk، هر candidate فقط `NO_TRADE / POLICY_RULES_NOT_APPROVED` می‌گیرد.
- مرحلهٔ ۵AY: با `DEC-213` پذیرفته و بسته شده است. Risk محلی deny-only و immutable است؛ تا پذیرش risk model و قرارداد مالی، هر candidate فقط `NO_TRADE / RISK_MODEL_NOT_APPROVED` می‌گیرد.
- مرحلهٔ ۵AU: با `DEC-207` پذیرفته و بسته شده است. قرارداد versioned و identifier-only Policy/Risk readiness ثبت شد و هیچ policy rule یا risk calculation ندارد.
- مرحلهٔ ۵AV: با `DEC-208` پذیرفته و بسته شده است. validator محلی evidence ناقص را fail-closed ثبت می‌کند و structurally نمی‌تواند policy/risk را approved کند.
- مرحلهٔ ۵AW: با `DEC-209` پذیرفته و بسته شده است. complete-but-unapproved = `NO_TRADE` و missing evidence = `REJECTED`؛ صفر artifact باقی می‌ماند.
- مرحلهٔ ۵AZ: با `DEC-215` پذیرفته و بسته شده است. شناسه‌های تصمیم localِ پذیرفته‌شده را با Policy/Risk deny-only و evidence پیش‌ورود تجمیع می‌کند؛ در همهٔ حالت‌ها فقط `NO_TRADE` یا `REJECTED` با صفر artifact می‌ماند.
- مرحلهٔ ۵BA: با `DEC-217` پذیرفته و بسته شده است. Local Trading Node یک CLI تشخیصی آفلاین و بدون port/داده/شبکه دارد که فقط گزارش `NO_TRADE` را از کنترل‌های محلی موجود می‌خواند.
- مرحلهٔ ۵BB: با `DEC-218` فعال است. PolicyGate و Risk Engine موجود را فقط روی input قطعی و محلی غربال می‌کند؛ نتیجه همیشه غیرقابل‌اجرا و `NO_TRADE` می‌ماند.
- مرحلهٔ ۵BB: با `DEC-219` پذیرفته و بسته شده است. PolicyGate و Risk Engine موجود را فقط روی input قطعی و محلی غربال می‌کند؛ نتیجه همیشه غیرقابل‌اجرا و `NO_TRADE` می‌ماند.
- مرحلهٔ ۵BC: با `DEC-221` پذیرفته و بسته شده است. workflow کم‌اختیار CI، lint/typecheck/test/build/audit را پس از push یا pull request اجرا می‌کند؛ اجرای راه‌دور شمارهٔ ۲ برای commit `c3af2c0` در ۵۳ ثانیه موفق شد. هیچ secret، deploy یا اختیار معاملاتی ندارد.
- نگه‌داری نمایشی PWA: با `DEC-222` پذیرفته و بسته شده است. ناوبری «نمای کلی»، «دستگاه‌ها» و «ممیزی» اکنون evidenceهای محلی و غیرحاکمیتیِ جدا را نمایش می‌دهد؛ هیچ مرحله یا قابلیت معاملاتی تازه‌ای آغاز نشده است.
- مرحلهٔ ۵BD: با `DEC-224` پذیرفته و بسته شده است. فقط factهای candle و Swing در پنجرهٔ قطعیِ پنج کندل در هر سمت برای `EURUSD / M1 / REPLAY` محلی محاسبه می‌شوند؛ ATR، candidate، risk، هزینه، Paper و اجرا خارج از دامنه‌اند.
- مرحلهٔ ۵BE: با `DEC-226` پذیرفته و بسته شده است. فقط ATR-14 و factهای displacement برای `EURUSD / M1 / REPLAY` محلی محاسبه می‌شوند؛ candidate، risk، هزینه، Paper و اجرا خارج از دامنه‌اند.
- مرحلهٔ ۵BF: با `DEC-228` پذیرفته و بسته شده است. metadata محلی tick و factهای thresholded BOS/FVG برای `EURUSD / M1 / REPLAY` محاسبه می‌شوند؛ candidate، risk، هزینه، Paper و اجرا خارج از دامنه‌اند.
- مرحلهٔ ۵BG: با `DEC-230` پذیرفته و بسته شده است. فقط منشأ Order Block پیش از BOS معتبر و مرزهای بدنه‌اش برای `EURUSD / M1 / REPLAY` محلی محاسبه می‌شود؛ validity، mitigation، invalidation، candidate، risk، هزینه، Paper و اجرا خارج از دامنه‌اند.
- مرحلهٔ ۵BH: با `DEC-232` پذیرفته و بسته شده است. فقط state مشاهده‌ایِ بدون تماس/mitigated/invalidated برای Order Block پس از BOS در `EURUSD / M1 / REPLAY` محلی محاسبه می‌شود؛ candidate، entry، risk، هزینه، Paper و اجرا خارج از دامنه‌اند.
- مرحلهٔ ۵BI: با `DEC-234` پذیرفته و بسته شده است. فقط state مشاهده‌ایِ بدون تماس/mitigated/invalidated برای FVG پس از تشکیل در `EURUSD / M1 / REPLAY` محلی محاسبه می‌شود؛ candidate، entry، risk، هزینه، Paper و اجرا خارج از دامنه‌اند.
- مرحلهٔ ۵BJ: با `DEC-236` پذیرفته و بسته شده است. فقط fact مربوط به liquidity sweep/raid نسبت به آخرین Swing تأییدشده در `EURUSD / M1 / REPLAY` محلی محاسبه می‌شود؛ candidate، entry، risk، هزینه، Paper و اجرا خارج از دامنه‌اند.
- مرحلهٔ ۵BK: با `DEC-238` پذیرفته و بسته شده است. evidenceهای Candle/Swing، ATR/Displacement، BOS/FVG و Sweep/Raid برای یک cursor در `EURUSD / M1 / REPLAY` محلی کنار هم قرار می‌گیرند؛ candidate، grade، entry، risk، Paper و اجرا خارج از دامنه‌اند.
- مرحلهٔ ۵BL: با `DEC-240` پذیرفته و بسته شده است. evidence bundle محلی با JCS و SHA-256 digest می‌شود؛ persistence، انتقال، candidate، Paper و اجرا خارج از دامنه‌اند.
- مرحلهٔ ۵BM: با `DEC-242` پذیرفته و بسته شده است. digest مورد انتظار با evidence bundle محلی به‌صورت قطعی مقایسه می‌شود؛ persistence، انتقال، candidate، Paper و اجرا خارج از دامنه‌اند.
- مرحلهٔ ۵BN: با `DEC-244` پذیرفته و بسته شده است. bundle و digest قطعی برای ۱ تا ۶۴ cursor صعودی Replay محلی جمع‌آوری می‌شود؛ persistence، انتقال، candidate، Paper و اجرا خارج از دامنه‌اند.
- مرحلهٔ ۵BO: با `DEC-246` پذیرفته و بسته شده است. کل batch evidence محلی با JCS و SHA-256 digest می‌شود؛ persistence، انتقال، candidate، Paper و اجرا خارج از دامنه‌اند.
- مرحلهٔ ۵BP: با `DEC-248` پذیرفته و بسته شده است. manifest دیتاست Golden محلی برای `EURUSD / M1 / REPLAY` اعتبارسنجی می‌شود؛ acquisition، ساخت داده/label، candidate، Paper و اجرا خارج از دامنه‌اند.
- مرحلهٔ ۵BQ: با `DEC-250` پذیرفته و بسته شده است. فقط هویت، یکتایی شناسه و اتصال دقیق cursorهای مجموعه‌برچسب opaque مالک به manifest Golden محلی برای `EURUSD / M1 / REPLAY` بررسی می‌شود؛ ساخت/تأیید معنایی label، candidate، Paper و اجرا خارج از دامنه‌اند.
- مرحلهٔ ۵BR: با `DEC-252` پذیرفته و بسته شده است. فقط گزارش پذیرفته‌شدهٔ مجموعه‌برچسب Golden محلی با JCS/SHA-256 هش می‌شود؛ ساخت/تفسیر label، candidate، Paper و اجرا خارج از دامنه‌اند.
- مرحلهٔ ۵BS: با `DEC-254` پذیرفته و بسته شده است. فقط هش evidence مجموعه‌برچسب Golden محلی با هش موردانتظار تطبیق می‌شود؛ ساخت/تفسیر label، candidate، Paper و اجرا خارج از دامنه‌اند.
- مرحلهٔ ۵BT: با `DEC-256` پذیرفته و بسته شده است. فقط manifest، اتصال مجموعه‌برچسب و تطبیق هش evidence Golden محلی در یک وضعیت fail-closed جمع می‌شوند؛ کیفیت داده، تفسیر label، candidate، Paper و اجرا خارج از دامنه‌اند.
- مرحلهٔ ۵BU: با `DEC-257` پذیرفته و بسته شده است. فقط نتیجهٔ immutable و آمادهٔ evidence Golden محلی با JCS/SHA-256 به digest ممیزی تبدیل می‌شود؛ evidence ردشده digest ندارد و کیفیت داده/label، candidate، Paper و اجرا خارج از دامنه‌اند.
- مرحلهٔ فعال: ندارد؛ Paper entry، `OrderIntent`، fill، position، P&L، persistence، UI، AI signal و هر اتصال همچنان گیت مستقل و تأیید صریح مالک می‌خواهند.
- مرحلهٔ فعال: ندارد؛ Paper entry، `OrderIntent`، fill، position، P&L، persistence، UI، AI signal و هر اتصال همچنان گیت مستقل و تأیید صریح مالک می‌خواهند.
- مرحلهٔ ۵AI: با `DEC-183` پذیرفته و بسته شده است. قرارداد versioned و identifier-only برای lifecycle/expiry/idempotency/protective/reconciliation/evidence ثبت شد و هیچ مفهوم مالی/اجرایی ندارد.
- مرحلهٔ ۵AJ: با `DEC-184` پذیرفته و بسته شده است. validator قطعی، completeness قراردادها و lifecycle شناخته‌شده را فقط برای `NO_TRADE`/`REJECTED` ارزیابی می‌کند.
- مرحلهٔ ۵AK: با `DEC-185` پذیرفته و بسته شده است. fixture/testهای complete/missing/unknown/skipped/terminal-reversal مسیرهای fail-closed را پوشش می‌دهند.
- مرحلهٔ ۵AL: با `DEC-186` پذیرفته و بسته شده است. integration قرارداد محلی immutable و بدون trade artifact است؛ حتی قرارداد کامل نیز `NO_TRADE` می‌ماند.
- مرحلهٔ فعال: ندارد؛ simulated entry، `OrderIntent`، fill، position، P&L، persistence، UI، AI signal و هر اتصال همچنان گیت مستقل و تأیید صریح مالک می‌خواهند.
- مرحلهٔ ۵AE: با `DEC-175` پذیرفته و بسته شده است. evidence محلی Replay/assumption/protective/reconciliation/lifecycle برای کامل‌بودن سنجیده می‌شود و کمبود آن fail-closed است.
- مرحلهٔ ۵AF: با `DEC-176` پذیرفته و بسته شده است. lifecycle validator حالت ناشناخته، transition جهشی/برعکس و خروج از terminal را رد می‌کند.
- مرحلهٔ ۵AG: با `DEC-177` پذیرفته و بسته شده است. protective/reconciliation فقط evidence identifier می‌پذیرند و هیچ action یا order نمی‌سازند.
- مرحلهٔ ۵AH: با `DEC-178` پذیرفته و بسته شده است. integration readiness محلی در حالت evidence کامل نیز `NO_TRADE` می‌ماند و در دادهٔ ناقص/نامعتبر `NO_TRADE` یا `REJECTED` می‌دهد.
- مرحلهٔ فعال: ندارد؛ simulated entry، `OrderIntent`، fill، position، P&L، persistence، UI، AI signal و هر اتصال همچنان گیت مستقل و تأیید صریح مالک می‌خواهند.
- مرحله ۶: شروع نشده و به پذیرش صریح مرحلهٔ ۵ نیاز دارد.
- Firebase و Vercel برای مرحله ۴ تأیید شده‌اند، نه برای اختیار ریسک یا اجرا.
- AI آفلاین Windows و Android برای مرحله ۳ تأیید شده است؛ دانلود مدل در مرحله ۱ انجام نمی‌شود.
- Live Trading همچنان خاموش و نیازمند تصمیم مستقل آینده است.
