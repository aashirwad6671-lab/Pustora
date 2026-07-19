import { createClient } from '@supabase/supabase-js';
import { ApiResponse } from './api.types';
import { Product, Order, Profile, Coupon, Store } from '../types';

const isServer = typeof window === 'undefined';

// Module-level flag so AdminService methods can reference it
let isServiceRoleReal = false;

function getAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceRoleKey = isServer ? (process.env.SUPABASE_SERVICE_ROLE_KEY || '') : '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is not set.');
  }

  // Use service role key if it's set and not a placeholder, otherwise fall back to anon key
  isServiceRoleReal =
    serviceRoleKey.length > 20 &&
    !serviceRoleKey.includes('placeholder') &&
    !serviceRoleKey.includes('your-supabase');

  const activeKey = isServer && isServiceRoleReal ? serviceRoleKey : anonKey;

  return createClient(supabaseUrl, activeKey, {
    auth: {
      persistSession: false,
    },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _adminSupabase: any = null;
export function getSupabaseClient() {
  if (!_adminSupabase) {
    _adminSupabase = getAdminSupabase();
  }
  return _adminSupabase;
}
// Keep backward compatibility
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const adminSupabase = new Proxy({} as any, {
  get(_target: any, prop: string | symbol) {
    return (getSupabaseClient() as any)[prop];
  },

});

async function clientCall(action: string, ...args: any[]): Promise<ApiResponse<any>> {
  try {
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, args }),
    });
    return await res.json();
  } catch (err: any) {
    return { data: null, error: err.message || 'Network error', status: 500 };
  }
}

export class AdminService {
  // ------------------------------------------
  // ACCESS STATUS
  // ------------------------------------------
  static async checkAccessStatus(): Promise<ApiResponse<boolean>> {
    if (!isServer) {
      return clientCall('checkAccessStatus');
    }
    // Initialize the client so isServiceRoleReal is evaluated
    getSupabaseClient();
    return { data: isServiceRoleReal, error: null, status: 200 };
  }

  // ------------------------------------------
  // 1. DASHBOARD & ANALYTICS MODULE
  // ------------------------------------------
  static async getOverviewMetrics(): Promise<ApiResponse<{
    todayRevenue: number;
    pendingOrdersCount: number;
    totalUsers: number;
    lowStockCount: number;
    hourlySales: number[];
  }>> {
    if (!isServer) {
      return clientCall('getOverviewMetrics');
    }
    try {
      // Run concurrent aggregated counts on Supabase
      const [ordersRes, usersRes, stockRes] = await Promise.all([
        adminSupabase.from('orders').select('grand_total, status'),
        adminSupabase.from('profiles').select('id', { count: 'exact' }),
        adminSupabase.from('inventory').select('id').lt('stock_quantity', 15),
      ]);

      const allOrders = ordersRes.data || [];
      const todayRevenue = allOrders
        .filter((o: any) => o.status === 'delivered')
        .reduce((sum: any, o: any) => sum + parseFloat(o.grand_total.toString()), 0);

      const pendingOrdersCount = allOrders.filter((o: any) => o.status !== 'delivered' && o.status !== 'cancelled').length;
      const totalUsers = usersRes.count || 0;
      const lowStockCount = stockRes.data?.length || 0;

      // Simulated sales density vectors for analytics
      const hourlySales = [1200, 3400, 8900, 15400, 11200, 18900, 22400, 19500, 14200];

      return {
        data: {
          todayRevenue: Math.round(todayRevenue),
          pendingOrdersCount,
          totalUsers,
          lowStockCount,
          hourlySales,
        },
        error: null,
        status: 200,
      };
    } catch (err: any) {
      return { data: null, error: err.message, status: 500 };
    }
  }

  // ------------------------------------------
  // 2. PRODUCT CRUD MODULE
  // ------------------------------------------
  static async getProducts(): Promise<ApiResponse<Product[]>> {
    if (!isServer) {
      return clientCall('getProducts');
    }
    try {
      const { data, error } = await adminSupabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) return { data: null, error: error.message, status: 400 };
      return { data: data as Product[], error: null, status: 200 };
    } catch (err: any) {
      return { data: null, error: err.message, status: 500 };
    }
  }

  static async addProduct(productData: Partial<Product>, initialStock: number): Promise<ApiResponse<Product>> {
    if (!isServer) {
      return clientCall('addProduct', productData, initialStock);
    }
    try {
      const priceNum = Number(productData.price);
      const mrpNum = Number(productData.mrp);
      const stockNum = Number(initialStock);

      if (isNaN(priceNum) || isNaN(mrpNum) || isNaN(stockNum)) {
        return { data: null, error: 'Price, MRP, and Stock must be valid numbers', status: 400 };
      }

      // 1. Insert product record
      const { data: product, error: prodErr } = await adminSupabase
        .from('products')
        .insert({
          category_id: productData.category_id,
          sub_category: productData.sub_category,
          name: productData.name,
          brand: productData.brand,
          description: productData.description || '',
          price: priceNum,
          mrp: mrpNum,
          image_url: productData.image_url,
          grade_suitability: productData.grade_suitability,
          subject_tag: productData.subject_tag,
          stock_quantity: stockNum, // Map to stock_quantity column in products table
        })
        .select()
        .single();

      if (prodErr) return { data: null, error: prodErr.message, status: 400 };

      // 2. Insert corresponding inventory record (supporting double write in case inventory table is also used)
      try {
        await adminSupabase.from('inventory').insert({
          product_id: product.id,
          stock_quantity: stockNum,
        });
      } catch (invErr) {
        console.warn('Inventory table insertion skipped/failed:', invErr);
      }

      return { data: product as Product, error: null, status: 200 };
    } catch (err: any) {
      return { data: null, error: err.message, status: 500 };
    }
  }

  static async deleteProduct(id: string): Promise<ApiResponse<boolean>> {
    if (!isServer) {
      return clientCall('deleteProduct', id);
    }
    try {
      const { error } = await adminSupabase.from('products').delete().eq('id', id);
      if (error) return { data: null, error: error.message, status: 400 };
      return { data: true, error: null, status: 200 };
    } catch (err: any) {
      return { data: null, error: err.message, status: 500 };
    }
  }

  // ------------------------------------------
  // 3. LIVE ORDER DISPATCH MODULE
  // ------------------------------------------
  static async getOrders(): Promise<ApiResponse<Order[]>> {
    if (!isServer) {
      return clientCall('getOrders');
    }
    try {
      const { data, error } = await adminSupabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) return { data: null, error: error.message, status: 400 };
      return { data: data as Order[], error: null, status: 200 };
    } catch (err: any) {
      return { data: null, error: err.message, status: 500 };
    }
  }

  static async updateOrderStatus(orderId: string, status: Order['status']): Promise<ApiResponse<boolean>> {
    if (!isServer) {
      return clientCall('updateOrderStatus', orderId, status);
    }
    try {
      const { error } = await adminSupabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) return { data: null, error: error.message, status: 400 };
      return { data: true, error: null, status: 200 };
    } catch (err: any) {
      return { data: null, error: err.message, status: 500 };
    }
  }

  // ------------------------------------------
  // 4. INVENTORY STOCK MANAGEMENT MODULE
  // ------------------------------------------
  static async getInventoryLevels(): Promise<ApiResponse<any[]>> {
    if (!isServer) {
      return clientCall('getInventoryLevels');
    }
    try {
      const { data, error } = await adminSupabase
        .from('inventory')
        .select(`
          id,
          stock_quantity,
          low_stock_threshold,
          products (
            id,
            name,
            brand,
            price
          )
        `);

      if (error) return { data: null, error: error.message, status: 400 };
      return { data: data as any[], error: null, status: 200 };
    } catch (err: any) {
      return { data: null, error: err.message, status: 500 };
    }
  }

  static async restockProduct(inventoryId: string, quantityToAdd: number): Promise<ApiResponse<boolean>> {
    if (!isServer) {
      return clientCall('restockProduct', inventoryId, quantityToAdd);
    }
    try {
      // Fetch current stock
      const { data: inv } = await adminSupabase
        .from('inventory')
        .select('stock_quantity')
        .eq('id', inventoryId)
        .single();

      if (!inv) return { data: null, error: 'Inventory not found', status: 400 };

      const { error } = await adminSupabase
        .from('inventory')
        .update({
          stock_quantity: inv.stock_quantity + quantityToAdd,
        })
        .eq('id', inventoryId);

      if (error) return { data: null, error: error.message, status: 400 };
      return { data: true, error: null, status: 200 };
    } catch (err: any) {
      return { data: null, error: err.message, status: 500 };
    }
  }

  // ------------------------------------------
  // 5. USER MANAGEMENT MODULE
  // ------------------------------------------
  static async getUsers(): Promise<ApiResponse<Profile[]>> {
    if (!isServer) {
      return clientCall('getUsers');
    }
    try {
      const { data, error } = await adminSupabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) return { data: null, error: error.message, status: 400 };
      return { data: data as Profile[], error: null, status: 200 };
    } catch (err: any) {
      return { data: null, error: err.message, status: 500 };
    }
  }

  static async updateRole(profileId: string, role: Profile['role']): Promise<ApiResponse<boolean>> {
    if (!isServer) {
      return clientCall('updateRole', profileId, role);
    }
    try {
      const { error } = await adminSupabase
        .from('profiles')
        .update({ role })
        .eq('id', profileId);

      if (error) return { data: null, error: error.message, status: 400 };
      return { data: true, error: null, status: 200 };
    } catch (err: any) {
      return { data: null, error: err.message, status: 500 };
    }
  }

  // ------------------------------------------
  // 6. CUSTOMER SUPPORT MODULE
  // ------------------------------------------
  static async getSupportTickets(): Promise<ApiResponse<any[]>> {
    if (!isServer) {
      return clientCall('getSupportTickets');
    }
    try {
      const { data, error } = await adminSupabase
        .from('support_tickets')
        .select(`
          *,
          profiles (
            full_name,
            phone_number
          )
        `)
        .order('created_at', { ascending: false });

      if (error) return { data: null, error: error.message, status: 400 };
      return { data: data as any[], error: null, status: 200 };
    } catch (err: any) {
      return { data: null, error: err.message, status: 500 };
    }
  }

  static async getTicketMessages(ticketId: string | null): Promise<ApiResponse<any[]>> {
    if (!ticketId) return { data: null, error: 'No ticket selected', status: 400 };
    if (!isServer) {
      return clientCall('getTicketMessages', ticketId);
    }
    try {
      const { data, error } = await adminSupabase
        .from('support_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) return { data: null, error: error.message, status: 400 };
      return { data, error: null, status: 200 };
    } catch (err: any) {
      return { data: null, error: err.message, status: 500 };
    }
  }

  static async replyToTicket(ticketId: string, senderId: string, message: string): Promise<ApiResponse<boolean>> {
    if (!isServer) {
      return clientCall('replyToTicket', ticketId, senderId, message);
    }
    try {
      // 1. Insert chat reply
      const { error: msgErr } = await adminSupabase.from('support_messages').insert({
        ticket_id: ticketId,
        sender_id: senderId,
        message: message,
      });

      if (msgErr) return { data: null, error: msgErr.message, status: 400 };

      // 2. Set ticket status to 'active'
      await adminSupabase
        .from('support_tickets')
        .update({ status: 'active' })
        .eq('id', ticketId);

      return { data: true, error: null, status: 200 };
    } catch (err: any) {
      return { data: null, error: err.message, status: 500 };
    }
  }

  static async resolveTicket(ticketId: string | null): Promise<ApiResponse<boolean>> {
    if (!ticketId) return { data: null, error: 'No ticket selected', status: 400 };
    if (!isServer) {
      return clientCall('resolveTicket', ticketId);
    }
    try {
      const { error } = await adminSupabase
        .from('support_tickets')
        .update({ status: 'resolved' })
        .eq('id', ticketId);

      if (error) return { data: null, error: error.message, status: 400 };
      return { data: true, error: null, status: 200 };
    } catch (err: any) {
      return { data: null, error: err.message, status: 500 };
    }
  }

  static async assignTicket(ticketId: string | null, adminId: string | null): Promise<ApiResponse<boolean>> {
    if (!ticketId) return { data: null, error: 'No ticket selected', status: 400 };
    if (!isServer) {
      return clientCall('assignTicket', ticketId, adminId);
    }
    try {
      const { error } = await adminSupabase
        .from('support_tickets')
        .update({ assigned_to: adminId })
        .eq('id', ticketId);

      if (error) return { data: null, error: error.message, status: 400 };
      return { data: true, error: null, status: 200 };
    } catch (err: any) {
      return { data: null, error: err.message, status: 500 };
    }
  }

  // ------------------------------------------
  // 7. MARKETING CAMPAIGNS MODULE
  // ------------------------------------------
  static async getCoupons(): Promise<ApiResponse<Coupon[]>> {
    if (!isServer) {
      return clientCall('getCoupons');
    }
    try {
      const { data, error } = await adminSupabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) return { data: null, error: error.message, status: 400 };
      return { data: data as Coupon[], error: null, status: 200 };
    } catch (err: any) {
      return { data: null, error: err.message, status: 500 };
    }
  }

  static async addCoupon(couponData: Partial<Coupon>): Promise<ApiResponse<Coupon>> {
    if (!isServer) {
      return clientCall('addCoupon', couponData);
    }
    try {
      const { data, error } = await adminSupabase
        .from('coupons')
        .insert({
          code: couponData.code?.toUpperCase(),
          discount_amount: couponData.discount_amount,
          min_cart_value: couponData.min_cart_value,
          is_active: true,
          expires_at: couponData.expires_at,
        })
        .select()
        .single();

      if (error) return { data: null, error: error.message, status: 400 };
      return { data: data as Coupon, error: null, status: 200 };
    } catch (err: any) {
      return { data: null, error: err.message, status: 500 };
    }
  }
}
