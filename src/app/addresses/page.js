'use client';

import { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Space, Typography, Modal, Form, Input, Switch, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, StarFilled } from '@ant-design/icons';
import { api } from '@/lib/api';

const { Title, Text } = Typography;

export default function AddressesPage() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const res = await api.listAddresses({ status: 'all' });
      setAddresses(res?.data || []);
    } catch (err) {
      message.error(err?.message || 'Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAddresses(); }, []);

  const openCreate = () => { setEditing(null); form.resetFields(); setModalOpen(true); };
  const openEdit = (record) => { setEditing(record); form.setFieldsValue(record); setModalOpen(true); };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      if (editing) {
        await api.updateAddress(editing._id, values);
        message.success('Address updated');
      } else {
        await api.createAddress(values);
        message.success('Address created');
      }
      setModalOpen(false);
      fetchAddresses();
    } catch (err) {
      if (err?.message) message.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: `Deactivate "${record.label}"?`,
      okText: 'Deactivate',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await api.deleteAddress(record._id);
          message.success('Address deactivated');
          fetchAddresses();
        } catch (err) {
          message.error(err?.message || 'Failed to deactivate');
        }
      },
    });
  };

  const columns = [
    {
      title: 'Label', dataIndex: 'label', key: 'label',
      render: (text, record) => (
        <span>
          <Text strong>{text}</Text>
          {record.isDefault && <StarFilled className="ml-2 text-yellow-500" />}
        </span>
      ),
    },
    { title: 'Address', key: 'address', render: (_, r) => `${r.line1}${r.line2 ? ', ' + r.line2 : ''}`, ellipsis: true },
    { title: 'City', dataIndex: 'city', key: 'city', width: 120 },
    { title: 'Country', dataIndex: 'country', key: 'country', width: 120 },
    { title: 'Contact', dataIndex: 'contactPerson', key: 'contactPerson', ellipsis: true, width: 140 },
    {
      title: 'Status', dataIndex: 'status', key: 'status', width: 100,
      render: (s) => <Tag color={s === 'active' ? 'green' : 'default'}>{s?.toUpperCase()}</Tag>,
    },
    {
      title: 'Actions', key: 'actions', width: 100,
      render: (_, record) => (
        <Space>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          {record.status === 'active' && (
            <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)} />
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Title level={3} style={{ margin: 0, color: 'var(--foreground)' }}>Delivery Addresses</Title>
          <Text type="secondary">Manage your delivery locations</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add Address</Button>
      </div>

      <Card style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <Table dataSource={addresses} columns={columns} rowKey="_id" loading={loading} scroll={{ x: 800 }} size="middle" />
      </Card>

      <Modal
        title={editing ? 'Edit Address' : 'New Address'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        confirmLoading={saving}
        okText={editing ? 'Save' : 'Create'}
        width={600}
      >
        <Form form={form} layout="vertical">
          <div className="grid gap-x-4 sm:grid-cols-2">
            <Form.Item label="Label" name="label" rules={[{ required: true }]}><Input placeholder="e.g. HQ Warehouse" /></Form.Item>
            <Form.Item label="Contact person" name="contactPerson"><Input placeholder="John Doe" /></Form.Item>
            <Form.Item label="Address line 1" name="line1" rules={[{ required: true }]} className="sm:col-span-2"><Input placeholder="Street address" /></Form.Item>
            <Form.Item label="Address line 2" name="line2" className="sm:col-span-2"><Input placeholder="Suite, building..." /></Form.Item>
            <Form.Item label="City" name="city" rules={[{ required: true }]}><Input placeholder="City" /></Form.Item>
            <Form.Item label="State" name="state"><Input placeholder="State" /></Form.Item>
            <Form.Item label="Country" name="country" rules={[{ required: true }]}><Input placeholder="Country" /></Form.Item>
            <Form.Item label="Pincode" name="pincode"><Input placeholder="Pincode" /></Form.Item>
            <Form.Item label="Phone" name="phone"><Input placeholder="Phone" /></Form.Item>
            <Form.Item label="Default address" name="isDefault" valuePropName="checked"><Switch /></Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
