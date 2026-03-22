'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Alert, Button, Card, Col, DatePicker, Divider, Form, Input, InputNumber,
  Modal, Row, Select, Space, Table, Tag, Tooltip, Typography, message,
} from 'antd';
import {
  PlusOutlined, InboxOutlined, DeleteOutlined, FileTextOutlined,
  ShopOutlined, EnvironmentOutlined, InfoCircleOutlined, DollarOutlined,
  UserOutlined, CheckCircleOutlined, CopyOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

const { Title, Text } = Typography;

const currencySymbols = { USD: '$', EUR: '€', INR: '₹', GBP: '£', AUD: 'A$', CAD: 'C$', JPY: '¥', SGD: 'S$' };
const currencyOptions = Object.keys(currencySymbols);
const paymentTermsList = ['Net 15', 'Net 30', 'Net 45', 'Net 60', 'Net 90', 'Due on Receipt', 'Advance Payment', 'COD', '50% Advance + 50% on Delivery'];
const uomOptions = ['Nos', 'Pcs', 'Kg', 'Ltr', 'Mtr', 'Box', 'Set', 'Pair', 'Dozen', 'Pack', 'Roll', 'Bag', 'Ton', 'Sq.ft', 'Sq.mtr'];

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [suppliers, setSuppliers] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [items, setItems] = useState([
    { key: Date.now(), name: '', description: '', hsnCode: '', uom: 'Nos', qty: 1, rate: 0, discount: 0, tax: 0 },
  ]);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [addSupplierOpen, setAddSupplierOpen] = useState(false);
  const [addAddressOpen, setAddAddressOpen] = useState(false);
  const [newSupplierForm] = Form.useForm();
  const [newAddressForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [supRes, addrRes] = await Promise.all([api.listSuppliers(), api.listAddresses()]);
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

  const currency = Form.useWatch('currency', form) || 'INR';
  const sym = currencySymbols[currency] || currency;

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, i) => {
      const lineTotal = (Number(i.qty) || 0) * (Number(i.rate) || 0);
      return sum + lineTotal - lineTotal * (Number(i.discount) || 0) / 100;
    }, 0);
    const taxTotal = items.reduce((sum, i) => {
      const lineTotal = (Number(i.qty) || 0) * (Number(i.rate) || 0);
      const afterDisc = lineTotal - lineTotal * (Number(i.discount) || 0) / 100;
      return sum + afterDisc * (Number(i.tax) || 0) / 100;
    }, 0);
    const shipping = Number(form.getFieldValue('shipping') || 0);
    const discount = Number(form.getFieldValue('extraDiscount') || 0);
    const roundOff = Number(form.getFieldValue('roundOff') || 0);
    return { subtotal, taxTotal, total: subtotal + taxTotal + shipping - discount + roundOff, shipping, discount, roundOff };
  }, [items, form]);

  const updateItem = (key, field, value) =>
    setItems((prev) => prev.map((item) => (item.key === key ? { ...item, [field]: value } : item)));
  const addItem = () =>
    setItems((prev) => [...prev, { key: Date.now(), name: '', description: '', hsnCode: '', uom: 'Nos', qty: 1, rate: 0, discount: 0, tax: 0 }]);
  const removeItem = (key) => setItems((prev) => prev.filter((item) => item.key !== key));
  const duplicateItem = (key) => {
    const source = items.find((i) => i.key === key);
    if (source) setItems((prev) => [...prev, { ...source, key: Date.now() }]);
  };

  const parseBulk = () => {
    if (!bulkText.trim()) return;
    const parsed = bulkText.trim().split('\n')
      .map((line) => line.split(/,|\t/))
      .map(([name, qty, rate, tax, hsnCode]) => ({
        key: Date.now() + Math.random(), name: name?.trim() || '', description: '', hsnCode: hsnCode?.trim() || '',
        uom: 'Nos', qty: Number(qty) || 1, rate: Number(rate) || 0, discount: 0, tax: Number(tax) || 0,
      }))
      .filter((i) => i.name);
    if (!parsed.length) { message.warning('No valid lines. Format: Name, Qty, Rate, Tax%, HSN'); return; }
    setItems((prev) => [...prev, ...parsed]);
    setBulkModalOpen(false); setBulkText('');
    message.success(`Added ${parsed.length} items`);
  };

  const handleAddSupplier = async () => {
    try {
      const values = await newSupplierForm.validateFields();
      const res = await api.createSupplier(values);
      const created = res?.data;
      setSuppliers((prev) => [...prev, created]);
      form.setFieldsValue({ supplierId: created._id });
      setSelectedSupplier(created);
      setAddSupplierOpen(false); newSupplierForm.resetFields();
      message.success('Supplier created');
    } catch (err) { if (err?.message) message.error(err.message); }
  };

  const handleAddAddress = async () => {
    try {
      const values = await newAddressForm.validateFields();
      const res = await api.createAddress(values);
      const created = res?.data;
      setAddresses((prev) => [...prev, created]);
      form.setFieldsValue({ deliveryAddressId: created._id });
      setSelectedAddress(created);
      setAddAddressOpen(false); newAddressForm.resetFields();
      message.success('Address created');
    } catch (err) { if (err?.message) message.error(err.message); }
  };

  const submitPO = async (asDraft) => {
    try { await form.validateFields(); } catch { message.error('Please fill all required fields'); return; }
    if (!items.length || items.some((i) => !i.name || !i.qty || !i.rate)) {
      message.error('Each item must have a name, quantity, and rate.'); return;
    }
    asDraft ? setDraftLoading(true) : setLoading(true);
    try {
      const values = form.getFieldsValue(true);
      const addr = selectedAddress;
      await api.createPurchaseOrder({
        supplier: selectedSupplier?.name || 'Supplier',
        supplierId: values.supplierId || null,
        orderDate: values.orderDate ? values.orderDate.toISOString() : new Date().toISOString(),
        expectedDeliveryDate: values.expectedDeliveryDate ? values.expectedDeliveryDate.toISOString() : null,
        currency: values.currency,
        deliveryAddress: addr ? `${addr.label}, ${addr.line1}, ${addr.city}, ${addr.country}` : '',
        deliveryAddressId: values.deliveryAddressId || null,
        paymentTerms: values.paymentTerms || 'Net 30',
        notes: values.notes || '', internalNotes: values.internalNotes || '',
        items: items.map((i) => ({ name: i.name, description: i.description || '', qty: Number(i.qty) || 0, rate: Number(i.rate) || 0, tax: Number(i.tax) || 0 })),
        shipping: Number(values.shipping || 0), discount: Number(values.extraDiscount || 0),
        approverUserId: values.approverUserId || null,
        status: asDraft ? 'draft' : 'pending',
      });
      message.success(asDraft ? 'Draft saved' : 'Purchase order submitted');
      router.push('/purchase-orders');
    } catch (err) { message.error(err?.message || 'Failed to create PO'); }
    finally { setLoading(false); setDraftLoading(false); }
  };

  const itemColumns = [
    { title: '#', width: 48, align: 'center', render: (_, __, idx) => <Text type="secondary">{idx + 1}</Text> },
    {
      title: 'Item Name *', dataIndex: 'name', width: 220,
      render: (val, record) => <Input placeholder="Enter item name" value={val} onChange={(e) => updateItem(record.key, 'name', e.target.value)} status={!val ? 'error' : undefined} />,
    },
    {
      title: 'Description', dataIndex: 'description', width: 200,
      render: (val, record) => <Input placeholder="Optional description" value={val} onChange={(e) => updateItem(record.key, 'description', e.target.value)} />,
    },
    {
      title: 'HSN/SAC', dataIndex: 'hsnCode', width: 120,
      render: (val, record) => <Input placeholder="Code" value={val} onChange={(e) => updateItem(record.key, 'hsnCode', e.target.value)} />,
    },
    {
      title: 'UOM', dataIndex: 'uom', width: 100,
      render: (val, record) => <Select value={val || 'Nos'} style={{ width: '100%' }} onChange={(v) => updateItem(record.key, 'uom', v)} options={uomOptions.map((u) => ({ value: u, label: u }))} />,
    },
    {
      title: 'Qty *', dataIndex: 'qty', width: 100, align: 'right',
      render: (val, record) => <InputNumber min={0.01} value={val} className="w-full" onChange={(v) => updateItem(record.key, 'qty', v || 0)} status={!val ? 'error' : undefined} />,
    },
    {
      title: `Rate (${sym}) *`, dataIndex: 'rate', width: 130, align: 'right',
      render: (val, record) => <InputNumber min={0} value={val} className="w-full" onChange={(v) => updateItem(record.key, 'rate', v || 0)} formatter={(v) => v ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''} />,
    },
    {
      title: 'Disc %', dataIndex: 'discount', width: 90, align: 'right',
      render: (val, record) => <InputNumber min={0} max={100} value={val} className="w-full" onChange={(v) => updateItem(record.key, 'discount', v || 0)} />,
    },
    {
      title: 'Tax %', dataIndex: 'tax', width: 95, align: 'right',
      render: (val, record) => <Select value={val} style={{ width: '100%' }} onChange={(v) => updateItem(record.key, 'tax', v)} options={[0, 5, 12, 18, 28].map((t) => ({ value: t, label: `${t}%` }))} />,
    },
    {
      title: `Amount (${sym})`, width: 140, align: 'right',
      render: (_, record) => {
        const line = (Number(record.qty) || 0) * (Number(record.rate) || 0);
        const afterDisc = line - line * (Number(record.discount) || 0) / 100;
        const amount = afterDisc + afterDisc * (Number(record.tax) || 0) / 100;
        return <Text strong>{sym}{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>;
      },
    },
    {
      title: '', width: 80, align: 'center',
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="Duplicate"><Button type="text" size="small" icon={<CopyOutlined />} onClick={() => duplicateItem(record.key)} /></Tooltip>
          {items.length > 1 && <Tooltip title="Remove"><Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => removeItem(record.key)} /></Tooltip>}
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-24">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Title level={3} style={{ margin: 0, color: 'var(--foreground)' }}>
            <FileTextOutlined className="mr-2" style={{ color: 'var(--accent)' }} />
            New Purchase Order
          </Title>
          <Text type="secondary">PO number will be auto-generated on creation</Text>
        </div>
        <Space>
          <Button onClick={() => router.push('/purchase-orders')}>Cancel</Button>
          <Button icon={<FileTextOutlined />} loading={draftLoading} onClick={() => submitPO(true)}>Save Draft</Button>
          <Button type="primary" icon={<CheckCircleOutlined />} loading={loading} onClick={() => submitPO(false)} size="large">Submit for Approval</Button>
        </Space>
      </div>

      <Form form={form} layout="vertical" initialValues={{ currency: 'INR', shipping: 0, extraDiscount: 0, roundOff: 0, paymentTerms: 'Net 30' }}
        className="space-y-6"
      >
        {/* ── Section 1: Supplier + Delivery + Order Info ── */}
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={8}>
            <Card
              title={<span><ShopOutlined className="mr-2" style={{ color: 'var(--accent)' }} />Supplier Details</span>}
              style={{ background: 'var(--card)', borderColor: 'var(--border)', height: '100%' }}
              extra={<Button type="link" icon={<PlusOutlined />} onClick={() => setAddSupplierOpen(true)}>Add New</Button>}
            >
              <Form.Item label="Supplier" name="supplierId" rules={[{ required: true, message: 'Select a supplier' }]}>
                <Select
                  placeholder="Search or select supplier" size="large"
                  showSearch optionFilterProp="label" allowClear
                  options={suppliers.map((s) => ({ value: s._id, label: s.name }))}
                  onChange={(val) => setSelectedSupplier(suppliers.find((x) => x._id === val) || null)}
                  notFoundContent={<div className="text-center py-3"><Text type="secondary">No suppliers.</Text><br /><Button type="link" onClick={() => setAddSupplierOpen(true)}>Create one</Button></div>}
                />
              </Form.Item>
              {selectedSupplier && (
                <div className="rounded-lg p-4 space-y-1.5" style={{ background: 'var(--background)', border: '1px solid var(--border)' }}>
                  <div className="font-semibold" style={{ color: 'var(--foreground)' }}>{selectedSupplier.name}</div>
                  {selectedSupplier.email && <div className="text-xs" style={{ color: 'var(--muted)' }}>Email: {selectedSupplier.email}</div>}
                  {selectedSupplier.phone && <div className="text-xs" style={{ color: 'var(--muted)' }}>Phone: {selectedSupplier.phone}</div>}
                  {selectedSupplier.gstNumber && <div className="text-xs" style={{ color: 'var(--muted)' }}>GST: {selectedSupplier.gstNumber}</div>}
                  {selectedSupplier.address && <div className="text-xs" style={{ color: 'var(--muted)' }}>{selectedSupplier.address}{selectedSupplier.city ? `, ${selectedSupplier.city}` : ''}</div>}
                  {selectedSupplier.paymentTerms && <Tag color="blue" className="mt-2">{selectedSupplier.paymentTerms}</Tag>}
                </div>
              )}
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card
              title={<span><EnvironmentOutlined className="mr-2" style={{ color: 'var(--accent)' }} />Delivery Details</span>}
              style={{ background: 'var(--card)', borderColor: 'var(--border)', height: '100%' }}
              extra={<Button type="link" icon={<PlusOutlined />} onClick={() => setAddAddressOpen(true)}>Add New</Button>}
            >
              <Form.Item label="Ship To" name="deliveryAddressId">
                <Select placeholder="Select delivery address" size="large" allowClear
                  options={addresses.map((a) => ({ value: a._id, label: `${a.label} — ${a.city}, ${a.country}` }))}
                  onChange={(val) => setSelectedAddress(addresses.find((x) => x._id === val) || null)}
                />
              </Form.Item>
              {selectedAddress && (
                <div className="rounded-lg p-4 space-y-1 mb-4" style={{ background: 'var(--background)', border: '1px solid var(--border)' }}>
                  <div className="font-semibold" style={{ color: 'var(--foreground)' }}>{selectedAddress.label}</div>
                  <div className="text-xs" style={{ color: 'var(--muted)' }}>{selectedAddress.line1}{selectedAddress.line2 ? `, ${selectedAddress.line2}` : ''}</div>
                  <div className="text-xs" style={{ color: 'var(--muted)' }}>{selectedAddress.city}{selectedAddress.state ? `, ${selectedAddress.state}` : ''} {selectedAddress.pincode ? `- ${selectedAddress.pincode}` : ''}</div>
                  <div className="text-xs" style={{ color: 'var(--muted)' }}>{selectedAddress.country}</div>
                  {selectedAddress.contactPerson && <div className="text-xs" style={{ color: 'var(--muted)' }}>Contact: {selectedAddress.contactPerson}</div>}
                </div>
              )}
              <Form.Item label="Expected Delivery Date" name="expectedDeliveryDate">
                <DatePicker className="w-full" size="large" />
              </Form.Item>
              <Form.Item label="Delivery Instructions" name="deliveryNotes" style={{ marginBottom: 0 }}>
                <Input.TextArea rows={2} placeholder="Dock, timing, contact..." />
              </Form.Item>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card
              title={<span><InfoCircleOutlined className="mr-2" style={{ color: 'var(--accent)' }} />Order Information</span>}
              style={{ background: 'var(--card)', borderColor: 'var(--border)', height: '100%' }}
            >
              <Form.Item label="Order Date" name="orderDate" rules={[{ required: true, message: 'Required' }]}>
                <DatePicker className="w-full" size="large" />
              </Form.Item>
              <Form.Item label="Currency" name="currency" rules={[{ required: true }]}>
                <Select size="large" options={currencyOptions.map((c) => ({ value: c, label: `${c} (${currencySymbols[c]})` }))} />
              </Form.Item>
              <Form.Item label="Payment Terms" name="paymentTerms">
                <Select size="large" options={paymentTermsList.map((t) => ({ value: t, label: t }))} />
              </Form.Item>
              <Form.Item label="Reference / Quotation No." name="referenceNumber">
                <Input size="large" placeholder="e.g. QT-2026-045" />
              </Form.Item>
              <Form.Item label={<span><UserOutlined className="mr-1" />Approver</span>} name="approverUserId" style={{ marginBottom: 0 }}>
                <Select placeholder="Assign approver (optional)" size="large" allowClear showSearch optionFilterProp="label"
                  options={members.filter((m) => ['admin', 'manager'].includes(m.role)).map((m) => ({ value: m.userId || m._id, label: `${m.name} (${m.role})` }))}
                />
              </Form.Item>
            </Card>
          </Col>
        </Row>

        {/* ── Section 2: Line Items ── */}
        <Card
          title={<span><DollarOutlined className="mr-2" style={{ color: 'var(--accent)' }} />Line Items <Tag color="blue" className="ml-1">{items.length} item{items.length !== 1 ? 's' : ''}</Tag></span>}
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
          extra={
            <Space>
              <Button icon={<InboxOutlined />} onClick={() => setBulkModalOpen(true)}>Import CSV</Button>
              <Button type="primary" ghost icon={<PlusOutlined />} onClick={addItem}>Add Line</Button>
            </Space>
          }
        >
          <Table
            dataSource={items}
            columns={itemColumns}
            rowKey="key"
            pagination={false}
            size="middle"
            scroll={{ x: 1400 }}
            bordered
            footer={() => (
              <div className="flex justify-between items-center">
                <Button type="dashed" icon={<PlusOutlined />} onClick={addItem}>Add Another Item</Button>
                <Text type="secondary">{items.length} line item{items.length !== 1 ? 's' : ''}</Text>
              </div>
            )}
          />
        </Card>

        {/* ── Section 3: Notes + Financial Summary ── */}
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={10}>
            <Card title="Terms, Notes & Purpose" style={{ background: 'var(--card)', borderColor: 'var(--border)', height: '100%' }}>
              <Form.Item label="Terms & Conditions" name="notes">
                <Input.TextArea rows={3} placeholder="Goods once sold cannot be returned. Delivery within 7 business days..." />
              </Form.Item>
              <Form.Item label="Internal Notes (team only)" name="internalNotes">
                <Input.TextArea rows={2} placeholder="Notes visible only to your team..." />
              </Form.Item>
              <Form.Item label="Subject / Purpose" name="subject" style={{ marginBottom: 0 }}>
                <Input size="large" placeholder="e.g. Office supplies for Q2 2026" />
              </Form.Item>
            </Card>
          </Col>

          <Col xs={24} lg={14}>
            <Card title={<span><DollarOutlined className="mr-2" style={{ color: 'var(--accent)' }} />Financial Summary</span>}
              style={{ background: 'var(--card)', borderColor: 'var(--border)', height: '100%' }}
            >
              <Row gutter={[32, 16]}>
                <Col xs={24} md={10}>
                  <Form.Item label="Shipping / Freight" name="shipping">
                    <InputNumber className="w-full" size="large" min={0} prefix={sym} formatter={(v) => v ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''} />
                  </Form.Item>
                  <Form.Item label="Additional Discount" name="extraDiscount">
                    <InputNumber className="w-full" size="large" min={0} prefix={sym} formatter={(v) => v ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''} />
                  </Form.Item>
                  <Form.Item label="Round Off (+/-)" name="roundOff" style={{ marginBottom: 0 }}>
                    <InputNumber className="w-full" size="large" prefix={sym} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={14}>
                  <div className="rounded-xl p-5" style={{ background: 'var(--background)', border: '1px solid var(--border)', minHeight: 200 }}>
                    <div className="space-y-3">
                      <div className="flex justify-between"><Text type="secondary">Subtotal ({items.length} {items.length === 1 ? 'item' : 'items'})</Text><Text>{sym}{totals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text></div>
                      <div className="flex justify-between"><Text type="secondary">Tax (GST/VAT)</Text><Text>{sym}{totals.taxTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text></div>
                      {totals.shipping > 0 && <div className="flex justify-between"><Text type="secondary">Shipping</Text><Text>+{sym}{totals.shipping.toFixed(2)}</Text></div>}
                      {totals.discount > 0 && <div className="flex justify-between"><Text type="secondary">Discount</Text><Text type="danger">-{sym}{totals.discount.toFixed(2)}</Text></div>}
                      {totals.roundOff !== 0 && <div className="flex justify-between"><Text type="secondary">Round Off</Text><Text>{totals.roundOff > 0 ? '+' : ''}{sym}{totals.roundOff.toFixed(2)}</Text></div>}
                      <Divider style={{ margin: '10px 0' }} />
                      <div className="flex justify-between items-baseline">
                        <Text strong style={{ fontSize: 16 }}>Grand Total</Text>
                        <div className="text-right">
                          <Text strong style={{ fontSize: 22, color: 'var(--accent)' }}>
                            {sym}{totals.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </Text>
                          <br /><Text type="secondary" className="text-xs">{currency}</Text>
                        </div>
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Form>

      {/* ── Sticky Footer ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t py-4 px-6 lg:px-10" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="flex flex-wrap items-center justify-between gap-4 max-w-[1440px] mx-auto">
          <div className="flex items-center gap-4">
            <Text type="secondary">{items.length} item{items.length !== 1 ? 's' : ''}</Text>
            <Divider type="vertical" />
            <Text strong style={{ fontSize: 18, color: 'var(--accent)' }}>{sym}{totals.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
          </div>
          <Space>
            <Button onClick={() => router.push('/purchase-orders')}>Cancel</Button>
            <Button icon={<FileTextOutlined />} loading={draftLoading} onClick={() => submitPO(true)}>Save as Draft</Button>
            <Button type="primary" size="large" icon={<CheckCircleOutlined />} loading={loading} onClick={() => submitPO(false)}>Submit for Approval</Button>
          </Space>
        </div>
      </div>

      {/* Modals */}
      <Modal title="Import Items from CSV" open={bulkModalOpen} onOk={parseBulk} onCancel={() => setBulkModalOpen(false)} okText="Import" width={640}>
        <Alert type="info" showIcon className="mb-3" message="Paste item data in CSV format" description="Format: Name, Qty, Rate, Tax%, HSN (one item per line)" />
        <Input.TextArea rows={8} value={bulkText} onChange={(e) => setBulkText(e.target.value)}
          placeholder={`Steel Rod 10mm, 100, 450, 18, 72142090\nCement 50kg, 200, 380, 28, 25232910`}
          style={{ fontFamily: 'monospace', fontSize: 13 }}
        />
      </Modal>

      <Modal title="Add New Supplier" open={addSupplierOpen} onOk={handleAddSupplier} onCancel={() => { setAddSupplierOpen(false); newSupplierForm.resetFields(); }} okText="Create Supplier" width={640}>
        <Form form={newSupplierForm} layout="vertical" className="mt-4">
          <Row gutter={16}>
            <Col span={12}><Form.Item label="Supplier Name" name="name" rules={[{ required: true }]}><Input placeholder="ABC Pvt Ltd" /></Form.Item></Col>
            <Col span={12}><Form.Item label="Company" name="companyName"><Input placeholder="Company name" /></Form.Item></Col>
            <Col span={12}><Form.Item label="Email" name="email" rules={[{ type: 'email', message: 'Invalid' }]}><Input placeholder="vendor@company.com" /></Form.Item></Col>
            <Col span={12}><Form.Item label="Phone" name="phone"><Input placeholder="+91 98765 43210" /></Form.Item></Col>
            <Col span={12}><Form.Item label="Contact Person" name="contactPerson"><Input placeholder="John Doe" /></Form.Item></Col>
            <Col span={12}><Form.Item label="GST Number" name="gstNumber"><Input placeholder="22AAAAA0000A1Z5" /></Form.Item></Col>
            <Col span={24}><Form.Item label="Address" name="address"><Input placeholder="Street address" /></Form.Item></Col>
            <Col span={8}><Form.Item label="City" name="city"><Input /></Form.Item></Col>
            <Col span={8}><Form.Item label="State" name="state"><Input /></Form.Item></Col>
            <Col span={8}><Form.Item label="Country" name="country"><Input placeholder="India" /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>

      <Modal title="Add Delivery Address" open={addAddressOpen} onOk={handleAddAddress} onCancel={() => { setAddAddressOpen(false); newAddressForm.resetFields(); }} okText="Save Address" width={640}>
        <Form form={newAddressForm} layout="vertical" className="mt-4">
          <Row gutter={16}>
            <Col span={12}><Form.Item label="Label" name="label" rules={[{ required: true }]}><Input placeholder="e.g. Main Warehouse" /></Form.Item></Col>
            <Col span={12}><Form.Item label="Contact Person" name="contactPerson"><Input placeholder="Receiving person" /></Form.Item></Col>
            <Col span={24}><Form.Item label="Address Line 1" name="line1" rules={[{ required: true }]}><Input placeholder="Street, building..." /></Form.Item></Col>
            <Col span={24}><Form.Item label="Address Line 2" name="line2"><Input placeholder="Suite, floor..." /></Form.Item></Col>
            <Col span={8}><Form.Item label="City" name="city" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={8}><Form.Item label="State" name="state"><Input /></Form.Item></Col>
            <Col span={8}><Form.Item label="Pincode" name="pincode"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item label="Country" name="country" rules={[{ required: true }]}><Input placeholder="India" /></Form.Item></Col>
            <Col span={12}><Form.Item label="Phone" name="phone"><Input placeholder="Warehouse phone" /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
