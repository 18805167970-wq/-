import type { DailyDetail } from '@/types';

interface EmailParams {
  month: string;
  dailyDetails: DailyDetail[];
  totalHotelFee: number;
  totalTransportFee: number;
  totalAmount: number;
  applicantName: string;
  approverName: string;
}

export function generateEmailSubject(params: EmailParams): string {
  return `【报销申请】${params.applicantName} - ${params.month}月报销 - ${params.totalAmount}元`;
}

export function generateEmailBody(params: EmailParams): string {
  const { month, dailyDetails, totalHotelFee, totalTransportFee, totalAmount, applicantName, approverName } = params;
  const applyDate = new Date().toLocaleDateString('zh-CN');

  const detailRows = dailyDetails
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(d => `    ${d.date}  ${d.destination}  ${d.reason}  ${d.transportTypes.join(',')}  ${d.transportFee}元  ${d.hotelFee}元  ${d.remark || ''}`)
    .join('\n');

  return `尊敬的 ${approverName}：

    您好！以下为我 ${month} 的出差报销明细，请您审批：

    日期          出差地    出差原因    交通方式      交通费    住宿费    备注
${detailRows}

    ——————————————
    住宿费总额：${totalHotelFee} 元
    交通费总额：${totalTransportFee} 元
    报销总额：${totalAmount} 元

    谢谢！

此致
${applicantName}
${applyDate}`;
}

export function generateFullEmail(params: EmailParams): string {
  const subject = generateEmailSubject(params);
  const body = generateEmailBody(params);
  return `主题：${subject}\n\n正文：\n${body}`;
}
