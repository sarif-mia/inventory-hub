import { databaseService } from './database.js';
import { Order } from '../types/database.js';

interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  product_type: string;
  vendor: string;
  status: string;
  variants: ShopifyVariant[];
  images: ShopifyImage[];
  body_html?: string;
}

interface ShopifyVariant {
  id: string;
  product_id: string;
  title: string;
  sku: string;
  price: string;
  compare_at_price?: string;
  inventory_quantity: number;
  weight?: number;
  weight_unit?: string;
}

interface ShopifyImage {
  id: string;
  product_id: string;
  src: string;
  alt?: string;
}

interface ShopifyOrder {
  id: string;
  name: string;
  email?: string;
  created_at: string;
  updated_at: string;
  total_price: string;
  subtotal_price: string;
  total_tax: string;
  financial_status: string;
  fulfillment_status?: string;
  line_items: ShopifyOrderItem[];
  customer?: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  shipping_address?: {
    first_name: string;
    last_name: string;
    address1: string;
    city: string;
    province: string;
    country: string;
    zip: string;
    phone?: string;
  };
}

interface ShopifyOrderItem {
  id: string;
  product_id: string;
  variant_id: string;
  title: string;
  sku: string;
  quantity: number;
  price: string;
  total_discount: string;
}

export class ShopifyService {
  private storeUrl: string;
  private adminApiToken: string;
  private baseUrl: string;
  private maxRetries: number = 3;
  private retryDelay: number = 1000;

  constructor(storeUrl: string, adminApiToken: string) {
    this.storeUrl = storeUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    this.adminApiToken = adminApiToken;
    this.baseUrl = `https://${this.storeUrl}/admin/api/2024-01`;
  }

  // Generate authentication headers for Shopify API
  private getAuthHeaders(): Record<string, string> {
    return {
      'X-Shopify-Access-Token': this.adminApiToken,
      'Content-Type': 'application/json',
    };
  }

  // Make authenticated API request with retry logic
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;

    console.log(`Making Shopify API request to: ${url}`);

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
          throw new Error(`Shopify API error ${response.status}: ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        console.log(`Successfully received data from ${endpoint}`);
        return data;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.error(`Shopify API request failed (attempt ${attempt}/${this.maxRetries}):`, error);

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

  // Sync products from Shopify
  async syncProducts(lastSync?: Date): Promise<{ success: boolean; message: string; syncedCount?: number; errors?: string[] }> {
    try {
      console.log('Starting Shopify products sync...');

      let endpoint = '/products.json?limit=250';
      if (lastSync) {
        endpoint += `&updated_at_min=${lastSync.toISOString()}`;
      }

      const data = await this.makeRequest(endpoint);

      if (!data.products || !Array.isArray(data.products)) {
        console.error('Invalid response from Shopify API:', data);
        return {
          success: false,
          message: 'Invalid response from Shopify API - no products array found'
        };
      }

      console.log(`Found ${data.products.length} products to sync`);

      if (data.products.length === 0) {
        return {
          success: true,
          message: 'No products found to sync. This might be normal if you have no products in Shopify.',
          syncedCount: 0
        };
      }

      let syncedCount = 0;
      const errors: string[] = [];

      for (const product of data.products) {
        try {
          console.log(`Processing product: ${product.title} (${product.id})`);
          const result = await this.processProduct(product);
          // Product processed successfully
          syncedCount++;
        } catch (error) {
          const errorMsg = `Failed to sync product ${product.title || product.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      const message = `Successfully synced ${syncedCount} products from Shopify${errors.length > 0 ? ` (${errors.length} errors)` : ''}`;

      return {
        success: true,
        message,
        syncedCount,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      console.error('Shopify products sync error:', error);
      return {
        success: false,
        message: `Failed to sync products from Shopify: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Process individual product
  private async processProduct(product: ShopifyProduct): Promise<void> {
    try {
      // Use the first variant for pricing, or create a base product
      const firstVariant = product.variants && product.variants.length > 0 ? product.variants[0] : null;

      // Generate a unique SKU if none exists
      let sku = firstVariant?.sku?.trim();
      if (!sku) {
        // Create a more unique SKU based on product ID and timestamp
        sku = `shopify_${product.id}_${Date.now()}`;
      }

      // Ensure SKU is not too long for database
      if (sku.length > 255) {
        sku = sku.substring(0, 255);
      }

      // Clean and validate product name
      let name = product.title?.trim() || `Untitled Product ${product.id}`;
      if (name.length > 255) {
        name = name.substring(0, 255);
      }

      // Parse price safely
      let basePrice = 0;
      if (firstVariant?.price) {
        const parsedPrice = parseFloat(firstVariant.price);
        basePrice = isNaN(parsedPrice) ? 0 : Math.max(0, parsedPrice);
      }

      // Parse cost price safely
      let costPrice: number | undefined = undefined;
      if (firstVariant?.compare_at_price) {
        const parsedCost = parseFloat(firstVariant.compare_at_price);
        costPrice = isNaN(parsedCost) ? undefined : Math.max(0, parsedCost);
      }

      const productData = {
        name,
        sku,
        description: product.body_html ? product.body_html.replace(/<[^>]*>/g, '').trim() : '',
        base_price: basePrice,
        cost_price: costPrice,
        status: this.mapProductStatus(product.status) as 'active' | 'inactive' | 'discontinued',
      };

      console.log(`Processing product: ${productData.name} (SKU: ${productData.sku}, Price: $${productData.base_price})`);

      // Validate required fields
      if (!productData.name || !productData.sku) {
        throw new Error(`Product missing required fields: name="${productData.name}", sku="${productData.sku}"`);
      }

      // Check if product exists by SKU
      const existing = await databaseService.getProductBySku(productData.sku);
      if (existing) {
        console.log(`Updating existing product: ${productData.sku}`);
        await databaseService.updateProduct(existing.id, productData);
      } else {
        console.log(`Creating new product: ${productData.sku}`);
        await databaseService.createProduct(productData);
      }

      // For now, skip processing additional variants to avoid complexity
      // Variants can be handled separately if needed in the future

    } catch (error) {
      console.error(`Error processing product ${product.id}:`, error);
      throw new Error(`Failed to process product ${product.title || product.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }


  // Map Shopify product status to our status
  private mapProductStatus(shopifyStatus: string): string {
    switch (shopifyStatus.toLowerCase()) {
      case 'active':
        return 'active';
      case 'draft':
      case 'archived':
        return 'inactive';
      default:
        return 'active';
    }
  }

  // Sync orders from Shopify
  async syncOrders(lastSync?: Date): Promise<{ success: boolean; message: string; syncedCount?: number; errors?: string[] }> {
    try {
      console.log('Starting Shopify orders sync...');
      console.log('Last sync time:', lastSync);

      let endpoint = '/orders.json?limit=250&status=any';
      if (lastSync) {
        endpoint += `&updated_at_min=${lastSync.toISOString()}`;
      }

      const data = await this.makeRequest(endpoint);

      if (!data.orders || !Array.isArray(data.orders)) {
        return {
          success: false,
          message: 'Invalid response from Shopify API - no orders array found'
        };
      }

      console.log(`Found ${data.orders.length} orders to sync`);

      let syncedCount = 0;
      const errors: string[] = [];

      for (const order of data.orders) {
        try {
          console.log(`Processing order: ${order.name}`);
          await this.processOrder(order);
          syncedCount++;
        } catch (error) {
          const errorMsg = `Failed to sync order ${order.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      const message = `Successfully synced ${syncedCount} orders from Shopify${errors.length > 0 ? ` (${errors.length} errors)` : ''}`;

      return {
        success: true,
        message,
        syncedCount,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      console.error('Shopify orders sync error:', error);
      return {
        success: false,
        message: `Failed to sync orders from Shopify: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Process individual order
  private async processOrder(order: ShopifyOrder): Promise<void> {
    try {
      // Get marketplace ID
      const marketplaces = await databaseService.getMarketplaces();
      const shopifyMarketplace = marketplaces.find(m => m.type === 'shopify');

      if (!shopifyMarketplace) {
        throw new Error('No Shopify marketplace found');
      }

      // Check if order already exists
      const existingOrder = await databaseService.getOrderByNumber(order.name);

      if (existingOrder) {
        console.log(`Order ${order.name} already exists, skipping`);
        return;
      }

      // Build customer name
      const customerName = order.customer
        ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim()
        : 'Unknown Customer';

      // Build shipping address
      let shippingAddress = '';
      if (order.shipping_address) {
        const addr = order.shipping_address;
        shippingAddress = `${addr.address1 || ''}, ${addr.city || ''}, ${addr.province || ''} ${addr.zip || ''}, ${addr.country || ''}`.trim();
        if (shippingAddress.startsWith(', ')) shippingAddress = shippingAddress.substring(2);
      }

      // Map Shopify order status to our status
      const orderStatus = this.mapOrderStatus(order.fulfillment_status, order.financial_status);

      // Map Shopify payment status to our status
      const paymentStatus = this.mapPaymentStatus(order.financial_status);

      // Calculate totals
      const subtotal = parseFloat(order.subtotal_price || '0');
      const tax = parseFloat(order.total_tax || '0');
      const shippingCost = 0; // Shopify doesn't provide shipping cost breakdown
      const total = parseFloat(order.total_price || '0');

      // Create the order
      const orderData = {
        order_number: order.name,
        marketplace_id: shopifyMarketplace.id,
        customer_name: customerName,
        customer_email: order.customer?.email || order.email,
        customer_phone: order.customer?.phone || order.shipping_address?.phone,
        shipping_address: shippingAddress,
        status: orderStatus,
        payment_status: paymentStatus,
        subtotal,
        tax,
        shipping_cost: shippingCost,
        total,
        notes: `Shopify Order ID: ${order.id}`
      };

      const createdOrder = await databaseService.createOrder(orderData);
      console.log(`Created order: ${createdOrder.order_number}`);

      // Process order items
      if (order.line_items && Array.isArray(order.line_items)) {
        for (const item of order.line_items) {
          await this.processOrderItem(createdOrder.id, item);
        }
      }

    } catch (error) {
      console.error(`Error processing order ${order.name}:`, error);
      throw new Error(`Failed to process order ${order.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Process individual order item
  private async processOrderItem(orderId: string, item: ShopifyOrderItem): Promise<void> {
    try {
      // Find product by SKU
      const product = await databaseService.getProductBySku(item.sku);
      if (!product) {
        console.log(`Product with SKU ${item.sku} not found for order item, skipping`);
        return;
      }

      const unitPrice = parseFloat(item.price || '0');
      const quantity = item.quantity || 0;
      const totalPrice = unitPrice * quantity;

      await databaseService.createOrderItem({
        order_id: orderId,
        product_id: product.id,
        quantity,
        unit_price: unitPrice,
        total_price: totalPrice
      });

      console.log(`Created order item: ${item.sku} x${quantity}`);

    } catch (error) {
      console.error(`Error processing order item ${item.sku}:`, error);
      throw error;
    }
  }

  // Map Shopify fulfillment status to our order status
  private mapOrderStatus(fulfillmentStatus: string | null | undefined, financialStatus: string): Order['status'] {
    if (fulfillmentStatus === 'fulfilled') {
      return 'delivered';
    } else if (fulfillmentStatus === 'partial') {
      return 'shipped';
    } else if (fulfillmentStatus === 'restocked') {
      return 'returned';
    } else if (financialStatus === 'refunded') {
      return 'cancelled';
    } else {
      return 'pending';
    }
  }

  // Map Shopify financial status to our payment status
  private mapPaymentStatus(financialStatus: string): Order['payment_status'] {
    switch (financialStatus) {
      case 'paid':
      case 'partially_paid':
        return 'paid';
      case 'refunded':
      case 'partially_refunded':
        return 'refunded';
      default:
        return 'pending';
    }
  }

  // Sync inventory from Shopify
  async syncInventory(lastSync?: Date): Promise<{ success: boolean; message: string; syncedCount?: number; errors?: string[] }> {
    try {
      console.log('Starting Shopify inventory sync...');

      // Get all products first, then get inventory levels
      const productsData = await this.makeRequest('/products.json?limit=250&fields=id,variants');

      if (!productsData.products || !Array.isArray(productsData.products)) {
        return {
          success: false,
          message: 'Failed to get products for inventory sync'
        };
      }

      let syncedCount = 0;
      const errors: string[] = [];

      for (const product of productsData.products) {
        if (product.variants && Array.isArray(product.variants)) {
          for (const variant of product.variants) {
            try {
              if (variant.sku) {
                console.log(`Processing inventory for SKU: ${variant.sku}`);
                await this.processInventoryItem(variant);
                syncedCount++;
              }
            } catch (error) {
              const errorMsg = `Failed to sync inventory for SKU ${variant.sku}: ${error instanceof Error ? error.message : 'Unknown error'}`;
              console.error(errorMsg);
              errors.push(errorMsg);
            }
          }
        }
      }

      const message = `Successfully synced ${syncedCount} inventory items from Shopify${errors.length > 0 ? ` (${errors.length} errors)` : ''}`;

      return {
        success: true,
        message,
        syncedCount,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      console.error('Shopify inventory sync error:', error);
      return {
        success: false,
        message: `Failed to sync inventory from Shopify: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Process inventory item
  private async processInventoryItem(variant: ShopifyVariant): Promise<void> {
    // Find product by SKU
    const product = await databaseService.getProductBySku(variant.sku);
    if (!product) {
      console.log(`Product with SKU ${variant.sku} not found, skipping inventory update`);
      return;
    }

    // Get marketplace ID (assuming we have it from the channel)
    // For now, we'll use the first marketplace found
    const marketplaces = await databaseService.getMarketplaces();
    const shopifyMarketplace = marketplaces.find(m => m.type === 'shopify');

    if (!shopifyMarketplace) {
      console.log(`No Shopify marketplace found, skipping inventory update for ${variant.sku}`);
      return;
    }

    const inventoryData = {
      product_id: product.id,
      marketplace_id: shopifyMarketplace.id,
      quantity: variant.inventory_quantity || 0,
      price: parseFloat(variant.price) || 0,
      low_stock_threshold: 10, // Default threshold
      status: (variant.inventory_quantity || 0) > 10 ? 'in_stock' :
              (variant.inventory_quantity || 0) > 0 ? 'low_stock' : 'out_of_stock'
    };

    await databaseService.upsertInventory(inventoryData);
    console.log(`Processed inventory for ${variant.sku}: ${variant.inventory_quantity} units`);
  }

  // Update inventory on Shopify
  async updateInventory(sku: string, quantity: number): Promise<{ success: boolean; message: string }> {
    try {
      // First find the variant by SKU
      const productsData = await this.makeRequest(`/products.json?fields=id,variants&limit=250`);

      let targetVariant: any = null;
      for (const product of productsData.products || []) {
        if (product.variants) {
          for (const variant of product.variants) {
            if (variant.sku === sku) {
              targetVariant = variant;
              break;
            }
          }
          if (targetVariant) break;
        }
      }

      if (!targetVariant) {
        throw new Error(`Variant with SKU ${sku} not found in Shopify`);
      }

      const payload = {
        variant: {
          id: targetVariant.id,
          inventory_quantity: quantity
        }
      };

      await this.makeRequest(`/variants/${targetVariant.id}.json`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      return {
        success: true,
        message: `Successfully updated inventory for SKU ${sku}`
      };

    } catch (error) {
      console.error('Shopify inventory update error:', error);
      return {
        success: false,
        message: `Failed to update inventory for SKU ${sku}: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Get product details from Shopify
  async getProduct(sku: string): Promise<ShopifyProduct | null> {
    try {
      const data = await this.makeRequest(`/products.json?fields=id,title,variants,images&limit=250`);

      for (const product of data.products || []) {
        if (product.variants) {
          for (const variant of product.variants) {
            if (variant.sku === sku) {
              return product;
            }
          }
        }
      }

      return null;
    } catch (error) {
      console.error(`Failed to get product ${sku} from Shopify:`, error);
      return null;
    }
  }

  // Health check for Shopify API
  async healthCheck(): Promise<{ success: boolean; message: string; latency?: number }> {
    try {
      const startTime = Date.now();

      // Try to get shop information
      const data = await this.makeRequest('/shop.json');

      if (!data.shop) {
        throw new Error('Invalid response from Shopify API');
      }

      const latency = Date.now() - startTime;

      return {
        success: true,
        message: `Shopify API is healthy - connected to ${data.shop.name}`,
        latency
      };
    } catch (error) {
      return {
        success: false,
        message: `Shopify API health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}