'use client';

import { useEffect, useState } from 'react';
import { Card, Statistic, Table, Tag, Typography, Spin, Empty, message } from 'antd';
import { ShoppingCartOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, TeamOutlined, AlertOutlined } from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
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
              styles={{ content: { color: 'var(--foreground)' } }}
            />
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly Spend Bar Chart */}
        <Card title="Monthly Spend Trend" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          {data.monthlySpend?.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.monthlySpend.reverse().map((m) => ({
                month: `${['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m._id.month]} ${m._id.year}`,
                spend: m.totalSpend,
                count: m.count,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--muted)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }}
                  labelStyle={{ color: 'var(--foreground)' }}
                  formatter={(v) => [`$${v.toLocaleString()}`, 'Spend']}
                />
                <Bar dataKey="spend" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <Empty description="No spend data yet" />}
        </Card>

        {/* Spend by Status Pie Chart */}
        <Card title="Spend by Status" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          {spendByStatus?.length ? (
            <div>
              <div className="flex justify-between text-lg font-bold mb-4">
                <Text>Total Spend</Text>
                <Text style={{ color: 'var(--accent)' }}>${totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={spendByStatus.map((s) => ({ name: s._id, value: s.totalSpend, count: s.count }))}
                    cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {spendByStatus.map((s, i) => (
                      <Cell key={s._id} fill={['#4f46e5', '#22c55e', '#f97316', '#ef4444', '#64748b'][i % 5]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(v) => `$${v.toLocaleString()}`}
                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : <Empty description="No data yet" />}
        </Card>
      </div>

      {/* Top Suppliers */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Top Suppliers by Spend" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          {topSuppliers?.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topSuppliers.map((s) => ({ name: s._id?.length > 15 ? s._id.slice(0, 15) + '...' : s._id, spend: s.totalSpend, count: s.count }))} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tick={{ fill: 'var(--muted)', fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fill: 'var(--muted)', fontSize: 11 }} />
                <RechartsTooltip formatter={(v) => [`$${v.toLocaleString()}`, 'Spend']}
                  contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }}
                />
                <Bar dataKey="spend" fill="#22c55e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <Empty description="No supplier data yet" />}
        </Card>

        <Card title="PO Status Distribution" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="space-y-3">
            {spendByStatus?.map((s) => {
              const pct = totalSpend > 0 ? (s.totalSpend / totalSpend * 100).toFixed(1) : 0;
              return (
                <div key={s._id}>
                  <div className="flex items-center justify-between mb-1">
                    <Tag color={STATUS_COLORS[s._id]}>{s._id?.toUpperCase()}</Tag>
                    <Text type="secondary">{s.count} POs - ${s.totalSpend?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
                  </div>
                  <div className="w-full rounded-full h-2" style={{ backgroundColor: 'var(--border)' }}>
                    <div className="rounded-full h-2 transition-all" style={{ width: `${pct}%`, backgroundColor: 'var(--accent)' }} />
                  </div>
                </div>
              );
            })}
          </div>
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
