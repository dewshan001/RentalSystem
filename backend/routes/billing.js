import express from 'express';
import { Invoice } from '../models/Invoice.js';
import { Payment } from '../models/Payment.js';
import { Credit } from '../models/Credit.js';
import { BillingSettings } from '../models/BillingSettings.js';
import { Rental } from '../models/Rental.js';
import { Staff } from '../models/Staff.js';
import { verifyStaff } from './auth.js';

const router = express.Router();

// generate unique IDs 
function genInvoiceNum() {
  return 'INV-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
}
function genPaymentNum() {
  return 'PAY-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
}

//calculate late fee days using 9 AM rule 
function calcChargedDays(startDate, returnDate, agreedDays, deadlineHour = 9) {
  const ms = returnDate.getTime() - startDate.getTime();
  const msPerDay = 86400000;
  let actual = Math.floor(ms / msPerDay);
  const h = returnDate.getHours();
  const m = returnDate.getMinutes();
  if (h > deadlineHour || (h === deadlineHour && m > 0)) {
    if ((ms % msPerDay) > 0 || actual === 0) actual = Math.ceil(ms / msPerDay);
  }
  if (actual < 1) actual = 1;
  return Math.max(actual, agreedDays);
}


//CREATE


// POST /generate-invoice/:rentalId — Generate invoice from a rental
router.post('/generate-invoice/:rentalId', verifyStaff, async (req, res) => {
  try {
    const staff = await Staff.findById(req.staffId);
    if (!staff || !['shop', 'admin'].includes(staff.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const rental = await Rental.findById(req.params.rentalId).populate('itemId');
    if (!rental) return res.status(404).json({ message: 'Rental not found' });

    // Check if invoice already exists
    const existing = await Invoice.findOne({ rentalId: rental._id, status: { $ne: 'cancelled' } });
    if (existing) return res.json({ message: 'Invoice already exists', invoice: existing });

    const settings = await BillingSettings.findOne({ shopId: rental.shopId }) || { returnDeadlineHour: 9, lateFeePercentage: 0 };

    const isClosed = rental.status === 'closed';
    const returnDate = isClosed ? new Date(rental.actualReturnDate || rental.closedAt) : new Date(rental.endDate);
    const chargedDays = isClosed
      ? (rental.actualDays || calcChargedDays(new Date(rental.startDate), returnDate, rental.rentalDays, settings.returnDeadlineHour))
      : rental.rentalDays;

    const pricePerDay = rental.itemId?.price || 0;
    const qty = rental.quantity || 1;
    const rentalCharge = pricePerDay * qty * rental.rentalDays;
    const extraDays = Math.max(0, chargedDays - rental.rentalDays);
    const lateFeeRate = 1 + ((settings.lateFeePercentage || 0) / 100);
    const lateFee = pricePerDay * qty * extraDays * lateFeeRate;
    const discount = parseFloat(req.body.discount) || 0;
    const totalAmount = rentalCharge + lateFee - discount;
    const advancePaid = rental.advancePayment || 0;
    const balanceDue = totalAmount - advancePaid;

    const invoice = new Invoice({
      invoiceNumber: rental.invoiceNumber || genInvoiceNum(),
      rentalId: rental._id,
      shopId: rental.shopId,
      customerName: rental.customerInfo?.name || '',
      customerPhone: rental.customerInfo?.phone || '',
      customerAddress: rental.customerInfo?.address || '',
      itemName: rental.itemId?.name || '',
      itemCategory: rental.itemId?.category || '',
      pricePerDay,
      quantity: qty,
      agreedDays: rental.rentalDays,
      actualDays: chargedDays,
      startDate: rental.startDate,
      endDate: rental.endDate,
      returnDate: isClosed ? returnDate : undefined,
      rentalCharge,
      lateFee,
      discount,
      totalAmount,
      advancePaid,
      amountPaid: advancePaid,
      balanceDue,
      status: balanceDue <= 0 ? 'paid' : (advancePaid > 0 ? 'partially_paid' : 'issued'),
      issuedBy: staff._id,
    });

    await invoice.save();

    //Create advance payment record if advance was paid
    if (advancePaid > 0) {
      const payment = new Payment({
        paymentNumber: genPaymentNum(),
        invoiceId: invoice._id,
        rentalId: rental._id,
        shopId: rental.shopId,
        customerName: rental.customerInfo?.name,
        customerPhone: rental.customerInfo?.phone,
        amount: advancePaid,
        paymentType: 'advance',
        paymentMethod: 'cash',
        receivedBy: staff._id,
      });
      await payment.save();
    }

    //Create credit record if balance is owed
    if (balanceDue > 0) {
      const credit = new Credit({
        customerName: rental.customerInfo?.name || '',
        customerPhone: rental.customerInfo?.phone || '',
        customerAddress: rental.customerInfo?.address || '',
        shopId: rental.shopId,
        invoiceId: invoice._id,
        rentalId: rental._id,
        totalOwed: totalAmount,
        totalPaid: advancePaid,
        balance: balanceDue,
        status: advancePaid > 0 ? 'partial' : 'outstanding',
      });
      await credit.save();
    }

    res.status(201).json({ message: 'Invoice generated', invoice });
  } catch (error) {
    res.status(500).json({ message: 'Error generating invoice', error: error.message });
  }
});

// POST /record-payment/:invoiceId — Record a payment against an invoice
router.post('/record-payment/:invoiceId', verifyStaff, async (req, res) => {
  try {
    const staff = await Staff.findById(req.staffId);
    if (!staff || !['shop', 'admin'].includes(staff.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { amount, paymentType, paymentMethod, notes } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid payment amount' });

    const invoice = await Invoice.findById(req.params.invoiceId);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    if (invoice.status === 'cancelled') return res.status(400).json({ message: 'Cannot pay a cancelled invoice' });

    const payment = new Payment({
      paymentNumber: genPaymentNum(),
      invoiceId: invoice._id,
      rentalId: invoice.rentalId,
      shopId: invoice.shopId,
      customerName: invoice.customerName,
      customerPhone: invoice.customerPhone,
      amount,
      paymentType: paymentType || (amount >= invoice.balanceDue ? 'full' : 'partial'),
      paymentMethod: paymentMethod || 'cash',
      notes,
      receivedBy: staff._id,
    });
    await payment.save();

    //Update invoice
    invoice.amountPaid += amount;
    invoice.balanceDue = invoice.totalAmount - invoice.amountPaid;
    if (invoice.balanceDue <= 0) {
      invoice.balanceDue = 0;
      invoice.status = 'paid';
    } else {
      invoice.status = 'partially_paid';
    }
    invoice.updatedAt = new Date();
    await invoice.save();

    //Update credit record
    const credit = await Credit.findOne({ invoiceId: invoice._id, status: { $ne: 'cleared' } });
    if (credit) {
      credit.totalPaid += amount;
      credit.balance = credit.totalOwed - credit.totalPaid;
      credit.lastPaymentDate = new Date();
      if (credit.balance <= 0) {
        credit.balance = 0;
        credit.status = 'settled';
        credit.settledAt = new Date();
      } else {
        credit.status = 'partial';
      }
      credit.updatedAt = new Date();
      await credit.save();
    }

    res.status(201).json({ message: 'Payment recorded', payment, invoice });
  } catch (error) {
    res.status(500).json({ message: 'Error recording payment', error: error.message });
  }
});


//  READ


// GET /invoices — List all invoices for the shop
router.get('/invoices', verifyStaff, async (req, res) => {
  try {
    const staff = await Staff.findById(req.staffId);
    const filter = {};
    if (staff.role === 'shop') filter.shopId = staff._id;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      filter.$or = [
        { customerName: { $regex: req.query.search, $options: 'i' } },
        { invoiceNumber: { $regex: req.query.search, $options: 'i' } },
        { customerPhone: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const invoices = await Invoice.find(filter)
      .populate('shopId')
      .populate('issuedBy')
      .sort({ createdAt: -1 })
      .limit(parseInt(req.query.limit) || 200);

    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching invoices', error: error.message });
  }
});

// GET /invoices/:id — Single invoice detail
router.get('/invoices/:id', verifyStaff, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('shopId')
      .populate('issuedBy')
      .populate('rentalId');
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Error', error: error.message });
  }
});

// GET /payments — List payments
router.get('/payments', verifyStaff, async (req, res) => {
  try {
    const staff = await Staff.findById(req.staffId);
    const filter = { isDeleted: false };
    if (staff.role === 'shop') filter.shopId = staff._id;
    if (req.query.invoiceId) filter.invoiceId = req.query.invoiceId;

    const payments = await Payment.find(filter)
      .populate('invoiceId')
      .populate('receivedBy')
      .sort({ createdAt: -1 })
      .limit(parseInt(req.query.limit) || 200);

    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Error', error: error.message });
  }
});

// GET /credits — List credit / outstanding balances
router.get('/credits', verifyStaff, async (req, res) => {
  try {
    const staff = await Staff.findById(req.staffId);
    const filter = {};
    if (staff.role === 'shop') filter.shopId = staff._id;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      filter.$or = [
        { customerName: { $regex: req.query.search, $options: 'i' } },
        { customerPhone: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const credits = await Credit.find(filter)
      .populate('invoiceId')
      .sort({ createdAt: -1 })
      .limit(parseInt(req.query.limit) || 200);

    res.json(credits);
  } catch (error) {
    res.status(500).json({ message: 'Error', error: error.message });
  }
});

// GET /overdue — Overdue accounts
router.get('/overdue', verifyStaff, async (req, res) => {
  try {
    const staff = await Staff.findById(req.staffId);
    const filter = {
      status: { $in: ['issued', 'partially_paid', 'overdue'] },
      endDate: { $lt: new Date() },
    };
    if (staff.role === 'shop') filter.shopId = staff._id;

    const overdueInvoices = await Invoice.find(filter).sort({ endDate: 1 });
    // Also mark them overdue
    await Invoice.updateMany(
      { _id: { $in: overdueInvoices.map(i => i._id) }, status: { $in: ['issued', 'partially_paid'] } },
      { status: 'overdue', updatedAt: new Date() }
    );

    res.json(overdueInvoices);
  } catch (error) {
    res.status(500).json({ message: 'Error', error: error.message });
  }
});

// GET /summary — Financial summaries
router.get('/summary', verifyStaff, async (req, res) => {
  try {
    const staff = await Staff.findById(req.staffId);
    const shopFilter = (staff.role === 'shop') ? { shopId: staff._id } : {};

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Aggregate invoices
    const [totalStats] = await Invoice.aggregate([
      { $match: { ...shopFilter, status: { $ne: 'cancelled' } } },
      { $group: {
        _id: null,
        totalInvoices: { $sum: 1 },
        totalRevenue: { $sum: '$totalAmount' },
        totalCollected: { $sum: '$amountPaid' },
        totalOutstanding: { $sum: '$balanceDue' },
        totalLateFees: { $sum: '$lateFee' },
        totalDiscounts: { $sum: '$discount' },
      }}
    ]);

    // Daily revenue
    const [dailyStats] = await Payment.aggregate([
      { $match: { ...shopFilter, isDeleted: false, createdAt: { $gte: todayStart } } },
      { $group: { _id: null, dailyCollection: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    // Monthly revenue
    const [monthlyStats] = await Payment.aggregate([
      { $match: { ...shopFilter, isDeleted: false, createdAt: { $gte: monthStart } } },
      { $group: { _id: null, monthlyCollection: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    // Counts by status
    const statusCounts = await Invoice.aggregate([
      { $match: { ...shopFilter, status: { $ne: 'cancelled' } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const overdueCount = await Invoice.countDocuments({ ...shopFilter, status: 'overdue' });
    const outstandingCredits = await Credit.countDocuments({ ...shopFilter, status: { $in: ['outstanding', 'partial'] } });

    res.json({
      totals: totalStats || { totalInvoices: 0, totalRevenue: 0, totalCollected: 0, totalOutstanding: 0, totalLateFees: 0, totalDiscounts: 0 },
      daily: dailyStats || { dailyCollection: 0, count: 0 },
      monthly: monthlyStats || { monthlyCollection: 0, count: 0 },
      statusCounts: statusCounts.reduce((acc, s) => { acc[s._id] = s.count; return acc; }, {}),
      overdueCount,
      outstandingCredits,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error generating summary', error: error.message });
  }
});

//  UPDATE


// PUT /invoices/:id — Update invoice details before final confirmation
router.put('/invoices/:id', verifyStaff, async (req, res) => {
  try {
    const staff = await Staff.findById(req.staffId);
    if (!staff || !['shop', 'admin'].includes(staff.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    if (invoice.status === 'paid') return res.status(400).json({ message: 'Cannot modify a paid invoice' });
    if (invoice.status === 'cancelled') return res.status(400).json({ message: 'Cannot modify a cancelled invoice' });

    const { discount, agreedDays, notes } = req.body;

    if (discount !== undefined) invoice.discount = parseFloat(discount) || 0;
    if (agreedDays !== undefined) invoice.agreedDays = parseInt(agreedDays);
    if (notes !== undefined) invoice.notes = notes;

    // Recalculate totals
    invoice.rentalCharge = invoice.pricePerDay * invoice.quantity * invoice.agreedDays;
    const extraDays = Math.max(0, (invoice.actualDays || invoice.agreedDays) - invoice.agreedDays);
    invoice.lateFee = invoice.pricePerDay * invoice.quantity * extraDays;
    invoice.totalAmount = invoice.rentalCharge + invoice.lateFee - invoice.discount;
    invoice.balanceDue = invoice.totalAmount - invoice.amountPaid;
    
    if (invoice.balanceDue <= 0) {
      invoice.balanceDue = 0;
      invoice.status = 'paid';
    }
    invoice.updatedAt = new Date();
    await invoice.save();

    // Update credit record if exists
    const credit = await Credit.findOne({ invoiceId: invoice._id, status: { $ne: 'cleared' } });
    if (credit) {
      credit.totalOwed = invoice.totalAmount;
      credit.balance = invoice.balanceDue;
      if (credit.balance <= 0) {
        credit.status = 'settled';
        credit.settledAt = new Date();
      }
      credit.updatedAt = new Date();
      await credit.save();
    }

    res.json({ message: 'Invoice updated', invoice });
  } catch (error) {
    res.status(500).json({ message: 'Error updating invoice', error: error.message });
  }
});

// PUT /recalculate-late-fee/:invoiceId — Recalculate late fees based on current time / return time
router.put('/recalculate-late-fee/:invoiceId', verifyStaff, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.invoiceId);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    const settings = await BillingSettings.findOne({ shopId: invoice.shopId }) || { returnDeadlineHour: 9, lateFeePercentage: 0 };
    const returnDate = invoice.returnDate || new Date();
    const chargedDays = calcChargedDays(new Date(invoice.startDate), returnDate, invoice.agreedDays, settings.returnDeadlineHour);

    const extraDays = Math.max(0, chargedDays - invoice.agreedDays);
    const lateFeeRate = 1 + ((settings.lateFeePercentage || 0) / 100);
    invoice.actualDays = chargedDays;
    invoice.lateFee = invoice.pricePerDay * invoice.quantity * extraDays * lateFeeRate;
    invoice.totalAmount = invoice.rentalCharge + invoice.lateFee - invoice.discount;
    invoice.balanceDue = invoice.totalAmount - invoice.amountPaid;
    if (invoice.balanceDue <= 0) { invoice.balanceDue = 0; invoice.status = 'paid'; }
    invoice.updatedAt = new Date();
    await invoice.save();

    res.json({ message: 'Late fee recalculated', invoice });
  } catch (error) {
    res.status(500).json({ message: 'Error', error: error.message });
  }
});

// PUT /settings — Update billing settings
router.put('/settings', verifyStaff, async (req, res) => {
  try {
    const staff = await Staff.findById(req.staffId);
    if (!staff || !['shop', 'admin'].includes(staff.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { lateFeePercentage, returnDeadlineHour, returnDeadlineMinute, archiveAfterDays } = req.body;

    const settings = await BillingSettings.findOneAndUpdate(
      { shopId: staff._id },
      {
        lateFeePercentage: lateFeePercentage ?? 0,
        returnDeadlineHour: returnDeadlineHour ?? 9,
        returnDeadlineMinute: returnDeadlineMinute ?? 0,
        archiveAfterDays: archiveAfterDays ?? 365,
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    res.json({ message: 'Settings updated', settings });
  } catch (error) {
    res.status(500).json({ message: 'Error', error: error.message });
  }
});

// GET /settings — Get billing settings
router.get('/settings', verifyStaff, async (req, res) => {
  try {
    const staff = await Staff.findById(req.staffId);
    const settings = await BillingSettings.findOne({ shopId: staff._id });
    res.json(settings || { lateFeePercentage: 0, returnDeadlineHour: 9, returnDeadlineMinute: 0, archiveAfterDays: 365 });
  } catch (error) {
    res.status(500).json({ message: 'Error', error: error.message });
  }
});


//  DELETE


// PUT /invoices/:id/cancel — Cancel invoice before payment
router.put('/invoices/:id/cancel', verifyStaff, async (req, res) => {
  try {
    const staff = await Staff.findById(req.staffId);
    if (!staff || !['shop', 'admin'].includes(staff.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    if (invoice.status === 'paid') return res.status(400).json({ message: 'Cannot cancel a fully paid invoice' });

    invoice.status = 'cancelled';
    invoice.cancelledBy = staff._id;
    invoice.cancelledAt = new Date();
    invoice.cancelReason = req.body.reason || '';
    invoice.updatedAt = new Date();
    await invoice.save();

    // Also clear associated credit
    await Credit.updateMany(
      { invoiceId: invoice._id },
      { status: 'cleared', clearedBy: staff._id, clearedAt: new Date(), updatedAt: new Date() }
    );

    res.json({ message: 'Invoice cancelled', invoice });
  } catch (error) {
    res.status(500).json({ message: 'Error', error: error.message });
  }
});

// DELETE /payments/:id — Remove incorrect payment (admin only)
router.delete('/payments/:id', verifyStaff, async (req, res) => {
  try {
    const staff = await Staff.findById(req.staffId);
    if (!staff || staff.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can delete payment records' });
    }

    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    // Soft-delete
    payment.isDeleted = true;
    payment.deletedBy = staff._id;
    payment.deletedAt = new Date();
    payment.deleteReason = req.body.reason || '';
    await payment.save();

    // Reverse the amount on invoice
    const invoice = await Invoice.findById(payment.invoiceId);
    if (invoice) {
      invoice.amountPaid = Math.max(0, invoice.amountPaid - payment.amount);
      invoice.balanceDue = invoice.totalAmount - invoice.amountPaid;
      invoice.status = invoice.balanceDue <= 0 ? 'paid' : (invoice.amountPaid > 0 ? 'partially_paid' : 'issued');
      invoice.updatedAt = new Date();
      await invoice.save();

      // Update credit
      const credit = await Credit.findOne({ invoiceId: invoice._id });
      if (credit) {
        credit.totalPaid = Math.max(0, credit.totalPaid - payment.amount);
        credit.balance = credit.totalOwed - credit.totalPaid;
        credit.status = credit.balance <= 0 ? 'settled' : (credit.totalPaid > 0 ? 'partial' : 'outstanding');
        credit.updatedAt = new Date();
        await credit.save();
      }
    }

    res.json({ message: 'Payment deleted', payment });
  } catch (error) {
    res.status(500).json({ message: 'Error', error: error.message });
  }
});

// PUT /credits/:id/mark-paid — Mark a credit as fully paid
router.put('/credits/:id/mark-paid', verifyStaff, async (req, res) => {
  try {
    const staff = await Staff.findById(req.staffId);
    if (!staff || !['shop', 'admin'].includes(staff.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const credit = await Credit.findById(req.params.id);
    if (!credit) return res.status(404).json({ message: 'Credit record not found' });
    if (credit.status === 'settled' || credit.status === 'cleared') {
      return res.status(400).json({ message: 'Credit is already settled or cleared' });
    }

    const remainingBalance = credit.balance;

    // Record payment on the linked invoice if exists
    if (credit.invoiceId) {
      const invoice = await Invoice.findById(credit.invoiceId);
      if (invoice && invoice.status !== 'cancelled') {
        const payment = new Payment({
          paymentNumber: genPaymentNum(),
          invoiceId: invoice._id,
          rentalId: invoice.rentalId,
          shopId: invoice.shopId,
          customerName: invoice.customerName,
          customerPhone: invoice.customerPhone,
          amount: remainingBalance,
          paymentType: 'full',
          paymentMethod: req.body.paymentMethod || 'cash',
          notes: req.body.notes || 'Marked as paid from credit management',
          receivedBy: staff._id,
        });
        await payment.save();

        invoice.amountPaid += remainingBalance;
        invoice.balanceDue = invoice.totalAmount - invoice.amountPaid;
        if (invoice.balanceDue <= 0) {
          invoice.balanceDue = 0;
          invoice.status = 'paid';
        }
        invoice.updatedAt = new Date();
        await invoice.save();
      }
    }

    // Update credit record
    credit.totalPaid = credit.totalOwed;
    credit.balance = 0;
    credit.status = 'settled';
    credit.lastPaymentDate = new Date();
    credit.settledAt = new Date();
    credit.updatedAt = new Date();
    await credit.save();

    res.json({ message: 'Credit marked as paid', credit });
  } catch (error) {
    res.status(500).json({ message: 'Error marking credit as paid', error: error.message });
  }
});

// PUT /credits/:id/clear — Clear settled credit record
router.put('/credits/:id/clear', verifyStaff, async (req, res) => {
  try {
    const staff = await Staff.findById(req.staffId);
    if (!staff || !['shop', 'admin'].includes(staff.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const credit = await Credit.findById(req.params.id);
    if (!credit) return res.status(404).json({ message: 'Credit record not found' });
    if (credit.status !== 'settled') return res.status(400).json({ message: 'Can only clear settled credit records' });

    credit.status = 'cleared';
    credit.clearedBy = staff._id;
    credit.clearedAt = new Date();
    credit.updatedAt = new Date();
    await credit.save();

    res.json({ message: 'Credit record cleared', credit });
  } catch (error) {
    res.status(500).json({ message: 'Error', error: error.message });
  }
});

// POST /archive — Archive old billing records
router.post('/archive', verifyStaff, async (req, res) => {
  try {
    const staff = await Staff.findById(req.staffId);
    if (!staff || staff.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can archive records' });
    }

    const settings = await BillingSettings.findOne({ shopId: staff._id }) || { archiveAfterDays: 365 };
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - settings.archiveAfterDays);

    const result = await Invoice.updateMany(
      { status: 'paid', createdAt: { $lt: cutoff }, status: { $ne: 'archived' } },
      { status: 'archived', archivedAt: new Date(), updatedAt: new Date() }
    );

    res.json({ message: `Archived ${result.modifiedCount} invoices` });
  } catch (error) {
    res.status(500).json({ message: 'Error archiving', error: error.message });
  }
});

export default router;
