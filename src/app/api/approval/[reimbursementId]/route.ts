import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: Promise<{ reimbursementId: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  if (user.role !== 'APPROVER' && user.role !== 'ADMIN') {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  const { reimbursementId } = await params;
  const { status, comment } = await request.json();

  if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
    return NextResponse.json({ error: '无效的审批状态' }, { status: 400 });
  }

  const reimbursement = await prisma.reimbursement.findUnique({ where: { id: reimbursementId } });

  if (!reimbursement) {
    return NextResponse.json({ error: '报销单不存在' }, { status: 404 });
  }

  if (reimbursement.status !== 'PENDING') {
    return NextResponse.json({ error: '该报销单不在待审批状态' }, { status: 400 });
  }

  const applicant = await prisma.user.findUnique({ where: { id: reimbursement.userId } });
  if (applicant?.approverId !== user.id) {
    return NextResponse.json({ error: '您不是该报销单的审批人' }, { status: 403 });
  }

  await prisma.$transaction([
    prisma.approval.create({
      data: {
        reimbursementId,
        approverId: user.id,
        status,
        comment: comment || null,
      },
    }),
    prisma.reimbursement.update({
      where: { id: reimbursementId },
      data: { status: status === 'APPROVED' ? 'APPROVED' : 'REJECTED' },
    }),
  ]);

  return NextResponse.json({
    message: status === 'APPROVED' ? '已通过' : '已驳回',
  });
}
