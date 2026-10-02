import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true }, // denormalized snapshot
    slug: { type: String, required: true },
    image: { type: String },
    price: { type: Number, required: true, min: 0 }, // price at time added
    qty: { type: Number, required: true, min: 1, max: 99 },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    items: { type: [cartItemSchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.subtotal = ret.items.reduce((sum, i) => sum + i.price * i.qty, 0);
        ret.itemCount = ret.items.reduce((sum, i) => sum + i.qty, 0);
        delete ret.__v;
        return ret;
      },
    },
  }
);

/** Returns the cart for a user, creating an empty one lazily. */
cartSchema.statics.getOrCreate = async function getOrCreate(userId) {
  const existing = await this.findOne({ user: userId });
  if (existing) return existing;
  return this.create({ user: userId, items: [] });
};

export const Cart = mongoose.model('Cart', cartSchema);
