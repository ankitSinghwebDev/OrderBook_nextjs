'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, Table, Tag, Typography, Button, Descriptions, Spin, Empty, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { api } from '@/lib/api';

const { Title, Text } = Typography;

export default function GRNDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [grn, setGrn] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { const res = await api.getGRN(id); setGrn(res?.data); }
      catch (err) { message.error(err?.message || 'Failed to load GRN'); }
      finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><Spin size="large" /></div>;
  if (!grn) return <Empty description="GRN not found" />;

  const columns = [
    { title: '#', width: 45, render: (_, __, i) => i + 1 },
    { title: 'Item', dataIndex: 'name' },
    { title: 'Ordered', dataIndex: 'orderedQty', width: 90, align: 'right' },
    { title: 'Received', dataIndex: 'receivedQty', width: 90, align: 'right' },
    { title: 'Rejected', dataIndex: 'rejectedQty', width: 90, align: 'right', render: (v) => v > 0 ? <Text type="danger">{v}</Text> : 0 },
    { title: 'Accepted', dataIndex: 'acceptedQty', width: 90, align: 'right', render: (v) => <Text strong>{v}</Text> },
    { title: 'Remarks', dataIndex: 'remarks', ellipsis: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.push('/grn')}>Back</Button>
        <div>
          <Title level={3} style={{ margin: 0, color: 'var(--foreground)' }}>{grn.grnNumber}</Title>
          <Tag color={grn.status === 'completed' ? 'green' : 'orange'}>{grn.status?.toUpperCase()}</Tag>
        </div>
      </div>

      <Card style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <Descriptions column={{ xs: 1, sm: 2, lg: 3 }} size="small" bordered>
          <Descriptions.Item label="GRN Number">{grn.grnNumber}</Descriptions.Item>
          <Descriptions.Item label="PO Number"><Link href={`/purchase-orders/${grn.purchaseOrderId}`} style={{ color: 'var(--accent)' }}>{grn.poNumber}</Link></Descriptions.Item>
          <Descriptions.Item label="Supplier">{grn.supplier}</Descriptions.Item>
          <Descriptions.Item label="Received Date">{new Date(grn.receivedDate).toLocaleDateString()}</Descriptions.Item>
          <Descriptions.Item label="Received By">{grn.receivedBy || '-'}</Descriptions.Item>
          <Descriptions.Item label="Status"><Tag color={grn.status === 'completed' ? 'green' : 'orange'}>{grn.status?.toUpperCase()}</Tag></Descriptions.Item>
          {grn.deliveryNoteNumber && <Descriptions.Item label="Delivery Note #">{grn.deliveryNoteNumber}</Descriptions.Item>}
          {grn.vehicleNumber && <Descriptions.Item label="Vehicle">{grn.vehicleNumber}</Descriptions.Item>}
          {grn.notes && <Descriptions.Item label="Notes" span={3}>{grn.notes}</Descriptions.Item>}
        </Descriptions>
      </Card>

      <Card title="Items" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <Table dataSource={grn.items || []} columns={columns} rowKey={(_, i) => i} pagination={false} size="middle" scroll={{ x: 600 }} />
      </Card>
    </div>
  );
}
