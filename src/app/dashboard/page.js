'use client';

import { useEffect, useState } from 'react';
import { Card, Statistic, Table, Tag, Typography, Spin, Empty, message } from 'antd';
import { ShoppingCartOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, TeamOutlined, AlertOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { api } from '@/lib/api';

const { Title, Text } = Typography;

const STATUS_COLORS = {
  draft: 'default',
  pending: 'gold',
  approved: 'green',
  rejected: 'red',
  cancelled: 'volcano',
};

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.getDashboard();
        setData(res?.data || null);
      } catch (err) {
        message.error(err?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spin size="large" /></div>;
  if (!data) return <Empty description="No dashboard data" />;

  const { counts, recentPOs, spendByStatus, topSuppliers } = data;

  const totalSpend = spendByStatus?.reduce((sum, s) => sum + (s.totalSpend || 0), 0) || 0;

  const statCards = [
    { title: 'Total POs', value: counts.totalPOs, icon: <ShoppingCartOutlined />, color: 'var(--accent)' },
    { title: 'Pending Approval', value: counts.pendingPOs, icon: <ClockCircleOutlined />, color: '#faad14' },
    { title: 'Approved', value: counts.approvedPOs, icon: <CheckCircleOutlined />, color: '#52c41a' },
    { title: 'Rejected', value: counts.rejectedPOs, icon: <CloseCircleOutlined />, color: '#ff4d4f' },
    { title: 'My Pending Approvals', value: counts.myPendingApprovals, icon: <AlertOutlined />, color: '#722ed1', link: '/purchase-orders/approvals' },
    { title: 'Active Suppliers', value: counts.totalSuppliers, icon: <TeamOutlined />, color: '#13c2c2', link: '/suppliers' },
  ];

  const recentColumns = [
    {
      title: 'PO Number', dataIndex: 'orderNumber', key: 'orderNumber',
      render: (text, record) => <Link href={`/purchase-orders/${record._id}`} style={{ color: 'var(--accent)' }}>{text}</Link>,
    },
    { title: 'Supplier', dataIndex: 'supplier', key: 'supplier', ellipsis: true },
    {
      title: 'Total', dataIndex: 'total', key: 'total', align: 'right',
      render: (v, r) => `${r.currency} ${v?.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (s) => <Tag color={STATUS_COLORS[s]}>{s?.toUpperCase()}</Tag>,
    },
    { title: 'Date', dataIndex: 'createdAt', key: 'createdAt', render: (d) => new Date(d).toLocaleDateString() },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Title level={3} style={{ margin: 0, color: 'var(--foreground)' }}>Dashboard</Title>
        <Text type="secondary">Overview of your purchase order activity</Text>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((s) => (
          <Card key={s.title} style={{ background: 'var(--card)', borderColor: 'var(--border)' }} hoverable={!!s.link}
            onClick={() => s.link && (window.location.href = s.link)}
          >
            <Statistic
              title={<span style={{ color: 'var(--muted)' }}>{s.title}</span>}
              value={s.value}
              prefix={<span style={{ color: s.color }}>{s.icon}</span>}
              valueStyle={{ color: 'var(--foreground)' }}
            />
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Total Spend by Status" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="space-y-3">
            <div className="flex justify-between text-lg font-bold">
              <Text>Total Spend</Text>
              <Text>${totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
            </div>
            {spendByStatus?.map((s) => (
              <div key={s._id} className="flex items-center justify-between">
                <Tag color={STATUS_COLORS[s._id]}>{s._id?.toUpperCase()}</Tag>
                <div className="text-right">
                  <Text strong>${s.totalSpend?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
                  <Text type="secondary" className="ml-2">({s.count} POs)</Text>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Top Suppliers by Spend" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          {topSuppliers?.length ? (
            <div className="space-y-3">
              {topSuppliers.map((s, idx) => (
                <div key={s._id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                      {idx + 1}
                    </span>
                    <Text>{s._id}</Text>
                  </div>
                  <div className="text-right">
                    <Text strong>${s.totalSpend?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
                    <Text type="secondary" className="ml-2">({s.count} POs)</Text>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty description="No supplier data yet" />
          )}
        </Card>
      </div>

      <Card title="Recent Purchase Orders" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        extra={<Link href="/purchase-orders" style={{ color: 'var(--accent)' }}>View all</Link>}
      >
        <Table dataSource={recentPOs} columns={recentColumns} rowKey="_id" pagination={false} size="small" scroll={{ x: 600 }} />
      </Card>
    </div>
  );
}
