export type Role = 'EMPLOYEE' | 'APPROVER' | 'ADMIN';

export type ReimbursementStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';

export type ApprovalStatus = 'APPROVED' | 'REJECTED';

export interface UserInfo {
  id: string;
  email: string;
  name: string;
  role: Role;
  department?: string | null;
  phone?: string | null;
  approverId?: string | null;
  approverName?: string | null;
}

export interface DailyDetail {
  date: string;
  destination: string;
  reason: string;
  transportTypes: string[];
  transportFee: number;
  hotelFee: number;
  remark?: string;
}

export interface ReimbursementFormData {
  month: string;
  dailyDetails: DailyDetail[];
}

export interface ReimbursementRecord {
  id: string;
  userId: string;
  userName?: string;
  month: string;
  totalHotelFee: number;
  totalTransportFee: number;
  totalAmount: number;
  status: ReimbursementStatus;
  emailContent?: string | null;
  createdAt: string;
  updatedAt: string;
  details?: DailyDetail[];
}

export interface ApprovalRecord {
  id: string;
  reimbursementId: string;
  approverId: string;
  approverName?: string;
  status: ApprovalStatus;
  comment?: string | null;
  createdAt: string;
  reimbursement?: ReimbursementRecord;
}

export const TRANSPORT_TYPES = ['高铁', '飞机', '自驾', '打车', '大巴'] as const;

export const STATUS_LABELS: Record<ReimbursementStatus, string> = {
  PENDING: '待审批',
  APPROVED: '已通过',
  REJECTED: '已驳回',
  WITHDRAWN: '已撤回',
};

export const STATUS_COLORS: Record<ReimbursementStatus, string> = {
  PENDING: 'processing',
  APPROVED: 'success',
  REJECTED: 'error',
  WITHDRAWN: 'default',
};
