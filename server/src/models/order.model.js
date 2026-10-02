import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    slug: { type: String },
    image: { type: String },
    price: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderNumber: { type: String, required: true, unique: true },
    orderItems: { type: [orderItemSchema], required: true, validate: (v) => v.length > 0 },
    shippingAddress: {
      fullName: { type: String, required: true },
      line1: { type: String, required: true },
      line2: { type: String },
      city: { type: String, required: true },
      state: { type: String },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
      phone: { type: String },
    },
    paymentMethod: { type: String, enum: ['cod', 'card'], default: 'cod' },
    itemsPrice: { type: Number, required: true, min: 0 },
    shippingPrice: { type: Number, required: true, min: 0, default: 0 },
    taxPrice: { type: Number, required: true, min: 0, default: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },
    isDelivered: { type: Boolean, default: false },
    deliveredAt: { type: Date },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
      index: true,
    },
  },
  { timestamps: true }
);

orderSchema.statics.generateOrderNumber = function generateOrderNumber() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `SW-${stamp}-${rand}`;
};

/** Decrements stock for each ordered item; throws if any item is oversold. */
orderSchema.statics.decrementStock = async function decrementStock(items) {
  for (const item of items) {
    const product = await mongoose.model('Product').findById(item.product);
    if (!product) throw new Error(`Product ${item.name} no longer exists`);
    if (product.countInStock < item.qty) {
      throw new Error(`Insufficient stock for ${product.name}`);
    }
    product.countInStock -= item.qty;
    product.soldCount += item.qty;
    await product.save();
  }
};

export const Order = mongoose.model('Order', orderSchema);
