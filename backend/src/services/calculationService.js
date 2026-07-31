/**
 * Pure calculation functions for the Apartment fields.
 * Re-implemented on the server-side to guarantee consistency.
 *
 * NOTE: All inward and installation fields now store percentage values
 * (0, 50, 75, 100) instead of raw counts. They are normalized to 0.0–1.0
 * by dividing by 100 in the calculation logic.
 */

// Helper to normalize a percentage field (0/50/75/100) to a 0.0–1.0 fraction
function pct(val) {
  return Math.min(1.0, Math.max(0.0, (val || 0) / 100.0));
}

export function calculateMaterialInwardPct(apt) {
  const E = apt.kitchenQty || 0;
  const F = apt.wardrobeQty || 0;
  const G = apt.vanityQty || 0;
  const H = apt.doorQty || 0;
  const totalQty = E + F + G + H;

  if (totalQty === 0) return 0.0;

  let sumKitchen = 0.0;
  if (E > 0) {
    const fields = [
      apt.kitchenLowerCarcassInward,
      apt.kitchenUpperCarcassInward,
      apt.kitchenStoneInward,
      apt.kitchenShuttersInward || apt.kitchenShutterInward || 0,
      apt.kitchenHardwareInward,
      apt.kitchenAppliancesInward || apt.kitchenApplianceInward || 0
    ];
    sumKitchen = fields.reduce((sum, val) => sum + pct(val), 0) / 6.0;
  }

  let sumWardrobe = 0.0;
  if (F > 0) {
    const fields = [
      apt.wardrobesCabinetsInward || apt.wardrobeCabinetInward || 0,
      apt.wardrobeShutterHardwareInward || 0
    ];
    sumWardrobe = fields.reduce((sum, val) => sum + pct(val), 0) / 2.0;
  }

  let sumVanity = 0.0;
  if (G > 0) {
    const fields = [
      apt.vanityCabinetsInward || apt.vanityCabinetInward || 0,
      apt.vanityShutterHardwareInward || 0
    ];
    sumVanity = fields.reduce((sum, val) => sum + pct(val), 0) / 2.0;
  }

  let sumDoor = 0.0;
  if (H > 0) {
    const fields = [
      apt.doorFrameHardwareInward || 0
    ];
    sumDoor = fields.reduce((sum, val) => sum + pct(val), 0) / 1.0;
  }

  const weightedSum = (sumKitchen * E) + (sumWardrobe * F) + (sumVanity * G) + (sumDoor * H);
  return weightedSum / totalQty;
}

export function calculateQCGate(apt, product) {
  const E = apt.kitchenQty || 0;
  const F = apt.wardrobeQty || 0;
  const G = apt.vanityQty || 0;
  const H = apt.doorQty || 0;

  if (product === "kitchen") {
    if (E === 0) return "N/A";
    // All installation fields must be at 100%
    const installComplete = [
      apt.kitchenLowerCarcassInstalled,
      apt.kitchenUpperCarcassInstalled,
      apt.kitchenStoneInstalled,
      apt.kitchenShuttersHardwareInstalled || apt.kitchenShutterHardwareInstalled || 0,
      apt.kitchenAppliancesInstalled || apt.kitchenApplianceInstalled || 0
    ].every(val => (val || 0) >= 100);

    if (!installComplete) return "Installation Pending";

    const qcFields = [
      apt.kitchenQC_VisibleScrews,
      apt.kitchenQC_Chipping,
      apt.kitchenQC_FillerMissing,
      apt.kitchenQC_Scratches,
      apt.kitchenQC_DrawersFunction,
      apt.kitchenQC_CutleryTray,
      apt.kitchenQC_DishDrainer
    ];

    if (qcFields.some(val => val === "Not OK")) return "Rejected";
    if (qcFields.some(val => val === null || val === undefined || val === "")) return "QC Pending";
    return "Approved";
  }

  if (product === "wardrobe") {
    if (F === 0) return "N/A";
    const installComplete = [
      apt.wardrobesCabinetsInstalled || apt.wardrobeCabinetInstalled || 0,
      apt.wardrobeShutterHardwareInstalled || 0
    ].every(val => (val || 0) >= 100);

    if (!installComplete) return "Installation Pending";

    const qcFields = [
      apt.wardrobeQC_VisibleScrews,
      apt.wardrobeQC_Chipping,
      apt.wardrobeQC_FillerMissing,
      apt.wardrobeQC_Scratches,
      apt.wardrobeQC_DrawersFunction
    ];

    if (qcFields.some(val => val === "Not OK")) return "Rejected";
    if (qcFields.some(val => val === null || val === undefined || val === "")) return "QC Pending";
    return "Approved";
  }

  if (product === "vanity") {
    if (G === 0) return "N/A";
    const installComplete = [
      apt.vanityCabinetsInstalled || apt.vanityCabinetInstalled || 0,
      apt.vanityShutterHardwareInstalled || 0
    ].every(val => (val || 0) >= 100);

    if (!installComplete) return "Installation Pending";

    const qcFields = [
      apt.vanityQC_VisibleScrews,
      apt.vanityQC_Chipping,
      apt.vanityQC_FillerMissing,
      apt.vanityQC_Scratches,
      apt.vanityQC_DrawersFunction
    ];

    if (qcFields.some(val => val === "Not OK")) return "Rejected";
    if (qcFields.some(val => val === null || val === undefined || val === "")) return "QC Pending";
    return "Approved";
  }

  if (product === "door") {
    if (H === 0) return "N/A";
    const installComplete = [
      apt.doorFrameHardwareInstalled || 0
    ].every(val => (val || 0) >= 100);

    if (!installComplete) return "Installation Pending";

    const qcFields = [
      apt.doorQC_Chipping,
      apt.doorQC_Alignment
    ];

    if (qcFields.some(val => val === "Not OK")) return "Rejected";
    if (qcFields.some(val => val === null || val === undefined || val === "")) return "QC Pending";
    return "Approved";
  }

  return "N/A";
}

export function calculateKitchenCompletionPct(apt, kitchenQCGate) {
  const E = apt.kitchenQty || 0;
  if (E === 0) return 0.0;

  const handoverApproved = kitchenQCGate === "Approved";
  const fields = [
    apt.kitchenLowerCarcassInstalled,
    apt.kitchenUpperCarcassInstalled,
    apt.kitchenStoneInstalled,
    apt.kitchenShuttersHardwareInstalled || apt.kitchenShutterHardwareInstalled || 0,
    apt.kitchenAppliancesInstalled || apt.kitchenApplianceInstalled || 0
  ];

  const sumInstall = fields.reduce((sum, val) => sum + pct(val), 0);
  const handoverVal = pct(apt.kitchenHandedOver);
  const handoverContrib = (handoverApproved && handoverVal >= 1.0) ? 1.0 : 0.0;

  return (sumInstall + handoverContrib) / 6.0;
}

export function calculateWardrobeCompletionPct(apt, wardrobeQCGate) {
  const F = apt.wardrobeQty || 0;
  if (F === 0) return 0.0;

  const handoverApproved = wardrobeQCGate === "Approved";
  const fields = [
    apt.wardrobesCabinetsInstalled || apt.wardrobeCabinetInstalled || 0,
    apt.wardrobeShutterHardwareInstalled || 0
  ];

  const sumInstall = fields.reduce((sum, val) => sum + pct(val), 0);
  const handoverVal = pct(apt.wardrobeHandedOver);
  const handoverContrib = (handoverApproved && handoverVal >= 1.0) ? 1.0 : 0.0;

  return (sumInstall + handoverContrib) / 3.0;
}

export function calculateVanityCompletionPct(apt, vanityQCGate) {
  const G = apt.vanityQty || 0;
  if (G === 0) return 0.0;

  const handoverApproved = vanityQCGate === "Approved";
  const fields = [
    apt.vanityCabinetsInstalled || apt.vanityCabinetInstalled || 0,
    apt.vanityShutterHardwareInstalled || 0
  ];

  const sumInstall = fields.reduce((sum, val) => sum + pct(val), 0);
  const handoverVal = pct(apt.vanityHandedOver);
  const handoverContrib = (handoverApproved && handoverVal >= 1.0) ? 1.0 : 0.0;

  return (sumInstall + handoverContrib) / 3.0;
}

export function calculateDoorCompletionPct(apt, doorQCGate) {
  const H = apt.doorQty || 0;
  if (H === 0) return 0.0;

  const handoverApproved = doorQCGate === "Approved";
  const fields = [
    apt.doorFrameHardwareInstalled || 0
  ];

  const sumInstall = fields.reduce((sum, val) => sum + pct(val), 0);
  const handoverVal = pct(apt.doorHandedOver);
  const handoverContrib = (handoverApproved && handoverVal >= 1.0) ? 1.0 : 0.0;

  return (sumInstall + handoverContrib) / 2.0;
}

export function calculateOverallCompletionPct(apt, materialWeight, executionWeight, matPct, kitPct, wardPct, vanPct, doorPct) {
  const E = apt.kitchenQty || 0;
  const F = apt.wardrobeQty || 0;
  const G = apt.vanityQty || 0;
  const H = apt.doorQty || 0;
  const totalQty = E + F + G + H;

  if (totalQty === 0) return 0.0;

  const weightedInstallPct = ((kitPct * E) + (wardPct * F) + (vanPct * G) + (doorPct * H)) / totalQty;
  return (matPct * materialWeight) + (weightedInstallPct * executionWeight);
}

export function calculateHandoverApprovalStatus(kitGate, wardGate, vanGate, doorGate, E, F, G, H) {
  const activeGates = [];
  if (E > 0) activeGates.push(kitGate);
  if (F > 0) activeGates.push(wardGate);
  if (G > 0) activeGates.push(vanGate);
  if (H > 0) activeGates.push(doorGate);

  if (activeGates.length === 0) return "Not Approved";

  if (activeGates.some(g => g === "Rejected")) return "QC Rejected";
  if (activeGates.some(g => g === "QC Pending")) return "QC Pending";
  if (activeGates.some(g => g === "Installation Pending")) return "Installation Pending";
  if (activeGates.every(g => g === "Approved")) return "Approved";

  return "Installation Pending";
}

export function calculateApartmentStatus(apt, handoverStatus, matPct) {
  if (handoverStatus === "QC Rejected") return "QC Rejected";
  if (handoverStatus === "QC Pending") return "QC Pending";

  const E = apt.kitchenQty || 0;
  const F = apt.wardrobeQty || 0;
  const G = apt.vanityQty || 0;
  const H = apt.doorQty || 0;

  if (handoverStatus === "Approved") {
    // check if all handed over (100%)
    const kitchenHanded = E > 0 ? ((apt.kitchenHandedOver || 0) >= 100) : true;
    const wardrobeHanded = F > 0 ? ((apt.wardrobeHandedOver || 0) >= 100) : true;
    const vanityHanded = G > 0 ? ((apt.vanityHandedOver || 0) >= 100) : true;
    const doorHanded = H > 0 ? ((apt.doorHandedOver || 0) >= 100) : true;

    if (kitchenHanded && wardrobeHanded && vanityHanded && doorHanded) {
      return "Completed";
    }
    return "Ready for Handover";
  }

  // Check Stage-2 progress — any installation field > 0 means progress
  const hasStage2Progress = [
    apt.kitchenLowerCarcassInstalled,
    apt.kitchenUpperCarcassInstalled,
    apt.kitchenStoneInstalled,
    apt.kitchenShuttersHardwareInstalled || apt.kitchenShutterHardwareInstalled || 0,
    apt.kitchenAppliancesInstalled || apt.kitchenApplianceInstalled || 0,
    apt.kitchenHandedOver,
    apt.wardrobesCabinetsInstalled || apt.wardrobeCabinetInstalled || 0,
    apt.wardrobeShutterHardwareInstalled || 0,
    apt.wardrobeHandedOver,
    apt.vanityCabinetsInstalled || apt.vanityCabinetInstalled || 0,
    apt.vanityShutterHardwareInstalled || 0,
    apt.vanityHandedOver,
    apt.doorFrameHardwareInstalled,
    apt.doorHandedOver
  ].some(val => (val || 0) > 0);

  if (hasStage2Progress) return "Execution In Progress";
  if (matPct >= 1.0) return "Material Ready";
  if (matPct > 0.0) return "Material Inward";

  return "Not Started";
}

export function calculateDelayDays(plannedComp, actualComp, reportDate) {
  if (!plannedComp) return 0;

  const planned = new Date(plannedComp);
  const comp = actualComp ? new Date(actualComp) : new Date(reportDate);

  const diffTime = comp.getTime() - planned.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

export function calculateHealth(apt, delayDays, overallPct, status, config) {
  if (status === "Completed") {
    if (delayDays > 0) {
      return "Delayed";
    }
    return "Excellent";
  }

  if (delayDays > 0) {
    return "Critical";
  }

  return "Excellent";
}

/**
 * Runs all calculated field logic for an apartment row.
 * Returns the updated fields object.
 */
export function recalculateApartment(apt, buildingConfig) {
  const reportDate = buildingConfig.reportDate || new Date();
  const materialWeight = buildingConfig.materialWeight ?? 0.3;
  const executionWeight = buildingConfig.executionWeight ?? 0.7;

  // 1. Material Inward %
  const matPct = calculateMaterialInwardPct(apt);

  // 2. QC Gates
  const kitGate = calculateQCGate(apt, "kitchen");
  const wardGate = calculateQCGate(apt, "wardrobe");
  const vanGate = calculateQCGate(apt, "vanity");
  const doorGate = calculateQCGate(apt, "door");

  // 3. Product completion %s
  const kitPct = calculateKitchenCompletionPct(apt, kitGate);
  const wardPct = calculateWardrobeCompletionPct(apt, wardGate);
  const vanPct = calculateVanityCompletionPct(apt, vanGate);
  const doorPct = calculateDoorCompletionPct(apt, doorGate);

  // 4. Overall Completion %
  const overallPct = calculateOverallCompletionPct(apt, materialWeight, executionWeight, matPct, kitPct, wardPct, vanPct, doorPct);

  // 5. Handover Approval Status
  const E = apt.kitchenQty || 0;
  const F = apt.wardrobeQty || 0;
  const G = apt.vanityQty || 0;
  const H = apt.doorQty || 0;
  const handoverStatus = calculateHandoverApprovalStatus(kitGate, wardGate, vanGate, doorGate, E, F, G, H);

  // 6. Apartment Status
  const status = calculateApartmentStatus(apt, handoverStatus, matPct);

  // 7. Delay Days
  const delayDays = calculateDelayDays(apt.plannedCompletion, apt.actualCompletion, reportDate);

  // 8. Health
  const health = calculateHealth(apt, delayDays, overallPct, status, buildingConfig);

  return {
    ...apt,
    materialInwardPct: Math.round(matPct * 1000) / 1000,
    kitchenCompletionPct: Math.round(kitPct * 1000) / 1000,
    wardrobeCompletionPct: Math.round(wardPct * 1000) / 1000,
    vanityCompletionPct: Math.round(vanPct * 1000) / 1000,
    doorCompletionPct: Math.round(doorPct * 1000) / 1000,
    overallCompletionPct: Math.round(overallPct * 1000) / 1000,
    kitchenQCGate: kitGate,
    wardrobeQCGate: wardGate,
    vanityQCGate: vanGate,
    doorQCGate: doorGate,
    handoverApprovalStatus: handoverStatus,
    apartmentStatus: status,
    delayDays,
    health
  };
}
