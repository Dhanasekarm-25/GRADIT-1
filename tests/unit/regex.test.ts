import { describe, it, expect } from 'vitest';
import { RegexLibrary } from '../../lib/agent/regexLibrary';

describe('RegexLibrary Concatenated Input & Typo Engine', () => {
  it('should parse concatenated query "ATTENDANCE23CS101" correctly', () => {
    const result = RegexLibrary.parse('ATTENDANCE23CS101');
    expect(result.intent).toBe('ATTENDANCE_STUDENT');
    expect(result.params.studentCode).toBe('23CS101');
  });

  it('should parse concatenated fee query "FEE23CS101" or "FEES23CS101"', () => {
    const res1 = RegexLibrary.parse('FEE23CS101');
    const res2 = RegexLibrary.parse('FEES23CS101');
    expect(res1.intent).toBe('FEES_STUDENT');
    expect(res1.params.studentCode).toBe('23CS101');
    expect(res2.intent).toBe('FEES_STUDENT');
    expect(res2.params.studentCode).toBe('23CS101');
  });

  it('should correct spelling typos like "atendence of 23CS101"', () => {
    const result = RegexLibrary.parse('atendence of 23CS101');
    expect(result.intent).toBe('ATTENDANCE_STUDENT');
    expect(result.params.studentCode).toBe('23CS101');
  });

  it('should handle concatenated "PENDINGFEES" and "LOWATTENDANCE CSE"', () => {
    const r1 = RegexLibrary.parse('PENDINGFEES');
    const r2 = RegexLibrary.parse('LOWATTENDANCE CSE');

    expect(r1.intent).toBe('PENDING_FEES');
    expect(r2.intent).toBe('LOW_ATTENDANCE');
    expect(r2.params.departmentIdentifier).toBe('CSE');
  });

  it('should handle missing spaces and non-alphanumeric punctuation e.g. "attendance-23CS101"', () => {
    const res = RegexLibrary.parse('attendance-23CS101');
    expect(res.intent).toBe('ATTENDANCE_STUDENT');
    expect(res.params.studentCode).toBe('23CS101');
  });
});
