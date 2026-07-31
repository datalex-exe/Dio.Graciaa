import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleGuard.js';
import { checkProjectAccess } from '../middleware/projectGuard.js';
import * as authController from '../controllers/authController.js';
import * as orderController from '../controllers/orderController.js';
import * as buildingController from '../controllers/buildingController.js';
import * as apartmentController from '../controllers/apartmentController.js';
import * as billingController from '../controllers/billingController.js';
import * as exportController from '../controllers/exportController.js';
import * as analyticsController from '../controllers/analyticsController.js';
import * as userController from '../controllers/userController.js';

const router = Router();

// ==========================================
// Authentication & User Management Routes
// ==========================================
router.post('/auth/login', authController.login);
router.get('/auth/me', verifyToken, authController.me);

router.get('/users', verifyToken, requireRole('ROLE_A'), userController.listUsers);
router.post('/users', verifyToken, requireRole('ROLE_A'), userController.createUser);
router.patch('/users/:userId', verifyToken, requireRole('ROLE_A'), userController.updateUser);
router.delete('/users/:userId', verifyToken, requireRole('ROLE_A'), userController.deleteUser);


// ==========================================
// Order Routes
// ==========================================
router.get('/orders', verifyToken, orderController.listOrders);
router.post('/orders', verifyToken, requireRole('ROLE_A'), orderController.createOrder);
router.get('/orders/:orderId', verifyToken, checkProjectAccess, orderController.getOrder);
router.delete('/orders/:orderId', verifyToken, requireRole('ROLE_A'), orderController.deleteOrder);

// ==========================================
// Building Routes
// ==========================================
router.get('/orders/:orderId/buildings', verifyToken, checkProjectAccess, buildingController.listBuildings);
router.post('/orders/:orderId/buildings', verifyToken, requireRole('ROLE_A'), buildingController.createBuilding);
router.get('/buildings/:buildingId', verifyToken, checkProjectAccess, buildingController.getBuilding);
router.patch('/buildings/:buildingId/config', verifyToken, requireRole('ROLE_A'), buildingController.updateBuildingConfig);
router.post('/buildings/copy', verifyToken, requireRole('ROLE_A'), buildingController.copyBuildingData);
router.delete('/buildings/:buildingId', verifyToken, requireRole('ROLE_A'), buildingController.deleteBuilding);

// ==========================================
// Apartment Routes
// ==========================================
router.get('/buildings/:buildingId/apartments', verifyToken, checkProjectAccess, apartmentController.listApartments);
router.post('/buildings/:buildingId/apartments', verifyToken, requireRole('ROLE_A'), apartmentController.createApartment);
router.patch('/apartments/:apartmentId', verifyToken, requireRole('ROLE_A'), checkProjectAccess, apartmentController.updateApartment);
router.delete('/apartments/:apartmentId', verifyToken, requireRole('ROLE_A'), apartmentController.deleteApartment);
router.patch('/buildings/:buildingId/apartments/batch', verifyToken, requireRole('ROLE_A'), checkProjectAccess, apartmentController.batchUpdateApartments);
router.get('/apartments/:apartmentId/audit-logs', verifyToken, checkProjectAccess, apartmentController.getAuditLogs);

// ==========================================
// Billing Routes (Scoped to Order level)
// ==========================================
router.get('/orders/:orderId/billing/setup', verifyToken, checkProjectAccess, billingController.getBillingSetup);
router.put('/orders/:orderId/billing/setup', verifyToken, requireRole('ROLE_A'), billingController.updateBillingSetup);

router.get('/orders/:orderId/billing/contractor', verifyToken, checkProjectAccess, billingController.getContractorBill);
router.put('/orders/:orderId/billing/contractor', verifyToken, requireRole('ROLE_A'), checkProjectAccess, billingController.upsertContractorBillLines);

router.get('/orders/:orderId/billing/client-ra', verifyToken, checkProjectAccess, billingController.getClientRABill);
router.put('/orders/:orderId/billing/client-ra', verifyToken, requireRole('ROLE_A'), checkProjectAccess, billingController.upsertClientRABillLines);

router.get('/orders/:orderId/billing/dashboard', verifyToken, checkProjectAccess, billingController.getBillingDashboard);
router.get('/orders/:orderId/analytics', verifyToken, checkProjectAccess, analyticsController.getProjectAnalytics);

// ==========================================
// Export Route
// ==========================================
router.get('/buildings/:buildingId/export', verifyToken, checkProjectAccess, exportController.exportBuildingGrid);

export default router;
