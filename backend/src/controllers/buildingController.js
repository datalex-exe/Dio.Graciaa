import { PrismaClient } from '@prisma/client';
import { recalculateApartment } from '../services/calculationService.js';

const prisma = new PrismaClient();

export async function listBuildings(req, res) {
  const { orderId } = req.params;
  try {
    const buildings = await prisma.building.findMany({
      where: { orderId },
      include: {
        apartments: {
          select: {
            overallCompletionPct: true,
            apartmentStatus: true,
            health: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Compute metrics for each building
    const result = buildings.map(building => {
      const apartments = building.apartments;
      const count = apartments.length;
      
      let sumCompletion = 0.0;
      let completedCount = 0;
      let inProgressCount = 0;
      let delayedCount = 0;
      let criticalCount = 0;

      for (const apt of apartments) {
        sumCompletion += apt.overallCompletionPct || 0.0;
        if (apt.apartmentStatus === "Completed") completedCount++;
        else if (apt.apartmentStatus !== "Not Started") inProgressCount++;

        if (apt.health === "Delayed") delayedCount++;
        else if (apt.health === "Critical") criticalCount++;
      }

      const overallCompletion = count > 0 ? (sumCompletion / count) : 0.0;

      return {
        id: building.id,
        name: building.name,
        capacity: building.capacity,
        siteName: building.siteName,
        reportDate: building.reportDate,
        overallCompletion: Math.round(overallCompletion * 1000) / 1000,
        completedCount,
        inProgressCount,
        delayedCount: delayedCount + criticalCount,
        createdAt: building.createdAt
      };
    });

    return res.json(result);
  } catch (err) {
    console.error('List buildings error:', err);
    return res.status(500).json({ error: 'Internal server error listing buildings' });
  }
}

export async function createBuilding(req, res) {
  const { orderId } = req.params;
  const {
    name,
    count,
    capacity,
    siteName,
    reportDate,
    materialWeight,
    executionWeight,
    goodThreshold,
    excellentThreshold,
    delayedDaysThreshold,
    criticalDaysThreshold
  } = req.body;

  if (!capacity) {
    return res.status(400).json({ error: 'Capacity is required' });
  }

  const parsedCapacity = parseInt(capacity, 10);
  if (isNaN(parsedCapacity) || parsedCapacity <= 0) {
    return res.status(400).json({ error: 'Capacity must be a positive integer' });
  }

  const numTowers = count ? Math.max(1, parseInt(count, 10)) : 1;
  const baseName = name && typeof name === 'string' && name.trim() ? name.trim() : 'Tower';

  try {
    if (req.user.role !== 'ROLE_A') {
      return res.status(403).json({ error: 'Only Data Entry / Setup role can add buildings' });
    }

    const buildingReportDate = reportDate ? new Date(reportDate) : new Date();

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { supervisorName: true, contractorId: true, contractorName: true }
    });
    const defaultSupervisor = order?.supervisorName || '';
    const defaultContractor = order?.contractorId || '';
    const defaultContractorName = order?.contractorName || '';

    const commonConfig = {
      capacity: parsedCapacity,
      siteName: siteName ? String(siteName).trim() : '',
      reportDate: buildingReportDate,
      materialWeight: materialWeight !== undefined ? parseFloat(materialWeight) : 0.3,
      executionWeight: executionWeight !== undefined ? parseFloat(executionWeight) : 0.7,
      goodThreshold: goodThreshold !== undefined ? parseFloat(goodThreshold) : 0.75,
      excellentThreshold: excellentThreshold !== undefined ? parseFloat(excellentThreshold) : 0.9,
      delayedDaysThreshold: delayedDaysThreshold !== undefined ? parseInt(delayedDaysThreshold, 10) : 7,
      criticalDaysThreshold: criticalDaysThreshold !== undefined ? parseInt(criticalDaysThreshold, 10) : 14
    };

    // Use transaction to create building(s) and apartments
    const createdBuildings = await prisma.$transaction(async (tx) => {
      const list = [];

      for (let t = 1; t <= numTowers; t++) {
        const towerName = numTowers > 1 ? `${baseName} ${t}` : baseName;
        const buildingConfig = {
          name: towerName,
          ...commonConfig
        };

        const building = await tx.building.create({
          data: {
            orderId,
            ...buildingConfig
          }
        });

        // Generate empty apartment rows for this building
        const apartmentsData = [];
        for (let i = 1; i <= parsedCapacity; i++) {
          const rawApt = {
            buildingId: building.id,
            srNo: i,
            apartmentNo: null,
            floor: null,
            priority: 'Normal',
            kitchenQty: null,
            wardrobeQty: null,
            vanityQty: null,
            doorQty: null,
            kitchenType: 'K-Type 1',
            wardrobeType: 'W-Type 1',
            vanityType: 'V-Type 1',
            doorType: 'D-Type 1',
            supervisorName: defaultSupervisor,
            responsibleEngineer: defaultSupervisor,
            contractor: defaultContractor,
            contractorName: defaultContractorName
          };

          const calculated = recalculateApartment(rawApt, buildingConfig);
          apartmentsData.push(calculated);
        }

        await tx.apartment.createMany({
          data: apartmentsData
        });

        list.push(building);
      }

      return list;
    });

    return res.status(201).json(numTowers === 1 ? createdBuildings[0] : createdBuildings);
  } catch (err) {
    console.error('Create building error:', err);
    return res.status(500).json({ error: 'Internal server error creating building' });
  }
}

export async function getBuilding(req, res) {
  const { buildingId } = req.params;
  try {
    const building = await prisma.building.findUnique({
      where: { id: buildingId },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            contractorId: true,
            contractorName: true
          }
        }
      }
    });

    if (!building) {
      return res.status(404).json({ error: 'Building not found' });
    }

    return res.json(building);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateBuildingConfig(req, res) {
  const { buildingId } = req.params;
  const {
    name,
    capacity,
    siteName,
    reportDate,
    materialWeight,
    executionWeight,
    goodThreshold,
    excellentThreshold,
    delayedDaysThreshold,
    criticalDaysThreshold
  } = req.body;

  try {
    if (req.user.role !== 'ROLE_A') {
      return res.status(403).json({ error: 'Only Data Entry / Setup role can update configuration' });
    }

    const building = await prisma.building.findUnique({
      where: { id: buildingId },
      include: { order: { select: { contractorId: true, contractorName: true } } }
    });

    if (!building) {
      return res.status(404).json({ error: 'Building not found' });
    }

    const newCapacity = capacity !== undefined ? parseInt(capacity, 10) : building.capacity;

    const updatedConfig = {
      name: name !== undefined ? name : building.name,
      capacity: newCapacity,
      siteName: siteName !== undefined ? siteName : building.siteName,
      reportDate: reportDate ? new Date(reportDate) : building.reportDate,
      materialWeight: materialWeight !== undefined ? parseFloat(materialWeight) : building.materialWeight,
      executionWeight: executionWeight !== undefined ? parseFloat(executionWeight) : building.executionWeight,
      goodThreshold: goodThreshold !== undefined ? parseFloat(goodThreshold) : building.goodThreshold,
      excellentThreshold: excellentThreshold !== undefined ? parseFloat(excellentThreshold) : building.excellentThreshold,
      delayedDaysThreshold: delayedDaysThreshold !== undefined ? parseInt(delayedDaysThreshold, 10) : building.delayedDaysThreshold,
      criticalDaysThreshold: criticalDaysThreshold !== undefined ? parseInt(criticalDaysThreshold, 10) : building.criticalDaysThreshold
    };

    const updatedBuilding = await prisma.$transaction(async (tx) => {
      // 1. Update building config
      const b = await tx.building.update({
        where: { id: buildingId },
        data: updatedConfig
      });

      // 2. Adjust capacity apartment rows if capacity changed
      if (newCapacity > building.capacity) {
        const newApts = [];
        for (let i = building.capacity + 1; i <= newCapacity; i++) {
          const rawApt = {
            buildingId: building.id,
            srNo: i,
            apartmentNo: null,
            floor: null,
            priority: 'Normal',
            kitchenQty: 1,
            wardrobeQty: 1,
            vanityQty: 1,
            doorQty: 1,
            kitchenType: 'K-Type 1',
            wardrobeType: 'W-Type 1',
            vanityType: 'V-Type 1',
            doorType: 'D-Type 1',
            contractor: building.order?.contractorId || '',
            contractorName: building.order?.contractorName || ''
          };

          const calculated = recalculateApartment(rawApt, b);
          newApts.push(calculated);
        }
        await tx.apartment.createMany({ data: newApts });
      } else if (newCapacity < building.capacity) {
        await tx.apartment.deleteMany({
          where: {
            buildingId,
            srNo: { gt: newCapacity }
          }
        });
      }

      // 3. Fetch and recalculate all remaining apartments under this building
      const apartments = await tx.apartment.findMany({
        where: { buildingId }
      });

      for (const apt of apartments) {
        const recalculated = recalculateApartment(apt, b);
        await tx.apartment.update({
          where: { id: apt.id },
          data: {
            materialInwardPct: recalculated.materialInwardPct,
            kitchenCompletionPct: recalculated.kitchenCompletionPct,
            wardrobeCompletionPct: recalculated.wardrobeCompletionPct,
            vanityCompletionPct: recalculated.vanityCompletionPct,
            doorCompletionPct: recalculated.doorCompletionPct,
            overallCompletionPct: recalculated.overallCompletionPct,
            kitchenQCGate: recalculated.kitchenQCGate,
            wardrobeQCGate: recalculated.wardrobeQCGate,
            vanityQCGate: recalculated.vanityQCGate,
            doorQCGate: recalculated.doorQCGate,
            handoverApprovalStatus: recalculated.handoverApprovalStatus,
            apartmentStatus: recalculated.apartmentStatus,
            delayDays: recalculated.delayDays,
            health: recalculated.health
          }
        });
      }

      return b;
    });

    return res.json(updatedBuilding);
  } catch (err) {
    console.error('Update building config error:', err);
    return res.status(500).json({ error: 'Internal server error updating building config' });
  }
}

export async function deleteBuilding(req, res) {
  const { buildingId } = req.params;
  try {
    if (req.user.role !== 'ROLE_A') {
      return res.status(403).json({ error: 'Only Data Entry / Setup role can delete buildings' });
    }

    const building = await prisma.building.findUnique({
      where: { id: buildingId }
    });

    if (!building) {
      return res.status(404).json({ error: 'Building not found' });
    }

    // Delete the building — cascading deletes handle apartments,
    // audit logs, tower client rates, and client RA bill lines.
    await prisma.building.delete({
      where: { id: buildingId }
    });

    return res.json({ message: 'Building and all associated data deleted successfully' });
  } catch (err) {
    console.error('Delete building error:', err);
    return res.status(500).json({ error: 'Internal server error deleting building' });
  }
}

export async function copyBuildingData(req, res) {
  const { sourceBuildingId, targetBuildingId } = req.body;
  if (!sourceBuildingId || !targetBuildingId) {
    return res.status(400).json({ error: 'Source and target building IDs are required' });
  }
  if (sourceBuildingId === targetBuildingId) {
    return res.status(400).json({ error: 'Source and target buildings must be different' });
  }

  try {
    if (req.user.role !== 'ROLE_A') {
      return res.status(403).json({ error: 'Only Setup Operator (Admin) can copy building data' });
    }

    const sourceBuilding = await prisma.building.findUnique({
      where: { id: sourceBuildingId },
      include: { apartments: true }
    });

    const targetBuilding = await prisma.building.findUnique({
      where: { id: targetBuildingId },
      include: { apartments: true }
    });

    if (!sourceBuilding || !targetBuilding) {
      return res.status(404).json({ error: 'Source or target building not found' });
    }

    const sourceApts = sourceBuilding.apartments;
    const targetApts = targetBuilding.apartments;

    const copyFields = [
      'priority', 'kitchenQty', 'wardrobeQty', 'vanityQty', 'doorQty',
      'kitchenLowerCarcassInward', 'kitchenUpperCarcassInward', 'kitchenStoneInward',
      'kitchenShutterInward', 'kitchenHardwareInward', 'kitchenApplianceInward',
      'wardrobeCabinetInward', 'wardrobeShutterHardwareInward',
      'vanityCabinetInward', 'vanityShutterHardwareInward',
      'doorFrameHardwareInward',
      'kitchenLowerCarcassInstalled', 'kitchenUpperCarcassInstalled', 'kitchenStoneInstalled',
      'kitchenShutterHardwareInstalled', 'kitchenApplianceInstalled', 'kitchenHandedOver',
      'wardrobeCabinetInstalled', 'wardrobeShutterHardwareInstalled', 'wardrobeHandedOver',
      'vanityCabinetInstalled', 'vanityShutterHardwareInstalled', 'vanityHandedOver',
      'doorFrameHardwareInstalled', 'doorHandedOver',
      'plannedStart', 'plannedCompletion', 'actualStart', 'actualCompletion',
      'supervisorName', 'responsibleEngineer', 'contractor', 'contractorName', 'delayReason', 'remarks',
      'kitchenQC_VisibleScrews', 'kitchenQC_Chipping', 'kitchenQC_FillerMissing',
      'kitchenQC_Scratches', 'kitchenQC_DrawersFunction', 'kitchenQC_CutleryTray', 'kitchenQC_DishDrainer',
      'wardrobeQC_VisibleScrews', 'wardrobeQC_Chipping', 'wardrobeQC_FillerMissing',
      'wardrobeQC_Scratches', 'wardrobeQC_DrawersFunction',
      'vanityQC_VisibleScrews', 'vanityQC_Chipping', 'vanityQC_FillerMissing',
      'vanityQC_Scratches', 'vanityQC_DrawersFunction',
      'doorQC_Chipping', 'doorQC_Alignment',
      'kitchenType', 'wardrobeType', 'vanityType', 'doorType'
    ];

    const updatedApts = [];
    const auditLogs = [];

    // Match by srNo
    for (const targetApt of targetApts) {
      const sourceApt = sourceApts.find(a => a.srNo === targetApt.srNo);
      if (!sourceApt) continue;

      const updates = {};
      for (const field of copyFields) {
        updates[field] = sourceApt[field];
      }

      // Merge and recalculate
      const merged = { ...targetApt, ...updates };
      const recalculated = recalculateApartment(merged, targetBuilding);

      // Exclude all Prisma-managed, identity, and apartment-specific fields from the update payload.
      // srNo, apartmentNo and floor belong to the TARGET apartment and must never be overwritten.
      const {
        id,
        buildingId,
        srNo,
        apartmentNo,
        floor,
        createdAt,
        updatedAt,
        building,
        auditLogs: al,
        ...updateData
      } = recalculated;
      updatedApts.push({
        id: targetApt.id,
        data: updateData
      });

      auditLogs.push({
        apartmentId: targetApt.id,
        userId: req.user.id,
        fieldName: 'Copy Data',
        oldValue: `From building: ${sourceBuilding.name}`,
        newValue: `Copied values from SrNo: ${sourceApt.srNo}`
      });
    }

    await prisma.$transaction(async (tx) => {
      for (const item of updatedApts) {
        await tx.apartment.update({
          where: { id: item.id },
          data: item.data
        });
      }

      if (auditLogs.length > 0) {
        await tx.auditLog.createMany({
          data: auditLogs
        });
      }
    });

    return res.json({ success: true, copiedCount: updatedApts.length });
  } catch (err) {
    console.error('Copy building data error:', err);
    return res.status(500).json({ error: 'Internal server error copying building data' });
  }
}
