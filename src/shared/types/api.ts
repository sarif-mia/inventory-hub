// API Response Types
export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Dashboard Types
export interface DashboardStats {
  totalProducts: number;
  activeOrders: number;
  lowStockCount: number;
  connectedChannels: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email?: string;
  marketplaces?: {
    name: string;
  };
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  total: number;
  subtotal: number;
  tax: number;
  shipping_cost: number;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: string;
  product_id: string;
  marketplace_id: string;
  quantity: number;
  price: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  products?: {
    name: string;
    sku: string;
  };
  marketplaces?: {
    name: string;
  };
  created_at: string;
  updated_at: string;
}

export interface InventoryItemWithDetails extends InventoryItem {
  product_name: string;
  sku: string;
  marketplace_name: string;
}

export interface SalesTrendData {
  day: string;
  sales: number;
}

export interface ChannelData {
  name: string;
  value: number;
}

export interface OrderStatusData {
  name: string;
  value: number;
}

// Product Types
export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  base_price: number;
  cost_price?: number;
  weight?: number;
  category_id?: string;
  supplier_id?: string;
  status: 'active' | 'inactive' | 'discontinued';
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductWithInventory extends Product {
  inventory?: InventoryItem[];
}

// Category Types
export interface Category {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  created_at: string;
}

// Marketplace Types
export interface Marketplace {
  id: string;
  name: string;
  type: 'shopify' | 'amazon' | 'ebay' | 'etsy' | 'walmart' | 'myntra';
  status: 'active' | 'inactive' | 'error';
  store_url?: string;
  connected_at: string;
  last_sync?: string;
  created_at: string;
  updated_at: string;
}

// Analytics Types
export interface AnalyticsOverview {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  lowStockItems: number;
}

export interface AnalyticsData {
  salesData: Array<{
    date: string;
    sales: number;
    orders: number;
    revenue: number;
    profit: number;
  }>;
  topProducts: Array<{
    name: string;
    quantity: number;
    revenue: number;
    profit: number;
    growth: number;
  }>;
  marketplaceData: Array<{
    name: string;
    orders: number;
    revenue: number;
    profit: number;
    growth: number;
  }>;
  orderStatusData: OrderStatusData[];
  summary: {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    inventoryEfficiency: number;
    totalProfit: number;
    revenueGrowth: number;
    orderGrowth: number;
    topProduct: string;
    topProductSales: number;
  };
  productPerformance: Array<{
    name: string;
    sales: number;
    revenue: number;
    efficiency: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  channelComparison: Array<{
    channel: string;
    revenue: number;
    orders: number;
    aov: number;
    conversion: number;
  }>;
  inventoryHealth: {
    total_inventory_items: number;
    in_stock_count: number;
    low_stock_count: number;
    out_of_stock_count: number;
    avg_stock_level: number;
  };
}

// Bulk Upload Types
export interface BulkUploadResult {
  successful: number;
  failed: number;
  errors: string[];
}

// Stock Adjustment Types
export interface StockAdjustment {
  id: string;
  product_id: string;
  marketplace_id?: string;
  adjustment_type: 'increase' | 'decrease' | 'correction';
  quantity: number;
  reason?: string;
  notes?: string;
  created_at: string;
  products?: {
    name: string;
    sku: string;
  };
  marketplaces?: {
    name: string;
  };
}

// Notification Types
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  is_read: boolean;
  created_at: string;
  data?: Record<string, any>;
}

// User Types for Authentication
export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: 'admin' | 'manager' | 'user';
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  role?: 'admin' | 'manager' | 'user';
}

// Supplier Types
export interface Supplier {
  id: string;
  name: string;
  contact_email?: string;
  phone?: string;
  address?: string;
  created_at: string;
}

// Form Types
export interface ProductFormData {
  name: string;
  sku: string;
  description: string;
  base_price: number;
  cost_price?: number;
  weight?: number;
  category_id?: string;
  supplier_id?: string;
  status: 'active' | 'inactive' | 'discontinued';
}

export interface CategoryFormData {
  name: string;
  description: string;
}

export interface MarketplaceFormData {
  name: string;
  type: 'shopify' | 'amazon' | 'ebay' | 'etsy' | 'walmart' | 'myntra';
  store_url?: string;
}

export interface StockAdjustmentFormData {
  product_id: string;
  marketplace_id: string;
  adjustment_type: 'increase' | 'decrease' | 'correction';
  quantity: number;
  reason: string;
}