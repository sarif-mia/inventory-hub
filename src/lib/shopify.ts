const SHOPIFY_STORE_URL = import.meta.env.VITE_SHOPIFY_STORE_URL;
const SHOPIFY_ADMIN_API_TOKEN = import.meta.env.VITE_SHOPIFY_ADMIN_API_TOKEN;
const SHOPIFY_STOREFRONT_TOKEN = import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN;

class ShopifyAPI {
  private adminBaseUrl: string;
  private storefrontBaseUrl: string;

  constructor() {
    console.log('Shopify Environment Variables Check:');
    console.log('VITE_SHOPIFY_STORE_URL:', SHOPIFY_STORE_URL);
    console.log('VITE_SHOPIFY_ADMIN_API_TOKEN exists:', !!SHOPIFY_ADMIN_API_TOKEN);
    console.log('VITE_SHOPIFY_STOREFRONT_TOKEN exists:', !!SHOPIFY_STOREFRONT_TOKEN);

    if (!SHOPIFY_STORE_URL || !SHOPIFY_ADMIN_API_TOKEN) {
      console.error('Shopify credentials not configured properly');
      throw new Error('Shopify credentials not configured properly');
    }

    // Use nginx proxy to avoid CORS issues
    this.adminBaseUrl = `/api/shopify`;
    this.storefrontBaseUrl = `https://${SHOPIFY_STORE_URL.replace('https://', '')}/api/2023-10/graphql.json`;

    console.log('Shopify API URLs configured:', {
      adminBaseUrl: this.adminBaseUrl,
      storefrontBaseUrl: this.storefrontBaseUrl,
    });
  }

  private async adminRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.adminBaseUrl}${endpoint}`;
    console.log('Making Shopify API request to:', url);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': SHOPIFY_ADMIN_API_TOKEN,
          ...options.headers,
        },
      });

      console.log('Shopify API response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Shopify API error response:', errorText);
        throw new Error(`Shopify API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Shopify API response data:', data);
      return data;
    } catch (error) {
      console.error('Shopify API request failed:', error);
      throw error;
    }
  }

  private async storefrontRequest(query: string, variables: Record<string, unknown> = {}) {
    const response = await fetch(this.storefrontBaseUrl, {
      method: 'POST',
      headers: {
        'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`Shopify Storefront API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    if (result.errors) {
      throw new Error(`GraphQL errors: ${result.errors.map((e: { message: string }) => e.message).join(', ')}`);
    }

    return result.data;
  }

  // Fetch products from Shopify Admin API
  async getProducts(limit: number = 50, sinceId?: string) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      fields: 'id,title,variants,images,description,status,created_at,updated_at',
    });

    if (sinceId) {
      params.append('since_id', sinceId);
    }

    return this.adminRequest(`/products.json?${params}`);
  }

  // Fetch orders from Shopify Admin API
  async getOrders(limit: number = 50, sinceId?: string, status?: string) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      fields: 'id,name,email,total_price,subtotal_price,total_tax,total_discounts,created_at,updated_at,line_items,customer,shipping_address,billing_address,fulfillments',
    });

    if (sinceId) {
      params.append('since_id', sinceId);
    }

    if (status) {
      params.append('status', status);
    }

    return this.adminRequest(`/orders.json?${params}`);
  }

  // Test API connection
  async testConnection() {
    try {
      console.log('Testing Shopify API connection...');
      // Use a simple endpoint that doesn't require specific permissions
      const result = await this.adminRequest('.json');
      console.log('Shopify API connection successful:', result);
      return { success: true, data: result };
    } catch (error) {
      console.error('Shopify API connection failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Fetch product count
  async getProductCount() {
    return this.adminRequest('/products/count.json');
  }

  // Fetch order count
  async getOrderCount(status?: string) {
    const params = status ? `?status=${status}` : '';
    return this.adminRequest(`/orders/count.json${params}`);
  }

  // Fetch shop info including currency
  async getShopInfo() {
    return this.adminRequest('/shop.json');
  }

  // Storefront API methods for public data
  async getStorefrontProducts(first: number = 10, after?: string) {
    const query = `
      query GetProducts($first: Int!, $after: String) {
        products(first: $first, after: $after) {
          edges {
            node {
              id
              title
              description
              images(first: 1) {
                edges {
                  node {
                    url
                    altText
                  }
                }
              }
              variants(first: 1) {
                edges {
                  node {
                    id
                    price {
                      amount
                      currencyCode
                    }
                    compareAtPrice {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
            cursor
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
          }
        }
      }
    `;

    return this.storefrontRequest(query, { first, after });
  }
}

export const shopifyAPI = new ShopifyAPI();