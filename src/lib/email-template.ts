import type { DailyDetail } from '@/types';
import dayjs from 'dayjs';

interface EmailParams {
  month: string;
  dailyDetails: DailyDetail[];
  totalHotelFee: number;
  totalTransportFee: number;
  totalAmount: number;
  applicantName: string;
  approverName: string;
  teamName?: string;
  overtimeDays?: number;
}

function groupReasonsByDateRange(details: DailyDetail[]): string {
  const sorted = [...details].sort((a, b) => a.date.localeCompare(b.date));
  const groups: { start: string; end: string; reasons: Set<string> }[] = [];

  for (const d of sorted) {
    if (!d.reason) continue;
    const last = groups[groups.length - 1];
    const prevDate = last ? dayjs(last.end).add(1, 'day').format('YYYY-MM-DD') : null;

    if (last && d.date === prevDate && d.reason === [...last.reasons][0]) {
      last.end = d.date;
    } else if (last && d.date === prevDate) {
      last.end = d.date;
      last.reasons.add(d.reason);
    } else {
      groups.push({ start: d.date, end: d.date, reasons: new Set([d.reason]) });
    }
  }

  return groups.map(g => {
    const start = dayjs(g.start).format('M/D');
    const end = dayjs(g.end).format('M/D');
    const dateRange = start === end ? start : `${start}-${end}`;
    return `${dateRange}\n${[...g.reasons].join('\n')}`;
  }).join('\n');
}

export function generateEmailSubject(params: EmailParams): string {
  return `【报销申请】${params.applicantName} - ${params.month}月报销 - ${params.totalAmount}元`;
}

export function generateEmailBody(params: EmailParams): string {
  const {
    dailyDetails, totalHotelFee, totalTransportFee,
    applicantName, teamName, overtimeDays,
  } = params;

  const sorted = [...dailyDetails].sort((a, b) => a.date.localeCompare(b.date));
  const firstDate = sorted[0]?.date;
  const lastDate = sorted[sorted.length - 1]?.date;
  const dateRange = firstDate && lastDate
    ? `${dayjs(firstDate).format('YYYY/M/D')}-${dayjs(lastDate).format('YYYY/M/D')}`
    : '';

  const destinations = [...new Set(sorted.map(d => d.destination).filter(Boolean))].join('/');
  const totalDays = sorted.length;

  const reasonText = groupReasonsByDateRange(sorted);

  return `姓名：${applicantName}
团队：${teamName || '-'}
出差时间：${dateRange}
出差地点：${destinations}
出差总天数：${totalDays}天
非字节工区出差总天数：${totalDays}天
加班天数：${overtimeDays || 0}天
差旅往返交通总费用：${totalHotelFee}
差旅地住宿总费用：${totalTransportFee}
出差事由：${reasonText}`;
}

export function generateFullEmail(params: EmailParams): string {
  const subject = generateEmailSubject(params);
  const body = generateEmailBody(params);
  return `主题：${subject}\n\n${body}`;
}
