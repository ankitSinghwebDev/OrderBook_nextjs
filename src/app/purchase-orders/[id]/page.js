'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, Tag, Button, Space, Typography, Divider, Table, Timeline, Modal, Input, message, Descriptions, Spin, Empty } from 'antd';
import { EditOutlined, CheckCircleOutlined, CloseCircleOutlined, ArrowLeftOutlined, StopOutlined, SendOutlined } from '@ant-design/icons';
import { api } from '@/lib/api';

const { Title, Text, Paragraph } = Typography;

const STATUS_COLORS = {
  draft: 'default',
  pending: 'gold',
  approved: 'green',
  rejected: 'red',
  cancelled: 'volcano',
};

const ACTION_COLORS = {
  created: 'blue',
  updated: 'orange',
  approved: 'green',
  rejected: 'red',
  status_changed: 'purple',
  deleted: 'volcano',
};

export default function PurchaseOrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [po, setPo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [comment, setComment] = useState('');

  const fetchPO = async () => {
    setLoading(true);
    try {
      const res = await api.getPurchaseOrder(id);
      setPo(res?.data || null);
    } catch (err) {
      message.error(err?.message || 'Failed to load purchase order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPO(); }, [id]);

  const handleAction = async (action, actionComment = '') => {
    setActionLoading(true);
    try {
      if (action === 'approve') await api.approvePurchaseOrder(id, actionComment);
      else if (action === 'reject') await api.rejectPurchaseOrder(id, actionComment);
      else if (action === 'submit') await api.submitPurchaseOrder(id);
      else if (action === 'cancel') await api.cancelPurchaseOrder(id);
      message.success(`PO ${action}${action.endsWith('e') ? 'd' : 'ed'} successfully`);
      setRejectModalOpen(false);
      setApproveModalOpen(false);
      setComment('');
      fetchPO();
    } catch (err) {
      message.error(err?.message || `Failed to ${action} PO`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Spin size="large" /></div>;
  }

  if (!po) {
    return <Empty description="Purchase order not found" />;
  }

  const itemColumns = [
    { title: '#', key: 'index', render: (_, __, idx) => idx + 1, width: 50 },
    { title: 'Item', dataIndex: 'name', key: 'name' },
    { title: 'Description', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: 'Qty', dataIndex: 'qty', key: 'qty', width: 80, align: 'right' },
    { title: 'Rate', dataIndex: 'rate', key: 'rate', width: 100, align: 'right', render: (v) => v?.toFixed(2) },
    { title: 'Tax %', dataIndex: 'tax', key: 'tax', width: 80, align: 'right' },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', width: 120, align: 'right', render: (v) => v?.toFixed(2) },
  ];

  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
  const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
  const isApprover = po.approverUserId === userId;
  const isAdmin = userRole === 'admin';
  const canApprove = (isApprover || isAdmin) && po.status === 'pending';
  const canEdit = ['draft', 'pending'].includes(po.status);
  const canSubmit = po.status === 'draft';
  const canCancel = ['draft', 'pending', 'approved'].includes(po.status);
  const canResubmit = po.status === 'rejected';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.push('/purchase-orders')}>Back</Button>
          <div>
            <Title level={3} style={{ margin: 0, color: 'var(--foreground)' }}>
              {po.orderNumber}
            </Title>
            <Tag color={STATUS_COLORS[po.status]} className="mt-1">{po.status?.toUpperCase()}</Tag>
          </div>
        </div>
        <Space wrap>
          {canEdit && (
            <Button icon={<EditOutlined />} onClick={() => router.push(`/purchase-orders/${id}/edit`)}>Edit</Button>
          )}
          {canSubmit && (
            <Button icon={<SendOutlined />} type="primary" loading={actionLoading} onClick={() => handleAction('submit')}>Submit for Approval</Button>
          )}
          {canResubmit && (
            <Button icon={<SendOutlined />} type="primary" loading={actionLoading} onClick={() => handleAction('submit')}>Resubmit</Button>
          )}
          {canApprove && (
            <>
              <Button type="primary" icon={<CheckCircleOutlined />} style={{ background: '#52c41a', borderColor: '#52c41a' }} onClick={() => setApproveModalOpen(true)}>Approve</Button>
              <Button danger icon={<CloseCircleOutlined />} onClick={() => setRejectModalOpen(true)}>Reject</Button>
            </>
          )}
          {canCancel && (
            <Button icon={<StopOutlined />} onClick={() => {
              Modal.confirm({
                title: 'Cancel this purchase order?',
                content: 'This action cannot be undone.',
                okText: 'Yes, Cancel PO',
                okButtonProps: { danger: true },
                onOk: () => handleAction('cancel'),
              });
            }}>Cancel PO</Button>
          )}
        </Space>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="PO Details" style={{ background: 'var(--card)', borderColor: 'var(--border)' }} className="lg:col-span-2">
          <Descriptions column={{ xs: 1, sm: 2 }} size="small" bordered>
            <Descriptions.Item label="PO Number">{po.orderNumber}</Descriptions.Item>
            <Descriptions.Item label="Status"><Tag color={STATUS_COLORS[po.status]}>{po.status?.toUpperCase()}</Tag></Descriptions.Item>
            <Descriptions.Item label="Supplier">{po.supplier}</Descriptions.Item>
            <Descriptions.Item label="Currency">{po.currency}</Descriptions.Item>
            <Descriptions.Item label="Order Date">{new Date(po.orderDate).toLocaleDateString()}</Descriptions.Item>
            <Descriptions.Item label="Expected Delivery">{po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString() : '-'}</Descriptions.Item>
            <Descriptions.Item label="Payment Terms">{po.paymentTerms || '-'}</Descriptions.Item>
            <Descriptions.Item label="Created By">{po.createdByName || '-'}</Descriptions.Item>
            <Descriptions.Item label="Approver">{po.approverName || '-'}</Descriptions.Item>
            <Descriptions.Item label="Delivery Address" span={2}>{po.deliveryAddress || '-'}</Descriptions.Item>
          </Descriptions>
        </Card>

        <Card title="Summary" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><Text type="secondary">Subtotal</Text><Text>{po.subtotal?.toFixed(2)}</Text></div>
            <div className="flex justify-between"><Text type="secondary">Tax</Text><Text>{po.taxTotal?.toFixed(2)}</Text></div>
            <div className="flex justify-between"><Text type="secondary">Shipping</Text><Text>{po.shipping?.toFixed(2)}</Text></div>
            <div className="flex justify-between"><Text type="secondary">Discount</Text><Text>-{po.discount?.toFixed(2)}</Text></div>
            <Divider style={{ margin: '8px 0' }} />
            <div className="flex justify-between text-lg font-bold">
              <Text>Total</Text>
              <Text>{po.currency} {po.total?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            </div>
          </div>
          {po.approvalComment && (
            <>
              <Divider />
              <Text type="secondary">Approval Comment:</Text>
              <Paragraph>{po.approvalComment}</Paragraph>
            </>
          )}
          {po.rejectionReason && (
            <>
              <Divider />
              <Text type="danger">Rejection Reason:</Text>
              <Paragraph type="danger">{po.rejectionReason}</Paragraph>
            </>
          )}
        </Card>
      </div>

      <Card title="Line Items" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <Table
          dataSource={po.items || []}
          columns={itemColumns}
          rowKey={(_, idx) => idx}
          pagination={false}
          size="small"
          scroll={{ x: 600 }}
        />
      </Card>

      {po.notes && (
        <Card title="Notes" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <Paragraph>{po.notes}</Paragraph>
        </Card>
      )}

      {po.history?.length > 0 && (
        <Card title="Activity History" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <Timeline
            items={po.history.map((h) => ({
              color: ACTION_COLORS[h.action] || 'gray',
              children: (
                <div>
                  <Text strong style={{ textTransform: 'capitalize' }}>{h.action.replace('_', ' ')}</Text>
                  <Text type="secondary"> by {h.performedByName || h.performedByEmail || 'System'}</Text>
                  <br />
                  <Text type="secondary" className="text-xs">
                    {new Date(h.createdAt).toLocaleString()}
                  </Text>
                  {h.comment && <Paragraph className="mt-1 text-sm">{h.comment}</Paragraph>}
                </div>
              ),
            }))}
          />
        </Card>
      )}

      <Modal
        title="Approve Purchase Order"
        open={approveModalOpen}
        onOk={() => handleAction('approve', comment)}
        onCancel={() => { setApproveModalOpen(false); setComment(''); }}
        confirmLoading={actionLoading}
        okText="Approve"
        okButtonProps={{ style: { background: '#52c41a', borderColor: '#52c41a' } }}
      >
        <p>Add an optional comment for this approval:</p>
        <Input.TextArea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Optional comment..." />
      </Modal>

      <Modal
        title="Reject Purchase Order"
        open={rejectModalOpen}
        onOk={() => handleAction('reject', comment)}
        onCancel={() => { setRejectModalOpen(false); setComment(''); }}
        confirmLoading={actionLoading}
        okText="Reject"
        okButtonProps={{ danger: true }}
      >
        <p>Please provide a reason for rejection:</p>
        <Input.TextArea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Reason for rejection..." />
      </Modal>
    </div>
  );
}
