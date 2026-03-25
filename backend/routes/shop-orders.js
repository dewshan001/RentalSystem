import express from 'express';
import { Rental } from '../models/Rental.js';
import { Item } from '../models/Item.js';
import { Staff } from '../models/Staff.js';
import { verifyStaff } from './auth.js';

const router = express.Router();

// Get all shop orders for warehouse manager (both shop-to-warehouse and customer orders)
router.get('/warehouse/all', verifyStaff, async (req, res) => {
  try {
    const staff = await Staff.findById(req.staffId);
    
    // Only warehouse manager can see all shop orders
    if (!staff || staff.role !== 'warehouse') {
      return res.status(403).json({ message: 'Only warehouse manager can access this' });
    }

    const orders = await Rental.find({ orderType: { $in: ['shop-to-warehouse', 'customer'] } })
      .populate('itemId')
      .populate('shopId')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching shop orders', error: error.message });
  }
});

// Get shop orders for specific shop manager (all their orders)
router.get('/shop/my-orders', verifyStaff, async (req, res) => {
  try {
    const staff = await Staff.findById(req.staffId);
    
    // Only shop manager can see their orders
    if (!staff || staff.role !== 'shop') {
      return res.status(403).json({ message: 'Only shop manager can access this' });
    }

    const orders = await Rental.find({ shopId: staff._id, orderType: { $in: ['shop-to-warehouse', 'customer'] } })
      .populate('itemId')
      .populate('shopId')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
});

// Create shop order (shop manager orders from warehouse)
router.post('/shop/create', verifyStaff, async (req, res) => {
  try {
    const { itemId, quantity, rentalDays } = req.body;
    
    const staff = await Staff.findById(req.staffId);
    if (!staff || staff.role !== 'shop') {
      return res.status(403).json({ message: 'Only shop manager can create orders' });
    }

    // Verify item exists
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Create shop-to-warehouse order
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + rentalDays * 24 * 60 * 60 * 1000);
    const totalPrice = item.price * quantity * rentalDays;

    const order = new Rental({
      userId: req.staffId,
      itemId: itemId,
      quantity: quantity || 1,
      rentalDays: rentalDays || 1,
      startDate: startDate,
      endDate: endDate,
      totalPrice: totalPrice,
      orderType: 'shop-to-warehouse',
      shopId: staff._id,
      status: 'pending'
    });

    await order.save();
    await order.populate('itemId');
    await order.populate('shopId');

    res.status(201).json({ message: 'Order created successfully', order });
  } catch (error) {
    res.status(500).json({ message: 'Error creating order', error: error.message });
  }
});

// Create customer order from shop (shop manager creates order for customer)
router.post('/shop/customer-order', verifyStaff, async (req, res) => {
  try {
    const { itemId, quantity, rentalDays, customerName, customerPhone, customerAddress, advancePayment } = req.body;
    
    const staff = await Staff.findById(req.staffId);
    if (!staff || staff.role !== 'shop') {
      return res.status(403).json({ message: 'Only shop manager can create customer orders' });
    }

    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + rentalDays * 24 * 60 * 60 * 1000);
    // Set the end time to 9:00 AM on the end date
    endDate.setHours(9, 0, 0, 0);
    const totalPrice = item.price * quantity * rentalDays;

    // Generate invoice number
    const invoiceNumber = 'INV-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();

    const order = new Rental({
      userId: req.staffId,
      itemId: itemId,
      quantity: quantity || 1,
      rentalDays: rentalDays || 1,
      startDate: startDate,
      endDate: endDate,
      totalPrice: totalPrice,
      orderType: 'customer',
      shopId: staff._id,
      customerInfo: {
        name: customerName,
        phone: customerPhone,
        address: customerAddress
      },
      advancePayment: advancePayment || 0,
      invoiceNumber: invoiceNumber,
      status: 'pending'
    });

    await order.save();
    await order.populate('itemId');
    await order.populate('shopId');

    res.status(201).json({ message: 'Customer order created successfully', order });
  } catch (error) {
    res.status(500).json({ message: 'Error creating customer order', error: error.message });
  }
});

// Close order (shop manager closes when customer returns item)
router.put('/shop/close-order/:id', verifyStaff, async (req, res) => {
  try {
    const { id } = req.params;

    const staff = await Staff.findById(req.staffId);
    if (!staff || staff.role !== 'shop') {
      return res.status(403).json({ message: 'Only shop manager can close orders' });
    }

    const order = await Rental.findById(id).populate('itemId');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status === 'closed') {
      return res.status(400).json({ message: 'Order is already closed' });
    }

    // Calculate actual days with 9 AM rule
    const now = new Date();
    const startDate = new Date(order.startDate);

    // Calculate full days elapsed
    const msPerDay = 24 * 60 * 60 * 1000;
    let diffMs = now.getTime() - startDate.getTime();
    let actualDays = Math.floor(diffMs / msPerDay);

    // 9 AM rule: if current time is past 9:00 AM, count as an extra day
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    if (currentHour > 9 || (currentHour === 9 && currentMinute > 0)) {
      // Past 9 AM — if there's any remainder within the current day, it counts as a full day
      if (diffMs % msPerDay > 0 || actualDays === 0) {
        actualDays = Math.ceil(diffMs / msPerDay);
      }
    }

    // Minimum 1 day
    if (actualDays < 1) actualDays = 1;

    // Ensure at least the originally agreed rental days if returned early
    // (Customer pays for what they agreed, or more if overdue)
    const chargedDays = Math.max(actualDays, order.rentalDays);

    const pricePerDay = order.itemId.price;
    const finalAmount = pricePerDay * order.quantity * chargedDays;
    const balanceDue = finalAmount - (order.advancePayment || 0);

    // Generate invoice number if not already present
    const invoiceNumber = order.invoiceNumber || ('INV-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase());

    const updatedOrder = await Rental.findByIdAndUpdate(
      id,
      {
        status: 'closed',
        actualReturnDate: now,
        actualDays: chargedDays,
        finalAmount: finalAmount,
        balanceDue: balanceDue,
        invoiceNumber: invoiceNumber,
        closedBy: staff._id,
        closedAt: now,
        updatedAt: now
      },
      { new: true }
    ).populate('itemId').populate('shopId').populate('closedBy');

    res.json({ message: 'Order closed successfully', order: updatedOrder });
  } catch (error) {
    res.status(500).json({ message: 'Error closing order', error: error.message });
  }
});

// Get invoice for an order
router.get('/shop/invoice/:id', verifyStaff, async (req, res) => {
  try {
    const order = await Rental.findById(req.params.id)
      .populate('itemId')
      .populate('shopId')
      .populate('closedBy');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching invoice', error: error.message });
  }
});

// Confirm order (warehouse manager confirms)
router.put('/:id/confirm', verifyStaff, async (req, res) => {
  try {
    const { id } = req.params;
    
    const staff = await Staff.findById(req.staffId);
    if (!staff || !['warehouse', 'shop'].includes(staff.role)) {
      return res.status(403).json({ message: 'Only warehouse or shop manager can confirm orders' });
    }

    const order = await Rental.findByIdAndUpdate(
      id,
      {
        status: 'confirmed',
        confirmedBy: staff._id,
        confirmedAt: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    ).populate('itemId').populate('shopId').populate('confirmedBy');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ message: 'Order confirmed successfully', order });
  } catch (error) {
    res.status(500).json({ message: 'Error confirming order', error: error.message });
  }
});

// Delete order (shop manager deletes an order)
router.delete('/:id', verifyStaff, async (req, res) => {
  try {
    const staff = await Staff.findById(req.staffId);
    if (!staff || !['warehouse', 'shop'].includes(staff.role)) {
      return res.status(403).json({ message: 'Only warehouse or shop manager can delete orders' });
    }

    const order = await Rental.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Don't allow deleting closed orders
    if (order.status === 'closed') {
      return res.status(400).json({ message: 'Cannot delete a closed order' });
    }

    // Shop managers can only delete their own orders
    if (staff.role === 'shop' && order.shopId?.toString() !== staff._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own orders' });
    }

    await Rental.findByIdAndDelete(req.params.id);
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting order', error: error.message });
  }
});

// Get shop inventory summary for warehouse
router.get('/warehouse/shop-inventory', verifyStaff, async (req, res) => {
  try {
    const staff = await Staff.findById(req.staffId);
    if (!staff || staff.role !== 'warehouse') {
      return res.status(403).json({ message: 'Only warehouse manager can access this' });
    }

    // Get all pending orders grouped by shop and item
    const orders = await Rental.aggregate([
      {
        $match: {
          orderType: 'shop-to-warehouse',
          status: { $in: ['pending', 'confirmed'] }
        }
      },
      {
        $group: {
          _id: { shopId: '$shopId', itemId: '$itemId' },
          totalQuantity: { $sum: '$quantity' },
          orders: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'staffs',
          localField: '_id.shopId',
          foreignField: '_id',
          as: 'shopInfo'
        }
      },
      {
        $lookup: {
          from: 'items',
          localField: '_id.itemId',
          foreignField: '_id',
          as: 'itemInfo'
        }
      },
      {
        $project: {
          _id: {
            shopName: { $arrayElemAt: ['$shopInfo.name', 0] },
            itemName: { $arrayElemAt: ['$itemInfo.name', 0] }
          },
          totalQuantity: 1,
          orders: 1
        }
      }
    ]);

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching shop inventory', error: error.message });
  }
});

// Get all orders for warehouse manager (dashboard stats)
router.get('/warehouse/dashboard', verifyStaff, async (req, res) => {
  try {
    const staff = await Staff.findById(req.staffId);
    if (!staff || staff.role !== 'warehouse') {
      return res.status(403).json({ message: 'Only warehouse manager can access this' });
    }

    // Count orders of both shop-to-warehouse and customer types
    const pendingOrders = await Rental.countDocuments({ 
      status: 'pending',
      orderType: { $in: ['shop-to-warehouse', 'customer'] }
    });
    const confirmedOrders = await Rental.countDocuments({ 
      status: 'confirmed',
      orderType: { $in: ['shop-to-warehouse', 'customer'] }
    });
    const totalOrders = await Rental.countDocuments({ 
      orderType: { $in: ['shop-to-warehouse', 'customer'] }
    });

    const recentOrders = await Rental.find({ 
      orderType: { $in: ['shop-to-warehouse', 'customer'] }
    })
      .populate('itemId')
      .populate('shopId')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      stats: {
        pending: pendingOrders,
        confirmed: confirmedOrders,
        total: totalOrders
      },
      recentOrders: recentOrders
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard data', error: error.message });
  }
});

// Get all orders for shop manager
router.get('/shop/dashboard', verifyStaff, async (req, res) => {
  try {
    const staff = await Staff.findById(req.staffId);
    if (!staff || staff.role !== 'shop') {
      return res.status(403).json({ message: 'Only shop manager can access this' });
    }

    const myOrders = await Rental.countDocuments({ shopId: staff._id });
    const pendingOrders = await Rental.countDocuments({ shopId: staff._id, status: 'pending' });
    const confirmedOrders = await Rental.countDocuments({ shopId: staff._id, status: 'confirmed' });
    const closedOrders = await Rental.countDocuments({ shopId: staff._id, status: 'closed' });

    const recentOrders = await Rental.find({ shopId: staff._id })
      .populate('itemId')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      stats: {
        myOrders: myOrders,
        pending: pendingOrders,
        confirmed: confirmedOrders,
        closed: closedOrders
      },
      recentOrders: recentOrders
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard data', error: error.message });
  }
});

export default router;
