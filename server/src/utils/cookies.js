import config from '../config/env.js';

/**
 * Cookie options for the refresh token (and access token when cookie mode is on).
 * httpOnly + sameSite + (secure in prod) is what makes this XSS-resistant:
 * JavaScript on the page can never read the token.
 */
export const authCookieOptions = () => ({
  httpOnly: config.cookies.httpOnly,
  secure: config.cookies.secure,
  sameSite: config.cookies.sameSite, // 'lax' in dev, 'none' (requires HTTPS) cross-site in prod
  path: config.cookies.path,
  maxAge: config.cookies.maxAgeMs,
});

export const setAuthCookies = (res, { accessToken, refreshToken }) => {
  res.cookie(config.cookies.refreshName, refreshToken, authCookieOptions());
  // Access token also kept in a short-lived httpOnly cookie; middleware falls back
  // to the Authorization header for non-browser clients (mobile apps, Postman).
  res.cookie(config.cookies.accessName, accessToken, {
    ...authCookieOptions(),
    maxAge: 15 * 60 * 1000,
  });
};

export const clearAuthCookies = (res) => {
  res.clearCookie(config.cookies.refreshName, authCookieOptions());
  res.clearCookie(config.cookies.accessName, { ...authCookieOptions(), maxAge: 0 });
};
