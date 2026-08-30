import type { CandidateGrade, FeatureSnapshotPayload, TradeSide } from '@trade/contracts';
import { parseDecimal } from '@trade/contracts';

export interface GradingCriteria {
  side: TradeSide;
  calculatedRR: string;
  minRR: string;
  featureSnapshot: FeatureSnapshotPayload;
}

export class CandidateGrader {
  /**
   * Deterministically evaluates candidate quality and assigns a strict grade.
   */
  public static grade(criteria: GradingCriteria): { grade: CandidateGrade | 'REJECTED'; score: number; reason: string } {
    const { side, calculatedRR, minRR, featureSnapshot } = criteria;
    const rrDec = parseDecimal(calculatedRR);
    const minRRDec = parseDecimal(minRR);

    // 1. Mandatory Risk:Reward check (Fail-closed)
    if (rrDec.lt(minRRDec)) {
      return {
        grade: 'REJECTED',
        score: 0,
        reason: `Calculated R:R (${calculatedRR}) is below minimum required (${minRR})`
      };
    }

    // 2. Wide spread protection
    if (featureSnapshot.order_flow.spread_state === 'WIDE') {
      return {
        grade: 'REJECTED',
        score: 0,
        reason: 'Market spread is WIDE; entry rejected to avoid excessive execution cost'
      };
    }

    let score = 0;
    const reasons: string[] = [];

    // 3. SMC Confirmation scoring
    if (featureSnapshot.smc.displacement) {
      score += 1;
      reasons.push('Displacement confirmed');
    }

    if (featureSnapshot.smc.bos) {
      score += 1;
      reasons.push('BOS confirmed');
    }

    if (featureSnapshot.smc.fvg && !featureSnapshot.smc.fvg.mitigated) {
      const fvgType = featureSnapshot.smc.fvg.type;
      if ((side === 'BUY' && fvgType === 'BULLISH') || (side === 'SELL' && fvgType === 'BEARISH')) {
        score += 1;
        reasons.push(`Unmitigated ${fvgType} FVG`);
      }
    }

    if (featureSnapshot.smc.order_block && !featureSnapshot.smc.order_block.mitigated) {
      const obType = featureSnapshot.smc.order_block.type;
      if ((side === 'BUY' && obType === 'BULLISH') || (side === 'SELL' && obType === 'BEARISH')) {
        score += 1;
        reasons.push(`Unmitigated ${obType} Order Block`);
      }
    }

    if (featureSnapshot.smc.liquidity_sweep) {
      const sweepDir = featureSnapshot.smc.liquidity_sweep.direction;
      if ((side === 'BUY' && sweepDir === 'LOW') || (side === 'SELL' && sweepDir === 'HIGH')) {
        score += 1;
        reasons.push(`Liquidity Sweep (${sweepDir})`);
      }
    }

    // 4. Order flow alignment
    const cvdDec = parseDecimal(featureSnapshot.order_flow.cvd);
    if ((side === 'BUY' && cvdDec.gt(0)) || (side === 'SELL' && cvdDec.lt(0))) {
      score += 1;
      reasons.push('CVD alignment');
    }

    // 5. Grade assignment matching DEC-017 (A_PLUS, A, B, C)
    let grade: CandidateGrade | 'REJECTED' = 'REJECTED';
    if (score >= 5) {
      grade = 'A_PLUS';
    } else if (score >= 3) {
      grade = 'A';
    } else if (score >= 2) {
      grade = 'B';
    } else if (score >= 1) {
      grade = 'C';
    }

    return {
      grade,
      score,
      reason: reasons.join('; ') || 'Minimal setup criteria met'
    };
  }
}
