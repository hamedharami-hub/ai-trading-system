# منشأ Order Block در Replay محلی EURUSD M1

با `DEC-229` فقط منشأ ساختاری Order Block برای `EURUSD / M1 / REPLAY` محلی ثبت می‌شود:

- BOS صعودی، آخرین کندل نزولیِ ثبت‌شده پیش از BOS را جست‌وجو می‌کند.
- BOS نزولی، آخرین کندل صعودیِ ثبت‌شده پیش از BOS را جست‌وجو می‌کند.
- zone فقط بدنهٔ همان کندل است: `min(open, close)` تا `max(open, close)`.

این artifact عمداً status «معتبر»، mitigation یا invalidation نمی‌دهد، چون آن‌ها به مشاهدهٔ قطعیِ کندل‌های پس از BOS نیاز دارند. این خروجی evidence است و StrategyCandidate، entry، stop، target، policy/risk، Paper/Demo، persistence، network یا execution نمی‌سازد.
