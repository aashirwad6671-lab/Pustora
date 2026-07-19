import { supabase } from './supabaseClient';
import { ApiResponse, DeliveryCostCalculation } from './api.types';
import { Address, Coupon, Order, OrderItem } from '../types';

export class OrderService {
  /**
   * Fetches all saved addresses for a specific user from Supabase.
   */
  static async getUserAddresses(userId: string): Promise<ApiResponse<Address[]>> {
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false });

      if (error) {
        return { data: null, error: error.message, status: 400 };
      }

      return { data: data as Address[], error: null, status: 200 };
    } catch (err: any) {
      return { data: null, error: err.message || 'Addresses retrieval failed', status: 500 };
    }
  }

  /**
   * Validates and retrieves coupon details from Supabase coupons table.
   */
  static async checkCouponCode(code: string, cartValue: number): Promise<ApiResponse<Coupon>> {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error) {
        return { data: null, error: 'Invalid coupon code.', status: 400 };
      }

      const coupon = data as Coupon;

      // Check min cart value eligibility
      if (cartValue < coupon.min_cart_value) {
        return {
          data: null,
          error: `Minimum order value for this coupon is ₹${coupon.min_cart_value}.`,
          status: 400,
        };
      }

      // Check expiration dates
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        return { data: null, error: 'This coupon has expired.', status: 400 };
      }

      return { data: coupon, error: null, status: 200 };
    } catch (err: any) {
      return { data: null, error: err.message || 'Coupon verification failed', status: 500 };
    }
  }

  /**
   * Evaluates the delivery fee for Lucknow zones:
   * 1. Evaluates distance to 3 stores: Hazratganj (26.8504, 80.9419), Gomti Nagar (26.8624, 80.9987), Aliganj (26.8929, 80.9388).
   * 2. Selects the closest store.
   * 3. Calculates delivery cost: free under 3km, ₹15 per additional km after.
   */
  static async calculateDeliveryCost(userLat: number, userLng: number): Promise<ApiResponse<DeliveryCostCalculation>> {
    try {
      // 3 simulated Lucknow store hubs
      const STORES = [
        { id: 'store-hazratganj', name: 'Hazratganj Main Hub', lat: 26.8504, lng: 80.9419 },
        { id: 'store-gomtinagar', name: 'Gomti Nagar Express', lat: 26.8624, lng: 80.9987 },
        { id: 'store-aliganj', name: 'Aliganj Smart Depot', lat: 26.8929, lng: 80.9388 },
      ];

      let minDistance = Infinity;
      let closestStore = STORES[0];

      // Haversine formula to compute geodesic distances
      STORES.forEach((store) => {
        const R = 6371; // Earth radius in km
        const dLat = ((store.lat - userLat) * Math.PI) / 180;
        const dLng = ((store.lng - userLng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((userLat * Math.PI) / 180) *
            Math.cos((store.lat * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        if (distance < minDistance) {
          minDistance = distance;
          closestStore = store;
        }
      });

      // Read delivery per-km rules from public settings, default is ₹15/km after 3km
      const thresholdKm = 3.0;
      const ratePerKm = 15.0;
      
      let deliveryFee = 0.0;
      if (minDistance > thresholdKm) {
        deliveryFee = Math.round((minDistance - thresholdKm) * ratePerKm);
      }

      return {
        data: {
          distanceKm: parseFloat(minDistance.toFixed(1)),
          isFreeDelivery: minDistance <= thresholdKm,
          deliveryFee: deliveryFee,
          nearestStoreId: closestStore.id,
          nearestStoreName: closestStore.name,
        },
        error: null,
        status: 200,
      };
    } catch (err: any) {
      return { data: null, error: 'Location calculation failed', status: 500 };
    }
  }

  /**
   * Places a new order, registering entries in 'orders' and 'order_items' tables.
   */
  static async createOrder(
    userId: string,
    storeId: string,
    addressId: string,
    deliveryAddress: string,
    latitude: number,
    longitude: number,
    distanceKm: number,
    itemsTotal: number,
    deliveryFee: number,
    discountApplied: number,
    grandTotal: number,
    paymentMethod: string,
    items: Array<{ productId: string; quantity: number; price: number }>
  ): Promise<ApiResponse<Order>> {
    try {
      // 1. Insert order header row
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: userId,
          store_id: storeId,
          delivery_address: deliveryAddress,
          delivery_latitude: latitude,
          delivery_longitude: longitude,
          distance_km: distanceKm,
          items_total: itemsTotal,
          delivery_fee: deliveryFee,
          discount_applied: discountApplied,
          grand_total: grandTotal,
          payment_method: paymentMethod,
          payment_status: paymentMethod === 'COD' ? 'pending' : 'paid',
        })
        .select()
        .single();

      if (orderError) {
        return { data: null, error: orderError.message, status: 400 };
      }

      const order = orderData as Order;

      // 2. Prepare and insert order items list
      const orderItemsInsert = items.map((it) => ({
        order_id: order.id,
        product_id: it.productId,
        quantity: it.quantity,
        price_at_purchase: it.price,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsInsert);

      if (itemsError) {
        // Fallback or delete order to maintain schema atomicity
        await supabase.from('orders').delete().eq('id', order.id);
        return { data: null, error: itemsError.message, status: 400 };
      }

      // 3. Update product inventory quantities
      for (const it of items) {
        await supabase.rpc('decrement_product_stock', {
          prod_id: it.productId,
          qty_to_dec: it.quantity,
        });
      }

      return { data: order, error: null, status: 200 };
    } catch (err: any) {
      return { data: null, error: err.message || 'Order creation failed', status: 500 };
    }
  }
}
