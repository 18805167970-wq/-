'use client';

import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Dropdown, Avatar, theme } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  FileTextOutlined,
  PlusCircleOutlined,
  AuditOutlined,
  HistoryOutlined,
  TeamOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import type { UserInfo } from '@/types';

const { Header, Sider, Content } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
        } else {
          router.push('/login');
        }
      })
      .catch(() => router.push('/login'));
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const employeeMenuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: '工作台' },
    { key: '/reimbursement/new', icon: <PlusCircleOutlined />, label: '新建报销' },
    { key: '/reimbursement/list', icon: <FileTextOutlined />, label: '我的报销' },
  ];

  const approverMenuItems = [
    { key: '/approval/pending', icon: <AuditOutlined />, label: '待审批' },
    { key: '/approval/history', icon: <HistoryOutlined />, label: '审批历史' },
  ];

  const adminMenuItems = [
    { key: '/admin/users', icon: <TeamOutlined />, label: '用户管理' },
  ];

  const getMenuItems = () => {
    const items = [...employeeMenuItems];
    if (user?.role === 'APPROVER' || user?.role === 'ADMIN') {
      items.push(...approverMenuItems);
    }
    if (user?.role === 'ADMIN') {
      items.push(...adminMenuItems);
    }
    return items;
  };

  const userDropdownItems = {
    items: [
      { key: 'role', label: `角色：${user?.role === 'ADMIN' ? '管理员' : user?.role === 'APPROVER' ? '审批人' : '员工'}`, disabled: true },
      { type: 'divider' as const },
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout },
    ],
  };

  if (!user) return null;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="light" style={{ borderRight: '1px solid #f0f0f0' }}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #f0f0f0' }}>
          <h1 style={{ margin: 0, fontSize: collapsed ? 16 : 18, fontWeight: 600, whiteSpace: 'nowrap' }}>
            {collapsed ? '报销' : '报销管理系统'}
          </h1>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[pathname]}
          items={getMenuItems()}
          onClick={({ key }) => router.push(key)}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: colorBgContainer, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0' }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />
          <Dropdown menu={userDropdownItems} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar icon={<UserOutlined />} />
              <span>{user.name}</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: 24, padding: 24, background: colorBgContainer, borderRadius: borderRadiusLG, overflow: 'auto' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
