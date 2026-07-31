/**
 * Service to calculate Contractor Bill and Client RA Bill values.
 */

export function calculateContractorBillLine(line, apartments, setup) {
  const unitType = line.unitType;
  if (!unitType) return line;

  const product = unitType.product; // Kitchen, Wardrobe, Vanity
  const typeCode = unitType.typeCode;

  // 1. Calculate Allocated Units
  // sum of the relevant Qty column across apartments in this Order for this contractor and type
  let allocatedUnits = 0;
  for (const apt of apartments) {
    if (apt.contractorName && apt.contractorName.trim().toLowerCase() === line.contractorName.trim().toLowerCase()) {
      if (product === "Kitchen") {
        const typeStr = apt.kitchenType;
        if (typeStr && typeStr.startsWith('[')) {
          try {
            const list = JSON.parse(typeStr);
            const found = list.find(item => item.type === typeCode);
            if (found) allocatedUnits += found.qty || 0;
          } catch (e) {}
        } else if (apt.kitchenType === typeCode) {
          allocatedUnits += apt.kitchenQty || 0;
        }
      } else if (product === "Wardrobe") {
        const typeStr = apt.wardrobeType;
        if (typeStr && typeStr.startsWith('[')) {
          try {
            const list = JSON.parse(typeStr);
            const found = list.find(item => item.type === typeCode);
            if (found) allocatedUnits += found.qty || 0;
          } catch (e) {}
        } else if (apt.wardrobeType === typeCode) {
          allocatedUnits += apt.wardrobeQty || 0;
        }
      } else if (product === "Vanity") {
        const typeStr = apt.vanityType;
        if (typeStr && typeStr.startsWith('[')) {
          try {
            const list = JSON.parse(typeStr);
            const found = list.find(item => item.type === typeCode);
            if (found) allocatedUnits += found.qty || 0;
          } catch (e) {}
        } else if (apt.vanityType === typeCode) {
          allocatedUnits += apt.vanityQty || 0;
        }
      } else if (product === "Door") {
        const typeStr = apt.doorType;
        if (typeStr && typeStr.startsWith('[')) {
          try {
            const list = JSON.parse(typeStr);
            const found = list.find(item => item.type === typeCode);
            if (found) allocatedUnits += found.qty || 0;
          } catch (e) {}
        } else if (apt.doorType === typeCode) {
          allocatedUnits += apt.doorQty || 0;
        }
      }
    }
  }

  const rate = unitType.contractorRate || 0.0;
  const woValue = rate * allocatedUnits;
  
  const eligibleUnits = line.eligibleUnitEquivalent || 0.0;
  const eligibilityPct = allocatedUnits > 0 ? (eligibleUnits / allocatedUnits) : 0.0;
  const cumulativeEligible = rate * eligibleUnits;
  
  const prevCertified = line.previousCertified || 0.0;
  const currentGross = Math.max(0, cumulativeEligible - prevCertified);

  const retentionPct = setup.contractorRetentionPct || 5.0;
  const gstPct = setup.contractorGSTPct || 18.0;
  const tdsPct = setup.contractorTDSPct || 1.0;

  const retentionAmt = currentGross * (retentionPct / 100.0);
  const gstAmt = currentGross * (gstPct / 100.0);
  const tdsAmt = currentGross * (tdsPct / 100.0);
  const otherDeduction = line.otherDeduction || 0.0;

  const netPayable = Math.max(0, currentGross - retentionAmt + gstAmt - tdsAmt - otherDeduction);

  return {
    ...line,
    rateUnit: rate,
    allocatedUnits,
    woValue: Math.round(woValue * 100) / 100,
    eligibilityPct: Math.round(eligibilityPct * 1000) / 1000,
    cumulativeEligible: Math.round(cumulativeEligible * 100) / 100,
    currentGross: Math.round(currentGross * 100) / 100,
    retentionAmt: Math.round(retentionAmt * 100) / 100,
    gstAmt: Math.round(gstAmt * 100) / 100,
    tdsAmt: Math.round(tdsAmt * 100) / 100,
    netPayable: Math.round(netPayable * 100) / 100
  };
}

export function calculateClientRABillLine(line, apartments, setup, towerRatesOverride = []) {
  const unitType = line.unitType;
  if (!unitType) return line;

  const product = unitType.product; // Kitchen, Wardrobe, Vanity
  const typeCode = unitType.typeCode;
  const buildingId = line.buildingId;

  // 1. Filter apartments in this building (tower) and match unitType
  const aptWithQtys = [];
  for (const apt of apartments) {
    if (apt.buildingId !== buildingId) continue;
    if (product === "Kitchen") {
      const typeStr = apt.kitchenType;
      if (typeStr && typeStr.startsWith('[')) {
        try {
          const list = JSON.parse(typeStr);
          const found = list.find(item => item.type === typeCode);
          if (found && found.qty > 0) {
            aptWithQtys.push({ apt, qty: found.qty });
          }
        } catch (e) {}
      } else if (apt.kitchenType === typeCode && (apt.kitchenQty || 0) > 0) {
        aptWithQtys.push({ apt, qty: apt.kitchenQty || 0 });
      }
    } else if (product === "Wardrobe") {
      const typeStr = apt.wardrobeType;
      if (typeStr && typeStr.startsWith('[')) {
        try {
          const list = JSON.parse(typeStr);
          const found = list.find(item => item.type === typeCode);
          if (found && found.qty > 0) {
            aptWithQtys.push({ apt, qty: found.qty });
          }
        } catch (e) {}
      } else if (apt.wardrobeType === typeCode && (apt.wardrobeQty || 0) > 0) {
        aptWithQtys.push({ apt, qty: apt.wardrobeQty || 0 });
      }
    } else if (product === "Vanity") {
      const typeStr = apt.vanityType;
      if (typeStr && typeStr.startsWith('[')) {
        try {
          const list = JSON.parse(typeStr);
          const found = list.find(item => item.type === typeCode);
          if (found && found.qty > 0) {
            aptWithQtys.push({ apt, qty: found.qty });
          }
        } catch (e) {}
      } else if (apt.vanityType === typeCode && (apt.vanityQty || 0) > 0) {
        aptWithQtys.push({ apt, qty: apt.vanityQty || 0 });
      }
    } else if (product === "Door") {
      const typeStr = apt.doorType;
      if (typeStr && typeStr.startsWith('[')) {
        try {
          const list = JSON.parse(typeStr);
          const found = list.find(item => item.type === typeCode);
          if (found && found.qty > 0) {
            aptWithQtys.push({ apt, qty: found.qty });
          }
        } catch (e) {}
      } else if (apt.doorType === typeCode && (apt.doorQty || 0) > 0) {
        aptWithQtys.push({ apt, qty: apt.doorQty || 0 });
      }
    }
  }

  const unitsCount = aptWithQtys.reduce((sum, item) => sum + item.qty, 0);

  // 2. Client Rate / Unit: check tower override, else default clientRate
  const override = towerRatesOverride.find(o => o.buildingId === buildingId);
  let rate = unitType.clientRate || 0.0;
  if (override) {
    if (product === "Kitchen" && override.kitchenRate > 0) rate = override.kitchenRate;
    else if (product === "Wardrobe" && override.wardrobeRate > 0) rate = override.wardrobeRate;
    else if (product === "Vanity" && override.vanityRate > 0) rate = override.vanityRate;
    else if (product === "Door" && override.doorRate > 0) rate = override.doorRate;
  }

  const contractValue = unitsCount * rate;

  // 3. Client RA Milestones setup
  const milestones = setup.clientRAMilestones || [];
  const materialMilestones = milestones.filter(m => m.product === product && m.recognitionType === "MATERIAL");
  const executionMilestones = milestones.filter(m => m.product === product && m.recognitionType === "EXECUTION");
  const handoverMilestones = milestones.filter(m => m.product === product && m.recognitionType === "HANDOVER");

  let sumMaterialPct = 0.0;
  let sumExecutionPct = 0.0;
  let sumHandoverPct = 0.0;

  if (aptWithQtys.length > 0) {
    for (const { apt, qty } of aptWithQtys) {
      // Material
      let aptMatPct = 0.0;
      for (const m of materialMilestones) {
        const val = apt[m.fieldKey] || 0;
        const normalizedVal = Math.min(1.0, val / 100.0);
        aptMatPct += (normalizedVal * m.percentage) / 100.0;
      }
      sumMaterialPct += aptMatPct * qty;

      // Execution
      let aptExecPct = 0.0;
      for (const m of executionMilestones) {
        const val = apt[m.fieldKey] || 0;
        const normalizedVal = Math.min(1.0, val / 100.0);
        aptExecPct += (normalizedVal * m.percentage) / 100.0;
      }
      sumExecutionPct += aptExecPct * qty;

      // Handover
      let aptHandoverPct = 0.0;
      for (const m of handoverMilestones) {
        const qcGate = product === "Kitchen" ? apt.kitchenQCGate : (product === "Wardrobe" ? apt.wardrobeQCGate : (product === "Vanity" ? apt.vanityQCGate : apt.doorQCGate));
        const handedOver = product === "Kitchen" ? (apt.kitchenHandedOver || 0) : (product === "Wardrobe" ? (apt.wardrobeHandedOver || 0) : (product === "Vanity" ? (apt.vanityHandedOver || 0) : (apt.doorHandedOver || 0)));
        const normalizedVal = Math.min(1.0, handedOver / 100.0);
        if (qcGate === "Approved" && normalizedVal > 0) {
          aptHandoverPct += (normalizedVal * m.percentage) / 100.0;
        }
      }
      sumHandoverPct += aptHandoverPct * qty;
    }

    sumMaterialPct = sumMaterialPct / unitsCount;
    sumExecutionPct = sumExecutionPct / unitsCount;
    sumHandoverPct = sumHandoverPct / unitsCount;
  }

  const materialEligibleAmt = contractValue * sumMaterialPct;
  const executionEligibleAmt = contractValue * sumExecutionPct;
  const handoverEligibleAmt = contractValue * sumHandoverPct;
  const cumulativeEligible = materialEligibleAmt + executionEligibleAmt + handoverEligibleAmt;

  const overallEligPct = contractValue > 0 ? (cumulativeEligible / contractValue) : 0.0;

  const include = line.includeInCurrentRA ?? true;
  const prevCertified = line.previousCertified || 0.0;
  const currentGross = include ? Math.max(0, cumulativeEligible - prevCertified) : 0.0;

  const retentionPct = setup.clientRetentionPct || 5.0;
  const gstPct = setup.clientGSTPct || 18.0;

  const retentionAmt = currentGross * (retentionPct / 100.0);
  const gstAmt = currentGross * (gstPct / 100.0);
  const otherDeduction = line.otherDeduction || 0.0;

  const netRA = Math.max(0, currentGross - retentionAmt + gstAmt - otherDeduction);

  return {
    ...line,
    unitsCount,
    rateUnit: rate,
    contractValue: Math.round(contractValue * 100) / 100,
    materialEligibilityPct: Math.round(sumMaterialPct * 1000) / 1000,
    materialEligibleAmt: Math.round(materialEligibleAmt * 100) / 100,
    executionEligibilityPct: Math.round(sumExecutionPct * 1000) / 1000,
    executionEligibleAmt: Math.round(executionEligibleAmt * 100) / 100,
    handoverEligibilityPct: Math.round(sumHandoverPct * 1000) / 1000,
    handoverEligibleAmt: Math.round(handoverEligibleAmt * 100) / 100,
    cumulativeEligible: Math.round(cumulativeEligible * 100) / 100,
    overallEligPct: Math.round(overallEligPct * 1000) / 1000,
    currentGross: Math.round(currentGross * 100) / 100,
    retentionAmt: Math.round(retentionAmt * 100) / 100,
    gstAmt: Math.round(gstAmt * 100) / 100,
    netRA: Math.round(netRA * 100) / 100
  };
}
