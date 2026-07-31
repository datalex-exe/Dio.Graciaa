import { PrismaClient } from '@prisma/client';
import { calculateContractorBillLine, calculateClientRABillLine } from '../services/billingService.js';

const prisma = new PrismaClient();

// ==========================================
// 1. BILLING SETUP ENDPOINTS
// ==========================================

export async function getBillingSetup(req, res) {
  const { orderId } = req.params;
  try {
    const setup = await prisma.billingSetup.findUnique({
      where: { orderId },
      include: {
        unitTypeRates: true,
        contractorMilestones: true,
        clientRAMilestones: true,
        towerClientRates: {
          include: {
            building: {
              select: { name: true }
            }
          }
        }
      }
    });

    if (!setup) {
      return res.status(404).json({ error: 'Billing setup not found for this order' });
    }

    return res.json(setup);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error getting setup' });
  }
}

export async function updateBillingSetup(req, res) {
  const { orderId } = req.params;
  const {
    contractorRetentionPct,
    contractorGSTPct,
    contractorTDSPct,
    clientRetentionPct,
    clientGSTPct,
    clientOtherDeduction,
    clientMatEligiblePct,
    clientExecEligiblePct,
    clientHandoverEligiblePct,
    billingPeriodFrom,
    billingPeriodTo,
    billDate,
    unitTypeRates,
    contractorMilestones,
    clientRAMilestones,
    towerClientRates
  } = req.body;

  try {
    if (req.user.role !== 'ROLE_A') {
      return res.status(403).json({ error: 'Only Setup role (A) can modify setup' });
    }

    const currentSetup = await prisma.billingSetup.findUnique({
      where: { orderId }
    });

    if (!currentSetup) {
      return res.status(404).json({ error: 'Billing setup not found' });
    }

    // 1. Validate Milestone Percentages
    if (contractorMilestones) {
      // Validate that contractor milestones sum to 100% per product
      const productGroups = {};
      for (const m of contractorMilestones) {
        productGroups[m.product] = (productGroups[m.product] || 0.0) + parseFloat(m.percentage);
      }
      for (const [prod, sum] of Object.entries(productGroups)) {
        if (Math.abs(sum - 100.0) > 0.01) {
          return res.status(400).json({ error: `Contractor Milestones for product ${prod} must sum to 100%. Got ${sum}%` });
        }
      }
    }

    const globalMat = clientMatEligiblePct !== undefined ? parseFloat(clientMatEligiblePct) : (currentSetup.clientMatEligiblePct || 0.0);
    const globalExec = clientExecEligiblePct !== undefined ? parseFloat(clientExecEligiblePct) : (currentSetup.clientExecEligiblePct || 0.0);
    const globalHandover = clientHandoverEligiblePct !== undefined ? parseFloat(clientHandoverEligiblePct) : (currentSetup.clientHandoverEligiblePct || 0.0);

    const globalSum = globalMat + globalExec + globalHandover;
    if (Math.abs(globalSum - 100.0) > 0.01) {
      return res.status(400).json({ error: `Client Eligibility settings (Material + Execution + Handover) must sum to exactly 100%. Got ${globalSum}%` });
    }

    if (clientRAMilestones) {
      const products = ['Kitchen', 'Wardrobe', 'Vanity', 'Door'];
      for (const p of products) {
        const matSum = clientRAMilestones.filter(m => m.product === p && m.recognitionType === 'MATERIAL').reduce((sum, m) => sum + parseFloat(m.percentage || 0), 0.0);
        if (Math.abs(matSum - globalMat) > 0.01) {
          return res.status(400).json({ error: `Client Material milestones for product ${p} must sum to exactly ${globalMat}%. Got ${matSum}%` });
        }

        const execSum = clientRAMilestones.filter(m => m.product === p && m.recognitionType === 'EXECUTION').reduce((sum, m) => sum + parseFloat(m.percentage || 0), 0.0);
        if (Math.abs(execSum - globalExec) > 0.01) {
          return res.status(400).json({ error: `Client Execution milestones for product ${p} must sum to exactly ${globalExec}%. Got ${execSum}%` });
        }

        const handoverSum = clientRAMilestones.filter(m => m.product === p && m.recognitionType === 'HANDOVER').reduce((sum, m) => sum + parseFloat(m.percentage || 0), 0.0);
        if (Math.abs(handoverSum - globalHandover) > 0.01) {
          return res.status(400).json({ error: `Client Handover milestones for product ${p} must sum to exactly ${globalHandover}%. Got ${handoverSum}%` });
        }
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Update basic fields
      const bs = await tx.billingSetup.update({
        where: { orderId },
        data: {
          contractorRetentionPct: contractorRetentionPct !== undefined ? parseFloat(contractorRetentionPct) : undefined,
          contractorGSTPct: contractorGSTPct !== undefined ? parseFloat(contractorGSTPct) : undefined,
          contractorTDSPct: contractorTDSPct !== undefined ? parseFloat(contractorTDSPct) : undefined,
          clientRetentionPct: clientRetentionPct !== undefined ? parseFloat(clientRetentionPct) : undefined,
          clientGSTPct: clientGSTPct !== undefined ? parseFloat(clientGSTPct) : undefined,
          clientOtherDeduction: clientOtherDeduction !== undefined ? parseFloat(clientOtherDeduction) : undefined,
          clientMatEligiblePct: clientMatEligiblePct !== undefined ? parseFloat(clientMatEligiblePct) : undefined,
          clientExecEligiblePct: clientExecEligiblePct !== undefined ? parseFloat(clientExecEligiblePct) : undefined,
          clientHandoverEligiblePct: clientHandoverEligiblePct !== undefined ? parseFloat(clientHandoverEligiblePct) : undefined,
          billingPeriodFrom: billingPeriodFrom ? new Date(billingPeriodFrom) : null,
          billingPeriodTo: billingPeriodTo ? new Date(billingPeriodTo) : null,
          billDate: billDate ? new Date(billDate) : null
        }
      });

      // Update UnitTypeRates
      if (unitTypeRates && Array.isArray(unitTypeRates)) {
        // delete and insert, or update. Let's do simple recreate since it's setup
        await tx.unitTypeRate.deleteMany({ where: { billingSetupId: bs.id } });
        await tx.unitTypeRate.createMany({
          data: unitTypeRates.map(ut => ({
            billingSetupId: bs.id,
            typeCode: ut.typeCode,
            product: ut.product,
            typeName: ut.typeName,
            contractorRate: parseFloat(ut.contractorRate || 0),
            clientRate: parseFloat(ut.clientRate || 0),
            includeInCurrentRA: ut.includeInCurrentRA ?? true
          }))
        });
      }

      // Update ContractorMilestones
      if (contractorMilestones && Array.isArray(contractorMilestones)) {
        await tx.contractorMilestone.deleteMany({ where: { billingSetupId: bs.id } });
        await tx.contractorMilestone.createMany({
          data: contractorMilestones.map(m => ({
            billingSetupId: bs.id,
            product: m.product,
            milestoneName: m.milestoneName,
            percentage: parseFloat(m.percentage || 0)
          }))
        });
      }

      // Update ClientRAMilestones
      if (clientRAMilestones && Array.isArray(clientRAMilestones)) {
        await tx.clientRAMilestone.deleteMany({ where: { billingSetupId: bs.id } });
        await tx.clientRAMilestone.createMany({
          data: clientRAMilestones.map(m => ({
            billingSetupId: bs.id,
            product: m.product,
            recognitionType: m.recognitionType,
            milestoneName: m.milestoneName,
            fieldKey: m.fieldKey,
            percentage: parseFloat(m.percentage || 0)
          }))
        });
      }

      // Update Tower-wise Client Contract Rates
      if (towerClientRates && Array.isArray(towerClientRates)) {
        await tx.towerClientRate.deleteMany({ where: { billingSetupId: bs.id } });
        await tx.towerClientRate.createMany({
          data: towerClientRates.map(tr => ({
            billingSetupId: bs.id,
            buildingId: tr.buildingId,
            kitchenRate: parseFloat(tr.kitchenRate || 0),
            wardrobeRate: parseFloat(tr.wardrobeRate || 0),
            vanityRate: parseFloat(tr.vanityRate || 0),
            doorRate: parseFloat(tr.doorRate || 0)
          }))
        });
      }

      return bs;
    });

    return res.json({ success: true, setup: updated });
  } catch (err) {
    console.error('Update setup error:', err);
    return res.status(500).json({ error: 'Internal server error updating billing setup' });
  }
}

// ==========================================
// 2. CONTRACTOR RUNNING BILL
// ==========================================

export async function getContractorBill(req, res) {
  const { orderId } = req.params;
  try {
    const setup = await prisma.billingSetup.findUnique({
      where: { orderId },
      include: { unitTypeRates: true }
    });

    if (!setup) return res.status(404).json({ error: 'Billing setup not found' });

    // 1. Fetch all apartments in this Order to extract unique Contractors and Unit Types
    const apartments = await prisma.apartment.findMany({
      where: {
        building: { orderId }
      }
    });

    // Extract unique contractors
    const contractors = [...new Set(apartments.map(a => a.contractorName).filter(Boolean))];

    // 2. Fetch existing contractor bill ledger rows from DB
    const savedLines = await prisma.contractorBillLine.findMany({
      where: { orderId },
      include: { unitType: true }
    });

    // 3. For each unique Contractor × Unit Type, construct the ledger row
    const lines = [];
    for (const contractorName of contractors) {
      for (const ut of setup.unitTypeRates) {
        // Find existing saved record in DB, if any
        let savedLine = savedLines.find(l => 
          l.contractorName.toLowerCase() === contractorName.toLowerCase() && 
          l.unitTypeId === ut.id
        );

        if (!savedLine) {
          savedLine = {
            id: `temp_${contractorName}_${ut.id}`,
            orderId,
            contractorName,
            unitTypeId: ut.id,
            unitType: ut,
            eligibleUnitEquivalent: null,
            previousCertified: null,
            otherDeduction: null,
            billNo: '',
            billDate: null,
            remarks: ''
          };
        } else {
          savedLine.unitType = ut; // attach fully loaded unit type rates
        }

        // Calculate auto-fields
        const calculated = calculateContractorBillLine(savedLine, apartments, setup);
        if (calculated.allocatedUnits > 0) {
          lines.push(calculated);
        }
      }
    }

    return res.json({ setup, lines });
  } catch (err) {
    console.error('Get contractor bill error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function upsertContractorBillLines(req, res) {
  const { orderId } = req.params;
  const { lines } = req.body; // array of lines to save

  try {
    if (req.user.role !== 'ROLE_A' && req.user.role !== 'ROLE_B') {
      return res.status(403).json({ error: 'Only Execution role (B) or Admin (A) can enter bill line items' });
    }

    if (!lines || !Array.isArray(lines)) {
      return res.status(400).json({ error: 'Lines array is required' });
    }

    const saved = [];
    for (const line of lines) {
      // If it's a temporary client-generated id (starts with temp_), create it
      // Otherwise, update by id.
      const data = {
        orderId,
        contractorName: line.contractorName,
        unitTypeId: line.unitTypeId,
        eligibleUnitEquivalent: parseFloat(line.eligibleUnitEquivalent || 0),
        previousCertified: parseFloat(line.previousCertified || 0),
        otherDeduction: parseFloat(line.otherDeduction || 0),
        billNo: line.billNo || '',
        billDate: line.billDate ? new Date(line.billDate) : null,
        remarks: line.remarks || ''
      };

      if (line.id && !line.id.startsWith('temp_')) {
        const item = await prisma.contractorBillLine.update({
          where: { id: line.id },
          data
        });
        saved.push(item);
      } else {
        // Check if there is an existing line in DB already
        const existing = await prisma.contractorBillLine.findFirst({
          where: {
            orderId,
            contractorName: line.contractorName,
            unitTypeId: line.unitTypeId
          }
        });

        if (existing) {
          const item = await prisma.contractorBillLine.update({
            where: { id: existing.id },
            data
          });
          saved.push(item);
        } else {
          const item = await prisma.contractorBillLine.create({
            data
          });
          saved.push(item);
        }
      }
    }

    return res.json({ success: true, count: saved.length });
  } catch (err) {
    console.error('Upsert contractor lines error:', err);
    return res.status(500).json({ error: 'Internal server error saving contractor bills' });
  }
}

// ==========================================
// 3. CLIENT RA BILL
// ==========================================

export async function getClientRABill(req, res) {
  const { orderId } = req.params;
  try {
    const setup = await prisma.billingSetup.findUnique({
      where: { orderId },
      include: { 
        unitTypeRates: true,
        clientRAMilestones: true
      }
    });

    if (!setup) return res.status(404).json({ error: 'Billing setup not found' });

    // Fetch buildings (Towers) and apartments in this order
    const buildings = await prisma.building.findMany({
      where: { orderId }
    });

    const apartments = await prisma.apartment.findMany({
      where: {
        building: { orderId }
      }
    });

    // Fetch overrides
    const overrides = await prisma.towerClientRate.findMany({
      where: { billingSetupId: setup.id }
    });

    // Fetch saved client RA bill lines
    const savedLines = await prisma.clientRABillLine.findMany({
      where: { orderId },
      include: { unitType: true }
    });

    // Generate pre-seeded lines per Tower × Unit Type
    const lines = [];
    for (const building of buildings) {
      for (const ut of setup.unitTypeRates) {
        let savedLine = savedLines.find(l => 
          l.buildingId === building.id && l.unitTypeId === ut.id
        );

        if (!savedLine) {
          savedLine = {
            id: `temp_${building.id}_${ut.id}`,
            orderId,
            buildingId: building.id,
            buildingName: building.name,
            unitTypeId: ut.id,
            unitType: ut,
            includeInCurrentRA: ut.includeInCurrentRA,
            previousCertified: null,
            otherDeduction: null,
            raBillNo: '',
            raBillDate: null,
            remarks: ''
          };
        } else {
          savedLine.unitType = ut;
          savedLine.buildingName = building.name;
        }

        // Calculate eligibility parameters using building status and milestones
        const calculated = calculateClientRABillLine(savedLine, apartments, setup, overrides);
        // Only include rows where we actually have allocated units of this type in this tower
        if (calculated.unitsCount > 0) {
          lines.push(calculated);
        }
      }
    }

    return res.json({ setup, lines });
  } catch (err) {
    console.error('Get client RA bill error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function upsertClientRABillLines(req, res) {
  const { orderId } = req.params;
  const { lines } = req.body; // array of lines to save

  try {
    if (req.user.role !== 'ROLE_A' && req.user.role !== 'ROLE_B') {
      return res.status(403).json({ error: 'Only Execution role (B) or Admin (A) can enter bill line items' });
    }

    if (!lines || !Array.isArray(lines)) {
      return res.status(400).json({ error: 'Lines array is required' });
    }

    const saved = [];
    for (const line of lines) {
      const data = {
        orderId,
        buildingId: line.buildingId,
        unitTypeId: line.unitTypeId,
        includeInCurrentRA: line.includeInCurrentRA ?? true,
        previousCertified: parseFloat(line.previousCertified || 0),
        otherDeduction: parseFloat(line.otherDeduction || 0),
        raBillNo: line.raBillNo || '',
        raBillDate: line.raBillDate ? new Date(line.raBillDate) : null,
        remarks: line.remarks || ''
      };

      if (line.id && !line.id.startsWith('temp_')) {
        const item = await prisma.clientRABillLine.update({
          where: { id: line.id },
          data
        });
        saved.push(item);
      } else {
        // Unique constraint check
        const existing = await prisma.clientRABillLine.findFirst({
          where: {
            orderId,
            buildingId: line.buildingId,
            unitTypeId: line.unitTypeId
          }
        });

        if (existing) {
          const item = await prisma.clientRABillLine.update({
            where: { id: existing.id },
            data
          });
          saved.push(item);
        } else {
          const item = await prisma.clientRABillLine.create({
            data
          });
          saved.push(item);
        }
      }
    }

    return res.json({ success: true, count: saved.length });
  } catch (err) {
    console.error('Upsert client lines error:', err);
    return res.status(500).json({ error: 'Internal server error saving client RA bills' });
  }
}

// ==========================================
// 4. BILLING DASHBOARD
// ==========================================

export async function getBillingDashboard(req, res) {
  const { orderId } = req.params;
  try {
    const setup = await prisma.billingSetup.findUnique({
      where: { orderId },
      include: { 
        unitTypeRates: true,
        clientRAMilestones: true
      }
    });

    if (!setup) return res.status(404).json({ error: 'Billing setup not found' });

    // Fetch apartments
    const apartments = await prisma.apartment.findMany({
      where: { building: { orderId } }
    });

    // Fetch overrides
    const overrides = await prisma.towerClientRate.findMany({
      where: { billingSetupId: setup.id }
    });

    // 1. Get all calculated Contractor lines
    const savedContractorLines = await prisma.contractorBillLine.findMany({
      where: { orderId },
      include: { unitType: true }
    });
    const contractors = [...new Set(apartments.map(a => a.contractor).filter(Boolean))];
    const contractorBillLines = [];
    for (const cName of contractors) {
      for (const ut of setup.unitTypeRates) {
        let line = savedContractorLines.find(l => 
          l.contractorName.toLowerCase() === cName.toLowerCase() && l.unitTypeId === ut.id
        );
        if (!line) {
          line = {
            contractorName: cName,
            unitTypeId: ut.id,
            unitType: ut,
            eligibleUnitEquivalent: null,
            previousCertified: null,
            otherDeduction: null
          };
        } else {
          line.unitType = ut;
        }
        const calc = calculateContractorBillLine(line, apartments, setup);
        if (calc.allocatedUnits > 0) {
          contractorBillLines.push(calc);
        }
      }
    }

    // 2. Get all calculated Client RA lines
    const buildings = await prisma.building.findMany({ where: { orderId } });
    const savedClientLines = await prisma.clientRABillLine.findMany({
      where: { orderId },
      include: { unitType: true }
    });
    const clientRABillLines = [];
    for (const building of buildings) {
      for (const ut of setup.unitTypeRates) {
        let line = savedClientLines.find(l => 
          l.buildingId === building.id && l.unitTypeId === ut.id
        );
        if (!line) {
          line = {
            buildingId: building.id,
            buildingName: building.name,
            unitTypeId: ut.id,
            unitType: ut,
            includeInCurrentRA: ut.includeInCurrentRA,
            previousCertified: null,
            otherDeduction: null
          };
        } else {
          line.unitType = ut;
          line.buildingName = building.name;
        }
        const calc = calculateClientRABillLine(line, apartments, setup, overrides);
        if (calc.unitsCount > 0) {
          clientRABillLines.push(calc);
        }
      }
    }

    // KPI Rollups
    const contractorWOValue = contractorBillLines.reduce((sum, l) => sum + (l.woValue || 0), 0);
    const contractorCumulativeEligible = contractorBillLines.reduce((sum, l) => sum + (l.cumulativeEligible || 0), 0);
    const contractorNetPayable = contractorBillLines.reduce((sum, l) => sum + (l.netPayable || 0), 0);

    const clientContractValue = clientRABillLines.reduce((sum, l) => sum + (l.contractValue || 0), 0);
    const clientCumulativeEligible = clientRABillLines.reduce((sum, l) => sum + (l.cumulativeEligible || 0), 0);
    const clientCurrentGrossSelectedRA = clientRABillLines
      .filter(l => l.includeInCurrentRA === true)
      .reduce((sum, l) => sum + (l.currentGross || 0), 0); // Current Gross RA

    const billingSurplus = clientCurrentGrossSelectedRA - contractorNetPayable;
    const clientEligibilityPct = clientContractValue > 0 ? (clientCumulativeEligible / clientContractValue) : 0.0;

    // Table 1 — by Unit Type (roll up from Client RA lines across all towers)
    const unitTypeMap = {};
    for (const l of clientRABillLines) {
      const ut = l.unitType;
      if (!unitTypeMap[ut.typeCode]) {
        unitTypeMap[ut.typeCode] = {
          typeCode: ut.typeCode,
          product: ut.product,
          units: 0,
          contractValue: 0.0,
          materialEligibleAmt: 0.0,
          executionEligibleAmt: 0.0,
          handoverEligibleAmt: 0.0
        };
      }
      unitTypeMap[ut.typeCode].units += l.unitsCount || 0;
      unitTypeMap[ut.typeCode].contractValue += l.contractValue || 0.0;
      unitTypeMap[ut.typeCode].materialEligibleAmt += l.materialEligibleAmt || 0.0;
      unitTypeMap[ut.typeCode].executionEligibleAmt += l.executionEligibleAmt || 0.0;
      unitTypeMap[ut.typeCode].handoverEligibleAmt += l.handoverEligibleAmt || 0.0;
    }
    const unitTypeTable = Object.values(unitTypeMap).map(row => ({
      ...row,
      contractValue: Math.round(row.contractValue),
      materialEligibleAmt: Math.round(row.materialEligibleAmt),
      executionEligibleAmt: Math.round(row.executionEligibleAmt),
      handoverEligibleAmt: Math.round(row.handoverEligibleAmt)
    }));

    // Table 2 — by Contractor (pull straight from Contractor lines)
    const contractorTableMap = {};
    for (const l of contractorBillLines) {
      if (l.allocatedUnits === 0) continue; // skip unallocated configurations
      const key = `${l.contractorName}_${l.unitType.typeCode}`;
      contractorTableMap[key] = {
        contractor: l.contractorName,
        unitType: l.unitType.typeCode,
        eligibilityPct: Math.round(l.eligibilityPct * 1000) / 10, // display as %
        netPayable: Math.round(l.netPayable)
      };
    }
    const contractorTable = Object.values(contractorTableMap);

    return res.json({
      summary: {
        contractorWOValue: Math.round(contractorWOValue),
        contractorCumulativeEligible: Math.round(contractorCumulativeEligible),
        contractorNetPayable: Math.round(contractorNetPayable),
        clientContractValue: Math.round(clientContractValue),
        clientCumulativeEligible: Math.round(clientCumulativeEligible),
        clientCurrentGrossSelectedRA: Math.round(clientCurrentGrossSelectedRA),
        billingSurplus: Math.round(billingSurplus),
        clientEligibilityPct: Math.round(clientEligibilityPct * 1000) / 1000
      },
      unitTypeTable,
      contractorTable
    });
  } catch (err) {
    console.error('Get billing dashboard error:', err);
    return res.status(500).json({ error: 'Internal server error calculating billing dashboard' });
  }
}
