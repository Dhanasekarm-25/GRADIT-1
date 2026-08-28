export interface ResultValidationReport {
  passed: boolean;
  mismatches: string[];
}

export class ResultValidator {
  /**
   * Stage 2: Compares factual values in LLM response text against authoritative DB result data.
   */
  public static validateAnswer(generatedText: string, verifiedDbData: any): ResultValidationReport {
    const mismatches: string[] = [];

    if (!verifiedDbData) {
      return { passed: true, mismatches: [] };
    }

    // 1. Single student attendance percentage check
    if (typeof verifiedDbData.percentage === 'number') {
      const dbPct = verifiedDbData.percentage;
      const regex = /(\d{1,3})%/g;
      let match: RegExpExecArray | null;
      let foundMatchingPct = false;

      while ((match = regex.exec(generatedText)) !== null) {
        const textPct = parseInt(match[1], 10);
        if (textPct === dbPct) {
          foundMatchingPct = true;
          break;
        }
      }

      if (!foundMatchingPct && generatedText.includes('%')) {
        mismatches.push(`Attendance percentage hallucinated in answer. DB=${dbPct}%, Answer contained conflicting percentage.`);
      }
    }

    // 2. Financial fee amount check
    if (typeof verifiedDbData.pendingAmount === 'number') {
      const dbPending = verifiedDbData.pendingAmount;
      if (dbPending > 0) {
        const pendingStr = dbPending.toString();
        if (!generatedText.includes(pendingStr) && !generatedText.includes(dbPending.toLocaleString('en-IN'))) {
          mismatches.push(`Pending fee amount mismatch. Expected ₹${dbPending}, LLM response did not contain correct amount.`);
        }
      }
    }

    // 3. Student Code check
    if (verifiedDbData.studentCode) {
      const code = verifiedDbData.studentCode.toUpperCase();
      if (!generatedText.toUpperCase().includes(code)) {
        mismatches.push(`Student Code missing or mismatched. Expected ${code}.`);
      }
    }

    return {
      passed: mismatches.length === 0,
      mismatches,
    };
  }
}
