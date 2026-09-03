# وضعیت FVG در Replay محلی EURUSD M1

با `DEC-233` وضعیت FVG فقط در یک `observationCursor` که بعد از cursor تشکیل FVG باشد، ثبت می‌شود:

- FVG صعودی zone میان `high` دو کندل قبل و `low` کندل تشکیل‌دهنده است. رسیدن low بعدی به midpoint یعنی mitigation؛ رسیدن به lower یعنی پرشدن کامل و invalidation.
- FVG نزولی zone میان `high` کندل تشکیل‌دهنده و `low` دو کندل قبل است. رسیدن high بعدی به midpoint یعنی mitigation؛ رسیدن به upper یعنی پرشدن کامل و invalidation.
- نتیجه فقط `UNTOUCHED`، `MITIGATED` یا `INVALIDATED` است؛ invalidation بر mitigation تقدم دارد.

این فقط evidence محلی است و هیچ candidate، grade، entry، stop، target، policy/risk، Paper/Demo، persistence، network یا execution نمی‌سازد.
