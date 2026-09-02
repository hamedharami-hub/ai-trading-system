# آمادگی PolicyGate و Risk پیش از Paper Entry محلی

این سند فقط قراردادهای readiness را ثبت می‌کند، نه policy rule یا risk calculation.

## شناسه‌های لازم

- `policyContractId`
- `policyEvidenceId`
- `riskContractId`
- `riskEvidenceId`

شناسه‌ها باید محلی، immutable و غیرخالی باشند. وجود آن‌ها به‌معنای approval policy یا محاسبهٔ risk نیست.

## Safe stop

تا زمان پذیرش جداگانهٔ policy rules و risk model، هر مجموعه—even با همهٔ identifierها—فقط `NO_TRADE` با `POLICY_RISK_NOT_APPROVED` برمی‌گرداند. شناسهٔ ناقص یا ناشناخته نیز fail-closed است.
