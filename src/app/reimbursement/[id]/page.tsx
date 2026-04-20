'use client';

import React, { useEffect, useState } from 'react';
import { Descriptions, Card, Tag, Button, Typography, Spin, Modal, message, Timeline, Table } from 'antd';
import { CopyOutlined, MailOutlined } from '@ant-design/icons';
import MainLayout from '@/components/Layout/MainLayout';
import { STATUS_LABELS, STATUS_COLORS } from '@/types';
import type { ReimbursementStatus, DailyDetail } from '@/types';
import { useParams } from 'next/navigation';
import dayjs from 'dayjs';

const { Title } = Typography;

interface ReimbursementDetailData {
  id: string;
  month: string;
  totalHotelFee: number;
  totalTransportFee: number;
  totalAmount: number;
  status: ReimbursementStatus;
  emailContent?: string | null;
  createdAt: string;
  userName: string;
  user: { name: string; email: string; department?: string | null };
  details: DailyDetail[];
  approvals: Array<{
    id: string;
    status: string;
    comment?: string | null;
    createdAt: string;
    approver: { name: string };
  }>;
}

export default function ReimbursementDetailPage() {
  const params = useParams();
  const [detail, setDetail] = useState<ReimbursementDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailVisible, setEmailVisible] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetch(`/api/reimbursement/${params.id}`)
        .then(res => res.json())
        .then(data => { if (data.reimbursement) setDetail(data.reimbursement); })
        .finally(() => setLoading(false));
    }
  }, [params.id]);

  if (loading) return <MainLayout><Spin size="large" style={{ display: 'block', margin: '100px auto' }} /></MainLayout>;
  if (!detail) return <MainLayout><Title level={4}>报销单不存在</Title></MainLayout>;

  const detailColumns = [
    { title: '日期', dataIndex: 'date', key: 'date', width: 110, render: (v: string) => dayjs(v).format('MM-DD') },
    { title: '出差地', dataIndex: 'destination', key: 'destination', width: 100 },
    { title: '出差原因', dataIndex: 'reason', key: 'reason', ellipsis: true },
    {
      title: '交通方式', dataIndex: 'transportTypes', key: 'transportTypes', width: 150,
      render: (v: string[]) => v.map(t => <Tag key={t}>{t}</Tag>),
    },
    { title: '交通费', dataIndex: 'transportFee', key: 'transportFee', width: 100, render: (v: number) => `¥${v.toFixed(2)}` },
    { title: '住宿费', dataIndex: 'hotelFee', key: 'hotelFee', width: 100, render: (v: number) => `¥${v.toFixed(2)}` },
    { title: '备注', dataIndex: 'remark', key: 'remark', width: 120, render: (v: string | undefined) => v || '-' },
  ];

  return (
    <MainLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>报销详情</Title>
        {detail.emailContent && (
          <Button icon={<MailOutlined />} onClick={() => setEmailVisible(true)}>查看邮件</Button>
        )}
      </div>

      <Card style={{ marginBottom: 24 }}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="申请人">{detail.user.name}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={STATUS_COLORS[detail.status]}>{STATUS_LABELS[detail.status]}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="报销月份">{detail.month}</Descriptions.Item>
          <Descriptions.Item label="出差天数">{detail.details.length} 天</Descriptions.Item>
          <Descriptions.Item label="住宿费总额">¥{detail.totalHotelFee.toFixed(2)}</Descriptions.Item>
          <Descriptions.Item label="交通费总额">¥{detail.totalTransportFee.toFixed(2)}</Descriptions.Item>
          <Descriptions.Item label="报销总额" span={2}>
            <strong style={{ fontSize: 18, color: '#52c41a' }}>¥{detail.totalAmount.toFixed(2)}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="提交时间" span={2}>{dayjs(detail.createdAt).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="每日出差明细" style={{ marginBottom: 24 }}>
        <Table
          dataSource={detail.details}
          columns={detailColumns}
          rowKey="date"
          pagination={false}
          size="small"
          scroll={{ x: 700 }}
        />
      </Card>

      {detail.approvals.length > 0 && (
        <Card title="审批记录" style={{ marginBottom: 24 }}>
          <Timeline
            items={detail.approvals.map(a => ({
              color: a.status === 'APPROVED' ? 'green' : 'red',
              children: (
                <div>
                  <strong>{a.approver.name}</strong> {a.status === 'APPROVED' ? '通过' : '驳回'}了申请
                  {a.comment && <div style={{ color: '#999', marginTop: 4 }}>原因：{a.comment}</div>}
                  <div style={{ color: '#999', fontSize: 12 }}>{dayjs(a.createdAt).format('YYYY-MM-DD HH:mm:ss')}</div>
                </div>
              ),
            }))}
          />
        </Card>
      )}

      <Modal
        title="邮件预览"
        open={emailVisible}
        onCancel={() => setEmailVisible(false)}
        width={650}
        footer={[
          <Button key="copy" type="primary" icon={<CopyOutlined />} onClick={() => {
            navigator.clipboard.writeText(detail.emailContent || '');
            message.success('邮件内容已复制到剪贴板');
          }}>复制邮件内容</Button>,
          <Button key="close" onClick={() => setEmailVisible(false)}>关闭</Button>,
        ]}
      >
        <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: 1.8 }}>{detail.emailContent}</pre>
      </Modal>
    </MainLayout>
  );
}
