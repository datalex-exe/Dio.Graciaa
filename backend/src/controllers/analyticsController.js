import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Reusable Stage Analysis checklist structures
const materialItems = [
  { label: "Kitchen Lower Carcass Inward", key: "kitchenLowerCarcassInward", product: "kitchen", qtyKey: "kitchenQty" },
  { label: "Kitchen Upper Carcass Inward", key: "kitchenUpperCarcassInward", product: "kitchen", qtyKey: "kitchenQty" },
  { label: "Kitchen Stone Inward", key: "kitchenStoneInward", product: "kitchen", qtyKey: "kitchenQty" },
  { label: "Kitchen Shutter Inward", key: "kitchenShutterInward", product: "kitchen", qtyKey: "kitchenQty" },
  { label: "Kitchen Hardware Inward", key: "kitchenHardwareInward", product: "kitchen", qtyKey: "kitchenQty" },
  { label: "Kitchen Appliance Inward", key: "kitchenApplianceInward", product: "kitchen", qtyKey: "kitchenQty" },
  { label: "Wardrobe Cabinet Inward", key: "wardrobeCabinetInward", product: "wardrobe", qtyKey: "wardrobeQty" },
  { label: "Wardrobe Shutter Hardware Inward", key: "wardrobeShutterHardwareInward", product: "wardrobe", qtyKey: "wardrobeQty" },
  { label: "Vanity Cabinet Inward", key: "vanityCabinetInward", product: "vanity", qtyKey: "vanityQty" },
  { label: "Vanity Shutter Hardware Inward", key: "vanityShutterHardwareInward", product: "vanity", qtyKey: "vanityQty" },
  { label: "Door & Har Inward", key: "doorFrameHardwareInward", product: "door", qtyKey: "doorQty" }
];

const executionItems = [
  { label: "Kitchen Lower Carcass Installed", key: "kitchenLowerCarcassInstalled", product: "kitchen", qtyKey: "kitchenQty" },
  { label: "Kitchen Upper Carcass Installed", key: "kitchenUpperCarcassInstalled", product: "kitchen", qtyKey: "kitchenQty" },
  { label: "Kitchen Stone Installed", key: "kitchenStoneInstalled", product: "kitchen", qtyKey: "kitchenQty" },
  { label: "Kitchen Shutter Hardware Installed", key: "kitchenShutterHardwareInstalled", product: "kitchen", qtyKey: "kitchenQty" },
  { label: "Kitchen Appliance Installed", key: "kitchenApplianceInstalled", product: "kitchen", qtyKey: "kitchenQty" },
  { label: "Kitchen Handed Over", key: "kitchenHandedOver", product: "kitchen", qtyKey: "kitchenQty" },
  { label: "Wardrobe Cabinet Installed", key: "wardrobeCabinetInstalled", product: "wardrobe", qtyKey: "wardrobeQty" },
  { label: "Wardrobe Shutter Hardware Installed", key: "wardrobeShutterHardwareInstalled", product: "wardrobe", qtyKey: "wardrobeQty" },
  { label: "Wardrobe Handed Over", key: "wardrobeHandedOver", product: "wardrobe", qtyKey: "wardrobeQty" },
  { label: "Vanity Cabinet Installed", key: "vanityCabinetInstalled", product: "vanity", qtyKey: "vanityQty" },
  { label: "Vanity Shutter Hardware Installed", key: "vanityShutterHardwareInstalled", product: "vanity", qtyKey: "vanityQty" },
  { label: "Vanity Handed Over", key: "vanityHandedOver", product: "vanity", qtyKey: "vanityQty" },
  { label: "Door & Har Installed", key: "doorFrameHardwareInstalled", product: "door", qtyKey: "doorQty" },
  { label: "Door Handed Over", key: "doorHandedOver", product: "door", qtyKey: "doorQty" }
];

export async function getProjectAnalytics(req, res) {
  const { orderId } = req.params;

  try {
    // 1. Fetch Order details along with Billing Setup & Towers
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        billingSetup: {
          include: {
            unitTypeRates: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order project not found' });
    }

    // 2. Fetch all Buildings for this order, with their apartments
    const buildings = await prisma.building.findMany({
      where: { orderId },
      include: {
        apartments: true
      },
      orderBy: { name: 'asc' }
    });

    // Extract all apartments across the entire order
    const allApartments = buildings.flatMap(b => b.apartments);

    // ==========================================
    // A) Tower Summary Rollup
    // ==========================================
    const towerSummary = [];

    // Site Total variables
    let siteApartments = allApartments.length;
    let siteKitchenUnits = 0;
    let siteWardrobeUnits = 0;
    let siteVanityUnits = 0;
    let siteDoorUnits = 0;

    let siteSumMatInward = 0.0;
    let siteSumKitchenComp = 0.0;
    let siteSumWardrobeComp = 0.0;
    let siteSumVanityComp = 0.0;
    let siteSumDoorComp = 0.0;
    let siteSumOverallComp = 0.0;

    let siteNotStarted = 0;
    let siteMatInwardReady = 0;
    let siteExecutionInProgress = 0;
    let siteReadyForHandover = 0;
    let siteCompleted = 0;

    let siteDelayed = 0;
    let siteCritical = 0;
    let siteQCPending = 0;
    let siteQCRejected = 0;

    let siteTotalQty = 0;
    let siteKitchenQty = 0;
    let siteWardrobeQty = 0;
    let siteVanityQty = 0;
    let siteDoorQty = 0;

    // Loop per tower
    for (const b of buildings) {
      const apartmentsCount = b.apartments.length;
      let kitchenUnits = 0;
      let wardrobeUnits = 0;
      let vanityUnits = 0;
      let doorUnits = 0;

      let sumMatInward = 0.0;
      let sumKitchenComp = 0.0;
      let sumWardrobeComp = 0.0;
      let sumVanityComp = 0.0;
      let sumDoorComp = 0.0;
      let sumOverallComp = 0.0;

      let notStartedCount = 0;
      let matInwardReadyCount = 0;
      let executionInProgressCount = 0;
      let readyForHandoverCount = 0;
      let completedCount = 0;

      let delayedCount = 0;
      let criticalCount = 0;
      let qcPendingCount = 0;
      let qcRejectedCount = 0;

      let totalQty = 0;
      let kitchenQty = 0;
      let wardrobeQty = 0;
      let vanityQty = 0;
      let doorQty = 0;

      for (const apt of b.apartments) {
        const kQty = apt.kitchenQty || 0;
        const wQty = apt.wardrobeQty || 0;
        const vQty = apt.vanityQty || 0;
        const dQty = apt.doorQty || 0;
        const tQty = kQty + wQty + vQty + dQty;

        kitchenUnits += kQty;
        wardrobeUnits += wQty;
        vanityUnits += vQty;
        doorUnits += dQty;

        totalQty += tQty;
        kitchenQty += kQty;
        wardrobeQty += wQty;
        vanityQty += vQty;
        doorQty += dQty;

        // Cumulative weighted progress sums
        sumMatInward += (apt.materialInwardPct || 0.0) * tQty;
        sumKitchenComp += (apt.kitchenCompletionPct || 0.0) * kQty;
        sumWardrobeComp += (apt.wardrobeCompletionPct || 0.0) * wQty;
        sumVanityComp += (apt.vanityCompletionPct || 0.0) * vQty;
        sumDoorComp += (apt.doorCompletionPct || 0.0) * dQty;
        sumOverallComp += (apt.overallCompletionPct || 0.0) * tQty;

        // Status groupings
        if (apt.apartmentStatus === "Not Started") {
          notStartedCount++;
        } else if (apt.apartmentStatus === "Material Inward" || apt.apartmentStatus === "Material Ready") {
          matInwardReadyCount++;
        } else if (apt.apartmentStatus === "Execution In Progress") {
          executionInProgressCount++;
        } else if (apt.apartmentStatus === "Ready for Handover") {
          readyForHandoverCount++;
        } else if (apt.apartmentStatus === "Completed") {
          completedCount++;
        }

        // Health indicators
        if (apt.health === "Delayed") delayedCount++;
        if (apt.health === "Critical") criticalCount++;

        // QC Gate checkpoints
        if (apt.handoverApprovalStatus === "QC Pending") qcPendingCount++;
        if (apt.handoverApprovalStatus === "QC Rejected") qcRejectedCount++;
      }

      // Add to site totals
      siteKitchenUnits += kitchenUnits;
      siteWardrobeUnits += wardrobeUnits;
      siteVanityUnits += vanityUnits;
      siteDoorUnits += doorUnits;

      siteSumMatInward += sumMatInward;
      siteSumKitchenComp += sumKitchenComp;
      siteSumWardrobeComp += sumWardrobeComp;
      siteSumVanityComp += sumVanityComp;
      siteSumDoorComp += sumDoorComp;
      siteSumOverallComp += sumOverallComp;

      siteNotStarted += notStartedCount;
      siteMatInwardReady += matInwardReadyCount;
      siteExecutionInProgress += executionInProgressCount;
      siteReadyForHandover += readyForHandoverCount;
      siteCompleted += completedCount;

      siteDelayed += delayedCount;
      siteCritical += criticalCount;
      siteQCPending += qcPendingCount;
      siteQCRejected += qcRejectedCount;

      siteTotalQty += totalQty;
      siteKitchenQty += kitchenQty;
      siteWardrobeQty += wardrobeQty;
      siteVanityQty += vanityQty;
      siteDoorQty += doorQty;

      // Calculate tower-level weighted averages
      const materialInwardPct = totalQty > 0 ? (sumMatInward / totalQty) : 0.0;
      const kitchenCompletionPct = kitchenQty > 0 ? (sumKitchenComp / kitchenQty) : 0.0;
      const wardrobeCompletionPct = wardrobeQty > 0 ? (sumWardrobeComp / wardrobeQty) : 0.0;
      const vanityCompletionPct = vanityQty > 0 ? (sumVanityComp / vanityQty) : 0.0;
      const doorCompletionPct = doorQty > 0 ? (sumDoorComp / doorQty) : 0.0;
      const overallCompletionPct = totalQty > 0 ? (sumOverallComp / totalQty) : 0.0;

      // Evaluate Health
      let health = "Watch";
      if (apartmentsCount === 0) {
        health = "No Data";
      } else {
        const hasCriticalApt = b.apartments.some(apt =>
          apt.handoverApprovalStatus === "QC Rejected" || apt.health === "Critical"
        );
        if (hasCriticalApt) {
          health = "Critical";
        } else if (delayedCount > 10) {
          health = "Delayed";
        } else if (overallCompletionPct >= (b.excellentThreshold ?? 0.9)) {
          health = "Excellent";
        } else if (overallCompletionPct >= (b.goodThreshold ?? 0.75)) {
          health = "Good";
        } else {
          health = "Watch";
        }
      }

      towerSummary.push({
        id: b.id,
        tower: b.name,
        apartments: apartmentsCount,
        kitchenUnits,
        wardrobeUnits,
        vanityUnits,
        doorUnits,
        materialInwardPct,
        kitchenCompletionPct,
        wardrobeCompletionPct,
        vanityCompletionPct,
        doorCompletionPct,
        overallCompletionPct,
        notStarted: notStartedCount,
        materialInwardReady: matInwardReadyCount,
        executionInProgress: executionInProgressCount,
        readyForHandover: readyForHandoverCount,
        completed: completedCount,
        delayedApartments: delayedCount,
        criticalApartments: criticalCount,
        health,
        qcPending: qcPendingCount,
        qcRejected: qcRejectedCount
      });
    }

    // Site Level overall averages
    const siteMaterialInwardPct = siteTotalQty > 0 ? (siteSumMatInward / siteTotalQty) : 0.0;
    const siteKitchenCompletionPct = siteKitchenQty > 0 ? (siteSumKitchenComp / siteKitchenQty) : 0.0;
    const siteWardrobeCompletionPct = siteWardrobeQty > 0 ? (siteSumWardrobeComp / siteWardrobeQty) : 0.0;
    const siteVanityCompletionPct = siteVanityQty > 0 ? (siteSumVanityComp / siteVanityQty) : 0.0;
    const siteDoorCompletionPct = siteDoorQty > 0 ? (siteSumDoorComp / siteDoorQty) : 0.0;
    const siteOverallCompletionPct = siteTotalQty > 0 ? (siteSumOverallComp / siteTotalQty) : 0.0;

    let siteHealth = "Watch";
    if (siteApartments === 0) {
      siteHealth = "No Data";
    } else {
      const hasCriticalApt = allApartments.some(apt =>
        apt.handoverApprovalStatus === "QC Rejected" || apt.health === "Critical"
      );
      if (hasCriticalApt) {
        siteHealth = "Critical";
      } else if (siteDelayed > 25) { // Site level threshold is > 25
        siteHealth = "Delayed";
      } else if (siteOverallCompletionPct >= 0.9) {
        siteHealth = "Excellent";
      } else if (siteOverallCompletionPct >= 0.75) {
        siteHealth = "Good";
      } else {
        siteHealth = "Watch";
      }
    }

    // Append TOTAL/SITE row
    towerSummary.push({
      id: "site-total",
      tower: "TOTAL / SITE",
      apartments: siteApartments,
      kitchenUnits: siteKitchenUnits,
      wardrobeUnits: siteWardrobeUnits,
      vanityUnits: siteVanityUnits,
      doorUnits: siteDoorUnits,
      materialInwardPct: siteMaterialInwardPct,
      kitchenCompletionPct: siteKitchenCompletionPct,
      wardrobeCompletionPct: siteWardrobeCompletionPct,
      vanityCompletionPct: siteVanityCompletionPct,
      doorCompletionPct: siteDoorCompletionPct,
      overallCompletionPct: siteOverallCompletionPct,
      notStarted: siteNotStarted,
      materialInwardReady: siteMatInwardReady,
      executionInProgress: siteExecutionInProgress,
      readyForHandover: siteReadyForHandover,
      completed: siteCompleted,
      delayedApartments: siteDelayed,
      criticalApartments: siteCritical,
      health: siteHealth,
      qcPending: siteQCPending,
      qcRejected: siteQCRejected
    });

    // ==========================================
    // B) Type Summary Rollup
    // ==========================================
    const typeSummary = [];
    const unitTypeRates = order.billingSetup?.unitTypeRates || [];

    for (const ut of unitTypeRates) {
      const typeCode = ut.typeCode;
      const product = ut.product; // "Kitchen" | "Wardrobe" | "Vanity"
      const typeName = ut.typeName;
      const clientRate = ut.clientRate || 0.0;

      // Filter apartments matching the type code
      let matchingApts = [];
      let qtyField = "kitchenQty";
      let typeField = "kitchenType";
      let completionField = "kitchenCompletionPct";
      let qcGateField = "kitchenQCGate";
      let handedOverField = "kitchenHandedOver";

      if (product === "Kitchen") {
        qtyField = "kitchenQty";
        typeField = "kitchenType";
        completionField = "kitchenCompletionPct";
        qcGateField = "kitchenQCGate";
        handedOverField = "kitchenHandedOver";
      } else if (product === "Wardrobe") {
        qtyField = "wardrobeQty";
        typeField = "wardrobeType";
        completionField = "wardrobeCompletionPct";
        qcGateField = "wardrobeQCGate";
        handedOverField = "wardrobeHandedOver";
      } else if (product === "Vanity") {
        qtyField = "vanityQty";
        typeField = "vanityType";
        completionField = "vanityCompletionPct";
        qcGateField = "vanityQCGate";
        handedOverField = "vanityHandedOver";
      } else if (product === "Door") {
        qtyField = "doorQty";
        typeField = "doorType";
        completionField = "doorCompletionPct";
        qcGateField = "doorQCGate";
        handedOverField = "doorHandedOver";
      }

      let units = 0;
      let sumMatInwardType = 0.0;
      let sumExecType = 0.0;
      let approvedHandedOverCount = 0;

      for (const apt of allApartments) {
        const typeStr = apt[typeField];
        if (!typeStr) continue;

        let qty = 0;
        if (typeStr.startsWith('[')) {
          try {
            const list = JSON.parse(typeStr);
            const found = list.find(item => item.type === typeCode);
            if (found) qty = found.qty || 0;
          } catch (e) { }
        } else {
          if (typeStr === typeCode) {
            qty = apt[qtyField] || 0;
          }
        }

        if (qty > 0) {
          units += qty;

          // Weighted Material and Execution averages
          sumMatInwardType += (apt.materialInwardPct || 0.0) * qty;
          sumExecType += (apt[completionField] || 0.0) * qty;

          // Check if handed over AND approved
          const isApproved = apt[qcGateField] === "Approved";
          if (isApproved) {
            const handoverPct = (apt[handedOverField] || 0) / 100.0;
            approvedHandedOverCount += qty * Math.min(1.0, Math.max(0.0, handoverPct));
          }
        }
      }

      const materialReceivedPct = units > 0 ? (sumMatInwardType / units) : 0.0;
      const executionPct = units > 0 ? (sumExecType / units) : 0.0;
      const qcHandoverPct = units > 0 ? (approvedHandedOverCount / units) : 0.0;
      const clientContractValue = units * clientRate;

      typeSummary.push({
        typeCode,
        product,
        typeName,
        units,
        materialReceivedPct,
        executionPct,
        qcHandoverPct,
        clientContractValue
      });
    }

    // ==========================================
    // C) Stage Analysis Matrix
    // ==========================================
    const stageAnalysis = {
      headers: [...buildings.map(b => b.name), "Site Average"],
      rows: []
    };

    // Process Material items
    for (const item of materialItems) {
      const values = [];
      let totalFieldSum = 0;
      let totalQtySum = 0;

      for (const b of buildings) {
        let fieldSum = 0;
        let qtySum = 0;

        for (const apt of b.apartments) {
          const qty = apt[item.qtyKey] || 0;
          fieldSum += (apt[item.key] || 0) * qty;
          qtySum += qty;
        }

        totalFieldSum += fieldSum;
        totalQtySum += qtySum;

        const val = qtySum > 0 ? (fieldSum / qtySum) / 100.0 : 0.0;
        values.push(val);
      }

      // Append Site Average
      const siteVal = totalQtySum > 0 ? (totalFieldSum / totalQtySum) / 100.0 : 0.0;
      values.push(siteVal);

      stageAnalysis.rows.push({
        category: "Material - " + item.product.toUpperCase(),
        label: item.label,
        key: item.key,
        values
      });
    }

    // Process Execution items
    for (const item of executionItems) {
      const values = [];
      let totalFieldSum = 0;
      let totalQtySum = 0;

      for (const b of buildings) {
        let fieldSum = 0;
        let qtySum = 0;

        for (const apt of b.apartments) {
          const qty = apt[item.qtyKey] || 0;
          fieldSum += (apt[item.key] || 0) * qty;
          qtySum += qty;
        }

        totalFieldSum += fieldSum;
        totalQtySum += qtySum;

        const val = qtySum > 0 ? (fieldSum / qtySum) / 100.0 : 0.0;
        values.push(val);
      }

      // Append Site Average
      const siteVal = totalQtySum > 0 ? (totalFieldSum / totalQtySum) / 100.0 : 0.0;
      values.push(siteVal);

      stageAnalysis.rows.push({
        category: "Execution - " + item.product.toUpperCase(),
        label: item.label,
        key: item.key,
        values
      });
    }

    // ==========================================
    // Metadata Header details (from first tower settings as fallback, or overall order)
    // ==========================================
    const defaultBuilding = buildings[0];
    const headerMetadata = {
      siteName: defaultBuilding?.siteName || "Dio Grace Main Site",
      reportDate: defaultBuilding?.reportDate ? new Date(defaultBuilding.reportDate).toLocaleDateString() : new Date().toLocaleDateString(),
      projectManager: "P. Sharma (Site Manager)",
      client: "Dio Grace Developers Group",
      targetCompletion: defaultBuilding?.reportDate ? new Date(new Date(defaultBuilding.reportDate).getTime() + 180 * 24 * 60 * 60 * 1000).toLocaleDateString() : "TBD", // default 6 months target
      preparedBy: order.createdBy?.name || "System Automated ERP"
    };

    return res.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        createdAt: order.createdAt
      },
      headerMetadata,
      towerSummary,
      typeSummary,
      stageAnalysis
    });

  } catch (err) {
    console.error('Get project analytics error:', err);
    return res.status(500).json({ error: 'Internal server error calculating project analytics' });
  }
}
