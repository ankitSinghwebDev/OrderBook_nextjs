'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, Card, DatePicker, Divider, Form, Input, InputNumber, Modal, Select, Space, Typography, message } from 'antd';
import { PlusOutlined, InboxOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

const { Title, Text } = Typography;
const currencyOptions = ['USD', 'EUR', 'INR', 'GBP', 'AUD'];

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [suppliers, setSuppliers] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [members, setMembers] = useState([]);
  const [items, setItems] = useState([{ name: '', description: '', qty: 1, rate: 0, tax: 0 }]);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [addSupplierOpen, setAddSupplierOpen] = useState(false);
  const [addAddressOpen, setAddAddressOpen] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ name: '', email: '', phone: '', contactPerson: '' });
  const [newAddress, setNewAddress] = useState({ label: '', line1: '', city: '', country: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [supRes, addrRes] = await Promise.all([
          api.listSuppliers(),
          api.listAddresses(),
        ]);
        setSuppliers(supRes?.data || []);
        setAddresses(addrRes?.data || []);
      } catch { /* ignore */ }

      const wsId = typeof window !== 'undefined' ? localStorage.getItem('workspaceId') : null;
      if (wsId) {
        try {
          const memRes = await api.listWorkspaceMembers(wsId);
          setMembers(memRes?.data || memRes?.members || []);
        } catch { /* ignore */ }
      }
    };
    loadData();
  }, []);

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

  const parseBulk = () => {
    if (!bulkText.trim()) return;
    const parsed = bulkText.trim().split('\n')
      .map((line) => line.split(/,|\t/))
      .map(([name, qty, rate, tax]) => ({ name: name?.trim() || '', description: '', qty: Number(qty) || 1, rate: Number(rate) || 0, tax: Number(tax) || 0 }))
      .filter((i) => i.name);
    if (!parsed.length) { message.warning('No valid lines. Use: Name,Qty,Rate,Tax%'); return; }
    setItems((prev) => [...prev, ...parsed]);
    setBulkModalOpen(false);
    setBulkText('');
  };

  const handleAddSupplier = async () => {
    if (!newSupplier.name) { message.error('Name is required'); return; }
    try {
      const res = await api.createSupplier(newSupplier);
      const created = res?.data;
      setSuppliers((prev) => [...prev, created]);
      form.setFieldsValue({ supplierId: created._id, supplier: created.name });
      setAddSupplierOpen(false);
      setNewSupplier({ name: '', email: '', phone: '', contactPerson: '' });
      message.success('Supplier created');
    } catch (err) {
      message.error(err?.message || 'Failed to create supplier');
    }
  };

  const handleAddAddress = async () => {
    if (!newAddress.label || !newAddress.line1 || !newAddress.city || !newAddress.country) {
      message.error('Label, address, city, and country are required');
      return;
    }
    try {
      const res = await api.createAddress(newAddress);
      const created = res?.data;
      setAddresses((prev) => [...prev, created]);
      form.setFieldsValue({ deliveryAddressId: created._id });
      setAddAddressOpen(false);
      setNewAddress({ label: '', line1: '', city: '', country: '' });
      message.success('Address created');
    } catch (err) {
      message.error(err?.message || 'Failed to create address');
    }
  };

  const onFinish = async (values) => {
    if (!items.length || items.some((i) => !i.name || !i.qty || !i.rate)) {
      message.error('Add at least one item with name, qty, and rate.');
      return;
    }
    setLoading(true);
    try {
      const selectedSupplier = suppliers.find((s) => s._id === values.supplierId);
      const selectedAddress = addresses.find((a) => a._id === values.deliveryAddressId);

      const payload = {
        supplier: selectedSupplier?.name || values.supplier || 'Supplier',
        supplierId: values.supplierId || null,
        orderDate: values.orderDate ? values.orderDate.toISOString() : new Date().toISOString(),
        expectedDeliveryDate: values.expectedDeliveryDate ? values.expectedDeliveryDate.toISOString() : null,
        currency: values.currency,
        deliveryAddress: selectedAddress ? `${selectedAddress.label}, ${selectedAddress.line1}, ${selectedAddress.city}, ${selectedAddress.country}` : '',
        deliveryAddressId: values.deliveryAddressId || null,
        paymentTerms: values.paymentTerms || 'Net 30',
        notes: values.notes || '',
        internalNotes: values.internalNotes || '',
        items,
        shipping: Number(values.shipping || 0),
        discount: Number(values.discount || 0),
        approverUserId: values.approverUserId || null,
        status: values.saveAsDraft ? 'draft' : 'pending',
      };

      await api.createPurchaseOrder(payload);
      message.success('Purchase order created');
      router.push('/purchase-orders');
    } catch (err) {
      message.error(err?.message || 'Failed to create PO');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Title level={3} style={{ margin: 0, color: 'var(--foreground)' }}>Create Purchase Order</Title>
        <Text type="secondary">PO number will be auto-generated</Text>
      </div>

      <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ currency: 'USD', shipping: 0, discount: 0, paymentTerms: 'Net 30' }}>
        <div className="grid gap-4 lg:grid-cols-3">
          <Card title="Supplier" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
            extra={<Button type="link" icon={<PlusOutlined />} onClick={() => setAddSupplierOpen(true)}>New</Button>}
          >
            <Form.Item label="Select supplier" name="supplierId" rules={[{ required: true, message: 'Select a supplier' }]}>
              <Select placeholder="Choose supplier" showSearch optionFilterProp="label"
                options={suppliers.map((s) => ({ value: s._id, label: s.name }))}
                onChange={(val) => { const s = suppliers.find((x) => x._id === val); if (s) form.setFieldsValue({ supplier: s.name }); }}
              />
            </Form.Item>
            <Form.Item name="supplier" hidden><Input /></Form.Item>
          </Card>

          <Card title="Delivery" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
            extra={<Button type="link" icon={<PlusOutlined />} onClick={() => setAddAddressOpen(true)}>New</Button>}
          >
            <Form.Item label="Delivery address" name="deliveryAddressId">
              <Select placeholder="Select address" allowClear
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
              <Select placeholder="Select approver (optional)" allowClear showSearch optionFilterProp="label"
                options={members.map((m) => ({ value: m.userId || m._id, label: `${m.name} (${m.role})` }))}
              />
            </Form.Item>
          </Card>
        </div>

        <Card title="Items" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
          extra={
            <Space>
              <Button icon={<InboxOutlined />} onClick={() => setBulkModalOpen(true)}>Bulk add</Button>
              <Button type="dashed" icon={<PlusOutlined />} onClick={addItem}>Add line</Button>
            </Space>
          }
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
          <Card title="Charges & Notes" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <Form.Item label="Shipping" name="shipping"><InputNumber className="w-full" min={0} /></Form.Item>
            <Form.Item label="Discount" name="discount"><InputNumber className="w-full" min={0} /></Form.Item>
            <Form.Item label="Notes (on PO)" name="notes"><Input.TextArea rows={3} placeholder="Payment terms, delivery..." /></Form.Item>
            <Form.Item label="Internal notes" name="internalNotes"><Input.TextArea rows={2} placeholder="Team only" /></Form.Item>
          </Card>

          <div className="lg:col-span-2">
            <Card title="Summary" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><Text type="secondary">Subtotal</Text><Text>{totals.subtotal.toFixed(2)}</Text></div>
                <div className="flex justify-between"><Text type="secondary">Tax</Text><Text>{totals.taxTotal.toFixed(2)}</Text></div>
                <div className="flex justify-between"><Text type="secondary">Shipping</Text><Text>{totals.shipping.toFixed(2)}</Text></div>
                <div className="flex justify-between"><Text type="secondary">Discount</Text><Text>-{totals.discount.toFixed(2)}</Text></div>
                <Divider style={{ margin: '8px 0' }} />
                <div className="flex justify-between text-lg font-bold"><Text>Total</Text><Text>{totals.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text></div>
              </div>
              <div className="mt-6 flex gap-3">
                <Button htmlType="submit" loading={loading} block onClick={() => form.setFieldsValue({ saveAsDraft: true })}>Save as Draft</Button>
                <Button type="primary" htmlType="submit" loading={loading} block onClick={() => form.setFieldsValue({ saveAsDraft: false })}>Create & Submit</Button>
              </div>
            </Card>
          </div>
        </div>
      </Form>

      <Modal title="Bulk add items" open={bulkModalOpen} onOk={parseBulk} onCancel={() => setBulkModalOpen(false)} okText="Add">
        <p className="text-sm mb-2" style={{ color: 'var(--muted)' }}>Paste lines: <code>Name,Qty,Rate,Tax%</code>. One per line.</p>
        <Input.TextArea rows={6} value={bulkText} onChange={(e) => setBulkText(e.target.value)} placeholder="Widget A,10,12.5,5" />
      </Modal>

      <Modal title="Add Supplier" open={addSupplierOpen} onOk={handleAddSupplier} onCancel={() => setAddSupplierOpen(false)} okText="Create">
        <Space direction="vertical" className="w-full">
          <Input placeholder="Supplier name *" value={newSupplier.name} onChange={(e) => setNewSupplier((s) => ({ ...s, name: e.target.value }))} />
          <Input placeholder="Email" value={newSupplier.email} onChange={(e) => setNewSupplier((s) => ({ ...s, email: e.target.value }))} />
          <Input placeholder="Phone" value={newSupplier.phone} onChange={(e) => setNewSupplier((s) => ({ ...s, phone: e.target.value }))} />
          <Input placeholder="Contact person" value={newSupplier.contactPerson} onChange={(e) => setNewSupplier((s) => ({ ...s, contactPerson: e.target.value }))} />
        </Space>
      </Modal>

      <Modal title="Add Address" open={addAddressOpen} onOk={handleAddAddress} onCancel={() => setAddAddressOpen(false)} okText="Create">
        <Space direction="vertical" className="w-full">
          <Input placeholder="Label (e.g. HQ Warehouse) *" value={newAddress.label} onChange={(e) => setNewAddress((s) => ({ ...s, label: e.target.value }))} />
          <Input placeholder="Address line 1 *" value={newAddress.line1} onChange={(e) => setNewAddress((s) => ({ ...s, line1: e.target.value }))} />
          <Input placeholder="City *" value={newAddress.city} onChange={(e) => setNewAddress((s) => ({ ...s, city: e.target.value }))} />
          <Input placeholder="Country *" value={newAddress.country} onChange={(e) => setNewAddress((s) => ({ ...s, country: e.target.value }))} />
        </Space>
      </Modal>
    </div>
  );
}
