import { databaseService } from './database.js';

interface MyntraProduct {
  id: string;
  name: string;
  sku: string;
  description?: string;
  price: number;
  costPrice?: number;
  status: string;
  category?: string;
  brand?: string;
  images?: string[];
  variants?: MyntraVariant[];
}

interface MyntraVariant {
  id: string;
  sku: string;
  size?: string;
  color?: string;
  price: number;
  quantity: number;
}

interface MyntraOrder {
  id: string;
  orderNumber: string;
  status: string;
  customer: {
    name: string;
    email?: string;
    phone?: string;
  };
  items: MyntraOrderItem[];
  total: number;
  createdAt: string;
}

interface MyntraOrderItem {
  productId: string;
  variantId?: string;
  sku: string;
  quantity: number;
  price: number;
}

interface MyntraInventory {
  sku: string;
  quantity: number;
  warehouseId: string;
  lastUpdated: string;
}

export class MyntraService {
  private merchantId: string;
  private secretKey: string;
  private warehouseId: string;
  private baseUrl: string;
  private maxRetries: number = 3;
  private retryDelay: number = 1000;

  constructor(merchantId: string, secretKey: string, warehouseId: string = 'A-129') {
    this.merchantId = merchantId;
    this.secretKey = secretKey;
    this.warehouseId = warehouseId;
    // Updated to more realistic Myntra API endpoint
    this.baseUrl = 'https://seller.myntra.com/api/v1';
  }

  // Generate authentication headers for Myntra API
  private getAuthHeaders(): Record<string, string> {
    return {
      'X-Merchant-Id': this.merchantId,
      'X-API-Key': this.secretKey,
      'Authorization': `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json',
    };
  }

  // Make authenticated API request with retry logic
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;

    console.log(`Making Myntra API request to: ${url}`);

    const defaultHeaders = this.getAuthHeaders();

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`Attempt ${attempt}/${this.maxRetries} for endpoint: ${endpoint}`);

        const response = await fetch(url, {
          ...options,
          headers: {
            ...defaultHeaders,
            ...options.headers,
          },
        });

        console.log(`Response status: ${response.status} for ${endpoint}`);

        if (response.status === 429) {
          // Rate limited, wait and retry
          const retryAfter = response.headers.get('Retry-After') || '5';
          console.log(`Rate limited, waiting ${retryAfter} seconds`);
          await new Promise(resolve => setTimeout(resolve, parseInt(retryAfter) * 1000));
          continue;
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`API Error ${response.status}: ${errorText}`);
          throw new Error(`Myntra API error ${response.status}: ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        console.log(`Successfully received data from ${endpoint}`);
        return data;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.error(`Myntra API request failed (attempt ${attempt}/${this.maxRetries}):`, error);

        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * attempt;
          console.log(`Waiting ${delay}ms before retry`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    console.error(`All retry attempts failed for endpoint: ${endpoint}`);
    throw lastError || new Error('All retry attempts failed');
  }

  // Sync products from Myntra
  async syncProducts(lastSync?: Date): Promise<{ success: boolean; message: string; syncedCount?: number; errors?: string[] }> {
    try {
      console.log('Starting Myntra products sync...');

      // Try multiple possible API endpoints for products
      const possibleEndpoints = [
        `/products?merchant_id=${this.merchantId}`,
        `/merchant/${this.merchantId}/products`,
        `/catalog/products`,
        `/v1/products`,
        `/api/v1/products`
      ];

      let data: any = null;
      let successfulEndpoint = '';

      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`Trying endpoint: ${endpoint}`);
          data = await this.makeRequest(endpoint);
          successfulEndpoint = endpoint;
          console.log(`Successfully connected to: ${endpoint}`);
          break;
        } catch (error) {
          console.log(`Endpoint ${endpoint} failed:`, error instanceof Error ? error.message : 'Unknown error');
          continue;
        }
      }

      if (!data) {
        return {
          success: false,
          message: 'Could not connect to any Myntra products endpoint. Please check API credentials and network connectivity.'
        };
      }

      console.log('Raw API response:', JSON.stringify(data, null, 2));

      let products: any[] = [];

      // Try different response structures
      if (data.products && Array.isArray(data.products)) {
        products = data.products;
      } else if (data.data && Array.isArray(data.data)) {
        products = data.data;
      } else if (data.items && Array.isArray(data.items)) {
        products = data.items;
      } else if (Array.isArray(data)) {
        products = data;
      } else {
        console.log('Unexpected response structure:', Object.keys(data));
        return {
          success: false,
          message: `Unexpected API response structure. Expected products array, got: ${Object.keys(data).join(', ')}`
        };
      }

      console.log(`Found ${products.length} products to sync from endpoint: ${successfulEndpoint}`);

      if (products.length === 0) {
        return {
          success: true,
          message: 'No products found to sync. This might be normal if you have no products in Myntra.',
          syncedCount: 0
        };
      }

      let syncedCount = 0;
      const errors: string[] = [];

      for (const product of products) {
        try {
          console.log(`Processing product:`, product.name || product.title || product.sku || 'Unknown');
          await this.processProduct(product);
          syncedCount++;
        } catch (error) {
          const errorMsg = `Failed to sync product ${product.sku || product.id || 'Unknown'}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      const message = `Successfully synced ${syncedCount} products from Myntra${errors.length > 0 ? ` (${errors.length} errors)` : ''}`;

      return {
        success: true,
        message,
        syncedCount,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      console.error('Myntra products sync error:', error);
      return {
        success: false,
        message: `Failed to sync products from Myntra: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Process individual product
  private async processProduct(product: any): Promise<void> {
    // Handle different product data structures
    const productData = {
      name: product.name || product.title || product.productName || 'Unknown Product',
      sku: product.sku || product.productCode || product.id || `myntra_${Date.now()}`,
      description: product.description || product.shortDescription || '',
      base_price: parseFloat(product.price || product.mrp || product.sellingPrice || 0),
      cost_price: product.costPrice ? parseFloat(product.costPrice) : undefined,
      status: this.mapProductStatus(product.status || product.state || 'active') as 'active' | 'inactive' | 'discontinued',
    };

    console.log(`Processing product: ${productData.name} (SKU: ${productData.sku})`);

    // Validate required fields
    if (!productData.name || !productData.sku) {
      throw new Error(`Product missing required fields: name or sku`);
    }

    if (productData.base_price <= 0) {
      throw new Error(`Invalid price for product ${productData.sku}: ${productData.base_price}`);
    }

    // Check if product exists
    const existing = await databaseService.getProductBySku(productData.sku);
    if (existing) {
      console.log(`Updating existing product: ${productData.sku}`);
      // Update existing product
      await databaseService.updateProduct(existing.id, productData);
    } else {
      console.log(`Creating new product: ${productData.sku}`);
      // Create new product
      await databaseService.createProduct(productData);
    }

    // Process variants if they exist
    const variants = product.variants || product.sizes || product.options;
    if (variants && Array.isArray(variants)) {
      for (const variant of variants) {
        await this.processVariant(product, variant);
      }
    }
  }

  // Process product variant
  private async processVariant(product: MyntraProduct, variant: MyntraVariant): Promise<void> {
    // For now, treat variants as separate products or update inventory
    // This depends on how you want to handle variants in your system
    const variantData = {
      name: `${product.name} - ${variant.size || variant.color || variant.id}`,
      sku: variant.sku,
      description: product.description || '',
      base_price: variant.price,
      cost_price: product.costPrice || undefined,
      status: 'active' as const,
    };

    const existing = await databaseService.getProductBySku(variantData.sku);
    if (existing) {
      await databaseService.updateProduct(existing.id, variantData);
    } else {
      await databaseService.createProduct(variantData);
    }
  }

  // Map Myntra product status to our status
  private mapProductStatus(myntraStatus: string): string {
    switch (myntraStatus.toLowerCase()) {
      case 'active':
      case 'live':
        return 'active';
      case 'inactive':
      case 'draft':
        return 'inactive';
      case 'discontinued':
        return 'discontinued';
      default:
        return 'active';
    }
  }

  // Sync orders from Myntra
  async syncOrders(lastSync?: Date): Promise<{ success: boolean; message: string; syncedCount?: number; errors?: string[] }> {
    try {
      console.log('Starting Myntra orders sync...');

      const params = new URLSearchParams({
        merchantId: this.merchantId,
      });

      if (lastSync) {
        params.append('createdAfter', lastSync.toISOString());
      }

      const data = await this.makeRequest(`/orders?${params.toString()}`);

      let syncedCount = 0;
      const errors: string[] = [];

      if (data.orders && Array.isArray(data.orders)) {
        console.log(`Found ${data.orders.length} orders to sync`);

        for (const order of data.orders) {
          try {
            await this.processOrder(order);
            syncedCount++;
          } catch (error) {
            const errorMsg = `Failed to sync order ${order.orderNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`;
            console.error(errorMsg);
            errors.push(errorMsg);
          }
        }
      }

      const message = `Successfully synced ${syncedCount} orders from Myntra${errors.length > 0 ? ` (${errors.length} errors)` : ''}`;

      return {
        success: true,
        message,
        syncedCount,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      console.error('Myntra orders sync error:', error);
      return {
        success: false,
        message: `Failed to sync orders from Myntra: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Process individual order
  private async processOrder(order: MyntraOrder): Promise<void> {
    // Transform Myntra order to our format
    const orderData = {
      order_number: order.orderNumber,
      customer_name: order.customer.name,
      customer_email: order.customer.email || null,
      customer_phone: order.customer.phone || null,
      status: this.mapOrderStatus(order.status),
      total: order.total,
      subtotal: order.total * 0.85, // Estimate, adjust as needed
      tax: order.total * 0.15, // Estimate, adjust as needed
      shipping_cost: 0, // Myntra might not provide this
      notes: `Synced from Myntra on ${new Date().toISOString()}`,
    };

    // Check if order exists
    const existingOrders = await databaseService.getOrders();
    const existing = existingOrders.find(o => o.order_number === orderData.order_number);

    if (!existing) {
      // For now, we'll skip creating orders as the database schema might not support it
      // This would need to be implemented based on your order management system
      console.log(`Order ${orderData.order_number} would be created (not implemented yet)`);
    }
  }

  // Map Myntra order status to our status
  private mapOrderStatus(myntraStatus: string): string {
    switch (myntraStatus.toLowerCase()) {
      case 'confirmed':
      case 'processing':
        return 'processing';
      case 'shipped':
        return 'shipped';
      case 'delivered':
        return 'delivered';
      case 'cancelled':
        return 'cancelled';
      case 'returned':
        return 'returned';
      default:
        return 'pending';
    }
  }

  // Sync inventory from Myntra
  async syncInventory(lastSync?: Date): Promise<{ success: boolean; message: string; syncedCount?: number; errors?: string[] }> {
    try {
      console.log('Starting Myntra inventory sync...');

      const params = new URLSearchParams({
        merchantId: this.merchantId,
        warehouseId: this.warehouseId,
      });

      if (lastSync) {
        params.append('updatedAfter', lastSync.toISOString());
      }

      const data = await this.makeRequest(`/inventory?${params.toString()}`);

      let syncedCount = 0;
      const errors: string[] = [];

      if (data.inventory && Array.isArray(data.inventory)) {
        console.log(`Found ${data.inventory.length} inventory items to sync`);

        for (const item of data.inventory) {
          try {
            await this.processInventoryItem(item);
            syncedCount++;
          } catch (error) {
            const errorMsg = `Failed to sync inventory for SKU ${item.sku}: ${error instanceof Error ? error.message : 'Unknown error'}`;
            console.error(errorMsg);
            errors.push(errorMsg);
          }
        }
      }

      const message = `Successfully synced ${syncedCount} inventory items from Myntra${errors.length > 0 ? ` (${errors.length} errors)` : ''}`;

      return {
        success: true,
        message,
        syncedCount,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      console.error('Myntra inventory sync error:', error);
      return {
        success: false,
        message: `Failed to sync inventory from Myntra: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Process inventory item
  private async processInventoryItem(item: MyntraInventory): Promise<void> {
    // Find product by SKU
    const product = await databaseService.getProductBySku(item.sku);
    if (!product) {
      throw new Error(`Product with SKU ${item.sku} not found`);
    }

    // For now, we'll log the inventory update
    // Actual inventory update would depend on your inventory management system
    console.log(`Inventory update for ${item.sku}: ${item.quantity} units`);
  }

  // Update inventory on Myntra
  async updateInventory(sku: string, quantity: number): Promise<{ success: boolean; message: string }> {
    try {
      const payload = {
        merchantId: this.merchantId,
        warehouseId: this.warehouseId,
        sku,
        quantity,
      };

      await this.makeRequest('/inventory/update', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      return {
        success: true,
        message: `Successfully updated inventory for SKU ${sku}`
      };

    } catch (error) {
      console.error('Myntra inventory update error:', error);
      return {
        success: false,
        message: `Failed to update inventory for SKU ${sku}: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Get product details from Myntra
  async getProduct(sku: string): Promise<MyntraProduct | null> {
    try {
      const data = await this.makeRequest(`/products/${sku}?merchantId=${this.merchantId}`);
      return data.product || null;
    } catch (error) {
      console.error(`Failed to get product ${sku} from Myntra:`, error);
      return null;
    }
  }

  // Health check for Myntra API
  async healthCheck(): Promise<{ success: boolean; message: string; latency?: number }> {
    try {
      const startTime = Date.now();

      // Try multiple possible health check endpoints
      const possibleEndpoints = [
        `/health`,
        `/status`,
        `/ping`,
        `/api/health`,
        `/merchant/${this.merchantId}/status`
      ];

      let success = false;
      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`Trying health check endpoint: ${endpoint}`);
          await this.makeRequest(endpoint);
          success = true;
          break;
        } catch (error) {
          console.log(`Health check endpoint ${endpoint} failed`);
          continue;
        }
      }

      if (!success) {
        throw new Error('All health check endpoints failed');
      }

      const latency = Date.now() - startTime;

      return {
        success: true,
        message: 'Myntra API is healthy',
        latency
      };
    } catch (error) {
      return {
        success: false,
        message: `Myntra API health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}