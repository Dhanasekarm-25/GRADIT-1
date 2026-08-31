import { generateGoldenDataset, GoldenTestCase } from './goldenDataset';
import { DeterministicQueryClassifier } from '../query-understanding/classifier';
import { runAgentWorkflow } from '../agent/graph';
import { PenaltySystem } from './penaltySystem';
import { SecurityContext } from '../tools/rbac';

export interface EvaluationMetricsSummary {
  totalQueries: number;
  passedQueries: number;
  failedQueries: number;
  intentAccuracy: number;
  entityExtractionAccuracy: number;
  clarificationAccuracy: number;
  noMatchAccuracy: number;
  hallucinationRate: number;
  llmFallbackRate: number;
  averageLatencyMs: number;
  totalPenaltyScore: number;
  categoryBreakdown: Record<
    string,
    {
      total: number;
      passed: number;
      accuracy: number;
    }
  >;
}

export class MasterEvaluator {
  public static async runEvaluation(): Promise<EvaluationMetricsSummary> {
    const dataset = generateGoldenDataset();
    const facultyContext: SecurityContext = { userId: 'usr-1', role: 'FACULTY' };

    let passed = 0;
    let correctIntents = 0;
    let correctEntities = 0;
    let correctClarifications = 0;
    let correctNoMatches = 0;
    let hallucinations = 0;
    let llmFallbacks = 0;
    let totalLatency = 0;
    let totalScore = 0;

    const categoryStats: Record<string, { total: number; passed: number; failedSamples?: any[] }> = {};

    for (const tc of dataset) {
      if (!categoryStats[tc.category]) {
        categoryStats[tc.category] = { total: 0, passed: 0, failedSamples: [] };
      }
      categoryStats[tc.category].total++;

      const start = Date.now();
      const parsed = DeterministicQueryClassifier.classify(tc.input);
      const res = await runAgentWorkflow(tc.input, facultyContext);
      const latency = Date.now() - start;
      totalLatency += latency;

      // 1. Intent check
      const intentMatched =
        parsed.intent === tc.expectedIntent ||
        ((tc.expectedIntent === 'STUDENT_DETAILS' || tc.expectedIntent === 'STUDENT_SEARCH') &&
          (parsed.intent === 'STUDENT_DETAILS' || parsed.intent === 'STUDENT_SEARCH')) ||
        (tc.expectedOutcome === 'CLARIFICATION' &&
          (parsed.intent === 'BARE_ENTITY' ||
            parsed.intent === 'MULTI_INTENT' ||
            parsed.intent === 'STUDENT_DETAILS' ||
            parsed.intent === 'REPORT_REQUEST'));

      if (intentMatched) {
        correctIntents++;
        totalScore += PenaltySystem.PENALTY_RATES.CORRECT_INTENT;
      } else {
        totalScore += PenaltySystem.PENALTY_RATES.WRONG_INTENT;
      }

      // 2. Entity check
      const entityMatched =
        !tc.expectedEntity ||
        (parsed.studentName && parsed.studentName.toLowerCase().includes(tc.expectedEntity.toLowerCase())) ||
        (parsed.department && parsed.department.toUpperCase() === tc.expectedEntity.toUpperCase()) ||
        (parsed.classId && parsed.classId.toUpperCase() === tc.expectedEntity.toUpperCase());

      if (entityMatched) {
        correctEntities++;
        totalScore += PenaltySystem.PENALTY_RATES.CORRECT_ENTITY_EXTRACTION;
      } else {
        totalScore += PenaltySystem.PENALTY_RATES.WRONG_ENTITY;
      }

      // 3. Outcome check
      let outcomeMatched = false;
      if (tc.expectedOutcome === 'CLARIFICATION') {
        outcomeMatched = res.type === 'CLARIFICATION' || res.content.includes('What would you like') || res.content.includes('multiple students');
        if (outcomeMatched) correctClarifications++;
      } else if (tc.expectedOutcome === 'ENTITY_NOT_FOUND') {
        outcomeMatched = res.content.toLowerCase().includes("couldn't find a student matching");
        if (outcomeMatched) correctNoMatches++;
      } else if (tc.expectedOutcome === 'UNSUPPORTED_INTENT') {
        outcomeMatched = res.content.includes('I can help with') || res.content.includes('refine your query');
        if (outcomeMatched) correctNoMatches++;
      } else {
        // SUCCESS
        outcomeMatched = res.type === 'TEXT' || (res.type as string) === 'LIST' || res.type === 'REPORT_READY';
      }

      // Hallucination check
      if (tc.expectedOutcome === 'ENTITY_NOT_FOUND' && (res.content.includes('85,000') || res.content.includes('82%'))) {
        hallucinations++;
        totalScore += PenaltySystem.PENALTY_RATES.HALLUCINATED_FEE_VALUE;
      }

      if (parsed.source === 'LLM') {
        llmFallbacks++;
      }

      if (intentMatched && outcomeMatched) {
        passed++;
        categoryStats[tc.category].passed++;
      } else {
        if (!categoryStats[tc.category].failedSamples) {
          categoryStats[tc.category].failedSamples = [];
        }
        if (categoryStats[tc.category].failedSamples!.length < 3) {
          categoryStats[tc.category].failedSamples!.push({
            input: tc.input,
            expectedIntent: tc.expectedIntent,
            actualIntent: parsed.intent,
            expectedOutcome: tc.expectedOutcome,
            actualResType: res.type,
            resContent: res.content.substring(0, 80),
          });
        }
      }
    }

    const total = dataset.length;
    const categoryBreakdown: Record<
      string,
      {
        total: number;
        passed: number;
        accuracy: number;
        failedSamples?: any[];
      }
    > = {};
    for (const [cat, stats] of Object.entries(categoryStats)) {
      categoryBreakdown[cat] = {
        total: stats.total,
        passed: stats.passed,
        accuracy: Math.round((stats.passed / stats.total) * 10000) / 100,
        failedSamples: (stats as any).failedSamples,
      };
    }

    return {
      totalQueries: total,
      passedQueries: passed,
      failedQueries: total - passed,
      intentAccuracy: Math.round((correctIntents / total) * 10000) / 100,
      entityExtractionAccuracy: Math.round((correctEntities / total) * 10000) / 100,
      clarificationAccuracy: Math.round((correctClarifications / Math.max(1, dataset.filter((t) => t.expectedOutcome === 'CLARIFICATION').length)) * 10000) / 100,
      noMatchAccuracy: Math.round((correctNoMatches / Math.max(1, dataset.filter((t) => t.expectedOutcome === 'ENTITY_NOT_FOUND' || t.expectedOutcome === 'UNSUPPORTED_INTENT').length)) * 10000) / 100,
      hallucinationRate: Math.round((hallucinations / total) * 10000) / 100,
      llmFallbackRate: Math.round((llmFallbacks / total) * 10000) / 100,
      averageLatencyMs: Math.round((totalLatency / total) * 100) / 100,
      totalPenaltyScore: totalScore,
      categoryBreakdown,
    };
  }
}
