'use client';

import { useEffect, useState } from 'react';
import { Card, Table, Tag, Typography, Button, Space, message } from 'antd';
import { PlusOutlined, EyeOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

const { Title, Text } = Typography;

const STATUS_COLORS = { draft: 'default', completed: 'green', partial: 'orange' };

export default function GRNListPage() {
  const router = useRouter();
  const [grns, setGrns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.listGRNs();
        setGrns(res?.data || []);
      } catch (err) { message.error(err?.message || 'Failed to load GRNs'); }
      finally { setLoading(false); }
    })();
  }, []);

  const columns = [
    {
      title: 'GRN Number', dataIndex: 'grnNumber', key: 'grnNumber',
      render: (text, r) => <Link href={`/grn/${r._id}`} style={{ color: 'var(--accent)', fontWeight: 600 }}>{text}</Link>,
    },
    {
      title: 'PO Number', dataIndex: 'poNumber', key: 'poNumber',
      render: (text, r) => <Link href={`/purchase-orders/${r.purchaseOrderId}`} style={{ color: 'var(--accent)' }}>{text}</Link>,
    },
    { title: 'Supplier', dataIndex: 'supplier', key: 'supplier', ellipsis: true },
    { title: 'Received Date', dataIndex: 'receivedDate', key: 'receivedDate', render: (d) => new Date(d).toLocaleDateString(), width: 120 },
    { title: 'Items', key: 'items', width: 70, render: (_, r) => r.items?.length || 0 },
    { title: 'Received By', dataIndex: 'receivedBy', key: 'receivedBy', ellipsis: true, width: 140 },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 100, render: (s) => <Tag color={STATUS_COLORS[s]}>{s?.toUpperCase()}</Tag> },
    { title: '', key: 'actions', width: 60, render: (_, r) => <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => router.push(`/grn/${r._id}`)} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Title level={3} style={{ margin: 0, color: 'var(--foreground)' }}>Goods Received Notes</Title>
          <Text type="secondary">Track deliveries against purchase orders</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push('/grn/new')}>Create GRN</Button>
      </div>
      <Card style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <Table dataSource={grns} columns={columns} rowKey="_id" loading={loading} scroll={{ x: 800 }} size="middle" />
      </Card>
    </div>
  );
}
