import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, generateToken, setAuthCookie } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: '请填写邮箱和密码' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { approver: { select: { name: true } } },
    });

    if (!user) {
      return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 });
    }

    const userInfo = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      phone: user.phone,
      approverId: user.approverId,
      approverName: user.approver?.name || null,
    };

    const token = generateToken(userInfo);
    await setAuthCookie(token);

    return NextResponse.json({ message: '登录成功', user: userInfo });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: '登录失败，请稍后重试' }, { status: 500 });
  }
}
