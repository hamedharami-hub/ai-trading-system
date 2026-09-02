# دفتر تصمیم‌های لازم پیش از Paper Entry محلی

## وضعیت

این دفتر تنها یک registry محلی و آفلاین است. هیچ تصمیمی در آن به‌طور ضمنی پذیرفته نمی‌شود و تا زمانی که همهٔ موارد صریحاً با تصمیم مالک بسته نشوند، Paper entry محلی ممنوع و نتیجه `NO_TRADE` است.

| شناسهٔ تصمیم              | موضوع                                                                                                                    | وضعیت                          |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------ |
| `paper-expiry-v1`         | فقط برای Historical Replay پذیرفته‌شدهٔ EUR/USD M1: پس از ۳ candle کامل بعدی منقضی می‌شود؛ gap/ورودی نامشخص = `NO_TRADE` | `ACCEPTED / LOCAL REPLAY ONLY` |
| `paper-idempotency-v1`    | تا پذیرش lifecycle پایدار و storage، هیچ lifetime یا scope فرضی برای idempotency تعریف نمی‌شود                           | `OPEN / NO_TRADE`              |
| `paper-protective-v1`     | semantics protective handling تا پذیرش مستقل، فرض نمی‌شود                                                                | `OPEN / NO_TRADE`              |
| `paper-reconciliation-v1` | precedence و evidence reconciliation تا پذیرش مستقل، فرض نمی‌شود                                                         | `OPEN / NO_TRADE`              |
| `paper-evidence-v1`       | ownership و completeness evidence تا پذیرش مستقل، فرض نمی‌شود                                                            | `OPEN / NO_TRADE`              |

این سند قیمت، quantity، risk، entry، `OrderIntent`، fill، position، P&L، حساب، broker، API، credential، شبکه، Demo/Testnet، AI signal، UI کنترل یا اجرای واقعی تعریف نمی‌کند.
