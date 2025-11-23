import {
  ApiResponse,
  DashboardStats,
  Order,
  InventoryItem,
  SalesTrendData,
  ChannelData,
  OrderStatusData,
  Product,
  ProductWithInventory,
  Category,
  Marketplace,
  AnalyticsOverview,
  AnalyticsData,
  BulkUploadResult,
  StockAdjustment,
  Notification,
  Supplier,
  User,
  AuthTokens,
  LoginCredentials,
  RegisterData,
  ProductFormData,
  CategoryFormData,
  MarketplaceFormData,
  StockAdjustmentFormData
} from '@/types/api';

// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

class ApiClient {
  private baseURL: string;
  private authToken: string | null = null;
  private authInitialized: boolean = false;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  // Authentication methods
  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  clearAuthToken() {
    this.authToken = null;
  }

  setAuthInitialized(initialized: boolean) {
    this.authInitialized = initialized;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    // Add authorization header if token exists
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const config: RequestInit = {
      headers,
      ...options,
    };

    // If this is a protected endpoint (not login/auth endpoints) and no token is set,
    // and auth is not initialized yet, wait a bit for auth to initialize
    const isProtectedEndpoint = !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register') && !endpoint.includes('/health');
    if (isProtectedEndpoint && !this.authToken && !this.authInitialized) {
      // Wait up to 2 seconds for auth to initialize
      let attempts = 0;
      while (!this.authInitialized && attempts < 20) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error instanceof Error ? error : new Error('Unknown error occurred');
    }
  }

  // Dashboard APIs
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await this.request<{ totalProducts: number; activeOrders: number; lowStockCount: number; connectedChannels: number }>('/api/dashboard/stats');
    if (!response) throw new Error('Failed to fetch dashboard stats');
    return response as DashboardStats;
  }

  async getRecentOrders(): Promise<Order[]> {
    const response = await this.request<Order[]>('/api/dashboard/recent-orders');
    return response || [];
  }

  async getLowStockProducts(): Promise<InventoryItem[]> {
    const response = await this.request<InventoryItem[]>('/api/dashboard/low-stock');
    return response || [];
  }

  async getOrderStatusData(): Promise<OrderStatusData[]> {
    const response = await this.request<Array<{ status: string; count: number }>>('/api/dashboard/order-status');
    if (!response) return [];

    return response.map((item) => ({
      name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
      value: item.count
    }));
  }

  async getChannelData(): Promise<ChannelData[]> {
    const response = await this.request<Array<{ name: string; order_count: number }>>('/api/dashboard/channels');
    if (!response) return [];

    return response.map((item) => ({
      name: item.name,
      value: item.order_count
    }));
  }

  async getSalesTrendData(): Promise<SalesTrendData[]> {
    const response = await this.request<Array<{ day: string; sales: number }>>('/api/dashboard/sales-trend');
    if (!response) return [];

    return response.map((item) => ({
      day: item.day,
      sales: item.sales
    }));
  }

  // Product APIs
  async getProducts(): Promise<Product[]> {
    const response = await this.request<Product[]>('/api/products');
    return response || [];
  }

  async getProduct(id: string): Promise<ProductWithInventory | null> {
    const response = await this.request<ProductWithInventory>(`/api/products/${id}`);
    return response || null;
  }

  async createProduct(product: ProductFormData): Promise<Product> {
    const response = await this.request<Product>('/api/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
    if (!response) throw new Error('Failed to create product');
    return response;
  }

  async updateProduct(id: string, product: Partial<ProductFormData>): Promise<Product> {
    const response = await this.request<Product>(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
    if (!response) throw new Error('Failed to update product');
    return response;
  }

  async deleteProduct(id: string): Promise<void> {
    await this.request(`/api/products/${id}`, {
      method: 'DELETE',
    });
  }

  async bulkUploadProducts(products: ProductFormData[]): Promise<BulkUploadResult> {
    const response = await this.request<BulkUploadResult>('/api/products/bulk-upload', {
      method: 'POST',
      body: JSON.stringify({ products }),
    });
    if (!response) throw new Error('Failed to upload products');
    return response;
  }

  // Category APIs
  async getCategories(): Promise<Category[]> {
    const response = await this.request<Category[]>('/api/categories');
    return response || [];
  }

  async createCategory(category: CategoryFormData): Promise<Category> {
    const response = await this.request<Category>('/api/categories', {
      method: 'POST',
      body: JSON.stringify(category),
    });
    if (!response) throw new Error('Failed to create category');
    return response;
  }

  async updateCategory(id: string, category: Partial<CategoryFormData>): Promise<Category> {
    const response = await this.request<Category>(`/api/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(category),
    });
    if (!response) throw new Error('Failed to update category');
    return response;
  }

  async deleteCategory(id: string): Promise<void> {
    await this.request(`/api/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // Order APIs
  async getOrders(): Promise<Order[]> {
    const response = await this.request<Order[]>('/api/orders');
    return response || [];
  }

  async updateOrderStatus(id: string, status: Order['status']): Promise<Order> {
    const response = await this.request<Order>(`/api/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    if (!response) throw new Error('Failed to update order status');
    return response;
  }

  async getPendingOrders(): Promise<Order[]> {
    const response = await this.request<Order[]>('/api/orders/pending');
    return response || [];
  }

  async getShippedOrders(): Promise<Order[]> {
    const response = await this.request<Order[]>('/api/orders/shipped');
    return response || [];
  }

  async getReturns(): Promise<Order[]> {
    const response = await this.request<Order[]>('/api/orders/returns');
    return response || [];
  }

  // Inventory APIs
  async getInventory(): Promise<InventoryItem[]> {
    const response = await this.request<InventoryItem[]>('/api/inventory');
    return response || [];
  }

  async updateInventory(id: string, quantity: number, price: number): Promise<InventoryItem> {
    const response = await this.request<InventoryItem>(`/api/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity, price }),
    });
    if (!response) throw new Error('Failed to update inventory');
    return response;
  }

  async adjustStock(adjustment: StockAdjustmentFormData): Promise<{ success: boolean; newQuantity: number }> {
    const response = await this.request<{ success: boolean; newQuantity: number }>('/api/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify(adjustment),
    });
    if (!response) throw new Error('Failed to adjust stock');
    return response;
  }

  async getStockAdjustments(): Promise<StockAdjustment[]> {
    const response = await this.request<StockAdjustment[]>('/api/stock-adjustments');
    return response || [];
  }

  // Marketplace APIs
  async getMarketplaces(): Promise<Marketplace[]> {
    const response = await this.request<Marketplace[]>('/api/marketplaces');
    return response || [];
  }

  async createMarketplace(marketplace: MarketplaceFormData): Promise<Marketplace> {
    const response = await this.request<Marketplace>('/api/marketplaces', {
      method: 'POST',
      body: JSON.stringify(marketplace),
    });
    if (!response) throw new Error('Failed to create marketplace');
    return response;
  }

  async syncMarketplace(id: string): Promise<{ success: boolean; message: string }> {
    const response = await this.request<{ success: boolean; message: string }>(`/api/sync/${id}`, {
      method: 'POST',
    });
    if (!response) throw new Error('Failed to sync marketplace');
    return response;
  }

  // Analytics APIs
  async getAnalyticsOverview(): Promise<AnalyticsOverview> {
    const response = await this.request<AnalyticsOverview>('/api/analytics/overview');
    if (!response) throw new Error('Failed to fetch analytics overview');
    return response;
  }

  async getAnalytics(): Promise<AnalyticsData> {
    const response = await this.request<AnalyticsData>('/api/analytics');
    if (!response) throw new Error('Failed to fetch analytics');
    return response;
  }

  // Supplier APIs
  async getSuppliers(): Promise<Supplier[]> {
    const response = await this.request<Supplier[]>('/api/suppliers');
    return response || [];
  }

  // Notification APIs
  async getNotifications(): Promise<Notification[]> {
    const response = await this.request<Notification[]>('/api/notifications');
    return response || [];
  }

  async markNotificationAsRead(id: string): Promise<Notification> {
    const response = await this.request<Notification>(`/api/notifications/${id}`, {
      method: 'PUT',
    });
    if (!response) throw new Error('Failed to mark notification as read');
    return response;
  }

  async markAllNotificationsAsRead(): Promise<{ success: boolean }> {
    const response = await this.request<{ success: boolean }>('/api/notifications/mark-all-read', {
      method: 'PUT',
    });
    if (!response) throw new Error('Failed to mark all notifications as read');
    return response;
  }
  async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    const response = await this.request<{ user: User; tokens: AuthTokens }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (!response) throw new Error('Login failed');
    return response;
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    const response = await this.request<{ accessToken: string }>('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
    if (!response) throw new Error('Token refresh failed');
    return response;
  }

  async getProfile(): Promise<{ user: User }> {
    const response = await this.request<{ user: User }>('/api/auth/profile');
    if (!response) throw new Error('Failed to fetch profile');
    return response;
  }

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<{ message: string }> {
    const response = await this.request<{ message: string }>('/api/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response) throw new Error('Password change failed');
    return response;
  }

  async logout(): Promise<{ message: string }> {
    const response = await this.request<{ message: string }>('/api/auth/logout', {
      method: 'POST',
    });
    if (!response) throw new Error('Logout failed');
    return response;
  }

  // Health check
  async healthCheck(): Promise<{ status: string; message: string }> {
    const response = await this.request<{ status: string; message: string }>('/api/health');
    if (!response) throw new Error('Health check failed');
    return response;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;