'use client';

import { useEffect, useState } from 'react';
import { Card, Empty, List, Tag, Typography, Button, Space, Modal, Input, message, Spin } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, EyeOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

const { Title, Text } = Typography;

const STATUS_COLORS = {
  pending: 'gold',
  approved: 'green',
  rejected: 'red',
};

export default function ApprovalsPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [actionModal, setActionModal] = useState({ open: false, action: '', orderId: '' });
  const [comment, setComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchApprovals = async (status) => {
    setLoading(true);
    try {
      const res = await api.listApprovals({ status: status || statusFilter });
      setOrders(res?.data || []);
    } catch (err) {
      message.error(err?.message || 'Could not load approvals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApprovals(); }, []);

  const handleAction = async () => {
    setActionLoading(true);
    try {
      const { action, orderId } = actionModal;
      if (action === 'approve') await api.approvePurchaseOrder(orderId, comment);
      else await api.rejectPurchaseOrder(orderId, comment);
      message.success(`PO ${action}d successfully`);
      setActionModal({ open: false, action: '', orderId: '' });
      setComment('');
      fetchApprovals();
    } catch (err) {
      message.error(err?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Title level={3} style={{ margin: 0, color: 'var(--foreground)' }}>Approvals</Title>
          <Text type="secondary">Purchase orders waiting for your decision</Text>
        </div>
        <Space>
          {['pending', 'approved', 'rejected', 'all'].map((s) => (
            <Button
              key={s}
              type={statusFilter === s ? 'primary' : 'default'}
              onClick={() => { setStatusFilter(s); fetchApprovals(s); }}
              size="small"
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Button>
          ))}
        </Space>
      </div>

      <Card style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        {loading ? (
          <div className="flex justify-center py-10"><Spin /></div>
        ) : (
          <List
            dataSource={orders}
            locale={{ emptyText: <Empty description="No approvals found" /> }}
            renderItem={(order) => (
              <List.Item
                actions={[
                  <Button key="view" type="text" icon={<EyeOutlined />} onClick={() => router.push(`/purchase-orders/${order._id}`)}>View</Button>,
                  ...(order.status === 'pending' ? [
                    <Button key="approve" type="primary" size="small" icon={<CheckCircleOutlined />}
                      style={{ background: '#52c41a', borderColor: '#52c41a' }}
                      onClick={() => setActionModal({ open: true, action: 'approve', orderId: order._id })}
                    >Approve</Button>,
                    <Button key="reject" danger size="small" icon={<CloseCircleOutlined />}
                      onClick={() => setActionModal({ open: true, action: 'reject', orderId: order._id })}
                    >Reject</Button>,
                  ] : []),
                ]}
              >
                <List.Item.Meta
                  title={
                    <div className="flex items-center gap-2">
                      <Text strong>{order.orderNumber}</Text>
                      <Text type="secondary">- {order.supplier}</Text>
                      <Tag color={STATUS_COLORS[order.status]}>{order.status?.toUpperCase()}</Tag>
                    </div>
                  }
                  description={
                    <div className="flex flex-wrap gap-4 text-sm" style={{ color: 'var(--muted)' }}>
                      <span>Total: {order.total?.toFixed?.(2)} {order.currency}</span>
                      <span>Created: {new Date(order.createdAt).toLocaleDateString()}</span>
                      {order.createdByName && <span>By: {order.createdByName}</span>}
                      <span>Items: {order.items?.length || 0}</span>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      <Modal
        title={actionModal.action === 'approve' ? 'Approve Purchase Order' : 'Reject Purchase Order'}
        open={actionModal.open}
        onOk={handleAction}
        onCancel={() => { setActionModal({ open: false, action: '', orderId: '' }); setComment(''); }}
        confirmLoading={actionLoading}
        okText={actionModal.action === 'approve' ? 'Approve' : 'Reject'}
        okButtonProps={actionModal.action === 'reject' ? { danger: true } : { style: { background: '#52c41a', borderColor: '#52c41a' } }}
      >
        <p>{actionModal.action === 'approve' ? 'Add an optional comment:' : 'Please provide a reason for rejection:'}</p>
        <Input.TextArea rows={3} value={comment} onChange={(e) => setComment(e.target.value)}
          placeholder={actionModal.action === 'approve' ? 'Optional comment...' : 'Reason for rejection...'}
        />
      </Modal>
    </div>
  );
}
