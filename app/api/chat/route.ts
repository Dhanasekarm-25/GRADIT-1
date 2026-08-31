import { NextRequest, NextResponse } from 'next/server';
import { runAgentWorkflow } from '@/lib/agent/graph';
import { SecurityContext } from '@/lib/tools/rbac';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, role = 'FACULTY', userId = 'usr-1', lastReportData, pendingQuery } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message text is required.' }, { status: 400 });
    }

    const securityContext: SecurityContext = {
      userId,
      role: role.toUpperCase(),
    };

    const agentResult = await runAgentWorkflow(message, securityContext, lastReportData, pendingQuery);

    return NextResponse.json(agentResult);
  } catch (err: any) {
    return NextResponse.json(
      {
        type: 'ERROR',
        content: err.message || 'An internal server error occurred.',
      },
      { status: 500 }
    );
  }
}
