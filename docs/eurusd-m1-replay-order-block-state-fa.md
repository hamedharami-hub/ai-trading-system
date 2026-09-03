# وضعیت Order Block در Replay محلی EURUSD M1

با `DEC-231` وضعیت Order Block فقط در یک `observationCursor` که بعد از cursor مربوط به BOS باشد مشاهده می‌شود:

- برخورد range کندل بعدی با zone بدنه، نخستین `mitigatedAtCursor` را ثبت می‌کند.
- برای منشأ bullish، Close پایین‌تر از `lower` بدنه؛ و برای منشأ bearish، Close بالاتر از `upper` بدنه، `invalidatedAtCursor` را ثبت می‌کند.
- نتیجه فقط یکی از `UNTOUCHED`، `MITIGATED` یا `INVALIDATED` است؛ invalidation بر mitigation تقدم دارد.

این state یک evidence محلی است؛ validity تجاری، grade، StrategyCandidate، entry، stop، target، policy/risk، Paper/Demo، persistence، network و execution خارج از دامنه‌اند.
