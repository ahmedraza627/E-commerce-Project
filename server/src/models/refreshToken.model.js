import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    userAgent: { type: String },
    ip: { type: String },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    replacedByTokenHash: { type: String, default: null },
  },
  { timestamps: true }
);

/** TTL index — MongoDB auto-deletes expired sessions. */
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

refreshTokenSchema.index({ user: 1, revokedAt: 1 });

/** Is this token still usable? */
refreshTokenSchema.methods.isActive = function isActive() {
  return !this.revokedAt && this.expiresAt > new Date();
};

export const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);
