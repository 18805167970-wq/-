'use client';

import React, { useEffect, useState } from 'react';
import { Table, Button, Typography, Space, Modal, Input, message, Tag } from 'antd';
import MainLayout from '@/components/Layout/MainLayout';
import type { ReimbursementRecord } from '@/types';
import { STATUS_LABELS, STATUS_COLORS } from '@/types';
import { useRouter } from 'next/navigation';

const { Title } = Typography;
const { TextArea } = Input;

export default function ApprovalPendingPage() {
  const [data, setData] = useState<ReimbursementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState<{ visible: boolean; id: string }>({ visible: false, id: '' });
  const [rejectComment, setRejectComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    fetch('/api/approval/pending')
      .then(res => res.json())
      .then(d => { if (d.reimbursements) setData(d.reimbursements); })
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const handleApprove = async (id: string) => {
    setActionLoading(true);
    const res = await fetch(`/api/approval/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'APPROVED' }),
    });
    const d = await res.json();
    if (res.ok) {
      message.success('已通过');
      setRefreshKey(k => k + 1);
    } else {
      message.error(d.error || '操作失败');
    }
    setActionLoading(false);
  };

  const handleReject = async () => {
    if (!rejectComment.trim()) {
      message.warning('请填写驳回原因');
      return;
    }
    setActionLoading(true);
    const res = await fetch(`/api/approval/${rejectModal.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'REJECTED', comment: rejectComment }),
    });
    const d = await res.json();
    if (res.ok) {
      message.success('已驳回');
      setRejectModal({ visible: false, id: '' });
      setRejectComment('');
      setRefreshKey(k => k + 1);
    } else {
      message.error(d.error || '操作失败');
    }
    setActionLoading(false);
  };

  const columns = [
    { title: '申请人', dataIndex: 'userName', key: 'userName', width: 100 },
    { title: '月份', dataIndex: 'month', key: 'month', width: 100 },
    {
      title: '天数', key: 'days', width: 80,
      render: (_: unknown, record: ReimbursementRecord) => `${record.details?.length || 0}天`,
    },
    { title: '住宿费', dataIndex: 'totalHotelFee', key: 'totalHotelFee', width: 110, render: (v: number) => `¥${Number(v).toFixed(2)}` },
    { title: '交通费', dataIndex: 'totalTransportFee', key: 'totalTransportFee', width: 110, render: (v: number) => `¥${Number(v).toFixed(2)}` },
    { title: '总额', dataIndex: 'totalAmount', key: 'totalAmount', width: 110, render: (v: number) => <strong>¥{Number(v).toFixed(2)}</strong> },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (status: ReimbursementRecord['status']) => <Tag color={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Tag>,
    },
    {
      title: '操作', key: 'action', width: 220,
      render: (_: unknown, record: ReimbursementRecord) => (
        <Space>
          <Button type="link" size="small" onClick={() => router.push(`/reimbursement/${record.id}`)}>详情</Button>
          <Button type="primary" size="small" loading={actionLoading} onClick={() => handleApprove(record.id)}>通过</Button>
          <Button danger size="small" onClick={() => setRejectModal({ visible: true, id: record.id })}>驳回</Button>
        </Space>
      ),
    },
  ];

  return (
    <MainLayout>
      <Title level={4} style={{ marginBottom: 24 }}>待审批</Title>
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} scroll={{ x: 1000 }} />

      <Modal
        title="驳回原因"
        open={rejectModal.visible}
        onOk={handleReject}
        onCancel={() => { setRejectModal({ visible: false, id: '' }); setRejectComment(''); }}
        confirmLoading={actionLoading}
        okText="确认驳回"
        okButtonProps={{ danger: true }}
      >
        <TextArea
          rows={4}
          value={rejectComment}
          onChange={e => setRejectComment(e.target.value)}
          placeholder="请输入驳回原因"
        />
      </Modal>
    </MainLayout>
  );
}
