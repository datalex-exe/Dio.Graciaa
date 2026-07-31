import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function checkProjectAccess(req, res, next) {
  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!dbUser) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Admin (ROLE_A), Feeder (ROLE_B), and Executive (ROLE_C) can read ALL projects.
    // Only Client / project-restricted (ROLE_D) is limited to their permitted project list.
    if (dbUser.role === 'ROLE_A' || dbUser.role === 'ROLE_B' || dbUser.role === 'ROLE_C') {
      return next();
    }

    let orderNumber = null;

    // 1. Check orderId
    if (req.params.orderId) {
      const order = await prisma.order.findUnique({
        where: { id: req.params.orderId },
        select: { orderNumber: true }
      });
      if (order) {
        orderNumber = order.orderNumber;
      }
    }
    // 2. Check buildingId
    else if (req.params.buildingId) {
      const building = await prisma.building.findUnique({
        where: { id: req.params.buildingId },
        select: { order: { select: { orderNumber: true } } }
      });
      if (building) {
        orderNumber = building.order.orderNumber;
      }
    }
    // 3. Check apartmentId
    else if (req.params.apartmentId) {
      const apartment = await prisma.apartment.findUnique({
        where: { id: req.params.apartmentId },
        select: { building: { select: { order: { select: { orderNumber: true } } } } }
      });
      if (apartment) {
        orderNumber = apartment.building.order.orderNumber;
      }
    }

    // If an order number is resolved, check if the user is permitted to access it
    if (orderNumber !== null) {
      const permittedList = (dbUser.permittedProjects || '')
        .split(',')
        .map(s => s.trim().toLowerCase())
        .filter(Boolean);

      if (!permittedList.includes(orderNumber.toLowerCase())) {
        return res.status(403).json({ error: 'You do not have permission to access this project.' });
      }
    }

    next();
  } catch (err) {
    console.error('Project access check error:', err);
    return res.status(500).json({ error: 'Internal server error checking project access' });
  }
}
