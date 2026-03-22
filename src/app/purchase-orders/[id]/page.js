'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, Tag, Button, Space, Typography, Divider, Table, Timeline, Modal, Input, message, Descriptions, Spin, Empty, Alert, Tooltip } from 'antd';
import { EditOutlined, CheckCircleOutlined, CloseCircleOutlined, ArrowLeftOutlined, StopOutlined, SendOutlined, ExclamationCircleOutlined, DownloadOutlined, MailOutlined, InboxOutlined } from '@ant-design/icons';
import { api } from '@/lib/api';
import POComments from '@/components/POComments';

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
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailData, setEmailData] = useState({ recipientEmail: '', subject: '', message: '' });
  const [emailSending, setEmailSending] = useState(false);
  const [comment, setComment] = useState('');

  const handleDownloadPdf = async () => {
    try {
      const { generatePOPdf } = await import('@/lib/generatePOPdf');
      const doc = generatePOPdf(po);
      doc.save(`${po.orderNumber}.pdf`);
      message.success('PDF downloaded');
    } catch (err) {
      message.error('Failed to generate PDF');
    }
  };

  const handleEmailPO = async () => {
    if (!emailData.recipientEmail) { message.error('Enter recipient email'); return; }
    setEmailSending(true);
    try {
      const res = await api.emailPOToSupplier(id, emailData);
      message.success(res?.message || 'Email sent');
      setEmailModalOpen(false);
      setEmailData({ recipientEmail: '', subject: '', message: '' });
    } catch (err) { message.error(err?.message || 'Failed to send email'); }
    finally { setEmailSending(false); }
  };

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
  const isCreator = po.createdByUserId === userId;
  const canEdit = ['draft', 'pending', 'rejected'].includes(po.status);
  const canSubmit = po.status === 'draft';
  const canCancel = ['draft', 'pending', 'approved'].includes(po.status);
  const canResubmit = po.status === 'rejected' && (isCreator || isAdmin);

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
            <>
              <Button icon={<EditOutlined />} onClick={() => router.push(`/purchase-orders/${id}/edit`)}>Edit & Fix</Button>
              <Button icon={<SendOutlined />} type="primary" loading={actionLoading}
                onClick={() => {
                  Modal.confirm({
                    title: 'Resubmit this PO for approval?',
                    icon: <ExclamationCircleOutlined />,
                    content: 'The PO will be sent back to the approver. Make sure you have addressed the rejection reason before resubmitting.',
                    okText: 'Yes, Resubmit',
                    onOk: () => handleAction('submit'),
                  });
                }}
              >Resubmit for Approval</Button>
            </>
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
          <Tooltip title="Download PDF"><Button icon={<DownloadOutlined />} onClick={handleDownloadPdf}>PDF</Button></Tooltip>
          <Tooltip title="Email to Supplier"><Button icon={<MailOutlined />} onClick={() => setEmailModalOpen(true)}>Email</Button></Tooltip>
          {po.status === 'approved' && (
            <Button icon={<InboxOutlined />} onClick={() => router.push(`/grn/new?poId=${id}`)}>Create GRN</Button>
          )}
        </Space>
      </div>

      {/* Rejection Banner */}
      {po.status === 'rejected' && po.rejectionReason && (
        <Alert
          type="error"
          showIcon
          icon={<CloseCircleOutlined />}
          message={<Text strong>This PO was rejected</Text>}
          description={
            <div>
              <Paragraph style={{ margin: '4px 0 8px' }}>{po.rejectionReason}</Paragraph>
              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
                {po.rejectedAt && <span>Rejected on {new Date(po.rejectedAt).toLocaleDateString()}</span>}
                {po.approverName && <span>by {po.approverName}</span>}
              </div>
              {canResubmit && (
                <div className="mt-3 flex gap-2">
                  <Button size="small" icon={<EditOutlined />} onClick={() => router.push(`/purchase-orders/${id}/edit`)}>Edit & Fix Issues</Button>
                  <Button size="small" type="primary" icon={<SendOutlined />} loading={actionLoading}
                    onClick={() => handleAction('submit')}
                  >Resubmit As-Is</Button>
                </div>
              )}
            </div>
          }
        />
      )}

      {/* Approval Banner */}
      {po.status === 'approved' && po.approvalComment && (
        <Alert
          type="success"
          showIcon
          icon={<CheckCircleOutlined />}
          message={<Text strong>Approved</Text>}
          description={
            <div>
              <Paragraph style={{ margin: '4px 0' }}>{po.approvalComment}</Paragraph>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>
                {po.approvedAt && <span>Approved on {new Date(po.approvedAt).toLocaleDateString()}</span>}
                {po.approverName && <span> by {po.approverName}</span>}
              </div>
            </div>
          }
        />
      )}

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
        onOk={() => {
          if (!comment.trim()) { message.warning('Please provide a reason for rejection'); return; }
          handleAction('reject', comment);
        }}
        onCancel={() => { setRejectModalOpen(false); setComment(''); }}
        confirmLoading={actionLoading}
        okText="Reject"
        okButtonProps={{ danger: true, disabled: !comment.trim() }}
      >
        <p style={{ color: 'var(--foreground)' }}>Please provide a reason for rejection <Text type="danger">*</Text></p>
        <Input.TextArea
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="e.g. Price too high, wrong specifications, need alternative supplier..."
          status={!comment.trim() ? 'error' : undefined}
        />
        <Text type="secondary" className="text-xs mt-2 block">The creator will see this reason and can edit & resubmit the PO.</Text>
      </Modal>

      {/* Email PO Modal */}
      <Modal
        title="Email PO to Supplier"
        open={emailModalOpen}
        onOk={handleEmailPO}
        onCancel={() => setEmailModalOpen(false)}
        confirmLoading={emailSending}
        okText="Send Email"
      >
        <div className="space-y-3 mt-3">
          <div>
            <Text strong style={{ color: 'var(--foreground)' }}>Recipient Email *</Text>
            <Input className="mt-1" value={emailData.recipientEmail}
              onChange={(e) => setEmailData((d) => ({ ...d, recipientEmail: e.target.value }))}
              placeholder="supplier@company.com"
            />
          </div>
          <div>
            <Text strong style={{ color: 'var(--foreground)' }}>Subject</Text>
            <Input className="mt-1" value={emailData.subject}
              onChange={(e) => setEmailData((d) => ({ ...d, subject: e.target.value }))}
              placeholder={`Purchase Order ${po?.orderNumber}`}
            />
          </div>
          <div>
            <Text strong style={{ color: 'var(--foreground)' }}>Message</Text>
            <Input.TextArea className="mt-1" rows={3} value={emailData.message}
              onChange={(e) => setEmailData((d) => ({ ...d, message: e.target.value }))}
              placeholder="Please find attached the purchase order..."
            />
          </div>
          <Text type="secondary" className="text-xs">The PO PDF will be attached automatically.</Text>
        </div>
      </Modal>

      {/* Comments */}
      <POComments poId={id} />
    </div>
  );
}
