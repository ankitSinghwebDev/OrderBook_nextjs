import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import PurchaseOrder from '@/models/PurchaseOrder';
import Supplier from '@/models/Supplier';
import { sendMail } from '@/lib/email';
import { generatePOPdf } from '@/lib/generatePOPdf';

export async function POST(req, { params }) {
  const { user, error } = requireAuth(req);
  if (error) return error;

  await connectDB();
  const { id } = await params;
  const { recipientEmail, subject: customSubject, message: customMessage } = await req.json();

  const po = await PurchaseOrder.findOne({ _id: id, workspaceId: user.workspaceId }).lean();
  if (!po) return NextResponse.json({ success: false, message: 'PO not found' }, { status: 404 });

  // Determine recipient
  let toEmail = recipientEmail;
  if (!toEmail && po.supplierId) {
    try {
      const supplier = await Supplier.findById(po.supplierId).select('email').lean();
      toEmail = supplier?.email;
    } catch {}
  }

  if (!toEmail) {
    return NextResponse.json({ success: false, message: 'No recipient email. Please provide one or add email to supplier.' }, { status: 400 });
  }

  // Generate PDF
  const doc = generatePOPdf(po);
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

  const emailSubject = customSubject || `Purchase Order ${po.orderNumber} from OrderBook`;
  const emailBody = customMessage || `Please find attached Purchase Order ${po.orderNumber}.\n\nSupplier: ${po.supplier}\nTotal: ${po.currency} ${po.total?.toFixed(2)}\n\nPlease confirm receipt of this order.`;

  try {
    await sendMail({
      to: toEmail,
      subject: emailSubject,
      text: emailBody,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px">
        <h2 style="color:#4f46e5">Purchase Order ${po.orderNumber}</h2>
        <p>${emailBody.replace(/\n/g, '<br/>')}</p>
        <table style="border-collapse:collapse;margin:16px 0;width:100%">
          <tr><td style="padding:6px 12px;font-weight:bold;border:1px solid #e2e8f0">PO Number</td><td style="padding:6px 12px;border:1px solid #e2e8f0">${po.orderNumber}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;border:1px solid #e2e8f0">Supplier</td><td style="padding:6px 12px;border:1px solid #e2e8f0">${po.supplier}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;border:1px solid #e2e8f0">Total</td><td style="padding:6px 12px;border:1px solid #e2e8f0">${po.currency} ${po.total?.toFixed(2)}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;border:1px solid #e2e8f0">Items</td><td style="padding:6px 12px;border:1px solid #e2e8f0">${po.items?.length || 0} line items</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;border:1px solid #e2e8f0">Date</td><td style="padding:6px 12px;border:1px solid #e2e8f0">${new Date(po.orderDate).toLocaleDateString()}</td></tr>
        </table>
        <p style="color:#64748b;font-size:12px">PO PDF is attached to this email.</p>
      </div>`,
      attachments: [{ filename: `${po.orderNumber}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }],
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Failed to send email: ' + err.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: `PO emailed to ${toEmail}` });
}
