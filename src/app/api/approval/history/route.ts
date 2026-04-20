import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  if (user.role !== 'APPROVER' && user.role !== 'ADMIN') {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  const approvals = await prisma.approval.findMany({
    where: { approverId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      reimbursement: {
        include: { user: { select: { name: true } } },
      },
      approver: { select: { name: true } },
    },
  });

  return NextResponse.json({
    approvals: approvals.map(a => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
      reimbursement: {
        id: a.reimbursement.id,
        month: a.reimbursement.month,
        totalAmount: Number(a.reimbursement.totalAmount),
        status: a.reimbursement.status,
        userName: a.reimbursement.user.name,
      },
    })),
  });
}
