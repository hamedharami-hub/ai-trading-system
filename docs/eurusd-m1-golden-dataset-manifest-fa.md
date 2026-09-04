# Manifest دیتاست Golden محلی EURUSD M1

`DEC-247` فقط یک manifest caller-supplied را fail-closed اعتبارسنجی می‌کند. Manifest باید version، شناسهٔ dataset، شناسهٔ غیرخالی owner-label، SHA-256 فایل محلی Replay و cursorهای یکتا و صعودی در بازهٔ داده را داشته باشد.

این validator صحت تحلیلی labelها را تأیید نمی‌کند و هیچ داده یا label جدیدی تولید، ذخیره، دریافت یا ارسال نمی‌کند. candidate، Paper/Demo و execution هم خارج از دامنه‌اند.
