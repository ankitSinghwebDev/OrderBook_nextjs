import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const FALLBACK_SECRET = 'insecure_dev_secret_change_me';
const JWT_SECRET = process.env.JWT_SECRET || FALLBACK_SECRET;

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET is required in production');
}

const unauthorized = (msg = 'Authentication required') =>
  NextResponse.json({ success: false, message: msg }, { status: 401 });

const forbidden = (msg = 'Insufficient permissions') =>
  NextResponse.json({ success: false, message: msg }, { status: 403 });

/**
 * Extract and verify JWT from request cookies.
 * Returns { user } on success or { error: NextResponse } on failure.
 * user shape: { id, email, role, workspaceId }
 */
export function getAuthUser(request) {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return { error: unauthorized() };

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return {
      user: {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role,
        workspaceId: decoded.workspaceId,
      },
    };
  } catch {
    return { error: unauthorized('Invalid or expired token') };
  }
}

export function requireAuth(request) {
  return getAuthUser(request);
}

export function requireRole(request, allowedRoles = []) {
  const { user, error } = getAuthUser(request);
  if (error) return { error };
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return { error: forbidden(`Role '${user.role}' is not authorized`) };
  }
  return { user };
}

export function requireWorkspace(request, workspaceId) {
  const { user, error } = getAuthUser(request);
  if (error) return { error };
  if (user.workspaceId !== workspaceId) {
    return { error: forbidden('You do not belong to this workspace') };
  }
  return { user };
}

export { JWT_SECRET, unauthorized, forbidden };
