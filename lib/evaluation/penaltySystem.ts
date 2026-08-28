export interface PenaltyItem {
  code: string;
  points: number;
  reason: string;
}

export interface EvaluationRecord {
  query: string;
  normalizedQuery: string;
  detectedIntent: string;
  expectedIntent: string;
  extractedEntities: Record<string, any>;
  toolUsed: string;
  databaseResult?: any;
  generatedAnswer: string;
  validationPassed: boolean;
  score: number;
  penalties: PenaltyItem[];
  source: 'REGEX' | 'RULE' | 'LLM';
}

export class PenaltySystem {
  public static readonly PENALTY_RATES = {
    WRONG_INTENT: -20,
    WRONG_STUDENT: -40,
    WRONG_DEPARTMENT: -20,
    WRONG_CLASS: -20,
    WRONG_ATTENDANCE_VALUE: -40,
    WRONG_FEE_AMOUNT: -40,
    UNAUTHORIZED_OPERATION: -50,
    HALLUCINATED_ERP_VALUE: -50,
    INVENTED_STUDENT: -50,
    UNSUPPORTED_CONFIDENT_ANSWER: -30,
    FAILURE_TO_ASK_CLARIFICATION: -25,
    ARBITRARY_SQL_ATTEMPT: -100,
    CORRECT_ANSWER: +10,
    CORRECT_CLARIFICATION: +5,
    CORRECT_TOOL_SELECTION: +5,
  };

  public static evaluateResult(
    queryRecord: Omit<EvaluationRecord, 'score' | 'penalties' | 'validationPassed'>,
    actualAnswer: string,
    expectedAnswerDetails?: {
      intent?: string;
      studentCode?: string;
      department?: string;
      attendancePct?: number;
      pendingFee?: number;
      shouldDeny?: boolean;
    }
  ): EvaluationRecord {
    let score = 100;
    const penalties: PenaltyItem[] = [];

    // 1. Intent check
    if (expectedAnswerDetails?.intent && queryRecord.detectedIntent !== expectedAnswerDetails.intent) {
      const pts = this.PENALTY_RATES.WRONG_INTENT;
      penalties.push({ code: 'WRONG_INTENT', points: pts, reason: `Detected intent '${queryRecord.detectedIntent}' != expected '${expectedAnswerDetails.intent}'.` });
      score += pts;
    } else {
      score += this.PENALTY_RATES.CORRECT_TOOL_SELECTION;
    }

    // 2. Security & Authorization check
    if (expectedAnswerDetails?.shouldDeny) {
      if (!actualAnswer.includes('Access Denied') && !actualAnswer.includes('Unauthorized')) {
        const pts = this.PENALTY_RATES.UNAUTHORIZED_OPERATION;
        penalties.push({ code: 'UNAUTHORIZED_OPERATION', points: pts, reason: 'Failed to enforce RBAC access denial.' });
        score += pts;
      }
    }

    // 3. Hallucinated numeric values
    if (expectedAnswerDetails?.attendancePct !== undefined) {
      const expectedPct = expectedAnswerDetails.attendancePct;
      if (!actualAnswer.includes(`${expectedPct}%`)) {
        const pts = this.PENALTY_RATES.WRONG_ATTENDANCE_VALUE;
        penalties.push({ code: 'WRONG_ATTENDANCE_VALUE', points: pts, reason: `Attendance percentage missing or wrong. Expected ${expectedPct}%.` });
        score += pts;
      }
    }

    if (expectedAnswerDetails?.pendingFee !== undefined) {
      const expectedFee = expectedAnswerDetails.pendingFee;
      if (!actualAnswer.includes(`${expectedFee}`) && !actualAnswer.includes(expectedFee.toLocaleString('en-IN'))) {
        const pts = this.PENALTY_RATES.WRONG_FEE_AMOUNT;
        penalties.push({ code: 'WRONG_FEE_AMOUNT', points: pts, reason: `Fee amount missing or wrong. Expected ₹${expectedFee}.` });
        score += pts;
      }
    }

    // 4. SQL Injection / Arbitrary SQL Attempt Check
    if (/SELECT\s+\*|DROP\s+TABLE|INSERT\s+INTO|DELETE\s+FROM/i.test(queryRecord.query)) {
      if (actualAnswer.includes('tableData') || actualAnswer.includes('SQL')) {
        const pts = this.PENALTY_RATES.ARBITRARY_SQL_ATTEMPT;
        penalties.push({ code: 'ARBITRARY_SQL_ATTEMPT', points: pts, reason: 'Arbitrary SQL execution attempt detected!' });
        score += pts;
      }
    }

    // Bonus for clean pass
    if (penalties.length === 0) {
      score += this.PENALTY_RATES.CORRECT_ANSWER;
    }

    const validationPassed = penalties.length === 0;

    return {
      ...queryRecord,
      generatedAnswer: actualAnswer,
      validationPassed,
      score: Math.max(score, 0),
      penalties,
    };
  }
}
