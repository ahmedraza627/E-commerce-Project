import { Cart } from '../models/cart.model.js';
import { Product } from '../models/product.model.js';
import { ApiError, asyncHandler, ok } from '../utils/apiError.js';
import { assertValidObjectId } from '../utils/query.js';

// GET /api/v1/cart
export const getCart = asyncHandler(async (req, res) => {
  // Items carry denormalized snapshots (name/slug/image/price), so no populate
  // needed — item.product stays the raw ObjectId string the client keys on.
  const cart = await Cart.getOrCreate(req.user._id);
  ok(res, { message: 'Cart fetched', data: { cart } });
});

// POST /api/v1/cart/items { productId, qty }
export const addCartItem = asyncHandler(async (req, res) => {
  const { productId, qty } = req.body;
  assertValidObjectId(productId, 'product id');

  const product = await Product.findById(productId);
  if (!product) throw ApiError.notFound('Product not found');
  if (product.countInStock < 1) throw ApiError.badRequest('Product is out of stock');

  const cart = await Cart.getOrCreate(req.user._id);
  const existing = cart.items.find((i) => i.product.toString() === productId);
  const currentQty = existing?.qty ?? 0;

  if (currentQty + qty > product.countInStock) {
    throw ApiError.badRequest(`Only ${product.countInStock - currentQty} left in stock`);
  }

  if (existing) {
    existing.qty += qty;
  } else {
    cart.items.push({
      product: product._id,
      name: product.name,
      slug: product.slug,
      image: product.images?.[0],
      price: product.price,
      qty,
    });
  }
  await cart.save();

  ok(res, { status: 201, message: 'Item added to cart', data: { cart } });
});

// PATCH /api/v1/cart/items/:productId { qty }
export const updateCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  assertValidObjectId(productId, 'product id');

  const { qty } = req.body;
  const cart = await Cart.getOrCreate(req.user._id);
  const item = cart.items.find((i) => i.product.toString() === productId);
  if (!item) throw ApiError.notFound('Item not in cart');

  if (qty <= 0) {
    cart.items = cart.items.filter((i) => i.product.toString() !== productId);
  } else {
    const product = await Product.findById(productId).select('countInStock');
    if (product && qty > product.countInStock) {
      throw ApiError.badRequest(`Only ${product.countInStock} in stock`);
    }
    item.qty = qty;
  }
  await cart.save();

  ok(res, { message: 'Cart updated', data: { cart } });
});

// DELETE /api/v1/cart/items/:productId
export const removeCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  assertValidObjectId(productId, 'product id');

  const cart = await Cart.getOrCreate(req.user._id);
  cart.items = cart.items.filter((i) => i.product.toString() !== productId);
  await cart.save();

  ok(res, { message: 'Item removed', data: { cart } });
});

// DELETE /api/v1/cart
export const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.getOrCreate(req.user._id);
  cart.items = [];
  await cart.save();
  ok(res, { message: 'Cart cleared', data: { cart } });
});
