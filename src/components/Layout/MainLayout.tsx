'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Layout, Menu, Button, Dropdown, Avatar, Spin } from 'antd';
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
  const [navigating, setNavigating] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const router = useRouter();
  const pathname = usePathname();

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

  useEffect(() => {
    setNavigating(false);
    setLoadingProgress(0);
  }, [pathname]);

  const handleNavigate = useCallback((path: string) => {
    if (path === pathname) return;
    setNavigating(true);
    setLoadingProgress(30);
    const t1 = setTimeout(() => setLoadingProgress(60), 150);
    const t2 = setTimeout(() => setLoadingProgress(85), 400);
    router.push(path);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [pathname, router]);

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

  if (!user) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spin size="large" />
    </div>
  );

  return (
    <Layout className="app-layout">
      {navigating && loadingProgress > 0 && (
        <div className="nav-loading-bar" style={{ width: `${loadingProgress}%` }} />
      )}
      <Sider trigger={null} collapsible collapsed={collapsed} className="app-sider" width={220} breakpoint="lg" collapsedWidth={80} onBreakpoint={(broken) => { if (broken) setCollapsed(true); }}>
        <div className="logo-container">
          {!collapsed ? <h1>Bytedance 报销系统</h1> : <h1>BD</h1>}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[pathname]}
          items={getMenuItems()}
          onClick={({ key }) => handleNavigate(key)}
          style={{ borderRight: 0, marginTop: 8 }}
        />
      </Sider>
      <Layout style={{ background: 'transparent' }}>
        <Header className="app-header" style={{ padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />
          <Dropdown menu={userDropdownItems} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar style={{ backgroundColor: '#0f2b5b' }} icon={<UserOutlined />} />
              <span style={{ fontWeight: 500 }}>{user.name}</span>
            </div>
          </Dropdown>
        </Header>
        <Content className="app-content page-transition" style={{ margin: 24, padding: 24, overflow: 'auto' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
