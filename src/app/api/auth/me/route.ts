import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const MOCK_USER_RESPONSE = {
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
};

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      if (process.env.MOCK_USER === 'true') {
        return NextResponse.json(MOCK_USER_RESPONSE);
      }
      return NextResponse.json({ user: null }, { status: 401 });
    }
    return NextResponse.json({ user });
  } catch {
    if (process.env.MOCK_USER === 'true') {
      return NextResponse.json(MOCK_USER_RESPONSE);
    }
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
