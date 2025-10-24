import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Middleware to check if the authenticated user is an admin
 * Must be used AFTER authenticateToken middleware
 */
export const requireAdmin = async (req, res, next) => {
  try {
    // Check if user is authenticated (should be set by authenticateToken middleware)
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { isAdmin: true }
    });

    if (!user) {
      return res.status(401).json({
        error: 'User not found'
      });
    }

    // Check if user is admin
    if (!user.isAdmin) {
      return res.status(403).json({
        error: 'Access denied. Admin privileges required.'
      });
    }

    // User is admin, continue to route handler
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({
      error: 'Authorization check failed'
    });
  }
};
