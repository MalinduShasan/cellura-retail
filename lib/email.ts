interface EmailOrderItem {
  productName: string;
  variantDetails?: string | Record<string, any>;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface OrderConfirmationPayload {
  orderId: string;
  customerEmail: string;
  customerName?: string;
  items: EmailOrderItem[];
  totalAmount: number;
  paymentMethod: string;
  fulfillmentType?: string;
}

interface OrderDispatchedPayload {
  orderId: string;
  customerEmail: string;
  trackingNumber: string;
  customerName?: string;
}

export function generateOrderConfirmationHtml(payload: OrderConfirmationPayload): string {
  const { orderId, customerEmail, customerName, items, totalAmount, paymentMethod, fulfillmentType } = payload;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cellura.lk';
  const trackUrl = `${siteUrl}/track-order?ref=${orderId}`;

  const itemsRows = items
    .map((item) => {
      const detailsText =
        typeof item.variantDetails === 'object' && item.variantDetails !== null
          ? [item.variantDetails.storage, item.variantDetails.color, item.variantDetails.condition]
              .filter(Boolean)
              .join(' · ')
          : item.variantDetails || '';

      return `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-family: sans-serif; font-size: 14px; color: #1e293b;">
        <strong>${item.productName}</strong><br/>
        <span style="font-size: 12px; color: #64748b;">${detailsText}</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-family: sans-serif; font-size: 14px; color: #1e293b; text-align: center;">
        ${item.quantity}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-family: sans-serif; font-size: 14px; color: #0f172a; text-align: right; font-weight: 600;">
        $${item.totalPrice.toLocaleString()}
      </td>
    </tr>
  `;
    })
    .join('');

  let instructionsHtml = '';
  if (paymentMethod === 'bank_transfer') {
    instructionsHtml = `
      <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 24px 0;">
        <h4 style="margin: 0 0 8px 0; color: #1e40af; font-family: sans-serif; font-size: 14px;">Direct Bank Wire Instructions</h4>
        <p style="margin: 0 0 12px 0; font-size: 13px; color: #3b82f6; font-family: sans-serif;">
          Please wire the total to the account below and include your Reference ID in the transfer note:
        </p>
        <div style="font-family: monospace; font-size: 12px; color: #1e293b; line-height: 1.6;">
          <strong>Bank:</strong> Silicon Commercial Bank<br/>
          <strong>Account Name:</strong> Cellura Retail Inc.<br/>
          <strong>IBAN:</strong> US12 9876 5432 1098 7654<br/>
          <strong>Reference ID:</strong> ${orderId}
        </div>
      </div>
    `;
  } else if (paymentMethod === 'store_pickup') {
    instructionsHtml = `
      <div style="background-color: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; padding: 16px; margin: 24px 0;">
        <h4 style="margin: 0 0 8px 0; color: #115e59; font-family: sans-serif; font-size: 14px;">In-Store Counter Pickup</h4>
        <p style="margin: 0; font-size: 13px; color: #0d9488; font-family: sans-serif;">
          Your smartphone has been secured for you at our Flagship Store (100 Tech Promenade, Suite 400).
          Please bring your Order Reference ID <strong>${orderId}</strong> when collecting.
        </p>
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Cellura Retail Order Confirmation</title>
    </head>
    <body style="background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 24px; margin: 0;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <div style="background-color: #0d9488; padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">CELLURA RETAIL</h1>
          <p style="color: #ccfbf1; margin: 4px 0 0 0; font-size: 13px;">Certified Smartphones & Hardware Guarantee</p>
        </div>

        <div style="padding: 24px;">
          <h2 style="font-size: 18px; color: #0f172a; margin: 0 0 8px 0;">Order Confirmed!</h2>
          <p style="font-size: 14px; color: #475569; line-height: 1.5; margin: 0 0 16px 0;">
            Hi ${customerName || customerEmail}, thank you for choosing Cellura Retail. We have received your order <strong>#${orderId.slice(0, 8)}</strong>.
          </p>

          <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
            <thead>
              <tr style="background-color: #f1f5f9; text-align: left;">
                <th style="padding: 10px 12px; font-size: 12px; color: #475569; text-transform: uppercase;">Device</th>
                <th style="padding: 10px 12px; font-size: 12px; color: #475569; text-transform: uppercase; text-align: center;">Qty</th>
                <th style="padding: 10px 12px; font-size: 12px; color: #475569; text-transform: uppercase; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding: 16px 12px; text-align: right; font-weight: 700; font-size: 14px; color: #0f172a;">Total:</td>
                <td style="padding: 16px 12px; text-align: right; font-weight: 800; font-size: 16px; color: #0d9488;">$${totalAmount.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>

          ${instructionsHtml}

          <div style="text-align: center; margin: 32px 0 16px 0;">
            <a href="${trackUrl}" style="background-color: #0d9488; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-block;">
              Track Order Real-Time
            </a>
          </div>

          <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 24px 0 0 0;">
            Need help with your purchase? Contact support@cellura.lk or reply directly to this email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function sendOrderConfirmationEmail(payload: OrderConfirmationPayload): Promise<{ success: boolean; error?: string }> {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    const html = generateOrderConfirmationHtml(payload);

    if (resendApiKey) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Cellura Retail <orders@cellura.lk>',
          to: [payload.customerEmail],
          subject: `Order Confirmation #${payload.orderId.slice(0, 8)} - Cellura Retail`,
          html,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn('Resend API call returned non-200:', errorText);
        return { success: false, error: errorText };
      }

      return { success: true };
    }

    // Dev / Staging mock logger
    console.log(`[Email Service Mock] Order Confirmation Email queued for ${payload.customerEmail} (Order #${payload.orderId})`);
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to send confirmation email';
    console.error('Email dispatch exception:', msg);
    return { success: false, error: msg };
  }
}
