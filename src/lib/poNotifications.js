import { sendMail } from './email';
import User from '../models/User';

const APP_URL = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function notifyApproverNewPO(po) {
  if (!po.approverUserId) return;
  try {
    const approver = await User.findById(po.approverUserId).select('name email').lean();
    if (!approver?.email) return;

    await sendMail({
      to: approver.email,
      subject: `New PO awaiting your approval: ${po.orderNumber}`,
      html: `
        <h2>Purchase Order Awaiting Approval</h2>
        <p>Hi ${approver.name || 'Approver'},</p>
        <p><strong>${po.createdByName || 'A team member'}</strong> has submitted a purchase order for your approval:</p>
        <table style="border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:4px 12px;font-weight:bold">PO Number</td><td style="padding:4px 12px">${po.orderNumber}</td></tr>
          <tr><td style="padding:4px 12px;font-weight:bold">Supplier</td><td style="padding:4px 12px">${po.supplier}</td></tr>
          <tr><td style="padding:4px 12px;font-weight:bold">Total</td><td style="padding:4px 12px">${po.currency} ${po.total?.toFixed(2)}</td></tr>
          <tr><td style="padding:4px 12px;font-weight:bold">Items</td><td style="padding:4px 12px">${po.items?.length || 0} line items</td></tr>
        </table>
        <p><a href="${APP_URL}/purchase-orders/${po._id}" style="display:inline-block;padding:10px 20px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px">Review & Approve</a></p>
      `,
      text: `New PO ${po.orderNumber} from ${po.createdByName || 'team member'} awaiting your approval. Total: ${po.currency} ${po.total?.toFixed(2)}. Review at: ${APP_URL}/purchase-orders/${po._id}`,
    });
  } catch (err) {
    console.error('[notifyApproverNewPO]', err.message);
  }
}

export async function notifyCreatorPODecision(po, action, comment) {
  if (!po.createdByUserId) return;
  try {
    const creator = await User.findById(po.createdByUserId).select('name email').lean();
    if (!creator?.email) return;

    const isApproved = action === 'approved';
    const statusText = isApproved ? 'Approved' : 'Rejected';
    const color = isApproved ? '#52c41a' : '#ff4d4f';

    await sendMail({
      to: creator.email,
      subject: `PO ${po.orderNumber} has been ${statusText.toLowerCase()}`,
      html: `
        <h2>Purchase Order ${statusText}</h2>
        <p>Hi ${creator.name || 'there'},</p>
        <p>Your purchase order <strong>${po.orderNumber}</strong> has been <span style="color:${color};font-weight:bold">${statusText.toLowerCase()}</span>.</p>
        <table style="border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:4px 12px;font-weight:bold">PO Number</td><td style="padding:4px 12px">${po.orderNumber}</td></tr>
          <tr><td style="padding:4px 12px;font-weight:bold">Supplier</td><td style="padding:4px 12px">${po.supplier}</td></tr>
          <tr><td style="padding:4px 12px;font-weight:bold">Total</td><td style="padding:4px 12px">${po.currency} ${po.total?.toFixed(2)}</td></tr>
          ${comment ? `<tr><td style="padding:4px 12px;font-weight:bold">Comment</td><td style="padding:4px 12px">${comment}</td></tr>` : ''}
        </table>
        <p><a href="${APP_URL}/purchase-orders/${po._id}" style="display:inline-block;padding:10px 20px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px">View Purchase Order</a></p>
      `,
      text: `PO ${po.orderNumber} has been ${statusText.toLowerCase()}. ${comment ? 'Comment: ' + comment : ''} View at: ${APP_URL}/purchase-orders/${po._id}`,
    });
  } catch (err) {
    console.error('[notifyCreatorPODecision]', err.message);
  }
}
