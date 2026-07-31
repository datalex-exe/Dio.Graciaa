import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function listOrders(req, res) {
  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!dbUser) {
      return res.status(401).json({ error: 'User not found' });
    }

    let filter = {};
    // ROLE_D (Client) is the only role restricted to their permitted projects.
    // Admin (ROLE_A), Feeder (ROLE_B), and Executive (ROLE_C) can see ALL projects.
    if (dbUser.role === 'ROLE_D') {
      const list = (dbUser.permittedProjects || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      filter = { orderNumber: { in: list } };
    }

    const orders = await prisma.order.findMany({
      where: filter,
      include: {
        buildings: {
          select: {
            id: true,
            capacity: true,
            apartments: {
              select: {
                overallCompletionPct: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Compute rollups for each order
    const result = orders.map(order => {
      const buildingsCount = order.buildings.length;
      let totalApartments = 0;
      let sumCompletion = 0.0;

      for (const b of order.buildings) {
        totalApartments += b.apartments.length;
        sumCompletion += b.apartments.reduce((sum, a) => sum + (a.overallCompletionPct || 0.0), 0.0);
      }

      const overallCompletion = totalApartments > 0 ? (sumCompletion / totalApartments) : 0.0;

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        clientName: order.clientName || order.siteName || '',
        siteAddress: order.siteAddress || '',
        supervisorName: order.supervisorName || '',
        totalApartmentsNeeded: order.totalApartmentsNeeded || 0,
        contractorId: order.contractorId || '',
        contractorName: order.contractorName || '',
        createdAt: order.createdAt,
        buildingsCount,
        totalApartments,
        overallCompletion: Math.round(overallCompletion * 1000) / 1000
      };
    });

    return res.json(result);
  } catch (err) {
    console.error('List orders error:', err);
    return res.status(500).json({ error: 'Internal server error listing orders' });
  }
}

export async function createOrder(req, res) {
  try {
    // Role A only (handled by roleGuard middleware, but let's be safe)
    if (req.user.role !== 'ROLE_A') {
      return res.status(403).json({ error: 'Only Data Entry / Setup role can create orders' });
    }

    const { orderNumber, clientName, siteName, siteAddress, supervisorName, totalApartmentsNeeded, contractorId, contractorName } = req.body;
    if (!orderNumber || typeof orderNumber !== 'string' || !orderNumber.trim()) {
      return res.status(400).json({ error: 'Order Number is required' });
    }

    const trimmedOrderNo = orderNumber.trim();
    const finalClientName = clientName || siteName || '';

    // Check uniqueness
    const existing = await prisma.order.findUnique({
      where: { orderNumber: trimmedOrderNo }
    });

    if (existing) {
      return res.status(400).json({ error: `Order Number "${trimmedOrderNo}" already exists` });
    }

    // Create order + default BillingSetup
    const order = await prisma.order.create({
      data: {
        orderNumber: trimmedOrderNo,
        clientName: finalClientName ? String(finalClientName).trim() : '',
        siteAddress: siteAddress ? String(siteAddress).trim() : '',
        supervisorName: supervisorName ? String(supervisorName).trim() : '',
        totalApartmentsNeeded: totalApartmentsNeeded ? (parseInt(totalApartmentsNeeded, 10) || 0) : 0,
        contractorId: contractorId ? String(contractorId).trim() : '',
        contractorName: contractorName ? String(contractorName).trim() : '',
        createdById: req.user.id,
        billingSetup: {
          create: {
            contractorRetentionPct: 5.0,
            contractorGSTPct: 18.0,
            contractorTDSPct: 1.0,
            clientRetentionPct: 5.0,
            clientGSTPct: 18.0,
            clientOtherDeduction: 0.0,
            clientMatEligiblePct: 40.0,
            clientExecEligiblePct: 45.0,
            clientHandoverEligiblePct: 15.0,
            // Pre-seed some default Unit Type Rates (5 of each product)
            unitTypeRates: {
              create: [
                { typeCode: 'K-Type 1', product: 'Kitchen', typeName: 'Standard Kitchen L-Shape', contractorRate: 45000, clientRate: 65000 },
                { typeCode: 'K-Type 2', product: 'Kitchen', typeName: 'Premium Kitchen Parallel', contractorRate: 55000, clientRate: 78000 },
                { typeCode: 'K-Type 3', product: 'Kitchen', typeName: 'Island Luxury Kitchen', contractorRate: 85000, clientRate: 120000 },
                { typeCode: 'K-Type 4', product: 'Kitchen', typeName: 'Compact Kitchen Straight', contractorRate: 35000, clientRate: 48000 },
                { typeCode: 'K-Type 5', product: 'Kitchen', typeName: 'Semi-Premium Kitchen L-Shape', contractorRate: 48000, clientRate: 68000 },

                { typeCode: 'W-Type 1', product: 'Wardrobe', typeName: 'Standard 2-Door Wardrobe', contractorRate: 25000, clientRate: 38000 },
                { typeCode: 'W-Type 2', product: 'Wardrobe', typeName: 'Premium 3-Door Sliding Wardrobe', contractorRate: 42000, clientRate: 58000 },
                { typeCode: 'W-Type 3', product: 'Wardrobe', typeName: 'Walk-in Wardrobe Luxury', contractorRate: 75000, clientRate: 110000 },
                { typeCode: 'W-Type 4', product: 'Wardrobe', typeName: 'Compact 2-Door Wardrobe Loft', contractorRate: 30000, clientRate: 45000 },
                { typeCode: 'W-Type 5', product: 'Wardrobe', typeName: 'Premium 4-Door Hinged Wardrobe', contractorRate: 48000, clientRate: 70000 },

                { typeCode: 'V-Type 1', product: 'Vanity', typeName: 'Single Sink Vanity Standard', contractorRate: 8000, clientRate: 12000 },
                { typeCode: 'V-Type 2', product: 'Vanity', typeName: 'Double Sink Premium Vanity', contractorRate: 14000, clientRate: 20000 },
                { typeCode: 'V-Type 3', product: 'Vanity', typeName: 'Compact Floating Vanity', contractorRate: 6500, clientRate: 9500 },
                { typeCode: 'V-Type 4', product: 'Vanity', typeName: 'Luxury Marble Top Vanity', contractorRate: 18000, clientRate: 26000 },
                { typeCode: 'V-Type 5', product: 'Vanity', typeName: 'Standard Floor Mounted Vanity', contractorRate: 9000, clientRate: 13500 },

                { typeCode: 'D-Type 1', product: 'Door', typeName: 'Standard Main Entrance Door', contractorRate: 15000, clientRate: 25000 },
                { typeCode: 'D-Type 2', product: 'Door', typeName: 'Premium Veneer Door', contractorRate: 22000, clientRate: 35000 },
                { typeCode: 'D-Type 3', product: 'Door', typeName: 'Toilet Laminate Door', contractorRate: 12000, clientRate: 18000 },
                { typeCode: 'D-Type 4', product: 'Door', typeName: 'Balcony Sliding UPVC Door', contractorRate: 18000, clientRate: 28000 },
                { typeCode: 'D-Type 5', product: 'Door', typeName: 'Standard Internal Flush Door', contractorRate: 10000, clientRate: 15000 }
              ]
            },
            // Pre-seed Contractor Milestones
            contractorMilestones: {
              create: [
                // Kitchen Milestones
                { product: 'Kitchen', milestoneName: 'Lower Carcasses Installed', percentage: 15.0 },
                { product: 'Kitchen', milestoneName: 'Upper Carcasses Installed', percentage: 15.0 },
                { product: 'Kitchen', milestoneName: 'Stone Installed', percentage: 15.0 },
                { product: 'Kitchen', milestoneName: 'Shutters & Hardware Installed', percentage: 25.0 },
                { product: 'Kitchen', milestoneName: 'Appliances Installed', percentage: 10.0 },
                { product: 'Kitchen', milestoneName: 'QC Approved & Handed Over', percentage: 20.0 },

                // Wardrobe Milestones
                { product: 'Wardrobe', milestoneName: 'Cabinets Installed', percentage: 40.0 },
                { product: 'Wardrobe', milestoneName: 'Shutter & Hardware Installed', percentage: 30.0 },
                { product: 'Wardrobe', milestoneName: 'QC Approved & Handed Over', percentage: 30.0 },

                // Vanity Milestones
                { product: 'Vanity', milestoneName: 'Cabinets Installed', percentage: 40.0 },
                { product: 'Vanity', milestoneName: 'Shutter & Hardware Installed', percentage: 30.0 },
                { product: 'Vanity', milestoneName: 'QC Approved & Handed Over', percentage: 30.0 },

                // Door Milestones
                { product: 'Door', milestoneName: 'Frame & Hardware Installed', percentage: 50.0 },
                { product: 'Door', milestoneName: 'QC Approved & Handed Over', percentage: 50.0 }
              ]
            },
            // Pre-seed Client RA Milestones (must sum to 100% per product)
            clientRAMilestones: {
              create: [
                // Kitchen Material Supply Milestones (sum = 40%)
                { product: 'Kitchen', recognitionType: 'MATERIAL', milestoneName: 'Lower Carcasses Supplied', fieldKey: 'kitchenLowerCarcassInward', percentage: 8.0 },
                { product: 'Kitchen', recognitionType: 'MATERIAL', milestoneName: 'Upper Carcasses Supplied', fieldKey: 'kitchenUpperCarcassInward', percentage: 7.0 },
                { product: 'Kitchen', recognitionType: 'MATERIAL', milestoneName: 'Stone Supplied', fieldKey: 'kitchenStoneInward', percentage: 7.0 },
                { product: 'Kitchen', recognitionType: 'MATERIAL', milestoneName: 'Shutters Supplied', fieldKey: 'kitchenShutterInward', percentage: 8.0 },
                { product: 'Kitchen', recognitionType: 'MATERIAL', milestoneName: 'Hardware Supplied', fieldKey: 'kitchenHardwareInward', percentage: 5.0 },
                { product: 'Kitchen', recognitionType: 'MATERIAL', milestoneName: 'Appliances Supplied', fieldKey: 'kitchenApplianceInward', percentage: 5.0 },
                // Kitchen Execution Milestones (sum = 45%)
                { product: 'Kitchen', recognitionType: 'EXECUTION', milestoneName: 'Lower Carcasses Installed', fieldKey: 'kitchenLowerCarcassInstalled', percentage: 9.0 },
                { product: 'Kitchen', recognitionType: 'EXECUTION', milestoneName: 'Upper Carcasses Installed', fieldKey: 'kitchenUpperCarcassInstalled', percentage: 9.0 },
                { product: 'Kitchen', recognitionType: 'EXECUTION', milestoneName: 'Stone Installed', fieldKey: 'kitchenStoneInstalled', percentage: 9.0 },
                { product: 'Kitchen', recognitionType: 'EXECUTION', milestoneName: 'Shutters & Hardware Installed', fieldKey: 'kitchenShutterHardwareInstalled', percentage: 10.0 },
                { product: 'Kitchen', recognitionType: 'EXECUTION', milestoneName: 'Appliances Installed', fieldKey: 'kitchenApplianceInstalled', percentage: 8.0 },
                // Kitchen Handover Milestone (sum = 15%)
                { product: 'Kitchen', recognitionType: 'HANDOVER', milestoneName: 'QC Approved & Handed Over', fieldKey: 'kitchenHandedOver', percentage: 15.0 },

                // Wardrobe Material Supply Milestones (sum = 40%)
                { product: 'Wardrobe', recognitionType: 'MATERIAL', milestoneName: 'Cabinets Supplied', fieldKey: 'wardrobeCabinetInward', percentage: 20.0 },
                { product: 'Wardrobe', recognitionType: 'MATERIAL', milestoneName: 'Shutter & Hardware Supplied', fieldKey: 'wardrobeShutterHardwareInward', percentage: 20.0 },
                // Wardrobe Execution Milestones (sum = 40%)
                { product: 'Wardrobe', recognitionType: 'EXECUTION', milestoneName: 'Cabinets Installed', fieldKey: 'wardrobeCabinetInstalled', percentage: 20.0 },
                { product: 'Wardrobe', recognitionType: 'EXECUTION', milestoneName: 'Shutter & Hardware Installed', fieldKey: 'wardrobeShutterHardwareInstalled', percentage: 20.0 },
                // Wardrobe Handover Milestone (sum = 20%)
                { product: 'Wardrobe', recognitionType: 'HANDOVER', milestoneName: 'QC Approved & Handed Over', fieldKey: 'wardrobeHandedOver', percentage: 20.0 },

                // Vanity Material Supply Milestones (sum = 40%)
                { product: 'Vanity', recognitionType: 'MATERIAL', milestoneName: 'Cabinets Supplied', fieldKey: 'vanityCabinetInward', percentage: 20.0 },
                { product: 'Vanity', recognitionType: 'MATERIAL', milestoneName: 'Shutter & Hardware Supplied', fieldKey: 'vanityShutterHardwareInward', percentage: 20.0 },
                // Vanity Execution Milestones (sum = 40%)
                { product: 'Vanity', recognitionType: 'EXECUTION', milestoneName: 'Cabinets Installed', fieldKey: 'vanityCabinetInstalled', percentage: 20.0 },
                { product: 'Vanity', recognitionType: 'EXECUTION', milestoneName: 'Shutter & Hardware Installed', fieldKey: 'vanityShutterHardwareInstalled', percentage: 20.0 },
                // Vanity Handover Milestone (sum = 20%)
                { product: 'Vanity', recognitionType: 'HANDOVER', milestoneName: 'QC Approved & Handed Over', fieldKey: 'vanityHandedOver', percentage: 20.0 },

                // Door Material Supply Milestones (sum = 40%)
                { product: 'Door', recognitionType: 'MATERIAL', milestoneName: 'Frame & Hardware Supplied', fieldKey: 'doorFrameHardwareInward', percentage: 40.0 },
                // Door Execution Milestones (sum = 45%)
                { product: 'Door', recognitionType: 'EXECUTION', milestoneName: 'Frame & Hardware Installed', fieldKey: 'doorFrameHardwareInstalled', percentage: 45.0 },
                // Door Handover Milestone (sum = 15%)
                { product: 'Door', recognitionType: 'HANDOVER', milestoneName: 'QC Approved & Handed Over', fieldKey: 'doorHandedOver', percentage: 15.0 }
              ]
            }
          }
        }
      },
      include: {
        billingSetup: true
      }
    });

    return res.status(201).json(order);
  } catch (err) {
    console.error('Create order error:', err);
    return res.status(500).json({ error: 'Internal server error creating order' });
  }
}

export async function getOrder(req, res) {
  const { orderId } = req.params;
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buildings: true,
        billingSetup: true
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    return res.json(order);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error getting order' });
  }
}

export async function deleteOrder(req, res) {
  const { orderId } = req.params;
  try {
    if (req.user.role !== 'ROLE_A') {
      return res.status(403).json({ error: 'Only Data Entry / Setup role can delete orders' });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Delete the order — cascading deletes handle buildings, apartments,
    // audit logs, billing setup (and its children), and bill lines.
    await prisma.order.delete({
      where: { id: orderId }
    });

    return res.json({ message: 'Order and all associated data deleted successfully' });
  } catch (err) {
    console.error('Delete order error:', err);
    return res.status(500).json({ error: 'Internal server error deleting order' });
  }
}
