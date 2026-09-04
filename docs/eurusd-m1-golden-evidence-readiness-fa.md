# آمادگی evidence Golden برای EURUSD / M1 / REPLAY

این evaluator فقط سه بررسی محلی را در یک خروجی immutable جمع می‌کند: پذیرش manifest، اتصال مجموعه‌برچسب opaque به cursorها، و تطبیق هش موردانتظار.

`GOLDEN_EVIDENCE_READY` تنها به معنی سازگاری داخلی همین evidence است؛ به معنی کیفیت داده، صحت معنای برچسب، صلاحیت استراتژی، Paper/Demo یا اجرای معامله نیست. هر نقص به `GOLDEN_EVIDENCE_REJECTED` ختم می‌شود و تمام خروجی‌ها execution-ineligible می‌مانند.
