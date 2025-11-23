export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  category_id?: string;
  supplier_id?: string;
  base_price: number;
  cost_price?: number;
  weight?: number;
  dimensions?: string;
  image_url?: string;
  status: 'active' | 'inactive' | 'discontinued';
  created_at: Date;
  updated_at: Date;
}

export interface Category {
  id: string;
  name: string;
  parent_id?: string;
  description?: string;
  created_at: Date;
}

// User Types for Authentication
export interface User {
  id: string;
  email: string;
  password_hash: string;
  first_name?: string;
  last_name?: string;
  role: 'admin' | 'manager' | 'user';
  is_active: boolean;
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Supplier {
  id: string;
  name: string;
  contact_email?: string;
  phone?: string;
  address?: string;
  created_at: Date;
}

export interface Marketplace {
  id: string;
  name: string;
  type: 'shopify' | 'amazon' | 'ebay' | 'etsy' | 'walmart';
  status: 'active' | 'inactive' | 'error';
  api_key?: string;
  store_url?: string;
  connected_at: Date;
  last_sync?: Date;
  settings?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface Inventory {
  id: string;
  product_id: string;
  marketplace_id: string;
  quantity: number;
  price: number;
  low_stock_threshold: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  created_at: Date;
  updated_at: Date;
}

export interface Order {
  id: string;
  order_number: string;
  marketplace_id: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  shipping_address?: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  payment_status: 'pending' | 'paid' | 'refunded';
  subtotal: number;
  tax: number;
  shipping_cost: number;
  total: number;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: Date;
}

export interface StockAdjustment {
  id: string;
  product_id: string;
  marketplace_id?: string;
  adjustment_type: 'increase' | 'decrease' | 'correction';
  quantity: number;
  reason?: string;
  notes?: string;
  created_at: Date;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  is_read: boolean;
  created_at: Date;
  data?: Record<string, any>;
}

// Query result types
export interface DashboardStats {
  totalProducts: number;
  activeOrders: number;
  lowStockCount: number;
  connectedChannels: number;
}

export interface OrderStatusCount {
  status: string;
  count: number;
}

export interface ChannelOrderCount {
  name: string;
  order_count: number;
}

export interface SalesTrend {
  day: string;
  sales: number;
}

// Form data types
export interface CreateProductData {
  name: string;
  sku: string;
  description?: string;
  base_price: number;
  cost_price?: number;
  weight?: number;
  category_id?: string;
  supplier_id?: string;
  status: 'active' | 'inactive' | 'discontinued';
}

export type UpdateProductData = Partial<CreateProductData>;

export interface CreateCategoryData {
  name: string;
  description?: string;
}

export type UpdateCategoryData = Partial<CreateCategoryData>;

export interface CreateMarketplaceData {
  name: string;
  type: 'shopify' | 'amazon' | 'ebay' | 'etsy' | 'walmart';
  store_url?: string;
}

export interface StockAdjustmentData {
  product_id: string;
  marketplace_id: string;
  adjustment_type: 'increase' | 'decrease' | 'correction';
  quantity: number;
  reason?: string;
}

// Authentication Types
export interface RegisterUserData {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  role?: 'admin' | 'manager' | 'user';
}

export interface LoginUserData {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'admin' | 'manager' | 'user';
  iat?: number;
  exp?: number;
}

// API Response types
export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface BulkUploadResult {
  successful: number;
  failed: number;
  errors: string[];
}