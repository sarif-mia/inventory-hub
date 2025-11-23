import { Router } from 'express';
import { databaseService } from '../services/database.js';

const router = Router();

// Dashboard stats endpoint
router.get('/stats', async (req, res) => {
  try {
    const stats = await databaseService.getDashboardStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Recent orders endpoint
router.get('/recent-orders', async (req, res) => {
  try {
    const orders = await databaseService.getRecentOrders();
    res.json(orders);
  } catch (error) {
    console.error('Error fetching recent orders:', error);
    res.status(500).json({ error: 'Failed to fetch recent orders' });
  }
});

// Low stock products endpoint
router.get('/low-stock', async (req, res) => {
  try {
    const products = await databaseService.getLowStockProducts();
    res.json(products);
  } catch (error) {
    console.error('Error fetching low stock products:', error);
    res.status(500).json({ error: 'Failed to fetch low stock products' });
  }
});

// Order status data endpoint
router.get('/order-status', async (req, res) => {
  try {
    const data = await databaseService.getOrderStatusData();
    res.json(data);
  } catch (error) {
    console.error('Error fetching order status data:', error);
    res.status(500).json({ error: 'Failed to fetch order status data' });
  }
});

// Channel data endpoint
router.get('/channels', async (req, res) => {
  try {
    const data = await databaseService.getChannelData();
    res.json(data);
  } catch (error) {
    console.error('Error fetching channel data:', error);
    res.status(500).json({ error: 'Failed to fetch channel data' });
  }
});

// Sales trend data endpoint
router.get('/sales-trend', async (req, res) => {
  try {
    const data = await databaseService.getSalesTrendData();
    res.json(data);
  } catch (error) {
    console.error('Error fetching sales trend data:', error);
    res.status(500).json({ error: 'Failed to fetch sales trend data' });
  }
});

export default router;