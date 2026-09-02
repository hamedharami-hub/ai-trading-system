# دفتر تصمیم‌های لازم پیش از Paper Entry محلی

## وضعیت

این دفتر تنها یک registry محلی و آفلاین است. هیچ تصمیمی در آن به‌طور ضمنی پذیرفته نمی‌شود و تا زمانی که همهٔ موارد صریحاً با تصمیم مالک بسته نشوند، Paper entry محلی ممنوع و نتیجه `NO_TRADE` است.

| شناسهٔ تصمیم              | موضوع                                                                                                                    | وضعیت                          |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------ |
| `paper-expiry-v1`         | فقط برای Historical Replay پذیرفته‌شدهٔ EUR/USD M1: پس از ۳ candle کامل بعدی منقضی می‌شود؛ gap/ورودی نامشخص = `NO_TRADE` | `ACCEPTED / LOCAL REPLAY ONLY` |
| `paper-idempotency-v1`    | فقط همان اجرای درون‌حافظه‌ای Replay محلی و exact `recordId`؛ duplicate فوراً `REJECTED`                                  | `ACCEPTED / LOCAL RUN ONLY`    |
| `paper-protective-v1`     | فقط evidence presence محلی؛ هیچ protective order، cancel یا action ساخته نمی‌شود                                         | `ACCEPTED / EVIDENCE ONLY`     |
| `paper-reconciliation-v1` | فقط terminal evidence محلی `NO_TRADE`/`CANCELLED`/`REJECTED` با شناسه‌های immutable؛ fill/position ممنوع است             | `ACCEPTED / TERMINAL ONLY`     |
| `paper-evidence-v1`       | فقط identifierهای immutable و محلی Replay/fixture/audit؛ evidence ناشناخته یا ناقص رد می‌شود                             | `ACCEPTED / LOCAL ONLY`        |

این سند قیمت، quantity، risk، entry، `OrderIntent`، fill، position، P&L، حساب، broker، API، credential، شبکه، Demo/Testnet، AI signal، UI کنترل یا اجرای واقعی تعریف نمی‌کند.
