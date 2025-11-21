// Use the /api/sync/:id endpoint instead
export interface SyncResult {
  success: boolean;
  message: string;
  syncedCount: number;
  errors: string[];
}

export class ShopifySync {
  async syncProducts(): Promise<SyncResult> {
    throw new Error('Shopify sync is now handled server-side. Use the /api/sync/:id endpoint.');
  }

  async syncOrders(): Promise<SyncResult> {
    throw new Error('Shopify sync is now handled server-side. Use the /api/sync/:id endpoint.');
  }
}

export const shopifySync = new ShopifySync();