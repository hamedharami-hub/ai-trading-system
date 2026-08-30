# بسته تحویل پروژه به هوش مصنوعی بعدی

## ۱. هدف این سند

این سند نقطه شروع هر عامل هوش مصنوعی جدید، از جمله Google Antigravity، است. این فایل متن کلمه‌به‌کلمه گفت‌وگو یا استدلال خصوصی مدل نیست؛ بلکه تمام اطلاعات عملی لازم را منتقل می‌کند: خواسته‌های مالک، تصمیم‌های نهایی، دلیل‌های قابل ارائه، محدودیت‌ها، کارهای انجام‌شده، وضعیت واقعی مخزن و مسیر آینده.

## ۲. مرجع و تقدم

1. PDF فارسی در `docs/source/architecture-authority-v2.1-fa.pdf` و دستورهای صریح بعدی مالک، مرجع محصول‌اند.
2. آخرین دستور صریح مالک در تعارض‌ها مقدم است.
3. مستندات انگلیسی مخزن ترجمه نسخه‌دار برای پیاده‌سازی‌اند.
4. `docs/decision-register.md` رکورد رسمی تصمیم‌هاست.
5. این سند راهنمای ورود است و جای اسناد مرجع را نمی‌گیرد.

## ۳. خلاصه تعامل و تصمیم‌های مالک

- مالک ابتدا خواست فقط پایه برنامه‌ریزی و مخزن ساخته شود و هرگونه اتصال Broker/Exchange، Live، API key، Secret، دانلود مدل و AI call ممنوع بماند.
- مالک چهار نقش AI را تثبیت کرد: Analyst، Critic و Judge در مسیر زنده تحلیلی؛ Post-Trade Auditor خارج از مسیر زنده. Judge فقط تحلیلی و شرطی است؛ Auditor فقط گزارش و مقایسه می‌کند.
- جریان رسمی تصمیم در `DEC-009` تثبیت شد. تنها Local Trading Node قطعی حق محاسبه Risk یا ساخت `OrderIntent` تأییدشده را دارد.
- مالک خواست پروژه یک فاز در هر نوبت جلو برود، P0/P1 بی‌صدا حل نشود و شروع هر فاز نیازمند بیان دامنه، تصمیم‌های لازم و فرض‌های خطرناک باشد.
- فاز ۱ فقط شامل Requirements، Invariants، Data Classification، Risk Rules و Threat Model بود؛ هیچ کد یا Schema اجرایی مجاز نبود.
- مالک ابتدا چند تصمیم عددی را مستقیم تأیید کرد: decimal string در Wire، Decimal داخلی، گردکردن اولیه Quantity رو به پایین و استثنای کنترل‌شده حداقل سفارش با revalidation کامل.
- سپس مالک اختیار انتخاب باقی Defaultهای P0/P1 را با اولویت ایمنی به عامل واگذار کرد. نتیجه در `DEC-043` تا `DEC-067` و `docs/phase-1-delegated-decisions-fa.md` ثبت شد.
- مالک فاز ۱ را رسماً تأیید کرد. این پذیرش در `DEC-068` ثبت شده است.
- این تأیید، اجازه شروع فاز ۲ یا فعال‌سازی هیچ قابلیت خارجی نیست.

## ۴. وضعیت فعلی

- Roadmap Phase 1: کامل و پذیرفته‌شده.
- Roadmap Phase 2: شروع نشده؛ نیازمند تأیید مستقل مالک.
- Git محلی ایجاد شده، اما در زمان ساخت این بسته هیچ commit و هیچ GitHub remote نداشت.
- مخزن Foundation-only است؛ package scaffold وجود دارد ولی application source، dependency و lockfile وجود ندارد.
- تمام capability flagهای خارجی باید `false` بمانند.
- PDF داخل مخزن کپی شده تا همراه Git و Antigravity در دسترس باشد.

## ۵. معماری قطعی

```text
MarketEvent
→ FeatureSnapshot
→ StrategyCandidate
→ AnalystProposal + CriticProposal
→ JudgeDecision (conditional: material conflict or A+)
→ Deterministic PolicyGate
→ RiskDecision
→ OrderIntent
→ ExecutionReport
→ AuditEvent
```

- UI: Next.js PWA، فقط presentation و interaction.
- Windows Local Trading Node: Node.js/TypeScript و مرجع قطعی Market Data، Feature، Strategy، Policy، Risk و OMS آینده.
- Shared contracts: TypeScript contracts و JSON Schema در مرز پردازش‌ها، فقط پس از تأیید فاز ۲.
- dependency direction: `apps/pwa -> packages/contracts <- apps/local-trading-node`.
- AI output همیشه قابل رد است و هیچ authority محاسباتی یا اجرایی ندارد.

## ۶. اصول ایمنی غیرقابل نقض

- حالت نامعلوم، stale، ناقص، conflict، timeout، schema error یا policy failure برابر no new trade است.
- JavaScript `number` برای محاسبات مالی authoritative ممنوع است.
- Wire financial values از decimal string استفاده می‌کنند.
- audit history append-only است؛ اصلاح با event جدید انجام می‌شود.
- PWA، AI و کاربر نمی‌توانند Risk/Policy/OMS را دور بزنند.
- Secret، credential و account data وارد repository، prompt، log، analytics یا crash report نمی‌شود.
- هیچ Agent نباید صرفاً به دلیل compile شدن یا سبز شدن یک تست، فاز را تمام‌شده بداند.

## ۷. ترتیب مطالعه کامل

- تصمیم‌ها و موارد تاریخی: `decision-register.md`
- مرز سیستم: `architecture-v2.md`
- الزامات قابل ردیابی: `system-requirements-specification.md`
- Invariantهای ایمنی: `safety-invariants.md`
- طبقه‌بندی داده و Secret: `data-classification-and-secrets.md`
- Threat model: `threat-model.md`
- قواعد Risk: `risk-rules.md`
- جزئیات تصمیم‌های تفویض‌شده: `phase-1-delegated-decisions-fa.md`
- نقشه ۱۳ فاز: `execution-roadmap-fa.md`
- سؤال‌های تاریخی مالک: `owner-decision-questionnaire-fa.md`
- استاندارد کدنویسی و تست: `coding-standards.md` و `test-strategy.md`

## ۸. کار بعدی مجاز

عامل بعدی نباید خودکار Phase 2 را شروع کند. ابتدا باید دقیقاً این سه مورد را به فارسی ارائه کند:

1. دامنه دقیق Phase 2؛
2. تصمیم‌های P0/P1 مؤثر که هنوز واقعاً نیازمند تصمیم تازه‌اند؛
3. فرض‌های خطرناک و رفتار fail-closed.

سپس برای شروع Phase 2 تأیید مستقل مالک بگیرد. تصمیم‌های فاز ۱ را دوباره سؤال نکند مگر تعارض یا نقص قابل اثباتی پیدا شود.

## ۹. پرامپت پیشنهادی برای اولین پیام در Antigravity

```text
ابتدا GEMINI.md و تمام فایل‌های معرفی‌شده در docs/ai-handoff-fa.md را بخوان. PDF فارسی داخل docs/source مرجع محصول است و آخرین دستور صریح من مقدم است. وضعیت واقعی Git و محدودیت‌های AGENTS.md را بررسی کن. فاز ۱ در DEC-068 پذیرفته شده و فاز ۲ هنوز مجوز شروع ندارد. قبل از هر تغییر، فقط دامنه دقیق فاز ۲، تصمیم‌های واقعاً باقی‌مانده P0/P1 و فرض‌های خطرناک را به فارسی گزارش کن و منتظر تأیید من بمان. هیچ Secret، اتصال خارجی، AI call، مدل، Broker، Paper/Demo یا Live ایجاد نکن.
```

## ۱۰. چیزی که منتقل نمی‌شود

استدلال خصوصی/پنهان مدل و state داخلی این گفت‌وگو قابل انتقال یا بازسازی نیست. همچنین transcript خام لزوماً برای عامل بعدی قابل دسترس نیست. تصمیم‌ها و دلایل قابل استفاده به شکل نسخه‌دار در همین مخزن ثبت شده‌اند و باید منبع ادامه کار باشند؛ این شکل از انتقال از اتکا به حافظه یک گفت‌وگو قابل اعتمادتر است.

