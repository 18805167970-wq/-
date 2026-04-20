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

  const subordinates = await prisma.user.findMany({
    where: { approverId: user.id },
    select: { id: true },
  });

  const subordinateIds = subordinates.map(s => s.id);

  const reimbursements = await prisma.reimbursement.findMany({
    where: {
      userId: { in: subordinateIds },
      status: 'PENDING',
    },
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true, department: true } },
      details: { orderBy: { date: 'asc' } },
    },
  });

  return NextResponse.json({
    reimbursements: reimbursements.map(r => ({
      id: r.id,
      userId: r.userId,
      userName: r.user.name,
      month: r.month,
      totalHotelFee: Number(r.totalHotelFee),
      totalTransportFee: Number(r.totalTransportFee),
      totalAmount: Number(r.totalAmount),
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      details: r.details.map(d => ({
        date: d.date.toISOString().split('T')[0],
        destination: d.destination,
        reason: d.reason,
        transportTypes: d.transportTypes.split(','),
        transportFee: Number(d.transportFee),
        hotelFee: Number(d.hotelFee),
        remark: d.remark,
      })),
    })),
  });
}
