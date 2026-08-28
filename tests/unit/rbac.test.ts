import { describe, it, expect } from 'vitest';
import { runAgentWorkflow } from '../../lib/agent/graph';
import { authorizeToolExecution, SecurityContext, AuthorizationError } from '../../lib/tools/rbac';

describe('Security and RBAC Verification', () => {
  it('should explicitly block STUDENT access to chatbot workflow', async () => {
    const studentContext: SecurityContext = { userId: 'usr-3', role: 'STUDENT' };
    const response = await runAgentWorkflow('Show attendance of 23CS101', studentContext);
    expect(response.type).toBe('ERROR');
    expect(response.content).toContain('Access Denied');
  });

  it('should throw AuthorizationError when student role invokes tool directly', () => {
    const studentContext: SecurityContext = { userId: 'usr-3', role: 'STUDENT' };
    expect(() => authorizeToolExecution(studentContext, 'READ_ATTENDANCE')).toThrowError(AuthorizationError);
  });

  it('should allow FACULTY role to execute queries', () => {
    const facultyContext: SecurityContext = { userId: 'usr-1', role: 'FACULTY' };
    expect(() => authorizeToolExecution(facultyContext, 'READ_ATTENDANCE')).not.toThrow();
  });

  it('should allow ADMIN role to execute queries', () => {
    const adminContext: SecurityContext = { userId: 'usr-2', role: 'ADMIN' };
    expect(() => authorizeToolExecution(adminContext, 'READ_FEES')).not.toThrow();
  });
});
