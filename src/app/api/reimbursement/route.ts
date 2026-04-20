import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { generateFullEmail } from '@/lib/email-template';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const reimbursements = await prisma.reimbursement.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true } },
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
      emailContent: r.emailContent,
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

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
    const { month, dailyDetails, teamName, overtimeDays } = await request.json();

    if (!month || !dailyDetails || dailyDetails.length === 0) {
      return NextResponse.json({ error: '请至少选择一天出差日期并填写明细' }, { status: 400 });
    }

    let totalHotelFee = 0;
    let totalTransportFee = 0;
    for (const d of dailyDetails) {
      totalHotelFee += Number(d.hotelFee) || 0;
      totalTransportFee += Number(d.transportFee) || 0;
    }
    const totalAmount = totalHotelFee + totalTransportFee;

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { approver: { select: { name: true } } },
    });

    const emailContent = generateFullEmail({
      month,
      dailyDetails,
      totalHotelFee,
      totalTransportFee,
      totalAmount,
      applicantName: user.name,
      approverName: dbUser?.approver?.name || '审批人',
      teamName: teamName || '',
      overtimeDays: overtimeDays || 0,
    });

    const reimbursement = await prisma.reimbursement.create({
      data: {
        userId: user.id,
        month,
        totalHotelFee,
        totalTransportFee,
        totalAmount,
        emailContent,
        details: {
          create: dailyDetails.map((d: { date: string; destination: string; reason: string; transportTypes: string[]; transportFee: number; hotelFee: number; remark?: string }) => ({
            date: new Date(d.date),
            destination: d.destination,
            reason: d.reason,
            transportTypes: d.transportTypes.join(','),
            transportFee: d.transportFee,
            hotelFee: d.hotelFee,
            remark: d.remark || null,
          })),
        },
      },
      include: { details: true },
    });

    return NextResponse.json({
      message: '报销申请提交成功',
      reimbursement: {
        id: reimbursement.id,
        month: reimbursement.month,
        totalHotelFee: Number(reimbursement.totalHotelFee),
        totalTransportFee: Number(reimbursement.totalTransportFee),
        totalAmount: Number(reimbursement.totalAmount),
        emailContent: reimbursement.emailContent,
      },
    });
  } catch (error) {
    console.error('Create reimbursement error:', error);
    return NextResponse.json({ error: '提交失败，请稍后重试' }, { status: 500 });
  }
}
