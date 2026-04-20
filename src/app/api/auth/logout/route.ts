import { NextResponse } from 'next/server';
import { removeAuthCookie } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST() {
  await removeAuthCookie();
  return NextResponse.json({ message: '已退出登录' });
}
