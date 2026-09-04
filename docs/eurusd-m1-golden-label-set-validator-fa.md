# اعتبارسنجی مجموعه‌برچسب Golden برای EURUSD / M1 / REPLAY

این مرز فقط اتصال یک مجموعه‌برچسب ازپیش‌داده‌شدهٔ مالک به manifest محلی Golden Dataset را بررسی می‌کند.

- manifest باید با validator پیشین پذیرفته شود.
- `ownerLabelSetId` مجموعه باید دقیقاً با manifest برابر باشد.
- برای هر cursor ثبت‌شده در manifest دقیقاً یک برچسب opaque، با `labelId` غیرخالی و یکتا، و با همان ترتیب لازم است.
- این validator معنی، صحت بازار، کیفیت یا سودآوری برچسب را ارزیابی یا تولید نمی‌کند.
- ردشدن manifest، هویت، تعداد، شناسه یا cursor به‌صورت fail-closed رد می‌شود.

هیچ داده یا برچسبی ایجاد، تغییر، ذخیره، یا منتقل نمی‌شود. خروجی همیشه execution-ineligible است و هیچ StrategyCandidate، grade، entry، Paper/Demo artifact، OrderIntent، درخواست خارجی یا قابلیت اجرا نمی‌سازد.
