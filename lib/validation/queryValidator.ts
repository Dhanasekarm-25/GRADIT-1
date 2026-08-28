import { ERPQuery } from '../query-understanding/types';
import { SecurityContext, authorizeToolExecution, Permission } from '../tools/rbac';

export interface QueryValidationResult {
  valid: boolean;
  reason?: string;
  requiredPermission?: Permission;
}

export class QueryValidator {
  /**
   * Stage 1: Validates query structure, threshold boundaries, and RBAC authorization.
   */
  public static validate(query: ERPQuery, securityContext: SecurityContext): QueryValidationResult {
    // 1. RBAC check
    if (securityContext.role === 'STUDENT') {
      return {
        valid: false,
        reason: 'Access Denied: Student accounts are not permitted to access the ERP AI Chatbot.',
      };
    }

    // 2. Threshold boundary validation
    if (query.threshold !== undefined) {
      if (query.threshold < 0 || query.threshold > 100) {
        return {
          valid: false,
          reason: `Invalid attendance threshold: ${query.threshold}%. Must be between 0% and 100%.`,
        };
      }
    }

    // 3. Semester boundary validation
    if (query.semester !== undefined) {
      if (query.semester < 1 || query.semester > 8) {
        return {
          valid: false,
          reason: `Invalid semester: ${query.semester}. Must be between S1 and S8.`,
        };
      }
    }

    // 4. Intent Permission Mapping
    let requiredPermission: Permission = 'READ_ATTENDANCE';
    if (query.intent.startsWith('FEES_') || query.intent === 'PENDING_FEES') {
      requiredPermission = 'READ_FEES';
    } else if (query.intent === 'STUDENTS_LIST' || query.intent.startsWith('STUDENT_')) {
      requiredPermission = 'READ_STUDENTS';
    } else if (query.intent === 'REPORT_REQUEST') {
      requiredPermission = 'GENERATE_REPORTS';
    }

    try {
      authorizeToolExecution(securityContext, requiredPermission);
    } catch (err: any) {
      return {
        valid: false,
        reason: err.message || 'Unauthorized operation.',
        requiredPermission,
      };
    }

    return { valid: true, requiredPermission };
  }
}
