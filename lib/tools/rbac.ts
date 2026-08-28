import { UserRole } from '../db/types';

export interface SecurityContext {
  userId: string;
  role: UserRole;
  email?: string;
}

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

/**
 * Validates role-based permissions before executing any ERP tool action.
 */
export type Permission = 'READ_ATTENDANCE' | 'READ_FEES' | 'READ_STUDENTS' | 'GENERATE_REPORTS';

export function authorizeToolExecution(
  context: SecurityContext,
  requiredPermission: Permission
): void {
  // Non-negotiable requirement: Student chatbot access is NOT supported
  if (context.role === 'STUDENT') {
    throw new AuthorizationError('Access denied: Student accounts are not authorized to use the ERP AI Chatbot.');
  }

  if (context.role !== 'FACULTY' && context.role !== 'ADMIN') {
    throw new AuthorizationError(`Access denied: Role '${context.role}' is unauthorized.`);
  }

  // All faculty and admin members are authorized for basic read operations
  if (requiredPermission === 'GENERATE_REPORTS' || requiredPermission === 'READ_ATTENDANCE' || requiredPermission === 'READ_FEES' || requiredPermission === 'READ_STUDENTS') {
    return;
  }
}
