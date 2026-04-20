'use client';

import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Typography } from 'antd';
import MainLayout from '@/components/Layout/MainLayout';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';

const { Title } = Typography;

interface ApprovalHistoryRecord {
  id: string;
  status: string;
  comment?: string | null;
  createdAt: string;
  reimbursement: {
    id: string;
    month: string;
    totalAmount: number;
    status: string;
    userName: string;
  };
}

export default function ApprovalHistoryPage() {
  const [data, setData] = useState<ApprovalHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/approval/history')
      .then(res => res.json())
      .then(d => { if (d.approvals) setData(d.approvals); })
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { title: '申请人', key: 'userName', width: 100, render: (_: unknown, record: ApprovalHistoryRecord) => record.reimbursement.userName },
    { title: '月份', key: 'month', width: 100, render: (_: unknown, record: ApprovalHistoryRecord) => record.reimbursement.month },
    { title: '总额', key: 'totalAmount', width: 120, render: (_: unknown, record: ApprovalHistoryRecord) => `¥${Number(record.reimbursement.totalAmount).toFixed(2)}` },
    {
      title: '审批结果', dataIndex: 'status', key: 'status', width: 100,
      render: (status: string) => (
        <Tag color={status === 'APPROVED' ? 'success' : 'error'}>{status === 'APPROVED' ? '已通过' : '已驳回'}</Tag>
      ),
    },
    { title: '驳回原因', dataIndex: 'comment', key: 'comment', ellipsis: true, render: (v: string | null) => v || '-' },
    { title: '审批时间', dataIndex: 'createdAt', key: 'createdAt', width: 170, render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm') },
    {
      title: '操作', key: 'action', width: 80,
      render: (_: unknown, record: ApprovalHistoryRecord) => (
        <Button type="link" size="small" onClick={() => router.push(`/reimbursement/${record.reimbursement.id}`)}>详情</Button>
      ),
    },
  ];

  return (
    <MainLayout>
      <Title level={4} style={{ marginBottom: 24 }}>审批历史</Title>
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} scroll={{ x: 800 }} />
    </MainLayout>
  );
}
