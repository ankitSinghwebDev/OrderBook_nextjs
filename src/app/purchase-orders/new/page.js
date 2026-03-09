'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  Empty,
  List,
  Tag,
  Typography,
  message,
  Button,
  Modal,
  Input,
  Space
} from 'antd';

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function ApprovalsPage() {

  const [userId, setUserId] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [comment, setComment] = useState('');
  const [actionType, setActionType] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {

    if (typeof window === 'undefined') return;

    const uid = localStorage.getItem('userId');

    if (uid) {
      setUserId(uid);
      fetchApprovals(uid);
    }

  }, []);

  const fetchApprovals = async (uid) => {

    setLoading(true);

    try {

      const res = await fetch(`/api/purchase-orders/approvals?userId=${uid}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data?.message);

      setOrders(data?.data || []);

    } catch (err) {

      message.error(err?.message || 'Failed to load approvals');

    } finally {

      setLoading(false);

    }

  };

  const openActionModal = (order, type) => {
    setSelectedOrder(order);
    setActionType(type);
    setComment('');
    setModalOpen(true);
  };

  const submitDecision = async () => {

    try {

      const res = await fetch(`/api/purchase-orders/${selectedOrder.id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          decision: actionType,
          comment
        })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data?.message);

      message.success(`Order ${actionType}`);

      setModalOpen(false);

      fetchApprovals(userId);

    } catch (err) {

      message.error(err.message || 'Action failed');

    }

  };

  return (

    <div
      className="min-h-screen py-10"
      style={{ background: 'var(--background)', color: 'var(--foreground)' }}
    >

      <div className="mx-auto max-w-6xl px-4 space-y-6">

        <div>

          <Title level={3} style={{ margin: 0 }}>
            Purchase Order Approvals
          </Title>

          <Text type="secondary">
            Orders waiting for your approval.
          </Text>

        </div>

        {!userId && (

          <Card>
            <Text>Login required to view approvals.</Text>
          </Card>

        )}

        {userId && (

          <Card bodyStyle={{ padding: 0 }}>

            <List

              loading={loading}

              dataSource={orders}

              locale={{ emptyText: <Empty description="No approvals pending" /> }}

              renderItem={(order) => (

                <List.Item

                  actions={[

                    <Space key="actions">

                      <Button
                        type="primary"
                        size="small"
                        onClick={() => openActionModal(order, 'approved')}
                      >
                        Approve
                      </Button>

                      <Button
                        danger
                        size="small"
                        onClick={() => openActionModal(order, 'rejected')}
                      >
                        Reject
                      </Button>

                    </Space>

                  ]}

                >

                  <List.Item.Meta

                    title={

                      <div className="flex gap-2">

                        <Text strong>{order.orderNumber}</Text>

                        <Text type="secondary">
                          • {order.supplier}
                        </Text>

                      </div>

                    }

                    description={

                      <div className="flex gap-4 text-sm">

                        <span>
                          Total: {order.total} {order.currency}
                        </span>

                        <span>
                          Created: {new Date(order.createdAt).toLocaleDateString()}
                        </span>

                      </div>

                    }

                  />

                  <Tag color="gold">
                    {order.status}
                  </Tag>

                </List.Item>

              )}

            />

          </Card>

        )}

      </div>

      <Modal
        title={`${actionType === 'approved' ? 'Approve' : 'Reject'} Purchase Order`}
        open={modalOpen}
        onOk={submitDecision}
        onCancel={() => setModalOpen(false)}
        okText="Submit"
      >

        <Text>
          Add a comment (optional)
        </Text>

        <TextArea
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Approval notes..."
        />

      </Modal>

    </div>

  );

}