# Metadata، BOS و FVG برای Replay محلی EURUSD M1

## Metadata محلی

با `DEC-227`، فقط برای artifact محلی `EURUSD / M1 / REPLAY`، `tickSize = 0.00001` با شناسهٔ `eurusd-m1-replay-metadata-v1` ثبت می‌شود. این metadata به venue، broker، feed جاری یا execution تعمیم ندارد.

## آستانهٔ قطعی

آستانه برابر `max(2 * tickSize, 0.10 * ATR-14)` است. اگر ATR observation در دسترس نباشد، هیچ BOS/FVG ثبت نمی‌شود.

## BOS و FVG

- BOS صعودی زمانی observation می‌شود که close مرکزی حداقل آستانه بالاتر از آخرین Swing High تأییدشده باشد؛ BOS نزولی به‌طور متناظر پایین‌تر از آخرین Swing Low است.
- FVG صعودی شکاف میان low candle مرکزی و high دو candle پیش از آن، و FVG نزولی شکاف میان high مرکزی و low دو candle پیش از آن را با همان آستانه می‌سنجد.

این factها فقط evidence هستند؛ هیچ StrategyCandidate، entry، stop، target، policy/risk، Paper/Demo، persistence، network یا execution ایجاد نمی‌کنند.
