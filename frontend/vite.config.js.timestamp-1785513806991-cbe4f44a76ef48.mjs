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
import dotenv from "file:///C:/Users/hp/Downloads/Dio%20Gracee/Dio%20Gracee/backend/node_modules/dotenv/lib/main.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
var __vite_injected_original_import_meta_url, __filename, __dirname, rootEnvPath, backendEnvPath;
var init_env = __esm({
  "../backend/src/env.js"() {
    __vite_injected_original_import_meta_url = "file:///C:/Users/hp/Downloads/Dio%20Gracee/Dio%20Gracee/backend/src/env.js";
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
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith("file:")) {
      const dbRelativePath = process.env.DATABASE_URL.replace(/^file:/, "");
      if (!path.isAbsolute(dbRelativePath)) {
        const absoluteDbPath = path.resolve(__dirname, "../prisma/dev.db");
        process.env.DATABASE_URL = `file:${absoluteDbPath}`;
        console.log(`[Env] Resolved relative SQLite database path to absolute: ${process.env.DATABASE_URL}`);
      }
    }
  }
});

// ../backend/src/middleware/auth.js
import jwt from "file:///C:/Users/hp/Downloads/Dio%20Gracee/Dio%20Gracee/backend/node_modules/jsonwebtoken/index.js";
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
import { PrismaClient } from "file:///C:/Users/hp/Downloads/Dio%20Gracee/Dio%20Gracee/backend/node_modules/@prisma/client/default.js";
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
import { PrismaClient as PrismaClient2 } from "file:///C:/Users/hp/Downloads/Dio%20Gracee/Dio%20Gracee/backend/node_modules/@prisma/client/default.js";
import bcrypt from "file:///C:/Users/hp/Downloads/Dio%20Gracee/Dio%20Gracee/backend/node_modules/bcryptjs/index.js";
import jwt2 from "file:///C:/Users/hp/Downloads/Dio%20Gracee/Dio%20Gracee/backend/node_modules/jsonwebtoken/index.js";
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
import { PrismaClient as PrismaClient3 } from "file:///C:/Users/hp/Downloads/Dio%20Gracee/Dio%20Gracee/backend/node_modules/@prisma/client/default.js";
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
                { typeCode: "V-Type 5", product: "Vanity", typeName: "Standard Floor Mounted Vanity", contractorRate: 9e3, clientRate: 13500 },
                { typeCode: "D-Type 1", product: "Door", typeName: "Standard Main Entrance Door", contractorRate: 15e3, clientRate: 25e3 },
                { typeCode: "D-Type 2", product: "Door", typeName: "Premium Veneer Door", contractorRate: 22e3, clientRate: 35e3 },
                { typeCode: "D-Type 3", product: "Door", typeName: "Toilet Laminate Door", contractorRate: 12e3, clientRate: 18e3 },
                { typeCode: "D-Type 4", product: "Door", typeName: "Balcony Sliding UPVC Door", contractorRate: 18e3, clientRate: 28e3 },
                { typeCode: "D-Type 5", product: "Door", typeName: "Standard Internal Flush Door", contractorRate: 1e4, clientRate: 15e3 }
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
                { product: "Vanity", milestoneName: "QC Approved & Handed Over", percentage: 30 },
                // Door Milestones
                { product: "Door", milestoneName: "Frame & Hardware Installed", percentage: 50 },
                { product: "Door", milestoneName: "QC Approved & Handed Over", percentage: 50 }
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
                { product: "Vanity", recognitionType: "HANDOVER", milestoneName: "QC Approved & Handed Over", fieldKey: "vanityHandedOver", percentage: 20 },
                // Door Material Supply Milestones (sum = 40%)
                { product: "Door", recognitionType: "MATERIAL", milestoneName: "Frame & Hardware Supplied", fieldKey: "doorFrameHardwareInward", percentage: 40 },
                // Door Execution Milestones (sum = 45%)
                { product: "Door", recognitionType: "EXECUTION", milestoneName: "Frame & Hardware Installed", fieldKey: "doorFrameHardwareInstalled", percentage: 45 },
                // Door Handover Milestone (sum = 15%)
                { product: "Door", recognitionType: "HANDOVER", milestoneName: "QC Approved & Handed Over", fieldKey: "doorHandedOver", percentage: 15 }
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
  const H = apt.doorQty || 0;
  const totalQty = E + F + G + H;
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
  let sumDoor = 0;
  if (H > 0) {
    const fields = [
      apt.doorFrameHardwareInward || 0
    ];
    sumDoor = fields.reduce((sum, val) => sum + pct(val), 0) / 1;
  }
  const weightedSum = sumKitchen * E + sumWardrobe * F + sumVanity * G + sumDoor * H;
  return weightedSum / totalQty;
}
function calculateQCGate(apt, product) {
  const E = apt.kitchenQty || 0;
  const F = apt.wardrobeQty || 0;
  const G = apt.vanityQty || 0;
  const H = apt.doorQty || 0;
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
  if (product === "door") {
    if (H === 0) return "N/A";
    const installComplete = [
      apt.doorFrameHardwareInstalled || 0
    ].every((val) => (val || 0) >= 100);
    if (!installComplete) return "Installation Pending";
    const qcFields = [
      apt.doorQC_Chipping,
      apt.doorQC_Alignment
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
function calculateDoorCompletionPct(apt, doorQCGate) {
  const H = apt.doorQty || 0;
  if (H === 0) return 0;
  const handoverApproved = doorQCGate === "Approved";
  const fields = [
    apt.doorFrameHardwareInstalled || 0
  ];
  const sumInstall = fields.reduce((sum, val) => sum + pct(val), 0);
  const handoverVal = pct(apt.doorHandedOver);
  const handoverContrib = handoverApproved && handoverVal >= 1 ? 1 : 0;
  return (sumInstall + handoverContrib) / 2;
}
function calculateOverallCompletionPct(apt, materialWeight, executionWeight, matPct, kitPct, wardPct, vanPct, doorPct) {
  const E = apt.kitchenQty || 0;
  const F = apt.wardrobeQty || 0;
  const G = apt.vanityQty || 0;
  const H = apt.doorQty || 0;
  const totalQty = E + F + G + H;
  if (totalQty === 0) return 0;
  const weightedInstallPct = (kitPct * E + wardPct * F + vanPct * G + doorPct * H) / totalQty;
  return matPct * materialWeight + weightedInstallPct * executionWeight;
}
function calculateHandoverApprovalStatus(kitGate, wardGate, vanGate, doorGate, E, F, G, H) {
  const activeGates = [];
  if (E > 0) activeGates.push(kitGate);
  if (F > 0) activeGates.push(wardGate);
  if (G > 0) activeGates.push(vanGate);
  if (H > 0) activeGates.push(doorGate);
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
  const H = apt.doorQty || 0;
  if (handoverStatus === "Approved") {
    const kitchenHanded = E > 0 ? (apt.kitchenHandedOver || 0) >= 100 : true;
    const wardrobeHanded = F > 0 ? (apt.wardrobeHandedOver || 0) >= 100 : true;
    const vanityHanded = G > 0 ? (apt.vanityHandedOver || 0) >= 100 : true;
    const doorHanded = H > 0 ? (apt.doorHandedOver || 0) >= 100 : true;
    if (kitchenHanded && wardrobeHanded && vanityHanded && doorHanded) {
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
    apt.vanityHandedOver,
    apt.doorFrameHardwareInstalled,
    apt.doorHandedOver
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
  const doorGate = calculateQCGate(apt, "door");
  const kitPct = calculateKitchenCompletionPct(apt, kitGate);
  const wardPct = calculateWardrobeCompletionPct(apt, wardGate);
  const vanPct = calculateVanityCompletionPct(apt, vanGate);
  const doorPct = calculateDoorCompletionPct(apt, doorGate);
  const overallPct = calculateOverallCompletionPct(apt, materialWeight, executionWeight, matPct, kitPct, wardPct, vanPct, doorPct);
  const E = apt.kitchenQty || 0;
  const F = apt.wardrobeQty || 0;
  const G = apt.vanityQty || 0;
  const H = apt.doorQty || 0;
  const handoverStatus = calculateHandoverApprovalStatus(kitGate, wardGate, vanGate, doorGate, E, F, G, H);
  const status = calculateApartmentStatus(apt, handoverStatus, matPct);
  const delayDays = calculateDelayDays(apt.plannedCompletion, apt.actualCompletion, reportDate);
  const health = calculateHealth(apt, delayDays, overallPct, status, buildingConfig);
  return {
    ...apt,
    materialInwardPct: Math.round(matPct * 1e3) / 1e3,
    kitchenCompletionPct: Math.round(kitPct * 1e3) / 1e3,
    wardrobeCompletionPct: Math.round(wardPct * 1e3) / 1e3,
    vanityCompletionPct: Math.round(vanPct * 1e3) / 1e3,
    doorCompletionPct: Math.round(doorPct * 1e3) / 1e3,
    overallCompletionPct: Math.round(overallPct * 1e3) / 1e3,
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
var init_calculationService = __esm({
  "../backend/src/services/calculationService.js"() {
  }
});

// ../backend/src/controllers/buildingController.js
import { PrismaClient as PrismaClient4 } from "file:///C:/Users/hp/Downloads/Dio%20Gracee/Dio%20Gracee/backend/node_modules/@prisma/client/default.js";
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
            doorQty: null,
            kitchenType: "K-Type 1",
            wardrobeType: "W-Type 1",
            vanityType: "V-Type 1",
            doorType: "D-Type 1",
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
            doorQty: 1,
            kitchenType: "K-Type 1",
            wardrobeType: "W-Type 1",
            vanityType: "V-Type 1",
            doorType: "D-Type 1",
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
      "doorQty",
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
      "doorFrameHardwareInward",
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
      "doorFrameHardwareInstalled",
      "doorHandedOver",
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
      "doorQC_Chipping",
      "doorQC_Alignment",
      "kitchenType",
      "wardrobeType",
      "vanityType",
      "doorType"
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
import { PrismaClient as PrismaClient5 } from "file:///C:/Users/hp/Downloads/Dio%20Gracee/Dio%20Gracee/backend/node_modules/@prisma/client/default.js";
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
      doorQty: null,
      kitchenType: kitchenType || "K-Type 1",
      wardrobeType: wardrobeType || "W-Type 1",
      vanityType: vanityType || "V-Type 1",
      doorType: doorType || "D-Type 1",
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
    if (role !== "ROLE_A") {
      return res.status(403).json({ error: "Forbidden: Only Admin has access to modify data" });
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
    if (role !== "ROLE_A") {
      return res.status(403).json({ error: "Forbidden: Only Admin has access to modify data" });
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
            "doorFrameHardwareInward",
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
            "doorFrameHardwareInstalled",
            "doorHandedOver"
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
            "vanityQC_DrawersFunction",
            "doorQC_Chipping",
            "doorQC_Alignment"
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
    ROLE_A_FIELDS = ["srNo", "apartmentNo", "floor", "priority", "kitchenQty", "wardrobeQty", "vanityQty", "doorQty", "responsibleEngineer", "supervisorName", "kitchenType", "wardrobeType", "vanityType", "doorType"];
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
      } else if (product === "Door") {
        const typeStr = apt.doorType;
        if (typeStr && typeStr.startsWith("[")) {
          try {
            const list = JSON.parse(typeStr);
            const found = list.find((item) => item.type === typeCode);
            if (found) allocatedUnits += found.qty || 0;
          } catch (e) {
          }
        } else if (apt.doorType === typeCode) {
          allocatedUnits += apt.doorQty || 0;
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
    } else if (product === "Door") {
      const typeStr = apt.doorType;
      if (typeStr && typeStr.startsWith("[")) {
        try {
          const list = JSON.parse(typeStr);
          const found = list.find((item) => item.type === typeCode);
          if (found && found.qty > 0) {
            aptWithQtys.push({ apt, qty: found.qty });
          }
        } catch (e) {
        }
      } else if (apt.doorType === typeCode && (apt.doorQty || 0) > 0) {
        aptWithQtys.push({ apt, qty: apt.doorQty || 0 });
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
    else if (product === "Door" && override.doorRate > 0) rate = override.doorRate;
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
        const qcGate = product === "Kitchen" ? apt.kitchenQCGate : product === "Wardrobe" ? apt.wardrobeQCGate : product === "Vanity" ? apt.vanityQCGate : apt.doorQCGate;
        const handedOver = product === "Kitchen" ? apt.kitchenHandedOver || 0 : product === "Wardrobe" ? apt.wardrobeHandedOver || 0 : product === "Vanity" ? apt.vanityHandedOver || 0 : apt.doorHandedOver || 0;
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
import { PrismaClient as PrismaClient6 } from "file:///C:/Users/hp/Downloads/Dio%20Gracee/Dio%20Gracee/backend/node_modules/@prisma/client/default.js";
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
      const products = ["Kitchen", "Wardrobe", "Vanity", "Door"];
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
            vanityRate: parseFloat(tr.vanityRate || 0),
            doorRate: parseFloat(tr.doorRate || 0)
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
import { PrismaClient as PrismaClient7 } from "file:///C:/Users/hp/Downloads/Dio%20Gracee/Dio%20Gracee/backend/node_modules/@prisma/client/default.js";
import ExcelJS from "file:///C:/Users/hp/Downloads/Dio%20Gracee/Dio%20Gracee/backend/node_modules/exceljs/excel.js";
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
      { header: "Door Qty", key: "doorQty", width: 12, group: "group1" },
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
      { header: "Door & Har Inw", key: "doorFrameHardwareInward", width: 16, group: "group2" },
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
      { header: "Door & Har Inst", key: "doorFrameHardwareInstalled", width: 18, group: "group3" },
      { header: "Door Handed Over", key: "doorHandedOver", width: 18, group: "group3" },
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
      { header: "Door Comp %", key: "doorCompletionPct", width: 12, group: "group5" },
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
      { header: "Door QC: Chips", key: "doorQC_Chipping", width: 16, group: "group6" },
      { header: "Door QC: Align", key: "doorQC_Alignment", width: 16, group: "group6" },
      // Group 7
      { header: "Kit QC Gate", key: "kitchenQCGate", width: 14, group: "group7" },
      { header: "Ward QC Gate", key: "wardrobeQCGate", width: 15, group: "group7" },
      { header: "Van QC Gate", key: "vanityQCGate", width: 14, group: "group7" },
      { header: "Door QC Gate", key: "doorQCGate", width: 14, group: "group7" },
      { header: "Handover Status", key: "handoverApprovalStatus", width: 22, group: "group7" },
      // Group 8
      { header: "Kit Type", key: "kitchenType", width: 12, group: "group8" },
      { header: "Ward Type", key: "wardrobeType", width: 12, group: "group8" },
      { header: "Van Type", key: "vanityType", width: 12, group: "group8" },
      { header: "Door Type", key: "doorType", width: 12, group: "group8" }
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
import { PrismaClient as PrismaClient8 } from "file:///C:/Users/hp/Downloads/Dio%20Gracee/Dio%20Gracee/backend/node_modules/@prisma/client/default.js";
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
    let siteDoorUnits = 0;
    let siteSumMatInward = 0;
    let siteSumKitchenComp = 0;
    let siteSumWardrobeComp = 0;
    let siteSumVanityComp = 0;
    let siteSumDoorComp = 0;
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
    let siteDoorQty = 0;
    for (const b of buildings) {
      const apartmentsCount = b.apartments.length;
      let kitchenUnits = 0;
      let wardrobeUnits = 0;
      let vanityUnits = 0;
      let doorUnits = 0;
      let sumMatInward = 0;
      let sumKitchenComp = 0;
      let sumWardrobeComp = 0;
      let sumVanityComp = 0;
      let sumDoorComp = 0;
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
        sumMatInward += (apt.materialInwardPct || 0) * tQty;
        sumKitchenComp += (apt.kitchenCompletionPct || 0) * kQty;
        sumWardrobeComp += (apt.wardrobeCompletionPct || 0) * wQty;
        sumVanityComp += (apt.vanityCompletionPct || 0) * vQty;
        sumDoorComp += (apt.doorCompletionPct || 0) * dQty;
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
      const materialInwardPct = totalQty > 0 ? sumMatInward / totalQty : 0;
      const kitchenCompletionPct = kitchenQty > 0 ? sumKitchenComp / kitchenQty : 0;
      const wardrobeCompletionPct = wardrobeQty > 0 ? sumWardrobeComp / wardrobeQty : 0;
      const vanityCompletionPct = vanityQty > 0 ? sumVanityComp / vanityQty : 0;
      const doorCompletionPct = doorQty > 0 ? sumDoorComp / doorQty : 0;
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
    const siteMaterialInwardPct = siteTotalQty > 0 ? siteSumMatInward / siteTotalQty : 0;
    const siteKitchenCompletionPct = siteKitchenQty > 0 ? siteSumKitchenComp / siteKitchenQty : 0;
    const siteWardrobeCompletionPct = siteWardrobeQty > 0 ? siteSumWardrobeComp / siteWardrobeQty : 0;
    const siteVanityCompletionPct = siteVanityQty > 0 ? siteSumVanityComp / siteVanityQty : 0;
    const siteDoorCompletionPct = siteDoorQty > 0 ? siteSumDoorComp / siteDoorQty : 0;
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
      } else if (product === "Door") {
        qtyField = "doorQty";
        typeField = "doorType";
        completionField = "doorCompletionPct";
        qcGateField = "doorQCGate";
        handedOverField = "doorHandedOver";
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
      { label: "Vanity Shutter Hardware Inward", key: "vanityShutterHardwareInward", product: "vanity", qtyKey: "vanityQty" },
      { label: "Door & Har Inward", key: "doorFrameHardwareInward", product: "door", qtyKey: "doorQty" }
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
      { label: "Vanity Handed Over", key: "vanityHandedOver", product: "vanity", qtyKey: "vanityQty" },
      { label: "Door & Har Installed", key: "doorFrameHardwareInstalled", product: "door", qtyKey: "doorQty" },
      { label: "Door Handed Over", key: "doorHandedOver", product: "door", qtyKey: "doorQty" }
    ];
  }
});

// ../backend/src/controllers/userController.js
import { PrismaClient as PrismaClient9 } from "file:///C:/Users/hp/Downloads/Dio%20Gracee/Dio%20Gracee/backend/node_modules/@prisma/client/default.js";
import bcrypt2 from "file:///C:/Users/hp/Downloads/Dio%20Gracee/Dio%20Gracee/backend/node_modules/bcryptjs/index.js";
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
import { Router } from "file:///C:/Users/hp/Downloads/Dio%20Gracee/Dio%20Gracee/backend/node_modules/express/index.js";
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
    router.patch("/apartments/:apartmentId", verifyToken, requireRole("ROLE_A"), checkProjectAccess, updateApartment);
    router.delete("/apartments/:apartmentId", verifyToken, requireRole("ROLE_A"), deleteApartment);
    router.patch("/buildings/:buildingId/apartments/batch", verifyToken, requireRole("ROLE_A"), checkProjectAccess, batchUpdateApartments);
    router.get("/apartments/:apartmentId/audit-logs", verifyToken, checkProjectAccess, getAuditLogs);
    router.get("/orders/:orderId/billing/setup", verifyToken, checkProjectAccess, getBillingSetup);
    router.put("/orders/:orderId/billing/setup", verifyToken, requireRole("ROLE_A"), updateBillingSetup);
    router.get("/orders/:orderId/billing/contractor", verifyToken, checkProjectAccess, getContractorBill);
    router.put("/orders/:orderId/billing/contractor", verifyToken, requireRole("ROLE_A"), checkProjectAccess, upsertContractorBillLines);
    router.get("/orders/:orderId/billing/client-ra", verifyToken, checkProjectAccess, getClientRABill);
    router.put("/orders/:orderId/billing/client-ra", verifyToken, requireRole("ROLE_A"), checkProjectAccess, upsertClientRABillLines);
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
import express from "file:///C:/Users/hp/Downloads/Dio%20Gracee/Dio%20Gracee/backend/node_modules/express/index.js";
import cors from "file:///C:/Users/hp/Downloads/Dio%20Gracee/Dio%20Gracee/backend/node_modules/cors/lib/index.js";
import path2 from "path";
import fs2 from "fs";
import http from "http";
import { fileURLToPath as fileURLToPath2 } from "url";
var __vite_injected_original_import_meta_url2, __filename2, __dirname2, isProd3, jwtSecret, app, PORT, allowedOrigins, src_default;
var init_src = __esm({
  "../backend/src/index.js"() {
    init_env();
    init_routes();
    __vite_injected_original_import_meta_url2 = "file:///C:/Users/hp/Downloads/Dio%20Gracee/Dio%20Gracee/backend/src/index.js";
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
import { defineConfig } from "file:///C:/Users/hp/Downloads/Dio%20Gracee/Dio%20Gracee/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/hp/Downloads/Dio%20Gracee/Dio%20Gracee/frontend/node_modules/@vitejs/plugin-react/dist/index.js";
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vYmFja2VuZC9zcmMvZW52LmpzIiwgIi4uL2JhY2tlbmQvc3JjL21pZGRsZXdhcmUvYXV0aC5qcyIsICIuLi9iYWNrZW5kL3NyYy9taWRkbGV3YXJlL3JvbGVHdWFyZC5qcyIsICIuLi9iYWNrZW5kL3NyYy9taWRkbGV3YXJlL3Byb2plY3RHdWFyZC5qcyIsICIuLi9iYWNrZW5kL3NyYy9jb250cm9sbGVycy9hdXRoQ29udHJvbGxlci5qcyIsICIuLi9iYWNrZW5kL3NyYy9jb250cm9sbGVycy9vcmRlckNvbnRyb2xsZXIuanMiLCAiLi4vYmFja2VuZC9zcmMvc2VydmljZXMvY2FsY3VsYXRpb25TZXJ2aWNlLmpzIiwgIi4uL2JhY2tlbmQvc3JjL2NvbnRyb2xsZXJzL2J1aWxkaW5nQ29udHJvbGxlci5qcyIsICIuLi9iYWNrZW5kL3NyYy9jb250cm9sbGVycy9hcGFydG1lbnRDb250cm9sbGVyLmpzIiwgIi4uL2JhY2tlbmQvc3JjL3NlcnZpY2VzL2JpbGxpbmdTZXJ2aWNlLmpzIiwgIi4uL2JhY2tlbmQvc3JjL2NvbnRyb2xsZXJzL2JpbGxpbmdDb250cm9sbGVyLmpzIiwgIi4uL2JhY2tlbmQvc3JjL2NvbnRyb2xsZXJzL2V4cG9ydENvbnRyb2xsZXIuanMiLCAiLi4vYmFja2VuZC9zcmMvY29udHJvbGxlcnMvYW5hbHl0aWNzQ29udHJvbGxlci5qcyIsICIuLi9iYWNrZW5kL3NyYy9jb250cm9sbGVycy91c2VyQ29udHJvbGxlci5qcyIsICIuLi9iYWNrZW5kL3NyYy9yb3V0ZXMvaW5kZXguanMiLCAiLi4vYmFja2VuZC9zcmMvaW5kZXguanMiLCAidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxocFxcXFxEb3dubG9hZHNcXFxcRGlvIEdyYWNlZVxcXFxEaW8gR3JhY2VlXFxcXGJhY2tlbmRcXFxcc3JjXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxocFxcXFxEb3dubG9hZHNcXFxcRGlvIEdyYWNlZVxcXFxEaW8gR3JhY2VlXFxcXGJhY2tlbmRcXFxcc3JjXFxcXGVudi5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvaHAvRG93bmxvYWRzL0RpbyUyMEdyYWNlZS9EaW8lMjBHcmFjZWUvYmFja2VuZC9zcmMvZW52LmpzXCI7aW1wb3J0IGRvdGVudiBmcm9tICdkb3RlbnYnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IHsgZmlsZVVSTFRvUGF0aCB9IGZyb20gJ3VybCc7XG5cbmNvbnN0IF9fZmlsZW5hbWUgPSBmaWxlVVJMVG9QYXRoKGltcG9ydC5tZXRhLnVybCk7XG5jb25zdCBfX2Rpcm5hbWUgPSBwYXRoLmRpcm5hbWUoX19maWxlbmFtZSk7XG5cbmNvbnN0IHJvb3RFbnZQYXRoID0gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4uLy4uLy5lbnYnKTtcbmNvbnN0IGJhY2tlbmRFbnZQYXRoID0gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4uLy5lbnYnKTtcblxuaWYgKGZzLmV4aXN0c1N5bmMocm9vdEVudlBhdGgpKSB7XG4gIGRvdGVudi5jb25maWcoeyBwYXRoOiByb290RW52UGF0aCB9KTtcbn0gZWxzZSBpZiAoZnMuZXhpc3RzU3luYyhiYWNrZW5kRW52UGF0aCkpIHtcbiAgZG90ZW52LmNvbmZpZyh7IHBhdGg6IGJhY2tlbmRFbnZQYXRoIH0pO1xufSBlbHNlIHtcbiAgZG90ZW52LmNvbmZpZygpO1xufVxuXG4vLyBEeW5hbWljYWxseSByZXNvbHZlIHJlbGF0aXZlIFNRTGl0ZSBkYXRhYmFzZSBVUkxzIHRvIGFic29sdXRlIHBhdGhzXG5pZiAocHJvY2Vzcy5lbnYuREFUQUJBU0VfVVJMICYmIHByb2Nlc3MuZW52LkRBVEFCQVNFX1VSTC5zdGFydHNXaXRoKCdmaWxlOicpKSB7XG4gIGNvbnN0IGRiUmVsYXRpdmVQYXRoID0gcHJvY2Vzcy5lbnYuREFUQUJBU0VfVVJMLnJlcGxhY2UoL15maWxlOi8sICcnKTtcbiAgaWYgKCFwYXRoLmlzQWJzb2x1dGUoZGJSZWxhdGl2ZVBhdGgpKSB7XG4gICAgY29uc3QgYWJzb2x1dGVEYlBhdGggPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi4vcHJpc21hL2Rldi5kYicpO1xuICAgIHByb2Nlc3MuZW52LkRBVEFCQVNFX1VSTCA9IGBmaWxlOiR7YWJzb2x1dGVEYlBhdGh9YDtcbiAgICBjb25zb2xlLmxvZyhgW0Vudl0gUmVzb2x2ZWQgcmVsYXRpdmUgU1FMaXRlIGRhdGFiYXNlIHBhdGggdG8gYWJzb2x1dGU6ICR7cHJvY2Vzcy5lbnYuREFUQUJBU0VfVVJMfWApO1xuICB9XG59XG5cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcaHBcXFxcRG93bmxvYWRzXFxcXERpbyBHcmFjZWVcXFxcRGlvIEdyYWNlZVxcXFxiYWNrZW5kXFxcXHNyY1xcXFxtaWRkbGV3YXJlXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxocFxcXFxEb3dubG9hZHNcXFxcRGlvIEdyYWNlZVxcXFxEaW8gR3JhY2VlXFxcXGJhY2tlbmRcXFxcc3JjXFxcXG1pZGRsZXdhcmVcXFxcYXV0aC5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvaHAvRG93bmxvYWRzL0RpbyUyMEdyYWNlZS9EaW8lMjBHcmFjZWUvYmFja2VuZC9zcmMvbWlkZGxld2FyZS9hdXRoLmpzXCI7aW1wb3J0IGp3dCBmcm9tICdqc29ud2VidG9rZW4nO1xuXG5jb25zdCBpc1Byb2QgPSBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ3Byb2R1Y3Rpb24nO1xuY29uc3QgSldUX1NFQ1JFVCA9IHByb2Nlc3MuZW52LkpXVF9TRUNSRVQgfHwgKGlzUHJvZCA/IG51bGwgOiAnZGlvX2dyYWNlX3NlY3JldF9rZXlfY2hhbmdlX21lX2xhdGVyJyk7XG5jb25zb2xlLmxvZygnSldUX1NFQ1JFVCBpbiBhdXRoLmpzOicsIEpXVF9TRUNSRVQpO1xuaWYgKGlzUHJvZCAmJiAoIUpXVF9TRUNSRVQgfHwgSldUX1NFQ1JFVCA9PT0gJ2Rpb19ncmFjZV9zZWNyZXRfa2V5X2NoYW5nZV9tZV9sYXRlcicpKSB7XG4gIHRocm93IG5ldyBFcnJvcignRkFUQUw6IEpXVF9TRUNSRVQgZW52aXJvbm1lbnQgdmFyaWFibGUgaXMgbWlzc2luZyBvciBzZXQgdG8gdGhlIGRlZmF1bHQgZmFsbGJhY2sga2V5IGluIHByb2R1Y3Rpb24hJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB2ZXJpZnlUb2tlbihyZXEsIHJlcywgbmV4dCkge1xuICBjb25zdCBhdXRoSGVhZGVyID0gcmVxLmhlYWRlcnNbJ2F1dGhvcml6YXRpb24nXTtcbiAgY29uc3QgdG9rZW4gPSBhdXRoSGVhZGVyICYmIGF1dGhIZWFkZXIuc3BsaXQoJyAnKVsxXTtcblxuICBpZiAoIXRva2VuKSB7XG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAxKS5qc29uKHsgZXJyb3I6ICdBY2Nlc3MgdG9rZW4gcmVxdWlyZWQnIH0pO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBkZWNvZGVkID0gand0LnZlcmlmeSh0b2tlbiwgSldUX1NFQ1JFVCk7XG4gICAgcmVxLnVzZXIgPSBkZWNvZGVkO1xuICAgIG5leHQoKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAzKS5qc29uKHsgZXJyb3I6ICdJbnZhbGlkIG9yIGV4cGlyZWQgdG9rZW4nIH0pO1xuICB9XG59XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGhwXFxcXERvd25sb2Fkc1xcXFxEaW8gR3JhY2VlXFxcXERpbyBHcmFjZWVcXFxcYmFja2VuZFxcXFxzcmNcXFxcbWlkZGxld2FyZVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcaHBcXFxcRG93bmxvYWRzXFxcXERpbyBHcmFjZWVcXFxcRGlvIEdyYWNlZVxcXFxiYWNrZW5kXFxcXHNyY1xcXFxtaWRkbGV3YXJlXFxcXHJvbGVHdWFyZC5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvaHAvRG93bmxvYWRzL0RpbyUyMEdyYWNlZS9EaW8lMjBHcmFjZWUvYmFja2VuZC9zcmMvbWlkZGxld2FyZS9yb2xlR3VhcmQuanNcIjtleHBvcnQgZnVuY3Rpb24gcmVxdWlyZVJvbGUoLi4uYWxsb3dlZFJvbGVzKSB7XG4gIHJldHVybiAocmVxLCByZXMsIG5leHQpID0+IHtcbiAgICBpZiAoIXJlcS51c2VyIHx8ICFyZXEudXNlci5yb2xlKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDEpLmpzb24oeyBlcnJvcjogJ1VuYXV0aG9yaXplZDogVXNlciByb2xlIG5vdCBmb3VuZCcgfSk7XG4gICAgfVxuXG4gICAgaWYgKCFhbGxvd2VkUm9sZXMuaW5jbHVkZXMocmVxLnVzZXIucm9sZSkpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMykuanNvbih7IFxuICAgICAgICBlcnJvcjogYEZvcmJpZGRlbjogVGhpcyBhY3Rpb24gcmVxdWlyZXMgb25lIG9mIHRoZSBmb2xsb3dpbmcgcm9sZXM6IFske2FsbG93ZWRSb2xlcy5qb2luKCcsICcpfV1gIFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgbmV4dCgpO1xuICB9O1xufVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxocFxcXFxEb3dubG9hZHNcXFxcRGlvIEdyYWNlZVxcXFxEaW8gR3JhY2VlXFxcXGJhY2tlbmRcXFxcc3JjXFxcXG1pZGRsZXdhcmVcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGhwXFxcXERvd25sb2Fkc1xcXFxEaW8gR3JhY2VlXFxcXERpbyBHcmFjZWVcXFxcYmFja2VuZFxcXFxzcmNcXFxcbWlkZGxld2FyZVxcXFxwcm9qZWN0R3VhcmQuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL2hwL0Rvd25sb2Fkcy9EaW8lMjBHcmFjZWUvRGlvJTIwR3JhY2VlL2JhY2tlbmQvc3JjL21pZGRsZXdhcmUvcHJvamVjdEd1YXJkLmpzXCI7aW1wb3J0IHsgUHJpc21hQ2xpZW50IH0gZnJvbSAnQHByaXNtYS9jbGllbnQnO1xuY29uc3QgcHJpc21hID0gbmV3IFByaXNtYUNsaWVudCgpO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY2hlY2tQcm9qZWN0QWNjZXNzKHJlcSwgcmVzLCBuZXh0KSB7XG4gIHRyeSB7XG4gICAgY29uc3QgZGJVc2VyID0gYXdhaXQgcHJpc21hLnVzZXIuZmluZFVuaXF1ZSh7XG4gICAgICB3aGVyZTogeyBpZDogcmVxLnVzZXIuaWQgfVxuICAgIH0pO1xuXG4gICAgaWYgKCFkYlVzZXIpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMSkuanNvbih7IGVycm9yOiAnVXNlciBub3QgZm91bmQnIH0pO1xuICAgIH1cblxuICAgIC8vIEFkbWluIChST0xFX0EpLCBGZWVkZXIgKFJPTEVfQiksIGFuZCBFeGVjdXRpdmUgKFJPTEVfQykgY2FuIHJlYWQgQUxMIHByb2plY3RzLlxuICAgIC8vIE9ubHkgQ2xpZW50IC8gcHJvamVjdC1yZXN0cmljdGVkIChST0xFX0QpIGlzIGxpbWl0ZWQgdG8gdGhlaXIgcGVybWl0dGVkIHByb2plY3QgbGlzdC5cbiAgICBpZiAoZGJVc2VyLnJvbGUgPT09ICdST0xFX0EnIHx8IGRiVXNlci5yb2xlID09PSAnUk9MRV9CJyB8fCBkYlVzZXIucm9sZSA9PT0gJ1JPTEVfQycpIHtcbiAgICAgIHJldHVybiBuZXh0KCk7XG4gICAgfVxuXG4gICAgbGV0IG9yZGVyTnVtYmVyID0gbnVsbDtcblxuICAgIC8vIDEuIENoZWNrIG9yZGVySWRcbiAgICBpZiAocmVxLnBhcmFtcy5vcmRlcklkKSB7XG4gICAgICBjb25zdCBvcmRlciA9IGF3YWl0IHByaXNtYS5vcmRlci5maW5kVW5pcXVlKHtcbiAgICAgICAgd2hlcmU6IHsgaWQ6IHJlcS5wYXJhbXMub3JkZXJJZCB9LFxuICAgICAgICBzZWxlY3Q6IHsgb3JkZXJOdW1iZXI6IHRydWUgfVxuICAgICAgfSk7XG4gICAgICBpZiAob3JkZXIpIHtcbiAgICAgICAgb3JkZXJOdW1iZXIgPSBvcmRlci5vcmRlck51bWJlcjtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gMi4gQ2hlY2sgYnVpbGRpbmdJZFxuICAgIGVsc2UgaWYgKHJlcS5wYXJhbXMuYnVpbGRpbmdJZCkge1xuICAgICAgY29uc3QgYnVpbGRpbmcgPSBhd2FpdCBwcmlzbWEuYnVpbGRpbmcuZmluZFVuaXF1ZSh7XG4gICAgICAgIHdoZXJlOiB7IGlkOiByZXEucGFyYW1zLmJ1aWxkaW5nSWQgfSxcbiAgICAgICAgc2VsZWN0OiB7IG9yZGVyOiB7IHNlbGVjdDogeyBvcmRlck51bWJlcjogdHJ1ZSB9IH0gfVxuICAgICAgfSk7XG4gICAgICBpZiAoYnVpbGRpbmcpIHtcbiAgICAgICAgb3JkZXJOdW1iZXIgPSBidWlsZGluZy5vcmRlci5vcmRlck51bWJlcjtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gMy4gQ2hlY2sgYXBhcnRtZW50SWRcbiAgICBlbHNlIGlmIChyZXEucGFyYW1zLmFwYXJ0bWVudElkKSB7XG4gICAgICBjb25zdCBhcGFydG1lbnQgPSBhd2FpdCBwcmlzbWEuYXBhcnRtZW50LmZpbmRVbmlxdWUoe1xuICAgICAgICB3aGVyZTogeyBpZDogcmVxLnBhcmFtcy5hcGFydG1lbnRJZCB9LFxuICAgICAgICBzZWxlY3Q6IHsgYnVpbGRpbmc6IHsgc2VsZWN0OiB7IG9yZGVyOiB7IHNlbGVjdDogeyBvcmRlck51bWJlcjogdHJ1ZSB9IH0gfSB9IH1cbiAgICAgIH0pO1xuICAgICAgaWYgKGFwYXJ0bWVudCkge1xuICAgICAgICBvcmRlck51bWJlciA9IGFwYXJ0bWVudC5idWlsZGluZy5vcmRlci5vcmRlck51bWJlcjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBJZiBhbiBvcmRlciBudW1iZXIgaXMgcmVzb2x2ZWQsIGNoZWNrIGlmIHRoZSB1c2VyIGlzIHBlcm1pdHRlZCB0byBhY2Nlc3MgaXRcbiAgICBpZiAob3JkZXJOdW1iZXIgIT09IG51bGwpIHtcbiAgICAgIGNvbnN0IHBlcm1pdHRlZExpc3QgPSAoZGJVc2VyLnBlcm1pdHRlZFByb2plY3RzIHx8ICcnKVxuICAgICAgICAuc3BsaXQoJywnKVxuICAgICAgICAubWFwKHMgPT4gcy50cmltKCkudG9Mb3dlckNhc2UoKSlcbiAgICAgICAgLmZpbHRlcihCb29sZWFuKTtcblxuICAgICAgaWYgKCFwZXJtaXR0ZWRMaXN0LmluY2x1ZGVzKG9yZGVyTnVtYmVyLnRvTG93ZXJDYXNlKCkpKSB7XG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMykuanNvbih7IGVycm9yOiAnWW91IGRvIG5vdCBoYXZlIHBlcm1pc3Npb24gdG8gYWNjZXNzIHRoaXMgcHJvamVjdC4nIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIG5leHQoKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgY29uc29sZS5lcnJvcignUHJvamVjdCBhY2Nlc3MgY2hlY2sgZXJyb3I6JywgZXJyKTtcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oeyBlcnJvcjogJ0ludGVybmFsIHNlcnZlciBlcnJvciBjaGVja2luZyBwcm9qZWN0IGFjY2VzcycgfSk7XG4gIH1cbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcaHBcXFxcRG93bmxvYWRzXFxcXERpbyBHcmFjZWVcXFxcRGlvIEdyYWNlZVxcXFxiYWNrZW5kXFxcXHNyY1xcXFxjb250cm9sbGVyc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcaHBcXFxcRG93bmxvYWRzXFxcXERpbyBHcmFjZWVcXFxcRGlvIEdyYWNlZVxcXFxiYWNrZW5kXFxcXHNyY1xcXFxjb250cm9sbGVyc1xcXFxhdXRoQ29udHJvbGxlci5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvaHAvRG93bmxvYWRzL0RpbyUyMEdyYWNlZS9EaW8lMjBHcmFjZWUvYmFja2VuZC9zcmMvY29udHJvbGxlcnMvYXV0aENvbnRyb2xsZXIuanNcIjtpbXBvcnQgeyBQcmlzbWFDbGllbnQgfSBmcm9tICdAcHJpc21hL2NsaWVudCc7XG5pbXBvcnQgYmNyeXB0IGZyb20gJ2JjcnlwdGpzJztcbmltcG9ydCBqd3QgZnJvbSAnanNvbndlYnRva2VuJztcblxuY29uc3QgcHJpc21hID0gbmV3IFByaXNtYUNsaWVudCgpO1xuY29uc3QgaXNQcm9kID0gcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdwcm9kdWN0aW9uJztcbmNvbnN0IEpXVF9TRUNSRVQgPSBwcm9jZXNzLmVudi5KV1RfU0VDUkVUIHx8IChpc1Byb2QgPyBudWxsIDogJ2Rpb19ncmFjZV9zZWNyZXRfa2V5X2NoYW5nZV9tZV9sYXRlcicpO1xuY29uc29sZS5sb2coJ0pXVF9TRUNSRVQgaW4gYXV0aENvbnRyb2xsZXIuanM6JywgSldUX1NFQ1JFVCk7XG5pZiAoaXNQcm9kICYmICghSldUX1NFQ1JFVCB8fCBKV1RfU0VDUkVUID09PSAnZGlvX2dyYWNlX3NlY3JldF9rZXlfY2hhbmdlX21lX2xhdGVyJykpIHtcbiAgdGhyb3cgbmV3IEVycm9yKCdGQVRBTDogSldUX1NFQ1JFVCBlbnZpcm9ubWVudCB2YXJpYWJsZSBpcyBtaXNzaW5nIG9yIHNldCB0byB0aGUgZGVmYXVsdCBmYWxsYmFjayBrZXkgaW4gcHJvZHVjdGlvbiEnKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGxvZ2luKHJlcSwgcmVzKSB7XG4gIGNvbnN0IHsgZW1haWwsIHBhc3N3b3JkIH0gPSByZXEuYm9keTtcblxuICBpZiAoIWVtYWlsIHx8ICFwYXNzd29yZCkge1xuICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7IGVycm9yOiAnRW1haWwgYW5kIHBhc3N3b3JkIGFyZSByZXF1aXJlZCcgfSk7XG4gIH1cblxuICB0cnkge1xuICAgIGNvbnN0IHVzZXIgPSBhd2FpdCBwcmlzbWEudXNlci5maW5kVW5pcXVlKHtcbiAgICAgIHdoZXJlOiB7IGVtYWlsOiBlbWFpbC50b0xvd2VyQ2FzZSgpLnRyaW0oKSB9XG4gICAgfSk7XG5cbiAgICBpZiAoIXVzZXIpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMSkuanNvbih7IGVycm9yOiAnSW52YWxpZCBlbWFpbCBvciBwYXNzd29yZCcgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgaXNWYWxpZCA9IGF3YWl0IGJjcnlwdC5jb21wYXJlKHBhc3N3b3JkLCB1c2VyLnBhc3N3b3JkSGFzaCk7XG4gICAgaWYgKCFpc1ZhbGlkKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDEpLmpzb24oeyBlcnJvcjogJ0ludmFsaWQgZW1haWwgb3IgcGFzc3dvcmQnIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IHRva2VuID0gand0LnNpZ24oXG4gICAgICB7IGlkOiB1c2VyLmlkLCBlbWFpbDogdXNlci5lbWFpbCwgcm9sZTogdXNlci5yb2xlLCBuYW1lOiB1c2VyLm5hbWUgfSxcbiAgICAgIEpXVF9TRUNSRVQsXG4gICAgICB7IGV4cGlyZXNJbjogJzEyaCcgfVxuICAgICk7XG5cbiAgICByZXR1cm4gcmVzLmpzb24oe1xuICAgICAgdG9rZW4sXG4gICAgICB1c2VyOiB7XG4gICAgICAgIGlkOiB1c2VyLmlkLFxuICAgICAgICBlbWFpbDogdXNlci5lbWFpbCxcbiAgICAgICAgcm9sZTogdXNlci5yb2xlLFxuICAgICAgICBuYW1lOiB1c2VyLm5hbWVcbiAgICAgIH1cbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgY29uc29sZS5lcnJvcignTG9naW4gZXJyb3I6JywgZXJyKTtcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oeyBlcnJvcjogJ0ludGVybmFsIHNlcnZlciBlcnJvciBkdXJpbmcgbG9naW4nIH0pO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBtZShyZXEsIHJlcykge1xuICB0cnkge1xuICAgIGNvbnN0IHVzZXIgPSBhd2FpdCBwcmlzbWEudXNlci5maW5kVW5pcXVlKHtcbiAgICAgIHdoZXJlOiB7IGlkOiByZXEudXNlci5pZCB9XG4gICAgfSk7XG4gICAgaWYgKCF1c2VyKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oeyBlcnJvcjogJ1VzZXIgbm90IGZvdW5kJyB9KTtcbiAgICB9XG4gICAgcmV0dXJuIHJlcy5qc29uKHtcbiAgICAgIHVzZXI6IHtcbiAgICAgICAgaWQ6IHVzZXIuaWQsXG4gICAgICAgIGVtYWlsOiB1c2VyLmVtYWlsLFxuICAgICAgICByb2xlOiB1c2VyLnJvbGUsXG4gICAgICAgIG5hbWU6IHVzZXIubmFtZVxuICAgICAgfVxuICAgIH0pO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oeyBlcnJvcjogJ0ludGVybmFsIHNlcnZlciBlcnJvcicgfSk7XG4gIH1cbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcaHBcXFxcRG93bmxvYWRzXFxcXERpbyBHcmFjZWVcXFxcRGlvIEdyYWNlZVxcXFxiYWNrZW5kXFxcXHNyY1xcXFxjb250cm9sbGVyc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcaHBcXFxcRG93bmxvYWRzXFxcXERpbyBHcmFjZWVcXFxcRGlvIEdyYWNlZVxcXFxiYWNrZW5kXFxcXHNyY1xcXFxjb250cm9sbGVyc1xcXFxvcmRlckNvbnRyb2xsZXIuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL2hwL0Rvd25sb2Fkcy9EaW8lMjBHcmFjZWUvRGlvJTIwR3JhY2VlL2JhY2tlbmQvc3JjL2NvbnRyb2xsZXJzL29yZGVyQ29udHJvbGxlci5qc1wiO2ltcG9ydCB7IFByaXNtYUNsaWVudCB9IGZyb20gJ0BwcmlzbWEvY2xpZW50JztcblxuY29uc3QgcHJpc21hID0gbmV3IFByaXNtYUNsaWVudCgpO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbGlzdE9yZGVycyhyZXEsIHJlcykge1xuICB0cnkge1xuICAgIGNvbnN0IGRiVXNlciA9IGF3YWl0IHByaXNtYS51c2VyLmZpbmRVbmlxdWUoe1xuICAgICAgd2hlcmU6IHsgaWQ6IHJlcS51c2VyLmlkIH1cbiAgICB9KTtcblxuICAgIGlmICghZGJVc2VyKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDEpLmpzb24oeyBlcnJvcjogJ1VzZXIgbm90IGZvdW5kJyB9KTtcbiAgICB9XG5cbiAgICBsZXQgZmlsdGVyID0ge307XG4gICAgLy8gUk9MRV9EIChDbGllbnQpIGlzIHRoZSBvbmx5IHJvbGUgcmVzdHJpY3RlZCB0byB0aGVpciBwZXJtaXR0ZWQgcHJvamVjdHMuXG4gICAgLy8gQWRtaW4gKFJPTEVfQSksIEZlZWRlciAoUk9MRV9CKSwgYW5kIEV4ZWN1dGl2ZSAoUk9MRV9DKSBjYW4gc2VlIEFMTCBwcm9qZWN0cy5cbiAgICBpZiAoZGJVc2VyLnJvbGUgPT09ICdST0xFX0QnKSB7XG4gICAgICBjb25zdCBsaXN0ID0gKGRiVXNlci5wZXJtaXR0ZWRQcm9qZWN0cyB8fCAnJylcbiAgICAgICAgLnNwbGl0KCcsJylcbiAgICAgICAgLm1hcChzID0+IHMudHJpbSgpKVxuICAgICAgICAuZmlsdGVyKEJvb2xlYW4pO1xuICAgICAgZmlsdGVyID0geyBvcmRlck51bWJlcjogeyBpbjogbGlzdCB9IH07XG4gICAgfVxuXG4gICAgY29uc3Qgb3JkZXJzID0gYXdhaXQgcHJpc21hLm9yZGVyLmZpbmRNYW55KHtcbiAgICAgIHdoZXJlOiBmaWx0ZXIsXG4gICAgICBpbmNsdWRlOiB7XG4gICAgICAgIGJ1aWxkaW5nczoge1xuICAgICAgICAgIHNlbGVjdDoge1xuICAgICAgICAgICAgaWQ6IHRydWUsXG4gICAgICAgICAgICBjYXBhY2l0eTogdHJ1ZSxcbiAgICAgICAgICAgIGFwYXJ0bWVudHM6IHtcbiAgICAgICAgICAgICAgc2VsZWN0OiB7XG4gICAgICAgICAgICAgICAgb3ZlcmFsbENvbXBsZXRpb25QY3Q6IHRydWVcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIG9yZGVyQnk6IHsgY3JlYXRlZEF0OiAnZGVzYycgfVxuICAgIH0pO1xuXG4gICAgLy8gQ29tcHV0ZSByb2xsdXBzIGZvciBlYWNoIG9yZGVyXG4gICAgY29uc3QgcmVzdWx0ID0gb3JkZXJzLm1hcChvcmRlciA9PiB7XG4gICAgICBjb25zdCBidWlsZGluZ3NDb3VudCA9IG9yZGVyLmJ1aWxkaW5ncy5sZW5ndGg7XG4gICAgICBsZXQgdG90YWxBcGFydG1lbnRzID0gMDtcbiAgICAgIGxldCBzdW1Db21wbGV0aW9uID0gMC4wO1xuXG4gICAgICBmb3IgKGNvbnN0IGIgb2Ygb3JkZXIuYnVpbGRpbmdzKSB7XG4gICAgICAgIHRvdGFsQXBhcnRtZW50cyArPSBiLmFwYXJ0bWVudHMubGVuZ3RoO1xuICAgICAgICBzdW1Db21wbGV0aW9uICs9IGIuYXBhcnRtZW50cy5yZWR1Y2UoKHN1bSwgYSkgPT4gc3VtICsgKGEub3ZlcmFsbENvbXBsZXRpb25QY3QgfHwgMC4wKSwgMC4wKTtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgb3ZlcmFsbENvbXBsZXRpb24gPSB0b3RhbEFwYXJ0bWVudHMgPiAwID8gKHN1bUNvbXBsZXRpb24gLyB0b3RhbEFwYXJ0bWVudHMpIDogMC4wO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBpZDogb3JkZXIuaWQsXG4gICAgICAgIG9yZGVyTnVtYmVyOiBvcmRlci5vcmRlck51bWJlcixcbiAgICAgICAgY2xpZW50TmFtZTogb3JkZXIuY2xpZW50TmFtZSB8fCBvcmRlci5zaXRlTmFtZSB8fCAnJyxcbiAgICAgICAgc2l0ZUFkZHJlc3M6IG9yZGVyLnNpdGVBZGRyZXNzIHx8ICcnLFxuICAgICAgICBzdXBlcnZpc29yTmFtZTogb3JkZXIuc3VwZXJ2aXNvck5hbWUgfHwgJycsXG4gICAgICAgIHRvdGFsQXBhcnRtZW50c05lZWRlZDogb3JkZXIudG90YWxBcGFydG1lbnRzTmVlZGVkIHx8IDAsXG4gICAgICAgIGNvbnRyYWN0b3JJZDogb3JkZXIuY29udHJhY3RvcklkIHx8ICcnLFxuICAgICAgICBjb250cmFjdG9yTmFtZTogb3JkZXIuY29udHJhY3Rvck5hbWUgfHwgJycsXG4gICAgICAgIGNyZWF0ZWRBdDogb3JkZXIuY3JlYXRlZEF0LFxuICAgICAgICBidWlsZGluZ3NDb3VudCxcbiAgICAgICAgdG90YWxBcGFydG1lbnRzLFxuICAgICAgICBvdmVyYWxsQ29tcGxldGlvbjogTWF0aC5yb3VuZChvdmVyYWxsQ29tcGxldGlvbiAqIDEwMDApIC8gMTAwMFxuICAgICAgfTtcbiAgICB9KTtcblxuICAgIHJldHVybiByZXMuanNvbihyZXN1bHQpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKCdMaXN0IG9yZGVycyBlcnJvcjonLCBlcnIpO1xuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7IGVycm9yOiAnSW50ZXJuYWwgc2VydmVyIGVycm9yIGxpc3Rpbmcgb3JkZXJzJyB9KTtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY3JlYXRlT3JkZXIocmVxLCByZXMpIHtcbiAgdHJ5IHtcbiAgICAvLyBSb2xlIEEgb25seSAoaGFuZGxlZCBieSByb2xlR3VhcmQgbWlkZGxld2FyZSwgYnV0IGxldCdzIGJlIHNhZmUpXG4gICAgaWYgKHJlcS51c2VyLnJvbGUgIT09ICdST0xFX0EnKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDMpLmpzb24oeyBlcnJvcjogJ09ubHkgRGF0YSBFbnRyeSAvIFNldHVwIHJvbGUgY2FuIGNyZWF0ZSBvcmRlcnMnIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IHsgb3JkZXJOdW1iZXIsIGNsaWVudE5hbWUsIHNpdGVOYW1lLCBzaXRlQWRkcmVzcywgc3VwZXJ2aXNvck5hbWUsIHRvdGFsQXBhcnRtZW50c05lZWRlZCwgY29udHJhY3RvcklkLCBjb250cmFjdG9yTmFtZSB9ID0gcmVxLmJvZHk7XG4gICAgaWYgKCFvcmRlck51bWJlciB8fCB0eXBlb2Ygb3JkZXJOdW1iZXIgIT09ICdzdHJpbmcnIHx8ICFvcmRlck51bWJlci50cmltKCkpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7IGVycm9yOiAnT3JkZXIgTnVtYmVyIGlzIHJlcXVpcmVkJyB9KTtcbiAgICB9XG5cbiAgICBjb25zdCB0cmltbWVkT3JkZXJObyA9IG9yZGVyTnVtYmVyLnRyaW0oKTtcbiAgICBjb25zdCBmaW5hbENsaWVudE5hbWUgPSBjbGllbnROYW1lIHx8IHNpdGVOYW1lIHx8ICcnO1xuXG4gICAgLy8gQ2hlY2sgdW5pcXVlbmVzc1xuICAgIGNvbnN0IGV4aXN0aW5nID0gYXdhaXQgcHJpc21hLm9yZGVyLmZpbmRVbmlxdWUoe1xuICAgICAgd2hlcmU6IHsgb3JkZXJOdW1iZXI6IHRyaW1tZWRPcmRlck5vIH1cbiAgICB9KTtcblxuICAgIGlmIChleGlzdGluZykge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHsgZXJyb3I6IGBPcmRlciBOdW1iZXIgXCIke3RyaW1tZWRPcmRlck5vfVwiIGFscmVhZHkgZXhpc3RzYCB9KTtcbiAgICB9XG5cbiAgICAvLyBDcmVhdGUgb3JkZXIgKyBkZWZhdWx0IEJpbGxpbmdTZXR1cFxuICAgIGNvbnN0IG9yZGVyID0gYXdhaXQgcHJpc21hLm9yZGVyLmNyZWF0ZSh7XG4gICAgICBkYXRhOiB7XG4gICAgICAgIG9yZGVyTnVtYmVyOiB0cmltbWVkT3JkZXJObyxcbiAgICAgICAgY2xpZW50TmFtZTogZmluYWxDbGllbnROYW1lID8gU3RyaW5nKGZpbmFsQ2xpZW50TmFtZSkudHJpbSgpIDogJycsXG4gICAgICAgIHNpdGVBZGRyZXNzOiBzaXRlQWRkcmVzcyA/IFN0cmluZyhzaXRlQWRkcmVzcykudHJpbSgpIDogJycsXG4gICAgICAgIHN1cGVydmlzb3JOYW1lOiBzdXBlcnZpc29yTmFtZSA/IFN0cmluZyhzdXBlcnZpc29yTmFtZSkudHJpbSgpIDogJycsXG4gICAgICAgIHRvdGFsQXBhcnRtZW50c05lZWRlZDogdG90YWxBcGFydG1lbnRzTmVlZGVkID8gKHBhcnNlSW50KHRvdGFsQXBhcnRtZW50c05lZWRlZCwgMTApIHx8IDApIDogMCxcbiAgICAgICAgY29udHJhY3RvcklkOiBjb250cmFjdG9ySWQgPyBTdHJpbmcoY29udHJhY3RvcklkKS50cmltKCkgOiAnJyxcbiAgICAgICAgY29udHJhY3Rvck5hbWU6IGNvbnRyYWN0b3JOYW1lID8gU3RyaW5nKGNvbnRyYWN0b3JOYW1lKS50cmltKCkgOiAnJyxcbiAgICAgICAgY3JlYXRlZEJ5SWQ6IHJlcS51c2VyLmlkLFxuICAgICAgICBiaWxsaW5nU2V0dXA6IHtcbiAgICAgICAgICBjcmVhdGU6IHtcbiAgICAgICAgICAgIGNvbnRyYWN0b3JSZXRlbnRpb25QY3Q6IDUuMCxcbiAgICAgICAgICAgIGNvbnRyYWN0b3JHU1RQY3Q6IDE4LjAsXG4gICAgICAgICAgICBjb250cmFjdG9yVERTUGN0OiAxLjAsXG4gICAgICAgICAgICBjbGllbnRSZXRlbnRpb25QY3Q6IDUuMCxcbiAgICAgICAgICAgIGNsaWVudEdTVFBjdDogMTguMCxcbiAgICAgICAgICAgIGNsaWVudE90aGVyRGVkdWN0aW9uOiAwLjAsXG4gICAgICAgICAgICBjbGllbnRNYXRFbGlnaWJsZVBjdDogNDAuMCxcbiAgICAgICAgICAgIGNsaWVudEV4ZWNFbGlnaWJsZVBjdDogNDUuMCxcbiAgICAgICAgICAgIGNsaWVudEhhbmRvdmVyRWxpZ2libGVQY3Q6IDE1LjAsXG4gICAgICAgICAgICAvLyBQcmUtc2VlZCBzb21lIGRlZmF1bHQgVW5pdCBUeXBlIFJhdGVzICg1IG9mIGVhY2ggcHJvZHVjdClcbiAgICAgICAgICAgIHVuaXRUeXBlUmF0ZXM6IHtcbiAgICAgICAgICAgICAgY3JlYXRlOiBbXG4gICAgICAgICAgICAgICAgeyB0eXBlQ29kZTogJ0stVHlwZSAxJywgcHJvZHVjdDogJ0tpdGNoZW4nLCB0eXBlTmFtZTogJ1N0YW5kYXJkIEtpdGNoZW4gTC1TaGFwZScsIGNvbnRyYWN0b3JSYXRlOiA0NTAwMCwgY2xpZW50UmF0ZTogNjUwMDAgfSxcbiAgICAgICAgICAgICAgICB7IHR5cGVDb2RlOiAnSy1UeXBlIDInLCBwcm9kdWN0OiAnS2l0Y2hlbicsIHR5cGVOYW1lOiAnUHJlbWl1bSBLaXRjaGVuIFBhcmFsbGVsJywgY29udHJhY3RvclJhdGU6IDU1MDAwLCBjbGllbnRSYXRlOiA3ODAwMCB9LFxuICAgICAgICAgICAgICAgIHsgdHlwZUNvZGU6ICdLLVR5cGUgMycsIHByb2R1Y3Q6ICdLaXRjaGVuJywgdHlwZU5hbWU6ICdJc2xhbmQgTHV4dXJ5IEtpdGNoZW4nLCBjb250cmFjdG9yUmF0ZTogODUwMDAsIGNsaWVudFJhdGU6IDEyMDAwMCB9LFxuICAgICAgICAgICAgICAgIHsgdHlwZUNvZGU6ICdLLVR5cGUgNCcsIHByb2R1Y3Q6ICdLaXRjaGVuJywgdHlwZU5hbWU6ICdDb21wYWN0IEtpdGNoZW4gU3RyYWlnaHQnLCBjb250cmFjdG9yUmF0ZTogMzUwMDAsIGNsaWVudFJhdGU6IDQ4MDAwIH0sXG4gICAgICAgICAgICAgICAgeyB0eXBlQ29kZTogJ0stVHlwZSA1JywgcHJvZHVjdDogJ0tpdGNoZW4nLCB0eXBlTmFtZTogJ1NlbWktUHJlbWl1bSBLaXRjaGVuIEwtU2hhcGUnLCBjb250cmFjdG9yUmF0ZTogNDgwMDAsIGNsaWVudFJhdGU6IDY4MDAwIH0sXG5cbiAgICAgICAgICAgICAgICB7IHR5cGVDb2RlOiAnVy1UeXBlIDEnLCBwcm9kdWN0OiAnV2FyZHJvYmUnLCB0eXBlTmFtZTogJ1N0YW5kYXJkIDItRG9vciBXYXJkcm9iZScsIGNvbnRyYWN0b3JSYXRlOiAyNTAwMCwgY2xpZW50UmF0ZTogMzgwMDAgfSxcbiAgICAgICAgICAgICAgICB7IHR5cGVDb2RlOiAnVy1UeXBlIDInLCBwcm9kdWN0OiAnV2FyZHJvYmUnLCB0eXBlTmFtZTogJ1ByZW1pdW0gMy1Eb29yIFNsaWRpbmcgV2FyZHJvYmUnLCBjb250cmFjdG9yUmF0ZTogNDIwMDAsIGNsaWVudFJhdGU6IDU4MDAwIH0sXG4gICAgICAgICAgICAgICAgeyB0eXBlQ29kZTogJ1ctVHlwZSAzJywgcHJvZHVjdDogJ1dhcmRyb2JlJywgdHlwZU5hbWU6ICdXYWxrLWluIFdhcmRyb2JlIEx1eHVyeScsIGNvbnRyYWN0b3JSYXRlOiA3NTAwMCwgY2xpZW50UmF0ZTogMTEwMDAwIH0sXG4gICAgICAgICAgICAgICAgeyB0eXBlQ29kZTogJ1ctVHlwZSA0JywgcHJvZHVjdDogJ1dhcmRyb2JlJywgdHlwZU5hbWU6ICdDb21wYWN0IDItRG9vciBXYXJkcm9iZSBMb2Z0JywgY29udHJhY3RvclJhdGU6IDMwMDAwLCBjbGllbnRSYXRlOiA0NTAwMCB9LFxuICAgICAgICAgICAgICAgIHsgdHlwZUNvZGU6ICdXLVR5cGUgNScsIHByb2R1Y3Q6ICdXYXJkcm9iZScsIHR5cGVOYW1lOiAnUHJlbWl1bSA0LURvb3IgSGluZ2VkIFdhcmRyb2JlJywgY29udHJhY3RvclJhdGU6IDQ4MDAwLCBjbGllbnRSYXRlOiA3MDAwMCB9LFxuXG4gICAgICAgICAgICAgICAgeyB0eXBlQ29kZTogJ1YtVHlwZSAxJywgcHJvZHVjdDogJ1Zhbml0eScsIHR5cGVOYW1lOiAnU2luZ2xlIFNpbmsgVmFuaXR5IFN0YW5kYXJkJywgY29udHJhY3RvclJhdGU6IDgwMDAsIGNsaWVudFJhdGU6IDEyMDAwIH0sXG4gICAgICAgICAgICAgICAgeyB0eXBlQ29kZTogJ1YtVHlwZSAyJywgcHJvZHVjdDogJ1Zhbml0eScsIHR5cGVOYW1lOiAnRG91YmxlIFNpbmsgUHJlbWl1bSBWYW5pdHknLCBjb250cmFjdG9yUmF0ZTogMTQwMDAsIGNsaWVudFJhdGU6IDIwMDAwIH0sXG4gICAgICAgICAgICAgICAgeyB0eXBlQ29kZTogJ1YtVHlwZSAzJywgcHJvZHVjdDogJ1Zhbml0eScsIHR5cGVOYW1lOiAnQ29tcGFjdCBGbG9hdGluZyBWYW5pdHknLCBjb250cmFjdG9yUmF0ZTogNjUwMCwgY2xpZW50UmF0ZTogOTUwMCB9LFxuICAgICAgICAgICAgICAgIHsgdHlwZUNvZGU6ICdWLVR5cGUgNCcsIHByb2R1Y3Q6ICdWYW5pdHknLCB0eXBlTmFtZTogJ0x1eHVyeSBNYXJibGUgVG9wIFZhbml0eScsIGNvbnRyYWN0b3JSYXRlOiAxODAwMCwgY2xpZW50UmF0ZTogMjYwMDAgfSxcbiAgICAgICAgICAgICAgICB7IHR5cGVDb2RlOiAnVi1UeXBlIDUnLCBwcm9kdWN0OiAnVmFuaXR5JywgdHlwZU5hbWU6ICdTdGFuZGFyZCBGbG9vciBNb3VudGVkIFZhbml0eScsIGNvbnRyYWN0b3JSYXRlOiA5MDAwLCBjbGllbnRSYXRlOiAxMzUwMCB9LFxuXG4gICAgICAgICAgICAgICAgeyB0eXBlQ29kZTogJ0QtVHlwZSAxJywgcHJvZHVjdDogJ0Rvb3InLCB0eXBlTmFtZTogJ1N0YW5kYXJkIE1haW4gRW50cmFuY2UgRG9vcicsIGNvbnRyYWN0b3JSYXRlOiAxNTAwMCwgY2xpZW50UmF0ZTogMjUwMDAgfSxcbiAgICAgICAgICAgICAgICB7IHR5cGVDb2RlOiAnRC1UeXBlIDInLCBwcm9kdWN0OiAnRG9vcicsIHR5cGVOYW1lOiAnUHJlbWl1bSBWZW5lZXIgRG9vcicsIGNvbnRyYWN0b3JSYXRlOiAyMjAwMCwgY2xpZW50UmF0ZTogMzUwMDAgfSxcbiAgICAgICAgICAgICAgICB7IHR5cGVDb2RlOiAnRC1UeXBlIDMnLCBwcm9kdWN0OiAnRG9vcicsIHR5cGVOYW1lOiAnVG9pbGV0IExhbWluYXRlIERvb3InLCBjb250cmFjdG9yUmF0ZTogMTIwMDAsIGNsaWVudFJhdGU6IDE4MDAwIH0sXG4gICAgICAgICAgICAgICAgeyB0eXBlQ29kZTogJ0QtVHlwZSA0JywgcHJvZHVjdDogJ0Rvb3InLCB0eXBlTmFtZTogJ0JhbGNvbnkgU2xpZGluZyBVUFZDIERvb3InLCBjb250cmFjdG9yUmF0ZTogMTgwMDAsIGNsaWVudFJhdGU6IDI4MDAwIH0sXG4gICAgICAgICAgICAgICAgeyB0eXBlQ29kZTogJ0QtVHlwZSA1JywgcHJvZHVjdDogJ0Rvb3InLCB0eXBlTmFtZTogJ1N0YW5kYXJkIEludGVybmFsIEZsdXNoIERvb3InLCBjb250cmFjdG9yUmF0ZTogMTAwMDAsIGNsaWVudFJhdGU6IDE1MDAwIH1cbiAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIFByZS1zZWVkIENvbnRyYWN0b3IgTWlsZXN0b25lc1xuICAgICAgICAgICAgY29udHJhY3Rvck1pbGVzdG9uZXM6IHtcbiAgICAgICAgICAgICAgY3JlYXRlOiBbXG4gICAgICAgICAgICAgICAgLy8gS2l0Y2hlbiBNaWxlc3RvbmVzXG4gICAgICAgICAgICAgICAgeyBwcm9kdWN0OiAnS2l0Y2hlbicsIG1pbGVzdG9uZU5hbWU6ICdMb3dlciBDYXJjYXNzZXMgSW5zdGFsbGVkJywgcGVyY2VudGFnZTogMTUuMCB9LFxuICAgICAgICAgICAgICAgIHsgcHJvZHVjdDogJ0tpdGNoZW4nLCBtaWxlc3RvbmVOYW1lOiAnVXBwZXIgQ2FyY2Fzc2VzIEluc3RhbGxlZCcsIHBlcmNlbnRhZ2U6IDE1LjAgfSxcbiAgICAgICAgICAgICAgICB7IHByb2R1Y3Q6ICdLaXRjaGVuJywgbWlsZXN0b25lTmFtZTogJ1N0b25lIEluc3RhbGxlZCcsIHBlcmNlbnRhZ2U6IDE1LjAgfSxcbiAgICAgICAgICAgICAgICB7IHByb2R1Y3Q6ICdLaXRjaGVuJywgbWlsZXN0b25lTmFtZTogJ1NodXR0ZXJzICYgSGFyZHdhcmUgSW5zdGFsbGVkJywgcGVyY2VudGFnZTogMjUuMCB9LFxuICAgICAgICAgICAgICAgIHsgcHJvZHVjdDogJ0tpdGNoZW4nLCBtaWxlc3RvbmVOYW1lOiAnQXBwbGlhbmNlcyBJbnN0YWxsZWQnLCBwZXJjZW50YWdlOiAxMC4wIH0sXG4gICAgICAgICAgICAgICAgeyBwcm9kdWN0OiAnS2l0Y2hlbicsIG1pbGVzdG9uZU5hbWU6ICdRQyBBcHByb3ZlZCAmIEhhbmRlZCBPdmVyJywgcGVyY2VudGFnZTogMjAuMCB9LFxuXG4gICAgICAgICAgICAgICAgLy8gV2FyZHJvYmUgTWlsZXN0b25lc1xuICAgICAgICAgICAgICAgIHsgcHJvZHVjdDogJ1dhcmRyb2JlJywgbWlsZXN0b25lTmFtZTogJ0NhYmluZXRzIEluc3RhbGxlZCcsIHBlcmNlbnRhZ2U6IDQwLjAgfSxcbiAgICAgICAgICAgICAgICB7IHByb2R1Y3Q6ICdXYXJkcm9iZScsIG1pbGVzdG9uZU5hbWU6ICdTaHV0dGVyICYgSGFyZHdhcmUgSW5zdGFsbGVkJywgcGVyY2VudGFnZTogMzAuMCB9LFxuICAgICAgICAgICAgICAgIHsgcHJvZHVjdDogJ1dhcmRyb2JlJywgbWlsZXN0b25lTmFtZTogJ1FDIEFwcHJvdmVkICYgSGFuZGVkIE92ZXInLCBwZXJjZW50YWdlOiAzMC4wIH0sXG5cbiAgICAgICAgICAgICAgICAvLyBWYW5pdHkgTWlsZXN0b25lc1xuICAgICAgICAgICAgICAgIHsgcHJvZHVjdDogJ1Zhbml0eScsIG1pbGVzdG9uZU5hbWU6ICdDYWJpbmV0cyBJbnN0YWxsZWQnLCBwZXJjZW50YWdlOiA0MC4wIH0sXG4gICAgICAgICAgICAgICAgeyBwcm9kdWN0OiAnVmFuaXR5JywgbWlsZXN0b25lTmFtZTogJ1NodXR0ZXIgJiBIYXJkd2FyZSBJbnN0YWxsZWQnLCBwZXJjZW50YWdlOiAzMC4wIH0sXG4gICAgICAgICAgICAgICAgeyBwcm9kdWN0OiAnVmFuaXR5JywgbWlsZXN0b25lTmFtZTogJ1FDIEFwcHJvdmVkICYgSGFuZGVkIE92ZXInLCBwZXJjZW50YWdlOiAzMC4wIH0sXG5cbiAgICAgICAgICAgICAgICAvLyBEb29yIE1pbGVzdG9uZXNcbiAgICAgICAgICAgICAgICB7IHByb2R1Y3Q6ICdEb29yJywgbWlsZXN0b25lTmFtZTogJ0ZyYW1lICYgSGFyZHdhcmUgSW5zdGFsbGVkJywgcGVyY2VudGFnZTogNTAuMCB9LFxuICAgICAgICAgICAgICAgIHsgcHJvZHVjdDogJ0Rvb3InLCBtaWxlc3RvbmVOYW1lOiAnUUMgQXBwcm92ZWQgJiBIYW5kZWQgT3ZlcicsIHBlcmNlbnRhZ2U6IDUwLjAgfVxuICAgICAgICAgICAgICBdXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gUHJlLXNlZWQgQ2xpZW50IFJBIE1pbGVzdG9uZXMgKG11c3Qgc3VtIHRvIDEwMCUgcGVyIHByb2R1Y3QpXG4gICAgICAgICAgICBjbGllbnRSQU1pbGVzdG9uZXM6IHtcbiAgICAgICAgICAgICAgY3JlYXRlOiBbXG4gICAgICAgICAgICAgICAgLy8gS2l0Y2hlbiBNYXRlcmlhbCBTdXBwbHkgTWlsZXN0b25lcyAoc3VtID0gNDAlKVxuICAgICAgICAgICAgICAgIHsgcHJvZHVjdDogJ0tpdGNoZW4nLCByZWNvZ25pdGlvblR5cGU6ICdNQVRFUklBTCcsIG1pbGVzdG9uZU5hbWU6ICdMb3dlciBDYXJjYXNzZXMgU3VwcGxpZWQnLCBmaWVsZEtleTogJ2tpdGNoZW5Mb3dlckNhcmNhc3NJbndhcmQnLCBwZXJjZW50YWdlOiA4LjAgfSxcbiAgICAgICAgICAgICAgICB7IHByb2R1Y3Q6ICdLaXRjaGVuJywgcmVjb2duaXRpb25UeXBlOiAnTUFURVJJQUwnLCBtaWxlc3RvbmVOYW1lOiAnVXBwZXIgQ2FyY2Fzc2VzIFN1cHBsaWVkJywgZmllbGRLZXk6ICdraXRjaGVuVXBwZXJDYXJjYXNzSW53YXJkJywgcGVyY2VudGFnZTogNy4wIH0sXG4gICAgICAgICAgICAgICAgeyBwcm9kdWN0OiAnS2l0Y2hlbicsIHJlY29nbml0aW9uVHlwZTogJ01BVEVSSUFMJywgbWlsZXN0b25lTmFtZTogJ1N0b25lIFN1cHBsaWVkJywgZmllbGRLZXk6ICdraXRjaGVuU3RvbmVJbndhcmQnLCBwZXJjZW50YWdlOiA3LjAgfSxcbiAgICAgICAgICAgICAgICB7IHByb2R1Y3Q6ICdLaXRjaGVuJywgcmVjb2duaXRpb25UeXBlOiAnTUFURVJJQUwnLCBtaWxlc3RvbmVOYW1lOiAnU2h1dHRlcnMgU3VwcGxpZWQnLCBmaWVsZEtleTogJ2tpdGNoZW5TaHV0dGVySW53YXJkJywgcGVyY2VudGFnZTogOC4wIH0sXG4gICAgICAgICAgICAgICAgeyBwcm9kdWN0OiAnS2l0Y2hlbicsIHJlY29nbml0aW9uVHlwZTogJ01BVEVSSUFMJywgbWlsZXN0b25lTmFtZTogJ0hhcmR3YXJlIFN1cHBsaWVkJywgZmllbGRLZXk6ICdraXRjaGVuSGFyZHdhcmVJbndhcmQnLCBwZXJjZW50YWdlOiA1LjAgfSxcbiAgICAgICAgICAgICAgICB7IHByb2R1Y3Q6ICdLaXRjaGVuJywgcmVjb2duaXRpb25UeXBlOiAnTUFURVJJQUwnLCBtaWxlc3RvbmVOYW1lOiAnQXBwbGlhbmNlcyBTdXBwbGllZCcsIGZpZWxkS2V5OiAna2l0Y2hlbkFwcGxpYW5jZUlud2FyZCcsIHBlcmNlbnRhZ2U6IDUuMCB9LFxuICAgICAgICAgICAgICAgIC8vIEtpdGNoZW4gRXhlY3V0aW9uIE1pbGVzdG9uZXMgKHN1bSA9IDQ1JSlcbiAgICAgICAgICAgICAgICB7IHByb2R1Y3Q6ICdLaXRjaGVuJywgcmVjb2duaXRpb25UeXBlOiAnRVhFQ1VUSU9OJywgbWlsZXN0b25lTmFtZTogJ0xvd2VyIENhcmNhc3NlcyBJbnN0YWxsZWQnLCBmaWVsZEtleTogJ2tpdGNoZW5Mb3dlckNhcmNhc3NJbnN0YWxsZWQnLCBwZXJjZW50YWdlOiA5LjAgfSxcbiAgICAgICAgICAgICAgICB7IHByb2R1Y3Q6ICdLaXRjaGVuJywgcmVjb2duaXRpb25UeXBlOiAnRVhFQ1VUSU9OJywgbWlsZXN0b25lTmFtZTogJ1VwcGVyIENhcmNhc3NlcyBJbnN0YWxsZWQnLCBmaWVsZEtleTogJ2tpdGNoZW5VcHBlckNhcmNhc3NJbnN0YWxsZWQnLCBwZXJjZW50YWdlOiA5LjAgfSxcbiAgICAgICAgICAgICAgICB7IHByb2R1Y3Q6ICdLaXRjaGVuJywgcmVjb2duaXRpb25UeXBlOiAnRVhFQ1VUSU9OJywgbWlsZXN0b25lTmFtZTogJ1N0b25lIEluc3RhbGxlZCcsIGZpZWxkS2V5OiAna2l0Y2hlblN0b25lSW5zdGFsbGVkJywgcGVyY2VudGFnZTogOS4wIH0sXG4gICAgICAgICAgICAgICAgeyBwcm9kdWN0OiAnS2l0Y2hlbicsIHJlY29nbml0aW9uVHlwZTogJ0VYRUNVVElPTicsIG1pbGVzdG9uZU5hbWU6ICdTaHV0dGVycyAmIEhhcmR3YXJlIEluc3RhbGxlZCcsIGZpZWxkS2V5OiAna2l0Y2hlblNodXR0ZXJIYXJkd2FyZUluc3RhbGxlZCcsIHBlcmNlbnRhZ2U6IDEwLjAgfSxcbiAgICAgICAgICAgICAgICB7IHByb2R1Y3Q6ICdLaXRjaGVuJywgcmVjb2duaXRpb25UeXBlOiAnRVhFQ1VUSU9OJywgbWlsZXN0b25lTmFtZTogJ0FwcGxpYW5jZXMgSW5zdGFsbGVkJywgZmllbGRLZXk6ICdraXRjaGVuQXBwbGlhbmNlSW5zdGFsbGVkJywgcGVyY2VudGFnZTogOC4wIH0sXG4gICAgICAgICAgICAgICAgLy8gS2l0Y2hlbiBIYW5kb3ZlciBNaWxlc3RvbmUgKHN1bSA9IDE1JSlcbiAgICAgICAgICAgICAgICB7IHByb2R1Y3Q6ICdLaXRjaGVuJywgcmVjb2duaXRpb25UeXBlOiAnSEFORE9WRVInLCBtaWxlc3RvbmVOYW1lOiAnUUMgQXBwcm92ZWQgJiBIYW5kZWQgT3ZlcicsIGZpZWxkS2V5OiAna2l0Y2hlbkhhbmRlZE92ZXInLCBwZXJjZW50YWdlOiAxNS4wIH0sXG5cbiAgICAgICAgICAgICAgICAvLyBXYXJkcm9iZSBNYXRlcmlhbCBTdXBwbHkgTWlsZXN0b25lcyAoc3VtID0gNDAlKVxuICAgICAgICAgICAgICAgIHsgcHJvZHVjdDogJ1dhcmRyb2JlJywgcmVjb2duaXRpb25UeXBlOiAnTUFURVJJQUwnLCBtaWxlc3RvbmVOYW1lOiAnQ2FiaW5ldHMgU3VwcGxpZWQnLCBmaWVsZEtleTogJ3dhcmRyb2JlQ2FiaW5ldElud2FyZCcsIHBlcmNlbnRhZ2U6IDIwLjAgfSxcbiAgICAgICAgICAgICAgICB7IHByb2R1Y3Q6ICdXYXJkcm9iZScsIHJlY29nbml0aW9uVHlwZTogJ01BVEVSSUFMJywgbWlsZXN0b25lTmFtZTogJ1NodXR0ZXIgJiBIYXJkd2FyZSBTdXBwbGllZCcsIGZpZWxkS2V5OiAnd2FyZHJvYmVTaHV0dGVySGFyZHdhcmVJbndhcmQnLCBwZXJjZW50YWdlOiAyMC4wIH0sXG4gICAgICAgICAgICAgICAgLy8gV2FyZHJvYmUgRXhlY3V0aW9uIE1pbGVzdG9uZXMgKHN1bSA9IDQwJSlcbiAgICAgICAgICAgICAgICB7IHByb2R1Y3Q6ICdXYXJkcm9iZScsIHJlY29nbml0aW9uVHlwZTogJ0VYRUNVVElPTicsIG1pbGVzdG9uZU5hbWU6ICdDYWJpbmV0cyBJbnN0YWxsZWQnLCBmaWVsZEtleTogJ3dhcmRyb2JlQ2FiaW5ldEluc3RhbGxlZCcsIHBlcmNlbnRhZ2U6IDIwLjAgfSxcbiAgICAgICAgICAgICAgICB7IHByb2R1Y3Q6ICdXYXJkcm9iZScsIHJlY29nbml0aW9uVHlwZTogJ0VYRUNVVElPTicsIG1pbGVzdG9uZU5hbWU6ICdTaHV0dGVyICYgSGFyZHdhcmUgSW5zdGFsbGVkJywgZmllbGRLZXk6ICd3YXJkcm9iZVNodXR0ZXJIYXJkd2FyZUluc3RhbGxlZCcsIHBlcmNlbnRhZ2U6IDIwLjAgfSxcbiAgICAgICAgICAgICAgICAvLyBXYXJkcm9iZSBIYW5kb3ZlciBNaWxlc3RvbmUgKHN1bSA9IDIwJSlcbiAgICAgICAgICAgICAgICB7IHByb2R1Y3Q6ICdXYXJkcm9iZScsIHJlY29nbml0aW9uVHlwZTogJ0hBTkRPVkVSJywgbWlsZXN0b25lTmFtZTogJ1FDIEFwcHJvdmVkICYgSGFuZGVkIE92ZXInLCBmaWVsZEtleTogJ3dhcmRyb2JlSGFuZGVkT3ZlcicsIHBlcmNlbnRhZ2U6IDIwLjAgfSxcblxuICAgICAgICAgICAgICAgIC8vIFZhbml0eSBNYXRlcmlhbCBTdXBwbHkgTWlsZXN0b25lcyAoc3VtID0gNDAlKVxuICAgICAgICAgICAgICAgIHsgcHJvZHVjdDogJ1Zhbml0eScsIHJlY29nbml0aW9uVHlwZTogJ01BVEVSSUFMJywgbWlsZXN0b25lTmFtZTogJ0NhYmluZXRzIFN1cHBsaWVkJywgZmllbGRLZXk6ICd2YW5pdHlDYWJpbmV0SW53YXJkJywgcGVyY2VudGFnZTogMjAuMCB9LFxuICAgICAgICAgICAgICAgIHsgcHJvZHVjdDogJ1Zhbml0eScsIHJlY29nbml0aW9uVHlwZTogJ01BVEVSSUFMJywgbWlsZXN0b25lTmFtZTogJ1NodXR0ZXIgJiBIYXJkd2FyZSBTdXBwbGllZCcsIGZpZWxkS2V5OiAndmFuaXR5U2h1dHRlckhhcmR3YXJlSW53YXJkJywgcGVyY2VudGFnZTogMjAuMCB9LFxuICAgICAgICAgICAgICAgIC8vIFZhbml0eSBFeGVjdXRpb24gTWlsZXN0b25lcyAoc3VtID0gNDAlKVxuICAgICAgICAgICAgICAgIHsgcHJvZHVjdDogJ1Zhbml0eScsIHJlY29nbml0aW9uVHlwZTogJ0VYRUNVVElPTicsIG1pbGVzdG9uZU5hbWU6ICdDYWJpbmV0cyBJbnN0YWxsZWQnLCBmaWVsZEtleTogJ3Zhbml0eUNhYmluZXRJbnN0YWxsZWQnLCBwZXJjZW50YWdlOiAyMC4wIH0sXG4gICAgICAgICAgICAgICAgeyBwcm9kdWN0OiAnVmFuaXR5JywgcmVjb2duaXRpb25UeXBlOiAnRVhFQ1VUSU9OJywgbWlsZXN0b25lTmFtZTogJ1NodXR0ZXIgJiBIYXJkd2FyZSBJbnN0YWxsZWQnLCBmaWVsZEtleTogJ3Zhbml0eVNodXR0ZXJIYXJkd2FyZUluc3RhbGxlZCcsIHBlcmNlbnRhZ2U6IDIwLjAgfSxcbiAgICAgICAgICAgICAgICAvLyBWYW5pdHkgSGFuZG92ZXIgTWlsZXN0b25lIChzdW0gPSAyMCUpXG4gICAgICAgICAgICAgICAgeyBwcm9kdWN0OiAnVmFuaXR5JywgcmVjb2duaXRpb25UeXBlOiAnSEFORE9WRVInLCBtaWxlc3RvbmVOYW1lOiAnUUMgQXBwcm92ZWQgJiBIYW5kZWQgT3ZlcicsIGZpZWxkS2V5OiAndmFuaXR5SGFuZGVkT3ZlcicsIHBlcmNlbnRhZ2U6IDIwLjAgfSxcblxuICAgICAgICAgICAgICAgIC8vIERvb3IgTWF0ZXJpYWwgU3VwcGx5IE1pbGVzdG9uZXMgKHN1bSA9IDQwJSlcbiAgICAgICAgICAgICAgICB7IHByb2R1Y3Q6ICdEb29yJywgcmVjb2duaXRpb25UeXBlOiAnTUFURVJJQUwnLCBtaWxlc3RvbmVOYW1lOiAnRnJhbWUgJiBIYXJkd2FyZSBTdXBwbGllZCcsIGZpZWxkS2V5OiAnZG9vckZyYW1lSGFyZHdhcmVJbndhcmQnLCBwZXJjZW50YWdlOiA0MC4wIH0sXG4gICAgICAgICAgICAgICAgLy8gRG9vciBFeGVjdXRpb24gTWlsZXN0b25lcyAoc3VtID0gNDUlKVxuICAgICAgICAgICAgICAgIHsgcHJvZHVjdDogJ0Rvb3InLCByZWNvZ25pdGlvblR5cGU6ICdFWEVDVVRJT04nLCBtaWxlc3RvbmVOYW1lOiAnRnJhbWUgJiBIYXJkd2FyZSBJbnN0YWxsZWQnLCBmaWVsZEtleTogJ2Rvb3JGcmFtZUhhcmR3YXJlSW5zdGFsbGVkJywgcGVyY2VudGFnZTogNDUuMCB9LFxuICAgICAgICAgICAgICAgIC8vIERvb3IgSGFuZG92ZXIgTWlsZXN0b25lIChzdW0gPSAxNSUpXG4gICAgICAgICAgICAgICAgeyBwcm9kdWN0OiAnRG9vcicsIHJlY29nbml0aW9uVHlwZTogJ0hBTkRPVkVSJywgbWlsZXN0b25lTmFtZTogJ1FDIEFwcHJvdmVkICYgSGFuZGVkIE92ZXInLCBmaWVsZEtleTogJ2Rvb3JIYW5kZWRPdmVyJywgcGVyY2VudGFnZTogMTUuMCB9XG4gICAgICAgICAgICAgIF1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBpbmNsdWRlOiB7XG4gICAgICAgIGJpbGxpbmdTZXR1cDogdHJ1ZVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAxKS5qc29uKG9yZGVyKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgY29uc29sZS5lcnJvcignQ3JlYXRlIG9yZGVyIGVycm9yOicsIGVycik7XG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgZXJyb3I6ICdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3IgY3JlYXRpbmcgb3JkZXInIH0pO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRPcmRlcihyZXEsIHJlcykge1xuICBjb25zdCB7IG9yZGVySWQgfSA9IHJlcS5wYXJhbXM7XG4gIHRyeSB7XG4gICAgY29uc3Qgb3JkZXIgPSBhd2FpdCBwcmlzbWEub3JkZXIuZmluZFVuaXF1ZSh7XG4gICAgICB3aGVyZTogeyBpZDogb3JkZXJJZCB9LFxuICAgICAgaW5jbHVkZToge1xuICAgICAgICBidWlsZGluZ3M6IHRydWUsXG4gICAgICAgIGJpbGxpbmdTZXR1cDogdHJ1ZVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgaWYgKCFvcmRlcikge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgZXJyb3I6ICdPcmRlciBub3QgZm91bmQnIH0pO1xuICAgIH1cblxuICAgIHJldHVybiByZXMuanNvbihvcmRlcik7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7IGVycm9yOiAnSW50ZXJuYWwgc2VydmVyIGVycm9yIGdldHRpbmcgb3JkZXInIH0pO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkZWxldGVPcmRlcihyZXEsIHJlcykge1xuICBjb25zdCB7IG9yZGVySWQgfSA9IHJlcS5wYXJhbXM7XG4gIHRyeSB7XG4gICAgaWYgKHJlcS51c2VyLnJvbGUgIT09ICdST0xFX0EnKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDMpLmpzb24oeyBlcnJvcjogJ09ubHkgRGF0YSBFbnRyeSAvIFNldHVwIHJvbGUgY2FuIGRlbGV0ZSBvcmRlcnMnIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IG9yZGVyID0gYXdhaXQgcHJpc21hLm9yZGVyLmZpbmRVbmlxdWUoe1xuICAgICAgd2hlcmU6IHsgaWQ6IG9yZGVySWQgfVxuICAgIH0pO1xuXG4gICAgaWYgKCFvcmRlcikge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgZXJyb3I6ICdPcmRlciBub3QgZm91bmQnIH0pO1xuICAgIH1cblxuICAgIC8vIERlbGV0ZSB0aGUgb3JkZXIgXHUyMDE0IGNhc2NhZGluZyBkZWxldGVzIGhhbmRsZSBidWlsZGluZ3MsIGFwYXJ0bWVudHMsXG4gICAgLy8gYXVkaXQgbG9ncywgYmlsbGluZyBzZXR1cCAoYW5kIGl0cyBjaGlsZHJlbiksIGFuZCBiaWxsIGxpbmVzLlxuICAgIGF3YWl0IHByaXNtYS5vcmRlci5kZWxldGUoe1xuICAgICAgd2hlcmU6IHsgaWQ6IG9yZGVySWQgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJlcy5qc29uKHsgbWVzc2FnZTogJ09yZGVyIGFuZCBhbGwgYXNzb2NpYXRlZCBkYXRhIGRlbGV0ZWQgc3VjY2Vzc2Z1bGx5JyB9KTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgY29uc29sZS5lcnJvcignRGVsZXRlIG9yZGVyIGVycm9yOicsIGVycik7XG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgZXJyb3I6ICdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3IgZGVsZXRpbmcgb3JkZXInIH0pO1xuICB9XG59XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGhwXFxcXERvd25sb2Fkc1xcXFxEaW8gR3JhY2VlXFxcXERpbyBHcmFjZWVcXFxcYmFja2VuZFxcXFxzcmNcXFxcc2VydmljZXNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGhwXFxcXERvd25sb2Fkc1xcXFxEaW8gR3JhY2VlXFxcXERpbyBHcmFjZWVcXFxcYmFja2VuZFxcXFxzcmNcXFxcc2VydmljZXNcXFxcY2FsY3VsYXRpb25TZXJ2aWNlLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9ocC9Eb3dubG9hZHMvRGlvJTIwR3JhY2VlL0RpbyUyMEdyYWNlZS9iYWNrZW5kL3NyYy9zZXJ2aWNlcy9jYWxjdWxhdGlvblNlcnZpY2UuanNcIjsvKipcbiAqIFB1cmUgY2FsY3VsYXRpb24gZnVuY3Rpb25zIGZvciB0aGUgQXBhcnRtZW50IGZpZWxkcy5cbiAqIFJlLWltcGxlbWVudGVkIG9uIHRoZSBzZXJ2ZXItc2lkZSB0byBndWFyYW50ZWUgY29uc2lzdGVuY3kuXG4gKlxuICogTk9URTogQWxsIGlud2FyZCBhbmQgaW5zdGFsbGF0aW9uIGZpZWxkcyBub3cgc3RvcmUgcGVyY2VudGFnZSB2YWx1ZXNcbiAqICgwLCA1MCwgNzUsIDEwMCkgaW5zdGVhZCBvZiByYXcgY291bnRzLiBUaGV5IGFyZSBub3JtYWxpemVkIHRvIDAuMFx1MjAxMzEuMFxuICogYnkgZGl2aWRpbmcgYnkgMTAwIGluIHRoZSBjYWxjdWxhdGlvbiBsb2dpYy5cbiAqL1xuXG4vLyBIZWxwZXIgdG8gbm9ybWFsaXplIGEgcGVyY2VudGFnZSBmaWVsZCAoMC81MC83NS8xMDApIHRvIGEgMC4wXHUyMDEzMS4wIGZyYWN0aW9uXG5mdW5jdGlvbiBwY3QodmFsKSB7XG4gIHJldHVybiBNYXRoLm1pbigxLjAsIE1hdGgubWF4KDAuMCwgKHZhbCB8fCAwKSAvIDEwMC4wKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjYWxjdWxhdGVNYXRlcmlhbElud2FyZFBjdChhcHQpIHtcbiAgY29uc3QgRSA9IGFwdC5raXRjaGVuUXR5IHx8IDA7XG4gIGNvbnN0IEYgPSBhcHQud2FyZHJvYmVRdHkgfHwgMDtcbiAgY29uc3QgRyA9IGFwdC52YW5pdHlRdHkgfHwgMDtcbiAgY29uc3QgSCA9IGFwdC5kb29yUXR5IHx8IDA7XG4gIGNvbnN0IHRvdGFsUXR5ID0gRSArIEYgKyBHICsgSDtcblxuICBpZiAodG90YWxRdHkgPT09IDApIHJldHVybiAwLjA7XG5cbiAgbGV0IHN1bUtpdGNoZW4gPSAwLjA7XG4gIGlmIChFID4gMCkge1xuICAgIGNvbnN0IGZpZWxkcyA9IFtcbiAgICAgIGFwdC5raXRjaGVuTG93ZXJDYXJjYXNzSW53YXJkLFxuICAgICAgYXB0LmtpdGNoZW5VcHBlckNhcmNhc3NJbndhcmQsXG4gICAgICBhcHQua2l0Y2hlblN0b25lSW53YXJkLFxuICAgICAgYXB0LmtpdGNoZW5TaHV0dGVyc0lud2FyZCB8fCBhcHQua2l0Y2hlblNodXR0ZXJJbndhcmQgfHwgMCxcbiAgICAgIGFwdC5raXRjaGVuSGFyZHdhcmVJbndhcmQsXG4gICAgICBhcHQua2l0Y2hlbkFwcGxpYW5jZXNJbndhcmQgfHwgYXB0LmtpdGNoZW5BcHBsaWFuY2VJbndhcmQgfHwgMFxuICAgIF07XG4gICAgc3VtS2l0Y2hlbiA9IGZpZWxkcy5yZWR1Y2UoKHN1bSwgdmFsKSA9PiBzdW0gKyBwY3QodmFsKSwgMCkgLyA2LjA7XG4gIH1cblxuICBsZXQgc3VtV2FyZHJvYmUgPSAwLjA7XG4gIGlmIChGID4gMCkge1xuICAgIGNvbnN0IGZpZWxkcyA9IFtcbiAgICAgIGFwdC53YXJkcm9iZXNDYWJpbmV0c0lud2FyZCB8fCBhcHQud2FyZHJvYmVDYWJpbmV0SW53YXJkIHx8IDAsXG4gICAgICBhcHQud2FyZHJvYmVTaHV0dGVySGFyZHdhcmVJbndhcmQgfHwgMFxuICAgIF07XG4gICAgc3VtV2FyZHJvYmUgPSBmaWVsZHMucmVkdWNlKChzdW0sIHZhbCkgPT4gc3VtICsgcGN0KHZhbCksIDApIC8gMi4wO1xuICB9XG5cbiAgbGV0IHN1bVZhbml0eSA9IDAuMDtcbiAgaWYgKEcgPiAwKSB7XG4gICAgY29uc3QgZmllbGRzID0gW1xuICAgICAgYXB0LnZhbml0eUNhYmluZXRzSW53YXJkIHx8IGFwdC52YW5pdHlDYWJpbmV0SW53YXJkIHx8IDAsXG4gICAgICBhcHQudmFuaXR5U2h1dHRlckhhcmR3YXJlSW53YXJkIHx8IDBcbiAgICBdO1xuICAgIHN1bVZhbml0eSA9IGZpZWxkcy5yZWR1Y2UoKHN1bSwgdmFsKSA9PiBzdW0gKyBwY3QodmFsKSwgMCkgLyAyLjA7XG4gIH1cblxuICBsZXQgc3VtRG9vciA9IDAuMDtcbiAgaWYgKEggPiAwKSB7XG4gICAgY29uc3QgZmllbGRzID0gW1xuICAgICAgYXB0LmRvb3JGcmFtZUhhcmR3YXJlSW53YXJkIHx8IDBcbiAgICBdO1xuICAgIHN1bURvb3IgPSBmaWVsZHMucmVkdWNlKChzdW0sIHZhbCkgPT4gc3VtICsgcGN0KHZhbCksIDApIC8gMS4wO1xuICB9XG5cbiAgY29uc3Qgd2VpZ2h0ZWRTdW0gPSAoc3VtS2l0Y2hlbiAqIEUpICsgKHN1bVdhcmRyb2JlICogRikgKyAoc3VtVmFuaXR5ICogRykgKyAoc3VtRG9vciAqIEgpO1xuICByZXR1cm4gd2VpZ2h0ZWRTdW0gLyB0b3RhbFF0eTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNhbGN1bGF0ZVFDR2F0ZShhcHQsIHByb2R1Y3QpIHtcbiAgY29uc3QgRSA9IGFwdC5raXRjaGVuUXR5IHx8IDA7XG4gIGNvbnN0IEYgPSBhcHQud2FyZHJvYmVRdHkgfHwgMDtcbiAgY29uc3QgRyA9IGFwdC52YW5pdHlRdHkgfHwgMDtcbiAgY29uc3QgSCA9IGFwdC5kb29yUXR5IHx8IDA7XG5cbiAgaWYgKHByb2R1Y3QgPT09IFwia2l0Y2hlblwiKSB7XG4gICAgaWYgKEUgPT09IDApIHJldHVybiBcIk4vQVwiO1xuICAgIC8vIEFsbCBpbnN0YWxsYXRpb24gZmllbGRzIG11c3QgYmUgYXQgMTAwJVxuICAgIGNvbnN0IGluc3RhbGxDb21wbGV0ZSA9IFtcbiAgICAgIGFwdC5raXRjaGVuTG93ZXJDYXJjYXNzSW5zdGFsbGVkLFxuICAgICAgYXB0LmtpdGNoZW5VcHBlckNhcmNhc3NJbnN0YWxsZWQsXG4gICAgICBhcHQua2l0Y2hlblN0b25lSW5zdGFsbGVkLFxuICAgICAgYXB0LmtpdGNoZW5TaHV0dGVyc0hhcmR3YXJlSW5zdGFsbGVkIHx8IGFwdC5raXRjaGVuU2h1dHRlckhhcmR3YXJlSW5zdGFsbGVkIHx8IDAsXG4gICAgICBhcHQua2l0Y2hlbkFwcGxpYW5jZXNJbnN0YWxsZWQgfHwgYXB0LmtpdGNoZW5BcHBsaWFuY2VJbnN0YWxsZWQgfHwgMFxuICAgIF0uZXZlcnkodmFsID0+ICh2YWwgfHwgMCkgPj0gMTAwKTtcblxuICAgIGlmICghaW5zdGFsbENvbXBsZXRlKSByZXR1cm4gXCJJbnN0YWxsYXRpb24gUGVuZGluZ1wiO1xuXG4gICAgY29uc3QgcWNGaWVsZHMgPSBbXG4gICAgICBhcHQua2l0Y2hlblFDX1Zpc2libGVTY3Jld3MsXG4gICAgICBhcHQua2l0Y2hlblFDX0NoaXBwaW5nLFxuICAgICAgYXB0LmtpdGNoZW5RQ19GaWxsZXJNaXNzaW5nLFxuICAgICAgYXB0LmtpdGNoZW5RQ19TY3JhdGNoZXMsXG4gICAgICBhcHQua2l0Y2hlblFDX0RyYXdlcnNGdW5jdGlvbixcbiAgICAgIGFwdC5raXRjaGVuUUNfQ3V0bGVyeVRyYXksXG4gICAgICBhcHQua2l0Y2hlblFDX0Rpc2hEcmFpbmVyXG4gICAgXTtcblxuICAgIGlmIChxY0ZpZWxkcy5zb21lKHZhbCA9PiB2YWwgPT09IFwiTm90IE9LXCIpKSByZXR1cm4gXCJSZWplY3RlZFwiO1xuICAgIGlmIChxY0ZpZWxkcy5zb21lKHZhbCA9PiB2YWwgPT09IG51bGwgfHwgdmFsID09PSB1bmRlZmluZWQgfHwgdmFsID09PSBcIlwiKSkgcmV0dXJuIFwiUUMgUGVuZGluZ1wiO1xuICAgIHJldHVybiBcIkFwcHJvdmVkXCI7XG4gIH1cblxuICBpZiAocHJvZHVjdCA9PT0gXCJ3YXJkcm9iZVwiKSB7XG4gICAgaWYgKEYgPT09IDApIHJldHVybiBcIk4vQVwiO1xuICAgIGNvbnN0IGluc3RhbGxDb21wbGV0ZSA9IFtcbiAgICAgIGFwdC53YXJkcm9iZXNDYWJpbmV0c0luc3RhbGxlZCB8fCBhcHQud2FyZHJvYmVDYWJpbmV0SW5zdGFsbGVkIHx8IDAsXG4gICAgICBhcHQud2FyZHJvYmVTaHV0dGVySGFyZHdhcmVJbnN0YWxsZWQgfHwgMFxuICAgIF0uZXZlcnkodmFsID0+ICh2YWwgfHwgMCkgPj0gMTAwKTtcblxuICAgIGlmICghaW5zdGFsbENvbXBsZXRlKSByZXR1cm4gXCJJbnN0YWxsYXRpb24gUGVuZGluZ1wiO1xuXG4gICAgY29uc3QgcWNGaWVsZHMgPSBbXG4gICAgICBhcHQud2FyZHJvYmVRQ19WaXNpYmxlU2NyZXdzLFxuICAgICAgYXB0LndhcmRyb2JlUUNfQ2hpcHBpbmcsXG4gICAgICBhcHQud2FyZHJvYmVRQ19GaWxsZXJNaXNzaW5nLFxuICAgICAgYXB0LndhcmRyb2JlUUNfU2NyYXRjaGVzLFxuICAgICAgYXB0LndhcmRyb2JlUUNfRHJhd2Vyc0Z1bmN0aW9uXG4gICAgXTtcblxuICAgIGlmIChxY0ZpZWxkcy5zb21lKHZhbCA9PiB2YWwgPT09IFwiTm90IE9LXCIpKSByZXR1cm4gXCJSZWplY3RlZFwiO1xuICAgIGlmIChxY0ZpZWxkcy5zb21lKHZhbCA9PiB2YWwgPT09IG51bGwgfHwgdmFsID09PSB1bmRlZmluZWQgfHwgdmFsID09PSBcIlwiKSkgcmV0dXJuIFwiUUMgUGVuZGluZ1wiO1xuICAgIHJldHVybiBcIkFwcHJvdmVkXCI7XG4gIH1cblxuICBpZiAocHJvZHVjdCA9PT0gXCJ2YW5pdHlcIikge1xuICAgIGlmIChHID09PSAwKSByZXR1cm4gXCJOL0FcIjtcbiAgICBjb25zdCBpbnN0YWxsQ29tcGxldGUgPSBbXG4gICAgICBhcHQudmFuaXR5Q2FiaW5ldHNJbnN0YWxsZWQgfHwgYXB0LnZhbml0eUNhYmluZXRJbnN0YWxsZWQgfHwgMCxcbiAgICAgIGFwdC52YW5pdHlTaHV0dGVySGFyZHdhcmVJbnN0YWxsZWQgfHwgMFxuICAgIF0uZXZlcnkodmFsID0+ICh2YWwgfHwgMCkgPj0gMTAwKTtcblxuICAgIGlmICghaW5zdGFsbENvbXBsZXRlKSByZXR1cm4gXCJJbnN0YWxsYXRpb24gUGVuZGluZ1wiO1xuXG4gICAgY29uc3QgcWNGaWVsZHMgPSBbXG4gICAgICBhcHQudmFuaXR5UUNfVmlzaWJsZVNjcmV3cyxcbiAgICAgIGFwdC52YW5pdHlRQ19DaGlwcGluZyxcbiAgICAgIGFwdC52YW5pdHlRQ19GaWxsZXJNaXNzaW5nLFxuICAgICAgYXB0LnZhbml0eVFDX1NjcmF0Y2hlcyxcbiAgICAgIGFwdC52YW5pdHlRQ19EcmF3ZXJzRnVuY3Rpb25cbiAgICBdO1xuXG4gICAgaWYgKHFjRmllbGRzLnNvbWUodmFsID0+IHZhbCA9PT0gXCJOb3QgT0tcIikpIHJldHVybiBcIlJlamVjdGVkXCI7XG4gICAgaWYgKHFjRmllbGRzLnNvbWUodmFsID0+IHZhbCA9PT0gbnVsbCB8fCB2YWwgPT09IHVuZGVmaW5lZCB8fCB2YWwgPT09IFwiXCIpKSByZXR1cm4gXCJRQyBQZW5kaW5nXCI7XG4gICAgcmV0dXJuIFwiQXBwcm92ZWRcIjtcbiAgfVxuXG4gIGlmIChwcm9kdWN0ID09PSBcImRvb3JcIikge1xuICAgIGlmIChIID09PSAwKSByZXR1cm4gXCJOL0FcIjtcbiAgICBjb25zdCBpbnN0YWxsQ29tcGxldGUgPSBbXG4gICAgICBhcHQuZG9vckZyYW1lSGFyZHdhcmVJbnN0YWxsZWQgfHwgMFxuICAgIF0uZXZlcnkodmFsID0+ICh2YWwgfHwgMCkgPj0gMTAwKTtcblxuICAgIGlmICghaW5zdGFsbENvbXBsZXRlKSByZXR1cm4gXCJJbnN0YWxsYXRpb24gUGVuZGluZ1wiO1xuXG4gICAgY29uc3QgcWNGaWVsZHMgPSBbXG4gICAgICBhcHQuZG9vclFDX0NoaXBwaW5nLFxuICAgICAgYXB0LmRvb3JRQ19BbGlnbm1lbnRcbiAgICBdO1xuXG4gICAgaWYgKHFjRmllbGRzLnNvbWUodmFsID0+IHZhbCA9PT0gXCJOb3QgT0tcIikpIHJldHVybiBcIlJlamVjdGVkXCI7XG4gICAgaWYgKHFjRmllbGRzLnNvbWUodmFsID0+IHZhbCA9PT0gbnVsbCB8fCB2YWwgPT09IHVuZGVmaW5lZCB8fCB2YWwgPT09IFwiXCIpKSByZXR1cm4gXCJRQyBQZW5kaW5nXCI7XG4gICAgcmV0dXJuIFwiQXBwcm92ZWRcIjtcbiAgfVxuXG4gIHJldHVybiBcIk4vQVwiO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2FsY3VsYXRlS2l0Y2hlbkNvbXBsZXRpb25QY3QoYXB0LCBraXRjaGVuUUNHYXRlKSB7XG4gIGNvbnN0IEUgPSBhcHQua2l0Y2hlblF0eSB8fCAwO1xuICBpZiAoRSA9PT0gMCkgcmV0dXJuIDAuMDtcblxuICBjb25zdCBoYW5kb3ZlckFwcHJvdmVkID0ga2l0Y2hlblFDR2F0ZSA9PT0gXCJBcHByb3ZlZFwiO1xuICBjb25zdCBmaWVsZHMgPSBbXG4gICAgYXB0LmtpdGNoZW5Mb3dlckNhcmNhc3NJbnN0YWxsZWQsXG4gICAgYXB0LmtpdGNoZW5VcHBlckNhcmNhc3NJbnN0YWxsZWQsXG4gICAgYXB0LmtpdGNoZW5TdG9uZUluc3RhbGxlZCxcbiAgICBhcHQua2l0Y2hlblNodXR0ZXJzSGFyZHdhcmVJbnN0YWxsZWQgfHwgYXB0LmtpdGNoZW5TaHV0dGVySGFyZHdhcmVJbnN0YWxsZWQgfHwgMCxcbiAgICBhcHQua2l0Y2hlbkFwcGxpYW5jZXNJbnN0YWxsZWQgfHwgYXB0LmtpdGNoZW5BcHBsaWFuY2VJbnN0YWxsZWQgfHwgMFxuICBdO1xuXG4gIGNvbnN0IHN1bUluc3RhbGwgPSBmaWVsZHMucmVkdWNlKChzdW0sIHZhbCkgPT4gc3VtICsgcGN0KHZhbCksIDApO1xuICBjb25zdCBoYW5kb3ZlclZhbCA9IHBjdChhcHQua2l0Y2hlbkhhbmRlZE92ZXIpO1xuICBjb25zdCBoYW5kb3ZlckNvbnRyaWIgPSAoaGFuZG92ZXJBcHByb3ZlZCAmJiBoYW5kb3ZlclZhbCA+PSAxLjApID8gMS4wIDogMC4wO1xuXG4gIHJldHVybiAoc3VtSW5zdGFsbCArIGhhbmRvdmVyQ29udHJpYikgLyA2LjA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjYWxjdWxhdGVXYXJkcm9iZUNvbXBsZXRpb25QY3QoYXB0LCB3YXJkcm9iZVFDR2F0ZSkge1xuICBjb25zdCBGID0gYXB0LndhcmRyb2JlUXR5IHx8IDA7XG4gIGlmIChGID09PSAwKSByZXR1cm4gMC4wO1xuXG4gIGNvbnN0IGhhbmRvdmVyQXBwcm92ZWQgPSB3YXJkcm9iZVFDR2F0ZSA9PT0gXCJBcHByb3ZlZFwiO1xuICBjb25zdCBmaWVsZHMgPSBbXG4gICAgYXB0LndhcmRyb2Jlc0NhYmluZXRzSW5zdGFsbGVkIHx8IGFwdC53YXJkcm9iZUNhYmluZXRJbnN0YWxsZWQgfHwgMCxcbiAgICBhcHQud2FyZHJvYmVTaHV0dGVySGFyZHdhcmVJbnN0YWxsZWQgfHwgMFxuICBdO1xuXG4gIGNvbnN0IHN1bUluc3RhbGwgPSBmaWVsZHMucmVkdWNlKChzdW0sIHZhbCkgPT4gc3VtICsgcGN0KHZhbCksIDApO1xuICBjb25zdCBoYW5kb3ZlclZhbCA9IHBjdChhcHQud2FyZHJvYmVIYW5kZWRPdmVyKTtcbiAgY29uc3QgaGFuZG92ZXJDb250cmliID0gKGhhbmRvdmVyQXBwcm92ZWQgJiYgaGFuZG92ZXJWYWwgPj0gMS4wKSA/IDEuMCA6IDAuMDtcblxuICByZXR1cm4gKHN1bUluc3RhbGwgKyBoYW5kb3ZlckNvbnRyaWIpIC8gMy4wO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2FsY3VsYXRlVmFuaXR5Q29tcGxldGlvblBjdChhcHQsIHZhbml0eVFDR2F0ZSkge1xuICBjb25zdCBHID0gYXB0LnZhbml0eVF0eSB8fCAwO1xuICBpZiAoRyA9PT0gMCkgcmV0dXJuIDAuMDtcblxuICBjb25zdCBoYW5kb3ZlckFwcHJvdmVkID0gdmFuaXR5UUNHYXRlID09PSBcIkFwcHJvdmVkXCI7XG4gIGNvbnN0IGZpZWxkcyA9IFtcbiAgICBhcHQudmFuaXR5Q2FiaW5ldHNJbnN0YWxsZWQgfHwgYXB0LnZhbml0eUNhYmluZXRJbnN0YWxsZWQgfHwgMCxcbiAgICBhcHQudmFuaXR5U2h1dHRlckhhcmR3YXJlSW5zdGFsbGVkIHx8IDBcbiAgXTtcblxuICBjb25zdCBzdW1JbnN0YWxsID0gZmllbGRzLnJlZHVjZSgoc3VtLCB2YWwpID0+IHN1bSArIHBjdCh2YWwpLCAwKTtcbiAgY29uc3QgaGFuZG92ZXJWYWwgPSBwY3QoYXB0LnZhbml0eUhhbmRlZE92ZXIpO1xuICBjb25zdCBoYW5kb3ZlckNvbnRyaWIgPSAoaGFuZG92ZXJBcHByb3ZlZCAmJiBoYW5kb3ZlclZhbCA+PSAxLjApID8gMS4wIDogMC4wO1xuXG4gIHJldHVybiAoc3VtSW5zdGFsbCArIGhhbmRvdmVyQ29udHJpYikgLyAzLjA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjYWxjdWxhdGVEb29yQ29tcGxldGlvblBjdChhcHQsIGRvb3JRQ0dhdGUpIHtcbiAgY29uc3QgSCA9IGFwdC5kb29yUXR5IHx8IDA7XG4gIGlmIChIID09PSAwKSByZXR1cm4gMC4wO1xuXG4gIGNvbnN0IGhhbmRvdmVyQXBwcm92ZWQgPSBkb29yUUNHYXRlID09PSBcIkFwcHJvdmVkXCI7XG4gIGNvbnN0IGZpZWxkcyA9IFtcbiAgICBhcHQuZG9vckZyYW1lSGFyZHdhcmVJbnN0YWxsZWQgfHwgMFxuICBdO1xuXG4gIGNvbnN0IHN1bUluc3RhbGwgPSBmaWVsZHMucmVkdWNlKChzdW0sIHZhbCkgPT4gc3VtICsgcGN0KHZhbCksIDApO1xuICBjb25zdCBoYW5kb3ZlclZhbCA9IHBjdChhcHQuZG9vckhhbmRlZE92ZXIpO1xuICBjb25zdCBoYW5kb3ZlckNvbnRyaWIgPSAoaGFuZG92ZXJBcHByb3ZlZCAmJiBoYW5kb3ZlclZhbCA+PSAxLjApID8gMS4wIDogMC4wO1xuXG4gIHJldHVybiAoc3VtSW5zdGFsbCArIGhhbmRvdmVyQ29udHJpYikgLyAyLjA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjYWxjdWxhdGVPdmVyYWxsQ29tcGxldGlvblBjdChhcHQsIG1hdGVyaWFsV2VpZ2h0LCBleGVjdXRpb25XZWlnaHQsIG1hdFBjdCwga2l0UGN0LCB3YXJkUGN0LCB2YW5QY3QsIGRvb3JQY3QpIHtcbiAgY29uc3QgRSA9IGFwdC5raXRjaGVuUXR5IHx8IDA7XG4gIGNvbnN0IEYgPSBhcHQud2FyZHJvYmVRdHkgfHwgMDtcbiAgY29uc3QgRyA9IGFwdC52YW5pdHlRdHkgfHwgMDtcbiAgY29uc3QgSCA9IGFwdC5kb29yUXR5IHx8IDA7XG4gIGNvbnN0IHRvdGFsUXR5ID0gRSArIEYgKyBHICsgSDtcblxuICBpZiAodG90YWxRdHkgPT09IDApIHJldHVybiAwLjA7XG5cbiAgY29uc3Qgd2VpZ2h0ZWRJbnN0YWxsUGN0ID0gKChraXRQY3QgKiBFKSArICh3YXJkUGN0ICogRikgKyAodmFuUGN0ICogRykgKyAoZG9vclBjdCAqIEgpKSAvIHRvdGFsUXR5O1xuICByZXR1cm4gKG1hdFBjdCAqIG1hdGVyaWFsV2VpZ2h0KSArICh3ZWlnaHRlZEluc3RhbGxQY3QgKiBleGVjdXRpb25XZWlnaHQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2FsY3VsYXRlSGFuZG92ZXJBcHByb3ZhbFN0YXR1cyhraXRHYXRlLCB3YXJkR2F0ZSwgdmFuR2F0ZSwgZG9vckdhdGUsIEUsIEYsIEcsIEgpIHtcbiAgY29uc3QgYWN0aXZlR2F0ZXMgPSBbXTtcbiAgaWYgKEUgPiAwKSBhY3RpdmVHYXRlcy5wdXNoKGtpdEdhdGUpO1xuICBpZiAoRiA+IDApIGFjdGl2ZUdhdGVzLnB1c2god2FyZEdhdGUpO1xuICBpZiAoRyA+IDApIGFjdGl2ZUdhdGVzLnB1c2godmFuR2F0ZSk7XG4gIGlmIChIID4gMCkgYWN0aXZlR2F0ZXMucHVzaChkb29yR2F0ZSk7XG5cbiAgaWYgKGFjdGl2ZUdhdGVzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIFwiTm90IEFwcHJvdmVkXCI7XG5cbiAgaWYgKGFjdGl2ZUdhdGVzLnNvbWUoZyA9PiBnID09PSBcIlJlamVjdGVkXCIpKSByZXR1cm4gXCJRQyBSZWplY3RlZFwiO1xuICBpZiAoYWN0aXZlR2F0ZXMuc29tZShnID0+IGcgPT09IFwiUUMgUGVuZGluZ1wiKSkgcmV0dXJuIFwiUUMgUGVuZGluZ1wiO1xuICBpZiAoYWN0aXZlR2F0ZXMuc29tZShnID0+IGcgPT09IFwiSW5zdGFsbGF0aW9uIFBlbmRpbmdcIikpIHJldHVybiBcIkluc3RhbGxhdGlvbiBQZW5kaW5nXCI7XG4gIGlmIChhY3RpdmVHYXRlcy5ldmVyeShnID0+IGcgPT09IFwiQXBwcm92ZWRcIikpIHJldHVybiBcIkFwcHJvdmVkXCI7XG5cbiAgcmV0dXJuIFwiSW5zdGFsbGF0aW9uIFBlbmRpbmdcIjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNhbGN1bGF0ZUFwYXJ0bWVudFN0YXR1cyhhcHQsIGhhbmRvdmVyU3RhdHVzLCBtYXRQY3QpIHtcbiAgaWYgKGhhbmRvdmVyU3RhdHVzID09PSBcIlFDIFJlamVjdGVkXCIpIHJldHVybiBcIlFDIFJlamVjdGVkXCI7XG4gIGlmIChoYW5kb3ZlclN0YXR1cyA9PT0gXCJRQyBQZW5kaW5nXCIpIHJldHVybiBcIlFDIFBlbmRpbmdcIjtcblxuICBjb25zdCBFID0gYXB0LmtpdGNoZW5RdHkgfHwgMDtcbiAgY29uc3QgRiA9IGFwdC53YXJkcm9iZVF0eSB8fCAwO1xuICBjb25zdCBHID0gYXB0LnZhbml0eVF0eSB8fCAwO1xuICBjb25zdCBIID0gYXB0LmRvb3JRdHkgfHwgMDtcblxuICBpZiAoaGFuZG92ZXJTdGF0dXMgPT09IFwiQXBwcm92ZWRcIikge1xuICAgIC8vIGNoZWNrIGlmIGFsbCBoYW5kZWQgb3ZlciAoMTAwJSlcbiAgICBjb25zdCBraXRjaGVuSGFuZGVkID0gRSA+IDAgPyAoKGFwdC5raXRjaGVuSGFuZGVkT3ZlciB8fCAwKSA+PSAxMDApIDogdHJ1ZTtcbiAgICBjb25zdCB3YXJkcm9iZUhhbmRlZCA9IEYgPiAwID8gKChhcHQud2FyZHJvYmVIYW5kZWRPdmVyIHx8IDApID49IDEwMCkgOiB0cnVlO1xuICAgIGNvbnN0IHZhbml0eUhhbmRlZCA9IEcgPiAwID8gKChhcHQudmFuaXR5SGFuZGVkT3ZlciB8fCAwKSA+PSAxMDApIDogdHJ1ZTtcbiAgICBjb25zdCBkb29ySGFuZGVkID0gSCA+IDAgPyAoKGFwdC5kb29ySGFuZGVkT3ZlciB8fCAwKSA+PSAxMDApIDogdHJ1ZTtcblxuICAgIGlmIChraXRjaGVuSGFuZGVkICYmIHdhcmRyb2JlSGFuZGVkICYmIHZhbml0eUhhbmRlZCAmJiBkb29ySGFuZGVkKSB7XG4gICAgICByZXR1cm4gXCJDb21wbGV0ZWRcIjtcbiAgICB9XG4gICAgcmV0dXJuIFwiUmVhZHkgZm9yIEhhbmRvdmVyXCI7XG4gIH1cblxuICAvLyBDaGVjayBTdGFnZS0yIHByb2dyZXNzIFx1MjAxNCBhbnkgaW5zdGFsbGF0aW9uIGZpZWxkID4gMCBtZWFucyBwcm9ncmVzc1xuICBjb25zdCBoYXNTdGFnZTJQcm9ncmVzcyA9IFtcbiAgICBhcHQua2l0Y2hlbkxvd2VyQ2FyY2Fzc0luc3RhbGxlZCxcbiAgICBhcHQua2l0Y2hlblVwcGVyQ2FyY2Fzc0luc3RhbGxlZCxcbiAgICBhcHQua2l0Y2hlblN0b25lSW5zdGFsbGVkLFxuICAgIGFwdC5raXRjaGVuU2h1dHRlcnNIYXJkd2FyZUluc3RhbGxlZCB8fCBhcHQua2l0Y2hlblNodXR0ZXJIYXJkd2FyZUluc3RhbGxlZCB8fCAwLFxuICAgIGFwdC5raXRjaGVuQXBwbGlhbmNlc0luc3RhbGxlZCB8fCBhcHQua2l0Y2hlbkFwcGxpYW5jZUluc3RhbGxlZCB8fCAwLFxuICAgIGFwdC5raXRjaGVuSGFuZGVkT3ZlcixcbiAgICBhcHQud2FyZHJvYmVzQ2FiaW5ldHNJbnN0YWxsZWQgfHwgYXB0LndhcmRyb2JlQ2FiaW5ldEluc3RhbGxlZCB8fCAwLFxuICAgIGFwdC53YXJkcm9iZVNodXR0ZXJIYXJkd2FyZUluc3RhbGxlZCB8fCAwLFxuICAgIGFwdC53YXJkcm9iZUhhbmRlZE92ZXIsXG4gICAgYXB0LnZhbml0eUNhYmluZXRzSW5zdGFsbGVkIHx8IGFwdC52YW5pdHlDYWJpbmV0SW5zdGFsbGVkIHx8IDAsXG4gICAgYXB0LnZhbml0eVNodXR0ZXJIYXJkd2FyZUluc3RhbGxlZCB8fCAwLFxuICAgIGFwdC52YW5pdHlIYW5kZWRPdmVyLFxuICAgIGFwdC5kb29yRnJhbWVIYXJkd2FyZUluc3RhbGxlZCxcbiAgICBhcHQuZG9vckhhbmRlZE92ZXJcbiAgXS5zb21lKHZhbCA9PiAodmFsIHx8IDApID4gMCk7XG5cbiAgaWYgKGhhc1N0YWdlMlByb2dyZXNzKSByZXR1cm4gXCJFeGVjdXRpb24gSW4gUHJvZ3Jlc3NcIjtcbiAgaWYgKG1hdFBjdCA+PSAxLjApIHJldHVybiBcIk1hdGVyaWFsIFJlYWR5XCI7XG4gIGlmIChtYXRQY3QgPiAwLjApIHJldHVybiBcIk1hdGVyaWFsIElud2FyZFwiO1xuXG4gIHJldHVybiBcIk5vdCBTdGFydGVkXCI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjYWxjdWxhdGVEZWxheURheXMocGxhbm5lZENvbXAsIGFjdHVhbENvbXAsIHJlcG9ydERhdGUpIHtcbiAgaWYgKCFwbGFubmVkQ29tcCkgcmV0dXJuIDA7XG5cbiAgY29uc3QgcGxhbm5lZCA9IG5ldyBEYXRlKHBsYW5uZWRDb21wKTtcbiAgY29uc3QgY29tcCA9IGFjdHVhbENvbXAgPyBuZXcgRGF0ZShhY3R1YWxDb21wKSA6IG5ldyBEYXRlKHJlcG9ydERhdGUpO1xuXG4gIGNvbnN0IGRpZmZUaW1lID0gY29tcC5nZXRUaW1lKCkgLSBwbGFubmVkLmdldFRpbWUoKTtcbiAgY29uc3QgZGlmZkRheXMgPSBNYXRoLmNlaWwoZGlmZlRpbWUgLyAoMTAwMCAqIDYwICogNjAgKiAyNCkpO1xuXG4gIHJldHVybiBNYXRoLm1heCgwLCBkaWZmRGF5cyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjYWxjdWxhdGVIZWFsdGgoYXB0LCBkZWxheURheXMsIG92ZXJhbGxQY3QsIHN0YXR1cywgY29uZmlnKSB7XG4gIGlmIChzdGF0dXMgPT09IFwiQ29tcGxldGVkXCIpIHtcbiAgICBpZiAoZGVsYXlEYXlzID4gMCkge1xuICAgICAgcmV0dXJuIFwiRGVsYXllZFwiO1xuICAgIH1cbiAgICByZXR1cm4gXCJFeGNlbGxlbnRcIjtcbiAgfVxuXG4gIGlmIChkZWxheURheXMgPiAwKSB7XG4gICAgcmV0dXJuIFwiQ3JpdGljYWxcIjtcbiAgfVxuXG4gIHJldHVybiBcIkV4Y2VsbGVudFwiO1xufVxuXG4vKipcbiAqIFJ1bnMgYWxsIGNhbGN1bGF0ZWQgZmllbGQgbG9naWMgZm9yIGFuIGFwYXJ0bWVudCByb3cuXG4gKiBSZXR1cm5zIHRoZSB1cGRhdGVkIGZpZWxkcyBvYmplY3QuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWNhbGN1bGF0ZUFwYXJ0bWVudChhcHQsIGJ1aWxkaW5nQ29uZmlnKSB7XG4gIGNvbnN0IHJlcG9ydERhdGUgPSBidWlsZGluZ0NvbmZpZy5yZXBvcnREYXRlIHx8IG5ldyBEYXRlKCk7XG4gIGNvbnN0IG1hdGVyaWFsV2VpZ2h0ID0gYnVpbGRpbmdDb25maWcubWF0ZXJpYWxXZWlnaHQgPz8gMC4zO1xuICBjb25zdCBleGVjdXRpb25XZWlnaHQgPSBidWlsZGluZ0NvbmZpZy5leGVjdXRpb25XZWlnaHQgPz8gMC43O1xuXG4gIC8vIDEuIE1hdGVyaWFsIElud2FyZCAlXG4gIGNvbnN0IG1hdFBjdCA9IGNhbGN1bGF0ZU1hdGVyaWFsSW53YXJkUGN0KGFwdCk7XG5cbiAgLy8gMi4gUUMgR2F0ZXNcbiAgY29uc3Qga2l0R2F0ZSA9IGNhbGN1bGF0ZVFDR2F0ZShhcHQsIFwia2l0Y2hlblwiKTtcbiAgY29uc3Qgd2FyZEdhdGUgPSBjYWxjdWxhdGVRQ0dhdGUoYXB0LCBcIndhcmRyb2JlXCIpO1xuICBjb25zdCB2YW5HYXRlID0gY2FsY3VsYXRlUUNHYXRlKGFwdCwgXCJ2YW5pdHlcIik7XG4gIGNvbnN0IGRvb3JHYXRlID0gY2FsY3VsYXRlUUNHYXRlKGFwdCwgXCJkb29yXCIpO1xuXG4gIC8vIDMuIFByb2R1Y3QgY29tcGxldGlvbiAlc1xuICBjb25zdCBraXRQY3QgPSBjYWxjdWxhdGVLaXRjaGVuQ29tcGxldGlvblBjdChhcHQsIGtpdEdhdGUpO1xuICBjb25zdCB3YXJkUGN0ID0gY2FsY3VsYXRlV2FyZHJvYmVDb21wbGV0aW9uUGN0KGFwdCwgd2FyZEdhdGUpO1xuICBjb25zdCB2YW5QY3QgPSBjYWxjdWxhdGVWYW5pdHlDb21wbGV0aW9uUGN0KGFwdCwgdmFuR2F0ZSk7XG4gIGNvbnN0IGRvb3JQY3QgPSBjYWxjdWxhdGVEb29yQ29tcGxldGlvblBjdChhcHQsIGRvb3JHYXRlKTtcblxuICAvLyA0LiBPdmVyYWxsIENvbXBsZXRpb24gJVxuICBjb25zdCBvdmVyYWxsUGN0ID0gY2FsY3VsYXRlT3ZlcmFsbENvbXBsZXRpb25QY3QoYXB0LCBtYXRlcmlhbFdlaWdodCwgZXhlY3V0aW9uV2VpZ2h0LCBtYXRQY3QsIGtpdFBjdCwgd2FyZFBjdCwgdmFuUGN0LCBkb29yUGN0KTtcblxuICAvLyA1LiBIYW5kb3ZlciBBcHByb3ZhbCBTdGF0dXNcbiAgY29uc3QgRSA9IGFwdC5raXRjaGVuUXR5IHx8IDA7XG4gIGNvbnN0IEYgPSBhcHQud2FyZHJvYmVRdHkgfHwgMDtcbiAgY29uc3QgRyA9IGFwdC52YW5pdHlRdHkgfHwgMDtcbiAgY29uc3QgSCA9IGFwdC5kb29yUXR5IHx8IDA7XG4gIGNvbnN0IGhhbmRvdmVyU3RhdHVzID0gY2FsY3VsYXRlSGFuZG92ZXJBcHByb3ZhbFN0YXR1cyhraXRHYXRlLCB3YXJkR2F0ZSwgdmFuR2F0ZSwgZG9vckdhdGUsIEUsIEYsIEcsIEgpO1xuXG4gIC8vIDYuIEFwYXJ0bWVudCBTdGF0dXNcbiAgY29uc3Qgc3RhdHVzID0gY2FsY3VsYXRlQXBhcnRtZW50U3RhdHVzKGFwdCwgaGFuZG92ZXJTdGF0dXMsIG1hdFBjdCk7XG5cbiAgLy8gNy4gRGVsYXkgRGF5c1xuICBjb25zdCBkZWxheURheXMgPSBjYWxjdWxhdGVEZWxheURheXMoYXB0LnBsYW5uZWRDb21wbGV0aW9uLCBhcHQuYWN0dWFsQ29tcGxldGlvbiwgcmVwb3J0RGF0ZSk7XG5cbiAgLy8gOC4gSGVhbHRoXG4gIGNvbnN0IGhlYWx0aCA9IGNhbGN1bGF0ZUhlYWx0aChhcHQsIGRlbGF5RGF5cywgb3ZlcmFsbFBjdCwgc3RhdHVzLCBidWlsZGluZ0NvbmZpZyk7XG5cbiAgcmV0dXJuIHtcbiAgICAuLi5hcHQsXG4gICAgbWF0ZXJpYWxJbndhcmRQY3Q6IE1hdGgucm91bmQobWF0UGN0ICogMTAwMCkgLyAxMDAwLFxuICAgIGtpdGNoZW5Db21wbGV0aW9uUGN0OiBNYXRoLnJvdW5kKGtpdFBjdCAqIDEwMDApIC8gMTAwMCxcbiAgICB3YXJkcm9iZUNvbXBsZXRpb25QY3Q6IE1hdGgucm91bmQod2FyZFBjdCAqIDEwMDApIC8gMTAwMCxcbiAgICB2YW5pdHlDb21wbGV0aW9uUGN0OiBNYXRoLnJvdW5kKHZhblBjdCAqIDEwMDApIC8gMTAwMCxcbiAgICBkb29yQ29tcGxldGlvblBjdDogTWF0aC5yb3VuZChkb29yUGN0ICogMTAwMCkgLyAxMDAwLFxuICAgIG92ZXJhbGxDb21wbGV0aW9uUGN0OiBNYXRoLnJvdW5kKG92ZXJhbGxQY3QgKiAxMDAwKSAvIDEwMDAsXG4gICAga2l0Y2hlblFDR2F0ZToga2l0R2F0ZSxcbiAgICB3YXJkcm9iZVFDR2F0ZTogd2FyZEdhdGUsXG4gICAgdmFuaXR5UUNHYXRlOiB2YW5HYXRlLFxuICAgIGRvb3JRQ0dhdGU6IGRvb3JHYXRlLFxuICAgIGhhbmRvdmVyQXBwcm92YWxTdGF0dXM6IGhhbmRvdmVyU3RhdHVzLFxuICAgIGFwYXJ0bWVudFN0YXR1czogc3RhdHVzLFxuICAgIGRlbGF5RGF5cyxcbiAgICBoZWFsdGhcbiAgfTtcbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcaHBcXFxcRG93bmxvYWRzXFxcXERpbyBHcmFjZWVcXFxcRGlvIEdyYWNlZVxcXFxiYWNrZW5kXFxcXHNyY1xcXFxjb250cm9sbGVyc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcaHBcXFxcRG93bmxvYWRzXFxcXERpbyBHcmFjZWVcXFxcRGlvIEdyYWNlZVxcXFxiYWNrZW5kXFxcXHNyY1xcXFxjb250cm9sbGVyc1xcXFxidWlsZGluZ0NvbnRyb2xsZXIuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL2hwL0Rvd25sb2Fkcy9EaW8lMjBHcmFjZWUvRGlvJTIwR3JhY2VlL2JhY2tlbmQvc3JjL2NvbnRyb2xsZXJzL2J1aWxkaW5nQ29udHJvbGxlci5qc1wiO2ltcG9ydCB7IFByaXNtYUNsaWVudCB9IGZyb20gJ0BwcmlzbWEvY2xpZW50JztcbmltcG9ydCB7IHJlY2FsY3VsYXRlQXBhcnRtZW50IH0gZnJvbSAnLi4vc2VydmljZXMvY2FsY3VsYXRpb25TZXJ2aWNlLmpzJztcblxuY29uc3QgcHJpc21hID0gbmV3IFByaXNtYUNsaWVudCgpO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbGlzdEJ1aWxkaW5ncyhyZXEsIHJlcykge1xuICBjb25zdCB7IG9yZGVySWQgfSA9IHJlcS5wYXJhbXM7XG4gIHRyeSB7XG4gICAgY29uc3QgYnVpbGRpbmdzID0gYXdhaXQgcHJpc21hLmJ1aWxkaW5nLmZpbmRNYW55KHtcbiAgICAgIHdoZXJlOiB7IG9yZGVySWQgfSxcbiAgICAgIGluY2x1ZGU6IHtcbiAgICAgICAgYXBhcnRtZW50czoge1xuICAgICAgICAgIHNlbGVjdDoge1xuICAgICAgICAgICAgb3ZlcmFsbENvbXBsZXRpb25QY3Q6IHRydWUsXG4gICAgICAgICAgICBhcGFydG1lbnRTdGF0dXM6IHRydWUsXG4gICAgICAgICAgICBoZWFsdGg6IHRydWVcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBvcmRlckJ5OiB7IGNyZWF0ZWRBdDogJ2FzYycgfVxuICAgIH0pO1xuXG4gICAgLy8gQ29tcHV0ZSBtZXRyaWNzIGZvciBlYWNoIGJ1aWxkaW5nXG4gICAgY29uc3QgcmVzdWx0ID0gYnVpbGRpbmdzLm1hcChidWlsZGluZyA9PiB7XG4gICAgICBjb25zdCBhcGFydG1lbnRzID0gYnVpbGRpbmcuYXBhcnRtZW50cztcbiAgICAgIGNvbnN0IGNvdW50ID0gYXBhcnRtZW50cy5sZW5ndGg7XG4gICAgICBcbiAgICAgIGxldCBzdW1Db21wbGV0aW9uID0gMC4wO1xuICAgICAgbGV0IGNvbXBsZXRlZENvdW50ID0gMDtcbiAgICAgIGxldCBpblByb2dyZXNzQ291bnQgPSAwO1xuICAgICAgbGV0IGRlbGF5ZWRDb3VudCA9IDA7XG4gICAgICBsZXQgY3JpdGljYWxDb3VudCA9IDA7XG5cbiAgICAgIGZvciAoY29uc3QgYXB0IG9mIGFwYXJ0bWVudHMpIHtcbiAgICAgICAgc3VtQ29tcGxldGlvbiArPSBhcHQub3ZlcmFsbENvbXBsZXRpb25QY3QgfHwgMC4wO1xuICAgICAgICBpZiAoYXB0LmFwYXJ0bWVudFN0YXR1cyA9PT0gXCJDb21wbGV0ZWRcIikgY29tcGxldGVkQ291bnQrKztcbiAgICAgICAgZWxzZSBpZiAoYXB0LmFwYXJ0bWVudFN0YXR1cyAhPT0gXCJOb3QgU3RhcnRlZFwiKSBpblByb2dyZXNzQ291bnQrKztcblxuICAgICAgICBpZiAoYXB0LmhlYWx0aCA9PT0gXCJEZWxheWVkXCIpIGRlbGF5ZWRDb3VudCsrO1xuICAgICAgICBlbHNlIGlmIChhcHQuaGVhbHRoID09PSBcIkNyaXRpY2FsXCIpIGNyaXRpY2FsQ291bnQrKztcbiAgICAgIH1cblxuICAgICAgY29uc3Qgb3ZlcmFsbENvbXBsZXRpb24gPSBjb3VudCA+IDAgPyAoc3VtQ29tcGxldGlvbiAvIGNvdW50KSA6IDAuMDtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgaWQ6IGJ1aWxkaW5nLmlkLFxuICAgICAgICBuYW1lOiBidWlsZGluZy5uYW1lLFxuICAgICAgICBjYXBhY2l0eTogYnVpbGRpbmcuY2FwYWNpdHksXG4gICAgICAgIHNpdGVOYW1lOiBidWlsZGluZy5zaXRlTmFtZSxcbiAgICAgICAgcmVwb3J0RGF0ZTogYnVpbGRpbmcucmVwb3J0RGF0ZSxcbiAgICAgICAgb3ZlcmFsbENvbXBsZXRpb246IE1hdGgucm91bmQob3ZlcmFsbENvbXBsZXRpb24gKiAxMDAwKSAvIDEwMDAsXG4gICAgICAgIGNvbXBsZXRlZENvdW50LFxuICAgICAgICBpblByb2dyZXNzQ291bnQsXG4gICAgICAgIGRlbGF5ZWRDb3VudDogZGVsYXllZENvdW50ICsgY3JpdGljYWxDb3VudCxcbiAgICAgICAgY3JlYXRlZEF0OiBidWlsZGluZy5jcmVhdGVkQXRcbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcmVzLmpzb24ocmVzdWx0KTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgY29uc29sZS5lcnJvcignTGlzdCBidWlsZGluZ3MgZXJyb3I6JywgZXJyKTtcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oeyBlcnJvcjogJ0ludGVybmFsIHNlcnZlciBlcnJvciBsaXN0aW5nIGJ1aWxkaW5ncycgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNyZWF0ZUJ1aWxkaW5nKHJlcSwgcmVzKSB7XG4gIGNvbnN0IHsgb3JkZXJJZCB9ID0gcmVxLnBhcmFtcztcbiAgY29uc3Qge1xuICAgIG5hbWUsXG4gICAgY291bnQsXG4gICAgY2FwYWNpdHksXG4gICAgc2l0ZU5hbWUsXG4gICAgcmVwb3J0RGF0ZSxcbiAgICBtYXRlcmlhbFdlaWdodCxcbiAgICBleGVjdXRpb25XZWlnaHQsXG4gICAgZ29vZFRocmVzaG9sZCxcbiAgICBleGNlbGxlbnRUaHJlc2hvbGQsXG4gICAgZGVsYXllZERheXNUaHJlc2hvbGQsXG4gICAgY3JpdGljYWxEYXlzVGhyZXNob2xkXG4gIH0gPSByZXEuYm9keTtcblxuICBpZiAoIWNhcGFjaXR5KSB7XG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHsgZXJyb3I6ICdDYXBhY2l0eSBpcyByZXF1aXJlZCcgfSk7XG4gIH1cblxuICBjb25zdCBwYXJzZWRDYXBhY2l0eSA9IHBhcnNlSW50KGNhcGFjaXR5LCAxMCk7XG4gIGlmIChpc05hTihwYXJzZWRDYXBhY2l0eSkgfHwgcGFyc2VkQ2FwYWNpdHkgPD0gMCkge1xuICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7IGVycm9yOiAnQ2FwYWNpdHkgbXVzdCBiZSBhIHBvc2l0aXZlIGludGVnZXInIH0pO1xuICB9XG5cbiAgY29uc3QgbnVtVG93ZXJzID0gY291bnQgPyBNYXRoLm1heCgxLCBwYXJzZUludChjb3VudCwgMTApKSA6IDE7XG4gIGNvbnN0IGJhc2VOYW1lID0gbmFtZSAmJiB0eXBlb2YgbmFtZSA9PT0gJ3N0cmluZycgJiYgbmFtZS50cmltKCkgPyBuYW1lLnRyaW0oKSA6ICdUb3dlcic7XG5cbiAgdHJ5IHtcbiAgICBpZiAocmVxLnVzZXIucm9sZSAhPT0gJ1JPTEVfQScpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMykuanNvbih7IGVycm9yOiAnT25seSBEYXRhIEVudHJ5IC8gU2V0dXAgcm9sZSBjYW4gYWRkIGJ1aWxkaW5ncycgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgYnVpbGRpbmdSZXBvcnREYXRlID0gcmVwb3J0RGF0ZSA/IG5ldyBEYXRlKHJlcG9ydERhdGUpIDogbmV3IERhdGUoKTtcblxuICAgIGNvbnN0IG9yZGVyID0gYXdhaXQgcHJpc21hLm9yZGVyLmZpbmRVbmlxdWUoe1xuICAgICAgd2hlcmU6IHsgaWQ6IG9yZGVySWQgfSxcbiAgICAgIHNlbGVjdDogeyBzdXBlcnZpc29yTmFtZTogdHJ1ZSwgY29udHJhY3RvcklkOiB0cnVlLCBjb250cmFjdG9yTmFtZTogdHJ1ZSB9XG4gICAgfSk7XG4gICAgY29uc3QgZGVmYXVsdFN1cGVydmlzb3IgPSBvcmRlcj8uc3VwZXJ2aXNvck5hbWUgfHwgJyc7XG4gICAgY29uc3QgZGVmYXVsdENvbnRyYWN0b3IgPSBvcmRlcj8uY29udHJhY3RvcklkIHx8ICcnO1xuICAgIGNvbnN0IGRlZmF1bHRDb250cmFjdG9yTmFtZSA9IG9yZGVyPy5jb250cmFjdG9yTmFtZSB8fCAnJztcblxuICAgIGNvbnN0IGNvbW1vbkNvbmZpZyA9IHtcbiAgICAgIGNhcGFjaXR5OiBwYXJzZWRDYXBhY2l0eSxcbiAgICAgIHNpdGVOYW1lOiBzaXRlTmFtZSA/IFN0cmluZyhzaXRlTmFtZSkudHJpbSgpIDogJycsXG4gICAgICByZXBvcnREYXRlOiBidWlsZGluZ1JlcG9ydERhdGUsXG4gICAgICBtYXRlcmlhbFdlaWdodDogbWF0ZXJpYWxXZWlnaHQgIT09IHVuZGVmaW5lZCA/IHBhcnNlRmxvYXQobWF0ZXJpYWxXZWlnaHQpIDogMC4zLFxuICAgICAgZXhlY3V0aW9uV2VpZ2h0OiBleGVjdXRpb25XZWlnaHQgIT09IHVuZGVmaW5lZCA/IHBhcnNlRmxvYXQoZXhlY3V0aW9uV2VpZ2h0KSA6IDAuNyxcbiAgICAgIGdvb2RUaHJlc2hvbGQ6IGdvb2RUaHJlc2hvbGQgIT09IHVuZGVmaW5lZCA/IHBhcnNlRmxvYXQoZ29vZFRocmVzaG9sZCkgOiAwLjc1LFxuICAgICAgZXhjZWxsZW50VGhyZXNob2xkOiBleGNlbGxlbnRUaHJlc2hvbGQgIT09IHVuZGVmaW5lZCA/IHBhcnNlRmxvYXQoZXhjZWxsZW50VGhyZXNob2xkKSA6IDAuOSxcbiAgICAgIGRlbGF5ZWREYXlzVGhyZXNob2xkOiBkZWxheWVkRGF5c1RocmVzaG9sZCAhPT0gdW5kZWZpbmVkID8gcGFyc2VJbnQoZGVsYXllZERheXNUaHJlc2hvbGQsIDEwKSA6IDcsXG4gICAgICBjcml0aWNhbERheXNUaHJlc2hvbGQ6IGNyaXRpY2FsRGF5c1RocmVzaG9sZCAhPT0gdW5kZWZpbmVkID8gcGFyc2VJbnQoY3JpdGljYWxEYXlzVGhyZXNob2xkLCAxMCkgOiAxNFxuICAgIH07XG5cbiAgICAvLyBVc2UgdHJhbnNhY3Rpb24gdG8gY3JlYXRlIGJ1aWxkaW5nKHMpIGFuZCBhcGFydG1lbnRzXG4gICAgY29uc3QgY3JlYXRlZEJ1aWxkaW5ncyA9IGF3YWl0IHByaXNtYS4kdHJhbnNhY3Rpb24oYXN5bmMgKHR4KSA9PiB7XG4gICAgICBjb25zdCBsaXN0ID0gW107XG5cbiAgICAgIGZvciAobGV0IHQgPSAxOyB0IDw9IG51bVRvd2VyczsgdCsrKSB7XG4gICAgICAgIGNvbnN0IHRvd2VyTmFtZSA9IG51bVRvd2VycyA+IDEgPyBgJHtiYXNlTmFtZX0gJHt0fWAgOiBiYXNlTmFtZTtcbiAgICAgICAgY29uc3QgYnVpbGRpbmdDb25maWcgPSB7XG4gICAgICAgICAgbmFtZTogdG93ZXJOYW1lLFxuICAgICAgICAgIC4uLmNvbW1vbkNvbmZpZ1xuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IGJ1aWxkaW5nID0gYXdhaXQgdHguYnVpbGRpbmcuY3JlYXRlKHtcbiAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBvcmRlcklkLFxuICAgICAgICAgICAgLi4uYnVpbGRpbmdDb25maWdcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIEdlbmVyYXRlIGVtcHR5IGFwYXJ0bWVudCByb3dzIGZvciB0aGlzIGJ1aWxkaW5nXG4gICAgICAgIGNvbnN0IGFwYXJ0bWVudHNEYXRhID0gW107XG4gICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IHBhcnNlZENhcGFjaXR5OyBpKyspIHtcbiAgICAgICAgICBjb25zdCByYXdBcHQgPSB7XG4gICAgICAgICAgICBidWlsZGluZ0lkOiBidWlsZGluZy5pZCxcbiAgICAgICAgICAgIHNyTm86IGksXG4gICAgICAgICAgICBhcGFydG1lbnRObzogbnVsbCxcbiAgICAgICAgICAgIGZsb29yOiBudWxsLFxuICAgICAgICAgICAgcHJpb3JpdHk6ICdOb3JtYWwnLFxuICAgICAgICAgICAga2l0Y2hlblF0eTogbnVsbCxcbiAgICAgICAgICAgIHdhcmRyb2JlUXR5OiBudWxsLFxuICAgICAgICAgICAgdmFuaXR5UXR5OiBudWxsLFxuICAgICAgICAgICAgZG9vclF0eTogbnVsbCxcbiAgICAgICAgICAgIGtpdGNoZW5UeXBlOiAnSy1UeXBlIDEnLFxuICAgICAgICAgICAgd2FyZHJvYmVUeXBlOiAnVy1UeXBlIDEnLFxuICAgICAgICAgICAgdmFuaXR5VHlwZTogJ1YtVHlwZSAxJyxcbiAgICAgICAgICAgIGRvb3JUeXBlOiAnRC1UeXBlIDEnLFxuICAgICAgICAgICAgc3VwZXJ2aXNvck5hbWU6IGRlZmF1bHRTdXBlcnZpc29yLFxuICAgICAgICAgICAgcmVzcG9uc2libGVFbmdpbmVlcjogZGVmYXVsdFN1cGVydmlzb3IsXG4gICAgICAgICAgICBjb250cmFjdG9yOiBkZWZhdWx0Q29udHJhY3RvcixcbiAgICAgICAgICAgIGNvbnRyYWN0b3JOYW1lOiBkZWZhdWx0Q29udHJhY3Rvck5hbWVcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgY29uc3QgY2FsY3VsYXRlZCA9IHJlY2FsY3VsYXRlQXBhcnRtZW50KHJhd0FwdCwgYnVpbGRpbmdDb25maWcpO1xuICAgICAgICAgIGFwYXJ0bWVudHNEYXRhLnB1c2goY2FsY3VsYXRlZCk7XG4gICAgICAgIH1cblxuICAgICAgICBhd2FpdCB0eC5hcGFydG1lbnQuY3JlYXRlTWFueSh7XG4gICAgICAgICAgZGF0YTogYXBhcnRtZW50c0RhdGFcbiAgICAgICAgfSk7XG5cbiAgICAgICAgbGlzdC5wdXNoKGJ1aWxkaW5nKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGxpc3Q7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDEpLmpzb24obnVtVG93ZXJzID09PSAxID8gY3JlYXRlZEJ1aWxkaW5nc1swXSA6IGNyZWF0ZWRCdWlsZGluZ3MpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKCdDcmVhdGUgYnVpbGRpbmcgZXJyb3I6JywgZXJyKTtcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oeyBlcnJvcjogJ0ludGVybmFsIHNlcnZlciBlcnJvciBjcmVhdGluZyBidWlsZGluZycgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEJ1aWxkaW5nKHJlcSwgcmVzKSB7XG4gIGNvbnN0IHsgYnVpbGRpbmdJZCB9ID0gcmVxLnBhcmFtcztcbiAgdHJ5IHtcbiAgICBjb25zdCBidWlsZGluZyA9IGF3YWl0IHByaXNtYS5idWlsZGluZy5maW5kVW5pcXVlKHtcbiAgICAgIHdoZXJlOiB7IGlkOiBidWlsZGluZ0lkIH0sXG4gICAgICBpbmNsdWRlOiB7XG4gICAgICAgIG9yZGVyOiB7XG4gICAgICAgICAgc2VsZWN0OiB7XG4gICAgICAgICAgICBpZDogdHJ1ZSxcbiAgICAgICAgICAgIG9yZGVyTnVtYmVyOiB0cnVlLFxuICAgICAgICAgICAgY29udHJhY3RvcklkOiB0cnVlLFxuICAgICAgICAgICAgY29udHJhY3Rvck5hbWU6IHRydWVcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGlmICghYnVpbGRpbmcpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwNCkuanNvbih7IGVycm9yOiAnQnVpbGRpbmcgbm90IGZvdW5kJyB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzLmpzb24oYnVpbGRpbmcpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oeyBlcnJvcjogJ0ludGVybmFsIHNlcnZlciBlcnJvcicgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHVwZGF0ZUJ1aWxkaW5nQ29uZmlnKHJlcSwgcmVzKSB7XG4gIGNvbnN0IHsgYnVpbGRpbmdJZCB9ID0gcmVxLnBhcmFtcztcbiAgY29uc3Qge1xuICAgIG5hbWUsXG4gICAgY2FwYWNpdHksXG4gICAgc2l0ZU5hbWUsXG4gICAgcmVwb3J0RGF0ZSxcbiAgICBtYXRlcmlhbFdlaWdodCxcbiAgICBleGVjdXRpb25XZWlnaHQsXG4gICAgZ29vZFRocmVzaG9sZCxcbiAgICBleGNlbGxlbnRUaHJlc2hvbGQsXG4gICAgZGVsYXllZERheXNUaHJlc2hvbGQsXG4gICAgY3JpdGljYWxEYXlzVGhyZXNob2xkXG4gIH0gPSByZXEuYm9keTtcblxuICB0cnkge1xuICAgIGlmIChyZXEudXNlci5yb2xlICE9PSAnUk9MRV9BJykge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAzKS5qc29uKHsgZXJyb3I6ICdPbmx5IERhdGEgRW50cnkgLyBTZXR1cCByb2xlIGNhbiB1cGRhdGUgY29uZmlndXJhdGlvbicgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgYnVpbGRpbmcgPSBhd2FpdCBwcmlzbWEuYnVpbGRpbmcuZmluZFVuaXF1ZSh7XG4gICAgICB3aGVyZTogeyBpZDogYnVpbGRpbmdJZCB9LFxuICAgICAgaW5jbHVkZTogeyBvcmRlcjogeyBzZWxlY3Q6IHsgY29udHJhY3RvcklkOiB0cnVlLCBjb250cmFjdG9yTmFtZTogdHJ1ZSB9IH0gfVxuICAgIH0pO1xuXG4gICAgaWYgKCFidWlsZGluZykge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgZXJyb3I6ICdCdWlsZGluZyBub3QgZm91bmQnIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IG5ld0NhcGFjaXR5ID0gY2FwYWNpdHkgIT09IHVuZGVmaW5lZCA/IHBhcnNlSW50KGNhcGFjaXR5LCAxMCkgOiBidWlsZGluZy5jYXBhY2l0eTtcblxuICAgIGNvbnN0IHVwZGF0ZWRDb25maWcgPSB7XG4gICAgICBuYW1lOiBuYW1lICE9PSB1bmRlZmluZWQgPyBuYW1lIDogYnVpbGRpbmcubmFtZSxcbiAgICAgIGNhcGFjaXR5OiBuZXdDYXBhY2l0eSxcbiAgICAgIHNpdGVOYW1lOiBzaXRlTmFtZSAhPT0gdW5kZWZpbmVkID8gc2l0ZU5hbWUgOiBidWlsZGluZy5zaXRlTmFtZSxcbiAgICAgIHJlcG9ydERhdGU6IHJlcG9ydERhdGUgPyBuZXcgRGF0ZShyZXBvcnREYXRlKSA6IGJ1aWxkaW5nLnJlcG9ydERhdGUsXG4gICAgICBtYXRlcmlhbFdlaWdodDogbWF0ZXJpYWxXZWlnaHQgIT09IHVuZGVmaW5lZCA/IHBhcnNlRmxvYXQobWF0ZXJpYWxXZWlnaHQpIDogYnVpbGRpbmcubWF0ZXJpYWxXZWlnaHQsXG4gICAgICBleGVjdXRpb25XZWlnaHQ6IGV4ZWN1dGlvbldlaWdodCAhPT0gdW5kZWZpbmVkID8gcGFyc2VGbG9hdChleGVjdXRpb25XZWlnaHQpIDogYnVpbGRpbmcuZXhlY3V0aW9uV2VpZ2h0LFxuICAgICAgZ29vZFRocmVzaG9sZDogZ29vZFRocmVzaG9sZCAhPT0gdW5kZWZpbmVkID8gcGFyc2VGbG9hdChnb29kVGhyZXNob2xkKSA6IGJ1aWxkaW5nLmdvb2RUaHJlc2hvbGQsXG4gICAgICBleGNlbGxlbnRUaHJlc2hvbGQ6IGV4Y2VsbGVudFRocmVzaG9sZCAhPT0gdW5kZWZpbmVkID8gcGFyc2VGbG9hdChleGNlbGxlbnRUaHJlc2hvbGQpIDogYnVpbGRpbmcuZXhjZWxsZW50VGhyZXNob2xkLFxuICAgICAgZGVsYXllZERheXNUaHJlc2hvbGQ6IGRlbGF5ZWREYXlzVGhyZXNob2xkICE9PSB1bmRlZmluZWQgPyBwYXJzZUludChkZWxheWVkRGF5c1RocmVzaG9sZCwgMTApIDogYnVpbGRpbmcuZGVsYXllZERheXNUaHJlc2hvbGQsXG4gICAgICBjcml0aWNhbERheXNUaHJlc2hvbGQ6IGNyaXRpY2FsRGF5c1RocmVzaG9sZCAhPT0gdW5kZWZpbmVkID8gcGFyc2VJbnQoY3JpdGljYWxEYXlzVGhyZXNob2xkLCAxMCkgOiBidWlsZGluZy5jcml0aWNhbERheXNUaHJlc2hvbGRcbiAgICB9O1xuXG4gICAgY29uc3QgdXBkYXRlZEJ1aWxkaW5nID0gYXdhaXQgcHJpc21hLiR0cmFuc2FjdGlvbihhc3luYyAodHgpID0+IHtcbiAgICAgIC8vIDEuIFVwZGF0ZSBidWlsZGluZyBjb25maWdcbiAgICAgIGNvbnN0IGIgPSBhd2FpdCB0eC5idWlsZGluZy51cGRhdGUoe1xuICAgICAgICB3aGVyZTogeyBpZDogYnVpbGRpbmdJZCB9LFxuICAgICAgICBkYXRhOiB1cGRhdGVkQ29uZmlnXG4gICAgICB9KTtcblxuICAgICAgLy8gMi4gQWRqdXN0IGNhcGFjaXR5IGFwYXJ0bWVudCByb3dzIGlmIGNhcGFjaXR5IGNoYW5nZWRcbiAgICAgIGlmIChuZXdDYXBhY2l0eSA+IGJ1aWxkaW5nLmNhcGFjaXR5KSB7XG4gICAgICAgIGNvbnN0IG5ld0FwdHMgPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IGJ1aWxkaW5nLmNhcGFjaXR5ICsgMTsgaSA8PSBuZXdDYXBhY2l0eTsgaSsrKSB7XG4gICAgICAgICAgY29uc3QgcmF3QXB0ID0ge1xuICAgICAgICAgICAgYnVpbGRpbmdJZDogYnVpbGRpbmcuaWQsXG4gICAgICAgICAgICBzck5vOiBpLFxuICAgICAgICAgICAgYXBhcnRtZW50Tm86IG51bGwsXG4gICAgICAgICAgICBmbG9vcjogbnVsbCxcbiAgICAgICAgICAgIHByaW9yaXR5OiAnTm9ybWFsJyxcbiAgICAgICAgICAgIGtpdGNoZW5RdHk6IDEsXG4gICAgICAgICAgICB3YXJkcm9iZVF0eTogMSxcbiAgICAgICAgICAgIHZhbml0eVF0eTogMSxcbiAgICAgICAgICAgIGRvb3JRdHk6IDEsXG4gICAgICAgICAgICBraXRjaGVuVHlwZTogJ0stVHlwZSAxJyxcbiAgICAgICAgICAgIHdhcmRyb2JlVHlwZTogJ1ctVHlwZSAxJyxcbiAgICAgICAgICAgIHZhbml0eVR5cGU6ICdWLVR5cGUgMScsXG4gICAgICAgICAgICBkb29yVHlwZTogJ0QtVHlwZSAxJyxcbiAgICAgICAgICAgIGNvbnRyYWN0b3I6IGJ1aWxkaW5nLm9yZGVyPy5jb250cmFjdG9ySWQgfHwgJycsXG4gICAgICAgICAgICBjb250cmFjdG9yTmFtZTogYnVpbGRpbmcub3JkZXI/LmNvbnRyYWN0b3JOYW1lIHx8ICcnXG4gICAgICAgICAgfTtcblxuICAgICAgICAgIGNvbnN0IGNhbGN1bGF0ZWQgPSByZWNhbGN1bGF0ZUFwYXJ0bWVudChyYXdBcHQsIGIpO1xuICAgICAgICAgIG5ld0FwdHMucHVzaChjYWxjdWxhdGVkKTtcbiAgICAgICAgfVxuICAgICAgICBhd2FpdCB0eC5hcGFydG1lbnQuY3JlYXRlTWFueSh7IGRhdGE6IG5ld0FwdHMgfSk7XG4gICAgICB9IGVsc2UgaWYgKG5ld0NhcGFjaXR5IDwgYnVpbGRpbmcuY2FwYWNpdHkpIHtcbiAgICAgICAgYXdhaXQgdHguYXBhcnRtZW50LmRlbGV0ZU1hbnkoe1xuICAgICAgICAgIHdoZXJlOiB7XG4gICAgICAgICAgICBidWlsZGluZ0lkLFxuICAgICAgICAgICAgc3JObzogeyBndDogbmV3Q2FwYWNpdHkgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIDMuIEZldGNoIGFuZCByZWNhbGN1bGF0ZSBhbGwgcmVtYWluaW5nIGFwYXJ0bWVudHMgdW5kZXIgdGhpcyBidWlsZGluZ1xuICAgICAgY29uc3QgYXBhcnRtZW50cyA9IGF3YWl0IHR4LmFwYXJ0bWVudC5maW5kTWFueSh7XG4gICAgICAgIHdoZXJlOiB7IGJ1aWxkaW5nSWQgfVxuICAgICAgfSk7XG5cbiAgICAgIGZvciAoY29uc3QgYXB0IG9mIGFwYXJ0bWVudHMpIHtcbiAgICAgICAgY29uc3QgcmVjYWxjdWxhdGVkID0gcmVjYWxjdWxhdGVBcGFydG1lbnQoYXB0LCBiKTtcbiAgICAgICAgYXdhaXQgdHguYXBhcnRtZW50LnVwZGF0ZSh7XG4gICAgICAgICAgd2hlcmU6IHsgaWQ6IGFwdC5pZCB9LFxuICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIG1hdGVyaWFsSW53YXJkUGN0OiByZWNhbGN1bGF0ZWQubWF0ZXJpYWxJbndhcmRQY3QsXG4gICAgICAgICAgICBraXRjaGVuQ29tcGxldGlvblBjdDogcmVjYWxjdWxhdGVkLmtpdGNoZW5Db21wbGV0aW9uUGN0LFxuICAgICAgICAgICAgd2FyZHJvYmVDb21wbGV0aW9uUGN0OiByZWNhbGN1bGF0ZWQud2FyZHJvYmVDb21wbGV0aW9uUGN0LFxuICAgICAgICAgICAgdmFuaXR5Q29tcGxldGlvblBjdDogcmVjYWxjdWxhdGVkLnZhbml0eUNvbXBsZXRpb25QY3QsXG4gICAgICAgICAgICBkb29yQ29tcGxldGlvblBjdDogcmVjYWxjdWxhdGVkLmRvb3JDb21wbGV0aW9uUGN0LFxuICAgICAgICAgICAgb3ZlcmFsbENvbXBsZXRpb25QY3Q6IHJlY2FsY3VsYXRlZC5vdmVyYWxsQ29tcGxldGlvblBjdCxcbiAgICAgICAgICAgIGtpdGNoZW5RQ0dhdGU6IHJlY2FsY3VsYXRlZC5raXRjaGVuUUNHYXRlLFxuICAgICAgICAgICAgd2FyZHJvYmVRQ0dhdGU6IHJlY2FsY3VsYXRlZC53YXJkcm9iZVFDR2F0ZSxcbiAgICAgICAgICAgIHZhbml0eVFDR2F0ZTogcmVjYWxjdWxhdGVkLnZhbml0eVFDR2F0ZSxcbiAgICAgICAgICAgIGRvb3JRQ0dhdGU6IHJlY2FsY3VsYXRlZC5kb29yUUNHYXRlLFxuICAgICAgICAgICAgaGFuZG92ZXJBcHByb3ZhbFN0YXR1czogcmVjYWxjdWxhdGVkLmhhbmRvdmVyQXBwcm92YWxTdGF0dXMsXG4gICAgICAgICAgICBhcGFydG1lbnRTdGF0dXM6IHJlY2FsY3VsYXRlZC5hcGFydG1lbnRTdGF0dXMsXG4gICAgICAgICAgICBkZWxheURheXM6IHJlY2FsY3VsYXRlZC5kZWxheURheXMsXG4gICAgICAgICAgICBoZWFsdGg6IHJlY2FsY3VsYXRlZC5oZWFsdGhcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gYjtcbiAgICB9KTtcblxuICAgIHJldHVybiByZXMuanNvbih1cGRhdGVkQnVpbGRpbmcpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKCdVcGRhdGUgYnVpbGRpbmcgY29uZmlnIGVycm9yOicsIGVycik7XG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgZXJyb3I6ICdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3IgdXBkYXRpbmcgYnVpbGRpbmcgY29uZmlnJyB9KTtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZGVsZXRlQnVpbGRpbmcocmVxLCByZXMpIHtcbiAgY29uc3QgeyBidWlsZGluZ0lkIH0gPSByZXEucGFyYW1zO1xuICB0cnkge1xuICAgIGlmIChyZXEudXNlci5yb2xlICE9PSAnUk9MRV9BJykge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAzKS5qc29uKHsgZXJyb3I6ICdPbmx5IERhdGEgRW50cnkgLyBTZXR1cCByb2xlIGNhbiBkZWxldGUgYnVpbGRpbmdzJyB9KTtcbiAgICB9XG5cbiAgICBjb25zdCBidWlsZGluZyA9IGF3YWl0IHByaXNtYS5idWlsZGluZy5maW5kVW5pcXVlKHtcbiAgICAgIHdoZXJlOiB7IGlkOiBidWlsZGluZ0lkIH1cbiAgICB9KTtcblxuICAgIGlmICghYnVpbGRpbmcpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwNCkuanNvbih7IGVycm9yOiAnQnVpbGRpbmcgbm90IGZvdW5kJyB9KTtcbiAgICB9XG5cbiAgICAvLyBEZWxldGUgdGhlIGJ1aWxkaW5nIFx1MjAxNCBjYXNjYWRpbmcgZGVsZXRlcyBoYW5kbGUgYXBhcnRtZW50cyxcbiAgICAvLyBhdWRpdCBsb2dzLCB0b3dlciBjbGllbnQgcmF0ZXMsIGFuZCBjbGllbnQgUkEgYmlsbCBsaW5lcy5cbiAgICBhd2FpdCBwcmlzbWEuYnVpbGRpbmcuZGVsZXRlKHtcbiAgICAgIHdoZXJlOiB7IGlkOiBidWlsZGluZ0lkIH1cbiAgICB9KTtcblxuICAgIHJldHVybiByZXMuanNvbih7IG1lc3NhZ2U6ICdCdWlsZGluZyBhbmQgYWxsIGFzc29jaWF0ZWQgZGF0YSBkZWxldGVkIHN1Y2Nlc3NmdWxseScgfSk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0RlbGV0ZSBidWlsZGluZyBlcnJvcjonLCBlcnIpO1xuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7IGVycm9yOiAnSW50ZXJuYWwgc2VydmVyIGVycm9yIGRlbGV0aW5nIGJ1aWxkaW5nJyB9KTtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY29weUJ1aWxkaW5nRGF0YShyZXEsIHJlcykge1xuICBjb25zdCB7IHNvdXJjZUJ1aWxkaW5nSWQsIHRhcmdldEJ1aWxkaW5nSWQgfSA9IHJlcS5ib2R5O1xuICBpZiAoIXNvdXJjZUJ1aWxkaW5nSWQgfHwgIXRhcmdldEJ1aWxkaW5nSWQpIHtcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oeyBlcnJvcjogJ1NvdXJjZSBhbmQgdGFyZ2V0IGJ1aWxkaW5nIElEcyBhcmUgcmVxdWlyZWQnIH0pO1xuICB9XG4gIGlmIChzb3VyY2VCdWlsZGluZ0lkID09PSB0YXJnZXRCdWlsZGluZ0lkKSB7XG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHsgZXJyb3I6ICdTb3VyY2UgYW5kIHRhcmdldCBidWlsZGluZ3MgbXVzdCBiZSBkaWZmZXJlbnQnIH0pO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBpZiAocmVxLnVzZXIucm9sZSAhPT0gJ1JPTEVfQScpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMykuanNvbih7IGVycm9yOiAnT25seSBTZXR1cCBPcGVyYXRvciAoQWRtaW4pIGNhbiBjb3B5IGJ1aWxkaW5nIGRhdGEnIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IHNvdXJjZUJ1aWxkaW5nID0gYXdhaXQgcHJpc21hLmJ1aWxkaW5nLmZpbmRVbmlxdWUoe1xuICAgICAgd2hlcmU6IHsgaWQ6IHNvdXJjZUJ1aWxkaW5nSWQgfSxcbiAgICAgIGluY2x1ZGU6IHsgYXBhcnRtZW50czogdHJ1ZSB9XG4gICAgfSk7XG5cbiAgICBjb25zdCB0YXJnZXRCdWlsZGluZyA9IGF3YWl0IHByaXNtYS5idWlsZGluZy5maW5kVW5pcXVlKHtcbiAgICAgIHdoZXJlOiB7IGlkOiB0YXJnZXRCdWlsZGluZ0lkIH0sXG4gICAgICBpbmNsdWRlOiB7IGFwYXJ0bWVudHM6IHRydWUgfVxuICAgIH0pO1xuXG4gICAgaWYgKCFzb3VyY2VCdWlsZGluZyB8fCAhdGFyZ2V0QnVpbGRpbmcpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwNCkuanNvbih7IGVycm9yOiAnU291cmNlIG9yIHRhcmdldCBidWlsZGluZyBub3QgZm91bmQnIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IHNvdXJjZUFwdHMgPSBzb3VyY2VCdWlsZGluZy5hcGFydG1lbnRzO1xuICAgIGNvbnN0IHRhcmdldEFwdHMgPSB0YXJnZXRCdWlsZGluZy5hcGFydG1lbnRzO1xuXG4gICAgY29uc3QgY29weUZpZWxkcyA9IFtcbiAgICAgICdwcmlvcml0eScsICdraXRjaGVuUXR5JywgJ3dhcmRyb2JlUXR5JywgJ3Zhbml0eVF0eScsICdkb29yUXR5JyxcbiAgICAgICdraXRjaGVuTG93ZXJDYXJjYXNzSW53YXJkJywgJ2tpdGNoZW5VcHBlckNhcmNhc3NJbndhcmQnLCAna2l0Y2hlblN0b25lSW53YXJkJyxcbiAgICAgICdraXRjaGVuU2h1dHRlcklud2FyZCcsICdraXRjaGVuSGFyZHdhcmVJbndhcmQnLCAna2l0Y2hlbkFwcGxpYW5jZUlud2FyZCcsXG4gICAgICAnd2FyZHJvYmVDYWJpbmV0SW53YXJkJywgJ3dhcmRyb2JlU2h1dHRlckhhcmR3YXJlSW53YXJkJyxcbiAgICAgICd2YW5pdHlDYWJpbmV0SW53YXJkJywgJ3Zhbml0eVNodXR0ZXJIYXJkd2FyZUlud2FyZCcsXG4gICAgICAnZG9vckZyYW1lSGFyZHdhcmVJbndhcmQnLFxuICAgICAgJ2tpdGNoZW5Mb3dlckNhcmNhc3NJbnN0YWxsZWQnLCAna2l0Y2hlblVwcGVyQ2FyY2Fzc0luc3RhbGxlZCcsICdraXRjaGVuU3RvbmVJbnN0YWxsZWQnLFxuICAgICAgJ2tpdGNoZW5TaHV0dGVySGFyZHdhcmVJbnN0YWxsZWQnLCAna2l0Y2hlbkFwcGxpYW5jZUluc3RhbGxlZCcsICdraXRjaGVuSGFuZGVkT3ZlcicsXG4gICAgICAnd2FyZHJvYmVDYWJpbmV0SW5zdGFsbGVkJywgJ3dhcmRyb2JlU2h1dHRlckhhcmR3YXJlSW5zdGFsbGVkJywgJ3dhcmRyb2JlSGFuZGVkT3ZlcicsXG4gICAgICAndmFuaXR5Q2FiaW5ldEluc3RhbGxlZCcsICd2YW5pdHlTaHV0dGVySGFyZHdhcmVJbnN0YWxsZWQnLCAndmFuaXR5SGFuZGVkT3ZlcicsXG4gICAgICAnZG9vckZyYW1lSGFyZHdhcmVJbnN0YWxsZWQnLCAnZG9vckhhbmRlZE92ZXInLFxuICAgICAgJ3BsYW5uZWRTdGFydCcsICdwbGFubmVkQ29tcGxldGlvbicsICdhY3R1YWxTdGFydCcsICdhY3R1YWxDb21wbGV0aW9uJyxcbiAgICAgICdzdXBlcnZpc29yTmFtZScsICdyZXNwb25zaWJsZUVuZ2luZWVyJywgJ2NvbnRyYWN0b3InLCAnY29udHJhY3Rvck5hbWUnLCAnZGVsYXlSZWFzb24nLCAncmVtYXJrcycsXG4gICAgICAna2l0Y2hlblFDX1Zpc2libGVTY3Jld3MnLCAna2l0Y2hlblFDX0NoaXBwaW5nJywgJ2tpdGNoZW5RQ19GaWxsZXJNaXNzaW5nJyxcbiAgICAgICdraXRjaGVuUUNfU2NyYXRjaGVzJywgJ2tpdGNoZW5RQ19EcmF3ZXJzRnVuY3Rpb24nLCAna2l0Y2hlblFDX0N1dGxlcnlUcmF5JywgJ2tpdGNoZW5RQ19EaXNoRHJhaW5lcicsXG4gICAgICAnd2FyZHJvYmVRQ19WaXNpYmxlU2NyZXdzJywgJ3dhcmRyb2JlUUNfQ2hpcHBpbmcnLCAnd2FyZHJvYmVRQ19GaWxsZXJNaXNzaW5nJyxcbiAgICAgICd3YXJkcm9iZVFDX1NjcmF0Y2hlcycsICd3YXJkcm9iZVFDX0RyYXdlcnNGdW5jdGlvbicsXG4gICAgICAndmFuaXR5UUNfVmlzaWJsZVNjcmV3cycsICd2YW5pdHlRQ19DaGlwcGluZycsICd2YW5pdHlRQ19GaWxsZXJNaXNzaW5nJyxcbiAgICAgICd2YW5pdHlRQ19TY3JhdGNoZXMnLCAndmFuaXR5UUNfRHJhd2Vyc0Z1bmN0aW9uJyxcbiAgICAgICdkb29yUUNfQ2hpcHBpbmcnLCAnZG9vclFDX0FsaWdubWVudCcsXG4gICAgICAna2l0Y2hlblR5cGUnLCAnd2FyZHJvYmVUeXBlJywgJ3Zhbml0eVR5cGUnLCAnZG9vclR5cGUnXG4gICAgXTtcblxuICAgIGNvbnN0IHVwZGF0ZWRBcHRzID0gW107XG4gICAgY29uc3QgYXVkaXRMb2dzID0gW107XG5cbiAgICAvLyBNYXRjaCBieSBzck5vXG4gICAgZm9yIChjb25zdCB0YXJnZXRBcHQgb2YgdGFyZ2V0QXB0cykge1xuICAgICAgY29uc3Qgc291cmNlQXB0ID0gc291cmNlQXB0cy5maW5kKGEgPT4gYS5zck5vID09PSB0YXJnZXRBcHQuc3JObyk7XG4gICAgICBpZiAoIXNvdXJjZUFwdCkgY29udGludWU7XG5cbiAgICAgIGNvbnN0IHVwZGF0ZXMgPSB7fTtcbiAgICAgIGZvciAoY29uc3QgZmllbGQgb2YgY29weUZpZWxkcykge1xuICAgICAgICB1cGRhdGVzW2ZpZWxkXSA9IHNvdXJjZUFwdFtmaWVsZF07XG4gICAgICB9XG5cbiAgICAgIC8vIE1lcmdlIGFuZCByZWNhbGN1bGF0ZVxuICAgICAgY29uc3QgbWVyZ2VkID0geyAuLi50YXJnZXRBcHQsIC4uLnVwZGF0ZXMgfTtcbiAgICAgIGNvbnN0IHJlY2FsY3VsYXRlZCA9IHJlY2FsY3VsYXRlQXBhcnRtZW50KG1lcmdlZCwgdGFyZ2V0QnVpbGRpbmcpO1xuXG4gICAgICAvLyBFeGNsdWRlIGFsbCBQcmlzbWEtbWFuYWdlZCwgaWRlbnRpdHksIGFuZCBhcGFydG1lbnQtc3BlY2lmaWMgZmllbGRzIGZyb20gdGhlIHVwZGF0ZSBwYXlsb2FkLlxuICAgICAgLy8gc3JObywgYXBhcnRtZW50Tm8gYW5kIGZsb29yIGJlbG9uZyB0byB0aGUgVEFSR0VUIGFwYXJ0bWVudCBhbmQgbXVzdCBuZXZlciBiZSBvdmVyd3JpdHRlbi5cbiAgICAgIGNvbnN0IHtcbiAgICAgICAgaWQsXG4gICAgICAgIGJ1aWxkaW5nSWQsXG4gICAgICAgIHNyTm8sXG4gICAgICAgIGFwYXJ0bWVudE5vLFxuICAgICAgICBmbG9vcixcbiAgICAgICAgY3JlYXRlZEF0LFxuICAgICAgICB1cGRhdGVkQXQsXG4gICAgICAgIGJ1aWxkaW5nLFxuICAgICAgICBhdWRpdExvZ3M6IGFsLFxuICAgICAgICAuLi51cGRhdGVEYXRhXG4gICAgICB9ID0gcmVjYWxjdWxhdGVkO1xuICAgICAgdXBkYXRlZEFwdHMucHVzaCh7XG4gICAgICAgIGlkOiB0YXJnZXRBcHQuaWQsXG4gICAgICAgIGRhdGE6IHVwZGF0ZURhdGFcbiAgICAgIH0pO1xuXG4gICAgICBhdWRpdExvZ3MucHVzaCh7XG4gICAgICAgIGFwYXJ0bWVudElkOiB0YXJnZXRBcHQuaWQsXG4gICAgICAgIHVzZXJJZDogcmVxLnVzZXIuaWQsXG4gICAgICAgIGZpZWxkTmFtZTogJ0NvcHkgRGF0YScsXG4gICAgICAgIG9sZFZhbHVlOiBgRnJvbSBidWlsZGluZzogJHtzb3VyY2VCdWlsZGluZy5uYW1lfWAsXG4gICAgICAgIG5ld1ZhbHVlOiBgQ29waWVkIHZhbHVlcyBmcm9tIFNyTm86ICR7c291cmNlQXB0LnNyTm99YFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXdhaXQgcHJpc21hLiR0cmFuc2FjdGlvbihhc3luYyAodHgpID0+IHtcbiAgICAgIGZvciAoY29uc3QgaXRlbSBvZiB1cGRhdGVkQXB0cykge1xuICAgICAgICBhd2FpdCB0eC5hcGFydG1lbnQudXBkYXRlKHtcbiAgICAgICAgICB3aGVyZTogeyBpZDogaXRlbS5pZCB9LFxuICAgICAgICAgIGRhdGE6IGl0ZW0uZGF0YVxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYgKGF1ZGl0TG9ncy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGF3YWl0IHR4LmF1ZGl0TG9nLmNyZWF0ZU1hbnkoe1xuICAgICAgICAgIGRhdGE6IGF1ZGl0TG9nc1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiByZXMuanNvbih7IHN1Y2Nlc3M6IHRydWUsIGNvcGllZENvdW50OiB1cGRhdGVkQXB0cy5sZW5ndGggfSk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0NvcHkgYnVpbGRpbmcgZGF0YSBlcnJvcjonLCBlcnIpO1xuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7IGVycm9yOiAnSW50ZXJuYWwgc2VydmVyIGVycm9yIGNvcHlpbmcgYnVpbGRpbmcgZGF0YScgfSk7XG4gIH1cbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcaHBcXFxcRG93bmxvYWRzXFxcXERpbyBHcmFjZWVcXFxcRGlvIEdyYWNlZVxcXFxiYWNrZW5kXFxcXHNyY1xcXFxjb250cm9sbGVyc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcaHBcXFxcRG93bmxvYWRzXFxcXERpbyBHcmFjZWVcXFxcRGlvIEdyYWNlZVxcXFxiYWNrZW5kXFxcXHNyY1xcXFxjb250cm9sbGVyc1xcXFxhcGFydG1lbnRDb250cm9sbGVyLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9ocC9Eb3dubG9hZHMvRGlvJTIwR3JhY2VlL0RpbyUyMEdyYWNlZS9iYWNrZW5kL3NyYy9jb250cm9sbGVycy9hcGFydG1lbnRDb250cm9sbGVyLmpzXCI7aW1wb3J0IHsgUHJpc21hQ2xpZW50IH0gZnJvbSAnQHByaXNtYS9jbGllbnQnO1xuaW1wb3J0IHsgcmVjYWxjdWxhdGVBcGFydG1lbnQgfSBmcm9tICcuLi9zZXJ2aWNlcy9jYWxjdWxhdGlvblNlcnZpY2UuanMnO1xuXG5jb25zdCBwcmlzbWEgPSBuZXcgUHJpc21hQ2xpZW50KCk7XG5cbmNvbnN0IFJPTEVfQV9GSUVMRFMgPSBbJ3NyTm8nLCAnYXBhcnRtZW50Tm8nLCAnZmxvb3InLCAncHJpb3JpdHknLCAna2l0Y2hlblF0eScsICd3YXJkcm9iZVF0eScsICd2YW5pdHlRdHknLCAnZG9vclF0eScsICdyZXNwb25zaWJsZUVuZ2luZWVyJywgJ3N1cGVydmlzb3JOYW1lJywgJ2tpdGNoZW5UeXBlJywgJ3dhcmRyb2JlVHlwZScsICd2YW5pdHlUeXBlJywgJ2Rvb3JUeXBlJ107XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBsaXN0QXBhcnRtZW50cyhyZXEsIHJlcykge1xuICBjb25zdCB7IGJ1aWxkaW5nSWQgfSA9IHJlcS5wYXJhbXM7XG4gIHRyeSB7XG4gICAgY29uc3QgYXBhcnRtZW50cyA9IGF3YWl0IHByaXNtYS5hcGFydG1lbnQuZmluZE1hbnkoe1xuICAgICAgd2hlcmU6IHsgYnVpbGRpbmdJZCB9LFxuICAgICAgb3JkZXJCeTogeyBzck5vOiAnYXNjJyB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlcy5qc29uKGFwYXJ0bWVudHMpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oeyBlcnJvcjogJ0ludGVybmFsIHNlcnZlciBlcnJvciBsaXN0aW5nIGFwYXJ0bWVudHMnIH0pO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjcmVhdGVBcGFydG1lbnQocmVxLCByZXMpIHtcbiAgY29uc3QgeyBidWlsZGluZ0lkIH0gPSByZXEucGFyYW1zO1xuICBjb25zdCB7IGFwYXJ0bWVudE5vLCBmbG9vciwgcHJpb3JpdHksIGtpdGNoZW5UeXBlLCB3YXJkcm9iZVR5cGUsIHZhbml0eVR5cGUgfSA9IHJlcS5ib2R5O1xuXG4gIHRyeSB7XG4gICAgaWYgKHJlcS51c2VyLnJvbGUgIT09ICdST0xFX0EnKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDMpLmpzb24oeyBlcnJvcjogJ09ubHkgU2V0dXAgT3BlcmF0b3IgY2FuIGFkZCBhcGFydG1lbnQgcm93cycgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgYnVpbGRpbmcgPSBhd2FpdCBwcmlzbWEuYnVpbGRpbmcuZmluZFVuaXF1ZSh7XG4gICAgICB3aGVyZTogeyBpZDogYnVpbGRpbmdJZCB9LFxuICAgICAgaW5jbHVkZTogeyBcbiAgICAgICAgYXBhcnRtZW50czogeyBvcmRlckJ5OiB7IHNyTm86ICdkZXNjJyB9LCB0YWtlOiAxIH0sXG4gICAgICAgIG9yZGVyOiB7IHNlbGVjdDogeyBjb250cmFjdG9ySWQ6IHRydWUgfSB9XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBpZiAoIWJ1aWxkaW5nKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oeyBlcnJvcjogJ0J1aWxkaW5nIG5vdCBmb3VuZCcgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgbGFzdFNyTm8gPSBidWlsZGluZy5hcGFydG1lbnRzLmxlbmd0aCA+IDAgPyBidWlsZGluZy5hcGFydG1lbnRzWzBdLnNyTm8gOiAwO1xuICAgIGNvbnN0IG5leHRTck5vID0gbGFzdFNyTm8gKyAxO1xuICAgIGNvbnN0IGRlZmF1bHRGbG9vciA9IGZsb29yID8gU3RyaW5nKGZsb29yKS50cmltKCkgOiBudWxsO1xuICAgIGNvbnN0IGRlZmF1bHRBcHRObyA9IGFwYXJ0bWVudE5vID8gU3RyaW5nKGFwYXJ0bWVudE5vKS50cmltKCkgOiBudWxsO1xuXG4gICAgY29uc3QgcmF3QXB0ID0ge1xuICAgICAgYnVpbGRpbmdJZCxcbiAgICAgIHNyTm86IG5leHRTck5vLFxuICAgICAgYXBhcnRtZW50Tm86IGRlZmF1bHRBcHRObyxcbiAgICAgIGZsb29yOiBkZWZhdWx0Rmxvb3IsXG4gICAgICBwcmlvcml0eTogcHJpb3JpdHkgfHwgJ05vcm1hbCcsXG4gICAgICBraXRjaGVuUXR5OiBudWxsLFxuICAgICAgd2FyZHJvYmVRdHk6IG51bGwsXG4gICAgICB2YW5pdHlRdHk6IG51bGwsXG4gICAgICBkb29yUXR5OiBudWxsLFxuICAgICAga2l0Y2hlblR5cGU6IGtpdGNoZW5UeXBlIHx8ICdLLVR5cGUgMScsXG4gICAgICB3YXJkcm9iZVR5cGU6IHdhcmRyb2JlVHlwZSB8fCAnVy1UeXBlIDEnLFxuICAgICAgdmFuaXR5VHlwZTogdmFuaXR5VHlwZSB8fCAnVi1UeXBlIDEnLFxuICAgICAgZG9vclR5cGU6IGRvb3JUeXBlIHx8ICdELVR5cGUgMScsXG4gICAgICBjb250cmFjdG9yOiBidWlsZGluZy5vcmRlcj8uY29udHJhY3RvcklkIHx8IG51bGxcbiAgICB9O1xuXG4gICAgY29uc3QgY2FsY3VsYXRlZCA9IHJlY2FsY3VsYXRlQXBhcnRtZW50KHJhd0FwdCwgYnVpbGRpbmcpO1xuXG4gICAgY29uc3QgbmV3QXB0ID0gYXdhaXQgcHJpc21hLiR0cmFuc2FjdGlvbihhc3luYyAodHgpID0+IHtcbiAgICAgIGNvbnN0IGNyZWF0ZWQgPSBhd2FpdCB0eC5hcGFydG1lbnQuY3JlYXRlKHtcbiAgICAgICAgZGF0YTogY2FsY3VsYXRlZFxuICAgICAgfSk7XG5cbiAgICAgIGF3YWl0IHR4LmJ1aWxkaW5nLnVwZGF0ZSh7XG4gICAgICAgIHdoZXJlOiB7IGlkOiBidWlsZGluZ0lkIH0sXG4gICAgICAgIGRhdGE6IHsgY2FwYWNpdHk6IHsgaW5jcmVtZW50OiAxIH0gfVxuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBjcmVhdGVkO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAxKS5qc29uKG5ld0FwdCk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0NyZWF0ZSBhcGFydG1lbnQgZXJyb3I6JywgZXJyKTtcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oeyBlcnJvcjogJ0ZhaWxlZCB0byBhZGQgYXBhcnRtZW50IHJvdycgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRlbGV0ZUFwYXJ0bWVudChyZXEsIHJlcykge1xuICBjb25zdCB7IGFwYXJ0bWVudElkIH0gPSByZXEucGFyYW1zO1xuXG4gIHRyeSB7XG4gICAgaWYgKHJlcS51c2VyLnJvbGUgIT09ICdST0xFX0EnKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDMpLmpzb24oeyBlcnJvcjogJ09ubHkgU2V0dXAgT3BlcmF0b3IgY2FuIGRlbGV0ZSBhcGFydG1lbnQgcm93cycgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgYXB0ID0gYXdhaXQgcHJpc21hLmFwYXJ0bWVudC5maW5kVW5pcXVlKHtcbiAgICAgIHdoZXJlOiB7IGlkOiBhcGFydG1lbnRJZCB9XG4gICAgfSk7XG5cbiAgICBpZiAoIWFwdCkge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgZXJyb3I6ICdBcGFydG1lbnQgbm90IGZvdW5kJyB9KTtcbiAgICB9XG5cbiAgICBhd2FpdCBwcmlzbWEuJHRyYW5zYWN0aW9uKGFzeW5jICh0eCkgPT4ge1xuICAgICAgYXdhaXQgdHguYXBhcnRtZW50LmRlbGV0ZSh7XG4gICAgICAgIHdoZXJlOiB7IGlkOiBhcGFydG1lbnRJZCB9XG4gICAgICB9KTtcblxuICAgICAgYXdhaXQgdHguYnVpbGRpbmcudXBkYXRlKHtcbiAgICAgICAgd2hlcmU6IHsgaWQ6IGFwdC5idWlsZGluZ0lkIH0sXG4gICAgICAgIGRhdGE6IHsgY2FwYWNpdHk6IE1hdGgubWF4KDAsIChhd2FpdCB0eC5hcGFydG1lbnQuY291bnQoeyB3aGVyZTogeyBidWlsZGluZ0lkOiBhcHQuYnVpbGRpbmdJZCB9IH0pKSkgfVxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcmVzLmpzb24oeyBtZXNzYWdlOiAnQXBhcnRtZW50IHJvdyBkZWxldGVkIHN1Y2Nlc3NmdWxseScgfSk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0RlbGV0ZSBhcGFydG1lbnQgZXJyb3I6JywgZXJyKTtcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oeyBlcnJvcjogJ0ZhaWxlZCB0byBkZWxldGUgYXBhcnRtZW50IHJvdycgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHVwZGF0ZUFwYXJ0bWVudChyZXEsIHJlcykge1xuICBjb25zdCB7IGFwYXJ0bWVudElkIH0gPSByZXEucGFyYW1zO1xuICBjb25zdCB1cGRhdGVzID0gcmVxLmJvZHk7XG5cbiAgdHJ5IHtcbiAgICBjb25zdCByb2xlID0gcmVxLnVzZXIucm9sZTtcbiAgICBpZiAocm9sZSAhPT0gJ1JPTEVfQScpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMykuanNvbih7IGVycm9yOiAnRm9yYmlkZGVuOiBPbmx5IEFkbWluIGhhcyBhY2Nlc3MgdG8gbW9kaWZ5IGRhdGEnIH0pO1xuICAgIH1cblxuICAgIC8vIExvYWQgb3JpZ2luYWwgYXBhcnRtZW50XG4gICAgY29uc3QgYXB0ID0gYXdhaXQgcHJpc21hLmFwYXJ0bWVudC5maW5kVW5pcXVlKHtcbiAgICAgIHdoZXJlOiB7IGlkOiBhcGFydG1lbnRJZCB9LFxuICAgICAgaW5jbHVkZTogeyBidWlsZGluZzogdHJ1ZSB9XG4gICAgfSk7XG5cbiAgICBpZiAoIWFwdCkge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgZXJyb3I6ICdBcGFydG1lbnQgbm90IGZvdW5kJyB9KTtcbiAgICB9XG5cbiAgICAvLyBSb2xlLWJhc2VkIGZpZWxkIGVuZm9yY2VtZW50XG4gICAgY29uc3QgZmlsdGVyZWRVcGRhdGVzID0ge307XG4gICAgaWYgKHJvbGUgPT09ICdST0xFX0EnKSB7XG4gICAgICAvLyBSb2xlIEEgKEFkbWluKSBoYXMgZnVsbCBlZGl0aW5nIHJpZ2h0cyB0byBhbnkgZmllbGQgaW4gdGhlIEFwYXJ0bWVudCBtb2RlbFxuICAgICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXModXBkYXRlcykpIHtcbiAgICAgICAgaWYgKGtleSAhPT0gJ2lkJyAmJiBrZXkgIT09ICdidWlsZGluZ0lkJyAmJiBrZXkgIT09ICdjcmVhdGVkQXQnKSB7XG4gICAgICAgICAgZmlsdGVyZWRVcGRhdGVzW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAocm9sZSA9PT0gJ1JPTEVfQicpIHtcbiAgICAgIC8vIFJvbGUgQiBjYW5ub3QgZWRpdCBmaXJzdCA3IGZpZWxkc1xuICAgICAgY29uc3QgYXR0ZW1wdGVkUm9sZUFGaWVsZHMgPSBST0xFX0FfRklFTERTLmZpbHRlcihrZXkgPT4gdXBkYXRlc1trZXldICE9PSB1bmRlZmluZWQpO1xuICAgICAgaWYgKGF0dGVtcHRlZFJvbGVBRmllbGRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAzKS5qc29uKHsgXG4gICAgICAgICAgZXJyb3I6IGBFeGVjdXRpb24gcm9sZSBjYW5ub3QgbW9kaWZ5IFNldHVwIGZpZWxkczogWyR7YXR0ZW1wdGVkUm9sZUFGaWVsZHMuam9pbignLCAnKX1dYCBcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIEFsbG93IGFueSBvdGhlciB2YWxpZCBmaWVsZHMgaW4gQXBhcnRtZW50IG1vZGVsXG4gICAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyh1cGRhdGVzKSkge1xuICAgICAgICBpZiAoIVJPTEVfQV9GSUVMRFMuaW5jbHVkZXMoa2V5KSAmJiBrZXkgIT09ICdpZCcgJiYga2V5ICE9PSAnYnVpbGRpbmdJZCcgJiYga2V5ICE9PSAnY3JlYXRlZEF0Jykge1xuICAgICAgICAgIGZpbHRlcmVkVXBkYXRlc1trZXldID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoT2JqZWN0LmtleXMoZmlsdGVyZWRVcGRhdGVzKS5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiByZXMuanNvbihhcHQpOyAvLyBub3RoaW5nIHRvIHVwZGF0ZVxuICAgIH1cblxuICAgIC8vIFBhcnNlIGRhdGUgZmllbGRzIGlmIHByZXNlbnRcbiAgICBjb25zdCBkYXRlRmllbGRzID0gWydwbGFubmVkU3RhcnQnLCAncGxhbm5lZENvbXBsZXRpb24nLCAnYWN0dWFsU3RhcnQnLCAnYWN0dWFsQ29tcGxldGlvbiddO1xuICAgIGZvciAoY29uc3QgZiBvZiBkYXRlRmllbGRzKSB7XG4gICAgICBpZiAoZmlsdGVyZWRVcGRhdGVzW2ZdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgZmlsdGVyZWRVcGRhdGVzW2ZdID0gZmlsdGVyZWRVcGRhdGVzW2ZdID8gbmV3IERhdGUoZmlsdGVyZWRVcGRhdGVzW2ZdKSA6IG51bGw7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGZpbHRlcmVkVXBkYXRlcy5hY3R1YWxDb21wbGV0aW9uKSB7XG4gICAgICBjb25zdCB0b2RheSA9IG5ldyBEYXRlKCk7XG4gICAgICB0b2RheS5zZXRIb3VycygyMywgNTksIDU5LCA5OTkpO1xuICAgICAgaWYgKGZpbHRlcmVkVXBkYXRlcy5hY3R1YWxDb21wbGV0aW9uID4gdG9kYXkpIHtcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHsgZXJyb3I6ICdBY3R1YWwgY29tcGxldGlvbiBkYXRlIGNhbm5vdCBiZSBzZXQgaW4gdGhlIGZ1dHVyZScgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gUGVyZm9ybSB0aGUgdXBkYXRlICYgcmVjYWxjdWxhdGUgaW4gYSB0cmFuc2FjdGlvblxuICAgIGNvbnN0IHVwZGF0ZWRBcHQgPSBhd2FpdCBwcmlzbWEuJHRyYW5zYWN0aW9uKGFzeW5jICh0eCkgPT4ge1xuICAgICAgLy8gMS4gQ3JlYXRlIGF1ZGl0IGxvZ3MgZm9yIGNoYW5nZWQgZmllbGRzXG4gICAgICBjb25zdCBhdWRpdExvZ0RhdGEgPSBbXTtcbiAgICAgIGZvciAoY29uc3QgW2ZpZWxkLCBuZXdWYWxdIG9mIE9iamVjdC5lbnRyaWVzKGZpbHRlcmVkVXBkYXRlcykpIHtcbiAgICAgICAgbGV0IG9sZFZhbFN0ciA9IGFwdFtmaWVsZF0gPT09IG51bGwgPyAnJyA6IFN0cmluZyhhcHRbZmllbGRdKTtcbiAgICAgICAgaWYgKGFwdFtmaWVsZF0gaW5zdGFuY2VvZiBEYXRlKSB7XG4gICAgICAgICAgb2xkVmFsU3RyID0gYXB0W2ZpZWxkXS50b0lTT1N0cmluZygpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IG5ld1ZhbFN0ciA9IG5ld1ZhbCA9PT0gbnVsbCA/ICcnIDogU3RyaW5nKG5ld1ZhbCk7XG4gICAgICAgIGlmIChuZXdWYWwgaW5zdGFuY2VvZiBEYXRlKSB7XG4gICAgICAgICAgbmV3VmFsU3RyID0gbmV3VmFsLnRvSVNPU3RyaW5nKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAob2xkVmFsU3RyICE9PSBuZXdWYWxTdHIpIHtcbiAgICAgICAgICBhdWRpdExvZ0RhdGEucHVzaCh7XG4gICAgICAgICAgICBhcGFydG1lbnRJZDogYXB0LmlkLFxuICAgICAgICAgICAgdXNlcklkOiByZXEudXNlci5pZCxcbiAgICAgICAgICAgIGZpZWxkTmFtZTogZmllbGQsXG4gICAgICAgICAgICBvbGRWYWx1ZTogb2xkVmFsU3RyLFxuICAgICAgICAgICAgbmV3VmFsdWU6IG5ld1ZhbFN0clxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChhdWRpdExvZ0RhdGEubGVuZ3RoID4gMCkge1xuICAgICAgICBhd2FpdCB0eC5hdWRpdExvZy5jcmVhdGVNYW55KHtcbiAgICAgICAgICBkYXRhOiBhdWRpdExvZ0RhdGFcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIE1lcmdlIGZpbHRlcmVkIHVwZGF0ZXMgaW50byBleGlzdGluZyBhcGFydG1lbnQgb2JqZWN0IGZvciByZWNhbGN1bGF0aW9uXG4gICAgICBjb25zdCBtZXJnZWRBcHQgPSB7IC4uLmFwdCwgLi4uZmlsdGVyZWRVcGRhdGVzIH07XG5cbiAgICAgIC8vIDIuIFJlY2FsY3VsYXRlXG4gICAgICBjb25zdCByZWNhbGN1bGF0ZWQgPSByZWNhbGN1bGF0ZUFwYXJ0bWVudChtZXJnZWRBcHQsIGFwdC5idWlsZGluZyk7XG5cbiAgICAgIC8vIDMuIFVwZGF0ZSBkYXRhYmFzZSAoc2FuaXRpemUgcmVsYXRpb24sIHByaW1hcnkvZm9yZWlnbiBrZXlzIGFuZCBhdXRvLW1hbmFnZWQgZmllbGRzKVxuICAgICAgY29uc3QgeyBpZCwgYnVpbGRpbmdJZCwgY3JlYXRlZEF0LCB1cGRhdGVkQXQsIGJ1aWxkaW5nOiBidWlsZGluZ1JlbGF0aW9uLCBhdWRpdExvZ3MsIC4uLnVwZGF0ZURhdGEgfSA9IHJlY2FsY3VsYXRlZDtcbiAgICAgIHJldHVybiBhd2FpdCB0eC5hcGFydG1lbnQudXBkYXRlKHtcbiAgICAgICAgd2hlcmU6IHsgaWQ6IGFwYXJ0bWVudElkIH0sXG4gICAgICAgIGRhdGE6IHVwZGF0ZURhdGFcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJlcy5qc29uKHVwZGF0ZWRBcHQpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKCdVcGRhdGUgYXBhcnRtZW50IGVycm9yOicsIGVycik7XG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgZXJyb3I6ICdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3IgdXBkYXRpbmcgYXBhcnRtZW50JyB9KTtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYmF0Y2hVcGRhdGVBcGFydG1lbnRzKHJlcSwgcmVzKSB7XG4gIGNvbnN0IHsgYnVpbGRpbmdJZCB9ID0gcmVxLnBhcmFtcztcbiAgY29uc3QgeyBpdGVtcyB9ID0gcmVxLmJvZHk7IC8vIGFycmF5IG9mOiB7IGlkLCB1cGRhdGVzIH1cblxuICBpZiAoIWl0ZW1zIHx8ICFBcnJheS5pc0FycmF5KGl0ZW1zKSkge1xuICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7IGVycm9yOiAnSXRlbXMgYXJyYXkgaXMgcmVxdWlyZWQnIH0pO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBjb25zdCByb2xlID0gcmVxLnVzZXIucm9sZTtcbiAgICBpZiAocm9sZSAhPT0gJ1JPTEVfQScpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMykuanNvbih7IGVycm9yOiAnRm9yYmlkZGVuOiBPbmx5IEFkbWluIGhhcyBhY2Nlc3MgdG8gbW9kaWZ5IGRhdGEnIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IGJ1aWxkaW5nID0gYXdhaXQgcHJpc21hLmJ1aWxkaW5nLmZpbmRVbmlxdWUoe1xuICAgICAgd2hlcmU6IHsgaWQ6IGJ1aWxkaW5nSWQgfVxuICAgIH0pO1xuXG4gICAgaWYgKCFidWlsZGluZykge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgZXJyb3I6ICdCdWlsZGluZyBub3QgZm91bmQnIH0pO1xuICAgIH1cblxuICAgIC8vIEV4ZWN1dGUgaW4gYSB0cmFuc2FjdGlvblxuICAgIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCBwcmlzbWEuJHRyYW5zYWN0aW9uKGFzeW5jICh0eCkgPT4ge1xuICAgICAgY29uc3QgdXBkYXRlZExpc3QgPSBbXTtcblxuICAgICAgZm9yIChjb25zdCBpdGVtIG9mIGl0ZW1zKSB7XG4gICAgICAgIGNvbnN0IGFwdCA9IGF3YWl0IHR4LmFwYXJ0bWVudC5maW5kVW5pcXVlKHtcbiAgICAgICAgICB3aGVyZTogeyBpZDogaXRlbS5pZCB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmICghYXB0IHx8IGFwdC5idWlsZGluZ0lkICE9PSBidWlsZGluZ0lkKSBjb250aW51ZTtcblxuICAgICAgICBjb25zdCBmaWx0ZXJlZFVwZGF0ZXMgPSB7fTtcbiAgICAgICAgaWYgKHJvbGUgPT09ICdST0xFX0EnKSB7XG4gICAgICAgICAgLy8gUm9sZSBBIChBZG1pbikgaGFzIGZ1bGwgZWRpdGluZyByaWdodHMgdG8gYW55IGZpZWxkIGluIHRoZSBBcGFydG1lbnQgbW9kZWxcbiAgICAgICAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhpdGVtLnVwZGF0ZXMpKSB7XG4gICAgICAgICAgICBpZiAoa2V5ICE9PSAnaWQnICYmIGtleSAhPT0gJ2J1aWxkaW5nSWQnICYmIGtleSAhPT0gJ2NyZWF0ZWRBdCcpIHtcbiAgICAgICAgICAgICAgZmlsdGVyZWRVcGRhdGVzW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAocm9sZSA9PT0gJ1JPTEVfQicpIHtcbiAgICAgICAgICBjb25zdCBhdHRlbXB0ZWRSb2xlQUZpZWxkcyA9IFJPTEVfQV9GSUVMRFMuZmlsdGVyKGtleSA9PiBpdGVtLnVwZGF0ZXNba2V5XSAhPT0gdW5kZWZpbmVkKTtcbiAgICAgICAgICBpZiAoYXR0ZW1wdGVkUm9sZUFGaWVsZHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBFeGVjdXRpb24gcm9sZSBjYW5ub3QgbW9kaWZ5IFNldHVwIGZpZWxkcyBpbiBiYXRjaDogWyR7YXR0ZW1wdGVkUm9sZUFGaWVsZHMuam9pbignLCAnKX1dYCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKGl0ZW0udXBkYXRlcykpIHtcbiAgICAgICAgICAgIGlmICghUk9MRV9BX0ZJRUxEUy5pbmNsdWRlcyhrZXkpICYmIGtleSAhPT0gJ2lkJyAmJiBrZXkgIT09ICdidWlsZGluZ0lkJyAmJiBrZXkgIT09ICdjcmVhdGVkQXQnKSB7XG4gICAgICAgICAgICAgIGZpbHRlcmVkVXBkYXRlc1trZXldID0gdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gT05FLVdSSVRFIExPQ0s6IFJPTEVfQiBjYW5ub3Qgb3ZlcndyaXRlIGEgZmllbGQgdGhhdCBhbHJlYWR5IGhhcyBhIHNhdmVkIHZhbHVlLlxuICAgICAgICAgIC8vIFBlcmNlbnRhZ2UgZmllbGRzOiBsb2NrZWQgb25jZSA+IDAuIFRleHQvZGF0ZSBmaWVsZHM6IGxvY2tlZCBvbmNlIG5vbi1lbXB0eS5cbiAgICAgICAgICBjb25zdCBwY3RGaWVsZHMgPSBbXG4gICAgICAgICAgICAna2l0Y2hlbkxvd2VyQ2FyY2Fzc0lud2FyZCcsICdraXRjaGVuVXBwZXJDYXJjYXNzSW53YXJkJywgJ2tpdGNoZW5TdG9uZUlud2FyZCcsXG4gICAgICAgICAgICAna2l0Y2hlblNodXR0ZXJJbndhcmQnLCAna2l0Y2hlbkhhcmR3YXJlSW53YXJkJywgJ2tpdGNoZW5BcHBsaWFuY2VJbndhcmQnLFxuICAgICAgICAgICAgJ3dhcmRyb2JlQ2FiaW5ldElud2FyZCcsICd3YXJkcm9iZVNodXR0ZXJIYXJkd2FyZUlud2FyZCcsXG4gICAgICAgICAgICAndmFuaXR5Q2FiaW5ldElud2FyZCcsICd2YW5pdHlTaHV0dGVySGFyZHdhcmVJbndhcmQnLFxuICAgICAgICAgICAgJ2Rvb3JGcmFtZUhhcmR3YXJlSW53YXJkJyxcbiAgICAgICAgICAgICdraXRjaGVuTG93ZXJDYXJjYXNzSW5zdGFsbGVkJywgJ2tpdGNoZW5VcHBlckNhcmNhc3NJbnN0YWxsZWQnLCAna2l0Y2hlblN0b25lSW5zdGFsbGVkJyxcbiAgICAgICAgICAgICdraXRjaGVuU2h1dHRlckhhcmR3YXJlSW5zdGFsbGVkJywgJ2tpdGNoZW5BcHBsaWFuY2VJbnN0YWxsZWQnLCAna2l0Y2hlbkhhbmRlZE92ZXInLFxuICAgICAgICAgICAgJ3dhcmRyb2JlQ2FiaW5ldEluc3RhbGxlZCcsICd3YXJkcm9iZVNodXR0ZXJIYXJkd2FyZUluc3RhbGxlZCcsICd3YXJkcm9iZUhhbmRlZE92ZXInLFxuICAgICAgICAgICAgJ3Zhbml0eUNhYmluZXRJbnN0YWxsZWQnLCAndmFuaXR5U2h1dHRlckhhcmR3YXJlSW5zdGFsbGVkJywgJ3Zhbml0eUhhbmRlZE92ZXInLFxuICAgICAgICAgICAgJ2Rvb3JGcmFtZUhhcmR3YXJlSW5zdGFsbGVkJywgJ2Rvb3JIYW5kZWRPdmVyJ1xuICAgICAgICAgIF07XG4gICAgICAgICAgZm9yIChjb25zdCBmIG9mIHBjdEZpZWxkcykge1xuICAgICAgICAgICAgaWYgKGZpbHRlcmVkVXBkYXRlc1tmXSAhPT0gdW5kZWZpbmVkICYmIGFwdFtmXSAhPT0gbnVsbCAmJiBhcHRbZl0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICBkZWxldGUgZmlsdGVyZWRVcGRhdGVzW2ZdOyAvLyBhbHJlYWR5IHNhdmVkIFx1MjAxNCBkZW55IG92ZXJ3cml0ZVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCB0ZXh0TG9ja0ZpZWxkcyA9IFtcbiAgICAgICAgICAgICdwbGFubmVkU3RhcnQnLCAncGxhbm5lZENvbXBsZXRpb24nLCAnYWN0dWFsU3RhcnQnLCAnYWN0dWFsQ29tcGxldGlvbicsXG4gICAgICAgICAgICAnY29udHJhY3RvcicsICdjb250cmFjdG9yTmFtZScsICdkZWxheVJlYXNvbicsICdyZW1hcmtzJyxcbiAgICAgICAgICAgICdraXRjaGVuUUNfVmlzaWJsZVNjcmV3cycsICdraXRjaGVuUUNfQ2hpcHBpbmcnLCAna2l0Y2hlblFDX0ZpbGxlck1pc3NpbmcnLFxuICAgICAgICAgICAgJ2tpdGNoZW5RQ19TY3JhdGNoZXMnLCAna2l0Y2hlblFDX0RyYXdlcnNGdW5jdGlvbicsICdraXRjaGVuUUNfQ3V0bGVyeVRyYXknLCAna2l0Y2hlblFDX0Rpc2hEcmFpbmVyJyxcbiAgICAgICAgICAgICd3YXJkcm9iZVFDX1Zpc2libGVTY3Jld3MnLCAnd2FyZHJvYmVRQ19DaGlwcGluZycsICd3YXJkcm9iZVFDX0ZpbGxlck1pc3NpbmcnLFxuICAgICAgICAgICAgJ3dhcmRyb2JlUUNfU2NyYXRjaGVzJywgJ3dhcmRyb2JlUUNfRHJhd2Vyc0Z1bmN0aW9uJyxcbiAgICAgICAgICAgICd2YW5pdHlRQ19WaXNpYmxlU2NyZXdzJywgJ3Zhbml0eVFDX0NoaXBwaW5nJywgJ3Zhbml0eVFDX0ZpbGxlck1pc3NpbmcnLFxuICAgICAgICAgICAgJ3Zhbml0eVFDX1NjcmF0Y2hlcycsICd2YW5pdHlRQ19EcmF3ZXJzRnVuY3Rpb24nLFxuICAgICAgICAgICAgJ2Rvb3JRQ19DaGlwcGluZycsICdkb29yUUNfQWxpZ25tZW50J1xuICAgICAgICAgIF07XG4gICAgICAgICAgZm9yIChjb25zdCBmIG9mIHRleHRMb2NrRmllbGRzKSB7XG4gICAgICAgICAgICBjb25zdCBleGlzdGluZyA9IGFwdFtmXTtcbiAgICAgICAgICAgIGlmIChmaWx0ZXJlZFVwZGF0ZXNbZl0gIT09IHVuZGVmaW5lZCAmJiBleGlzdGluZyAhPT0gbnVsbCAmJiBleGlzdGluZyAhPT0gdW5kZWZpbmVkICYmIFN0cmluZyhleGlzdGluZykudHJpbSgpICE9PSAnJykge1xuICAgICAgICAgICAgICBkZWxldGUgZmlsdGVyZWRVcGRhdGVzW2ZdOyAvLyBhbHJlYWR5IHNhdmVkIFx1MjAxNCBkZW55IG92ZXJ3cml0ZVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChPYmplY3Qua2V5cyhmaWx0ZXJlZFVwZGF0ZXMpLmxlbmd0aCA9PT0gMCkgY29udGludWU7XG5cbiAgICAgICAgLy8gUGFyc2UgZGF0ZSBmaWVsZHNcbiAgICAgICAgY29uc3QgZGF0ZUZpZWxkcyA9IFsncGxhbm5lZFN0YXJ0JywgJ3BsYW5uZWRDb21wbGV0aW9uJywgJ2FjdHVhbFN0YXJ0JywgJ2FjdHVhbENvbXBsZXRpb24nXTtcbiAgICAgICAgZm9yIChjb25zdCBmIG9mIGRhdGVGaWVsZHMpIHtcbiAgICAgICAgICBpZiAoZmlsdGVyZWRVcGRhdGVzW2ZdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGZpbHRlcmVkVXBkYXRlc1tmXSA9IGZpbHRlcmVkVXBkYXRlc1tmXSA/IG5ldyBEYXRlKGZpbHRlcmVkVXBkYXRlc1tmXSkgOiBudWxsO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChmaWx0ZXJlZFVwZGF0ZXMuYWN0dWFsQ29tcGxldGlvbikge1xuICAgICAgICAgIGNvbnN0IHRvZGF5ID0gbmV3IERhdGUoKTtcbiAgICAgICAgICB0b2RheS5zZXRIb3VycygyMywgNTksIDU5LCA5OTkpO1xuICAgICAgICAgIGlmIChmaWx0ZXJlZFVwZGF0ZXMuYWN0dWFsQ29tcGxldGlvbiA+IHRvZGF5KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0FjdHVhbCBjb21wbGV0aW9uIGRhdGUgY2Fubm90IGJlIHNldCBpbiB0aGUgZnV0dXJlJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gQXVkaXQgTG9nc1xuICAgICAgICBjb25zdCBhdWRpdExvZ0RhdGEgPSBbXTtcbiAgICAgICAgZm9yIChjb25zdCBbZmllbGQsIG5ld1ZhbF0gb2YgT2JqZWN0LmVudHJpZXMoZmlsdGVyZWRVcGRhdGVzKSkge1xuICAgICAgICAgIGxldCBvbGRWYWxTdHIgPSBhcHRbZmllbGRdID09PSBudWxsID8gJycgOiBTdHJpbmcoYXB0W2ZpZWxkXSk7XG4gICAgICAgICAgaWYgKGFwdFtmaWVsZF0gaW5zdGFuY2VvZiBEYXRlKSBvbGRWYWxTdHIgPSBhcHRbZmllbGRdLnRvSVNPU3RyaW5nKCk7XG5cbiAgICAgICAgICBsZXQgbmV3VmFsU3RyID0gbmV3VmFsID09PSBudWxsID8gJycgOiBTdHJpbmcobmV3VmFsKTtcbiAgICAgICAgICBpZiAobmV3VmFsIGluc3RhbmNlb2YgRGF0ZSkgbmV3VmFsU3RyID0gbmV3VmFsLnRvSVNPU3RyaW5nKCk7XG5cbiAgICAgICAgICBpZiAob2xkVmFsU3RyICE9PSBuZXdWYWxTdHIpIHtcbiAgICAgICAgICAgIGF1ZGl0TG9nRGF0YS5wdXNoKHtcbiAgICAgICAgICAgICAgYXBhcnRtZW50SWQ6IGFwdC5pZCxcbiAgICAgICAgICAgICAgdXNlcklkOiByZXEudXNlci5pZCxcbiAgICAgICAgICAgICAgZmllbGROYW1lOiBmaWVsZCxcbiAgICAgICAgICAgICAgb2xkVmFsdWU6IG9sZFZhbFN0cixcbiAgICAgICAgICAgICAgbmV3VmFsdWU6IG5ld1ZhbFN0clxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGF1ZGl0TG9nRGF0YS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgYXdhaXQgdHguYXVkaXRMb2cuY3JlYXRlTWFueSh7XG4gICAgICAgICAgICBkYXRhOiBhdWRpdExvZ0RhdGFcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG1lcmdlZEFwdCA9IHsgLi4uYXB0LCAuLi5maWx0ZXJlZFVwZGF0ZXMgfTtcbiAgICAgICAgY29uc3QgcmVjYWxjdWxhdGVkID0gcmVjYWxjdWxhdGVBcGFydG1lbnQobWVyZ2VkQXB0LCBidWlsZGluZyk7XG5cbiAgICAgICAgLy8gU2FuaXRpemUgcmVsYXRpb24sIHByaW1hcnkvZm9yZWlnbiBrZXlzIGFuZCBhdXRvLW1hbmFnZWQgZmllbGRzIGZyb20gZGF0YVxuICAgICAgICBjb25zdCB7IGlkLCBidWlsZGluZ0lkOiBiSWQsIGNyZWF0ZWRBdCwgdXBkYXRlZEF0LCBidWlsZGluZzogYnVpbGRpbmdSZWxhdGlvbiwgYXVkaXRMb2dzLCAuLi51cGRhdGVEYXRhIH0gPSByZWNhbGN1bGF0ZWQ7XG5cbiAgICAgICAgY29uc3QgdXBkYXRlZCA9IGF3YWl0IHR4LmFwYXJ0bWVudC51cGRhdGUoe1xuICAgICAgICAgIHdoZXJlOiB7IGlkOiBhcHQuaWQgfSxcbiAgICAgICAgICBkYXRhOiB1cGRhdGVEYXRhXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHVwZGF0ZWRMaXN0LnB1c2godXBkYXRlZCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB1cGRhdGVkTGlzdDtcbiAgICB9KTtcblxuICAgIHJldHVybiByZXMuanNvbih7IHN1Y2Nlc3M6IHRydWUsIHVwZGF0ZWRDb3VudDogcmVzdWx0cy5sZW5ndGggfSk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0JhdGNoIHVwZGF0ZSBlcnJvcjonLCBlcnIpO1xuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7IGVycm9yOiAnSW50ZXJuYWwgc2VydmVyIGVycm9yIGluIGJhdGNoIHVwZGF0ZScgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEF1ZGl0TG9ncyhyZXEsIHJlcykge1xuICBjb25zdCB7IGFwYXJ0bWVudElkIH0gPSByZXEucGFyYW1zO1xuICB0cnkge1xuICAgIGNvbnN0IGxvZ3MgPSBhd2FpdCBwcmlzbWEuYXVkaXRMb2cuZmluZE1hbnkoe1xuICAgICAgd2hlcmU6IHsgYXBhcnRtZW50SWQgfSxcbiAgICAgIGluY2x1ZGU6IHtcbiAgICAgICAgdXNlcjoge1xuICAgICAgICAgIHNlbGVjdDoge1xuICAgICAgICAgICAgbmFtZTogdHJ1ZSxcbiAgICAgICAgICAgIHJvbGU6IHRydWVcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBvcmRlckJ5OiB7IGNoYW5nZWRBdDogJ2Rlc2MnIH1cbiAgICB9KTtcbiAgICByZXR1cm4gcmVzLmpzb24obG9ncyk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7IGVycm9yOiAnSW50ZXJuYWwgc2VydmVyIGVycm9yIGZldGNoaW5nIGxvZ3MnIH0pO1xuICB9XG59XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGhwXFxcXERvd25sb2Fkc1xcXFxEaW8gR3JhY2VlXFxcXERpbyBHcmFjZWVcXFxcYmFja2VuZFxcXFxzcmNcXFxcc2VydmljZXNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGhwXFxcXERvd25sb2Fkc1xcXFxEaW8gR3JhY2VlXFxcXERpbyBHcmFjZWVcXFxcYmFja2VuZFxcXFxzcmNcXFxcc2VydmljZXNcXFxcYmlsbGluZ1NlcnZpY2UuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL2hwL0Rvd25sb2Fkcy9EaW8lMjBHcmFjZWUvRGlvJTIwR3JhY2VlL2JhY2tlbmQvc3JjL3NlcnZpY2VzL2JpbGxpbmdTZXJ2aWNlLmpzXCI7LyoqXG4gKiBTZXJ2aWNlIHRvIGNhbGN1bGF0ZSBDb250cmFjdG9yIEJpbGwgYW5kIENsaWVudCBSQSBCaWxsIHZhbHVlcy5cbiAqL1xuXG5leHBvcnQgZnVuY3Rpb24gY2FsY3VsYXRlQ29udHJhY3RvckJpbGxMaW5lKGxpbmUsIGFwYXJ0bWVudHMsIHNldHVwKSB7XG4gIGNvbnN0IHVuaXRUeXBlID0gbGluZS51bml0VHlwZTtcbiAgaWYgKCF1bml0VHlwZSkgcmV0dXJuIGxpbmU7XG5cbiAgY29uc3QgcHJvZHVjdCA9IHVuaXRUeXBlLnByb2R1Y3Q7IC8vIEtpdGNoZW4sIFdhcmRyb2JlLCBWYW5pdHlcbiAgY29uc3QgdHlwZUNvZGUgPSB1bml0VHlwZS50eXBlQ29kZTtcblxuICAvLyAxLiBDYWxjdWxhdGUgQWxsb2NhdGVkIFVuaXRzXG4gIC8vIHN1bSBvZiB0aGUgcmVsZXZhbnQgUXR5IGNvbHVtbiBhY3Jvc3MgYXBhcnRtZW50cyBpbiB0aGlzIE9yZGVyIGZvciB0aGlzIGNvbnRyYWN0b3IgYW5kIHR5cGVcbiAgbGV0IGFsbG9jYXRlZFVuaXRzID0gMDtcbiAgZm9yIChjb25zdCBhcHQgb2YgYXBhcnRtZW50cykge1xuICAgIGlmIChhcHQuY29udHJhY3Rvck5hbWUgJiYgYXB0LmNvbnRyYWN0b3JOYW1lLnRyaW0oKS50b0xvd2VyQ2FzZSgpID09PSBsaW5lLmNvbnRyYWN0b3JOYW1lLnRyaW0oKS50b0xvd2VyQ2FzZSgpKSB7XG4gICAgICBpZiAocHJvZHVjdCA9PT0gXCJLaXRjaGVuXCIpIHtcbiAgICAgICAgY29uc3QgdHlwZVN0ciA9IGFwdC5raXRjaGVuVHlwZTtcbiAgICAgICAgaWYgKHR5cGVTdHIgJiYgdHlwZVN0ci5zdGFydHNXaXRoKCdbJykpIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgbGlzdCA9IEpTT04ucGFyc2UodHlwZVN0cik7XG4gICAgICAgICAgICBjb25zdCBmb3VuZCA9IGxpc3QuZmluZChpdGVtID0+IGl0ZW0udHlwZSA9PT0gdHlwZUNvZGUpO1xuICAgICAgICAgICAgaWYgKGZvdW5kKSBhbGxvY2F0ZWRVbml0cyArPSBmb3VuZC5xdHkgfHwgMDtcbiAgICAgICAgICB9IGNhdGNoIChlKSB7fVxuICAgICAgICB9IGVsc2UgaWYgKGFwdC5raXRjaGVuVHlwZSA9PT0gdHlwZUNvZGUpIHtcbiAgICAgICAgICBhbGxvY2F0ZWRVbml0cyArPSBhcHQua2l0Y2hlblF0eSB8fCAwO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHByb2R1Y3QgPT09IFwiV2FyZHJvYmVcIikge1xuICAgICAgICBjb25zdCB0eXBlU3RyID0gYXB0LndhcmRyb2JlVHlwZTtcbiAgICAgICAgaWYgKHR5cGVTdHIgJiYgdHlwZVN0ci5zdGFydHNXaXRoKCdbJykpIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgbGlzdCA9IEpTT04ucGFyc2UodHlwZVN0cik7XG4gICAgICAgICAgICBjb25zdCBmb3VuZCA9IGxpc3QuZmluZChpdGVtID0+IGl0ZW0udHlwZSA9PT0gdHlwZUNvZGUpO1xuICAgICAgICAgICAgaWYgKGZvdW5kKSBhbGxvY2F0ZWRVbml0cyArPSBmb3VuZC5xdHkgfHwgMDtcbiAgICAgICAgICB9IGNhdGNoIChlKSB7fVxuICAgICAgICB9IGVsc2UgaWYgKGFwdC53YXJkcm9iZVR5cGUgPT09IHR5cGVDb2RlKSB7XG4gICAgICAgICAgYWxsb2NhdGVkVW5pdHMgKz0gYXB0LndhcmRyb2JlUXR5IHx8IDA7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAocHJvZHVjdCA9PT0gXCJWYW5pdHlcIikge1xuICAgICAgICBjb25zdCB0eXBlU3RyID0gYXB0LnZhbml0eVR5cGU7XG4gICAgICAgIGlmICh0eXBlU3RyICYmIHR5cGVTdHIuc3RhcnRzV2l0aCgnWycpKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGxpc3QgPSBKU09OLnBhcnNlKHR5cGVTdHIpO1xuICAgICAgICAgICAgY29uc3QgZm91bmQgPSBsaXN0LmZpbmQoaXRlbSA9PiBpdGVtLnR5cGUgPT09IHR5cGVDb2RlKTtcbiAgICAgICAgICAgIGlmIChmb3VuZCkgYWxsb2NhdGVkVW5pdHMgKz0gZm91bmQucXR5IHx8IDA7XG4gICAgICAgICAgfSBjYXRjaCAoZSkge31cbiAgICAgICAgfSBlbHNlIGlmIChhcHQudmFuaXR5VHlwZSA9PT0gdHlwZUNvZGUpIHtcbiAgICAgICAgICBhbGxvY2F0ZWRVbml0cyArPSBhcHQudmFuaXR5UXR5IHx8IDA7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAocHJvZHVjdCA9PT0gXCJEb29yXCIpIHtcbiAgICAgICAgY29uc3QgdHlwZVN0ciA9IGFwdC5kb29yVHlwZTtcbiAgICAgICAgaWYgKHR5cGVTdHIgJiYgdHlwZVN0ci5zdGFydHNXaXRoKCdbJykpIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgbGlzdCA9IEpTT04ucGFyc2UodHlwZVN0cik7XG4gICAgICAgICAgICBjb25zdCBmb3VuZCA9IGxpc3QuZmluZChpdGVtID0+IGl0ZW0udHlwZSA9PT0gdHlwZUNvZGUpO1xuICAgICAgICAgICAgaWYgKGZvdW5kKSBhbGxvY2F0ZWRVbml0cyArPSBmb3VuZC5xdHkgfHwgMDtcbiAgICAgICAgICB9IGNhdGNoIChlKSB7fVxuICAgICAgICB9IGVsc2UgaWYgKGFwdC5kb29yVHlwZSA9PT0gdHlwZUNvZGUpIHtcbiAgICAgICAgICBhbGxvY2F0ZWRVbml0cyArPSBhcHQuZG9vclF0eSB8fCAwO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgY29uc3QgcmF0ZSA9IHVuaXRUeXBlLmNvbnRyYWN0b3JSYXRlIHx8IDAuMDtcbiAgY29uc3Qgd29WYWx1ZSA9IHJhdGUgKiBhbGxvY2F0ZWRVbml0cztcbiAgXG4gIGNvbnN0IGVsaWdpYmxlVW5pdHMgPSBsaW5lLmVsaWdpYmxlVW5pdEVxdWl2YWxlbnQgfHwgMC4wO1xuICBjb25zdCBlbGlnaWJpbGl0eVBjdCA9IGFsbG9jYXRlZFVuaXRzID4gMCA/IChlbGlnaWJsZVVuaXRzIC8gYWxsb2NhdGVkVW5pdHMpIDogMC4wO1xuICBjb25zdCBjdW11bGF0aXZlRWxpZ2libGUgPSByYXRlICogZWxpZ2libGVVbml0cztcbiAgXG4gIGNvbnN0IHByZXZDZXJ0aWZpZWQgPSBsaW5lLnByZXZpb3VzQ2VydGlmaWVkIHx8IDAuMDtcbiAgY29uc3QgY3VycmVudEdyb3NzID0gTWF0aC5tYXgoMCwgY3VtdWxhdGl2ZUVsaWdpYmxlIC0gcHJldkNlcnRpZmllZCk7XG5cbiAgY29uc3QgcmV0ZW50aW9uUGN0ID0gc2V0dXAuY29udHJhY3RvclJldGVudGlvblBjdCB8fCA1LjA7XG4gIGNvbnN0IGdzdFBjdCA9IHNldHVwLmNvbnRyYWN0b3JHU1RQY3QgfHwgMTguMDtcbiAgY29uc3QgdGRzUGN0ID0gc2V0dXAuY29udHJhY3RvclREU1BjdCB8fCAxLjA7XG5cbiAgY29uc3QgcmV0ZW50aW9uQW10ID0gY3VycmVudEdyb3NzICogKHJldGVudGlvblBjdCAvIDEwMC4wKTtcbiAgY29uc3QgZ3N0QW10ID0gY3VycmVudEdyb3NzICogKGdzdFBjdCAvIDEwMC4wKTtcbiAgY29uc3QgdGRzQW10ID0gY3VycmVudEdyb3NzICogKHRkc1BjdCAvIDEwMC4wKTtcbiAgY29uc3Qgb3RoZXJEZWR1Y3Rpb24gPSBsaW5lLm90aGVyRGVkdWN0aW9uIHx8IDAuMDtcblxuICBjb25zdCBuZXRQYXlhYmxlID0gTWF0aC5tYXgoMCwgY3VycmVudEdyb3NzIC0gcmV0ZW50aW9uQW10ICsgZ3N0QW10IC0gdGRzQW10IC0gb3RoZXJEZWR1Y3Rpb24pO1xuXG4gIHJldHVybiB7XG4gICAgLi4ubGluZSxcbiAgICByYXRlVW5pdDogcmF0ZSxcbiAgICBhbGxvY2F0ZWRVbml0cyxcbiAgICB3b1ZhbHVlOiBNYXRoLnJvdW5kKHdvVmFsdWUgKiAxMDApIC8gMTAwLFxuICAgIGVsaWdpYmlsaXR5UGN0OiBNYXRoLnJvdW5kKGVsaWdpYmlsaXR5UGN0ICogMTAwMCkgLyAxMDAwLFxuICAgIGN1bXVsYXRpdmVFbGlnaWJsZTogTWF0aC5yb3VuZChjdW11bGF0aXZlRWxpZ2libGUgKiAxMDApIC8gMTAwLFxuICAgIGN1cnJlbnRHcm9zczogTWF0aC5yb3VuZChjdXJyZW50R3Jvc3MgKiAxMDApIC8gMTAwLFxuICAgIHJldGVudGlvbkFtdDogTWF0aC5yb3VuZChyZXRlbnRpb25BbXQgKiAxMDApIC8gMTAwLFxuICAgIGdzdEFtdDogTWF0aC5yb3VuZChnc3RBbXQgKiAxMDApIC8gMTAwLFxuICAgIHRkc0FtdDogTWF0aC5yb3VuZCh0ZHNBbXQgKiAxMDApIC8gMTAwLFxuICAgIG5ldFBheWFibGU6IE1hdGgucm91bmQobmV0UGF5YWJsZSAqIDEwMCkgLyAxMDBcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNhbGN1bGF0ZUNsaWVudFJBQmlsbExpbmUobGluZSwgYXBhcnRtZW50cywgc2V0dXAsIHRvd2VyUmF0ZXNPdmVycmlkZSA9IFtdKSB7XG4gIGNvbnN0IHVuaXRUeXBlID0gbGluZS51bml0VHlwZTtcbiAgaWYgKCF1bml0VHlwZSkgcmV0dXJuIGxpbmU7XG5cbiAgY29uc3QgcHJvZHVjdCA9IHVuaXRUeXBlLnByb2R1Y3Q7IC8vIEtpdGNoZW4sIFdhcmRyb2JlLCBWYW5pdHlcbiAgY29uc3QgdHlwZUNvZGUgPSB1bml0VHlwZS50eXBlQ29kZTtcbiAgY29uc3QgYnVpbGRpbmdJZCA9IGxpbmUuYnVpbGRpbmdJZDtcblxuICAvLyAxLiBGaWx0ZXIgYXBhcnRtZW50cyBpbiB0aGlzIGJ1aWxkaW5nICh0b3dlcikgYW5kIG1hdGNoIHVuaXRUeXBlXG4gIGNvbnN0IGFwdFdpdGhRdHlzID0gW107XG4gIGZvciAoY29uc3QgYXB0IG9mIGFwYXJ0bWVudHMpIHtcbiAgICBpZiAoYXB0LmJ1aWxkaW5nSWQgIT09IGJ1aWxkaW5nSWQpIGNvbnRpbnVlO1xuICAgIGlmIChwcm9kdWN0ID09PSBcIktpdGNoZW5cIikge1xuICAgICAgY29uc3QgdHlwZVN0ciA9IGFwdC5raXRjaGVuVHlwZTtcbiAgICAgIGlmICh0eXBlU3RyICYmIHR5cGVTdHIuc3RhcnRzV2l0aCgnWycpKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgbGlzdCA9IEpTT04ucGFyc2UodHlwZVN0cik7XG4gICAgICAgICAgY29uc3QgZm91bmQgPSBsaXN0LmZpbmQoaXRlbSA9PiBpdGVtLnR5cGUgPT09IHR5cGVDb2RlKTtcbiAgICAgICAgICBpZiAoZm91bmQgJiYgZm91bmQucXR5ID4gMCkge1xuICAgICAgICAgICAgYXB0V2l0aFF0eXMucHVzaCh7IGFwdCwgcXR5OiBmb3VuZC5xdHkgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7fVxuICAgICAgfSBlbHNlIGlmIChhcHQua2l0Y2hlblR5cGUgPT09IHR5cGVDb2RlICYmIChhcHQua2l0Y2hlblF0eSB8fCAwKSA+IDApIHtcbiAgICAgICAgYXB0V2l0aFF0eXMucHVzaCh7IGFwdCwgcXR5OiBhcHQua2l0Y2hlblF0eSB8fCAwIH0pO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAocHJvZHVjdCA9PT0gXCJXYXJkcm9iZVwiKSB7XG4gICAgICBjb25zdCB0eXBlU3RyID0gYXB0LndhcmRyb2JlVHlwZTtcbiAgICAgIGlmICh0eXBlU3RyICYmIHR5cGVTdHIuc3RhcnRzV2l0aCgnWycpKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgbGlzdCA9IEpTT04ucGFyc2UodHlwZVN0cik7XG4gICAgICAgICAgY29uc3QgZm91bmQgPSBsaXN0LmZpbmQoaXRlbSA9PiBpdGVtLnR5cGUgPT09IHR5cGVDb2RlKTtcbiAgICAgICAgICBpZiAoZm91bmQgJiYgZm91bmQucXR5ID4gMCkge1xuICAgICAgICAgICAgYXB0V2l0aFF0eXMucHVzaCh7IGFwdCwgcXR5OiBmb3VuZC5xdHkgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7fVxuICAgICAgfSBlbHNlIGlmIChhcHQud2FyZHJvYmVUeXBlID09PSB0eXBlQ29kZSAmJiAoYXB0LndhcmRyb2JlUXR5IHx8IDApID4gMCkge1xuICAgICAgICBhcHRXaXRoUXR5cy5wdXNoKHsgYXB0LCBxdHk6IGFwdC53YXJkcm9iZVF0eSB8fCAwIH0pO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAocHJvZHVjdCA9PT0gXCJWYW5pdHlcIikge1xuICAgICAgY29uc3QgdHlwZVN0ciA9IGFwdC52YW5pdHlUeXBlO1xuICAgICAgaWYgKHR5cGVTdHIgJiYgdHlwZVN0ci5zdGFydHNXaXRoKCdbJykpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCBsaXN0ID0gSlNPTi5wYXJzZSh0eXBlU3RyKTtcbiAgICAgICAgICBjb25zdCBmb3VuZCA9IGxpc3QuZmluZChpdGVtID0+IGl0ZW0udHlwZSA9PT0gdHlwZUNvZGUpO1xuICAgICAgICAgIGlmIChmb3VuZCAmJiBmb3VuZC5xdHkgPiAwKSB7XG4gICAgICAgICAgICBhcHRXaXRoUXR5cy5wdXNoKHsgYXB0LCBxdHk6IGZvdW5kLnF0eSB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHt9XG4gICAgICB9IGVsc2UgaWYgKGFwdC52YW5pdHlUeXBlID09PSB0eXBlQ29kZSAmJiAoYXB0LnZhbml0eVF0eSB8fCAwKSA+IDApIHtcbiAgICAgICAgYXB0V2l0aFF0eXMucHVzaCh7IGFwdCwgcXR5OiBhcHQudmFuaXR5UXR5IHx8IDAgfSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChwcm9kdWN0ID09PSBcIkRvb3JcIikge1xuICAgICAgY29uc3QgdHlwZVN0ciA9IGFwdC5kb29yVHlwZTtcbiAgICAgIGlmICh0eXBlU3RyICYmIHR5cGVTdHIuc3RhcnRzV2l0aCgnWycpKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgbGlzdCA9IEpTT04ucGFyc2UodHlwZVN0cik7XG4gICAgICAgICAgY29uc3QgZm91bmQgPSBsaXN0LmZpbmQoaXRlbSA9PiBpdGVtLnR5cGUgPT09IHR5cGVDb2RlKTtcbiAgICAgICAgICBpZiAoZm91bmQgJiYgZm91bmQucXR5ID4gMCkge1xuICAgICAgICAgICAgYXB0V2l0aFF0eXMucHVzaCh7IGFwdCwgcXR5OiBmb3VuZC5xdHkgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7fVxuICAgICAgfSBlbHNlIGlmIChhcHQuZG9vclR5cGUgPT09IHR5cGVDb2RlICYmIChhcHQuZG9vclF0eSB8fCAwKSA+IDApIHtcbiAgICAgICAgYXB0V2l0aFF0eXMucHVzaCh7IGFwdCwgcXR5OiBhcHQuZG9vclF0eSB8fCAwIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHVuaXRzQ291bnQgPSBhcHRXaXRoUXR5cy5yZWR1Y2UoKHN1bSwgaXRlbSkgPT4gc3VtICsgaXRlbS5xdHksIDApO1xuXG4gIC8vIDIuIENsaWVudCBSYXRlIC8gVW5pdDogY2hlY2sgdG93ZXIgb3ZlcnJpZGUsIGVsc2UgZGVmYXVsdCBjbGllbnRSYXRlXG4gIGNvbnN0IG92ZXJyaWRlID0gdG93ZXJSYXRlc092ZXJyaWRlLmZpbmQobyA9PiBvLmJ1aWxkaW5nSWQgPT09IGJ1aWxkaW5nSWQpO1xuICBsZXQgcmF0ZSA9IHVuaXRUeXBlLmNsaWVudFJhdGUgfHwgMC4wO1xuICBpZiAob3ZlcnJpZGUpIHtcbiAgICBpZiAocHJvZHVjdCA9PT0gXCJLaXRjaGVuXCIgJiYgb3ZlcnJpZGUua2l0Y2hlblJhdGUgPiAwKSByYXRlID0gb3ZlcnJpZGUua2l0Y2hlblJhdGU7XG4gICAgZWxzZSBpZiAocHJvZHVjdCA9PT0gXCJXYXJkcm9iZVwiICYmIG92ZXJyaWRlLndhcmRyb2JlUmF0ZSA+IDApIHJhdGUgPSBvdmVycmlkZS53YXJkcm9iZVJhdGU7XG4gICAgZWxzZSBpZiAocHJvZHVjdCA9PT0gXCJWYW5pdHlcIiAmJiBvdmVycmlkZS52YW5pdHlSYXRlID4gMCkgcmF0ZSA9IG92ZXJyaWRlLnZhbml0eVJhdGU7XG4gICAgZWxzZSBpZiAocHJvZHVjdCA9PT0gXCJEb29yXCIgJiYgb3ZlcnJpZGUuZG9vclJhdGUgPiAwKSByYXRlID0gb3ZlcnJpZGUuZG9vclJhdGU7XG4gIH1cblxuICBjb25zdCBjb250cmFjdFZhbHVlID0gdW5pdHNDb3VudCAqIHJhdGU7XG5cbiAgLy8gMy4gQ2xpZW50IFJBIE1pbGVzdG9uZXMgc2V0dXBcbiAgY29uc3QgbWlsZXN0b25lcyA9IHNldHVwLmNsaWVudFJBTWlsZXN0b25lcyB8fCBbXTtcbiAgY29uc3QgbWF0ZXJpYWxNaWxlc3RvbmVzID0gbWlsZXN0b25lcy5maWx0ZXIobSA9PiBtLnByb2R1Y3QgPT09IHByb2R1Y3QgJiYgbS5yZWNvZ25pdGlvblR5cGUgPT09IFwiTUFURVJJQUxcIik7XG4gIGNvbnN0IGV4ZWN1dGlvbk1pbGVzdG9uZXMgPSBtaWxlc3RvbmVzLmZpbHRlcihtID0+IG0ucHJvZHVjdCA9PT0gcHJvZHVjdCAmJiBtLnJlY29nbml0aW9uVHlwZSA9PT0gXCJFWEVDVVRJT05cIik7XG4gIGNvbnN0IGhhbmRvdmVyTWlsZXN0b25lcyA9IG1pbGVzdG9uZXMuZmlsdGVyKG0gPT4gbS5wcm9kdWN0ID09PSBwcm9kdWN0ICYmIG0ucmVjb2duaXRpb25UeXBlID09PSBcIkhBTkRPVkVSXCIpO1xuXG4gIGxldCBzdW1NYXRlcmlhbFBjdCA9IDAuMDtcbiAgbGV0IHN1bUV4ZWN1dGlvblBjdCA9IDAuMDtcbiAgbGV0IHN1bUhhbmRvdmVyUGN0ID0gMC4wO1xuXG4gIGlmIChhcHRXaXRoUXR5cy5sZW5ndGggPiAwKSB7XG4gICAgZm9yIChjb25zdCB7IGFwdCwgcXR5IH0gb2YgYXB0V2l0aFF0eXMpIHtcbiAgICAgIC8vIE1hdGVyaWFsXG4gICAgICBsZXQgYXB0TWF0UGN0ID0gMC4wO1xuICAgICAgZm9yIChjb25zdCBtIG9mIG1hdGVyaWFsTWlsZXN0b25lcykge1xuICAgICAgICBjb25zdCB2YWwgPSBhcHRbbS5maWVsZEtleV0gfHwgMDtcbiAgICAgICAgY29uc3Qgbm9ybWFsaXplZFZhbCA9IE1hdGgubWluKDEuMCwgdmFsIC8gMTAwLjApO1xuICAgICAgICBhcHRNYXRQY3QgKz0gKG5vcm1hbGl6ZWRWYWwgKiBtLnBlcmNlbnRhZ2UpIC8gMTAwLjA7XG4gICAgICB9XG4gICAgICBzdW1NYXRlcmlhbFBjdCArPSBhcHRNYXRQY3QgKiBxdHk7XG5cbiAgICAgIC8vIEV4ZWN1dGlvblxuICAgICAgbGV0IGFwdEV4ZWNQY3QgPSAwLjA7XG4gICAgICBmb3IgKGNvbnN0IG0gb2YgZXhlY3V0aW9uTWlsZXN0b25lcykge1xuICAgICAgICBjb25zdCB2YWwgPSBhcHRbbS5maWVsZEtleV0gfHwgMDtcbiAgICAgICAgY29uc3Qgbm9ybWFsaXplZFZhbCA9IE1hdGgubWluKDEuMCwgdmFsIC8gMTAwLjApO1xuICAgICAgICBhcHRFeGVjUGN0ICs9IChub3JtYWxpemVkVmFsICogbS5wZXJjZW50YWdlKSAvIDEwMC4wO1xuICAgICAgfVxuICAgICAgc3VtRXhlY3V0aW9uUGN0ICs9IGFwdEV4ZWNQY3QgKiBxdHk7XG5cbiAgICAgIC8vIEhhbmRvdmVyXG4gICAgICBsZXQgYXB0SGFuZG92ZXJQY3QgPSAwLjA7XG4gICAgICBmb3IgKGNvbnN0IG0gb2YgaGFuZG92ZXJNaWxlc3RvbmVzKSB7XG4gICAgICAgIGNvbnN0IHFjR2F0ZSA9IHByb2R1Y3QgPT09IFwiS2l0Y2hlblwiID8gYXB0LmtpdGNoZW5RQ0dhdGUgOiAocHJvZHVjdCA9PT0gXCJXYXJkcm9iZVwiID8gYXB0LndhcmRyb2JlUUNHYXRlIDogKHByb2R1Y3QgPT09IFwiVmFuaXR5XCIgPyBhcHQudmFuaXR5UUNHYXRlIDogYXB0LmRvb3JRQ0dhdGUpKTtcbiAgICAgICAgY29uc3QgaGFuZGVkT3ZlciA9IHByb2R1Y3QgPT09IFwiS2l0Y2hlblwiID8gKGFwdC5raXRjaGVuSGFuZGVkT3ZlciB8fCAwKSA6IChwcm9kdWN0ID09PSBcIldhcmRyb2JlXCIgPyAoYXB0LndhcmRyb2JlSGFuZGVkT3ZlciB8fCAwKSA6IChwcm9kdWN0ID09PSBcIlZhbml0eVwiID8gKGFwdC52YW5pdHlIYW5kZWRPdmVyIHx8IDApIDogKGFwdC5kb29ySGFuZGVkT3ZlciB8fCAwKSkpO1xuICAgICAgICBjb25zdCBub3JtYWxpemVkVmFsID0gTWF0aC5taW4oMS4wLCBoYW5kZWRPdmVyIC8gMTAwLjApO1xuICAgICAgICBpZiAocWNHYXRlID09PSBcIkFwcHJvdmVkXCIgJiYgbm9ybWFsaXplZFZhbCA+IDApIHtcbiAgICAgICAgICBhcHRIYW5kb3ZlclBjdCArPSAobm9ybWFsaXplZFZhbCAqIG0ucGVyY2VudGFnZSkgLyAxMDAuMDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgc3VtSGFuZG92ZXJQY3QgKz0gYXB0SGFuZG92ZXJQY3QgKiBxdHk7XG4gICAgfVxuXG4gICAgc3VtTWF0ZXJpYWxQY3QgPSBzdW1NYXRlcmlhbFBjdCAvIHVuaXRzQ291bnQ7XG4gICAgc3VtRXhlY3V0aW9uUGN0ID0gc3VtRXhlY3V0aW9uUGN0IC8gdW5pdHNDb3VudDtcbiAgICBzdW1IYW5kb3ZlclBjdCA9IHN1bUhhbmRvdmVyUGN0IC8gdW5pdHNDb3VudDtcbiAgfVxuXG4gIGNvbnN0IG1hdGVyaWFsRWxpZ2libGVBbXQgPSBjb250cmFjdFZhbHVlICogc3VtTWF0ZXJpYWxQY3Q7XG4gIGNvbnN0IGV4ZWN1dGlvbkVsaWdpYmxlQW10ID0gY29udHJhY3RWYWx1ZSAqIHN1bUV4ZWN1dGlvblBjdDtcbiAgY29uc3QgaGFuZG92ZXJFbGlnaWJsZUFtdCA9IGNvbnRyYWN0VmFsdWUgKiBzdW1IYW5kb3ZlclBjdDtcbiAgY29uc3QgY3VtdWxhdGl2ZUVsaWdpYmxlID0gbWF0ZXJpYWxFbGlnaWJsZUFtdCArIGV4ZWN1dGlvbkVsaWdpYmxlQW10ICsgaGFuZG92ZXJFbGlnaWJsZUFtdDtcblxuICBjb25zdCBvdmVyYWxsRWxpZ1BjdCA9IGNvbnRyYWN0VmFsdWUgPiAwID8gKGN1bXVsYXRpdmVFbGlnaWJsZSAvIGNvbnRyYWN0VmFsdWUpIDogMC4wO1xuXG4gIGNvbnN0IGluY2x1ZGUgPSBsaW5lLmluY2x1ZGVJbkN1cnJlbnRSQSA/PyB0cnVlO1xuICBjb25zdCBwcmV2Q2VydGlmaWVkID0gbGluZS5wcmV2aW91c0NlcnRpZmllZCB8fCAwLjA7XG4gIGNvbnN0IGN1cnJlbnRHcm9zcyA9IGluY2x1ZGUgPyBNYXRoLm1heCgwLCBjdW11bGF0aXZlRWxpZ2libGUgLSBwcmV2Q2VydGlmaWVkKSA6IDAuMDtcblxuICBjb25zdCByZXRlbnRpb25QY3QgPSBzZXR1cC5jbGllbnRSZXRlbnRpb25QY3QgfHwgNS4wO1xuICBjb25zdCBnc3RQY3QgPSBzZXR1cC5jbGllbnRHU1RQY3QgfHwgMTguMDtcblxuICBjb25zdCByZXRlbnRpb25BbXQgPSBjdXJyZW50R3Jvc3MgKiAocmV0ZW50aW9uUGN0IC8gMTAwLjApO1xuICBjb25zdCBnc3RBbXQgPSBjdXJyZW50R3Jvc3MgKiAoZ3N0UGN0IC8gMTAwLjApO1xuICBjb25zdCBvdGhlckRlZHVjdGlvbiA9IGxpbmUub3RoZXJEZWR1Y3Rpb24gfHwgMC4wO1xuXG4gIGNvbnN0IG5ldFJBID0gTWF0aC5tYXgoMCwgY3VycmVudEdyb3NzIC0gcmV0ZW50aW9uQW10ICsgZ3N0QW10IC0gb3RoZXJEZWR1Y3Rpb24pO1xuXG4gIHJldHVybiB7XG4gICAgLi4ubGluZSxcbiAgICB1bml0c0NvdW50LFxuICAgIHJhdGVVbml0OiByYXRlLFxuICAgIGNvbnRyYWN0VmFsdWU6IE1hdGgucm91bmQoY29udHJhY3RWYWx1ZSAqIDEwMCkgLyAxMDAsXG4gICAgbWF0ZXJpYWxFbGlnaWJpbGl0eVBjdDogTWF0aC5yb3VuZChzdW1NYXRlcmlhbFBjdCAqIDEwMDApIC8gMTAwMCxcbiAgICBtYXRlcmlhbEVsaWdpYmxlQW10OiBNYXRoLnJvdW5kKG1hdGVyaWFsRWxpZ2libGVBbXQgKiAxMDApIC8gMTAwLFxuICAgIGV4ZWN1dGlvbkVsaWdpYmlsaXR5UGN0OiBNYXRoLnJvdW5kKHN1bUV4ZWN1dGlvblBjdCAqIDEwMDApIC8gMTAwMCxcbiAgICBleGVjdXRpb25FbGlnaWJsZUFtdDogTWF0aC5yb3VuZChleGVjdXRpb25FbGlnaWJsZUFtdCAqIDEwMCkgLyAxMDAsXG4gICAgaGFuZG92ZXJFbGlnaWJpbGl0eVBjdDogTWF0aC5yb3VuZChzdW1IYW5kb3ZlclBjdCAqIDEwMDApIC8gMTAwMCxcbiAgICBoYW5kb3ZlckVsaWdpYmxlQW10OiBNYXRoLnJvdW5kKGhhbmRvdmVyRWxpZ2libGVBbXQgKiAxMDApIC8gMTAwLFxuICAgIGN1bXVsYXRpdmVFbGlnaWJsZTogTWF0aC5yb3VuZChjdW11bGF0aXZlRWxpZ2libGUgKiAxMDApIC8gMTAwLFxuICAgIG92ZXJhbGxFbGlnUGN0OiBNYXRoLnJvdW5kKG92ZXJhbGxFbGlnUGN0ICogMTAwMCkgLyAxMDAwLFxuICAgIGN1cnJlbnRHcm9zczogTWF0aC5yb3VuZChjdXJyZW50R3Jvc3MgKiAxMDApIC8gMTAwLFxuICAgIHJldGVudGlvbkFtdDogTWF0aC5yb3VuZChyZXRlbnRpb25BbXQgKiAxMDApIC8gMTAwLFxuICAgIGdzdEFtdDogTWF0aC5yb3VuZChnc3RBbXQgKiAxMDApIC8gMTAwLFxuICAgIG5ldFJBOiBNYXRoLnJvdW5kKG5ldFJBICogMTAwKSAvIDEwMFxuICB9O1xufVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxocFxcXFxEb3dubG9hZHNcXFxcRGlvIEdyYWNlZVxcXFxEaW8gR3JhY2VlXFxcXGJhY2tlbmRcXFxcc3JjXFxcXGNvbnRyb2xsZXJzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxocFxcXFxEb3dubG9hZHNcXFxcRGlvIEdyYWNlZVxcXFxEaW8gR3JhY2VlXFxcXGJhY2tlbmRcXFxcc3JjXFxcXGNvbnRyb2xsZXJzXFxcXGJpbGxpbmdDb250cm9sbGVyLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9ocC9Eb3dubG9hZHMvRGlvJTIwR3JhY2VlL0RpbyUyMEdyYWNlZS9iYWNrZW5kL3NyYy9jb250cm9sbGVycy9iaWxsaW5nQ29udHJvbGxlci5qc1wiO2ltcG9ydCB7IFByaXNtYUNsaWVudCB9IGZyb20gJ0BwcmlzbWEvY2xpZW50JztcbmltcG9ydCB7IGNhbGN1bGF0ZUNvbnRyYWN0b3JCaWxsTGluZSwgY2FsY3VsYXRlQ2xpZW50UkFCaWxsTGluZSB9IGZyb20gJy4uL3NlcnZpY2VzL2JpbGxpbmdTZXJ2aWNlLmpzJztcblxuY29uc3QgcHJpc21hID0gbmV3IFByaXNtYUNsaWVudCgpO1xuXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbi8vIDEuIEJJTExJTkcgU0VUVVAgRU5EUE9JTlRTXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEJpbGxpbmdTZXR1cChyZXEsIHJlcykge1xuICBjb25zdCB7IG9yZGVySWQgfSA9IHJlcS5wYXJhbXM7XG4gIHRyeSB7XG4gICAgY29uc3Qgc2V0dXAgPSBhd2FpdCBwcmlzbWEuYmlsbGluZ1NldHVwLmZpbmRVbmlxdWUoe1xuICAgICAgd2hlcmU6IHsgb3JkZXJJZCB9LFxuICAgICAgaW5jbHVkZToge1xuICAgICAgICB1bml0VHlwZVJhdGVzOiB0cnVlLFxuICAgICAgICBjb250cmFjdG9yTWlsZXN0b25lczogdHJ1ZSxcbiAgICAgICAgY2xpZW50UkFNaWxlc3RvbmVzOiB0cnVlLFxuICAgICAgICB0b3dlckNsaWVudFJhdGVzOiB7XG4gICAgICAgICAgaW5jbHVkZToge1xuICAgICAgICAgICAgYnVpbGRpbmc6IHtcbiAgICAgICAgICAgICAgc2VsZWN0OiB7IG5hbWU6IHRydWUgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgaWYgKCFzZXR1cCkge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgZXJyb3I6ICdCaWxsaW5nIHNldHVwIG5vdCBmb3VuZCBmb3IgdGhpcyBvcmRlcicgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlcy5qc29uKHNldHVwKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgZXJyb3I6ICdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3IgZ2V0dGluZyBzZXR1cCcgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHVwZGF0ZUJpbGxpbmdTZXR1cChyZXEsIHJlcykge1xuICBjb25zdCB7IG9yZGVySWQgfSA9IHJlcS5wYXJhbXM7XG4gIGNvbnN0IHtcbiAgICBjb250cmFjdG9yUmV0ZW50aW9uUGN0LFxuICAgIGNvbnRyYWN0b3JHU1RQY3QsXG4gICAgY29udHJhY3RvclREU1BjdCxcbiAgICBjbGllbnRSZXRlbnRpb25QY3QsXG4gICAgY2xpZW50R1NUUGN0LFxuICAgIGNsaWVudE90aGVyRGVkdWN0aW9uLFxuICAgIGNsaWVudE1hdEVsaWdpYmxlUGN0LFxuICAgIGNsaWVudEV4ZWNFbGlnaWJsZVBjdCxcbiAgICBjbGllbnRIYW5kb3ZlckVsaWdpYmxlUGN0LFxuICAgIGJpbGxpbmdQZXJpb2RGcm9tLFxuICAgIGJpbGxpbmdQZXJpb2RUbyxcbiAgICBiaWxsRGF0ZSxcbiAgICB1bml0VHlwZVJhdGVzLFxuICAgIGNvbnRyYWN0b3JNaWxlc3RvbmVzLFxuICAgIGNsaWVudFJBTWlsZXN0b25lcyxcbiAgICB0b3dlckNsaWVudFJhdGVzXG4gIH0gPSByZXEuYm9keTtcblxuICB0cnkge1xuICAgIGlmIChyZXEudXNlci5yb2xlICE9PSAnUk9MRV9BJykge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAzKS5qc29uKHsgZXJyb3I6ICdPbmx5IFNldHVwIHJvbGUgKEEpIGNhbiBtb2RpZnkgc2V0dXAnIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IGN1cnJlbnRTZXR1cCA9IGF3YWl0IHByaXNtYS5iaWxsaW5nU2V0dXAuZmluZFVuaXF1ZSh7XG4gICAgICB3aGVyZTogeyBvcmRlcklkIH1cbiAgICB9KTtcblxuICAgIGlmICghY3VycmVudFNldHVwKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oeyBlcnJvcjogJ0JpbGxpbmcgc2V0dXAgbm90IGZvdW5kJyB9KTtcbiAgICB9XG5cbiAgICAvLyAxLiBWYWxpZGF0ZSBNaWxlc3RvbmUgUGVyY2VudGFnZXNcbiAgICBpZiAoY29udHJhY3Rvck1pbGVzdG9uZXMpIHtcbiAgICAgIC8vIFZhbGlkYXRlIHRoYXQgY29udHJhY3RvciBtaWxlc3RvbmVzIHN1bSB0byAxMDAlIHBlciBwcm9kdWN0XG4gICAgICBjb25zdCBwcm9kdWN0R3JvdXBzID0ge307XG4gICAgICBmb3IgKGNvbnN0IG0gb2YgY29udHJhY3Rvck1pbGVzdG9uZXMpIHtcbiAgICAgICAgcHJvZHVjdEdyb3Vwc1ttLnByb2R1Y3RdID0gKHByb2R1Y3RHcm91cHNbbS5wcm9kdWN0XSB8fCAwLjApICsgcGFyc2VGbG9hdChtLnBlcmNlbnRhZ2UpO1xuICAgICAgfVxuICAgICAgZm9yIChjb25zdCBbcHJvZCwgc3VtXSBvZiBPYmplY3QuZW50cmllcyhwcm9kdWN0R3JvdXBzKSkge1xuICAgICAgICBpZiAoTWF0aC5hYnMoc3VtIC0gMTAwLjApID4gMC4wMSkge1xuICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7IGVycm9yOiBgQ29udHJhY3RvciBNaWxlc3RvbmVzIGZvciBwcm9kdWN0ICR7cHJvZH0gbXVzdCBzdW0gdG8gMTAwJS4gR290ICR7c3VtfSVgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgZ2xvYmFsTWF0ID0gY2xpZW50TWF0RWxpZ2libGVQY3QgIT09IHVuZGVmaW5lZCA/IHBhcnNlRmxvYXQoY2xpZW50TWF0RWxpZ2libGVQY3QpIDogKGN1cnJlbnRTZXR1cC5jbGllbnRNYXRFbGlnaWJsZVBjdCB8fCAwLjApO1xuICAgIGNvbnN0IGdsb2JhbEV4ZWMgPSBjbGllbnRFeGVjRWxpZ2libGVQY3QgIT09IHVuZGVmaW5lZCA/IHBhcnNlRmxvYXQoY2xpZW50RXhlY0VsaWdpYmxlUGN0KSA6IChjdXJyZW50U2V0dXAuY2xpZW50RXhlY0VsaWdpYmxlUGN0IHx8IDAuMCk7XG4gICAgY29uc3QgZ2xvYmFsSGFuZG92ZXIgPSBjbGllbnRIYW5kb3ZlckVsaWdpYmxlUGN0ICE9PSB1bmRlZmluZWQgPyBwYXJzZUZsb2F0KGNsaWVudEhhbmRvdmVyRWxpZ2libGVQY3QpIDogKGN1cnJlbnRTZXR1cC5jbGllbnRIYW5kb3ZlckVsaWdpYmxlUGN0IHx8IDAuMCk7XG5cbiAgICBjb25zdCBnbG9iYWxTdW0gPSBnbG9iYWxNYXQgKyBnbG9iYWxFeGVjICsgZ2xvYmFsSGFuZG92ZXI7XG4gICAgaWYgKE1hdGguYWJzKGdsb2JhbFN1bSAtIDEwMC4wKSA+IDAuMDEpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7IGVycm9yOiBgQ2xpZW50IEVsaWdpYmlsaXR5IHNldHRpbmdzIChNYXRlcmlhbCArIEV4ZWN1dGlvbiArIEhhbmRvdmVyKSBtdXN0IHN1bSB0byBleGFjdGx5IDEwMCUuIEdvdCAke2dsb2JhbFN1bX0lYCB9KTtcbiAgICB9XG5cbiAgICBpZiAoY2xpZW50UkFNaWxlc3RvbmVzKSB7XG4gICAgICBjb25zdCBwcm9kdWN0cyA9IFsnS2l0Y2hlbicsICdXYXJkcm9iZScsICdWYW5pdHknLCAnRG9vciddO1xuICAgICAgZm9yIChjb25zdCBwIG9mIHByb2R1Y3RzKSB7XG4gICAgICAgIGNvbnN0IG1hdFN1bSA9IGNsaWVudFJBTWlsZXN0b25lcy5maWx0ZXIobSA9PiBtLnByb2R1Y3QgPT09IHAgJiYgbS5yZWNvZ25pdGlvblR5cGUgPT09ICdNQVRFUklBTCcpLnJlZHVjZSgoc3VtLCBtKSA9PiBzdW0gKyBwYXJzZUZsb2F0KG0ucGVyY2VudGFnZSB8fCAwKSwgMC4wKTtcbiAgICAgICAgaWYgKE1hdGguYWJzKG1hdFN1bSAtIGdsb2JhbE1hdCkgPiAwLjAxKSB7XG4gICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHsgZXJyb3I6IGBDbGllbnQgTWF0ZXJpYWwgbWlsZXN0b25lcyBmb3IgcHJvZHVjdCAke3B9IG11c3Qgc3VtIHRvIGV4YWN0bHkgJHtnbG9iYWxNYXR9JS4gR290ICR7bWF0U3VtfSVgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZXhlY1N1bSA9IGNsaWVudFJBTWlsZXN0b25lcy5maWx0ZXIobSA9PiBtLnByb2R1Y3QgPT09IHAgJiYgbS5yZWNvZ25pdGlvblR5cGUgPT09ICdFWEVDVVRJT04nKS5yZWR1Y2UoKHN1bSwgbSkgPT4gc3VtICsgcGFyc2VGbG9hdChtLnBlcmNlbnRhZ2UgfHwgMCksIDAuMCk7XG4gICAgICAgIGlmIChNYXRoLmFicyhleGVjU3VtIC0gZ2xvYmFsRXhlYykgPiAwLjAxKSB7XG4gICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHsgZXJyb3I6IGBDbGllbnQgRXhlY3V0aW9uIG1pbGVzdG9uZXMgZm9yIHByb2R1Y3QgJHtwfSBtdXN0IHN1bSB0byBleGFjdGx5ICR7Z2xvYmFsRXhlY30lLiBHb3QgJHtleGVjU3VtfSVgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaGFuZG92ZXJTdW0gPSBjbGllbnRSQU1pbGVzdG9uZXMuZmlsdGVyKG0gPT4gbS5wcm9kdWN0ID09PSBwICYmIG0ucmVjb2duaXRpb25UeXBlID09PSAnSEFORE9WRVInKS5yZWR1Y2UoKHN1bSwgbSkgPT4gc3VtICsgcGFyc2VGbG9hdChtLnBlcmNlbnRhZ2UgfHwgMCksIDAuMCk7XG4gICAgICAgIGlmIChNYXRoLmFicyhoYW5kb3ZlclN1bSAtIGdsb2JhbEhhbmRvdmVyKSA+IDAuMDEpIHtcbiAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oeyBlcnJvcjogYENsaWVudCBIYW5kb3ZlciBtaWxlc3RvbmVzIGZvciBwcm9kdWN0ICR7cH0gbXVzdCBzdW0gdG8gZXhhY3RseSAke2dsb2JhbEhhbmRvdmVyfSUuIEdvdCAke2hhbmRvdmVyU3VtfSVgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgdXBkYXRlZCA9IGF3YWl0IHByaXNtYS4kdHJhbnNhY3Rpb24oYXN5bmMgKHR4KSA9PiB7XG4gICAgICAvLyBVcGRhdGUgYmFzaWMgZmllbGRzXG4gICAgICBjb25zdCBicyA9IGF3YWl0IHR4LmJpbGxpbmdTZXR1cC51cGRhdGUoe1xuICAgICAgICB3aGVyZTogeyBvcmRlcklkIH0sXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICBjb250cmFjdG9yUmV0ZW50aW9uUGN0OiBjb250cmFjdG9yUmV0ZW50aW9uUGN0ICE9PSB1bmRlZmluZWQgPyBwYXJzZUZsb2F0KGNvbnRyYWN0b3JSZXRlbnRpb25QY3QpIDogdW5kZWZpbmVkLFxuICAgICAgICAgIGNvbnRyYWN0b3JHU1RQY3Q6IGNvbnRyYWN0b3JHU1RQY3QgIT09IHVuZGVmaW5lZCA/IHBhcnNlRmxvYXQoY29udHJhY3RvckdTVFBjdCkgOiB1bmRlZmluZWQsXG4gICAgICAgICAgY29udHJhY3RvclREU1BjdDogY29udHJhY3RvclREU1BjdCAhPT0gdW5kZWZpbmVkID8gcGFyc2VGbG9hdChjb250cmFjdG9yVERTUGN0KSA6IHVuZGVmaW5lZCxcbiAgICAgICAgICBjbGllbnRSZXRlbnRpb25QY3Q6IGNsaWVudFJldGVudGlvblBjdCAhPT0gdW5kZWZpbmVkID8gcGFyc2VGbG9hdChjbGllbnRSZXRlbnRpb25QY3QpIDogdW5kZWZpbmVkLFxuICAgICAgICAgIGNsaWVudEdTVFBjdDogY2xpZW50R1NUUGN0ICE9PSB1bmRlZmluZWQgPyBwYXJzZUZsb2F0KGNsaWVudEdTVFBjdCkgOiB1bmRlZmluZWQsXG4gICAgICAgICAgY2xpZW50T3RoZXJEZWR1Y3Rpb246IGNsaWVudE90aGVyRGVkdWN0aW9uICE9PSB1bmRlZmluZWQgPyBwYXJzZUZsb2F0KGNsaWVudE90aGVyRGVkdWN0aW9uKSA6IHVuZGVmaW5lZCxcbiAgICAgICAgICBjbGllbnRNYXRFbGlnaWJsZVBjdDogY2xpZW50TWF0RWxpZ2libGVQY3QgIT09IHVuZGVmaW5lZCA/IHBhcnNlRmxvYXQoY2xpZW50TWF0RWxpZ2libGVQY3QpIDogdW5kZWZpbmVkLFxuICAgICAgICAgIGNsaWVudEV4ZWNFbGlnaWJsZVBjdDogY2xpZW50RXhlY0VsaWdpYmxlUGN0ICE9PSB1bmRlZmluZWQgPyBwYXJzZUZsb2F0KGNsaWVudEV4ZWNFbGlnaWJsZVBjdCkgOiB1bmRlZmluZWQsXG4gICAgICAgICAgY2xpZW50SGFuZG92ZXJFbGlnaWJsZVBjdDogY2xpZW50SGFuZG92ZXJFbGlnaWJsZVBjdCAhPT0gdW5kZWZpbmVkID8gcGFyc2VGbG9hdChjbGllbnRIYW5kb3ZlckVsaWdpYmxlUGN0KSA6IHVuZGVmaW5lZCxcbiAgICAgICAgICBiaWxsaW5nUGVyaW9kRnJvbTogYmlsbGluZ1BlcmlvZEZyb20gPyBuZXcgRGF0ZShiaWxsaW5nUGVyaW9kRnJvbSkgOiBudWxsLFxuICAgICAgICAgIGJpbGxpbmdQZXJpb2RUbzogYmlsbGluZ1BlcmlvZFRvID8gbmV3IERhdGUoYmlsbGluZ1BlcmlvZFRvKSA6IG51bGwsXG4gICAgICAgICAgYmlsbERhdGU6IGJpbGxEYXRlID8gbmV3IERhdGUoYmlsbERhdGUpIDogbnVsbFxuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgLy8gVXBkYXRlIFVuaXRUeXBlUmF0ZXNcbiAgICAgIGlmICh1bml0VHlwZVJhdGVzICYmIEFycmF5LmlzQXJyYXkodW5pdFR5cGVSYXRlcykpIHtcbiAgICAgICAgLy8gZGVsZXRlIGFuZCBpbnNlcnQsIG9yIHVwZGF0ZS4gTGV0J3MgZG8gc2ltcGxlIHJlY3JlYXRlIHNpbmNlIGl0J3Mgc2V0dXBcbiAgICAgICAgYXdhaXQgdHgudW5pdFR5cGVSYXRlLmRlbGV0ZU1hbnkoeyB3aGVyZTogeyBiaWxsaW5nU2V0dXBJZDogYnMuaWQgfSB9KTtcbiAgICAgICAgYXdhaXQgdHgudW5pdFR5cGVSYXRlLmNyZWF0ZU1hbnkoe1xuICAgICAgICAgIGRhdGE6IHVuaXRUeXBlUmF0ZXMubWFwKHV0ID0+ICh7XG4gICAgICAgICAgICBiaWxsaW5nU2V0dXBJZDogYnMuaWQsXG4gICAgICAgICAgICB0eXBlQ29kZTogdXQudHlwZUNvZGUsXG4gICAgICAgICAgICBwcm9kdWN0OiB1dC5wcm9kdWN0LFxuICAgICAgICAgICAgdHlwZU5hbWU6IHV0LnR5cGVOYW1lLFxuICAgICAgICAgICAgY29udHJhY3RvclJhdGU6IHBhcnNlRmxvYXQodXQuY29udHJhY3RvclJhdGUgfHwgMCksXG4gICAgICAgICAgICBjbGllbnRSYXRlOiBwYXJzZUZsb2F0KHV0LmNsaWVudFJhdGUgfHwgMCksXG4gICAgICAgICAgICBpbmNsdWRlSW5DdXJyZW50UkE6IHV0LmluY2x1ZGVJbkN1cnJlbnRSQSA/PyB0cnVlXG4gICAgICAgICAgfSkpXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICAvLyBVcGRhdGUgQ29udHJhY3Rvck1pbGVzdG9uZXNcbiAgICAgIGlmIChjb250cmFjdG9yTWlsZXN0b25lcyAmJiBBcnJheS5pc0FycmF5KGNvbnRyYWN0b3JNaWxlc3RvbmVzKSkge1xuICAgICAgICBhd2FpdCB0eC5jb250cmFjdG9yTWlsZXN0b25lLmRlbGV0ZU1hbnkoeyB3aGVyZTogeyBiaWxsaW5nU2V0dXBJZDogYnMuaWQgfSB9KTtcbiAgICAgICAgYXdhaXQgdHguY29udHJhY3Rvck1pbGVzdG9uZS5jcmVhdGVNYW55KHtcbiAgICAgICAgICBkYXRhOiBjb250cmFjdG9yTWlsZXN0b25lcy5tYXAobSA9PiAoe1xuICAgICAgICAgICAgYmlsbGluZ1NldHVwSWQ6IGJzLmlkLFxuICAgICAgICAgICAgcHJvZHVjdDogbS5wcm9kdWN0LFxuICAgICAgICAgICAgbWlsZXN0b25lTmFtZTogbS5taWxlc3RvbmVOYW1lLFxuICAgICAgICAgICAgcGVyY2VudGFnZTogcGFyc2VGbG9hdChtLnBlcmNlbnRhZ2UgfHwgMClcbiAgICAgICAgICB9KSlcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIFVwZGF0ZSBDbGllbnRSQU1pbGVzdG9uZXNcbiAgICAgIGlmIChjbGllbnRSQU1pbGVzdG9uZXMgJiYgQXJyYXkuaXNBcnJheShjbGllbnRSQU1pbGVzdG9uZXMpKSB7XG4gICAgICAgIGF3YWl0IHR4LmNsaWVudFJBTWlsZXN0b25lLmRlbGV0ZU1hbnkoeyB3aGVyZTogeyBiaWxsaW5nU2V0dXBJZDogYnMuaWQgfSB9KTtcbiAgICAgICAgYXdhaXQgdHguY2xpZW50UkFNaWxlc3RvbmUuY3JlYXRlTWFueSh7XG4gICAgICAgICAgZGF0YTogY2xpZW50UkFNaWxlc3RvbmVzLm1hcChtID0+ICh7XG4gICAgICAgICAgICBiaWxsaW5nU2V0dXBJZDogYnMuaWQsXG4gICAgICAgICAgICBwcm9kdWN0OiBtLnByb2R1Y3QsXG4gICAgICAgICAgICByZWNvZ25pdGlvblR5cGU6IG0ucmVjb2duaXRpb25UeXBlLFxuICAgICAgICAgICAgbWlsZXN0b25lTmFtZTogbS5taWxlc3RvbmVOYW1lLFxuICAgICAgICAgICAgZmllbGRLZXk6IG0uZmllbGRLZXksXG4gICAgICAgICAgICBwZXJjZW50YWdlOiBwYXJzZUZsb2F0KG0ucGVyY2VudGFnZSB8fCAwKVxuICAgICAgICAgIH0pKVxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgLy8gVXBkYXRlIFRvd2VyLXdpc2UgQ2xpZW50IENvbnRyYWN0IFJhdGVzXG4gICAgICBpZiAodG93ZXJDbGllbnRSYXRlcyAmJiBBcnJheS5pc0FycmF5KHRvd2VyQ2xpZW50UmF0ZXMpKSB7XG4gICAgICAgIGF3YWl0IHR4LnRvd2VyQ2xpZW50UmF0ZS5kZWxldGVNYW55KHsgd2hlcmU6IHsgYmlsbGluZ1NldHVwSWQ6IGJzLmlkIH0gfSk7XG4gICAgICAgIGF3YWl0IHR4LnRvd2VyQ2xpZW50UmF0ZS5jcmVhdGVNYW55KHtcbiAgICAgICAgICBkYXRhOiB0b3dlckNsaWVudFJhdGVzLm1hcCh0ciA9PiAoe1xuICAgICAgICAgICAgYmlsbGluZ1NldHVwSWQ6IGJzLmlkLFxuICAgICAgICAgICAgYnVpbGRpbmdJZDogdHIuYnVpbGRpbmdJZCxcbiAgICAgICAgICAgIGtpdGNoZW5SYXRlOiBwYXJzZUZsb2F0KHRyLmtpdGNoZW5SYXRlIHx8IDApLFxuICAgICAgICAgICAgd2FyZHJvYmVSYXRlOiBwYXJzZUZsb2F0KHRyLndhcmRyb2JlUmF0ZSB8fCAwKSxcbiAgICAgICAgICAgIHZhbml0eVJhdGU6IHBhcnNlRmxvYXQodHIudmFuaXR5UmF0ZSB8fCAwKSxcbiAgICAgICAgICAgIGRvb3JSYXRlOiBwYXJzZUZsb2F0KHRyLmRvb3JSYXRlIHx8IDApXG4gICAgICAgICAgfSkpXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gYnM7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcmVzLmpzb24oeyBzdWNjZXNzOiB0cnVlLCBzZXR1cDogdXBkYXRlZCB9KTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgY29uc29sZS5lcnJvcignVXBkYXRlIHNldHVwIGVycm9yOicsIGVycik7XG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgZXJyb3I6ICdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3IgdXBkYXRpbmcgYmlsbGluZyBzZXR1cCcgfSk7XG4gIH1cbn1cblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4vLyAyLiBDT05UUkFDVE9SIFJVTk5JTkcgQklMTFxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRDb250cmFjdG9yQmlsbChyZXEsIHJlcykge1xuICBjb25zdCB7IG9yZGVySWQgfSA9IHJlcS5wYXJhbXM7XG4gIHRyeSB7XG4gICAgY29uc3Qgc2V0dXAgPSBhd2FpdCBwcmlzbWEuYmlsbGluZ1NldHVwLmZpbmRVbmlxdWUoe1xuICAgICAgd2hlcmU6IHsgb3JkZXJJZCB9LFxuICAgICAgaW5jbHVkZTogeyB1bml0VHlwZVJhdGVzOiB0cnVlIH1cbiAgICB9KTtcblxuICAgIGlmICghc2V0dXApIHJldHVybiByZXMuc3RhdHVzKDQwNCkuanNvbih7IGVycm9yOiAnQmlsbGluZyBzZXR1cCBub3QgZm91bmQnIH0pO1xuXG4gICAgLy8gMS4gRmV0Y2ggYWxsIGFwYXJ0bWVudHMgaW4gdGhpcyBPcmRlciB0byBleHRyYWN0IHVuaXF1ZSBDb250cmFjdG9ycyBhbmQgVW5pdCBUeXBlc1xuICAgIGNvbnN0IGFwYXJ0bWVudHMgPSBhd2FpdCBwcmlzbWEuYXBhcnRtZW50LmZpbmRNYW55KHtcbiAgICAgIHdoZXJlOiB7XG4gICAgICAgIGJ1aWxkaW5nOiB7IG9yZGVySWQgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gRXh0cmFjdCB1bmlxdWUgY29udHJhY3RvcnNcbiAgICBjb25zdCBjb250cmFjdG9ycyA9IFsuLi5uZXcgU2V0KGFwYXJ0bWVudHMubWFwKGEgPT4gYS5jb250cmFjdG9yTmFtZSkuZmlsdGVyKEJvb2xlYW4pKV07XG5cbiAgICAvLyAyLiBGZXRjaCBleGlzdGluZyBjb250cmFjdG9yIGJpbGwgbGVkZ2VyIHJvd3MgZnJvbSBEQlxuICAgIGNvbnN0IHNhdmVkTGluZXMgPSBhd2FpdCBwcmlzbWEuY29udHJhY3RvckJpbGxMaW5lLmZpbmRNYW55KHtcbiAgICAgIHdoZXJlOiB7IG9yZGVySWQgfSxcbiAgICAgIGluY2x1ZGU6IHsgdW5pdFR5cGU6IHRydWUgfVxuICAgIH0pO1xuXG4gICAgLy8gMy4gRm9yIGVhY2ggdW5pcXVlIENvbnRyYWN0b3IgXHUwMEQ3IFVuaXQgVHlwZSwgY29uc3RydWN0IHRoZSBsZWRnZXIgcm93XG4gICAgY29uc3QgbGluZXMgPSBbXTtcbiAgICBmb3IgKGNvbnN0IGNvbnRyYWN0b3JOYW1lIG9mIGNvbnRyYWN0b3JzKSB7XG4gICAgICBmb3IgKGNvbnN0IHV0IG9mIHNldHVwLnVuaXRUeXBlUmF0ZXMpIHtcbiAgICAgICAgLy8gRmluZCBleGlzdGluZyBzYXZlZCByZWNvcmQgaW4gREIsIGlmIGFueVxuICAgICAgICBsZXQgc2F2ZWRMaW5lID0gc2F2ZWRMaW5lcy5maW5kKGwgPT4gXG4gICAgICAgICAgbC5jb250cmFjdG9yTmFtZS50b0xvd2VyQ2FzZSgpID09PSBjb250cmFjdG9yTmFtZS50b0xvd2VyQ2FzZSgpICYmIFxuICAgICAgICAgIGwudW5pdFR5cGVJZCA9PT0gdXQuaWRcbiAgICAgICAgKTtcblxuICAgICAgICBpZiAoIXNhdmVkTGluZSkge1xuICAgICAgICAgIHNhdmVkTGluZSA9IHtcbiAgICAgICAgICAgIGlkOiBgdGVtcF8ke2NvbnRyYWN0b3JOYW1lfV8ke3V0LmlkfWAsXG4gICAgICAgICAgICBvcmRlcklkLFxuICAgICAgICAgICAgY29udHJhY3Rvck5hbWUsXG4gICAgICAgICAgICB1bml0VHlwZUlkOiB1dC5pZCxcbiAgICAgICAgICAgIHVuaXRUeXBlOiB1dCxcbiAgICAgICAgICAgIGVsaWdpYmxlVW5pdEVxdWl2YWxlbnQ6IG51bGwsXG4gICAgICAgICAgICBwcmV2aW91c0NlcnRpZmllZDogbnVsbCxcbiAgICAgICAgICAgIG90aGVyRGVkdWN0aW9uOiBudWxsLFxuICAgICAgICAgICAgYmlsbE5vOiAnJyxcbiAgICAgICAgICAgIGJpbGxEYXRlOiBudWxsLFxuICAgICAgICAgICAgcmVtYXJrczogJydcbiAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNhdmVkTGluZS51bml0VHlwZSA9IHV0OyAvLyBhdHRhY2ggZnVsbHkgbG9hZGVkIHVuaXQgdHlwZSByYXRlc1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2FsY3VsYXRlIGF1dG8tZmllbGRzXG4gICAgICAgIGNvbnN0IGNhbGN1bGF0ZWQgPSBjYWxjdWxhdGVDb250cmFjdG9yQmlsbExpbmUoc2F2ZWRMaW5lLCBhcGFydG1lbnRzLCBzZXR1cCk7XG4gICAgICAgIGlmIChjYWxjdWxhdGVkLmFsbG9jYXRlZFVuaXRzID4gMCkge1xuICAgICAgICAgIGxpbmVzLnB1c2goY2FsY3VsYXRlZCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcmVzLmpzb24oeyBzZXR1cCwgbGluZXMgfSk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0dldCBjb250cmFjdG9yIGJpbGwgZXJyb3I6JywgZXJyKTtcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oeyBlcnJvcjogJ0ludGVybmFsIHNlcnZlciBlcnJvcicgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHVwc2VydENvbnRyYWN0b3JCaWxsTGluZXMocmVxLCByZXMpIHtcbiAgY29uc3QgeyBvcmRlcklkIH0gPSByZXEucGFyYW1zO1xuICBjb25zdCB7IGxpbmVzIH0gPSByZXEuYm9keTsgLy8gYXJyYXkgb2YgbGluZXMgdG8gc2F2ZVxuXG4gIHRyeSB7XG4gICAgaWYgKHJlcS51c2VyLnJvbGUgIT09ICdST0xFX0EnICYmIHJlcS51c2VyLnJvbGUgIT09ICdST0xFX0InKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDMpLmpzb24oeyBlcnJvcjogJ09ubHkgRXhlY3V0aW9uIHJvbGUgKEIpIG9yIEFkbWluIChBKSBjYW4gZW50ZXIgYmlsbCBsaW5lIGl0ZW1zJyB9KTtcbiAgICB9XG5cbiAgICBpZiAoIWxpbmVzIHx8ICFBcnJheS5pc0FycmF5KGxpbmVzKSkge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHsgZXJyb3I6ICdMaW5lcyBhcnJheSBpcyByZXF1aXJlZCcgfSk7XG4gICAgfVxuXG4gICAgY29uc3Qgc2F2ZWQgPSBbXTtcbiAgICBmb3IgKGNvbnN0IGxpbmUgb2YgbGluZXMpIHtcbiAgICAgIC8vIElmIGl0J3MgYSB0ZW1wb3JhcnkgY2xpZW50LWdlbmVyYXRlZCBpZCAoc3RhcnRzIHdpdGggdGVtcF8pLCBjcmVhdGUgaXRcbiAgICAgIC8vIE90aGVyd2lzZSwgdXBkYXRlIGJ5IGlkLlxuICAgICAgY29uc3QgZGF0YSA9IHtcbiAgICAgICAgb3JkZXJJZCxcbiAgICAgICAgY29udHJhY3Rvck5hbWU6IGxpbmUuY29udHJhY3Rvck5hbWUsXG4gICAgICAgIHVuaXRUeXBlSWQ6IGxpbmUudW5pdFR5cGVJZCxcbiAgICAgICAgZWxpZ2libGVVbml0RXF1aXZhbGVudDogcGFyc2VGbG9hdChsaW5lLmVsaWdpYmxlVW5pdEVxdWl2YWxlbnQgfHwgMCksXG4gICAgICAgIHByZXZpb3VzQ2VydGlmaWVkOiBwYXJzZUZsb2F0KGxpbmUucHJldmlvdXNDZXJ0aWZpZWQgfHwgMCksXG4gICAgICAgIG90aGVyRGVkdWN0aW9uOiBwYXJzZUZsb2F0KGxpbmUub3RoZXJEZWR1Y3Rpb24gfHwgMCksXG4gICAgICAgIGJpbGxObzogbGluZS5iaWxsTm8gfHwgJycsXG4gICAgICAgIGJpbGxEYXRlOiBsaW5lLmJpbGxEYXRlID8gbmV3IERhdGUobGluZS5iaWxsRGF0ZSkgOiBudWxsLFxuICAgICAgICByZW1hcmtzOiBsaW5lLnJlbWFya3MgfHwgJydcbiAgICAgIH07XG5cbiAgICAgIGlmIChsaW5lLmlkICYmICFsaW5lLmlkLnN0YXJ0c1dpdGgoJ3RlbXBfJykpIHtcbiAgICAgICAgY29uc3QgaXRlbSA9IGF3YWl0IHByaXNtYS5jb250cmFjdG9yQmlsbExpbmUudXBkYXRlKHtcbiAgICAgICAgICB3aGVyZTogeyBpZDogbGluZS5pZCB9LFxuICAgICAgICAgIGRhdGFcbiAgICAgICAgfSk7XG4gICAgICAgIHNhdmVkLnB1c2goaXRlbSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBDaGVjayBpZiB0aGVyZSBpcyBhbiBleGlzdGluZyBsaW5lIGluIERCIGFscmVhZHlcbiAgICAgICAgY29uc3QgZXhpc3RpbmcgPSBhd2FpdCBwcmlzbWEuY29udHJhY3RvckJpbGxMaW5lLmZpbmRGaXJzdCh7XG4gICAgICAgICAgd2hlcmU6IHtcbiAgICAgICAgICAgIG9yZGVySWQsXG4gICAgICAgICAgICBjb250cmFjdG9yTmFtZTogbGluZS5jb250cmFjdG9yTmFtZSxcbiAgICAgICAgICAgIHVuaXRUeXBlSWQ6IGxpbmUudW5pdFR5cGVJZFxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKGV4aXN0aW5nKSB7XG4gICAgICAgICAgY29uc3QgaXRlbSA9IGF3YWl0IHByaXNtYS5jb250cmFjdG9yQmlsbExpbmUudXBkYXRlKHtcbiAgICAgICAgICAgIHdoZXJlOiB7IGlkOiBleGlzdGluZy5pZCB9LFxuICAgICAgICAgICAgZGF0YVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHNhdmVkLnB1c2goaXRlbSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc3QgaXRlbSA9IGF3YWl0IHByaXNtYS5jb250cmFjdG9yQmlsbExpbmUuY3JlYXRlKHtcbiAgICAgICAgICAgIGRhdGFcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBzYXZlZC5wdXNoKGl0ZW0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlcy5qc29uKHsgc3VjY2VzczogdHJ1ZSwgY291bnQ6IHNhdmVkLmxlbmd0aCB9KTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgY29uc29sZS5lcnJvcignVXBzZXJ0IGNvbnRyYWN0b3IgbGluZXMgZXJyb3I6JywgZXJyKTtcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oeyBlcnJvcjogJ0ludGVybmFsIHNlcnZlciBlcnJvciBzYXZpbmcgY29udHJhY3RvciBiaWxscycgfSk7XG4gIH1cbn1cblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4vLyAzLiBDTElFTlQgUkEgQklMTFxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRDbGllbnRSQUJpbGwocmVxLCByZXMpIHtcbiAgY29uc3QgeyBvcmRlcklkIH0gPSByZXEucGFyYW1zO1xuICB0cnkge1xuICAgIGNvbnN0IHNldHVwID0gYXdhaXQgcHJpc21hLmJpbGxpbmdTZXR1cC5maW5kVW5pcXVlKHtcbiAgICAgIHdoZXJlOiB7IG9yZGVySWQgfSxcbiAgICAgIGluY2x1ZGU6IHsgXG4gICAgICAgIHVuaXRUeXBlUmF0ZXM6IHRydWUsXG4gICAgICAgIGNsaWVudFJBTWlsZXN0b25lczogdHJ1ZVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgaWYgKCFzZXR1cCkgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgZXJyb3I6ICdCaWxsaW5nIHNldHVwIG5vdCBmb3VuZCcgfSk7XG5cbiAgICAvLyBGZXRjaCBidWlsZGluZ3MgKFRvd2VycykgYW5kIGFwYXJ0bWVudHMgaW4gdGhpcyBvcmRlclxuICAgIGNvbnN0IGJ1aWxkaW5ncyA9IGF3YWl0IHByaXNtYS5idWlsZGluZy5maW5kTWFueSh7XG4gICAgICB3aGVyZTogeyBvcmRlcklkIH1cbiAgICB9KTtcblxuICAgIGNvbnN0IGFwYXJ0bWVudHMgPSBhd2FpdCBwcmlzbWEuYXBhcnRtZW50LmZpbmRNYW55KHtcbiAgICAgIHdoZXJlOiB7XG4gICAgICAgIGJ1aWxkaW5nOiB7IG9yZGVySWQgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gRmV0Y2ggb3ZlcnJpZGVzXG4gICAgY29uc3Qgb3ZlcnJpZGVzID0gYXdhaXQgcHJpc21hLnRvd2VyQ2xpZW50UmF0ZS5maW5kTWFueSh7XG4gICAgICB3aGVyZTogeyBiaWxsaW5nU2V0dXBJZDogc2V0dXAuaWQgfVxuICAgIH0pO1xuXG4gICAgLy8gRmV0Y2ggc2F2ZWQgY2xpZW50IFJBIGJpbGwgbGluZXNcbiAgICBjb25zdCBzYXZlZExpbmVzID0gYXdhaXQgcHJpc21hLmNsaWVudFJBQmlsbExpbmUuZmluZE1hbnkoe1xuICAgICAgd2hlcmU6IHsgb3JkZXJJZCB9LFxuICAgICAgaW5jbHVkZTogeyB1bml0VHlwZTogdHJ1ZSB9XG4gICAgfSk7XG5cbiAgICAvLyBHZW5lcmF0ZSBwcmUtc2VlZGVkIGxpbmVzIHBlciBUb3dlciBcdTAwRDcgVW5pdCBUeXBlXG4gICAgY29uc3QgbGluZXMgPSBbXTtcbiAgICBmb3IgKGNvbnN0IGJ1aWxkaW5nIG9mIGJ1aWxkaW5ncykge1xuICAgICAgZm9yIChjb25zdCB1dCBvZiBzZXR1cC51bml0VHlwZVJhdGVzKSB7XG4gICAgICAgIGxldCBzYXZlZExpbmUgPSBzYXZlZExpbmVzLmZpbmQobCA9PiBcbiAgICAgICAgICBsLmJ1aWxkaW5nSWQgPT09IGJ1aWxkaW5nLmlkICYmIGwudW5pdFR5cGVJZCA9PT0gdXQuaWRcbiAgICAgICAgKTtcblxuICAgICAgICBpZiAoIXNhdmVkTGluZSkge1xuICAgICAgICAgIHNhdmVkTGluZSA9IHtcbiAgICAgICAgICAgIGlkOiBgdGVtcF8ke2J1aWxkaW5nLmlkfV8ke3V0LmlkfWAsXG4gICAgICAgICAgICBvcmRlcklkLFxuICAgICAgICAgICAgYnVpbGRpbmdJZDogYnVpbGRpbmcuaWQsXG4gICAgICAgICAgICBidWlsZGluZ05hbWU6IGJ1aWxkaW5nLm5hbWUsXG4gICAgICAgICAgICB1bml0VHlwZUlkOiB1dC5pZCxcbiAgICAgICAgICAgIHVuaXRUeXBlOiB1dCxcbiAgICAgICAgICAgIGluY2x1ZGVJbkN1cnJlbnRSQTogdXQuaW5jbHVkZUluQ3VycmVudFJBLFxuICAgICAgICAgICAgcHJldmlvdXNDZXJ0aWZpZWQ6IG51bGwsXG4gICAgICAgICAgICBvdGhlckRlZHVjdGlvbjogbnVsbCxcbiAgICAgICAgICAgIHJhQmlsbE5vOiAnJyxcbiAgICAgICAgICAgIHJhQmlsbERhdGU6IG51bGwsXG4gICAgICAgICAgICByZW1hcmtzOiAnJ1xuICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2F2ZWRMaW5lLnVuaXRUeXBlID0gdXQ7XG4gICAgICAgICAgc2F2ZWRMaW5lLmJ1aWxkaW5nTmFtZSA9IGJ1aWxkaW5nLm5hbWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDYWxjdWxhdGUgZWxpZ2liaWxpdHkgcGFyYW1ldGVycyB1c2luZyBidWlsZGluZyBzdGF0dXMgYW5kIG1pbGVzdG9uZXNcbiAgICAgICAgY29uc3QgY2FsY3VsYXRlZCA9IGNhbGN1bGF0ZUNsaWVudFJBQmlsbExpbmUoc2F2ZWRMaW5lLCBhcGFydG1lbnRzLCBzZXR1cCwgb3ZlcnJpZGVzKTtcbiAgICAgICAgLy8gT25seSBpbmNsdWRlIHJvd3Mgd2hlcmUgd2UgYWN0dWFsbHkgaGF2ZSBhbGxvY2F0ZWQgdW5pdHMgb2YgdGhpcyB0eXBlIGluIHRoaXMgdG93ZXJcbiAgICAgICAgaWYgKGNhbGN1bGF0ZWQudW5pdHNDb3VudCA+IDApIHtcbiAgICAgICAgICBsaW5lcy5wdXNoKGNhbGN1bGF0ZWQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlcy5qc29uKHsgc2V0dXAsIGxpbmVzIH0pO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKCdHZXQgY2xpZW50IFJBIGJpbGwgZXJyb3I6JywgZXJyKTtcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oeyBlcnJvcjogJ0ludGVybmFsIHNlcnZlciBlcnJvcicgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHVwc2VydENsaWVudFJBQmlsbExpbmVzKHJlcSwgcmVzKSB7XG4gIGNvbnN0IHsgb3JkZXJJZCB9ID0gcmVxLnBhcmFtcztcbiAgY29uc3QgeyBsaW5lcyB9ID0gcmVxLmJvZHk7IC8vIGFycmF5IG9mIGxpbmVzIHRvIHNhdmVcblxuICB0cnkge1xuICAgIGlmIChyZXEudXNlci5yb2xlICE9PSAnUk9MRV9BJyAmJiByZXEudXNlci5yb2xlICE9PSAnUk9MRV9CJykge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAzKS5qc29uKHsgZXJyb3I6ICdPbmx5IEV4ZWN1dGlvbiByb2xlIChCKSBvciBBZG1pbiAoQSkgY2FuIGVudGVyIGJpbGwgbGluZSBpdGVtcycgfSk7XG4gICAgfVxuXG4gICAgaWYgKCFsaW5lcyB8fCAhQXJyYXkuaXNBcnJheShsaW5lcykpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7IGVycm9yOiAnTGluZXMgYXJyYXkgaXMgcmVxdWlyZWQnIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IHNhdmVkID0gW107XG4gICAgZm9yIChjb25zdCBsaW5lIG9mIGxpbmVzKSB7XG4gICAgICBjb25zdCBkYXRhID0ge1xuICAgICAgICBvcmRlcklkLFxuICAgICAgICBidWlsZGluZ0lkOiBsaW5lLmJ1aWxkaW5nSWQsXG4gICAgICAgIHVuaXRUeXBlSWQ6IGxpbmUudW5pdFR5cGVJZCxcbiAgICAgICAgaW5jbHVkZUluQ3VycmVudFJBOiBsaW5lLmluY2x1ZGVJbkN1cnJlbnRSQSA/PyB0cnVlLFxuICAgICAgICBwcmV2aW91c0NlcnRpZmllZDogcGFyc2VGbG9hdChsaW5lLnByZXZpb3VzQ2VydGlmaWVkIHx8IDApLFxuICAgICAgICBvdGhlckRlZHVjdGlvbjogcGFyc2VGbG9hdChsaW5lLm90aGVyRGVkdWN0aW9uIHx8IDApLFxuICAgICAgICByYUJpbGxObzogbGluZS5yYUJpbGxObyB8fCAnJyxcbiAgICAgICAgcmFCaWxsRGF0ZTogbGluZS5yYUJpbGxEYXRlID8gbmV3IERhdGUobGluZS5yYUJpbGxEYXRlKSA6IG51bGwsXG4gICAgICAgIHJlbWFya3M6IGxpbmUucmVtYXJrcyB8fCAnJ1xuICAgICAgfTtcblxuICAgICAgaWYgKGxpbmUuaWQgJiYgIWxpbmUuaWQuc3RhcnRzV2l0aCgndGVtcF8nKSkge1xuICAgICAgICBjb25zdCBpdGVtID0gYXdhaXQgcHJpc21hLmNsaWVudFJBQmlsbExpbmUudXBkYXRlKHtcbiAgICAgICAgICB3aGVyZTogeyBpZDogbGluZS5pZCB9LFxuICAgICAgICAgIGRhdGFcbiAgICAgICAgfSk7XG4gICAgICAgIHNhdmVkLnB1c2goaXRlbSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBVbmlxdWUgY29uc3RyYWludCBjaGVja1xuICAgICAgICBjb25zdCBleGlzdGluZyA9IGF3YWl0IHByaXNtYS5jbGllbnRSQUJpbGxMaW5lLmZpbmRGaXJzdCh7XG4gICAgICAgICAgd2hlcmU6IHtcbiAgICAgICAgICAgIG9yZGVySWQsXG4gICAgICAgICAgICBidWlsZGluZ0lkOiBsaW5lLmJ1aWxkaW5nSWQsXG4gICAgICAgICAgICB1bml0VHlwZUlkOiBsaW5lLnVuaXRUeXBlSWRcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChleGlzdGluZykge1xuICAgICAgICAgIGNvbnN0IGl0ZW0gPSBhd2FpdCBwcmlzbWEuY2xpZW50UkFCaWxsTGluZS51cGRhdGUoe1xuICAgICAgICAgICAgd2hlcmU6IHsgaWQ6IGV4aXN0aW5nLmlkIH0sXG4gICAgICAgICAgICBkYXRhXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgc2F2ZWQucHVzaChpdGVtKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCBpdGVtID0gYXdhaXQgcHJpc21hLmNsaWVudFJBQmlsbExpbmUuY3JlYXRlKHtcbiAgICAgICAgICAgIGRhdGFcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBzYXZlZC5wdXNoKGl0ZW0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlcy5qc29uKHsgc3VjY2VzczogdHJ1ZSwgY291bnQ6IHNhdmVkLmxlbmd0aCB9KTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgY29uc29sZS5lcnJvcignVXBzZXJ0IGNsaWVudCBsaW5lcyBlcnJvcjonLCBlcnIpO1xuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7IGVycm9yOiAnSW50ZXJuYWwgc2VydmVyIGVycm9yIHNhdmluZyBjbGllbnQgUkEgYmlsbHMnIH0pO1xuICB9XG59XG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuLy8gNC4gQklMTElORyBEQVNIQk9BUkRcbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0QmlsbGluZ0Rhc2hib2FyZChyZXEsIHJlcykge1xuICBjb25zdCB7IG9yZGVySWQgfSA9IHJlcS5wYXJhbXM7XG4gIHRyeSB7XG4gICAgY29uc3Qgc2V0dXAgPSBhd2FpdCBwcmlzbWEuYmlsbGluZ1NldHVwLmZpbmRVbmlxdWUoe1xuICAgICAgd2hlcmU6IHsgb3JkZXJJZCB9LFxuICAgICAgaW5jbHVkZTogeyBcbiAgICAgICAgdW5pdFR5cGVSYXRlczogdHJ1ZSxcbiAgICAgICAgY2xpZW50UkFNaWxlc3RvbmVzOiB0cnVlXG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBpZiAoIXNldHVwKSByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oeyBlcnJvcjogJ0JpbGxpbmcgc2V0dXAgbm90IGZvdW5kJyB9KTtcblxuICAgIC8vIEZldGNoIGFwYXJ0bWVudHNcbiAgICBjb25zdCBhcGFydG1lbnRzID0gYXdhaXQgcHJpc21hLmFwYXJ0bWVudC5maW5kTWFueSh7XG4gICAgICB3aGVyZTogeyBidWlsZGluZzogeyBvcmRlcklkIH0gfVxuICAgIH0pO1xuXG4gICAgLy8gRmV0Y2ggb3ZlcnJpZGVzXG4gICAgY29uc3Qgb3ZlcnJpZGVzID0gYXdhaXQgcHJpc21hLnRvd2VyQ2xpZW50UmF0ZS5maW5kTWFueSh7XG4gICAgICB3aGVyZTogeyBiaWxsaW5nU2V0dXBJZDogc2V0dXAuaWQgfVxuICAgIH0pO1xuXG4gICAgLy8gMS4gR2V0IGFsbCBjYWxjdWxhdGVkIENvbnRyYWN0b3IgbGluZXNcbiAgICBjb25zdCBzYXZlZENvbnRyYWN0b3JMaW5lcyA9IGF3YWl0IHByaXNtYS5jb250cmFjdG9yQmlsbExpbmUuZmluZE1hbnkoe1xuICAgICAgd2hlcmU6IHsgb3JkZXJJZCB9LFxuICAgICAgaW5jbHVkZTogeyB1bml0VHlwZTogdHJ1ZSB9XG4gICAgfSk7XG4gICAgY29uc3QgY29udHJhY3RvcnMgPSBbLi4ubmV3IFNldChhcGFydG1lbnRzLm1hcChhID0+IGEuY29udHJhY3RvcikuZmlsdGVyKEJvb2xlYW4pKV07XG4gICAgY29uc3QgY29udHJhY3RvckJpbGxMaW5lcyA9IFtdO1xuICAgIGZvciAoY29uc3QgY05hbWUgb2YgY29udHJhY3RvcnMpIHtcbiAgICAgIGZvciAoY29uc3QgdXQgb2Ygc2V0dXAudW5pdFR5cGVSYXRlcykge1xuICAgICAgICBsZXQgbGluZSA9IHNhdmVkQ29udHJhY3RvckxpbmVzLmZpbmQobCA9PiBcbiAgICAgICAgICBsLmNvbnRyYWN0b3JOYW1lLnRvTG93ZXJDYXNlKCkgPT09IGNOYW1lLnRvTG93ZXJDYXNlKCkgJiYgbC51bml0VHlwZUlkID09PSB1dC5pZFxuICAgICAgICApO1xuICAgICAgICBpZiAoIWxpbmUpIHtcbiAgICAgICAgICBsaW5lID0ge1xuICAgICAgICAgICAgY29udHJhY3Rvck5hbWU6IGNOYW1lLFxuICAgICAgICAgICAgdW5pdFR5cGVJZDogdXQuaWQsXG4gICAgICAgICAgICB1bml0VHlwZTogdXQsXG4gICAgICAgICAgICBlbGlnaWJsZVVuaXRFcXVpdmFsZW50OiBudWxsLFxuICAgICAgICAgICAgcHJldmlvdXNDZXJ0aWZpZWQ6IG51bGwsXG4gICAgICAgICAgICBvdGhlckRlZHVjdGlvbjogbnVsbFxuICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbGluZS51bml0VHlwZSA9IHV0O1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNhbGMgPSBjYWxjdWxhdGVDb250cmFjdG9yQmlsbExpbmUobGluZSwgYXBhcnRtZW50cywgc2V0dXApO1xuICAgICAgICBpZiAoY2FsYy5hbGxvY2F0ZWRVbml0cyA+IDApIHtcbiAgICAgICAgICBjb250cmFjdG9yQmlsbExpbmVzLnB1c2goY2FsYyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyAyLiBHZXQgYWxsIGNhbGN1bGF0ZWQgQ2xpZW50IFJBIGxpbmVzXG4gICAgY29uc3QgYnVpbGRpbmdzID0gYXdhaXQgcHJpc21hLmJ1aWxkaW5nLmZpbmRNYW55KHsgd2hlcmU6IHsgb3JkZXJJZCB9IH0pO1xuICAgIGNvbnN0IHNhdmVkQ2xpZW50TGluZXMgPSBhd2FpdCBwcmlzbWEuY2xpZW50UkFCaWxsTGluZS5maW5kTWFueSh7XG4gICAgICB3aGVyZTogeyBvcmRlcklkIH0sXG4gICAgICBpbmNsdWRlOiB7IHVuaXRUeXBlOiB0cnVlIH1cbiAgICB9KTtcbiAgICBjb25zdCBjbGllbnRSQUJpbGxMaW5lcyA9IFtdO1xuICAgIGZvciAoY29uc3QgYnVpbGRpbmcgb2YgYnVpbGRpbmdzKSB7XG4gICAgICBmb3IgKGNvbnN0IHV0IG9mIHNldHVwLnVuaXRUeXBlUmF0ZXMpIHtcbiAgICAgICAgbGV0IGxpbmUgPSBzYXZlZENsaWVudExpbmVzLmZpbmQobCA9PiBcbiAgICAgICAgICBsLmJ1aWxkaW5nSWQgPT09IGJ1aWxkaW5nLmlkICYmIGwudW5pdFR5cGVJZCA9PT0gdXQuaWRcbiAgICAgICAgKTtcbiAgICAgICAgaWYgKCFsaW5lKSB7XG4gICAgICAgICAgbGluZSA9IHtcbiAgICAgICAgICAgIGJ1aWxkaW5nSWQ6IGJ1aWxkaW5nLmlkLFxuICAgICAgICAgICAgYnVpbGRpbmdOYW1lOiBidWlsZGluZy5uYW1lLFxuICAgICAgICAgICAgdW5pdFR5cGVJZDogdXQuaWQsXG4gICAgICAgICAgICB1bml0VHlwZTogdXQsXG4gICAgICAgICAgICBpbmNsdWRlSW5DdXJyZW50UkE6IHV0LmluY2x1ZGVJbkN1cnJlbnRSQSxcbiAgICAgICAgICAgIHByZXZpb3VzQ2VydGlmaWVkOiBudWxsLFxuICAgICAgICAgICAgb3RoZXJEZWR1Y3Rpb246IG51bGxcbiAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxpbmUudW5pdFR5cGUgPSB1dDtcbiAgICAgICAgICBsaW5lLmJ1aWxkaW5nTmFtZSA9IGJ1aWxkaW5nLm5hbWU7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY2FsYyA9IGNhbGN1bGF0ZUNsaWVudFJBQmlsbExpbmUobGluZSwgYXBhcnRtZW50cywgc2V0dXAsIG92ZXJyaWRlcyk7XG4gICAgICAgIGlmIChjYWxjLnVuaXRzQ291bnQgPiAwKSB7XG4gICAgICAgICAgY2xpZW50UkFCaWxsTGluZXMucHVzaChjYWxjKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEtQSSBSb2xsdXBzXG4gICAgY29uc3QgY29udHJhY3RvcldPVmFsdWUgPSBjb250cmFjdG9yQmlsbExpbmVzLnJlZHVjZSgoc3VtLCBsKSA9PiBzdW0gKyAobC53b1ZhbHVlIHx8IDApLCAwKTtcbiAgICBjb25zdCBjb250cmFjdG9yQ3VtdWxhdGl2ZUVsaWdpYmxlID0gY29udHJhY3RvckJpbGxMaW5lcy5yZWR1Y2UoKHN1bSwgbCkgPT4gc3VtICsgKGwuY3VtdWxhdGl2ZUVsaWdpYmxlIHx8IDApLCAwKTtcbiAgICBjb25zdCBjb250cmFjdG9yTmV0UGF5YWJsZSA9IGNvbnRyYWN0b3JCaWxsTGluZXMucmVkdWNlKChzdW0sIGwpID0+IHN1bSArIChsLm5ldFBheWFibGUgfHwgMCksIDApO1xuXG4gICAgY29uc3QgY2xpZW50Q29udHJhY3RWYWx1ZSA9IGNsaWVudFJBQmlsbExpbmVzLnJlZHVjZSgoc3VtLCBsKSA9PiBzdW0gKyAobC5jb250cmFjdFZhbHVlIHx8IDApLCAwKTtcbiAgICBjb25zdCBjbGllbnRDdW11bGF0aXZlRWxpZ2libGUgPSBjbGllbnRSQUJpbGxMaW5lcy5yZWR1Y2UoKHN1bSwgbCkgPT4gc3VtICsgKGwuY3VtdWxhdGl2ZUVsaWdpYmxlIHx8IDApLCAwKTtcbiAgICBjb25zdCBjbGllbnRDdXJyZW50R3Jvc3NTZWxlY3RlZFJBID0gY2xpZW50UkFCaWxsTGluZXNcbiAgICAgIC5maWx0ZXIobCA9PiBsLmluY2x1ZGVJbkN1cnJlbnRSQSA9PT0gdHJ1ZSlcbiAgICAgIC5yZWR1Y2UoKHN1bSwgbCkgPT4gc3VtICsgKGwuY3VycmVudEdyb3NzIHx8IDApLCAwKTsgLy8gQ3VycmVudCBHcm9zcyBSQVxuXG4gICAgY29uc3QgYmlsbGluZ1N1cnBsdXMgPSBjbGllbnRDdXJyZW50R3Jvc3NTZWxlY3RlZFJBIC0gY29udHJhY3Rvck5ldFBheWFibGU7XG4gICAgY29uc3QgY2xpZW50RWxpZ2liaWxpdHlQY3QgPSBjbGllbnRDb250cmFjdFZhbHVlID4gMCA/IChjbGllbnRDdW11bGF0aXZlRWxpZ2libGUgLyBjbGllbnRDb250cmFjdFZhbHVlKSA6IDAuMDtcblxuICAgIC8vIFRhYmxlIDEgXHUyMDE0IGJ5IFVuaXQgVHlwZSAocm9sbCB1cCBmcm9tIENsaWVudCBSQSBsaW5lcyBhY3Jvc3MgYWxsIHRvd2VycylcbiAgICBjb25zdCB1bml0VHlwZU1hcCA9IHt9O1xuICAgIGZvciAoY29uc3QgbCBvZiBjbGllbnRSQUJpbGxMaW5lcykge1xuICAgICAgY29uc3QgdXQgPSBsLnVuaXRUeXBlO1xuICAgICAgaWYgKCF1bml0VHlwZU1hcFt1dC50eXBlQ29kZV0pIHtcbiAgICAgICAgdW5pdFR5cGVNYXBbdXQudHlwZUNvZGVdID0ge1xuICAgICAgICAgIHR5cGVDb2RlOiB1dC50eXBlQ29kZSxcbiAgICAgICAgICBwcm9kdWN0OiB1dC5wcm9kdWN0LFxuICAgICAgICAgIHVuaXRzOiAwLFxuICAgICAgICAgIGNvbnRyYWN0VmFsdWU6IDAuMCxcbiAgICAgICAgICBtYXRlcmlhbEVsaWdpYmxlQW10OiAwLjAsXG4gICAgICAgICAgZXhlY3V0aW9uRWxpZ2libGVBbXQ6IDAuMCxcbiAgICAgICAgICBoYW5kb3ZlckVsaWdpYmxlQW10OiAwLjBcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIHVuaXRUeXBlTWFwW3V0LnR5cGVDb2RlXS51bml0cyArPSBsLnVuaXRzQ291bnQgfHwgMDtcbiAgICAgIHVuaXRUeXBlTWFwW3V0LnR5cGVDb2RlXS5jb250cmFjdFZhbHVlICs9IGwuY29udHJhY3RWYWx1ZSB8fCAwLjA7XG4gICAgICB1bml0VHlwZU1hcFt1dC50eXBlQ29kZV0ubWF0ZXJpYWxFbGlnaWJsZUFtdCArPSBsLm1hdGVyaWFsRWxpZ2libGVBbXQgfHwgMC4wO1xuICAgICAgdW5pdFR5cGVNYXBbdXQudHlwZUNvZGVdLmV4ZWN1dGlvbkVsaWdpYmxlQW10ICs9IGwuZXhlY3V0aW9uRWxpZ2libGVBbXQgfHwgMC4wO1xuICAgICAgdW5pdFR5cGVNYXBbdXQudHlwZUNvZGVdLmhhbmRvdmVyRWxpZ2libGVBbXQgKz0gbC5oYW5kb3ZlckVsaWdpYmxlQW10IHx8IDAuMDtcbiAgICB9XG4gICAgY29uc3QgdW5pdFR5cGVUYWJsZSA9IE9iamVjdC52YWx1ZXModW5pdFR5cGVNYXApLm1hcChyb3cgPT4gKHtcbiAgICAgIC4uLnJvdyxcbiAgICAgIGNvbnRyYWN0VmFsdWU6IE1hdGgucm91bmQocm93LmNvbnRyYWN0VmFsdWUpLFxuICAgICAgbWF0ZXJpYWxFbGlnaWJsZUFtdDogTWF0aC5yb3VuZChyb3cubWF0ZXJpYWxFbGlnaWJsZUFtdCksXG4gICAgICBleGVjdXRpb25FbGlnaWJsZUFtdDogTWF0aC5yb3VuZChyb3cuZXhlY3V0aW9uRWxpZ2libGVBbXQpLFxuICAgICAgaGFuZG92ZXJFbGlnaWJsZUFtdDogTWF0aC5yb3VuZChyb3cuaGFuZG92ZXJFbGlnaWJsZUFtdClcbiAgICB9KSk7XG5cbiAgICAvLyBUYWJsZSAyIFx1MjAxNCBieSBDb250cmFjdG9yIChwdWxsIHN0cmFpZ2h0IGZyb20gQ29udHJhY3RvciBsaW5lcylcbiAgICBjb25zdCBjb250cmFjdG9yVGFibGVNYXAgPSB7fTtcbiAgICBmb3IgKGNvbnN0IGwgb2YgY29udHJhY3RvckJpbGxMaW5lcykge1xuICAgICAgaWYgKGwuYWxsb2NhdGVkVW5pdHMgPT09IDApIGNvbnRpbnVlOyAvLyBza2lwIHVuYWxsb2NhdGVkIGNvbmZpZ3VyYXRpb25zXG4gICAgICBjb25zdCBrZXkgPSBgJHtsLmNvbnRyYWN0b3JOYW1lfV8ke2wudW5pdFR5cGUudHlwZUNvZGV9YDtcbiAgICAgIGNvbnRyYWN0b3JUYWJsZU1hcFtrZXldID0ge1xuICAgICAgICBjb250cmFjdG9yOiBsLmNvbnRyYWN0b3JOYW1lLFxuICAgICAgICB1bml0VHlwZTogbC51bml0VHlwZS50eXBlQ29kZSxcbiAgICAgICAgZWxpZ2liaWxpdHlQY3Q6IE1hdGgucm91bmQobC5lbGlnaWJpbGl0eVBjdCAqIDEwMDApIC8gMTAsIC8vIGRpc3BsYXkgYXMgJVxuICAgICAgICBuZXRQYXlhYmxlOiBNYXRoLnJvdW5kKGwubmV0UGF5YWJsZSlcbiAgICAgIH07XG4gICAgfVxuICAgIGNvbnN0IGNvbnRyYWN0b3JUYWJsZSA9IE9iamVjdC52YWx1ZXMoY29udHJhY3RvclRhYmxlTWFwKTtcblxuICAgIHJldHVybiByZXMuanNvbih7XG4gICAgICBzdW1tYXJ5OiB7XG4gICAgICAgIGNvbnRyYWN0b3JXT1ZhbHVlOiBNYXRoLnJvdW5kKGNvbnRyYWN0b3JXT1ZhbHVlKSxcbiAgICAgICAgY29udHJhY3RvckN1bXVsYXRpdmVFbGlnaWJsZTogTWF0aC5yb3VuZChjb250cmFjdG9yQ3VtdWxhdGl2ZUVsaWdpYmxlKSxcbiAgICAgICAgY29udHJhY3Rvck5ldFBheWFibGU6IE1hdGgucm91bmQoY29udHJhY3Rvck5ldFBheWFibGUpLFxuICAgICAgICBjbGllbnRDb250cmFjdFZhbHVlOiBNYXRoLnJvdW5kKGNsaWVudENvbnRyYWN0VmFsdWUpLFxuICAgICAgICBjbGllbnRDdW11bGF0aXZlRWxpZ2libGU6IE1hdGgucm91bmQoY2xpZW50Q3VtdWxhdGl2ZUVsaWdpYmxlKSxcbiAgICAgICAgY2xpZW50Q3VycmVudEdyb3NzU2VsZWN0ZWRSQTogTWF0aC5yb3VuZChjbGllbnRDdXJyZW50R3Jvc3NTZWxlY3RlZFJBKSxcbiAgICAgICAgYmlsbGluZ1N1cnBsdXM6IE1hdGgucm91bmQoYmlsbGluZ1N1cnBsdXMpLFxuICAgICAgICBjbGllbnRFbGlnaWJpbGl0eVBjdDogTWF0aC5yb3VuZChjbGllbnRFbGlnaWJpbGl0eVBjdCAqIDEwMDApIC8gMTAwMFxuICAgICAgfSxcbiAgICAgIHVuaXRUeXBlVGFibGUsXG4gICAgICBjb250cmFjdG9yVGFibGVcbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgY29uc29sZS5lcnJvcignR2V0IGJpbGxpbmcgZGFzaGJvYXJkIGVycm9yOicsIGVycik7XG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgZXJyb3I6ICdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3IgY2FsY3VsYXRpbmcgYmlsbGluZyBkYXNoYm9hcmQnIH0pO1xuICB9XG59XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGhwXFxcXERvd25sb2Fkc1xcXFxEaW8gR3JhY2VlXFxcXERpbyBHcmFjZWVcXFxcYmFja2VuZFxcXFxzcmNcXFxcY29udHJvbGxlcnNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGhwXFxcXERvd25sb2Fkc1xcXFxEaW8gR3JhY2VlXFxcXERpbyBHcmFjZWVcXFxcYmFja2VuZFxcXFxzcmNcXFxcY29udHJvbGxlcnNcXFxcZXhwb3J0Q29udHJvbGxlci5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvaHAvRG93bmxvYWRzL0RpbyUyMEdyYWNlZS9EaW8lMjBHcmFjZWUvYmFja2VuZC9zcmMvY29udHJvbGxlcnMvZXhwb3J0Q29udHJvbGxlci5qc1wiO2ltcG9ydCB7IFByaXNtYUNsaWVudCB9IGZyb20gJ0BwcmlzbWEvY2xpZW50JztcbmltcG9ydCBFeGNlbEpTIGZyb20gJ2V4Y2VsanMnO1xuXG5jb25zdCBwcmlzbWEgPSBuZXcgUHJpc21hQ2xpZW50KCk7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBleHBvcnRCdWlsZGluZ0dyaWQocmVxLCByZXMpIHtcbiAgY29uc3QgeyBidWlsZGluZ0lkIH0gPSByZXEucGFyYW1zO1xuXG4gIHRyeSB7XG4gICAgY29uc3QgYnVpbGRpbmcgPSBhd2FpdCBwcmlzbWEuYnVpbGRpbmcuZmluZFVuaXF1ZSh7XG4gICAgICB3aGVyZTogeyBpZDogYnVpbGRpbmdJZCB9LFxuICAgICAgaW5jbHVkZToge1xuICAgICAgICBvcmRlcjoge1xuICAgICAgICAgIHNlbGVjdDogeyBvcmRlck51bWJlcjogdHJ1ZSB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGlmICghYnVpbGRpbmcpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwNCkuanNvbih7IGVycm9yOiAnQnVpbGRpbmcgbm90IGZvdW5kJyB9KTtcbiAgICB9XG5cbiAgICBjb25zdCBhcGFydG1lbnRzID0gYXdhaXQgcHJpc21hLmFwYXJ0bWVudC5maW5kTWFueSh7XG4gICAgICB3aGVyZTogeyBidWlsZGluZ0lkIH0sXG4gICAgICBvcmRlckJ5OiB7IHNyTm86ICdhc2MnIH1cbiAgICB9KTtcblxuICAgIGNvbnN0IHdvcmtib29rID0gbmV3IEV4Y2VsSlMuV29ya2Jvb2soKTtcbiAgICBjb25zdCB3b3Jrc2hlZXQgPSB3b3JrYm9vay5hZGRXb3Jrc2hlZXQoYnVpbGRpbmcubmFtZSk7XG5cbiAgICAvLyBTdHlsZSB2YXJpYWJsZXNcbiAgICBjb25zdCBoZWFkZXJGaWxsID0ge1xuICAgICAgdHlwZTogJ3BhdHRlcm4nLFxuICAgICAgcGF0dGVybjogJ3NvbGlkJyxcbiAgICAgIGZnQ29sb3I6IHsgYXJnYjogJ0ZGRTBFMEUwJyB9XG4gICAgfTtcbiAgICBjb25zdCBncm91cEZpbGxzID0ge1xuICAgICAgZ3JvdXAxOiB7IHR5cGU6ICdwYXR0ZXJuJywgcGF0dGVybjogJ3NvbGlkJywgZmdDb2xvcjogeyBhcmdiOiAnRkZEMkVCRDQnIH0gfSwgLy8gTGlnaHQgZ3JlZW5cbiAgICAgIGdyb3VwMjogeyB0eXBlOiAncGF0dGVybicsIHBhdHRlcm46ICdzb2xpZCcsIGZnQ29sb3I6IHsgYXJnYjogJ0ZGRThGMEZFJyB9IH0sIC8vIExpZ2h0IGJsdWVcbiAgICAgIGdyb3VwMzogeyB0eXBlOiAncGF0dGVybicsIHBhdHRlcm46ICdzb2xpZCcsIGZnQ29sb3I6IHsgYXJnYjogJ0ZGRkNFOEU2JyB9IH0sIC8vIExpZ2h0IHJlZFxuICAgICAgZ3JvdXA0OiB7IHR5cGU6ICdwYXR0ZXJuJywgcGF0dGVybjogJ3NvbGlkJywgZmdDb2xvcjogeyBhcmdiOiAnRkZGRUVGQzMnIH0gfSwgLy8gTGlnaHQgeWVsbG93XG4gICAgICBncm91cDU6IHsgdHlwZTogJ3BhdHRlcm4nLCBwYXR0ZXJuOiAnc29saWQnLCBmZ0NvbG9yOiB7IGFyZ2I6ICdGRkU2QzJGRicgfSB9LCAvLyBMaWdodCBwdXJwbGVcbiAgICAgIGdyb3VwNjogeyB0eXBlOiAncGF0dGVybicsIHBhdHRlcm46ICdzb2xpZCcsIGZnQ29sb3I6IHsgYXJnYjogJ0ZGRTRGMkU3JyB9IH0sIC8vIE1pbnRcbiAgICAgIGdyb3VwNzogeyB0eXBlOiAncGF0dGVybicsIHBhdHRlcm46ICdzb2xpZCcsIGZnQ29sb3I6IHsgYXJnYjogJ0ZGRkZFQkVFJyB9IH0sIC8vIFJvc2VcbiAgICAgIGdyb3VwODogeyB0eXBlOiAncGF0dGVybicsIHBhdHRlcm46ICdzb2xpZCcsIGZnQ29sb3I6IHsgYXJnYjogJ0ZGRjNFNUY1JyB9IH0gIC8vIExhdmVuZGVyXG4gICAgfTtcblxuICAgIC8vIENvbHVtbnMgc3RydWN0dXJlXG4gICAgY29uc3QgY29sdW1ucyA9IFtcbiAgICAgIC8vIEdyb3VwIDFcbiAgICAgIHsgaGVhZGVyOiAnU3IgTm8nLCBrZXk6ICdzck5vJywgd2lkdGg6IDgsIGdyb3VwOiAnZ3JvdXAxJyB9LFxuICAgICAgeyBoZWFkZXI6ICdBcGFydG1lbnQgTm8nLCBrZXk6ICdhcGFydG1lbnRObycsIHdpZHRoOiAxNSwgZ3JvdXA6ICdncm91cDEnIH0sXG4gICAgICB7IGhlYWRlcjogJ0Zsb29yJywga2V5OiAnZmxvb3InLCB3aWR0aDogMTAsIGdyb3VwOiAnZ3JvdXAxJyB9LFxuICAgICAgeyBoZWFkZXI6ICdQcmlvcml0eScsIGtleTogJ3ByaW9yaXR5Jywgd2lkdGg6IDEyLCBncm91cDogJ2dyb3VwMScgfSxcbiAgICAgIHsgaGVhZGVyOiAnS2l0Y2hlbiBRdHknLCBrZXk6ICdraXRjaGVuUXR5Jywgd2lkdGg6IDEyLCBncm91cDogJ2dyb3VwMScgfSxcbiAgICAgIHsgaGVhZGVyOiAnV2FyZHJvYmUgUXR5Jywga2V5OiAnd2FyZHJvYmVRdHknLCB3aWR0aDogMTQsIGdyb3VwOiAnZ3JvdXAxJyB9LFxuICAgICAgeyBoZWFkZXI6ICdWYW5pdHkgUXR5Jywga2V5OiAndmFuaXR5UXR5Jywgd2lkdGg6IDEyLCBncm91cDogJ2dyb3VwMScgfSxcbiAgICAgIHsgaGVhZGVyOiAnRG9vciBRdHknLCBrZXk6ICdkb29yUXR5Jywgd2lkdGg6IDEyLCBncm91cDogJ2dyb3VwMScgfSxcblxuICAgICAgLy8gR3JvdXAgMlxuICAgICAgeyBoZWFkZXI6ICdLaXQgTG93ZXIgSW53Jywga2V5OiAna2l0Y2hlbkxvd2VyQ2FyY2Fzc0lud2FyZCcsIHdpZHRoOiAxNCwgZ3JvdXA6ICdncm91cDInIH0sXG4gICAgICB7IGhlYWRlcjogJ0tpdCBVcHBlciBJbncnLCBrZXk6ICdraXRjaGVuVXBwZXJDYXJjYXNzSW53YXJkJywgd2lkdGg6IDE0LCBncm91cDogJ2dyb3VwMicgfSxcbiAgICAgIHsgaGVhZGVyOiAnS2l0IFN0b25lIEludycsIGtleTogJ2tpdGNoZW5TdG9uZUlud2FyZCcsIHdpZHRoOiAxNCwgZ3JvdXA6ICdncm91cDInIH0sXG4gICAgICB7IGhlYWRlcjogJ0tpdCBTaHV0dGVycyBJbncnLCBrZXk6ICdraXRjaGVuU2h1dHRlcklud2FyZCcsIHdpZHRoOiAxNSwgZ3JvdXA6ICdncm91cDInIH0sXG4gICAgICB7IGhlYWRlcjogJ0tpdCBIYXJkd2FyZSBJbncnLCBrZXk6ICdraXRjaGVuSGFyZHdhcmVJbndhcmQnLCB3aWR0aDogMTUsIGdyb3VwOiAnZ3JvdXAyJyB9LFxuICAgICAgeyBoZWFkZXI6ICdLaXQgQXBwbGlhbmNlcyBJbncnLCBrZXk6ICdraXRjaGVuQXBwbGlhbmNlSW53YXJkJywgd2lkdGg6IDE2LCBncm91cDogJ2dyb3VwMicgfSxcbiAgICAgIHsgaGVhZGVyOiAnV2FyZCBDYWJpbmV0cyBJbncnLCBrZXk6ICd3YXJkcm9iZUNhYmluZXRJbndhcmQnLCB3aWR0aDogMTYsIGdyb3VwOiAnZ3JvdXAyJyB9LFxuICAgICAgeyBoZWFkZXI6ICdXYXJkIFNodXR0ZXIgSGR3IEludycsIGtleTogJ3dhcmRyb2JlU2h1dHRlckhhcmR3YXJlSW53YXJkJywgd2lkdGg6IDIwLCBncm91cDogJ2dyb3VwMicgfSxcbiAgICAgIHsgaGVhZGVyOiAnVmFuIENhYmluZXRzIEludycsIGtleTogJ3Zhbml0eUNhYmluZXRJbndhcmQnLCB3aWR0aDogMTYsIGdyb3VwOiAnZ3JvdXAyJyB9LFxuICAgICAgeyBoZWFkZXI6ICdWYW4gU2h1dHRlciBIZHcgSW53Jywga2V5OiAndmFuaXR5U2h1dHRlckhhcmR3YXJlSW53YXJkJywgd2lkdGg6IDIwLCBncm91cDogJ2dyb3VwMicgfSxcbiAgICAgIHsgaGVhZGVyOiAnRG9vciAmIEhhciBJbncnLCBrZXk6ICdkb29yRnJhbWVIYXJkd2FyZUlud2FyZCcsIHdpZHRoOiAxNiwgZ3JvdXA6ICdncm91cDInIH0sXG5cbiAgICAgIC8vIEdyb3VwIDNcbiAgICAgIHsgaGVhZGVyOiAnS2l0IExvd2VyIEluc3QnLCBrZXk6ICdraXRjaGVuTG93ZXJDYXJjYXNzSW5zdGFsbGVkJywgd2lkdGg6IDE0LCBncm91cDogJ2dyb3VwMycgfSxcbiAgICAgIHsgaGVhZGVyOiAnS2l0IFVwcGVyIEluc3QnLCBrZXk6ICdraXRjaGVuVXBwZXJDYXJjYXNzSW5zdGFsbGVkJywgd2lkdGg6IDE0LCBncm91cDogJ2dyb3VwMycgfSxcbiAgICAgIHsgaGVhZGVyOiAnS2l0IFN0b25lIEluc3QnLCBrZXk6ICdraXRjaGVuU3RvbmVJbnN0YWxsZWQnLCB3aWR0aDogMTQsIGdyb3VwOiAnZ3JvdXAzJyB9LFxuICAgICAgeyBoZWFkZXI6ICdLaXQgU2h1dHRlcnMgSGR3IEluc3QnLCBrZXk6ICdraXRjaGVuU2h1dHRlckhhcmR3YXJlSW5zdGFsbGVkJywgd2lkdGg6IDIwLCBncm91cDogJ2dyb3VwMycgfSxcbiAgICAgIHsgaGVhZGVyOiAnS2l0IEFwcGxpYW5jZXMgSW5zdCcsIGtleTogJ2tpdGNoZW5BcHBsaWFuY2VJbnN0YWxsZWQnLCB3aWR0aDogMTgsIGdyb3VwOiAnZ3JvdXAzJyB9LFxuICAgICAgeyBoZWFkZXI6ICdLaXQgSGFuZGVkIE92ZXInLCBrZXk6ICdraXRjaGVuSGFuZGVkT3ZlcicsIHdpZHRoOiAxNiwgZ3JvdXA6ICdncm91cDMnIH0sXG4gICAgICB7IGhlYWRlcjogJ1dhcmQgQ2FiaW5ldHMgSW5zdCcsIGtleTogJ3dhcmRyb2JlQ2FiaW5ldEluc3RhbGxlZCcsIHdpZHRoOiAxOCwgZ3JvdXA6ICdncm91cDMnIH0sXG4gICAgICB7IGhlYWRlcjogJ1dhcmQgU2h1dHRlciBIZHcgSW5zdCcsIGtleTogJ3dhcmRyb2JlU2h1dHRlckhhcmR3YXJlSW5zdGFsbGVkJywgd2lkdGg6IDIyLCBncm91cDogJ2dyb3VwMycgfSxcbiAgICAgIHsgaGVhZGVyOiAnV2FyZCBIYW5kZWQgT3ZlcicsIGtleTogJ3dhcmRyb2JlSGFuZGVkT3ZlcicsIHdpZHRoOiAxOCwgZ3JvdXA6ICdncm91cDMnIH0sXG4gICAgICB7IGhlYWRlcjogJ1ZhbiBDYWJpbmV0cyBJbnN0Jywga2V5OiAndmFuaXR5Q2FiaW5ldEluc3RhbGxlZCcsIHdpZHRoOiAxOCwgZ3JvdXA6ICdncm91cDMnIH0sXG4gICAgICB7IGhlYWRlcjogJ1ZhbiBTaHV0dGVyIEhkdyBJbnN0Jywga2V5OiAndmFuaXR5U2h1dHRlckhhcmR3YXJlSW5zdGFsbGVkJywgd2lkdGg6IDIyLCBncm91cDogJ2dyb3VwMycgfSxcbiAgICAgIHsgaGVhZGVyOiAnVmFuIEhhbmRlZCBPdmVyJywga2V5OiAndmFuaXR5SGFuZGVkT3ZlcicsIHdpZHRoOiAxOCwgZ3JvdXA6ICdncm91cDMnIH0sXG4gICAgICB7IGhlYWRlcjogJ0Rvb3IgJiBIYXIgSW5zdCcsIGtleTogJ2Rvb3JGcmFtZUhhcmR3YXJlSW5zdGFsbGVkJywgd2lkdGg6IDE4LCBncm91cDogJ2dyb3VwMycgfSxcbiAgICAgIHsgaGVhZGVyOiAnRG9vciBIYW5kZWQgT3ZlcicsIGtleTogJ2Rvb3JIYW5kZWRPdmVyJywgd2lkdGg6IDE4LCBncm91cDogJ2dyb3VwMycgfSxcblxuICAgICAgLy8gR3JvdXAgNFxuICAgICAgeyBoZWFkZXI6ICdQbGFubmVkIFN0YXJ0Jywga2V5OiAncGxhbm5lZFN0YXJ0Jywgd2lkdGg6IDE1LCBncm91cDogJ2dyb3VwNCcgfSxcbiAgICAgIHsgaGVhZGVyOiAnUGxhbm5lZCBDb21wJywga2V5OiAncGxhbm5lZENvbXBsZXRpb24nLCB3aWR0aDogMTUsIGdyb3VwOiAnZ3JvdXA0JyB9LFxuICAgICAgeyBoZWFkZXI6ICdBY3R1YWwgU3RhcnQnLCBrZXk6ICdhY3R1YWxTdGFydCcsIHdpZHRoOiAxNSwgZ3JvdXA6ICdncm91cDQnIH0sXG4gICAgICB7IGhlYWRlcjogJ0FjdHVhbCBDb21wJywga2V5OiAnYWN0dWFsQ29tcGxldGlvbicsIHdpZHRoOiAxNSwgZ3JvdXA6ICdncm91cDQnIH0sXG4gICAgICB7IGhlYWRlcjogJ1Jlc3BvbnNpYmxlIEVuZycsIGtleTogJ3Jlc3BvbnNpYmxlRW5naW5lZXInLCB3aWR0aDogMTgsIGdyb3VwOiAnZ3JvdXA0JyB9LFxuICAgICAgeyBoZWFkZXI6ICdDb250cmFjdG9yJywga2V5OiAnY29udHJhY3RvcicsIHdpZHRoOiAxNSwgZ3JvdXA6ICdncm91cDQnIH0sXG4gICAgICB7IGhlYWRlcjogJ0RlbGF5IFJlYXNvbicsIGtleTogJ2RlbGF5UmVhc29uJywgd2lkdGg6IDIwLCBncm91cDogJ2dyb3VwNCcgfSxcbiAgICAgIHsgaGVhZGVyOiAnUmVtYXJrcycsIGtleTogJ3JlbWFya3MnLCB3aWR0aDogMjUsIGdyb3VwOiAnZ3JvdXA0JyB9LFxuXG4gICAgICAvLyBHcm91cCA1XG4gICAgICB7IGhlYWRlcjogJ01hdCBJbndhcmQgJScsIGtleTogJ21hdGVyaWFsSW53YXJkUGN0Jywgd2lkdGg6IDE1LCBncm91cDogJ2dyb3VwNScgfSxcbiAgICAgIHsgaGVhZGVyOiAnS2l0IENvbXAgJScsIGtleTogJ2tpdGNoZW5Db21wbGV0aW9uUGN0Jywgd2lkdGg6IDEyLCBncm91cDogJ2dyb3VwNScgfSxcbiAgICAgIHsgaGVhZGVyOiAnV2FyZCBDb21wICUnLCBrZXk6ICd3YXJkcm9iZUNvbXBsZXRpb25QY3QnLCB3aWR0aDogMTQsIGdyb3VwOiAnZ3JvdXA1JyB9LFxuICAgICAgeyBoZWFkZXI6ICdWYW4gQ29tcCAlJywga2V5OiAndmFuaXR5Q29tcGxldGlvblBjdCcsIHdpZHRoOiAxMiwgZ3JvdXA6ICdncm91cDUnIH0sXG4gICAgICB7IGhlYWRlcjogJ0Rvb3IgQ29tcCAlJywga2V5OiAnZG9vckNvbXBsZXRpb25QY3QnLCB3aWR0aDogMTIsIGdyb3VwOiAnZ3JvdXA1JyB9LFxuICAgICAgeyBoZWFkZXI6ICdPdmVyYWxsIENvbXAgJScsIGtleTogJ292ZXJhbGxDb21wbGV0aW9uUGN0Jywgd2lkdGg6IDE1LCBncm91cDogJ2dyb3VwNScgfSxcbiAgICAgIHsgaGVhZGVyOiAnQXB0IFN0YXR1cycsIGtleTogJ2FwYXJ0bWVudFN0YXR1cycsIHdpZHRoOiAxOCwgZ3JvdXA6ICdncm91cDUnIH0sXG4gICAgICB7IGhlYWRlcjogJ0RlbGF5IERheXMnLCBrZXk6ICdkZWxheURheXMnLCB3aWR0aDogMTIsIGdyb3VwOiAnZ3JvdXA1JyB9LFxuICAgICAgeyBoZWFkZXI6ICdIZWFsdGgnLCBrZXk6ICdoZWFsdGgnLCB3aWR0aDogMTIsIGdyb3VwOiAnZ3JvdXA1JyB9LFxuXG4gICAgICAvLyBHcm91cCA2XG4gICAgICB7IGhlYWRlcjogJ0tpdCBRQzogU2NyZXdzJywga2V5OiAna2l0Y2hlblFDX1Zpc2libGVTY3Jld3MnLCB3aWR0aDogMTYsIGdyb3VwOiAnZ3JvdXA2JyB9LFxuICAgICAgeyBoZWFkZXI6ICdLaXQgUUM6IENoaXBzJywga2V5OiAna2l0Y2hlblFDX0NoaXBwaW5nJywgd2lkdGg6IDE2LCBncm91cDogJ2dyb3VwNicgfSxcbiAgICAgIHsgaGVhZGVyOiAnS2l0IFFDOiBGaWxsZXInLCBrZXk6ICdraXRjaGVuUUNfRmlsbGVyTWlzc2luZycsIHdpZHRoOiAxNiwgZ3JvdXA6ICdncm91cDYnIH0sXG4gICAgICB7IGhlYWRlcjogJ0tpdCBRQzogU2NyYXRjaGVzJywga2V5OiAna2l0Y2hlblFDX1NjcmF0Y2hlcycsIHdpZHRoOiAxNiwgZ3JvdXA6ICdncm91cDYnIH0sXG4gICAgICB7IGhlYWRlcjogJ0tpdCBRQzogRHJhd2VycycsIGtleTogJ2tpdGNoZW5RQ19EcmF3ZXJzRnVuY3Rpb24nLCB3aWR0aDogMTYsIGdyb3VwOiAnZ3JvdXA2JyB9LFxuICAgICAgeyBoZWFkZXI6ICdLaXQgUUM6IEN1dGxlcnknLCBrZXk6ICdraXRjaGVuUUNfQ3V0bGVyeVRyYXknLCB3aWR0aDogMTYsIGdyb3VwOiAnZ3JvdXA2JyB9LFxuICAgICAgeyBoZWFkZXI6ICdLaXQgUUM6IERyYWluZXInLCBrZXk6ICdraXRjaGVuUUNfRGlzaERyYWluZXInLCB3aWR0aDogMTYsIGdyb3VwOiAnZ3JvdXA2JyB9LFxuXG4gICAgICB7IGhlYWRlcjogJ1dhcmQgUUM6IFNjcmV3cycsIGtleTogJ3dhcmRyb2JlUUNfVmlzaWJsZVNjcmV3cycsIHdpZHRoOiAxNiwgZ3JvdXA6ICdncm91cDYnIH0sXG4gICAgICB7IGhlYWRlcjogJ1dhcmQgUUM6IENoaXBzJywga2V5OiAnd2FyZHJvYmVRQ19DaGlwcGluZycsIHdpZHRoOiAxNiwgZ3JvdXA6ICdncm91cDYnIH0sXG4gICAgICB7IGhlYWRlcjogJ1dhcmQgUUM6IEZpbGxlcicsIGtleTogJ3dhcmRyb2JlUUNfRmlsbGVyTWlzc2luZycsIHdpZHRoOiAxNiwgZ3JvdXA6ICdncm91cDYnIH0sXG4gICAgICB7IGhlYWRlcjogJ1dhcmQgUUM6IFNjcmF0Y2hlcycsIGtleTogJ3dhcmRyb2JlUUNfU2NyYXRjaGVzJywgd2lkdGg6IDE2LCBncm91cDogJ2dyb3VwNicgfSxcbiAgICAgIHsgaGVhZGVyOiAnV2FyZCBRQzogRHJhd2VycycsIGtleTogJ3dhcmRyb2JlUUNfRHJhd2Vyc0Z1bmN0aW9uJywgd2lkdGg6IDE2LCBncm91cDogJ2dyb3VwNicgfSxcblxuICAgICAgeyBoZWFkZXI6ICdWYW4gUUM6IFNjcmV3cycsIGtleTogJ3Zhbml0eVFDX1Zpc2libGVTY3Jld3MnLCB3aWR0aDogMTYsIGdyb3VwOiAnZ3JvdXA2JyB9LFxuICAgICAgeyBoZWFkZXI6ICdWYW4gUUM6IENoaXBzJywga2V5OiAndmFuaXR5UUNfQ2hpcHBpbmcnLCB3aWR0aDogMTYsIGdyb3VwOiAnZ3JvdXA2JyB9LFxuICAgICAgeyBoZWFkZXI6ICdWYW4gUUM6IEZpbGxlcicsIGtleTogJ3Zhbml0eVFDX0ZpbGxlck1pc3NpbmcnLCB3aWR0aDogMTYsIGdyb3VwOiAnZ3JvdXA2JyB9LFxuICAgICAgeyBoZWFkZXI6ICdWYW4gUUM6IFNjcmF0Y2hlcycsIGtleTogJ3Zhbml0eVFDX1NjcmF0Y2hlcycsIHdpZHRoOiAxNiwgZ3JvdXA6ICdncm91cDYnIH0sXG4gICAgICB7IGhlYWRlcjogJ1ZhbiBRQzogRHJhd2VycycsIGtleTogJ3Zhbml0eVFDX0RyYXdlcnNGdW5jdGlvbicsIHdpZHRoOiAxNiwgZ3JvdXA6ICdncm91cDYnIH0sXG5cbiAgICAgIHsgaGVhZGVyOiAnRG9vciBRQzogQ2hpcHMnLCBrZXk6ICdkb29yUUNfQ2hpcHBpbmcnLCB3aWR0aDogMTYsIGdyb3VwOiAnZ3JvdXA2JyB9LFxuICAgICAgeyBoZWFkZXI6ICdEb29yIFFDOiBBbGlnbicsIGtleTogJ2Rvb3JRQ19BbGlnbm1lbnQnLCB3aWR0aDogMTYsIGdyb3VwOiAnZ3JvdXA2JyB9LFxuXG4gICAgICAvLyBHcm91cCA3XG4gICAgICB7IGhlYWRlcjogJ0tpdCBRQyBHYXRlJywga2V5OiAna2l0Y2hlblFDR2F0ZScsIHdpZHRoOiAxNCwgZ3JvdXA6ICdncm91cDcnIH0sXG4gICAgICB7IGhlYWRlcjogJ1dhcmQgUUMgR2F0ZScsIGtleTogJ3dhcmRyb2JlUUNHYXRlJywgd2lkdGg6IDE1LCBncm91cDogJ2dyb3VwNycgfSxcbiAgICAgIHsgaGVhZGVyOiAnVmFuIFFDIEdhdGUnLCBrZXk6ICd2YW5pdHlRQ0dhdGUnLCB3aWR0aDogMTQsIGdyb3VwOiAnZ3JvdXA3JyB9LFxuICAgICAgeyBoZWFkZXI6ICdEb29yIFFDIEdhdGUnLCBrZXk6ICdkb29yUUNHYXRlJywgd2lkdGg6IDE0LCBncm91cDogJ2dyb3VwNycgfSxcbiAgICAgIHsgaGVhZGVyOiAnSGFuZG92ZXIgU3RhdHVzJywga2V5OiAnaGFuZG92ZXJBcHByb3ZhbFN0YXR1cycsIHdpZHRoOiAyMiwgZ3JvdXA6ICdncm91cDcnIH0sXG5cbiAgICAgIC8vIEdyb3VwIDhcbiAgICAgIHsgaGVhZGVyOiAnS2l0IFR5cGUnLCBrZXk6ICdraXRjaGVuVHlwZScsIHdpZHRoOiAxMiwgZ3JvdXA6ICdncm91cDgnIH0sXG4gICAgICB7IGhlYWRlcjogJ1dhcmQgVHlwZScsIGtleTogJ3dhcmRyb2JlVHlwZScsIHdpZHRoOiAxMiwgZ3JvdXA6ICdncm91cDgnIH0sXG4gICAgICB7IGhlYWRlcjogJ1ZhbiBUeXBlJywga2V5OiAndmFuaXR5VHlwZScsIHdpZHRoOiAxMiwgZ3JvdXA6ICdncm91cDgnIH0sXG4gICAgICB7IGhlYWRlcjogJ0Rvb3IgVHlwZScsIGtleTogJ2Rvb3JUeXBlJywgd2lkdGg6IDEyLCBncm91cDogJ2dyb3VwOCcgfVxuICAgIF07XG5cbiAgICB3b3Jrc2hlZXQuY29sdW1ucyA9IGNvbHVtbnMubWFwKGMgPT4gKHtcbiAgICAgIGhlYWRlcjogYy5oZWFkZXIsXG4gICAgICBrZXk6IGMua2V5LFxuICAgICAgd2lkdGg6IGMud2lkdGhcbiAgICB9KSk7XG5cbiAgICAvLyBBcHBseSBoZWFkZXIgZ3JvdXAgc3R5bGluZ1xuICAgIGNvbnN0IGhlYWRlclJvdyA9IHdvcmtzaGVldC5nZXRSb3coMSk7XG4gICAgaGVhZGVyUm93LmhlaWdodCA9IDMwO1xuXG4gICAgY29sdW1ucy5mb3JFYWNoKChjb2wsIGlkeCkgPT4ge1xuICAgICAgY29uc3QgY2VsbCA9IGhlYWRlclJvdy5nZXRDZWxsKGlkeCArIDEpO1xuICAgICAgY2VsbC5maWxsID0gZ3JvdXBGaWxsc1tjb2wuZ3JvdXBdO1xuICAgICAgY2VsbC5mb250ID0geyBib2xkOiB0cnVlLCBuYW1lOiAnQ2FsaWJyaScsIHNpemU6IDExIH07XG4gICAgICBjZWxsLmFsaWdubWVudCA9IHsgdmVydGljYWw6ICdtaWRkbGUnLCBob3Jpem9udGFsOiAnY2VudGVyJywgd3JhcFRleHQ6IHRydWUgfTtcbiAgICAgIGNlbGwuYm9yZGVyID0ge1xuICAgICAgICB0b3A6IHsgc3R5bGU6ICd0aGluJyB9LFxuICAgICAgICBsZWZ0OiB7IHN0eWxlOiAndGhpbicgfSxcbiAgICAgICAgYm90dG9tOiB7IHN0eWxlOiAnbWVkaXVtJyB9LFxuICAgICAgICByaWdodDogeyBzdHlsZTogJ3RoaW4nIH1cbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICAvLyBBZGQgcm93c1xuICAgIGFwYXJ0bWVudHMuZm9yRWFjaChhcHQgPT4ge1xuICAgICAgY29uc3Qgcm93RGF0YSA9IHt9O1xuICAgICAgY29sdW1ucy5mb3JFYWNoKGNvbCA9PiB7XG4gICAgICAgIGxldCB2YWwgPSBhcHRbY29sLmtleV07XG5cbiAgICAgICAgLy8gRm9ybWF0IERhdGUgZmllbGRzXG4gICAgICAgIGlmICh2YWwgaW5zdGFuY2VvZiBEYXRlKSB7XG4gICAgICAgICAgdmFsID0gdmFsLnRvSVNPU3RyaW5nKCkuc3BsaXQoJ1QnKVswXTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEZvcm1hdCBQZXJjZW50YWdlcyBmb3IgZGlzcGxheVxuICAgICAgICBpZiAoY29sLmtleS5lbmRzV2l0aCgnUGN0JykpIHtcbiAgICAgICAgICB2YWwgPSBgJHsodmFsICogMTAwKS50b0ZpeGVkKDEpfSVgO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRm9ybWF0IE11bHRpLVR5cGVzIGZvciBXYXJkcm9iZSBhbmQgVmFuaXR5XG4gICAgICAgIGlmICgoY29sLmtleSA9PT0gJ3dhcmRyb2JlVHlwZScgfHwgY29sLmtleSA9PT0gJ3Zhbml0eVR5cGUnKSAmJiB0eXBlb2YgdmFsID09PSAnc3RyaW5nJyAmJiB2YWwuc3RhcnRzV2l0aCgnWycpKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGxpc3QgPSBKU09OLnBhcnNlKHZhbCk7XG4gICAgICAgICAgICB2YWwgPSBsaXN0Lm1hcChpdGVtID0+IGAke2l0ZW0udHlwZX0gKCR7aXRlbS5xdHl9KWApLmpvaW4oJywgJyk7XG4gICAgICAgICAgfSBjYXRjaCAoZSkgeyB9XG4gICAgICAgIH1cblxuICAgICAgICByb3dEYXRhW2NvbC5rZXldID0gdmFsICE9PSBudWxsID8gdmFsIDogJyc7XG4gICAgICB9KTtcblxuICAgICAgY29uc3Qgcm93ID0gd29ya3NoZWV0LmFkZFJvdyhyb3dEYXRhKTtcbiAgICAgIHJvdy5oZWlnaHQgPSAyMDtcblxuICAgICAgLy8gQ2VudGVyIHZhbHVlcyBmb3IgbnVtZXJpYyBvciBzdGF0dXMgZmllbGRzXG4gICAgICBjb2x1bW5zLmZvckVhY2goKGNvbCwgaWR4KSA9PiB7XG4gICAgICAgIGNvbnN0IGNlbGwgPSByb3cuZ2V0Q2VsbChpZHggKyAxKTtcbiAgICAgICAgY2VsbC5hbGlnbm1lbnQgPSB7IHZlcnRpY2FsOiAnbWlkZGxlJywgaG9yaXpvbnRhbDogJ2xlZnQnIH07XG4gICAgICAgIGlmICh0eXBlb2YgY2VsbC52YWx1ZSA9PT0gJ251bWJlcicgfHwgY29sLmtleS5lbmRzV2l0aCgnUGN0JykgfHwgY29sLmtleSA9PT0gJ3NyTm8nKSB7XG4gICAgICAgICAgY2VsbC5hbGlnbm1lbnQgPSB7IHZlcnRpY2FsOiAnbWlkZGxlJywgaG9yaXpvbnRhbDogJ2NlbnRlcicgfTtcbiAgICAgICAgfVxuICAgICAgICBjZWxsLmJvcmRlciA9IHtcbiAgICAgICAgICB0b3A6IHsgc3R5bGU6ICd0aGluJyB9LFxuICAgICAgICAgIGxlZnQ6IHsgc3R5bGU6ICd0aGluJyB9LFxuICAgICAgICAgIGJvdHRvbTogeyBzdHlsZTogJ3RoaW4nIH0sXG4gICAgICAgICAgcmlnaHQ6IHsgc3R5bGU6ICd0aGluJyB9XG4gICAgICAgIH07XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIC8vIFNldCByZXNwb25zZSBoZWFkZXJzXG4gICAgcmVzLnNldEhlYWRlcihcbiAgICAgICdDb250ZW50LVR5cGUnLFxuICAgICAgJ2FwcGxpY2F0aW9uL3ZuZC5vcGVueG1sZm9ybWF0cy1vZmZpY2Vkb2N1bWVudC5zcHJlYWRzaGVldG1sLnNoZWV0J1xuICAgICk7XG4gICAgcmVzLnNldEhlYWRlcihcbiAgICAgICdDb250ZW50LURpc3Bvc2l0aW9uJyxcbiAgICAgIGBhdHRhY2htZW50OyBmaWxlbmFtZT1HcmlkXyR7YnVpbGRpbmcubmFtZS5yZXBsYWNlKC9cXHMrL2csICdfJyl9Lnhsc3hgXG4gICAgKTtcblxuICAgIGF3YWl0IHdvcmtib29rLnhsc3gud3JpdGUocmVzKTtcbiAgICByZXMuZW5kKCk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0V4cG9ydCBFeGNlbCBlcnJvcjonLCBlcnIpO1xuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7IGVycm9yOiAnSW50ZXJuYWwgc2VydmVyIGVycm9yIGV4cG9ydGluZyBidWlsZGluZyBkYXRhJyB9KTtcbiAgfVxufVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxocFxcXFxEb3dubG9hZHNcXFxcRGlvIEdyYWNlZVxcXFxEaW8gR3JhY2VlXFxcXGJhY2tlbmRcXFxcc3JjXFxcXGNvbnRyb2xsZXJzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxocFxcXFxEb3dubG9hZHNcXFxcRGlvIEdyYWNlZVxcXFxEaW8gR3JhY2VlXFxcXGJhY2tlbmRcXFxcc3JjXFxcXGNvbnRyb2xsZXJzXFxcXGFuYWx5dGljc0NvbnRyb2xsZXIuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL2hwL0Rvd25sb2Fkcy9EaW8lMjBHcmFjZWUvRGlvJTIwR3JhY2VlL2JhY2tlbmQvc3JjL2NvbnRyb2xsZXJzL2FuYWx5dGljc0NvbnRyb2xsZXIuanNcIjtpbXBvcnQgeyBQcmlzbWFDbGllbnQgfSBmcm9tICdAcHJpc21hL2NsaWVudCc7XG5cbmNvbnN0IHByaXNtYSA9IG5ldyBQcmlzbWFDbGllbnQoKTtcblxuLy8gUmV1c2FibGUgU3RhZ2UgQW5hbHlzaXMgY2hlY2tsaXN0IHN0cnVjdHVyZXNcbmNvbnN0IG1hdGVyaWFsSXRlbXMgPSBbXG4gIHsgbGFiZWw6IFwiS2l0Y2hlbiBMb3dlciBDYXJjYXNzIElud2FyZFwiLCBrZXk6IFwia2l0Y2hlbkxvd2VyQ2FyY2Fzc0lud2FyZFwiLCBwcm9kdWN0OiBcImtpdGNoZW5cIiwgcXR5S2V5OiBcImtpdGNoZW5RdHlcIiB9LFxuICB7IGxhYmVsOiBcIktpdGNoZW4gVXBwZXIgQ2FyY2FzcyBJbndhcmRcIiwga2V5OiBcImtpdGNoZW5VcHBlckNhcmNhc3NJbndhcmRcIiwgcHJvZHVjdDogXCJraXRjaGVuXCIsIHF0eUtleTogXCJraXRjaGVuUXR5XCIgfSxcbiAgeyBsYWJlbDogXCJLaXRjaGVuIFN0b25lIElud2FyZFwiLCBrZXk6IFwia2l0Y2hlblN0b25lSW53YXJkXCIsIHByb2R1Y3Q6IFwia2l0Y2hlblwiLCBxdHlLZXk6IFwia2l0Y2hlblF0eVwiIH0sXG4gIHsgbGFiZWw6IFwiS2l0Y2hlbiBTaHV0dGVyIElud2FyZFwiLCBrZXk6IFwia2l0Y2hlblNodXR0ZXJJbndhcmRcIiwgcHJvZHVjdDogXCJraXRjaGVuXCIsIHF0eUtleTogXCJraXRjaGVuUXR5XCIgfSxcbiAgeyBsYWJlbDogXCJLaXRjaGVuIEhhcmR3YXJlIElud2FyZFwiLCBrZXk6IFwia2l0Y2hlbkhhcmR3YXJlSW53YXJkXCIsIHByb2R1Y3Q6IFwia2l0Y2hlblwiLCBxdHlLZXk6IFwia2l0Y2hlblF0eVwiIH0sXG4gIHsgbGFiZWw6IFwiS2l0Y2hlbiBBcHBsaWFuY2UgSW53YXJkXCIsIGtleTogXCJraXRjaGVuQXBwbGlhbmNlSW53YXJkXCIsIHByb2R1Y3Q6IFwia2l0Y2hlblwiLCBxdHlLZXk6IFwia2l0Y2hlblF0eVwiIH0sXG4gIHsgbGFiZWw6IFwiV2FyZHJvYmUgQ2FiaW5ldCBJbndhcmRcIiwga2V5OiBcIndhcmRyb2JlQ2FiaW5ldElud2FyZFwiLCBwcm9kdWN0OiBcIndhcmRyb2JlXCIsIHF0eUtleTogXCJ3YXJkcm9iZVF0eVwiIH0sXG4gIHsgbGFiZWw6IFwiV2FyZHJvYmUgU2h1dHRlciBIYXJkd2FyZSBJbndhcmRcIiwga2V5OiBcIndhcmRyb2JlU2h1dHRlckhhcmR3YXJlSW53YXJkXCIsIHByb2R1Y3Q6IFwid2FyZHJvYmVcIiwgcXR5S2V5OiBcIndhcmRyb2JlUXR5XCIgfSxcbiAgeyBsYWJlbDogXCJWYW5pdHkgQ2FiaW5ldCBJbndhcmRcIiwga2V5OiBcInZhbml0eUNhYmluZXRJbndhcmRcIiwgcHJvZHVjdDogXCJ2YW5pdHlcIiwgcXR5S2V5OiBcInZhbml0eVF0eVwiIH0sXG4gIHsgbGFiZWw6IFwiVmFuaXR5IFNodXR0ZXIgSGFyZHdhcmUgSW53YXJkXCIsIGtleTogXCJ2YW5pdHlTaHV0dGVySGFyZHdhcmVJbndhcmRcIiwgcHJvZHVjdDogXCJ2YW5pdHlcIiwgcXR5S2V5OiBcInZhbml0eVF0eVwiIH0sXG4gIHsgbGFiZWw6IFwiRG9vciAmIEhhciBJbndhcmRcIiwga2V5OiBcImRvb3JGcmFtZUhhcmR3YXJlSW53YXJkXCIsIHByb2R1Y3Q6IFwiZG9vclwiLCBxdHlLZXk6IFwiZG9vclF0eVwiIH1cbl07XG5cbmNvbnN0IGV4ZWN1dGlvbkl0ZW1zID0gW1xuICB7IGxhYmVsOiBcIktpdGNoZW4gTG93ZXIgQ2FyY2FzcyBJbnN0YWxsZWRcIiwga2V5OiBcImtpdGNoZW5Mb3dlckNhcmNhc3NJbnN0YWxsZWRcIiwgcHJvZHVjdDogXCJraXRjaGVuXCIsIHF0eUtleTogXCJraXRjaGVuUXR5XCIgfSxcbiAgeyBsYWJlbDogXCJLaXRjaGVuIFVwcGVyIENhcmNhc3MgSW5zdGFsbGVkXCIsIGtleTogXCJraXRjaGVuVXBwZXJDYXJjYXNzSW5zdGFsbGVkXCIsIHByb2R1Y3Q6IFwia2l0Y2hlblwiLCBxdHlLZXk6IFwia2l0Y2hlblF0eVwiIH0sXG4gIHsgbGFiZWw6IFwiS2l0Y2hlbiBTdG9uZSBJbnN0YWxsZWRcIiwga2V5OiBcImtpdGNoZW5TdG9uZUluc3RhbGxlZFwiLCBwcm9kdWN0OiBcImtpdGNoZW5cIiwgcXR5S2V5OiBcImtpdGNoZW5RdHlcIiB9LFxuICB7IGxhYmVsOiBcIktpdGNoZW4gU2h1dHRlciBIYXJkd2FyZSBJbnN0YWxsZWRcIiwga2V5OiBcImtpdGNoZW5TaHV0dGVySGFyZHdhcmVJbnN0YWxsZWRcIiwgcHJvZHVjdDogXCJraXRjaGVuXCIsIHF0eUtleTogXCJraXRjaGVuUXR5XCIgfSxcbiAgeyBsYWJlbDogXCJLaXRjaGVuIEFwcGxpYW5jZSBJbnN0YWxsZWRcIiwga2V5OiBcImtpdGNoZW5BcHBsaWFuY2VJbnN0YWxsZWRcIiwgcHJvZHVjdDogXCJraXRjaGVuXCIsIHF0eUtleTogXCJraXRjaGVuUXR5XCIgfSxcbiAgeyBsYWJlbDogXCJLaXRjaGVuIEhhbmRlZCBPdmVyXCIsIGtleTogXCJraXRjaGVuSGFuZGVkT3ZlclwiLCBwcm9kdWN0OiBcImtpdGNoZW5cIiwgcXR5S2V5OiBcImtpdGNoZW5RdHlcIiB9LFxuICB7IGxhYmVsOiBcIldhcmRyb2JlIENhYmluZXQgSW5zdGFsbGVkXCIsIGtleTogXCJ3YXJkcm9iZUNhYmluZXRJbnN0YWxsZWRcIiwgcHJvZHVjdDogXCJ3YXJkcm9iZVwiLCBxdHlLZXk6IFwid2FyZHJvYmVRdHlcIiB9LFxuICB7IGxhYmVsOiBcIldhcmRyb2JlIFNodXR0ZXIgSGFyZHdhcmUgSW5zdGFsbGVkXCIsIGtleTogXCJ3YXJkcm9iZVNodXR0ZXJIYXJkd2FyZUluc3RhbGxlZFwiLCBwcm9kdWN0OiBcIndhcmRyb2JlXCIsIHF0eUtleTogXCJ3YXJkcm9iZVF0eVwiIH0sXG4gIHsgbGFiZWw6IFwiV2FyZHJvYmUgSGFuZGVkIE92ZXJcIiwga2V5OiBcIndhcmRyb2JlSGFuZGVkT3ZlclwiLCBwcm9kdWN0OiBcIndhcmRyb2JlXCIsIHF0eUtleTogXCJ3YXJkcm9iZVF0eVwiIH0sXG4gIHsgbGFiZWw6IFwiVmFuaXR5IENhYmluZXQgSW5zdGFsbGVkXCIsIGtleTogXCJ2YW5pdHlDYWJpbmV0SW5zdGFsbGVkXCIsIHByb2R1Y3Q6IFwidmFuaXR5XCIsIHF0eUtleTogXCJ2YW5pdHlRdHlcIiB9LFxuICB7IGxhYmVsOiBcIlZhbml0eSBTaHV0dGVyIEhhcmR3YXJlIEluc3RhbGxlZFwiLCBrZXk6IFwidmFuaXR5U2h1dHRlckhhcmR3YXJlSW5zdGFsbGVkXCIsIHByb2R1Y3Q6IFwidmFuaXR5XCIsIHF0eUtleTogXCJ2YW5pdHlRdHlcIiB9LFxuICB7IGxhYmVsOiBcIlZhbml0eSBIYW5kZWQgT3ZlclwiLCBrZXk6IFwidmFuaXR5SGFuZGVkT3ZlclwiLCBwcm9kdWN0OiBcInZhbml0eVwiLCBxdHlLZXk6IFwidmFuaXR5UXR5XCIgfSxcbiAgeyBsYWJlbDogXCJEb29yICYgSGFyIEluc3RhbGxlZFwiLCBrZXk6IFwiZG9vckZyYW1lSGFyZHdhcmVJbnN0YWxsZWRcIiwgcHJvZHVjdDogXCJkb29yXCIsIHF0eUtleTogXCJkb29yUXR5XCIgfSxcbiAgeyBsYWJlbDogXCJEb29yIEhhbmRlZCBPdmVyXCIsIGtleTogXCJkb29ySGFuZGVkT3ZlclwiLCBwcm9kdWN0OiBcImRvb3JcIiwgcXR5S2V5OiBcImRvb3JRdHlcIiB9XG5dO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0UHJvamVjdEFuYWx5dGljcyhyZXEsIHJlcykge1xuICBjb25zdCB7IG9yZGVySWQgfSA9IHJlcS5wYXJhbXM7XG5cbiAgdHJ5IHtcbiAgICAvLyAxLiBGZXRjaCBPcmRlciBkZXRhaWxzIGFsb25nIHdpdGggQmlsbGluZyBTZXR1cCAmIFRvd2Vyc1xuICAgIGNvbnN0IG9yZGVyID0gYXdhaXQgcHJpc21hLm9yZGVyLmZpbmRVbmlxdWUoe1xuICAgICAgd2hlcmU6IHsgaWQ6IG9yZGVySWQgfSxcbiAgICAgIGluY2x1ZGU6IHtcbiAgICAgICAgY3JlYXRlZEJ5OiB7XG4gICAgICAgICAgc2VsZWN0OiB7XG4gICAgICAgICAgICBpZDogdHJ1ZSxcbiAgICAgICAgICAgIG5hbWU6IHRydWUsXG4gICAgICAgICAgICBlbWFpbDogdHJ1ZVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgYmlsbGluZ1NldHVwOiB7XG4gICAgICAgICAgaW5jbHVkZToge1xuICAgICAgICAgICAgdW5pdFR5cGVSYXRlczogdHJ1ZVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgaWYgKCFvcmRlcikge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgZXJyb3I6ICdPcmRlciBwcm9qZWN0IG5vdCBmb3VuZCcgfSk7XG4gICAgfVxuXG4gICAgLy8gMi4gRmV0Y2ggYWxsIEJ1aWxkaW5ncyBmb3IgdGhpcyBvcmRlciwgd2l0aCB0aGVpciBhcGFydG1lbnRzXG4gICAgY29uc3QgYnVpbGRpbmdzID0gYXdhaXQgcHJpc21hLmJ1aWxkaW5nLmZpbmRNYW55KHtcbiAgICAgIHdoZXJlOiB7IG9yZGVySWQgfSxcbiAgICAgIGluY2x1ZGU6IHtcbiAgICAgICAgYXBhcnRtZW50czogdHJ1ZVxuICAgICAgfSxcbiAgICAgIG9yZGVyQnk6IHsgbmFtZTogJ2FzYycgfVxuICAgIH0pO1xuXG4gICAgLy8gRXh0cmFjdCBhbGwgYXBhcnRtZW50cyBhY3Jvc3MgdGhlIGVudGlyZSBvcmRlclxuICAgIGNvbnN0IGFsbEFwYXJ0bWVudHMgPSBidWlsZGluZ3MuZmxhdE1hcChiID0+IGIuYXBhcnRtZW50cyk7XG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyBBKSBUb3dlciBTdW1tYXJ5IFJvbGx1cFxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIGNvbnN0IHRvd2VyU3VtbWFyeSA9IFtdO1xuXG4gICAgLy8gU2l0ZSBUb3RhbCB2YXJpYWJsZXNcbiAgICBsZXQgc2l0ZUFwYXJ0bWVudHMgPSBhbGxBcGFydG1lbnRzLmxlbmd0aDtcbiAgICBsZXQgc2l0ZUtpdGNoZW5Vbml0cyA9IDA7XG4gICAgbGV0IHNpdGVXYXJkcm9iZVVuaXRzID0gMDtcbiAgICBsZXQgc2l0ZVZhbml0eVVuaXRzID0gMDtcbiAgICBsZXQgc2l0ZURvb3JVbml0cyA9IDA7XG5cbiAgICBsZXQgc2l0ZVN1bU1hdElud2FyZCA9IDAuMDtcbiAgICBsZXQgc2l0ZVN1bUtpdGNoZW5Db21wID0gMC4wO1xuICAgIGxldCBzaXRlU3VtV2FyZHJvYmVDb21wID0gMC4wO1xuICAgIGxldCBzaXRlU3VtVmFuaXR5Q29tcCA9IDAuMDtcbiAgICBsZXQgc2l0ZVN1bURvb3JDb21wID0gMC4wO1xuICAgIGxldCBzaXRlU3VtT3ZlcmFsbENvbXAgPSAwLjA7XG5cbiAgICBsZXQgc2l0ZU5vdFN0YXJ0ZWQgPSAwO1xuICAgIGxldCBzaXRlTWF0SW53YXJkUmVhZHkgPSAwO1xuICAgIGxldCBzaXRlRXhlY3V0aW9uSW5Qcm9ncmVzcyA9IDA7XG4gICAgbGV0IHNpdGVSZWFkeUZvckhhbmRvdmVyID0gMDtcbiAgICBsZXQgc2l0ZUNvbXBsZXRlZCA9IDA7XG5cbiAgICBsZXQgc2l0ZURlbGF5ZWQgPSAwO1xuICAgIGxldCBzaXRlQ3JpdGljYWwgPSAwO1xuICAgIGxldCBzaXRlUUNQZW5kaW5nID0gMDtcbiAgICBsZXQgc2l0ZVFDUmVqZWN0ZWQgPSAwO1xuXG4gICAgbGV0IHNpdGVUb3RhbFF0eSA9IDA7XG4gICAgbGV0IHNpdGVLaXRjaGVuUXR5ID0gMDtcbiAgICBsZXQgc2l0ZVdhcmRyb2JlUXR5ID0gMDtcbiAgICBsZXQgc2l0ZVZhbml0eVF0eSA9IDA7XG4gICAgbGV0IHNpdGVEb29yUXR5ID0gMDtcblxuICAgIC8vIExvb3AgcGVyIHRvd2VyXG4gICAgZm9yIChjb25zdCBiIG9mIGJ1aWxkaW5ncykge1xuICAgICAgY29uc3QgYXBhcnRtZW50c0NvdW50ID0gYi5hcGFydG1lbnRzLmxlbmd0aDtcbiAgICAgIGxldCBraXRjaGVuVW5pdHMgPSAwO1xuICAgICAgbGV0IHdhcmRyb2JlVW5pdHMgPSAwO1xuICAgICAgbGV0IHZhbml0eVVuaXRzID0gMDtcbiAgICAgIGxldCBkb29yVW5pdHMgPSAwO1xuXG4gICAgICBsZXQgc3VtTWF0SW53YXJkID0gMC4wO1xuICAgICAgbGV0IHN1bUtpdGNoZW5Db21wID0gMC4wO1xuICAgICAgbGV0IHN1bVdhcmRyb2JlQ29tcCA9IDAuMDtcbiAgICAgIGxldCBzdW1WYW5pdHlDb21wID0gMC4wO1xuICAgICAgbGV0IHN1bURvb3JDb21wID0gMC4wO1xuICAgICAgbGV0IHN1bU92ZXJhbGxDb21wID0gMC4wO1xuXG4gICAgICBsZXQgbm90U3RhcnRlZENvdW50ID0gMDtcbiAgICAgIGxldCBtYXRJbndhcmRSZWFkeUNvdW50ID0gMDtcbiAgICAgIGxldCBleGVjdXRpb25JblByb2dyZXNzQ291bnQgPSAwO1xuICAgICAgbGV0IHJlYWR5Rm9ySGFuZG92ZXJDb3VudCA9IDA7XG4gICAgICBsZXQgY29tcGxldGVkQ291bnQgPSAwO1xuXG4gICAgICBsZXQgZGVsYXllZENvdW50ID0gMDtcbiAgICAgIGxldCBjcml0aWNhbENvdW50ID0gMDtcbiAgICAgIGxldCBxY1BlbmRpbmdDb3VudCA9IDA7XG4gICAgICBsZXQgcWNSZWplY3RlZENvdW50ID0gMDtcblxuICAgICAgbGV0IHRvdGFsUXR5ID0gMDtcbiAgICAgIGxldCBraXRjaGVuUXR5ID0gMDtcbiAgICAgIGxldCB3YXJkcm9iZVF0eSA9IDA7XG4gICAgICBsZXQgdmFuaXR5UXR5ID0gMDtcbiAgICAgIGxldCBkb29yUXR5ID0gMDtcblxuICAgICAgZm9yIChjb25zdCBhcHQgb2YgYi5hcGFydG1lbnRzKSB7XG4gICAgICAgIGNvbnN0IGtRdHkgPSBhcHQua2l0Y2hlblF0eSB8fCAwO1xuICAgICAgICBjb25zdCB3UXR5ID0gYXB0LndhcmRyb2JlUXR5IHx8IDA7XG4gICAgICAgIGNvbnN0IHZRdHkgPSBhcHQudmFuaXR5UXR5IHx8IDA7XG4gICAgICAgIGNvbnN0IGRRdHkgPSBhcHQuZG9vclF0eSB8fCAwO1xuICAgICAgICBjb25zdCB0UXR5ID0ga1F0eSArIHdRdHkgKyB2UXR5ICsgZFF0eTtcblxuICAgICAgICBraXRjaGVuVW5pdHMgKz0ga1F0eTtcbiAgICAgICAgd2FyZHJvYmVVbml0cyArPSB3UXR5O1xuICAgICAgICB2YW5pdHlVbml0cyArPSB2UXR5O1xuICAgICAgICBkb29yVW5pdHMgKz0gZFF0eTtcblxuICAgICAgICB0b3RhbFF0eSArPSB0UXR5O1xuICAgICAgICBraXRjaGVuUXR5ICs9IGtRdHk7XG4gICAgICAgIHdhcmRyb2JlUXR5ICs9IHdRdHk7XG4gICAgICAgIHZhbml0eVF0eSArPSB2UXR5O1xuICAgICAgICBkb29yUXR5ICs9IGRRdHk7XG5cbiAgICAgICAgLy8gQ3VtdWxhdGl2ZSB3ZWlnaHRlZCBwcm9ncmVzcyBzdW1zXG4gICAgICAgIHN1bU1hdElud2FyZCArPSAoYXB0Lm1hdGVyaWFsSW53YXJkUGN0IHx8IDAuMCkgKiB0UXR5O1xuICAgICAgICBzdW1LaXRjaGVuQ29tcCArPSAoYXB0LmtpdGNoZW5Db21wbGV0aW9uUGN0IHx8IDAuMCkgKiBrUXR5O1xuICAgICAgICBzdW1XYXJkcm9iZUNvbXAgKz0gKGFwdC53YXJkcm9iZUNvbXBsZXRpb25QY3QgfHwgMC4wKSAqIHdRdHk7XG4gICAgICAgIHN1bVZhbml0eUNvbXAgKz0gKGFwdC52YW5pdHlDb21wbGV0aW9uUGN0IHx8IDAuMCkgKiB2UXR5O1xuICAgICAgICBzdW1Eb29yQ29tcCArPSAoYXB0LmRvb3JDb21wbGV0aW9uUGN0IHx8IDAuMCkgKiBkUXR5O1xuICAgICAgICBzdW1PdmVyYWxsQ29tcCArPSAoYXB0Lm92ZXJhbGxDb21wbGV0aW9uUGN0IHx8IDAuMCkgKiB0UXR5O1xuXG4gICAgICAgIC8vIFN0YXR1cyBncm91cGluZ3NcbiAgICAgICAgaWYgKGFwdC5hcGFydG1lbnRTdGF0dXMgPT09IFwiTm90IFN0YXJ0ZWRcIikge1xuICAgICAgICAgIG5vdFN0YXJ0ZWRDb3VudCsrO1xuICAgICAgICB9IGVsc2UgaWYgKGFwdC5hcGFydG1lbnRTdGF0dXMgPT09IFwiTWF0ZXJpYWwgSW53YXJkXCIgfHwgYXB0LmFwYXJ0bWVudFN0YXR1cyA9PT0gXCJNYXRlcmlhbCBSZWFkeVwiKSB7XG4gICAgICAgICAgbWF0SW53YXJkUmVhZHlDb3VudCsrO1xuICAgICAgICB9IGVsc2UgaWYgKGFwdC5hcGFydG1lbnRTdGF0dXMgPT09IFwiRXhlY3V0aW9uIEluIFByb2dyZXNzXCIpIHtcbiAgICAgICAgICBleGVjdXRpb25JblByb2dyZXNzQ291bnQrKztcbiAgICAgICAgfSBlbHNlIGlmIChhcHQuYXBhcnRtZW50U3RhdHVzID09PSBcIlJlYWR5IGZvciBIYW5kb3ZlclwiKSB7XG4gICAgICAgICAgcmVhZHlGb3JIYW5kb3ZlckNvdW50Kys7XG4gICAgICAgIH0gZWxzZSBpZiAoYXB0LmFwYXJ0bWVudFN0YXR1cyA9PT0gXCJDb21wbGV0ZWRcIikge1xuICAgICAgICAgIGNvbXBsZXRlZENvdW50Kys7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBIZWFsdGggaW5kaWNhdG9yc1xuICAgICAgICBpZiAoYXB0LmhlYWx0aCA9PT0gXCJEZWxheWVkXCIpIGRlbGF5ZWRDb3VudCsrO1xuICAgICAgICBpZiAoYXB0LmhlYWx0aCA9PT0gXCJDcml0aWNhbFwiKSBjcml0aWNhbENvdW50Kys7XG5cbiAgICAgICAgLy8gUUMgR2F0ZSBjaGVja3BvaW50c1xuICAgICAgICBpZiAoYXB0LmhhbmRvdmVyQXBwcm92YWxTdGF0dXMgPT09IFwiUUMgUGVuZGluZ1wiKSBxY1BlbmRpbmdDb3VudCsrO1xuICAgICAgICBpZiAoYXB0LmhhbmRvdmVyQXBwcm92YWxTdGF0dXMgPT09IFwiUUMgUmVqZWN0ZWRcIikgcWNSZWplY3RlZENvdW50Kys7XG4gICAgICB9XG5cbiAgICAgIC8vIEFkZCB0byBzaXRlIHRvdGFsc1xuICAgICAgc2l0ZUtpdGNoZW5Vbml0cyArPSBraXRjaGVuVW5pdHM7XG4gICAgICBzaXRlV2FyZHJvYmVVbml0cyArPSB3YXJkcm9iZVVuaXRzO1xuICAgICAgc2l0ZVZhbml0eVVuaXRzICs9IHZhbml0eVVuaXRzO1xuICAgICAgc2l0ZURvb3JVbml0cyArPSBkb29yVW5pdHM7XG5cbiAgICAgIHNpdGVTdW1NYXRJbndhcmQgKz0gc3VtTWF0SW53YXJkO1xuICAgICAgc2l0ZVN1bUtpdGNoZW5Db21wICs9IHN1bUtpdGNoZW5Db21wO1xuICAgICAgc2l0ZVN1bVdhcmRyb2JlQ29tcCArPSBzdW1XYXJkcm9iZUNvbXA7XG4gICAgICBzaXRlU3VtVmFuaXR5Q29tcCArPSBzdW1WYW5pdHlDb21wO1xuICAgICAgc2l0ZVN1bURvb3JDb21wICs9IHN1bURvb3JDb21wO1xuICAgICAgc2l0ZVN1bU92ZXJhbGxDb21wICs9IHN1bU92ZXJhbGxDb21wO1xuXG4gICAgICBzaXRlTm90U3RhcnRlZCArPSBub3RTdGFydGVkQ291bnQ7XG4gICAgICBzaXRlTWF0SW53YXJkUmVhZHkgKz0gbWF0SW53YXJkUmVhZHlDb3VudDtcbiAgICAgIHNpdGVFeGVjdXRpb25JblByb2dyZXNzICs9IGV4ZWN1dGlvbkluUHJvZ3Jlc3NDb3VudDtcbiAgICAgIHNpdGVSZWFkeUZvckhhbmRvdmVyICs9IHJlYWR5Rm9ySGFuZG92ZXJDb3VudDtcbiAgICAgIHNpdGVDb21wbGV0ZWQgKz0gY29tcGxldGVkQ291bnQ7XG5cbiAgICAgIHNpdGVEZWxheWVkICs9IGRlbGF5ZWRDb3VudDtcbiAgICAgIHNpdGVDcml0aWNhbCArPSBjcml0aWNhbENvdW50O1xuICAgICAgc2l0ZVFDUGVuZGluZyArPSBxY1BlbmRpbmdDb3VudDtcbiAgICAgIHNpdGVRQ1JlamVjdGVkICs9IHFjUmVqZWN0ZWRDb3VudDtcblxuICAgICAgc2l0ZVRvdGFsUXR5ICs9IHRvdGFsUXR5O1xuICAgICAgc2l0ZUtpdGNoZW5RdHkgKz0ga2l0Y2hlblF0eTtcbiAgICAgIHNpdGVXYXJkcm9iZVF0eSArPSB3YXJkcm9iZVF0eTtcbiAgICAgIHNpdGVWYW5pdHlRdHkgKz0gdmFuaXR5UXR5O1xuICAgICAgc2l0ZURvb3JRdHkgKz0gZG9vclF0eTtcblxuICAgICAgLy8gQ2FsY3VsYXRlIHRvd2VyLWxldmVsIHdlaWdodGVkIGF2ZXJhZ2VzXG4gICAgICBjb25zdCBtYXRlcmlhbElud2FyZFBjdCA9IHRvdGFsUXR5ID4gMCA/IChzdW1NYXRJbndhcmQgLyB0b3RhbFF0eSkgOiAwLjA7XG4gICAgICBjb25zdCBraXRjaGVuQ29tcGxldGlvblBjdCA9IGtpdGNoZW5RdHkgPiAwID8gKHN1bUtpdGNoZW5Db21wIC8ga2l0Y2hlblF0eSkgOiAwLjA7XG4gICAgICBjb25zdCB3YXJkcm9iZUNvbXBsZXRpb25QY3QgPSB3YXJkcm9iZVF0eSA+IDAgPyAoc3VtV2FyZHJvYmVDb21wIC8gd2FyZHJvYmVRdHkpIDogMC4wO1xuICAgICAgY29uc3QgdmFuaXR5Q29tcGxldGlvblBjdCA9IHZhbml0eVF0eSA+IDAgPyAoc3VtVmFuaXR5Q29tcCAvIHZhbml0eVF0eSkgOiAwLjA7XG4gICAgICBjb25zdCBkb29yQ29tcGxldGlvblBjdCA9IGRvb3JRdHkgPiAwID8gKHN1bURvb3JDb21wIC8gZG9vclF0eSkgOiAwLjA7XG4gICAgICBjb25zdCBvdmVyYWxsQ29tcGxldGlvblBjdCA9IHRvdGFsUXR5ID4gMCA/IChzdW1PdmVyYWxsQ29tcCAvIHRvdGFsUXR5KSA6IDAuMDtcblxuICAgICAgLy8gRXZhbHVhdGUgSGVhbHRoXG4gICAgICBsZXQgaGVhbHRoID0gXCJXYXRjaFwiO1xuICAgICAgaWYgKGFwYXJ0bWVudHNDb3VudCA9PT0gMCkge1xuICAgICAgICBoZWFsdGggPSBcIk5vIERhdGFcIjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IGhhc0NyaXRpY2FsQXB0ID0gYi5hcGFydG1lbnRzLnNvbWUoYXB0ID0+XG4gICAgICAgICAgYXB0LmhhbmRvdmVyQXBwcm92YWxTdGF0dXMgPT09IFwiUUMgUmVqZWN0ZWRcIiB8fCBhcHQuaGVhbHRoID09PSBcIkNyaXRpY2FsXCJcbiAgICAgICAgKTtcbiAgICAgICAgaWYgKGhhc0NyaXRpY2FsQXB0KSB7XG4gICAgICAgICAgaGVhbHRoID0gXCJDcml0aWNhbFwiO1xuICAgICAgICB9IGVsc2UgaWYgKGRlbGF5ZWRDb3VudCA+IDEwKSB7XG4gICAgICAgICAgaGVhbHRoID0gXCJEZWxheWVkXCI7XG4gICAgICAgIH0gZWxzZSBpZiAob3ZlcmFsbENvbXBsZXRpb25QY3QgPj0gKGIuZXhjZWxsZW50VGhyZXNob2xkID8/IDAuOSkpIHtcbiAgICAgICAgICBoZWFsdGggPSBcIkV4Y2VsbGVudFwiO1xuICAgICAgICB9IGVsc2UgaWYgKG92ZXJhbGxDb21wbGV0aW9uUGN0ID49IChiLmdvb2RUaHJlc2hvbGQgPz8gMC43NSkpIHtcbiAgICAgICAgICBoZWFsdGggPSBcIkdvb2RcIjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBoZWFsdGggPSBcIldhdGNoXCI7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdG93ZXJTdW1tYXJ5LnB1c2goe1xuICAgICAgICBpZDogYi5pZCxcbiAgICAgICAgdG93ZXI6IGIubmFtZSxcbiAgICAgICAgYXBhcnRtZW50czogYXBhcnRtZW50c0NvdW50LFxuICAgICAgICBraXRjaGVuVW5pdHMsXG4gICAgICAgIHdhcmRyb2JlVW5pdHMsXG4gICAgICAgIHZhbml0eVVuaXRzLFxuICAgICAgICBkb29yVW5pdHMsXG4gICAgICAgIG1hdGVyaWFsSW53YXJkUGN0LFxuICAgICAgICBraXRjaGVuQ29tcGxldGlvblBjdCxcbiAgICAgICAgd2FyZHJvYmVDb21wbGV0aW9uUGN0LFxuICAgICAgICB2YW5pdHlDb21wbGV0aW9uUGN0LFxuICAgICAgICBkb29yQ29tcGxldGlvblBjdCxcbiAgICAgICAgb3ZlcmFsbENvbXBsZXRpb25QY3QsXG4gICAgICAgIG5vdFN0YXJ0ZWQ6IG5vdFN0YXJ0ZWRDb3VudCxcbiAgICAgICAgbWF0ZXJpYWxJbndhcmRSZWFkeTogbWF0SW53YXJkUmVhZHlDb3VudCxcbiAgICAgICAgZXhlY3V0aW9uSW5Qcm9ncmVzczogZXhlY3V0aW9uSW5Qcm9ncmVzc0NvdW50LFxuICAgICAgICByZWFkeUZvckhhbmRvdmVyOiByZWFkeUZvckhhbmRvdmVyQ291bnQsXG4gICAgICAgIGNvbXBsZXRlZDogY29tcGxldGVkQ291bnQsXG4gICAgICAgIGRlbGF5ZWRBcGFydG1lbnRzOiBkZWxheWVkQ291bnQsXG4gICAgICAgIGNyaXRpY2FsQXBhcnRtZW50czogY3JpdGljYWxDb3VudCxcbiAgICAgICAgaGVhbHRoLFxuICAgICAgICBxY1BlbmRpbmc6IHFjUGVuZGluZ0NvdW50LFxuICAgICAgICBxY1JlamVjdGVkOiBxY1JlamVjdGVkQ291bnRcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIFNpdGUgTGV2ZWwgb3ZlcmFsbCBhdmVyYWdlc1xuICAgIGNvbnN0IHNpdGVNYXRlcmlhbElud2FyZFBjdCA9IHNpdGVUb3RhbFF0eSA+IDAgPyAoc2l0ZVN1bU1hdElud2FyZCAvIHNpdGVUb3RhbFF0eSkgOiAwLjA7XG4gICAgY29uc3Qgc2l0ZUtpdGNoZW5Db21wbGV0aW9uUGN0ID0gc2l0ZUtpdGNoZW5RdHkgPiAwID8gKHNpdGVTdW1LaXRjaGVuQ29tcCAvIHNpdGVLaXRjaGVuUXR5KSA6IDAuMDtcbiAgICBjb25zdCBzaXRlV2FyZHJvYmVDb21wbGV0aW9uUGN0ID0gc2l0ZVdhcmRyb2JlUXR5ID4gMCA/IChzaXRlU3VtV2FyZHJvYmVDb21wIC8gc2l0ZVdhcmRyb2JlUXR5KSA6IDAuMDtcbiAgICBjb25zdCBzaXRlVmFuaXR5Q29tcGxldGlvblBjdCA9IHNpdGVWYW5pdHlRdHkgPiAwID8gKHNpdGVTdW1WYW5pdHlDb21wIC8gc2l0ZVZhbml0eVF0eSkgOiAwLjA7XG4gICAgY29uc3Qgc2l0ZURvb3JDb21wbGV0aW9uUGN0ID0gc2l0ZURvb3JRdHkgPiAwID8gKHNpdGVTdW1Eb29yQ29tcCAvIHNpdGVEb29yUXR5KSA6IDAuMDtcbiAgICBjb25zdCBzaXRlT3ZlcmFsbENvbXBsZXRpb25QY3QgPSBzaXRlVG90YWxRdHkgPiAwID8gKHNpdGVTdW1PdmVyYWxsQ29tcCAvIHNpdGVUb3RhbFF0eSkgOiAwLjA7XG5cbiAgICBsZXQgc2l0ZUhlYWx0aCA9IFwiV2F0Y2hcIjtcbiAgICBpZiAoc2l0ZUFwYXJ0bWVudHMgPT09IDApIHtcbiAgICAgIHNpdGVIZWFsdGggPSBcIk5vIERhdGFcIjtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgaGFzQ3JpdGljYWxBcHQgPSBhbGxBcGFydG1lbnRzLnNvbWUoYXB0ID0+XG4gICAgICAgIGFwdC5oYW5kb3ZlckFwcHJvdmFsU3RhdHVzID09PSBcIlFDIFJlamVjdGVkXCIgfHwgYXB0LmhlYWx0aCA9PT0gXCJDcml0aWNhbFwiXG4gICAgICApO1xuICAgICAgaWYgKGhhc0NyaXRpY2FsQXB0KSB7XG4gICAgICAgIHNpdGVIZWFsdGggPSBcIkNyaXRpY2FsXCI7XG4gICAgICB9IGVsc2UgaWYgKHNpdGVEZWxheWVkID4gMjUpIHsgLy8gU2l0ZSBsZXZlbCB0aHJlc2hvbGQgaXMgPiAyNVxuICAgICAgICBzaXRlSGVhbHRoID0gXCJEZWxheWVkXCI7XG4gICAgICB9IGVsc2UgaWYgKHNpdGVPdmVyYWxsQ29tcGxldGlvblBjdCA+PSAwLjkpIHtcbiAgICAgICAgc2l0ZUhlYWx0aCA9IFwiRXhjZWxsZW50XCI7XG4gICAgICB9IGVsc2UgaWYgKHNpdGVPdmVyYWxsQ29tcGxldGlvblBjdCA+PSAwLjc1KSB7XG4gICAgICAgIHNpdGVIZWFsdGggPSBcIkdvb2RcIjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNpdGVIZWFsdGggPSBcIldhdGNoXCI7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gQXBwZW5kIFRPVEFML1NJVEUgcm93XG4gICAgdG93ZXJTdW1tYXJ5LnB1c2goe1xuICAgICAgaWQ6IFwic2l0ZS10b3RhbFwiLFxuICAgICAgdG93ZXI6IFwiVE9UQUwgLyBTSVRFXCIsXG4gICAgICBhcGFydG1lbnRzOiBzaXRlQXBhcnRtZW50cyxcbiAgICAgIGtpdGNoZW5Vbml0czogc2l0ZUtpdGNoZW5Vbml0cyxcbiAgICAgIHdhcmRyb2JlVW5pdHM6IHNpdGVXYXJkcm9iZVVuaXRzLFxuICAgICAgdmFuaXR5VW5pdHM6IHNpdGVWYW5pdHlVbml0cyxcbiAgICAgIGRvb3JVbml0czogc2l0ZURvb3JVbml0cyxcbiAgICAgIG1hdGVyaWFsSW53YXJkUGN0OiBzaXRlTWF0ZXJpYWxJbndhcmRQY3QsXG4gICAgICBraXRjaGVuQ29tcGxldGlvblBjdDogc2l0ZUtpdGNoZW5Db21wbGV0aW9uUGN0LFxuICAgICAgd2FyZHJvYmVDb21wbGV0aW9uUGN0OiBzaXRlV2FyZHJvYmVDb21wbGV0aW9uUGN0LFxuICAgICAgdmFuaXR5Q29tcGxldGlvblBjdDogc2l0ZVZhbml0eUNvbXBsZXRpb25QY3QsXG4gICAgICBkb29yQ29tcGxldGlvblBjdDogc2l0ZURvb3JDb21wbGV0aW9uUGN0LFxuICAgICAgb3ZlcmFsbENvbXBsZXRpb25QY3Q6IHNpdGVPdmVyYWxsQ29tcGxldGlvblBjdCxcbiAgICAgIG5vdFN0YXJ0ZWQ6IHNpdGVOb3RTdGFydGVkLFxuICAgICAgbWF0ZXJpYWxJbndhcmRSZWFkeTogc2l0ZU1hdElud2FyZFJlYWR5LFxuICAgICAgZXhlY3V0aW9uSW5Qcm9ncmVzczogc2l0ZUV4ZWN1dGlvbkluUHJvZ3Jlc3MsXG4gICAgICByZWFkeUZvckhhbmRvdmVyOiBzaXRlUmVhZHlGb3JIYW5kb3ZlcixcbiAgICAgIGNvbXBsZXRlZDogc2l0ZUNvbXBsZXRlZCxcbiAgICAgIGRlbGF5ZWRBcGFydG1lbnRzOiBzaXRlRGVsYXllZCxcbiAgICAgIGNyaXRpY2FsQXBhcnRtZW50czogc2l0ZUNyaXRpY2FsLFxuICAgICAgaGVhbHRoOiBzaXRlSGVhbHRoLFxuICAgICAgcWNQZW5kaW5nOiBzaXRlUUNQZW5kaW5nLFxuICAgICAgcWNSZWplY3RlZDogc2l0ZVFDUmVqZWN0ZWRcbiAgICB9KTtcblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIEIpIFR5cGUgU3VtbWFyeSBSb2xsdXBcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBjb25zdCB0eXBlU3VtbWFyeSA9IFtdO1xuICAgIGNvbnN0IHVuaXRUeXBlUmF0ZXMgPSBvcmRlci5iaWxsaW5nU2V0dXA/LnVuaXRUeXBlUmF0ZXMgfHwgW107XG5cbiAgICBmb3IgKGNvbnN0IHV0IG9mIHVuaXRUeXBlUmF0ZXMpIHtcbiAgICAgIGNvbnN0IHR5cGVDb2RlID0gdXQudHlwZUNvZGU7XG4gICAgICBjb25zdCBwcm9kdWN0ID0gdXQucHJvZHVjdDsgLy8gXCJLaXRjaGVuXCIgfCBcIldhcmRyb2JlXCIgfCBcIlZhbml0eVwiXG4gICAgICBjb25zdCB0eXBlTmFtZSA9IHV0LnR5cGVOYW1lO1xuICAgICAgY29uc3QgY2xpZW50UmF0ZSA9IHV0LmNsaWVudFJhdGUgfHwgMC4wO1xuXG4gICAgICAvLyBGaWx0ZXIgYXBhcnRtZW50cyBtYXRjaGluZyB0aGUgdHlwZSBjb2RlXG4gICAgICBsZXQgbWF0Y2hpbmdBcHRzID0gW107XG4gICAgICBsZXQgcXR5RmllbGQgPSBcImtpdGNoZW5RdHlcIjtcbiAgICAgIGxldCB0eXBlRmllbGQgPSBcImtpdGNoZW5UeXBlXCI7XG4gICAgICBsZXQgY29tcGxldGlvbkZpZWxkID0gXCJraXRjaGVuQ29tcGxldGlvblBjdFwiO1xuICAgICAgbGV0IHFjR2F0ZUZpZWxkID0gXCJraXRjaGVuUUNHYXRlXCI7XG4gICAgICBsZXQgaGFuZGVkT3ZlckZpZWxkID0gXCJraXRjaGVuSGFuZGVkT3ZlclwiO1xuXG4gICAgICBpZiAocHJvZHVjdCA9PT0gXCJLaXRjaGVuXCIpIHtcbiAgICAgICAgcXR5RmllbGQgPSBcImtpdGNoZW5RdHlcIjtcbiAgICAgICAgdHlwZUZpZWxkID0gXCJraXRjaGVuVHlwZVwiO1xuICAgICAgICBjb21wbGV0aW9uRmllbGQgPSBcImtpdGNoZW5Db21wbGV0aW9uUGN0XCI7XG4gICAgICAgIHFjR2F0ZUZpZWxkID0gXCJraXRjaGVuUUNHYXRlXCI7XG4gICAgICAgIGhhbmRlZE92ZXJGaWVsZCA9IFwia2l0Y2hlbkhhbmRlZE92ZXJcIjtcbiAgICAgIH0gZWxzZSBpZiAocHJvZHVjdCA9PT0gXCJXYXJkcm9iZVwiKSB7XG4gICAgICAgIHF0eUZpZWxkID0gXCJ3YXJkcm9iZVF0eVwiO1xuICAgICAgICB0eXBlRmllbGQgPSBcIndhcmRyb2JlVHlwZVwiO1xuICAgICAgICBjb21wbGV0aW9uRmllbGQgPSBcIndhcmRyb2JlQ29tcGxldGlvblBjdFwiO1xuICAgICAgICBxY0dhdGVGaWVsZCA9IFwid2FyZHJvYmVRQ0dhdGVcIjtcbiAgICAgICAgaGFuZGVkT3ZlckZpZWxkID0gXCJ3YXJkcm9iZUhhbmRlZE92ZXJcIjtcbiAgICAgIH0gZWxzZSBpZiAocHJvZHVjdCA9PT0gXCJWYW5pdHlcIikge1xuICAgICAgICBxdHlGaWVsZCA9IFwidmFuaXR5UXR5XCI7XG4gICAgICAgIHR5cGVGaWVsZCA9IFwidmFuaXR5VHlwZVwiO1xuICAgICAgICBjb21wbGV0aW9uRmllbGQgPSBcInZhbml0eUNvbXBsZXRpb25QY3RcIjtcbiAgICAgICAgcWNHYXRlRmllbGQgPSBcInZhbml0eVFDR2F0ZVwiO1xuICAgICAgICBoYW5kZWRPdmVyRmllbGQgPSBcInZhbml0eUhhbmRlZE92ZXJcIjtcbiAgICAgIH0gZWxzZSBpZiAocHJvZHVjdCA9PT0gXCJEb29yXCIpIHtcbiAgICAgICAgcXR5RmllbGQgPSBcImRvb3JRdHlcIjtcbiAgICAgICAgdHlwZUZpZWxkID0gXCJkb29yVHlwZVwiO1xuICAgICAgICBjb21wbGV0aW9uRmllbGQgPSBcImRvb3JDb21wbGV0aW9uUGN0XCI7XG4gICAgICAgIHFjR2F0ZUZpZWxkID0gXCJkb29yUUNHYXRlXCI7XG4gICAgICAgIGhhbmRlZE92ZXJGaWVsZCA9IFwiZG9vckhhbmRlZE92ZXJcIjtcbiAgICAgIH1cblxuICAgICAgbGV0IHVuaXRzID0gMDtcbiAgICAgIGxldCBzdW1NYXRJbndhcmRUeXBlID0gMC4wO1xuICAgICAgbGV0IHN1bUV4ZWNUeXBlID0gMC4wO1xuICAgICAgbGV0IGFwcHJvdmVkSGFuZGVkT3ZlckNvdW50ID0gMDtcblxuICAgICAgZm9yIChjb25zdCBhcHQgb2YgYWxsQXBhcnRtZW50cykge1xuICAgICAgICBjb25zdCB0eXBlU3RyID0gYXB0W3R5cGVGaWVsZF07XG4gICAgICAgIGlmICghdHlwZVN0cikgY29udGludWU7XG5cbiAgICAgICAgbGV0IHF0eSA9IDA7XG4gICAgICAgIGlmICh0eXBlU3RyLnN0YXJ0c1dpdGgoJ1snKSkge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBsaXN0ID0gSlNPTi5wYXJzZSh0eXBlU3RyKTtcbiAgICAgICAgICAgIGNvbnN0IGZvdW5kID0gbGlzdC5maW5kKGl0ZW0gPT4gaXRlbS50eXBlID09PSB0eXBlQ29kZSk7XG4gICAgICAgICAgICBpZiAoZm91bmQpIHF0eSA9IGZvdW5kLnF0eSB8fCAwO1xuICAgICAgICAgIH0gY2F0Y2ggKGUpIHsgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmICh0eXBlU3RyID09PSB0eXBlQ29kZSkge1xuICAgICAgICAgICAgcXR5ID0gYXB0W3F0eUZpZWxkXSB8fCAwO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChxdHkgPiAwKSB7XG4gICAgICAgICAgdW5pdHMgKz0gcXR5O1xuXG4gICAgICAgICAgLy8gV2VpZ2h0ZWQgTWF0ZXJpYWwgYW5kIEV4ZWN1dGlvbiBhdmVyYWdlc1xuICAgICAgICAgIHN1bU1hdElud2FyZFR5cGUgKz0gKGFwdC5tYXRlcmlhbElud2FyZFBjdCB8fCAwLjApICogcXR5O1xuICAgICAgICAgIHN1bUV4ZWNUeXBlICs9IChhcHRbY29tcGxldGlvbkZpZWxkXSB8fCAwLjApICogcXR5O1xuXG4gICAgICAgICAgLy8gQ2hlY2sgaWYgaGFuZGVkIG92ZXIgQU5EIGFwcHJvdmVkXG4gICAgICAgICAgY29uc3QgaXNBcHByb3ZlZCA9IGFwdFtxY0dhdGVGaWVsZF0gPT09IFwiQXBwcm92ZWRcIjtcbiAgICAgICAgICBpZiAoaXNBcHByb3ZlZCkge1xuICAgICAgICAgICAgY29uc3QgaGFuZG92ZXJQY3QgPSAoYXB0W2hhbmRlZE92ZXJGaWVsZF0gfHwgMCkgLyAxMDAuMDtcbiAgICAgICAgICAgIGFwcHJvdmVkSGFuZGVkT3ZlckNvdW50ICs9IHF0eSAqIE1hdGgubWluKDEuMCwgTWF0aC5tYXgoMC4wLCBoYW5kb3ZlclBjdCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjb25zdCBtYXRlcmlhbFJlY2VpdmVkUGN0ID0gdW5pdHMgPiAwID8gKHN1bU1hdElud2FyZFR5cGUgLyB1bml0cykgOiAwLjA7XG4gICAgICBjb25zdCBleGVjdXRpb25QY3QgPSB1bml0cyA+IDAgPyAoc3VtRXhlY1R5cGUgLyB1bml0cykgOiAwLjA7XG4gICAgICBjb25zdCBxY0hhbmRvdmVyUGN0ID0gdW5pdHMgPiAwID8gKGFwcHJvdmVkSGFuZGVkT3ZlckNvdW50IC8gdW5pdHMpIDogMC4wO1xuICAgICAgY29uc3QgY2xpZW50Q29udHJhY3RWYWx1ZSA9IHVuaXRzICogY2xpZW50UmF0ZTtcblxuICAgICAgdHlwZVN1bW1hcnkucHVzaCh7XG4gICAgICAgIHR5cGVDb2RlLFxuICAgICAgICBwcm9kdWN0LFxuICAgICAgICB0eXBlTmFtZSxcbiAgICAgICAgdW5pdHMsXG4gICAgICAgIG1hdGVyaWFsUmVjZWl2ZWRQY3QsXG4gICAgICAgIGV4ZWN1dGlvblBjdCxcbiAgICAgICAgcWNIYW5kb3ZlclBjdCxcbiAgICAgICAgY2xpZW50Q29udHJhY3RWYWx1ZVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8gQykgU3RhZ2UgQW5hbHlzaXMgTWF0cml4XG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgY29uc3Qgc3RhZ2VBbmFseXNpcyA9IHtcbiAgICAgIGhlYWRlcnM6IFsuLi5idWlsZGluZ3MubWFwKGIgPT4gYi5uYW1lKSwgXCJTaXRlIEF2ZXJhZ2VcIl0sXG4gICAgICByb3dzOiBbXVxuICAgIH07XG5cbiAgICAvLyBQcm9jZXNzIE1hdGVyaWFsIGl0ZW1zXG4gICAgZm9yIChjb25zdCBpdGVtIG9mIG1hdGVyaWFsSXRlbXMpIHtcbiAgICAgIGNvbnN0IHZhbHVlcyA9IFtdO1xuICAgICAgbGV0IHRvdGFsRmllbGRTdW0gPSAwO1xuICAgICAgbGV0IHRvdGFsUXR5U3VtID0gMDtcblxuICAgICAgZm9yIChjb25zdCBiIG9mIGJ1aWxkaW5ncykge1xuICAgICAgICBsZXQgZmllbGRTdW0gPSAwO1xuICAgICAgICBsZXQgcXR5U3VtID0gMDtcblxuICAgICAgICBmb3IgKGNvbnN0IGFwdCBvZiBiLmFwYXJ0bWVudHMpIHtcbiAgICAgICAgICBjb25zdCBxdHkgPSBhcHRbaXRlbS5xdHlLZXldIHx8IDA7XG4gICAgICAgICAgZmllbGRTdW0gKz0gKGFwdFtpdGVtLmtleV0gfHwgMCkgKiBxdHk7XG4gICAgICAgICAgcXR5U3VtICs9IHF0eTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRvdGFsRmllbGRTdW0gKz0gZmllbGRTdW07XG4gICAgICAgIHRvdGFsUXR5U3VtICs9IHF0eVN1bTtcblxuICAgICAgICBjb25zdCB2YWwgPSBxdHlTdW0gPiAwID8gKGZpZWxkU3VtIC8gcXR5U3VtKSAvIDEwMC4wIDogMC4wO1xuICAgICAgICB2YWx1ZXMucHVzaCh2YWwpO1xuICAgICAgfVxuXG4gICAgICAvLyBBcHBlbmQgU2l0ZSBBdmVyYWdlXG4gICAgICBjb25zdCBzaXRlVmFsID0gdG90YWxRdHlTdW0gPiAwID8gKHRvdGFsRmllbGRTdW0gLyB0b3RhbFF0eVN1bSkgLyAxMDAuMCA6IDAuMDtcbiAgICAgIHZhbHVlcy5wdXNoKHNpdGVWYWwpO1xuXG4gICAgICBzdGFnZUFuYWx5c2lzLnJvd3MucHVzaCh7XG4gICAgICAgIGNhdGVnb3J5OiBcIk1hdGVyaWFsIC0gXCIgKyBpdGVtLnByb2R1Y3QudG9VcHBlckNhc2UoKSxcbiAgICAgICAgbGFiZWw6IGl0ZW0ubGFiZWwsXG4gICAgICAgIGtleTogaXRlbS5rZXksXG4gICAgICAgIHZhbHVlc1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gUHJvY2VzcyBFeGVjdXRpb24gaXRlbXNcbiAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgZXhlY3V0aW9uSXRlbXMpIHtcbiAgICAgIGNvbnN0IHZhbHVlcyA9IFtdO1xuICAgICAgbGV0IHRvdGFsRmllbGRTdW0gPSAwO1xuICAgICAgbGV0IHRvdGFsUXR5U3VtID0gMDtcblxuICAgICAgZm9yIChjb25zdCBiIG9mIGJ1aWxkaW5ncykge1xuICAgICAgICBsZXQgZmllbGRTdW0gPSAwO1xuICAgICAgICBsZXQgcXR5U3VtID0gMDtcblxuICAgICAgICBmb3IgKGNvbnN0IGFwdCBvZiBiLmFwYXJ0bWVudHMpIHtcbiAgICAgICAgICBjb25zdCBxdHkgPSBhcHRbaXRlbS5xdHlLZXldIHx8IDA7XG4gICAgICAgICAgZmllbGRTdW0gKz0gKGFwdFtpdGVtLmtleV0gfHwgMCkgKiBxdHk7XG4gICAgICAgICAgcXR5U3VtICs9IHF0eTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRvdGFsRmllbGRTdW0gKz0gZmllbGRTdW07XG4gICAgICAgIHRvdGFsUXR5U3VtICs9IHF0eVN1bTtcblxuICAgICAgICBjb25zdCB2YWwgPSBxdHlTdW0gPiAwID8gKGZpZWxkU3VtIC8gcXR5U3VtKSAvIDEwMC4wIDogMC4wO1xuICAgICAgICB2YWx1ZXMucHVzaCh2YWwpO1xuICAgICAgfVxuXG4gICAgICAvLyBBcHBlbmQgU2l0ZSBBdmVyYWdlXG4gICAgICBjb25zdCBzaXRlVmFsID0gdG90YWxRdHlTdW0gPiAwID8gKHRvdGFsRmllbGRTdW0gLyB0b3RhbFF0eVN1bSkgLyAxMDAuMCA6IDAuMDtcbiAgICAgIHZhbHVlcy5wdXNoKHNpdGVWYWwpO1xuXG4gICAgICBzdGFnZUFuYWx5c2lzLnJvd3MucHVzaCh7XG4gICAgICAgIGNhdGVnb3J5OiBcIkV4ZWN1dGlvbiAtIFwiICsgaXRlbS5wcm9kdWN0LnRvVXBwZXJDYXNlKCksXG4gICAgICAgIGxhYmVsOiBpdGVtLmxhYmVsLFxuICAgICAgICBrZXk6IGl0ZW0ua2V5LFxuICAgICAgICB2YWx1ZXNcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIE1ldGFkYXRhIEhlYWRlciBkZXRhaWxzIChmcm9tIGZpcnN0IHRvd2VyIHNldHRpbmdzIGFzIGZhbGxiYWNrLCBvciBvdmVyYWxsIG9yZGVyKVxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIGNvbnN0IGRlZmF1bHRCdWlsZGluZyA9IGJ1aWxkaW5nc1swXTtcbiAgICBjb25zdCBoZWFkZXJNZXRhZGF0YSA9IHtcbiAgICAgIHNpdGVOYW1lOiBkZWZhdWx0QnVpbGRpbmc/LnNpdGVOYW1lIHx8IFwiRGlvIEdyYWNlIE1haW4gU2l0ZVwiLFxuICAgICAgcmVwb3J0RGF0ZTogZGVmYXVsdEJ1aWxkaW5nPy5yZXBvcnREYXRlID8gbmV3IERhdGUoZGVmYXVsdEJ1aWxkaW5nLnJlcG9ydERhdGUpLnRvTG9jYWxlRGF0ZVN0cmluZygpIDogbmV3IERhdGUoKS50b0xvY2FsZURhdGVTdHJpbmcoKSxcbiAgICAgIHByb2plY3RNYW5hZ2VyOiBcIlAuIFNoYXJtYSAoU2l0ZSBNYW5hZ2VyKVwiLFxuICAgICAgY2xpZW50OiBcIkRpbyBHcmFjZSBEZXZlbG9wZXJzIEdyb3VwXCIsXG4gICAgICB0YXJnZXRDb21wbGV0aW9uOiBkZWZhdWx0QnVpbGRpbmc/LnJlcG9ydERhdGUgPyBuZXcgRGF0ZShuZXcgRGF0ZShkZWZhdWx0QnVpbGRpbmcucmVwb3J0RGF0ZSkuZ2V0VGltZSgpICsgMTgwICogMjQgKiA2MCAqIDYwICogMTAwMCkudG9Mb2NhbGVEYXRlU3RyaW5nKCkgOiBcIlRCRFwiLCAvLyBkZWZhdWx0IDYgbW9udGhzIHRhcmdldFxuICAgICAgcHJlcGFyZWRCeTogb3JkZXIuY3JlYXRlZEJ5Py5uYW1lIHx8IFwiU3lzdGVtIEF1dG9tYXRlZCBFUlBcIlxuICAgIH07XG5cbiAgICByZXR1cm4gcmVzLmpzb24oe1xuICAgICAgb3JkZXI6IHtcbiAgICAgICAgaWQ6IG9yZGVyLmlkLFxuICAgICAgICBvcmRlck51bWJlcjogb3JkZXIub3JkZXJOdW1iZXIsXG4gICAgICAgIGNyZWF0ZWRBdDogb3JkZXIuY3JlYXRlZEF0XG4gICAgICB9LFxuICAgICAgaGVhZGVyTWV0YWRhdGEsXG4gICAgICB0b3dlclN1bW1hcnksXG4gICAgICB0eXBlU3VtbWFyeSxcbiAgICAgIHN0YWdlQW5hbHlzaXNcbiAgICB9KTtcblxuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKCdHZXQgcHJvamVjdCBhbmFseXRpY3MgZXJyb3I6JywgZXJyKTtcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oeyBlcnJvcjogJ0ludGVybmFsIHNlcnZlciBlcnJvciBjYWxjdWxhdGluZyBwcm9qZWN0IGFuYWx5dGljcycgfSk7XG4gIH1cbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcaHBcXFxcRG93bmxvYWRzXFxcXERpbyBHcmFjZWVcXFxcRGlvIEdyYWNlZVxcXFxiYWNrZW5kXFxcXHNyY1xcXFxjb250cm9sbGVyc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcaHBcXFxcRG93bmxvYWRzXFxcXERpbyBHcmFjZWVcXFxcRGlvIEdyYWNlZVxcXFxiYWNrZW5kXFxcXHNyY1xcXFxjb250cm9sbGVyc1xcXFx1c2VyQ29udHJvbGxlci5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvaHAvRG93bmxvYWRzL0RpbyUyMEdyYWNlZS9EaW8lMjBHcmFjZWUvYmFja2VuZC9zcmMvY29udHJvbGxlcnMvdXNlckNvbnRyb2xsZXIuanNcIjtpbXBvcnQgeyBQcmlzbWFDbGllbnQgfSBmcm9tICdAcHJpc21hL2NsaWVudCc7XG5pbXBvcnQgYmNyeXB0IGZyb20gJ2JjcnlwdGpzJztcblxuY29uc3QgcHJpc21hID0gbmV3IFByaXNtYUNsaWVudCgpO1xuXG4vLyBMaXN0IGFsbCByZWdpc3RlcmVkIHVzZXJzIChST0xFX0Egb25seSlcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBsaXN0VXNlcnMocmVxLCByZXMpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCB1c2VycyA9IGF3YWl0IHByaXNtYS51c2VyLmZpbmRNYW55KHtcbiAgICAgIHNlbGVjdDoge1xuICAgICAgICBpZDogdHJ1ZSxcbiAgICAgICAgZW1haWw6IHRydWUsXG4gICAgICAgIG5hbWU6IHRydWUsXG4gICAgICAgIHJvbGU6IHRydWUsXG4gICAgICAgIHBlcm1pdHRlZFByb2plY3RzOiB0cnVlLFxuICAgICAgICBjcmVhdGVkQXQ6IHRydWVcbiAgICAgIH0sXG4gICAgICBvcmRlckJ5OiB7IGNyZWF0ZWRBdDogJ2Rlc2MnIH1cbiAgICB9KTtcbiAgICByZXR1cm4gcmVzLmpzb24odXNlcnMpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gbGlzdCB1c2VyczonLCBlcnIpO1xuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7IGVycm9yOiAnRmFpbGVkIHRvIHJldHJpZXZlIHVzZXJzJyB9KTtcbiAgfVxufVxuXG4vLyBDcmVhdGUgbmV3IGxvZ2luIHVzZXIgKFJPTEVfQSBvbmx5KVxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNyZWF0ZVVzZXIocmVxLCByZXMpIHtcbiAgY29uc3QgeyBlbWFpbCwgcGFzc3dvcmQsIG5hbWUsIHJvbGUsIHBlcm1pdHRlZFByb2plY3RzIH0gPSByZXEuYm9keTtcblxuICBpZiAoIWVtYWlsIHx8ICFwYXNzd29yZCB8fCAhbmFtZSkge1xuICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7IGVycm9yOiAnTmFtZSwgZW1haWwsIGFuZCBwYXNzd29yZCBhcmUgcmVxdWlyZWQuJyB9KTtcbiAgfVxuXG4gIGNvbnN0IG5vcm1hbGl6ZWRFbWFpbCA9IGVtYWlsLnRvTG93ZXJDYXNlKCkudHJpbSgpO1xuXG4gIC8vIFZhbGlkYXRlIHJvbGUgKGRlZmF1bHRzIHRvIFJPTEVfQyAtIFZpZXdlciAvIFJlYWQtT25seSBpZiBub3QgcHJvdmlkZWQgb3IgaW52YWxpZClcbiAgY29uc3QgYWxsb3dlZFJvbGVzID0gWydST0xFX0EnLCAnUk9MRV9CJywgJ1JPTEVfQycsICdST0xFX0QnXTtcbiAgY29uc3QgdXNlclJvbGUgPSBhbGxvd2VkUm9sZXMuaW5jbHVkZXMocm9sZSkgPyByb2xlIDogJ1JPTEVfQyc7XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBleGlzdGluZyA9IGF3YWl0IHByaXNtYS51c2VyLmZpbmRVbmlxdWUoe1xuICAgICAgd2hlcmU6IHsgZW1haWw6IG5vcm1hbGl6ZWRFbWFpbCB9XG4gICAgfSk7XG5cbiAgICBpZiAoZXhpc3RpbmcpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7IGVycm9yOiAnQSB1c2VyIHdpdGggdGhpcyBlbWFpbCBhZGRyZXNzIGFscmVhZHkgZXhpc3RzLicgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgcGFzc3dvcmRIYXNoID0gYXdhaXQgYmNyeXB0Lmhhc2gocGFzc3dvcmQsIDEwKTtcblxuICAgIGNvbnN0IG5ld1VzZXIgPSBhd2FpdCBwcmlzbWEudXNlci5jcmVhdGUoe1xuICAgICAgZGF0YToge1xuICAgICAgICBlbWFpbDogbm9ybWFsaXplZEVtYWlsLFxuICAgICAgICBwYXNzd29yZEhhc2gsXG4gICAgICAgIG5hbWU6IG5hbWUudHJpbSgpLFxuICAgICAgICByb2xlOiB1c2VyUm9sZSxcbiAgICAgICAgLy8gT25seSBST0xFX0QgKFZpZXdlciAyKSB1c2VzIHByb2plY3QgcmVzdHJpY3Rpb25zOyBjbGVhciBmb3IgYWxsIG90aGVyc1xuICAgICAgICBwZXJtaXR0ZWRQcm9qZWN0czogdXNlclJvbGUgPT09ICdST0xFX0QnID8gKHBlcm1pdHRlZFByb2plY3RzID8gU3RyaW5nKHBlcm1pdHRlZFByb2plY3RzKS50cmltKCkgOiAnJykgOiAnJ1xuICAgICAgfSxcbiAgICAgIHNlbGVjdDoge1xuICAgICAgICBpZDogdHJ1ZSxcbiAgICAgICAgZW1haWw6IHRydWUsXG4gICAgICAgIG5hbWU6IHRydWUsXG4gICAgICAgIHJvbGU6IHRydWUsXG4gICAgICAgIHBlcm1pdHRlZFByb2plY3RzOiB0cnVlLFxuICAgICAgICBjcmVhdGVkQXQ6IHRydWVcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMSkuanNvbih7XG4gICAgICBtZXNzYWdlOiAnVXNlciBjcmVhdGVkIHN1Y2Nlc3NmdWxseS4nLFxuICAgICAgdXNlcjogbmV3VXNlclxuICAgIH0pO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gY3JlYXRlIHVzZXI6JywgZXJyKTtcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oeyBlcnJvcjogJ0ZhaWxlZCB0byBjcmVhdGUgdXNlci4nIH0pO1xuICB9XG59XG5cbi8vIFVwZGF0ZSBsb2dpbiB1c2VyIChST0xFX0Egb25seSlcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB1cGRhdGVVc2VyKHJlcSwgcmVzKSB7XG4gIGNvbnN0IHsgdXNlcklkIH0gPSByZXEucGFyYW1zO1xuICBjb25zdCB7IGVtYWlsLCBwYXNzd29yZCwgbmFtZSwgcm9sZSwgcGVybWl0dGVkUHJvamVjdHMgfSA9IHJlcS5ib2R5O1xuXG4gIHRyeSB7XG4gICAgY29uc3QgZXhpc3RpbmcgPSBhd2FpdCBwcmlzbWEudXNlci5maW5kVW5pcXVlKHtcbiAgICAgIHdoZXJlOiB7IGlkOiB1c2VySWQgfVxuICAgIH0pO1xuXG4gICAgaWYgKCFleGlzdGluZykge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgZXJyb3I6ICdVc2VyIG5vdCBmb3VuZC4nIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IHVwZGF0ZURhdGEgPSB7fTtcbiAgICBpZiAoZW1haWwpIHtcbiAgICAgIGNvbnN0IG5vcm1hbGl6ZWRFbWFpbCA9IGVtYWlsLnRvTG93ZXJDYXNlKCkudHJpbSgpO1xuICAgICAgaWYgKG5vcm1hbGl6ZWRFbWFpbCAhPT0gZXhpc3RpbmcuZW1haWwpIHtcbiAgICAgICAgY29uc3QgZW1haWxDaGVjayA9IGF3YWl0IHByaXNtYS51c2VyLmZpbmRVbmlxdWUoe1xuICAgICAgICAgIHdoZXJlOiB7IGVtYWlsOiBub3JtYWxpemVkRW1haWwgfVxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKGVtYWlsQ2hlY2spIHtcbiAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oeyBlcnJvcjogJ0EgdXNlciB3aXRoIHRoaXMgZW1haWwgYWRkcmVzcyBhbHJlYWR5IGV4aXN0cy4nIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB1cGRhdGVEYXRhLmVtYWlsID0gbm9ybWFsaXplZEVtYWlsO1xuICAgIH1cblxuICAgIGlmIChuYW1lKSB1cGRhdGVEYXRhLm5hbWUgPSBuYW1lLnRyaW0oKTtcbiAgICBpZiAocm9sZSkge1xuICAgICAgY29uc3QgYWxsb3dlZFJvbGVzID0gWydST0xFX0EnLCAnUk9MRV9CJywgJ1JPTEVfQycsICdST0xFX0QnXTtcbiAgICAgIGlmIChhbGxvd2VkUm9sZXMuaW5jbHVkZXMocm9sZSkpIHtcbiAgICAgICAgdXBkYXRlRGF0YS5yb2xlID0gcm9sZTtcbiAgICAgICAgLy8gT25seSBST0xFX0QgbmVlZHMgcHJvamVjdCByZXN0cmljdGlvbnM7IGNsZWFyIGZvciBhbGwgb3RoZXIgcm9sZXNcbiAgICAgICAgaWYgKHJvbGUgIT09ICdST0xFX0QnKSB7XG4gICAgICAgICAgdXBkYXRlRGF0YS5wZXJtaXR0ZWRQcm9qZWN0cyA9ICcnO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gT25seSB1cGRhdGUgcGVybWl0dGVkUHJvamVjdHMgaWYgdGhlIHVzZXIgaXMgKG9yIHdpbGwgYmVjb21lKSBST0xFX0RcbiAgICBjb25zdCBlZmZlY3RpdmVSb2xlID0gdXBkYXRlRGF0YS5yb2xlIHx8IGV4aXN0aW5nLnJvbGU7XG4gICAgaWYgKHBlcm1pdHRlZFByb2plY3RzICE9PSB1bmRlZmluZWQgJiYgZWZmZWN0aXZlUm9sZSA9PT0gJ1JPTEVfRCcpIHtcbiAgICAgIHVwZGF0ZURhdGEucGVybWl0dGVkUHJvamVjdHMgPSBTdHJpbmcocGVybWl0dGVkUHJvamVjdHMpLnRyaW0oKTtcbiAgICB9XG5cbiAgICBpZiAocGFzc3dvcmQgJiYgcGFzc3dvcmQudHJpbSgpKSB7XG4gICAgICB1cGRhdGVEYXRhLnBhc3N3b3JkSGFzaCA9IGF3YWl0IGJjcnlwdC5oYXNoKHBhc3N3b3JkLCAxMCk7XG4gICAgfVxuXG4gICAgY29uc3QgdXBkYXRlZCA9IGF3YWl0IHByaXNtYS51c2VyLnVwZGF0ZSh7XG4gICAgICB3aGVyZTogeyBpZDogdXNlcklkIH0sXG4gICAgICBkYXRhOiB1cGRhdGVEYXRhLFxuICAgICAgc2VsZWN0OiB7XG4gICAgICAgIGlkOiB0cnVlLFxuICAgICAgICBlbWFpbDogdHJ1ZSxcbiAgICAgICAgbmFtZTogdHJ1ZSxcbiAgICAgICAgcm9sZTogdHJ1ZSxcbiAgICAgICAgcGVybWl0dGVkUHJvamVjdHM6IHRydWUsXG4gICAgICAgIGNyZWF0ZWRBdDogdHJ1ZVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJlcy5qc29uKHtcbiAgICAgIG1lc3NhZ2U6ICdVc2VyIHVwZGF0ZWQgc3VjY2Vzc2Z1bGx5LicsXG4gICAgICB1c2VyOiB1cGRhdGVkXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byB1cGRhdGUgdXNlcjonLCBlcnIpO1xuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7IGVycm9yOiAnRmFpbGVkIHRvIHVwZGF0ZSB1c2VyLicgfSk7XG4gIH1cbn1cblxuLy8gRGVsZXRlIHVzZXIgYWNjb3VudCAoUk9MRV9BIG9ubHkpXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZGVsZXRlVXNlcihyZXEsIHJlcykge1xuICBjb25zdCB7IHVzZXJJZCB9ID0gcmVxLnBhcmFtcztcblxuICBpZiAodXNlcklkID09PSByZXEudXNlci5pZCkge1xuICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7IGVycm9yOiAnWW91IGNhbm5vdCBkZWxldGUgeW91ciBvd24gbG9nZ2VkLWluIGFjY291bnQuJyB9KTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgY29uc3QgZXhpc3RpbmcgPSBhd2FpdCBwcmlzbWEudXNlci5maW5kVW5pcXVlKHtcbiAgICAgIHdoZXJlOiB7IGlkOiB1c2VySWQgfVxuICAgIH0pO1xuXG4gICAgaWYgKCFleGlzdGluZykge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgZXJyb3I6ICdVc2VyIG5vdCBmb3VuZC4nIH0pO1xuICAgIH1cblxuICAgIC8vIFJ1biBpbiBhIHRyYW5zYWN0aW9uIHRvIGNsZWFuIHVwIGF1ZGl0IGxvZ3MgYmVmb3JlIGRlbGV0aW5nIHRoZSB1c2VyXG4gICAgYXdhaXQgcHJpc21hLiR0cmFuc2FjdGlvbihhc3luYyAodHgpID0+IHtcbiAgICAgIC8vIDEuIERlbGV0ZSBhc3NvY2lhdGVkIGF1ZGl0IGxvZ3MgZm9yIHRoaXMgdXNlclxuICAgICAgYXdhaXQgdHguYXVkaXRMb2cuZGVsZXRlTWFueSh7XG4gICAgICAgIHdoZXJlOiB7IHVzZXJJZCB9XG4gICAgICB9KTtcblxuICAgICAgLy8gMi4gRGVsZXRlIHRoZSB1c2VyIGFjY291bnRcbiAgICAgIGF3YWl0IHR4LnVzZXIuZGVsZXRlKHtcbiAgICAgICAgd2hlcmU6IHsgaWQ6IHVzZXJJZCB9XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHJldHVybiByZXMuanNvbih7IG1lc3NhZ2U6ICdVc2VyIGRlbGV0ZWQgc3VjY2Vzc2Z1bGx5LicgfSk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBkZWxldGUgdXNlcjonLCBlcnIpO1xuICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7IGVycm9yOiAnQ2Fubm90IGRlbGV0ZSB1c2VyIGJlY2F1c2UgdGhleSBoYXZlIHJlY29yZGVkIHByb2plY3Qgb3JkZXJzLicgfSk7XG4gIH1cbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcaHBcXFxcRG93bmxvYWRzXFxcXERpbyBHcmFjZWVcXFxcRGlvIEdyYWNlZVxcXFxiYWNrZW5kXFxcXHNyY1xcXFxyb3V0ZXNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGhwXFxcXERvd25sb2Fkc1xcXFxEaW8gR3JhY2VlXFxcXERpbyBHcmFjZWVcXFxcYmFja2VuZFxcXFxzcmNcXFxccm91dGVzXFxcXGluZGV4LmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9ocC9Eb3dubG9hZHMvRGlvJTIwR3JhY2VlL0RpbyUyMEdyYWNlZS9iYWNrZW5kL3NyYy9yb3V0ZXMvaW5kZXguanNcIjtpbXBvcnQgeyBSb3V0ZXIgfSBmcm9tICdleHByZXNzJztcbmltcG9ydCB7IHZlcmlmeVRva2VuIH0gZnJvbSAnLi4vbWlkZGxld2FyZS9hdXRoLmpzJztcbmltcG9ydCB7IHJlcXVpcmVSb2xlIH0gZnJvbSAnLi4vbWlkZGxld2FyZS9yb2xlR3VhcmQuanMnO1xuaW1wb3J0IHsgY2hlY2tQcm9qZWN0QWNjZXNzIH0gZnJvbSAnLi4vbWlkZGxld2FyZS9wcm9qZWN0R3VhcmQuanMnO1xuaW1wb3J0ICogYXMgYXV0aENvbnRyb2xsZXIgZnJvbSAnLi4vY29udHJvbGxlcnMvYXV0aENvbnRyb2xsZXIuanMnO1xuaW1wb3J0ICogYXMgb3JkZXJDb250cm9sbGVyIGZyb20gJy4uL2NvbnRyb2xsZXJzL29yZGVyQ29udHJvbGxlci5qcyc7XG5pbXBvcnQgKiBhcyBidWlsZGluZ0NvbnRyb2xsZXIgZnJvbSAnLi4vY29udHJvbGxlcnMvYnVpbGRpbmdDb250cm9sbGVyLmpzJztcbmltcG9ydCAqIGFzIGFwYXJ0bWVudENvbnRyb2xsZXIgZnJvbSAnLi4vY29udHJvbGxlcnMvYXBhcnRtZW50Q29udHJvbGxlci5qcyc7XG5pbXBvcnQgKiBhcyBiaWxsaW5nQ29udHJvbGxlciBmcm9tICcuLi9jb250cm9sbGVycy9iaWxsaW5nQ29udHJvbGxlci5qcyc7XG5pbXBvcnQgKiBhcyBleHBvcnRDb250cm9sbGVyIGZyb20gJy4uL2NvbnRyb2xsZXJzL2V4cG9ydENvbnRyb2xsZXIuanMnO1xuaW1wb3J0ICogYXMgYW5hbHl0aWNzQ29udHJvbGxlciBmcm9tICcuLi9jb250cm9sbGVycy9hbmFseXRpY3NDb250cm9sbGVyLmpzJztcbmltcG9ydCAqIGFzIHVzZXJDb250cm9sbGVyIGZyb20gJy4uL2NvbnRyb2xsZXJzL3VzZXJDb250cm9sbGVyLmpzJztcblxuY29uc3Qgcm91dGVyID0gUm91dGVyKCk7XG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuLy8gQXV0aGVudGljYXRpb24gJiBVc2VyIE1hbmFnZW1lbnQgUm91dGVzXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnJvdXRlci5wb3N0KCcvYXV0aC9sb2dpbicsIGF1dGhDb250cm9sbGVyLmxvZ2luKTtcbnJvdXRlci5nZXQoJy9hdXRoL21lJywgdmVyaWZ5VG9rZW4sIGF1dGhDb250cm9sbGVyLm1lKTtcblxucm91dGVyLmdldCgnL3VzZXJzJywgdmVyaWZ5VG9rZW4sIHJlcXVpcmVSb2xlKCdST0xFX0EnKSwgdXNlckNvbnRyb2xsZXIubGlzdFVzZXJzKTtcbnJvdXRlci5wb3N0KCcvdXNlcnMnLCB2ZXJpZnlUb2tlbiwgcmVxdWlyZVJvbGUoJ1JPTEVfQScpLCB1c2VyQ29udHJvbGxlci5jcmVhdGVVc2VyKTtcbnJvdXRlci5wYXRjaCgnL3VzZXJzLzp1c2VySWQnLCB2ZXJpZnlUb2tlbiwgcmVxdWlyZVJvbGUoJ1JPTEVfQScpLCB1c2VyQ29udHJvbGxlci51cGRhdGVVc2VyKTtcbnJvdXRlci5kZWxldGUoJy91c2Vycy86dXNlcklkJywgdmVyaWZ5VG9rZW4sIHJlcXVpcmVSb2xlKCdST0xFX0EnKSwgdXNlckNvbnRyb2xsZXIuZGVsZXRlVXNlcik7XG5cblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4vLyBPcmRlciBSb3V0ZXNcbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxucm91dGVyLmdldCgnL29yZGVycycsIHZlcmlmeVRva2VuLCBvcmRlckNvbnRyb2xsZXIubGlzdE9yZGVycyk7XG5yb3V0ZXIucG9zdCgnL29yZGVycycsIHZlcmlmeVRva2VuLCByZXF1aXJlUm9sZSgnUk9MRV9BJyksIG9yZGVyQ29udHJvbGxlci5jcmVhdGVPcmRlcik7XG5yb3V0ZXIuZ2V0KCcvb3JkZXJzLzpvcmRlcklkJywgdmVyaWZ5VG9rZW4sIGNoZWNrUHJvamVjdEFjY2Vzcywgb3JkZXJDb250cm9sbGVyLmdldE9yZGVyKTtcbnJvdXRlci5kZWxldGUoJy9vcmRlcnMvOm9yZGVySWQnLCB2ZXJpZnlUb2tlbiwgcmVxdWlyZVJvbGUoJ1JPTEVfQScpLCBvcmRlckNvbnRyb2xsZXIuZGVsZXRlT3JkZXIpO1xuXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbi8vIEJ1aWxkaW5nIFJvdXRlc1xuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5yb3V0ZXIuZ2V0KCcvb3JkZXJzLzpvcmRlcklkL2J1aWxkaW5ncycsIHZlcmlmeVRva2VuLCBjaGVja1Byb2plY3RBY2Nlc3MsIGJ1aWxkaW5nQ29udHJvbGxlci5saXN0QnVpbGRpbmdzKTtcbnJvdXRlci5wb3N0KCcvb3JkZXJzLzpvcmRlcklkL2J1aWxkaW5ncycsIHZlcmlmeVRva2VuLCByZXF1aXJlUm9sZSgnUk9MRV9BJyksIGJ1aWxkaW5nQ29udHJvbGxlci5jcmVhdGVCdWlsZGluZyk7XG5yb3V0ZXIuZ2V0KCcvYnVpbGRpbmdzLzpidWlsZGluZ0lkJywgdmVyaWZ5VG9rZW4sIGNoZWNrUHJvamVjdEFjY2VzcywgYnVpbGRpbmdDb250cm9sbGVyLmdldEJ1aWxkaW5nKTtcbnJvdXRlci5wYXRjaCgnL2J1aWxkaW5ncy86YnVpbGRpbmdJZC9jb25maWcnLCB2ZXJpZnlUb2tlbiwgcmVxdWlyZVJvbGUoJ1JPTEVfQScpLCBidWlsZGluZ0NvbnRyb2xsZXIudXBkYXRlQnVpbGRpbmdDb25maWcpO1xucm91dGVyLnBvc3QoJy9idWlsZGluZ3MvY29weScsIHZlcmlmeVRva2VuLCByZXF1aXJlUm9sZSgnUk9MRV9BJyksIGJ1aWxkaW5nQ29udHJvbGxlci5jb3B5QnVpbGRpbmdEYXRhKTtcbnJvdXRlci5kZWxldGUoJy9idWlsZGluZ3MvOmJ1aWxkaW5nSWQnLCB2ZXJpZnlUb2tlbiwgcmVxdWlyZVJvbGUoJ1JPTEVfQScpLCBidWlsZGluZ0NvbnRyb2xsZXIuZGVsZXRlQnVpbGRpbmcpO1xuXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbi8vIEFwYXJ0bWVudCBSb3V0ZXNcbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxucm91dGVyLmdldCgnL2J1aWxkaW5ncy86YnVpbGRpbmdJZC9hcGFydG1lbnRzJywgdmVyaWZ5VG9rZW4sIGNoZWNrUHJvamVjdEFjY2VzcywgYXBhcnRtZW50Q29udHJvbGxlci5saXN0QXBhcnRtZW50cyk7XG5yb3V0ZXIucG9zdCgnL2J1aWxkaW5ncy86YnVpbGRpbmdJZC9hcGFydG1lbnRzJywgdmVyaWZ5VG9rZW4sIHJlcXVpcmVSb2xlKCdST0xFX0EnKSwgYXBhcnRtZW50Q29udHJvbGxlci5jcmVhdGVBcGFydG1lbnQpO1xucm91dGVyLnBhdGNoKCcvYXBhcnRtZW50cy86YXBhcnRtZW50SWQnLCB2ZXJpZnlUb2tlbiwgcmVxdWlyZVJvbGUoJ1JPTEVfQScpLCBjaGVja1Byb2plY3RBY2Nlc3MsIGFwYXJ0bWVudENvbnRyb2xsZXIudXBkYXRlQXBhcnRtZW50KTtcbnJvdXRlci5kZWxldGUoJy9hcGFydG1lbnRzLzphcGFydG1lbnRJZCcsIHZlcmlmeVRva2VuLCByZXF1aXJlUm9sZSgnUk9MRV9BJyksIGFwYXJ0bWVudENvbnRyb2xsZXIuZGVsZXRlQXBhcnRtZW50KTtcbnJvdXRlci5wYXRjaCgnL2J1aWxkaW5ncy86YnVpbGRpbmdJZC9hcGFydG1lbnRzL2JhdGNoJywgdmVyaWZ5VG9rZW4sIHJlcXVpcmVSb2xlKCdST0xFX0EnKSwgY2hlY2tQcm9qZWN0QWNjZXNzLCBhcGFydG1lbnRDb250cm9sbGVyLmJhdGNoVXBkYXRlQXBhcnRtZW50cyk7XG5yb3V0ZXIuZ2V0KCcvYXBhcnRtZW50cy86YXBhcnRtZW50SWQvYXVkaXQtbG9ncycsIHZlcmlmeVRva2VuLCBjaGVja1Byb2plY3RBY2Nlc3MsIGFwYXJ0bWVudENvbnRyb2xsZXIuZ2V0QXVkaXRMb2dzKTtcblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4vLyBCaWxsaW5nIFJvdXRlcyAoU2NvcGVkIHRvIE9yZGVyIGxldmVsKVxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5yb3V0ZXIuZ2V0KCcvb3JkZXJzLzpvcmRlcklkL2JpbGxpbmcvc2V0dXAnLCB2ZXJpZnlUb2tlbiwgY2hlY2tQcm9qZWN0QWNjZXNzLCBiaWxsaW5nQ29udHJvbGxlci5nZXRCaWxsaW5nU2V0dXApO1xucm91dGVyLnB1dCgnL29yZGVycy86b3JkZXJJZC9iaWxsaW5nL3NldHVwJywgdmVyaWZ5VG9rZW4sIHJlcXVpcmVSb2xlKCdST0xFX0EnKSwgYmlsbGluZ0NvbnRyb2xsZXIudXBkYXRlQmlsbGluZ1NldHVwKTtcblxucm91dGVyLmdldCgnL29yZGVycy86b3JkZXJJZC9iaWxsaW5nL2NvbnRyYWN0b3InLCB2ZXJpZnlUb2tlbiwgY2hlY2tQcm9qZWN0QWNjZXNzLCBiaWxsaW5nQ29udHJvbGxlci5nZXRDb250cmFjdG9yQmlsbCk7XG5yb3V0ZXIucHV0KCcvb3JkZXJzLzpvcmRlcklkL2JpbGxpbmcvY29udHJhY3RvcicsIHZlcmlmeVRva2VuLCByZXF1aXJlUm9sZSgnUk9MRV9BJyksIGNoZWNrUHJvamVjdEFjY2VzcywgYmlsbGluZ0NvbnRyb2xsZXIudXBzZXJ0Q29udHJhY3RvckJpbGxMaW5lcyk7XG5cbnJvdXRlci5nZXQoJy9vcmRlcnMvOm9yZGVySWQvYmlsbGluZy9jbGllbnQtcmEnLCB2ZXJpZnlUb2tlbiwgY2hlY2tQcm9qZWN0QWNjZXNzLCBiaWxsaW5nQ29udHJvbGxlci5nZXRDbGllbnRSQUJpbGwpO1xucm91dGVyLnB1dCgnL29yZGVycy86b3JkZXJJZC9iaWxsaW5nL2NsaWVudC1yYScsIHZlcmlmeVRva2VuLCByZXF1aXJlUm9sZSgnUk9MRV9BJyksIGNoZWNrUHJvamVjdEFjY2VzcywgYmlsbGluZ0NvbnRyb2xsZXIudXBzZXJ0Q2xpZW50UkFCaWxsTGluZXMpO1xuXG5yb3V0ZXIuZ2V0KCcvb3JkZXJzLzpvcmRlcklkL2JpbGxpbmcvZGFzaGJvYXJkJywgdmVyaWZ5VG9rZW4sIGNoZWNrUHJvamVjdEFjY2VzcywgYmlsbGluZ0NvbnRyb2xsZXIuZ2V0QmlsbGluZ0Rhc2hib2FyZCk7XG5yb3V0ZXIuZ2V0KCcvb3JkZXJzLzpvcmRlcklkL2FuYWx5dGljcycsIHZlcmlmeVRva2VuLCBjaGVja1Byb2plY3RBY2Nlc3MsIGFuYWx5dGljc0NvbnRyb2xsZXIuZ2V0UHJvamVjdEFuYWx5dGljcyk7XG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuLy8gRXhwb3J0IFJvdXRlXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnJvdXRlci5nZXQoJy9idWlsZGluZ3MvOmJ1aWxkaW5nSWQvZXhwb3J0JywgdmVyaWZ5VG9rZW4sIGNoZWNrUHJvamVjdEFjY2VzcywgZXhwb3J0Q29udHJvbGxlci5leHBvcnRCdWlsZGluZ0dyaWQpO1xuXG5leHBvcnQgZGVmYXVsdCByb3V0ZXI7XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGhwXFxcXERvd25sb2Fkc1xcXFxEaW8gR3JhY2VlXFxcXERpbyBHcmFjZWVcXFxcYmFja2VuZFxcXFxzcmNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGhwXFxcXERvd25sb2Fkc1xcXFxEaW8gR3JhY2VlXFxcXERpbyBHcmFjZWVcXFxcYmFja2VuZFxcXFxzcmNcXFxcaW5kZXguanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL2hwL0Rvd25sb2Fkcy9EaW8lMjBHcmFjZWUvRGlvJTIwR3JhY2VlL2JhY2tlbmQvc3JjL2luZGV4LmpzXCI7aW1wb3J0ICcuL2Vudi5qcyc7XG5pbXBvcnQgZXhwcmVzcyBmcm9tICdleHByZXNzJztcbmltcG9ydCBjb3JzIGZyb20gJ2NvcnMnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IGh0dHAgZnJvbSAnaHR0cCc7XG5pbXBvcnQgeyBmaWxlVVJMVG9QYXRoIH0gZnJvbSAndXJsJztcbmltcG9ydCBhcGlSb3V0ZXIgZnJvbSAnLi9yb3V0ZXMvaW5kZXguanMnO1xuXG5jb25zdCBfX2ZpbGVuYW1lID0gZmlsZVVSTFRvUGF0aChpbXBvcnQubWV0YS51cmwpO1xuY29uc3QgX19kaXJuYW1lID0gcGF0aC5kaXJuYW1lKF9fZmlsZW5hbWUpO1xuXG4vLyBWYWxpZGF0ZSBlbnZpcm9ubWVudCBzZXR0aW5ncyBhdCBzdGFydHVwXG5jb25zdCBpc1Byb2QgPSBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ3Byb2R1Y3Rpb24nO1xuY29uc3Qgand0U2VjcmV0ID0gcHJvY2Vzcy5lbnYuSldUX1NFQ1JFVDtcbmlmIChpc1Byb2QgJiYgKCFqd3RTZWNyZXQgfHwgand0U2VjcmV0ID09PSAnZGlvX2dyYWNlX3NlY3JldF9rZXlfY2hhbmdlX21lX2xhdGVyJykpIHtcbiAgY29uc29sZS5lcnJvcignXFxuPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09Jyk7XG4gIGNvbnNvbGUuZXJyb3IoJ0ZBVEFMOiBKV1RfU0VDUkVUIGVudmlyb25tZW50IHZhcmlhYmxlIGlzIG1pc3Npbmcgb3Igc2V0IHRvJyk7XG4gIGNvbnNvbGUuZXJyb3IoJ3RoZSBkZWZhdWx0IGZhbGxiYWNrIGtleSBpbiBwcm9kdWN0aW9uIG1vZGUuJyk7XG4gIGNvbnNvbGUuZXJyb3IoJ0ZvciBzZWN1cml0eSByZWFzb25zLCB0aGUgc2VydmVyIGNhbm5vdCBzdGFydC4nKTtcbiAgY29uc29sZS5lcnJvcignPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XFxuJyk7XG4gIHByb2Nlc3MuZXhpdCgxKTtcbn1cblxuY29uc3QgYXBwID0gZXhwcmVzcygpO1xuY29uc3QgUE9SVCA9IHByb2Nlc3MuZW52LlBPUlQgfHwgNTAwMDtcblxuLy8gQ29uZmlndXJlIENPUlNcbmNvbnN0IGFsbG93ZWRPcmlnaW5zID0gcHJvY2Vzcy5lbnYuQUxMT1dFRF9PUklHSU5cbiAgPyBwcm9jZXNzLmVudi5BTExPV0VEX09SSUdJTi5zcGxpdCgnLCcpLm1hcChvID0+IG8udHJpbSgpKVxuICA6IFtdO1xuXG5hcHAudXNlKGNvcnMoe1xuICBvcmlnaW46IGlzUHJvZCBcbiAgICA/IChhbGxvd2VkT3JpZ2lucy5sZW5ndGggPiAwID8gYWxsb3dlZE9yaWdpbnMgOiBmYWxzZSkgLy8gQmxvY2sgYWxsIG9yaWdpbnMgaW4gcHJvZCBieSBkZWZhdWx0IGlmIG5vdCBzZXRcbiAgICA6ICcqJywgLy8gQWxsb3cgYWxsIGluIGRldiBtb2RlXG4gIG1ldGhvZHM6IFsnR0VUJywgJ1BPU1QnLCAnUFVUJywgJ1BBVENIJywgJ0RFTEVURScsICdPUFRJT05TJ10sXG4gIGFsbG93ZWRIZWFkZXJzOiBbJ0NvbnRlbnQtVHlwZScsICdBdXRob3JpemF0aW9uJ10sXG4gIGNyZWRlbnRpYWxzOiB0cnVlXG59KSk7XG5cbmFwcC51c2UoZXhwcmVzcy5qc29uKCkpO1xuXG4vLyBNYWluIEFQSSBSb3V0ZVxuYXBwLnVzZSgnL2FwaScsIGFwaVJvdXRlcik7XG5cbi8vIEhlYWx0aCBDaGVja1xuYXBwLmdldCgnL2hlYWx0aCcsIChyZXEsIHJlcykgPT4ge1xuICByZXMuanNvbih7IHN0YXR1czogJ29rJywgdGltZXN0YW1wOiBuZXcgRGF0ZSgpIH0pO1xufSk7XG5cblxuXG4vLyBTZXJ2ZSBzdGF0aWMgYXNzZXRzIGluIHByb2R1Y3Rpb24sIG9yIHByb3h5IHRvIFZpdGUgZGV2IHNlcnZlciBpbiBkZXZlbG9wbWVudFxuaWYgKGlzUHJvZCkge1xuICBjb25zdCBkaXN0UGF0aCA9IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi9mcm9udGVuZC9kaXN0Jyk7XG4gIGlmIChmcy5leGlzdHNTeW5jKGRpc3RQYXRoKSkge1xuICAgIGFwcC51c2UoZXhwcmVzcy5zdGF0aWMoZGlzdFBhdGgpKTtcbiAgICAvLyBGYWxsYmFjayB0byBpbmRleC5odG1sIGZvciBSZWFjdCByb3V0ZXJcbiAgICBhcHAuZ2V0KCcqJywgKHJlcSwgcmVzKSA9PiB7XG4gICAgICByZXMuc2VuZEZpbGUocGF0aC5qb2luKGRpc3RQYXRoLCAnaW5kZXguaHRtbCcpKTtcbiAgICB9KTtcbiAgfVxufSBlbHNlIGlmIChwcm9jZXNzLmVudi5JTlRFR1JBVEVEX1ZJVEUgIT09ICd0cnVlJykge1xuICAvLyBEZXYgbW9kZSBwcm94eSB0byBWaXRlIGRldiBzZXJ2ZXJcbiAgYXBwLnVzZSgocmVxLCByZXMsIG5leHQpID0+IHtcbiAgICBpZiAocmVxLnBhdGguc3RhcnRzV2l0aCgnL2FwaScpIHx8IHJlcS5wYXRoLnN0YXJ0c1dpdGgoJy9oZWFsdGgnKSkge1xuICAgICAgcmV0dXJuIG5leHQoKTtcbiAgICB9XG5cbiAgICBjb25zdCB0YXJnZXRVcmwgPSBgaHR0cDovL2xvY2FsaG9zdDozMDAwJHtyZXEudXJsfWA7XG4gICAgY29uc3QgcHJveHlSZXEgPSBodHRwLnJlcXVlc3QoXG4gICAgICB0YXJnZXRVcmwsXG4gICAgICB7XG4gICAgICAgIG1ldGhvZDogcmVxLm1ldGhvZCxcbiAgICAgICAgaGVhZGVyczogcmVxLmhlYWRlcnMsXG4gICAgICB9LFxuICAgICAgKHByb3h5UmVzKSA9PiB7XG4gICAgICAgIHJlcy53cml0ZUhlYWQocHJveHlSZXMuc3RhdHVzQ29kZSwgcHJveHlSZXMuaGVhZGVycyk7XG4gICAgICAgIHByb3h5UmVzLnBpcGUocmVzLCB7IGVuZDogdHJ1ZSB9KTtcbiAgICAgIH1cbiAgICApO1xuXG4gICAgcHJveHlSZXEub24oJ2Vycm9yJywgKGVycikgPT4ge1xuICAgICAgY29uc29sZS5lcnJvcignUHJveHkgZXJyb3I6JywgZXJyLm1lc3NhZ2UpO1xuICAgICAgcmVzLnN0YXR1cyg1MDIpLnNlbmQoJ1ZpdGUgZGV2IHNlcnZlciBpcyBub3QgcnVubmluZyBvbiBwb3J0IDMwMDAuJyk7XG4gICAgfSk7XG5cbiAgICByZXEucGlwZShwcm94eVJlcSwgeyBlbmQ6IHRydWUgfSk7XG4gIH0pO1xufVxuXG4vLyBFcnJvciBoYW5kbGluZyBtaWRkbGV3YXJlXG5hcHAudXNlKChlcnIsIHJlcSwgcmVzLCBuZXh0KSA9PiB7XG4gIGNvbnNvbGUuZXJyb3IoZXJyLnN0YWNrKTtcbiAgcmVzLnN0YXR1cyg1MDApLmpzb24oeyBlcnJvcjogJ1NvbWV0aGluZyB3ZW50IHdyb25nIG9uIHRoZSBzZXJ2ZXIhJyB9KTtcbn0pO1xuXG5pZiAocHJvY2Vzcy5lbnYuSU5URUdSQVRFRF9WSVRFICE9PSAndHJ1ZScpIHtcbiAgYXBwLmxpc3RlbihQT1JULCAoKSA9PiB7XG4gICAgY29uc29sZS5sb2coYFNlcnZlciBpcyBydW5uaW5nIG9uIHBvcnQgJHtQT1JUfWApO1xuICB9KTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgYXBwO1xuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxocFxcXFxEb3dubG9hZHNcXFxcRGlvIEdyYWNlZVxcXFxEaW8gR3JhY2VlXFxcXGZyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxocFxcXFxEb3dubG9hZHNcXFxcRGlvIEdyYWNlZVxcXFxEaW8gR3JhY2VlXFxcXGZyb250ZW5kXFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9ocC9Eb3dubG9hZHMvRGlvJTIwR3JhY2VlL0RpbyUyMEdyYWNlZS9mcm9udGVuZC92aXRlLmNvbmZpZy5qc1wiO2ltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnO1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0JztcblxuLy8gU2V0IGVudmlyb25tZW50IHZhcmlhYmxlIHRvIHNpZ25pZnkgaW50ZWdyYXRlZCBWaXRlIG1vZGUgZm9yIEV4cHJlc3NcbnByb2Nlc3MuZW52LklOVEVHUkFURURfVklURSA9ICd0cnVlJztcblxuLy8gRHluYW1pY2FsbHkgaW1wb3J0IEV4cHJlc3MgYXBwIHRvIGF2b2lkIEVTTSBob2lzdGluZyBpc3N1ZXNcbmNvbnN0IHsgZGVmYXVsdDogZXhwcmVzc0FwcCB9ID0gYXdhaXQgaW1wb3J0KCcuLi9iYWNrZW5kL3NyYy9pbmRleC5qcycpO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbXG4gICAgcmVhY3QoKSxcbiAgICB7XG4gICAgICBuYW1lOiAnZXhwcmVzcy1iYWNrZW5kJyxcbiAgICAgIGNvbmZpZ3VyZVNlcnZlcihzZXJ2ZXIpIHtcbiAgICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZSgocmVxLCByZXMsIG5leHQpID0+IHtcbiAgICAgICAgICBpZiAocmVxLnVybC5zdGFydHNXaXRoKCcvYXBpJykgfHwgcmVxLnVybC5zdGFydHNXaXRoKCcvaGVhbHRoJykpIHtcbiAgICAgICAgICAgIGV4cHJlc3NBcHAocmVxLCByZXMsIG5leHQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBuZXh0KCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIF0sXG4gIHNlcnZlcjoge1xuICAgIHBvcnQ6IDMwMDAsXG4gICAgaG1yOiB7XG4gICAgICBjbGllbnRQb3J0OiAzMDAwXG4gICAgfVxuICB9XG59KTtc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QSxpQkFBUyxHQUFHLFNBQVMsQ0FBQyxRQUFRO0FBQzVCLGtCQUFRLE1BQU0sZ0JBQWdCLElBQUksT0FBTztBQUN6QyxjQUFJLE9BQU8sR0FBRyxFQUFFLEtBQUssOENBQThDO0FBQUEsUUFDckUsQ0FBQztBQUVELFlBQUksS0FBSyxVQUFVLEVBQUUsS0FBSyxLQUFLLENBQUM7QUFBQSxNQUNsQyxDQUFDO0FBQUEsSUFDSDtBQUdBLFFBQUksSUFBSSxDQUFDLEtBQUssS0FBSyxLQUFLLFNBQVM7QUFDL0IsY0FBUSxNQUFNLElBQUksS0FBSztBQUN2QixVQUFJLE9BQU8sR0FBRyxFQUFFLEtBQUssRUFBRSxPQUFPLHNDQUFzQyxDQUFDO0FBQUEsSUFDdkUsQ0FBQztBQUVELFFBQUksUUFBUSxJQUFJLG9CQUFvQixRQUFRO0FBQzFDLFVBQUksT0FBTyxNQUFNLE1BQU07QUFDckIsZ0JBQVEsSUFBSSw2QkFBNkIsSUFBSSxFQUFFO0FBQUEsTUFDakQsQ0FBQztBQUFBLElBQ0g7QUFFQSxJQUFPLGNBQVE7QUFBQTtBQUFBOzs7QUN4R2lWLFNBQVMsb0JBQW9CO0FBQzdYLE9BQU8sV0FBVztBQUdsQixRQUFRLElBQUksa0JBQWtCO0FBRzlCLElBQU0sRUFBRSxTQUFTLFdBQVcsSUFBSSxNQUFNO0FBRXRDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOO0FBQUEsTUFDRSxNQUFNO0FBQUEsTUFDTixnQkFBZ0IsUUFBUTtBQUN0QixlQUFPLFlBQVksSUFBSSxDQUFDLEtBQUssS0FBSyxTQUFTO0FBQ3pDLGNBQUksSUFBSSxJQUFJLFdBQVcsTUFBTSxLQUFLLElBQUksSUFBSSxXQUFXLFNBQVMsR0FBRztBQUMvRCx1QkFBVyxLQUFLLEtBQUssSUFBSTtBQUFBLFVBQzNCLE9BQU87QUFDTCxpQkFBSztBQUFBLFVBQ1A7QUFBQSxRQUNGLENBQUM7QUFBQSxNQUNIO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLEtBQUs7QUFBQSxNQUNILFlBQVk7QUFBQSxJQUNkO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbIlByaXNtYUNsaWVudCIsICJqd3QiLCAicHJpc21hIiwgIkpXVF9TRUNSRVQiLCAiaXNQcm9kIiwgIlByaXNtYUNsaWVudCIsICJwcmlzbWEiLCAiUHJpc21hQ2xpZW50IiwgInByaXNtYSIsICJQcmlzbWFDbGllbnQiLCAicHJpc21hIiwgIlByaXNtYUNsaWVudCIsICJwcmlzbWEiLCAiUHJpc21hQ2xpZW50IiwgInByaXNtYSIsICJQcmlzbWFDbGllbnQiLCAicHJpc21hIiwgIlByaXNtYUNsaWVudCIsICJiY3J5cHQiLCAicHJpc21hIiwgInBhdGgiLCAiZnMiLCAiZmlsZVVSTFRvUGF0aCIsICJfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsIiwgIl9fZmlsZW5hbWUiLCAiX19kaXJuYW1lIiwgImlzUHJvZCJdCn0K
