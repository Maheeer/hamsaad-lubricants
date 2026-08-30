const PDFDocument = require('pdfkit');

// ─── WAYBILL PDF ─────────────────────────────────────────────
const generateWaybillPDF = (waybill, order, items, res) => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=Waybill_${waybill.waybill_number}.pdf`);
  doc.pipe(res);

  const W = doc.page.width;

  doc.rect(0, 0, W, 80).fill('#1F3864');
  doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text('HAMSAAD LUBRICANTS', 50, 22);
  doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold').text('WAYBILL', 0, 30, { align: 'right', width: W - 50 });

  const infoTop = 100;
  doc.rect(50, infoTop, W - 100, 90).fillAndStroke('#F0F4FA', '#1F3864');
  doc.fillColor('#1F3864').font('Helvetica-Bold').fontSize(10);
  doc.text('Waybill Number:', 65, infoTop + 10);
  doc.fillColor('#2E75B6').font('Helvetica-Bold').fontSize(12).text(waybill.waybill_number, 180, infoTop + 10);
  doc.fillColor('#1F3864').font('Helvetica-Bold').fontSize(10);
  doc.text('Order Number:', 65, infoTop + 30);
  doc.fillColor('#333').font('Helvetica').text(order.order_number, 180, infoTop + 30);
  doc.fillColor('#1F3864').font('Helvetica-Bold');
  doc.text('Date:', 65, infoTop + 50);
  doc.fillColor('#333').font('Helvetica').text(new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }), 180, infoTop + 50);
  doc.fillColor('#1F3864').font('Helvetica-Bold');
  doc.text('Status:', 350, infoTop + 10);
  doc.fillColor('#1E7E34').font('Helvetica-Bold').text(order.status.toUpperCase(), 430, infoTop + 10);

  const partiesTop = infoTop + 115;
  doc.rect(50, partiesTop, 230, 70).fillAndStroke('#ffffff', '#1F3864');
  doc.fillColor('#1F3864').font('Helvetica-Bold').fontSize(9).text('RELEASED BY (STOREKEEPER)', 60, partiesTop + 8);
  doc.fillColor('#333').font('Helvetica').fontSize(10).text(waybill.storekeeper_name || 'Storekeeper', 60, partiesTop + 22);
  doc.fillColor('#999').fontSize(8).text('Signature: ____________________', 60, partiesTop + 50);
  doc.rect(320, partiesTop, 230, 70).fillAndStroke('#ffffff', '#1F3864');
  doc.fillColor('#1F3864').font('Helvetica-Bold').fontSize(9).text('RECEIVED BY (COLLECTOR)', 330, partiesTop + 8);
  doc.fillColor('#333').font('Helvetica').fontSize(10).text(waybill.collector_name || 'Collector', 330, partiesTop + 22);
  doc.fillColor('#999').fontSize(8).text('Signature: ____________________', 330, partiesTop + 50);

  const tableTop = partiesTop + 95;
  doc.rect(50, tableTop, W - 100, 25).fill('#1F3864');
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9);
  doc.text('S/N', 60, tableTop + 8);
  doc.text('Product Description', 90, tableTop + 8);
  doc.text('Brand', 310, tableTop + 8);
  doc.text('Size', 390, tableTop + 8);
  doc.text('Quantity', 440, tableTop + 8);
  doc.text('Unit', 510, tableTop + 8);

  let rowY = tableTop + 25;
  items.forEach((item, index) => {
    const bg = index % 2 === 0 ? '#F9F9F9' : '#ffffff';
    doc.rect(50, rowY, W - 100, 25).fill(bg);
    doc.fillColor('#333').font('Helvetica').fontSize(9);
    doc.text(String(index + 1), 60, rowY + 8);
    doc.text(item.product_name || '', 90, rowY + 8, { width: 215 });
    doc.text(item.brand_name || '', 310, rowY + 8, { width: 75 });
    doc.text(item.size_variant || '', 390, rowY + 8, { width: 45 });
    doc.font('Helvetica-Bold').text(String(item.quantity), 440, rowY + 8, { width: 65 });
    doc.font('Helvetica').text(item.unit || '', 510, rowY + 8);
    rowY += 25;
  });

  doc.rect(50, tableTop, W - 100, rowY - tableTop).stroke('#1F3864');
  doc.rect(50, rowY, W - 100, 30).fillAndStroke('#1F3864', '#1F3864');
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10).text('TOTAL ITEMS:', 60, rowY + 9);
  doc.text(String(items.reduce((s, i) => s + i.quantity, 0)), 440, rowY + 9);
  rowY += 50;

  if (order.notes) {
    doc.fillColor('#1F3864').font('Helvetica-Bold').fontSize(10).text('Notes:', 50, rowY);
    doc.fillColor('#666').font('Helvetica').fontSize(9).text(order.notes, 50, rowY + 15, { width: W - 100 });
    rowY += 40;
  }

  rowY += 10;
  doc.rect(50, rowY, 12, 12).stroke('#1F3864');
  doc.fillColor('#1F3864').font('Helvetica-Bold').fontSize(9).text('All goods were taken in good condition before signature.', 70, rowY + 1, { width: W - 120 });
  rowY += 30;

  rowY += 10;
  doc.rect(50, rowY, W - 100, 70).fillAndStroke('#F0F4FA', '#1F3864');
  doc.fillColor('#1F3864').font('Helvetica-Bold').fontSize(9).text('AUTHORISED BY (MANAGER)', 60, rowY + 8);
  doc.fillColor('#999').font('Helvetica').fontSize(8).text('Name: _______________________________', 60, rowY + 25);
  doc.text('Signature & Stamp: _______________________________', 60, rowY + 45);

  doc.rect(0, doc.page.height - 40, W, 40).fill('#1F3864');
  doc.fillColor('#ffffff').font('Helvetica').fontSize(8).text(
    `HAMSAAD LUBRICANTS — Waybill ${waybill.waybill_number} — Generated: ${new Date().toLocaleString('en-GB')}`,
    50, doc.page.height - 25, { align: 'center', width: W - 100 }
  );

  doc.end();
};

// ─── DELIVERY NOTE PDF ────────────────────────────────────────
const generateDeliveryNotePDF = (waybill, order, items, client, res) => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename=Delivery_Note_${order.order_number}.pdf`);
  doc.pipe(res);

  const W = doc.page.width;

  // ── Header ──────────────────────────────────────────────────
  doc.rect(0, 0, W, 80).fill('#1F3864');
  doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text('HAMSAAD LUBRICANTS', 50, 22);
  doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold').text('DELIVERY NOTE', 0, 30, { align: 'right', width: W - 50 });

  // ── Delivery Note Info Box ───────────────────────────────────
  const infoTop = 100;
  doc.rect(50, infoTop, W - 100, 90).fillAndStroke('#F0F4FA', '#1F3864');

  doc.fillColor('#1F3864').font('Helvetica-Bold').fontSize(10);
  doc.text('Delivery Note No.:', 65, infoTop + 10);
  doc.fillColor('#2E75B6').font('Helvetica-Bold').fontSize(12).text(order.order_number, 200, infoTop + 10);

  doc.fillColor('#1F3864').font('Helvetica-Bold').fontSize(10);
  doc.text('Date:', 65, infoTop + 30);
  doc.fillColor('#333').font('Helvetica').text(new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }), 200, infoTop + 30);

  doc.fillColor('#1F3864').font('Helvetica-Bold').fontSize(10);
  doc.text('Client:', 65, infoTop + 50);
  doc.fillColor('#333').font('Helvetica').text(client?.full_name || order.client_name || '—', 200, infoTop + 50);

  doc.fillColor('#1F3864').font('Helvetica-Bold').fontSize(10);
  doc.text('Collector:', 65, infoTop + 70);
  doc.fillColor('#333').font('Helvetica').text(waybill?.collector_name || 'Not specified', 200, infoTop + 70);

  // ── Items Table ─────────────────────────────────────────────
  const tableTop = infoTop + 115;
  doc.rect(50, tableTop, W - 100, 25).fill('#1F3864');
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9);
  doc.text('S/N',                 60, tableTop + 8);
  doc.text('Product Description', 90, tableTop + 8);
  doc.text('Brand',              310, tableTop + 8);
  doc.text('Size',               390, tableTop + 8);
  doc.text('Quantity',           440, tableTop + 8);
  doc.text('Unit',               510, tableTop + 8);

  let rowY = tableTop + 25;
  items.forEach((item, index) => {
    const bg = index % 2 === 0 ? '#F9F9F9' : '#ffffff';
    doc.rect(50, rowY, W - 100, 25).fill(bg);
    doc.fillColor('#333').font('Helvetica').fontSize(9);
    doc.text(String(index + 1),       60,  rowY + 8);
    doc.text(item.product_name || '', 90,  rowY + 8, { width: 215 });
    doc.text(item.brand_name   || '', 310, rowY + 8, { width: 75 });
    doc.text(item.size_variant || '', 390, rowY + 8, { width: 45 });
    doc.font('Helvetica-Bold').text(String(item.quantity), 440, rowY + 8, { width: 65 });
    doc.font('Helvetica').text(item.unit || '', 510, rowY + 8);
    rowY += 25;
  });

  doc.rect(50, tableTop, W - 100, rowY - tableTop).stroke('#1F3864');

  // Total row
  doc.rect(50, rowY, W - 100, 30).fillAndStroke('#1F3864', '#1F3864');
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10).text('TOTAL ITEMS:', 60, rowY + 9);
  doc.text(String(items.reduce((s, i) => s + i.quantity, 0)), 440, rowY + 9);
  rowY += 50;

  // ── Disclaimer Message ───────────────────────────────────────
  rowY += 10;
  doc.rect(50, rowY, W - 100, 80).fillAndStroke('#FFF9F0', '#E67E22');
  doc.fillColor('#7B3F00').font('Helvetica-Bold').fontSize(9).text('NOTICE:', 65, rowY + 10);
  doc.fillColor('#555').font('Helvetica').fontSize(9).text(
    'This is to certify that the goods listed herein were released from our warehouse in good condition and handed over to the authorised collector as evidenced by the signed waybill on record. Hamsaad Lubricants shall not be held liable for any damage, loss, or shortage of goods occurring after release to the client or their designated representative. Thank you for your patronage.',
    65, rowY + 25, { width: W - 130, lineGap: 3 }
  );
  rowY += 100;

  // ── Signature Section ────────────────────────────────────────
  rowY += 10;
  doc.rect(50, partiesTop = rowY, 230, 80).fillAndStroke('#ffffff', '#1F3864');
  doc.fillColor('#1F3864').font('Helvetica-Bold').fontSize(9).text('RELEASED BY', 60, rowY + 8);
  doc.fillColor('#333').font('Helvetica').fontSize(10).text('Hamsaad Lubricants', 60, rowY + 22);
  doc.fillColor('#999').fontSize(8).text('Name: ____________________', 60, rowY + 42);
  doc.text('Signature & Stamp: ___________', 60, rowY + 58);

  doc.rect(320, rowY, 230, 80).fillAndStroke('#ffffff', '#1F3864');
  doc.fillColor('#1F3864').font('Helvetica-Bold').fontSize(9).text('RECEIVED BY (COLLECTOR)', 330, rowY + 8);
  doc.fillColor('#333').font('Helvetica').fontSize(10).text(waybill?.collector_name || 'Collector', 330, rowY + 22);
  doc.fillColor('#999').fontSize(8).text('Signature: ____________________', 330, rowY + 42);
  doc.text('Date: ________________________', 330, rowY + 58);
  rowY += 100;

  // ── Footer ──────────────────────────────────────────────────
  doc.rect(0, doc.page.height - 40, W, 40).fill('#1F3864');
  doc.fillColor('#ffffff').font('Helvetica').fontSize(8).text(
    `HAMSAAD LUBRICANTS — Delivery Note ${order.order_number} — Generated: ${new Date().toLocaleString('en-GB')}`,
    50, doc.page.height - 25, { align: 'center', width: W - 100 }
  );

  doc.end();
};

// ─── INVOICE PDF ─────────────────────────────────────────────
const generateInvoicePDF = (invoice, order, items, client, res) => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename=Invoice_${invoice.invoice_number}.pdf`);
  doc.pipe(res);

  const W = doc.page.width;

  doc.rect(0, 0, W, 80).fill('#1F3864');
  doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text('HAMSAAD LUBRICANTS', 50, 22);
  doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold').text('INVOICE', 0, 30, { align: 'right', width: W - 50 });

  const infoTop = 100;
  doc.fillColor('#1F3864').font('Helvetica-Bold').fontSize(10);
  doc.text('Invoice Number:', 50, infoTop);
  doc.fillColor('#2E75B6').font('Helvetica-Bold').fontSize(12).text(invoice.invoice_number, 170, infoTop);
  doc.fillColor('#1F3864').font('Helvetica-Bold').fontSize(10);
  doc.text('Date:', 50, infoTop + 20);
  doc.fillColor('#333').font('Helvetica').text(new Date(invoice.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }), 170, infoTop + 20);
  doc.fillColor('#1F3864').font('Helvetica-Bold');
  doc.text('Payment Status:', 50, infoTop + 40);
  const statusColor = invoice.payment_status === 'paid' ? '#1E7E34' : invoice.payment_status === 'part_paid' ? '#E67E22' : '#C0392B';
  doc.fillColor(statusColor).font('Helvetica-Bold').text(invoice.payment_status.replace('_', ' ').toUpperCase(), 170, infoTop + 40);

  const clientTop = infoTop + 80;
  doc.rect(50, clientTop, W - 100, 80).fillAndStroke('#F0F4FA', '#1F3864');
  doc.fillColor('#1F3864').font('Helvetica-Bold').fontSize(9).text('BILL TO:', 65, clientTop + 10);
  doc.fillColor('#333').font('Helvetica-Bold').fontSize(12).text(client.full_name, 65, clientTop + 25);
  doc.font('Helvetica').fontSize(10).fillColor('#666');
  if (client.phone) doc.text('Phone: ' + client.phone, 65, clientTop + 42);
  if (client.email) doc.text('Email: ' + client.email, 65, clientTop + 57);
  doc.fillColor('#1F3864').font('Helvetica-Bold').fontSize(9).text('Client ID: ' + client.client_id, 400, clientTop + 25);

  const tableTop = clientTop + 100;
  const colSN = 60, colProd = 90, colBrand = 295, colSize = 380, colQty = 430, colTotal = 465;
  const colTotalW = W - colTotal - 15;

  doc.rect(50, tableTop, W - 100, 25).fill('#1F3864');
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9);
  doc.text('S/N', colSN, tableTop + 8);
  doc.text('Product', colProd, tableTop + 8);
  doc.text('Brand', colBrand, tableTop + 8);
  doc.text('Size', colSize, tableTop + 8);
  doc.text('Qty', colQty, tableTop + 8);
  doc.text('Total', colTotal, tableTop + 8);

  let rowY = tableTop + 25;
  items.forEach((item, index) => {
    const bg = index % 2 === 0 ? '#F9F9F9' : '#ffffff';
    doc.rect(50, rowY, W - 100, 25).fill(bg);
    doc.fillColor('#333').font('Helvetica').fontSize(9);
    doc.text(String(index + 1), colSN, rowY + 8);
    doc.text(item.product_name || '', colProd, rowY + 8, { width: colBrand - colProd - 5 });
    doc.text(item.brand_name || '', colBrand, rowY + 8, { width: colSize - colBrand - 5 });
    doc.text(item.size_variant || '', colSize, rowY + 8, { width: colQty - colSize - 5 });
    doc.text(String(item.quantity), colQty, rowY + 8, { width: colTotal - colQty - 5 });
    const totalStr = 'NGN ' + parseFloat(item.total_price).toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    doc.font('Helvetica-Bold').text(totalStr, colTotal, rowY + 8, { width: colTotalW });
    rowY += 25;
  });

  doc.rect(50, tableTop, W - 100, rowY - tableTop).stroke('#1F3864');

  rowY += 15;
  doc.rect(50, rowY, 12, 12).stroke('#1F3864');
  doc.fillColor('#1F3864').font('Helvetica-Bold').fontSize(9).text('All goods were taken in good condition before signature.', 70, rowY + 1, { width: W - 120 });
  rowY += 30;

  rowY += 5;
  doc.rect(50, rowY, W - 100, 35).fillAndStroke('#F0F4FA', '#1F3864');
  doc.fillColor('#1F3864').font('Helvetica-Bold').fontSize(11).text('TOTAL AMOUNT:', 60, rowY + 10);
  doc.fillColor('#1E7E34').font('Helvetica-Bold').fontSize(13).text(
    'NGN ' + parseFloat(invoice.total_amount).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    250, rowY + 9, { width: W - 310, align: 'right' }
  );
  rowY += 45;

  if (parseFloat(invoice.amount_paid) > 0) {
    doc.fillColor('#333').font('Helvetica').fontSize(10).text('Amount Paid: NGN ' + parseFloat(invoice.amount_paid).toLocaleString('en-NG', { minimumFractionDigits: 2 }), 50, rowY);
    rowY += 18;
    doc.fillColor('#C0392B').font('Helvetica-Bold').text('Balance Due: NGN ' + parseFloat(invoice.balance).toLocaleString('en-NG', { minimumFractionDigits: 2 }), 50, rowY);
  }

  doc.rect(0, doc.page.height - 40, W, 40).fill('#1F3864');
  doc.fillColor('#ffffff').font('Helvetica').fontSize(8).text(
    `HAMSAAD LUBRICANTS — Invoice ${invoice.invoice_number} — CONFIDENTIAL`,
    50, doc.page.height - 25, { align: 'center', width: W - 100 }
  );

  doc.end();
};

module.exports = { generateWaybillPDF, generateDeliveryNotePDF, generateInvoicePDF };
