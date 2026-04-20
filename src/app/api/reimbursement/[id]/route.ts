import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { id } = await params;

  const reimbursement = await prisma.reimbursement.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true, department: true } },
      details: { orderBy: { date: 'asc' } },
      approvals: {
        include: { approver: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!reimbursement) {
    return NextResponse.json({ error: '报销单不存在' }, { status: 404 });
  }

  return NextResponse.json({
    reimbursement: {
      id: reimbursement.id,
      userId: reimbursement.userId,
      userName: reimbursement.user.name,
      month: reimbursement.month,
      totalHotelFee: Number(reimbursement.totalHotelFee),
      totalTransportFee: Number(reimbursement.totalTransportFee),
      totalAmount: Number(reimbursement.totalAmount),
      status: reimbursement.status,
      emailContent: reimbursement.emailContent,
      createdAt: reimbursement.createdAt.toISOString(),
      updatedAt: reimbursement.updatedAt.toISOString(),
      user: reimbursement.user,
      details: reimbursement.details.map(d => ({
        date: d.date.toISOString().split('T')[0],
        destination: d.destination,
        reason: d.reason,
        transportTypes: d.transportTypes.split(','),
        transportFee: Number(d.transportFee),
        hotelFee: Number(d.hotelFee),
        remark: d.remark,
      })),
      approvals: reimbursement.approvals.map(a => ({
        id: a.id,
        status: a.status,
        comment: a.comment,
        createdAt: a.createdAt.toISOString(),
        approver: a.approver,
      })),
    },
  });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const reimbursement = await prisma.reimbursement.findUnique({ where: { id } });

  if (!reimbursement) {
    return NextResponse.json({ error: '报销单不存在' }, { status: 404 });
  }

  if (reimbursement.userId !== user.id) {
    return NextResponse.json({ error: '无权操作' }, { status: 403 });
  }

  if (body.status === 'WITHDRAWN') {
    if (reimbursement.status !== 'PENDING') {
      return NextResponse.json({ error: '只能撤回待审批的报销单' }, { status: 400 });
    }

    await prisma.reimbursement.update({
      where: { id },
      data: { status: 'WITHDRAWN' },
    });

    return NextResponse.json({ message: '已撤回' });
  }

  return NextResponse.json({ error: '不支持的操作' }, { status: 400 });
}
