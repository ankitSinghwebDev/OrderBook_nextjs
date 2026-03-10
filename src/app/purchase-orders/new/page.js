"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Typography,
  message,
} from "antd";
import { PlusOutlined, InboxOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

const { Title, Text } = Typography;
const currencyOptions = ["USD", "EUR", "INR", "GBP", "AUD"];

const starterSuppliers = [
  {
    id: "sup-1",
    name: "Acme Supplies",
    email: "orders@acme.com",
    phone: "555-1111",
  },
  {
    id: "sup-2",
    name: "Global Traders",
    email: "sales@global.com",
    phone: "555-2222",
  },
];

const starterAddresses = [
  {
    id: "addr-1",
    label: "HQ Warehouse",
    line1: "123 Industrial Ave",
    city: "NYC",
    country: "USA",
  },
  {
    id: "addr-2",
    label: "Secondary Hub",
    line1: "55 Logistics Park",
    city: "Dallas",
    country: "USA",
  },
];

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [userId, setUserId] = useState(null);
  const [workspaceId, setWorkspaceId] = useState(null);

  const [suppliers, setSuppliers] = useState(starterSuppliers);
  const [addresses] = useState(starterAddresses);
  const [selectedSupplier, setSelectedSupplier] = useState(
    starterSuppliers[0]?.id || null,
  );
  const [selectedAddress, setSelectedAddress] = useState(
    starterAddresses[0]?.id || null,
  );

  const [items, setItems] = useState([
    { name: "", description: "", qty: 1, rate: 0, tax: 0 },
  ]);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [addSupplierOpen, setAddSupplierOpen] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setUserId(localStorage.getItem("userId"));
    setWorkspaceId(localStorage.getItem("workspaceId"));
  }, []);

  const totals = useMemo(() => {
    const subtotal = items.reduce(
      (sum, i) => sum + (Number(i.qty) || 0) * (Number(i.rate) || 0),
      0,
    );
    const taxTotal = items.reduce(
      (sum, i) =>
        sum +
        ((Number(i.qty) || 0) * (Number(i.rate) || 0) * (Number(i.tax) || 0)) /
          100,
      0,
    );
    const shipping = Number(form.getFieldValue("shipping") || 0);
    const discount = Number(form.getFieldValue("discount") || 0);
    const total = subtotal + taxTotal + shipping - discount;
    return { subtotal, taxTotal, total, shipping, discount };
  }, [items, form]);

  const updateItem = (idx, field, value) => {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)),
    );
  };

  const addItem = () =>
    setItems((prev) => [
      ...prev,
      { name: "", description: "", qty: 1, rate: 0, tax: 0 },
    ]);
  const removeItem = (idx) =>
    setItems((prev) => prev.filter((_, i) => i !== idx));

  const parseBulk = () => {
    if (!bulkText.trim()) return;
    const lines = bulkText.trim().split("\n");
    const parsed = lines
      .map((line) => line.split(/,|\t/))
      .map(([name, qty, rate, tax]) => ({
        name: name?.trim() || "",
        description: "",
        qty: Number(qty) || 1,
        rate: Number(rate) || 0,
        tax: Number(tax) || 0,
      }))
      .filter((i) => i.name);
    if (!parsed.length) {
      message.warning("No valid lines found. Use: Name,Qty,Rate,Tax%");
      return;
    }
    setItems((prev) => [...prev, ...parsed]);
    setBulkModalOpen(false);
    setBulkText("");
  };

  const handleAddSupplier = () => {
    if (!newSupplier.name) {
      message.error("Supplier name is required");
      return;
    }
    const id = `sup-${Date.now()}`;
    const sup = { id, ...newSupplier };
    setSuppliers((prev) => [...prev, sup]);
    setSelectedSupplier(id);
    setAddSupplierOpen(false);
    setNewSupplier({ name: "", email: "", phone: "" });
  };

  const onFinish = async (values) => {
    if (!userId) {
      message.error("Please log in first.");
      return;
    }
    if (!items.length || items.some((i) => !i.name || !i.qty || !i.rate)) {
      message.error("Add at least one item with name, qty, and rate.");
      return;
    }

    setLoading(true);
    try {
      const supplierObj = suppliers.find((s) => s.id === selectedSupplier);
      const addressObj = addresses.find((a) => a.id === selectedAddress);
      const payload = {
        orderNumber: values.orderNumber,
        supplier: supplierObj?.name || values.supplierFallback || "Supplier",
        orderDate: values.orderDate
          ? values.orderDate.toISOString()
          : new Date().toISOString(),
        currency: values.currency,
        workspaceId: workspaceId || null,
        deliveryAddress: addressObj
          ? `${addressObj.label}, ${addressObj.line1}, ${addressObj.city}, ${addressObj.country}`
          : values.deliveryAddress || "",
        notes: values.notes || "",
        items,
        shipping: Number(values.shipping || 0),
        discount: Number(values.discount || 0),
        approverUserId: null,
        createdByUserId: userId,
      };

      await api.createPurchaseOrder(payload);

      message.success("Purchase order created");
      router.push("/purchase-orders");
    } catch (err) {
      message.error(err.message || "Failed to create PO");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen py-10"
      style={{ background: "var(--background)" }}
    >
      <div className="mx-auto max-w-6xl px-4 space-y-6">
        <div>
          <Title level={3} style={{ margin: 0, color: "var(--foreground)" }}>
            Create Purchase Order
          </Title>
          <Text type="secondary">
            Zoho-style layout with supplier, delivery, and bulk items.
          </Text>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ currency: "USD", shipping: 0, discount: 0 }}
        >
          <div className="grid gap-4 lg:grid-cols-3">
            <Card
              title="Supplier"
              style={{
                background: "var(--card)",
                borderColor: "var(--border)",
              }}
              extra={
                <Button
                  type="link"
                  icon={<PlusOutlined />}
                  onClick={() => setAddSupplierOpen(true)}
                >
                  New supplier
                </Button>
              }
            >
              <Form.Item label="Select supplier" required>
                <Select
                  value={selectedSupplier}
                  onChange={setSelectedSupplier}
                  options={suppliers.map((s) => ({
                    value: s.id,
                    label: s.name,
                  }))}
                  placeholder="Choose supplier"
                />
              </Form.Item>
              <Divider />
              <Form.Item label="Fallback supplier name" name="supplierFallback">
                <Input placeholder="If supplier not listed" />
              </Form.Item>
            </Card>

            <Card
              title="Delivery"
              style={{
                background: "var(--card)",
                borderColor: "var(--border)",
              }}
            >
              <Form.Item label="Deliver to" required>
                <Select
                  value={selectedAddress}
                  onChange={setSelectedAddress}
                  options={addresses.map((a) => ({
                    value: a.id,
                    label: `${a.label} • ${a.city}`,
                  }))}
                  placeholder="Select delivery address"
                />
              </Form.Item>
              <Form.Item label="Delivery instructions" name="deliveryAddress">
                <Input.TextArea
                  rows={3}
                  placeholder="Dock, contact, timing..."
                />
              </Form.Item>
            </Card>

            <Card
              title="PO Info"
              style={{
                background: "var(--card)",
                borderColor: "var(--border)",
              }}
            >
              <Form.Item
                label="PO Number"
                name="orderNumber"
                rules={[{ required: true }]}
              >
                <Input placeholder="PO-1001" />
              </Form.Item>
              <Form.Item
                label="PO Date"
                name="orderDate"
                rules={[{ required: true }]}
              >
                <DatePicker className="w-full" />
              </Form.Item>
              <Form.Item
                label="Currency"
                name="currency"
                rules={[{ required: true }]}
              >
                <Select
                  options={currencyOptions.map((c) => ({ value: c, label: c }))}
                />
              </Form.Item>
            </Card>
          </div>

          <Card
            title="Items"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
            extra={
              <Space>
                <Button
                  icon={<InboxOutlined />}
                  onClick={() => setBulkModalOpen(true)}
                >
                  Bulk add
                </Button>
                <Button type="dashed" icon={<PlusOutlined />} onClick={addItem}>
                  Add line
                </Button>
              </Space>
            }
          >
            <div className="hidden md:grid grid-cols-12 gap-2 text-xs font-semibold text-[var(--muted)] mb-2">
              <div className="col-span-3">Item</div>
              <div className="col-span-3">Description</div>
              <div className="col-span-2">Qty</div>
              <div className="col-span-2">Rate</div>
              <div className="col-span-1">Tax %</div>
              <div className="col-span-1 text-right">Amount</div>
            </div>
            <Space direction="vertical" className="w-full">
              {items.map((item, idx) => (
                <Card
                  key={idx}
                  size="small"
                  bordered
                  style={{ borderColor: "var(--border)" }}
                  bodyStyle={{ padding: "10px" }}
                >
                  <div className="grid gap-2 md:grid-cols-12 items-start">
                    <Input
                      className="md:col-span-3"
                      placeholder="Item name"
                      value={item.name}
                      onChange={(e) => updateItem(idx, "name", e.target.value)}
                    />
                    <Input
                      className="md:col-span-3"
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) =>
                        updateItem(idx, "description", e.target.value)
                      }
                    />
                    <InputNumber
                      className="md:col-span-2 w-full"
                      min={1}
                      value={item.qty}
                      onChange={(v) => updateItem(idx, "qty", v || 0)}
                    />
                    <InputNumber
                      className="md:col-span-2 w-full"
                      min={0}
                      value={item.rate}
                      onChange={(v) => updateItem(idx, "rate", v || 0)}
                      prefix={form.getFieldValue("currency") || ""}
                    />
                    <InputNumber
                      className="md:col-span-1 w-full"
                      min={0}
                      max={100}
                      value={item.tax}
                      onChange={(v) => updateItem(idx, "tax", v || 0)}
                      suffix="%"
                    />
                    <div className="md:col-span-1 flex items-center justify-between md:justify-end gap-2 text-sm">
                      <Text strong>
                        {(
                          (Number(item.qty) || 0) * (Number(item.rate) || 0) +
                          ((Number(item.qty) || 0) *
                            (Number(item.rate) || 0) *
                            (Number(item.tax) || 0)) /
                            100
                        ).toFixed(2)}
                      </Text>
                      {items.length > 1 && (
                        <Button
                          danger
                          size="small"
                          onClick={() => removeItem(idx)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </Space>
          </Card>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card
              title="Charges"
              style={{
                background: "var(--card)",
                borderColor: "var(--border)",
              }}
            >
              <Form.Item label="Shipping" name="shipping" initialValue={0}>
                <InputNumber className="w-full" min={0} />
              </Form.Item>
              <Form.Item label="Discount" name="discount" initialValue={0}>
                <InputNumber className="w-full" min={0} />
              </Form.Item>
              <Form.Item label="Terms & Conditions" name="notes">
                <Input.TextArea
                  rows={3}
                  placeholder="Payment terms, delivery window…"
                />
              </Form.Item>
            </Card>

            <Card
              title="Buyer Notes"
              style={{
                background: "var(--card)",
                borderColor: "var(--border)",
              }}
            >
              <Form.Item label="Internal notes" name="internalNotes">
                <Input.TextArea
                  rows={5}
                  placeholder="Visible to your team only"
                />
              </Form.Item>
              <Form.Item label="Supplier notes" name="publicNotes">
                <Input.TextArea rows={5} placeholder="Shown on PO" />
              </Form.Item>
            </Card>

            <Card
              title="Summary"
              style={{
                background: "var(--card)",
                borderColor: "var(--border)",
              }}
            >
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <Text type="secondary">Subtotal</Text>
                  <Text>{totals.subtotal.toFixed(2)}</Text>
                </div>
                <div className="flex justify-between">
                  <Text type="secondary">Tax</Text>
                  <Text>{totals.taxTotal.toFixed(2)}</Text>
                </div>
                <div className="flex justify-between">
                  <Text type="secondary">Shipping</Text>
                  <Text>{totals.shipping.toFixed(2)}</Text>
                </div>
                <div className="flex justify-between">
                  <Text type="secondary">Discount</Text>
                  <Text>-{totals.discount.toFixed(2)}</Text>
                </div>
                <Divider style={{ margin: "8px 0" }} />
                <div className="flex justify-between text-base font-semibold">
                  <Text>Total</Text>
                  <Text>
                    {(totals.total || 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>
                </div>
              </div>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                className="mt-4"
              >
                Create Purchase Order
              </Button>
            </Card>
          </div>
        </Form>
      </div>

      <Modal
        title="Bulk add items"
        open={bulkModalOpen}
        onOk={parseBulk}
        onCancel={() => setBulkModalOpen(false)}
        okText="Add"
      >
        <p className="text-sm text-[var(--muted)] mb-2">
          Paste lines in the format: <code>Name,Qty,Rate,Tax%</code>. One item
          per line.
        </p>
        <Input.TextArea
          rows={6}
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          placeholder="Widget A,10,12.5,5"
        />
      </Modal>

      <Modal
        title="Add supplier"
        open={addSupplierOpen}
        onOk={handleAddSupplier}
        onCancel={() => setAddSupplierOpen(false)}
        okText="Save"
      >
        <Space direction="vertical" className="w-full">
          <Input
            placeholder="Supplier name"
            value={newSupplier.name}
            onChange={(e) =>
              setNewSupplier((s) => ({ ...s, name: e.target.value }))
            }
          />
          <Input
            placeholder="Email (optional)"
            value={newSupplier.email}
            onChange={(e) =>
              setNewSupplier((s) => ({ ...s, email: e.target.value }))
            }
          />
          <Input
            placeholder="Phone (optional)"
            value={newSupplier.phone}
            onChange={(e) =>
              setNewSupplier((s) => ({ ...s, phone: e.target.value }))
            }
          />
        </Space>
      </Modal>
    </div>
  );
}
