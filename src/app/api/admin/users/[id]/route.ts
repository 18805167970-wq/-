import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  if (user.role !== 'ADMIN') {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();

  const updateData: Record<string, unknown> = {};

  if (body.role && ['EMPLOYEE', 'APPROVER', 'ADMIN'].includes(body.role)) {
    updateData.role = body.role;
  }

  if (body.approverId !== undefined) {
    updateData.approverId = body.approverId || null;
  }

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
    include: { approver: { select: { name: true } } },
  });

  return NextResponse.json({
    message: '更新成功',
    user: {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role,
      approverId: updated.approverId,
      approverName: updated.approver?.name || null,
    },
  });
}
