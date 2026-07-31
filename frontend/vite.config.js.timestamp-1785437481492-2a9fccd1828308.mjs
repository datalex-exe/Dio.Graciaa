var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// ../backend/src/env.js
import dotenv from "file:///C:/Users/hp/Downloads/Dio%20Grace%20(3)/Dio%20Grace%20(3)/Dio%20Gracee/backend/node_modules/dotenv/lib/main.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
var __vite_injected_original_import_meta_url, __filename, __dirname, rootEnvPath, backendEnvPath;
var init_env = __esm({
  "../backend/src/env.js"() {
    __vite_injected_original_import_meta_url = "file:///C:/Users/hp/Downloads/Dio%20Grace%20(3)/Dio%20Grace%20(3)/Dio%20Gracee/backend/src/env.js";
    __filename = fileURLToPath(__vite_injected_original_import_meta_url);
    __dirname = path.dirname(__filename);
    rootEnvPath = path.resolve(__dirname, "../../.env");
    backendEnvPath = path.resolve(__dirname, "../.env");
    if (fs.existsSync(rootEnvPath)) {
      dotenv.config({ path: rootEnvPath });
    } else if (fs.existsSync(backendEnvPath)) {
      dotenv.config({ path: backendEnvPath });
    } else {
      dotenv.config();
    }
  }
});

// ../backend/src/middleware/auth.js
import jwt from "file:///C:/Users/hp/Downloads/Dio%20Grace%20(3)/Dio%20Grace%20(3)/Dio%20Gracee/backend/node_modules/jsonwebtoken/index.js";
function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
}
var isProd, JWT_SECRET;
var init_auth = __esm({
  "../backend/src/middleware/auth.js"() {
    isProd = process.env.NODE_ENV === "production";
    JWT_SECRET = process.env.JWT_SECRET || (isProd ? null : "dio_grace_secret_key_change_me_later");
    console.log("JWT_SECRET in auth.js:", JWT_SECRET);
    if (isProd && (!JWT_SECRET || JWT_SECRET === "dio_grace_secret_key_change_me_later")) {
      throw new Error("FATAL: JWT_SECRET environment variable is missing or set to the default fallback key in production!");
    }
  }
});

// ../backend/src/middleware/roleGuard.js
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ error: "Unauthorized: User role not found" });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: This action requires one of the following roles: [${allowedRoles.join(", ")}]`
      });
    }
    next();
  };
}
var init_roleGuard = __esm({
  "../backend/src/middleware/roleGuard.js"() {
  }
});

// ../backend/src/middleware/projectGuard.js
import { PrismaClient } from "file:///C:/Users/hp/Downloads/Dio%20Grace%20(3)/Dio%20Grace%20(3)/Dio%20Gracee/backend/node_modules/@prisma/client/default.js";
async function checkProjectAccess(req, res, next) {
  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: req.user.id }
    });
    if (!dbUser) {
      return res.status(401).json({ error: "User not found" });
    }
    if (dbUser.role === "ROLE_A" || dbUser.role === "ROLE_B" || dbUser.role === "ROLE_C") {
      return next();
    }
    let orderNumber = null;
    if (req.params.orderId) {
      const order = await prisma.order.findUnique({
        where: { id: req.params.orderId },
        select: { orderNumber: true }
      });
      if (order) {
        orderNumber = order.orderNumber;
      }
    } else if (req.params.buildingId) {
      const building = await prisma.building.findUnique({
        where: { id: req.params.buildingId },
        select: { order: { select: { orderNumber: true } } }
      });
      if (building) {
        orderNumber = building.order.orderNumber;
      }
    } else if (req.params.apartmentId) {
      const apartment = await prisma.apartment.findUnique({
        where: { id: req.params.apartmentId },
        select: { building: { select: { order: { select: { orderNumber: true } } } } }
      });
      if (apartment) {
        orderNumber = apartment.building.order.orderNumber;
      }
    }
    if (orderNumber !== null) {
      const permittedList = (dbUser.permittedProjects || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
      if (!permittedList.includes(orderNumber.toLowerCase())) {
        return res.status(403).json({ error: "You do not have permission to access this project." });
      }
    }
    next();
  } catch (err) {
    console.error("Project access check error:", err);
    return res.status(500).json({ error: "Internal server error checking project access" });
  }
}
var prisma;
var init_projectGuard = __esm({
  "../backend/src/middleware/projectGuard.js"() {
    prisma = new PrismaClient();
  }
});

// ../backend/src/controllers/authController.js
import { PrismaClient as PrismaClient2 } from "file:///C:/Users/hp/Downloads/Dio%20Grace%20(3)/Dio%20Grace%20(3)/Dio%20Gracee/backend/node_modules/@prisma/client/default.js";
import bcrypt from "file:///C:/Users/hp/Downloads/Dio%20Grace%20(3)/Dio%20Grace%20(3)/Dio%20Gracee/backend/node_modules/bcryptjs/index.js";
import jwt2 from "file:///C:/Users/hp/Downloads/Dio%20Grace%20(3)/Dio%20Grace%20(3)/Dio%20Gracee/backend/node_modules/jsonwebtoken/index.js";
async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  try {
    const user = await prisma2.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const token = jwt2.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET2,
      { expiresIn: "12h" }
    );
    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Internal server error during login" });
  }
}
async function me(req, res) {
  try {
    const user = await prisma2.user.findUnique({
      where: { id: req.user.id }
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      }
    });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
}
var prisma2, isProd2, JWT_SECRET2;
var init_authController = __esm({
  "../backend/src/controllers/authController.js"() {
    prisma2 = new PrismaClient2();
    isProd2 = process.env.NODE_ENV === "production";
    JWT_SECRET2 = process.env.JWT_SECRET || (isProd2 ? null : "dio_grace_secret_key_change_me_later");
    console.log("JWT_SECRET in authController.js:", JWT_SECRET2);
    if (isProd2 && (!JWT_SECRET2 || JWT_SECRET2 === "dio_grace_secret_key_change_me_later")) {
      throw new Error("FATAL: JWT_SECRET environment variable is missing or set to the default fallback key in production!");
    }
  }
});

// ../backend/src/controllers/orderController.js
import { PrismaClient as PrismaClient3 } from "file:///C:/Users/hp/Downloads/Dio%20Grace%20(3)/Dio%20Grace%20(3)/Dio%20Gracee/backend/node_modules/@prisma/client/default.js";
async function listOrders(req, res) {
  try {
    const dbUser = await prisma3.user.findUnique({
      where: { id: req.user.id }
    });
    if (!dbUser) {
      return res.status(401).json({ error: "User not found" });
    }
    let filter = {};
    if (dbUser.role === "ROLE_D") {
      const list = (dbUser.permittedProjects || "").split(",").map((s) => s.trim()).filter(Boolean);
      filter = { orderNumber: { in: list } };
    }
    const orders = await prisma3.order.findMany({
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
      orderBy: { createdAt: "desc" }
    });
    const result = orders.map((order) => {
      const buildingsCount = order.buildings.length;
      let totalApartments = 0;
      let sumCompletion = 0;
      for (const b of order.buildings) {
        totalApartments += b.apartments.length;
        sumCompletion += b.apartments.reduce((sum, a) => sum + (a.overallCompletionPct || 0), 0);
      }
      const overallCompletion = totalApartments > 0 ? sumCompletion / totalApartments : 0;
      return {
        id: order.id,
        orderNumber: order.orderNumber,
        clientName: order.clientName || order.siteName || "",
        siteAddress: order.siteAddress || "",
        supervisorName: order.supervisorName || "",
        totalApartmentsNeeded: order.totalApartmentsNeeded || 0,
        contractorId: order.contractorId || "",
        contractorName: order.contractorName || "",
        createdAt: order.createdAt,
        buildingsCount,
        totalApartments,
        overallCompletion: Math.round(overallCompletion * 1e3) / 1e3
      };
    });
    return res.json(result);
  } catch (err) {
    console.error("List orders error:", err);
    return res.status(500).json({ error: "Internal server error listing orders" });
  }
}
async function createOrder(req, res) {
  try {
    if (req.user.role !== "ROLE_A") {
      return res.status(403).json({ error: "Only Data Entry / Setup role can create orders" });
    }
    const { orderNumber, clientName, siteName, siteAddress, supervisorName, totalApartmentsNeeded, contractorId, contractorName } = req.body;
    if (!orderNumber || typeof orderNumber !== "string" || !orderNumber.trim()) {
      return res.status(400).json({ error: "Order Number is required" });
    }
    const trimmedOrderNo = orderNumber.trim();
    const finalClientName = clientName || siteName || "";
    const existing = await prisma3.order.findUnique({
      where: { orderNumber: trimmedOrderNo }
    });
    if (existing) {
      return res.status(400).json({ error: `Order Number "${trimmedOrderNo}" already exists` });
    }
    const order = await prisma3.order.create({
      data: {
        orderNumber: trimmedOrderNo,
        clientName: finalClientName ? String(finalClientName).trim() : "",
        siteAddress: siteAddress ? String(siteAddress).trim() : "",
        supervisorName: supervisorName ? String(supervisorName).trim() : "",
        totalApartmentsNeeded: totalApartmentsNeeded ? parseInt(totalApartmentsNeeded, 10) || 0 : 0,
        contractorId: contractorId ? String(contractorId).trim() : "",
        contractorName: contractorName ? String(contractorName).trim() : "",
        createdById: req.user.id,
        billingSetup: {
          create: {
            contractorRetentionPct: 5,
            contractorGSTPct: 18,
            contractorTDSPct: 1,
            clientRetentionPct: 5,
            clientGSTPct: 18,
            clientOtherDeduction: 0,
            clientMatEligiblePct: 40,
            clientExecEligiblePct: 45,
            clientHandoverEligiblePct: 15,
            // Pre-seed some default Unit Type Rates (5 of each product)
            unitTypeRates: {
              create: [
                { typeCode: "K-Type 1", product: "Kitchen", typeName: "Standard Kitchen L-Shape", contractorRate: 45e3, clientRate: 65e3 },
                { typeCode: "K-Type 2", product: "Kitchen", typeName: "Premium Kitchen Parallel", contractorRate: 55e3, clientRate: 78e3 },
                { typeCode: "K-Type 3", product: "Kitchen", typeName: "Island Luxury Kitchen", contractorRate: 85e3, clientRate: 12e4 },
                { typeCode: "K-Type 4", product: "Kitchen", typeName: "Compact Kitchen Straight", contractorRate: 35e3, clientRate: 48e3 },
                { typeCode: "K-Type 5", product: "Kitchen", typeName: "Semi-Premium Kitchen L-Shape", contractorRate: 48e3, clientRate: 68e3 },
                { typeCode: "W-Type 1", product: "Wardrobe", typeName: "Standard 2-Door Wardrobe", contractorRate: 25e3, clientRate: 38e3 },
                { typeCode: "W-Type 2", product: "Wardrobe", typeName: "Premium 3-Door Sliding Wardrobe", contractorRate: 42e3, clientRate: 58e3 },
                { typeCode: "W-Type 3", product: "Wardrobe", typeName: "Walk-in Wardrobe Luxury", contractorRate: 75e3, clientRate: 11e4 },
                { typeCode: "W-Type 4", product: "Wardrobe", typeName: "Compact 2-Door Wardrobe Loft", contractorRate: 3e4, clientRate: 45e3 },
                { typeCode: "W-Type 5", product: "Wardrobe", typeName: "Premium 4-Door Hinged Wardrobe", contractorRate: 48e3, clientRate: 7e4 },
                { typeCode: "V-Type 1", product: "Vanity", typeName: "Single Sink Vanity Standard", contractorRate: 8e3, clientRate: 12e3 },
                { typeCode: "V-Type 2", product: "Vanity", typeName: "Double Sink Premium Vanity", contractorRate: 14e3, clientRate: 2e4 },
                { typeCode: "V-Type 3", product: "Vanity", typeName: "Compact Floating Vanity", contractorRate: 6500, clientRate: 9500 },
                { typeCode: "V-Type 4", product: "Vanity", typeName: "Luxury Marble Top Vanity", contractorRate: 18e3, clientRate: 26e3 },
                { typeCode: "V-Type 5", product: "Vanity", typeName: "Standard Floor Mounted Vanity", contractorRate: 9e3, clientRate: 13500 }
              ]
            },
            // Pre-seed Contractor Milestones
            contractorMilestones: {
              create: [
                // Kitchen Milestones
                { product: "Kitchen", milestoneName: "Lower Carcasses Installed", percentage: 15 },
                { product: "Kitchen", milestoneName: "Upper Carcasses Installed", percentage: 15 },
                { product: "Kitchen", milestoneName: "Stone Installed", percentage: 15 },
                { product: "Kitchen", milestoneName: "Shutters & Hardware Installed", percentage: 25 },
                { product: "Kitchen", milestoneName: "Appliances Installed", percentage: 10 },
                { product: "Kitchen", milestoneName: "QC Approved & Handed Over", percentage: 20 },
                // Wardrobe Milestones
                { product: "Wardrobe", milestoneName: "Cabinets Installed", percentage: 40 },
                { product: "Wardrobe", milestoneName: "Shutter & Hardware Installed", percentage: 30 },
                { product: "Wardrobe", milestoneName: "QC Approved & Handed Over", percentage: 30 },
                // Vanity Milestones
                { product: "Vanity", milestoneName: "Cabinets Installed", percentage: 40 },
                { product: "Vanity", milestoneName: "Shutter & Hardware Installed", percentage: 30 },
                { product: "Vanity", milestoneName: "QC Approved & Handed Over", percentage: 30 }
              ]
            },
            // Pre-seed Client RA Milestones (must sum to 100% per product)
            clientRAMilestones: {
              create: [
                // Kitchen Material Supply Milestones (sum = 40%)
                { product: "Kitchen", recognitionType: "MATERIAL", milestoneName: "Lower Carcasses Supplied", fieldKey: "kitchenLowerCarcassInward", percentage: 8 },
                { product: "Kitchen", recognitionType: "MATERIAL", milestoneName: "Upper Carcasses Supplied", fieldKey: "kitchenUpperCarcassInward", percentage: 7 },
                { product: "Kitchen", recognitionType: "MATERIAL", milestoneName: "Stone Supplied", fieldKey: "kitchenStoneInward", percentage: 7 },
                { product: "Kitchen", recognitionType: "MATERIAL", milestoneName: "Shutters Supplied", fieldKey: "kitchenShutterInward", percentage: 8 },
                { product: "Kitchen", recognitionType: "MATERIAL", milestoneName: "Hardware Supplied", fieldKey: "kitchenHardwareInward", percentage: 5 },
                { product: "Kitchen", recognitionType: "MATERIAL", milestoneName: "Appliances Supplied", fieldKey: "kitchenApplianceInward", percentage: 5 },
                // Kitchen Execution Milestones (sum = 45%)
                { product: "Kitchen", recognitionType: "EXECUTION", milestoneName: "Lower Carcasses Installed", fieldKey: "kitchenLowerCarcassInstalled", percentage: 9 },
                { product: "Kitchen", recognitionType: "EXECUTION", milestoneName: "Upper Carcasses Installed", fieldKey: "kitchenUpperCarcassInstalled", percentage: 9 },
                { product: "Kitchen", recognitionType: "EXECUTION", milestoneName: "Stone Installed", fieldKey: "kitchenStoneInstalled", percentage: 9 },
                { product: "Kitchen", recognitionType: "EXECUTION", milestoneName: "Shutters & Hardware Installed", fieldKey: "kitchenShutterHardwareInstalled", percentage: 10 },
                { product: "Kitchen", recognitionType: "EXECUTION", milestoneName: "Appliances Installed", fieldKey: "kitchenApplianceInstalled", percentage: 8 },
                // Kitchen Handover Milestone (sum = 15%)
                { product: "Kitchen", recognitionType: "HANDOVER", milestoneName: "QC Approved & Handed Over", fieldKey: "kitchenHandedOver", percentage: 15 },
                // Wardrobe Material Supply Milestones (sum = 40%)
                { product: "Wardrobe", recognitionType: "MATERIAL", milestoneName: "Cabinets Supplied", fieldKey: "wardrobeCabinetInward", percentage: 20 },
                { product: "Wardrobe", recognitionType: "MATERIAL", milestoneName: "Shutter & Hardware Supplied", fieldKey: "wardrobeShutterHardwareInward", percentage: 20 },
                // Wardrobe Execution Milestones (sum = 40%)
                { product: "Wardrobe", recognitionType: "EXECUTION", milestoneName: "Cabinets Installed", fieldKey: "wardrobeCabinetInstalled", percentage: 20 },
                { product: "Wardrobe", recognitionType: "EXECUTION", milestoneName: "Shutter & Hardware Installed", fieldKey: "wardrobeShutterHardwareInstalled", percentage: 20 },
                // Wardrobe Handover Milestone (sum = 20%)
                { product: "Wardrobe", recognitionType: "HANDOVER", milestoneName: "QC Approved & Handed Over", fieldKey: "wardrobeHandedOver", percentage: 20 },
                // Vanity Material Supply Milestones (sum = 40%)
                { product: "Vanity", recognitionType: "MATERIAL", milestoneName: "Cabinets Supplied", fieldKey: "vanityCabinetInward", percentage: 20 },
                { product: "Vanity", recognitionType: "MATERIAL", milestoneName: "Shutter & Hardware Supplied", fieldKey: "vanityShutterHardwareInward", percentage: 20 },
                // Vanity Execution Milestones (sum = 40%)
                { product: "Vanity", recognitionType: "EXECUTION", milestoneName: "Cabinets Installed", fieldKey: "vanityCabinetInstalled", percentage: 20 },
                { product: "Vanity", recognitionType: "EXECUTION", milestoneName: "Shutter & Hardware Installed", fieldKey: "vanityShutterHardwareInstalled", percentage: 20 },
                // Vanity Handover Milestone (sum = 20%)
                { product: "Vanity", recognitionType: "HANDOVER", milestoneName: "QC Approved & Handed Over", fieldKey: "vanityHandedOver", percentage: 20 }
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
    console.error("Create order error:", err);
    return res.status(500).json({ error: "Internal server error creating order" });
  }
}
async function getOrder(req, res) {
  const { orderId } = req.params;
  try {
    const order = await prisma3.order.findUnique({
      where: { id: orderId },
      include: {
        buildings: true,
        billingSetup: true
      }
    });
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    return res.json(order);
  } catch (err) {
    return res.status(500).json({ error: "Internal server error getting order" });
  }
}
async function deleteOrder(req, res) {
  const { orderId } = req.params;
  try {
    if (req.user.role !== "ROLE_A") {
      return res.status(403).json({ error: "Only Data Entry / Setup role can delete orders" });
    }
    const order = await prisma3.order.findUnique({
      where: { id: orderId }
    });
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    await prisma3.order.delete({
      where: { id: orderId }
    });
    return res.json({ message: "Order and all associated data deleted successfully" });
  } catch (err) {
    console.error("Delete order error:", err);
    return res.status(500).json({ error: "Internal server error deleting order" });
  }
}
var prisma3;
var init_orderController = __esm({
  "../backend/src/controllers/orderController.js"() {
    prisma3 = new PrismaClient3();
  }
});

// ../backend/src/services/calculationService.js
function pct(val) {
  return Math.min(1, Math.max(0, (val || 0) / 100));
}
function calculateMaterialInwardPct(apt) {
  const E = apt.kitchenQty || 0;
  const F = apt.wardrobeQty || 0;
  const G = apt.vanityQty || 0;
  const totalQty = E + F + G;
  if (totalQty === 0) return 0;
  let sumKitchen = 0;
  if (E > 0) {
    const fields = [
      apt.kitchenLowerCarcassInward,
      apt.kitchenUpperCarcassInward,
      apt.kitchenStoneInward,
      apt.kitchenShuttersInward || apt.kitchenShutterInward || 0,
      apt.kitchenHardwareInward,
      apt.kitchenAppliancesInward || apt.kitchenApplianceInward || 0
    ];
    sumKitchen = fields.reduce((sum, val) => sum + pct(val), 0) / 6;
  }
  let sumWardrobe = 0;
  if (F > 0) {
    const fields = [
      apt.wardrobesCabinetsInward || apt.wardrobeCabinetInward || 0,
      apt.wardrobeShutterHardwareInward || 0
    ];
    sumWardrobe = fields.reduce((sum, val) => sum + pct(val), 0) / 2;
  }
  let sumVanity = 0;
  if (G > 0) {
    const fields = [
      apt.vanityCabinetsInward || apt.vanityCabinetInward || 0,
      apt.vanityShutterHardwareInward || 0
    ];
    sumVanity = fields.reduce((sum, val) => sum + pct(val), 0) / 2;
  }
  const weightedSum = sumKitchen * E + sumWardrobe * F + sumVanity * G;
  return weightedSum / totalQty;
}
function calculateQCGate(apt, product) {
  const E = apt.kitchenQty || 0;
  const F = apt.wardrobeQty || 0;
  const G = apt.vanityQty || 0;
  if (product === "kitchen") {
    if (E === 0) return "N/A";
    const installComplete = [
      apt.kitchenLowerCarcassInstalled,
      apt.kitchenUpperCarcassInstalled,
      apt.kitchenStoneInstalled,
      apt.kitchenShuttersHardwareInstalled || apt.kitchenShutterHardwareInstalled || 0,
      apt.kitchenAppliancesInstalled || apt.kitchenApplianceInstalled || 0
    ].every((val) => (val || 0) >= 100);
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
    if (qcFields.some((val) => val === "Not OK")) return "Rejected";
    if (qcFields.some((val) => val === null || val === void 0 || val === "")) return "QC Pending";
    return "Approved";
  }
  if (product === "wardrobe") {
    if (F === 0) return "N/A";
    const installComplete = [
      apt.wardrobesCabinetsInstalled || apt.wardrobeCabinetInstalled || 0,
      apt.wardrobeShutterHardwareInstalled || 0
    ].every((val) => (val || 0) >= 100);
    if (!installComplete) return "Installation Pending";
    const qcFields = [
      apt.wardrobeQC_VisibleScrews,
      apt.wardrobeQC_Chipping,
      apt.wardrobeQC_FillerMissing,
      apt.wardrobeQC_Scratches,
      apt.wardrobeQC_DrawersFunction
    ];
    if (qcFields.some((val) => val === "Not OK")) return "Rejected";
    if (qcFields.some((val) => val === null || val === void 0 || val === "")) return "QC Pending";
    return "Approved";
  }
  if (product === "vanity") {
    if (G === 0) return "N/A";
    const installComplete = [
      apt.vanityCabinetsInstalled || apt.vanityCabinetInstalled || 0,
      apt.vanityShutterHardwareInstalled || 0
    ].every((val) => (val || 0) >= 100);
    if (!installComplete) return "Installation Pending";
    const qcFields = [
      apt.vanityQC_VisibleScrews,
      apt.vanityQC_Chipping,
      apt.vanityQC_FillerMissing,
      apt.vanityQC_Scratches,
      apt.vanityQC_DrawersFunction
    ];
    if (qcFields.some((val) => val === "Not OK")) return "Rejected";
    if (qcFields.some((val) => val === null || val === void 0 || val === "")) return "QC Pending";
    return "Approved";
  }
  return "N/A";
}
function calculateKitchenCompletionPct(apt, kitchenQCGate) {
  const E = apt.kitchenQty || 0;
  if (E === 0) return 0;
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
  const handoverContrib = handoverApproved && handoverVal >= 1 ? 1 : 0;
  return (sumInstall + handoverContrib) / 6;
}
function calculateWardrobeCompletionPct(apt, wardrobeQCGate) {
  const F = apt.wardrobeQty || 0;
  if (F === 0) return 0;
  const handoverApproved = wardrobeQCGate === "Approved";
  const fields = [
    apt.wardrobesCabinetsInstalled || apt.wardrobeCabinetInstalled || 0,
    apt.wardrobeShutterHardwareInstalled || 0
  ];
  const sumInstall = fields.reduce((sum, val) => sum + pct(val), 0);
  const handoverVal = pct(apt.wardrobeHandedOver);
  const handoverContrib = handoverApproved && handoverVal >= 1 ? 1 : 0;
  return (sumInstall + handoverContrib) / 3;
}
function calculateVanityCompletionPct(apt, vanityQCGate) {
  const G = apt.vanityQty || 0;
  if (G === 0) return 0;
  const handoverApproved = vanityQCGate === "Approved";
  const fields = [
    apt.vanityCabinetsInstalled || apt.vanityCabinetInstalled || 0,
    apt.vanityShutterHardwareInstalled || 0
  ];
  const sumInstall = fields.reduce((sum, val) => sum + pct(val), 0);
  const handoverVal = pct(apt.vanityHandedOver);
  const handoverContrib = handoverApproved && handoverVal >= 1 ? 1 : 0;
  return (sumInstall + handoverContrib) / 3;
}
function calculateOverallCompletionPct(apt, materialWeight, executionWeight, matPct, kitPct, wardPct, vanPct) {
  const E = apt.kitchenQty || 0;
  const F = apt.wardrobeQty || 0;
  const G = apt.vanityQty || 0;
  const totalQty = E + F + G;
  if (totalQty === 0) return 0;
  const weightedInstallPct = (kitPct * E + wardPct * F + vanPct * G) / totalQty;
  return matPct * materialWeight + weightedInstallPct * executionWeight;
}
function calculateHandoverApprovalStatus(kitGate, wardGate, vanGate, E, F, G) {
  const activeGates = [];
  if (E > 0) activeGates.push(kitGate);
  if (F > 0) activeGates.push(wardGate);
  if (G > 0) activeGates.push(vanGate);
  if (activeGates.length === 0) return "Not Approved";
  if (activeGates.some((g) => g === "Rejected")) return "QC Rejected";
  if (activeGates.some((g) => g === "QC Pending")) return "QC Pending";
  if (activeGates.some((g) => g === "Installation Pending")) return "Installation Pending";
  if (activeGates.every((g) => g === "Approved")) return "Approved";
  return "Installation Pending";
}
function calculateApartmentStatus(apt, handoverStatus, matPct) {
  if (handoverStatus === "QC Rejected") return "QC Rejected";
  if (handoverStatus === "QC Pending") return "QC Pending";
  const E = apt.kitchenQty || 0;
  const F = apt.wardrobeQty || 0;
  const G = apt.vanityQty || 0;
  if (handoverStatus === "Approved") {
    const kitchenHanded = E > 0 ? (apt.kitchenHandedOver || 0) >= 100 : true;
    const wardrobeHanded = F > 0 ? (apt.wardrobeHandedOver || 0) >= 100 : true;
    const vanityHanded = G > 0 ? (apt.vanityHandedOver || 0) >= 100 : true;
    if (kitchenHanded && wardrobeHanded && vanityHanded) {
      return "Completed";
    }
    return "Ready for Handover";
  }
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
    apt.vanityHandedOver
  ].some((val) => (val || 0) > 0);
  if (hasStage2Progress) return "Execution In Progress";
  if (matPct >= 1) return "Material Ready";
  if (matPct > 0) return "Material Inward";
  return "Not Started";
}
function calculateDelayDays(plannedComp, actualComp, reportDate) {
  if (!plannedComp) return 0;
  const planned = new Date(plannedComp);
  const comp = actualComp ? new Date(actualComp) : new Date(reportDate);
  const diffTime = comp.getTime() - planned.getTime();
  const diffDays = Math.ceil(diffTime / (1e3 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}
function calculateHealth(apt, delayDays, overallPct, status, config) {
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
function recalculateApartment(apt, buildingConfig) {
  const reportDate = buildingConfig.reportDate || /* @__PURE__ */ new Date();
  const materialWeight = buildingConfig.materialWeight ?? 0.3;
  const executionWeight = buildingConfig.executionWeight ?? 0.7;
  const matPct = calculateMaterialInwardPct(apt);
  const kitGate = calculateQCGate(apt, "kitchen");
  const wardGate = calculateQCGate(apt, "wardrobe");
  const vanGate = calculateQCGate(apt, "vanity");
  const kitPct = calculateKitchenCompletionPct(apt, kitGate);
  const wardPct = calculateWardrobeCompletionPct(apt, wardGate);
  const vanPct = calculateVanityCompletionPct(apt, vanGate);
  const overallPct = calculateOverallCompletionPct(apt, materialWeight, executionWeight, matPct, kitPct, wardPct, vanPct);
  const E = apt.kitchenQty || 0;
  const F = apt.wardrobeQty || 0;
  const G = apt.vanityQty || 0;
  const handoverStatus = calculateHandoverApprovalStatus(kitGate, wardGate, vanGate, E, F, G);
  const status = calculateApartmentStatus(apt, handoverStatus, matPct);
  const delayDays = calculateDelayDays(apt.plannedCompletion, apt.actualCompletion, reportDate);
  const health = calculateHealth(apt, delayDays, overallPct, status, buildingConfig);
  return {
    ...apt,
    materialInwardPct: Math.round(matPct * 1e3) / 1e3,
    kitchenCompletionPct: Math.round(kitPct * 1e3) / 1e3,
    wardrobeCompletionPct: Math.round(wardPct * 1e3) / 1e3,
    vanityCompletionPct: Math.round(vanPct * 1e3) / 1e3,
    overallCompletionPct: Math.round(overallPct * 1e3) / 1e3,
    kitchenQCGate: kitGate,
    wardrobeQCGate: wardGate,
    vanityQCGate: vanGate,
    handoverApprovalStatus: handoverStatus,
    apartmentStatus: status,
    delayDays,
    health
  };
}
var init_calculationService = __esm({
  "../backend/src/services/calculationService.js"() {
  }
});

// ../backend/src/controllers/buildingController.js
import { PrismaClient as PrismaClient4 } from "file:///C:/Users/hp/Downloads/Dio%20Grace%20(3)/Dio%20Grace%20(3)/Dio%20Gracee/backend/node_modules/@prisma/client/default.js";
async function listBuildings(req, res) {
  const { orderId } = req.params;
  try {
    const buildings = await prisma4.building.findMany({
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
      orderBy: { createdAt: "asc" }
    });
    const result = buildings.map((building) => {
      const apartments = building.apartments;
      const count = apartments.length;
      let sumCompletion = 0;
      let completedCount = 0;
      let inProgressCount = 0;
      let delayedCount = 0;
      let criticalCount = 0;
      for (const apt of apartments) {
        sumCompletion += apt.overallCompletionPct || 0;
        if (apt.apartmentStatus === "Completed") completedCount++;
        else if (apt.apartmentStatus !== "Not Started") inProgressCount++;
        if (apt.health === "Delayed") delayedCount++;
        else if (apt.health === "Critical") criticalCount++;
      }
      const overallCompletion = count > 0 ? sumCompletion / count : 0;
      return {
        id: building.id,
        name: building.name,
        capacity: building.capacity,
        siteName: building.siteName,
        reportDate: building.reportDate,
        overallCompletion: Math.round(overallCompletion * 1e3) / 1e3,
        completedCount,
        inProgressCount,
        delayedCount: delayedCount + criticalCount,
        createdAt: building.createdAt
      };
    });
    return res.json(result);
  } catch (err) {
    console.error("List buildings error:", err);
    return res.status(500).json({ error: "Internal server error listing buildings" });
  }
}
async function createBuilding(req, res) {
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
    return res.status(400).json({ error: "Capacity is required" });
  }
  const parsedCapacity = parseInt(capacity, 10);
  if (isNaN(parsedCapacity) || parsedCapacity <= 0) {
    return res.status(400).json({ error: "Capacity must be a positive integer" });
  }
  const numTowers = count ? Math.max(1, parseInt(count, 10)) : 1;
  const baseName = name && typeof name === "string" && name.trim() ? name.trim() : "Tower";
  try {
    if (req.user.role !== "ROLE_A") {
      return res.status(403).json({ error: "Only Data Entry / Setup role can add buildings" });
    }
    const buildingReportDate = reportDate ? new Date(reportDate) : /* @__PURE__ */ new Date();
    const order = await prisma4.order.findUnique({
      where: { id: orderId },
      select: { supervisorName: true, contractorId: true, contractorName: true }
    });
    const defaultSupervisor = order?.supervisorName || "";
    const defaultContractor = order?.contractorId || "";
    const defaultContractorName = order?.contractorName || "";
    const commonConfig = {
      capacity: parsedCapacity,
      siteName: siteName ? String(siteName).trim() : "",
      reportDate: buildingReportDate,
      materialWeight: materialWeight !== void 0 ? parseFloat(materialWeight) : 0.3,
      executionWeight: executionWeight !== void 0 ? parseFloat(executionWeight) : 0.7,
      goodThreshold: goodThreshold !== void 0 ? parseFloat(goodThreshold) : 0.75,
      excellentThreshold: excellentThreshold !== void 0 ? parseFloat(excellentThreshold) : 0.9,
      delayedDaysThreshold: delayedDaysThreshold !== void 0 ? parseInt(delayedDaysThreshold, 10) : 7,
      criticalDaysThreshold: criticalDaysThreshold !== void 0 ? parseInt(criticalDaysThreshold, 10) : 14
    };
    const createdBuildings = await prisma4.$transaction(async (tx) => {
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
        const apartmentsData = [];
        for (let i = 1; i <= parsedCapacity; i++) {
          const rawApt = {
            buildingId: building.id,
            srNo: i,
            apartmentNo: null,
            floor: null,
            priority: "Normal",
            kitchenQty: null,
            wardrobeQty: null,
            vanityQty: null,
            kitchenType: "K-Type 1",
            wardrobeType: "W-Type 1",
            vanityType: "V-Type 1",
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
    console.error("Create building error:", err);
    return res.status(500).json({ error: "Internal server error creating building" });
  }
}
async function getBuilding(req, res) {
  const { buildingId } = req.params;
  try {
    const building = await prisma4.building.findUnique({
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
      return res.status(404).json({ error: "Building not found" });
    }
    return res.json(building);
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
}
async function updateBuildingConfig(req, res) {
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
    if (req.user.role !== "ROLE_A") {
      return res.status(403).json({ error: "Only Data Entry / Setup role can update configuration" });
    }
    const building = await prisma4.building.findUnique({
      where: { id: buildingId },
      include: { order: { select: { contractorId: true, contractorName: true } } }
    });
    if (!building) {
      return res.status(404).json({ error: "Building not found" });
    }
    const newCapacity = capacity !== void 0 ? parseInt(capacity, 10) : building.capacity;
    const updatedConfig = {
      name: name !== void 0 ? name : building.name,
      capacity: newCapacity,
      siteName: siteName !== void 0 ? siteName : building.siteName,
      reportDate: reportDate ? new Date(reportDate) : building.reportDate,
      materialWeight: materialWeight !== void 0 ? parseFloat(materialWeight) : building.materialWeight,
      executionWeight: executionWeight !== void 0 ? parseFloat(executionWeight) : building.executionWeight,
      goodThreshold: goodThreshold !== void 0 ? parseFloat(goodThreshold) : building.goodThreshold,
      excellentThreshold: excellentThreshold !== void 0 ? parseFloat(excellentThreshold) : building.excellentThreshold,
      delayedDaysThreshold: delayedDaysThreshold !== void 0 ? parseInt(delayedDaysThreshold, 10) : building.delayedDaysThreshold,
      criticalDaysThreshold: criticalDaysThreshold !== void 0 ? parseInt(criticalDaysThreshold, 10) : building.criticalDaysThreshold
    };
    const updatedBuilding = await prisma4.$transaction(async (tx) => {
      const b = await tx.building.update({
        where: { id: buildingId },
        data: updatedConfig
      });
      if (newCapacity > building.capacity) {
        const newApts = [];
        for (let i = building.capacity + 1; i <= newCapacity; i++) {
          const rawApt = {
            buildingId: building.id,
            srNo: i,
            apartmentNo: null,
            floor: null,
            priority: "Normal",
            kitchenQty: 1,
            wardrobeQty: 1,
            vanityQty: 1,
            kitchenType: "K-Type 1",
            wardrobeType: "W-Type 1",
            vanityType: "V-Type 1",
            contractor: building.order?.contractorId || "",
            contractorName: building.order?.contractorName || ""
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
            overallCompletionPct: recalculated.overallCompletionPct,
            kitchenQCGate: recalculated.kitchenQCGate,
            wardrobeQCGate: recalculated.wardrobeQCGate,
            vanityQCGate: recalculated.vanityQCGate,
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
    console.error("Update building config error:", err);
    return res.status(500).json({ error: "Internal server error updating building config" });
  }
}
async function deleteBuilding(req, res) {
  const { buildingId } = req.params;
  try {
    if (req.user.role !== "ROLE_A") {
      return res.status(403).json({ error: "Only Data Entry / Setup role can delete buildings" });
    }
    const building = await prisma4.building.findUnique({
      where: { id: buildingId }
    });
    if (!building) {
      return res.status(404).json({ error: "Building not found" });
    }
    await prisma4.building.delete({
      where: { id: buildingId }
    });
    return res.json({ message: "Building and all associated data deleted successfully" });
  } catch (err) {
    console.error("Delete building error:", err);
    return res.status(500).json({ error: "Internal server error deleting building" });
  }
}
async function copyBuildingData(req, res) {
  const { sourceBuildingId, targetBuildingId } = req.body;
  if (!sourceBuildingId || !targetBuildingId) {
    return res.status(400).json({ error: "Source and target building IDs are required" });
  }
  if (sourceBuildingId === targetBuildingId) {
    return res.status(400).json({ error: "Source and target buildings must be different" });
  }
  try {
    if (req.user.role !== "ROLE_A") {
      return res.status(403).json({ error: "Only Setup Operator (Admin) can copy building data" });
    }
    const sourceBuilding = await prisma4.building.findUnique({
      where: { id: sourceBuildingId },
      include: { apartments: true }
    });
    const targetBuilding = await prisma4.building.findUnique({
      where: { id: targetBuildingId },
      include: { apartments: true }
    });
    if (!sourceBuilding || !targetBuilding) {
      return res.status(404).json({ error: "Source or target building not found" });
    }
    const sourceApts = sourceBuilding.apartments;
    const targetApts = targetBuilding.apartments;
    const copyFields = [
      "priority",
      "kitchenQty",
      "wardrobeQty",
      "vanityQty",
      "kitchenLowerCarcassInward",
      "kitchenUpperCarcassInward",
      "kitchenStoneInward",
      "kitchenShutterInward",
      "kitchenHardwareInward",
      "kitchenApplianceInward",
      "wardrobeCabinetInward",
      "wardrobeShutterHardwareInward",
      "vanityCabinetInward",
      "vanityShutterHardwareInward",
      "kitchenLowerCarcassInstalled",
      "kitchenUpperCarcassInstalled",
      "kitchenStoneInstalled",
      "kitchenShutterHardwareInstalled",
      "kitchenApplianceInstalled",
      "kitchenHandedOver",
      "wardrobeCabinetInstalled",
      "wardrobeShutterHardwareInstalled",
      "wardrobeHandedOver",
      "vanityCabinetInstalled",
      "vanityShutterHardwareInstalled",
      "vanityHandedOver",
      "plannedStart",
      "plannedCompletion",
      "actualStart",
      "actualCompletion",
      "supervisorName",
      "responsibleEngineer",
      "contractor",
      "contractorName",
      "delayReason",
      "remarks",
      "kitchenQC_VisibleScrews",
      "kitchenQC_Chipping",
      "kitchenQC_FillerMissing",
      "kitchenQC_Scratches",
      "kitchenQC_DrawersFunction",
      "kitchenQC_CutleryTray",
      "kitchenQC_DishDrainer",
      "wardrobeQC_VisibleScrews",
      "wardrobeQC_Chipping",
      "wardrobeQC_FillerMissing",
      "wardrobeQC_Scratches",
      "wardrobeQC_DrawersFunction",
      "vanityQC_VisibleScrews",
      "vanityQC_Chipping",
      "vanityQC_FillerMissing",
      "vanityQC_Scratches",
      "vanityQC_DrawersFunction",
      "kitchenType",
      "wardrobeType",
      "vanityType"
    ];
    const updatedApts = [];
    const auditLogs = [];
    for (const targetApt of targetApts) {
      const sourceApt = sourceApts.find((a) => a.srNo === targetApt.srNo);
      if (!sourceApt) continue;
      const updates = {};
      for (const field of copyFields) {
        updates[field] = sourceApt[field];
      }
      const merged = { ...targetApt, ...updates };
      const recalculated = recalculateApartment(merged, targetBuilding);
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
        fieldName: "Copy Data",
        oldValue: `From building: ${sourceBuilding.name}`,
        newValue: `Copied values from SrNo: ${sourceApt.srNo}`
      });
    }
    await prisma4.$transaction(async (tx) => {
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
    console.error("Copy building data error:", err);
    return res.status(500).json({ error: "Internal server error copying building data" });
  }
}
var prisma4;
var init_buildingController = __esm({
  "../backend/src/controllers/buildingController.js"() {
    init_calculationService();
    prisma4 = new PrismaClient4();
  }
});

// ../backend/src/controllers/apartmentController.js
import { PrismaClient as PrismaClient5 } from "file:///C:/Users/hp/Downloads/Dio%20Grace%20(3)/Dio%20Grace%20(3)/Dio%20Gracee/backend/node_modules/@prisma/client/default.js";
async function listApartments(req, res) {
  const { buildingId } = req.params;
  try {
    const apartments = await prisma5.apartment.findMany({
      where: { buildingId },
      orderBy: { srNo: "asc" }
    });
    return res.json(apartments);
  } catch (err) {
    return res.status(500).json({ error: "Internal server error listing apartments" });
  }
}
async function createApartment(req, res) {
  const { buildingId } = req.params;
  const { apartmentNo, floor, priority, kitchenType, wardrobeType, vanityType } = req.body;
  try {
    if (req.user.role !== "ROLE_A") {
      return res.status(403).json({ error: "Only Setup Operator can add apartment rows" });
    }
    const building = await prisma5.building.findUnique({
      where: { id: buildingId },
      include: {
        apartments: { orderBy: { srNo: "desc" }, take: 1 },
        order: { select: { contractorId: true } }
      }
    });
    if (!building) {
      return res.status(404).json({ error: "Building not found" });
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
      priority: priority || "Normal",
      kitchenQty: null,
      wardrobeQty: null,
      vanityQty: null,
      kitchenType: kitchenType || "K-Type 1",
      wardrobeType: wardrobeType || "W-Type 1",
      vanityType: vanityType || "V-Type 1",
      contractor: building.order?.contractorId || null
    };
    const calculated = recalculateApartment(rawApt, building);
    const newApt = await prisma5.$transaction(async (tx) => {
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
    console.error("Create apartment error:", err);
    return res.status(500).json({ error: "Failed to add apartment row" });
  }
}
async function deleteApartment(req, res) {
  const { apartmentId } = req.params;
  try {
    if (req.user.role !== "ROLE_A") {
      return res.status(403).json({ error: "Only Setup Operator can delete apartment rows" });
    }
    const apt = await prisma5.apartment.findUnique({
      where: { id: apartmentId }
    });
    if (!apt) {
      return res.status(404).json({ error: "Apartment not found" });
    }
    await prisma5.$transaction(async (tx) => {
      await tx.apartment.delete({
        where: { id: apartmentId }
      });
      await tx.building.update({
        where: { id: apt.buildingId },
        data: { capacity: Math.max(0, await tx.apartment.count({ where: { buildingId: apt.buildingId } })) }
      });
    });
    return res.json({ message: "Apartment row deleted successfully" });
  } catch (err) {
    console.error("Delete apartment error:", err);
    return res.status(500).json({ error: "Failed to delete apartment row" });
  }
}
async function updateApartment(req, res) {
  const { apartmentId } = req.params;
  const updates = req.body;
  try {
    const role = req.user.role;
    if (role === "ROLE_C" || role === "ROLE_D") {
      return res.status(403).json({ error: "Read-only users cannot modify data" });
    }
    const apt = await prisma5.apartment.findUnique({
      where: { id: apartmentId },
      include: { building: true }
    });
    if (!apt) {
      return res.status(404).json({ error: "Apartment not found" });
    }
    const filteredUpdates = {};
    if (role === "ROLE_A") {
      for (const [key, value] of Object.entries(updates)) {
        if (key !== "id" && key !== "buildingId" && key !== "createdAt") {
          filteredUpdates[key] = value;
        }
      }
    } else if (role === "ROLE_B") {
      const attemptedRoleAFields = ROLE_A_FIELDS.filter((key) => updates[key] !== void 0);
      if (attemptedRoleAFields.length > 0) {
        return res.status(403).json({
          error: `Execution role cannot modify Setup fields: [${attemptedRoleAFields.join(", ")}]`
        });
      }
      for (const [key, value] of Object.entries(updates)) {
        if (!ROLE_A_FIELDS.includes(key) && key !== "id" && key !== "buildingId" && key !== "createdAt") {
          filteredUpdates[key] = value;
        }
      }
    }
    if (Object.keys(filteredUpdates).length === 0) {
      return res.json(apt);
    }
    const dateFields = ["plannedStart", "plannedCompletion", "actualStart", "actualCompletion"];
    for (const f of dateFields) {
      if (filteredUpdates[f] !== void 0) {
        filteredUpdates[f] = filteredUpdates[f] ? new Date(filteredUpdates[f]) : null;
      }
    }
    if (filteredUpdates.actualCompletion) {
      const today = /* @__PURE__ */ new Date();
      today.setHours(23, 59, 59, 999);
      if (filteredUpdates.actualCompletion > today) {
        return res.status(400).json({ error: "Actual completion date cannot be set in the future" });
      }
    }
    const updatedApt = await prisma5.$transaction(async (tx) => {
      const auditLogData = [];
      for (const [field, newVal] of Object.entries(filteredUpdates)) {
        let oldValStr = apt[field] === null ? "" : String(apt[field]);
        if (apt[field] instanceof Date) {
          oldValStr = apt[field].toISOString();
        }
        let newValStr = newVal === null ? "" : String(newVal);
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
      const mergedApt = { ...apt, ...filteredUpdates };
      const recalculated = recalculateApartment(mergedApt, apt.building);
      const { id, buildingId, createdAt, updatedAt, building: buildingRelation, auditLogs, ...updateData } = recalculated;
      return await tx.apartment.update({
        where: { id: apartmentId },
        data: updateData
      });
    });
    return res.json(updatedApt);
  } catch (err) {
    console.error("Update apartment error:", err);
    return res.status(500).json({ error: "Internal server error updating apartment" });
  }
}
async function batchUpdateApartments(req, res) {
  const { buildingId } = req.params;
  const { items } = req.body;
  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ error: "Items array is required" });
  }
  try {
    const role = req.user.role;
    if (role === "ROLE_C" || role === "ROLE_D") {
      return res.status(403).json({ error: "Read-only users cannot modify data" });
    }
    const building = await prisma5.building.findUnique({
      where: { id: buildingId }
    });
    if (!building) {
      return res.status(404).json({ error: "Building not found" });
    }
    const results = await prisma5.$transaction(async (tx) => {
      const updatedList = [];
      for (const item of items) {
        const apt = await tx.apartment.findUnique({
          where: { id: item.id }
        });
        if (!apt || apt.buildingId !== buildingId) continue;
        const filteredUpdates = {};
        if (role === "ROLE_A") {
          for (const [key, value] of Object.entries(item.updates)) {
            if (key !== "id" && key !== "buildingId" && key !== "createdAt") {
              filteredUpdates[key] = value;
            }
          }
        } else if (role === "ROLE_B") {
          const attemptedRoleAFields = ROLE_A_FIELDS.filter((key) => item.updates[key] !== void 0);
          if (attemptedRoleAFields.length > 0) {
            throw new Error(`Execution role cannot modify Setup fields in batch: [${attemptedRoleAFields.join(", ")}]`);
          }
          for (const [key, value] of Object.entries(item.updates)) {
            if (!ROLE_A_FIELDS.includes(key) && key !== "id" && key !== "buildingId" && key !== "createdAt") {
              filteredUpdates[key] = value;
            }
          }
          const pctFields = [
            "kitchenLowerCarcassInward",
            "kitchenUpperCarcassInward",
            "kitchenStoneInward",
            "kitchenShutterInward",
            "kitchenHardwareInward",
            "kitchenApplianceInward",
            "wardrobeCabinetInward",
            "wardrobeShutterHardwareInward",
            "vanityCabinetInward",
            "vanityShutterHardwareInward",
            "kitchenLowerCarcassInstalled",
            "kitchenUpperCarcassInstalled",
            "kitchenStoneInstalled",
            "kitchenShutterHardwareInstalled",
            "kitchenApplianceInstalled",
            "kitchenHandedOver",
            "wardrobeCabinetInstalled",
            "wardrobeShutterHardwareInstalled",
            "wardrobeHandedOver",
            "vanityCabinetInstalled",
            "vanityShutterHardwareInstalled",
            "vanityHandedOver"
          ];
          for (const f of pctFields) {
            if (filteredUpdates[f] !== void 0 && apt[f] !== null && apt[f] !== void 0) {
              delete filteredUpdates[f];
            }
          }
          const textLockFields = [
            "plannedStart",
            "plannedCompletion",
            "actualStart",
            "actualCompletion",
            "contractor",
            "contractorName",
            "delayReason",
            "remarks",
            "kitchenQC_VisibleScrews",
            "kitchenQC_Chipping",
            "kitchenQC_FillerMissing",
            "kitchenQC_Scratches",
            "kitchenQC_DrawersFunction",
            "kitchenQC_CutleryTray",
            "kitchenQC_DishDrainer",
            "wardrobeQC_VisibleScrews",
            "wardrobeQC_Chipping",
            "wardrobeQC_FillerMissing",
            "wardrobeQC_Scratches",
            "wardrobeQC_DrawersFunction",
            "vanityQC_VisibleScrews",
            "vanityQC_Chipping",
            "vanityQC_FillerMissing",
            "vanityQC_Scratches",
            "vanityQC_DrawersFunction"
          ];
          for (const f of textLockFields) {
            const existing = apt[f];
            if (filteredUpdates[f] !== void 0 && existing !== null && existing !== void 0 && String(existing).trim() !== "") {
              delete filteredUpdates[f];
            }
          }
        }
        if (Object.keys(filteredUpdates).length === 0) continue;
        const dateFields = ["plannedStart", "plannedCompletion", "actualStart", "actualCompletion"];
        for (const f of dateFields) {
          if (filteredUpdates[f] !== void 0) {
            filteredUpdates[f] = filteredUpdates[f] ? new Date(filteredUpdates[f]) : null;
          }
        }
        if (filteredUpdates.actualCompletion) {
          const today = /* @__PURE__ */ new Date();
          today.setHours(23, 59, 59, 999);
          if (filteredUpdates.actualCompletion > today) {
            throw new Error("Actual completion date cannot be set in the future");
          }
        }
        const auditLogData = [];
        for (const [field, newVal] of Object.entries(filteredUpdates)) {
          let oldValStr = apt[field] === null ? "" : String(apt[field]);
          if (apt[field] instanceof Date) oldValStr = apt[field].toISOString();
          let newValStr = newVal === null ? "" : String(newVal);
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
    console.error("Batch update error:", err);
    return res.status(500).json({ error: "Internal server error in batch update" });
  }
}
async function getAuditLogs(req, res) {
  const { apartmentId } = req.params;
  try {
    const logs = await prisma5.auditLog.findMany({
      where: { apartmentId },
      include: {
        user: {
          select: {
            name: true,
            role: true
          }
        }
      },
      orderBy: { changedAt: "desc" }
    });
    return res.json(logs);
  } catch (err) {
    return res.status(500).json({ error: "Internal server error fetching logs" });
  }
}
var prisma5, ROLE_A_FIELDS;
var init_apartmentController = __esm({
  "../backend/src/controllers/apartmentController.js"() {
    init_calculationService();
    prisma5 = new PrismaClient5();
    ROLE_A_FIELDS = ["srNo", "apartmentNo", "floor", "priority", "kitchenQty", "wardrobeQty", "vanityQty", "responsibleEngineer", "supervisorName", "kitchenType", "wardrobeType", "vanityType"];
  }
});

// ../backend/src/services/billingService.js
function calculateContractorBillLine(line, apartments, setup) {
  const unitType = line.unitType;
  if (!unitType) return line;
  const product = unitType.product;
  const typeCode = unitType.typeCode;
  let allocatedUnits = 0;
  for (const apt of apartments) {
    if (apt.contractorName && apt.contractorName.trim().toLowerCase() === line.contractorName.trim().toLowerCase()) {
      if (product === "Kitchen") {
        const typeStr = apt.kitchenType;
        if (typeStr && typeStr.startsWith("[")) {
          try {
            const list = JSON.parse(typeStr);
            const found = list.find((item) => item.type === typeCode);
            if (found) allocatedUnits += found.qty || 0;
          } catch (e) {
          }
        } else if (apt.kitchenType === typeCode) {
          allocatedUnits += apt.kitchenQty || 0;
        }
      } else if (product === "Wardrobe") {
        const typeStr = apt.wardrobeType;
        if (typeStr && typeStr.startsWith("[")) {
          try {
            const list = JSON.parse(typeStr);
            const found = list.find((item) => item.type === typeCode);
            if (found) allocatedUnits += found.qty || 0;
          } catch (e) {
          }
        } else if (apt.wardrobeType === typeCode) {
          allocatedUnits += apt.wardrobeQty || 0;
        }
      } else if (product === "Vanity") {
        const typeStr = apt.vanityType;
        if (typeStr && typeStr.startsWith("[")) {
          try {
            const list = JSON.parse(typeStr);
            const found = list.find((item) => item.type === typeCode);
            if (found) allocatedUnits += found.qty || 0;
          } catch (e) {
          }
        } else if (apt.vanityType === typeCode) {
          allocatedUnits += apt.vanityQty || 0;
        }
      }
    }
  }
  const rate = unitType.contractorRate || 0;
  const woValue = rate * allocatedUnits;
  const eligibleUnits = line.eligibleUnitEquivalent || 0;
  const eligibilityPct = allocatedUnits > 0 ? eligibleUnits / allocatedUnits : 0;
  const cumulativeEligible = rate * eligibleUnits;
  const prevCertified = line.previousCertified || 0;
  const currentGross = Math.max(0, cumulativeEligible - prevCertified);
  const retentionPct = setup.contractorRetentionPct || 5;
  const gstPct = setup.contractorGSTPct || 18;
  const tdsPct = setup.contractorTDSPct || 1;
  const retentionAmt = currentGross * (retentionPct / 100);
  const gstAmt = currentGross * (gstPct / 100);
  const tdsAmt = currentGross * (tdsPct / 100);
  const otherDeduction = line.otherDeduction || 0;
  const netPayable = Math.max(0, currentGross - retentionAmt + gstAmt - tdsAmt - otherDeduction);
  return {
    ...line,
    rateUnit: rate,
    allocatedUnits,
    woValue: Math.round(woValue * 100) / 100,
    eligibilityPct: Math.round(eligibilityPct * 1e3) / 1e3,
    cumulativeEligible: Math.round(cumulativeEligible * 100) / 100,
    currentGross: Math.round(currentGross * 100) / 100,
    retentionAmt: Math.round(retentionAmt * 100) / 100,
    gstAmt: Math.round(gstAmt * 100) / 100,
    tdsAmt: Math.round(tdsAmt * 100) / 100,
    netPayable: Math.round(netPayable * 100) / 100
  };
}
function calculateClientRABillLine(line, apartments, setup, towerRatesOverride = []) {
  const unitType = line.unitType;
  if (!unitType) return line;
  const product = unitType.product;
  const typeCode = unitType.typeCode;
  const buildingId = line.buildingId;
  const aptWithQtys = [];
  for (const apt of apartments) {
    if (apt.buildingId !== buildingId) continue;
    if (product === "Kitchen") {
      const typeStr = apt.kitchenType;
      if (typeStr && typeStr.startsWith("[")) {
        try {
          const list = JSON.parse(typeStr);
          const found = list.find((item) => item.type === typeCode);
          if (found && found.qty > 0) {
            aptWithQtys.push({ apt, qty: found.qty });
          }
        } catch (e) {
        }
      } else if (apt.kitchenType === typeCode && (apt.kitchenQty || 0) > 0) {
        aptWithQtys.push({ apt, qty: apt.kitchenQty || 0 });
      }
    } else if (product === "Wardrobe") {
      const typeStr = apt.wardrobeType;
      if (typeStr && typeStr.startsWith("[")) {
        try {
          const list = JSON.parse(typeStr);
          const found = list.find((item) => item.type === typeCode);
          if (found && found.qty > 0) {
            aptWithQtys.push({ apt, qty: found.qty });
          }
        } catch (e) {
        }
      } else if (apt.wardrobeType === typeCode && (apt.wardrobeQty || 0) > 0) {
        aptWithQtys.push({ apt, qty: apt.wardrobeQty || 0 });
      }
    } else if (product === "Vanity") {
      const typeStr = apt.vanityType;
      if (typeStr && typeStr.startsWith("[")) {
        try {
          const list = JSON.parse(typeStr);
          const found = list.find((item) => item.type === typeCode);
          if (found && found.qty > 0) {
            aptWithQtys.push({ apt, qty: found.qty });
          }
        } catch (e) {
        }
      } else if (apt.vanityType === typeCode && (apt.vanityQty || 0) > 0) {
        aptWithQtys.push({ apt, qty: apt.vanityQty || 0 });
      }
    }
  }
  const unitsCount = aptWithQtys.reduce((sum, item) => sum + item.qty, 0);
  const override = towerRatesOverride.find((o) => o.buildingId === buildingId);
  let rate = unitType.clientRate || 0;
  if (override) {
    if (product === "Kitchen" && override.kitchenRate > 0) rate = override.kitchenRate;
    else if (product === "Wardrobe" && override.wardrobeRate > 0) rate = override.wardrobeRate;
    else if (product === "Vanity" && override.vanityRate > 0) rate = override.vanityRate;
  }
  const contractValue = unitsCount * rate;
  const milestones = setup.clientRAMilestones || [];
  const materialMilestones = milestones.filter((m) => m.product === product && m.recognitionType === "MATERIAL");
  const executionMilestones = milestones.filter((m) => m.product === product && m.recognitionType === "EXECUTION");
  const handoverMilestones = milestones.filter((m) => m.product === product && m.recognitionType === "HANDOVER");
  let sumMaterialPct = 0;
  let sumExecutionPct = 0;
  let sumHandoverPct = 0;
  if (aptWithQtys.length > 0) {
    for (const { apt, qty } of aptWithQtys) {
      let aptMatPct = 0;
      for (const m of materialMilestones) {
        const val = apt[m.fieldKey] || 0;
        const normalizedVal = Math.min(1, val / 100);
        aptMatPct += normalizedVal * m.percentage / 100;
      }
      sumMaterialPct += aptMatPct * qty;
      let aptExecPct = 0;
      for (const m of executionMilestones) {
        const val = apt[m.fieldKey] || 0;
        const normalizedVal = Math.min(1, val / 100);
        aptExecPct += normalizedVal * m.percentage / 100;
      }
      sumExecutionPct += aptExecPct * qty;
      let aptHandoverPct = 0;
      for (const m of handoverMilestones) {
        const qcGate = product === "Kitchen" ? apt.kitchenQCGate : product === "Wardrobe" ? apt.wardrobeQCGate : apt.vanityQCGate;
        const handedOver = product === "Kitchen" ? apt.kitchenHandedOver || 0 : product === "Wardrobe" ? apt.wardrobeHandedOver || 0 : apt.vanityHandedOver || 0;
        const normalizedVal = Math.min(1, handedOver / 100);
        if (qcGate === "Approved" && normalizedVal > 0) {
          aptHandoverPct += normalizedVal * m.percentage / 100;
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
  const overallEligPct = contractValue > 0 ? cumulativeEligible / contractValue : 0;
  const include = line.includeInCurrentRA ?? true;
  const prevCertified = line.previousCertified || 0;
  const currentGross = include ? Math.max(0, cumulativeEligible - prevCertified) : 0;
  const retentionPct = setup.clientRetentionPct || 5;
  const gstPct = setup.clientGSTPct || 18;
  const retentionAmt = currentGross * (retentionPct / 100);
  const gstAmt = currentGross * (gstPct / 100);
  const otherDeduction = line.otherDeduction || 0;
  const netRA = Math.max(0, currentGross - retentionAmt + gstAmt - otherDeduction);
  return {
    ...line,
    unitsCount,
    rateUnit: rate,
    contractValue: Math.round(contractValue * 100) / 100,
    materialEligibilityPct: Math.round(sumMaterialPct * 1e3) / 1e3,
    materialEligibleAmt: Math.round(materialEligibleAmt * 100) / 100,
    executionEligibilityPct: Math.round(sumExecutionPct * 1e3) / 1e3,
    executionEligibleAmt: Math.round(executionEligibleAmt * 100) / 100,
    handoverEligibilityPct: Math.round(sumHandoverPct * 1e3) / 1e3,
    handoverEligibleAmt: Math.round(handoverEligibleAmt * 100) / 100,
    cumulativeEligible: Math.round(cumulativeEligible * 100) / 100,
    overallEligPct: Math.round(overallEligPct * 1e3) / 1e3,
    currentGross: Math.round(currentGross * 100) / 100,
    retentionAmt: Math.round(retentionAmt * 100) / 100,
    gstAmt: Math.round(gstAmt * 100) / 100,
    netRA: Math.round(netRA * 100) / 100
  };
}
var init_billingService = __esm({
  "../backend/src/services/billingService.js"() {
  }
});

// ../backend/src/controllers/billingController.js
import { PrismaClient as PrismaClient6 } from "file:///C:/Users/hp/Downloads/Dio%20Grace%20(3)/Dio%20Grace%20(3)/Dio%20Gracee/backend/node_modules/@prisma/client/default.js";
async function getBillingSetup(req, res) {
  const { orderId } = req.params;
  try {
    const setup = await prisma6.billingSetup.findUnique({
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
      return res.status(404).json({ error: "Billing setup not found for this order" });
    }
    return res.json(setup);
  } catch (err) {
    return res.status(500).json({ error: "Internal server error getting setup" });
  }
}
async function updateBillingSetup(req, res) {
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
    if (req.user.role !== "ROLE_A") {
      return res.status(403).json({ error: "Only Setup role (A) can modify setup" });
    }
    const currentSetup = await prisma6.billingSetup.findUnique({
      where: { orderId }
    });
    if (!currentSetup) {
      return res.status(404).json({ error: "Billing setup not found" });
    }
    if (contractorMilestones) {
      const productGroups = {};
      for (const m of contractorMilestones) {
        productGroups[m.product] = (productGroups[m.product] || 0) + parseFloat(m.percentage);
      }
      for (const [prod, sum] of Object.entries(productGroups)) {
        if (Math.abs(sum - 100) > 0.01) {
          return res.status(400).json({ error: `Contractor Milestones for product ${prod} must sum to 100%. Got ${sum}%` });
        }
      }
    }
    const globalMat = clientMatEligiblePct !== void 0 ? parseFloat(clientMatEligiblePct) : currentSetup.clientMatEligiblePct || 0;
    const globalExec = clientExecEligiblePct !== void 0 ? parseFloat(clientExecEligiblePct) : currentSetup.clientExecEligiblePct || 0;
    const globalHandover = clientHandoverEligiblePct !== void 0 ? parseFloat(clientHandoverEligiblePct) : currentSetup.clientHandoverEligiblePct || 0;
    const globalSum = globalMat + globalExec + globalHandover;
    if (Math.abs(globalSum - 100) > 0.01) {
      return res.status(400).json({ error: `Client Eligibility settings (Material + Execution + Handover) must sum to exactly 100%. Got ${globalSum}%` });
    }
    if (clientRAMilestones) {
      const products = ["Kitchen", "Wardrobe", "Vanity"];
      for (const p of products) {
        const matSum = clientRAMilestones.filter((m) => m.product === p && m.recognitionType === "MATERIAL").reduce((sum, m) => sum + parseFloat(m.percentage || 0), 0);
        if (Math.abs(matSum - globalMat) > 0.01) {
          return res.status(400).json({ error: `Client Material milestones for product ${p} must sum to exactly ${globalMat}%. Got ${matSum}%` });
        }
        const execSum = clientRAMilestones.filter((m) => m.product === p && m.recognitionType === "EXECUTION").reduce((sum, m) => sum + parseFloat(m.percentage || 0), 0);
        if (Math.abs(execSum - globalExec) > 0.01) {
          return res.status(400).json({ error: `Client Execution milestones for product ${p} must sum to exactly ${globalExec}%. Got ${execSum}%` });
        }
        const handoverSum = clientRAMilestones.filter((m) => m.product === p && m.recognitionType === "HANDOVER").reduce((sum, m) => sum + parseFloat(m.percentage || 0), 0);
        if (Math.abs(handoverSum - globalHandover) > 0.01) {
          return res.status(400).json({ error: `Client Handover milestones for product ${p} must sum to exactly ${globalHandover}%. Got ${handoverSum}%` });
        }
      }
    }
    const updated = await prisma6.$transaction(async (tx) => {
      const bs = await tx.billingSetup.update({
        where: { orderId },
        data: {
          contractorRetentionPct: contractorRetentionPct !== void 0 ? parseFloat(contractorRetentionPct) : void 0,
          contractorGSTPct: contractorGSTPct !== void 0 ? parseFloat(contractorGSTPct) : void 0,
          contractorTDSPct: contractorTDSPct !== void 0 ? parseFloat(contractorTDSPct) : void 0,
          clientRetentionPct: clientRetentionPct !== void 0 ? parseFloat(clientRetentionPct) : void 0,
          clientGSTPct: clientGSTPct !== void 0 ? parseFloat(clientGSTPct) : void 0,
          clientOtherDeduction: clientOtherDeduction !== void 0 ? parseFloat(clientOtherDeduction) : void 0,
          clientMatEligiblePct: clientMatEligiblePct !== void 0 ? parseFloat(clientMatEligiblePct) : void 0,
          clientExecEligiblePct: clientExecEligiblePct !== void 0 ? parseFloat(clientExecEligiblePct) : void 0,
          clientHandoverEligiblePct: clientHandoverEligiblePct !== void 0 ? parseFloat(clientHandoverEligiblePct) : void 0,
          billingPeriodFrom: billingPeriodFrom ? new Date(billingPeriodFrom) : null,
          billingPeriodTo: billingPeriodTo ? new Date(billingPeriodTo) : null,
          billDate: billDate ? new Date(billDate) : null
        }
      });
      if (unitTypeRates && Array.isArray(unitTypeRates)) {
        await tx.unitTypeRate.deleteMany({ where: { billingSetupId: bs.id } });
        await tx.unitTypeRate.createMany({
          data: unitTypeRates.map((ut) => ({
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
      if (contractorMilestones && Array.isArray(contractorMilestones)) {
        await tx.contractorMilestone.deleteMany({ where: { billingSetupId: bs.id } });
        await tx.contractorMilestone.createMany({
          data: contractorMilestones.map((m) => ({
            billingSetupId: bs.id,
            product: m.product,
            milestoneName: m.milestoneName,
            percentage: parseFloat(m.percentage || 0)
          }))
        });
      }
      if (clientRAMilestones && Array.isArray(clientRAMilestones)) {
        await tx.clientRAMilestone.deleteMany({ where: { billingSetupId: bs.id } });
        await tx.clientRAMilestone.createMany({
          data: clientRAMilestones.map((m) => ({
            billingSetupId: bs.id,
            product: m.product,
            recognitionType: m.recognitionType,
            milestoneName: m.milestoneName,
            fieldKey: m.fieldKey,
            percentage: parseFloat(m.percentage || 0)
          }))
        });
      }
      if (towerClientRates && Array.isArray(towerClientRates)) {
        await tx.towerClientRate.deleteMany({ where: { billingSetupId: bs.id } });
        await tx.towerClientRate.createMany({
          data: towerClientRates.map((tr) => ({
            billingSetupId: bs.id,
            buildingId: tr.buildingId,
            kitchenRate: parseFloat(tr.kitchenRate || 0),
            wardrobeRate: parseFloat(tr.wardrobeRate || 0),
            vanityRate: parseFloat(tr.vanityRate || 0)
          }))
        });
      }
      return bs;
    });
    return res.json({ success: true, setup: updated });
  } catch (err) {
    console.error("Update setup error:", err);
    return res.status(500).json({ error: "Internal server error updating billing setup" });
  }
}
async function getContractorBill(req, res) {
  const { orderId } = req.params;
  try {
    const setup = await prisma6.billingSetup.findUnique({
      where: { orderId },
      include: { unitTypeRates: true }
    });
    if (!setup) return res.status(404).json({ error: "Billing setup not found" });
    const apartments = await prisma6.apartment.findMany({
      where: {
        building: { orderId }
      }
    });
    const contractors = [...new Set(apartments.map((a) => a.contractorName).filter(Boolean))];
    const savedLines = await prisma6.contractorBillLine.findMany({
      where: { orderId },
      include: { unitType: true }
    });
    const lines = [];
    for (const contractorName of contractors) {
      for (const ut of setup.unitTypeRates) {
        let savedLine = savedLines.find(
          (l) => l.contractorName.toLowerCase() === contractorName.toLowerCase() && l.unitTypeId === ut.id
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
            billNo: "",
            billDate: null,
            remarks: ""
          };
        } else {
          savedLine.unitType = ut;
        }
        const calculated = calculateContractorBillLine(savedLine, apartments, setup);
        if (calculated.allocatedUnits > 0) {
          lines.push(calculated);
        }
      }
    }
    return res.json({ setup, lines });
  } catch (err) {
    console.error("Get contractor bill error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
async function upsertContractorBillLines(req, res) {
  const { orderId } = req.params;
  const { lines } = req.body;
  try {
    if (req.user.role !== "ROLE_A" && req.user.role !== "ROLE_B") {
      return res.status(403).json({ error: "Only Execution role (B) or Admin (A) can enter bill line items" });
    }
    if (!lines || !Array.isArray(lines)) {
      return res.status(400).json({ error: "Lines array is required" });
    }
    const saved = [];
    for (const line of lines) {
      const data = {
        orderId,
        contractorName: line.contractorName,
        unitTypeId: line.unitTypeId,
        eligibleUnitEquivalent: parseFloat(line.eligibleUnitEquivalent || 0),
        previousCertified: parseFloat(line.previousCertified || 0),
        otherDeduction: parseFloat(line.otherDeduction || 0),
        billNo: line.billNo || "",
        billDate: line.billDate ? new Date(line.billDate) : null,
        remarks: line.remarks || ""
      };
      if (line.id && !line.id.startsWith("temp_")) {
        const item = await prisma6.contractorBillLine.update({
          where: { id: line.id },
          data
        });
        saved.push(item);
      } else {
        const existing = await prisma6.contractorBillLine.findFirst({
          where: {
            orderId,
            contractorName: line.contractorName,
            unitTypeId: line.unitTypeId
          }
        });
        if (existing) {
          const item = await prisma6.contractorBillLine.update({
            where: { id: existing.id },
            data
          });
          saved.push(item);
        } else {
          const item = await prisma6.contractorBillLine.create({
            data
          });
          saved.push(item);
        }
      }
    }
    return res.json({ success: true, count: saved.length });
  } catch (err) {
    console.error("Upsert contractor lines error:", err);
    return res.status(500).json({ error: "Internal server error saving contractor bills" });
  }
}
async function getClientRABill(req, res) {
  const { orderId } = req.params;
  try {
    const setup = await prisma6.billingSetup.findUnique({
      where: { orderId },
      include: {
        unitTypeRates: true,
        clientRAMilestones: true
      }
    });
    if (!setup) return res.status(404).json({ error: "Billing setup not found" });
    const buildings = await prisma6.building.findMany({
      where: { orderId }
    });
    const apartments = await prisma6.apartment.findMany({
      where: {
        building: { orderId }
      }
    });
    const overrides = await prisma6.towerClientRate.findMany({
      where: { billingSetupId: setup.id }
    });
    const savedLines = await prisma6.clientRABillLine.findMany({
      where: { orderId },
      include: { unitType: true }
    });
    const lines = [];
    for (const building of buildings) {
      for (const ut of setup.unitTypeRates) {
        let savedLine = savedLines.find(
          (l) => l.buildingId === building.id && l.unitTypeId === ut.id
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
            raBillNo: "",
            raBillDate: null,
            remarks: ""
          };
        } else {
          savedLine.unitType = ut;
          savedLine.buildingName = building.name;
        }
        const calculated = calculateClientRABillLine(savedLine, apartments, setup, overrides);
        if (calculated.unitsCount > 0) {
          lines.push(calculated);
        }
      }
    }
    return res.json({ setup, lines });
  } catch (err) {
    console.error("Get client RA bill error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
async function upsertClientRABillLines(req, res) {
  const { orderId } = req.params;
  const { lines } = req.body;
  try {
    if (req.user.role !== "ROLE_A" && req.user.role !== "ROLE_B") {
      return res.status(403).json({ error: "Only Execution role (B) or Admin (A) can enter bill line items" });
    }
    if (!lines || !Array.isArray(lines)) {
      return res.status(400).json({ error: "Lines array is required" });
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
        raBillNo: line.raBillNo || "",
        raBillDate: line.raBillDate ? new Date(line.raBillDate) : null,
        remarks: line.remarks || ""
      };
      if (line.id && !line.id.startsWith("temp_")) {
        const item = await prisma6.clientRABillLine.update({
          where: { id: line.id },
          data
        });
        saved.push(item);
      } else {
        const existing = await prisma6.clientRABillLine.findFirst({
          where: {
            orderId,
            buildingId: line.buildingId,
            unitTypeId: line.unitTypeId
          }
        });
        if (existing) {
          const item = await prisma6.clientRABillLine.update({
            where: { id: existing.id },
            data
          });
          saved.push(item);
        } else {
          const item = await prisma6.clientRABillLine.create({
            data
          });
          saved.push(item);
        }
      }
    }
    return res.json({ success: true, count: saved.length });
  } catch (err) {
    console.error("Upsert client lines error:", err);
    return res.status(500).json({ error: "Internal server error saving client RA bills" });
  }
}
async function getBillingDashboard(req, res) {
  const { orderId } = req.params;
  try {
    const setup = await prisma6.billingSetup.findUnique({
      where: { orderId },
      include: {
        unitTypeRates: true,
        clientRAMilestones: true
      }
    });
    if (!setup) return res.status(404).json({ error: "Billing setup not found" });
    const apartments = await prisma6.apartment.findMany({
      where: { building: { orderId } }
    });
    const overrides = await prisma6.towerClientRate.findMany({
      where: { billingSetupId: setup.id }
    });
    const savedContractorLines = await prisma6.contractorBillLine.findMany({
      where: { orderId },
      include: { unitType: true }
    });
    const contractors = [...new Set(apartments.map((a) => a.contractor).filter(Boolean))];
    const contractorBillLines = [];
    for (const cName of contractors) {
      for (const ut of setup.unitTypeRates) {
        let line = savedContractorLines.find(
          (l) => l.contractorName.toLowerCase() === cName.toLowerCase() && l.unitTypeId === ut.id
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
    const buildings = await prisma6.building.findMany({ where: { orderId } });
    const savedClientLines = await prisma6.clientRABillLine.findMany({
      where: { orderId },
      include: { unitType: true }
    });
    const clientRABillLines = [];
    for (const building of buildings) {
      for (const ut of setup.unitTypeRates) {
        let line = savedClientLines.find(
          (l) => l.buildingId === building.id && l.unitTypeId === ut.id
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
    const contractorWOValue = contractorBillLines.reduce((sum, l) => sum + (l.woValue || 0), 0);
    const contractorCumulativeEligible = contractorBillLines.reduce((sum, l) => sum + (l.cumulativeEligible || 0), 0);
    const contractorNetPayable = contractorBillLines.reduce((sum, l) => sum + (l.netPayable || 0), 0);
    const clientContractValue = clientRABillLines.reduce((sum, l) => sum + (l.contractValue || 0), 0);
    const clientCumulativeEligible = clientRABillLines.reduce((sum, l) => sum + (l.cumulativeEligible || 0), 0);
    const clientCurrentGrossSelectedRA = clientRABillLines.filter((l) => l.includeInCurrentRA === true).reduce((sum, l) => sum + (l.currentGross || 0), 0);
    const billingSurplus = clientCurrentGrossSelectedRA - contractorNetPayable;
    const clientEligibilityPct = clientContractValue > 0 ? clientCumulativeEligible / clientContractValue : 0;
    const unitTypeMap = {};
    for (const l of clientRABillLines) {
      const ut = l.unitType;
      if (!unitTypeMap[ut.typeCode]) {
        unitTypeMap[ut.typeCode] = {
          typeCode: ut.typeCode,
          product: ut.product,
          units: 0,
          contractValue: 0,
          materialEligibleAmt: 0,
          executionEligibleAmt: 0,
          handoverEligibleAmt: 0
        };
      }
      unitTypeMap[ut.typeCode].units += l.unitsCount || 0;
      unitTypeMap[ut.typeCode].contractValue += l.contractValue || 0;
      unitTypeMap[ut.typeCode].materialEligibleAmt += l.materialEligibleAmt || 0;
      unitTypeMap[ut.typeCode].executionEligibleAmt += l.executionEligibleAmt || 0;
      unitTypeMap[ut.typeCode].handoverEligibleAmt += l.handoverEligibleAmt || 0;
    }
    const unitTypeTable = Object.values(unitTypeMap).map((row) => ({
      ...row,
      contractValue: Math.round(row.contractValue),
      materialEligibleAmt: Math.round(row.materialEligibleAmt),
      executionEligibleAmt: Math.round(row.executionEligibleAmt),
      handoverEligibleAmt: Math.round(row.handoverEligibleAmt)
    }));
    const contractorTableMap = {};
    for (const l of contractorBillLines) {
      if (l.allocatedUnits === 0) continue;
      const key = `${l.contractorName}_${l.unitType.typeCode}`;
      contractorTableMap[key] = {
        contractor: l.contractorName,
        unitType: l.unitType.typeCode,
        eligibilityPct: Math.round(l.eligibilityPct * 1e3) / 10,
        // display as %
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
        clientEligibilityPct: Math.round(clientEligibilityPct * 1e3) / 1e3
      },
      unitTypeTable,
      contractorTable
    });
  } catch (err) {
    console.error("Get billing dashboard error:", err);
    return res.status(500).json({ error: "Internal server error calculating billing dashboard" });
  }
}
var prisma6;
var init_billingController = __esm({
  "../backend/src/controllers/billingController.js"() {
    init_billingService();
    prisma6 = new PrismaClient6();
  }
});

// ../backend/src/controllers/exportController.js
import { PrismaClient as PrismaClient7 } from "file:///C:/Users/hp/Downloads/Dio%20Grace%20(3)/Dio%20Grace%20(3)/Dio%20Gracee/backend/node_modules/@prisma/client/default.js";
import ExcelJS from "file:///C:/Users/hp/Downloads/Dio%20Grace%20(3)/Dio%20Grace%20(3)/Dio%20Gracee/backend/node_modules/exceljs/excel.js";
async function exportBuildingGrid(req, res) {
  const { buildingId } = req.params;
  try {
    const building = await prisma7.building.findUnique({
      where: { id: buildingId },
      include: {
        order: {
          select: { orderNumber: true }
        }
      }
    });
    if (!building) {
      return res.status(404).json({ error: "Building not found" });
    }
    const apartments = await prisma7.apartment.findMany({
      where: { buildingId },
      orderBy: { srNo: "asc" }
    });
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(building.name);
    const headerFill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" }
    };
    const groupFills = {
      group1: { type: "pattern", pattern: "solid", fgColor: { argb: "FFD2EBD4" } },
      // Light green
      group2: { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8F0FE" } },
      // Light blue
      group3: { type: "pattern", pattern: "solid", fgColor: { argb: "FFFCE8E6" } },
      // Light red
      group4: { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEEFC3" } },
      // Light yellow
      group5: { type: "pattern", pattern: "solid", fgColor: { argb: "FFE6C2FF" } },
      // Light purple
      group6: { type: "pattern", pattern: "solid", fgColor: { argb: "FFE4F2E7" } },
      // Mint
      group7: { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFEBEE" } },
      // Rose
      group8: { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3E5F5" } }
      // Lavender
    };
    const columns = [
      // Group 1
      { header: "Sr No", key: "srNo", width: 8, group: "group1" },
      { header: "Apartment No", key: "apartmentNo", width: 15, group: "group1" },
      { header: "Floor", key: "floor", width: 10, group: "group1" },
      { header: "Priority", key: "priority", width: 12, group: "group1" },
      { header: "Kitchen Qty", key: "kitchenQty", width: 12, group: "group1" },
      { header: "Wardrobe Qty", key: "wardrobeQty", width: 14, group: "group1" },
      { header: "Vanity Qty", key: "vanityQty", width: 12, group: "group1" },
      // Group 2
      { header: "Kit Lower Inw", key: "kitchenLowerCarcassInward", width: 14, group: "group2" },
      { header: "Kit Upper Inw", key: "kitchenUpperCarcassInward", width: 14, group: "group2" },
      { header: "Kit Stone Inw", key: "kitchenStoneInward", width: 14, group: "group2" },
      { header: "Kit Shutters Inw", key: "kitchenShutterInward", width: 15, group: "group2" },
      { header: "Kit Hardware Inw", key: "kitchenHardwareInward", width: 15, group: "group2" },
      { header: "Kit Appliances Inw", key: "kitchenApplianceInward", width: 16, group: "group2" },
      { header: "Ward Cabinets Inw", key: "wardrobeCabinetInward", width: 16, group: "group2" },
      { header: "Ward Shutter Hdw Inw", key: "wardrobeShutterHardwareInward", width: 20, group: "group2" },
      { header: "Van Cabinets Inw", key: "vanityCabinetInward", width: 16, group: "group2" },
      { header: "Van Shutter Hdw Inw", key: "vanityShutterHardwareInward", width: 20, group: "group2" },
      // Group 3
      { header: "Kit Lower Inst", key: "kitchenLowerCarcassInstalled", width: 14, group: "group3" },
      { header: "Kit Upper Inst", key: "kitchenUpperCarcassInstalled", width: 14, group: "group3" },
      { header: "Kit Stone Inst", key: "kitchenStoneInstalled", width: 14, group: "group3" },
      { header: "Kit Shutters Hdw Inst", key: "kitchenShutterHardwareInstalled", width: 20, group: "group3" },
      { header: "Kit Appliances Inst", key: "kitchenApplianceInstalled", width: 18, group: "group3" },
      { header: "Kit Handed Over", key: "kitchenHandedOver", width: 16, group: "group3" },
      { header: "Ward Cabinets Inst", key: "wardrobeCabinetInstalled", width: 18, group: "group3" },
      { header: "Ward Shutter Hdw Inst", key: "wardrobeShutterHardwareInstalled", width: 22, group: "group3" },
      { header: "Ward Handed Over", key: "wardrobeHandedOver", width: 18, group: "group3" },
      { header: "Van Cabinets Inst", key: "vanityCabinetInstalled", width: 18, group: "group3" },
      { header: "Van Shutter Hdw Inst", key: "vanityShutterHardwareInstalled", width: 22, group: "group3" },
      { header: "Van Handed Over", key: "vanityHandedOver", width: 18, group: "group3" },
      // Group 4
      { header: "Planned Start", key: "plannedStart", width: 15, group: "group4" },
      { header: "Planned Comp", key: "plannedCompletion", width: 15, group: "group4" },
      { header: "Actual Start", key: "actualStart", width: 15, group: "group4" },
      { header: "Actual Comp", key: "actualCompletion", width: 15, group: "group4" },
      { header: "Responsible Eng", key: "responsibleEngineer", width: 18, group: "group4" },
      { header: "Contractor", key: "contractor", width: 15, group: "group4" },
      { header: "Delay Reason", key: "delayReason", width: 20, group: "group4" },
      { header: "Remarks", key: "remarks", width: 25, group: "group4" },
      // Group 5
      { header: "Mat Inward %", key: "materialInwardPct", width: 15, group: "group5" },
      { header: "Kit Comp %", key: "kitchenCompletionPct", width: 12, group: "group5" },
      { header: "Ward Comp %", key: "wardrobeCompletionPct", width: 14, group: "group5" },
      { header: "Van Comp %", key: "vanityCompletionPct", width: 12, group: "group5" },
      { header: "Overall Comp %", key: "overallCompletionPct", width: 15, group: "group5" },
      { header: "Apt Status", key: "apartmentStatus", width: 18, group: "group5" },
      { header: "Delay Days", key: "delayDays", width: 12, group: "group5" },
      { header: "Health", key: "health", width: 12, group: "group5" },
      // Group 6
      { header: "Kit QC: Screws", key: "kitchenQC_VisibleScrews", width: 16, group: "group6" },
      { header: "Kit QC: Chips", key: "kitchenQC_Chipping", width: 16, group: "group6" },
      { header: "Kit QC: Filler", key: "kitchenQC_FillerMissing", width: 16, group: "group6" },
      { header: "Kit QC: Scratches", key: "kitchenQC_Scratches", width: 16, group: "group6" },
      { header: "Kit QC: Drawers", key: "kitchenQC_DrawersFunction", width: 16, group: "group6" },
      { header: "Kit QC: Cutlery", key: "kitchenQC_CutleryTray", width: 16, group: "group6" },
      { header: "Kit QC: Drainer", key: "kitchenQC_DishDrainer", width: 16, group: "group6" },
      { header: "Ward QC: Screws", key: "wardrobeQC_VisibleScrews", width: 16, group: "group6" },
      { header: "Ward QC: Chips", key: "wardrobeQC_Chipping", width: 16, group: "group6" },
      { header: "Ward QC: Filler", key: "wardrobeQC_FillerMissing", width: 16, group: "group6" },
      { header: "Ward QC: Scratches", key: "wardrobeQC_Scratches", width: 16, group: "group6" },
      { header: "Ward QC: Drawers", key: "wardrobeQC_DrawersFunction", width: 16, group: "group6" },
      { header: "Van QC: Screws", key: "vanityQC_VisibleScrews", width: 16, group: "group6" },
      { header: "Van QC: Chips", key: "vanityQC_Chipping", width: 16, group: "group6" },
      { header: "Van QC: Filler", key: "vanityQC_FillerMissing", width: 16, group: "group6" },
      { header: "Van QC: Scratches", key: "vanityQC_Scratches", width: 16, group: "group6" },
      { header: "Van QC: Drawers", key: "vanityQC_DrawersFunction", width: 16, group: "group6" },
      // Group 7
      { header: "Kit QC Gate", key: "kitchenQCGate", width: 14, group: "group7" },
      { header: "Ward QC Gate", key: "wardrobeQCGate", width: 15, group: "group7" },
      { header: "Van QC Gate", key: "vanityQCGate", width: 14, group: "group7" },
      { header: "Handover Status", key: "handoverApprovalStatus", width: 22, group: "group7" },
      // Group 8
      { header: "Kit Type", key: "kitchenType", width: 12, group: "group8" },
      { header: "Ward Type", key: "wardrobeType", width: 12, group: "group8" },
      { header: "Van Type", key: "vanityType", width: 12, group: "group8" }
    ];
    worksheet.columns = columns.map((c) => ({
      header: c.header,
      key: c.key,
      width: c.width
    }));
    const headerRow = worksheet.getRow(1);
    headerRow.height = 30;
    columns.forEach((col, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.fill = groupFills[col.group];
      cell.font = { bold: true, name: "Calibri", size: 11 };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "medium" },
        right: { style: "thin" }
      };
    });
    apartments.forEach((apt) => {
      const rowData = {};
      columns.forEach((col) => {
        let val = apt[col.key];
        if (val instanceof Date) {
          val = val.toISOString().split("T")[0];
        }
        if (col.key.endsWith("Pct")) {
          val = `${(val * 100).toFixed(1)}%`;
        }
        if ((col.key === "wardrobeType" || col.key === "vanityType") && typeof val === "string" && val.startsWith("[")) {
          try {
            const list = JSON.parse(val);
            val = list.map((item) => `${item.type} (${item.qty})`).join(", ");
          } catch (e) {
          }
        }
        rowData[col.key] = val !== null ? val : "";
      });
      const row = worksheet.addRow(rowData);
      row.height = 20;
      columns.forEach((col, idx) => {
        const cell = row.getCell(idx + 1);
        cell.alignment = { vertical: "middle", horizontal: "left" };
        if (typeof cell.value === "number" || col.key.endsWith("Pct") || col.key === "srNo") {
          cell.alignment = { vertical: "middle", horizontal: "center" };
        }
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" }
        };
      });
    });
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Grid_${building.name.replace(/\s+/g, "_")}.xlsx`
    );
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Export Excel error:", err);
    return res.status(500).json({ error: "Internal server error exporting building data" });
  }
}
var prisma7;
var init_exportController = __esm({
  "../backend/src/controllers/exportController.js"() {
    prisma7 = new PrismaClient7();
  }
});

// ../backend/src/controllers/analyticsController.js
import { PrismaClient as PrismaClient8 } from "file:///C:/Users/hp/Downloads/Dio%20Grace%20(3)/Dio%20Grace%20(3)/Dio%20Gracee/backend/node_modules/@prisma/client/default.js";
async function getProjectAnalytics(req, res) {
  const { orderId } = req.params;
  try {
    const order = await prisma8.order.findUnique({
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
      return res.status(404).json({ error: "Order project not found" });
    }
    const buildings = await prisma8.building.findMany({
      where: { orderId },
      include: {
        apartments: true
      },
      orderBy: { name: "asc" }
    });
    const allApartments = buildings.flatMap((b) => b.apartments);
    const towerSummary = [];
    let siteApartments = allApartments.length;
    let siteKitchenUnits = 0;
    let siteWardrobeUnits = 0;
    let siteVanityUnits = 0;
    let siteSumMatInward = 0;
    let siteSumKitchenComp = 0;
    let siteSumWardrobeComp = 0;
    let siteSumVanityComp = 0;
    let siteSumOverallComp = 0;
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
    for (const b of buildings) {
      const apartmentsCount = b.apartments.length;
      let kitchenUnits = 0;
      let wardrobeUnits = 0;
      let vanityUnits = 0;
      let sumMatInward = 0;
      let sumKitchenComp = 0;
      let sumWardrobeComp = 0;
      let sumVanityComp = 0;
      let sumOverallComp = 0;
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
      for (const apt of b.apartments) {
        const kQty = apt.kitchenQty || 0;
        const wQty = apt.wardrobeQty || 0;
        const vQty = apt.vanityQty || 0;
        const tQty = kQty + wQty + vQty;
        kitchenUnits += kQty;
        wardrobeUnits += wQty;
        vanityUnits += vQty;
        totalQty += tQty;
        kitchenQty += kQty;
        wardrobeQty += wQty;
        vanityQty += vQty;
        sumMatInward += (apt.materialInwardPct || 0) * tQty;
        sumKitchenComp += (apt.kitchenCompletionPct || 0) * kQty;
        sumWardrobeComp += (apt.wardrobeCompletionPct || 0) * wQty;
        sumVanityComp += (apt.vanityCompletionPct || 0) * vQty;
        sumOverallComp += (apt.overallCompletionPct || 0) * tQty;
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
        if (apt.health === "Delayed") delayedCount++;
        if (apt.health === "Critical") criticalCount++;
        if (apt.handoverApprovalStatus === "QC Pending") qcPendingCount++;
        if (apt.handoverApprovalStatus === "QC Rejected") qcRejectedCount++;
      }
      siteKitchenUnits += kitchenUnits;
      siteWardrobeUnits += wardrobeUnits;
      siteVanityUnits += vanityUnits;
      siteSumMatInward += sumMatInward;
      siteSumKitchenComp += sumKitchenComp;
      siteSumWardrobeComp += sumWardrobeComp;
      siteSumVanityComp += sumVanityComp;
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
      const materialInwardPct = totalQty > 0 ? sumMatInward / totalQty : 0;
      const kitchenCompletionPct = kitchenQty > 0 ? sumKitchenComp / kitchenQty : 0;
      const wardrobeCompletionPct = wardrobeQty > 0 ? sumWardrobeComp / wardrobeQty : 0;
      const vanityCompletionPct = vanityQty > 0 ? sumVanityComp / vanityQty : 0;
      const overallCompletionPct = totalQty > 0 ? sumOverallComp / totalQty : 0;
      let health = "Watch";
      if (apartmentsCount === 0) {
        health = "No Data";
      } else {
        const hasCriticalApt = b.apartments.some(
          (apt) => apt.handoverApprovalStatus === "QC Rejected" || apt.health === "Critical"
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
        materialInwardPct,
        kitchenCompletionPct,
        wardrobeCompletionPct,
        vanityCompletionPct,
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
    const siteMaterialInwardPct = siteTotalQty > 0 ? siteSumMatInward / siteTotalQty : 0;
    const siteKitchenCompletionPct = siteKitchenQty > 0 ? siteSumKitchenComp / siteKitchenQty : 0;
    const siteWardrobeCompletionPct = siteWardrobeQty > 0 ? siteSumWardrobeComp / siteWardrobeQty : 0;
    const siteVanityCompletionPct = siteVanityQty > 0 ? siteSumVanityComp / siteVanityQty : 0;
    const siteOverallCompletionPct = siteTotalQty > 0 ? siteSumOverallComp / siteTotalQty : 0;
    let siteHealth = "Watch";
    if (siteApartments === 0) {
      siteHealth = "No Data";
    } else {
      const hasCriticalApt = allApartments.some(
        (apt) => apt.handoverApprovalStatus === "QC Rejected" || apt.health === "Critical"
      );
      if (hasCriticalApt) {
        siteHealth = "Critical";
      } else if (siteDelayed > 25) {
        siteHealth = "Delayed";
      } else if (siteOverallCompletionPct >= 0.9) {
        siteHealth = "Excellent";
      } else if (siteOverallCompletionPct >= 0.75) {
        siteHealth = "Good";
      } else {
        siteHealth = "Watch";
      }
    }
    towerSummary.push({
      id: "site-total",
      tower: "TOTAL / SITE",
      apartments: siteApartments,
      kitchenUnits: siteKitchenUnits,
      wardrobeUnits: siteWardrobeUnits,
      vanityUnits: siteVanityUnits,
      materialInwardPct: siteMaterialInwardPct,
      kitchenCompletionPct: siteKitchenCompletionPct,
      wardrobeCompletionPct: siteWardrobeCompletionPct,
      vanityCompletionPct: siteVanityCompletionPct,
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
    const typeSummary = [];
    const unitTypeRates = order.billingSetup?.unitTypeRates || [];
    for (const ut of unitTypeRates) {
      const typeCode = ut.typeCode;
      const product = ut.product;
      const typeName = ut.typeName;
      const clientRate = ut.clientRate || 0;
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
      }
      let units = 0;
      let sumMatInwardType = 0;
      let sumExecType = 0;
      let approvedHandedOverCount = 0;
      for (const apt of allApartments) {
        const typeStr = apt[typeField];
        if (!typeStr) continue;
        let qty = 0;
        if (typeStr.startsWith("[")) {
          try {
            const list = JSON.parse(typeStr);
            const found = list.find((item) => item.type === typeCode);
            if (found) qty = found.qty || 0;
          } catch (e) {
          }
        } else {
          if (typeStr === typeCode) {
            qty = apt[qtyField] || 0;
          }
        }
        if (qty > 0) {
          units += qty;
          sumMatInwardType += (apt.materialInwardPct || 0) * qty;
          sumExecType += (apt[completionField] || 0) * qty;
          const isApproved = apt[qcGateField] === "Approved";
          if (isApproved) {
            const handoverPct = (apt[handedOverField] || 0) / 100;
            approvedHandedOverCount += qty * Math.min(1, Math.max(0, handoverPct));
          }
        }
      }
      const materialReceivedPct = units > 0 ? sumMatInwardType / units : 0;
      const executionPct = units > 0 ? sumExecType / units : 0;
      const qcHandoverPct = units > 0 ? approvedHandedOverCount / units : 0;
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
    const stageAnalysis = {
      headers: [...buildings.map((b) => b.name), "Site Average"],
      rows: []
    };
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
        const val = qtySum > 0 ? fieldSum / qtySum / 100 : 0;
        values.push(val);
      }
      const siteVal = totalQtySum > 0 ? totalFieldSum / totalQtySum / 100 : 0;
      values.push(siteVal);
      stageAnalysis.rows.push({
        category: "Material - " + item.product.toUpperCase(),
        label: item.label,
        key: item.key,
        values
      });
    }
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
        const val = qtySum > 0 ? fieldSum / qtySum / 100 : 0;
        values.push(val);
      }
      const siteVal = totalQtySum > 0 ? totalFieldSum / totalQtySum / 100 : 0;
      values.push(siteVal);
      stageAnalysis.rows.push({
        category: "Execution - " + item.product.toUpperCase(),
        label: item.label,
        key: item.key,
        values
      });
    }
    const defaultBuilding = buildings[0];
    const headerMetadata = {
      siteName: defaultBuilding?.siteName || "Dio Grace Main Site",
      reportDate: defaultBuilding?.reportDate ? new Date(defaultBuilding.reportDate).toLocaleDateString() : (/* @__PURE__ */ new Date()).toLocaleDateString(),
      projectManager: "P. Sharma (Site Manager)",
      client: "Dio Grace Developers Group",
      targetCompletion: defaultBuilding?.reportDate ? new Date(new Date(defaultBuilding.reportDate).getTime() + 180 * 24 * 60 * 60 * 1e3).toLocaleDateString() : "TBD",
      // default 6 months target
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
    console.error("Get project analytics error:", err);
    return res.status(500).json({ error: "Internal server error calculating project analytics" });
  }
}
var prisma8, materialItems, executionItems;
var init_analyticsController = __esm({
  "../backend/src/controllers/analyticsController.js"() {
    prisma8 = new PrismaClient8();
    materialItems = [
      { label: "Kitchen Lower Carcass Inward", key: "kitchenLowerCarcassInward", product: "kitchen", qtyKey: "kitchenQty" },
      { label: "Kitchen Upper Carcass Inward", key: "kitchenUpperCarcassInward", product: "kitchen", qtyKey: "kitchenQty" },
      { label: "Kitchen Stone Inward", key: "kitchenStoneInward", product: "kitchen", qtyKey: "kitchenQty" },
      { label: "Kitchen Shutter Inward", key: "kitchenShutterInward", product: "kitchen", qtyKey: "kitchenQty" },
      { label: "Kitchen Hardware Inward", key: "kitchenHardwareInward", product: "kitchen", qtyKey: "kitchenQty" },
      { label: "Kitchen Appliance Inward", key: "kitchenApplianceInward", product: "kitchen", qtyKey: "kitchenQty" },
      { label: "Wardrobe Cabinet Inward", key: "wardrobeCabinetInward", product: "wardrobe", qtyKey: "wardrobeQty" },
      { label: "Wardrobe Shutter Hardware Inward", key: "wardrobeShutterHardwareInward", product: "wardrobe", qtyKey: "wardrobeQty" },
      { label: "Vanity Cabinet Inward", key: "vanityCabinetInward", product: "vanity", qtyKey: "vanityQty" },
      { label: "Vanity Shutter Hardware Inward", key: "vanityShutterHardwareInward", product: "vanity", qtyKey: "vanityQty" }
    ];
    executionItems = [
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
      { label: "Vanity Handed Over", key: "vanityHandedOver", product: "vanity", qtyKey: "vanityQty" }
    ];
  }
});

// ../backend/src/controllers/userController.js
import { PrismaClient as PrismaClient9 } from "file:///C:/Users/hp/Downloads/Dio%20Grace%20(3)/Dio%20Grace%20(3)/Dio%20Gracee/backend/node_modules/@prisma/client/default.js";
import bcrypt2 from "file:///C:/Users/hp/Downloads/Dio%20Grace%20(3)/Dio%20Grace%20(3)/Dio%20Gracee/backend/node_modules/bcryptjs/index.js";
async function listUsers(req, res) {
  try {
    const users = await prisma9.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        permittedProjects: true,
        createdAt: true
      },
      orderBy: { createdAt: "desc" }
    });
    return res.json(users);
  } catch (err) {
    console.error("Failed to list users:", err);
    return res.status(500).json({ error: "Failed to retrieve users" });
  }
}
async function createUser(req, res) {
  const { email, password, name, role, permittedProjects } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: "Name, email, and password are required." });
  }
  const normalizedEmail = email.toLowerCase().trim();
  const allowedRoles = ["ROLE_A", "ROLE_B", "ROLE_C", "ROLE_D"];
  const userRole = allowedRoles.includes(role) ? role : "ROLE_C";
  try {
    const existing = await prisma9.user.findUnique({
      where: { email: normalizedEmail }
    });
    if (existing) {
      return res.status(400).json({ error: "A user with this email address already exists." });
    }
    const passwordHash = await bcrypt2.hash(password, 10);
    const newUser = await prisma9.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name: name.trim(),
        role: userRole,
        // Only ROLE_D (Viewer 2) uses project restrictions; clear for all others
        permittedProjects: userRole === "ROLE_D" ? permittedProjects ? String(permittedProjects).trim() : "" : ""
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        permittedProjects: true,
        createdAt: true
      }
    });
    return res.status(201).json({
      message: "User created successfully.",
      user: newUser
    });
  } catch (err) {
    console.error("Failed to create user:", err);
    return res.status(500).json({ error: "Failed to create user." });
  }
}
async function updateUser(req, res) {
  const { userId } = req.params;
  const { email, password, name, role, permittedProjects } = req.body;
  try {
    const existing = await prisma9.user.findUnique({
      where: { id: userId }
    });
    if (!existing) {
      return res.status(404).json({ error: "User not found." });
    }
    const updateData = {};
    if (email) {
      const normalizedEmail = email.toLowerCase().trim();
      if (normalizedEmail !== existing.email) {
        const emailCheck = await prisma9.user.findUnique({
          where: { email: normalizedEmail }
        });
        if (emailCheck) {
          return res.status(400).json({ error: "A user with this email address already exists." });
        }
      }
      updateData.email = normalizedEmail;
    }
    if (name) updateData.name = name.trim();
    if (role) {
      const allowedRoles = ["ROLE_A", "ROLE_B", "ROLE_C", "ROLE_D"];
      if (allowedRoles.includes(role)) {
        updateData.role = role;
        if (role !== "ROLE_D") {
          updateData.permittedProjects = "";
        }
      }
    }
    const effectiveRole = updateData.role || existing.role;
    if (permittedProjects !== void 0 && effectiveRole === "ROLE_D") {
      updateData.permittedProjects = String(permittedProjects).trim();
    }
    if (password && password.trim()) {
      updateData.passwordHash = await bcrypt2.hash(password, 10);
    }
    const updated = await prisma9.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        permittedProjects: true,
        createdAt: true
      }
    });
    return res.json({
      message: "User updated successfully.",
      user: updated
    });
  } catch (err) {
    console.error("Failed to update user:", err);
    return res.status(500).json({ error: "Failed to update user." });
  }
}
async function deleteUser(req, res) {
  const { userId } = req.params;
  if (userId === req.user.id) {
    return res.status(400).json({ error: "You cannot delete your own logged-in account." });
  }
  try {
    const existing = await prisma9.user.findUnique({
      where: { id: userId }
    });
    if (!existing) {
      return res.status(404).json({ error: "User not found." });
    }
    await prisma9.$transaction(async (tx) => {
      await tx.auditLog.deleteMany({
        where: { userId }
      });
      await tx.user.delete({
        where: { id: userId }
      });
    });
    return res.json({ message: "User deleted successfully." });
  } catch (err) {
    console.error("Failed to delete user:", err);
    return res.status(400).json({ error: "Cannot delete user because they have recorded project orders." });
  }
}
var prisma9;
var init_userController = __esm({
  "../backend/src/controllers/userController.js"() {
    prisma9 = new PrismaClient9();
  }
});

// ../backend/src/routes/index.js
import { Router } from "file:///C:/Users/hp/Downloads/Dio%20Grace%20(3)/Dio%20Grace%20(3)/Dio%20Gracee/backend/node_modules/express/index.js";
var router, routes_default;
var init_routes = __esm({
  "../backend/src/routes/index.js"() {
    init_auth();
    init_roleGuard();
    init_projectGuard();
    init_authController();
    init_orderController();
    init_buildingController();
    init_apartmentController();
    init_billingController();
    init_exportController();
    init_analyticsController();
    init_userController();
    router = Router();
    router.post("/auth/login", login);
    router.get("/auth/me", verifyToken, me);
    router.get("/users", verifyToken, requireRole("ROLE_A"), listUsers);
    router.post("/users", verifyToken, requireRole("ROLE_A"), createUser);
    router.patch("/users/:userId", verifyToken, requireRole("ROLE_A"), updateUser);
    router.delete("/users/:userId", verifyToken, requireRole("ROLE_A"), deleteUser);
    router.get("/orders", verifyToken, listOrders);
    router.post("/orders", verifyToken, requireRole("ROLE_A"), createOrder);
    router.get("/orders/:orderId", verifyToken, checkProjectAccess, getOrder);
    router.delete("/orders/:orderId", verifyToken, requireRole("ROLE_A"), deleteOrder);
    router.get("/orders/:orderId/buildings", verifyToken, checkProjectAccess, listBuildings);
    router.post("/orders/:orderId/buildings", verifyToken, requireRole("ROLE_A"), createBuilding);
    router.get("/buildings/:buildingId", verifyToken, checkProjectAccess, getBuilding);
    router.patch("/buildings/:buildingId/config", verifyToken, requireRole("ROLE_A"), updateBuildingConfig);
    router.post("/buildings/copy", verifyToken, requireRole("ROLE_A"), copyBuildingData);
    router.delete("/buildings/:buildingId", verifyToken, requireRole("ROLE_A"), deleteBuilding);
    router.get("/buildings/:buildingId/apartments", verifyToken, checkProjectAccess, listApartments);
    router.post("/buildings/:buildingId/apartments", verifyToken, requireRole("ROLE_A"), createApartment);
    router.patch("/apartments/:apartmentId", verifyToken, requireRole("ROLE_A", "ROLE_B"), checkProjectAccess, updateApartment);
    router.delete("/apartments/:apartmentId", verifyToken, requireRole("ROLE_A"), deleteApartment);
    router.patch("/buildings/:buildingId/apartments/batch", verifyToken, requireRole("ROLE_A", "ROLE_B"), checkProjectAccess, batchUpdateApartments);
    router.get("/apartments/:apartmentId/audit-logs", verifyToken, checkProjectAccess, getAuditLogs);
    router.get("/orders/:orderId/billing/setup", verifyToken, checkProjectAccess, getBillingSetup);
    router.put("/orders/:orderId/billing/setup", verifyToken, requireRole("ROLE_A"), updateBillingSetup);
    router.get("/orders/:orderId/billing/contractor", verifyToken, checkProjectAccess, getContractorBill);
    router.put("/orders/:orderId/billing/contractor", verifyToken, requireRole("ROLE_A", "ROLE_B"), checkProjectAccess, upsertContractorBillLines);
    router.get("/orders/:orderId/billing/client-ra", verifyToken, checkProjectAccess, getClientRABill);
    router.put("/orders/:orderId/billing/client-ra", verifyToken, requireRole("ROLE_A", "ROLE_B"), checkProjectAccess, upsertClientRABillLines);
    router.get("/orders/:orderId/billing/dashboard", verifyToken, checkProjectAccess, getBillingDashboard);
    router.get("/orders/:orderId/analytics", verifyToken, checkProjectAccess, getProjectAnalytics);
    router.get("/buildings/:buildingId/export", verifyToken, checkProjectAccess, exportBuildingGrid);
    routes_default = router;
  }
});

// ../backend/src/index.js
var src_exports = {};
__export(src_exports, {
  default: () => src_default
});
import express from "file:///C:/Users/hp/Downloads/Dio%20Grace%20(3)/Dio%20Grace%20(3)/Dio%20Gracee/backend/node_modules/express/index.js";
import cors from "file:///C:/Users/hp/Downloads/Dio%20Grace%20(3)/Dio%20Grace%20(3)/Dio%20Gracee/backend/node_modules/cors/lib/index.js";
import path2 from "path";
import fs2 from "fs";
import http from "http";
import { fileURLToPath as fileURLToPath2 } from "url";
var __vite_injected_original_import_meta_url2, __filename2, __dirname2, isProd3, jwtSecret, app, PORT, allowedOrigins, src_default;
var init_src = __esm({
  "../backend/src/index.js"() {
    init_env();
    init_routes();
    __vite_injected_original_import_meta_url2 = "file:///C:/Users/hp/Downloads/Dio%20Grace%20(3)/Dio%20Grace%20(3)/Dio%20Gracee/backend/src/index.js";
    __filename2 = fileURLToPath2(__vite_injected_original_import_meta_url2);
    __dirname2 = path2.dirname(__filename2);
    isProd3 = process.env.NODE_ENV === "production";
    jwtSecret = process.env.JWT_SECRET;
    if (isProd3 && (!jwtSecret || jwtSecret === "dio_grace_secret_key_change_me_later")) {
      console.error("\n========================================================================");
      console.error("FATAL: JWT_SECRET environment variable is missing or set to");
      console.error("the default fallback key in production mode.");
      console.error("For security reasons, the server cannot start.");
      console.error("========================================================================\n");
      process.exit(1);
    }
    app = express();
    PORT = process.env.PORT || 5e3;
    allowedOrigins = process.env.ALLOWED_ORIGIN ? process.env.ALLOWED_ORIGIN.split(",").map((o) => o.trim()) : [];
    app.use(cors({
      origin: isProd3 ? allowedOrigins.length > 0 ? allowedOrigins : false : "*",
      // Allow all in dev mode
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true
    }));
    app.use(express.json());
    app.use("/api", routes_default);
    app.get("/health", (req, res) => {
      res.json({ status: "ok", timestamp: /* @__PURE__ */ new Date() });
    });
    if (isProd3) {
      const distPath = path2.join(__dirname2, "../../frontend/dist");
      if (fs2.existsSync(distPath)) {
        app.use(express.static(distPath));
        app.get("*", (req, res) => {
          res.sendFile(path2.join(distPath, "index.html"));
        });
      }
    } else if (process.env.INTEGRATED_VITE !== "true") {
      app.use((req, res, next) => {
        if (req.path.startsWith("/api") || req.path.startsWith("/health")) {
          return next();
        }
        const targetUrl = `http://localhost:3000${req.url}`;
        const proxyReq = http.request(
          targetUrl,
          {
            method: req.method,
            headers: req.headers
          },
          (proxyRes) => {
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(res, { end: true });
          }
        );
        proxyReq.on("error", (err) => {
          console.error("Proxy error:", err.message);
          res.status(502).send("Vite dev server is not running on port 3000.");
        });
        req.pipe(proxyReq, { end: true });
      });
    }
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({ error: "Something went wrong on the server!" });
    });
    if (process.env.INTEGRATED_VITE !== "true") {
      app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
      });
    }
    src_default = app;
  }
});

// vite.config.js
import { defineConfig } from "file:///C:/Users/hp/Downloads/Dio%20Grace%20(3)/Dio%20Grace%20(3)/Dio%20Gracee/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/hp/Downloads/Dio%20Grace%20(3)/Dio%20Grace%20(3)/Dio%20Gracee/frontend/node_modules/@vitejs/plugin-react/dist/index.js";
process.env.INTEGRATED_VITE = "true";
var { default: expressApp } = await Promise.resolve().then(() => (init_src(), src_exports));
var vite_config_default = defineConfig({
  plugins: [
    react(),
    {
      name: "express-backend",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url.startsWith("/api") || req.url.startsWith("/health")) {
            expressApp(req, res, next);
          } else {
            next();
          }
        });
      }
    }
  ],
  server: {
    port: 3e3,
    hmr: {
      clientPort: 3e3
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vYmFja2VuZC9zcmMvZW52LmpzIiwgIi4uL2JhY2tlbmQvc3JjL21pZGRsZXdhcmUvYXV0aC5qcyIsICIuLi9iYWNrZW5kL3NyYy9taWRkbGV3YXJlL3JvbGVHdWFyZC5qcyIsICIuLi9iYWNrZW5kL3NyYy9taWRkbGV3YXJlL3Byb2plY3RHdWFyZC5qcyIsICIuLi9iYWNrZW5kL3NyYy9jb250cm9sbGVycy9hdXRoQ29udHJvbGxlci5qcyIsICIuLi9iYWNrZW5kL3NyYy9jb250cm9sbGVycy9vcmRlckNvbnRyb2xsZXIuanMiLCAiLi4vYmFja2VuZC9zcmMvc2VydmljZXMvY2FsY3VsYXRpb25TZXJ2aWNlLmpzIiwgIi4uL2JhY2tlbmQvc3JjL2NvbnRyb2xsZXJzL2J1aWxkaW5nQ29udHJvbGxlci5qcyIsICIuLi9iYWNrZW5kL3NyYy9jb250cm9sbGVycy9hcGFydG1lbnRDb250cm9sbGVyLmpzIiwgIi4uL2JhY2tlbmQvc3JjL3NlcnZpY2VzL2JpbGxpbmdTZXJ2aWNlLmpzIiwgIi4uL2JhY2tlbmQvc3JjL2NvbnRyb2xsZXJzL2JpbGxpbmdDb250cm9sbGVyLmpzIiwgIi4uL2JhY2tlbmQvc3JjL2NvbnRyb2xsZXJzL2V4cG9ydENvbnRyb2xsZXIuanMiLCAiLi4vYmFja2VuZC9zcmMvY29udHJvbGxlcnMvYW5hbHl0aWNzQ29udHJvbGxlci5qcyIsICIuLi9iYWNrZW5kL3NyYy9jb250cm9sbGVycy91c2VyQ29udHJvbGxlci5qcyIsICIuLi9iYWNrZW5kL3NyYy9yb3V0ZXMvaW5kZXguanMiLCAiLi4vYmFja2VuZC9zcmMvaW5kZXguanMiLCAidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxocFxcXFxEb3dubG9hZHNcXFxcRGlvIEdyYWNlICgzKVxcXFxEaW8gR3JhY2UgKDMpXFxcXERpbyBHcmFjZWVcXFxcYmFja2VuZFxcXFxzcmNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGhwXFxcXERvd25sb2Fkc1xcXFxEaW8gR3JhY2UgKDMpXFxcXERpbyBHcmFjZSAoMylcXFxcRGlvIEdyYWNlZVxcXFxiYWNrZW5kXFxcXHNyY1xcXFxlbnYuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL2hwL0Rvd25sb2Fkcy9EaW8lMjBHcmFjZSUyMCgzKS9EaW8lMjBHcmFjZSUyMCgzKS9EaW8lMjBHcmFjZWUvYmFja2VuZC9zcmMvZW52LmpzXCI7aW1wb3J0IGRvdGVudiBmcm9tICdkb3RlbnYnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IHsgZmlsZVVSTFRvUGF0aCB9IGZyb20gJ3VybCc7XG5cbmNvbnN0IF9fZmlsZW5hbWUgPSBmaWxlVVJMVG9QYXRoKGltcG9ydC5tZXRhLnVybCk7XG5jb25zdCBfX2Rpcm5hbWUgPSBwYXRoLmRpcm5hbWUoX19maWxlbmFtZSk7XG5cbmNvbnN0IHJvb3RFbnZQYXRoID0gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4uLy4uLy5lbnYnKTtcbmNvbnN0IGJhY2tlbmRFbnZQYXRoID0gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4uLy5lbnYnKTtcblxuaWYgKGZzLmV4aXN0c1N5bmMocm9vdEVudlBhdGgpKSB7XG4gIGRvdGVudi5jb25maWcoeyBwYXRoOiByb290RW52UGF0aCB9KTtcbn0gZWxzZSBpZiAoZnMuZXhpc3RzU3luYyhiYWNrZW5kRW52UGF0aCkpIHtcbiAgZG90ZW52LmNvbmZpZyh7IHBhdGg6IGJhY2tlbmRFbnZQYXRoIH0pO1xufSBlbHNlIHtcbiAgZG90ZW52LmNvbmZpZygpO1xufVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxocFxcXFxEb3dubG9hZHNcXFxcRGlvIEdyYWNlICgzKVxcXFxEaW8gR3JhY2UgKDMpXFxcXERpbyBHcmFjZWVcXFxcYmFja2VuZFxcXFxzcmNcXFxcbWlkZGxld2FyZVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcaHBcXFxcRG93bmxvYWRzXFxcXERpbyBHcmFjZSAoMylcXFxcRGlvIEdyYWNlICgzKVxcXFxEaW8gR3JhY2VlXFxcXGJhY2tlbmRcXFxcc3JjXFxcXG1pZGRsZXdhcmVcXFxcYXV0aC5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvaHAvRG93bmxvYWRzL0RpbyUyMEdyYWNlJTIwKDMpL0RpbyUyMEdyYWNlJTIwKDMpL0RpbyUyMEdyYWNlZS9iYWNrZW5kL3NyYy9taWRkbGV3YXJlL2F1dGguanNcIjtpbXBvcnQgand0IGZyb20gJ2pzb253ZWJ0b2tlbic7XG5cbmNvbnN0IGlzUHJvZCA9IHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAncHJvZHVjdGlvbic7XG5jb25zdCBKV1RfU0VDUkVUID0gcHJvY2Vzcy5lbnYuSldUX1NFQ1JFVCB8fCAoaXNQcm9kID8gbnVsbCA6ICdkaW9fZ3JhY2Vfc2VjcmV0X2tleV9jaGFuZ2VfbWVfbGF0ZXInKTtcbmNvbnNvbGUubG9nKCdKV1RfU0VDUkVUIGluIGF1dGguanM6JywgSldUX1NFQ1JFVCk7XG5pZiAoaXNQcm9kICYmICghSldUX1NFQ1JFVCB8fCBKV1RfU0VDUkVUID09PSAnZGlvX2dyYWNlX3NlY3JldF9rZXlfY2hhbmdlX21lX2xhdGVyJykpIHtcbiAgdGhyb3cgbmV3IEVycm9yKCdGQVRBTDogSldUX1NFQ1JFVCBlbnZpcm9ubWVudCB2YXJpYWJsZSBpcyBtaXNzaW5nIG9yIHNldCB0byB0aGUgZGVmYXVsdCBmYWxsYmFjayBrZXkgaW4gcHJvZHVjdGlvbiEnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHZlcmlmeVRva2VuKHJlcSwgcmVzLCBuZXh0KSB7XG4gIGNvbnN0IGF1dGhIZWFkZXIgPSByZXEuaGVhZGVyc1snYXV0aG9yaXphdGlvbiddO1xuICBjb25zdCB0b2tlbiA9IGF1dGhIZWFkZXIgJiYgYXV0aEhlYWRlci5zcGxpdCgnICcpWzFdO1xuXG4gIGlmICghdG9rZW4pIHtcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDEpLmpzb24oeyBlcnJvcjogJ0FjY2VzcyB0b2tlbiByZXF1aXJlZCcgfSk7XG4gIH1cblxuICB0cnkge1xuICAgIGNvbnN0IGRlY29kZWQgPSBqd3QudmVyaWZ5KHRva2VuLCBKV1RfU0VDUkVUKTtcbiAgICByZXEudXNlciA9IGRlY29kZWQ7XG4gICAgbmV4dCgpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDMpLmpzb24oeyBlcnJvcjogJ0ludmFsaWQgb3IgZXhwaXJlZCB0b2tlbicgfSk7XG4gIH1cbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcaHBcXFxcRG93bmxvYWRzXFxcXERpbyBHcmFjZSAoMylcXFxcRGlvIEdyYWNlICgzKVxcXFxEaW8gR3JhY2VlXFxcXGJhY2tlbmRcXFxcc3JjXFxcXG1pZGRsZXdhcmVcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGhwXFxcXERvd25sb2Fkc1xcXFxEaW8gR3JhY2UgKDMpXFxcXERpbyBHcmFjZSAoMylcXFxcRGlvIEdyYWNlZVxcXFxiYWNrZW5kXFxcXHNyY1xcXFxtaWRkbGV3YXJlXFxcXHJvbGVHdWFyZC5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvaHAvRG93bmxvYWRzL0RpbyUyMEdyYWNlJTIwKDMpL0RpbyUyMEdyYWNlJTIwKDMpL0RpbyUyMEdyYWNlZS9iYWNrZW5kL3NyYy9taWRkbGV3YXJlL3JvbGVHdWFyZC5qc1wiO2V4cG9ydCBmdW5jdGlvbiByZXF1aXJlUm9sZSguLi5hbGxvd2VkUm9sZXMpIHtcbiAgcmV0dXJuIChyZXEsIHJlcywgbmV4dCkgPT4ge1xuICAgIGlmICghcmVxLnVzZXIgfHwgIXJlcS51c2VyLnJvbGUpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMSkuanNvbih7IGVycm9yOiAnVW5hdXRob3JpemVkOiBVc2VyIHJvbGUgbm90IGZvdW5kJyB9KTtcbiAgICB9XG5cbiAgICBpZiAoIWFsbG93ZWRSb2xlcy5pbmNsdWRlcyhyZXEudXNlci5yb2xlKSkge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAzKS5qc29uKHsgXG4gICAgICAgIGVycm9yOiBgRm9yYmlkZGVuOiBUaGlzIGFjdGlvbiByZXF1aXJlcyBvbmUgb2YgdGhlIGZvbGxvd2luZyByb2xlczogWyR7YWxsb3dlZFJvbGVzLmpvaW4oJywgJyl9XWAgXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBuZXh0KCk7XG4gIH07XG59XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGhwXFxcXERvd25sb2Fkc1xcXFxEaW8gR3JhY2UgKDMpXFxcXERpbyBHcmFjZSAoMylcXFxcRGlvIEdyYWNlZVxcXFxiYWNrZW5kXFxcXHNyY1xcXFxtaWRkbGV3YXJlXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxocFxcXFxEb3dubG9hZHNcXFxcRGlvIEdyYWNlICgzKVxcXFxEaW8gR3JhY2UgKDMpXFxcXERpbyBHcmFjZWVcXFxcYmFja2VuZFxcXFxzcmNcXFxcbWlkZGxld2FyZVxcXFxwcm9qZWN0R3VhcmQuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL2hwL0Rvd25sb2Fkcy9EaW8lMjBHcmFjZSUyMCgzKS9EaW8lMjBHcmFjZSUyMCgzKS9EaW8lMjBHcmFjZWUvYmFja2VuZC9zcmMvbWlkZGxld2FyZS9wcm9qZWN0R3VhcmQuanNcIjtpbXBvcnQgeyBQcmlzbWFDbGllbnQgfSBmcm9tICdAcHJpc21hL2NsaWVudCc7XG5jb25zdCBwcmlzbWEgPSBuZXcgUHJpc21hQ2xpZW50KCk7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjaGVja1Byb2plY3RBY2Nlc3MocmVxLCByZXMsIG5leHQpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBkYlVzZXIgPSBhd2FpdCBwcmlzbWEudXNlci5maW5kVW5pcXVlKHtcbiAgICAgIHdoZXJlOiB7IGlkOiByZXEudXNlci5pZCB9XG4gICAgfSk7XG5cbiAgICBpZiAoIWRiVXNlcikge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAxKS5qc29uKHsgZXJyb3I6ICdVc2VyIG5vdCBmb3VuZCcgfSk7XG4gICAgfVxuXG4gICAgLy8gQWRtaW4gKFJPTEVfQSksIEZlZWRlciAoUk9MRV9CKSwgYW5kIEV4ZWN1dGl2ZSAoUk9MRV9DKSBjYW4gcmVhZCBBTEwgcHJvamVjdHMuXG4gICAgLy8gT25seSBDbGllbnQgLyBwcm9qZWN0LXJlc3RyaWN0ZWQgKFJPTEVfRCkgaXMgbGltaXRlZCB0byB0aGVpciBwZXJtaXR0ZWQgcHJvamVjdCBsaXN0LlxuICAgIGlmIChkYlVzZXIucm9sZSA9PT0gJ1JPTEVfQScgfHwgZGJVc2VyLnJvbGUgPT09ICdST0xFX0InIHx8IGRiVXNlci5yb2xlID09PSAnUk9MRV9DJykge1xuICAgICAgcmV0dXJuIG5leHQoKTtcbiAgICB9XG5cbiAgICBsZXQgb3JkZXJOdW1iZXIgPSBudWxsO1xuXG4gICAgLy8gMS4gQ2hlY2sgb3JkZXJJZFxuICAgIGlmIChyZXEucGFyYW1zLm9yZGVySWQpIHtcbiAgICAgIGNvbnN0IG9yZGVyID0gYXdhaXQgcHJpc21hLm9yZGVyLmZpbmRVbmlxdWUoe1xuICAgICAgICB3aGVyZTogeyBpZDogcmVxLnBhcmFtcy5vcmRlcklkIH0sXG4gICAgICAgIHNlbGVjdDogeyBvcmRlck51bWJlcjogdHJ1ZSB9XG4gICAgICB9KTtcbiAgICAgIGlmIChvcmRlcikge1xuICAgICAgICBvcmRlck51bWJlciA9IG9yZGVyLm9yZGVyTnVtYmVyO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyAyLiBDaGVjayBidWlsZGluZ0lkXG4gICAgZWxzZSBpZiAocmVxLnBhcmFtcy5idWlsZGluZ0lkKSB7XG4gICAgICBjb25zdCBidWlsZGluZyA9IGF3YWl0IHByaXNtYS5idWlsZGluZy5maW5kVW5pcXVlKHtcbiAgICAgICAgd2hlcmU6IHsgaWQ6IHJlcS5wYXJhbXMuYnVpbGRpbmdJZCB9LFxuICAgICAgICBzZWxlY3Q6IHsgb3JkZXI6IHsgc2VsZWN0OiB7IG9yZGVyTnVtYmVyOiB0cnVlIH0gfSB9XG4gICAgICB9KTtcbiAgICAgIGlmIChidWlsZGluZykge1xuICAgICAgICBvcmRlck51bWJlciA9IGJ1aWxkaW5nLm9yZGVyLm9yZGVyTnVtYmVyO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyAzLiBDaGVjayBhcGFydG1lbnRJZFxuICAgIGVsc2UgaWYgKHJlcS5wYXJhbXMuYXBhcnRtZW50SWQpIHtcbiAgICAgIGNvbnN0IGFwYXJ0bWVudCA9IGF3YWl0IHByaXNtYS5hcGFydG1lbnQuZmluZFVuaXF1ZSh7XG4gICAgICAgIHdoZXJlOiB7IGlkOiByZXEucGFyYW1zLmFwYXJ0bWVudElkIH0sXG4gICAgICAgIHNlbGVjdDogeyBidWlsZGluZzogeyBzZWxlY3Q6IHsgb3JkZXI6IHsgc2VsZWN0OiB7IG9yZGVyTnVtYmVyOiB0cnVlIH0gfSB9IH0gfVxuICAgICAgfSk7XG4gICAgICBpZiAoYXBhcnRtZW50KSB7XG4gICAgICAgIG9yZGVyTnVtYmVyID0gYXBhcnRtZW50LmJ1aWxkaW5nLm9yZGVyLm9yZGVyTnVtYmVyO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIElmIGFuIG9yZGVyIG51bWJlciBpcyByZXNvbHZlZCwgY2hlY2sgaWYgdGhlIHVzZXIgaXMgcGVybWl0dGVkIHRvIGFjY2VzcyBpdFxuICAgIGlmIChvcmRlck51bWJlciAhPT0gbnVsbCkge1xuICAgICAgY29uc3QgcGVybWl0dGVkTGlzdCA9IChkYlVzZXIucGVybWl0dGVkUHJvamVjdHMgfHwgJycpXG4gICAgICAgIC5zcGxpdCgnLCcpXG4gICAgICAgIC5tYXAocyA9PiBzLnRyaW0oKS50b0xvd2VyQ2FzZSgpKVxuICAgICAgICAuZmlsdGVyKEJvb2xlYW4pO1xuXG4gICAgICBpZiAoIXBlcm1pdHRlZExpc3QuaW5jbHVkZXMob3JkZXJOdW1iZXIudG9Mb3dlckNhc2UoKSkpIHtcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAzKS5qc29uKHsgZXJyb3I6ICdZb3UgZG8gbm90IGhhdmUgcGVybWlzc2lvbiB0byBhY2Nlc3MgdGhpcyBwcm9qZWN0LicgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgbmV4dCgpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKCdQcm9qZWN0IGFjY2VzcyBjaGVjayBlcnJvcjonLCBlcnIpO1xuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7IGVycm9yOiAnSW50ZXJuYWwgc2VydmVyIGVycm9yIGNoZWNraW5nIHByb2plY3QgYWNjZXNzJyB9KTtcbiAgfVxufVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxocFxcXFxEb3dubG9hZHNcXFxcRGlvIEdyYWNlICgzKVxcXFxEaW8gR3JhY2UgKDMpXFxcXERpbyBHcmFjZWVcXFxcYmFja2VuZFxcXFxzcmNcXFxcY29udHJvbGxlcnNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGhwXFxcXERvd25sb2Fkc1xcXFxEaW8gR3JhY2UgKDMpXFxcXERpbyBHcmFjZSAoMylcXFxcRGlvIEdyYWNlZVxcXFxiYWNrZW5kXFxcXHNyY1xcXFxjb250cm9sbGVyc1xcXFxhdXRoQ29udHJvbGxlci5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvaHAvRG93bmxvYWRzL0RpbyUyMEdyYWNlJTIwKDMpL0RpbyUyMEdyYWNlJTIwKDMpL0RpbyUyMEdyYWNlZS9iYWNrZW5kL3NyYy9jb250cm9sbGVycy9hdXRoQ29udHJvbGxlci5qc1wiO2ltcG9ydCB7IFByaXNtYUNsaWVudCB9IGZyb20gJ0BwcmlzbWEvY2xpZW50JztcbmltcG9ydCBiY3J5cHQgZnJvbSAnYmNyeXB0anMnO1xuaW1wb3J0IGp3dCBmcm9tICdqc29ud2VidG9rZW4nO1xuXG5jb25zdCBwcmlzbWEgPSBuZXcgUHJpc21hQ2xpZW50KCk7XG5jb25zdCBpc1Byb2QgPSBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ3Byb2R1Y3Rpb24nO1xuY29uc3QgSldUX1NFQ1JFVCA9IHByb2Nlc3MuZW52LkpXVF9TRUNSRVQgfHwgKGlzUHJvZCA/IG51bGwgOiAnZGlvX2dyYWNlX3NlY3JldF9rZXlfY2hhbmdlX21lX2xhdGVyJyk7XG5jb25zb2xlLmxvZygnSldUX1NFQ1JFVCBpbiBhdXRoQ29udHJvbGxlci5qczonLCBKV1RfU0VDUkVUKTtcbmlmIChpc1Byb2QgJiYgKCFKV1RfU0VDUkVUIHx8IEpXVF9TRUNSRVQgPT09ICdkaW9fZ3JhY2Vfc2VjcmV0X2tleV9jaGFuZ2VfbWVfbGF0ZXInKSkge1xuICB0aHJvdyBuZXcgRXJyb3IoJ0ZBVEFMOiBKV1RfU0VDUkVUIGVudmlyb25tZW50IHZhcmlhYmxlIGlzIG1pc3Npbmcgb3Igc2V0IHRvIHRoZSBkZWZhdWx0IGZhbGxiYWNrIGtleSBpbiBwcm9kdWN0aW9uIScpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbG9naW4ocmVxLCByZXMpIHtcbiAgY29uc3QgeyBlbWFpbCwgcGFzc3dvcmQgfSA9IHJlcS5ib2R5O1xuXG4gIGlmICghZW1haWwgfHwgIXBhc3N3b3JkKSB7XG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHsgZXJyb3I6ICdFbWFpbCBhbmQgcGFzc3dvcmQgYXJlIHJlcXVpcmVkJyB9KTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgY29uc3QgdXNlciA9IGF3YWl0IHByaXNtYS51c2VyLmZpbmRVbmlxdWUoe1xuICAgICAgd2hlcmU6IHsgZW1haWw6IGVtYWlsLnRvTG93ZXJDYXNlKCkudHJpbSgpIH1cbiAgICB9KTtcblxuICAgIGlmICghdXNlcikge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAxKS5qc29uKHsgZXJyb3I6ICdJbnZhbGlkIGVtYWlsIG9yIHBhc3N3b3JkJyB9KTtcbiAgICB9XG5cbiAgICBjb25zdCBpc1ZhbGlkID0gYXdhaXQgYmNyeXB0LmNvbXBhcmUocGFzc3dvcmQsIHVzZXIucGFzc3dvcmRIYXNoKTtcbiAgICBpZiAoIWlzVmFsaWQpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMSkuanNvbih7IGVycm9yOiAnSW52YWxpZCBlbWFpbCBvciBwYXNzd29yZCcgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgdG9rZW4gPSBqd3Quc2lnbihcbiAgICAgIHsgaWQ6IHVzZXIuaWQsIGVtYWlsOiB1c2VyLmVtYWlsLCByb2xlOiB1c2VyLnJvbGUsIG5hbWU6IHVzZXIubmFtZSB9LFxuICAgICAgSldUX1NFQ1JFVCxcbiAgICAgIHsgZXhwaXJlc0luOiAnMTJoJyB9XG4gICAgKTtcblxuICAgIHJldHVybiByZXMuanNvbih7XG4gICAgICB0b2tlbixcbiAgICAgIHVzZXI6IHtcbiAgICAgICAgaWQ6IHVzZXIuaWQsXG4gICAgICAgIGVtYWlsOiB1c2VyLmVtYWlsLFxuICAgICAgICByb2xlOiB1c2VyLnJvbGUsXG4gICAgICAgIG5hbWU6IHVzZXIubmFtZVxuICAgICAgfVxuICAgIH0pO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKCdMb2dpbiBlcnJvcjonLCBlcnIpO1xuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7IGVycm9yOiAnSW50ZXJuYWwgc2VydmVyIGVycm9yIGR1cmluZyBsb2dpbicgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG1lKHJlcSwgcmVzKSB7XG4gIHRyeSB7XG4gICAgY29uc3QgdXNlciA9IGF3YWl0IHByaXNtYS51c2VyLmZpbmRVbmlxdWUoe1xuICAgICAgd2hlcmU6IHsgaWQ6IHJlcS51c2VyLmlkIH1cbiAgICB9KTtcbiAgICBpZiAoIXVzZXIpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwNCkuanNvbih7IGVycm9yOiAnVXNlciBub3QgZm91bmQnIH0pO1xuICAgIH1cbiAgICByZXR1cm4gcmVzLmpzb24oe1xuICAgICAgdXNlcjoge1xuICAgICAgICBpZDogdXNlci5pZCxcbiAgICAgICAgZW1haWw6IHVzZXIuZW1haWwsXG4gICAgICAgIHJvbGU6IHVzZXIucm9sZSxcbiAgICAgICAgbmFtZTogdXNlci5uYW1lXG4gICAgICB9XG4gICAgfSk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7IGVycm9yOiAnSW50ZXJuYWwgc2VydmVyIGVycm9yJyB9KTtcbiAgfVxufVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxocFxcXFxEb3dubG9hZHNcXFxcRGlvIEdyYWNlICgzKVxcXFxEaW8gR3JhY2UgKDMpXFxcXERpbyBHcmFjZWVcXFxcYmFja2VuZFxcXFxzcmNcXFxcY29udHJvbGxlcnNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGhwXFxcXERvd25sb2Fkc1xcXFxEaW8gR3JhY2UgKDMpXFxcXERpbyBHcmFjZSAoMylcXFxcRGlvIEdyYWNlZVxcXFxiYWNrZW5kXFxcXHNyY1xcXFxjb250cm9sbGVyc1xcXFxvcmRlckNvbnRyb2xsZXIuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL2hwL0Rvd25sb2Fkcy9EaW8lMjBHcmFjZSUyMCgzKS9EaW8lMjBHcmFjZSUyMCgzKS9EaW8lMjBHcmFjZWUvYmFja2VuZC9zcmMvY29udHJvbGxlcnMvb3JkZXJDb250cm9sbGVyLmpzXCI7aW1wb3J0IHsgUHJpc21hQ2xpZW50IH0gZnJvbSAnQHByaXNtYS9jbGllbnQnO1xuXG5jb25zdCBwcmlzbWEgPSBuZXcgUHJpc21hQ2xpZW50KCk7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBsaXN0T3JkZXJzKHJlcSwgcmVzKSB7XG4gIHRyeSB7XG4gICAgY29uc3QgZGJVc2VyID0gYXdhaXQgcHJpc21hLnVzZXIuZmluZFVuaXF1ZSh7XG4gICAgICB3aGVyZTogeyBpZDogcmVxLnVzZXIuaWQgfVxuICAgIH0pO1xuXG4gICAgaWYgKCFkYlVzZXIpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMSkuanNvbih7IGVycm9yOiAnVXNlciBub3QgZm91bmQnIH0pO1xuICAgIH1cblxuICAgIGxldCBmaWx0ZXIgPSB7fTtcbiAgICAvLyBST0xFX0QgKENsaWVudCkgaXMgdGhlIG9ubHkgcm9sZSByZXN0cmljdGVkIHRvIHRoZWlyIHBlcm1pdHRlZCBwcm9qZWN0cy5cbiAgICAvLyBBZG1pbiAoUk9MRV9BKSwgRmVlZGVyIChST0xFX0IpLCBhbmQgRXhlY3V0aXZlIChST0xFX0MpIGNhbiBzZWUgQUxMIHByb2plY3RzLlxuICAgIGlmIChkYlVzZXIucm9sZSA9PT0gJ1JPTEVfRCcpIHtcbiAgICAgIGNvbnN0IGxpc3QgPSAoZGJVc2VyLnBlcm1pdHRlZFByb2plY3RzIHx8ICcnKVxuICAgICAgICAuc3BsaXQoJywnKVxuICAgICAgICAubWFwKHMgPT4gcy50cmltKCkpXG4gICAgICAgIC5maWx0ZXIoQm9vbGVhbik7XG4gICAgICBmaWx0ZXIgPSB7IG9yZGVyTnVtYmVyOiB7IGluOiBsaXN0IH0gfTtcbiAgICB9XG5cbiAgICBjb25zdCBvcmRlcnMgPSBhd2FpdCBwcmlzbWEub3JkZXIuZmluZE1hbnkoe1xuICAgICAgd2hlcmU6IGZpbHRlcixcbiAgICAgIGluY2x1ZGU6IHtcbiAgICAgICAgYnVpbGRpbmdzOiB7XG4gICAgICAgICAgc2VsZWN0OiB7XG4gICAgICAgICAgICBpZDogdHJ1ZSxcbiAgICAgICAgICAgIGNhcGFjaXR5OiB0cnVlLFxuICAgICAgICAgICAgYXBhcnRtZW50czoge1xuICAgICAgICAgICAgICBzZWxlY3Q6IHtcbiAgICAgICAgICAgICAgICBvdmVyYWxsQ29tcGxldGlvblBjdDogdHJ1ZVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgb3JkZXJCeTogeyBjcmVhdGVkQXQ6ICdkZXNjJyB9XG4gICAgfSk7XG5cbiAgICAvLyBDb21wdXRlIHJvbGx1cHMgZm9yIGVhY2ggb3JkZXJcbiAgICBjb25zdCByZXN1bHQgPSBvcmRlcnMubWFwKG9yZGVyID0+IHtcbiAgICAgIGNvbnN0IGJ1aWxkaW5nc0NvdW50ID0gb3JkZXIuYnVpbGRpbmdzLmxlbmd0aDtcbiAgICAgIGxldCB0b3RhbEFwYXJ0bWVudHMgPSAwO1xuICAgICAgbGV0IHN1bUNvbXBsZXRpb24gPSAwLjA7XG5cbiAgICAgIGZvciAoY29uc3QgYiBvZiBvcmRlci5idWlsZGluZ3MpIHtcbiAgICAgICAgdG90YWxBcGFydG1lbnRzICs9IGIuYXBhcnRtZW50cy5sZW5ndGg7XG4gICAgICAgIHN1bUNvbXBsZXRpb24gKz0gYi5hcGFydG1lbnRzLnJlZHVjZSgoc3VtLCBhKSA9PiBzdW0gKyAoYS5vdmVyYWxsQ29tcGxldGlvblBjdCB8fCAwLjApLCAwLjApO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBvdmVyYWxsQ29tcGxldGlvbiA9IHRvdGFsQXBhcnRtZW50cyA+IDAgPyAoc3VtQ29tcGxldGlvbiAvIHRvdGFsQXBhcnRtZW50cykgOiAwLjA7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGlkOiBvcmRlci5pZCxcbiAgICAgICAgb3JkZXJOdW1iZXI6IG9yZGVyLm9yZGVyTnVtYmVyLFxuICAgICAgICBjbGllbnROYW1lOiBvcmRlci5jbGllbnROYW1lIHx8IG9yZGVyLnNpdGVOYW1lIHx8ICcnLFxuICAgICAgICBzaXRlQWRkcmVzczogb3JkZXIuc2l0ZUFkZHJlc3MgfHwgJycsXG4gICAgICAgIHN1cGVydmlzb3JOYW1lOiBvcmRlci5zdXBlcnZpc29yTmFtZSB8fCAnJyxcbiAgICAgICAgdG90YWxBcGFydG1lbnRzTmVlZGVkOiBvcmRlci50b3RhbEFwYXJ0bWVudHNOZWVkZWQgfHwgMCxcbiAgICAgICAgY29udHJhY3RvcklkOiBvcmRlci5jb250cmFjdG9ySWQgfHwgJycsXG4gICAgICAgIGNvbnRyYWN0b3JOYW1lOiBvcmRlci5jb250cmFjdG9yTmFtZSB8fCAnJyxcbiAgICAgICAgY3JlYXRlZEF0OiBvcmRlci5jcmVhdGVkQXQsXG4gICAgICAgIGJ1aWxkaW5nc0NvdW50LFxuICAgICAgICB0b3RhbEFwYXJ0bWVudHMsXG4gICAgICAgIG92ZXJhbGxDb21wbGV0aW9uOiBNYXRoLnJvdW5kKG92ZXJhbGxDb21wbGV0aW9uICogMTAwMCkgLyAxMDAwXG4gICAgICB9O1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJlcy5qc29uKHJlc3VsdCk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0xpc3Qgb3JkZXJzIGVycm9yOicsIGVycik7XG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgZXJyb3I6ICdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3IgbGlzdGluZyBvcmRlcnMnIH0pO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjcmVhdGVPcmRlcihyZXEsIHJlcykge1xuICB0cnkge1xuICAgIC8vIFJvbGUgQSBvbmx5IChoYW5kbGVkIGJ5IHJvbGVHdWFyZCBtaWRkbGV3YXJlLCBidXQgbGV0J3MgYmUgc2FmZSlcbiAgICBpZiAocmVxLnVzZXIucm9sZSAhPT0gJ1JPTEVfQScpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMykuanNvbih7IGVycm9yOiAnT25seSBEYXRhIEVudHJ5IC8gU2V0dXAgcm9sZSBjYW4gY3JlYXRlIG9yZGVycycgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgeyBvcmRlck51bWJlciwgY2xpZW50TmFtZSwgc2l0ZU5hbWUsIHNpdGVBZGRyZXNzLCBzdXBlcnZpc29yTmFtZSwgdG90YWxBcGFydG1lbnRzTmVlZGVkLCBjb250cmFjdG9ySWQsIGNvbnRyYWN0b3JOYW1lIH0gPSByZXEuYm9keTtcbiAgICBpZiAoIW9yZGVyTnVtYmVyIHx8IHR5cGVvZiBvcmRlck51bWJlciAhPT0gJ3N0cmluZycgfHwgIW9yZGVyTnVtYmVyLnRyaW0oKSkge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHsgZXJyb3I6ICdPcmRlciBOdW1iZXIgaXMgcmVxdWlyZWQnIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IHRyaW1tZWRPcmRlck5vID0gb3JkZXJOdW1iZXIudHJpbSgpO1xuICAgIGNvbnN0IGZpbmFsQ2xpZW50TmFtZSA9IGNsaWVudE5hbWUgfHwgc2l0ZU5hbWUgfHwgJyc7XG5cbiAgICAvLyBDaGVjayB1bmlxdWVuZXNzXG4gICAgY29uc3QgZXhpc3RpbmcgPSBhd2FpdCBwcmlzbWEub3JkZXIuZmluZFVuaXF1ZSh7XG4gICAgICB3aGVyZTogeyBvcmRlck51bWJlcjogdHJpbW1lZE9yZGVyTm8gfVxuICAgIH0pO1xuXG4gICAgaWYgKGV4aXN0aW5nKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oeyBlcnJvcjogYE9yZGVyIE51bWJlciBcIiR7dHJpbW1lZE9yZGVyTm99XCIgYWxyZWFkeSBleGlzdHNgIH0pO1xuICAgIH1cblxuICAgIC8vIENyZWF0ZSBvcmRlciArIGRlZmF1bHQgQmlsbGluZ1NldHVwXG4gICAgY29uc3Qgb3JkZXIgPSBhd2FpdCBwcmlzbWEub3JkZXIuY3JlYXRlKHtcbiAgICAgIGRhdGE6IHtcbiAgICAgICAgb3JkZXJOdW1iZXI6IHRyaW1tZWRPcmRlck5vLFxuICAgICAgICBjbGllbnROYW1lOiBmaW5hbENsaWVudE5hbWUgPyBTdHJpbmcoZmluYWxDbGllbnROYW1lKS50cmltKCkgOiAnJyxcbiAgICAgICAgc2l0ZUFkZHJlc3M6IHNpdGVBZGRyZXNzID8gU3RyaW5nKHNpdGVBZGRyZXNzKS50cmltKCkgOiAnJyxcbiAgICAgICAgc3VwZXJ2aXNvck5hbWU6IHN1cGVydmlzb3JOYW1lID8gU3RyaW5nKHN1cGVydmlzb3JOYW1lKS50cmltKCkgOiAnJyxcbiAgICAgICAgdG90YWxBcGFydG1lbnRzTmVlZGVkOiB0b3RhbEFwYXJ0bWVudHNOZWVkZWQgPyAocGFyc2VJbnQodG90YWxBcGFydG1lbnRzTmVlZGVkLCAxMCkgfHwgMCkgOiAwLFxuICAgICAgICBjb250cmFjdG9ySWQ6IGNvbnRyYWN0b3JJZCA/IFN0cmluZyhjb250cmFjdG9ySWQpLnRyaW0oKSA6ICcnLFxuICAgICAgICBjb250cmFjdG9yTmFtZTogY29udHJhY3Rvck5hbWUgPyBTdHJpbmcoY29udHJhY3Rvck5hbWUpLnRyaW0oKSA6ICcnLFxuICAgICAgICBjcmVhdGVkQnlJZDogcmVxLnVzZXIuaWQsXG4gICAgICAgIGJpbGxpbmdTZXR1cDoge1xuICAgICAgICAgIGNyZWF0ZToge1xuICAgICAgICAgICAgY29udHJhY3RvclJldGVudGlvblBjdDogNS4wLFxuICAgICAgICAgICAgY29udHJhY3RvckdTVFBjdDogMTguMCxcbiAgICAgICAgICAgIGNvbnRyYWN0b3JURFNQY3Q6IDEuMCxcbiAgICAgICAgICAgIGNsaWVudFJldGVudGlvblBjdDogNS4wLFxuICAgICAgICAgICAgY2xpZW50R1NUUGN0OiAxOC4wLFxuICAgICAgICAgICAgY2xpZW50T3RoZXJEZWR1Y3Rpb246IDAuMCxcbiAgICAgICAgICAgIGNsaWVudE1hdEVsaWdpYmxlUGN0OiA0MC4wLFxuICAgICAgICAgICAgY2xpZW50RXhlY0VsaWdpYmxlUGN0OiA0NS4wLFxuICAgICAgICAgICAgY2xpZW50SGFuZG92ZXJFbGlnaWJsZVBjdDogMTUuMCxcbiAgICAgICAgICAgIC8vIFByZS1zZWVkIHNvbWUgZGVmYXVsdCBVbml0IFR5cGUgUmF0ZXMgKDUgb2YgZWFjaCBwcm9kdWN0KVxuICAgICAgICAgICAgdW5pdFR5cGVSYXRlczoge1xuICAgICAgICAgICAgICBjcmVhdGU6IFtcbiAgICAgICAgICAgICAgICB7IHR5cGVDb2RlOiAnSy1UeXBlIDEnLCBwcm9kdWN0OiAnS2l0Y2hlbicsIHR5cGVOYW1lOiAnU3RhbmRhcmQgS2l0Y2hlbiBMLVNoYXBlJywgY29udHJhY3RvclJhdGU6IDQ1MDAwLCBjbGllbnRSYXRlOiA2NTAwMCB9LFxuICAgICAgICAgICAgICAgIHsgdHlwZUNvZGU6ICdLLVR5cGUgMicsIHByb2R1Y3Q6ICdLaXRjaGVuJywgdHlwZU5hbWU6ICdQcmVtaXVtIEtpdGNoZW4gUGFyYWxsZWwnLCBjb250cmFjdG9yUmF0ZTogNTUwMDAsIGNsaWVudFJhdGU6IDc4MDAwIH0sXG4gICAgICAgICAgICAgICAgeyB0eXBlQ29kZTogJ0stVHlwZSAzJywgcHJvZHVjdDogJ0tpdGNoZW4nLCB0eXBlTmFtZTogJ0lzbGFuZCBMdXh1cnkgS2l0Y2hlbicsIGNvbnRyYWN0b3JSYXRlOiA4NTAwMCwgY2xpZW50UmF0ZTogMTIwMDAwIH0sXG4gICAgICAgICAgICAgICAgeyB0eXBlQ29kZTogJ0stVHlwZSA0JywgcHJvZHVjdDogJ0tpdGNoZW4nLCB0eXBlTmFtZTogJ0NvbXBhY3QgS2l0Y2hlbiBTdHJhaWdodCcsIGNvbnRyYWN0b3JSYXRlOiAzNTAwMCwgY2xpZW50UmF0ZTogNDgwMDAgfSxcbiAgICAgICAgICAgICAgICB7IHR5cGVDb2RlOiAnSy1UeXBlIDUnLCBwcm9kdWN0OiAnS2l0Y2hlbicsIHR5cGVOYW1lOiAnU2VtaS1QcmVtaXVtIEtpdGNoZW4gTC1TaGFwZScsIGNvbnRyYWN0b3JSYXRlOiA0ODAwMCwgY2xpZW50UmF0ZTogNjgwMDAgfSxcblxuICAgICAgICAgICAgICAgIHsgdHlwZUNvZGU6ICdXLVR5cGUgMScsIHByb2R1Y3Q6ICdXYXJkcm9iZScsIHR5cGVOYW1lOiAnU3RhbmRhcmQgMi1Eb29yIFdhcmRyb2JlJywgY29udHJhY3RvclJhdGU6IDI1MDAwLCBjbGllbnRSYXRlOiAzODAwMCB9LFxuICAgICAgICAgICAgICAgIHsgdHlwZUNvZGU6ICdXLVR5cGUgMicsIHByb2R1Y3Q6ICdXYXJkcm9iZScsIHR5cGVOYW1lOiAnUHJlbWl1bSAzLURvb3IgU2xpZGluZyBXYXJkcm9iZScsIGNvbnRyYWN0b3JSYXRlOiA0MjAwMCwgY2xpZW50UmF0ZTogNTgwMDAgfSxcbiAgICAgICAgICAgICAgICB7IHR5cGVDb2RlOiAnVy1UeXBlIDMnLCBwcm9kdWN0OiAnV2FyZHJvYmUnLCB0eXBlTmFtZTogJ1dhbGstaW4gV2FyZHJvYmUgTHV4dXJ5JywgY29udHJhY3RvclJhdGU6IDc1MDAwLCBjbGllbnRSYXRlOiAxMTAwMDAgfSxcbiAgICAgICAgICAgICAgICB7IHR5cGVDb2RlOiAnVy1UeXBlIDQnLCBwcm9kdWN0OiAnV2FyZHJvYmUnLCB0eXBlTmFtZTogJ0NvbXBhY3QgMi1Eb29yIFdhcmRyb2JlIExvZnQnLCBjb250cmFjdG9yUmF0ZTogMzAwMDAsIGNsaWVudFJhdGU6IDQ1MDAwIH0sXG4gICAgICAgICAgICAgICAgeyB0eXBlQ29kZTogJ1ctVHlwZSA1JywgcHJvZHVjdDogJ1dhcmRyb2JlJywgdHlwZU5hbWU6ICdQcmVtaXVtIDQtRG9vciBIaW5nZWQgV2FyZHJvYmUnLCBjb250cmFjdG9yUmF0ZTogNDgwMDAsIGNsaWVudFJhdGU6IDcwMDAwIH0sXG5cbiAgICAgICAgICAgICAgICB7IHR5cGVDb2RlOiAnVi1UeXBlIDEnLCBwcm9kdWN0OiAnVmFuaXR5JywgdHlwZU5hbWU6ICdTaW5nbGUgU2luayBWYW5pdHkgU3RhbmRhcmQnLCBjb250cmFjdG9yUmF0ZTogODAwMCwgY2xpZW50UmF0ZTogMTIwMDAgfSxcbiAgICAgICAgICAgICAgICB7IHR5cGVDb2RlOiAnVi1UeXBlIDInLCBwcm9kdWN0OiAnVmFuaXR5JywgdHlwZU5hbWU6ICdEb3VibGUgU2luayBQcmVtaXVtIFZhbml0eScsIGNvbnRyYWN0b3JSYXRlOiAxNDAwMCwgY2xpZW50UmF0ZTogMjAwMDAgfSxcbiAgICAgICAgICAgICAgICB7IHR5cGVDb2RlOiAnVi1UeXBlIDMnLCBwcm9kdWN0OiAnVmFuaXR5JywgdHlwZU5hbWU6ICdDb21wYWN0IEZsb2F0aW5nIFZhbml0eScsIGNvbnRyYWN0b3JSYXRlOiA2NTAwLCBjbGllbnRSYXRlOiA5NTAwIH0sXG4gICAgICAgICAgICAgICAgeyB0eXBlQ29kZTogJ1YtVHlwZSA0JywgcHJvZHVjdDogJ1Zhbml0eScsIHR5cGVOYW1lOiAnTHV4dXJ5IE1hcmJsZSBUb3AgVmFuaXR5JywgY29udHJhY3RvclJhdGU6IDE4MDAwLCBjbGllbnRSYXRlOiAyNjAwMCB9LFxuICAgICAgICAgICAgICAgIHsgdHlwZUNvZGU6ICdWLVR5cGUgNScsIHByb2R1Y3Q6ICdWYW5pdHknLCB0eXBlTmFtZTogJ1N0YW5kYXJkIEZsb29yIE1vdW50ZWQgVmFuaXR5JywgY29udHJhY3RvclJhdGU6IDkwMDAsIGNsaWVudFJhdGU6IDEzNTAwIH1cbiAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIFByZS1zZWVkIENvbnRyYWN0b3IgTWlsZXN0b25lc1xuICAgICAgICAgICAgY29udHJhY3Rvck1pbGVzdG9uZXM6IHtcbiAgICAgICAgICAgICAgY3JlYXRlOiBbXG4gICAgICAgICAgICAgICAgLy8gS2l0Y2hlbiBNaWxlc3RvbmVzXG4gICAgICAgICAgICAgICAgeyBwcm9kdWN0OiAnS2l0Y2hlbicsIG1pbGVzdG9uZU5hbWU6ICdMb3dlciBDYXJjYXNzZXMgSW5zdGFsbGVkJywgcGVyY2VudGFnZTogMTUuMCB9LFxuICAgICAgICAgICAgICAgIHsgcHJvZHVjdDogJ0tpdGNoZW4nLCBtaWxlc3RvbmVOYW1lOiAnVXBwZXIgQ2FyY2Fzc2VzIEluc3RhbGxlZCcsIHBlcmNlbnRhZ2U6IDE1LjAgfSxcbiAgICAgICAgICAgICAgICB7IHByb2R1Y3Q6ICdLaXRjaGVuJywgbWlsZXN0b25lTmFtZTogJ1N0b25lIEluc3RhbGxlZCcsIHBlcmNlbnRhZ2U6IDE1LjAgfSxcbiAgICAgICAgICAgICAgICB7IHByb2R1Y3Q6ICdLaXRjaGVuJywgbWlsZXN0b25lTmFtZTogJ1NodXR0ZXJzICYgSGFyZHdhcmUgSW5zdGFsbGVkJywgcGVyY2VudGFnZTogMjUuMCB9LFxuICAgICAgICAgICAgICAgIHsgcHJvZHVjdDogJ0tpdGNoZW4nLCBtaWxlc3RvbmVOYW1lOiAnQXBwbGlhbmNlcyBJbnN0YWxsZWQnLCBwZXJjZW50YWdlOiAxMC4wIH0sXG4gICAgICAgICAgICAgICAgeyBwcm9kdWN0OiAnS2l0Y2hlbicsIG1pbGVzdG9uZU5hbWU6ICdRQyBBcHByb3ZlZCAmIEhhbmRlZCBPdmVyJywgcGVyY2VudGFnZTogMjAuMCB9LFxuXG4gICAgICAgICAgICAgICAgLy8gV2FyZHJvYmUgTWlsZXN0b25lc1xuICAgICAgICAgICAgICAgIHsgcHJvZHVjdDogJ1dhcmRyb2JlJywgbWlsZXN0b25lTmFtZTogJ0NhYmluZXRzIEluc3RhbGxlZCcsIHBlcmNlbnRhZ2U6IDQwLjAgfSxcbiAgICAgICAgICAgICAgICB7IHByb2R1Y3Q6ICdXYXJkcm9iZScsIG1pbGVzdG9uZU5hbWU6ICdTaHV0dGVyICYgSGFyZHdhcmUgSW5zdGFsbGVkJywgcGVyY2VudGFnZTogMzAuMCB9LFxuICAgICAgICAgICAgICAgIHsgcHJvZHVjdDogJ1dhcmRyb2JlJywgbWlsZXN0b25lTmFtZTogJ1FDIEFwcHJvdmVkICYgSGFuZGVkIE92ZXInLCBwZXJjZW50YWdlOiAzMC4wIH0sXG5cbiAgICAgICAgICAgICAgICAvLyBWYW5pdHkgTWlsZXN0b25lc1xuICAgICAgICAgICAgICAgIHsgcHJvZHVjdDogJ1Zhbml0eScsIG1pbGVzdG9uZU5hbWU6ICdDYWJpbmV0cyBJbnN0YWxsZWQnLCBwZXJjZW50YWdlOiA0MC4wIH0sXG4gICAgICAgICAgICAgICAgeyBwcm9kdWN0OiAnVmFuaXR5JywgbWlsZXN0b25lTmFtZTogJ1NodXR0ZXIgJiBIYXJkd2FyZSBJbnN0YWxsZWQnLCBwZXJjZW50YWdlOiAzMC4wIH0sXG4gICAgICAgICAgICAgICAgeyBwcm9kdWN0OiAnVmFuaXR5JywgbWlsZXN0b25lTmFtZTogJ1FDIEFwcHJvdmVkICYgSGFuZGVkIE92ZXInLCBwZXJjZW50YWdlOiAzMC4wIH1cbiAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIFByZS1zZWVkIENsaWVudCBSQSBNaWxlc3RvbmVzIChtdXN0IHN1bSB0byAxMDAlIHBlciBwcm9kdWN0KVxuICAgICAgICAgICAgY2xpZW50UkFNaWxlc3RvbmVzOiB7XG4gICAgICAgICAgICAgIGNyZWF0ZTogW1xuICAgICAgICAgICAgICAgIC8vIEtpdGNoZW4gTWF0ZXJpYWwgU3VwcGx5IE1pbGVzdG9uZXMgKHN1bSA9IDQwJSlcbiAgICAgICAgICAgICAgICB7IHByb2R1Y3Q6ICdLaXRjaGVuJywgcmVjb2duaXRpb25UeXBlOiAnTUFURVJJQUwnLCBtaWxlc3RvbmVOYW1lOiAnTG93ZXIgQ2FyY2Fzc2VzIFN1cHBsaWVkJywgZmllbGRLZXk6ICdraXRjaGVuTG93ZXJDYXJjYXNzSW53YXJkJywgcGVyY2VudGFnZTogOC4wIH0sXG4gICAgICAgICAgICAgICAgeyBwcm9kdWN0OiAnS2l0Y2hlbicsIHJlY29nbml0aW9uVHlwZTogJ01BVEVSSUFMJywgbWlsZXN0b25lTmFtZTogJ1VwcGVyIENhcmNhc3NlcyBTdXBwbGllZCcsIGZpZWxkS2V5OiAna2l0Y2hlblVwcGVyQ2FyY2Fzc0lud2FyZCcsIHBlcmNlbnRhZ2U6IDcuMCB9LFxuICAgICAgICAgICAgICAgIHsgcHJvZHVjdDogJ0tpdGNoZW4nLCByZWNvZ25pdGlvblR5cGU6ICdNQVRFUklBTCcsIG1pbGVzdG9uZU5hbWU6ICdTdG9uZSBTdXBwbGllZCcsIGZpZWxkS2V5OiAna2l0Y2hlblN0b25lSW53YXJkJywgcGVyY2VudGFnZTogNy4wIH0sXG4gICAgICAgICAgICAgICAgeyBwcm9kdWN0OiAnS2l0Y2hlbicsIHJlY29nbml0aW9uVHlwZTogJ01BVEVSSUFMJywgbWlsZXN0b25lTmFtZTogJ1NodXR0ZXJzIFN1cHBsaWVkJywgZmllbGRLZXk6ICdraXRjaGVuU2h1dHRlcklud2FyZCcsIHBlcmNlbnRhZ2U6IDguMCB9LFxuICAgICAgICAgICAgICAgIHsgcHJvZHVjdDogJ0tpdGNoZW4nLCByZWNvZ25pdGlvblR5cGU6ICdNQVRFUklBTCcsIG1pbGVzdG9uZU5hbWU6ICdIYXJkd2FyZSBTdXBwbGllZCcsIGZpZWxkS2V5OiAna2l0Y2hlbkhhcmR3YXJlSW53YXJkJywgcGVyY2VudGFnZTogNS4wIH0sXG4gICAgICAgICAgICAgICAgeyBwcm9kdWN0OiAnS2l0Y2hlbicsIHJlY29nbml0aW9uVHlwZTogJ01BVEVSSUFMJywgbWlsZXN0b25lTmFtZTogJ0FwcGxpYW5jZXMgU3VwcGxpZWQnLCBmaWVsZEtleTogJ2tpdGNoZW5BcHBsaWFuY2VJbndhcmQnLCBwZXJjZW50YWdlOiA1LjAgfSxcbiAgICAgICAgICAgICAgICAvLyBLaXRjaGVuIEV4ZWN1dGlvbiBNaWxlc3RvbmVzIChzdW0gPSA0NSUpXG4gICAgICAgICAgICAgICAgeyBwcm9kdWN0OiAnS2l0Y2hlbicsIHJlY29nbml0aW9uVHlwZTogJ0VYRUNVVElPTicsIG1pbGVzdG9uZU5hbWU6ICdMb3dlciBDYXJjYXNzZXMgSW5zdGFsbGVkJywgZmllbGRLZXk6ICdraXRjaGVuTG93ZXJDYXJjYXNzSW5zdGFsbGVkJywgcGVyY2VudGFnZTogOS4wIH0sXG4gICAgICAgICAgICAgICAgeyBwcm9kdWN0OiAnS2l0Y2hlbicsIHJlY29nbml0aW9uVHlwZTogJ0VYRUNVVElPTicsIG1pbGVzdG9uZU5hbWU6ICdVcHBlciBDYXJjYXNzZXMgSW5zdGFsbGVkJywgZmllbGRLZXk6ICdraXRjaGVuVXBwZXJDYXJjYXNzSW5zdGFsbGVkJywgcGVyY2VudGFnZTogOS4wIH0sXG4gICAgICAgICAgICAgICAgeyBwcm9kdWN0OiAnS2l0Y2hlbicsIHJlY29nbml0aW9uVHlwZTogJ0VYRUNVVElPTicsIG1pbGVzdG9uZU5hbWU6ICdTdG9uZSBJbnN0YWxsZWQnLCBmaWVsZEtleTogJ2tpdGNoZW5TdG9uZUluc3RhbGxlZCcsIHBlcmNlbnRhZ2U6IDkuMCB9LFxuICAgICAgICAgICAgICAgIHsgcHJvZHVjdDogJ0tpdGNoZW4nLCByZWNvZ25pdGlvblR5cGU6ICdFWEVDVVRJT04nLCBtaWxlc3RvbmVOYW1lOiAnU2h1dHRlcnMgJiBIYXJkd2FyZSBJbnN0YWxsZWQnLCBmaWVsZEtleTogJ2tpdGNoZW5TaHV0dGVySGFyZHdhcmVJbnN0YWxsZWQnLCBwZXJjZW50YWdlOiAxMC4wIH0sXG4gICAgICAgICAgICAgICAgeyBwcm9kdWN0OiAnS2l0Y2hlbicsIHJlY29nbml0aW9uVHlwZTogJ0VYRUNVVElPTicsIG1pbGVzdG9uZU5hbWU6ICdBcHBsaWFuY2VzIEluc3RhbGxlZCcsIGZpZWxkS2V5OiAna2l0Y2hlbkFwcGxpYW5jZUluc3RhbGxlZCcsIHBlcmNlbnRhZ2U6IDguMCB9LFxuICAgICAgICAgICAgICAgIC8vIEtpdGNoZW4gSGFuZG92ZXIgTWlsZXN0b25lIChzdW0gPSAxNSUpXG4gICAgICAgICAgICAgICAgeyBwcm9kdWN0OiAnS2l0Y2hlbicsIHJlY29nbml0aW9uVHlwZTogJ0hBTkRPVkVSJywgbWlsZXN0b25lTmFtZTogJ1FDIEFwcHJvdmVkICYgSGFuZGVkIE92ZXInLCBmaWVsZEtleTogJ2tpdGNoZW5IYW5kZWRPdmVyJywgcGVyY2VudGFnZTogMTUuMCB9LFxuXG4gICAgICAgICAgICAgICAgLy8gV2FyZHJvYmUgTWF0ZXJpYWwgU3VwcGx5IE1pbGVzdG9uZXMgKHN1bSA9IDQwJSlcbiAgICAgICAgICAgICAgICB7IHByb2R1Y3Q6ICdXYXJkcm9iZScsIHJlY29nbml0aW9uVHlwZTogJ01BVEVSSUFMJywgbWlsZXN0b25lTmFtZTogJ0NhYmluZXRzIFN1cHBsaWVkJywgZmllbGRLZXk6ICd3YXJkcm9iZUNhYmluZXRJbndhcmQnLCBwZXJjZW50YWdlOiAyMC4wIH0sXG4gICAgICAgICAgICAgICAgeyBwcm9kdWN0OiAnV2FyZHJvYmUnLCByZWNvZ25pdGlvblR5cGU6ICdNQVRFUklBTCcsIG1pbGVzdG9uZU5hbWU6ICdTaHV0dGVyICYgSGFyZHdhcmUgU3VwcGxpZWQnLCBmaWVsZEtleTogJ3dhcmRyb2JlU2h1dHRlckhhcmR3YXJlSW53YXJkJywgcGVyY2VudGFnZTogMjAuMCB9LFxuICAgICAgICAgICAgICAgIC8vIFdhcmRyb2JlIEV4ZWN1dGlvbiBNaWxlc3RvbmVzIChzdW0gPSA0MCUpXG4gICAgICAgICAgICAgICAgeyBwcm9kdWN0OiAnV2FyZHJvYmUnLCByZWNvZ25pdGlvblR5cGU6ICdFWEVDVVRJT04nLCBtaWxlc3RvbmVOYW1lOiAnQ2FiaW5ldHMgSW5zdGFsbGVkJywgZmllbGRLZXk6ICd3YXJkcm9iZUNhYmluZXRJbnN0YWxsZWQnLCBwZXJjZW50YWdlOiAyMC4wIH0sXG4gICAgICAgICAgICAgICAgeyBwcm9kdWN0OiAnV2FyZHJvYmUnLCByZWNvZ25pdGlvblR5cGU6ICdFWEVDVVRJT04nLCBtaWxlc3RvbmVOYW1lOiAnU2h1dHRlciAmIEhhcmR3YXJlIEluc3RhbGxlZCcsIGZpZWxkS2V5OiAnd2FyZHJvYmVTaHV0dGVySGFyZHdhcmVJbnN0YWxsZWQnLCBwZXJjZW50YWdlOiAyMC4wIH0sXG4gICAgICAgICAgICAgICAgLy8gV2FyZHJvYmUgSGFuZG92ZXIgTWlsZXN0b25lIChzdW0gPSAyMCUpXG4gICAgICAgICAgICAgICAgeyBwcm9kdWN0OiAnV2FyZHJvYmUnLCByZWNvZ25pdGlvblR5cGU6ICdIQU5ET1ZFUicsIG1pbGVzdG9uZU5hbWU6ICdRQyBBcHByb3ZlZCAmIEhhbmRlZCBPdmVyJywgZmllbGRLZXk6ICd3YXJkcm9iZUhhbmRlZE92ZXInLCBwZXJjZW50YWdlOiAyMC4wIH0sXG5cbiAgICAgICAgICAgICAgICAvLyBWYW5pdHkgTWF0ZXJpYWwgU3VwcGx5IE1pbGVzdG9uZXMgKHN1bSA9IDQwJSlcbiAgICAgICAgICAgICAgICB7IHByb2R1Y3Q6ICdWYW5pdHknLCByZWNvZ25pdGlvblR5cGU6ICdNQVRFUklBTCcsIG1pbGVzdG9uZU5hbWU6ICdDYWJpbmV0cyBTdXBwbGllZCcsIGZpZWxkS2V5OiAndmFuaXR5Q2FiaW5ldElud2FyZCcsIHBlcmNlbnRhZ2U6IDIwLjAgfSxcbiAgICAgICAgICAgICAgICB7IHByb2R1Y3Q6ICdWYW5pdHknLCByZWNvZ25pdGlvblR5cGU6ICdNQVRFUklBTCcsIG1pbGVzdG9uZU5hbWU6ICdTaHV0dGVyICYgSGFyZHdhcmUgU3VwcGxpZWQnLCBmaWVsZEtleTogJ3Zhbml0eVNodXR0ZXJIYXJkd2FyZUlud2FyZCcsIHBlcmNlbnRhZ2U6IDIwLjAgfSxcbiAgICAgICAgICAgICAgICAvLyBWYW5pdHkgRXhlY3V0aW9uIE1pbGVzdG9uZXMgKHN1bSA9IDQwJSlcbiAgICAgICAgICAgICAgICB7IHByb2R1Y3Q6ICdWYW5pdHknLCByZWNvZ25pdGlvblR5cGU6ICdFWEVDVVRJT04nLCBtaWxlc3RvbmVOYW1lOiAnQ2FiaW5ldHMgSW5zdGFsbGVkJywgZmllbGRLZXk6ICd2YW5pdHlDYWJpbmV0SW5zdGFsbGVkJywgcGVyY2VudGFnZTogMjAuMCB9LFxuICAgICAgICAgICAgICAgIHsgcHJvZHVjdDogJ1Zhbml0eScsIHJlY29nbml0aW9uVHlwZTogJ0VYRUNVVElPTicsIG1pbGVzdG9uZU5hbWU6ICdTaHV0dGVyICYgSGFyZHdhcmUgSW5zdGFsbGVkJywgZmllbGRLZXk6ICd2YW5pdHlTaHV0dGVySGFyZHdhcmVJbnN0YWxsZWQnLCBwZXJjZW50YWdlOiAyMC4wIH0sXG4gICAgICAgICAgICAgICAgLy8gVmFuaXR5IEhhbmRvdmVyIE1pbGVzdG9uZSAoc3VtID0gMjAlKVxuICAgICAgICAgICAgICAgIHsgcHJvZHVjdDogJ1Zhbml0eScsIHJlY29nbml0aW9uVHlwZTogJ0hBTkRPVkVSJywgbWlsZXN0b25lTmFtZTogJ1FDIEFwcHJvdmVkICYgSGFuZGVkIE92ZXInLCBmaWVsZEtleTogJ3Zhbml0eUhhbmRlZE92ZXInLCBwZXJjZW50YWdlOiAyMC4wIH1cbiAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIGluY2x1ZGU6IHtcbiAgICAgICAgYmlsbGluZ1NldHVwOiB0cnVlXG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDEpLmpzb24ob3JkZXIpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKCdDcmVhdGUgb3JkZXIgZXJyb3I6JywgZXJyKTtcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oeyBlcnJvcjogJ0ludGVybmFsIHNlcnZlciBlcnJvciBjcmVhdGluZyBvcmRlcicgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldE9yZGVyKHJlcSwgcmVzKSB7XG4gIGNvbnN0IHsgb3JkZXJJZCB9ID0gcmVxLnBhcmFtcztcbiAgdHJ5IHtcbiAgICBjb25zdCBvcmRlciA9IGF3YWl0IHByaXNtYS5vcmRlci5maW5kVW5pcXVlKHtcbiAgICAgIHdoZXJlOiB7IGlkOiBvcmRlcklkIH0sXG4gICAgICBpbmNsdWRlOiB7XG4gICAgICAgIGJ1aWxkaW5nczogdHJ1ZSxcbiAgICAgICAgYmlsbGluZ1NldHVwOiB0cnVlXG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBpZiAoIW9yZGVyKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oeyBlcnJvcjogJ09yZGVyIG5vdCBmb3VuZCcgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlcy5qc29uKG9yZGVyKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgZXJyb3I6ICdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3IgZ2V0dGluZyBvcmRlcicgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRlbGV0ZU9yZGVyKHJlcSwgcmVzKSB7XG4gIGNvbnN0IHsgb3JkZXJJZCB9ID0gcmVxLnBhcmFtcztcbiAgdHJ5IHtcbiAgICBpZiAocmVxLnVzZXIucm9sZSAhPT0gJ1JPTEVfQScpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMykuanNvbih7IGVycm9yOiAnT25seSBEYXRhIEVudHJ5IC8gU2V0dXAgcm9sZSBjYW4gZGVsZXRlIG9yZGVycycgfSk7XG4gICAgfVxuXG4gICAgY29uc3Qgb3JkZXIgPSBhd2FpdCBwcmlzbWEub3JkZXIuZmluZFVuaXF1ZSh7XG4gICAgICB3aGVyZTogeyBpZDogb3JkZXJJZCB9XG4gICAgfSk7XG5cbiAgICBpZiAoIW9yZGVyKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oeyBlcnJvcjogJ09yZGVyIG5vdCBmb3VuZCcgfSk7XG4gICAgfVxuXG4gICAgLy8gRGVsZXRlIHRoZSBvcmRlciBcdTIwMTQgY2FzY2FkaW5nIGRlbGV0ZXMgaGFuZGxlIGJ1aWxkaW5ncywgYXBhcnRtZW50cyxcbiAgICAvLyBhdWRpdCBsb2dzLCBiaWxsaW5nIHNldHVwIChhbmQgaXRzIGNoaWxkcmVuKSwgYW5kIGJpbGwgbGluZXMuXG4gICAgYXdhaXQgcHJpc21hLm9yZGVyLmRlbGV0ZSh7XG4gICAgICB3aGVyZTogeyBpZDogb3JkZXJJZCB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcmVzLmpzb24oeyBtZXNzYWdlOiAnT3JkZXIgYW5kIGFsbCBhc3NvY2lhdGVkIGRhdGEgZGVsZXRlZCBzdWNjZXNzZnVsbHknIH0pO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKCdEZWxldGUgb3JkZXIgZXJyb3I6JywgZXJyKTtcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oeyBlcnJvcjogJ0ludGVybmFsIHNlcnZlciBlcnJvciBkZWxldGluZyBvcmRlcicgfSk7XG4gIH1cbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcaHBcXFxcRG93bmxvYWRzXFxcXERpbyBHcmFjZSAoMylcXFxcRGlvIEdyYWNlICgzKVxcXFxEaW8gR3JhY2VlXFxcXGJhY2tlbmRcXFxcc3JjXFxcXHNlcnZpY2VzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxocFxcXFxEb3dubG9hZHNcXFxcRGlvIEdyYWNlICgzKVxcXFxEaW8gR3JhY2UgKDMpXFxcXERpbyBHcmFjZWVcXFxcYmFja2VuZFxcXFxzcmNcXFxcc2VydmljZXNcXFxcY2FsY3VsYXRpb25TZXJ2aWNlLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9ocC9Eb3dubG9hZHMvRGlvJTIwR3JhY2UlMjAoMykvRGlvJTIwR3JhY2UlMjAoMykvRGlvJTIwR3JhY2VlL2JhY2tlbmQvc3JjL3NlcnZpY2VzL2NhbGN1bGF0aW9uU2VydmljZS5qc1wiOy8qKlxuICogUHVyZSBjYWxjdWxhdGlvbiBmdW5jdGlvbnMgZm9yIHRoZSBBcGFydG1lbnQgZmllbGRzLlxuICogUmUtaW1wbGVtZW50ZWQgb24gdGhlIHNlcnZlci1zaWRlIHRvIGd1YXJhbnRlZSBjb25zaXN0ZW5jeS5cbiAqXG4gKiBOT1RFOiBBbGwgaW53YXJkIGFuZCBpbnN0YWxsYXRpb24gZmllbGRzIG5vdyBzdG9yZSBwZXJjZW50YWdlIHZhbHVlc1xuICogKDAsIDUwLCA3NSwgMTAwKSBpbnN0ZWFkIG9mIHJhdyBjb3VudHMuIFRoZXkgYXJlIG5vcm1hbGl6ZWQgdG8gMC4wXHUyMDEzMS4wXG4gKiBieSBkaXZpZGluZyBieSAxMDAgaW4gdGhlIGNhbGN1bGF0aW9uIGxvZ2ljLlxuICovXG5cbi8vIEhlbHBlciB0byBub3JtYWxpemUgYSBwZXJjZW50YWdlIGZpZWxkICgwLzUwLzc1LzEwMCkgdG8gYSAwLjBcdTIwMTMxLjAgZnJhY3Rpb25cbmZ1bmN0aW9uIHBjdCh2YWwpIHtcbiAgcmV0dXJuIE1hdGgubWluKDEuMCwgTWF0aC5tYXgoMC4wLCAodmFsIHx8IDApIC8gMTAwLjApKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNhbGN1bGF0ZU1hdGVyaWFsSW53YXJkUGN0KGFwdCkge1xuICBjb25zdCBFID0gYXB0LmtpdGNoZW5RdHkgfHwgMDtcbiAgY29uc3QgRiA9IGFwdC53YXJkcm9iZVF0eSB8fCAwO1xuICBjb25zdCBHID0gYXB0LnZhbml0eVF0eSB8fCAwO1xuICBjb25zdCB0b3RhbFF0eSA9IEUgKyBGICsgRztcblxuICBpZiAodG90YWxRdHkgPT09IDApIHJldHVybiAwLjA7XG5cbiAgbGV0IHN1bUtpdGNoZW4gPSAwLjA7XG4gIGlmIChFID4gMCkge1xuICAgIGNvbnN0IGZpZWxkcyA9IFtcbiAgICAgIGFwdC5raXRjaGVuTG93ZXJDYXJjYXNzSW53YXJkLFxuICAgICAgYXB0LmtpdGNoZW5VcHBlckNhcmNhc3NJbndhcmQsXG4gICAgICBhcHQua2l0Y2hlblN0b25lSW53YXJkLFxuICAgICAgYXB0LmtpdGNoZW5TaHV0dGVyc0lud2FyZCB8fCBhcHQua2l0Y2hlblNodXR0ZXJJbndhcmQgfHwgMCxcbiAgICAgIGFwdC5raXRjaGVuSGFyZHdhcmVJbndhcmQsXG4gICAgICBhcHQua2l0Y2hlbkFwcGxpYW5jZXNJbndhcmQgfHwgYXB0LmtpdGNoZW5BcHBsaWFuY2VJbndhcmQgfHwgMFxuICAgIF07XG4gICAgc3VtS2l0Y2hlbiA9IGZpZWxkcy5yZWR1Y2UoKHN1bSwgdmFsKSA9PiBzdW0gKyBwY3QodmFsKSwgMCkgLyA2LjA7XG4gIH1cblxuICBsZXQgc3VtV2FyZHJvYmUgPSAwLjA7XG4gIGlmIChGID4gMCkge1xuICAgIGNvbnN0IGZpZWxkcyA9IFtcbiAgICAgIGFwdC53YXJkcm9iZXNDYWJpbmV0c0lud2FyZCB8fCBhcHQud2FyZHJvYmVDYWJpbmV0SW53YXJkIHx8IDAsXG4gICAgICBhcHQud2FyZHJvYmVTaHV0dGVySGFyZHdhcmVJbndhcmQgfHwgMFxuICAgIF07XG4gICAgc3VtV2FyZHJvYmUgPSBmaWVsZHMucmVkdWNlKChzdW0sIHZhbCkgPT4gc3VtICsgcGN0KHZhbCksIDApIC8gMi4wO1xuICB9XG5cbiAgbGV0IHN1bVZhbml0eSA9IDAuMDtcbiAgaWYgKEcgPiAwKSB7XG4gICAgY29uc3QgZmllbGRzID0gW1xuICAgICAgYXB0LnZhbml0eUNhYmluZXRzSW53YXJkIHx8IGFwdC52YW5pdHlDYWJpbmV0SW53YXJkIHx8IDAsXG4gICAgICBhcHQudmFuaXR5U2h1dHRlckhhcmR3YXJlSW53YXJkIHx8IDBcbiAgICBdO1xuICAgIHN1bVZhbml0eSA9IGZpZWxkcy5yZWR1Y2UoKHN1bSwgdmFsKSA9PiBzdW0gKyBwY3QodmFsKSwgMCkgLyAyLjA7XG4gIH1cblxuICBjb25zdCB3ZWlnaHRlZFN1bSA9IChzdW1LaXRjaGVuICogRSkgKyAoc3VtV2FyZHJvYmUgKiBGKSArIChzdW1WYW5pdHkgKiBHKTtcbiAgcmV0dXJuIHdlaWdodGVkU3VtIC8gdG90YWxRdHk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjYWxjdWxhdGVRQ0dhdGUoYXB0LCBwcm9kdWN0KSB7XG4gIGNvbnN0IEUgPSBhcHQua2l0Y2hlblF0eSB8fCAwO1xuICBjb25zdCBGID0gYXB0LndhcmRyb2JlUXR5IHx8IDA7XG4gIGNvbnN0IEcgPSBhcHQudmFuaXR5UXR5IHx8IDA7XG5cbiAgaWYgKHByb2R1Y3QgPT09IFwia2l0Y2hlblwiKSB7XG4gICAgaWYgKEUgPT09IDApIHJldHVybiBcIk4vQVwiO1xuICAgIC8vIEFsbCBpbnN0YWxsYXRpb24gZmllbGRzIG11c3QgYmUgYXQgMTAwJVxuICAgIGNvbnN0IGluc3RhbGxDb21wbGV0ZSA9IFtcbiAgICAgIGFwdC5raXRjaGVuTG93ZXJDYXJjYXNzSW5zdGFsbGVkLFxuICAgICAgYXB0LmtpdGNoZW5VcHBlckNhcmNhc3NJbnN0YWxsZWQsXG4gICAgICBhcHQua2l0Y2hlblN0b25lSW5zdGFsbGVkLFxuICAgICAgYXB0LmtpdGNoZW5TaHV0dGVyc0hhcmR3YXJlSW5zdGFsbGVkIHx8IGFwdC5raXRjaGVuU2h1dHRlckhhcmR3YXJlSW5zdGFsbGVkIHx8IDAsXG4gICAgICBhcHQua2l0Y2hlbkFwcGxpYW5jZXNJbnN0YWxsZWQgfHwgYXB0LmtpdGNoZW5BcHBsaWFuY2VJbnN0YWxsZWQgfHwgMFxuICAgIF0uZXZlcnkodmFsID0+ICh2YWwgfHwgMCkgPj0gMTAwKTtcblxuICAgIGlmICghaW5zdGFsbENvbXBsZXRlKSByZXR1cm4gXCJJbnN0YWxsYXRpb24gUGVuZGluZ1wiO1xuXG4gICAgY29uc3QgcWNGaWVsZHMgPSBbXG4gICAgICBhcHQua2l0Y2hlblFDX1Zpc2libGVTY3Jld3MsXG4gICAgICBhcHQua2l0Y2hlblFDX0NoaXBwaW5nLFxuICAgICAgYXB0LmtpdGNoZW5RQ19GaWxsZXJNaXNzaW5nLFxuICAgICAgYXB0LmtpdGNoZW5RQ19TY3JhdGNoZXMsXG4gICAgICBhcHQua2l0Y2hlblFDX0RyYXdlcnNGdW5jdGlvbixcbiAgICAgIGFwdC5raXRjaGVuUUNfQ3V0bGVyeVRyYXksXG4gICAgICBhcHQua2l0Y2hlblFDX0Rpc2hEcmFpbmVyXG4gICAgXTtcblxuICAgIGlmIChxY0ZpZWxkcy5zb21lKHZhbCA9PiB2YWwgPT09IFwiTm90IE9LXCIpKSByZXR1cm4gXCJSZWplY3RlZFwiO1xuICAgIGlmIChxY0ZpZWxkcy5zb21lKHZhbCA9PiB2YWwgPT09IG51bGwgfHwgdmFsID09PSB1bmRlZmluZWQgfHwgdmFsID09PSBcIlwiKSkgcmV0dXJuIFwiUUMgUGVuZGluZ1wiO1xuICAgIHJldHVybiBcIkFwcHJvdmVkXCI7XG4gIH1cblxuICBpZiAocHJvZHVjdCA9PT0gXCJ3YXJkcm9iZVwiKSB7XG4gICAgaWYgKEYgPT09IDApIHJldHVybiBcIk4vQVwiO1xuICAgIGNvbnN0IGluc3RhbGxDb21wbGV0ZSA9IFtcbiAgICAgIGFwdC53YXJkcm9iZXNDYWJpbmV0c0luc3RhbGxlZCB8fCBhcHQud2FyZHJvYmVDYWJpbmV0SW5zdGFsbGVkIHx8IDAsXG4gICAgICBhcHQud2FyZHJvYmVTaHV0dGVySGFyZHdhcmVJbnN0YWxsZWQgfHwgMFxuICAgIF0uZXZlcnkodmFsID0+ICh2YWwgfHwgMCkgPj0gMTAwKTtcblxuICAgIGlmICghaW5zdGFsbENvbXBsZXRlKSByZXR1cm4gXCJJbnN0YWxsYXRpb24gUGVuZGluZ1wiO1xuXG4gICAgY29uc3QgcWNGaWVsZHMgPSBbXG4gICAgICBhcHQud2FyZHJvYmVRQ19WaXNpYmxlU2NyZXdzLFxuICAgICAgYXB0LndhcmRyb2JlUUNfQ2hpcHBpbmcsXG4gICAgICBhcHQud2FyZHJvYmVRQ19GaWxsZXJNaXNzaW5nLFxuICAgICAgYXB0LndhcmRyb2JlUUNfU2NyYXRjaGVzLFxuICAgICAgYXB0LndhcmRyb2JlUUNfRHJhd2Vyc0Z1bmN0aW9uXG4gICAgXTtcblxuICAgIGlmIChxY0ZpZWxkcy5zb21lKHZhbCA9PiB2YWwgPT09IFwiTm90IE9LXCIpKSByZXR1cm4gXCJSZWplY3RlZFwiO1xuICAgIGlmIChxY0ZpZWxkcy5zb21lKHZhbCA9PiB2YWwgPT09IG51bGwgfHwgdmFsID09PSB1bmRlZmluZWQgfHwgdmFsID09PSBcIlwiKSkgcmV0dXJuIFwiUUMgUGVuZGluZ1wiO1xuICAgIHJldHVybiBcIkFwcHJvdmVkXCI7XG4gIH1cblxuICBpZiAocHJvZHVjdCA9PT0gXCJ2YW5pdHlcIikge1xuICAgIGlmIChHID09PSAwKSByZXR1cm4gXCJOL0FcIjtcbiAgICBjb25zdCBpbnN0YWxsQ29tcGxldGUgPSBbXG4gICAgICBhcHQudmFuaXR5Q2FiaW5ldHNJbnN0YWxsZWQgfHwgYXB0LnZhbml0eUNhYmluZXRJbnN0YWxsZWQgfHwgMCxcbiAgICAgIGFwdC52YW5pdHlTaHV0dGVySGFyZHdhcmVJbnN0YWxsZWQgfHwgMFxuICAgIF0uZXZlcnkodmFsID0+ICh2YWwgfHwgMCkgPj0gMTAwKTtcblxuICAgIGlmICghaW5zdGFsbENvbXBsZXRlKSByZXR1cm4gXCJJbnN0YWxsYXRpb24gUGVuZGluZ1wiO1xuXG4gICAgY29uc3QgcWNGaWVsZHMgPSBbXG4gICAgICBhcHQudmFuaXR5UUNfVmlzaWJsZVNjcmV3cyxcbiAgICAgIGFwdC52YW5pdHlRQ19DaGlwcGluZyxcbiAgICAgIGFwdC52YW5pdHlRQ19GaWxsZXJNaXNzaW5nLFxuICAgICAgYXB0LnZhbml0eVFDX1NjcmF0Y2hlcyxcbiAgICAgIGFwdC52YW5pdHlRQ19EcmF3ZXJzRnVuY3Rpb25cbiAgICBdO1xuXG4gICAgaWYgKHFjRmllbGRzLnNvbWUodmFsID0+IHZhbCA9PT0gXCJOb3QgT0tcIikpIHJldHVybiBcIlJlamVjdGVkXCI7XG4gICAgaWYgKHFjRmllbGRzLnNvbWUodmFsID0+IHZhbCA9PT0gbnVsbCB8fCB2YWwgPT09IHVuZGVmaW5lZCB8fCB2YWwgPT09IFwiXCIpKSByZXR1cm4gXCJRQyBQZW5kaW5nXCI7XG4gICAgcmV0dXJuIFwiQXBwcm92ZWRcIjtcbiAgfVxuXG4gIHJldHVybiBcIk4vQVwiO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2FsY3VsYXRlS2l0Y2hlbkNvbXBsZXRpb25QY3QoYXB0LCBraXRjaGVuUUNHYXRlKSB7XG4gIGNvbnN0IEUgPSBhcHQua2l0Y2hlblF0eSB8fCAwO1xuICBpZiAoRSA9PT0gMCkgcmV0dXJuIDAuMDtcblxuICBjb25zdCBoYW5kb3ZlckFwcHJvdmVkID0ga2l0Y2hlblFDR2F0ZSA9PT0gXCJBcHByb3ZlZFwiO1xuICBjb25zdCBmaWVsZHMgPSBbXG4gICAgYXB0LmtpdGNoZW5Mb3dlckNhcmNhc3NJbnN0YWxsZWQsXG4gICAgYXB0LmtpdGNoZW5VcHBlckNhcmNhc3NJbnN0YWxsZWQsXG4gICAgYXB0LmtpdGNoZW5TdG9uZUluc3RhbGxlZCxcbiAgICBhcHQua2l0Y2hlblNodXR0ZXJzSGFyZHdhcmVJbnN0YWxsZWQgfHwgYXB0LmtpdGNoZW5TaHV0dGVySGFyZHdhcmVJbnN0YWxsZWQgfHwgMCxcbiAgICBhcHQua2l0Y2hlbkFwcGxpYW5jZXNJbnN0YWxsZWQgfHwgYXB0LmtpdGNoZW5BcHBsaWFuY2VJbnN0YWxsZWQgfHwgMFxuICBdO1xuXG4gIGNvbnN0IHN1bUluc3RhbGwgPSBmaWVsZHMucmVkdWNlKChzdW0sIHZhbCkgPT4gc3VtICsgcGN0KHZhbCksIDApO1xuICBjb25zdCBoYW5kb3ZlclZhbCA9IHBjdChhcHQua2l0Y2hlbkhhbmRlZE92ZXIpO1xuICBjb25zdCBoYW5kb3ZlckNvbnRyaWIgPSAoaGFuZG92ZXJBcHByb3ZlZCAmJiBoYW5kb3ZlclZhbCA+PSAxLjApID8gMS4wIDogMC4wO1xuXG4gIHJldHVybiAoc3VtSW5zdGFsbCArIGhhbmRvdmVyQ29udHJpYikgLyA2LjA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjYWxjdWxhdGVXYXJkcm9iZUNvbXBsZXRpb25QY3QoYXB0LCB3YXJkcm9iZVFDR2F0ZSkge1xuICBjb25zdCBGID0gYXB0LndhcmRyb2JlUXR5IHx8IDA7XG4gIGlmIChGID09PSAwKSByZXR1cm4gMC4wO1xuXG4gIGNvbnN0IGhhbmRvdmVyQXBwcm92ZWQgPSB3YXJkcm9iZVFDR2F0ZSA9PT0gXCJBcHByb3ZlZFwiO1xuICBjb25zdCBmaWVsZHMgPSBbXG4gICAgYXB0LndhcmRyb2Jlc0NhYmluZXRzSW5zdGFsbGVkIHx8IGFwdC53YXJkcm9iZUNhYmluZXRJbnN0YWxsZWQgfHwgMCxcbiAgICBhcHQud2FyZHJvYmVTaHV0dGVySGFyZHdhcmVJbnN0YWxsZWQgfHwgMFxuICBdO1xuXG4gIGNvbnN0IHN1bUluc3RhbGwgPSBmaWVsZHMucmVkdWNlKChzdW0sIHZhbCkgPT4gc3VtICsgcGN0KHZhbCksIDApO1xuICBjb25zdCBoYW5kb3ZlclZhbCA9IHBjdChhcHQud2FyZHJvYmVIYW5kZWRPdmVyKTtcbiAgY29uc3QgaGFuZG92ZXJDb250cmliID0gKGhhbmRvdmVyQXBwcm92ZWQgJiYgaGFuZG92ZXJWYWwgPj0gMS4wKSA/IDEuMCA6IDAuMDtcblxuICByZXR1cm4gKHN1bUluc3RhbGwgKyBoYW5kb3ZlckNvbnRyaWIpIC8gMy4wO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2FsY3VsYXRlVmFuaXR5Q29tcGxldGlvblBjdChhcHQsIHZhbml0eVFDR2F0ZSkge1xuICBjb25zdCBHID0gYXB0LnZhbml0eVF0eSB8fCAwO1xuICBpZiAoRyA9PT0gMCkgcmV0dXJuIDAuMDtcblxuICBjb25zdCBoYW5kb3ZlckFwcHJvdmVkID0gdmFuaXR5UUNHYXRlID09PSBcIkFwcHJvdmVkXCI7XG4gIGNvbnN0IGZpZWxkcyA9IFtcbiAgICBhcHQudmFuaXR5Q2FiaW5ldHNJbnN0YWxsZWQgfHwgYXB0LnZhbml0eUNhYmluZXRJbnN0YWxsZWQgfHwgMCxcbiAgICBhcHQudmFuaXR5U2h1dHRlckhhcmR3YXJlSW5zdGFsbGVkIHx8IDBcbiAgXTtcblxuICBjb25zdCBzdW1JbnN0YWxsID0gZmllbGRzLnJlZHVjZSgoc3VtLCB2YWwpID0+IHN1bSArIHBjdCh2YWwpLCAwKTtcbiAgY29uc3QgaGFuZG92ZXJWYWwgPSBwY3QoYXB0LnZhbml0eUhhbmRlZE92ZXIpO1xuICBjb25zdCBoYW5kb3ZlckNvbnRyaWIgPSAoaGFuZG92ZXJBcHByb3ZlZCAmJiBoYW5kb3ZlclZhbCA+PSAxLjApID8gMS4wIDogMC4wO1xuXG4gIHJldHVybiAoc3VtSW5zdGFsbCArIGhhbmRvdmVyQ29udHJpYikgLyAzLjA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjYWxjdWxhdGVPdmVyYWxsQ29tcGxldGlvblBjdChhcHQsIG1hdGVyaWFsV2VpZ2h0LCBleGVjdXRpb25XZWlnaHQsIG1hdFBjdCwga2l0UGN0LCB3YXJkUGN0LCB2YW5QY3QpIHtcbiAgY29uc3QgRSA9IGFwdC5raXRjaGVuUXR5IHx8IDA7XG4gIGNvbnN0IEYgPSBhcHQud2FyZHJvYmVRdHkgfHwgMDtcbiAgY29uc3QgRyA9IGFwdC52YW5pdHlRdHkgfHwgMDtcbiAgY29uc3QgdG90YWxRdHkgPSBFICsgRiArIEc7XG5cbiAgaWYgKHRvdGFsUXR5ID09PSAwKSByZXR1cm4gMC4wO1xuXG4gIGNvbnN0IHdlaWdodGVkSW5zdGFsbFBjdCA9ICgoa2l0UGN0ICogRSkgKyAod2FyZFBjdCAqIEYpICsgKHZhblBjdCAqIEcpKSAvIHRvdGFsUXR5O1xuICByZXR1cm4gKG1hdFBjdCAqIG1hdGVyaWFsV2VpZ2h0KSArICh3ZWlnaHRlZEluc3RhbGxQY3QgKiBleGVjdXRpb25XZWlnaHQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2FsY3VsYXRlSGFuZG92ZXJBcHByb3ZhbFN0YXR1cyhraXRHYXRlLCB3YXJkR2F0ZSwgdmFuR2F0ZSwgRSwgRiwgRykge1xuICBjb25zdCBhY3RpdmVHYXRlcyA9IFtdO1xuICBpZiAoRSA+IDApIGFjdGl2ZUdhdGVzLnB1c2goa2l0R2F0ZSk7XG4gIGlmIChGID4gMCkgYWN0aXZlR2F0ZXMucHVzaCh3YXJkR2F0ZSk7XG4gIGlmIChHID4gMCkgYWN0aXZlR2F0ZXMucHVzaCh2YW5HYXRlKTtcblxuICBpZiAoYWN0aXZlR2F0ZXMubGVuZ3RoID09PSAwKSByZXR1cm4gXCJOb3QgQXBwcm92ZWRcIjtcblxuICBpZiAoYWN0aXZlR2F0ZXMuc29tZShnID0+IGcgPT09IFwiUmVqZWN0ZWRcIikpIHJldHVybiBcIlFDIFJlamVjdGVkXCI7XG4gIGlmIChhY3RpdmVHYXRlcy5zb21lKGcgPT4gZyA9PT0gXCJRQyBQZW5kaW5nXCIpKSByZXR1cm4gXCJRQyBQZW5kaW5nXCI7XG4gIGlmIChhY3RpdmVHYXRlcy5zb21lKGcgPT4gZyA9PT0gXCJJbnN0YWxsYXRpb24gUGVuZGluZ1wiKSkgcmV0dXJuIFwiSW5zdGFsbGF0aW9uIFBlbmRpbmdcIjtcbiAgaWYgKGFjdGl2ZUdhdGVzLmV2ZXJ5KGcgPT4gZyA9PT0gXCJBcHByb3ZlZFwiKSkgcmV0dXJuIFwiQXBwcm92ZWRcIjtcblxuICByZXR1cm4gXCJJbnN0YWxsYXRpb24gUGVuZGluZ1wiO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2FsY3VsYXRlQXBhcnRtZW50U3RhdHVzKGFwdCwgaGFuZG92ZXJTdGF0dXMsIG1hdFBjdCkge1xuICBpZiAoaGFuZG92ZXJTdGF0dXMgPT09IFwiUUMgUmVqZWN0ZWRcIikgcmV0dXJuIFwiUUMgUmVqZWN0ZWRcIjtcbiAgaWYgKGhhbmRvdmVyU3RhdHVzID09PSBcIlFDIFBlbmRpbmdcIikgcmV0dXJuIFwiUUMgUGVuZGluZ1wiO1xuXG4gIGNvbnN0IEUgPSBhcHQua2l0Y2hlblF0eSB8fCAwO1xuICBjb25zdCBGID0gYXB0LndhcmRyb2JlUXR5IHx8IDA7XG4gIGNvbnN0IEcgPSBhcHQudmFuaXR5UXR5IHx8IDA7XG5cbiAgaWYgKGhhbmRvdmVyU3RhdHVzID09PSBcIkFwcHJvdmVkXCIpIHtcbiAgICAvLyBjaGVjayBpZiBhbGwgaGFuZGVkIG92ZXIgKDEwMCUpXG4gICAgY29uc3Qga2l0Y2hlbkhhbmRlZCA9IEUgPiAwID8gKChhcHQua2l0Y2hlbkhhbmRlZE92ZXIgfHwgMCkgPj0gMTAwKSA6IHRydWU7XG4gICAgY29uc3Qgd2FyZHJvYmVIYW5kZWQgPSBGID4gMCA/ICgoYXB0LndhcmRyb2JlSGFuZGVkT3ZlciB8fCAwKSA+PSAxMDApIDogdHJ1ZTtcbiAgICBjb25zdCB2YW5pdHlIYW5kZWQgPSBHID4gMCA/ICgoYXB0LnZhbml0eUhhbmRlZE92ZXIgfHwgMCkgPj0gMTAwKSA6IHRydWU7XG5cbiAgICBpZiAoa2l0Y2hlbkhhbmRlZCAmJiB3YXJkcm9iZUhhbmRlZCAmJiB2YW5pdHlIYW5kZWQpIHtcbiAgICAgIHJldHVybiBcIkNvbXBsZXRlZFwiO1xuICAgIH1cbiAgICByZXR1cm4gXCJSZWFkeSBmb3IgSGFuZG92ZXJcIjtcbiAgfVxuXG4gIC8vIENoZWNrIFN0YWdlLTIgcHJvZ3Jlc3MgXHUyMDE0IGFueSBpbnN0YWxsYXRpb24gZmllbGQgPiAwIG1lYW5zIHByb2dyZXNzXG4gIGNvbnN0IGhhc1N0YWdlMlByb2dyZXNzID0gW1xuICAgIGFwdC5raXRjaGVuTG93ZXJDYXJjYXNzSW5zdGFsbGVkLFxuICAgIGFwdC5raXRjaGVuVXBwZXJDYXJjYXNzSW5zdGFsbGVkLFxuICAgIGFwdC5raXRjaGVuU3RvbmVJbnN0YWxsZWQsXG4gICAgYXB0LmtpdGNoZW5TaHV0dGVyc0hhcmR3YXJlSW5zdGFsbGVkIHx8IGFwdC5raXRjaGVuU2h1dHRlckhhcmR3YXJlSW5zdGFsbGVkIHx8IDAsXG4gICAgYXB0LmtpdGNoZW5BcHBsaWFuY2VzSW5zdGFsbGVkIHx8IGFwdC5raXRjaGVuQXBwbGlhbmNlSW5zdGFsbGVkIHx8IDAsXG4gICAgYXB0LmtpdGNoZW5IYW5kZWRPdmVyLFxuICAgIGFwdC53YXJkcm9iZXNDYWJpbmV0c0luc3RhbGxlZCB8fCBhcHQud2FyZHJvYmVDYWJpbmV0SW5zdGFsbGVkIHx8IDAsXG4gICAgYXB0LndhcmRyb2JlU2h1dHRlckhhcmR3YXJlSW5zdGFsbGVkIHx8IDAsXG4gICAgYXB0LndhcmRyb2JlSGFuZGVkT3ZlcixcbiAgICBhcHQudmFuaXR5Q2FiaW5ldHNJbnN0YWxsZWQgfHwgYXB0LnZhbml0eUNhYmluZXRJbnN0YWxsZWQgfHwgMCxcbiAgICBhcHQudmFuaXR5U2h1dHRlckhhcmR3YXJlSW5zdGFsbGVkIHx8IDAsXG4gICAgYXB0LnZhbml0eUhhbmRlZE92ZXJcbiAgXS5zb21lKHZhbCA9PiAodmFsIHx8IDApID4gMCk7XG5cbiAgaWYgKGhhc1N0YWdlMlByb2dyZXNzKSByZXR1cm4gXCJFeGVjdXRpb24gSW4gUHJvZ3Jlc3NcIjtcbiAgaWYgKG1hdFBjdCA+PSAxLjApIHJldHVybiBcIk1hdGVyaWFsIFJlYWR5XCI7XG4gIGlmIChtYXRQY3QgPiAwLjApIHJldHVybiBcIk1hdGVyaWFsIElud2FyZFwiO1xuXG4gIHJldHVybiBcIk5vdCBTdGFydGVkXCI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjYWxjdWxhdGVEZWxheURheXMocGxhbm5lZENvbXAsIGFjdHVhbENvbXAsIHJlcG9ydERhdGUpIHtcbiAgaWYgKCFwbGFubmVkQ29tcCkgcmV0dXJuIDA7XG5cbiAgY29uc3QgcGxhbm5lZCA9IG5ldyBEYXRlKHBsYW5uZWRDb21wKTtcbiAgY29uc3QgY29tcCA9IGFjdHVhbENvbXAgPyBuZXcgRGF0ZShhY3R1YWxDb21wKSA6IG5ldyBEYXRlKHJlcG9ydERhdGUpO1xuXG4gIGNvbnN0IGRpZmZUaW1lID0gY29tcC5nZXRUaW1lKCkgLSBwbGFubmVkLmdldFRpbWUoKTtcbiAgY29uc3QgZGlmZkRheXMgPSBNYXRoLmNlaWwoZGlmZlRpbWUgLyAoMTAwMCAqIDYwICogNjAgKiAyNCkpO1xuXG4gIHJldHVybiBNYXRoLm1heCgwLCBkaWZmRGF5cyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjYWxjdWxhdGVIZWFsdGgoYXB0LCBkZWxheURheXMsIG92ZXJhbGxQY3QsIHN0YXR1cywgY29uZmlnKSB7XG4gIGlmIChzdGF0dXMgPT09IFwiQ29tcGxldGVkXCIpIHtcbiAgICBpZiAoZGVsYXlEYXlzID4gMCkge1xuICAgICAgcmV0dXJuIFwiRGVsYXllZFwiO1xuICAgIH1cbiAgICByZXR1cm4gXCJFeGNlbGxlbnRcIjtcbiAgfVxuXG4gIGlmIChkZWxheURheXMgPiAwKSB7XG4gICAgcmV0dXJuIFwiQ3JpdGljYWxcIjtcbiAgfVxuXG4gIHJldHVybiBcIkV4Y2VsbGVudFwiO1xufVxuXG4vKipcbiAqIFJ1bnMgYWxsIGNhbGN1bGF0ZWQgZmllbGQgbG9naWMgZm9yIGFuIGFwYXJ0bWVudCByb3cuXG4gKiBSZXR1cm5zIHRoZSB1cGRhdGVkIGZpZWxkcyBvYmplY3QuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWNhbGN1bGF0ZUFwYXJ0bWVudChhcHQsIGJ1aWxkaW5nQ29uZmlnKSB7XG4gIGNvbnN0IHJlcG9ydERhdGUgPSBidWlsZGluZ0NvbmZpZy5yZXBvcnREYXRlIHx8IG5ldyBEYXRlKCk7XG4gIGNvbnN0IG1hdGVyaWFsV2VpZ2h0ID0gYnVpbGRpbmdDb25maWcubWF0ZXJpYWxXZWlnaHQgPz8gMC4zO1xuICBjb25zdCBleGVjdXRpb25XZWlnaHQgPSBidWlsZGluZ0NvbmZpZy5leGVjdXRpb25XZWlnaHQgPz8gMC43O1xuXG4gIC8vIDEuIE1hdGVyaWFsIElud2FyZCAlXG4gIGNvbnN0IG1hdFBjdCA9IGNhbGN1bGF0ZU1hdGVyaWFsSW53YXJkUGN0KGFwdCk7XG5cbiAgLy8gMi4gUUMgR2F0ZXNcbiAgY29uc3Qga2l0R2F0ZSA9IGNhbGN1bGF0ZVFDR2F0ZShhcHQsIFwia2l0Y2hlblwiKTtcbiAgY29uc3Qgd2FyZEdhdGUgPSBjYWxjdWxhdGVRQ0dhdGUoYXB0LCBcIndhcmRyb2JlXCIpO1xuICBjb25zdCB2YW5HYXRlID0gY2FsY3VsYXRlUUNHYXRlKGFwdCwgXCJ2YW5pdHlcIik7XG5cbiAgLy8gMy4gUHJvZHVjdCBjb21wbGV0aW9uICVzXG4gIGNvbnN0IGtpdFBjdCA9IGNhbGN1bGF0ZUtpdGNoZW5Db21wbGV0aW9uUGN0KGFwdCwga2l0R2F0ZSk7XG4gIGNvbnN0IHdhcmRQY3QgPSBjYWxjdWxhdGVXYXJkcm9iZUNvbXBsZXRpb25QY3QoYXB0LCB3YXJkR2F0ZSk7XG4gIGNvbnN0IHZhblBjdCA9IGNhbGN1bGF0ZVZhbml0eUNvbXBsZXRpb25QY3QoYXB0LCB2YW5HYXRlKTtcblxuICAvLyA0LiBPdmVyYWxsIENvbXBsZXRpb24gJVxuICBjb25zdCBvdmVyYWxsUGN0ID0gY2FsY3VsYXRlT3ZlcmFsbENvbXBsZXRpb25QY3QoYXB0LCBtYXRlcmlhbFdlaWdodCwgZXhlY3V0aW9uV2VpZ2h0LCBtYXRQY3QsIGtpdFBjdCwgd2FyZFBjdCwgdmFuUGN0KTtcblxuICAvLyA1LiBIYW5kb3ZlciBBcHByb3ZhbCBTdGF0dXNcbiAgY29uc3QgRSA9IGFwdC5raXRjaGVuUXR5IHx8IDA7XG4gIGNvbnN0IEYgPSBhcHQud2FyZHJvYmVRdHkgfHwgMDtcbiAgY29uc3QgRyA9IGFwdC52YW5pdHlRdHkgfHwgMDtcbiAgY29uc3QgaGFuZG92ZXJTdGF0dXMgPSBjYWxjdWxhdGVIYW5kb3ZlckFwcHJvdmFsU3RhdHVzKGtpdEdhdGUsIHdhcmRHYXRlLCB2YW5HYXRlLCBFLCBGLCBHKTtcblxuICAvLyA2LiBBcGFydG1lbnQgU3RhdHVzXG4gIGNvbnN0IHN0YXR1cyA9IGNhbGN1bGF0ZUFwYXJ0bWVudFN0YXR1cyhhcHQsIGhhbmRvdmVyU3RhdHVzLCBtYXRQY3QpO1xuXG4gIC8vIDcuIERlbGF5IERheXNcbiAgY29uc3QgZGVsYXlEYXlzID0gY2FsY3VsYXRlRGVsYXlEYXlzKGFwdC5wbGFubmVkQ29tcGxldGlvbiwgYXB0LmFjdHVhbENvbXBsZXRpb24sIHJlcG9ydERhdGUpO1xuXG4gIC8vIDguIEhlYWx0aFxuICBjb25zdCBoZWFsdGggPSBjYWxjdWxhdGVIZWFsdGgoYXB0LCBkZWxheURheXMsIG92ZXJhbGxQY3QsIHN0YXR1cywgYnVpbGRpbmdDb25maWcpO1xuXG4gIHJldHVybiB7XG4gICAgLi4uYXB0LFxuICAgIG1hdGVyaWFsSW53YXJkUGN0OiBNYXRoLnJvdW5kKG1hdFBjdCAqIDEwMDApIC8gMTAwMCxcbiAgICBraXRjaGVuQ29tcGxldGlvblBjdDogTWF0aC5yb3VuZChraXRQY3QgKiAxMDAwKSAvIDEwMDAsXG4gICAgd2FyZHJvYmVDb21wbGV0aW9uUGN0OiBNYXRoLnJvdW5kKHdhcmRQY3QgKiAxMDAwKSAvIDEwMDAsXG4gICAgdmFuaXR5Q29tcGxldGlvblBjdDogTWF0aC5yb3VuZCh2YW5QY3QgKiAxMDAwKSAvIDEwMDAsXG4gICAgb3ZlcmFsbENvbXBsZXRpb25QY3Q6IE1hdGgucm91bmQob3ZlcmFsbFBjdCAqIDEwMDApIC8gMTAwMCxcbiAgICBraXRjaGVuUUNHYXRlOiBraXRHYXRlLFxuICAgIHdhcmRyb2JlUUNHYXRlOiB3YXJkR2F0ZSxcbiAgICB2YW5pdHlRQ0dhdGU6IHZhbkdhdGUsXG4gICAgaGFuZG92ZXJBcHByb3ZhbFN0YXR1czogaGFuZG92ZXJTdGF0dXMsXG4gICAgYXBhcnRtZW50U3RhdHVzOiBzdGF0dXMsXG4gICAgZGVsYXlEYXlzLFxuICAgIGhlYWx0aFxuICB9O1xufVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxocFxcXFxEb3dubG9hZHNcXFxcRGlvIEdyYWNlICgzKVxcXFxEaW8gR3JhY2UgKDMpXFxcXERpbyBHcmFjZWVcXFxcYmFja2VuZFxcXFxzcmNcXFxcY29udHJvbGxlcnNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGhwXFxcXERvd25sb2Fkc1xcXFxEaW8gR3JhY2UgKDMpXFxcXERpbyBHcmFjZSAoMylcXFxcRGlvIEdyYWNlZVxcXFxiYWNrZW5kXFxcXHNyY1xcXFxjb250cm9sbGVyc1xcXFxidWlsZGluZ0NvbnRyb2xsZXIuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL2hwL0Rvd25sb2Fkcy9EaW8lMjBHcmFjZSUyMCgzKS9EaW8lMjBHcmFjZSUyMCgzKS9EaW8lMjBHcmFjZWUvYmFja2VuZC9zcmMvY29udHJvbGxlcnMvYnVpbGRpbmdDb250cm9sbGVyLmpzXCI7aW1wb3J0IHsgUHJpc21hQ2xpZW50IH0gZnJvbSAnQHByaXNtYS9jbGllbnQnO1xuaW1wb3J0IHsgcmVjYWxjdWxhdGVBcGFydG1lbnQgfSBmcm9tICcuLi9zZXJ2aWNlcy9jYWxjdWxhdGlvblNlcnZpY2UuanMnO1xuXG5jb25zdCBwcmlzbWEgPSBuZXcgUHJpc21hQ2xpZW50KCk7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBsaXN0QnVpbGRpbmdzKHJlcSwgcmVzKSB7XG4gIGNvbnN0IHsgb3JkZXJJZCB9ID0gcmVxLnBhcmFtcztcbiAgdHJ5IHtcbiAgICBjb25zdCBidWlsZGluZ3MgPSBhd2FpdCBwcmlzbWEuYnVpbGRpbmcuZmluZE1hbnkoe1xuICAgICAgd2hlcmU6IHsgb3JkZXJJZCB9LFxuICAgICAgaW5jbHVkZToge1xuICAgICAgICBhcGFydG1lbnRzOiB7XG4gICAgICAgICAgc2VsZWN0OiB7XG4gICAgICAgICAgICBvdmVyYWxsQ29tcGxldGlvblBjdDogdHJ1ZSxcbiAgICAgICAgICAgIGFwYXJ0bWVudFN0YXR1czogdHJ1ZSxcbiAgICAgICAgICAgIGhlYWx0aDogdHJ1ZVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIG9yZGVyQnk6IHsgY3JlYXRlZEF0OiAnYXNjJyB9XG4gICAgfSk7XG5cbiAgICAvLyBDb21wdXRlIG1ldHJpY3MgZm9yIGVhY2ggYnVpbGRpbmdcbiAgICBjb25zdCByZXN1bHQgPSBidWlsZGluZ3MubWFwKGJ1aWxkaW5nID0+IHtcbiAgICAgIGNvbnN0IGFwYXJ0bWVudHMgPSBidWlsZGluZy5hcGFydG1lbnRzO1xuICAgICAgY29uc3QgY291bnQgPSBhcGFydG1lbnRzLmxlbmd0aDtcbiAgICAgIFxuICAgICAgbGV0IHN1bUNvbXBsZXRpb24gPSAwLjA7XG4gICAgICBsZXQgY29tcGxldGVkQ291bnQgPSAwO1xuICAgICAgbGV0IGluUHJvZ3Jlc3NDb3VudCA9IDA7XG4gICAgICBsZXQgZGVsYXllZENvdW50ID0gMDtcbiAgICAgIGxldCBjcml0aWNhbENvdW50ID0gMDtcblxuICAgICAgZm9yIChjb25zdCBhcHQgb2YgYXBhcnRtZW50cykge1xuICAgICAgICBzdW1Db21wbGV0aW9uICs9IGFwdC5vdmVyYWxsQ29tcGxldGlvblBjdCB8fCAwLjA7XG4gICAgICAgIGlmIChhcHQuYXBhcnRtZW50U3RhdHVzID09PSBcIkNvbXBsZXRlZFwiKSBjb21wbGV0ZWRDb3VudCsrO1xuICAgICAgICBlbHNlIGlmIChhcHQuYXBhcnRtZW50U3RhdHVzICE9PSBcIk5vdCBTdGFydGVkXCIpIGluUHJvZ3Jlc3NDb3VudCsrO1xuXG4gICAgICAgIGlmIChhcHQuaGVhbHRoID09PSBcIkRlbGF5ZWRcIikgZGVsYXllZENvdW50Kys7XG4gICAgICAgIGVsc2UgaWYgKGFwdC5oZWFsdGggPT09IFwiQ3JpdGljYWxcIikgY3JpdGljYWxDb3VudCsrO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBvdmVyYWxsQ29tcGxldGlvbiA9IGNvdW50ID4gMCA/IChzdW1Db21wbGV0aW9uIC8gY291bnQpIDogMC4wO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBpZDogYnVpbGRpbmcuaWQsXG4gICAgICAgIG5hbWU6IGJ1aWxkaW5nLm5hbWUsXG4gICAgICAgIGNhcGFjaXR5OiBidWlsZGluZy5jYXBhY2l0eSxcbiAgICAgICAgc2l0ZU5hbWU6IGJ1aWxkaW5nLnNpdGVOYW1lLFxuICAgICAgICByZXBvcnREYXRlOiBidWlsZGluZy5yZXBvcnREYXRlLFxuICAgICAgICBvdmVyYWxsQ29tcGxldGlvbjogTWF0aC5yb3VuZChvdmVyYWxsQ29tcGxldGlvbiAqIDEwMDApIC8gMTAwMCxcbiAgICAgICAgY29tcGxldGVkQ291bnQsXG4gICAgICAgIGluUHJvZ3Jlc3NDb3VudCxcbiAgICAgICAgZGVsYXllZENvdW50OiBkZWxheWVkQ291bnQgKyBjcml0aWNhbENvdW50LFxuICAgICAgICBjcmVhdGVkQXQ6IGJ1aWxkaW5nLmNyZWF0ZWRBdFxuICAgICAgfTtcbiAgICB9KTtcblxuICAgIHJldHVybiByZXMuanNvbihyZXN1bHQpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKCdMaXN0IGJ1aWxkaW5ncyBlcnJvcjonLCBlcnIpO1xuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7IGVycm9yOiAnSW50ZXJuYWwgc2VydmVyIGVycm9yIGxpc3RpbmcgYnVpbGRpbmdzJyB9KTtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY3JlYXRlQnVpbGRpbmcocmVxLCByZXMpIHtcbiAgY29uc3QgeyBvcmRlcklkIH0gPSByZXEucGFyYW1zO1xuICBjb25zdCB7XG4gICAgbmFtZSxcbiAgICBjb3VudCxcbiAgICBjYXBhY2l0eSxcbiAgICBzaXRlTmFtZSxcbiAgICByZXBvcnREYXRlLFxuICAgIG1hdGVyaWFsV2VpZ2h0LFxuICAgIGV4ZWN1dGlvbldlaWdodCxcbiAgICBnb29kVGhyZXNob2xkLFxuICAgIGV4Y2VsbGVudFRocmVzaG9sZCxcbiAgICBkZWxheWVkRGF5c1RocmVzaG9sZCxcbiAgICBjcml0aWNhbERheXNUaHJlc2hvbGRcbiAgfSA9IHJlcS5ib2R5O1xuXG4gIGlmICghY2FwYWNpdHkpIHtcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oeyBlcnJvcjogJ0NhcGFjaXR5IGlzIHJlcXVpcmVkJyB9KTtcbiAgfVxuXG4gIGNvbnN0IHBhcnNlZENhcGFjaXR5ID0gcGFyc2VJbnQoY2FwYWNpdHksIDEwKTtcbiAgaWYgKGlzTmFOKHBhcnNlZENhcGFjaXR5KSB8fCBwYXJzZWRDYXBhY2l0eSA8PSAwKSB7XG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHsgZXJyb3I6ICdDYXBhY2l0eSBtdXN0IGJlIGEgcG9zaXRpdmUgaW50ZWdlcicgfSk7XG4gIH1cblxuICBjb25zdCBudW1Ub3dlcnMgPSBjb3VudCA/IE1hdGgubWF4KDEsIHBhcnNlSW50KGNvdW50LCAxMCkpIDogMTtcbiAgY29uc3QgYmFzZU5hbWUgPSBuYW1lICYmIHR5cGVvZiBuYW1lID09PSAnc3RyaW5nJyAmJiBuYW1lLnRyaW0oKSA/IG5hbWUudHJpbSgpIDogJ1Rvd2VyJztcblxuICB0cnkge1xuICAgIGlmIChyZXEudXNlci5yb2xlICE9PSAnUk9MRV9BJykge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAzKS5qc29uKHsgZXJyb3I6ICdPbmx5IERhdGEgRW50cnkgLyBTZXR1cCByb2xlIGNhbiBhZGQgYnVpbGRpbmdzJyB9KTtcbiAgICB9XG5cbiAgICBjb25zdCBidWlsZGluZ1JlcG9ydERhdGUgPSByZXBvcnREYXRlID8gbmV3IERhdGUocmVwb3J0RGF0ZSkgOiBuZXcgRGF0ZSgpO1xuXG4gICAgY29uc3Qgb3JkZXIgPSBhd2FpdCBwcmlzbWEub3JkZXIuZmluZFVuaXF1ZSh7XG4gICAgICB3aGVyZTogeyBpZDogb3JkZXJJZCB9LFxuICAgICAgc2VsZWN0OiB7IHN1cGVydmlzb3JOYW1lOiB0cnVlLCBjb250cmFjdG9ySWQ6IHRydWUsIGNvbnRyYWN0b3JOYW1lOiB0cnVlIH1cbiAgICB9KTtcbiAgICBjb25zdCBkZWZhdWx0U3VwZXJ2aXNvciA9IG9yZGVyPy5zdXBlcnZpc29yTmFtZSB8fCAnJztcbiAgICBjb25zdCBkZWZhdWx0Q29udHJhY3RvciA9IG9yZGVyPy5jb250cmFjdG9ySWQgfHwgJyc7XG4gICAgY29uc3QgZGVmYXVsdENvbnRyYWN0b3JOYW1lID0gb3JkZXI/LmNvbnRyYWN0b3JOYW1lIHx8ICcnO1xuXG4gICAgY29uc3QgY29tbW9uQ29uZmlnID0ge1xuICAgICAgY2FwYWNpdHk6IHBhcnNlZENhcGFjaXR5LFxuICAgICAgc2l0ZU5hbWU6IHNpdGVOYW1lID8gU3RyaW5nKHNpdGVOYW1lKS50cmltKCkgOiAnJyxcbiAgICAgIHJlcG9ydERhdGU6IGJ1aWxkaW5nUmVwb3J0RGF0ZSxcbiAgICAgIG1hdGVyaWFsV2VpZ2h0OiBtYXRlcmlhbFdlaWdodCAhPT0gdW5kZWZpbmVkID8gcGFyc2VGbG9hdChtYXRlcmlhbFdlaWdodCkgOiAwLjMsXG4gICAgICBleGVjdXRpb25XZWlnaHQ6IGV4ZWN1dGlvbldlaWdodCAhPT0gdW5kZWZpbmVkID8gcGFyc2VGbG9hdChleGVjdXRpb25XZWlnaHQpIDogMC43LFxuICAgICAgZ29vZFRocmVzaG9sZDogZ29vZFRocmVzaG9sZCAhPT0gdW5kZWZpbmVkID8gcGFyc2VGbG9hdChnb29kVGhyZXNob2xkKSA6IDAuNzUsXG4gICAgICBleGNlbGxlbnRUaHJlc2hvbGQ6IGV4Y2VsbGVudFRocmVzaG9sZCAhPT0gdW5kZWZpbmVkID8gcGFyc2VGbG9hdChleGNlbGxlbnRUaHJlc2hvbGQpIDogMC45LFxuICAgICAgZGVsYXllZERheXNUaHJlc2hvbGQ6IGRlbGF5ZWREYXlzVGhyZXNob2xkICE9PSB1bmRlZmluZWQgPyBwYXJzZUludChkZWxheWVkRGF5c1RocmVzaG9sZCwgMTApIDogNyxcbiAgICAgIGNyaXRpY2FsRGF5c1RocmVzaG9sZDogY3JpdGljYWxEYXlzVGhyZXNob2xkICE9PSB1bmRlZmluZWQgPyBwYXJzZUludChjcml0aWNhbERheXNUaHJlc2hvbGQsIDEwKSA6IDE0XG4gICAgfTtcblxuICAgIC8vIFVzZSB0cmFuc2FjdGlvbiB0byBjcmVhdGUgYnVpbGRpbmcocykgYW5kIGFwYXJ0bWVudHNcbiAgICBjb25zdCBjcmVhdGVkQnVpbGRpbmdzID0gYXdhaXQgcHJpc21hLiR0cmFuc2FjdGlvbihhc3luYyAodHgpID0+IHtcbiAgICAgIGNvbnN0IGxpc3QgPSBbXTtcblxuICAgICAgZm9yIChsZXQgdCA9IDE7IHQgPD0gbnVtVG93ZXJzOyB0KyspIHtcbiAgICAgICAgY29uc3QgdG93ZXJOYW1lID0gbnVtVG93ZXJzID4gMSA/IGAke2Jhc2VOYW1lfSAke3R9YCA6IGJhc2VOYW1lO1xuICAgICAgICBjb25zdCBidWlsZGluZ0NvbmZpZyA9IHtcbiAgICAgICAgICBuYW1lOiB0b3dlck5hbWUsXG4gICAgICAgICAgLi4uY29tbW9uQ29uZmlnXG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgYnVpbGRpbmcgPSBhd2FpdCB0eC5idWlsZGluZy5jcmVhdGUoe1xuICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIG9yZGVySWQsXG4gICAgICAgICAgICAuLi5idWlsZGluZ0NvbmZpZ1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gR2VuZXJhdGUgZW1wdHkgYXBhcnRtZW50IHJvd3MgZm9yIHRoaXMgYnVpbGRpbmdcbiAgICAgICAgY29uc3QgYXBhcnRtZW50c0RhdGEgPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gcGFyc2VkQ2FwYWNpdHk7IGkrKykge1xuICAgICAgICAgIGNvbnN0IHJhd0FwdCA9IHtcbiAgICAgICAgICAgIGJ1aWxkaW5nSWQ6IGJ1aWxkaW5nLmlkLFxuICAgICAgICAgICAgc3JObzogaSxcbiAgICAgICAgICAgIGFwYXJ0bWVudE5vOiBudWxsLFxuICAgICAgICAgICAgZmxvb3I6IG51bGwsXG4gICAgICAgICAgICBwcmlvcml0eTogJ05vcm1hbCcsXG4gICAgICAgICAgICBraXRjaGVuUXR5OiBudWxsLFxuICAgICAgICAgICAgd2FyZHJvYmVRdHk6IG51bGwsXG4gICAgICAgICAgICB2YW5pdHlRdHk6IG51bGwsXG4gICAgICAgICAgICBraXRjaGVuVHlwZTogJ0stVHlwZSAxJyxcbiAgICAgICAgICAgIHdhcmRyb2JlVHlwZTogJ1ctVHlwZSAxJyxcbiAgICAgICAgICAgIHZhbml0eVR5cGU6ICdWLVR5cGUgMScsXG4gICAgICAgICAgICBzdXBlcnZpc29yTmFtZTogZGVmYXVsdFN1cGVydmlzb3IsXG4gICAgICAgICAgICByZXNwb25zaWJsZUVuZ2luZWVyOiBkZWZhdWx0U3VwZXJ2aXNvcixcbiAgICAgICAgICAgIGNvbnRyYWN0b3I6IGRlZmF1bHRDb250cmFjdG9yLFxuICAgICAgICAgICAgY29udHJhY3Rvck5hbWU6IGRlZmF1bHRDb250cmFjdG9yTmFtZVxuICAgICAgICAgIH07XG5cbiAgICAgICAgICBjb25zdCBjYWxjdWxhdGVkID0gcmVjYWxjdWxhdGVBcGFydG1lbnQocmF3QXB0LCBidWlsZGluZ0NvbmZpZyk7XG4gICAgICAgICAgYXBhcnRtZW50c0RhdGEucHVzaChjYWxjdWxhdGVkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IHR4LmFwYXJ0bWVudC5jcmVhdGVNYW55KHtcbiAgICAgICAgICBkYXRhOiBhcGFydG1lbnRzRGF0YVxuICAgICAgICB9KTtcblxuICAgICAgICBsaXN0LnB1c2goYnVpbGRpbmcpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gbGlzdDtcbiAgICB9KTtcblxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMSkuanNvbihudW1Ub3dlcnMgPT09IDEgPyBjcmVhdGVkQnVpbGRpbmdzWzBdIDogY3JlYXRlZEJ1aWxkaW5ncyk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0NyZWF0ZSBidWlsZGluZyBlcnJvcjonLCBlcnIpO1xuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7IGVycm9yOiAnSW50ZXJuYWwgc2VydmVyIGVycm9yIGNyZWF0aW5nIGJ1aWxkaW5nJyB9KTtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0QnVpbGRpbmcocmVxLCByZXMpIHtcbiAgY29uc3QgeyBidWlsZGluZ0lkIH0gPSByZXEucGFyYW1zO1xuICB0cnkge1xuICAgIGNvbnN0IGJ1aWxkaW5nID0gYXdhaXQgcHJpc21hLmJ1aWxkaW5nLmZpbmRVbmlxdWUoe1xuICAgICAgd2hlcmU6IHsgaWQ6IGJ1aWxkaW5nSWQgfSxcbiAgICAgIGluY2x1ZGU6IHtcbiAgICAgICAgb3JkZXI6IHtcbiAgICAgICAgICBzZWxlY3Q6IHtcbiAgICAgICAgICAgIGlkOiB0cnVlLFxuICAgICAgICAgICAgb3JkZXJOdW1iZXI6IHRydWUsXG4gICAgICAgICAgICBjb250cmFjdG9ySWQ6IHRydWUsXG4gICAgICAgICAgICBjb250cmFjdG9yTmFtZTogdHJ1ZVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgaWYgKCFidWlsZGluZykge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgZXJyb3I6ICdCdWlsZGluZyBub3QgZm91bmQnIH0pO1xuICAgIH1cblxuICAgIHJldHVybiByZXMuanNvbihidWlsZGluZyk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7IGVycm9yOiAnSW50ZXJuYWwgc2VydmVyIGVycm9yJyB9KTtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdXBkYXRlQnVpbGRpbmdDb25maWcocmVxLCByZXMpIHtcbiAgY29uc3QgeyBidWlsZGluZ0lkIH0gPSByZXEucGFyYW1zO1xuICBjb25zdCB7XG4gICAgbmFtZSxcbiAgICBjYXBhY2l0eSxcbiAgICBzaXRlTmFtZSxcbiAgICByZXBvcnREYXRlLFxuICAgIG1hdGVyaWFsV2VpZ2h0LFxuICAgIGV4ZWN1dGlvbldlaWdodCxcbiAgICBnb29kVGhyZXNob2xkLFxuICAgIGV4Y2VsbGVudFRocmVzaG9sZCxcbiAgICBkZWxheWVkRGF5c1RocmVzaG9sZCxcbiAgICBjcml0aWNhbERheXNUaHJlc2hvbGRcbiAgfSA9IHJlcS5ib2R5O1xuXG4gIHRyeSB7XG4gICAgaWYgKHJlcS51c2VyLnJvbGUgIT09ICdST0xFX0EnKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDMpLmpzb24oeyBlcnJvcjogJ09ubHkgRGF0YSBFbnRyeSAvIFNldHVwIHJvbGUgY2FuIHVwZGF0ZSBjb25maWd1cmF0aW9uJyB9KTtcbiAgICB9XG5cbiAgICBjb25zdCBidWlsZGluZyA9IGF3YWl0IHByaXNtYS5idWlsZGluZy5maW5kVW5pcXVlKHtcbiAgICAgIHdoZXJlOiB7IGlkOiBidWlsZGluZ0lkIH0sXG4gICAgICBpbmNsdWRlOiB7IG9yZGVyOiB7IHNlbGVjdDogeyBjb250cmFjdG9ySWQ6IHRydWUsIGNvbnRyYWN0b3JOYW1lOiB0cnVlIH0gfSB9XG4gICAgfSk7XG5cbiAgICBpZiAoIWJ1aWxkaW5nKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oeyBlcnJvcjogJ0J1aWxkaW5nIG5vdCBmb3VuZCcgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgbmV3Q2FwYWNpdHkgPSBjYXBhY2l0eSAhPT0gdW5kZWZpbmVkID8gcGFyc2VJbnQoY2FwYWNpdHksIDEwKSA6IGJ1aWxkaW5nLmNhcGFjaXR5O1xuXG4gICAgY29uc3QgdXBkYXRlZENvbmZpZyA9IHtcbiAgICAgIG5hbWU6IG5hbWUgIT09IHVuZGVmaW5lZCA/IG5hbWUgOiBidWlsZGluZy5uYW1lLFxuICAgICAgY2FwYWNpdHk6IG5ld0NhcGFjaXR5LFxuICAgICAgc2l0ZU5hbWU6IHNpdGVOYW1lICE9PSB1bmRlZmluZWQgPyBzaXRlTmFtZSA6IGJ1aWxkaW5nLnNpdGVOYW1lLFxuICAgICAgcmVwb3J0RGF0ZTogcmVwb3J0RGF0ZSA/IG5ldyBEYXRlKHJlcG9ydERhdGUpIDogYnVpbGRpbmcucmVwb3J0RGF0ZSxcbiAgICAgIG1hdGVyaWFsV2VpZ2h0OiBtYXRlcmlhbFdlaWdodCAhPT0gdW5kZWZpbmVkID8gcGFyc2VGbG9hdChtYXRlcmlhbFdlaWdodCkgOiBidWlsZGluZy5tYXRlcmlhbFdlaWdodCxcbiAgICAgIGV4ZWN1dGlvbldlaWdodDogZXhlY3V0aW9uV2VpZ2h0ICE9PSB1bmRlZmluZWQgPyBwYXJzZUZsb2F0KGV4ZWN1dGlvbldlaWdodCkgOiBidWlsZGluZy5leGVjdXRpb25XZWlnaHQsXG4gICAgICBnb29kVGhyZXNob2xkOiBnb29kVGhyZXNob2xkICE9PSB1bmRlZmluZWQgPyBwYXJzZUZsb2F0KGdvb2RUaHJlc2hvbGQpIDogYnVpbGRpbmcuZ29vZFRocmVzaG9sZCxcbiAgICAgIGV4Y2VsbGVudFRocmVzaG9sZDogZXhjZWxsZW50VGhyZXNob2xkICE9PSB1bmRlZmluZWQgPyBwYXJzZUZsb2F0KGV4Y2VsbGVudFRocmVzaG9sZCkgOiBidWlsZGluZy5leGNlbGxlbnRUaHJlc2hvbGQsXG4gICAgICBkZWxheWVkRGF5c1RocmVzaG9sZDogZGVsYXllZERheXNUaHJlc2hvbGQgIT09IHVuZGVmaW5lZCA/IHBhcnNlSW50KGRlbGF5ZWREYXlzVGhyZXNob2xkLCAxMCkgOiBidWlsZGluZy5kZWxheWVkRGF5c1RocmVzaG9sZCxcbiAgICAgIGNyaXRpY2FsRGF5c1RocmVzaG9sZDogY3JpdGljYWxEYXlzVGhyZXNob2xkICE9PSB1bmRlZmluZWQgPyBwYXJzZUludChjcml0aWNhbERheXNUaHJlc2hvbGQsIDEwKSA6IGJ1aWxkaW5nLmNyaXRpY2FsRGF5c1RocmVzaG9sZFxuICAgIH07XG5cbiAgICBjb25zdCB1cGRhdGVkQnVpbGRpbmcgPSBhd2FpdCBwcmlzbWEuJHRyYW5zYWN0aW9uKGFzeW5jICh0eCkgPT4ge1xuICAgICAgLy8gMS4gVXBkYXRlIGJ1aWxkaW5nIGNvbmZpZ1xuICAgICAgY29uc3QgYiA9IGF3YWl0IHR4LmJ1aWxkaW5nLnVwZGF0ZSh7XG4gICAgICAgIHdoZXJlOiB7IGlkOiBidWlsZGluZ0lkIH0sXG4gICAgICAgIGRhdGE6IHVwZGF0ZWRDb25maWdcbiAgICAgIH0pO1xuXG4gICAgICAvLyAyLiBBZGp1c3QgY2FwYWNpdHkgYXBhcnRtZW50IHJvd3MgaWYgY2FwYWNpdHkgY2hhbmdlZFxuICAgICAgaWYgKG5ld0NhcGFjaXR5ID4gYnVpbGRpbmcuY2FwYWNpdHkpIHtcbiAgICAgICAgY29uc3QgbmV3QXB0cyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gYnVpbGRpbmcuY2FwYWNpdHkgKyAxOyBpIDw9IG5ld0NhcGFjaXR5OyBpKyspIHtcbiAgICAgICAgICBjb25zdCByYXdBcHQgPSB7XG4gICAgICAgICAgICBidWlsZGluZ0lkOiBidWlsZGluZy5pZCxcbiAgICAgICAgICAgIHNyTm86IGksXG4gICAgICAgICAgICBhcGFydG1lbnRObzogbnVsbCxcbiAgICAgICAgICAgIGZsb29yOiBudWxsLFxuICAgICAgICAgICAgcHJpb3JpdHk6ICdOb3JtYWwnLFxuICAgICAgICAgICAga2l0Y2hlblF0eTogMSxcbiAgICAgICAgICAgIHdhcmRyb2JlUXR5OiAxLFxuICAgICAgICAgICAgdmFuaXR5UXR5OiAxLFxuICAgICAgICAgICAga2l0Y2hlblR5cGU6ICdLLVR5cGUgMScsXG4gICAgICAgICAgICB3YXJkcm9iZVR5cGU6ICdXLVR5cGUgMScsXG4gICAgICAgICAgICB2YW5pdHlUeXBlOiAnVi1UeXBlIDEnLFxuICAgICAgICAgICAgY29udHJhY3RvcjogYnVpbGRpbmcub3JkZXI/LmNvbnRyYWN0b3JJZCB8fCAnJyxcbiAgICAgICAgICAgIGNvbnRyYWN0b3JOYW1lOiBidWlsZGluZy5vcmRlcj8uY29udHJhY3Rvck5hbWUgfHwgJydcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgY29uc3QgY2FsY3VsYXRlZCA9IHJlY2FsY3VsYXRlQXBhcnRtZW50KHJhd0FwdCwgYik7XG4gICAgICAgICAgbmV3QXB0cy5wdXNoKGNhbGN1bGF0ZWQpO1xuICAgICAgICB9XG4gICAgICAgIGF3YWl0IHR4LmFwYXJ0bWVudC5jcmVhdGVNYW55KHsgZGF0YTogbmV3QXB0cyB9KTtcbiAgICAgIH0gZWxzZSBpZiAobmV3Q2FwYWNpdHkgPCBidWlsZGluZy5jYXBhY2l0eSkge1xuICAgICAgICBhd2FpdCB0eC5hcGFydG1lbnQuZGVsZXRlTWFueSh7XG4gICAgICAgICAgd2hlcmU6IHtcbiAgICAgICAgICAgIGJ1aWxkaW5nSWQsXG4gICAgICAgICAgICBzck5vOiB7IGd0OiBuZXdDYXBhY2l0eSB9XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgLy8gMy4gRmV0Y2ggYW5kIHJlY2FsY3VsYXRlIGFsbCByZW1haW5pbmcgYXBhcnRtZW50cyB1bmRlciB0aGlzIGJ1aWxkaW5nXG4gICAgICBjb25zdCBhcGFydG1lbnRzID0gYXdhaXQgdHguYXBhcnRtZW50LmZpbmRNYW55KHtcbiAgICAgICAgd2hlcmU6IHsgYnVpbGRpbmdJZCB9XG4gICAgICB9KTtcblxuICAgICAgZm9yIChjb25zdCBhcHQgb2YgYXBhcnRtZW50cykge1xuICAgICAgICBjb25zdCByZWNhbGN1bGF0ZWQgPSByZWNhbGN1bGF0ZUFwYXJ0bWVudChhcHQsIGIpO1xuICAgICAgICBhd2FpdCB0eC5hcGFydG1lbnQudXBkYXRlKHtcbiAgICAgICAgICB3aGVyZTogeyBpZDogYXB0LmlkIH0sXG4gICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgbWF0ZXJpYWxJbndhcmRQY3Q6IHJlY2FsY3VsYXRlZC5tYXRlcmlhbElud2FyZFBjdCxcbiAgICAgICAgICAgIGtpdGNoZW5Db21wbGV0aW9uUGN0OiByZWNhbGN1bGF0ZWQua2l0Y2hlbkNvbXBsZXRpb25QY3QsXG4gICAgICAgICAgICB3YXJkcm9iZUNvbXBsZXRpb25QY3Q6IHJlY2FsY3VsYXRlZC53YXJkcm9iZUNvbXBsZXRpb25QY3QsXG4gICAgICAgICAgICB2YW5pdHlDb21wbGV0aW9uUGN0OiByZWNhbGN1bGF0ZWQudmFuaXR5Q29tcGxldGlvblBjdCxcbiAgICAgICAgICAgIG92ZXJhbGxDb21wbGV0aW9uUGN0OiByZWNhbGN1bGF0ZWQub3ZlcmFsbENvbXBsZXRpb25QY3QsXG4gICAgICAgICAgICBraXRjaGVuUUNHYXRlOiByZWNhbGN1bGF0ZWQua2l0Y2hlblFDR2F0ZSxcbiAgICAgICAgICAgIHdhcmRyb2JlUUNHYXRlOiByZWNhbGN1bGF0ZWQud2FyZHJvYmVRQ0dhdGUsXG4gICAgICAgICAgICB2YW5pdHlRQ0dhdGU6IHJlY2FsY3VsYXRlZC52YW5pdHlRQ0dhdGUsXG4gICAgICAgICAgICBoYW5kb3ZlckFwcHJvdmFsU3RhdHVzOiByZWNhbGN1bGF0ZWQuaGFuZG92ZXJBcHByb3ZhbFN0YXR1cyxcbiAgICAgICAgICAgIGFwYXJ0bWVudFN0YXR1czogcmVjYWxjdWxhdGVkLmFwYXJ0bWVudFN0YXR1cyxcbiAgICAgICAgICAgIGRlbGF5RGF5czogcmVjYWxjdWxhdGVkLmRlbGF5RGF5cyxcbiAgICAgICAgICAgIGhlYWx0aDogcmVjYWxjdWxhdGVkLmhlYWx0aFxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBiO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJlcy5qc29uKHVwZGF0ZWRCdWlsZGluZyk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ1VwZGF0ZSBidWlsZGluZyBjb25maWcgZXJyb3I6JywgZXJyKTtcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oeyBlcnJvcjogJ0ludGVybmFsIHNlcnZlciBlcnJvciB1cGRhdGluZyBidWlsZGluZyBjb25maWcnIH0pO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkZWxldGVCdWlsZGluZyhyZXEsIHJlcykge1xuICBjb25zdCB7IGJ1aWxkaW5nSWQgfSA9IHJlcS5wYXJhbXM7XG4gIHRyeSB7XG4gICAgaWYgKHJlcS51c2VyLnJvbGUgIT09ICdST0xFX0EnKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDMpLmpzb24oeyBlcnJvcjogJ09ubHkgRGF0YSBFbnRyeSAvIFNldHVwIHJvbGUgY2FuIGRlbGV0ZSBidWlsZGluZ3MnIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IGJ1aWxkaW5nID0gYXdhaXQgcHJpc21hLmJ1aWxkaW5nLmZpbmRVbmlxdWUoe1xuICAgICAgd2hlcmU6IHsgaWQ6IGJ1aWxkaW5nSWQgfVxuICAgIH0pO1xuXG4gICAgaWYgKCFidWlsZGluZykge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgZXJyb3I6ICdCdWlsZGluZyBub3QgZm91bmQnIH0pO1xuICAgIH1cblxuICAgIC8vIERlbGV0ZSB0aGUgYnVpbGRpbmcgXHUyMDE0IGNhc2NhZGluZyBkZWxldGVzIGhhbmRsZSBhcGFydG1lbnRzLFxuICAgIC8vIGF1ZGl0IGxvZ3MsIHRvd2VyIGNsaWVudCByYXRlcywgYW5kIGNsaWVudCBSQSBiaWxsIGxpbmVzLlxuICAgIGF3YWl0IHByaXNtYS5idWlsZGluZy5kZWxldGUoe1xuICAgICAgd2hlcmU6IHsgaWQ6IGJ1aWxkaW5nSWQgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJlcy5qc29uKHsgbWVzc2FnZTogJ0J1aWxkaW5nIGFuZCBhbGwgYXNzb2NpYXRlZCBkYXRhIGRlbGV0ZWQgc3VjY2Vzc2Z1bGx5JyB9KTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgY29uc29sZS5lcnJvcignRGVsZXRlIGJ1aWxkaW5nIGVycm9yOicsIGVycik7XG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgZXJyb3I6ICdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3IgZGVsZXRpbmcgYnVpbGRpbmcnIH0pO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjb3B5QnVpbGRpbmdEYXRhKHJlcSwgcmVzKSB7XG4gIGNvbnN0IHsgc291cmNlQnVpbGRpbmdJZCwgdGFyZ2V0QnVpbGRpbmdJZCB9ID0gcmVxLmJvZHk7XG4gIGlmICghc291cmNlQnVpbGRpbmdJZCB8fCAhdGFyZ2V0QnVpbGRpbmdJZCkge1xuICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7IGVycm9yOiAnU291cmNlIGFuZCB0YXJnZXQgYnVpbGRpbmcgSURzIGFyZSByZXF1aXJlZCcgfSk7XG4gIH1cbiAgaWYgKHNvdXJjZUJ1aWxkaW5nSWQgPT09IHRhcmdldEJ1aWxkaW5nSWQpIHtcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oeyBlcnJvcjogJ1NvdXJjZSBhbmQgdGFyZ2V0IGJ1aWxkaW5ncyBtdXN0IGJlIGRpZmZlcmVudCcgfSk7XG4gIH1cblxuICB0cnkge1xuICAgIGlmIChyZXEudXNlci5yb2xlICE9PSAnUk9MRV9BJykge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAzKS5qc29uKHsgZXJyb3I6ICdPbmx5IFNldHVwIE9wZXJhdG9yIChBZG1pbikgY2FuIGNvcHkgYnVpbGRpbmcgZGF0YScgfSk7XG4gICAgfVxuXG4gICAgY29uc3Qgc291cmNlQnVpbGRpbmcgPSBhd2FpdCBwcmlzbWEuYnVpbGRpbmcuZmluZFVuaXF1ZSh7XG4gICAgICB3aGVyZTogeyBpZDogc291cmNlQnVpbGRpbmdJZCB9LFxuICAgICAgaW5jbHVkZTogeyBhcGFydG1lbnRzOiB0cnVlIH1cbiAgICB9KTtcblxuICAgIGNvbnN0IHRhcmdldEJ1aWxkaW5nID0gYXdhaXQgcHJpc21hLmJ1aWxkaW5nLmZpbmRVbmlxdWUoe1xuICAgICAgd2hlcmU6IHsgaWQ6IHRhcmdldEJ1aWxkaW5nSWQgfSxcbiAgICAgIGluY2x1ZGU6IHsgYXBhcnRtZW50czogdHJ1ZSB9XG4gICAgfSk7XG5cbiAgICBpZiAoIXNvdXJjZUJ1aWxkaW5nIHx8ICF0YXJnZXRCdWlsZGluZykge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgZXJyb3I6ICdTb3VyY2Ugb3IgdGFyZ2V0IGJ1aWxkaW5nIG5vdCBmb3VuZCcgfSk7XG4gICAgfVxuXG4gICAgY29uc3Qgc291cmNlQXB0cyA9IHNvdXJjZUJ1aWxkaW5nLmFwYXJ0bWVudHM7XG4gICAgY29uc3QgdGFyZ2V0QXB0cyA9IHRhcmdldEJ1aWxkaW5nLmFwYXJ0bWVudHM7XG5cbiAgICBjb25zdCBjb3B5RmllbGRzID0gW1xuICAgICAgJ3ByaW9yaXR5JywgJ2tpdGNoZW5RdHknLCAnd2FyZHJvYmVRdHknLCAndmFuaXR5UXR5JyxcbiAgICAgICdraXRjaGVuTG93ZXJDYXJjYXNzSW53YXJkJywgJ2tpdGNoZW5VcHBlckNhcmNhc3NJbndhcmQnLCAna2l0Y2hlblN0b25lSW53YXJkJyxcbiAgICAgICdraXRjaGVuU2h1dHRlcklud2FyZCcsICdraXRjaGVuSGFyZHdhcmVJbndhcmQnLCAna2l0Y2hlbkFwcGxpYW5jZUlud2FyZCcsXG4gICAgICAnd2FyZHJvYmVDYWJpbmV0SW53YXJkJywgJ3dhcmRyb2JlU2h1dHRlckhhcmR3YXJlSW53YXJkJyxcbiAgICAgICd2YW5pdHlDYWJpbmV0SW53YXJkJywgJ3Zhbml0eVNodXR0ZXJIYXJkd2FyZUlud2FyZCcsXG4gICAgICAna2l0Y2hlbkxvd2VyQ2FyY2Fzc0luc3RhbGxlZCcsICdraXRjaGVuVXBwZXJDYXJjYXNzSW5zdGFsbGVkJywgJ2tpdGNoZW5TdG9uZUluc3RhbGxlZCcsXG4gICAgICAna2l0Y2hlblNodXR0ZXJIYXJkd2FyZUluc3RhbGxlZCcsICdraXRjaGVuQXBwbGlhbmNlSW5zdGFsbGVkJywgJ2tpdGNoZW5IYW5kZWRPdmVyJyxcbiAgICAgICd3YXJkcm9iZUNhYmluZXRJbnN0YWxsZWQnLCAnd2FyZHJvYmVTaHV0dGVySGFyZHdhcmVJbnN0YWxsZWQnLCAnd2FyZHJvYmVIYW5kZWRPdmVyJyxcbiAgICAgICd2YW5pdHlDYWJpbmV0SW5zdGFsbGVkJywgJ3Zhbml0eVNodXR0ZXJIYXJkd2FyZUluc3RhbGxlZCcsICd2YW5pdHlIYW5kZWRPdmVyJyxcbiAgICAgICdwbGFubmVkU3RhcnQnLCAncGxhbm5lZENvbXBsZXRpb24nLCAnYWN0dWFsU3RhcnQnLCAnYWN0dWFsQ29tcGxldGlvbicsXG4gICAgICAnc3VwZXJ2aXNvck5hbWUnLCAncmVzcG9uc2libGVFbmdpbmVlcicsICdjb250cmFjdG9yJywgJ2NvbnRyYWN0b3JOYW1lJywgJ2RlbGF5UmVhc29uJywgJ3JlbWFya3MnLFxuICAgICAgJ2tpdGNoZW5RQ19WaXNpYmxlU2NyZXdzJywgJ2tpdGNoZW5RQ19DaGlwcGluZycsICdraXRjaGVuUUNfRmlsbGVyTWlzc2luZycsXG4gICAgICAna2l0Y2hlblFDX1NjcmF0Y2hlcycsICdraXRjaGVuUUNfRHJhd2Vyc0Z1bmN0aW9uJywgJ2tpdGNoZW5RQ19DdXRsZXJ5VHJheScsICdraXRjaGVuUUNfRGlzaERyYWluZXInLFxuICAgICAgJ3dhcmRyb2JlUUNfVmlzaWJsZVNjcmV3cycsICd3YXJkcm9iZVFDX0NoaXBwaW5nJywgJ3dhcmRyb2JlUUNfRmlsbGVyTWlzc2luZycsXG4gICAgICAnd2FyZHJvYmVRQ19TY3JhdGNoZXMnLCAnd2FyZHJvYmVRQ19EcmF3ZXJzRnVuY3Rpb24nLFxuICAgICAgJ3Zhbml0eVFDX1Zpc2libGVTY3Jld3MnLCAndmFuaXR5UUNfQ2hpcHBpbmcnLCAndmFuaXR5UUNfRmlsbGVyTWlzc2luZycsXG4gICAgICAndmFuaXR5UUNfU2NyYXRjaGVzJywgJ3Zhbml0eVFDX0RyYXdlcnNGdW5jdGlvbicsXG4gICAgICAna2l0Y2hlblR5cGUnLCAnd2FyZHJvYmVUeXBlJywgJ3Zhbml0eVR5cGUnXG4gICAgXTtcblxuICAgIGNvbnN0IHVwZGF0ZWRBcHRzID0gW107XG4gICAgY29uc3QgYXVkaXRMb2dzID0gW107XG5cbiAgICAvLyBNYXRjaCBieSBzck5vXG4gICAgZm9yIChjb25zdCB0YXJnZXRBcHQgb2YgdGFyZ2V0QXB0cykge1xuICAgICAgY29uc3Qgc291cmNlQXB0ID0gc291cmNlQXB0cy5maW5kKGEgPT4gYS5zck5vID09PSB0YXJnZXRBcHQuc3JObyk7XG4gICAgICBpZiAoIXNvdXJjZUFwdCkgY29udGludWU7XG5cbiAgICAgIGNvbnN0IHVwZGF0ZXMgPSB7fTtcbiAgICAgIGZvciAoY29uc3QgZmllbGQgb2YgY29weUZpZWxkcykge1xuICAgICAgICB1cGRhdGVzW2ZpZWxkXSA9IHNvdXJjZUFwdFtmaWVsZF07XG4gICAgICB9XG5cbiAgICAgIC8vIE1lcmdlIGFuZCByZWNhbGN1bGF0ZVxuICAgICAgY29uc3QgbWVyZ2VkID0geyAuLi50YXJnZXRBcHQsIC4uLnVwZGF0ZXMgfTtcbiAgICAgIGNvbnN0IHJlY2FsY3VsYXRlZCA9IHJlY2FsY3VsYXRlQXBhcnRtZW50KG1lcmdlZCwgdGFyZ2V0QnVpbGRpbmcpO1xuXG4gICAgICAvLyBFeGNsdWRlIGFsbCBQcmlzbWEtbWFuYWdlZCwgaWRlbnRpdHksIGFuZCBhcGFydG1lbnQtc3BlY2lmaWMgZmllbGRzIGZyb20gdGhlIHVwZGF0ZSBwYXlsb2FkLlxuICAgICAgLy8gc3JObywgYXBhcnRtZW50Tm8gYW5kIGZsb29yIGJlbG9uZyB0byB0aGUgVEFSR0VUIGFwYXJ0bWVudCBhbmQgbXVzdCBuZXZlciBiZSBvdmVyd3JpdHRlbi5cbiAgICAgIGNvbnN0IHtcbiAgICAgICAgaWQsXG4gICAgICAgIGJ1aWxkaW5nSWQsXG4gICAgICAgIHNyTm8sXG4gICAgICAgIGFwYXJ0bWVudE5vLFxuICAgICAgICBmbG9vcixcbiAgICAgICAgY3JlYXRlZEF0LFxuICAgICAgICB1cGRhdGVkQXQsXG4gICAgICAgIGJ1aWxkaW5nLFxuICAgICAgICBhdWRpdExvZ3M6IGFsLFxuICAgICAgICAuLi51cGRhdGVEYXRhXG4gICAgICB9ID0gcmVjYWxjdWxhdGVkO1xuICAgICAgdXBkYXRlZEFwdHMucHVzaCh7XG4gICAgICAgIGlkOiB0YXJnZXRBcHQuaWQsXG4gICAgICAgIGRhdGE6IHVwZGF0ZURhdGFcbiAgICAgIH0pO1xuXG4gICAgICBhdWRpdExvZ3MucHVzaCh7XG4gICAgICAgIGFwYXJ0bWVudElkOiB0YXJnZXRBcHQuaWQsXG4gICAgICAgIHVzZXJJZDogcmVxLnVzZXIuaWQsXG4gICAgICAgIGZpZWxkTmFtZTogJ0NvcHkgRGF0YScsXG4gICAgICAgIG9sZFZhbHVlOiBgRnJvbSBidWlsZGluZzogJHtzb3VyY2VCdWlsZGluZy5uYW1lfWAsXG4gICAgICAgIG5ld1ZhbHVlOiBgQ29waWVkIHZhbHVlcyBmcm9tIFNyTm86ICR7c291cmNlQXB0LnNyTm99YFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXdhaXQgcHJpc21hLiR0cmFuc2FjdGlvbihhc3luYyAodHgpID0+IHtcbiAgICAgIGZvciAoY29uc3QgaXRlbSBvZiB1cGRhdGVkQXB0cykge1xuICAgICAgICBhd2FpdCB0eC5hcGFydG1lbnQudXBkYXRlKHtcbiAgICAgICAgICB3aGVyZTogeyBpZDogaXRlbS5pZCB9LFxuICAgICAgICAgIGRhdGE6IGl0ZW0uZGF0YVxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYgKGF1ZGl0TG9ncy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGF3YWl0IHR4LmF1ZGl0TG9nLmNyZWF0ZU1hbnkoe1xuICAgICAgICAgIGRhdGE6IGF1ZGl0TG9nc1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiByZXMuanNvbih7IHN1Y2Nlc3M6IHRydWUsIGNvcGllZENvdW50OiB1cGRhdGVkQXB0cy5sZW5ndGggfSk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0NvcHkgYnVpbGRpbmcgZGF0YSBlcnJvcjonLCBlcnIpO1xuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7IGVycm9yOiAnSW50ZXJuYWwgc2VydmVyIGVycm9yIGNvcHlpbmcgYnVpbGRpbmcgZGF0YScgfSk7XG4gIH1cbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcaHBcXFxcRG93bmxvYWRzXFxcXERpbyBHcmFjZSAoMylcXFxcRGlvIEdyYWNlICgzKVxcXFxEaW8gR3JhY2VlXFxcXGJhY2tlbmRcXFxcc3JjXFxcXGNvbnRyb2xsZXJzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxocFxcXFxEb3dubG9hZHNcXFxcRGlvIEdyYWNlICgzKVxcXFxEaW8gR3JhY2UgKDMpXFxcXERpbyBHcmFjZWVcXFxcYmFja2VuZFxcXFxzcmNcXFxcY29udHJvbGxlcnNcXFxcYXBhcnRtZW50Q29udHJvbGxlci5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvaHAvRG93bmxvYWRzL0RpbyUyMEdyYWNlJTIwKDMpL0RpbyUyMEdyYWNlJTIwKDMpL0RpbyUyMEdyYWNlZS9iYWNrZW5kL3NyYy9jb250cm9sbGVycy9hcGFydG1lbnRDb250cm9sbGVyLmpzXCI7aW1wb3J0IHsgUHJpc21hQ2xpZW50IH0gZnJvbSAnQHByaXNtYS9jbGllbnQnO1xuaW1wb3J0IHsgcmVjYWxjdWxhdGVBcGFydG1lbnQgfSBmcm9tICcuLi9zZXJ2aWNlcy9jYWxjdWxhdGlvblNlcnZpY2UuanMnO1xuXG5jb25zdCBwcmlzbWEgPSBuZXcgUHJpc21hQ2xpZW50KCk7XG5cbmNvbnN0IFJPTEVfQV9GSUVMRFMgPSBbJ3NyTm8nLCAnYXBhcnRtZW50Tm8nLCAnZmxvb3InLCAncHJpb3JpdHknLCAna2l0Y2hlblF0eScsICd3YXJkcm9iZVF0eScsICd2YW5pdHlRdHknLCAncmVzcG9uc2libGVFbmdpbmVlcicsICdzdXBlcnZpc29yTmFtZScsICdraXRjaGVuVHlwZScsICd3YXJkcm9iZVR5cGUnLCAndmFuaXR5VHlwZSddO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbGlzdEFwYXJ0bWVudHMocmVxLCByZXMpIHtcbiAgY29uc3QgeyBidWlsZGluZ0lkIH0gPSByZXEucGFyYW1zO1xuICB0cnkge1xuICAgIGNvbnN0IGFwYXJ0bWVudHMgPSBhd2FpdCBwcmlzbWEuYXBhcnRtZW50LmZpbmRNYW55KHtcbiAgICAgIHdoZXJlOiB7IGJ1aWxkaW5nSWQgfSxcbiAgICAgIG9yZGVyQnk6IHsgc3JObzogJ2FzYycgfVxuICAgIH0pO1xuICAgIHJldHVybiByZXMuanNvbihhcGFydG1lbnRzKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgZXJyb3I6ICdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3IgbGlzdGluZyBhcGFydG1lbnRzJyB9KTtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY3JlYXRlQXBhcnRtZW50KHJlcSwgcmVzKSB7XG4gIGNvbnN0IHsgYnVpbGRpbmdJZCB9ID0gcmVxLnBhcmFtcztcbiAgY29uc3QgeyBhcGFydG1lbnRObywgZmxvb3IsIHByaW9yaXR5LCBraXRjaGVuVHlwZSwgd2FyZHJvYmVUeXBlLCB2YW5pdHlUeXBlIH0gPSByZXEuYm9keTtcblxuICB0cnkge1xuICAgIGlmIChyZXEudXNlci5yb2xlICE9PSAnUk9MRV9BJykge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAzKS5qc29uKHsgZXJyb3I6ICdPbmx5IFNldHVwIE9wZXJhdG9yIGNhbiBhZGQgYXBhcnRtZW50IHJvd3MnIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IGJ1aWxkaW5nID0gYXdhaXQgcHJpc21hLmJ1aWxkaW5nLmZpbmRVbmlxdWUoe1xuICAgICAgd2hlcmU6IHsgaWQ6IGJ1aWxkaW5nSWQgfSxcbiAgICAgIGluY2x1ZGU6IHsgXG4gICAgICAgIGFwYXJ0bWVudHM6IHsgb3JkZXJCeTogeyBzck5vOiAnZGVzYycgfSwgdGFrZTogMSB9LFxuICAgICAgICBvcmRlcjogeyBzZWxlY3Q6IHsgY29udHJhY3RvcklkOiB0cnVlIH0gfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgaWYgKCFidWlsZGluZykge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgZXJyb3I6ICdCdWlsZGluZyBub3QgZm91bmQnIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IGxhc3RTck5vID0gYnVpbGRpbmcuYXBhcnRtZW50cy5sZW5ndGggPiAwID8gYnVpbGRpbmcuYXBhcnRtZW50c1swXS5zck5vIDogMDtcbiAgICBjb25zdCBuZXh0U3JObyA9IGxhc3RTck5vICsgMTtcbiAgICBjb25zdCBkZWZhdWx0Rmxvb3IgPSBmbG9vciA/IFN0cmluZyhmbG9vcikudHJpbSgpIDogbnVsbDtcbiAgICBjb25zdCBkZWZhdWx0QXB0Tm8gPSBhcGFydG1lbnRObyA/IFN0cmluZyhhcGFydG1lbnRObykudHJpbSgpIDogbnVsbDtcblxuICAgIGNvbnN0IHJhd0FwdCA9IHtcbiAgICAgIGJ1aWxkaW5nSWQsXG4gICAgICBzck5vOiBuZXh0U3JObyxcbiAgICAgIGFwYXJ0bWVudE5vOiBkZWZhdWx0QXB0Tm8sXG4gICAgICBmbG9vcjogZGVmYXVsdEZsb29yLFxuICAgICAgcHJpb3JpdHk6IHByaW9yaXR5IHx8ICdOb3JtYWwnLFxuICAgICAga2l0Y2hlblF0eTogbnVsbCxcbiAgICAgIHdhcmRyb2JlUXR5OiBudWxsLFxuICAgICAgdmFuaXR5UXR5OiBudWxsLFxuICAgICAga2l0Y2hlblR5cGU6IGtpdGNoZW5UeXBlIHx8ICdLLVR5cGUgMScsXG4gICAgICB3YXJkcm9iZVR5cGU6IHdhcmRyb2JlVHlwZSB8fCAnVy1UeXBlIDEnLFxuICAgICAgdmFuaXR5VHlwZTogdmFuaXR5VHlwZSB8fCAnVi1UeXBlIDEnLFxuICAgICAgY29udHJhY3RvcjogYnVpbGRpbmcub3JkZXI/LmNvbnRyYWN0b3JJZCB8fCBudWxsXG4gICAgfTtcblxuICAgIGNvbnN0IGNhbGN1bGF0ZWQgPSByZWNhbGN1bGF0ZUFwYXJ0bWVudChyYXdBcHQsIGJ1aWxkaW5nKTtcblxuICAgIGNvbnN0IG5ld0FwdCA9IGF3YWl0IHByaXNtYS4kdHJhbnNhY3Rpb24oYXN5bmMgKHR4KSA9PiB7XG4gICAgICBjb25zdCBjcmVhdGVkID0gYXdhaXQgdHguYXBhcnRtZW50LmNyZWF0ZSh7XG4gICAgICAgIGRhdGE6IGNhbGN1bGF0ZWRcbiAgICAgIH0pO1xuXG4gICAgICBhd2FpdCB0eC5idWlsZGluZy51cGRhdGUoe1xuICAgICAgICB3aGVyZTogeyBpZDogYnVpbGRpbmdJZCB9LFxuICAgICAgICBkYXRhOiB7IGNhcGFjaXR5OiB7IGluY3JlbWVudDogMSB9IH1cbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gY3JlYXRlZDtcbiAgICB9KTtcblxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMSkuanNvbihuZXdBcHQpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKCdDcmVhdGUgYXBhcnRtZW50IGVycm9yOicsIGVycik7XG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgZXJyb3I6ICdGYWlsZWQgdG8gYWRkIGFwYXJ0bWVudCByb3cnIH0pO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkZWxldGVBcGFydG1lbnQocmVxLCByZXMpIHtcbiAgY29uc3QgeyBhcGFydG1lbnRJZCB9ID0gcmVxLnBhcmFtcztcblxuICB0cnkge1xuICAgIGlmIChyZXEudXNlci5yb2xlICE9PSAnUk9MRV9BJykge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAzKS5qc29uKHsgZXJyb3I6ICdPbmx5IFNldHVwIE9wZXJhdG9yIGNhbiBkZWxldGUgYXBhcnRtZW50IHJvd3MnIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IGFwdCA9IGF3YWl0IHByaXNtYS5hcGFydG1lbnQuZmluZFVuaXF1ZSh7XG4gICAgICB3aGVyZTogeyBpZDogYXBhcnRtZW50SWQgfVxuICAgIH0pO1xuXG4gICAgaWYgKCFhcHQpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwNCkuanNvbih7IGVycm9yOiAnQXBhcnRtZW50IG5vdCBmb3VuZCcgfSk7XG4gICAgfVxuXG4gICAgYXdhaXQgcHJpc21hLiR0cmFuc2FjdGlvbihhc3luYyAodHgpID0+IHtcbiAgICAgIGF3YWl0IHR4LmFwYXJ0bWVudC5kZWxldGUoe1xuICAgICAgICB3aGVyZTogeyBpZDogYXBhcnRtZW50SWQgfVxuICAgICAgfSk7XG5cbiAgICAgIGF3YWl0IHR4LmJ1aWxkaW5nLnVwZGF0ZSh7XG4gICAgICAgIHdoZXJlOiB7IGlkOiBhcHQuYnVpbGRpbmdJZCB9LFxuICAgICAgICBkYXRhOiB7IGNhcGFjaXR5OiBNYXRoLm1heCgwLCAoYXdhaXQgdHguYXBhcnRtZW50LmNvdW50KHsgd2hlcmU6IHsgYnVpbGRpbmdJZDogYXB0LmJ1aWxkaW5nSWQgfSB9KSkpIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJlcy5qc29uKHsgbWVzc2FnZTogJ0FwYXJ0bWVudCByb3cgZGVsZXRlZCBzdWNjZXNzZnVsbHknIH0pO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKCdEZWxldGUgYXBhcnRtZW50IGVycm9yOicsIGVycik7XG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgZXJyb3I6ICdGYWlsZWQgdG8gZGVsZXRlIGFwYXJ0bWVudCByb3cnIH0pO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB1cGRhdGVBcGFydG1lbnQocmVxLCByZXMpIHtcbiAgY29uc3QgeyBhcGFydG1lbnRJZCB9ID0gcmVxLnBhcmFtcztcbiAgY29uc3QgdXBkYXRlcyA9IHJlcS5ib2R5O1xuXG4gIHRyeSB7XG4gICAgY29uc3Qgcm9sZSA9IHJlcS51c2VyLnJvbGU7XG4gICAgaWYgKHJvbGUgPT09ICdST0xFX0MnIHx8IHJvbGUgPT09ICdST0xFX0QnKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDMpLmpzb24oeyBlcnJvcjogJ1JlYWQtb25seSB1c2VycyBjYW5ub3QgbW9kaWZ5IGRhdGEnIH0pO1xuICAgIH1cblxuICAgIC8vIExvYWQgb3JpZ2luYWwgYXBhcnRtZW50XG4gICAgY29uc3QgYXB0ID0gYXdhaXQgcHJpc21hLmFwYXJ0bWVudC5maW5kVW5pcXVlKHtcbiAgICAgIHdoZXJlOiB7IGlkOiBhcGFydG1lbnRJZCB9LFxuICAgICAgaW5jbHVkZTogeyBidWlsZGluZzogdHJ1ZSB9XG4gICAgfSk7XG5cbiAgICBpZiAoIWFwdCkge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgZXJyb3I6ICdBcGFydG1lbnQgbm90IGZvdW5kJyB9KTtcbiAgICB9XG5cbiAgICAvLyBSb2xlLWJhc2VkIGZpZWxkIGVuZm9yY2VtZW50XG4gICAgY29uc3QgZmlsdGVyZWRVcGRhdGVzID0ge307XG4gICAgaWYgKHJvbGUgPT09ICdST0xFX0EnKSB7XG4gICAgICAvLyBSb2xlIEEgKEFkbWluKSBoYXMgZnVsbCBlZGl0aW5nIHJpZ2h0cyB0byBhbnkgZmllbGQgaW4gdGhlIEFwYXJ0bWVudCBtb2RlbFxuICAgICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXModXBkYXRlcykpIHtcbiAgICAgICAgaWYgKGtleSAhPT0gJ2lkJyAmJiBrZXkgIT09ICdidWlsZGluZ0lkJyAmJiBrZXkgIT09ICdjcmVhdGVkQXQnKSB7XG4gICAgICAgICAgZmlsdGVyZWRVcGRhdGVzW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAocm9sZSA9PT0gJ1JPTEVfQicpIHtcbiAgICAgIC8vIFJvbGUgQiBjYW5ub3QgZWRpdCBmaXJzdCA3IGZpZWxkc1xuICAgICAgY29uc3QgYXR0ZW1wdGVkUm9sZUFGaWVsZHMgPSBST0xFX0FfRklFTERTLmZpbHRlcihrZXkgPT4gdXBkYXRlc1trZXldICE9PSB1bmRlZmluZWQpO1xuICAgICAgaWYgKGF0dGVtcHRlZFJvbGVBRmllbGRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAzKS5qc29uKHsgXG4gICAgICAgICAgZXJyb3I6IGBFeGVjdXRpb24gcm9sZSBjYW5ub3QgbW9kaWZ5IFNldHVwIGZpZWxkczogWyR7YXR0ZW1wdGVkUm9sZUFGaWVsZHMuam9pbignLCAnKX1dYCBcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIEFsbG93IGFueSBvdGhlciB2YWxpZCBmaWVsZHMgaW4gQXBhcnRtZW50IG1vZGVsXG4gICAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyh1cGRhdGVzKSkge1xuICAgICAgICBpZiAoIVJPTEVfQV9GSUVMRFMuaW5jbHVkZXMoa2V5KSAmJiBrZXkgIT09ICdpZCcgJiYga2V5ICE9PSAnYnVpbGRpbmdJZCcgJiYga2V5ICE9PSAnY3JlYXRlZEF0Jykge1xuICAgICAgICAgIGZpbHRlcmVkVXBkYXRlc1trZXldID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoT2JqZWN0LmtleXMoZmlsdGVyZWRVcGRhdGVzKS5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiByZXMuanNvbihhcHQpOyAvLyBub3RoaW5nIHRvIHVwZGF0ZVxuICAgIH1cblxuICAgIC8vIFBhcnNlIGRhdGUgZmllbGRzIGlmIHByZXNlbnRcbiAgICBjb25zdCBkYXRlRmllbGRzID0gWydwbGFubmVkU3RhcnQnLCAncGxhbm5lZENvbXBsZXRpb24nLCAnYWN0dWFsU3RhcnQnLCAnYWN0dWFsQ29tcGxldGlvbiddO1xuICAgIGZvciAoY29uc3QgZiBvZiBkYXRlRmllbGRzKSB7XG4gICAgICBpZiAoZmlsdGVyZWRVcGRhdGVzW2ZdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgZmlsdGVyZWRVcGRhdGVzW2ZdID0gZmlsdGVyZWRVcGRhdGVzW2ZdID8gbmV3IERhdGUoZmlsdGVyZWRVcGRhdGVzW2ZdKSA6IG51bGw7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGZpbHRlcmVkVXBkYXRlcy5hY3R1YWxDb21wbGV0aW9uKSB7XG4gICAgICBjb25zdCB0b2RheSA9IG5ldyBEYXRlKCk7XG4gICAgICB0b2RheS5zZXRIb3VycygyMywgNTksIDU5LCA5OTkpO1xuICAgICAgaWYgKGZpbHRlcmVkVXBkYXRlcy5hY3R1YWxDb21wbGV0aW9uID4gdG9kYXkpIHtcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHsgZXJyb3I6ICdBY3R1YWwgY29tcGxldGlvbiBkYXRlIGNhbm5vdCBiZSBzZXQgaW4gdGhlIGZ1dHVyZScgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gUGVyZm9ybSB0aGUgdXBkYXRlICYgcmVjYWxjdWxhdGUgaW4gYSB0cmFuc2FjdGlvblxuICAgIGNvbnN0IHVwZGF0ZWRBcHQgPSBhd2FpdCBwcmlzbWEuJHRyYW5zYWN0aW9uKGFzeW5jICh0eCkgPT4ge1xuICAgICAgLy8gMS4gQ3JlYXRlIGF1ZGl0IGxvZ3MgZm9yIGNoYW5nZWQgZmllbGRzXG4gICAgICBjb25zdCBhdWRpdExvZ0RhdGEgPSBbXTtcbiAgICAgIGZvciAoY29uc3QgW2ZpZWxkLCBuZXdWYWxdIG9mIE9iamVjdC5lbnRyaWVzKGZpbHRlcmVkVXBkYXRlcykpIHtcbiAgICAgICAgbGV0IG9sZFZhbFN0ciA9IGFwdFtmaWVsZF0gPT09IG51bGwgPyAnJyA6IFN0cmluZyhhcHRbZmllbGRdKTtcbiAgICAgICAgaWYgKGFwdFtmaWVsZF0gaW5zdGFuY2VvZiBEYXRlKSB7XG4gICAgICAgICAgb2xkVmFsU3RyID0gYXB0W2ZpZWxkXS50b0lTT1N0cmluZygpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IG5ld1ZhbFN0ciA9IG5ld1ZhbCA9PT0gbnVsbCA/ICcnIDogU3RyaW5nKG5ld1ZhbCk7XG4gICAgICAgIGlmIChuZXdWYWwgaW5zdGFuY2VvZiBEYXRlKSB7XG4gICAgICAgICAgbmV3VmFsU3RyID0gbmV3VmFsLnRvSVNPU3RyaW5nKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAob2xkVmFsU3RyICE9PSBuZXdWYWxTdHIpIHtcbiAgICAgICAgICBhdWRpdExvZ0RhdGEucHVzaCh7XG4gICAgICAgICAgICBhcGFydG1lbnRJZDogYXB0LmlkLFxuICAgICAgICAgICAgdXNlcklkOiByZXEudXNlci5pZCxcbiAgICAgICAgICAgIGZpZWxkTmFtZTogZmllbGQsXG4gICAgICAgICAgICBvbGRWYWx1ZTogb2xkVmFsU3RyLFxuICAgICAgICAgICAgbmV3VmFsdWU6IG5ld1ZhbFN0clxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChhdWRpdExvZ0RhdGEubGVuZ3RoID4gMCkge1xuICAgICAgICBhd2FpdCB0eC5hdWRpdExvZy5jcmVhdGVNYW55KHtcbiAgICAgICAgICBkYXRhOiBhdWRpdExvZ0RhdGFcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIE1lcmdlIGZpbHRlcmVkIHVwZGF0ZXMgaW50byBleGlzdGluZyBhcGFydG1lbnQgb2JqZWN0IGZvciByZWNhbGN1bGF0aW9uXG4gICAgICBjb25zdCBtZXJnZWRBcHQgPSB7IC4uLmFwdCwgLi4uZmlsdGVyZWRVcGRhdGVzIH07XG5cbiAgICAgIC8vIDIuIFJlY2FsY3VsYXRlXG4gICAgICBjb25zdCByZWNhbGN1bGF0ZWQgPSByZWNhbGN1bGF0ZUFwYXJ0bWVudChtZXJnZWRBcHQsIGFwdC5idWlsZGluZyk7XG5cbiAgICAgIC8vIDMuIFVwZGF0ZSBkYXRhYmFzZSAoc2FuaXRpemUgcmVsYXRpb24sIHByaW1hcnkvZm9yZWlnbiBrZXlzIGFuZCBhdXRvLW1hbmFnZWQgZmllbGRzKVxuICAgICAgY29uc3QgeyBpZCwgYnVpbGRpbmdJZCwgY3JlYXRlZEF0LCB1cGRhdGVkQXQsIGJ1aWxkaW5nOiBidWlsZGluZ1JlbGF0aW9uLCBhdWRpdExvZ3MsIC4uLnVwZGF0ZURhdGEgfSA9IHJlY2FsY3VsYXRlZDtcbiAgICAgIHJldHVybiBhd2FpdCB0eC5hcGFydG1lbnQudXBkYXRlKHtcbiAgICAgICAgd2hlcmU6IHsgaWQ6IGFwYXJ0bWVudElkIH0sXG4gICAgICAgIGRhdGE6IHVwZGF0ZURhdGFcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJlcy5qc29uKHVwZGF0ZWRBcHQpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKCdVcGRhdGUgYXBhcnRtZW50IGVycm9yOicsIGVycik7XG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgZXJyb3I6ICdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3IgdXBkYXRpbmcgYXBhcnRtZW50JyB9KTtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYmF0Y2hVcGRhdGVBcGFydG1lbnRzKHJlcSwgcmVzKSB7XG4gIGNvbnN0IHsgYnVpbGRpbmdJZCB9ID0gcmVxLnBhcmFtcztcbiAgY29uc3QgeyBpdGVtcyB9ID0gcmVxLmJvZHk7IC8vIGFycmF5IG9mOiB7IGlkLCB1cGRhdGVzIH1cblxuICBpZiAoIWl0ZW1zIHx8ICFBcnJheS5pc0FycmF5KGl0ZW1zKSkge1xuICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7IGVycm9yOiAnSXRlbXMgYXJyYXkgaXMgcmVxdWlyZWQnIH0pO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBjb25zdCByb2xlID0gcmVxLnVzZXIucm9sZTtcbiAgICBpZiAocm9sZSA9PT0gJ1JPTEVfQycgfHwgcm9sZSA9PT0gJ1JPTEVfRCcpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMykuanNvbih7IGVycm9yOiAnUmVhZC1vbmx5IHVzZXJzIGNhbm5vdCBtb2RpZnkgZGF0YScgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgYnVpbGRpbmcgPSBhd2FpdCBwcmlzbWEuYnVpbGRpbmcuZmluZFVuaXF1ZSh7XG4gICAgICB3aGVyZTogeyBpZDogYnVpbGRpbmdJZCB9XG4gICAgfSk7XG5cbiAgICBpZiAoIWJ1aWxkaW5nKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oeyBlcnJvcjogJ0J1aWxkaW5nIG5vdCBmb3VuZCcgfSk7XG4gICAgfVxuXG4gICAgLy8gRXhlY3V0ZSBpbiBhIHRyYW5zYWN0aW9uXG4gICAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IHByaXNtYS4kdHJhbnNhY3Rpb24oYXN5bmMgKHR4KSA9PiB7XG4gICAgICBjb25zdCB1cGRhdGVkTGlzdCA9IFtdO1xuXG4gICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgaXRlbXMpIHtcbiAgICAgICAgY29uc3QgYXB0ID0gYXdhaXQgdHguYXBhcnRtZW50LmZpbmRVbmlxdWUoe1xuICAgICAgICAgIHdoZXJlOiB7IGlkOiBpdGVtLmlkIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKCFhcHQgfHwgYXB0LmJ1aWxkaW5nSWQgIT09IGJ1aWxkaW5nSWQpIGNvbnRpbnVlO1xuXG4gICAgICAgIGNvbnN0IGZpbHRlcmVkVXBkYXRlcyA9IHt9O1xuICAgICAgICBpZiAocm9sZSA9PT0gJ1JPTEVfQScpIHtcbiAgICAgICAgICAvLyBSb2xlIEEgKEFkbWluKSBoYXMgZnVsbCBlZGl0aW5nIHJpZ2h0cyB0byBhbnkgZmllbGQgaW4gdGhlIEFwYXJ0bWVudCBtb2RlbFxuICAgICAgICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKGl0ZW0udXBkYXRlcykpIHtcbiAgICAgICAgICAgIGlmIChrZXkgIT09ICdpZCcgJiYga2V5ICE9PSAnYnVpbGRpbmdJZCcgJiYga2V5ICE9PSAnY3JlYXRlZEF0Jykge1xuICAgICAgICAgICAgICBmaWx0ZXJlZFVwZGF0ZXNba2V5XSA9IHZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChyb2xlID09PSAnUk9MRV9CJykge1xuICAgICAgICAgIGNvbnN0IGF0dGVtcHRlZFJvbGVBRmllbGRzID0gUk9MRV9BX0ZJRUxEUy5maWx0ZXIoa2V5ID0+IGl0ZW0udXBkYXRlc1trZXldICE9PSB1bmRlZmluZWQpO1xuICAgICAgICAgIGlmIChhdHRlbXB0ZWRSb2xlQUZpZWxkcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEV4ZWN1dGlvbiByb2xlIGNhbm5vdCBtb2RpZnkgU2V0dXAgZmllbGRzIGluIGJhdGNoOiBbJHthdHRlbXB0ZWRSb2xlQUZpZWxkcy5qb2luKCcsICcpfV1gKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMoaXRlbS51cGRhdGVzKSkge1xuICAgICAgICAgICAgaWYgKCFST0xFX0FfRklFTERTLmluY2x1ZGVzKGtleSkgJiYga2V5ICE9PSAnaWQnICYmIGtleSAhPT0gJ2J1aWxkaW5nSWQnICYmIGtleSAhPT0gJ2NyZWF0ZWRBdCcpIHtcbiAgICAgICAgICAgICAgZmlsdGVyZWRVcGRhdGVzW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBPTkUtV1JJVEUgTE9DSzogUk9MRV9CIGNhbm5vdCBvdmVyd3JpdGUgYSBmaWVsZCB0aGF0IGFscmVhZHkgaGFzIGEgc2F2ZWQgdmFsdWUuXG4gICAgICAgICAgLy8gUGVyY2VudGFnZSBmaWVsZHM6IGxvY2tlZCBvbmNlID4gMC4gVGV4dC9kYXRlIGZpZWxkczogbG9ja2VkIG9uY2Ugbm9uLWVtcHR5LlxuICAgICAgICAgIGNvbnN0IHBjdEZpZWxkcyA9IFtcbiAgICAgICAgICAgICdraXRjaGVuTG93ZXJDYXJjYXNzSW53YXJkJywgJ2tpdGNoZW5VcHBlckNhcmNhc3NJbndhcmQnLCAna2l0Y2hlblN0b25lSW53YXJkJyxcbiAgICAgICAgICAgICdraXRjaGVuU2h1dHRlcklud2FyZCcsICdraXRjaGVuSGFyZHdhcmVJbndhcmQnLCAna2l0Y2hlbkFwcGxpYW5jZUlud2FyZCcsXG4gICAgICAgICAgICAnd2FyZHJvYmVDYWJpbmV0SW53YXJkJywgJ3dhcmRyb2JlU2h1dHRlckhhcmR3YXJlSW53YXJkJyxcbiAgICAgICAgICAgICd2YW5pdHlDYWJpbmV0SW53YXJkJywgJ3Zhbml0eVNodXR0ZXJIYXJkd2FyZUlud2FyZCcsXG4gICAgICAgICAgICAna2l0Y2hlbkxvd2VyQ2FyY2Fzc0luc3RhbGxlZCcsICdraXRjaGVuVXBwZXJDYXJjYXNzSW5zdGFsbGVkJywgJ2tpdGNoZW5TdG9uZUluc3RhbGxlZCcsXG4gICAgICAgICAgICAna2l0Y2hlblNodXR0ZXJIYXJkd2FyZUluc3RhbGxlZCcsICdraXRjaGVuQXBwbGlhbmNlSW5zdGFsbGVkJywgJ2tpdGNoZW5IYW5kZWRPdmVyJyxcbiAgICAgICAgICAgICd3YXJkcm9iZUNhYmluZXRJbnN0YWxsZWQnLCAnd2FyZHJvYmVTaHV0dGVySGFyZHdhcmVJbnN0YWxsZWQnLCAnd2FyZHJvYmVIYW5kZWRPdmVyJyxcbiAgICAgICAgICAgICd2YW5pdHlDYWJpbmV0SW5zdGFsbGVkJywgJ3Zhbml0eVNodXR0ZXJIYXJkd2FyZUluc3RhbGxlZCcsICd2YW5pdHlIYW5kZWRPdmVyJyxcbiAgICAgICAgICBdO1xuICAgICAgICAgIGZvciAoY29uc3QgZiBvZiBwY3RGaWVsZHMpIHtcbiAgICAgICAgICAgIGlmIChmaWx0ZXJlZFVwZGF0ZXNbZl0gIT09IHVuZGVmaW5lZCAmJiBhcHRbZl0gIT09IG51bGwgJiYgYXB0W2ZdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgZGVsZXRlIGZpbHRlcmVkVXBkYXRlc1tmXTsgLy8gYWxyZWFkeSBzYXZlZCBcdTIwMTQgZGVueSBvdmVyd3JpdGVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgdGV4dExvY2tGaWVsZHMgPSBbXG4gICAgICAgICAgICAncGxhbm5lZFN0YXJ0JywgJ3BsYW5uZWRDb21wbGV0aW9uJywgJ2FjdHVhbFN0YXJ0JywgJ2FjdHVhbENvbXBsZXRpb24nLFxuICAgICAgICAgICAgJ2NvbnRyYWN0b3InLCAnY29udHJhY3Rvck5hbWUnLCAnZGVsYXlSZWFzb24nLCAncmVtYXJrcycsXG4gICAgICAgICAgICAna2l0Y2hlblFDX1Zpc2libGVTY3Jld3MnLCAna2l0Y2hlblFDX0NoaXBwaW5nJywgJ2tpdGNoZW5RQ19GaWxsZXJNaXNzaW5nJyxcbiAgICAgICAgICAgICdraXRjaGVuUUNfU2NyYXRjaGVzJywgJ2tpdGNoZW5RQ19EcmF3ZXJzRnVuY3Rpb24nLCAna2l0Y2hlblFDX0N1dGxlcnlUcmF5JywgJ2tpdGNoZW5RQ19EaXNoRHJhaW5lcicsXG4gICAgICAgICAgICAnd2FyZHJvYmVRQ19WaXNpYmxlU2NyZXdzJywgJ3dhcmRyb2JlUUNfQ2hpcHBpbmcnLCAnd2FyZHJvYmVRQ19GaWxsZXJNaXNzaW5nJyxcbiAgICAgICAgICAgICd3YXJkcm9iZVFDX1NjcmF0Y2hlcycsICd3YXJkcm9iZVFDX0RyYXdlcnNGdW5jdGlvbicsXG4gICAgICAgICAgICAndmFuaXR5UUNfVmlzaWJsZVNjcmV3cycsICd2YW5pdHlRQ19DaGlwcGluZycsICd2YW5pdHlRQ19GaWxsZXJNaXNzaW5nJyxcbiAgICAgICAgICAgICd2YW5pdHlRQ19TY3JhdGNoZXMnLCAndmFuaXR5UUNfRHJhd2Vyc0Z1bmN0aW9uJyxcbiAgICAgICAgICBdO1xuICAgICAgICAgIGZvciAoY29uc3QgZiBvZiB0ZXh0TG9ja0ZpZWxkcykge1xuICAgICAgICAgICAgY29uc3QgZXhpc3RpbmcgPSBhcHRbZl07XG4gICAgICAgICAgICBpZiAoZmlsdGVyZWRVcGRhdGVzW2ZdICE9PSB1bmRlZmluZWQgJiYgZXhpc3RpbmcgIT09IG51bGwgJiYgZXhpc3RpbmcgIT09IHVuZGVmaW5lZCAmJiBTdHJpbmcoZXhpc3RpbmcpLnRyaW0oKSAhPT0gJycpIHtcbiAgICAgICAgICAgICAgZGVsZXRlIGZpbHRlcmVkVXBkYXRlc1tmXTsgLy8gYWxyZWFkeSBzYXZlZCBcdTIwMTQgZGVueSBvdmVyd3JpdGVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoT2JqZWN0LmtleXMoZmlsdGVyZWRVcGRhdGVzKS5sZW5ndGggPT09IDApIGNvbnRpbnVlO1xuXG4gICAgICAgIC8vIFBhcnNlIGRhdGUgZmllbGRzXG4gICAgICAgIGNvbnN0IGRhdGVGaWVsZHMgPSBbJ3BsYW5uZWRTdGFydCcsICdwbGFubmVkQ29tcGxldGlvbicsICdhY3R1YWxTdGFydCcsICdhY3R1YWxDb21wbGV0aW9uJ107XG4gICAgICAgIGZvciAoY29uc3QgZiBvZiBkYXRlRmllbGRzKSB7XG4gICAgICAgICAgaWYgKGZpbHRlcmVkVXBkYXRlc1tmXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBmaWx0ZXJlZFVwZGF0ZXNbZl0gPSBmaWx0ZXJlZFVwZGF0ZXNbZl0gPyBuZXcgRGF0ZShmaWx0ZXJlZFVwZGF0ZXNbZl0pIDogbnVsbDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZmlsdGVyZWRVcGRhdGVzLmFjdHVhbENvbXBsZXRpb24pIHtcbiAgICAgICAgICBjb25zdCB0b2RheSA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgdG9kYXkuc2V0SG91cnMoMjMsIDU5LCA1OSwgOTk5KTtcbiAgICAgICAgICBpZiAoZmlsdGVyZWRVcGRhdGVzLmFjdHVhbENvbXBsZXRpb24gPiB0b2RheSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdBY3R1YWwgY29tcGxldGlvbiBkYXRlIGNhbm5vdCBiZSBzZXQgaW4gdGhlIGZ1dHVyZScpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEF1ZGl0IExvZ3NcbiAgICAgICAgY29uc3QgYXVkaXRMb2dEYXRhID0gW107XG4gICAgICAgIGZvciAoY29uc3QgW2ZpZWxkLCBuZXdWYWxdIG9mIE9iamVjdC5lbnRyaWVzKGZpbHRlcmVkVXBkYXRlcykpIHtcbiAgICAgICAgICBsZXQgb2xkVmFsU3RyID0gYXB0W2ZpZWxkXSA9PT0gbnVsbCA/ICcnIDogU3RyaW5nKGFwdFtmaWVsZF0pO1xuICAgICAgICAgIGlmIChhcHRbZmllbGRdIGluc3RhbmNlb2YgRGF0ZSkgb2xkVmFsU3RyID0gYXB0W2ZpZWxkXS50b0lTT1N0cmluZygpO1xuXG4gICAgICAgICAgbGV0IG5ld1ZhbFN0ciA9IG5ld1ZhbCA9PT0gbnVsbCA/ICcnIDogU3RyaW5nKG5ld1ZhbCk7XG4gICAgICAgICAgaWYgKG5ld1ZhbCBpbnN0YW5jZW9mIERhdGUpIG5ld1ZhbFN0ciA9IG5ld1ZhbC50b0lTT1N0cmluZygpO1xuXG4gICAgICAgICAgaWYgKG9sZFZhbFN0ciAhPT0gbmV3VmFsU3RyKSB7XG4gICAgICAgICAgICBhdWRpdExvZ0RhdGEucHVzaCh7XG4gICAgICAgICAgICAgIGFwYXJ0bWVudElkOiBhcHQuaWQsXG4gICAgICAgICAgICAgIHVzZXJJZDogcmVxLnVzZXIuaWQsXG4gICAgICAgICAgICAgIGZpZWxkTmFtZTogZmllbGQsXG4gICAgICAgICAgICAgIG9sZFZhbHVlOiBvbGRWYWxTdHIsXG4gICAgICAgICAgICAgIG5ld1ZhbHVlOiBuZXdWYWxTdHJcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChhdWRpdExvZ0RhdGEubGVuZ3RoID4gMCkge1xuICAgICAgICAgIGF3YWl0IHR4LmF1ZGl0TG9nLmNyZWF0ZU1hbnkoe1xuICAgICAgICAgICAgZGF0YTogYXVkaXRMb2dEYXRhXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBtZXJnZWRBcHQgPSB7IC4uLmFwdCwgLi4uZmlsdGVyZWRVcGRhdGVzIH07XG4gICAgICAgIGNvbnN0IHJlY2FsY3VsYXRlZCA9IHJlY2FsY3VsYXRlQXBhcnRtZW50KG1lcmdlZEFwdCwgYnVpbGRpbmcpO1xuXG4gICAgICAgIC8vIFNhbml0aXplIHJlbGF0aW9uLCBwcmltYXJ5L2ZvcmVpZ24ga2V5cyBhbmQgYXV0by1tYW5hZ2VkIGZpZWxkcyBmcm9tIGRhdGFcbiAgICAgICAgY29uc3QgeyBpZCwgYnVpbGRpbmdJZDogYklkLCBjcmVhdGVkQXQsIHVwZGF0ZWRBdCwgYnVpbGRpbmc6IGJ1aWxkaW5nUmVsYXRpb24sIGF1ZGl0TG9ncywgLi4udXBkYXRlRGF0YSB9ID0gcmVjYWxjdWxhdGVkO1xuXG4gICAgICAgIGNvbnN0IHVwZGF0ZWQgPSBhd2FpdCB0eC5hcGFydG1lbnQudXBkYXRlKHtcbiAgICAgICAgICB3aGVyZTogeyBpZDogYXB0LmlkIH0sXG4gICAgICAgICAgZGF0YTogdXBkYXRlRGF0YVxuICAgICAgICB9KTtcblxuICAgICAgICB1cGRhdGVkTGlzdC5wdXNoKHVwZGF0ZWQpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdXBkYXRlZExpc3Q7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcmVzLmpzb24oeyBzdWNjZXNzOiB0cnVlLCB1cGRhdGVkQ291bnQ6IHJlc3VsdHMubGVuZ3RoIH0pO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKCdCYXRjaCB1cGRhdGUgZXJyb3I6JywgZXJyKTtcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oeyBlcnJvcjogJ0ludGVybmFsIHNlcnZlciBlcnJvciBpbiBiYXRjaCB1cGRhdGUnIH0pO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRBdWRpdExvZ3MocmVxLCByZXMpIHtcbiAgY29uc3QgeyBhcGFydG1lbnRJZCB9ID0gcmVxLnBhcmFtcztcbiAgdHJ5IHtcbiAgICBjb25zdCBsb2dzID0gYXdhaXQgcHJpc21hLmF1ZGl0TG9nLmZpbmRNYW55KHtcbiAgICAgIHdoZXJlOiB7IGFwYXJ0bWVudElkIH0sXG4gICAgICBpbmNsdWRlOiB7XG4gICAgICAgIHVzZXI6IHtcbiAgICAgICAgICBzZWxlY3Q6IHtcbiAgICAgICAgICAgIG5hbWU6IHRydWUsXG4gICAgICAgICAgICByb2xlOiB0cnVlXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgb3JkZXJCeTogeyBjaGFuZ2VkQXQ6ICdkZXNjJyB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlcy5qc29uKGxvZ3MpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oeyBlcnJvcjogJ0ludGVybmFsIHNlcnZlciBlcnJvciBmZXRjaGluZyBsb2dzJyB9KTtcbiAgfVxufVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxocFxcXFxEb3dubG9hZHNcXFxcRGlvIEdyYWNlICgzKVxcXFxEaW8gR3JhY2UgKDMpXFxcXERpbyBHcmFjZWVcXFxcYmFja2VuZFxcXFxzcmNcXFxcc2VydmljZXNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGhwXFxcXERvd25sb2Fkc1xcXFxEaW8gR3JhY2UgKDMpXFxcXERpbyBHcmFjZSAoMylcXFxcRGlvIEdyYWNlZVxcXFxiYWNrZW5kXFxcXHNyY1xcXFxzZXJ2aWNlc1xcXFxiaWxsaW5nU2VydmljZS5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvaHAvRG93bmxvYWRzL0RpbyUyMEdyYWNlJTIwKDMpL0RpbyUyMEdyYWNlJTIwKDMpL0RpbyUyMEdyYWNlZS9iYWNrZW5kL3NyYy9zZXJ2aWNlcy9iaWxsaW5nU2VydmljZS5qc1wiOy8qKlxuICogU2VydmljZSB0byBjYWxjdWxhdGUgQ29udHJhY3RvciBCaWxsIGFuZCBDbGllbnQgUkEgQmlsbCB2YWx1ZXMuXG4gKi9cblxuZXhwb3J0IGZ1bmN0aW9uIGNhbGN1bGF0ZUNvbnRyYWN0b3JCaWxsTGluZShsaW5lLCBhcGFydG1lbnRzLCBzZXR1cCkge1xuICBjb25zdCB1bml0VHlwZSA9IGxpbmUudW5pdFR5cGU7XG4gIGlmICghdW5pdFR5cGUpIHJldHVybiBsaW5lO1xuXG4gIGNvbnN0IHByb2R1Y3QgPSB1bml0VHlwZS5wcm9kdWN0OyAvLyBLaXRjaGVuLCBXYXJkcm9iZSwgVmFuaXR5XG4gIGNvbnN0IHR5cGVDb2RlID0gdW5pdFR5cGUudHlwZUNvZGU7XG5cbiAgLy8gMS4gQ2FsY3VsYXRlIEFsbG9jYXRlZCBVbml0c1xuICAvLyBzdW0gb2YgdGhlIHJlbGV2YW50IFF0eSBjb2x1bW4gYWNyb3NzIGFwYXJ0bWVudHMgaW4gdGhpcyBPcmRlciBmb3IgdGhpcyBjb250cmFjdG9yIGFuZCB0eXBlXG4gIGxldCBhbGxvY2F0ZWRVbml0cyA9IDA7XG4gIGZvciAoY29uc3QgYXB0IG9mIGFwYXJ0bWVudHMpIHtcbiAgICBpZiAoYXB0LmNvbnRyYWN0b3JOYW1lICYmIGFwdC5jb250cmFjdG9yTmFtZS50cmltKCkudG9Mb3dlckNhc2UoKSA9PT0gbGluZS5jb250cmFjdG9yTmFtZS50cmltKCkudG9Mb3dlckNhc2UoKSkge1xuICAgICAgaWYgKHByb2R1Y3QgPT09IFwiS2l0Y2hlblwiKSB7XG4gICAgICAgIGNvbnN0IHR5cGVTdHIgPSBhcHQua2l0Y2hlblR5cGU7XG4gICAgICAgIGlmICh0eXBlU3RyICYmIHR5cGVTdHIuc3RhcnRzV2l0aCgnWycpKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGxpc3QgPSBKU09OLnBhcnNlKHR5cGVTdHIpO1xuICAgICAgICAgICAgY29uc3QgZm91bmQgPSBsaXN0LmZpbmQoaXRlbSA9PiBpdGVtLnR5cGUgPT09IHR5cGVDb2RlKTtcbiAgICAgICAgICAgIGlmIChmb3VuZCkgYWxsb2NhdGVkVW5pdHMgKz0gZm91bmQucXR5IHx8IDA7XG4gICAgICAgICAgfSBjYXRjaCAoZSkge31cbiAgICAgICAgfSBlbHNlIGlmIChhcHQua2l0Y2hlblR5cGUgPT09IHR5cGVDb2RlKSB7XG4gICAgICAgICAgYWxsb2NhdGVkVW5pdHMgKz0gYXB0LmtpdGNoZW5RdHkgfHwgMDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChwcm9kdWN0ID09PSBcIldhcmRyb2JlXCIpIHtcbiAgICAgICAgY29uc3QgdHlwZVN0ciA9IGFwdC53YXJkcm9iZVR5cGU7XG4gICAgICAgIGlmICh0eXBlU3RyICYmIHR5cGVTdHIuc3RhcnRzV2l0aCgnWycpKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGxpc3QgPSBKU09OLnBhcnNlKHR5cGVTdHIpO1xuICAgICAgICAgICAgY29uc3QgZm91bmQgPSBsaXN0LmZpbmQoaXRlbSA9PiBpdGVtLnR5cGUgPT09IHR5cGVDb2RlKTtcbiAgICAgICAgICAgIGlmIChmb3VuZCkgYWxsb2NhdGVkVW5pdHMgKz0gZm91bmQucXR5IHx8IDA7XG4gICAgICAgICAgfSBjYXRjaCAoZSkge31cbiAgICAgICAgfSBlbHNlIGlmIChhcHQud2FyZHJvYmVUeXBlID09PSB0eXBlQ29kZSkge1xuICAgICAgICAgIGFsbG9jYXRlZFVuaXRzICs9IGFwdC53YXJkcm9iZVF0eSB8fCAwO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHByb2R1Y3QgPT09IFwiVmFuaXR5XCIpIHtcbiAgICAgICAgY29uc3QgdHlwZVN0ciA9IGFwdC52YW5pdHlUeXBlO1xuICAgICAgICBpZiAodHlwZVN0ciAmJiB0eXBlU3RyLnN0YXJ0c1dpdGgoJ1snKSkge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBsaXN0ID0gSlNPTi5wYXJzZSh0eXBlU3RyKTtcbiAgICAgICAgICAgIGNvbnN0IGZvdW5kID0gbGlzdC5maW5kKGl0ZW0gPT4gaXRlbS50eXBlID09PSB0eXBlQ29kZSk7XG4gICAgICAgICAgICBpZiAoZm91bmQpIGFsbG9jYXRlZFVuaXRzICs9IGZvdW5kLnF0eSB8fCAwO1xuICAgICAgICAgIH0gY2F0Y2ggKGUpIHt9XG4gICAgICAgIH0gZWxzZSBpZiAoYXB0LnZhbml0eVR5cGUgPT09IHR5cGVDb2RlKSB7XG4gICAgICAgICAgYWxsb2NhdGVkVW5pdHMgKz0gYXB0LnZhbml0eVF0eSB8fCAwO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgY29uc3QgcmF0ZSA9IHVuaXRUeXBlLmNvbnRyYWN0b3JSYXRlIHx8IDAuMDtcbiAgY29uc3Qgd29WYWx1ZSA9IHJhdGUgKiBhbGxvY2F0ZWRVbml0cztcbiAgXG4gIGNvbnN0IGVsaWdpYmxlVW5pdHMgPSBsaW5lLmVsaWdpYmxlVW5pdEVxdWl2YWxlbnQgfHwgMC4wO1xuICBjb25zdCBlbGlnaWJpbGl0eVBjdCA9IGFsbG9jYXRlZFVuaXRzID4gMCA/IChlbGlnaWJsZVVuaXRzIC8gYWxsb2NhdGVkVW5pdHMpIDogMC4wO1xuICBjb25zdCBjdW11bGF0aXZlRWxpZ2libGUgPSByYXRlICogZWxpZ2libGVVbml0cztcbiAgXG4gIGNvbnN0IHByZXZDZXJ0aWZpZWQgPSBsaW5lLnByZXZpb3VzQ2VydGlmaWVkIHx8IDAuMDtcbiAgY29uc3QgY3VycmVudEdyb3NzID0gTWF0aC5tYXgoMCwgY3VtdWxhdGl2ZUVsaWdpYmxlIC0gcHJldkNlcnRpZmllZCk7XG5cbiAgY29uc3QgcmV0ZW50aW9uUGN0ID0gc2V0dXAuY29udHJhY3RvclJldGVudGlvblBjdCB8fCA1LjA7XG4gIGNvbnN0IGdzdFBjdCA9IHNldHVwLmNvbnRyYWN0b3JHU1RQY3QgfHwgMTguMDtcbiAgY29uc3QgdGRzUGN0ID0gc2V0dXAuY29udHJhY3RvclREU1BjdCB8fCAxLjA7XG5cbiAgY29uc3QgcmV0ZW50aW9uQW10ID0gY3VycmVudEdyb3NzICogKHJldGVudGlvblBjdCAvIDEwMC4wKTtcbiAgY29uc3QgZ3N0QW10ID0gY3VycmVudEdyb3NzICogKGdzdFBjdCAvIDEwMC4wKTtcbiAgY29uc3QgdGRzQW10ID0gY3VycmVudEdyb3NzICogKHRkc1BjdCAvIDEwMC4wKTtcbiAgY29uc3Qgb3RoZXJEZWR1Y3Rpb24gPSBsaW5lLm90aGVyRGVkdWN0aW9uIHx8IDAuMDtcblxuICBjb25zdCBuZXRQYXlhYmxlID0gTWF0aC5tYXgoMCwgY3VycmVudEdyb3NzIC0gcmV0ZW50aW9uQW10ICsgZ3N0QW10IC0gdGRzQW10IC0gb3RoZXJEZWR1Y3Rpb24pO1xuXG4gIHJldHVybiB7XG4gICAgLi4ubGluZSxcbiAgICByYXRlVW5pdDogcmF0ZSxcbiAgICBhbGxvY2F0ZWRVbml0cyxcbiAgICB3b1ZhbHVlOiBNYXRoLnJvdW5kKHdvVmFsdWUgKiAxMDApIC8gMTAwLFxuICAgIGVsaWdpYmlsaXR5UGN0OiBNYXRoLnJvdW5kKGVsaWdpYmlsaXR5UGN0ICogMTAwMCkgLyAxMDAwLFxuICAgIGN1bXVsYXRpdmVFbGlnaWJsZTogTWF0aC5yb3VuZChjdW11bGF0aXZlRWxpZ2libGUgKiAxMDApIC8gMTAwLFxuICAgIGN1cnJlbnRHcm9zczogTWF0aC5yb3VuZChjdXJyZW50R3Jvc3MgKiAxMDApIC8gMTAwLFxuICAgIHJldGVudGlvbkFtdDogTWF0aC5yb3VuZChyZXRlbnRpb25BbXQgKiAxMDApIC8gMTAwLFxuICAgIGdzdEFtdDogTWF0aC5yb3VuZChnc3RBbXQgKiAxMDApIC8gMTAwLFxuICAgIHRkc0FtdDogTWF0aC5yb3VuZCh0ZHNBbXQgKiAxMDApIC8gMTAwLFxuICAgIG5ldFBheWFibGU6IE1hdGgucm91bmQobmV0UGF5YWJsZSAqIDEwMCkgLyAxMDBcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNhbGN1bGF0ZUNsaWVudFJBQmlsbExpbmUobGluZSwgYXBhcnRtZW50cywgc2V0dXAsIHRvd2VyUmF0ZXNPdmVycmlkZSA9IFtdKSB7XG4gIGNvbnN0IHVuaXRUeXBlID0gbGluZS51bml0VHlwZTtcbiAgaWYgKCF1bml0VHlwZSkgcmV0dXJuIGxpbmU7XG5cbiAgY29uc3QgcHJvZHVjdCA9IHVuaXRUeXBlLnByb2R1Y3Q7IC8vIEtpdGNoZW4sIFdhcmRyb2JlLCBWYW5pdHlcbiAgY29uc3QgdHlwZUNvZGUgPSB1bml0VHlwZS50eXBlQ29kZTtcbiAgY29uc3QgYnVpbGRpbmdJZCA9IGxpbmUuYnVpbGRpbmdJZDtcblxuICAvLyAxLiBGaWx0ZXIgYXBhcnRtZW50cyBpbiB0aGlzIGJ1aWxkaW5nICh0b3dlcikgYW5kIG1hdGNoIHVuaXRUeXBlXG4gIGNvbnN0IGFwdFdpdGhRdHlzID0gW107XG4gIGZvciAoY29uc3QgYXB0IG9mIGFwYXJ0bWVudHMpIHtcbiAgICBpZiAoYXB0LmJ1aWxkaW5nSWQgIT09IGJ1aWxkaW5nSWQpIGNvbnRpbnVlO1xuICAgIGlmIChwcm9kdWN0ID09PSBcIktpdGNoZW5cIikge1xuICAgICAgY29uc3QgdHlwZVN0ciA9IGFwdC5raXRjaGVuVHlwZTtcbiAgICAgIGlmICh0eXBlU3RyICYmIHR5cGVTdHIuc3RhcnRzV2l0aCgnWycpKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgbGlzdCA9IEpTT04ucGFyc2UodHlwZVN0cik7XG4gICAgICAgICAgY29uc3QgZm91bmQgPSBsaXN0LmZpbmQoaXRlbSA9PiBpdGVtLnR5cGUgPT09IHR5cGVDb2RlKTtcbiAgICAgICAgICBpZiAoZm91bmQgJiYgZm91bmQucXR5ID4gMCkge1xuICAgICAgICAgICAgYXB0V2l0aFF0eXMucHVzaCh7IGFwdCwgcXR5OiBmb3VuZC5xdHkgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7fVxuICAgICAgfSBlbHNlIGlmIChhcHQua2l0Y2hlblR5cGUgPT09IHR5cGVDb2RlICYmIChhcHQua2l0Y2hlblF0eSB8fCAwKSA+IDApIHtcbiAgICAgICAgYXB0V2l0aFF0eXMucHVzaCh7IGFwdCwgcXR5OiBhcHQua2l0Y2hlblF0eSB8fCAwIH0pO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAocHJvZHVjdCA9PT0gXCJXYXJkcm9iZVwiKSB7XG4gICAgICBjb25zdCB0eXBlU3RyID0gYXB0LndhcmRyb2JlVHlwZTtcbiAgICAgIGlmICh0eXBlU3RyICYmIHR5cGVTdHIuc3RhcnRzV2l0aCgnWycpKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgbGlzdCA9IEpTT04ucGFyc2UodHlwZVN0cik7XG4gICAgICAgICAgY29uc3QgZm91bmQgPSBsaXN0LmZpbmQoaXRlbSA9PiBpdGVtLnR5cGUgPT09IHR5cGVDb2RlKTtcbiAgICAgICAgICBpZiAoZm91bmQgJiYgZm91bmQucXR5ID4gMCkge1xuICAgICAgICAgICAgYXB0V2l0aFF0eXMucHVzaCh7IGFwdCwgcXR5OiBmb3VuZC5xdHkgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7fVxuICAgICAgfSBlbHNlIGlmIChhcHQud2FyZHJvYmVUeXBlID09PSB0eXBlQ29kZSAmJiAoYXB0LndhcmRyb2JlUXR5IHx8IDApID4gMCkge1xuICAgICAgICBhcHRXaXRoUXR5cy5wdXNoKHsgYXB0LCBxdHk6IGFwdC53YXJkcm9iZVF0eSB8fCAwIH0pO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAocHJvZHVjdCA9PT0gXCJWYW5pdHlcIikge1xuICAgICAgY29uc3QgdHlwZVN0ciA9IGFwdC52YW5pdHlUeXBlO1xuICAgICAgaWYgKHR5cGVTdHIgJiYgdHlwZVN0ci5zdGFydHNXaXRoKCdbJykpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCBsaXN0ID0gSlNPTi5wYXJzZSh0eXBlU3RyKTtcbiAgICAgICAgICBjb25zdCBmb3VuZCA9IGxpc3QuZmluZChpdGVtID0+IGl0ZW0udHlwZSA9PT0gdHlwZUNvZGUpO1xuICAgICAgICAgIGlmIChmb3VuZCAmJiBmb3VuZC5xdHkgPiAwKSB7XG4gICAgICAgICAgICBhcHRXaXRoUXR5cy5wdXNoKHsgYXB0LCBxdHk6IGZvdW5kLnF0eSB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHt9XG4gICAgICB9IGVsc2UgaWYgKGFwdC52YW5pdHlUeXBlID09PSB0eXBlQ29kZSAmJiAoYXB0LnZhbml0eVF0eSB8fCAwKSA+IDApIHtcbiAgICAgICAgYXB0V2l0aFF0eXMucHVzaCh7IGFwdCwgcXR5OiBhcHQudmFuaXR5UXR5IHx8IDAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgY29uc3QgdW5pdHNDb3VudCA9IGFwdFdpdGhRdHlzLnJlZHVjZSgoc3VtLCBpdGVtKSA9PiBzdW0gKyBpdGVtLnF0eSwgMCk7XG5cbiAgLy8gMi4gQ2xpZW50IFJhdGUgLyBVbml0OiBjaGVjayB0b3dlciBvdmVycmlkZSwgZWxzZSBkZWZhdWx0IGNsaWVudFJhdGVcbiAgY29uc3Qgb3ZlcnJpZGUgPSB0b3dlclJhdGVzT3ZlcnJpZGUuZmluZChvID0+IG8uYnVpbGRpbmdJZCA9PT0gYnVpbGRpbmdJZCk7XG4gIGxldCByYXRlID0gdW5pdFR5cGUuY2xpZW50UmF0ZSB8fCAwLjA7XG4gIGlmIChvdmVycmlkZSkge1xuICAgIGlmIChwcm9kdWN0ID09PSBcIktpdGNoZW5cIiAmJiBvdmVycmlkZS5raXRjaGVuUmF0ZSA+IDApIHJhdGUgPSBvdmVycmlkZS5raXRjaGVuUmF0ZTtcbiAgICBlbHNlIGlmIChwcm9kdWN0ID09PSBcIldhcmRyb2JlXCIgJiYgb3ZlcnJpZGUud2FyZHJvYmVSYXRlID4gMCkgcmF0ZSA9IG92ZXJyaWRlLndhcmRyb2JlUmF0ZTtcbiAgICBlbHNlIGlmIChwcm9kdWN0ID09PSBcIlZhbml0eVwiICYmIG92ZXJyaWRlLnZhbml0eVJhdGUgPiAwKSByYXRlID0gb3ZlcnJpZGUudmFuaXR5UmF0ZTtcbiAgfVxuXG4gIGNvbnN0IGNvbnRyYWN0VmFsdWUgPSB1bml0c0NvdW50ICogcmF0ZTtcblxuICAvLyAzLiBDbGllbnQgUkEgTWlsZXN0b25lcyBzZXR1cFxuICBjb25zdCBtaWxlc3RvbmVzID0gc2V0dXAuY2xpZW50UkFNaWxlc3RvbmVzIHx8IFtdO1xuICBjb25zdCBtYXRlcmlhbE1pbGVzdG9uZXMgPSBtaWxlc3RvbmVzLmZpbHRlcihtID0+IG0ucHJvZHVjdCA9PT0gcHJvZHVjdCAmJiBtLnJlY29nbml0aW9uVHlwZSA9PT0gXCJNQVRFUklBTFwiKTtcbiAgY29uc3QgZXhlY3V0aW9uTWlsZXN0b25lcyA9IG1pbGVzdG9uZXMuZmlsdGVyKG0gPT4gbS5wcm9kdWN0ID09PSBwcm9kdWN0ICYmIG0ucmVjb2duaXRpb25UeXBlID09PSBcIkVYRUNVVElPTlwiKTtcbiAgY29uc3QgaGFuZG92ZXJNaWxlc3RvbmVzID0gbWlsZXN0b25lcy5maWx0ZXIobSA9PiBtLnByb2R1Y3QgPT09IHByb2R1Y3QgJiYgbS5yZWNvZ25pdGlvblR5cGUgPT09IFwiSEFORE9WRVJcIik7XG5cbiAgbGV0IHN1bU1hdGVyaWFsUGN0ID0gMC4wO1xuICBsZXQgc3VtRXhlY3V0aW9uUGN0ID0gMC4wO1xuICBsZXQgc3VtSGFuZG92ZXJQY3QgPSAwLjA7XG5cbiAgaWYgKGFwdFdpdGhRdHlzLmxlbmd0aCA+IDApIHtcbiAgICBmb3IgKGNvbnN0IHsgYXB0LCBxdHkgfSBvZiBhcHRXaXRoUXR5cykge1xuICAgICAgLy8gTWF0ZXJpYWxcbiAgICAgIGxldCBhcHRNYXRQY3QgPSAwLjA7XG4gICAgICBmb3IgKGNvbnN0IG0gb2YgbWF0ZXJpYWxNaWxlc3RvbmVzKSB7XG4gICAgICAgIGNvbnN0IHZhbCA9IGFwdFttLmZpZWxkS2V5XSB8fCAwO1xuICAgICAgICBjb25zdCBub3JtYWxpemVkVmFsID0gTWF0aC5taW4oMS4wLCB2YWwgLyAxMDAuMCk7XG4gICAgICAgIGFwdE1hdFBjdCArPSAobm9ybWFsaXplZFZhbCAqIG0ucGVyY2VudGFnZSkgLyAxMDAuMDtcbiAgICAgIH1cbiAgICAgIHN1bU1hdGVyaWFsUGN0ICs9IGFwdE1hdFBjdCAqIHF0eTtcblxuICAgICAgLy8gRXhlY3V0aW9uXG4gICAgICBsZXQgYXB0RXhlY1BjdCA9IDAuMDtcbiAgICAgIGZvciAoY29uc3QgbSBvZiBleGVjdXRpb25NaWxlc3RvbmVzKSB7XG4gICAgICAgIGNvbnN0IHZhbCA9IGFwdFttLmZpZWxkS2V5XSB8fCAwO1xuICAgICAgICBjb25zdCBub3JtYWxpemVkVmFsID0gTWF0aC5taW4oMS4wLCB2YWwgLyAxMDAuMCk7XG4gICAgICAgIGFwdEV4ZWNQY3QgKz0gKG5vcm1hbGl6ZWRWYWwgKiBtLnBlcmNlbnRhZ2UpIC8gMTAwLjA7XG4gICAgICB9XG4gICAgICBzdW1FeGVjdXRpb25QY3QgKz0gYXB0RXhlY1BjdCAqIHF0eTtcblxuICAgICAgLy8gSGFuZG92ZXJcbiAgICAgIGxldCBhcHRIYW5kb3ZlclBjdCA9IDAuMDtcbiAgICAgIGZvciAoY29uc3QgbSBvZiBoYW5kb3Zlck1pbGVzdG9uZXMpIHtcbiAgICAgICAgY29uc3QgcWNHYXRlID0gcHJvZHVjdCA9PT0gXCJLaXRjaGVuXCIgPyBhcHQua2l0Y2hlblFDR2F0ZSA6IChwcm9kdWN0ID09PSBcIldhcmRyb2JlXCIgPyBhcHQud2FyZHJvYmVRQ0dhdGUgOiBhcHQudmFuaXR5UUNHYXRlKTtcbiAgICAgICAgY29uc3QgaGFuZGVkT3ZlciA9IHByb2R1Y3QgPT09IFwiS2l0Y2hlblwiID8gKGFwdC5raXRjaGVuSGFuZGVkT3ZlciB8fCAwKSA6IChwcm9kdWN0ID09PSBcIldhcmRyb2JlXCIgPyAoYXB0LndhcmRyb2JlSGFuZGVkT3ZlciB8fCAwKSA6IChhcHQudmFuaXR5SGFuZGVkT3ZlciB8fCAwKSk7XG4gICAgICAgIGNvbnN0IG5vcm1hbGl6ZWRWYWwgPSBNYXRoLm1pbigxLjAsIGhhbmRlZE92ZXIgLyAxMDAuMCk7XG4gICAgICAgIGlmIChxY0dhdGUgPT09IFwiQXBwcm92ZWRcIiAmJiBub3JtYWxpemVkVmFsID4gMCkge1xuICAgICAgICAgIGFwdEhhbmRvdmVyUGN0ICs9IChub3JtYWxpemVkVmFsICogbS5wZXJjZW50YWdlKSAvIDEwMC4wO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBzdW1IYW5kb3ZlclBjdCArPSBhcHRIYW5kb3ZlclBjdCAqIHF0eTtcbiAgICB9XG5cbiAgICBzdW1NYXRlcmlhbFBjdCA9IHN1bU1hdGVyaWFsUGN0IC8gdW5pdHNDb3VudDtcbiAgICBzdW1FeGVjdXRpb25QY3QgPSBzdW1FeGVjdXRpb25QY3QgLyB1bml0c0NvdW50O1xuICAgIHN1bUhhbmRvdmVyUGN0ID0gc3VtSGFuZG92ZXJQY3QgLyB1bml0c0NvdW50O1xuICB9XG5cbiAgY29uc3QgbWF0ZXJpYWxFbGlnaWJsZUFtdCA9IGNvbnRyYWN0VmFsdWUgKiBzdW1NYXRlcmlhbFBjdDtcbiAgY29uc3QgZXhlY3V0aW9uRWxpZ2libGVBbXQgPSBjb250cmFjdFZhbHVlICogc3VtRXhlY3V0aW9uUGN0O1xuICBjb25zdCBoYW5kb3ZlckVsaWdpYmxlQW10ID0gY29udHJhY3RWYWx1ZSAqIHN1bUhhbmRvdmVyUGN0O1xuICBjb25zdCBjdW11bGF0aXZlRWxpZ2libGUgPSBtYXRlcmlhbEVsaWdpYmxlQW10ICsgZXhlY3V0aW9uRWxpZ2libGVBbXQgKyBoYW5kb3ZlckVsaWdpYmxlQW10O1xuXG4gIGNvbnN0IG92ZXJhbGxFbGlnUGN0ID0gY29udHJhY3RWYWx1ZSA+IDAgPyAoY3VtdWxhdGl2ZUVsaWdpYmxlIC8gY29udHJhY3RWYWx1ZSkgOiAwLjA7XG5cbiAgY29uc3QgaW5jbHVkZSA9IGxpbmUuaW5jbHVkZUluQ3VycmVudFJBID8/IHRydWU7XG4gIGNvbnN0IHByZXZDZXJ0aWZpZWQgPSBsaW5lLnByZXZpb3VzQ2VydGlmaWVkIHx8IDAuMDtcbiAgY29uc3QgY3VycmVudEdyb3NzID0gaW5jbHVkZSA/IE1hdGgubWF4KDAsIGN1bXVsYXRpdmVFbGlnaWJsZSAtIHByZXZDZXJ0aWZpZWQpIDogMC4wO1xuXG4gIGNvbnN0IHJldGVudGlvblBjdCA9IHNldHVwLmNsaWVudFJldGVudGlvblBjdCB8fCA1LjA7XG4gIGNvbnN0IGdzdFBjdCA9IHNldHVwLmNsaWVudEdTVFBjdCB8fCAxOC4wO1xuXG4gIGNvbnN0IHJldGVudGlvbkFtdCA9IGN1cnJlbnRHcm9zcyAqIChyZXRlbnRpb25QY3QgLyAxMDAuMCk7XG4gIGNvbnN0IGdzdEFtdCA9IGN1cnJlbnRHcm9zcyAqIChnc3RQY3QgLyAxMDAuMCk7XG4gIGNvbnN0IG90aGVyRGVkdWN0aW9uID0gbGluZS5vdGhlckRlZHVjdGlvbiB8fCAwLjA7XG5cbiAgY29uc3QgbmV0UkEgPSBNYXRoLm1heCgwLCBjdXJyZW50R3Jvc3MgLSByZXRlbnRpb25BbXQgKyBnc3RBbXQgLSBvdGhlckRlZHVjdGlvbik7XG5cbiAgcmV0dXJuIHtcbiAgICAuLi5saW5lLFxuICAgIHVuaXRzQ291bnQsXG4gICAgcmF0ZVVuaXQ6IHJhdGUsXG4gICAgY29udHJhY3RWYWx1ZTogTWF0aC5yb3VuZChjb250cmFjdFZhbHVlICogMTAwKSAvIDEwMCxcbiAgICBtYXRlcmlhbEVsaWdpYmlsaXR5UGN0OiBNYXRoLnJvdW5kKHN1bU1hdGVyaWFsUGN0ICogMTAwMCkgLyAxMDAwLFxuICAgIG1hdGVyaWFsRWxpZ2libGVBbXQ6IE1hdGgucm91bmQobWF0ZXJpYWxFbGlnaWJsZUFtdCAqIDEwMCkgLyAxMDAsXG4gICAgZXhlY3V0aW9uRWxpZ2liaWxpdHlQY3Q6IE1hdGgucm91bmQoc3VtRXhlY3V0aW9uUGN0ICogMTAwMCkgLyAxMDAwLFxuICAgIGV4ZWN1dGlvbkVsaWdpYmxlQW10OiBNYXRoLnJvdW5kKGV4ZWN1dGlvbkVsaWdpYmxlQW10ICogMTAwKSAvIDEwMCxcbiAgICBoYW5kb3ZlckVsaWdpYmlsaXR5UGN0OiBNYXRoLnJvdW5kKHN1bUhhbmRvdmVyUGN0ICogMTAwMCkgLyAxMDAwLFxuICAgIGhhbmRvdmVyRWxpZ2libGVBbXQ6IE1hdGgucm91bmQoaGFuZG92ZXJFbGlnaWJsZUFtdCAqIDEwMCkgLyAxMDAsXG4gICAgY3VtdWxhdGl2ZUVsaWdpYmxlOiBNYXRoLnJvdW5kKGN1bXVsYXRpdmVFbGlnaWJsZSAqIDEwMCkgLyAxMDAsXG4gICAgb3ZlcmFsbEVsaWdQY3Q6IE1hdGgucm91bmQob3ZlcmFsbEVsaWdQY3QgKiAxMDAwKSAvIDEwMDAsXG4gICAgY3VycmVudEdyb3NzOiBNYXRoLnJvdW5kKGN1cnJlbnRHcm9zcyAqIDEwMCkgLyAxMDAsXG4gICAgcmV0ZW50aW9uQW10OiBNYXRoLnJvdW5kKHJldGVudGlvbkFtdCAqIDEwMCkgLyAxMDAsXG4gICAgZ3N0QW10OiBNYXRoLnJvdW5kKGdzdEFtdCAqIDEwMCkgLyAxMDAsXG4gICAgbmV0UkE6IE1hdGgucm91bmQobmV0UkEgKiAxMDApIC8gMTAwXG4gIH07XG59XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGhwXFxcXERvd25sb2Fkc1xcXFxEaW8gR3JhY2UgKDMpXFxcXERpbyBHcmFjZSAoMylcXFxcRGlvIEdyYWNlZVxcXFxiYWNrZW5kXFxcXHNyY1xcXFxjb250cm9sbGVyc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcaHBcXFxcRG93bmxvYWRzXFxcXERpbyBHcmFjZSAoMylcXFxcRGlvIEdyYWNlICgzKVxcXFxEaW8gR3JhY2VlXFxcXGJhY2tlbmRcXFxcc3JjXFxcXGNvbnRyb2xsZXJzXFxcXGJpbGxpbmdDb250cm9sbGVyLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9ocC9Eb3dubG9hZHMvRGlvJTIwR3JhY2UlMjAoMykvRGlvJTIwR3JhY2UlMjAoMykvRGlvJTIwR3JhY2VlL2JhY2tlbmQvc3JjL2NvbnRyb2xsZXJzL2JpbGxpbmdDb250cm9sbGVyLmpzXCI7aW1wb3J0IHsgUHJpc21hQ2xpZW50IH0gZnJvbSAnQHByaXNtYS9jbGllbnQnO1xuaW1wb3J0IHsgY2FsY3VsYXRlQ29udHJhY3RvckJpbGxMaW5lLCBjYWxjdWxhdGVDbGllbnRSQUJpbGxMaW5lIH0gZnJvbSAnLi4vc2VydmljZXMvYmlsbGluZ1NlcnZpY2UuanMnO1xuXG5jb25zdCBwcmlzbWEgPSBuZXcgUHJpc21hQ2xpZW50KCk7XG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuLy8gMS4gQklMTElORyBTRVRVUCBFTkRQT0lOVFNcbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0QmlsbGluZ1NldHVwKHJlcSwgcmVzKSB7XG4gIGNvbnN0IHsgb3JkZXJJZCB9ID0gcmVxLnBhcmFtcztcbiAgdHJ5IHtcbiAgICBjb25zdCBzZXR1cCA9IGF3YWl0IHByaXNtYS5iaWxsaW5nU2V0dXAuZmluZFVuaXF1ZSh7XG4gICAgICB3aGVyZTogeyBvcmRlcklkIH0sXG4gICAgICBpbmNsdWRlOiB7XG4gICAgICAgIHVuaXRUeXBlUmF0ZXM6IHRydWUsXG4gICAgICAgIGNvbnRyYWN0b3JNaWxlc3RvbmVzOiB0cnVlLFxuICAgICAgICBjbGllbnRSQU1pbGVzdG9uZXM6IHRydWUsXG4gICAgICAgIHRvd2VyQ2xpZW50UmF0ZXM6IHtcbiAgICAgICAgICBpbmNsdWRlOiB7XG4gICAgICAgICAgICBidWlsZGluZzoge1xuICAgICAgICAgICAgICBzZWxlY3Q6IHsgbmFtZTogdHJ1ZSB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBpZiAoIXNldHVwKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oeyBlcnJvcjogJ0JpbGxpbmcgc2V0dXAgbm90IGZvdW5kIGZvciB0aGlzIG9yZGVyJyB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzLmpzb24oc2V0dXApO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oeyBlcnJvcjogJ0ludGVybmFsIHNlcnZlciBlcnJvciBnZXR0aW5nIHNldHVwJyB9KTtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdXBkYXRlQmlsbGluZ1NldHVwKHJlcSwgcmVzKSB7XG4gIGNvbnN0IHsgb3JkZXJJZCB9ID0gcmVxLnBhcmFtcztcbiAgY29uc3Qge1xuICAgIGNvbnRyYWN0b3JSZXRlbnRpb25QY3QsXG4gICAgY29udHJhY3RvckdTVFBjdCxcbiAgICBjb250cmFjdG9yVERTUGN0LFxuICAgIGNsaWVudFJldGVudGlvblBjdCxcbiAgICBjbGllbnRHU1RQY3QsXG4gICAgY2xpZW50T3RoZXJEZWR1Y3Rpb24sXG4gICAgY2xpZW50TWF0RWxpZ2libGVQY3QsXG4gICAgY2xpZW50RXhlY0VsaWdpYmxlUGN0LFxuICAgIGNsaWVudEhhbmRvdmVyRWxpZ2libGVQY3QsXG4gICAgYmlsbGluZ1BlcmlvZEZyb20sXG4gICAgYmlsbGluZ1BlcmlvZFRvLFxuICAgIGJpbGxEYXRlLFxuICAgIHVuaXRUeXBlUmF0ZXMsXG4gICAgY29udHJhY3Rvck1pbGVzdG9uZXMsXG4gICAgY2xpZW50UkFNaWxlc3RvbmVzLFxuICAgIHRvd2VyQ2xpZW50UmF0ZXNcbiAgfSA9IHJlcS5ib2R5O1xuXG4gIHRyeSB7XG4gICAgaWYgKHJlcS51c2VyLnJvbGUgIT09ICdST0xFX0EnKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDMpLmpzb24oeyBlcnJvcjogJ09ubHkgU2V0dXAgcm9sZSAoQSkgY2FuIG1vZGlmeSBzZXR1cCcgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgY3VycmVudFNldHVwID0gYXdhaXQgcHJpc21hLmJpbGxpbmdTZXR1cC5maW5kVW5pcXVlKHtcbiAgICAgIHdoZXJlOiB7IG9yZGVySWQgfVxuICAgIH0pO1xuXG4gICAgaWYgKCFjdXJyZW50U2V0dXApIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwNCkuanNvbih7IGVycm9yOiAnQmlsbGluZyBzZXR1cCBub3QgZm91bmQnIH0pO1xuICAgIH1cblxuICAgIC8vIDEuIFZhbGlkYXRlIE1pbGVzdG9uZSBQZXJjZW50YWdlc1xuICAgIGlmIChjb250cmFjdG9yTWlsZXN0b25lcykge1xuICAgICAgLy8gVmFsaWRhdGUgdGhhdCBjb250cmFjdG9yIG1pbGVzdG9uZXMgc3VtIHRvIDEwMCUgcGVyIHByb2R1Y3RcbiAgICAgIGNvbnN0IHByb2R1Y3RHcm91cHMgPSB7fTtcbiAgICAgIGZvciAoY29uc3QgbSBvZiBjb250cmFjdG9yTWlsZXN0b25lcykge1xuICAgICAgICBwcm9kdWN0R3JvdXBzW20ucHJvZHVjdF0gPSAocHJvZHVjdEdyb3Vwc1ttLnByb2R1Y3RdIHx8IDAuMCkgKyBwYXJzZUZsb2F0KG0ucGVyY2VudGFnZSk7XG4gICAgICB9XG4gICAgICBmb3IgKGNvbnN0IFtwcm9kLCBzdW1dIG9mIE9iamVjdC5lbnRyaWVzKHByb2R1Y3RHcm91cHMpKSB7XG4gICAgICAgIGlmIChNYXRoLmFicyhzdW0gLSAxMDAuMCkgPiAwLjAxKSB7XG4gICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHsgZXJyb3I6IGBDb250cmFjdG9yIE1pbGVzdG9uZXMgZm9yIHByb2R1Y3QgJHtwcm9kfSBtdXN0IHN1bSB0byAxMDAlLiBHb3QgJHtzdW19JWAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBnbG9iYWxNYXQgPSBjbGllbnRNYXRFbGlnaWJsZVBjdCAhPT0gdW5kZWZpbmVkID8gcGFyc2VGbG9hdChjbGllbnRNYXRFbGlnaWJsZVBjdCkgOiAoY3VycmVudFNldHVwLmNsaWVudE1hdEVsaWdpYmxlUGN0IHx8IDAuMCk7XG4gICAgY29uc3QgZ2xvYmFsRXhlYyA9IGNsaWVudEV4ZWNFbGlnaWJsZVBjdCAhPT0gdW5kZWZpbmVkID8gcGFyc2VGbG9hdChjbGllbnRFeGVjRWxpZ2libGVQY3QpIDogKGN1cnJlbnRTZXR1cC5jbGllbnRFeGVjRWxpZ2libGVQY3QgfHwgMC4wKTtcbiAgICBjb25zdCBnbG9iYWxIYW5kb3ZlciA9IGNsaWVudEhhbmRvdmVyRWxpZ2libGVQY3QgIT09IHVuZGVmaW5lZCA/IHBhcnNlRmxvYXQoY2xpZW50SGFuZG92ZXJFbGlnaWJsZVBjdCkgOiAoY3VycmVudFNldHVwLmNsaWVudEhhbmRvdmVyRWxpZ2libGVQY3QgfHwgMC4wKTtcblxuICAgIGNvbnN0IGdsb2JhbFN1bSA9IGdsb2JhbE1hdCArIGdsb2JhbEV4ZWMgKyBnbG9iYWxIYW5kb3ZlcjtcbiAgICBpZiAoTWF0aC5hYnMoZ2xvYmFsU3VtIC0gMTAwLjApID4gMC4wMSkge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHsgZXJyb3I6IGBDbGllbnQgRWxpZ2liaWxpdHkgc2V0dGluZ3MgKE1hdGVyaWFsICsgRXhlY3V0aW9uICsgSGFuZG92ZXIpIG11c3Qgc3VtIHRvIGV4YWN0bHkgMTAwJS4gR290ICR7Z2xvYmFsU3VtfSVgIH0pO1xuICAgIH1cblxuICAgIGlmIChjbGllbnRSQU1pbGVzdG9uZXMpIHtcbiAgICAgIGNvbnN0IHByb2R1Y3RzID0gWydLaXRjaGVuJywgJ1dhcmRyb2JlJywgJ1Zhbml0eSddO1xuICAgICAgZm9yIChjb25zdCBwIG9mIHByb2R1Y3RzKSB7XG4gICAgICAgIGNvbnN0IG1hdFN1bSA9IGNsaWVudFJBTWlsZXN0b25lcy5maWx0ZXIobSA9PiBtLnByb2R1Y3QgPT09IHAgJiYgbS5yZWNvZ25pdGlvblR5cGUgPT09ICdNQVRFUklBTCcpLnJlZHVjZSgoc3VtLCBtKSA9PiBzdW0gKyBwYXJzZUZsb2F0KG0ucGVyY2VudGFnZSB8fCAwKSwgMC4wKTtcbiAgICAgICAgaWYgKE1hdGguYWJzKG1hdFN1bSAtIGdsb2JhbE1hdCkgPiAwLjAxKSB7XG4gICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHsgZXJyb3I6IGBDbGllbnQgTWF0ZXJpYWwgbWlsZXN0b25lcyBmb3IgcHJvZHVjdCAke3B9IG11c3Qgc3VtIHRvIGV4YWN0bHkgJHtnbG9iYWxNYXR9JS4gR290ICR7bWF0U3VtfSVgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZXhlY1N1bSA9IGNsaWVudFJBTWlsZXN0b25lcy5maWx0ZXIobSA9PiBtLnByb2R1Y3QgPT09IHAgJiYgbS5yZWNvZ25pdGlvblR5cGUgPT09ICdFWEVDVVRJT04nKS5yZWR1Y2UoKHN1bSwgbSkgPT4gc3VtICsgcGFyc2VGbG9hdChtLnBlcmNlbnRhZ2UgfHwgMCksIDAuMCk7XG4gICAgICAgIGlmIChNYXRoLmFicyhleGVjU3VtIC0gZ2xvYmFsRXhlYykgPiAwLjAxKSB7XG4gICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHsgZXJyb3I6IGBDbGllbnQgRXhlY3V0aW9uIG1pbGVzdG9uZXMgZm9yIHByb2R1Y3QgJHtwfSBtdXN0IHN1bSB0byBleGFjdGx5ICR7Z2xvYmFsRXhlY30lLiBHb3QgJHtleGVjU3VtfSVgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaGFuZG92ZXJTdW0gPSBjbGllbnRSQU1pbGVzdG9uZXMuZmlsdGVyKG0gPT4gbS5wcm9kdWN0ID09PSBwICYmIG0ucmVjb2duaXRpb25UeXBlID09PSAnSEFORE9WRVInKS5yZWR1Y2UoKHN1bSwgbSkgPT4gc3VtICsgcGFyc2VGbG9hdChtLnBlcmNlbnRhZ2UgfHwgMCksIDAuMCk7XG4gICAgICAgIGlmIChNYXRoLmFicyhoYW5kb3ZlclN1bSAtIGdsb2JhbEhhbmRvdmVyKSA+IDAuMDEpIHtcbiAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oeyBlcnJvcjogYENsaWVudCBIYW5kb3ZlciBtaWxlc3RvbmVzIGZvciBwcm9kdWN0ICR7cH0gbXVzdCBzdW0gdG8gZXhhY3RseSAke2dsb2JhbEhhbmRvdmVyfSUuIEdvdCAke2hhbmRvdmVyU3VtfSVgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgdXBkYXRlZCA9IGF3YWl0IHByaXNtYS4kdHJhbnNhY3Rpb24oYXN5bmMgKHR4KSA9PiB7XG4gICAgICAvLyBVcGRhdGUgYmFzaWMgZmllbGRzXG4gICAgICBjb25zdCBicyA9IGF3YWl0IHR4LmJpbGxpbmdTZXR1cC51cGRhdGUoe1xuICAgICAgICB3aGVyZTogeyBvcmRlcklkIH0sXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICBjb250cmFjdG9yUmV0ZW50aW9uUGN0OiBjb250cmFjdG9yUmV0ZW50aW9uUGN0ICE9PSB1bmRlZmluZWQgPyBwYXJzZUZsb2F0KGNvbnRyYWN0b3JSZXRlbnRpb25QY3QpIDogdW5kZWZpbmVkLFxuICAgICAgICAgIGNvbnRyYWN0b3JHU1RQY3Q6IGNvbnRyYWN0b3JHU1RQY3QgIT09IHVuZGVmaW5lZCA/IHBhcnNlRmxvYXQoY29udHJhY3RvckdTVFBjdCkgOiB1bmRlZmluZWQsXG4gICAgICAgICAgY29udHJhY3RvclREU1BjdDogY29udHJhY3RvclREU1BjdCAhPT0gdW5kZWZpbmVkID8gcGFyc2VGbG9hdChjb250cmFjdG9yVERTUGN0KSA6IHVuZGVmaW5lZCxcbiAgICAgICAgICBjbGllbnRSZXRlbnRpb25QY3Q6IGNsaWVudFJldGVudGlvblBjdCAhPT0gdW5kZWZpbmVkID8gcGFyc2VGbG9hdChjbGllbnRSZXRlbnRpb25QY3QpIDogdW5kZWZpbmVkLFxuICAgICAgICAgIGNsaWVudEdTVFBjdDogY2xpZW50R1NUUGN0ICE9PSB1bmRlZmluZWQgPyBwYXJzZUZsb2F0KGNsaWVudEdTVFBjdCkgOiB1bmRlZmluZWQsXG4gICAgICAgICAgY2xpZW50T3RoZXJEZWR1Y3Rpb246IGNsaWVudE90aGVyRGVkdWN0aW9uICE9PSB1bmRlZmluZWQgPyBwYXJzZUZsb2F0KGNsaWVudE90aGVyRGVkdWN0aW9uKSA6IHVuZGVmaW5lZCxcbiAgICAgICAgICBjbGllbnRNYXRFbGlnaWJsZVBjdDogY2xpZW50TWF0RWxpZ2libGVQY3QgIT09IHVuZGVmaW5lZCA/IHBhcnNlRmxvYXQoY2xpZW50TWF0RWxpZ2libGVQY3QpIDogdW5kZWZpbmVkLFxuICAgICAgICAgIGNsaWVudEV4ZWNFbGlnaWJsZVBjdDogY2xpZW50RXhlY0VsaWdpYmxlUGN0ICE9PSB1bmRlZmluZWQgPyBwYXJzZUZsb2F0KGNsaWVudEV4ZWNFbGlnaWJsZVBjdCkgOiB1bmRlZmluZWQsXG4gICAgICAgICAgY2xpZW50SGFuZG92ZXJFbGlnaWJsZVBjdDogY2xpZW50SGFuZG92ZXJFbGlnaWJsZVBjdCAhPT0gdW5kZWZpbmVkID8gcGFyc2VGbG9hdChjbGllbnRIYW5kb3ZlckVsaWdpYmxlUGN0KSA6IHVuZGVmaW5lZCxcbiAgICAgICAgICBiaWxsaW5nUGVyaW9kRnJvbTogYmlsbGluZ1BlcmlvZEZyb20gPyBuZXcgRGF0ZShiaWxsaW5nUGVyaW9kRnJvbSkgOiBudWxsLFxuICAgICAgICAgIGJpbGxpbmdQZXJpb2RUbzogYmlsbGluZ1BlcmlvZFRvID8gbmV3IERhdGUoYmlsbGluZ1BlcmlvZFRvKSA6IG51bGwsXG4gICAgICAgICAgYmlsbERhdGU6IGJpbGxEYXRlID8gbmV3IERhdGUoYmlsbERhdGUpIDogbnVsbFxuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgLy8gVXBkYXRlIFVuaXRUeXBlUmF0ZXNcbiAgICAgIGlmICh1bml0VHlwZVJhdGVzICYmIEFycmF5LmlzQXJyYXkodW5pdFR5cGVSYXRlcykpIHtcbiAgICAgICAgLy8gZGVsZXRlIGFuZCBpbnNlcnQsIG9yIHVwZGF0ZS4gTGV0J3MgZG8gc2ltcGxlIHJlY3JlYXRlIHNpbmNlIGl0J3Mgc2V0dXBcbiAgICAgICAgYXdhaXQgdHgudW5pdFR5cGVSYXRlLmRlbGV0ZU1hbnkoeyB3aGVyZTogeyBiaWxsaW5nU2V0dXBJZDogYnMuaWQgfSB9KTtcbiAgICAgICAgYXdhaXQgdHgudW5pdFR5cGVSYXRlLmNyZWF0ZU1hbnkoe1xuICAgICAgICAgIGRhdGE6IHVuaXRUeXBlUmF0ZXMubWFwKHV0ID0+ICh7XG4gICAgICAgICAgICBiaWxsaW5nU2V0dXBJZDogYnMuaWQsXG4gICAgICAgICAgICB0eXBlQ29kZTogdXQudHlwZUNvZGUsXG4gICAgICAgICAgICBwcm9kdWN0OiB1dC5wcm9kdWN0LFxuICAgICAgICAgICAgdHlwZU5hbWU6IHV0LnR5cGVOYW1lLFxuICAgICAgICAgICAgY29udHJhY3RvclJhdGU6IHBhcnNlRmxvYXQodXQuY29udHJhY3RvclJhdGUgfHwgMCksXG4gICAgICAgICAgICBjbGllbnRSYXRlOiBwYXJzZUZsb2F0KHV0LmNsaWVudFJhdGUgfHwgMCksXG4gICAgICAgICAgICBpbmNsdWRlSW5DdXJyZW50UkE6IHV0LmluY2x1ZGVJbkN1cnJlbnRSQSA/PyB0cnVlXG4gICAgICAgICAgfSkpXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICAvLyBVcGRhdGUgQ29udHJhY3Rvck1pbGVzdG9uZXNcbiAgICAgIGlmIChjb250cmFjdG9yTWlsZXN0b25lcyAmJiBBcnJheS5pc0FycmF5KGNvbnRyYWN0b3JNaWxlc3RvbmVzKSkge1xuICAgICAgICBhd2FpdCB0eC5jb250cmFjdG9yTWlsZXN0b25lLmRlbGV0ZU1hbnkoeyB3aGVyZTogeyBiaWxsaW5nU2V0dXBJZDogYnMuaWQgfSB9KTtcbiAgICAgICAgYXdhaXQgdHguY29udHJhY3Rvck1pbGVzdG9uZS5jcmVhdGVNYW55KHtcbiAgICAgICAgICBkYXRhOiBjb250cmFjdG9yTWlsZXN0b25lcy5tYXAobSA9PiAoe1xuICAgICAgICAgICAgYmlsbGluZ1NldHVwSWQ6IGJzLmlkLFxuICAgICAgICAgICAgcHJvZHVjdDogbS5wcm9kdWN0LFxuICAgICAgICAgICAgbWlsZXN0b25lTmFtZTogbS5taWxlc3RvbmVOYW1lLFxuICAgICAgICAgICAgcGVyY2VudGFnZTogcGFyc2VGbG9hdChtLnBlcmNlbnRhZ2UgfHwgMClcbiAgICAgICAgICB9KSlcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIFVwZGF0ZSBDbGllbnRSQU1pbGVzdG9uZXNcbiAgICAgIGlmIChjbGllbnRSQU1pbGVzdG9uZXMgJiYgQXJyYXkuaXNBcnJheShjbGllbnRSQU1pbGVzdG9uZXMpKSB7XG4gICAgICAgIGF3YWl0IHR4LmNsaWVudFJBTWlsZXN0b25lLmRlbGV0ZU1hbnkoeyB3aGVyZTogeyBiaWxsaW5nU2V0dXBJZDogYnMuaWQgfSB9KTtcbiAgICAgICAgYXdhaXQgdHguY2xpZW50UkFNaWxlc3RvbmUuY3JlYXRlTWFueSh7XG4gICAgICAgICAgZGF0YTogY2xpZW50UkFNaWxlc3RvbmVzLm1hcChtID0+ICh7XG4gICAgICAgICAgICBiaWxsaW5nU2V0dXBJZDogYnMuaWQsXG4gICAgICAgICAgICBwcm9kdWN0OiBtLnByb2R1Y3QsXG4gICAgICAgICAgICByZWNvZ25pdGlvblR5cGU6IG0ucmVjb2duaXRpb25UeXBlLFxuICAgICAgICAgICAgbWlsZXN0b25lTmFtZTogbS5taWxlc3RvbmVOYW1lLFxuICAgICAgICAgICAgZmllbGRLZXk6IG0uZmllbGRLZXksXG4gICAgICAgICAgICBwZXJjZW50YWdlOiBwYXJzZUZsb2F0KG0ucGVyY2VudGFnZSB8fCAwKVxuICAgICAgICAgIH0pKVxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgLy8gVXBkYXRlIFRvd2VyLXdpc2UgQ2xpZW50IENvbnRyYWN0IFJhdGVzXG4gICAgICBpZiAodG93ZXJDbGllbnRSYXRlcyAmJiBBcnJheS5pc0FycmF5KHRvd2VyQ2xpZW50UmF0ZXMpKSB7XG4gICAgICAgIGF3YWl0IHR4LnRvd2VyQ2xpZW50UmF0ZS5kZWxldGVNYW55KHsgd2hlcmU6IHsgYmlsbGluZ1NldHVwSWQ6IGJzLmlkIH0gfSk7XG4gICAgICAgIGF3YWl0IHR4LnRvd2VyQ2xpZW50UmF0ZS5jcmVhdGVNYW55KHtcbiAgICAgICAgICBkYXRhOiB0b3dlckNsaWVudFJhdGVzLm1hcCh0ciA9PiAoe1xuICAgICAgICAgICAgYmlsbGluZ1NldHVwSWQ6IGJzLmlkLFxuICAgICAgICAgICAgYnVpbGRpbmdJZDogdHIuYnVpbGRpbmdJZCxcbiAgICAgICAgICAgIGtpdGNoZW5SYXRlOiBwYXJzZUZsb2F0KHRyLmtpdGNoZW5SYXRlIHx8IDApLFxuICAgICAgICAgICAgd2FyZHJvYmVSYXRlOiBwYXJzZUZsb2F0KHRyLndhcmRyb2JlUmF0ZSB8fCAwKSxcbiAgICAgICAgICAgIHZhbml0eVJhdGU6IHBhcnNlRmxvYXQodHIudmFuaXR5UmF0ZSB8fCAwKVxuICAgICAgICAgIH0pKVxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGJzO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJlcy5qc29uKHsgc3VjY2VzczogdHJ1ZSwgc2V0dXA6IHVwZGF0ZWQgfSk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ1VwZGF0ZSBzZXR1cCBlcnJvcjonLCBlcnIpO1xuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7IGVycm9yOiAnSW50ZXJuYWwgc2VydmVyIGVycm9yIHVwZGF0aW5nIGJpbGxpbmcgc2V0dXAnIH0pO1xuICB9XG59XG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuLy8gMi4gQ09OVFJBQ1RPUiBSVU5OSU5HIEJJTExcbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0Q29udHJhY3RvckJpbGwocmVxLCByZXMpIHtcbiAgY29uc3QgeyBvcmRlcklkIH0gPSByZXEucGFyYW1zO1xuICB0cnkge1xuICAgIGNvbnN0IHNldHVwID0gYXdhaXQgcHJpc21hLmJpbGxpbmdTZXR1cC5maW5kVW5pcXVlKHtcbiAgICAgIHdoZXJlOiB7IG9yZGVySWQgfSxcbiAgICAgIGluY2x1ZGU6IHsgdW5pdFR5cGVSYXRlczogdHJ1ZSB9XG4gICAgfSk7XG5cbiAgICBpZiAoIXNldHVwKSByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oeyBlcnJvcjogJ0JpbGxpbmcgc2V0dXAgbm90IGZvdW5kJyB9KTtcblxuICAgIC8vIDEuIEZldGNoIGFsbCBhcGFydG1lbnRzIGluIHRoaXMgT3JkZXIgdG8gZXh0cmFjdCB1bmlxdWUgQ29udHJhY3RvcnMgYW5kIFVuaXQgVHlwZXNcbiAgICBjb25zdCBhcGFydG1lbnRzID0gYXdhaXQgcHJpc21hLmFwYXJ0bWVudC5maW5kTWFueSh7XG4gICAgICB3aGVyZToge1xuICAgICAgICBidWlsZGluZzogeyBvcmRlcklkIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIEV4dHJhY3QgdW5pcXVlIGNvbnRyYWN0b3JzXG4gICAgY29uc3QgY29udHJhY3RvcnMgPSBbLi4ubmV3IFNldChhcGFydG1lbnRzLm1hcChhID0+IGEuY29udHJhY3Rvck5hbWUpLmZpbHRlcihCb29sZWFuKSldO1xuXG4gICAgLy8gMi4gRmV0Y2ggZXhpc3RpbmcgY29udHJhY3RvciBiaWxsIGxlZGdlciByb3dzIGZyb20gREJcbiAgICBjb25zdCBzYXZlZExpbmVzID0gYXdhaXQgcHJpc21hLmNvbnRyYWN0b3JCaWxsTGluZS5maW5kTWFueSh7XG4gICAgICB3aGVyZTogeyBvcmRlcklkIH0sXG4gICAgICBpbmNsdWRlOiB7IHVuaXRUeXBlOiB0cnVlIH1cbiAgICB9KTtcblxuICAgIC8vIDMuIEZvciBlYWNoIHVuaXF1ZSBDb250cmFjdG9yIFx1MDBENyBVbml0IFR5cGUsIGNvbnN0cnVjdCB0aGUgbGVkZ2VyIHJvd1xuICAgIGNvbnN0IGxpbmVzID0gW107XG4gICAgZm9yIChjb25zdCBjb250cmFjdG9yTmFtZSBvZiBjb250cmFjdG9ycykge1xuICAgICAgZm9yIChjb25zdCB1dCBvZiBzZXR1cC51bml0VHlwZVJhdGVzKSB7XG4gICAgICAgIC8vIEZpbmQgZXhpc3Rpbmcgc2F2ZWQgcmVjb3JkIGluIERCLCBpZiBhbnlcbiAgICAgICAgbGV0IHNhdmVkTGluZSA9IHNhdmVkTGluZXMuZmluZChsID0+IFxuICAgICAgICAgIGwuY29udHJhY3Rvck5hbWUudG9Mb3dlckNhc2UoKSA9PT0gY29udHJhY3Rvck5hbWUudG9Mb3dlckNhc2UoKSAmJiBcbiAgICAgICAgICBsLnVuaXRUeXBlSWQgPT09IHV0LmlkXG4gICAgICAgICk7XG5cbiAgICAgICAgaWYgKCFzYXZlZExpbmUpIHtcbiAgICAgICAgICBzYXZlZExpbmUgPSB7XG4gICAgICAgICAgICBpZDogYHRlbXBfJHtjb250cmFjdG9yTmFtZX1fJHt1dC5pZH1gLFxuICAgICAgICAgICAgb3JkZXJJZCxcbiAgICAgICAgICAgIGNvbnRyYWN0b3JOYW1lLFxuICAgICAgICAgICAgdW5pdFR5cGVJZDogdXQuaWQsXG4gICAgICAgICAgICB1bml0VHlwZTogdXQsXG4gICAgICAgICAgICBlbGlnaWJsZVVuaXRFcXVpdmFsZW50OiBudWxsLFxuICAgICAgICAgICAgcHJldmlvdXNDZXJ0aWZpZWQ6IG51bGwsXG4gICAgICAgICAgICBvdGhlckRlZHVjdGlvbjogbnVsbCxcbiAgICAgICAgICAgIGJpbGxObzogJycsXG4gICAgICAgICAgICBiaWxsRGF0ZTogbnVsbCxcbiAgICAgICAgICAgIHJlbWFya3M6ICcnXG4gICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzYXZlZExpbmUudW5pdFR5cGUgPSB1dDsgLy8gYXR0YWNoIGZ1bGx5IGxvYWRlZCB1bml0IHR5cGUgcmF0ZXNcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENhbGN1bGF0ZSBhdXRvLWZpZWxkc1xuICAgICAgICBjb25zdCBjYWxjdWxhdGVkID0gY2FsY3VsYXRlQ29udHJhY3RvckJpbGxMaW5lKHNhdmVkTGluZSwgYXBhcnRtZW50cywgc2V0dXApO1xuICAgICAgICBpZiAoY2FsY3VsYXRlZC5hbGxvY2F0ZWRVbml0cyA+IDApIHtcbiAgICAgICAgICBsaW5lcy5wdXNoKGNhbGN1bGF0ZWQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlcy5qc29uKHsgc2V0dXAsIGxpbmVzIH0pO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKCdHZXQgY29udHJhY3RvciBiaWxsIGVycm9yOicsIGVycik7XG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgZXJyb3I6ICdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3InIH0pO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB1cHNlcnRDb250cmFjdG9yQmlsbExpbmVzKHJlcSwgcmVzKSB7XG4gIGNvbnN0IHsgb3JkZXJJZCB9ID0gcmVxLnBhcmFtcztcbiAgY29uc3QgeyBsaW5lcyB9ID0gcmVxLmJvZHk7IC8vIGFycmF5IG9mIGxpbmVzIHRvIHNhdmVcblxuICB0cnkge1xuICAgIGlmIChyZXEudXNlci5yb2xlICE9PSAnUk9MRV9BJyAmJiByZXEudXNlci5yb2xlICE9PSAnUk9MRV9CJykge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAzKS5qc29uKHsgZXJyb3I6ICdPbmx5IEV4ZWN1dGlvbiByb2xlIChCKSBvciBBZG1pbiAoQSkgY2FuIGVudGVyIGJpbGwgbGluZSBpdGVtcycgfSk7XG4gICAgfVxuXG4gICAgaWYgKCFsaW5lcyB8fCAhQXJyYXkuaXNBcnJheShsaW5lcykpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7IGVycm9yOiAnTGluZXMgYXJyYXkgaXMgcmVxdWlyZWQnIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IHNhdmVkID0gW107XG4gICAgZm9yIChjb25zdCBsaW5lIG9mIGxpbmVzKSB7XG4gICAgICAvLyBJZiBpdCdzIGEgdGVtcG9yYXJ5IGNsaWVudC1nZW5lcmF0ZWQgaWQgKHN0YXJ0cyB3aXRoIHRlbXBfKSwgY3JlYXRlIGl0XG4gICAgICAvLyBPdGhlcndpc2UsIHVwZGF0ZSBieSBpZC5cbiAgICAgIGNvbnN0IGRhdGEgPSB7XG4gICAgICAgIG9yZGVySWQsXG4gICAgICAgIGNvbnRyYWN0b3JOYW1lOiBsaW5lLmNvbnRyYWN0b3JOYW1lLFxuICAgICAgICB1bml0VHlwZUlkOiBsaW5lLnVuaXRUeXBlSWQsXG4gICAgICAgIGVsaWdpYmxlVW5pdEVxdWl2YWxlbnQ6IHBhcnNlRmxvYXQobGluZS5lbGlnaWJsZVVuaXRFcXVpdmFsZW50IHx8IDApLFxuICAgICAgICBwcmV2aW91c0NlcnRpZmllZDogcGFyc2VGbG9hdChsaW5lLnByZXZpb3VzQ2VydGlmaWVkIHx8IDApLFxuICAgICAgICBvdGhlckRlZHVjdGlvbjogcGFyc2VGbG9hdChsaW5lLm90aGVyRGVkdWN0aW9uIHx8IDApLFxuICAgICAgICBiaWxsTm86IGxpbmUuYmlsbE5vIHx8ICcnLFxuICAgICAgICBiaWxsRGF0ZTogbGluZS5iaWxsRGF0ZSA/IG5ldyBEYXRlKGxpbmUuYmlsbERhdGUpIDogbnVsbCxcbiAgICAgICAgcmVtYXJrczogbGluZS5yZW1hcmtzIHx8ICcnXG4gICAgICB9O1xuXG4gICAgICBpZiAobGluZS5pZCAmJiAhbGluZS5pZC5zdGFydHNXaXRoKCd0ZW1wXycpKSB7XG4gICAgICAgIGNvbnN0IGl0ZW0gPSBhd2FpdCBwcmlzbWEuY29udHJhY3RvckJpbGxMaW5lLnVwZGF0ZSh7XG4gICAgICAgICAgd2hlcmU6IHsgaWQ6IGxpbmUuaWQgfSxcbiAgICAgICAgICBkYXRhXG4gICAgICAgIH0pO1xuICAgICAgICBzYXZlZC5wdXNoKGl0ZW0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gQ2hlY2sgaWYgdGhlcmUgaXMgYW4gZXhpc3RpbmcgbGluZSBpbiBEQiBhbHJlYWR5XG4gICAgICAgIGNvbnN0IGV4aXN0aW5nID0gYXdhaXQgcHJpc21hLmNvbnRyYWN0b3JCaWxsTGluZS5maW5kRmlyc3Qoe1xuICAgICAgICAgIHdoZXJlOiB7XG4gICAgICAgICAgICBvcmRlcklkLFxuICAgICAgICAgICAgY29udHJhY3Rvck5hbWU6IGxpbmUuY29udHJhY3Rvck5hbWUsXG4gICAgICAgICAgICB1bml0VHlwZUlkOiBsaW5lLnVuaXRUeXBlSWRcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChleGlzdGluZykge1xuICAgICAgICAgIGNvbnN0IGl0ZW0gPSBhd2FpdCBwcmlzbWEuY29udHJhY3RvckJpbGxMaW5lLnVwZGF0ZSh7XG4gICAgICAgICAgICB3aGVyZTogeyBpZDogZXhpc3RpbmcuaWQgfSxcbiAgICAgICAgICAgIGRhdGFcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBzYXZlZC5wdXNoKGl0ZW0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN0IGl0ZW0gPSBhd2FpdCBwcmlzbWEuY29udHJhY3RvckJpbGxMaW5lLmNyZWF0ZSh7XG4gICAgICAgICAgICBkYXRhXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgc2F2ZWQucHVzaChpdGVtKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByZXMuanNvbih7IHN1Y2Nlc3M6IHRydWUsIGNvdW50OiBzYXZlZC5sZW5ndGggfSk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ1Vwc2VydCBjb250cmFjdG9yIGxpbmVzIGVycm9yOicsIGVycik7XG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgZXJyb3I6ICdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3Igc2F2aW5nIGNvbnRyYWN0b3IgYmlsbHMnIH0pO1xuICB9XG59XG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuLy8gMy4gQ0xJRU5UIFJBIEJJTExcbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0Q2xpZW50UkFCaWxsKHJlcSwgcmVzKSB7XG4gIGNvbnN0IHsgb3JkZXJJZCB9ID0gcmVxLnBhcmFtcztcbiAgdHJ5IHtcbiAgICBjb25zdCBzZXR1cCA9IGF3YWl0IHByaXNtYS5iaWxsaW5nU2V0dXAuZmluZFVuaXF1ZSh7XG4gICAgICB3aGVyZTogeyBvcmRlcklkIH0sXG4gICAgICBpbmNsdWRlOiB7IFxuICAgICAgICB1bml0VHlwZVJhdGVzOiB0cnVlLFxuICAgICAgICBjbGllbnRSQU1pbGVzdG9uZXM6IHRydWVcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGlmICghc2V0dXApIHJldHVybiByZXMuc3RhdHVzKDQwNCkuanNvbih7IGVycm9yOiAnQmlsbGluZyBzZXR1cCBub3QgZm91bmQnIH0pO1xuXG4gICAgLy8gRmV0Y2ggYnVpbGRpbmdzIChUb3dlcnMpIGFuZCBhcGFydG1lbnRzIGluIHRoaXMgb3JkZXJcbiAgICBjb25zdCBidWlsZGluZ3MgPSBhd2FpdCBwcmlzbWEuYnVpbGRpbmcuZmluZE1hbnkoe1xuICAgICAgd2hlcmU6IHsgb3JkZXJJZCB9XG4gICAgfSk7XG5cbiAgICBjb25zdCBhcGFydG1lbnRzID0gYXdhaXQgcHJpc21hLmFwYXJ0bWVudC5maW5kTWFueSh7XG4gICAgICB3aGVyZToge1xuICAgICAgICBidWlsZGluZzogeyBvcmRlcklkIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIEZldGNoIG92ZXJyaWRlc1xuICAgIGNvbnN0IG92ZXJyaWRlcyA9IGF3YWl0IHByaXNtYS50b3dlckNsaWVudFJhdGUuZmluZE1hbnkoe1xuICAgICAgd2hlcmU6IHsgYmlsbGluZ1NldHVwSWQ6IHNldHVwLmlkIH1cbiAgICB9KTtcblxuICAgIC8vIEZldGNoIHNhdmVkIGNsaWVudCBSQSBiaWxsIGxpbmVzXG4gICAgY29uc3Qgc2F2ZWRMaW5lcyA9IGF3YWl0IHByaXNtYS5jbGllbnRSQUJpbGxMaW5lLmZpbmRNYW55KHtcbiAgICAgIHdoZXJlOiB7IG9yZGVySWQgfSxcbiAgICAgIGluY2x1ZGU6IHsgdW5pdFR5cGU6IHRydWUgfVxuICAgIH0pO1xuXG4gICAgLy8gR2VuZXJhdGUgcHJlLXNlZWRlZCBsaW5lcyBwZXIgVG93ZXIgXHUwMEQ3IFVuaXQgVHlwZVxuICAgIGNvbnN0IGxpbmVzID0gW107XG4gICAgZm9yIChjb25zdCBidWlsZGluZyBvZiBidWlsZGluZ3MpIHtcbiAgICAgIGZvciAoY29uc3QgdXQgb2Ygc2V0dXAudW5pdFR5cGVSYXRlcykge1xuICAgICAgICBsZXQgc2F2ZWRMaW5lID0gc2F2ZWRMaW5lcy5maW5kKGwgPT4gXG4gICAgICAgICAgbC5idWlsZGluZ0lkID09PSBidWlsZGluZy5pZCAmJiBsLnVuaXRUeXBlSWQgPT09IHV0LmlkXG4gICAgICAgICk7XG5cbiAgICAgICAgaWYgKCFzYXZlZExpbmUpIHtcbiAgICAgICAgICBzYXZlZExpbmUgPSB7XG4gICAgICAgICAgICBpZDogYHRlbXBfJHtidWlsZGluZy5pZH1fJHt1dC5pZH1gLFxuICAgICAgICAgICAgb3JkZXJJZCxcbiAgICAgICAgICAgIGJ1aWxkaW5nSWQ6IGJ1aWxkaW5nLmlkLFxuICAgICAgICAgICAgYnVpbGRpbmdOYW1lOiBidWlsZGluZy5uYW1lLFxuICAgICAgICAgICAgdW5pdFR5cGVJZDogdXQuaWQsXG4gICAgICAgICAgICB1bml0VHlwZTogdXQsXG4gICAgICAgICAgICBpbmNsdWRlSW5DdXJyZW50UkE6IHV0LmluY2x1ZGVJbkN1cnJlbnRSQSxcbiAgICAgICAgICAgIHByZXZpb3VzQ2VydGlmaWVkOiBudWxsLFxuICAgICAgICAgICAgb3RoZXJEZWR1Y3Rpb246IG51bGwsXG4gICAgICAgICAgICByYUJpbGxObzogJycsXG4gICAgICAgICAgICByYUJpbGxEYXRlOiBudWxsLFxuICAgICAgICAgICAgcmVtYXJrczogJydcbiAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNhdmVkTGluZS51bml0VHlwZSA9IHV0O1xuICAgICAgICAgIHNhdmVkTGluZS5idWlsZGluZ05hbWUgPSBidWlsZGluZy5uYW1lO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2FsY3VsYXRlIGVsaWdpYmlsaXR5IHBhcmFtZXRlcnMgdXNpbmcgYnVpbGRpbmcgc3RhdHVzIGFuZCBtaWxlc3RvbmVzXG4gICAgICAgIGNvbnN0IGNhbGN1bGF0ZWQgPSBjYWxjdWxhdGVDbGllbnRSQUJpbGxMaW5lKHNhdmVkTGluZSwgYXBhcnRtZW50cywgc2V0dXAsIG92ZXJyaWRlcyk7XG4gICAgICAgIC8vIE9ubHkgaW5jbHVkZSByb3dzIHdoZXJlIHdlIGFjdHVhbGx5IGhhdmUgYWxsb2NhdGVkIHVuaXRzIG9mIHRoaXMgdHlwZSBpbiB0aGlzIHRvd2VyXG4gICAgICAgIGlmIChjYWxjdWxhdGVkLnVuaXRzQ291bnQgPiAwKSB7XG4gICAgICAgICAgbGluZXMucHVzaChjYWxjdWxhdGVkKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByZXMuanNvbih7IHNldHVwLCBsaW5lcyB9KTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgY29uc29sZS5lcnJvcignR2V0IGNsaWVudCBSQSBiaWxsIGVycm9yOicsIGVycik7XG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgZXJyb3I6ICdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3InIH0pO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB1cHNlcnRDbGllbnRSQUJpbGxMaW5lcyhyZXEsIHJlcykge1xuICBjb25zdCB7IG9yZGVySWQgfSA9IHJlcS5wYXJhbXM7XG4gIGNvbnN0IHsgbGluZXMgfSA9IHJlcS5ib2R5OyAvLyBhcnJheSBvZiBsaW5lcyB0byBzYXZlXG5cbiAgdHJ5IHtcbiAgICBpZiAocmVxLnVzZXIucm9sZSAhPT0gJ1JPTEVfQScgJiYgcmVxLnVzZXIucm9sZSAhPT0gJ1JPTEVfQicpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMykuanNvbih7IGVycm9yOiAnT25seSBFeGVjdXRpb24gcm9sZSAoQikgb3IgQWRtaW4gKEEpIGNhbiBlbnRlciBiaWxsIGxpbmUgaXRlbXMnIH0pO1xuICAgIH1cblxuICAgIGlmICghbGluZXMgfHwgIUFycmF5LmlzQXJyYXkobGluZXMpKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oeyBlcnJvcjogJ0xpbmVzIGFycmF5IGlzIHJlcXVpcmVkJyB9KTtcbiAgICB9XG5cbiAgICBjb25zdCBzYXZlZCA9IFtdO1xuICAgIGZvciAoY29uc3QgbGluZSBvZiBsaW5lcykge1xuICAgICAgY29uc3QgZGF0YSA9IHtcbiAgICAgICAgb3JkZXJJZCxcbiAgICAgICAgYnVpbGRpbmdJZDogbGluZS5idWlsZGluZ0lkLFxuICAgICAgICB1bml0VHlwZUlkOiBsaW5lLnVuaXRUeXBlSWQsXG4gICAgICAgIGluY2x1ZGVJbkN1cnJlbnRSQTogbGluZS5pbmNsdWRlSW5DdXJyZW50UkEgPz8gdHJ1ZSxcbiAgICAgICAgcHJldmlvdXNDZXJ0aWZpZWQ6IHBhcnNlRmxvYXQobGluZS5wcmV2aW91c0NlcnRpZmllZCB8fCAwKSxcbiAgICAgICAgb3RoZXJEZWR1Y3Rpb246IHBhcnNlRmxvYXQobGluZS5vdGhlckRlZHVjdGlvbiB8fCAwKSxcbiAgICAgICAgcmFCaWxsTm86IGxpbmUucmFCaWxsTm8gfHwgJycsXG4gICAgICAgIHJhQmlsbERhdGU6IGxpbmUucmFCaWxsRGF0ZSA/IG5ldyBEYXRlKGxpbmUucmFCaWxsRGF0ZSkgOiBudWxsLFxuICAgICAgICByZW1hcmtzOiBsaW5lLnJlbWFya3MgfHwgJydcbiAgICAgIH07XG5cbiAgICAgIGlmIChsaW5lLmlkICYmICFsaW5lLmlkLnN0YXJ0c1dpdGgoJ3RlbXBfJykpIHtcbiAgICAgICAgY29uc3QgaXRlbSA9IGF3YWl0IHByaXNtYS5jbGllbnRSQUJpbGxMaW5lLnVwZGF0ZSh7XG4gICAgICAgICAgd2hlcmU6IHsgaWQ6IGxpbmUuaWQgfSxcbiAgICAgICAgICBkYXRhXG4gICAgICAgIH0pO1xuICAgICAgICBzYXZlZC5wdXNoKGl0ZW0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gVW5pcXVlIGNvbnN0cmFpbnQgY2hlY2tcbiAgICAgICAgY29uc3QgZXhpc3RpbmcgPSBhd2FpdCBwcmlzbWEuY2xpZW50UkFCaWxsTGluZS5maW5kRmlyc3Qoe1xuICAgICAgICAgIHdoZXJlOiB7XG4gICAgICAgICAgICBvcmRlcklkLFxuICAgICAgICAgICAgYnVpbGRpbmdJZDogbGluZS5idWlsZGluZ0lkLFxuICAgICAgICAgICAgdW5pdFR5cGVJZDogbGluZS51bml0VHlwZUlkXG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoZXhpc3RpbmcpIHtcbiAgICAgICAgICBjb25zdCBpdGVtID0gYXdhaXQgcHJpc21hLmNsaWVudFJBQmlsbExpbmUudXBkYXRlKHtcbiAgICAgICAgICAgIHdoZXJlOiB7IGlkOiBleGlzdGluZy5pZCB9LFxuICAgICAgICAgICAgZGF0YVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHNhdmVkLnB1c2goaXRlbSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc3QgaXRlbSA9IGF3YWl0IHByaXNtYS5jbGllbnRSQUJpbGxMaW5lLmNyZWF0ZSh7XG4gICAgICAgICAgICBkYXRhXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgc2F2ZWQucHVzaChpdGVtKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByZXMuanNvbih7IHN1Y2Nlc3M6IHRydWUsIGNvdW50OiBzYXZlZC5sZW5ndGggfSk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ1Vwc2VydCBjbGllbnQgbGluZXMgZXJyb3I6JywgZXJyKTtcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oeyBlcnJvcjogJ0ludGVybmFsIHNlcnZlciBlcnJvciBzYXZpbmcgY2xpZW50IFJBIGJpbGxzJyB9KTtcbiAgfVxufVxuXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbi8vIDQuIEJJTExJTkcgREFTSEJPQVJEXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEJpbGxpbmdEYXNoYm9hcmQocmVxLCByZXMpIHtcbiAgY29uc3QgeyBvcmRlcklkIH0gPSByZXEucGFyYW1zO1xuICB0cnkge1xuICAgIGNvbnN0IHNldHVwID0gYXdhaXQgcHJpc21hLmJpbGxpbmdTZXR1cC5maW5kVW5pcXVlKHtcbiAgICAgIHdoZXJlOiB7IG9yZGVySWQgfSxcbiAgICAgIGluY2x1ZGU6IHsgXG4gICAgICAgIHVuaXRUeXBlUmF0ZXM6IHRydWUsXG4gICAgICAgIGNsaWVudFJBTWlsZXN0b25lczogdHJ1ZVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgaWYgKCFzZXR1cCkgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgZXJyb3I6ICdCaWxsaW5nIHNldHVwIG5vdCBmb3VuZCcgfSk7XG5cbiAgICAvLyBGZXRjaCBhcGFydG1lbnRzXG4gICAgY29uc3QgYXBhcnRtZW50cyA9IGF3YWl0IHByaXNtYS5hcGFydG1lbnQuZmluZE1hbnkoe1xuICAgICAgd2hlcmU6IHsgYnVpbGRpbmc6IHsgb3JkZXJJZCB9IH1cbiAgICB9KTtcblxuICAgIC8vIEZldGNoIG92ZXJyaWRlc1xuICAgIGNvbnN0IG92ZXJyaWRlcyA9IGF3YWl0IHByaXNtYS50b3dlckNsaWVudFJhdGUuZmluZE1hbnkoe1xuICAgICAgd2hlcmU6IHsgYmlsbGluZ1NldHVwSWQ6IHNldHVwLmlkIH1cbiAgICB9KTtcblxuICAgIC8vIDEuIEdldCBhbGwgY2FsY3VsYXRlZCBDb250cmFjdG9yIGxpbmVzXG4gICAgY29uc3Qgc2F2ZWRDb250cmFjdG9yTGluZXMgPSBhd2FpdCBwcmlzbWEuY29udHJhY3RvckJpbGxMaW5lLmZpbmRNYW55KHtcbiAgICAgIHdoZXJlOiB7IG9yZGVySWQgfSxcbiAgICAgIGluY2x1ZGU6IHsgdW5pdFR5cGU6IHRydWUgfVxuICAgIH0pO1xuICAgIGNvbnN0IGNvbnRyYWN0b3JzID0gWy4uLm5ldyBTZXQoYXBhcnRtZW50cy5tYXAoYSA9PiBhLmNvbnRyYWN0b3IpLmZpbHRlcihCb29sZWFuKSldO1xuICAgIGNvbnN0IGNvbnRyYWN0b3JCaWxsTGluZXMgPSBbXTtcbiAgICBmb3IgKGNvbnN0IGNOYW1lIG9mIGNvbnRyYWN0b3JzKSB7XG4gICAgICBmb3IgKGNvbnN0IHV0IG9mIHNldHVwLnVuaXRUeXBlUmF0ZXMpIHtcbiAgICAgICAgbGV0IGxpbmUgPSBzYXZlZENvbnRyYWN0b3JMaW5lcy5maW5kKGwgPT4gXG4gICAgICAgICAgbC5jb250cmFjdG9yTmFtZS50b0xvd2VyQ2FzZSgpID09PSBjTmFtZS50b0xvd2VyQ2FzZSgpICYmIGwudW5pdFR5cGVJZCA9PT0gdXQuaWRcbiAgICAgICAgKTtcbiAgICAgICAgaWYgKCFsaW5lKSB7XG4gICAgICAgICAgbGluZSA9IHtcbiAgICAgICAgICAgIGNvbnRyYWN0b3JOYW1lOiBjTmFtZSxcbiAgICAgICAgICAgIHVuaXRUeXBlSWQ6IHV0LmlkLFxuICAgICAgICAgICAgdW5pdFR5cGU6IHV0LFxuICAgICAgICAgICAgZWxpZ2libGVVbml0RXF1aXZhbGVudDogbnVsbCxcbiAgICAgICAgICAgIHByZXZpb3VzQ2VydGlmaWVkOiBudWxsLFxuICAgICAgICAgICAgb3RoZXJEZWR1Y3Rpb246IG51bGxcbiAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxpbmUudW5pdFR5cGUgPSB1dDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjYWxjID0gY2FsY3VsYXRlQ29udHJhY3RvckJpbGxMaW5lKGxpbmUsIGFwYXJ0bWVudHMsIHNldHVwKTtcbiAgICAgICAgaWYgKGNhbGMuYWxsb2NhdGVkVW5pdHMgPiAwKSB7XG4gICAgICAgICAgY29udHJhY3RvckJpbGxMaW5lcy5wdXNoKGNhbGMpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gMi4gR2V0IGFsbCBjYWxjdWxhdGVkIENsaWVudCBSQSBsaW5lc1xuICAgIGNvbnN0IGJ1aWxkaW5ncyA9IGF3YWl0IHByaXNtYS5idWlsZGluZy5maW5kTWFueSh7IHdoZXJlOiB7IG9yZGVySWQgfSB9KTtcbiAgICBjb25zdCBzYXZlZENsaWVudExpbmVzID0gYXdhaXQgcHJpc21hLmNsaWVudFJBQmlsbExpbmUuZmluZE1hbnkoe1xuICAgICAgd2hlcmU6IHsgb3JkZXJJZCB9LFxuICAgICAgaW5jbHVkZTogeyB1bml0VHlwZTogdHJ1ZSB9XG4gICAgfSk7XG4gICAgY29uc3QgY2xpZW50UkFCaWxsTGluZXMgPSBbXTtcbiAgICBmb3IgKGNvbnN0IGJ1aWxkaW5nIG9mIGJ1aWxkaW5ncykge1xuICAgICAgZm9yIChjb25zdCB1dCBvZiBzZXR1cC51bml0VHlwZVJhdGVzKSB7XG4gICAgICAgIGxldCBsaW5lID0gc2F2ZWRDbGllbnRMaW5lcy5maW5kKGwgPT4gXG4gICAgICAgICAgbC5idWlsZGluZ0lkID09PSBidWlsZGluZy5pZCAmJiBsLnVuaXRUeXBlSWQgPT09IHV0LmlkXG4gICAgICAgICk7XG4gICAgICAgIGlmICghbGluZSkge1xuICAgICAgICAgIGxpbmUgPSB7XG4gICAgICAgICAgICBidWlsZGluZ0lkOiBidWlsZGluZy5pZCxcbiAgICAgICAgICAgIGJ1aWxkaW5nTmFtZTogYnVpbGRpbmcubmFtZSxcbiAgICAgICAgICAgIHVuaXRUeXBlSWQ6IHV0LmlkLFxuICAgICAgICAgICAgdW5pdFR5cGU6IHV0LFxuICAgICAgICAgICAgaW5jbHVkZUluQ3VycmVudFJBOiB1dC5pbmNsdWRlSW5DdXJyZW50UkEsXG4gICAgICAgICAgICBwcmV2aW91c0NlcnRpZmllZDogbnVsbCxcbiAgICAgICAgICAgIG90aGVyRGVkdWN0aW9uOiBudWxsXG4gICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsaW5lLnVuaXRUeXBlID0gdXQ7XG4gICAgICAgICAgbGluZS5idWlsZGluZ05hbWUgPSBidWlsZGluZy5uYW1lO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNhbGMgPSBjYWxjdWxhdGVDbGllbnRSQUJpbGxMaW5lKGxpbmUsIGFwYXJ0bWVudHMsIHNldHVwLCBvdmVycmlkZXMpO1xuICAgICAgICBpZiAoY2FsYy51bml0c0NvdW50ID4gMCkge1xuICAgICAgICAgIGNsaWVudFJBQmlsbExpbmVzLnB1c2goY2FsYyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBLUEkgUm9sbHVwc1xuICAgIGNvbnN0IGNvbnRyYWN0b3JXT1ZhbHVlID0gY29udHJhY3RvckJpbGxMaW5lcy5yZWR1Y2UoKHN1bSwgbCkgPT4gc3VtICsgKGwud29WYWx1ZSB8fCAwKSwgMCk7XG4gICAgY29uc3QgY29udHJhY3RvckN1bXVsYXRpdmVFbGlnaWJsZSA9IGNvbnRyYWN0b3JCaWxsTGluZXMucmVkdWNlKChzdW0sIGwpID0+IHN1bSArIChsLmN1bXVsYXRpdmVFbGlnaWJsZSB8fCAwKSwgMCk7XG4gICAgY29uc3QgY29udHJhY3Rvck5ldFBheWFibGUgPSBjb250cmFjdG9yQmlsbExpbmVzLnJlZHVjZSgoc3VtLCBsKSA9PiBzdW0gKyAobC5uZXRQYXlhYmxlIHx8IDApLCAwKTtcblxuICAgIGNvbnN0IGNsaWVudENvbnRyYWN0VmFsdWUgPSBjbGllbnRSQUJpbGxMaW5lcy5yZWR1Y2UoKHN1bSwgbCkgPT4gc3VtICsgKGwuY29udHJhY3RWYWx1ZSB8fCAwKSwgMCk7XG4gICAgY29uc3QgY2xpZW50Q3VtdWxhdGl2ZUVsaWdpYmxlID0gY2xpZW50UkFCaWxsTGluZXMucmVkdWNlKChzdW0sIGwpID0+IHN1bSArIChsLmN1bXVsYXRpdmVFbGlnaWJsZSB8fCAwKSwgMCk7XG4gICAgY29uc3QgY2xpZW50Q3VycmVudEdyb3NzU2VsZWN0ZWRSQSA9IGNsaWVudFJBQmlsbExpbmVzXG4gICAgICAuZmlsdGVyKGwgPT4gbC5pbmNsdWRlSW5DdXJyZW50UkEgPT09IHRydWUpXG4gICAgICAucmVkdWNlKChzdW0sIGwpID0+IHN1bSArIChsLmN1cnJlbnRHcm9zcyB8fCAwKSwgMCk7IC8vIEN1cnJlbnQgR3Jvc3MgUkFcblxuICAgIGNvbnN0IGJpbGxpbmdTdXJwbHVzID0gY2xpZW50Q3VycmVudEdyb3NzU2VsZWN0ZWRSQSAtIGNvbnRyYWN0b3JOZXRQYXlhYmxlO1xuICAgIGNvbnN0IGNsaWVudEVsaWdpYmlsaXR5UGN0ID0gY2xpZW50Q29udHJhY3RWYWx1ZSA+IDAgPyAoY2xpZW50Q3VtdWxhdGl2ZUVsaWdpYmxlIC8gY2xpZW50Q29udHJhY3RWYWx1ZSkgOiAwLjA7XG5cbiAgICAvLyBUYWJsZSAxIFx1MjAxNCBieSBVbml0IFR5cGUgKHJvbGwgdXAgZnJvbSBDbGllbnQgUkEgbGluZXMgYWNyb3NzIGFsbCB0b3dlcnMpXG4gICAgY29uc3QgdW5pdFR5cGVNYXAgPSB7fTtcbiAgICBmb3IgKGNvbnN0IGwgb2YgY2xpZW50UkFCaWxsTGluZXMpIHtcbiAgICAgIGNvbnN0IHV0ID0gbC51bml0VHlwZTtcbiAgICAgIGlmICghdW5pdFR5cGVNYXBbdXQudHlwZUNvZGVdKSB7XG4gICAgICAgIHVuaXRUeXBlTWFwW3V0LnR5cGVDb2RlXSA9IHtcbiAgICAgICAgICB0eXBlQ29kZTogdXQudHlwZUNvZGUsXG4gICAgICAgICAgcHJvZHVjdDogdXQucHJvZHVjdCxcbiAgICAgICAgICB1bml0czogMCxcbiAgICAgICAgICBjb250cmFjdFZhbHVlOiAwLjAsXG4gICAgICAgICAgbWF0ZXJpYWxFbGlnaWJsZUFtdDogMC4wLFxuICAgICAgICAgIGV4ZWN1dGlvbkVsaWdpYmxlQW10OiAwLjAsXG4gICAgICAgICAgaGFuZG92ZXJFbGlnaWJsZUFtdDogMC4wXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICB1bml0VHlwZU1hcFt1dC50eXBlQ29kZV0udW5pdHMgKz0gbC51bml0c0NvdW50IHx8IDA7XG4gICAgICB1bml0VHlwZU1hcFt1dC50eXBlQ29kZV0uY29udHJhY3RWYWx1ZSArPSBsLmNvbnRyYWN0VmFsdWUgfHwgMC4wO1xuICAgICAgdW5pdFR5cGVNYXBbdXQudHlwZUNvZGVdLm1hdGVyaWFsRWxpZ2libGVBbXQgKz0gbC5tYXRlcmlhbEVsaWdpYmxlQW10IHx8IDAuMDtcbiAgICAgIHVuaXRUeXBlTWFwW3V0LnR5cGVDb2RlXS5leGVjdXRpb25FbGlnaWJsZUFtdCArPSBsLmV4ZWN1dGlvbkVsaWdpYmxlQW10IHx8IDAuMDtcbiAgICAgIHVuaXRUeXBlTWFwW3V0LnR5cGVDb2RlXS5oYW5kb3ZlckVsaWdpYmxlQW10ICs9IGwuaGFuZG92ZXJFbGlnaWJsZUFtdCB8fCAwLjA7XG4gICAgfVxuICAgIGNvbnN0IHVuaXRUeXBlVGFibGUgPSBPYmplY3QudmFsdWVzKHVuaXRUeXBlTWFwKS5tYXAocm93ID0+ICh7XG4gICAgICAuLi5yb3csXG4gICAgICBjb250cmFjdFZhbHVlOiBNYXRoLnJvdW5kKHJvdy5jb250cmFjdFZhbHVlKSxcbiAgICAgIG1hdGVyaWFsRWxpZ2libGVBbXQ6IE1hdGgucm91bmQocm93Lm1hdGVyaWFsRWxpZ2libGVBbXQpLFxuICAgICAgZXhlY3V0aW9uRWxpZ2libGVBbXQ6IE1hdGgucm91bmQocm93LmV4ZWN1dGlvbkVsaWdpYmxlQW10KSxcbiAgICAgIGhhbmRvdmVyRWxpZ2libGVBbXQ6IE1hdGgucm91bmQocm93LmhhbmRvdmVyRWxpZ2libGVBbXQpXG4gICAgfSkpO1xuXG4gICAgLy8gVGFibGUgMiBcdTIwMTQgYnkgQ29udHJhY3RvciAocHVsbCBzdHJhaWdodCBmcm9tIENvbnRyYWN0b3IgbGluZXMpXG4gICAgY29uc3QgY29udHJhY3RvclRhYmxlTWFwID0ge307XG4gICAgZm9yIChjb25zdCBsIG9mIGNvbnRyYWN0b3JCaWxsTGluZXMpIHtcbiAgICAgIGlmIChsLmFsbG9jYXRlZFVuaXRzID09PSAwKSBjb250aW51ZTsgLy8gc2tpcCB1bmFsbG9jYXRlZCBjb25maWd1cmF0aW9uc1xuICAgICAgY29uc3Qga2V5ID0gYCR7bC5jb250cmFjdG9yTmFtZX1fJHtsLnVuaXRUeXBlLnR5cGVDb2RlfWA7XG4gICAgICBjb250cmFjdG9yVGFibGVNYXBba2V5XSA9IHtcbiAgICAgICAgY29udHJhY3RvcjogbC5jb250cmFjdG9yTmFtZSxcbiAgICAgICAgdW5pdFR5cGU6IGwudW5pdFR5cGUudHlwZUNvZGUsXG4gICAgICAgIGVsaWdpYmlsaXR5UGN0OiBNYXRoLnJvdW5kKGwuZWxpZ2liaWxpdHlQY3QgKiAxMDAwKSAvIDEwLCAvLyBkaXNwbGF5IGFzICVcbiAgICAgICAgbmV0UGF5YWJsZTogTWF0aC5yb3VuZChsLm5ldFBheWFibGUpXG4gICAgICB9O1xuICAgIH1cbiAgICBjb25zdCBjb250cmFjdG9yVGFibGUgPSBPYmplY3QudmFsdWVzKGNvbnRyYWN0b3JUYWJsZU1hcCk7XG5cbiAgICByZXR1cm4gcmVzLmpzb24oe1xuICAgICAgc3VtbWFyeToge1xuICAgICAgICBjb250cmFjdG9yV09WYWx1ZTogTWF0aC5yb3VuZChjb250cmFjdG9yV09WYWx1ZSksXG4gICAgICAgIGNvbnRyYWN0b3JDdW11bGF0aXZlRWxpZ2libGU6IE1hdGgucm91bmQoY29udHJhY3RvckN1bXVsYXRpdmVFbGlnaWJsZSksXG4gICAgICAgIGNvbnRyYWN0b3JOZXRQYXlhYmxlOiBNYXRoLnJvdW5kKGNvbnRyYWN0b3JOZXRQYXlhYmxlKSxcbiAgICAgICAgY2xpZW50Q29udHJhY3RWYWx1ZTogTWF0aC5yb3VuZChjbGllbnRDb250cmFjdFZhbHVlKSxcbiAgICAgICAgY2xpZW50Q3VtdWxhdGl2ZUVsaWdpYmxlOiBNYXRoLnJvdW5kKGNsaWVudEN1bXVsYXRpdmVFbGlnaWJsZSksXG4gICAgICAgIGNsaWVudEN1cnJlbnRHcm9zc1NlbGVjdGVkUkE6IE1hdGgucm91bmQoY2xpZW50Q3VycmVudEdyb3NzU2VsZWN0ZWRSQSksXG4gICAgICAgIGJpbGxpbmdTdXJwbHVzOiBNYXRoLnJvdW5kKGJpbGxpbmdTdXJwbHVzKSxcbiAgICAgICAgY2xpZW50RWxpZ2liaWxpdHlQY3Q6IE1hdGgucm91bmQoY2xpZW50RWxpZ2liaWxpdHlQY3QgKiAxMDAwKSAvIDEwMDBcbiAgICAgIH0sXG4gICAgICB1bml0VHlwZVRhYmxlLFxuICAgICAgY29udHJhY3RvclRhYmxlXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0dldCBiaWxsaW5nIGRhc2hib2FyZCBlcnJvcjonLCBlcnIpO1xuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7IGVycm9yOiAnSW50ZXJuYWwgc2VydmVyIGVycm9yIGNhbGN1bGF0aW5nIGJpbGxpbmcgZGFzaGJvYXJkJyB9KTtcbiAgfVxufVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxocFxcXFxEb3dubG9hZHNcXFxcRGlvIEdyYWNlICgzKVxcXFxEaW8gR3JhY2UgKDMpXFxcXERpbyBHcmFjZWVcXFxcYmFja2VuZFxcXFxzcmNcXFxcY29udHJvbGxlcnNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGhwXFxcXERvd25sb2Fkc1xcXFxEaW8gR3JhY2UgKDMpXFxcXERpbyBHcmFjZSAoMylcXFxcRGlvIEdyYWNlZVxcXFxiYWNrZW5kXFxcXHNyY1xcXFxjb250cm9sbGVyc1xcXFxleHBvcnRDb250cm9sbGVyLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9ocC9Eb3dubG9hZHMvRGlvJTIwR3JhY2UlMjAoMykvRGlvJTIwR3JhY2UlMjAoMykvRGlvJTIwR3JhY2VlL2JhY2tlbmQvc3JjL2NvbnRyb2xsZXJzL2V4cG9ydENvbnRyb2xsZXIuanNcIjtpbXBvcnQgeyBQcmlzbWFDbGllbnQgfSBmcm9tICdAcHJpc21hL2NsaWVudCc7XG5pbXBvcnQgRXhjZWxKUyBmcm9tICdleGNlbGpzJztcblxuY29uc3QgcHJpc21hID0gbmV3IFByaXNtYUNsaWVudCgpO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZXhwb3J0QnVpbGRpbmdHcmlkKHJlcSwgcmVzKSB7XG4gIGNvbnN0IHsgYnVpbGRpbmdJZCB9ID0gcmVxLnBhcmFtcztcblxuICB0cnkge1xuICAgIGNvbnN0IGJ1aWxkaW5nID0gYXdhaXQgcHJpc21hLmJ1aWxkaW5nLmZpbmRVbmlxdWUoe1xuICAgICAgd2hlcmU6IHsgaWQ6IGJ1aWxkaW5nSWQgfSxcbiAgICAgIGluY2x1ZGU6IHtcbiAgICAgICAgb3JkZXI6IHtcbiAgICAgICAgICBzZWxlY3Q6IHsgb3JkZXJOdW1iZXI6IHRydWUgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBpZiAoIWJ1aWxkaW5nKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oeyBlcnJvcjogJ0J1aWxkaW5nIG5vdCBmb3VuZCcgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgYXBhcnRtZW50cyA9IGF3YWl0IHByaXNtYS5hcGFydG1lbnQuZmluZE1hbnkoe1xuICAgICAgd2hlcmU6IHsgYnVpbGRpbmdJZCB9LFxuICAgICAgb3JkZXJCeTogeyBzck5vOiAnYXNjJyB9XG4gICAgfSk7XG5cbiAgICBjb25zdCB3b3JrYm9vayA9IG5ldyBFeGNlbEpTLldvcmtib29rKCk7XG4gICAgY29uc3Qgd29ya3NoZWV0ID0gd29ya2Jvb2suYWRkV29ya3NoZWV0KGJ1aWxkaW5nLm5hbWUpO1xuXG4gICAgLy8gU3R5bGUgdmFyaWFibGVzXG4gICAgY29uc3QgaGVhZGVyRmlsbCA9IHtcbiAgICAgIHR5cGU6ICdwYXR0ZXJuJyxcbiAgICAgIHBhdHRlcm46ICdzb2xpZCcsXG4gICAgICBmZ0NvbG9yOiB7IGFyZ2I6ICdGRkUwRTBFMCcgfVxuICAgIH07XG4gICAgY29uc3QgZ3JvdXBGaWxscyA9IHtcbiAgICAgIGdyb3VwMTogeyB0eXBlOiAncGF0dGVybicsIHBhdHRlcm46ICdzb2xpZCcsIGZnQ29sb3I6IHsgYXJnYjogJ0ZGRDJFQkQ0JyB9IH0sIC8vIExpZ2h0IGdyZWVuXG4gICAgICBncm91cDI6IHsgdHlwZTogJ3BhdHRlcm4nLCBwYXR0ZXJuOiAnc29saWQnLCBmZ0NvbG9yOiB7IGFyZ2I6ICdGRkU4RjBGRScgfSB9LCAvLyBMaWdodCBibHVlXG4gICAgICBncm91cDM6IHsgdHlwZTogJ3BhdHRlcm4nLCBwYXR0ZXJuOiAnc29saWQnLCBmZ0NvbG9yOiB7IGFyZ2I6ICdGRkZDRThFNicgfSB9LCAvLyBMaWdodCByZWRcbiAgICAgIGdyb3VwNDogeyB0eXBlOiAncGF0dGVybicsIHBhdHRlcm46ICdzb2xpZCcsIGZnQ29sb3I6IHsgYXJnYjogJ0ZGRkVFRkMzJyB9IH0sIC8vIExpZ2h0IHllbGxvd1xuICAgICAgZ3JvdXA1OiB7IHR5cGU6ICdwYXR0ZXJuJywgcGF0dGVybjogJ3NvbGlkJywgZmdDb2xvcjogeyBhcmdiOiAnRkZFNkMyRkYnIH0gfSwgLy8gTGlnaHQgcHVycGxlXG4gICAgICBncm91cDY6IHsgdHlwZTogJ3BhdHRlcm4nLCBwYXR0ZXJuOiAnc29saWQnLCBmZ0NvbG9yOiB7IGFyZ2I6ICdGRkU0RjJFNycgfSB9LCAvLyBNaW50XG4gICAgICBncm91cDc6IHsgdHlwZTogJ3BhdHRlcm4nLCBwYXR0ZXJuOiAnc29saWQnLCBmZ0NvbG9yOiB7IGFyZ2I6ICdGRkZGRUJFRScgfSB9LCAvLyBSb3NlXG4gICAgICBncm91cDg6IHsgdHlwZTogJ3BhdHRlcm4nLCBwYXR0ZXJuOiAnc29saWQnLCBmZ0NvbG9yOiB7IGFyZ2I6ICdGRkYzRTVGNScgfSB9ICAvLyBMYXZlbmRlclxuICAgIH07XG5cbiAgICAvLyBDb2x1bW5zIHN0cnVjdHVyZVxuICAgIGNvbnN0IGNvbHVtbnMgPSBbXG4gICAgICAvLyBHcm91cCAxXG4gICAgICB7IGhlYWRlcjogJ1NyIE5vJywga2V5OiAnc3JObycsIHdpZHRoOiA4LCBncm91cDogJ2dyb3VwMScgfSxcbiAgICAgIHsgaGVhZGVyOiAnQXBhcnRtZW50IE5vJywga2V5OiAnYXBhcnRtZW50Tm8nLCB3aWR0aDogMTUsIGdyb3VwOiAnZ3JvdXAxJyB9LFxuICAgICAgeyBoZWFkZXI6ICdGbG9vcicsIGtleTogJ2Zsb29yJywgd2lkdGg6IDEwLCBncm91cDogJ2dyb3VwMScgfSxcbiAgICAgIHsgaGVhZGVyOiAnUHJpb3JpdHknLCBrZXk6ICdwcmlvcml0eScsIHdpZHRoOiAxMiwgZ3JvdXA6ICdncm91cDEnIH0sXG4gICAgICB7IGhlYWRlcjogJ0tpdGNoZW4gUXR5Jywga2V5OiAna2l0Y2hlblF0eScsIHdpZHRoOiAxMiwgZ3JvdXA6ICdncm91cDEnIH0sXG4gICAgICB7IGhlYWRlcjogJ1dhcmRyb2JlIFF0eScsIGtleTogJ3dhcmRyb2JlUXR5Jywgd2lkdGg6IDE0LCBncm91cDogJ2dyb3VwMScgfSxcbiAgICAgIHsgaGVhZGVyOiAnVmFuaXR5IFF0eScsIGtleTogJ3Zhbml0eVF0eScsIHdpZHRoOiAxMiwgZ3JvdXA6ICdncm91cDEnIH0sXG5cbiAgICAgIC8vIEdyb3VwIDJcbiAgICAgIHsgaGVhZGVyOiAnS2l0IExvd2VyIEludycsIGtleTogJ2tpdGNoZW5Mb3dlckNhcmNhc3NJbndhcmQnLCB3aWR0aDogMTQsIGdyb3VwOiAnZ3JvdXAyJyB9LFxuICAgICAgeyBoZWFkZXI6ICdLaXQgVXBwZXIgSW53Jywga2V5OiAna2l0Y2hlblVwcGVyQ2FyY2Fzc0lud2FyZCcsIHdpZHRoOiAxNCwgZ3JvdXA6ICdncm91cDInIH0sXG4gICAgICB7IGhlYWRlcjogJ0tpdCBTdG9uZSBJbncnLCBrZXk6ICdraXRjaGVuU3RvbmVJbndhcmQnLCB3aWR0aDogMTQsIGdyb3VwOiAnZ3JvdXAyJyB9LFxuICAgICAgeyBoZWFkZXI6ICdLaXQgU2h1dHRlcnMgSW53Jywga2V5OiAna2l0Y2hlblNodXR0ZXJJbndhcmQnLCB3aWR0aDogMTUsIGdyb3VwOiAnZ3JvdXAyJyB9LFxuICAgICAgeyBoZWFkZXI6ICdLaXQgSGFyZHdhcmUgSW53Jywga2V5OiAna2l0Y2hlbkhhcmR3YXJlSW53YXJkJywgd2lkdGg6IDE1LCBncm91cDogJ2dyb3VwMicgfSxcbiAgICAgIHsgaGVhZGVyOiAnS2l0IEFwcGxpYW5jZXMgSW53Jywga2V5OiAna2l0Y2hlbkFwcGxpYW5jZUlud2FyZCcsIHdpZHRoOiAxNiwgZ3JvdXA6ICdncm91cDInIH0sXG4gICAgICB7IGhlYWRlcjogJ1dhcmQgQ2FiaW5ldHMgSW53Jywga2V5OiAnd2FyZHJvYmVDYWJpbmV0SW53YXJkJywgd2lkdGg6IDE2LCBncm91cDogJ2dyb3VwMicgfSxcbiAgICAgIHsgaGVhZGVyOiAnV2FyZCBTaHV0dGVyIEhkdyBJbncnLCBrZXk6ICd3YXJkcm9iZVNodXR0ZXJIYXJkd2FyZUlud2FyZCcsIHdpZHRoOiAyMCwgZ3JvdXA6ICdncm91cDInIH0sXG4gICAgICB7IGhlYWRlcjogJ1ZhbiBDYWJpbmV0cyBJbncnLCBrZXk6ICd2YW5pdHlDYWJpbmV0SW53YXJkJywgd2lkdGg6IDE2LCBncm91cDogJ2dyb3VwMicgfSxcbiAgICAgIHsgaGVhZGVyOiAnVmFuIFNodXR0ZXIgSGR3IEludycsIGtleTogJ3Zhbml0eVNodXR0ZXJIYXJkd2FyZUlud2FyZCcsIHdpZHRoOiAyMCwgZ3JvdXA6ICdncm91cDInIH0sXG5cbiAgICAgIC8vIEdyb3VwIDNcbiAgICAgIHsgaGVhZGVyOiAnS2l0IExvd2VyIEluc3QnLCBrZXk6ICdraXRjaGVuTG93ZXJDYXJjYXNzSW5zdGFsbGVkJywgd2lkdGg6IDE0LCBncm91cDogJ2dyb3VwMycgfSxcbiAgICAgIHsgaGVhZGVyOiAnS2l0IFVwcGVyIEluc3QnLCBrZXk6ICdraXRjaGVuVXBwZXJDYXJjYXNzSW5zdGFsbGVkJywgd2lkdGg6IDE0LCBncm91cDogJ2dyb3VwMycgfSxcbiAgICAgIHsgaGVhZGVyOiAnS2l0IFN0b25lIEluc3QnLCBrZXk6ICdraXRjaGVuU3RvbmVJbnN0YWxsZWQnLCB3aWR0aDogMTQsIGdyb3VwOiAnZ3JvdXAzJyB9LFxuICAgICAgeyBoZWFkZXI6ICdLaXQgU2h1dHRlcnMgSGR3IEluc3QnLCBrZXk6ICdraXRjaGVuU2h1dHRlckhhcmR3YXJlSW5zdGFsbGVkJywgd2lkdGg6IDIwLCBncm91cDogJ2dyb3VwMycgfSxcbiAgICAgIHsgaGVhZGVyOiAnS2l0IEFwcGxpYW5jZXMgSW5zdCcsIGtleTogJ2tpdGNoZW5BcHBsaWFuY2VJbnN0YWxsZWQnLCB3aWR0aDogMTgsIGdyb3VwOiAnZ3JvdXAzJyB9LFxuICAgICAgeyBoZWFkZXI6ICdLaXQgSGFuZGVkIE92ZXInLCBrZXk6ICdraXRjaGVuSGFuZGVkT3ZlcicsIHdpZHRoOiAxNiwgZ3JvdXA6ICdncm91cDMnIH0sXG4gICAgICB7IGhlYWRlcjogJ1dhcmQgQ2FiaW5ldHMgSW5zdCcsIGtleTogJ3dhcmRyb2JlQ2FiaW5ldEluc3RhbGxlZCcsIHdpZHRoOiAxOCwgZ3JvdXA6ICdncm91cDMnIH0sXG4gICAgICB7IGhlYWRlcjogJ1dhcmQgU2h1dHRlciBIZHcgSW5zdCcsIGtleTogJ3dhcmRyb2JlU2h1dHRlckhhcmR3YXJlSW5zdGFsbGVkJywgd2lkdGg6IDIyLCBncm91cDogJ2dyb3VwMycgfSxcbiAgICAgIHsgaGVhZGVyOiAnV2FyZCBIYW5kZWQgT3ZlcicsIGtleTogJ3dhcmRyb2JlSGFuZGVkT3ZlcicsIHdpZHRoOiAxOCwgZ3JvdXA6ICdncm91cDMnIH0sXG4gICAgICB7IGhlYWRlcjogJ1ZhbiBDYWJpbmV0cyBJbnN0Jywga2V5OiAndmFuaXR5Q2FiaW5ldEluc3RhbGxlZCcsIHdpZHRoOiAxOCwgZ3JvdXA6ICdncm91cDMnIH0sXG4gICAgICB7IGhlYWRlcjogJ1ZhbiBTaHV0dGVyIEhkdyBJbnN0Jywga2V5OiAndmFuaXR5U2h1dHRlckhhcmR3YXJlSW5zdGFsbGVkJywgd2lkdGg6IDIyLCBncm91cDogJ2dyb3VwMycgfSxcbiAgICAgIHsgaGVhZGVyOiAnVmFuIEhhbmRlZCBPdmVyJywga2V5OiAndmFuaXR5SGFuZGVkT3ZlcicsIHdpZHRoOiAxOCwgZ3JvdXA6ICdncm91cDMnIH0sXG5cbiAgICAgIC8vIEdyb3VwIDRcbiAgICAgIHsgaGVhZGVyOiAnUGxhbm5lZCBTdGFydCcsIGtleTogJ3BsYW5uZWRTdGFydCcsIHdpZHRoOiAxNSwgZ3JvdXA6ICdncm91cDQnIH0sXG4gICAgICB7IGhlYWRlcjogJ1BsYW5uZWQgQ29tcCcsIGtleTogJ3BsYW5uZWRDb21wbGV0aW9uJywgd2lkdGg6IDE1LCBncm91cDogJ2dyb3VwNCcgfSxcbiAgICAgIHsgaGVhZGVyOiAnQWN0dWFsIFN0YXJ0Jywga2V5OiAnYWN0dWFsU3RhcnQnLCB3aWR0aDogMTUsIGdyb3VwOiAnZ3JvdXA0JyB9LFxuICAgICAgeyBoZWFkZXI6ICdBY3R1YWwgQ29tcCcsIGtleTogJ2FjdHVhbENvbXBsZXRpb24nLCB3aWR0aDogMTUsIGdyb3VwOiAnZ3JvdXA0JyB9LFxuICAgICAgeyBoZWFkZXI6ICdSZXNwb25zaWJsZSBFbmcnLCBrZXk6ICdyZXNwb25zaWJsZUVuZ2luZWVyJywgd2lkdGg6IDE4LCBncm91cDogJ2dyb3VwNCcgfSxcbiAgICAgIHsgaGVhZGVyOiAnQ29udHJhY3RvcicsIGtleTogJ2NvbnRyYWN0b3InLCB3aWR0aDogMTUsIGdyb3VwOiAnZ3JvdXA0JyB9LFxuICAgICAgeyBoZWFkZXI6ICdEZWxheSBSZWFzb24nLCBrZXk6ICdkZWxheVJlYXNvbicsIHdpZHRoOiAyMCwgZ3JvdXA6ICdncm91cDQnIH0sXG4gICAgICB7IGhlYWRlcjogJ1JlbWFya3MnLCBrZXk6ICdyZW1hcmtzJywgd2lkdGg6IDI1LCBncm91cDogJ2dyb3VwNCcgfSxcblxuICAgICAgLy8gR3JvdXAgNVxuICAgICAgeyBoZWFkZXI6ICdNYXQgSW53YXJkICUnLCBrZXk6ICdtYXRlcmlhbElud2FyZFBjdCcsIHdpZHRoOiAxNSwgZ3JvdXA6ICdncm91cDUnIH0sXG4gICAgICB7IGhlYWRlcjogJ0tpdCBDb21wICUnLCBrZXk6ICdraXRjaGVuQ29tcGxldGlvblBjdCcsIHdpZHRoOiAxMiwgZ3JvdXA6ICdncm91cDUnIH0sXG4gICAgICB7IGhlYWRlcjogJ1dhcmQgQ29tcCAlJywga2V5OiAnd2FyZHJvYmVDb21wbGV0aW9uUGN0Jywgd2lkdGg6IDE0LCBncm91cDogJ2dyb3VwNScgfSxcbiAgICAgIHsgaGVhZGVyOiAnVmFuIENvbXAgJScsIGtleTogJ3Zhbml0eUNvbXBsZXRpb25QY3QnLCB3aWR0aDogMTIsIGdyb3VwOiAnZ3JvdXA1JyB9LFxuICAgICAgeyBoZWFkZXI6ICdPdmVyYWxsIENvbXAgJScsIGtleTogJ292ZXJhbGxDb21wbGV0aW9uUGN0Jywgd2lkdGg6IDE1LCBncm91cDogJ2dyb3VwNScgfSxcbiAgICAgIHsgaGVhZGVyOiAnQXB0IFN0YXR1cycsIGtleTogJ2FwYXJ0bWVudFN0YXR1cycsIHdpZHRoOiAxOCwgZ3JvdXA6ICdncm91cDUnIH0sXG4gICAgICB7IGhlYWRlcjogJ0RlbGF5IERheXMnLCBrZXk6ICdkZWxheURheXMnLCB3aWR0aDogMTIsIGdyb3VwOiAnZ3JvdXA1JyB9LFxuICAgICAgeyBoZWFkZXI6ICdIZWFsdGgnLCBrZXk6ICdoZWFsdGgnLCB3aWR0aDogMTIsIGdyb3VwOiAnZ3JvdXA1JyB9LFxuXG4gICAgICAvLyBHcm91cCA2XG4gICAgICB7IGhlYWRlcjogJ0tpdCBRQzogU2NyZXdzJywga2V5OiAna2l0Y2hlblFDX1Zpc2libGVTY3Jld3MnLCB3aWR0aDogMTYsIGdyb3VwOiAnZ3JvdXA2JyB9LFxuICAgICAgeyBoZWFkZXI6ICdLaXQgUUM6IENoaXBzJywga2V5OiAna2l0Y2hlblFDX0NoaXBwaW5nJywgd2lkdGg6IDE2LCBncm91cDogJ2dyb3VwNicgfSxcbiAgICAgIHsgaGVhZGVyOiAnS2l0IFFDOiBGaWxsZXInLCBrZXk6ICdraXRjaGVuUUNfRmlsbGVyTWlzc2luZycsIHdpZHRoOiAxNiwgZ3JvdXA6ICdncm91cDYnIH0sXG4gICAgICB7IGhlYWRlcjogJ0tpdCBRQzogU2NyYXRjaGVzJywga2V5OiAna2l0Y2hlblFDX1NjcmF0Y2hlcycsIHdpZHRoOiAxNiwgZ3JvdXA6ICdncm91cDYnIH0sXG4gICAgICB7IGhlYWRlcjogJ0tpdCBRQzogRHJhd2VycycsIGtleTogJ2tpdGNoZW5RQ19EcmF3ZXJzRnVuY3Rpb24nLCB3aWR0aDogMTYsIGdyb3VwOiAnZ3JvdXA2JyB9LFxuICAgICAgeyBoZWFkZXI6ICdLaXQgUUM6IEN1dGxlcnknLCBrZXk6ICdraXRjaGVuUUNfQ3V0bGVyeVRyYXknLCB3aWR0aDogMTYsIGdyb3VwOiAnZ3JvdXA2JyB9LFxuICAgICAgeyBoZWFkZXI6ICdLaXQgUUM6IERyYWluZXInLCBrZXk6ICdraXRjaGVuUUNfRGlzaERyYWluZXInLCB3aWR0aDogMTYsIGdyb3VwOiAnZ3JvdXA2JyB9LFxuXG4gICAgICB7IGhlYWRlcjogJ1dhcmQgUUM6IFNjcmV3cycsIGtleTogJ3dhcmRyb2JlUUNfVmlzaWJsZVNjcmV3cycsIHdpZHRoOiAxNiwgZ3JvdXA6ICdncm91cDYnIH0sXG4gICAgICB7IGhlYWRlcjogJ1dhcmQgUUM6IENoaXBzJywga2V5OiAnd2FyZHJvYmVRQ19DaGlwcGluZycsIHdpZHRoOiAxNiwgZ3JvdXA6ICdncm91cDYnIH0sXG4gICAgICB7IGhlYWRlcjogJ1dhcmQgUUM6IEZpbGxlcicsIGtleTogJ3dhcmRyb2JlUUNfRmlsbGVyTWlzc2luZycsIHdpZHRoOiAxNiwgZ3JvdXA6ICdncm91cDYnIH0sXG4gICAgICB7IGhlYWRlcjogJ1dhcmQgUUM6IFNjcmF0Y2hlcycsIGtleTogJ3dhcmRyb2JlUUNfU2NyYXRjaGVzJywgd2lkdGg6IDE2LCBncm91cDogJ2dyb3VwNicgfSxcbiAgICAgIHsgaGVhZGVyOiAnV2FyZCBRQzogRHJhd2VycycsIGtleTogJ3dhcmRyb2JlUUNfRHJhd2Vyc0Z1bmN0aW9uJywgd2lkdGg6IDE2LCBncm91cDogJ2dyb3VwNicgfSxcblxuICAgICAgeyBoZWFkZXI6ICdWYW4gUUM6IFNjcmV3cycsIGtleTogJ3Zhbml0eVFDX1Zpc2libGVTY3Jld3MnLCB3aWR0aDogMTYsIGdyb3VwOiAnZ3JvdXA2JyB9LFxuICAgICAgeyBoZWFkZXI6ICdWYW4gUUM6IENoaXBzJywga2V5OiAndmFuaXR5UUNfQ2hpcHBpbmcnLCB3aWR0aDogMTYsIGdyb3VwOiAnZ3JvdXA2JyB9LFxuICAgICAgeyBoZWFkZXI6ICdWYW4gUUM6IEZpbGxlcicsIGtleTogJ3Zhbml0eVFDX0ZpbGxlck1pc3NpbmcnLCB3aWR0aDogMTYsIGdyb3VwOiAnZ3JvdXA2JyB9LFxuICAgICAgeyBoZWFkZXI6ICdWYW4gUUM6IFNjcmF0Y2hlcycsIGtleTogJ3Zhbml0eVFDX1NjcmF0Y2hlcycsIHdpZHRoOiAxNiwgZ3JvdXA6ICdncm91cDYnIH0sXG4gICAgICB7IGhlYWRlcjogJ1ZhbiBRQzogRHJhd2VycycsIGtleTogJ3Zhbml0eVFDX0RyYXdlcnNGdW5jdGlvbicsIHdpZHRoOiAxNiwgZ3JvdXA6ICdncm91cDYnIH0sXG5cbiAgICAgIC8vIEdyb3VwIDdcbiAgICAgIHsgaGVhZGVyOiAnS2l0IFFDIEdhdGUnLCBrZXk6ICdraXRjaGVuUUNHYXRlJywgd2lkdGg6IDE0LCBncm91cDogJ2dyb3VwNycgfSxcbiAgICAgIHsgaGVhZGVyOiAnV2FyZCBRQyBHYXRlJywga2V5OiAnd2FyZHJvYmVRQ0dhdGUnLCB3aWR0aDogMTUsIGdyb3VwOiAnZ3JvdXA3JyB9LFxuICAgICAgeyBoZWFkZXI6ICdWYW4gUUMgR2F0ZScsIGtleTogJ3Zhbml0eVFDR2F0ZScsIHdpZHRoOiAxNCwgZ3JvdXA6ICdncm91cDcnIH0sXG4gICAgICB7IGhlYWRlcjogJ0hhbmRvdmVyIFN0YXR1cycsIGtleTogJ2hhbmRvdmVyQXBwcm92YWxTdGF0dXMnLCB3aWR0aDogMjIsIGdyb3VwOiAnZ3JvdXA3JyB9LFxuXG4gICAgICAvLyBHcm91cCA4XG4gICAgICB7IGhlYWRlcjogJ0tpdCBUeXBlJywga2V5OiAna2l0Y2hlblR5cGUnLCB3aWR0aDogMTIsIGdyb3VwOiAnZ3JvdXA4JyB9LFxuICAgICAgeyBoZWFkZXI6ICdXYXJkIFR5cGUnLCBrZXk6ICd3YXJkcm9iZVR5cGUnLCB3aWR0aDogMTIsIGdyb3VwOiAnZ3JvdXA4JyB9LFxuICAgICAgeyBoZWFkZXI6ICdWYW4gVHlwZScsIGtleTogJ3Zhbml0eVR5cGUnLCB3aWR0aDogMTIsIGdyb3VwOiAnZ3JvdXA4JyB9XG4gICAgXTtcblxuICAgIHdvcmtzaGVldC5jb2x1bW5zID0gY29sdW1ucy5tYXAoYyA9PiAoe1xuICAgICAgaGVhZGVyOiBjLmhlYWRlcixcbiAgICAgIGtleTogYy5rZXksXG4gICAgICB3aWR0aDogYy53aWR0aFxuICAgIH0pKTtcblxuICAgIC8vIEFwcGx5IGhlYWRlciBncm91cCBzdHlsaW5nXG4gICAgY29uc3QgaGVhZGVyUm93ID0gd29ya3NoZWV0LmdldFJvdygxKTtcbiAgICBoZWFkZXJSb3cuaGVpZ2h0ID0gMzA7XG5cbiAgICBjb2x1bW5zLmZvckVhY2goKGNvbCwgaWR4KSA9PiB7XG4gICAgICBjb25zdCBjZWxsID0gaGVhZGVyUm93LmdldENlbGwoaWR4ICsgMSk7XG4gICAgICBjZWxsLmZpbGwgPSBncm91cEZpbGxzW2NvbC5ncm91cF07XG4gICAgICBjZWxsLmZvbnQgPSB7IGJvbGQ6IHRydWUsIG5hbWU6ICdDYWxpYnJpJywgc2l6ZTogMTEgfTtcbiAgICAgIGNlbGwuYWxpZ25tZW50ID0geyB2ZXJ0aWNhbDogJ21pZGRsZScsIGhvcml6b250YWw6ICdjZW50ZXInLCB3cmFwVGV4dDogdHJ1ZSB9O1xuICAgICAgY2VsbC5ib3JkZXIgPSB7XG4gICAgICAgIHRvcDogeyBzdHlsZTogJ3RoaW4nIH0sXG4gICAgICAgIGxlZnQ6IHsgc3R5bGU6ICd0aGluJyB9LFxuICAgICAgICBib3R0b206IHsgc3R5bGU6ICdtZWRpdW0nIH0sXG4gICAgICAgIHJpZ2h0OiB7IHN0eWxlOiAndGhpbicgfVxuICAgICAgfTtcbiAgICB9KTtcblxuICAgIC8vIEFkZCByb3dzXG4gICAgYXBhcnRtZW50cy5mb3JFYWNoKGFwdCA9PiB7XG4gICAgICBjb25zdCByb3dEYXRhID0ge307XG4gICAgICBjb2x1bW5zLmZvckVhY2goY29sID0+IHtcbiAgICAgICAgbGV0IHZhbCA9IGFwdFtjb2wua2V5XTtcblxuICAgICAgICAvLyBGb3JtYXQgRGF0ZSBmaWVsZHNcbiAgICAgICAgaWYgKHZhbCBpbnN0YW5jZW9mIERhdGUpIHtcbiAgICAgICAgICB2YWwgPSB2YWwudG9JU09TdHJpbmcoKS5zcGxpdCgnVCcpWzBdO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRm9ybWF0IFBlcmNlbnRhZ2VzIGZvciBkaXNwbGF5XG4gICAgICAgIGlmIChjb2wua2V5LmVuZHNXaXRoKCdQY3QnKSkge1xuICAgICAgICAgIHZhbCA9IGAkeyh2YWwgKiAxMDApLnRvRml4ZWQoMSl9JWA7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBGb3JtYXQgTXVsdGktVHlwZXMgZm9yIFdhcmRyb2JlIGFuZCBWYW5pdHlcbiAgICAgICAgaWYgKChjb2wua2V5ID09PSAnd2FyZHJvYmVUeXBlJyB8fCBjb2wua2V5ID09PSAndmFuaXR5VHlwZScpICYmIHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnICYmIHZhbC5zdGFydHNXaXRoKCdbJykpIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgbGlzdCA9IEpTT04ucGFyc2UodmFsKTtcbiAgICAgICAgICAgIHZhbCA9IGxpc3QubWFwKGl0ZW0gPT4gYCR7aXRlbS50eXBlfSAoJHtpdGVtLnF0eX0pYCkuam9pbignLCAnKTtcbiAgICAgICAgICB9IGNhdGNoIChlKSB7fVxuICAgICAgICB9XG5cbiAgICAgICAgcm93RGF0YVtjb2wua2V5XSA9IHZhbCAhPT0gbnVsbCA/IHZhbCA6ICcnO1xuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IHJvdyA9IHdvcmtzaGVldC5hZGRSb3cocm93RGF0YSk7XG4gICAgICByb3cuaGVpZ2h0ID0gMjA7XG5cbiAgICAgIC8vIENlbnRlciB2YWx1ZXMgZm9yIG51bWVyaWMgb3Igc3RhdHVzIGZpZWxkc1xuICAgICAgY29sdW1ucy5mb3JFYWNoKChjb2wsIGlkeCkgPT4ge1xuICAgICAgICBjb25zdCBjZWxsID0gcm93LmdldENlbGwoaWR4ICsgMSk7XG4gICAgICAgIGNlbGwuYWxpZ25tZW50ID0geyB2ZXJ0aWNhbDogJ21pZGRsZScsIGhvcml6b250YWw6ICdsZWZ0JyB9O1xuICAgICAgICBpZiAodHlwZW9mIGNlbGwudmFsdWUgPT09ICdudW1iZXInIHx8IGNvbC5rZXkuZW5kc1dpdGgoJ1BjdCcpIHx8IGNvbC5rZXkgPT09ICdzck5vJykge1xuICAgICAgICAgIGNlbGwuYWxpZ25tZW50ID0geyB2ZXJ0aWNhbDogJ21pZGRsZScsIGhvcml6b250YWw6ICdjZW50ZXInIH07XG4gICAgICAgIH1cbiAgICAgICAgY2VsbC5ib3JkZXIgPSB7XG4gICAgICAgICAgdG9wOiB7IHN0eWxlOiAndGhpbicgfSxcbiAgICAgICAgICBsZWZ0OiB7IHN0eWxlOiAndGhpbicgfSxcbiAgICAgICAgICBib3R0b206IHsgc3R5bGU6ICd0aGluJyB9LFxuICAgICAgICAgIHJpZ2h0OiB7IHN0eWxlOiAndGhpbicgfVxuICAgICAgICB9O1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICAvLyBTZXQgcmVzcG9uc2UgaGVhZGVyc1xuICAgIHJlcy5zZXRIZWFkZXIoXG4gICAgICAnQ29udGVudC1UeXBlJyxcbiAgICAgICdhcHBsaWNhdGlvbi92bmQub3BlbnhtbGZvcm1hdHMtb2ZmaWNlZG9jdW1lbnQuc3ByZWFkc2hlZXRtbC5zaGVldCdcbiAgICApO1xuICAgIHJlcy5zZXRIZWFkZXIoXG4gICAgICAnQ29udGVudC1EaXNwb3NpdGlvbicsXG4gICAgICBgYXR0YWNobWVudDsgZmlsZW5hbWU9R3JpZF8ke2J1aWxkaW5nLm5hbWUucmVwbGFjZSgvXFxzKy9nLCAnXycpfS54bHN4YFxuICAgICk7XG5cbiAgICBhd2FpdCB3b3JrYm9vay54bHN4LndyaXRlKHJlcyk7XG4gICAgcmVzLmVuZCgpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKCdFeHBvcnQgRXhjZWwgZXJyb3I6JywgZXJyKTtcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oeyBlcnJvcjogJ0ludGVybmFsIHNlcnZlciBlcnJvciBleHBvcnRpbmcgYnVpbGRpbmcgZGF0YScgfSk7XG4gIH1cbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcaHBcXFxcRG93bmxvYWRzXFxcXERpbyBHcmFjZSAoMylcXFxcRGlvIEdyYWNlICgzKVxcXFxEaW8gR3JhY2VlXFxcXGJhY2tlbmRcXFxcc3JjXFxcXGNvbnRyb2xsZXJzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxocFxcXFxEb3dubG9hZHNcXFxcRGlvIEdyYWNlICgzKVxcXFxEaW8gR3JhY2UgKDMpXFxcXERpbyBHcmFjZWVcXFxcYmFja2VuZFxcXFxzcmNcXFxcY29udHJvbGxlcnNcXFxcYW5hbHl0aWNzQ29udHJvbGxlci5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvaHAvRG93bmxvYWRzL0RpbyUyMEdyYWNlJTIwKDMpL0RpbyUyMEdyYWNlJTIwKDMpL0RpbyUyMEdyYWNlZS9iYWNrZW5kL3NyYy9jb250cm9sbGVycy9hbmFseXRpY3NDb250cm9sbGVyLmpzXCI7aW1wb3J0IHsgUHJpc21hQ2xpZW50IH0gZnJvbSAnQHByaXNtYS9jbGllbnQnO1xuXG5jb25zdCBwcmlzbWEgPSBuZXcgUHJpc21hQ2xpZW50KCk7XG5cbi8vIFJldXNhYmxlIFN0YWdlIEFuYWx5c2lzIGNoZWNrbGlzdCBzdHJ1Y3R1cmVzXG5jb25zdCBtYXRlcmlhbEl0ZW1zID0gW1xuICB7IGxhYmVsOiBcIktpdGNoZW4gTG93ZXIgQ2FyY2FzcyBJbndhcmRcIiwga2V5OiBcImtpdGNoZW5Mb3dlckNhcmNhc3NJbndhcmRcIiwgcHJvZHVjdDogXCJraXRjaGVuXCIsIHF0eUtleTogXCJraXRjaGVuUXR5XCIgfSxcbiAgeyBsYWJlbDogXCJLaXRjaGVuIFVwcGVyIENhcmNhc3MgSW53YXJkXCIsIGtleTogXCJraXRjaGVuVXBwZXJDYXJjYXNzSW53YXJkXCIsIHByb2R1Y3Q6IFwia2l0Y2hlblwiLCBxdHlLZXk6IFwia2l0Y2hlblF0eVwiIH0sXG4gIHsgbGFiZWw6IFwiS2l0Y2hlbiBTdG9uZSBJbndhcmRcIiwga2V5OiBcImtpdGNoZW5TdG9uZUlud2FyZFwiLCBwcm9kdWN0OiBcImtpdGNoZW5cIiwgcXR5S2V5OiBcImtpdGNoZW5RdHlcIiB9LFxuICB7IGxhYmVsOiBcIktpdGNoZW4gU2h1dHRlciBJbndhcmRcIiwga2V5OiBcImtpdGNoZW5TaHV0dGVySW53YXJkXCIsIHByb2R1Y3Q6IFwia2l0Y2hlblwiLCBxdHlLZXk6IFwia2l0Y2hlblF0eVwiIH0sXG4gIHsgbGFiZWw6IFwiS2l0Y2hlbiBIYXJkd2FyZSBJbndhcmRcIiwga2V5OiBcImtpdGNoZW5IYXJkd2FyZUlud2FyZFwiLCBwcm9kdWN0OiBcImtpdGNoZW5cIiwgcXR5S2V5OiBcImtpdGNoZW5RdHlcIiB9LFxuICB7IGxhYmVsOiBcIktpdGNoZW4gQXBwbGlhbmNlIElud2FyZFwiLCBrZXk6IFwia2l0Y2hlbkFwcGxpYW5jZUlud2FyZFwiLCBwcm9kdWN0OiBcImtpdGNoZW5cIiwgcXR5S2V5OiBcImtpdGNoZW5RdHlcIiB9LFxuICB7IGxhYmVsOiBcIldhcmRyb2JlIENhYmluZXQgSW53YXJkXCIsIGtleTogXCJ3YXJkcm9iZUNhYmluZXRJbndhcmRcIiwgcHJvZHVjdDogXCJ3YXJkcm9iZVwiLCBxdHlLZXk6IFwid2FyZHJvYmVRdHlcIiB9LFxuICB7IGxhYmVsOiBcIldhcmRyb2JlIFNodXR0ZXIgSGFyZHdhcmUgSW53YXJkXCIsIGtleTogXCJ3YXJkcm9iZVNodXR0ZXJIYXJkd2FyZUlud2FyZFwiLCBwcm9kdWN0OiBcIndhcmRyb2JlXCIsIHF0eUtleTogXCJ3YXJkcm9iZVF0eVwiIH0sXG4gIHsgbGFiZWw6IFwiVmFuaXR5IENhYmluZXQgSW53YXJkXCIsIGtleTogXCJ2YW5pdHlDYWJpbmV0SW53YXJkXCIsIHByb2R1Y3Q6IFwidmFuaXR5XCIsIHF0eUtleTogXCJ2YW5pdHlRdHlcIiB9LFxuICB7IGxhYmVsOiBcIlZhbml0eSBTaHV0dGVyIEhhcmR3YXJlIElud2FyZFwiLCBrZXk6IFwidmFuaXR5U2h1dHRlckhhcmR3YXJlSW53YXJkXCIsIHByb2R1Y3Q6IFwidmFuaXR5XCIsIHF0eUtleTogXCJ2YW5pdHlRdHlcIiB9XG5dO1xuXG5jb25zdCBleGVjdXRpb25JdGVtcyA9IFtcbiAgeyBsYWJlbDogXCJLaXRjaGVuIExvd2VyIENhcmNhc3MgSW5zdGFsbGVkXCIsIGtleTogXCJraXRjaGVuTG93ZXJDYXJjYXNzSW5zdGFsbGVkXCIsIHByb2R1Y3Q6IFwia2l0Y2hlblwiLCBxdHlLZXk6IFwia2l0Y2hlblF0eVwiIH0sXG4gIHsgbGFiZWw6IFwiS2l0Y2hlbiBVcHBlciBDYXJjYXNzIEluc3RhbGxlZFwiLCBrZXk6IFwia2l0Y2hlblVwcGVyQ2FyY2Fzc0luc3RhbGxlZFwiLCBwcm9kdWN0OiBcImtpdGNoZW5cIiwgcXR5S2V5OiBcImtpdGNoZW5RdHlcIiB9LFxuICB7IGxhYmVsOiBcIktpdGNoZW4gU3RvbmUgSW5zdGFsbGVkXCIsIGtleTogXCJraXRjaGVuU3RvbmVJbnN0YWxsZWRcIiwgcHJvZHVjdDogXCJraXRjaGVuXCIsIHF0eUtleTogXCJraXRjaGVuUXR5XCIgfSxcbiAgeyBsYWJlbDogXCJLaXRjaGVuIFNodXR0ZXIgSGFyZHdhcmUgSW5zdGFsbGVkXCIsIGtleTogXCJraXRjaGVuU2h1dHRlckhhcmR3YXJlSW5zdGFsbGVkXCIsIHByb2R1Y3Q6IFwia2l0Y2hlblwiLCBxdHlLZXk6IFwia2l0Y2hlblF0eVwiIH0sXG4gIHsgbGFiZWw6IFwiS2l0Y2hlbiBBcHBsaWFuY2UgSW5zdGFsbGVkXCIsIGtleTogXCJraXRjaGVuQXBwbGlhbmNlSW5zdGFsbGVkXCIsIHByb2R1Y3Q6IFwia2l0Y2hlblwiLCBxdHlLZXk6IFwia2l0Y2hlblF0eVwiIH0sXG4gIHsgbGFiZWw6IFwiS2l0Y2hlbiBIYW5kZWQgT3ZlclwiLCBrZXk6IFwia2l0Y2hlbkhhbmRlZE92ZXJcIiwgcHJvZHVjdDogXCJraXRjaGVuXCIsIHF0eUtleTogXCJraXRjaGVuUXR5XCIgfSxcbiAgeyBsYWJlbDogXCJXYXJkcm9iZSBDYWJpbmV0IEluc3RhbGxlZFwiLCBrZXk6IFwid2FyZHJvYmVDYWJpbmV0SW5zdGFsbGVkXCIsIHByb2R1Y3Q6IFwid2FyZHJvYmVcIiwgcXR5S2V5OiBcIndhcmRyb2JlUXR5XCIgfSxcbiAgeyBsYWJlbDogXCJXYXJkcm9iZSBTaHV0dGVyIEhhcmR3YXJlIEluc3RhbGxlZFwiLCBrZXk6IFwid2FyZHJvYmVTaHV0dGVySGFyZHdhcmVJbnN0YWxsZWRcIiwgcHJvZHVjdDogXCJ3YXJkcm9iZVwiLCBxdHlLZXk6IFwid2FyZHJvYmVRdHlcIiB9LFxuICB7IGxhYmVsOiBcIldhcmRyb2JlIEhhbmRlZCBPdmVyXCIsIGtleTogXCJ3YXJkcm9iZUhhbmRlZE92ZXJcIiwgcHJvZHVjdDogXCJ3YXJkcm9iZVwiLCBxdHlLZXk6IFwid2FyZHJvYmVRdHlcIiB9LFxuICB7IGxhYmVsOiBcIlZhbml0eSBDYWJpbmV0IEluc3RhbGxlZFwiLCBrZXk6IFwidmFuaXR5Q2FiaW5ldEluc3RhbGxlZFwiLCBwcm9kdWN0OiBcInZhbml0eVwiLCBxdHlLZXk6IFwidmFuaXR5UXR5XCIgfSxcbiAgeyBsYWJlbDogXCJWYW5pdHkgU2h1dHRlciBIYXJkd2FyZSBJbnN0YWxsZWRcIiwga2V5OiBcInZhbml0eVNodXR0ZXJIYXJkd2FyZUluc3RhbGxlZFwiLCBwcm9kdWN0OiBcInZhbml0eVwiLCBxdHlLZXk6IFwidmFuaXR5UXR5XCIgfSxcbiAgeyBsYWJlbDogXCJWYW5pdHkgSGFuZGVkIE92ZXJcIiwga2V5OiBcInZhbml0eUhhbmRlZE92ZXJcIiwgcHJvZHVjdDogXCJ2YW5pdHlcIiwgcXR5S2V5OiBcInZhbml0eVF0eVwiIH1cbl07XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRQcm9qZWN0QW5hbHl0aWNzKHJlcSwgcmVzKSB7XG4gIGNvbnN0IHsgb3JkZXJJZCB9ID0gcmVxLnBhcmFtcztcblxuICB0cnkge1xuICAgIC8vIDEuIEZldGNoIE9yZGVyIGRldGFpbHMgYWxvbmcgd2l0aCBCaWxsaW5nIFNldHVwICYgVG93ZXJzXG4gICAgY29uc3Qgb3JkZXIgPSBhd2FpdCBwcmlzbWEub3JkZXIuZmluZFVuaXF1ZSh7XG4gICAgICB3aGVyZTogeyBpZDogb3JkZXJJZCB9LFxuICAgICAgaW5jbHVkZToge1xuICAgICAgICBjcmVhdGVkQnk6IHtcbiAgICAgICAgICBzZWxlY3Q6IHtcbiAgICAgICAgICAgIGlkOiB0cnVlLFxuICAgICAgICAgICAgbmFtZTogdHJ1ZSxcbiAgICAgICAgICAgIGVtYWlsOiB0cnVlXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBiaWxsaW5nU2V0dXA6IHtcbiAgICAgICAgICBpbmNsdWRlOiB7XG4gICAgICAgICAgICB1bml0VHlwZVJhdGVzOiB0cnVlXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBpZiAoIW9yZGVyKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oeyBlcnJvcjogJ09yZGVyIHByb2plY3Qgbm90IGZvdW5kJyB9KTtcbiAgICB9XG5cbiAgICAvLyAyLiBGZXRjaCBhbGwgQnVpbGRpbmdzIGZvciB0aGlzIG9yZGVyLCB3aXRoIHRoZWlyIGFwYXJ0bWVudHNcbiAgICBjb25zdCBidWlsZGluZ3MgPSBhd2FpdCBwcmlzbWEuYnVpbGRpbmcuZmluZE1hbnkoe1xuICAgICAgd2hlcmU6IHsgb3JkZXJJZCB9LFxuICAgICAgaW5jbHVkZToge1xuICAgICAgICBhcGFydG1lbnRzOiB0cnVlXG4gICAgICB9LFxuICAgICAgb3JkZXJCeTogeyBuYW1lOiAnYXNjJyB9XG4gICAgfSk7XG5cbiAgICAvLyBFeHRyYWN0IGFsbCBhcGFydG1lbnRzIGFjcm9zcyB0aGUgZW50aXJlIG9yZGVyXG4gICAgY29uc3QgYWxsQXBhcnRtZW50cyA9IGJ1aWxkaW5ncy5mbGF0TWFwKGIgPT4gYi5hcGFydG1lbnRzKTtcblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIEEpIFRvd2VyIFN1bW1hcnkgUm9sbHVwXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgY29uc3QgdG93ZXJTdW1tYXJ5ID0gW107XG5cbiAgICAvLyBTaXRlIFRvdGFsIHZhcmlhYmxlc1xuICAgIGxldCBzaXRlQXBhcnRtZW50cyA9IGFsbEFwYXJ0bWVudHMubGVuZ3RoO1xuICAgIGxldCBzaXRlS2l0Y2hlblVuaXRzID0gMDtcbiAgICBsZXQgc2l0ZVdhcmRyb2JlVW5pdHMgPSAwO1xuICAgIGxldCBzaXRlVmFuaXR5VW5pdHMgPSAwO1xuXG4gICAgbGV0IHNpdGVTdW1NYXRJbndhcmQgPSAwLjA7XG4gICAgbGV0IHNpdGVTdW1LaXRjaGVuQ29tcCA9IDAuMDtcbiAgICBsZXQgc2l0ZVN1bVdhcmRyb2JlQ29tcCA9IDAuMDtcbiAgICBsZXQgc2l0ZVN1bVZhbml0eUNvbXAgPSAwLjA7XG4gICAgbGV0IHNpdGVTdW1PdmVyYWxsQ29tcCA9IDAuMDtcblxuICAgIGxldCBzaXRlTm90U3RhcnRlZCA9IDA7XG4gICAgbGV0IHNpdGVNYXRJbndhcmRSZWFkeSA9IDA7XG4gICAgbGV0IHNpdGVFeGVjdXRpb25JblByb2dyZXNzID0gMDtcbiAgICBsZXQgc2l0ZVJlYWR5Rm9ySGFuZG92ZXIgPSAwO1xuICAgIGxldCBzaXRlQ29tcGxldGVkID0gMDtcblxuICAgIGxldCBzaXRlRGVsYXllZCA9IDA7XG4gICAgbGV0IHNpdGVDcml0aWNhbCA9IDA7XG4gICAgbGV0IHNpdGVRQ1BlbmRpbmcgPSAwO1xuICAgIGxldCBzaXRlUUNSZWplY3RlZCA9IDA7XG5cbiAgICBsZXQgc2l0ZVRvdGFsUXR5ID0gMDtcbiAgICBsZXQgc2l0ZUtpdGNoZW5RdHkgPSAwO1xuICAgIGxldCBzaXRlV2FyZHJvYmVRdHkgPSAwO1xuICAgIGxldCBzaXRlVmFuaXR5UXR5ID0gMDtcblxuICAgIC8vIExvb3AgcGVyIHRvd2VyXG4gICAgZm9yIChjb25zdCBiIG9mIGJ1aWxkaW5ncykge1xuICAgICAgY29uc3QgYXBhcnRtZW50c0NvdW50ID0gYi5hcGFydG1lbnRzLmxlbmd0aDtcbiAgICAgIGxldCBraXRjaGVuVW5pdHMgPSAwO1xuICAgICAgbGV0IHdhcmRyb2JlVW5pdHMgPSAwO1xuICAgICAgbGV0IHZhbml0eVVuaXRzID0gMDtcblxuICAgICAgbGV0IHN1bU1hdElud2FyZCA9IDAuMDtcbiAgICAgIGxldCBzdW1LaXRjaGVuQ29tcCA9IDAuMDtcbiAgICAgIGxldCBzdW1XYXJkcm9iZUNvbXAgPSAwLjA7XG4gICAgICBsZXQgc3VtVmFuaXR5Q29tcCA9IDAuMDtcbiAgICAgIGxldCBzdW1PdmVyYWxsQ29tcCA9IDAuMDtcblxuICAgICAgbGV0IG5vdFN0YXJ0ZWRDb3VudCA9IDA7XG4gICAgICBsZXQgbWF0SW53YXJkUmVhZHlDb3VudCA9IDA7XG4gICAgICBsZXQgZXhlY3V0aW9uSW5Qcm9ncmVzc0NvdW50ID0gMDtcbiAgICAgIGxldCByZWFkeUZvckhhbmRvdmVyQ291bnQgPSAwO1xuICAgICAgbGV0IGNvbXBsZXRlZENvdW50ID0gMDtcblxuICAgICAgbGV0IGRlbGF5ZWRDb3VudCA9IDA7XG4gICAgICBsZXQgY3JpdGljYWxDb3VudCA9IDA7XG4gICAgICBsZXQgcWNQZW5kaW5nQ291bnQgPSAwO1xuICAgICAgbGV0IHFjUmVqZWN0ZWRDb3VudCA9IDA7XG5cbiAgICAgIGxldCB0b3RhbFF0eSA9IDA7XG4gICAgICBsZXQga2l0Y2hlblF0eSA9IDA7XG4gICAgICBsZXQgd2FyZHJvYmVRdHkgPSAwO1xuICAgICAgbGV0IHZhbml0eVF0eSA9IDA7XG5cbiAgICAgIGZvciAoY29uc3QgYXB0IG9mIGIuYXBhcnRtZW50cykge1xuICAgICAgICBjb25zdCBrUXR5ID0gYXB0LmtpdGNoZW5RdHkgfHwgMDtcbiAgICAgICAgY29uc3Qgd1F0eSA9IGFwdC53YXJkcm9iZVF0eSB8fCAwO1xuICAgICAgICBjb25zdCB2UXR5ID0gYXB0LnZhbml0eVF0eSB8fCAwO1xuICAgICAgICBjb25zdCB0UXR5ID0ga1F0eSArIHdRdHkgKyB2UXR5O1xuXG4gICAgICAgIGtpdGNoZW5Vbml0cyArPSBrUXR5O1xuICAgICAgICB3YXJkcm9iZVVuaXRzICs9IHdRdHk7XG4gICAgICAgIHZhbml0eVVuaXRzICs9IHZRdHk7XG5cbiAgICAgICAgdG90YWxRdHkgKz0gdFF0eTtcbiAgICAgICAga2l0Y2hlblF0eSArPSBrUXR5O1xuICAgICAgICB3YXJkcm9iZVF0eSArPSB3UXR5O1xuICAgICAgICB2YW5pdHlRdHkgKz0gdlF0eTtcblxuICAgICAgICAvLyBDdW11bGF0aXZlIHdlaWdodGVkIHByb2dyZXNzIHN1bXNcbiAgICAgICAgc3VtTWF0SW53YXJkICs9IChhcHQubWF0ZXJpYWxJbndhcmRQY3QgfHwgMC4wKSAqIHRRdHk7XG4gICAgICAgIHN1bUtpdGNoZW5Db21wICs9IChhcHQua2l0Y2hlbkNvbXBsZXRpb25QY3QgfHwgMC4wKSAqIGtRdHk7XG4gICAgICAgIHN1bVdhcmRyb2JlQ29tcCArPSAoYXB0LndhcmRyb2JlQ29tcGxldGlvblBjdCB8fCAwLjApICogd1F0eTtcbiAgICAgICAgc3VtVmFuaXR5Q29tcCArPSAoYXB0LnZhbml0eUNvbXBsZXRpb25QY3QgfHwgMC4wKSAqIHZRdHk7XG4gICAgICAgIHN1bU92ZXJhbGxDb21wICs9IChhcHQub3ZlcmFsbENvbXBsZXRpb25QY3QgfHwgMC4wKSAqIHRRdHk7XG5cbiAgICAgICAgLy8gU3RhdHVzIGdyb3VwaW5nc1xuICAgICAgICBpZiAoYXB0LmFwYXJ0bWVudFN0YXR1cyA9PT0gXCJOb3QgU3RhcnRlZFwiKSB7XG4gICAgICAgICAgbm90U3RhcnRlZENvdW50Kys7XG4gICAgICAgIH0gZWxzZSBpZiAoYXB0LmFwYXJ0bWVudFN0YXR1cyA9PT0gXCJNYXRlcmlhbCBJbndhcmRcIiB8fCBhcHQuYXBhcnRtZW50U3RhdHVzID09PSBcIk1hdGVyaWFsIFJlYWR5XCIpIHtcbiAgICAgICAgICBtYXRJbndhcmRSZWFkeUNvdW50Kys7XG4gICAgICAgIH0gZWxzZSBpZiAoYXB0LmFwYXJ0bWVudFN0YXR1cyA9PT0gXCJFeGVjdXRpb24gSW4gUHJvZ3Jlc3NcIikge1xuICAgICAgICAgIGV4ZWN1dGlvbkluUHJvZ3Jlc3NDb3VudCsrO1xuICAgICAgICB9IGVsc2UgaWYgKGFwdC5hcGFydG1lbnRTdGF0dXMgPT09IFwiUmVhZHkgZm9yIEhhbmRvdmVyXCIpIHtcbiAgICAgICAgICByZWFkeUZvckhhbmRvdmVyQ291bnQrKztcbiAgICAgICAgfSBlbHNlIGlmIChhcHQuYXBhcnRtZW50U3RhdHVzID09PSBcIkNvbXBsZXRlZFwiKSB7XG4gICAgICAgICAgY29tcGxldGVkQ291bnQrKztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEhlYWx0aCBpbmRpY2F0b3JzXG4gICAgICAgIGlmIChhcHQuaGVhbHRoID09PSBcIkRlbGF5ZWRcIikgZGVsYXllZENvdW50Kys7XG4gICAgICAgIGlmIChhcHQuaGVhbHRoID09PSBcIkNyaXRpY2FsXCIpIGNyaXRpY2FsQ291bnQrKztcblxuICAgICAgICAvLyBRQyBHYXRlIGNoZWNrcG9pbnRzXG4gICAgICAgIGlmIChhcHQuaGFuZG92ZXJBcHByb3ZhbFN0YXR1cyA9PT0gXCJRQyBQZW5kaW5nXCIpIHFjUGVuZGluZ0NvdW50Kys7XG4gICAgICAgIGlmIChhcHQuaGFuZG92ZXJBcHByb3ZhbFN0YXR1cyA9PT0gXCJRQyBSZWplY3RlZFwiKSBxY1JlamVjdGVkQ291bnQrKztcbiAgICAgIH1cblxuICAgICAgLy8gQWRkIHRvIHNpdGUgdG90YWxzXG4gICAgICBzaXRlS2l0Y2hlblVuaXRzICs9IGtpdGNoZW5Vbml0cztcbiAgICAgIHNpdGVXYXJkcm9iZVVuaXRzICs9IHdhcmRyb2JlVW5pdHM7XG4gICAgICBzaXRlVmFuaXR5VW5pdHMgKz0gdmFuaXR5VW5pdHM7XG5cbiAgICAgIHNpdGVTdW1NYXRJbndhcmQgKz0gc3VtTWF0SW53YXJkO1xuICAgICAgc2l0ZVN1bUtpdGNoZW5Db21wICs9IHN1bUtpdGNoZW5Db21wO1xuICAgICAgc2l0ZVN1bVdhcmRyb2JlQ29tcCArPSBzdW1XYXJkcm9iZUNvbXA7XG4gICAgICBzaXRlU3VtVmFuaXR5Q29tcCArPSBzdW1WYW5pdHlDb21wO1xuICAgICAgc2l0ZVN1bU92ZXJhbGxDb21wICs9IHN1bU92ZXJhbGxDb21wO1xuXG4gICAgICBzaXRlTm90U3RhcnRlZCArPSBub3RTdGFydGVkQ291bnQ7XG4gICAgICBzaXRlTWF0SW53YXJkUmVhZHkgKz0gbWF0SW53YXJkUmVhZHlDb3VudDtcbiAgICAgIHNpdGVFeGVjdXRpb25JblByb2dyZXNzICs9IGV4ZWN1dGlvbkluUHJvZ3Jlc3NDb3VudDtcbiAgICAgIHNpdGVSZWFkeUZvckhhbmRvdmVyICs9IHJlYWR5Rm9ySGFuZG92ZXJDb3VudDtcbiAgICAgIHNpdGVDb21wbGV0ZWQgKz0gY29tcGxldGVkQ291bnQ7XG5cbiAgICAgIHNpdGVEZWxheWVkICs9IGRlbGF5ZWRDb3VudDtcbiAgICAgIHNpdGVDcml0aWNhbCArPSBjcml0aWNhbENvdW50O1xuICAgICAgc2l0ZVFDUGVuZGluZyArPSBxY1BlbmRpbmdDb3VudDtcbiAgICAgIHNpdGVRQ1JlamVjdGVkICs9IHFjUmVqZWN0ZWRDb3VudDtcblxuICAgICAgc2l0ZVRvdGFsUXR5ICs9IHRvdGFsUXR5O1xuICAgICAgc2l0ZUtpdGNoZW5RdHkgKz0ga2l0Y2hlblF0eTtcbiAgICAgIHNpdGVXYXJkcm9iZVF0eSArPSB3YXJkcm9iZVF0eTtcbiAgICAgIHNpdGVWYW5pdHlRdHkgKz0gdmFuaXR5UXR5O1xuXG4gICAgICAvLyBDYWxjdWxhdGUgdG93ZXItbGV2ZWwgd2VpZ2h0ZWQgYXZlcmFnZXNcbiAgICAgIGNvbnN0IG1hdGVyaWFsSW53YXJkUGN0ID0gdG90YWxRdHkgPiAwID8gKHN1bU1hdElud2FyZCAvIHRvdGFsUXR5KSA6IDAuMDtcbiAgICAgIGNvbnN0IGtpdGNoZW5Db21wbGV0aW9uUGN0ID0ga2l0Y2hlblF0eSA+IDAgPyAoc3VtS2l0Y2hlbkNvbXAgLyBraXRjaGVuUXR5KSA6IDAuMDtcbiAgICAgIGNvbnN0IHdhcmRyb2JlQ29tcGxldGlvblBjdCA9IHdhcmRyb2JlUXR5ID4gMCA/IChzdW1XYXJkcm9iZUNvbXAgLyB3YXJkcm9iZVF0eSkgOiAwLjA7XG4gICAgICBjb25zdCB2YW5pdHlDb21wbGV0aW9uUGN0ID0gdmFuaXR5UXR5ID4gMCA/IChzdW1WYW5pdHlDb21wIC8gdmFuaXR5UXR5KSA6IDAuMDtcbiAgICAgIGNvbnN0IG92ZXJhbGxDb21wbGV0aW9uUGN0ID0gdG90YWxRdHkgPiAwID8gKHN1bU92ZXJhbGxDb21wIC8gdG90YWxRdHkpIDogMC4wO1xuXG4gICAgICAvLyBFdmFsdWF0ZSBIZWFsdGhcbiAgICAgIGxldCBoZWFsdGggPSBcIldhdGNoXCI7XG4gICAgICBpZiAoYXBhcnRtZW50c0NvdW50ID09PSAwKSB7XG4gICAgICAgIGhlYWx0aCA9IFwiTm8gRGF0YVwiO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgaGFzQ3JpdGljYWxBcHQgPSBiLmFwYXJ0bWVudHMuc29tZShhcHQgPT4gXG4gICAgICAgICAgYXB0LmhhbmRvdmVyQXBwcm92YWxTdGF0dXMgPT09IFwiUUMgUmVqZWN0ZWRcIiB8fCBhcHQuaGVhbHRoID09PSBcIkNyaXRpY2FsXCJcbiAgICAgICAgKTtcbiAgICAgICAgaWYgKGhhc0NyaXRpY2FsQXB0KSB7XG4gICAgICAgICAgaGVhbHRoID0gXCJDcml0aWNhbFwiO1xuICAgICAgICB9IGVsc2UgaWYgKGRlbGF5ZWRDb3VudCA+IDEwKSB7XG4gICAgICAgICAgaGVhbHRoID0gXCJEZWxheWVkXCI7XG4gICAgICAgIH0gZWxzZSBpZiAob3ZlcmFsbENvbXBsZXRpb25QY3QgPj0gKGIuZXhjZWxsZW50VGhyZXNob2xkID8/IDAuOSkpIHtcbiAgICAgICAgICBoZWFsdGggPSBcIkV4Y2VsbGVudFwiO1xuICAgICAgICB9IGVsc2UgaWYgKG92ZXJhbGxDb21wbGV0aW9uUGN0ID49IChiLmdvb2RUaHJlc2hvbGQgPz8gMC43NSkpIHtcbiAgICAgICAgICBoZWFsdGggPSBcIkdvb2RcIjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBoZWFsdGggPSBcIldhdGNoXCI7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdG93ZXJTdW1tYXJ5LnB1c2goe1xuICAgICAgICBpZDogYi5pZCxcbiAgICAgICAgdG93ZXI6IGIubmFtZSxcbiAgICAgICAgYXBhcnRtZW50czogYXBhcnRtZW50c0NvdW50LFxuICAgICAgICBraXRjaGVuVW5pdHMsXG4gICAgICAgIHdhcmRyb2JlVW5pdHMsXG4gICAgICAgIHZhbml0eVVuaXRzLFxuICAgICAgICBtYXRlcmlhbElud2FyZFBjdCxcbiAgICAgICAga2l0Y2hlbkNvbXBsZXRpb25QY3QsXG4gICAgICAgIHdhcmRyb2JlQ29tcGxldGlvblBjdCxcbiAgICAgICAgdmFuaXR5Q29tcGxldGlvblBjdCxcbiAgICAgICAgb3ZlcmFsbENvbXBsZXRpb25QY3QsXG4gICAgICAgIG5vdFN0YXJ0ZWQ6IG5vdFN0YXJ0ZWRDb3VudCxcbiAgICAgICAgbWF0ZXJpYWxJbndhcmRSZWFkeTogbWF0SW53YXJkUmVhZHlDb3VudCxcbiAgICAgICAgZXhlY3V0aW9uSW5Qcm9ncmVzczogZXhlY3V0aW9uSW5Qcm9ncmVzc0NvdW50LFxuICAgICAgICByZWFkeUZvckhhbmRvdmVyOiByZWFkeUZvckhhbmRvdmVyQ291bnQsXG4gICAgICAgIGNvbXBsZXRlZDogY29tcGxldGVkQ291bnQsXG4gICAgICAgIGRlbGF5ZWRBcGFydG1lbnRzOiBkZWxheWVkQ291bnQsXG4gICAgICAgIGNyaXRpY2FsQXBhcnRtZW50czogY3JpdGljYWxDb3VudCxcbiAgICAgICAgaGVhbHRoLFxuICAgICAgICBxY1BlbmRpbmc6IHFjUGVuZGluZ0NvdW50LFxuICAgICAgICBxY1JlamVjdGVkOiBxY1JlamVjdGVkQ291bnRcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIFNpdGUgTGV2ZWwgb3ZlcmFsbCBhdmVyYWdlc1xuICAgIGNvbnN0IHNpdGVNYXRlcmlhbElud2FyZFBjdCA9IHNpdGVUb3RhbFF0eSA+IDAgPyAoc2l0ZVN1bU1hdElud2FyZCAvIHNpdGVUb3RhbFF0eSkgOiAwLjA7XG4gICAgY29uc3Qgc2l0ZUtpdGNoZW5Db21wbGV0aW9uUGN0ID0gc2l0ZUtpdGNoZW5RdHkgPiAwID8gKHNpdGVTdW1LaXRjaGVuQ29tcCAvIHNpdGVLaXRjaGVuUXR5KSA6IDAuMDtcbiAgICBjb25zdCBzaXRlV2FyZHJvYmVDb21wbGV0aW9uUGN0ID0gc2l0ZVdhcmRyb2JlUXR5ID4gMCA/IChzaXRlU3VtV2FyZHJvYmVDb21wIC8gc2l0ZVdhcmRyb2JlUXR5KSA6IDAuMDtcbiAgICBjb25zdCBzaXRlVmFuaXR5Q29tcGxldGlvblBjdCA9IHNpdGVWYW5pdHlRdHkgPiAwID8gKHNpdGVTdW1WYW5pdHlDb21wIC8gc2l0ZVZhbml0eVF0eSkgOiAwLjA7XG4gICAgY29uc3Qgc2l0ZU92ZXJhbGxDb21wbGV0aW9uUGN0ID0gc2l0ZVRvdGFsUXR5ID4gMCA/IChzaXRlU3VtT3ZlcmFsbENvbXAgLyBzaXRlVG90YWxRdHkpIDogMC4wO1xuXG4gICAgbGV0IHNpdGVIZWFsdGggPSBcIldhdGNoXCI7XG4gICAgaWYgKHNpdGVBcGFydG1lbnRzID09PSAwKSB7XG4gICAgICBzaXRlSGVhbHRoID0gXCJObyBEYXRhXCI7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGhhc0NyaXRpY2FsQXB0ID0gYWxsQXBhcnRtZW50cy5zb21lKGFwdCA9PiBcbiAgICAgICAgYXB0LmhhbmRvdmVyQXBwcm92YWxTdGF0dXMgPT09IFwiUUMgUmVqZWN0ZWRcIiB8fCBhcHQuaGVhbHRoID09PSBcIkNyaXRpY2FsXCJcbiAgICAgICk7XG4gICAgICBpZiAoaGFzQ3JpdGljYWxBcHQpIHtcbiAgICAgICAgc2l0ZUhlYWx0aCA9IFwiQ3JpdGljYWxcIjtcbiAgICAgIH0gZWxzZSBpZiAoc2l0ZURlbGF5ZWQgPiAyNSkgeyAvLyBTaXRlIGxldmVsIHRocmVzaG9sZCBpcyA+IDI1XG4gICAgICAgIHNpdGVIZWFsdGggPSBcIkRlbGF5ZWRcIjtcbiAgICAgIH0gZWxzZSBpZiAoc2l0ZU92ZXJhbGxDb21wbGV0aW9uUGN0ID49IDAuOSkge1xuICAgICAgICBzaXRlSGVhbHRoID0gXCJFeGNlbGxlbnRcIjtcbiAgICAgIH0gZWxzZSBpZiAoc2l0ZU92ZXJhbGxDb21wbGV0aW9uUGN0ID49IDAuNzUpIHtcbiAgICAgICAgc2l0ZUhlYWx0aCA9IFwiR29vZFwiO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2l0ZUhlYWx0aCA9IFwiV2F0Y2hcIjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBBcHBlbmQgVE9UQUwvU0lURSByb3dcbiAgICB0b3dlclN1bW1hcnkucHVzaCh7XG4gICAgICBpZDogXCJzaXRlLXRvdGFsXCIsXG4gICAgICB0b3dlcjogXCJUT1RBTCAvIFNJVEVcIixcbiAgICAgIGFwYXJ0bWVudHM6IHNpdGVBcGFydG1lbnRzLFxuICAgICAga2l0Y2hlblVuaXRzOiBzaXRlS2l0Y2hlblVuaXRzLFxuICAgICAgd2FyZHJvYmVVbml0czogc2l0ZVdhcmRyb2JlVW5pdHMsXG4gICAgICB2YW5pdHlVbml0czogc2l0ZVZhbml0eVVuaXRzLFxuICAgICAgbWF0ZXJpYWxJbndhcmRQY3Q6IHNpdGVNYXRlcmlhbElud2FyZFBjdCxcbiAgICAgIGtpdGNoZW5Db21wbGV0aW9uUGN0OiBzaXRlS2l0Y2hlbkNvbXBsZXRpb25QY3QsXG4gICAgICB3YXJkcm9iZUNvbXBsZXRpb25QY3Q6IHNpdGVXYXJkcm9iZUNvbXBsZXRpb25QY3QsXG4gICAgICB2YW5pdHlDb21wbGV0aW9uUGN0OiBzaXRlVmFuaXR5Q29tcGxldGlvblBjdCxcbiAgICAgIG92ZXJhbGxDb21wbGV0aW9uUGN0OiBzaXRlT3ZlcmFsbENvbXBsZXRpb25QY3QsXG4gICAgICBub3RTdGFydGVkOiBzaXRlTm90U3RhcnRlZCxcbiAgICAgIG1hdGVyaWFsSW53YXJkUmVhZHk6IHNpdGVNYXRJbndhcmRSZWFkeSxcbiAgICAgIGV4ZWN1dGlvbkluUHJvZ3Jlc3M6IHNpdGVFeGVjdXRpb25JblByb2dyZXNzLFxuICAgICAgcmVhZHlGb3JIYW5kb3Zlcjogc2l0ZVJlYWR5Rm9ySGFuZG92ZXIsXG4gICAgICBjb21wbGV0ZWQ6IHNpdGVDb21wbGV0ZWQsXG4gICAgICBkZWxheWVkQXBhcnRtZW50czogc2l0ZURlbGF5ZWQsXG4gICAgICBjcml0aWNhbEFwYXJ0bWVudHM6IHNpdGVDcml0aWNhbCxcbiAgICAgIGhlYWx0aDogc2l0ZUhlYWx0aCxcbiAgICAgIHFjUGVuZGluZzogc2l0ZVFDUGVuZGluZyxcbiAgICAgIHFjUmVqZWN0ZWQ6IHNpdGVRQ1JlamVjdGVkXG4gICAgfSk7XG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyBCKSBUeXBlIFN1bW1hcnkgUm9sbHVwXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgY29uc3QgdHlwZVN1bW1hcnkgPSBbXTtcbiAgICBjb25zdCB1bml0VHlwZVJhdGVzID0gb3JkZXIuYmlsbGluZ1NldHVwPy51bml0VHlwZVJhdGVzIHx8IFtdO1xuXG4gICAgZm9yIChjb25zdCB1dCBvZiB1bml0VHlwZVJhdGVzKSB7XG4gICAgICBjb25zdCB0eXBlQ29kZSA9IHV0LnR5cGVDb2RlO1xuICAgICAgY29uc3QgcHJvZHVjdCA9IHV0LnByb2R1Y3Q7IC8vIFwiS2l0Y2hlblwiIHwgXCJXYXJkcm9iZVwiIHwgXCJWYW5pdHlcIlxuICAgICAgY29uc3QgdHlwZU5hbWUgPSB1dC50eXBlTmFtZTtcbiAgICAgIGNvbnN0IGNsaWVudFJhdGUgPSB1dC5jbGllbnRSYXRlIHx8IDAuMDtcblxuICAgICAgLy8gRmlsdGVyIGFwYXJ0bWVudHMgbWF0Y2hpbmcgdGhlIHR5cGUgY29kZVxuICAgICAgbGV0IG1hdGNoaW5nQXB0cyA9IFtdO1xuICAgICAgbGV0IHF0eUZpZWxkID0gXCJraXRjaGVuUXR5XCI7XG4gICAgICBsZXQgdHlwZUZpZWxkID0gXCJraXRjaGVuVHlwZVwiO1xuICAgICAgbGV0IGNvbXBsZXRpb25GaWVsZCA9IFwia2l0Y2hlbkNvbXBsZXRpb25QY3RcIjtcbiAgICAgIGxldCBxY0dhdGVGaWVsZCA9IFwia2l0Y2hlblFDR2F0ZVwiO1xuICAgICAgbGV0IGhhbmRlZE92ZXJGaWVsZCA9IFwia2l0Y2hlbkhhbmRlZE92ZXJcIjtcblxuICAgICAgaWYgKHByb2R1Y3QgPT09IFwiS2l0Y2hlblwiKSB7XG4gICAgICAgIHF0eUZpZWxkID0gXCJraXRjaGVuUXR5XCI7XG4gICAgICAgIHR5cGVGaWVsZCA9IFwia2l0Y2hlblR5cGVcIjtcbiAgICAgICAgY29tcGxldGlvbkZpZWxkID0gXCJraXRjaGVuQ29tcGxldGlvblBjdFwiO1xuICAgICAgICBxY0dhdGVGaWVsZCA9IFwia2l0Y2hlblFDR2F0ZVwiO1xuICAgICAgICBoYW5kZWRPdmVyRmllbGQgPSBcImtpdGNoZW5IYW5kZWRPdmVyXCI7XG4gICAgICB9IGVsc2UgaWYgKHByb2R1Y3QgPT09IFwiV2FyZHJvYmVcIikge1xuICAgICAgICBxdHlGaWVsZCA9IFwid2FyZHJvYmVRdHlcIjtcbiAgICAgICAgdHlwZUZpZWxkID0gXCJ3YXJkcm9iZVR5cGVcIjtcbiAgICAgICAgY29tcGxldGlvbkZpZWxkID0gXCJ3YXJkcm9iZUNvbXBsZXRpb25QY3RcIjtcbiAgICAgICAgcWNHYXRlRmllbGQgPSBcIndhcmRyb2JlUUNHYXRlXCI7XG4gICAgICAgIGhhbmRlZE92ZXJGaWVsZCA9IFwid2FyZHJvYmVIYW5kZWRPdmVyXCI7XG4gICAgICB9IGVsc2UgaWYgKHByb2R1Y3QgPT09IFwiVmFuaXR5XCIpIHtcbiAgICAgICAgcXR5RmllbGQgPSBcInZhbml0eVF0eVwiO1xuICAgICAgICB0eXBlRmllbGQgPSBcInZhbml0eVR5cGVcIjtcbiAgICAgICAgY29tcGxldGlvbkZpZWxkID0gXCJ2YW5pdHlDb21wbGV0aW9uUGN0XCI7XG4gICAgICAgIHFjR2F0ZUZpZWxkID0gXCJ2YW5pdHlRQ0dhdGVcIjtcbiAgICAgICAgaGFuZGVkT3ZlckZpZWxkID0gXCJ2YW5pdHlIYW5kZWRPdmVyXCI7XG4gICAgICB9XG5cbiAgICAgIGxldCB1bml0cyA9IDA7XG4gICAgICBsZXQgc3VtTWF0SW53YXJkVHlwZSA9IDAuMDtcbiAgICAgIGxldCBzdW1FeGVjVHlwZSA9IDAuMDtcbiAgICAgIGxldCBhcHByb3ZlZEhhbmRlZE92ZXJDb3VudCA9IDA7XG5cbiAgICAgIGZvciAoY29uc3QgYXB0IG9mIGFsbEFwYXJ0bWVudHMpIHtcbiAgICAgICAgY29uc3QgdHlwZVN0ciA9IGFwdFt0eXBlRmllbGRdO1xuICAgICAgICBpZiAoIXR5cGVTdHIpIGNvbnRpbnVlO1xuXG4gICAgICAgIGxldCBxdHkgPSAwO1xuICAgICAgICBpZiAodHlwZVN0ci5zdGFydHNXaXRoKCdbJykpIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgbGlzdCA9IEpTT04ucGFyc2UodHlwZVN0cik7XG4gICAgICAgICAgICBjb25zdCBmb3VuZCA9IGxpc3QuZmluZChpdGVtID0+IGl0ZW0udHlwZSA9PT0gdHlwZUNvZGUpO1xuICAgICAgICAgICAgaWYgKGZvdW5kKSBxdHkgPSBmb3VuZC5xdHkgfHwgMDtcbiAgICAgICAgICB9IGNhdGNoIChlKSB7fVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmICh0eXBlU3RyID09PSB0eXBlQ29kZSkge1xuICAgICAgICAgICAgcXR5ID0gYXB0W3F0eUZpZWxkXSB8fCAwO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChxdHkgPiAwKSB7XG4gICAgICAgICAgdW5pdHMgKz0gcXR5O1xuXG4gICAgICAgICAgLy8gV2VpZ2h0ZWQgTWF0ZXJpYWwgYW5kIEV4ZWN1dGlvbiBhdmVyYWdlc1xuICAgICAgICAgIHN1bU1hdElud2FyZFR5cGUgKz0gKGFwdC5tYXRlcmlhbElud2FyZFBjdCB8fCAwLjApICogcXR5O1xuICAgICAgICAgIHN1bUV4ZWNUeXBlICs9IChhcHRbY29tcGxldGlvbkZpZWxkXSB8fCAwLjApICogcXR5O1xuXG4gICAgICAgICAgLy8gQ2hlY2sgaWYgaGFuZGVkIG92ZXIgQU5EIGFwcHJvdmVkXG4gICAgICAgICAgY29uc3QgaXNBcHByb3ZlZCA9IGFwdFtxY0dhdGVGaWVsZF0gPT09IFwiQXBwcm92ZWRcIjtcbiAgICAgICAgICBpZiAoaXNBcHByb3ZlZCkge1xuICAgICAgICAgICAgY29uc3QgaGFuZG92ZXJQY3QgPSAoYXB0W2hhbmRlZE92ZXJGaWVsZF0gfHwgMCkgLyAxMDAuMDtcbiAgICAgICAgICAgIGFwcHJvdmVkSGFuZGVkT3ZlckNvdW50ICs9IHF0eSAqIE1hdGgubWluKDEuMCwgTWF0aC5tYXgoMC4wLCBoYW5kb3ZlclBjdCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjb25zdCBtYXRlcmlhbFJlY2VpdmVkUGN0ID0gdW5pdHMgPiAwID8gKHN1bU1hdElud2FyZFR5cGUgLyB1bml0cykgOiAwLjA7XG4gICAgICBjb25zdCBleGVjdXRpb25QY3QgPSB1bml0cyA+IDAgPyAoc3VtRXhlY1R5cGUgLyB1bml0cykgOiAwLjA7XG4gICAgICBjb25zdCBxY0hhbmRvdmVyUGN0ID0gdW5pdHMgPiAwID8gKGFwcHJvdmVkSGFuZGVkT3ZlckNvdW50IC8gdW5pdHMpIDogMC4wO1xuICAgICAgY29uc3QgY2xpZW50Q29udHJhY3RWYWx1ZSA9IHVuaXRzICogY2xpZW50UmF0ZTtcblxuICAgICAgdHlwZVN1bW1hcnkucHVzaCh7XG4gICAgICAgIHR5cGVDb2RlLFxuICAgICAgICBwcm9kdWN0LFxuICAgICAgICB0eXBlTmFtZSxcbiAgICAgICAgdW5pdHMsXG4gICAgICAgIG1hdGVyaWFsUmVjZWl2ZWRQY3QsXG4gICAgICAgIGV4ZWN1dGlvblBjdCxcbiAgICAgICAgcWNIYW5kb3ZlclBjdCxcbiAgICAgICAgY2xpZW50Q29udHJhY3RWYWx1ZVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8gQykgU3RhZ2UgQW5hbHlzaXMgTWF0cml4XG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgY29uc3Qgc3RhZ2VBbmFseXNpcyA9IHtcbiAgICAgIGhlYWRlcnM6IFsuLi5idWlsZGluZ3MubWFwKGIgPT4gYi5uYW1lKSwgXCJTaXRlIEF2ZXJhZ2VcIl0sXG4gICAgICByb3dzOiBbXVxuICAgIH07XG5cbiAgICAvLyBQcm9jZXNzIE1hdGVyaWFsIGl0ZW1zXG4gICAgZm9yIChjb25zdCBpdGVtIG9mIG1hdGVyaWFsSXRlbXMpIHtcbiAgICAgIGNvbnN0IHZhbHVlcyA9IFtdO1xuICAgICAgbGV0IHRvdGFsRmllbGRTdW0gPSAwO1xuICAgICAgbGV0IHRvdGFsUXR5U3VtID0gMDtcblxuICAgICAgZm9yIChjb25zdCBiIG9mIGJ1aWxkaW5ncykge1xuICAgICAgICBsZXQgZmllbGRTdW0gPSAwO1xuICAgICAgICBsZXQgcXR5U3VtID0gMDtcblxuICAgICAgICBmb3IgKGNvbnN0IGFwdCBvZiBiLmFwYXJ0bWVudHMpIHtcbiAgICAgICAgICBjb25zdCBxdHkgPSBhcHRbaXRlbS5xdHlLZXldIHx8IDA7XG4gICAgICAgICAgZmllbGRTdW0gKz0gKGFwdFtpdGVtLmtleV0gfHwgMCkgKiBxdHk7XG4gICAgICAgICAgcXR5U3VtICs9IHF0eTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRvdGFsRmllbGRTdW0gKz0gZmllbGRTdW07XG4gICAgICAgIHRvdGFsUXR5U3VtICs9IHF0eVN1bTtcblxuICAgICAgICBjb25zdCB2YWwgPSBxdHlTdW0gPiAwID8gKGZpZWxkU3VtIC8gcXR5U3VtKSAvIDEwMC4wIDogMC4wO1xuICAgICAgICB2YWx1ZXMucHVzaCh2YWwpO1xuICAgICAgfVxuXG4gICAgICAvLyBBcHBlbmQgU2l0ZSBBdmVyYWdlXG4gICAgICBjb25zdCBzaXRlVmFsID0gdG90YWxRdHlTdW0gPiAwID8gKHRvdGFsRmllbGRTdW0gLyB0b3RhbFF0eVN1bSkgLyAxMDAuMCA6IDAuMDtcbiAgICAgIHZhbHVlcy5wdXNoKHNpdGVWYWwpO1xuXG4gICAgICBzdGFnZUFuYWx5c2lzLnJvd3MucHVzaCh7XG4gICAgICAgIGNhdGVnb3J5OiBcIk1hdGVyaWFsIC0gXCIgKyBpdGVtLnByb2R1Y3QudG9VcHBlckNhc2UoKSxcbiAgICAgICAgbGFiZWw6IGl0ZW0ubGFiZWwsXG4gICAgICAgIGtleTogaXRlbS5rZXksXG4gICAgICAgIHZhbHVlc1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gUHJvY2VzcyBFeGVjdXRpb24gaXRlbXNcbiAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgZXhlY3V0aW9uSXRlbXMpIHtcbiAgICAgIGNvbnN0IHZhbHVlcyA9IFtdO1xuICAgICAgbGV0IHRvdGFsRmllbGRTdW0gPSAwO1xuICAgICAgbGV0IHRvdGFsUXR5U3VtID0gMDtcblxuICAgICAgZm9yIChjb25zdCBiIG9mIGJ1aWxkaW5ncykge1xuICAgICAgICBsZXQgZmllbGRTdW0gPSAwO1xuICAgICAgICBsZXQgcXR5U3VtID0gMDtcblxuICAgICAgICBmb3IgKGNvbnN0IGFwdCBvZiBiLmFwYXJ0bWVudHMpIHtcbiAgICAgICAgICBjb25zdCBxdHkgPSBhcHRbaXRlbS5xdHlLZXldIHx8IDA7XG4gICAgICAgICAgZmllbGRTdW0gKz0gKGFwdFtpdGVtLmtleV0gfHwgMCkgKiBxdHk7XG4gICAgICAgICAgcXR5U3VtICs9IHF0eTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRvdGFsRmllbGRTdW0gKz0gZmllbGRTdW07XG4gICAgICAgIHRvdGFsUXR5U3VtICs9IHF0eVN1bTtcblxuICAgICAgICBjb25zdCB2YWwgPSBxdHlTdW0gPiAwID8gKGZpZWxkU3VtIC8gcXR5U3VtKSAvIDEwMC4wIDogMC4wO1xuICAgICAgICB2YWx1ZXMucHVzaCh2YWwpO1xuICAgICAgfVxuXG4gICAgICAvLyBBcHBlbmQgU2l0ZSBBdmVyYWdlXG4gICAgICBjb25zdCBzaXRlVmFsID0gdG90YWxRdHlTdW0gPiAwID8gKHRvdGFsRmllbGRTdW0gLyB0b3RhbFF0eVN1bSkgLyAxMDAuMCA6IDAuMDtcbiAgICAgIHZhbHVlcy5wdXNoKHNpdGVWYWwpO1xuXG4gICAgICBzdGFnZUFuYWx5c2lzLnJvd3MucHVzaCh7XG4gICAgICAgIGNhdGVnb3J5OiBcIkV4ZWN1dGlvbiAtIFwiICsgaXRlbS5wcm9kdWN0LnRvVXBwZXJDYXNlKCksXG4gICAgICAgIGxhYmVsOiBpdGVtLmxhYmVsLFxuICAgICAgICBrZXk6IGl0ZW0ua2V5LFxuICAgICAgICB2YWx1ZXNcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIE1ldGFkYXRhIEhlYWRlciBkZXRhaWxzIChmcm9tIGZpcnN0IHRvd2VyIHNldHRpbmdzIGFzIGZhbGxiYWNrLCBvciBvdmVyYWxsIG9yZGVyKVxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIGNvbnN0IGRlZmF1bHRCdWlsZGluZyA9IGJ1aWxkaW5nc1swXTtcbiAgICBjb25zdCBoZWFkZXJNZXRhZGF0YSA9IHtcbiAgICAgIHNpdGVOYW1lOiBkZWZhdWx0QnVpbGRpbmc/LnNpdGVOYW1lIHx8IFwiRGlvIEdyYWNlIE1haW4gU2l0ZVwiLFxuICAgICAgcmVwb3J0RGF0ZTogZGVmYXVsdEJ1aWxkaW5nPy5yZXBvcnREYXRlID8gbmV3IERhdGUoZGVmYXVsdEJ1aWxkaW5nLnJlcG9ydERhdGUpLnRvTG9jYWxlRGF0ZVN0cmluZygpIDogbmV3IERhdGUoKS50b0xvY2FsZURhdGVTdHJpbmcoKSxcbiAgICAgIHByb2plY3RNYW5hZ2VyOiBcIlAuIFNoYXJtYSAoU2l0ZSBNYW5hZ2VyKVwiLFxuICAgICAgY2xpZW50OiBcIkRpbyBHcmFjZSBEZXZlbG9wZXJzIEdyb3VwXCIsXG4gICAgICB0YXJnZXRDb21wbGV0aW9uOiBkZWZhdWx0QnVpbGRpbmc/LnJlcG9ydERhdGUgPyBuZXcgRGF0ZShuZXcgRGF0ZShkZWZhdWx0QnVpbGRpbmcucmVwb3J0RGF0ZSkuZ2V0VGltZSgpICsgMTgwICogMjQgKiA2MCAqIDYwICogMTAwMCkudG9Mb2NhbGVEYXRlU3RyaW5nKCkgOiBcIlRCRFwiLCAvLyBkZWZhdWx0IDYgbW9udGhzIHRhcmdldFxuICAgICAgcHJlcGFyZWRCeTogb3JkZXIuY3JlYXRlZEJ5Py5uYW1lIHx8IFwiU3lzdGVtIEF1dG9tYXRlZCBFUlBcIlxuICAgIH07XG5cbiAgICByZXR1cm4gcmVzLmpzb24oe1xuICAgICAgb3JkZXI6IHtcbiAgICAgICAgaWQ6IG9yZGVyLmlkLFxuICAgICAgICBvcmRlck51bWJlcjogb3JkZXIub3JkZXJOdW1iZXIsXG4gICAgICAgIGNyZWF0ZWRBdDogb3JkZXIuY3JlYXRlZEF0XG4gICAgICB9LFxuICAgICAgaGVhZGVyTWV0YWRhdGEsXG4gICAgICB0b3dlclN1bW1hcnksXG4gICAgICB0eXBlU3VtbWFyeSxcbiAgICAgIHN0YWdlQW5hbHlzaXNcbiAgICB9KTtcblxuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKCdHZXQgcHJvamVjdCBhbmFseXRpY3MgZXJyb3I6JywgZXJyKTtcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oeyBlcnJvcjogJ0ludGVybmFsIHNlcnZlciBlcnJvciBjYWxjdWxhdGluZyBwcm9qZWN0IGFuYWx5dGljcycgfSk7XG4gIH1cbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcaHBcXFxcRG93bmxvYWRzXFxcXERpbyBHcmFjZSAoMylcXFxcRGlvIEdyYWNlICgzKVxcXFxEaW8gR3JhY2VlXFxcXGJhY2tlbmRcXFxcc3JjXFxcXGNvbnRyb2xsZXJzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxocFxcXFxEb3dubG9hZHNcXFxcRGlvIEdyYWNlICgzKVxcXFxEaW8gR3JhY2UgKDMpXFxcXERpbyBHcmFjZWVcXFxcYmFja2VuZFxcXFxzcmNcXFxcY29udHJvbGxlcnNcXFxcdXNlckNvbnRyb2xsZXIuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL2hwL0Rvd25sb2Fkcy9EaW8lMjBHcmFjZSUyMCgzKS9EaW8lMjBHcmFjZSUyMCgzKS9EaW8lMjBHcmFjZWUvYmFja2VuZC9zcmMvY29udHJvbGxlcnMvdXNlckNvbnRyb2xsZXIuanNcIjtpbXBvcnQgeyBQcmlzbWFDbGllbnQgfSBmcm9tICdAcHJpc21hL2NsaWVudCc7XG5pbXBvcnQgYmNyeXB0IGZyb20gJ2JjcnlwdGpzJztcblxuY29uc3QgcHJpc21hID0gbmV3IFByaXNtYUNsaWVudCgpO1xuXG4vLyBMaXN0IGFsbCByZWdpc3RlcmVkIHVzZXJzIChST0xFX0Egb25seSlcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBsaXN0VXNlcnMocmVxLCByZXMpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCB1c2VycyA9IGF3YWl0IHByaXNtYS51c2VyLmZpbmRNYW55KHtcbiAgICAgIHNlbGVjdDoge1xuICAgICAgICBpZDogdHJ1ZSxcbiAgICAgICAgZW1haWw6IHRydWUsXG4gICAgICAgIG5hbWU6IHRydWUsXG4gICAgICAgIHJvbGU6IHRydWUsXG4gICAgICAgIHBlcm1pdHRlZFByb2plY3RzOiB0cnVlLFxuICAgICAgICBjcmVhdGVkQXQ6IHRydWVcbiAgICAgIH0sXG4gICAgICBvcmRlckJ5OiB7IGNyZWF0ZWRBdDogJ2Rlc2MnIH1cbiAgICB9KTtcbiAgICByZXR1cm4gcmVzLmpzb24odXNlcnMpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gbGlzdCB1c2VyczonLCBlcnIpO1xuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7IGVycm9yOiAnRmFpbGVkIHRvIHJldHJpZXZlIHVzZXJzJyB9KTtcbiAgfVxufVxuXG4vLyBDcmVhdGUgbmV3IGxvZ2luIHVzZXIgKFJPTEVfQSBvbmx5KVxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNyZWF0ZVVzZXIocmVxLCByZXMpIHtcbiAgY29uc3QgeyBlbWFpbCwgcGFzc3dvcmQsIG5hbWUsIHJvbGUsIHBlcm1pdHRlZFByb2plY3RzIH0gPSByZXEuYm9keTtcblxuICBpZiAoIWVtYWlsIHx8ICFwYXNzd29yZCB8fCAhbmFtZSkge1xuICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7IGVycm9yOiAnTmFtZSwgZW1haWwsIGFuZCBwYXNzd29yZCBhcmUgcmVxdWlyZWQuJyB9KTtcbiAgfVxuXG4gIGNvbnN0IG5vcm1hbGl6ZWRFbWFpbCA9IGVtYWlsLnRvTG93ZXJDYXNlKCkudHJpbSgpO1xuXG4gIC8vIFZhbGlkYXRlIHJvbGUgKGRlZmF1bHRzIHRvIFJPTEVfQyAtIFZpZXdlciAvIFJlYWQtT25seSBpZiBub3QgcHJvdmlkZWQgb3IgaW52YWxpZClcbiAgY29uc3QgYWxsb3dlZFJvbGVzID0gWydST0xFX0EnLCAnUk9MRV9CJywgJ1JPTEVfQycsICdST0xFX0QnXTtcbiAgY29uc3QgdXNlclJvbGUgPSBhbGxvd2VkUm9sZXMuaW5jbHVkZXMocm9sZSkgPyByb2xlIDogJ1JPTEVfQyc7XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBleGlzdGluZyA9IGF3YWl0IHByaXNtYS51c2VyLmZpbmRVbmlxdWUoe1xuICAgICAgd2hlcmU6IHsgZW1haWw6IG5vcm1hbGl6ZWRFbWFpbCB9XG4gICAgfSk7XG5cbiAgICBpZiAoZXhpc3RpbmcpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7IGVycm9yOiAnQSB1c2VyIHdpdGggdGhpcyBlbWFpbCBhZGRyZXNzIGFscmVhZHkgZXhpc3RzLicgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgcGFzc3dvcmRIYXNoID0gYXdhaXQgYmNyeXB0Lmhhc2gocGFzc3dvcmQsIDEwKTtcblxuICAgIGNvbnN0IG5ld1VzZXIgPSBhd2FpdCBwcmlzbWEudXNlci5jcmVhdGUoe1xuICAgICAgZGF0YToge1xuICAgICAgICBlbWFpbDogbm9ybWFsaXplZEVtYWlsLFxuICAgICAgICBwYXNzd29yZEhhc2gsXG4gICAgICAgIG5hbWU6IG5hbWUudHJpbSgpLFxuICAgICAgICByb2xlOiB1c2VyUm9sZSxcbiAgICAgICAgLy8gT25seSBST0xFX0QgKFZpZXdlciAyKSB1c2VzIHByb2plY3QgcmVzdHJpY3Rpb25zOyBjbGVhciBmb3IgYWxsIG90aGVyc1xuICAgICAgICBwZXJtaXR0ZWRQcm9qZWN0czogdXNlclJvbGUgPT09ICdST0xFX0QnID8gKHBlcm1pdHRlZFByb2plY3RzID8gU3RyaW5nKHBlcm1pdHRlZFByb2plY3RzKS50cmltKCkgOiAnJykgOiAnJ1xuICAgICAgfSxcbiAgICAgIHNlbGVjdDoge1xuICAgICAgICBpZDogdHJ1ZSxcbiAgICAgICAgZW1haWw6IHRydWUsXG4gICAgICAgIG5hbWU6IHRydWUsXG4gICAgICAgIHJvbGU6IHRydWUsXG4gICAgICAgIHBlcm1pdHRlZFByb2plY3RzOiB0cnVlLFxuICAgICAgICBjcmVhdGVkQXQ6IHRydWVcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMSkuanNvbih7XG4gICAgICBtZXNzYWdlOiAnVXNlciBjcmVhdGVkIHN1Y2Nlc3NmdWxseS4nLFxuICAgICAgdXNlcjogbmV3VXNlclxuICAgIH0pO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gY3JlYXRlIHVzZXI6JywgZXJyKTtcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oeyBlcnJvcjogJ0ZhaWxlZCB0byBjcmVhdGUgdXNlci4nIH0pO1xuICB9XG59XG5cbi8vIFVwZGF0ZSBsb2dpbiB1c2VyIChST0xFX0Egb25seSlcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB1cGRhdGVVc2VyKHJlcSwgcmVzKSB7XG4gIGNvbnN0IHsgdXNlcklkIH0gPSByZXEucGFyYW1zO1xuICBjb25zdCB7IGVtYWlsLCBwYXNzd29yZCwgbmFtZSwgcm9sZSwgcGVybWl0dGVkUHJvamVjdHMgfSA9IHJlcS5ib2R5O1xuXG4gIHRyeSB7XG4gICAgY29uc3QgZXhpc3RpbmcgPSBhd2FpdCBwcmlzbWEudXNlci5maW5kVW5pcXVlKHtcbiAgICAgIHdoZXJlOiB7IGlkOiB1c2VySWQgfVxuICAgIH0pO1xuXG4gICAgaWYgKCFleGlzdGluZykge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgZXJyb3I6ICdVc2VyIG5vdCBmb3VuZC4nIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IHVwZGF0ZURhdGEgPSB7fTtcbiAgICBpZiAoZW1haWwpIHtcbiAgICAgIGNvbnN0IG5vcm1hbGl6ZWRFbWFpbCA9IGVtYWlsLnRvTG93ZXJDYXNlKCkudHJpbSgpO1xuICAgICAgaWYgKG5vcm1hbGl6ZWRFbWFpbCAhPT0gZXhpc3RpbmcuZW1haWwpIHtcbiAgICAgICAgY29uc3QgZW1haWxDaGVjayA9IGF3YWl0IHByaXNtYS51c2VyLmZpbmRVbmlxdWUoe1xuICAgICAgICAgIHdoZXJlOiB7IGVtYWlsOiBub3JtYWxpemVkRW1haWwgfVxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKGVtYWlsQ2hlY2spIHtcbiAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oeyBlcnJvcjogJ0EgdXNlciB3aXRoIHRoaXMgZW1haWwgYWRkcmVzcyBhbHJlYWR5IGV4aXN0cy4nIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB1cGRhdGVEYXRhLmVtYWlsID0gbm9ybWFsaXplZEVtYWlsO1xuICAgIH1cblxuICAgIGlmIChuYW1lKSB1cGRhdGVEYXRhLm5hbWUgPSBuYW1lLnRyaW0oKTtcbiAgICBpZiAocm9sZSkge1xuICAgICAgY29uc3QgYWxsb3dlZFJvbGVzID0gWydST0xFX0EnLCAnUk9MRV9CJywgJ1JPTEVfQycsICdST0xFX0QnXTtcbiAgICAgIGlmIChhbGxvd2VkUm9sZXMuaW5jbHVkZXMocm9sZSkpIHtcbiAgICAgICAgdXBkYXRlRGF0YS5yb2xlID0gcm9sZTtcbiAgICAgICAgLy8gT25seSBST0xFX0QgbmVlZHMgcHJvamVjdCByZXN0cmljdGlvbnM7IGNsZWFyIGZvciBhbGwgb3RoZXIgcm9sZXNcbiAgICAgICAgaWYgKHJvbGUgIT09ICdST0xFX0QnKSB7XG4gICAgICAgICAgdXBkYXRlRGF0YS5wZXJtaXR0ZWRQcm9qZWN0cyA9ICcnO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gT25seSB1cGRhdGUgcGVybWl0dGVkUHJvamVjdHMgaWYgdGhlIHVzZXIgaXMgKG9yIHdpbGwgYmVjb21lKSBST0xFX0RcbiAgICBjb25zdCBlZmZlY3RpdmVSb2xlID0gdXBkYXRlRGF0YS5yb2xlIHx8IGV4aXN0aW5nLnJvbGU7XG4gICAgaWYgKHBlcm1pdHRlZFByb2plY3RzICE9PSB1bmRlZmluZWQgJiYgZWZmZWN0aXZlUm9sZSA9PT0gJ1JPTEVfRCcpIHtcbiAgICAgIHVwZGF0ZURhdGEucGVybWl0dGVkUHJvamVjdHMgPSBTdHJpbmcocGVybWl0dGVkUHJvamVjdHMpLnRyaW0oKTtcbiAgICB9XG5cbiAgICBpZiAocGFzc3dvcmQgJiYgcGFzc3dvcmQudHJpbSgpKSB7XG4gICAgICB1cGRhdGVEYXRhLnBhc3N3b3JkSGFzaCA9IGF3YWl0IGJjcnlwdC5oYXNoKHBhc3N3b3JkLCAxMCk7XG4gICAgfVxuXG4gICAgY29uc3QgdXBkYXRlZCA9IGF3YWl0IHByaXNtYS51c2VyLnVwZGF0ZSh7XG4gICAgICB3aGVyZTogeyBpZDogdXNlcklkIH0sXG4gICAgICBkYXRhOiB1cGRhdGVEYXRhLFxuICAgICAgc2VsZWN0OiB7XG4gICAgICAgIGlkOiB0cnVlLFxuICAgICAgICBlbWFpbDogdHJ1ZSxcbiAgICAgICAgbmFtZTogdHJ1ZSxcbiAgICAgICAgcm9sZTogdHJ1ZSxcbiAgICAgICAgcGVybWl0dGVkUHJvamVjdHM6IHRydWUsXG4gICAgICAgIGNyZWF0ZWRBdDogdHJ1ZVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJlcy5qc29uKHtcbiAgICAgIG1lc3NhZ2U6ICdVc2VyIHVwZGF0ZWQgc3VjY2Vzc2Z1bGx5LicsXG4gICAgICB1c2VyOiB1cGRhdGVkXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byB1cGRhdGUgdXNlcjonLCBlcnIpO1xuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7IGVycm9yOiAnRmFpbGVkIHRvIHVwZGF0ZSB1c2VyLicgfSk7XG4gIH1cbn1cblxuLy8gRGVsZXRlIHVzZXIgYWNjb3VudCAoUk9MRV9BIG9ubHkpXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZGVsZXRlVXNlcihyZXEsIHJlcykge1xuICBjb25zdCB7IHVzZXJJZCB9ID0gcmVxLnBhcmFtcztcblxuICBpZiAodXNlcklkID09PSByZXEudXNlci5pZCkge1xuICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7IGVycm9yOiAnWW91IGNhbm5vdCBkZWxldGUgeW91ciBvd24gbG9nZ2VkLWluIGFjY291bnQuJyB9KTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgY29uc3QgZXhpc3RpbmcgPSBhd2FpdCBwcmlzbWEudXNlci5maW5kVW5pcXVlKHtcbiAgICAgIHdoZXJlOiB7IGlkOiB1c2VySWQgfVxuICAgIH0pO1xuXG4gICAgaWYgKCFleGlzdGluZykge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgZXJyb3I6ICdVc2VyIG5vdCBmb3VuZC4nIH0pO1xuICAgIH1cblxuICAgIC8vIFJ1biBpbiBhIHRyYW5zYWN0aW9uIHRvIGNsZWFuIHVwIGF1ZGl0IGxvZ3MgYmVmb3JlIGRlbGV0aW5nIHRoZSB1c2VyXG4gICAgYXdhaXQgcHJpc21hLiR0cmFuc2FjdGlvbihhc3luYyAodHgpID0+IHtcbiAgICAgIC8vIDEuIERlbGV0ZSBhc3NvY2lhdGVkIGF1ZGl0IGxvZ3MgZm9yIHRoaXMgdXNlclxuICAgICAgYXdhaXQgdHguYXVkaXRMb2cuZGVsZXRlTWFueSh7XG4gICAgICAgIHdoZXJlOiB7IHVzZXJJZCB9XG4gICAgICB9KTtcblxuICAgICAgLy8gMi4gRGVsZXRlIHRoZSB1c2VyIGFjY291bnRcbiAgICAgIGF3YWl0IHR4LnVzZXIuZGVsZXRlKHtcbiAgICAgICAgd2hlcmU6IHsgaWQ6IHVzZXJJZCB9XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHJldHVybiByZXMuanNvbih7IG1lc3NhZ2U6ICdVc2VyIGRlbGV0ZWQgc3VjY2Vzc2Z1bGx5LicgfSk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBkZWxldGUgdXNlcjonLCBlcnIpO1xuICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7IGVycm9yOiAnQ2Fubm90IGRlbGV0ZSB1c2VyIGJlY2F1c2UgdGhleSBoYXZlIHJlY29yZGVkIHByb2plY3Qgb3JkZXJzLicgfSk7XG4gIH1cbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcaHBcXFxcRG93bmxvYWRzXFxcXERpbyBHcmFjZSAoMylcXFxcRGlvIEdyYWNlICgzKVxcXFxEaW8gR3JhY2VlXFxcXGJhY2tlbmRcXFxcc3JjXFxcXHJvdXRlc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcaHBcXFxcRG93bmxvYWRzXFxcXERpbyBHcmFjZSAoMylcXFxcRGlvIEdyYWNlICgzKVxcXFxEaW8gR3JhY2VlXFxcXGJhY2tlbmRcXFxcc3JjXFxcXHJvdXRlc1xcXFxpbmRleC5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvaHAvRG93bmxvYWRzL0RpbyUyMEdyYWNlJTIwKDMpL0RpbyUyMEdyYWNlJTIwKDMpL0RpbyUyMEdyYWNlZS9iYWNrZW5kL3NyYy9yb3V0ZXMvaW5kZXguanNcIjtpbXBvcnQgeyBSb3V0ZXIgfSBmcm9tICdleHByZXNzJztcbmltcG9ydCB7IHZlcmlmeVRva2VuIH0gZnJvbSAnLi4vbWlkZGxld2FyZS9hdXRoLmpzJztcbmltcG9ydCB7IHJlcXVpcmVSb2xlIH0gZnJvbSAnLi4vbWlkZGxld2FyZS9yb2xlR3VhcmQuanMnO1xuaW1wb3J0IHsgY2hlY2tQcm9qZWN0QWNjZXNzIH0gZnJvbSAnLi4vbWlkZGxld2FyZS9wcm9qZWN0R3VhcmQuanMnO1xuaW1wb3J0ICogYXMgYXV0aENvbnRyb2xsZXIgZnJvbSAnLi4vY29udHJvbGxlcnMvYXV0aENvbnRyb2xsZXIuanMnO1xuaW1wb3J0ICogYXMgb3JkZXJDb250cm9sbGVyIGZyb20gJy4uL2NvbnRyb2xsZXJzL29yZGVyQ29udHJvbGxlci5qcyc7XG5pbXBvcnQgKiBhcyBidWlsZGluZ0NvbnRyb2xsZXIgZnJvbSAnLi4vY29udHJvbGxlcnMvYnVpbGRpbmdDb250cm9sbGVyLmpzJztcbmltcG9ydCAqIGFzIGFwYXJ0bWVudENvbnRyb2xsZXIgZnJvbSAnLi4vY29udHJvbGxlcnMvYXBhcnRtZW50Q29udHJvbGxlci5qcyc7XG5pbXBvcnQgKiBhcyBiaWxsaW5nQ29udHJvbGxlciBmcm9tICcuLi9jb250cm9sbGVycy9iaWxsaW5nQ29udHJvbGxlci5qcyc7XG5pbXBvcnQgKiBhcyBleHBvcnRDb250cm9sbGVyIGZyb20gJy4uL2NvbnRyb2xsZXJzL2V4cG9ydENvbnRyb2xsZXIuanMnO1xuaW1wb3J0ICogYXMgYW5hbHl0aWNzQ29udHJvbGxlciBmcm9tICcuLi9jb250cm9sbGVycy9hbmFseXRpY3NDb250cm9sbGVyLmpzJztcbmltcG9ydCAqIGFzIHVzZXJDb250cm9sbGVyIGZyb20gJy4uL2NvbnRyb2xsZXJzL3VzZXJDb250cm9sbGVyLmpzJztcblxuY29uc3Qgcm91dGVyID0gUm91dGVyKCk7XG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuLy8gQXV0aGVudGljYXRpb24gJiBVc2VyIE1hbmFnZW1lbnQgUm91dGVzXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnJvdXRlci5wb3N0KCcvYXV0aC9sb2dpbicsIGF1dGhDb250cm9sbGVyLmxvZ2luKTtcbnJvdXRlci5nZXQoJy9hdXRoL21lJywgdmVyaWZ5VG9rZW4sIGF1dGhDb250cm9sbGVyLm1lKTtcblxucm91dGVyLmdldCgnL3VzZXJzJywgdmVyaWZ5VG9rZW4sIHJlcXVpcmVSb2xlKCdST0xFX0EnKSwgdXNlckNvbnRyb2xsZXIubGlzdFVzZXJzKTtcbnJvdXRlci5wb3N0KCcvdXNlcnMnLCB2ZXJpZnlUb2tlbiwgcmVxdWlyZVJvbGUoJ1JPTEVfQScpLCB1c2VyQ29udHJvbGxlci5jcmVhdGVVc2VyKTtcbnJvdXRlci5wYXRjaCgnL3VzZXJzLzp1c2VySWQnLCB2ZXJpZnlUb2tlbiwgcmVxdWlyZVJvbGUoJ1JPTEVfQScpLCB1c2VyQ29udHJvbGxlci51cGRhdGVVc2VyKTtcbnJvdXRlci5kZWxldGUoJy91c2Vycy86dXNlcklkJywgdmVyaWZ5VG9rZW4sIHJlcXVpcmVSb2xlKCdST0xFX0EnKSwgdXNlckNvbnRyb2xsZXIuZGVsZXRlVXNlcik7XG5cblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4vLyBPcmRlciBSb3V0ZXNcbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxucm91dGVyLmdldCgnL29yZGVycycsIHZlcmlmeVRva2VuLCBvcmRlckNvbnRyb2xsZXIubGlzdE9yZGVycyk7XG5yb3V0ZXIucG9zdCgnL29yZGVycycsIHZlcmlmeVRva2VuLCByZXF1aXJlUm9sZSgnUk9MRV9BJyksIG9yZGVyQ29udHJvbGxlci5jcmVhdGVPcmRlcik7XG5yb3V0ZXIuZ2V0KCcvb3JkZXJzLzpvcmRlcklkJywgdmVyaWZ5VG9rZW4sIGNoZWNrUHJvamVjdEFjY2Vzcywgb3JkZXJDb250cm9sbGVyLmdldE9yZGVyKTtcbnJvdXRlci5kZWxldGUoJy9vcmRlcnMvOm9yZGVySWQnLCB2ZXJpZnlUb2tlbiwgcmVxdWlyZVJvbGUoJ1JPTEVfQScpLCBvcmRlckNvbnRyb2xsZXIuZGVsZXRlT3JkZXIpO1xuXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbi8vIEJ1aWxkaW5nIFJvdXRlc1xuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5yb3V0ZXIuZ2V0KCcvb3JkZXJzLzpvcmRlcklkL2J1aWxkaW5ncycsIHZlcmlmeVRva2VuLCBjaGVja1Byb2plY3RBY2Nlc3MsIGJ1aWxkaW5nQ29udHJvbGxlci5saXN0QnVpbGRpbmdzKTtcbnJvdXRlci5wb3N0KCcvb3JkZXJzLzpvcmRlcklkL2J1aWxkaW5ncycsIHZlcmlmeVRva2VuLCByZXF1aXJlUm9sZSgnUk9MRV9BJyksIGJ1aWxkaW5nQ29udHJvbGxlci5jcmVhdGVCdWlsZGluZyk7XG5yb3V0ZXIuZ2V0KCcvYnVpbGRpbmdzLzpidWlsZGluZ0lkJywgdmVyaWZ5VG9rZW4sIGNoZWNrUHJvamVjdEFjY2VzcywgYnVpbGRpbmdDb250cm9sbGVyLmdldEJ1aWxkaW5nKTtcbnJvdXRlci5wYXRjaCgnL2J1aWxkaW5ncy86YnVpbGRpbmdJZC9jb25maWcnLCB2ZXJpZnlUb2tlbiwgcmVxdWlyZVJvbGUoJ1JPTEVfQScpLCBidWlsZGluZ0NvbnRyb2xsZXIudXBkYXRlQnVpbGRpbmdDb25maWcpO1xucm91dGVyLnBvc3QoJy9idWlsZGluZ3MvY29weScsIHZlcmlmeVRva2VuLCByZXF1aXJlUm9sZSgnUk9MRV9BJyksIGJ1aWxkaW5nQ29udHJvbGxlci5jb3B5QnVpbGRpbmdEYXRhKTtcbnJvdXRlci5kZWxldGUoJy9idWlsZGluZ3MvOmJ1aWxkaW5nSWQnLCB2ZXJpZnlUb2tlbiwgcmVxdWlyZVJvbGUoJ1JPTEVfQScpLCBidWlsZGluZ0NvbnRyb2xsZXIuZGVsZXRlQnVpbGRpbmcpO1xuXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbi8vIEFwYXJ0bWVudCBSb3V0ZXNcbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxucm91dGVyLmdldCgnL2J1aWxkaW5ncy86YnVpbGRpbmdJZC9hcGFydG1lbnRzJywgdmVyaWZ5VG9rZW4sIGNoZWNrUHJvamVjdEFjY2VzcywgYXBhcnRtZW50Q29udHJvbGxlci5saXN0QXBhcnRtZW50cyk7XG5yb3V0ZXIucG9zdCgnL2J1aWxkaW5ncy86YnVpbGRpbmdJZC9hcGFydG1lbnRzJywgdmVyaWZ5VG9rZW4sIHJlcXVpcmVSb2xlKCdST0xFX0EnKSwgYXBhcnRtZW50Q29udHJvbGxlci5jcmVhdGVBcGFydG1lbnQpO1xucm91dGVyLnBhdGNoKCcvYXBhcnRtZW50cy86YXBhcnRtZW50SWQnLCB2ZXJpZnlUb2tlbiwgcmVxdWlyZVJvbGUoJ1JPTEVfQScsICdST0xFX0InKSwgY2hlY2tQcm9qZWN0QWNjZXNzLCBhcGFydG1lbnRDb250cm9sbGVyLnVwZGF0ZUFwYXJ0bWVudCk7XG5yb3V0ZXIuZGVsZXRlKCcvYXBhcnRtZW50cy86YXBhcnRtZW50SWQnLCB2ZXJpZnlUb2tlbiwgcmVxdWlyZVJvbGUoJ1JPTEVfQScpLCBhcGFydG1lbnRDb250cm9sbGVyLmRlbGV0ZUFwYXJ0bWVudCk7XG5yb3V0ZXIucGF0Y2goJy9idWlsZGluZ3MvOmJ1aWxkaW5nSWQvYXBhcnRtZW50cy9iYXRjaCcsIHZlcmlmeVRva2VuLCByZXF1aXJlUm9sZSgnUk9MRV9BJywgJ1JPTEVfQicpLCBjaGVja1Byb2plY3RBY2Nlc3MsIGFwYXJ0bWVudENvbnRyb2xsZXIuYmF0Y2hVcGRhdGVBcGFydG1lbnRzKTtcbnJvdXRlci5nZXQoJy9hcGFydG1lbnRzLzphcGFydG1lbnRJZC9hdWRpdC1sb2dzJywgdmVyaWZ5VG9rZW4sIGNoZWNrUHJvamVjdEFjY2VzcywgYXBhcnRtZW50Q29udHJvbGxlci5nZXRBdWRpdExvZ3MpO1xuXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbi8vIEJpbGxpbmcgUm91dGVzIChTY29wZWQgdG8gT3JkZXIgbGV2ZWwpXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnJvdXRlci5nZXQoJy9vcmRlcnMvOm9yZGVySWQvYmlsbGluZy9zZXR1cCcsIHZlcmlmeVRva2VuLCBjaGVja1Byb2plY3RBY2Nlc3MsIGJpbGxpbmdDb250cm9sbGVyLmdldEJpbGxpbmdTZXR1cCk7XG5yb3V0ZXIucHV0KCcvb3JkZXJzLzpvcmRlcklkL2JpbGxpbmcvc2V0dXAnLCB2ZXJpZnlUb2tlbiwgcmVxdWlyZVJvbGUoJ1JPTEVfQScpLCBiaWxsaW5nQ29udHJvbGxlci51cGRhdGVCaWxsaW5nU2V0dXApO1xuXG5yb3V0ZXIuZ2V0KCcvb3JkZXJzLzpvcmRlcklkL2JpbGxpbmcvY29udHJhY3RvcicsIHZlcmlmeVRva2VuLCBjaGVja1Byb2plY3RBY2Nlc3MsIGJpbGxpbmdDb250cm9sbGVyLmdldENvbnRyYWN0b3JCaWxsKTtcbnJvdXRlci5wdXQoJy9vcmRlcnMvOm9yZGVySWQvYmlsbGluZy9jb250cmFjdG9yJywgdmVyaWZ5VG9rZW4sIHJlcXVpcmVSb2xlKCdST0xFX0EnLCAnUk9MRV9CJyksIGNoZWNrUHJvamVjdEFjY2VzcywgYmlsbGluZ0NvbnRyb2xsZXIudXBzZXJ0Q29udHJhY3RvckJpbGxMaW5lcyk7XG5cbnJvdXRlci5nZXQoJy9vcmRlcnMvOm9yZGVySWQvYmlsbGluZy9jbGllbnQtcmEnLCB2ZXJpZnlUb2tlbiwgY2hlY2tQcm9qZWN0QWNjZXNzLCBiaWxsaW5nQ29udHJvbGxlci5nZXRDbGllbnRSQUJpbGwpO1xucm91dGVyLnB1dCgnL29yZGVycy86b3JkZXJJZC9iaWxsaW5nL2NsaWVudC1yYScsIHZlcmlmeVRva2VuLCByZXF1aXJlUm9sZSgnUk9MRV9BJywgJ1JPTEVfQicpLCBjaGVja1Byb2plY3RBY2Nlc3MsIGJpbGxpbmdDb250cm9sbGVyLnVwc2VydENsaWVudFJBQmlsbExpbmVzKTtcblxucm91dGVyLmdldCgnL29yZGVycy86b3JkZXJJZC9iaWxsaW5nL2Rhc2hib2FyZCcsIHZlcmlmeVRva2VuLCBjaGVja1Byb2plY3RBY2Nlc3MsIGJpbGxpbmdDb250cm9sbGVyLmdldEJpbGxpbmdEYXNoYm9hcmQpO1xucm91dGVyLmdldCgnL29yZGVycy86b3JkZXJJZC9hbmFseXRpY3MnLCB2ZXJpZnlUb2tlbiwgY2hlY2tQcm9qZWN0QWNjZXNzLCBhbmFseXRpY3NDb250cm9sbGVyLmdldFByb2plY3RBbmFseXRpY3MpO1xuXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbi8vIEV4cG9ydCBSb3V0ZVxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5yb3V0ZXIuZ2V0KCcvYnVpbGRpbmdzLzpidWlsZGluZ0lkL2V4cG9ydCcsIHZlcmlmeVRva2VuLCBjaGVja1Byb2plY3RBY2Nlc3MsIGV4cG9ydENvbnRyb2xsZXIuZXhwb3J0QnVpbGRpbmdHcmlkKTtcblxuZXhwb3J0IGRlZmF1bHQgcm91dGVyO1xuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxocFxcXFxEb3dubG9hZHNcXFxcRGlvIEdyYWNlICgzKVxcXFxEaW8gR3JhY2UgKDMpXFxcXERpbyBHcmFjZWVcXFxcYmFja2VuZFxcXFxzcmNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGhwXFxcXERvd25sb2Fkc1xcXFxEaW8gR3JhY2UgKDMpXFxcXERpbyBHcmFjZSAoMylcXFxcRGlvIEdyYWNlZVxcXFxiYWNrZW5kXFxcXHNyY1xcXFxpbmRleC5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvaHAvRG93bmxvYWRzL0RpbyUyMEdyYWNlJTIwKDMpL0RpbyUyMEdyYWNlJTIwKDMpL0RpbyUyMEdyYWNlZS9iYWNrZW5kL3NyYy9pbmRleC5qc1wiO2ltcG9ydCAnLi9lbnYuanMnO1xuaW1wb3J0IGV4cHJlc3MgZnJvbSAnZXhwcmVzcyc7XG5pbXBvcnQgY29ycyBmcm9tICdjb3JzJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IGZzIGZyb20gJ2ZzJztcbmltcG9ydCBodHRwIGZyb20gJ2h0dHAnO1xuaW1wb3J0IHsgZmlsZVVSTFRvUGF0aCB9IGZyb20gJ3VybCc7XG5pbXBvcnQgYXBpUm91dGVyIGZyb20gJy4vcm91dGVzL2luZGV4LmpzJztcblxuY29uc3QgX19maWxlbmFtZSA9IGZpbGVVUkxUb1BhdGgoaW1wb3J0Lm1ldGEudXJsKTtcbmNvbnN0IF9fZGlybmFtZSA9IHBhdGguZGlybmFtZShfX2ZpbGVuYW1lKTtcblxuLy8gVmFsaWRhdGUgZW52aXJvbm1lbnQgc2V0dGluZ3MgYXQgc3RhcnR1cFxuY29uc3QgaXNQcm9kID0gcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdwcm9kdWN0aW9uJztcbmNvbnN0IGp3dFNlY3JldCA9IHByb2Nlc3MuZW52LkpXVF9TRUNSRVQ7XG5pZiAoaXNQcm9kICYmICghand0U2VjcmV0IHx8IGp3dFNlY3JldCA9PT0gJ2Rpb19ncmFjZV9zZWNyZXRfa2V5X2NoYW5nZV9tZV9sYXRlcicpKSB7XG4gIGNvbnNvbGUuZXJyb3IoJ1xcbj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PScpO1xuICBjb25zb2xlLmVycm9yKCdGQVRBTDogSldUX1NFQ1JFVCBlbnZpcm9ubWVudCB2YXJpYWJsZSBpcyBtaXNzaW5nIG9yIHNldCB0bycpO1xuICBjb25zb2xlLmVycm9yKCd0aGUgZGVmYXVsdCBmYWxsYmFjayBrZXkgaW4gcHJvZHVjdGlvbiBtb2RlLicpO1xuICBjb25zb2xlLmVycm9yKCdGb3Igc2VjdXJpdHkgcmVhc29ucywgdGhlIHNlcnZlciBjYW5ub3Qgc3RhcnQuJyk7XG4gIGNvbnNvbGUuZXJyb3IoJz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxcbicpO1xuICBwcm9jZXNzLmV4aXQoMSk7XG59XG5cbmNvbnN0IGFwcCA9IGV4cHJlc3MoKTtcbmNvbnN0IFBPUlQgPSBwcm9jZXNzLmVudi5QT1JUIHx8IDUwMDA7XG5cbi8vIENvbmZpZ3VyZSBDT1JTXG5jb25zdCBhbGxvd2VkT3JpZ2lucyA9IHByb2Nlc3MuZW52LkFMTE9XRURfT1JJR0lOXG4gID8gcHJvY2Vzcy5lbnYuQUxMT1dFRF9PUklHSU4uc3BsaXQoJywnKS5tYXAobyA9PiBvLnRyaW0oKSlcbiAgOiBbXTtcblxuYXBwLnVzZShjb3JzKHtcbiAgb3JpZ2luOiBpc1Byb2QgXG4gICAgPyAoYWxsb3dlZE9yaWdpbnMubGVuZ3RoID4gMCA/IGFsbG93ZWRPcmlnaW5zIDogZmFsc2UpIC8vIEJsb2NrIGFsbCBvcmlnaW5zIGluIHByb2QgYnkgZGVmYXVsdCBpZiBub3Qgc2V0XG4gICAgOiAnKicsIC8vIEFsbG93IGFsbCBpbiBkZXYgbW9kZVxuICBtZXRob2RzOiBbJ0dFVCcsICdQT1NUJywgJ1BVVCcsICdQQVRDSCcsICdERUxFVEUnLCAnT1BUSU9OUyddLFxuICBhbGxvd2VkSGVhZGVyczogWydDb250ZW50LVR5cGUnLCAnQXV0aG9yaXphdGlvbiddLFxuICBjcmVkZW50aWFsczogdHJ1ZVxufSkpO1xuXG5hcHAudXNlKGV4cHJlc3MuanNvbigpKTtcblxuLy8gTWFpbiBBUEkgUm91dGVcbmFwcC51c2UoJy9hcGknLCBhcGlSb3V0ZXIpO1xuXG4vLyBIZWFsdGggQ2hlY2tcbmFwcC5nZXQoJy9oZWFsdGgnLCAocmVxLCByZXMpID0+IHtcbiAgcmVzLmpzb24oeyBzdGF0dXM6ICdvaycsIHRpbWVzdGFtcDogbmV3IERhdGUoKSB9KTtcbn0pO1xuXG5cblxuLy8gU2VydmUgc3RhdGljIGFzc2V0cyBpbiBwcm9kdWN0aW9uLCBvciBwcm94eSB0byBWaXRlIGRldiBzZXJ2ZXIgaW4gZGV2ZWxvcG1lbnRcbmlmIChpc1Byb2QpIHtcbiAgY29uc3QgZGlzdFBhdGggPSBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vLi4vZnJvbnRlbmQvZGlzdCcpO1xuICBpZiAoZnMuZXhpc3RzU3luYyhkaXN0UGF0aCkpIHtcbiAgICBhcHAudXNlKGV4cHJlc3Muc3RhdGljKGRpc3RQYXRoKSk7XG4gICAgLy8gRmFsbGJhY2sgdG8gaW5kZXguaHRtbCBmb3IgUmVhY3Qgcm91dGVyXG4gICAgYXBwLmdldCgnKicsIChyZXEsIHJlcykgPT4ge1xuICAgICAgcmVzLnNlbmRGaWxlKHBhdGguam9pbihkaXN0UGF0aCwgJ2luZGV4Lmh0bWwnKSk7XG4gICAgfSk7XG4gIH1cbn0gZWxzZSBpZiAocHJvY2Vzcy5lbnYuSU5URUdSQVRFRF9WSVRFICE9PSAndHJ1ZScpIHtcbiAgLy8gRGV2IG1vZGUgcHJveHkgdG8gVml0ZSBkZXYgc2VydmVyXG4gIGFwcC51c2UoKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG4gICAgaWYgKHJlcS5wYXRoLnN0YXJ0c1dpdGgoJy9hcGknKSB8fCByZXEucGF0aC5zdGFydHNXaXRoKCcvaGVhbHRoJykpIHtcbiAgICAgIHJldHVybiBuZXh0KCk7XG4gICAgfVxuXG4gICAgY29uc3QgdGFyZ2V0VXJsID0gYGh0dHA6Ly9sb2NhbGhvc3Q6MzAwMCR7cmVxLnVybH1gO1xuICAgIGNvbnN0IHByb3h5UmVxID0gaHR0cC5yZXF1ZXN0KFxuICAgICAgdGFyZ2V0VXJsLFxuICAgICAge1xuICAgICAgICBtZXRob2Q6IHJlcS5tZXRob2QsXG4gICAgICAgIGhlYWRlcnM6IHJlcS5oZWFkZXJzLFxuICAgICAgfSxcbiAgICAgIChwcm94eVJlcykgPT4ge1xuICAgICAgICByZXMud3JpdGVIZWFkKHByb3h5UmVzLnN0YXR1c0NvZGUsIHByb3h5UmVzLmhlYWRlcnMpO1xuICAgICAgICBwcm94eVJlcy5waXBlKHJlcywgeyBlbmQ6IHRydWUgfSk7XG4gICAgICB9XG4gICAgKTtcblxuICAgIHByb3h5UmVxLm9uKCdlcnJvcicsIChlcnIpID0+IHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1Byb3h5IGVycm9yOicsIGVyci5tZXNzYWdlKTtcbiAgICAgIHJlcy5zdGF0dXMoNTAyKS5zZW5kKCdWaXRlIGRldiBzZXJ2ZXIgaXMgbm90IHJ1bm5pbmcgb24gcG9ydCAzMDAwLicpO1xuICAgIH0pO1xuXG4gICAgcmVxLnBpcGUocHJveHlSZXEsIHsgZW5kOiB0cnVlIH0pO1xuICB9KTtcbn1cblxuLy8gRXJyb3IgaGFuZGxpbmcgbWlkZGxld2FyZVxuYXBwLnVzZSgoZXJyLCByZXEsIHJlcywgbmV4dCkgPT4ge1xuICBjb25zb2xlLmVycm9yKGVyci5zdGFjayk7XG4gIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgZXJyb3I6ICdTb21ldGhpbmcgd2VudCB3cm9uZyBvbiB0aGUgc2VydmVyIScgfSk7XG59KTtcblxuaWYgKHByb2Nlc3MuZW52LklOVEVHUkFURURfVklURSAhPT0gJ3RydWUnKSB7XG4gIGFwcC5saXN0ZW4oUE9SVCwgKCkgPT4ge1xuICAgIGNvbnNvbGUubG9nKGBTZXJ2ZXIgaXMgcnVubmluZyBvbiBwb3J0ICR7UE9SVH1gKTtcbiAgfSk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGFwcDtcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcaHBcXFxcRG93bmxvYWRzXFxcXERpbyBHcmFjZSAoMylcXFxcRGlvIEdyYWNlICgzKVxcXFxEaW8gR3JhY2VlXFxcXGZyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxocFxcXFxEb3dubG9hZHNcXFxcRGlvIEdyYWNlICgzKVxcXFxEaW8gR3JhY2UgKDMpXFxcXERpbyBHcmFjZWVcXFxcZnJvbnRlbmRcXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL2hwL0Rvd25sb2Fkcy9EaW8lMjBHcmFjZSUyMCgzKS9EaW8lMjBHcmFjZSUyMCgzKS9EaW8lMjBHcmFjZWUvZnJvbnRlbmQvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5cbi8vIFNldCBlbnZpcm9ubWVudCB2YXJpYWJsZSB0byBzaWduaWZ5IGludGVncmF0ZWQgVml0ZSBtb2RlIGZvciBFeHByZXNzXG5wcm9jZXNzLmVudi5JTlRFR1JBVEVEX1ZJVEUgPSAndHJ1ZSc7XG5cbi8vIER5bmFtaWNhbGx5IGltcG9ydCBFeHByZXNzIGFwcCB0byBhdm9pZCBFU00gaG9pc3RpbmcgaXNzdWVzXG5jb25zdCB7IGRlZmF1bHQ6IGV4cHJlc3NBcHAgfSA9IGF3YWl0IGltcG9ydCgnLi4vYmFja2VuZC9zcmMvaW5kZXguanMnKTtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW1xuICAgIHJlYWN0KCksXG4gICAge1xuICAgICAgbmFtZTogJ2V4cHJlc3MtYmFja2VuZCcsXG4gICAgICBjb25maWd1cmVTZXJ2ZXIoc2VydmVyKSB7XG4gICAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG4gICAgICAgICAgaWYgKHJlcS51cmwuc3RhcnRzV2l0aCgnL2FwaScpIHx8IHJlcS51cmwuc3RhcnRzV2l0aCgnL2hlYWx0aCcpKSB7XG4gICAgICAgICAgICBleHByZXNzQXBwKHJlcSwgcmVzLCBuZXh0KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbmV4dCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICBdLFxuICBzZXJ2ZXI6IHtcbiAgICBwb3J0OiAzMDAwLFxuICAgIGhtcjoge1xuICAgICAgY2xpZW50UG9ydDogMzAwMFxuICAgIH1cbiAgfVxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7OztBQUFzWixPQUFPLFlBQVk7QUFDemEsT0FBTyxVQUFVO0FBQ2pCLE9BQU8sUUFBUTtBQUNmLFNBQVMscUJBQXFCO0FBSDlCLElBQXVRLDBDQUtqUSxZQUNBLFdBRUEsYUFDQTtBQVROO0FBQUE7QUFBaVEsSUFBTSwyQ0FBMkM7QUFLbFQsSUFBTSxhQUFhLGNBQWMsd0NBQWU7QUFDaEQsSUFBTSxZQUFZLEtBQUssUUFBUSxVQUFVO0FBRXpDLElBQU0sY0FBYyxLQUFLLFFBQVEsV0FBVyxZQUFZO0FBQ3hELElBQU0saUJBQWlCLEtBQUssUUFBUSxXQUFXLFNBQVM7QUFFeEQsUUFBSSxHQUFHLFdBQVcsV0FBVyxHQUFHO0FBQzlCLGFBQU8sT0FBTyxFQUFFLE1BQU0sWUFBWSxDQUFDO0FBQUEsSUFDckMsV0FBVyxHQUFHLFdBQVcsY0FBYyxHQUFHO0FBQ3hDLGFBQU8sT0FBTyxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQUEsSUFDeEMsT0FBTztBQUNMLGFBQU8sT0FBTztBQUFBLElBQ2hCO0FBQUE7QUFBQTs7O0FDakIyYixPQUFPLFNBQVM7QUFTcGMsU0FBUyxZQUFZLEtBQUssS0FBSyxNQUFNO0FBQzFD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O0FBQ3hiLE9BQU8sV0FBVztBQUdsQixRQUFRLElBQUksa0JBQWtCO0FBRzlCLElBQU0sRUFBRSxTQUFTLFdBQVcsSUFBSSxNQUFNO0FBRXRDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOO0FBQUEsTUFDRSxNQUFNO0FBQUEsTUFDTixnQkFBZ0IsUUFBUTtBQUN0QixlQUFPLFlBQVksSUFBSSxDQUFDLEtBQUssS0FBSyxTQUFTO0FBQ3pDLGNBQUksSUFBSSxJQUFJLFdBQVcsTUFBTSxLQUFLLElBQUksSUFBSSxXQUFXLFNBQVMsR0FBRztBQUMvRCx1QkFBVyxLQUFLLEtBQUssSUFBSTtBQUFBLFVBQzNCLE9BQU87QUFDTCxpQkFBSztBQUFBLFVBQ1A7QUFBQSxRQUNGLENBQUM7QUFBQSxNQUNIO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLEtBQUs7QUFBQSxNQUNILFlBQVk7QUFBQSxJQUNkO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbIlByaXNtYUNsaWVudCIsICJqd3QiLCAicHJpc21hIiwgIkpXVF9TRUNSRVQiLCAiaXNQcm9kIiwgIlByaXNtYUNsaWVudCIsICJwcmlzbWEiLCAiUHJpc21hQ2xpZW50IiwgInByaXNtYSIsICJQcmlzbWFDbGllbnQiLCAicHJpc21hIiwgIlByaXNtYUNsaWVudCIsICJwcmlzbWEiLCAiUHJpc21hQ2xpZW50IiwgInByaXNtYSIsICJQcmlzbWFDbGllbnQiLCAicHJpc21hIiwgIlByaXNtYUNsaWVudCIsICJiY3J5cHQiLCAicHJpc21hIiwgInBhdGgiLCAiZnMiLCAiZmlsZVVSTFRvUGF0aCIsICJfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsIiwgIl9fZmlsZW5hbWUiLCAiX19kaXJuYW1lIiwgImlzUHJvZCJdCn0K
