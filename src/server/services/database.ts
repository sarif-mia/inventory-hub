import { Pool, PoolClient } from 'pg';
import {
  Product,
  Category,
  Supplier,
  Marketplace,
  Inventory,
  Order,
  OrderItem,
  StockAdjustment,
  Notification,
  User,
  DashboardStats,
  OrderStatusCount,
  ChannelOrderCount,
  SalesTrend,
  CreateProductData,
  UpdateProductData,
  CreateCategoryData,
  UpdateCategoryData,
  CreateMarketplaceData,
  StockAdjustmentData,
  RegisterUserData,
  BulkUploadResult
} from '../types/database.js';

export class DatabaseService {
  private pool: Pool;

  constructor(databaseUrl?: string) {
    this.pool = new Pool({
      connectionString: databaseUrl || process.env.DATABASE_URL || 'postgresql://admin:password123@localhost:5432/market_sync',
    });
  }

  // Generic query method with error handling
  private async query<T = any>(text: string, params?: any[]): Promise<T[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(text, params);
      return result.rows;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  private async querySingle<T = any>(text: string, params?: any[]): Promise<T | null> {
    const rows = await this.query<T>(text, params);
    return rows.length > 0 ? rows[0] : null;
  }

  // Transaction helper
  async withTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.query('SELECT 1');
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  // Dashboard queries
  async getDashboardStats(): Promise<DashboardStats> {
    const [productsResult, ordersResult, lowStockResult, channelsResult] = await Promise.all([
      this.querySingle<{ count: string }>('SELECT COUNT(*) as count FROM products'),
      this.querySingle<{ count: string }>("SELECT COUNT(*) as count FROM orders WHERE status IN ('pending', 'processing', 'shipped')"),
      this.querySingle<{ count: string }>("SELECT COUNT(*) as count FROM inventory WHERE status = 'low_stock'"),
      this.querySingle<{ count: string }>('SELECT COUNT(*) as count FROM marketplaces')
    ]);

    return {
      totalProducts: parseInt(productsResult?.count || '0'),
      activeOrders: parseInt(ordersResult?.count || '0'),
      lowStockCount: parseInt(lowStockResult?.count || '0'),
      connectedChannels: parseInt(channelsResult?.count || '0'),
    };
  }

  async getRecentOrders(): Promise<Order[]> {
    return this.query<Order>(`
      SELECT o.*, m.name as marketplace_name
      FROM orders o
      LEFT JOIN marketplaces m ON o.marketplace_id = m.id
      ORDER BY o.created_at DESC
      LIMIT 5
    `);
  }

  async getLowStockProducts(): Promise<Inventory[]> {
    return this.query<Inventory>(`
      SELECT i.*, p.name as product_name, p.sku, m.name as marketplace_name
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      JOIN marketplaces m ON i.marketplace_id = m.id
      WHERE i.status = 'low_stock'
      ORDER BY i.quantity ASC
      LIMIT 5
    `);
  }

  async getOrderStatusData(): Promise<OrderStatusCount[]> {
    return this.query<OrderStatusCount>('SELECT status, COUNT(*) as count FROM orders GROUP BY status');
  }

  async getChannelData(): Promise<ChannelOrderCount[]> {
    return this.query<ChannelOrderCount>(`
      SELECT m.name, COUNT(o.id) as order_count
      FROM marketplaces m
      LEFT JOIN orders o ON m.id = o.marketplace_id
      GROUP BY m.id, m.name
    `);
  }

  async getSalesTrendData(): Promise<SalesTrend[]> {
    return this.query<SalesTrend>(`
      SELECT
        TO_CHAR(created_at, 'Dy') as day,
        SUM(total) as sales
      FROM orders
      WHERE status = 'delivered'
      AND created_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY TO_CHAR(created_at, 'Dy')
      ORDER BY TO_CHAR(created_at, 'Dy')
    `);
  }

  // Product operations
  async getProducts(): Promise<Product[]> {
    return this.query<Product>('SELECT * FROM products ORDER BY name');
  }

  async getProduct(id: string): Promise<Product | null> {
    return this.querySingle<Product>('SELECT * FROM products WHERE id = $1', [id]);
  }

  async getProductBySku(sku: string): Promise<Product | null> {
    return this.querySingle<Product>('SELECT * FROM products WHERE sku = $1', [sku]);
  }

  async createProduct(productData: CreateProductData): Promise<Product> {
    const result = await this.query<Product>(
      `INSERT INTO products (name, sku, description, base_price, cost_price, weight, category_id, supplier_id, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       RETURNING *`,
      [
        productData.name,
        productData.sku,
        productData.description,
        productData.base_price,
        productData.cost_price,
        productData.weight,
        productData.category_id,
        productData.supplier_id,
        productData.status
      ]
    );
    return result[0];
  }

  async updateProduct(id: string, productData: UpdateProductData): Promise<Product | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(productData).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) return null;

    fields.push('updated_at = NOW()');
    values.push(id);

    const result = await this.query<Product>(
      `UPDATE products SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.length > 0 ? result[0] : null;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await this.query('DELETE FROM products WHERE id = $1', [id]);
    return result.length > 0;
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return this.query<Category>('SELECT * FROM categories ORDER BY name');
  }

  async createCategory(categoryData: CreateCategoryData): Promise<Category> {
    const result = await this.query<Category>(
      'INSERT INTO categories (name, description, created_at) VALUES ($1, $2, NOW()) RETURNING *',
      [categoryData.name, categoryData.description]
    );
    return result[0];
  }

  async updateCategory(id: string, categoryData: UpdateCategoryData): Promise<Category | null> {
    const result = await this.query<Category>(
      'UPDATE categories SET name = $1, description = $2 WHERE id = $3 RETURNING *',
      [categoryData.name, categoryData.description, id]
    );
    return result.length > 0 ? result[0] : null;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const result = await this.query('DELETE FROM categories WHERE id = $1', [id]);
    return result.length > 0;
  }

  // Marketplace operations
  async getMarketplaces(): Promise<Marketplace[]> {
    return this.query<Marketplace>('SELECT * FROM marketplaces ORDER BY name');
  }

  async getMarketplace(id: string): Promise<Marketplace | null> {
    return this.querySingle<Marketplace>('SELECT * FROM marketplaces WHERE id = $1', [id]);
  }

  async createMarketplace(marketplaceData: CreateMarketplaceData): Promise<Marketplace> {
    const result = await this.query<Marketplace>(
      `INSERT INTO marketplaces (name, type, store_url, status, settings, connected_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), NOW()) RETURNING *`,
      [marketplaceData.name, marketplaceData.type, marketplaceData.store_url, 'active', marketplaceData.settings ? JSON.stringify(marketplaceData.settings) : '{}']
    );
    return result[0];
  }

  async updateMarketplaceLastSync(id: string): Promise<void> {
    await this.query('UPDATE marketplaces SET last_sync = NOW() WHERE id = $1', [id]);
  }

  async deleteMarketplace(id: string): Promise<boolean> {
    return this.withTransaction(async (client) => {
      try {
        console.log(`Starting deletion of marketplace ${id}`);

        // First, delete related records that have RESTRICT constraints
        // Delete stock adjustments for this marketplace
        const stockAdjResult = await client.query('DELETE FROM stock_adjustments WHERE marketplace_id = $1', [id]);
        console.log(`Deleted ${stockAdjResult.rowCount} stock adjustments`);

        // Delete orders for this marketplace
        const ordersResult = await client.query('DELETE FROM orders WHERE marketplace_id = $1', [id]);
        console.log(`Deleted ${ordersResult.rowCount} orders`);

        // Delete inventory records for this marketplace
        const inventoryResult = await client.query('DELETE FROM inventory WHERE marketplace_id = $1', [id]);
        console.log(`Deleted ${inventoryResult.rowCount} inventory records`);

        // Delete products that no longer have any inventory records (orphaned products)
        const orphanedProductsResult = await client.query(`
          DELETE FROM products
          WHERE id NOT IN (
            SELECT DISTINCT product_id FROM inventory
          )
        `);
        console.log(`Deleted ${orphanedProductsResult.rowCount} orphaned products`);

        // Finally, delete the marketplace
        const marketplaceResult = await client.query('DELETE FROM marketplaces WHERE id = $1', [id]);
        console.log(`Deleted ${marketplaceResult.rowCount} marketplace`);

        return (marketplaceResult.rowCount ?? 0) > 0;
      } catch (error) {
        console.error('Error during marketplace deletion:', error);
        throw error;
      }
    });
  }

  // Order operations
  async getOrders(): Promise<Order[]> {
    return this.query<Order>('SELECT * FROM orders ORDER BY created_at DESC');
  }

  async getOrder(id: string): Promise<Order | null> {
    return this.querySingle<Order>('SELECT * FROM orders WHERE id = $1', [id]);
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | null> {
    return this.querySingle<Order>('SELECT * FROM orders WHERE order_number = $1', [orderNumber]);
  }

  async updateOrderStatus(id: string, status: Order['status']): Promise<Order | null> {
    const result = await this.query<Order>(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );
    return result.length > 0 ? result[0] : null;
  }

  async getPendingOrders(): Promise<Order[]> {
    return this.query<Order>("SELECT * FROM orders WHERE status = 'pending' ORDER BY created_at DESC");
  }

  async getShippedOrders(): Promise<Order[]> {
    return this.query<Order>("SELECT * FROM orders WHERE status = 'shipped' ORDER BY created_at DESC");
  }

  async getReturns(): Promise<Order[]> {
    return this.query<Order>("SELECT * FROM orders WHERE status = 'returned' ORDER BY created_at DESC");
  }

  // Create order
  async createOrder(orderData: {
    order_number: string;
    marketplace_id: string;
    customer_name: string;
    customer_email?: string;
    customer_phone?: string;
    shipping_address?: string;
    status: Order['status'];
    payment_status: Order['payment_status'];
    subtotal: number;
    tax: number;
    shipping_cost: number;
    total: number;
    notes?: string;
  }): Promise<Order> {
    const result = await this.query<Order>(
      `INSERT INTO orders (order_number, marketplace_id, customer_name, customer_email, customer_phone, shipping_address, status, payment_status, subtotal, tax, shipping_cost, total, notes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
       RETURNING *`,
      [
        orderData.order_number,
        orderData.marketplace_id,
        orderData.customer_name,
        orderData.customer_email,
        orderData.customer_phone,
        orderData.shipping_address,
        orderData.status,
        orderData.payment_status,
        orderData.subtotal,
        orderData.tax,
        orderData.shipping_cost,
        orderData.total,
        orderData.notes
      ]
    );
    return result[0];
  }

  // Create order item
  async createOrderItem(orderItemData: {
    order_id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }): Promise<OrderItem> {
    const result = await this.query<OrderItem>(
      `INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [
        orderItemData.order_id,
        orderItemData.product_id,
        orderItemData.quantity,
        orderItemData.unit_price,
        orderItemData.total_price
      ]
    );
    return result[0];
  }

  // Inventory operations
  async getInventory(): Promise<Inventory[]> {
    return this.query<Inventory>(`
      SELECT i.*, p.name as product_name, p.sku, m.name as marketplace_name
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      JOIN marketplaces m ON i.marketplace_id = m.id
      ORDER BY p.name
    `);
  }

  async updateInventory(id: string, quantity: number, price: number): Promise<Inventory | null> {
    const result = await this.query<Inventory>(
      'UPDATE inventory SET quantity = $1, price = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [quantity, price, id]
    );
    return result.length > 0 ? result[0] : null;
  }

  async adjustStock(adjustmentData: StockAdjustmentData): Promise<{ success: boolean; newQuantity: number }> {
    return this.withTransaction(async (client) => {
      // Get current inventory
      const currentInv = await client.query(
        'SELECT quantity FROM inventory WHERE product_id = $1 AND marketplace_id = $2',
        [adjustmentData.product_id, adjustmentData.marketplace_id]
      );

      if (currentInv.rows.length === 0) {
        throw new Error('Inventory record not found');
      }

      const currentQuantity = currentInv.rows[0].quantity;
      const newQuantity = adjustmentData.adjustment_type === 'increase'
        ? currentQuantity + adjustmentData.quantity
        : currentQuantity - adjustmentData.quantity;

      // Update inventory
      await client.query(
        'UPDATE inventory SET quantity = $1, updated_at = NOW() WHERE product_id = $2 AND marketplace_id = $3',
        [newQuantity, adjustmentData.product_id, adjustmentData.marketplace_id]
      );

      // Log adjustment
      await client.query(
        `INSERT INTO stock_adjustments (product_id, marketplace_id, adjustment_type, quantity, reason, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          adjustmentData.product_id,
          adjustmentData.marketplace_id,
          adjustmentData.adjustment_type,
          adjustmentData.quantity,
          adjustmentData.reason
        ]
      );

      return { success: true, newQuantity };
    });
  }

  async getStockAdjustments(): Promise<StockAdjustment[]> {
    return this.query<StockAdjustment>(`
      SELECT sa.*, p.name as product_name, p.sku, m.name as marketplace_name
      FROM stock_adjustments sa
      LEFT JOIN products p ON sa.product_id = p.id
      LEFT JOIN marketplaces m ON sa.marketplace_id = m.id
      ORDER BY sa.created_at DESC
    `);
  }

  // Create or update inventory record
  async upsertInventory(inventoryData: {
    product_id: string;
    marketplace_id: string;
    quantity: number;
    price: number;
    low_stock_threshold?: number;
    status: string;
  }): Promise<void> {
    await this.query(`
      INSERT INTO inventory (product_id, marketplace_id, quantity, price, low_stock_threshold, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      ON CONFLICT (product_id, marketplace_id)
      DO UPDATE SET
        quantity = EXCLUDED.quantity,
        price = EXCLUDED.price,
        status = EXCLUDED.status,
        updated_at = NOW()
    `, [
      inventoryData.product_id,
      inventoryData.marketplace_id,
      inventoryData.quantity,
      inventoryData.price,
      inventoryData.low_stock_threshold || 10,
      inventoryData.status
    ]);
  }

  // Bulk operations
  async bulkUploadProducts(products: CreateProductData[]): Promise<BulkUploadResult> {
    const results: BulkUploadResult = {
      successful: 0,
      failed: 0,
      errors: [],
    };

    for (const product of products) {
      try {
        // Validate required fields
        if (!product.name || !product.sku || !product.base_price) {
          results.failed++;
          results.errors.push(`Product ${JSON.stringify(product)}: Missing required fields (name, sku, base_price)`);
          continue;
        }

        // Check if SKU already exists
        const existing = await this.querySingle('SELECT id FROM products WHERE sku = $1', [product.sku]);
        if (existing) {
          results.failed++;
          results.errors.push(`Product ${product.sku}: SKU already exists`);
          continue;
        }

        // Insert product
        await this.query(
          `INSERT INTO products (name, sku, description, base_price, cost_price, weight, category_id, supplier_id, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
          [
            product.name,
            product.sku,
            product.description || '',
            product.base_price,
            product.cost_price || null,
            product.weight || null,
            product.category_id || null,
            product.supplier_id || null,
            product.status
          ]
        );

        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Product ${product.sku || 'unknown'}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return results;
  }

  // Supplier operations
  async getSuppliers(): Promise<Supplier[]> {
    return this.query<Supplier>('SELECT * FROM suppliers ORDER BY name');
  }

  // Notification operations
  async getNotifications(): Promise<Notification[]> {
    return this.query<Notification>('SELECT * FROM notifications ORDER BY created_at DESC');
  }

  async markNotificationAsRead(id: string): Promise<Notification | null> {
    const result = await this.query<Notification>('UPDATE notifications SET is_read = true WHERE id = $1 RETURNING *', [id]);
    return result.length > 0 ? result[0] : null;
  }

  async markAllNotificationsAsRead(): Promise<boolean> {
    await this.query("UPDATE notifications SET is_read = true WHERE is_read = false");
    return true;
  }

  // Analytics
  async getAnalyticsOverview() {
    const [totalProducts, totalOrders, totalRevenue, lowStockItems] = await Promise.all([
      this.querySingle<{ count: string }>('SELECT COUNT(*) as count FROM products'),
      this.querySingle<{ count: string }>('SELECT COUNT(*) as count FROM orders'),
      this.querySingle<{ revenue: string }>('SELECT SUM(total) as revenue FROM orders WHERE status = \'delivered\''),
      this.querySingle<{ count: string }>('SELECT COUNT(*) as count FROM inventory WHERE quantity <= 10')
    ]);

    return {
      totalProducts: parseInt(totalProducts?.count || '0'),
      totalOrders: parseInt(totalOrders?.count || '0'),
      totalRevenue: parseFloat(totalRevenue?.revenue || '0'),
      lowStockItems: parseInt(lowStockItems?.count || '0'),
    };
  }

  async getAnalytics() {
    // Get sales data for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const salesResult = await this.query(
      `SELECT DATE(created_at) as date, SUM(total) as sales, COUNT(*) as order_count
       FROM orders
       WHERE created_at >= $1 AND status = 'delivered'
       GROUP BY DATE(created_at)
       ORDER BY DATE(created_at)`,
      [thirtyDaysAgo.toISOString()]
    );

    const salesData = salesResult.map(row => ({
      date: new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      sales: Math.round(parseFloat(row.sales || '0')),
      orders: parseInt(row.order_count || '0')
    }));

    // Get top products
    const topProductsResult = await this.query(
      `SELECT p.name, SUM(oi.quantity) as quantity, SUM(oi.total_price) as revenue
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       JOIN orders o ON oi.order_id = o.id
       WHERE o.status = 'delivered'
       GROUP BY p.id, p.name
       ORDER BY quantity DESC
       LIMIT 5`
    );

    const topProducts = topProductsResult.map(row => ({
      name: row.name,
      quantity: parseInt(row.quantity || '0'),
      revenue: parseFloat(row.revenue || '0')
    }));

    // Get marketplace data
    const marketplaceResult = await this.query(
      `SELECT m.name, COUNT(o.id) as orders, COALESCE(SUM(o.total), 0) as revenue
       FROM marketplaces m
       LEFT JOIN orders o ON m.id = o.marketplace_id AND o.status = 'delivered'
       GROUP BY m.id, m.name`
    );

    const marketplaceData = marketplaceResult.map(row => ({
      name: row.name,
      orders: parseInt(row.orders || '0'),
      revenue: parseFloat(row.revenue || '0')
    }));

    // Get order status distribution
    const statusResult = await this.query('SELECT status, COUNT(*) as count FROM orders GROUP BY status');
    const orderStatusData = statusResult.map(row => ({
      name: row.status.charAt(0).toUpperCase() + row.status.slice(1),
      value: parseInt(row.count || '0')
    }));

    // Get inventory health metrics
    const inventoryStats = await this.query(`
      SELECT
        COUNT(*) as total_inventory_items,
        SUM(CASE WHEN status = 'in_stock' THEN 1 ELSE 0 END) as in_stock_count,
        SUM(CASE WHEN status = 'low_stock' THEN 1 ELSE 0 END) as low_stock_count,
        SUM(CASE WHEN status = 'out_of_stock' THEN 1 ELSE 0 END) as out_of_stock_count,
        ROUND(AVG(quantity), 2) as avg_stock_level
      FROM inventory
    `);

    const inventoryHealth = inventoryStats[0] || {
      total_inventory_items: 0,
      in_stock_count: 0,
      low_stock_count: 0,
      out_of_stock_count: 0,
      avg_stock_level: 0
    };

    // Get summary stats
    const totalRevenue = salesData.reduce((sum, item) => sum + item.sales, 0);
    const totalOrders = salesData.reduce((sum, item) => sum + item.orders, 0);

    return {
      salesData,
      topProducts,
      marketplaceData,
      orderStatusData,
      inventoryHealth,
      summary: {
        totalRevenue,
        totalOrders,
        topProduct: topProducts.length > 0 ? topProducts[0].name : 'N/A',
        topProductSales: topProducts.length > 0 ? topProducts[0].quantity : 0,
        avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        inventoryEfficiency: inventoryHealth.total_inventory_items > 0 ?
          Math.round((inventoryHealth.in_stock_count / inventoryHealth.total_inventory_items) * 100) : 0
      }
    };
  }

  // User operations for authentication
  async getUserById(id: string): Promise<User | null> {
    return this.querySingle<User>('SELECT * FROM users WHERE id = $1', [id]);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.querySingle<User>('SELECT * FROM users WHERE email = $1', [email]);
  }

  async createUser(userData: Omit<RegisterUserData, 'password'> & { password_hash: string }): Promise<User> {
    const { email, password_hash, first_name, last_name, role = 'user' } = userData;
    const result = await this.query<User>(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      [email, password_hash, first_name, last_name, role, true]
    );
    return result[0];
  }

  async updateUserLastLogin(id: string): Promise<void> {
    await this.query('UPDATE users SET last_login = NOW() WHERE id = $1', [id]);
  }

  async updateUserPassword(id: string, passwordHash: string): Promise<void> {
    await this.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [passwordHash, id]);
  }

  async getUsers(): Promise<User[]> {
    return this.query<User>('SELECT id, email, first_name, last_name, role, is_active, last_login, created_at, updated_at FROM users ORDER BY created_at DESC');
  }

  async updateUser(id: string, userData: Partial<Pick<User, 'first_name' | 'last_name' | 'role' | 'is_active'>>): Promise<User | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(userData).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) return null;

    fields.push('updated_at = NOW()');
    values.push(id);

    const result = await this.query<User>(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING id, email, first_name, last_name, role, is_active, last_login, created_at, updated_at`,
      values
    );

    return result.length > 0 ? result[0] : null;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await this.query('DELETE FROM users WHERE id = $1', [id]);
    return result.length > 0;
  }

  // Close connection pool
  async close(): Promise<void> {
    await this.pool.end();
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();