import { PrismaClient } from '@prisma/client';
import { recalculateApartment } from '../services/calculationService.js';

const prisma = new PrismaClient();

const ROLE_A_FIELDS = ['srNo', 'apartmentNo', 'floor', 'priority', 'kitchenQty', 'wardrobeQty', 'vanityQty', 'doorQty', 'responsibleEngineer', 'supervisorName', 'kitchenType', 'wardrobeType', 'vanityType', 'doorType'];

export async function listApartments(req, res) {
  const { buildingId } = req.params;
  try {
    const apartments = await prisma.apartment.findMany({
      where: { buildingId },
      orderBy: { srNo: 'asc' }
    });
    return res.json(apartments);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error listing apartments' });
  }
}

export async function createApartment(req, res) {
  const { buildingId } = req.params;
  const { apartmentNo, floor, priority, kitchenType, wardrobeType, vanityType } = req.body;

  try {
    if (req.user.role !== 'ROLE_A') {
      return res.status(403).json({ error: 'Only Setup Operator can add apartment rows' });
    }

    const building = await prisma.building.findUnique({
      where: { id: buildingId },
      include: { 
        apartments: { orderBy: { srNo: 'desc' }, take: 1 },
        order: { select: { contractorId: true } }
      }
    });

    if (!building) {
      return res.status(404).json({ error: 'Building not found' });
    }

    const lastSrNo = building.apartments.length > 0 ? building.apartments[0].srNo : 0;
    const nextSrNo = lastSrNo + 1;
    const defaultFloor = floor ? String(floor).trim() : null;
    const defaultAptNo = apartmentNo ? String(apartmentNo).trim() : null;

    const rawApt = {
      buildingId,
      srNo: nextSrNo,
      apartmentNo: defaultAptNo,
      floor: defaultFloor,
      priority: priority || 'Normal',
      kitchenQty: null,
      wardrobeQty: null,
      vanityQty: null,
      doorQty: null,
      kitchenType: kitchenType || 'K-Type 1',
      wardrobeType: wardrobeType || 'W-Type 1',
      vanityType: vanityType || 'V-Type 1',
      doorType: doorType || 'D-Type 1',
      contractor: building.order?.contractorId || null
    };

    const calculated = recalculateApartment(rawApt, building);

    const newApt = await prisma.$transaction(async (tx) => {
      const created = await tx.apartment.create({
        data: calculated
      });

      await tx.building.update({
        where: { id: buildingId },
        data: { capacity: { increment: 1 } }
      });

      return created;
    });

    return res.status(201).json(newApt);
  } catch (err) {
    console.error('Create apartment error:', err);
    return res.status(500).json({ error: 'Failed to add apartment row' });
  }
}

export async function deleteApartment(req, res) {
  const { apartmentId } = req.params;

  try {
    if (req.user.role !== 'ROLE_A') {
      return res.status(403).json({ error: 'Only Setup Operator can delete apartment rows' });
    }

    const apt = await prisma.apartment.findUnique({
      where: { id: apartmentId }
    });

    if (!apt) {
      return res.status(404).json({ error: 'Apartment not found' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.apartment.delete({
        where: { id: apartmentId }
      });

      await tx.building.update({
        where: { id: apt.buildingId },
        data: { capacity: Math.max(0, (await tx.apartment.count({ where: { buildingId: apt.buildingId } }))) }
      });
    });

    return res.json({ message: 'Apartment row deleted successfully' });
  } catch (err) {
    console.error('Delete apartment error:', err);
    return res.status(500).json({ error: 'Failed to delete apartment row' });
  }
}

export async function updateApartment(req, res) {
  const { apartmentId } = req.params;
  const updates = req.body;

  try {
    const role = req.user.role;
    if (role !== 'ROLE_A') {
      return res.status(403).json({ error: 'Forbidden: Only Admin has access to modify data' });
    }

    // Load original apartment
    const apt = await prisma.apartment.findUnique({
      where: { id: apartmentId },
      include: { building: true }
    });

    if (!apt) {
      return res.status(404).json({ error: 'Apartment not found' });
    }

    // Role-based field enforcement
    const filteredUpdates = {};
    if (role === 'ROLE_A') {
      // Role A (Admin) has full editing rights to any field in the Apartment model
      for (const [key, value] of Object.entries(updates)) {
        if (key !== 'id' && key !== 'buildingId' && key !== 'createdAt') {
          filteredUpdates[key] = value;
        }
      }
    } else if (role === 'ROLE_B') {
      // Role B cannot edit first 7 fields
      const attemptedRoleAFields = ROLE_A_FIELDS.filter(key => updates[key] !== undefined);
      if (attemptedRoleAFields.length > 0) {
        return res.status(403).json({ 
          error: `Execution role cannot modify Setup fields: [${attemptedRoleAFields.join(', ')}]` 
        });
      }

      // Allow any other valid fields in Apartment model
      for (const [key, value] of Object.entries(updates)) {
        if (!ROLE_A_FIELDS.includes(key) && key !== 'id' && key !== 'buildingId' && key !== 'createdAt') {
          filteredUpdates[key] = value;
        }
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return res.json(apt); // nothing to update
    }

    // Parse date fields if present
    const dateFields = ['plannedStart', 'plannedCompletion', 'actualStart', 'actualCompletion'];
    for (const f of dateFields) {
      if (filteredUpdates[f] !== undefined) {
        filteredUpdates[f] = filteredUpdates[f] ? new Date(filteredUpdates[f]) : null;
      }
    }

    if (filteredUpdates.actualCompletion) {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (filteredUpdates.actualCompletion > today) {
        return res.status(400).json({ error: 'Actual completion date cannot be set in the future' });
      }
    }

    // Perform the update & recalculate in a transaction
    const updatedApt = await prisma.$transaction(async (tx) => {
      // 1. Create audit logs for changed fields
      const auditLogData = [];
      for (const [field, newVal] of Object.entries(filteredUpdates)) {
        let oldValStr = apt[field] === null ? '' : String(apt[field]);
        if (apt[field] instanceof Date) {
          oldValStr = apt[field].toISOString();
        }

        let newValStr = newVal === null ? '' : String(newVal);
        if (newVal instanceof Date) {
          newValStr = newVal.toISOString();
        }

        if (oldValStr !== newValStr) {
          auditLogData.push({
            apartmentId: apt.id,
            userId: req.user.id,
            fieldName: field,
            oldValue: oldValStr,
            newValue: newValStr
          });
        }
      }

      if (auditLogData.length > 0) {
        await tx.auditLog.createMany({
          data: auditLogData
        });
      }

      // Merge filtered updates into existing apartment object for recalculation
      const mergedApt = { ...apt, ...filteredUpdates };

      // 2. Recalculate
      const recalculated = recalculateApartment(mergedApt, apt.building);

      // 3. Update database (sanitize relation, primary/foreign keys and auto-managed fields)
      const { id, buildingId, createdAt, updatedAt, building: buildingRelation, auditLogs, ...updateData } = recalculated;
      return await tx.apartment.update({
        where: { id: apartmentId },
        data: updateData
      });
    });

    return res.json(updatedApt);
  } catch (err) {
    console.error('Update apartment error:', err);
    return res.status(500).json({ error: 'Internal server error updating apartment' });
  }
}

export async function batchUpdateApartments(req, res) {
  const { buildingId } = req.params;
  const { items } = req.body; // array of: { id, updates }

  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ error: 'Items array is required' });
  }

  try {
    const role = req.user.role;
    if (role !== 'ROLE_A') {
      return res.status(403).json({ error: 'Forbidden: Only Admin has access to modify data' });
    }

    const building = await prisma.building.findUnique({
      where: { id: buildingId }
    });

    if (!building) {
      return res.status(404).json({ error: 'Building not found' });
    }

    // Execute in a transaction
    const results = await prisma.$transaction(async (tx) => {
      const updatedList = [];

      for (const item of items) {
        const apt = await tx.apartment.findUnique({
          where: { id: item.id }
        });

        if (!apt || apt.buildingId !== buildingId) continue;

        const filteredUpdates = {};
        if (role === 'ROLE_A') {
          // Role A (Admin) has full editing rights to any field in the Apartment model
          for (const [key, value] of Object.entries(item.updates)) {
            if (key !== 'id' && key !== 'buildingId' && key !== 'createdAt') {
              filteredUpdates[key] = value;
            }
          }
        } else if (role === 'ROLE_B') {
          const attemptedRoleAFields = ROLE_A_FIELDS.filter(key => item.updates[key] !== undefined);
          if (attemptedRoleAFields.length > 0) {
            throw new Error(`Execution role cannot modify Setup fields in batch: [${attemptedRoleAFields.join(', ')}]`);
          }
          for (const [key, value] of Object.entries(item.updates)) {
            if (!ROLE_A_FIELDS.includes(key) && key !== 'id' && key !== 'buildingId' && key !== 'createdAt') {
              filteredUpdates[key] = value;
            }
          }

          // ONE-WRITE LOCK: ROLE_B cannot overwrite a field that already has a saved value.
          // Percentage fields: locked once > 0. Text/date fields: locked once non-empty.
          const pctFields = [
            'kitchenLowerCarcassInward', 'kitchenUpperCarcassInward', 'kitchenStoneInward',
            'kitchenShutterInward', 'kitchenHardwareInward', 'kitchenApplianceInward',
            'wardrobeCabinetInward', 'wardrobeShutterHardwareInward',
            'vanityCabinetInward', 'vanityShutterHardwareInward',
            'doorFrameHardwareInward',
            'kitchenLowerCarcassInstalled', 'kitchenUpperCarcassInstalled', 'kitchenStoneInstalled',
            'kitchenShutterHardwareInstalled', 'kitchenApplianceInstalled', 'kitchenHandedOver',
            'wardrobeCabinetInstalled', 'wardrobeShutterHardwareInstalled', 'wardrobeHandedOver',
            'vanityCabinetInstalled', 'vanityShutterHardwareInstalled', 'vanityHandedOver',
            'doorFrameHardwareInstalled', 'doorHandedOver'
          ];
          for (const f of pctFields) {
            if (filteredUpdates[f] !== undefined && apt[f] !== null && apt[f] !== undefined) {
              delete filteredUpdates[f]; // already saved — deny overwrite
            }
          }
          const textLockFields = [
            'plannedStart', 'plannedCompletion', 'actualStart', 'actualCompletion',
            'contractor', 'contractorName', 'delayReason', 'remarks',
            'kitchenQC_VisibleScrews', 'kitchenQC_Chipping', 'kitchenQC_FillerMissing',
            'kitchenQC_Scratches', 'kitchenQC_DrawersFunction', 'kitchenQC_CutleryTray', 'kitchenQC_DishDrainer',
            'wardrobeQC_VisibleScrews', 'wardrobeQC_Chipping', 'wardrobeQC_FillerMissing',
            'wardrobeQC_Scratches', 'wardrobeQC_DrawersFunction',
            'vanityQC_VisibleScrews', 'vanityQC_Chipping', 'vanityQC_FillerMissing',
            'vanityQC_Scratches', 'vanityQC_DrawersFunction',
            'doorQC_Chipping', 'doorQC_Alignment'
          ];
          for (const f of textLockFields) {
            const existing = apt[f];
            if (filteredUpdates[f] !== undefined && existing !== null && existing !== undefined && String(existing).trim() !== '') {
              delete filteredUpdates[f]; // already saved — deny overwrite
            }
          }
        }

        if (Object.keys(filteredUpdates).length === 0) continue;

        // Parse date fields
        const dateFields = ['plannedStart', 'plannedCompletion', 'actualStart', 'actualCompletion'];
        for (const f of dateFields) {
          if (filteredUpdates[f] !== undefined) {
            filteredUpdates[f] = filteredUpdates[f] ? new Date(filteredUpdates[f]) : null;
          }
        }

        if (filteredUpdates.actualCompletion) {
          const today = new Date();
          today.setHours(23, 59, 59, 999);
          if (filteredUpdates.actualCompletion > today) {
            throw new Error('Actual completion date cannot be set in the future');
          }
        }

        // Audit Logs
        const auditLogData = [];
        for (const [field, newVal] of Object.entries(filteredUpdates)) {
          let oldValStr = apt[field] === null ? '' : String(apt[field]);
          if (apt[field] instanceof Date) oldValStr = apt[field].toISOString();

          let newValStr = newVal === null ? '' : String(newVal);
          if (newVal instanceof Date) newValStr = newVal.toISOString();

          if (oldValStr !== newValStr) {
            auditLogData.push({
              apartmentId: apt.id,
              userId: req.user.id,
              fieldName: field,
              oldValue: oldValStr,
              newValue: newValStr
            });
          }
        }

        if (auditLogData.length > 0) {
          await tx.auditLog.createMany({
            data: auditLogData
          });
        }

        const mergedApt = { ...apt, ...filteredUpdates };
        const recalculated = recalculateApartment(mergedApt, building);

        // Sanitize relation, primary/foreign keys and auto-managed fields from data
        const { id, buildingId: bId, createdAt, updatedAt, building: buildingRelation, auditLogs, ...updateData } = recalculated;

        const updated = await tx.apartment.update({
          where: { id: apt.id },
          data: updateData
        });

        updatedList.push(updated);
      }

      return updatedList;
    });

    return res.json({ success: true, updatedCount: results.length });
  } catch (err) {
    console.error('Batch update error:', err);
    return res.status(500).json({ error: 'Internal server error in batch update' });
  }
}

export async function getAuditLogs(req, res) {
  const { apartmentId } = req.params;
  try {
    const logs = await prisma.auditLog.findMany({
      where: { apartmentId },
      include: {
        user: {
          select: {
            name: true,
            role: true
          }
        }
      },
      orderBy: { changedAt: 'desc' }
    });
    return res.json(logs);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error fetching logs' });
  }
}
