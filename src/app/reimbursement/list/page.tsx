'use client';

import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Typography, Space, Popconfirm, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import MainLayout from '@/components/Layout/MainLayout';
import type { ReimbursementRecord } from '@/types';
import { STATUS_LABELS, STATUS_COLORS } from '@/types';
import { useRouter } from 'next/navigation';

const { Title } = Typography;

export default function ReimbursementListPage() {
  const [data, setData] = useState<ReimbursementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    fetch('/api/reimbursement')
      .then(res => res.json())
      .then(d => { if (d.reimbursements) setData(d.reimbursements); })
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const handleWithdraw = async (id: string) => {
    const res = await fetch(`/api/reimbursement/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'WITHDRAWN' }),
    });
    const d = await res.json();
    if (res.ok) {
      message.success('已撤回');
      setRefreshKey(k => k + 1);
    } else {
      message.error(d.error || '操作失败');
    }
  };

  const columns = [
    { title: '月份', dataIndex: 'month', key: 'month', width: 100 },
    {
      title: '出差天数', key: 'days', width: 90,
      render: (_: unknown, record: ReimbursementRecord) => `${record.details?.length || 0} 天`,
    },
    { title: '住宿费', dataIndex: 'totalHotelFee', key: 'totalHotelFee', width: 120, render: (v: number) => `¥${Number(v).toFixed(2)}` },
    { title: '交通费', dataIndex: 'totalTransportFee', key: 'totalTransportFee', width: 120, render: (v: number) => `¥${Number(v).toFixed(2)}` },
    { title: '总额', dataIndex: 'totalAmount', key: 'totalAmount', width: 120, render: (v: number) => <strong>¥{Number(v).toFixed(2)}</strong> },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (status: ReimbursementRecord['status']) => (
        <Tag color={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Tag>
      ),
    },
    {
      title: '操作', key: 'action', width: 150,
      render: (_: unknown, record: ReimbursementRecord) => (
        <Space>
          <Button type="link" size="small" onClick={() => router.push(`/reimbursement/${record.id}`)}>详情</Button>
          {record.status === 'PENDING' && (
            <Popconfirm title="确认撤回该报销申请？" onConfirm={() => handleWithdraw(record.id)}>
              <Button type="link" size="small" danger>撤回</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <MainLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>我的报销</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push('/reimbursement/new')}>
          新建报销
        </Button>
      </div>
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} scroll={{ x: 800 }} />
    </MainLayout>
  );
}
