# بستهٔ evidence محلی EURUSD M1 Replay

`DEC-237` فقط evidenceهای محاسبه‌شدهٔ موجود را در یک bundle تغییرناپذیر برای یک cursor جمع می‌کند:

- Candle/Swing
- ATR-14/Displacement
- BOS/FVG
- Sweep/Raid

هر `OBSERVATION_UNAVAILABLE` بدون تغییر حفظ می‌شود؛ هیچ evidence ناقص به سیگنال، candidate یا trade تبدیل نمی‌شود. این bundle هیچ I/O، persistence، network، Paper/Demo یا execution ندارد.
