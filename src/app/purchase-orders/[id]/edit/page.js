'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Card, DatePicker, Divider, Form, Input, InputNumber, Select, Space, Typography, message, Spin } from 'antd';
import { PlusOutlined, InboxOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { api } from '@/lib/api';

const { Title, Text } = Typography;
const currencyOptions = ['USD', 'EUR', 'INR', 'GBP', 'AUD'];

export default function EditPurchaseOrderPage() {
  const { id } = useParams();
  const router = useRouter();
  const [form] = Form.useForm();
  const [po, setPo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [poRes, supRes, addrRes] = await Promise.all([
          api.getPurchaseOrder(id),
          api.listSuppliers(),
          api.listAddresses(),
        ]);
        const poData = poRes?.data;
        if (!poData) { message.error('PO not found'); router.push('/purchase-orders'); return; }
        if (!['draft', 'pending', 'rejected'].includes(poData.status)) {
          message.warning('This PO cannot be edited');
          router.push(`/purchase-orders/${id}`);
          return;
        }
        setPo(poData);
        setItems(poData.items || []);
        setSuppliers(supRes?.data || []);
        setAddresses(addrRes?.data || []);
        form.setFieldsValue({
          supplierId: poData.supplierId || undefined,
          supplier: poData.supplier,
          orderDate: poData.orderDate ? dayjs(poData.orderDate) : undefined,
          expectedDeliveryDate: poData.expectedDeliveryDate ? dayjs(poData.expectedDeliveryDate) : undefined,
          currency: poData.currency,
          deliveryAddressId: poData.deliveryAddressId || undefined,
          paymentTerms: poData.paymentTerms,
          notes: poData.notes,
          internalNotes: poData.internalNotes,
          shipping: poData.shipping || 0,
          discount: poData.discount || 0,
          approverUserId: poData.approverUserId || undefined,
        });

        // Load workspace members for approver selection
        const wsId = typeof window !== 'undefined' ? localStorage.getItem('workspaceId') : null;
        if (wsId) {
          try {
            const memRes = await api.listWorkspaceMembers(wsId);
            setMembers(memRes?.data || memRes?.members || []);
          } catch { /* ignore */ }
        }
      } catch (err) {
        message.error(err?.message || 'Failed to load PO');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, i) => sum + (Number(i.qty) || 0) * (Number(i.rate) || 0), 0);
    const taxTotal = items.reduce((sum, i) => sum + ((Number(i.qty) || 0) * (Number(i.rate) || 0) * (Number(i.tax) || 0)) / 100, 0);
    const shipping = Number(form.getFieldValue('shipping') || 0);
    const discount = Number(form.getFieldValue('discount') || 0);
    return { subtotal, taxTotal, total: subtotal + taxTotal + shipping - discount, shipping, discount };
  }, [items, form]);

  const updateItem = (idx, field, value) => setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  const addItem = () => setItems((prev) => [...prev, { name: '', description: '', qty: 1, rate: 0, tax: 0 }]);
  const removeItem = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const onFinish = async (values) => {
    if (!items.length || items.some((i) => !i.name || !i.qty || !i.rate)) {
      message.error('Add at least one item with name, qty, and rate.');
      return;
    }
    setSaving(true);
    try {
      const selectedSupplier = suppliers.find((s) => s._id === values.supplierId);
      const selectedAddress = addresses.find((a) => a._id === values.deliveryAddressId);

      const payload = {
        supplier: selectedSupplier?.name || values.supplier || po.supplier,
        supplierId: values.supplierId || null,
        orderDate: values.orderDate ? values.orderDate.toISOString() : po.orderDate,
        expectedDeliveryDate: values.expectedDeliveryDate ? values.expectedDeliveryDate.toISOString() : null,
        currency: values.currency,
        deliveryAddress: selectedAddress ? `${selectedAddress.label}, ${selectedAddress.line1}, ${selectedAddress.city}, ${selectedAddress.country}` : po.deliveryAddress,
        deliveryAddressId: values.deliveryAddressId || null,
        paymentTerms: values.paymentTerms,
        notes: values.notes || '',
        internalNotes: values.internalNotes || '',
        items,
        shipping: Number(values.shipping || 0),
        discount: Number(values.discount || 0),
        approverUserId: values.approverUserId || null,
      };

      await api.updatePurchaseOrder(id, payload);
      message.success('Purchase order updated');
      router.push(`/purchase-orders/${id}`);
    } catch (err) {
      message.error(err?.message || 'Failed to update PO');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spin size="large" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.push(`/purchase-orders/${id}`)}>Back</Button>
        <div>
          <Title level={3} style={{ margin: 0, color: 'var(--foreground)' }}>Edit {po?.orderNumber}</Title>
          <Text type="secondary">Modify purchase order details</Text>
        </div>
      </div>

      <Form form={form} layout="vertical" onFinish={onFinish}>
        <div className="grid gap-4 lg:grid-cols-3">
          <Card title="Supplier" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <Form.Item label="Select supplier" name="supplierId">
              <Select
                placeholder="Choose supplier"
                allowClear
                showSearch
                optionFilterProp="label"
                options={suppliers.map((s) => ({ value: s._id, label: s.name }))}
                onChange={(val) => {
                  const s = suppliers.find((x) => x._id === val);
                  if (s) form.setFieldsValue({ supplier: s.name });
                }}
              />
            </Form.Item>
            <Form.Item label="Supplier name" name="supplier" rules={[{ required: true }]}>
              <Input placeholder="Supplier name" />
            </Form.Item>
          </Card>

          <Card title="Delivery" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <Form.Item label="Delivery address" name="deliveryAddressId">
              <Select
                placeholder="Select address"
                allowClear
                options={addresses.map((a) => ({ value: a._id, label: `${a.label} - ${a.city}` }))}
              />
            </Form.Item>
            <Form.Item label="Expected delivery" name="expectedDeliveryDate">
              <DatePicker className="w-full" />
            </Form.Item>
            <Form.Item label="Payment terms" name="paymentTerms">
              <Select options={['Net 15', 'Net 30', 'Net 45', 'Net 60', 'Due on Receipt', 'Advance'].map((t) => ({ value: t, label: t }))} />
            </Form.Item>
          </Card>

          <Card title="PO Info" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <Form.Item label="PO Date" name="orderDate" rules={[{ required: true }]}>
              <DatePicker className="w-full" />
            </Form.Item>
            <Form.Item label="Currency" name="currency" rules={[{ required: true }]}>
              <Select options={currencyOptions.map((c) => ({ value: c, label: c }))} />
            </Form.Item>
            <Form.Item label="Approver" name="approverUserId">
              <Select
                placeholder="Select approver"
                allowClear
                showSearch
                optionFilterProp="label"
                options={members.map((m) => ({ value: m.userId || m._id, label: `${m.name} (${m.role})` }))}
              />
            </Form.Item>
          </Card>
        </div>

        <Card title="Items" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
          extra={<Button type="dashed" icon={<PlusOutlined />} onClick={addItem}>Add line</Button>}
        >
          <div className="hidden md:grid grid-cols-12 gap-2 text-xs font-semibold text-[var(--muted)] mb-2">
            <div className="col-span-3">Item</div><div className="col-span-3">Description</div>
            <div className="col-span-2">Qty</div><div className="col-span-2">Rate</div>
            <div className="col-span-1">Tax %</div><div className="col-span-1 text-right">Amount</div>
          </div>
          <Space direction="vertical" className="w-full">
            {items.map((item, idx) => (
              <Card key={idx} size="small" bordered style={{ borderColor: 'var(--border)' }} bodyStyle={{ padding: '10px' }}>
                <div className="grid gap-2 md:grid-cols-12 items-start">
                  <Input className="md:col-span-3" placeholder="Item name" value={item.name} onChange={(e) => updateItem(idx, 'name', e.target.value)} />
                  <Input className="md:col-span-3" placeholder="Description" value={item.description} onChange={(e) => updateItem(idx, 'description', e.target.value)} />
                  <InputNumber className="md:col-span-2 w-full" min={1} value={item.qty} onChange={(v) => updateItem(idx, 'qty', v || 0)} />
                  <InputNumber className="md:col-span-2 w-full" min={0} value={item.rate} onChange={(v) => updateItem(idx, 'rate', v || 0)} />
                  <InputNumber className="md:col-span-1 w-full" min={0} max={100} value={item.tax} onChange={(v) => updateItem(idx, 'tax', v || 0)} suffix="%" />
                  <div className="md:col-span-1 flex items-center justify-between md:justify-end gap-2 text-sm">
                    <Text strong>{((Number(item.qty) || 0) * (Number(item.rate) || 0) + ((Number(item.qty) || 0) * (Number(item.rate) || 0) * (Number(item.tax) || 0)) / 100).toFixed(2)}</Text>
                    {items.length > 1 && <Button danger size="small" onClick={() => removeItem(idx)}>Remove</Button>}
                  </div>
                </div>
              </Card>
            ))}
          </Space>
        </Card>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card title="Charges" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <Form.Item label="Shipping" name="shipping"><InputNumber className="w-full" min={0} /></Form.Item>
            <Form.Item label="Discount" name="discount"><InputNumber className="w-full" min={0} /></Form.Item>
          </Card>
          <Card title="Notes" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <Form.Item label="Notes (visible on PO)" name="notes"><Input.TextArea rows={3} /></Form.Item>
            <Form.Item label="Internal notes" name="internalNotes"><Input.TextArea rows={3} /></Form.Item>
          </Card>
          <Card title="Summary" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><Text type="secondary">Subtotal</Text><Text>{totals.subtotal.toFixed(2)}</Text></div>
              <div className="flex justify-between"><Text type="secondary">Tax</Text><Text>{totals.taxTotal.toFixed(2)}</Text></div>
              <div className="flex justify-between"><Text type="secondary">Shipping</Text><Text>{totals.shipping.toFixed(2)}</Text></div>
              <div className="flex justify-between"><Text type="secondary">Discount</Text><Text>-{totals.discount.toFixed(2)}</Text></div>
              <Divider style={{ margin: '8px 0' }} />
              <div className="flex justify-between text-base font-semibold"><Text>Total</Text><Text>{totals.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text></div>
            </div>
            <Button type="primary" htmlType="submit" loading={saving} block className="mt-4">Save Changes</Button>
          </Card>
        </div>
      </Form>
    </div>
  );
}
