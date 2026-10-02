import { Order } from '../models/order.model.js';
import { Cart } from '../models/cart.model.js';
import { ApiError, asyncHandler, ok } from '../utils/apiError.js';
import { assertValidObjectId, parsePagination } from '../utils/query.js';

const SHIPPING_FLAT_RATE = 5.99;
const FREE_SHIPPING_THRESHOLD = 75;
const TAX_RATE = 0.08;

// POST /api/v1/orders — checkout from the user's cart
export const createOrder = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart || cart.items.length === 0) {
    throw ApiError.badRequest('Your cart is empty');
  }

  // Re-read live prices/stock at checkout time — never trust the cart snapshot for money math.
  const itemsPrice = Number(
    cart.items.reduce((sum, i) => sum + i.price * i.qty, 0).toFixed(2)
  );
  const shippingPrice = itemsPrice >= FREE_SHIPPING_THRESHOLD || itemsPrice === 0 ? 0 : SHIPPING_FLAT_RATE;
  const taxPrice = Number((itemsPrice * TAX_RATE).toFixed(2));
  const totalPrice = Number((itemsPrice + shippingPrice + taxPrice).toFixed(2));

  const order = await Order.create({
    user: req.user._id,
    orderNumber: Order.generateOrderNumber(),
    orderItems: cart.items,
    shippingAddress: req.body.shippingAddress,
    paymentMethod: req.body.paymentMethod,
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
  });

  await Order.decrementStock(cart.items);
  cart.items = [];
  await cart.save();

  ok(res, { status: 201, message: 'Order placed successfully', data: { order } });
});

// GET /api/v1/orders/my-orders
export const getMyOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 10 });
  const filter = { user: req.user._id };

  const [items, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(filter),
  ]);

  ok(res, {
    message: 'Orders fetched',
    data: { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 } },
  });
});

// GET /api/v1/orders/:id — owner or admin only
export const getOrderById = asyncHandler(async (req, res) => {
  assertValidObjectId(req.params.id, 'order id');

  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) throw ApiError.notFound('Order not found');

  const isOwner = order.user._id.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
    throw ApiError.forbidden('You can only view your own orders');
  }

  ok(res, { message: 'Order fetched', data: { order } });
});

// GET /api/v1/orders — admin
export const getAllOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 20 });
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const [items, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('user', 'name email'),
    Order.countDocuments(filter),
  ]);

  ok(res, {
    message: 'Orders fetched',
    data: { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 } },
  });
});

// PATCH /api/v1/orders/:id/status — admin
export const updateOrderStatus = asyncHandler(async (req, res) => {
  assertValidObjectId(req.params.id, 'order id');

  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found');

  order.status = req.body.status;
  if (req.body.status === 'delivered') {
    order.isDelivered = true;
    order.deliveredAt = new Date();
  }
  await order.save();

  ok(res, { message: 'Order status updated', data: { order } });
});
