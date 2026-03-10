'use client';

import { useEffect, useState } from 'react';
import { Card, Empty, List, Tag, Typography, message } from 'antd';
import { api } from '@/lib/api';

const { Title, Text } = Typography;

export default function ApprovalsPage() {
  const [userId, setUserId] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const uid = window.localStorage.getItem('userId');
    if (uid) {
      setUserId(uid);
      fetchApprovals(uid);
    }
  }, []);

  const fetchApprovals = async (uid) => {
    setLoading(true);
    try {
      const data = await api.listApprovals(uid);
      setOrders(data?.data || []);
    } catch (err) {
      message.error(err?.message || 'Could not load approvals');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen py-10"
      style={{ background: 'var(--background)', color: 'var(--foreground)' }}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Title level={3} style={{ margin: 0 }}>
              Approvals
            </Title>
            <Text type="secondary">
              Purchase orders waiting for your decision.
            </Text>
          </div>
        </div>

        {!userId && (
          <Card
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <Text>
              We couldn&apos;t find your user id. Log in or visit the Workspace page so we can store it.
            </Text>
          </Card>
        )}

        {userId && (
          <Card
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
            bodyStyle={{ padding: 0 }}
          >
            <List
              loading={loading}
              dataSource={orders}
              locale={{ emptyText: <Empty description="No approvals yet" /> }}
              renderItem={(order) => (
                <List.Item
                  actions={[
                    <Tag key="status" color="gold">
                      {order.status}
                    </Tag>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <div className="flex items-center gap-2">
                        <Text strong>{order.orderNumber}</Text>
                        <Text type="secondary">• {order.supplier}</Text>
                      </div>
                    }
                    description={
                      <div className="flex gap-3 text-sm" style={{ color: 'var(--muted)' }}>
                        <span>
                          Total: {order.total?.toFixed?.(2) ?? order.total} {order.currency}
                        </span>
                        <span>Created: {new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        )}
      </div>
    </div>
  );
}
