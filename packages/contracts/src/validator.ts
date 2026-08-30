import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

import primitivesSchema from './schemas/primitives.json' with { type: 'json' };
import envelopeSchema from './schemas/envelope.json' with { type: 'json' };
import marketEventSchema from './schemas/events/market-event.json' with { type: 'json' };
import featureSnapshotSchema from './schemas/events/feature-snapshot.json' with { type: 'json' };
import strategyCandidateSchema from './schemas/events/strategy-candidate.json' with { type: 'json' };
import analystProposalSchema from './schemas/events/analyst-proposal.json' with { type: 'json' };
import criticProposalSchema from './schemas/events/critic-proposal.json' with { type: 'json' };
import judgeDecisionSchema from './schemas/events/judge-decision.json' with { type: 'json' };
import policyDecisionSchema from './schemas/events/policy-decision.json' with { type: 'json' };
import riskDecisionSchema from './schemas/events/risk-decision.json' with { type: 'json' };
import orderIntentSchema from './schemas/events/order-intent.json' with { type: 'json' };
import executionReportSchema from './schemas/events/execution-report.json' with { type: 'json' };
import auditEventSchema from './schemas/events/audit-event.json' with { type: 'json' };

// Instantiate strict 2020-12 Ajv instance
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ajv = new (Ajv2020 as unknown as new (opts: Record<string, unknown>) => any)({
  allErrors: true,
  strict: true,
  strictSchema: false,
  coerceTypes: false,
  removeAdditional: false,
  allowUnionTypes: true
});

(addFormats as unknown as (a: unknown) => void)(ajv);

// Register schemas
ajv.addSchema(primitivesSchema, 'https://trading.system/schemas/primitives.json');
ajv.addSchema(envelopeSchema, 'https://trading.system/schemas/envelope.json');
ajv.addSchema(marketEventSchema, 'https://trading.system/schemas/events/market-event.json');
ajv.addSchema(featureSnapshotSchema, 'https://trading.system/schemas/events/feature-snapshot.json');
ajv.addSchema(strategyCandidateSchema, 'https://trading.system/schemas/events/strategy-candidate.json');
ajv.addSchema(analystProposalSchema, 'https://trading.system/schemas/events/analyst-proposal.json');
ajv.addSchema(criticProposalSchema, 'https://trading.system/schemas/events/critic-proposal.json');
ajv.addSchema(judgeDecisionSchema, 'https://trading.system/schemas/events/judge-decision.json');
ajv.addSchema(policyDecisionSchema, 'https://trading.system/schemas/events/policy-decision.json');
ajv.addSchema(riskDecisionSchema, 'https://trading.system/schemas/events/risk-decision.json');
ajv.addSchema(orderIntentSchema, 'https://trading.system/schemas/events/order-intent.json');
ajv.addSchema(executionReportSchema, 'https://trading.system/schemas/events/execution-report.json');
ajv.addSchema(auditEventSchema, 'https://trading.system/schemas/events/audit-event.json');

const schemaMap: Record<string, string> = {
  MARKET_EVENT: 'https://trading.system/schemas/events/market-event.json',
  FEATURE_SNAPSHOT: 'https://trading.system/schemas/events/feature-snapshot.json',
  STRATEGY_CANDIDATE: 'https://trading.system/schemas/events/strategy-candidate.json',
  ANALYST_PROPOSAL: 'https://trading.system/schemas/events/analyst-proposal.json',
  CRITIC_PROPOSAL: 'https://trading.system/schemas/events/critic-proposal.json',
  JUDGE_DECISION: 'https://trading.system/schemas/events/judge-decision.json',
  POLICY_DECISION: 'https://trading.system/schemas/events/policy-decision.json',
  RISK_DECISION: 'https://trading.system/schemas/events/risk-decision.json',
  ORDER_INTENT: 'https://trading.system/schemas/events/order-intent.json',
  EXECUTION_REPORT: 'https://trading.system/schemas/events/execution-report.json',
  AUDIT_EVENT: 'https://trading.system/schemas/events/audit-event.json'
};

export interface ValidationResult {
  valid: boolean;
  errors?: string[] | undefined;
}

/**
 * Validates generic EventEnvelope structure.
 */
export function validateEnvelope(data: unknown): ValidationResult {
  const validate = ajv.getSchema('https://trading.system/schemas/envelope.json');
  if (!validate) throw new Error('Envelope schema not registered');

  const valid = Boolean(validate(data));
  if (!valid && validate.errors) {
    return {
      valid: false,
      errors: validate.errors.map((e: { instancePath?: string; message?: string }) => `${e.instancePath || 'root'}: ${e.message}`)
    };
  }
  return { valid: true };
}

/**
 * Validates event payload against its specific schema.
 */
export function validatePayload(eventType: string, payload: unknown): ValidationResult {
  const schemaId = schemaMap[eventType];
  if (!schemaId) {
    return {
      valid: false,
      errors: [`Unknown or unsupported eventType: "${eventType}"`]
    };
  }

  const validate = ajv.getSchema(schemaId);
  if (!validate) throw new Error(`Schema not found for ${eventType}`);

  const valid = Boolean(validate(payload));
  if (!valid && validate.errors) {
    return {
      valid: false,
      errors: validate.errors.map((e: { instancePath?: string; message?: string }) => `${e.instancePath || 'root'}: ${e.message}`)
    };
  }
  return { valid: true };
}

/**
 * Performs full validation of an event: validates the envelope and then the payload.
 */
export function validateFullEvent(data: unknown): ValidationResult {
  const envRes = validateEnvelope(data);
  if (!envRes.valid) {
    return envRes;
  }

  const record = data as { event_type: string; payload: unknown };
  const payloadRes = validatePayload(record.event_type, record.payload);
  if (!payloadRes.valid) {
    return {
      valid: false,
      errors: payloadRes.errors?.map((err) => `payload.${err}`) ?? ['Invalid payload']
    };
  }

  return { valid: true };
}

export { ajv };
