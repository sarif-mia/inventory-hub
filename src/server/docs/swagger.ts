import swaggerJSDoc from 'swagger-jsdoc';

// Swagger definition
export const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Inventory Hub API',
    version: '1.0.0',
    description: 'Professional Multi-Channel Inventory Management System API',
    contact: {
      name: 'API Support',
      email: 'support@inventoryhub.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: process.env.API_BASE_URL || 'http://localhost:3001',
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      // Authentication
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
          },
          password: {
            type: 'string',
            description: 'User password',
            minLength: 6,
          },
        },
      },
      RefreshTokenRequest: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: {
            type: 'string',
            description: 'Valid refresh token',
          },
        },
      },
      ChangePasswordRequest: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: {
            type: 'string',
            description: 'Current password',
          },
          newPassword: {
            type: 'string',
            description: 'New password',
            minLength: 6,
          },
        },
      },

      // User & Auth Responses
      AuthTokens: {
        type: 'object',
        properties: {
          accessToken: {
            type: 'string',
            description: 'JWT access token',
          },
          refreshToken: {
            type: 'string',
            description: 'JWT refresh token',
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Unique user identifier',
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
          },
          first_name: {
            type: 'string',
            description: 'User first name',
          },
          last_name: {
            type: 'string',
            description: 'User last name',
          },
          role: {
            type: 'string',
            enum: ['admin', 'manager', 'user'],
            description: 'User role',
          },
          is_active: {
            type: 'boolean',
            description: 'Account status',
          },
          last_login: {
            type: 'string',
            format: 'date-time',
            description: 'Last login timestamp',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Account creation timestamp',
          },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          user: {
            $ref: '#/components/schemas/User',
          },
          tokens: {
            $ref: '#/components/schemas/AuthTokens',
          },
        },
      },

      // Products
      Product: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Unique product identifier',
          },
          name: {
            type: 'string',
            description: 'Product name',
          },
          sku: {
            type: 'string',
            description: 'Stock Keeping Unit',
          },
          description: {
            type: 'string',
            description: 'Product description',
          },
          category_id: {
            type: 'string',
            description: 'Category identifier',
          },
          supplier_id: {
            type: 'string',
            description: 'Supplier identifier',
          },
          base_price: {
            type: 'number',
            format: 'float',
            description: 'Product base price',
          },
          cost_price: {
            type: 'number',
            format: 'float',
            description: 'Product cost price',
          },
          weight: {
            type: 'number',
            format: 'float',
            description: 'Product weight',
          },
          dimensions: {
            type: 'string',
            description: 'Product dimensions',
          },
          image_url: {
            type: 'string',
            format: 'uri',
            description: 'Product image URL',
          },
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'discontinued'],
            description: 'Product status',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Product creation timestamp',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            description: 'Product last update timestamp',
          },
        },
      },
      CreateProductRequest: {
        type: 'object',
        required: ['name', 'sku', 'base_price', 'status'],
        properties: {
          name: {
            type: 'string',
            description: 'Product name',
          },
          sku: {
            type: 'string',
            description: 'Stock Keeping Unit',
          },
          description: {
            type: 'string',
            description: 'Product description',
          },
          base_price: {
            type: 'number',
            format: 'float',
            description: 'Product base price',
          },
          cost_price: {
            type: 'number',
            format: 'float',
            description: 'Product cost price',
          },
          weight: {
            type: 'number',
            format: 'float',
            description: 'Product weight',
          },
          category_id: {
            type: 'string',
            description: 'Category identifier',
          },
          supplier_id: {
            type: 'string',
            description: 'Supplier identifier',
          },
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'discontinued'],
            description: 'Product status',
          },
        },
      },
      UpdateProductRequest: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Product name',
          },
          sku: {
            type: 'string',
            description: 'Stock Keeping Unit',
          },
          description: {
            type: 'string',
            description: 'Product description',
          },
          base_price: {
            type: 'number',
            format: 'float',
            description: 'Product base price',
          },
          cost_price: {
            type: 'number',
            format: 'float',
            description: 'Product cost price',
          },
          weight: {
            type: 'number',
            format: 'float',
            description: 'Product weight',
          },
          category_id: {
            type: 'string',
            description: 'Category identifier',
          },
          supplier_id: {
            type: 'string',
            description: 'Supplier identifier',
          },
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'discontinued'],
            description: 'Product status',
          },
        },
      },
      BulkUploadRequest: {
        type: 'object',
        required: ['products'],
        properties: {
          products: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/CreateProductRequest',
            },
            description: 'Array of products to upload',
          },
        },
      },

      // Categories
      Category: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Unique category identifier',
          },
          name: {
            type: 'string',
            description: 'Category name',
          },
          parent_id: {
            type: 'string',
            description: 'Parent category identifier',
          },
          description: {
            type: 'string',
            description: 'Category description',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Category creation timestamp',
          },
        },
      },

      // Orders
      Order: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Unique order identifier',
          },
          order_number: {
            type: 'string',
            description: 'Order number',
          },
          marketplace_id: {
            type: 'string',
            description: 'Marketplace identifier',
          },
          customer_name: {
            type: 'string',
            description: 'Customer name',
          },
          customer_email: {
            type: 'string',
            format: 'email',
            description: 'Customer email',
          },
          customer_phone: {
            type: 'string',
            description: 'Customer phone',
          },
          shipping_address: {
            type: 'string',
            description: 'Shipping address',
          },
          status: {
            type: 'string',
            enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
            description: 'Order status',
          },
          payment_status: {
            type: 'string',
            enum: ['pending', 'paid', 'refunded'],
            description: 'Payment status',
          },
          subtotal: {
            type: 'number',
            format: 'float',
            description: 'Order subtotal',
          },
          tax: {
            type: 'number',
            format: 'float',
            description: 'Order tax',
          },
          shipping_cost: {
            type: 'number',
            format: 'float',
            description: 'Shipping cost',
          },
          total: {
            type: 'number',
            format: 'float',
            description: 'Order total',
          },
          notes: {
            type: 'string',
            description: 'Order notes',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Order creation timestamp',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            description: 'Order last update timestamp',
          },
        },
      },

      // Inventory
      Inventory: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Unique inventory identifier',
          },
          product_id: {
            type: 'string',
            description: 'Product identifier',
          },
          marketplace_id: {
            type: 'string',
            description: 'Marketplace identifier',
          },
          quantity: {
            type: 'integer',
            description: 'Available quantity',
          },
          price: {
            type: 'number',
            format: 'float',
            description: 'Inventory price',
          },
          low_stock_threshold: {
            type: 'integer',
            description: 'Low stock threshold',
          },
          status: {
            type: 'string',
            enum: ['in_stock', 'low_stock', 'out_of_stock'],
            description: 'Inventory status',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Inventory creation timestamp',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            description: 'Inventory last update timestamp',
          },
        },
      },

      // Marketplaces
      Marketplace: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Unique marketplace identifier',
          },
          name: {
            type: 'string',
            description: 'Marketplace name',
          },
          type: {
            type: 'string',
            enum: ['shopify', 'amazon', 'ebay', 'etsy', 'walmart', 'myntra'],
            description: 'Marketplace type',
          },
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'error'],
            description: 'Marketplace status',
          },
          store_url: {
            type: 'string',
            format: 'uri',
            description: 'Store URL',
          },
          connected_at: {
            type: 'string',
            format: 'date-time',
            description: 'Connection timestamp',
          },
          last_sync: {
            type: 'string',
            format: 'date-time',
            description: 'Last synchronization timestamp',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Marketplace creation timestamp',
          },
        },
      },
      CreateMarketplaceRequest: {
        type: 'object',
        required: ['name', 'type'],
        properties: {
          name: {
            type: 'string',
            description: 'Marketplace name',
          },
          type: {
            type: 'string',
            enum: ['shopify', 'amazon', 'ebay', 'etsy', 'walmart', 'myntra'],
            description: 'Marketplace type',
          },
          store_url: {
            type: 'string',
            format: 'uri',
            description: 'Store URL',
          },
          settings: {
            type: 'object',
            description: 'Marketplace-specific settings',
          },
        },
      },

      // Dashboard
      DashboardStats: {
        type: 'object',
        properties: {
          totalProducts: {
            type: 'integer',
            description: 'Total number of products',
          },
          activeOrders: {
            type: 'integer',
            description: 'Number of active orders',
          },
          lowStockCount: {
            type: 'integer',
            description: 'Number of low stock items',
          },
          connectedChannels: {
            type: 'integer',
            description: 'Number of connected channels',
          },
        },
      },

      // Analytics
      AnalyticsOverview: {
        type: 'object',
        description: 'Analytics overview data',
      },

      // Notifications
      Notification: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Unique notification identifier',
          },
          title: {
            type: 'string',
            description: 'Notification title',
          },
          message: {
            type: 'string',
            description: 'Notification message',
          },
          type: {
            type: 'string',
            enum: ['info', 'warning', 'error', 'success'],
            description: 'Notification type',
          },
          is_read: {
            type: 'boolean',
            description: 'Read status',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Notification creation timestamp',
          },
        },
      },

      // Suppliers
      Supplier: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Unique supplier identifier',
          },
          name: {
            type: 'string',
            description: 'Supplier name',
          },
          contact_email: {
            type: 'string',
            format: 'email',
            description: 'Contact email',
          },
          phone: {
            type: 'string',
            description: 'Contact phone',
          },
          address: {
            type: 'string',
            description: 'Supplier address',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Supplier creation timestamp',
          },
        },
      },

      // Error Response
      ErrorResponse: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Error message',
          },
          message: {
            type: 'string',
            description: 'Detailed error message',
          },
        },
      },

      // Success Response
      SuccessResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Success status',
          },
          message: {
            type: 'string',
            description: 'Success message',
          },
        },
      },
    },
  },
  tags: [
    {
      name: 'Health',
      description: 'Health check and monitoring endpoints',
    },
    {
      name: 'Authentication',
      description: 'User authentication and authorization',
    },
    {
      name: 'Dashboard',
      description: 'Dashboard statistics and overview',
    },
    {
      name: 'Products',
      description: 'Product management operations',
    },
    {
      name: 'Orders',
      description: 'Order management and tracking',
    },
    {
      name: 'Inventory',
      description: 'Inventory management and stock control',
    },
    {
      name: 'Marketplaces',
      description: 'Multi-channel marketplace integration',
    },
    {
      name: 'Analytics',
      description: 'Analytics and reporting endpoints',
    },
    {
      name: 'Categories',
      description: 'Product categories management',
    },
    {
      name: 'Notifications',
      description: 'System notifications',
    },
    {
      name: 'Suppliers',
      description: 'Supplier management',
    },
  ],
};

// Options for the swagger docs
export const options = {
  definition: swaggerDefinition,
  apis: [
    './routes/*.ts',
    './routes/*.js',
    './index.ts',
    './index.js',
  ],
};

export const swaggerSpec = swaggerJSDoc(options);