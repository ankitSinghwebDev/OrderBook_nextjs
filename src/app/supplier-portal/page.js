'use client';

import { useEffect, useState } from 'react';
import { Card, Table, Tag, Typography, Progress, Empty, message } from 'antd';
import Link from 'next/link';
import { api } from '@/lib/api';

const { Title, Text } = Typography;
const STATUS_COLORS = { pending: 'gold', approved: 'green', rejected: 'red' };

export default function SupplierPortalPage() {
  const [data, setData] = useState([]);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.getSupplierPortal();
        setData(res?.data || []);
        setVendor(res?.vendor || null);
      } catch (err) { message.error(err?.message || 'Access denied or failed to load'); }
      finally { setLoading(false); }
    })();
  }, []);

  const columns = [
    {
      title: 'PO Number', dataIndex: 'orderNumber',
      render: (text, r) => <Link href={`/purchase-orders/${r._id}`} style={{ color: 'var(--accent)', fontWeight: 600 }}>{text}</Link>,
    },
    { title: 'Date', dataIndex: 'orderDate', render: (d) => new Date(d).toLocaleDateString(), width: 110 },
    {
      title: 'Total', dataIndex: 'total', align: 'right', width: 130,
      render: (v, r) => <Text strong>{r.currency} {v?.toFixed(2)}</Text>,
    },
    { title: 'Items', key: 'items', width: 70, render: (_, r) => r.items?.length || 0 },
    { title: 'Status', dataIndex: 'status', width: 100, render: (s) => <Tag color={STATUS_COLORS[s]}>{s?.toUpperCase()}</Tag> },
    { title: 'Payment Terms', dataIndex: 'paymentTerms', width: 120 },
    { title: 'Expected Delivery', dataIndex: 'expectedDeliveryDate', width: 130, render: (d) => d ? new Date(d).toLocaleDateString() : '-' },
    {
      title: 'Delivery Progress', key: 'progress', width: 160,
      render: (_, r) => {
        const pct = r.totalOrdered > 0 ? Math.round((r.totalReceived / r.totalOrdered) * 100) : 0;
        return (
          <div>
            <Progress percent={pct} size="small" status={pct >= 100 ? 'success' : 'active'} />
            <Text type="secondary" className="text-xs">{r.totalReceived}/{r.totalOrdered} units | {r.grnCount} GRN{r.grnCount !== 1 ? 's' : ''}</Text>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Title level={3} style={{ margin: 0, color: 'var(--foreground)' }}>Supplier Portal</Title>
        <Text type="secondary">
          {vendor ? `Welcome, ${vendor.name} (${vendor.email})` : 'View purchase orders assigned to you'}
        </Text>
      </div>

      <Card style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <Table
          dataSource={data} columns={columns} rowKey="_id" loading={loading}
          scroll={{ x: 900 }} size="middle"
          locale={{ emptyText: <Empty description="No purchase orders found. This portal is for vendor accounts only." /> }}
        />
      </Card>
    </div>
  );
}
