import mongoose from 'mongoose';
import { Product } from '../models/product.model.js';
import { ApiError, asyncHandler, ok } from '../utils/apiError.js';
import { parsePagination, buildProductFilter, SORT_MAP, assertValidObjectId } from '../utils/query.js';
import { slugify } from '../utils/slugify.js';

// GET /api/v1/products — public, filterable, paginated
export const getProducts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = buildProductFilter(req.query);
  const sort = SORT_MAP[req.query.sort] ?? SORT_MAP.newest;

  const [items, total] = await Promise.all([
    // No .lean(): the toJSON transform/virtuals (inStock, discountPercent) must apply
    Product.find(filter).sort(sort).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);

  ok(res, {
    message: 'Products fetched',
    data: {
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    },
  });
});

// GET /api/v1/products/:idOrSlug
export const getProduct = asyncHandler(async (req, res) => {
  const { idOrSlug } = req.params;
  const isObjectId = mongoose.Types.ObjectId.isValid(idOrSlug);
  const product = await Product.findOne(isObjectId ? { _id: idOrSlug } : { slug: idOrSlug });

  if (!product) throw ApiError.notFound('Product not found');
  ok(res, { message: 'Product fetched', data: { product } });
});

// POST /api/v1/products — admin
export const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create({
    ...req.body,
    slug: slugify(req.body.name),
    images: req.files?.map((f) => `/uploads/${f.filename}`) ?? req.body.images ?? [],
  });
  ok(res, { status: 201, message: 'Product created', data: { product } });
});

// PUT /api/v1/products/:id — admin
export const updateProduct = asyncHandler(async (req, res) => {
  assertValidObjectId(req.params.id, 'product id');

  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');

  Object.assign(product, req.body);
  if (req.body.name) product.slug = slugify(req.body.name);
  if (req.files?.length) {
    product.images = [...(product.images ?? []), ...req.files.map((f) => `/uploads/${f.filename}`)];
  }
  await product.save();

  ok(res, { message: 'Product updated', data: { product } });
});

// DELETE /api/v1/products/:id — admin
export const deleteProduct = asyncHandler(async (req, res) => {
  assertValidObjectId(req.params.id, 'product id');

  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');

  ok(res, { message: 'Product deleted', data: { id: product._id } });
});

// GET /api/v1/products/meta/categories — facets for filter UI
export const getCategories = asyncHandler(async (_req, res) => {
  const categories = await Product.distinct('category').sort();
  ok(res, { message: 'Categories fetched', data: { categories } });
});
