'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Alert, Button, Card, Col, DatePicker, Descriptions, Divider, Form, Input, InputNumber,
  Modal, Row, Select, Space, Steps, Table, Tag, Tooltip, Typography, message,
} from 'antd';
import {
  PlusOutlined, InboxOutlined, DeleteOutlined, FileTextOutlined,
  ShopOutlined, EnvironmentOutlined, InfoCircleOutlined, DollarOutlined,
  UserOutlined, CheckCircleOutlined, CopyOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

const { Title, Text, Paragraph } = Typography;

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

  const currency = Form.useWatch('currency', form) || 'USD';
  const sym = currencySymbols[currency] || currency;

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, i) => {
      const lineTotal = (Number(i.qty) || 0) * (Number(i.rate) || 0);
      const lineDiscount = lineTotal * (Number(i.discount) || 0) / 100;
      return sum + lineTotal - lineDiscount;
    }, 0);
    const taxTotal = items.reduce((sum, i) => {
      const lineTotal = (Number(i.qty) || 0) * (Number(i.rate) || 0);
      const lineDiscount = lineTotal * (Number(i.discount) || 0) / 100;
      return sum + ((lineTotal - lineDiscount) * (Number(i.tax) || 0)) / 100;
    }, 0);
    const shipping = Number(form.getFieldValue('shipping') || 0);
    const discount = Number(form.getFieldValue('extraDiscount') || 0);
    const roundOff = Number(form.getFieldValue('roundOff') || 0);
    const total = subtotal + taxTotal + shipping - discount + roundOff;
    return { subtotal, taxTotal, total, shipping, discount, roundOff, itemCount: items.length };
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
        key: Date.now() + Math.random(),
        name: name?.trim() || '', description: '', hsnCode: hsnCode?.trim() || '', uom: 'Nos',
        qty: Number(qty) || 1, rate: Number(rate) || 0, discount: 0, tax: Number(tax) || 0,
      }))
      .filter((i) => i.name);
    if (!parsed.length) { message.warning('No valid lines. Format: Name, Qty, Rate, Tax%, HSN'); return; }
    setItems((prev) => [...prev, ...parsed]);
    setBulkModalOpen(false);
    setBulkText('');
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
      setAddSupplierOpen(false);
      newSupplierForm.resetFields();
      message.success('Supplier created');
    } catch (err) {
      if (err?.message) message.error(err.message);
    }
  };

  const handleAddAddress = async () => {
    try {
      const values = await newAddressForm.validateFields();
      const res = await api.createAddress(values);
      const created = res?.data;
      setAddresses((prev) => [...prev, created]);
      form.setFieldsValue({ deliveryAddressId: created._id });
      setSelectedAddress(created);
      setAddAddressOpen(false);
      newAddressForm.resetFields();
      message.success('Address created');
    } catch (err) {
      if (err?.message) message.error(err.message);
    }
  };

  const handleSupplierChange = (val) => {
    const s = suppliers.find((x) => x._id === val);
    setSelectedSupplier(s || null);
  };

  const handleAddressChange = (val) => {
    const a = addresses.find((x) => x._id === val);
    setSelectedAddress(a || null);
  };

  const submitPO = async (asDraft) => {
    try {
      await form.validateFields();
    } catch {
      message.error('Please fill all required fields');
      return;
    }

    if (!items.length || items.some((i) => !i.name || !i.qty || !i.rate)) {
      message.error('Each item must have a name, quantity, and rate.');
      return;
    }

    asDraft ? setDraftLoading(true) : setLoading(true);
    try {
      const values = form.getFieldsValue(true);
      const addr = selectedAddress;

      const payload = {
        supplier: selectedSupplier?.name || 'Supplier',
        supplierId: values.supplierId || null,
        orderDate: values.orderDate ? values.orderDate.toISOString() : new Date().toISOString(),
        expectedDeliveryDate: values.expectedDeliveryDate ? values.expectedDeliveryDate.toISOString() : null,
        currency: values.currency,
        deliveryAddress: addr ? `${addr.label}, ${addr.line1}, ${addr.city}, ${addr.country}` : '',
        deliveryAddressId: values.deliveryAddressId || null,
        paymentTerms: values.paymentTerms || 'Net 30',
        notes: values.notes || '',
        internalNotes: values.internalNotes || '',
        items: items.map((i) => ({
          name: i.name,
          description: i.description || '',
          qty: Number(i.qty) || 0,
          rate: Number(i.rate) || 0,
          tax: Number(i.tax) || 0,
        })),
        shipping: Number(values.shipping || 0),
        discount: Number(values.extraDiscount || 0),
        approverUserId: values.approverUserId || null,
        status: asDraft ? 'draft' : 'pending',
      };

      await api.createPurchaseOrder(payload);
      message.success(asDraft ? 'Draft saved' : 'Purchase order submitted');
      router.push('/purchase-orders');
    } catch (err) {
      message.error(err?.message || 'Failed to create PO');
    } finally {
      setLoading(false);
      setDraftLoading(false);
    }
  };

  // Items table columns
  const itemColumns = [
    {
      title: '#', width: 45, align: 'center',
      render: (_, __, idx) => <Text type="secondary">{idx + 1}</Text>,
    },
    {
      title: 'Item Name *', dataIndex: 'name', width: 180,
      render: (val, record) => (
        <Input size="small" placeholder="Item name" value={val}
          onChange={(e) => updateItem(record.key, 'name', e.target.value)}
          status={!val ? 'error' : undefined}
        />
      ),
    },
    {
      title: 'Description', dataIndex: 'description', width: 160,
      render: (val, record) => (
        <Input size="small" placeholder="Description" value={val}
          onChange={(e) => updateItem(record.key, 'description', e.target.value)}
        />
      ),
    },
    {
      title: 'HSN/SAC', dataIndex: 'hsnCode', width: 100,
      render: (val, record) => (
        <Input size="small" placeholder="HSN" value={val}
          onChange={(e) => updateItem(record.key, 'hsnCode', e.target.value)}
        />
      ),
    },
    {
      title: 'UOM', dataIndex: 'uom', width: 85,
      render: (val, record) => (
        <Select size="small" value={val || 'Nos'} style={{ width: '100%' }}
          onChange={(v) => updateItem(record.key, 'uom', v)}
          options={uomOptions.map((u) => ({ value: u, label: u }))}
        />
      ),
    },
    {
      title: 'Qty *', dataIndex: 'qty', width: 80, align: 'right',
      render: (val, record) => (
        <InputNumber size="small" min={0.01} value={val} className="w-full"
          onChange={(v) => updateItem(record.key, 'qty', v || 0)}
          status={!val ? 'error' : undefined}
        />
      ),
    },
    {
      title: `Rate (${sym}) *`, dataIndex: 'rate', width: 110, align: 'right',
      render: (val, record) => (
        <InputNumber size="small" min={0} value={val} className="w-full"
          onChange={(v) => updateItem(record.key, 'rate', v || 0)}
          status={!val && val !== 0 ? 'error' : undefined}
          formatter={(v) => v ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''}
        />
      ),
    },
    {
      title: 'Disc %', dataIndex: 'discount', width: 75, align: 'right',
      render: (val, record) => (
        <InputNumber size="small" min={0} max={100} value={val} className="w-full"
          onChange={(v) => updateItem(record.key, 'discount', v || 0)}
        />
      ),
    },
    {
      title: 'Tax %', dataIndex: 'tax', width: 75, align: 'right',
      render: (val, record) => (
        <Select size="small" value={val} style={{ width: '100%' }}
          onChange={(v) => updateItem(record.key, 'tax', v)}
          options={[0, 5, 12, 18, 28].map((t) => ({ value: t, label: `${t}%` }))}
        />
      ),
    },
    {
      title: `Amount (${sym})`, width: 120, align: 'right',
      render: (_, record) => {
        const lineTotal = (Number(record.qty) || 0) * (Number(record.rate) || 0);
        const disc = lineTotal * (Number(record.discount) || 0) / 100;
        const taxAmt = (lineTotal - disc) * (Number(record.tax) || 0) / 100;
        const amount = lineTotal - disc + taxAmt;
        return <Text strong>{sym}{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>;
      },
    },
    {
      title: '', width: 70, align: 'center',
      render: (_, record) => (
        <Space size={2}>
          <Tooltip title="Duplicate"><Button type="text" size="small" icon={<CopyOutlined />} onClick={() => duplicateItem(record.key)} /></Tooltip>
          {items.length > 1 && (
            <Tooltip title="Remove"><Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => removeItem(record.key)} /></Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Title level={3} style={{ margin: 0, color: 'var(--foreground)' }}>
            <FileTextOutlined className="mr-2" style={{ color: 'var(--accent)' }} />
            New Purchase Order
          </Title>
          <Text type="secondary" className="text-sm">PO number will be auto-generated on creation</Text>
        </div>
        <Space>
          <Button onClick={() => router.push('/purchase-orders')}>Cancel</Button>
          <Button icon={<FileTextOutlined />} loading={draftLoading} onClick={() => submitPO(true)}>Save Draft</Button>
          <Button type="primary" icon={<CheckCircleOutlined />} loading={loading} onClick={() => submitPO(false)}>Submit for Approval</Button>
        </Space>
      </div>

      <Form form={form} layout="vertical" initialValues={{ currency: 'INR', shipping: 0, extraDiscount: 0, roundOff: 0, paymentTerms: 'Net 30' }}>

        {/* Section 1: Supplier + Delivery + Order Info */}
        <Row gutter={[16, 16]}>
          {/* Supplier */}
          <Col xs={24} lg={8}>
            <Card
              size="small"
              title={<span><ShopOutlined className="mr-2" style={{ color: 'var(--accent)' }} />Supplier Details</span>}
              style={{ background: 'var(--card)', borderColor: 'var(--border)', height: '100%' }}
              extra={<Button type="link" size="small" icon={<PlusOutlined />} onClick={() => setAddSupplierOpen(true)}>Add New</Button>}
            >
              <Form.Item label="Supplier" name="supplierId" rules={[{ required: true, message: 'Select a supplier' }]} style={{ marginBottom: 12 }}>
                <Select
                  placeholder="Search or select supplier"
                  showSearch optionFilterProp="label" allowClear
                  options={suppliers.map((s) => ({ value: s._id, label: s.name }))}
                  onChange={handleSupplierChange}
                  notFoundContent={<div className="text-center py-3"><Text type="secondary">No suppliers yet.</Text><br /><Button type="link" size="small" onClick={() => setAddSupplierOpen(true)}>Create one</Button></div>}
                />
              </Form.Item>

              {selectedSupplier && (
                <div className="rounded-lg p-3 text-xs space-y-1" style={{ background: 'var(--background)', border: '1px solid var(--border)' }}>
                  <div className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{selectedSupplier.name}</div>
                  {selectedSupplier.email && <div style={{ color: 'var(--muted)' }}>Email: {selectedSupplier.email}</div>}
                  {selectedSupplier.phone && <div style={{ color: 'var(--muted)' }}>Phone: {selectedSupplier.phone}</div>}
                  {selectedSupplier.gstNumber && <div style={{ color: 'var(--muted)' }}>GST: {selectedSupplier.gstNumber}</div>}
                  {selectedSupplier.address && <div style={{ color: 'var(--muted)' }}>{selectedSupplier.address}{selectedSupplier.city ? `, ${selectedSupplier.city}` : ''}</div>}
                  {selectedSupplier.paymentTerms && <Tag color="blue" className="mt-1">{selectedSupplier.paymentTerms}</Tag>}
                </div>
              )}
            </Card>
          </Col>

          {/* Delivery */}
          <Col xs={24} lg={8}>
            <Card
              size="small"
              title={<span><EnvironmentOutlined className="mr-2" style={{ color: 'var(--accent)' }} />Delivery Details</span>}
              style={{ background: 'var(--card)', borderColor: 'var(--border)', height: '100%' }}
              extra={<Button type="link" size="small" icon={<PlusOutlined />} onClick={() => setAddAddressOpen(true)}>Add New</Button>}
            >
              <Form.Item label="Ship To" name="deliveryAddressId" style={{ marginBottom: 12 }}>
                <Select placeholder="Select delivery address" allowClear
                  options={addresses.map((a) => ({ value: a._id, label: `${a.label} - ${a.city}, ${a.country}` }))}
                  onChange={handleAddressChange}
                />
              </Form.Item>

              {selectedAddress && (
                <div className="rounded-lg p-3 text-xs space-y-1 mb-3" style={{ background: 'var(--background)', border: '1px solid var(--border)' }}>
                  <div className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{selectedAddress.label}</div>
                  <div style={{ color: 'var(--muted)' }}>{selectedAddress.line1}{selectedAddress.line2 ? `, ${selectedAddress.line2}` : ''}</div>
                  <div style={{ color: 'var(--muted)' }}>{selectedAddress.city}{selectedAddress.state ? `, ${selectedAddress.state}` : ''} - {selectedAddress.pincode}</div>
                  <div style={{ color: 'var(--muted)' }}>{selectedAddress.country}</div>
                  {selectedAddress.contactPerson && <div style={{ color: 'var(--muted)' }}>Contact: {selectedAddress.contactPerson}</div>}
                </div>
              )}

              <Form.Item label="Expected Delivery Date" name="expectedDeliveryDate" style={{ marginBottom: 12 }}>
                <DatePicker className="w-full" />
              </Form.Item>
              <Form.Item label="Delivery Instructions" name="deliveryNotes" style={{ marginBottom: 0 }}>
                <Input.TextArea rows={2} placeholder="Dock, timing, contact..." />
              </Form.Item>
            </Card>
          </Col>

          {/* Order Info */}
          <Col xs={24} lg={8}>
            <Card
              size="small"
              title={<span><InfoCircleOutlined className="mr-2" style={{ color: 'var(--accent)' }} />Order Information</span>}
              style={{ background: 'var(--card)', borderColor: 'var(--border)', height: '100%' }}
            >
              <Form.Item label="Order Date" name="orderDate" rules={[{ required: true, message: 'Required' }]} style={{ marginBottom: 12 }}>
                <DatePicker className="w-full" />
              </Form.Item>
              <Form.Item label="Currency" name="currency" rules={[{ required: true }]} style={{ marginBottom: 12 }}>
                <Select options={currencyOptions.map((c) => ({ value: c, label: `${c} (${currencySymbols[c]})` }))} />
              </Form.Item>
              <Form.Item label="Payment Terms" name="paymentTerms" style={{ marginBottom: 12 }}>
                <Select options={paymentTermsList.map((t) => ({ value: t, label: t }))} />
              </Form.Item>
              <Form.Item label="Reference / Quotation No." name="referenceNumber" style={{ marginBottom: 12 }}>
                <Input placeholder="e.g. QT-2026-045" />
              </Form.Item>
              <Form.Item
                label={<span><UserOutlined className="mr-1" />Approver</span>}
                name="approverUserId" style={{ marginBottom: 0 }}
              >
                <Select placeholder="Assign approver (optional)" allowClear showSearch optionFilterProp="label"
                  options={members.filter((m) => ['admin', 'manager'].includes(m.role)).map((m) => ({
                    value: m.userId || m._id, label: `${m.name} (${m.role})`,
                  }))}
                />
              </Form.Item>
            </Card>
          </Col>
        </Row>

        {/* Section 2: Items Table */}
        <Card
          size="small"
          title={<span><DollarOutlined className="mr-2" style={{ color: 'var(--accent)' }} />Line Items <Tag color="blue">{items.length} item{items.length !== 1 ? 's' : ''}</Tag></span>}
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
          extra={
            <Space>
              <Button size="small" icon={<InboxOutlined />} onClick={() => setBulkModalOpen(true)}>Import CSV</Button>
              <Button size="small" type="primary" ghost icon={<PlusOutlined />} onClick={addItem}>Add Line</Button>
            </Space>
          }
        >
          <Table
            dataSource={items}
            columns={itemColumns}
            rowKey="key"
            pagination={false}
            size="small"
            scroll={{ x: 1100 }}
            bordered
            footer={() => (
              <div className="flex justify-between items-center">
                <Button type="dashed" icon={<PlusOutlined />} onClick={addItem} size="small">Add Another Item</Button>
                <Text type="secondary" className="text-xs">{items.length} line item{items.length !== 1 ? 's' : ''}</Text>
              </div>
            )}
          />
        </Card>

        {/* Section 3: Summary + Notes */}
        <Row gutter={[16, 16]}>
          {/* Notes */}
          <Col xs={24} lg={10}>
            <Card size="small" title="Terms, Notes & Attachments" style={{ background: 'var(--card)', borderColor: 'var(--border)', height: '100%' }}>
              <Form.Item label="Terms & Conditions" name="notes" style={{ marginBottom: 12 }}>
                <Input.TextArea rows={3} placeholder="e.g. Goods once sold cannot be returned. Delivery within 7 business days..." />
              </Form.Item>
              <Form.Item label="Internal Notes (not visible on PO)" name="internalNotes" style={{ marginBottom: 12 }}>
                <Input.TextArea rows={2} placeholder="Notes for your team only..." />
              </Form.Item>
              <Form.Item label="Subject / Purpose" name="subject" style={{ marginBottom: 0 }}>
                <Input placeholder="e.g. Office supplies for Q2 2026" />
              </Form.Item>
            </Card>
          </Col>

          {/* Financial Summary */}
          <Col xs={24} lg={14}>
            <Card size="small" title={<span><DollarOutlined className="mr-2" style={{ color: 'var(--accent)' }} />Financial Summary</span>}
              style={{ background: 'var(--card)', borderColor: 'var(--border)', height: '100%' }}
            >
              <Row gutter={24}>
                <Col xs={24} sm={10}>
                  <Form.Item label="Shipping / Freight" name="shipping" style={{ marginBottom: 10 }}>
                    <InputNumber className="w-full" min={0} prefix={sym}
                      formatter={(v) => v ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''}
                    />
                  </Form.Item>
                  <Form.Item label="Additional Discount" name="extraDiscount" style={{ marginBottom: 10 }}>
                    <InputNumber className="w-full" min={0} prefix={sym}
                      formatter={(v) => v ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''}
                    />
                  </Form.Item>
                  <Form.Item label="Round Off (+/-)" name="roundOff" style={{ marginBottom: 0 }}>
                    <InputNumber className="w-full" prefix={sym} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={14}>
                  <div className="rounded-xl p-4 h-full" style={{ background: 'var(--background)', border: '1px solid var(--border)' }}>
                    <div className="space-y-2.5">
                      <div className="flex justify-between text-sm">
                        <Text type="secondary">Subtotal ({items.length} items)</Text>
                        <Text>{sym}{totals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                      </div>
                      <div className="flex justify-between text-sm">
                        <Text type="secondary">Tax (GST/VAT)</Text>
                        <Text>{sym}{totals.taxTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                      </div>
                      {totals.shipping > 0 && (
                        <div className="flex justify-between text-sm">
                          <Text type="secondary">Shipping / Freight</Text>
                          <Text>+{sym}{totals.shipping.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                        </div>
                      )}
                      {totals.discount > 0 && (
                        <div className="flex justify-between text-sm">
                          <Text type="secondary">Discount</Text>
                          <Text type="danger">-{sym}{totals.discount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                        </div>
                      )}
                      {totals.roundOff !== 0 && (
                        <div className="flex justify-between text-sm">
                          <Text type="secondary">Round Off</Text>
                          <Text>{totals.roundOff > 0 ? '+' : ''}{sym}{totals.roundOff.toFixed(2)}</Text>
                        </div>
                      )}
                      <Divider style={{ margin: '8px 0' }} />
                      <div className="flex justify-between items-baseline">
                        <Text strong className="text-base">Grand Total</Text>
                        <div className="text-right">
                          <Text strong className="text-xl" style={{ color: 'var(--accent)' }}>
                            {sym}{totals.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </Text>
                          <br />
                          <Text type="secondary" className="text-xs">{currency}</Text>
                        </div>
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 z-10 -mx-6 px-6 py-4 border-t backdrop-blur-md" style={{ background: 'color-mix(in srgb, var(--card) 92%, transparent)', borderColor: 'var(--border)' }}>
          <div className="flex flex-wrap items-center justify-between gap-4 max-w-6xl mx-auto">
            <div className="flex items-center gap-4">
              <Text type="secondary" className="text-sm">{items.length} item{items.length !== 1 ? 's' : ''}</Text>
              <Divider type="vertical" />
              <Text strong className="text-lg" style={{ color: 'var(--accent)' }}>{sym}{totals.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            </div>
            <Space>
              <Button onClick={() => router.push('/purchase-orders')}>Cancel</Button>
              <Button icon={<FileTextOutlined />} loading={draftLoading} onClick={() => submitPO(true)}>Save as Draft</Button>
              <Button type="primary" size="large" icon={<CheckCircleOutlined />} loading={loading} onClick={() => submitPO(false)}>
                Submit for Approval
              </Button>
            </Space>
          </div>
        </div>
      </Form>

      {/* Bulk Import Modal */}
      <Modal title="Import Items from CSV" open={bulkModalOpen} onOk={parseBulk} onCancel={() => setBulkModalOpen(false)} okText="Import" width={600}>
        <Alert type="info" showIcon className="mb-3"
          message="Paste item data in CSV format"
          description="Format: Name, Qty, Rate, Tax%, HSN (one item per line)"
        />
        <Input.TextArea rows={8} value={bulkText} onChange={(e) => setBulkText(e.target.value)}
          placeholder={`Steel Rod 10mm, 100, 450, 18, 72142090\nCement 50kg, 200, 380, 28, 25232910\nPaint 20L, 10, 1200, 18, 32091000`}
          style={{ fontFamily: 'monospace', fontSize: 13 }}
        />
      </Modal>

      {/* Add Supplier Modal */}
      <Modal title="Add New Supplier" open={addSupplierOpen} onOk={handleAddSupplier} onCancel={() => { setAddSupplierOpen(false); newSupplierForm.resetFields(); }} okText="Create Supplier" width={560}>
        <Form form={newSupplierForm} layout="vertical" className="mt-4">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Supplier Name" name="name" rules={[{ required: true }]}><Input placeholder="ABC Pvt Ltd" /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Company" name="companyName"><Input placeholder="Company name" /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Email" name="email" rules={[{ type: 'email', message: 'Invalid email' }]}><Input placeholder="vendor@company.com" /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Phone" name="phone"><Input placeholder="+91 98765 43210" /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Contact Person" name="contactPerson"><Input placeholder="John Doe" /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="GST Number" name="gstNumber"><Input placeholder="22AAAAA0000A1Z5" /></Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Address" name="address"><Input placeholder="Street address" /></Form.Item>
            </Col>
            <Col span={8}><Form.Item label="City" name="city"><Input /></Form.Item></Col>
            <Col span={8}><Form.Item label="State" name="state"><Input /></Form.Item></Col>
            <Col span={8}><Form.Item label="Country" name="country"><Input placeholder="India" /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>

      {/* Add Address Modal */}
      <Modal title="Add Delivery Address" open={addAddressOpen} onOk={handleAddAddress} onCancel={() => { setAddAddressOpen(false); newAddressForm.resetFields(); }} okText="Save Address" width={560}>
        <Form form={newAddressForm} layout="vertical" className="mt-4">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Label" name="label" rules={[{ required: true }]}><Input placeholder="e.g. Main Warehouse" /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Contact Person" name="contactPerson"><Input placeholder="Receiving person" /></Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Address Line 1" name="line1" rules={[{ required: true }]}><Input placeholder="Street, building..." /></Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Address Line 2" name="line2"><Input placeholder="Suite, floor..." /></Form.Item>
            </Col>
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
