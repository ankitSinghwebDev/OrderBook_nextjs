'use client';

import { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Space, Typography, Modal, Form, Input, Select, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { api } from '@/lib/api';

const { Title, Text } = Typography;

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await api.listSuppliers({ status: 'all' });
      setSuppliers(res?.data || []);
    } catch (err) {
      message.error(err?.message || 'Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSuppliers(); }, []);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ paymentTerms: 'Net 30' });
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      if (editing) {
        await api.updateSupplier(editing._id, values);
        message.success('Supplier updated');
      } else {
        await api.createSupplier(values);
        message.success('Supplier created');
      }
      setModalOpen(false);
      fetchSuppliers();
    } catch (err) {
      if (err?.message) message.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: `Deactivate "${record.name}"?`,
      content: 'This supplier will be marked inactive and hidden from dropdowns.',
      okText: 'Deactivate',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await api.deleteSupplier(record._id);
          message.success('Supplier deactivated');
          fetchSuppliers();
        } catch (err) {
          message.error(err?.message || 'Failed to deactivate');
        }
      },
    });
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name', render: (text) => <Text strong>{text}</Text> },
    { title: 'Email', dataIndex: 'email', key: 'email', ellipsis: true },
    { title: 'Phone', dataIndex: 'phone', key: 'phone', width: 140 },
    { title: 'Contact', dataIndex: 'contactPerson', key: 'contactPerson', ellipsis: true },
    { title: 'City', dataIndex: 'city', key: 'city', width: 120 },
    { title: 'Payment Terms', dataIndex: 'paymentTerms', key: 'paymentTerms', width: 130 },
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
          <Title level={3} style={{ margin: 0, color: 'var(--foreground)' }}>Suppliers</Title>
          <Text type="secondary">Manage your supplier directory</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add Supplier</Button>
      </div>

      <Card style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <Table dataSource={suppliers} columns={columns} rowKey="_id" loading={loading} scroll={{ x: 800 }} size="middle" />
      </Card>

      <Modal
        title={editing ? 'Edit Supplier' : 'New Supplier'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        confirmLoading={saving}
        okText={editing ? 'Save' : 'Create'}
        width={600}
      >
        <Form form={form} layout="vertical">
          <div className="grid gap-x-4 sm:grid-cols-2">
            <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Name is required' }]}>
              <Input placeholder="Supplier name" />
            </Form.Item>
            <Form.Item label="Company" name="companyName"><Input placeholder="Company name" /></Form.Item>
            <Form.Item label="Email" name="email"><Input placeholder="email@example.com" /></Form.Item>
            <Form.Item label="Phone" name="phone"><Input placeholder="+1 555-0000" /></Form.Item>
            <Form.Item label="Contact person" name="contactPerson"><Input placeholder="John Doe" /></Form.Item>
            <Form.Item label="Payment terms" name="paymentTerms">
              <Select options={['Net 15', 'Net 30', 'Net 45', 'Net 60', 'Due on Receipt', 'Advance'].map((t) => ({ value: t, label: t }))} />
            </Form.Item>
            <Form.Item label="Address" name="address" className="sm:col-span-2"><Input placeholder="Street address" /></Form.Item>
            <Form.Item label="City" name="city"><Input placeholder="City" /></Form.Item>
            <Form.Item label="State" name="state"><Input placeholder="State" /></Form.Item>
            <Form.Item label="Country" name="country"><Input placeholder="Country" /></Form.Item>
            <Form.Item label="Pincode" name="pincode"><Input placeholder="Pincode" /></Form.Item>
            <Form.Item label="GST Number" name="gstNumber"><Input placeholder="GST number" /></Form.Item>
            <Form.Item label="PAN Number" name="panNumber"><Input placeholder="PAN number" /></Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
