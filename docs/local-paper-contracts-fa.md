# قراردادهای آماده‌سازی Paper Trading محلی

## مرز و نسخه

این سند تنها قراردادهای identifier-only و versioned برای Paper Trading کاملاً آفلاین را ثبت می‌کند. همهٔ خروجی‌ها باید `PAPER_LOCAL_ONLY` باشند. این سند یا validator همراه آن هیچ قیمت، quantity، risk، entry، `OrderIntent`، fill، position، P&L، حساب، broker، API، credential، شبکه، Demo/Testnet، AI signal، UI کنترل یا اجرای واقعی تعریف نمی‌کند.

## قراردادهای لازم

هر readiness request باید همهٔ شناسه‌های غیرخالی زیر را داشته باشد:

- `schemaVersion`
- `lifecycleContractId`
- `expiryContractId`
- `idempotencyContractId`
- `protectiveHandlingContractId`
- `reconciliationContractId`
- `evidenceContractId`

شناسه‌ها فقط evidence هستند و هیچ معنای مالی یا اجرایی ندارند.

## lifecycle مجاز

تنها توالی مفهومی محلی زیر معتبر است:

```text
DRAFT -> POLICY_ALLOWED -> RISK_APPROVED -> INTENT_CREATED
```

هر transition جهشی، بازگشت به عقب، حالت ناشناخته، یا خروج از یک terminal (`NO_TRADE`، `CANCELLED`، `REJECTED`) رد می‌شود. اعتبار این توالی نیز مجوز entry ایجاد نمی‌کند: خروجی کامل همیشه `NO_TRADE` با `SIMULATED_ENTRY_NOT_IMPLEMENTED` است.

## Safe stop

هر قرارداد یا evidence ناقص/ناشناخته، یا lifecycle نامعتبر، باید `NO_TRADE` یا `REJECTED` برگرداند. هیچ رفتار جایگزین یا فرض ضمنی مجاز نیست.
