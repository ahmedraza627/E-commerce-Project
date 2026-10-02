import { ZodError, z } from 'zod';
import { ApiError } from '../utils/apiError.js';

/** Validates req.body / params / query against a Zod schema; 400 on failure. */
export const validate =
  (schema, property = 'body') =>
  (req, _res, next) => {
    const result = schema[property] ? schema[property].safeParse(req[property]) : schema.safeParse(req[property]);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        field: i.path.join('.') || property,
        message: i.message,
      }));
      return next(ApiError.badRequest('Validation failed', details));
    }
    req[property] = result.data;
    next();
  };

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password needs a lowercase letter')
    .regex(/[A-Z]/, 'Password needs an uppercase letter')
    .regex(/[0-9]/, 'Password needs a number'),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  email: z.string().trim().email().optional(),
  password: z
    .string()
    .min(8)
    .regex(/[a-z]/)
    .regex(/[A-Z]/)
    .regex(/[0-9]/)
    .optional(),
});

export const addressSchema = z.object({
  label: z.string().trim().max(40).optional(),
  fullName: z.string().trim().min(2),
  line1: z.string().trim().min(4),
  line2: z.string().trim().optional(),
  city: z.string().trim().min(2),
  state: z.string().trim().optional(),
  postalCode: z.string().trim().min(3),
  country: z.string().trim().min(2),
  phone: z.string().trim().optional(),
  isDefault: z.boolean().optional(),
});

export const cartItemSchema = z.object({
  productId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid product id'),
  qty: z.number().int().min(1).max(99),
});

export const cartQtySchema = z.object({
  qty: z.number().int().min(0).max(99),
});

export const orderSchema = z.object({
  shippingAddress: addressSchema,
  paymentMethod: z.enum(['cod', 'card']).default('cod'),
});

export const productSchema = z.object({
  name: z.string().trim().min(3).max(160),
  description: z.string().trim().min(10).max(5000),
  brand: z.string().trim().optional(),
  category: z.string().trim().min(2),
  images: z.array(z.string().url()).optional(),
  price: z.number().nonnegative(),
  compareAtPrice: z.number().nonnegative().optional(),
  countInStock: z.number().int().nonnegative(),
  isFeatured: z.boolean().optional(),
});
