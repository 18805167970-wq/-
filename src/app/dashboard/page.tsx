'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Typography, Spin, Select, DatePicker, Space } from 'antd';
import { FileTextOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import MainLayout from '@/components/Layout/MainLayout';
import type { ReimbursementRecord, ReimbursementStatus } from '@/types';
import { STATUS_LABELS, STATUS_COLORS } from '@/types';
import { useRouter } from 'next/navigation';

const { Title } = Typography;

export default function DashboardPage() {
  const [reimbursements, setReimbursements] = useState<ReimbursementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<ReimbursementStatus | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/reimbursement')
      .then(res => res.json())
      .then(data => {
        if (data.reimbursements) setReimbursements(data.reimbursements);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredRecords = useMemo(() => {
    let records = reimbursements;
    if (filterMonth) {
      records = records.filter(r => r.month === filterMonth);
    }
    if (filterStatus) {
      records = records.filter(r => r.status === filterStatus);
    }
    return records;
  }, [reimbursements, filterMonth, filterStatus]);

  const pending = reimbursements.filter(r => r.status === 'PENDING').length;
  const approved = reimbursements.filter(r => r.status === 'APPROVED').length;
  const rejected = reimbursements.filter(r => r.status === 'REJECTED').length;
  const totalAmount = reimbursements
    .filter(r => r.status === 'APPROVED')
    .reduce((sum, r) => sum + Number(r.totalAmount), 0);

  const columns = [
    { title: '月份', dataIndex: 'month', key: 'month' },
    { title: '天数', key: 'days', render: (_: unknown, record: ReimbursementRecord) => `${record.details?.length || 0}天` },
    { title: '总额', dataIndex: 'totalAmount', key: 'totalAmount', render: (v: number) => `¥${Number(v).toFixed(2)}` },
    {
      title: '状态', dataIndex: 'status', key: 'status',
      render: (status: ReimbursementRecord['status']) => (
        <Tag color={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Tag>
      ),
    },
  ];

  return (
    <MainLayout>
      <Title level={4} style={{ marginBottom: 24 }}>工作台</Title>
      <Spin spinning={loading}>
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={12} md={6}>
            <Card hoverable onClick={() => router.push('/reimbursement/list')}>
              <Statistic title="全部报销" value={reimbursements.length} prefix={<FileTextOutlined />} />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Card hoverable>
              <Statistic title="待审批" value={pending} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#0f2b5b' }} />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Card hoverable>
              <Statistic title="已通过" value={approved} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Card hoverable>
              <Statistic title="已驳回" value={rejected} prefix={<CloseCircleOutlined />} valueStyle={{ color: '#ff4d4f' }} />
            </Card>
          </Col>
        </Row>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card title="已通过报销总额">
              <Statistic value={totalAmount} precision={2} prefix="¥" valueStyle={{ fontSize: 32, color: '#52c41a' }} />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card
              title="最近报销记录"
              extra={
                <Space size={8}>
                  <DatePicker
                    picker="month"
                    placeholder="筛选月份"
                    size="small"
                    allowClear
                    onChange={(v) => setFilterMonth(v ? v.format('YYYY-MM') : null)}
                    style={{ width: 120 }}
                  />
                  <Select
                    placeholder="状态"
                    size="small"
                    allowClear
                    value={filterStatus}
                    onChange={(v) => setFilterStatus(v || null)}
                    options={[
                      { label: '待审批', value: 'PENDING' },
                      { label: '已通过', value: 'APPROVED' },
                      { label: '已驳回', value: 'REJECTED' },
                      { label: '已撤回', value: 'WITHDRAWN' },
                    ]}
                    style={{ width: 100 }}
                  />
                </Space>
              }
            >
              <Table
                dataSource={filteredRecords.slice(0, 5)}
                columns={columns}
                rowKey="id"
                pagination={false}
                size="small"
                onRow={(record) => ({ onClick: () => router.push(`/reimbursement/${record.id}`), style: { cursor: 'pointer' } })}
              />
            </Card>
          </Col>
        </Row>
      </Spin>
    </MainLayout>
  );
}
