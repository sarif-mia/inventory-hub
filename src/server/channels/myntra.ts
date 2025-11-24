import { MyntraService } from '../services/myntra.js';
import { databaseService } from '../services/database.js';

interface SyncResult {
  success: boolean;
  message: string;
  syncedCount?: number;
  errors?: string[];
  data?: any;
}

interface ChannelConfig {
  merchantId: string;
  secretKey: string;
  warehouseId?: string;
  returnWarehouseToFacilityCode?: any;
  syncProducts?: boolean;
  syncOrders?: boolean;
  syncInventory?: boolean;
  autoSyncInterval?: number; // in minutes
}

export class MyntraChannel {
  private marketplaceId: string;
  private config: ChannelConfig;
  private service: MyntraService;
  private isInitialized: boolean = false;

  constructor(marketplaceId: string, config: ChannelConfig) {
    this.marketplaceId = marketplaceId;
    this.config = {
      syncProducts: true,
      syncOrders: true,
      syncInventory: true,
      autoSyncInterval: 60, // 1 hour default
      ...config
    };

    this.service = new MyntraService(
      this.config.merchantId,
      this.config.secretKey,
      this.config.warehouseId || 'A-129'
    );
  }

  // Initialize the channel
  async initialize(): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`Initializing Myntra channel ${this.marketplaceId}`);

      // Test API connection
      const healthCheck = await this.service.healthCheck();
      if (!healthCheck.success) {
        return {
          success: false,
          message: `Failed to connect to Myntra API: ${healthCheck.message}`
        };
      }

      this.isInitialized = true;
      console.log(`Myntra channel ${this.marketplaceId} initialized successfully`);

      return {
        success: true,
        message: 'Myntra channel initialized successfully'
      };
    } catch (error) {
      console.error('Myntra channel initialization error:', error);
      return {
        success: false,
        message: `Failed to initialize Myntra channel: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Full sync operation
  async sync(): Promise<SyncResult> {
    try {
      if (!this.isInitialized) {
        const initResult = await this.initialize();
        if (!initResult.success) {
          return {
            success: false,
            message: initResult.message
          };
        }
      }

      console.log(`Starting full sync for Myntra channel ${this.marketplaceId}`);

      const results: SyncResult[] = [];
      let totalSynced = 0;
      let allErrors: string[] = [];

      // Get last sync time
      const marketplace = await databaseService.getMarketplace(this.marketplaceId);
      const lastSync = marketplace?.last_sync || undefined;

      // Sync products
      if (this.config.syncProducts) {
        console.log('Syncing products...');
        const productResult = await this.service.syncProducts(lastSync);
        results.push(productResult);
        if (productResult.syncedCount) totalSynced += productResult.syncedCount;
        if (productResult.errors) allErrors.push(...productResult.errors);
      }

      // Sync orders
      if (this.config.syncOrders) {
        console.log('Syncing orders...');
        const orderResult = await this.service.syncOrders(lastSync);
        results.push(orderResult);
        if (orderResult.syncedCount) totalSynced += orderResult.syncedCount;
        if (orderResult.errors) allErrors.push(...orderResult.errors);
      }

      // Sync inventory
      if (this.config.syncInventory) {
        console.log('Syncing inventory...');
        const inventoryResult = await this.service.syncInventory(lastSync);
        results.push(inventoryResult);
        if (inventoryResult.syncedCount) totalSynced += inventoryResult.syncedCount;
        if (inventoryResult.errors) allErrors.push(...inventoryResult.errors);
      }

      // Update last sync time
      await databaseService.updateMarketplaceLastSync(this.marketplaceId);

      const success = results.every(r => r.success);
      const message = success
        ? `Successfully synced ${totalSynced} items from Myntra${allErrors.length > 0 ? ` (${allErrors.length} errors)` : ''}`
        : `Sync completed with errors. ${totalSynced} items synced, ${allErrors.length} errors`;

      return {
        success,
        message,
        syncedCount: totalSynced,
        errors: allErrors.length > 0 ? allErrors : undefined,
        data: results
      };

    } catch (error) {
      console.error('Myntra channel sync error:', error);
      return {
        success: false,
        message: `Myntra sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Sync only products
  async syncProducts(): Promise<SyncResult> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const marketplace = await databaseService.getMarketplace(this.marketplaceId);
      const lastSync = marketplace?.last_sync || undefined;

      const result = await this.service.syncProducts(lastSync);

      if (result.success) {
        await databaseService.updateMarketplaceLastSync(this.marketplaceId);
      }

      return result;
    } catch (error) {
      console.error('Myntra products sync error:', error);
      return {
        success: false,
        message: `Failed to sync products: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Sync only orders
  async syncOrders(): Promise<SyncResult> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const marketplace = await databaseService.getMarketplace(this.marketplaceId);
      const lastSync = marketplace?.last_sync || undefined;

      const result = await this.service.syncOrders(lastSync);

      if (result.success) {
        await databaseService.updateMarketplaceLastSync(this.marketplaceId);
      }

      return result;
    } catch (error) {
      console.error('Myntra orders sync error:', error);
      return {
        success: false,
        message: `Failed to sync orders: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Sync only inventory
  async syncInventory(): Promise<SyncResult> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const marketplace = await databaseService.getMarketplace(this.marketplaceId);
      const lastSync = marketplace?.last_sync || undefined;

      const result = await this.service.syncInventory(lastSync);

      if (result.success) {
        await databaseService.updateMarketplaceLastSync(this.marketplaceId);
      }

      return result;
    } catch (error) {
      console.error('Myntra inventory sync error:', error);
      return {
        success: false,
        message: `Failed to sync inventory: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Get products from Myntra
  async getProducts(): Promise<any[]> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // This would need to be implemented in the service
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Myntra get products error:', error);
      return [];
    }
  }

  // Get orders from Myntra
  async getOrders(): Promise<any[]> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // This would need to be implemented in the service
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Myntra get orders error:', error);
      return [];
    }
  }

  // Update inventory on Myntra
  async updateInventory(sku: string, quantity: number): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      return await this.service.updateInventory(sku, quantity);
    } catch (error) {
      console.error('Myntra update inventory error:', error);
      return {
        success: false,
        message: `Failed to update inventory: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Get product details from Myntra
  async getProduct(sku: string): Promise<any | null> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      return await this.service.getProduct(sku);
    } catch (error) {
      console.error('Myntra get product error:', error);
      return null;
    }
  }

  // Health check
  async healthCheck(): Promise<{ success: boolean; message: string; latency?: number }> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      return await this.service.healthCheck();
    } catch (error) {
      return {
        success: false,
        message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Get channel configuration
  getConfig(): ChannelConfig {
    return { ...this.config };
  }

  // Update channel configuration
  updateConfig(newConfig: Partial<ChannelConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Check if channel is initialized
  isReady(): boolean {
    return this.isInitialized;
  }

  // Cleanup resources
  async destroy(): Promise<void> {
    this.isInitialized = false;
    // Any cleanup logic here
  }
}