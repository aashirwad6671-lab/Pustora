// ============================================================
// deliveryPartnerService.ts
// All data operations for the Delivery Partner Portal (/delivery)
// ============================================================

import { supabase } from './supabaseClient';
import { ApiResponse } from './api.types';

export interface DeliveryPartnerProfile {
  partnerId: string;       // delivery_partners.id
  profileId: string;       // profiles.id (auth user)
  fullName: string | null;
  phoneNumber: string;
  vehicleType: string;
  vehicleNumber: string | null;
  status: 'active' | 'busy' | 'offline';
}

export interface AssignedOrder {
  id: string;
  status: string;
  delivery_address: string;
  items_total: number;
  delivery_fee: number;
  discount_applied: number;
  grand_total: number;
  payment_method: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
  // Joined customer profile
  profiles: {
    full_name: string | null;
    phone_number: string;
  } | null;
  // Joined order items with products
  order_items: Array<{
    id: string;
    quantity: number;
    price_at_purchase: number;
    products: {
      name: string;
      brand: string;
      image_url: string | null;
    } | null;
  }>;
  // Joined address details
  addresses: {
    address_line1: string;
    address_line2: string | null;
    area: string;
    city: string | null;
    pincode: string;
  } | null;
}

export class DeliveryPartnerService {
  /**
   * Fetches all registered delivery partners for the login dropdown.
   */
  static async getAllDeliveryPartners(): Promise<ApiResponse<DeliveryPartnerProfile[]>> {
    try {
      const { data, error } = await supabase
        .from('delivery_partners')
        .select(`
          id,
          profile_id,
          vehicle_type,
          vehicle_number,
          status,
          profiles:profile_id (full_name, phone_number)
        `)
        .order('created_at', { ascending: true });

      if (error) return { data: null, error: error.message, status: 400 };

      const list: DeliveryPartnerProfile[] = ((data || []) as any[]).map((dp) => ({
        partnerId: dp.id,
        profileId: dp.profile_id,
        fullName: dp.profiles?.full_name || 'Delivery Partner',
        phoneNumber: dp.profiles?.phone_number || '',
        vehicleType: dp.vehicle_type || 'Bike',
        vehicleNumber: dp.vehicle_number || null,
        status: dp.status || 'active',
      }));

      return { data: list, error: null, status: 200 };
    } catch (err: any) {
      return { data: null, error: err.message || 'Failed to fetch delivery partners', status: 500 };
    }
  }

  /**
   * Validates password (same as admin control panel: admin@12345) and returns the partner profile.
   */
  static async loginWithPassword(
    partnerId: string,
    passwordInput: string
  ): Promise<ApiResponse<DeliveryPartnerProfile>> {
    try {
      // Check password against the admin standard password
      if (passwordInput !== 'admin@12345') {
        return { data: null, error: 'Incorrect password. Please use the admin credentials.', status: 401 };
      }

      if (!partnerId) {
        return { data: null, error: 'Please select a delivery partner profile.', status: 400 };
      }

      const { data: partnerData, error: partnerError } = await supabase
        .from('delivery_partners')
        .select(`
          id,
          profile_id,
          vehicle_type,
          vehicle_number,
          status,
          profiles:profile_id (full_name, phone_number)
        `)
        .eq('id', partnerId)
        .single();

      if (partnerError || !partnerData) {
        return {
          data: null,
          error: 'Delivery partner record not found.',
          status: 404,
        };
      }

      const profile = partnerData as any;

      return {
        data: {
          partnerId: profile.id,
          profileId: profile.profile_id,
          fullName: profile.profiles?.full_name || 'Delivery Partner',
          phoneNumber: profile.profiles?.phone_number || '',
          vehicleType: profile.vehicle_type || 'Bike',
          vehicleNumber: profile.vehicle_number || null,
          status: profile.status || 'active',
        },
        error: null,
        status: 200,
      };
    } catch (err: any) {
      return { data: null, error: err.message || 'Login failed', status: 500 };
    }
  }

  /**
   * Registers a new Delivery Partner:
   * 1. Creates/upserts profile in 'profiles' table with role 'delivery_partner'
   * 2. Creates record in 'delivery_partners' table with vehicle type & number
   */
  static async registerDeliveryPartner(params: {
    fullName: string;
    phoneNumber: string;
    vehicleType: string;
    vehicleNumber: string;
    password: string;
  }): Promise<ApiResponse<DeliveryPartnerProfile>> {
    try {
      const { fullName, phoneNumber, vehicleType, vehicleNumber, password } = params;

      if (!fullName.trim() || !phoneNumber.trim() || !vehicleNumber.trim()) {
        return { data: null, error: 'Please fill in all required fields.', status: 400 };
      }

      if (password !== 'admin@12345') {
        return { data: null, error: 'Registration password is not valid.', status: 400 };
      }

      // Check if profile exists by phone number
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, full_name, phone_number, role')
        .eq('phone_number', phoneNumber.trim())
        .maybeSingle();

      let profileId = existingProfile?.id;

      if (!profileId) {
        // Create profile UUID
        const newId = crypto.randomUUID();
        const { data: insertedProfile, error: pErr } = await supabase
          .from('profiles')
          .insert({
            id: newId,
            phone_number: phoneNumber.trim(),
            full_name: fullName.trim(),
            role: 'delivery_partner',
          })
          .select()
          .single();

        if (pErr) return { data: null, error: pErr.message, status: 400 };
        profileId = insertedProfile.id;
      } else {
        // Update existing profile with name and delivery_partner role
        await supabase
          .from('profiles')
          .update({
            full_name: fullName.trim(),
            role: 'delivery_partner',
          })
          .eq('id', profileId);
      }

      // Check if delivery_partner row already exists
      const { data: existingPartner } = await supabase
        .from('delivery_partners')
        .select('id')
        .eq('profile_id', profileId)
        .maybeSingle();

      let partnerId = existingPartner?.id;

      if (!partnerId) {
        const { data: newPartner, error: dpErr } = await supabase
          .from('delivery_partners')
          .insert({
            profile_id: profileId,
            vehicle_type: vehicleType || 'Bike',
            vehicle_number: vehicleNumber.trim().toUpperCase(),
            status: 'active',
          })
          .select()
          .single();

        if (dpErr) return { data: null, error: dpErr.message, status: 400 };
        partnerId = newPartner.id;
      } else {
        // Update vehicle details
        await supabase
          .from('delivery_partners')
          .update({
            vehicle_type: vehicleType || 'Bike',
            vehicle_number: vehicleNumber.trim().toUpperCase(),
            status: 'active',
          })
          .eq('id', partnerId);
      }

      return {
        data: {
          partnerId,
          profileId,
          fullName: fullName.trim(),
          phoneNumber: phoneNumber.trim(),
          vehicleType: vehicleType || 'Bike',
          vehicleNumber: vehicleNumber.trim().toUpperCase(),
          status: 'active',
        },
        error: null,
        status: 200,
      };
    } catch (err: any) {
      return { data: null, error: err.message || 'Registration failed', status: 500 };
    }
  }

  /**
   * Logs in a delivery partner by mobile number and password (admin@12345).
   */
  static async loginByPhoneAndPassword(
    phoneNumber: string,
    passwordInput: string
  ): Promise<ApiResponse<DeliveryPartnerProfile>> {
    try {
      if (passwordInput !== 'admin@12345') {
        return { data: null, error: 'Incorrect password entered.', status: 401 };
      }

      const { data: profileData, error: profError } = await supabase
        .from('profiles')
        .select('id, full_name, phone_number, role')
        .eq('phone_number', phoneNumber.trim())
        .maybeSingle();

      if (profError || !profileData) {
        return { data: null, error: 'No account found with this phone number. Please Sign Up first.', status: 404 };
      }

      const { data: partnerData, error: partError } = await supabase
        .from('delivery_partners')
        .select('*')
        .eq('profile_id', profileData.id)
        .maybeSingle();

      if (partError || !partnerData) {
        return { data: null, error: 'No delivery partner profile found for this user. Please Sign Up as partner.', status: 404 };
      }

      return {
        data: {
          partnerId: partnerData.id,
          profileId: profileData.id,
          fullName: profileData.full_name || 'Delivery Partner',
          phoneNumber: profileData.phone_number,
          vehicleType: partnerData.vehicle_type || 'Bike',
          vehicleNumber: partnerData.vehicle_number || null,
          status: partnerData.status || 'active',
        },
        error: null,
        status: 200,
      };
    } catch (err: any) {
      return { data: null, error: err.message || 'Login failed', status: 500 };
    }
  }

  /**
   * Updates delivery partner's profile information (name, vehicle type, vehicle number).
   */
  static async updateProfile(
    partnerId: string,
    profileId: string,
    params: {
      fullName: string;
      vehicleType: string;
      vehicleNumber: string;
    }
  ): Promise<ApiResponse<boolean>> {
    try {
      const { fullName, vehicleType, vehicleNumber } = params;

      // 1. Update profiles table
      if (fullName) {
        await supabase
          .from('profiles')
          .update({ full_name: fullName.trim() })
          .eq('id', profileId);
      }

      // 2. Update delivery_partners table
      const { error: dpError } = await supabase
        .from('delivery_partners')
        .update({
          vehicle_type: vehicleType,
          vehicle_number: vehicleNumber.trim().toUpperCase(),
        })
        .eq('id', partnerId);

      if (dpError) return { data: null, error: dpError.message, status: 400 };

      return { data: true, error: null, status: 200 };
    } catch (err: any) {
      return { data: null, error: err.message || 'Profile update failed', status: 500 };
    }
  }

  /**
   * Fetches all orders assigned to this delivery partner with status = 'out_for_delivery'.
   * Joins customer profile, address, and all ordered items with product details.
   */
  static async getMyAssignedOrders(deliveryPartnerId: string): Promise<ApiResponse<AssignedOrder[]>> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          status,
          delivery_address,
          items_total,
          delivery_fee,
          discount_applied,
          grand_total,
          payment_method,
          payment_status,
          created_at,
          updated_at,
          profiles:user_id (full_name, phone_number),
          order_items (
            id,
            quantity,
            price_at_purchase,
            products:product_id (name, brand, image_url)
          ),
          addresses:address_id (
            address_line1,
            address_line2,
            area,
            city,
            pincode
          )
        `)
        .eq('delivery_partner_id', deliveryPartnerId)
        .eq('status', 'out_for_delivery')
        .order('updated_at', { ascending: false });

      if (error) return { data: null, error: error.message, status: 400 };
      return { data: (data || []) as unknown as AssignedOrder[], error: null, status: 200 };
    } catch (err: any) {
      return { data: null, error: err.message || 'Failed to fetch orders', status: 500 };
    }
  }

  /**
   * Fetches orders delivered today by this partner (for history tab).
   */
  static async getDeliveredToday(deliveryPartnerId: string): Promise<ApiResponse<AssignedOrder[]>> {
    try {
      // Get today's UTC date range
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          status,
          delivery_address,
          items_total,
          delivery_fee,
          discount_applied,
          grand_total,
          payment_method,
          payment_status,
          created_at,
          updated_at,
          profiles:user_id (full_name, phone_number),
          order_items (
            id,
            quantity,
            price_at_purchase,
            products:product_id (name, brand, image_url)
          ),
          addresses:address_id (
            address_line1,
            address_line2,
            area,
            city,
            pincode
          )
        `)
        .eq('delivery_partner_id', deliveryPartnerId)
        .eq('status', 'delivered')
        .gte('updated_at', todayStart.toISOString())
        .order('updated_at', { ascending: false });

      if (error) return { data: null, error: error.message, status: 400 };
      return { data: (data || []) as unknown as AssignedOrder[], error: null, status: 200 };
    } catch (err: any) {
      return { data: null, error: err.message || 'Failed to fetch history', status: 500 };
    }
  }

  /**
   * Marks an order as delivered and sets the delivery partner status back to 'active'.
   */
  static async markAsDelivered(
    orderId: string,
    deliveryPartnerId: string
  ): Promise<ApiResponse<boolean>> {
    try {
      // 1. Update order status to delivered
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'delivered' })
        .eq('id', orderId)
        .eq('delivery_partner_id', deliveryPartnerId); // Safety: only own orders

      if (orderError) return { data: null, error: orderError.message, status: 400 };

      // 2. Check if partner has any more active deliveries
      const { data: remaining } = await supabase
        .from('orders')
        .select('id')
        .eq('delivery_partner_id', deliveryPartnerId)
        .eq('status', 'out_for_delivery');

      // 3. If no more deliveries, set partner back to 'active'
      if (!remaining || remaining.length === 0) {
        await supabase
          .from('delivery_partners')
          .update({ status: 'active' })
          .eq('id', deliveryPartnerId);
      }

      return { data: true, error: null, status: 200 };
    } catch (err: any) {
      return { data: null, error: err.message || 'Failed to update order', status: 500 };
    }
  }

  /**
   * Updates the delivery partner's active/offline status.
   */
  static async updateMyStatus(
    deliveryPartnerId: string,
    status: 'active' | 'offline'
  ): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('delivery_partners')
        .update({ status })
        .eq('id', deliveryPartnerId);

      if (error) return { data: null, error: error.message, status: 400 };
      return { data: true, error: null, status: 200 };
    } catch (err: any) {
      return { data: null, error: err.message || 'Status update failed', status: 500 };
    }
  }

  /**
   * Signs out the delivery partner from Supabase auth session.
   */
  static async signOut(): Promise<void> {
    await supabase.auth.signOut();
  }
}
