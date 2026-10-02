import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, default: 'Home', trim: true },
    fullName: { type: String, required: true, trim: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, default: 'US', trim: true },
    phone: { type: String, trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 80 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // never fetched unless explicitly .select('+password')
    },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer', index: true },
    addresses: [addressSchema],
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

/** Hash password whenever it is set or changed. Never re-hash on other saves. */
userSchema.pre('save', async function hashPasswordHook(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

/** Plain-password compare used by the login controller. */
userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

/** Case-insensitive email lookup. */
userSchema.statics.findByEmail = function findByEmail(email) {
  return this.findOne({ email: String(email).toLowerCase().trim() });
};

export const User = mongoose.model('User', userSchema);
