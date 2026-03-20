'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, Table, Tag, Input, Select, DatePicker, Button, Space, Typography, message, Tooltip } from 'antd';
import { PlusOutlined, SearchOutlined, EyeOutlined, EditOutlined, ReloadOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const STATUS_COLORS = {
  draft: 'default',
  pending: 'gold',
  approved: 'green',
  rejected: 'red',
  cancelled: 'volcano',
};

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, totalCount: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState(null);

  const fetchOrders = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const queryParams = {
        page: params.page || pagination.page,
        limit: params.limit || pagination.limit,
        ...(search && { search }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(dateRange?.[0] && { fromDate: dateRange[0].toISOString() }),
        ...(dateRange?.[1] && { toDate: dateRange[1].toISOString() }),
        sortBy: 'createdAt',
        sortDir: 'desc',
      };
      const res = await api.listPurchaseOrders(queryParams);
      setOrders(res?.data || []);
      setPagination(res?.pagination || pagination);
    } catch (err) {
      message.error(err?.message || 'Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, dateRange, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleSearch = () => fetchOrders({ page: 1 });
  const handleTableChange = (pag) => fetchOrders({ page: pag.current, limit: pag.pageSize });

  const columns = [
    {
      title: 'PO Number',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (text, record) => (
        <Link href={`/purchase-orders/${record._id}`} className="font-semibold" style={{ color: 'var(--accent)' }}>
          {text}
        </Link>
      ),
    },
    {
      title: 'Supplier',
      dataIndex: 'supplier',
      key: 'supplier',
      ellipsis: true,
    },
    {
      title: 'Date',
      dataIndex: 'orderDate',
      key: 'orderDate',
      render: (date) => new Date(date).toLocaleDateString(),
      width: 120,
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (total, record) => (
        <Text strong>
          {record.currency} {total?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
      ),
      width: 150,
      align: 'right',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={STATUS_COLORS[status] || 'default'}>
          {status?.toUpperCase()}
        </Tag>
      ),
      width: 120,
    },
    {
      title: 'Created By',
      dataIndex: 'createdByName',
      key: 'createdByName',
      ellipsis: true,
      width: 140,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Space>
          <Tooltip title="View">
            <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => router.push(`/purchase-orders/${record._id}`)} />
          </Tooltip>
          {['draft', 'pending'].includes(record.status) && (
            <Tooltip title="Edit">
              <Button type="text" size="small" icon={<EditOutlined />} onClick={() => router.push(`/purchase-orders/${record._id}/edit`)} />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Title level={3} style={{ margin: 0, color: 'var(--foreground)' }}>Purchase Orders</Title>
          <Text type="secondary">Manage and track all your purchase orders</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push('/purchase-orders/new')}>
          Create PO
        </Button>
      </div>

      <Card style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="flex flex-wrap gap-3 mb-4">
          <Input
            placeholder="Search PO number or supplier..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onPressEnter={handleSearch}
            style={{ maxWidth: 300 }}
            allowClear
          />
          <Select
            value={statusFilter}
            onChange={(v) => setStatusFilter(v)}
            style={{ minWidth: 140 }}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'draft', label: 'Draft' },
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
          />
          <RangePicker
            onChange={(dates) => setDateRange(dates)}
            style={{ maxWidth: 300 }}
          />
          <Button icon={<SearchOutlined />} onClick={handleSearch}>Filter</Button>
          <Button icon={<ReloadOutlined />} onClick={() => { setSearch(''); setStatusFilter('all'); setDateRange(null); fetchOrders({ page: 1 }); }}>Reset</Button>
        </div>

        <Table
          dataSource={orders}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.totalCount,
            showSizeChanger: true,
            showTotal: (total) => `${total} purchase orders`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 800 }}
          size="middle"
        />
      </Card>
    </div>
  );
}
