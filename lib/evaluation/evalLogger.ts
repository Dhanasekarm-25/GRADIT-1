import { EvaluationRecord } from './penaltySystem';

export class EvaluationLogger {
  private records: EvaluationRecord[] = [];

  public log(record: EvaluationRecord): void {
    this.records.push(record);
  }

  public getSummaryReport(): {
    totalTests: number;
    passed: number;
    failed: number;
    averageScore: number;
    llmCallsAvoided: number;
    regexAccuracyPct: number;
    criticalFailures: number;
    penaltiesBreakdown: Record<string, number>;
  } {
    const totalTests = this.records.length;
    const passed = this.records.filter((r) => r.validationPassed).length;
    const failed = totalTests - passed;
    const totalScore = this.records.reduce((acc, r) => acc + r.score, 0);
    const averageScore = totalTests > 0 ? Math.round((totalScore / totalTests) * 10) / 10 : 0;
    const llmCallsAvoided = this.records.filter((r) => r.source === 'REGEX' || r.source === 'RULE').length;
    const regexAccuracyPct = totalTests > 0 ? Math.round((llmCallsAvoided / totalTests) * 100) : 0;

    const penaltiesBreakdown: Record<string, number> = {};
    let criticalFailures = 0;

    for (const r of this.records) {
      for (const p of r.penalties) {
        penaltiesBreakdown[p.code] = (penaltiesBreakdown[p.code] || 0) + 1;
        if (['UNAUTHORIZED_OPERATION', 'ARBITRARY_SQL_ATTEMPT', 'HALLUCINATED_ERP_VALUE'].includes(p.code)) {
          criticalFailures++;
        }
      }
    }

    return {
      totalTests,
      passed,
      failed,
      averageScore,
      llmCallsAvoided,
      regexAccuracyPct,
      criticalFailures,
      penaltiesBreakdown,
    };
  }

  public printFormattedReport(): string {
    const summary = this.getSummaryReport();

    return `
====================================================
GRADit! ERP AI Chatbot — Evaluation & Penalty Report
====================================================
Total Test Queries:       ${summary.totalTests}
Passed:                   ${summary.passed}
Failed:                   ${summary.failed}
Average Score:            ${summary.averageScore} / 100
LLM Calls Avoided:        ${summary.llmCallsAvoided} (${summary.regexAccuracyPct}%)
Critical Security Mismatches: ${summary.criticalFailures}

Penalties Breakdown:
${Object.entries(summary.penaltiesBreakdown)
  .map(([code, count]) => `  - ${code}: ${count}`)
  .join('\n') || '  (No penalties recorded)'}
====================================================
`;
  }
}
