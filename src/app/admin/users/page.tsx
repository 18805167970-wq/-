'use client';

import React, { useEffect, useState } from 'react';
import { Table, Select, Typography, message, Tag, Space } from 'antd';
import MainLayout from '@/components/Layout/MainLayout';
import type { UserInfo, Role } from '@/types';

const { Title } = Typography;

interface AdminUser extends UserInfo {
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetch('/api/admin/users')
      .then(res => res.json())
      .then(data => { if (data.users) setUsers(data.users); })
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const handleRoleChange = async (userId: string, role: Role) => {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      message.success('角色已更新');
      setRefreshKey(k => k + 1);
    } else {
      message.error('更新失败');
    }
  };

  const handleApproverChange = async (userId: string, approverId: string | null) => {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approverId }),
    });
    if (res.ok) {
      message.success('审批人已更新');
      setRefreshKey(k => k + 1);
    } else {
      message.error('更新失败');
    }
  };

  const roleColors: Record<Role, string> = {
    EMPLOYEE: 'blue',
    APPROVER: 'orange',
    ADMIN: 'red',
  };

  const roleLabels: Record<Role, string> = {
    EMPLOYEE: '员工',
    APPROVER: '审批人',
    ADMIN: '管理员',
  };

  const approverOptions = users
    .filter(u => u.role === 'APPROVER' || u.role === 'ADMIN')
    .map(u => ({ label: u.name, value: u.id }));

  const columns = [
    { title: '姓名', dataIndex: 'name', key: 'name', width: 120 },
    { title: '邮箱', dataIndex: 'email', key: 'email', width: 200 },
    {
      title: '角色', dataIndex: 'role', key: 'role', width: 160,
      render: (role: Role, record: AdminUser) => (
        <Space>
          <Tag color={roleColors[role]}>{roleLabels[role]}</Tag>
          <Select
            size="small"
            value={role}
            onChange={(v) => handleRoleChange(record.id, v)}
            options={[
              { label: '员工', value: 'EMPLOYEE' },
              { label: '审批人', value: 'APPROVER' },
              { label: '管理员', value: 'ADMIN' },
            ]}
            style={{ width: 100 }}
          />
        </Space>
      ),
    },
    {
      title: '审批人', key: 'approver', width: 200,
      render: (_: unknown, record: AdminUser) => (
        <Select
          size="small"
          value={record.approverId || undefined}
          onChange={(v) => handleApproverChange(record.id, v || null)}
          options={approverOptions.filter(o => o.value !== record.id)}
          placeholder="选择审批人"
          allowClear
          style={{ width: 160 }}
        />
      ),
    },
    { title: '审批人姓名', dataIndex: 'approverName', key: 'approverName', width: 120, render: (v: string | null) => v || '-' },
  ];

  return (
    <MainLayout>
      <Title level={4} style={{ marginBottom: 24 }}>用户管理</Title>
      <Table dataSource={users} columns={columns} rowKey="id" loading={loading} scroll={{ x: 800 }} />
    </MainLayout>
  );
}
