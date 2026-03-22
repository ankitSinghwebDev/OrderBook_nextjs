'use client';

import { useEffect, useState } from 'react';
import { Button, Card, DatePicker, Form, Input, InputNumber, Select, Table, Typography, message } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { api } from '@/lib/api';

const { Title, Text } = Typography;

function GRNForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const poId = searchParams.get('poId');
  const [form] = Form.useForm();
  const [pos, setPos] = useState([]);
  const [selectedPO, setSelectedPO] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.listPurchaseOrders({ status: 'approved', limit: 100 });
        setPos(res?.data || []);
        if (poId) {
          const po = (res?.data || []).find((p) => p._id === poId);
          if (po) handlePOSelect(po._id, res?.data || []);
        }
      } catch {}
    })();
  }, []);

  const handlePOSelect = (id, posList) => {
    const list = posList || pos;
    const po = list.find((p) => p._id === id);
    if (!po) return;
    setSelectedPO(po);
    setItems((po.items || []).map((item, idx) => ({
      key: idx, poItemIndex: idx, name: item.name, description: item.description || '',
      orderedQty: item.qty, previouslyReceivedQty: 0, receivedQty: item.qty,
      rejectedQty: 0, acceptedQty: item.qty, remarks: '',
    })));
  };

  const updateItem = (key, field, value) => {
    setItems((prev) => prev.map((item) => {
      if (item.key !== key) return item;
      const updated = { ...item, [field]: value };
      if (field === 'receivedQty' || field === 'rejectedQty') {
        updated.acceptedQty = Math.max(0, (Number(updated.receivedQty) || 0) - (Number(updated.rejectedQty) || 0));
      }
      return updated;
    }));
  };

  const onSubmit = async () => {
    if (!selectedPO) { message.error('Select a PO'); return; }
    if (!items.length) { message.error('No items'); return; }
    setLoading(true);
    try {
      const values = form.getFieldsValue(true);
      await api.createGRN({
        purchaseOrderId: selectedPO._id,
        receivedDate: values.receivedDate?.toISOString(),
        deliveryNoteNumber: values.deliveryNoteNumber || '',
        vehicleNumber: values.vehicleNumber || '',
        receivedBy: values.receivedBy || '',
        notes: values.notes || '',
        items,
      });
      message.success('GRN created');
      router.push('/grn');
    } catch (err) { message.error(err?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  const columns = [
    { title: '#', width: 45, render: (_, __, i) => i + 1 },
    { title: 'Item', dataIndex: 'name', width: 180 },
    { title: 'Ordered', dataIndex: 'orderedQty', width: 90, align: 'right' },
    {
      title: 'Received', dataIndex: 'receivedQty', width: 110,
      render: (v, r) => <InputNumber min={0} max={r.orderedQty} value={v} className="w-full" onChange={(val) => updateItem(r.key, 'receivedQty', val || 0)} />,
    },
    {
      title: 'Rejected', dataIndex: 'rejectedQty', width: 110,
      render: (v, r) => <InputNumber min={0} max={r.receivedQty} value={v} className="w-full" onChange={(val) => updateItem(r.key, 'rejectedQty', val || 0)} />,
    },
    { title: 'Accepted', dataIndex: 'acceptedQty', width: 90, align: 'right', render: (v) => <Text strong>{v}</Text> },
    {
      title: 'Remarks', dataIndex: 'remarks', width: 180,
      render: (v, r) => <Input placeholder="Optional" value={v} onChange={(e) => updateItem(r.key, 'remarks', e.target.value)} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.push('/grn')}>Back</Button>
        <div>
          <Title level={3} style={{ margin: 0, color: 'var(--foreground)' }}>Create Goods Received Note</Title>
          <Text type="secondary">Record goods delivery against a purchase order</Text>
        </div>
      </div>

      <Form form={form} layout="vertical">
        <Card style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Form.Item label="Purchase Order" required>
              <Select placeholder="Select approved PO" showSearch optionFilterProp="label" value={selectedPO?._id}
                options={pos.map((p) => ({ value: p._id, label: `${p.orderNumber} — ${p.supplier}` }))}
                onChange={(v) => handlePOSelect(v)}
              />
            </Form.Item>
            <Form.Item label="Received Date" name="receivedDate"><DatePicker className="w-full" /></Form.Item>
            <Form.Item label="Delivery Note #" name="deliveryNoteNumber"><Input placeholder="DN-001" /></Form.Item>
            <Form.Item label="Vehicle Number" name="vehicleNumber"><Input placeholder="MH-01-AB-1234" /></Form.Item>
            <Form.Item label="Received By" name="receivedBy"><Input placeholder="Person name" /></Form.Item>
            <Form.Item label="Notes" name="notes" className="md:col-span-2"><Input.TextArea rows={1} placeholder="Any delivery notes..." /></Form.Item>
          </div>
        </Card>

        {items.length > 0 && (
          <Card title="Items Received" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <Table dataSource={items} columns={columns} rowKey="key" pagination={false} size="middle" scroll={{ x: 800 }} />
            <div className="mt-4 flex justify-end">
              <Button type="primary" size="large" icon={<CheckCircleOutlined />} loading={loading} onClick={onSubmit}>Create GRN</Button>
            </div>
          </Card>
        )}
      </Form>
    </div>
  );
}

export default function NewGRNPage() {
  return <Suspense fallback={<div className="flex justify-center py-20"><div className="page-spinner" /></div>}><GRNForm /></Suspense>;
}
