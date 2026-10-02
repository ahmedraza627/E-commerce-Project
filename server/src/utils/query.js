import mongoose from 'mongoose';
import { ApiError } from './apiError.js';

/**
 * Pure helpers shared by controllers/services — no req/res coupling, easy to unit test.
 */

export const parsePagination = (query, { defaultLimit = 12, maxLimit = 50 } = {}) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, Number.parseInt(query.limit, 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
};

export const buildProductFilter = (query) => {
  const filter = {};
  if (query.category) filter.category = query.category;
  if (query.brand) filter.brand = query.brand;
  if (query.search) {
    filter.$text = { $search: query.search };
  }
  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) filter.price.$gte = Number(query.minPrice);
    if (query.maxPrice) filter.price.$lte = Number(query.maxPrice);
  }
  if (query.inStock === 'true') filter.inStock = true;
  return filter;
};

export const SORT_MAP = {
  newest: { createdAt: -1 },
  'price-asc': { price: 1 },
  'price-desc': { price: -1 },
  rating: { rating: -1 },
  bestselling: { soldCount: -1 },
};

export const assertValidObjectId = (value, label = 'id') => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw ApiError.badRequest(`Invalid ${label}`);
  }
  return value;
};
