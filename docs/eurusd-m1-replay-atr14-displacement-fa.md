# ATR-14 و Displacement برای Replay محلی EURUSD M1

## محدوده و نسخه

این سند با `DEC-225` تنها محاسبهٔ observation-only برای `EURUSD / M1 / REPLAY` را تعریف می‌کند. `atrDefinitionId` برابر `eurusd-m1-atr14-arithmetic-tr-v1` است و هر تغییر دوره یا فرمول به شناسه و تصمیم جدید نیاز دارد.

## فرمول قطعی

برای هر candle، True Range برابر `max(high-low, abs(high-prevClose), abs(low-prevClose))` است. در cursor مرکزی، ATR برابر میانگین حسابی ۱۴ True Range ثبت‌شده از همان cursor به عقب است. بنابراین برای محاسبهٔ ATR به ۱۵ candle پیوسته تا cursor نیاز است: ۱۴ candle دارای True Range و یک close پیشین برای نخستین True Range.

Displacement فقط یک fact است و زمانی `true` می‌شود که body candle مرکزی حداقل یک ATR و نسبت `body/range` حداقل ۶۰٪ باشد. range صفر یا هندسهٔ نامعتبر fail-closed است.

## توقف امن

Replay ردشده، scope نامعتبر، cursor نامعتبر، context ناکافی، range صفر یا candle نامعتبر فقط observation-unavailable می‌دهد. این محاسبه هیچ StrategyCandidate، entry، stop، target، policy/risk/cost/quantity، Paper/Demo record، P&L، persistence، network یا execution تولید نمی‌کند.
