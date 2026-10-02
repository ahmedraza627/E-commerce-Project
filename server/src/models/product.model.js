import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Product name is required'], trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    description: { type: String, required: true, maxlength: 5000 },
    brand: { type: String, trim: true, index: true },
    category: { type: String, required: true, trim: true, lowercase: true, index: true },
    images: [{ type: String }],
    price: { type: Number, required: true, min: 0, set: (v) => Math.round(v * 100) / 100 },
    compareAtPrice: { type: Number, min: 0 }, // original price when on sale
    countInStock: { type: Number, required: true, min: 0, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        ret.inStock = ret.countInStock > 0;
        delete ret.__v;
        return ret;
      },
    },
  }
);

/** Text index powers keyword search across the catalog. */
productSchema.index({ name: 'text', description: 'text', brand: 'text' });
/** Compound index for the common category + price sort listing query. */
productSchema.index({ category: 1, price: 1 });

productSchema.virtual('discountPercent').get(function discountPercent() {
  if (!this.compareAtPrice || this.compareAtPrice <= this.price) return 0;
  return Math.round(((this.compareAtPrice - this.price) / this.compareAtPrice) * 100);
});

export const Product = mongoose.model('Product', productSchema);
