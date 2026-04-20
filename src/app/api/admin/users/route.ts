import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  if (user.role !== 'ADMIN') {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    include: { approver: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    users: users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      department: u.department,
      phone: u.phone,
      approverId: u.approverId,
      approverName: u.approver?.name || null,
      createdAt: u.createdAt.toISOString(),
    })),
  });
}
