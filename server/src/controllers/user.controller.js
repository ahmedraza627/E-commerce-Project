import { User } from '../models/user.model.js';
import { ApiError, asyncHandler, ok } from '../utils/apiError.js';
import { assertValidObjectId } from '../utils/query.js';

// PUT /api/v1/users/me — update profile
export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  if (!user) throw ApiError.notFound('User not found');

  const { name, email, password } = req.body;
  if (name) user.name = name;
  if (email && email.toLowerCase() !== user.email) {
    if (await User.findByEmail(email)) {
      throw ApiError.conflict('Email is already in use by another account');
    }
    user.email = email;
  }
  if (password) user.password = password; // hashed by the pre-save hook
  await user.save();

  ok(res, { message: 'Profile updated', data: { user } });
});

// GET /api/v1/users/me/addresses
export const getAddresses = asyncHandler(async (req, res) => {
  ok(res, { message: 'Addresses fetched', data: { addresses: req.user.addresses } });
});

// POST /api/v1/users/me/addresses
export const addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (req.body.isDefault) {
    user.addresses.forEach((a) => {
      a.isDefault = false;
    });
  }
  user.addresses.push(req.body);
  await user.save();
  ok(res, { status: 201, message: 'Address added', data: { addresses: user.addresses } });
});

// PUT /api/v1/users/me/addresses/:addressId
export const updateAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.addressId);
  if (!address) throw ApiError.notFound('Address not found');

  if (req.body.isDefault) {
    user.addresses.forEach((a) => {
      a.isDefault = false;
    });
  }
  Object.assign(address, req.body);
  await user.save();
  ok(res, { message: 'Address updated', data: { addresses: user.addresses } });
});

// DELETE /api/v1/users/me/addresses/:addressId
export const deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.addressId);
  if (!address) throw ApiError.notFound('Address not found');

  address.deleteOne();
  await user.save();
  ok(res, { message: 'Address deleted', data: { addresses: user.addresses } });
});

// ---- Admin ----

// GET /api/v1/users — admin
export const getUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Number.parseInt(req.query.limit, 10) || 20);

  const [items, total] = await Promise.all([
    User.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(),
  ]);

  ok(res, {
    message: 'Users fetched',
    data: { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 } },
  });
});

// PATCH /api/v1/users/:id/active — admin activate/deactivate
export const setUserActive = asyncHandler(async (req, res) => {
  assertValidObjectId(req.params.id, 'user id');
  if (req.params.id === req.user._id.toString()) {
    throw ApiError.badRequest('You cannot deactivate your own account');
  }

  const user = await User.findByIdAndUpdate(req.params.id, { isActive: req.body.isActive }, { new: true });
  if (!user) throw ApiError.notFound('User not found');

  ok(res, { message: `User ${user.isActive ? 'activated' : 'deactivated'}`, data: { user } });
});
