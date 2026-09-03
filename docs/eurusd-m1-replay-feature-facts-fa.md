# واقعیت‌های Feature برای Replay محلی EURUSD M1

## محدوده

این سند با `DEC-223` فقط یک برش قطعی و آفلاین برای `EURUSD / M1 / REPLAY` را تعریف می‌کند. ورودی باید playback از پیش پذیرفته‌شده باشد و cursor را caller مشخص می‌کند. این منطق هیچ فایل یا شبکه‌ای را نمی‌خواند.

## پنجرهٔ Swing

برای cursor مرکزی، دقیقاً پنج candle ثبت‌شده قبل و پنج candle ثبت‌شده بعد لازم است. اگر playback رد شده، instrument/timeframe نادرست باشد، cursor معتبر نباشد یا پنجره کامل نباشد، نتیجه فقط observation-unavailable است.

- Swing High زمانی ثبت می‌شود که `high` candle مرکزی به‌طور strict از `high` همهٔ ده candle اطراف بزرگ‌تر باشد.
- Swing Low زمانی ثبت می‌شود که `low` candle مرکزی به‌طور strict از `low` همهٔ ده candle اطراف کوچک‌تر باشد.
- برابری قیمت، Swing ایجاد نمی‌کند.

## واقعیت‌های کندلی

برای candle مرکزی، `body = abs(close - open)`، `range = high - low` و جهت فقط `BULLISH`، `BEARISH` یا `FLAT` است. تمام محاسبات با Decimal انجام می‌شود و مقدار مالی، tick، ATR یا price قابل‌اجرا تولید نمی‌شود.

## توقف امن و ممنوعیت‌ها

خروجی همیشه observation-only و execution-ineligible است. این برش هیچ `StrategyCandidate`، entry، stop، target، ATR threshold، PolicyGate، risk، cost، quantity، `OrderIntent`، Paper/Demo record، P&L، persistence، UI control، network یا execution ایجاد نمی‌کند. تعریف StrategyCandidate و آستانه‌های ATR در گیت جداگانه و بعد از پذیرش مستقل انجام می‌شود.
