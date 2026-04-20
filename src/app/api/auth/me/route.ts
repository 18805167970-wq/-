import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const tokenUser = await getCurrentUser();
  if (!tokenUser) {
    if (process.env.MOCK_USER === 'true') {
      return NextResponse.json({
        user: {
          id: 'mock-user-id',
          email: 'demo@example.com',
          name: '演示用户',
          role: 'ADMIN',
          department: '技术部',
          phone: null,
          approverId: null,
          approverName: null,
        },
      });
    }
    return NextResponse.json({ user: null }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: tokenUser.id },
      include: { approver: { select: { name: true } } },
    });

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        phone: user.phone,
        approverId: user.approverId,
        approverName: user.approver?.name || null,
      },
    });
  } catch {
    if (process.env.MOCK_USER === 'true') {
      return NextResponse.json({
        user: {
          id: 'mock-user-id',
          email: 'demo@example.com',
          name: '演示用户',
          role: 'ADMIN',
          department: '技术部',
          phone: null,
          approverId: null,
          approverName: null,
        },
      });
    }
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
