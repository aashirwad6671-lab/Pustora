import { supabase } from './supabaseClient';
import { ApiResponse, ProductQueryFilters } from './api.types';
import { Product, Review } from '../types';

export class ProductService {
  /**
   * Fetches active products from Supabase based on dynamic query filters (Category, Class, Price, Subject, Brand).
   */
  static async getProducts(filters: ProductQueryFilters): Promise<ApiResponse<Product[]>> {
    try {
      let query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true);

      // Apply dynamic category filter
      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }

      // Apply dynamic sub-category filter
      if (filters.subCategory) {
        query = query.eq('sub_category', filters.subCategory);
      }

      // Apply Class/Grade suitability tag filter
      if (filters.gradeSuitability) {
        query = query.ilike('grade_suitability', `%${filters.gradeSuitability}%`);
      }

      // Apply Subject tag filter
      if (filters.subjectTag) {
        query = query.eq('subject_tag', filters.subjectTag);
      }

      // Apply Brand name filter
      if (filters.brandName) {
        query = query.eq('brand', filters.brandName);
      }

      // Apply Price Range filters
      if (filters.minPrice !== undefined) {
        query = query.gte('price', filters.minPrice);
      }
      if (filters.maxPrice !== undefined) {
        query = query.lte('price', filters.maxPrice);
      }

      // Apply Text Search query
      if (filters.searchQuery) {
        query = query.or(`name.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%,brand.ilike.%${filters.searchQuery}%`);
      }

      // Apply Featured flag
      if (filters.isFeatured) {
        query = query.eq('is_featured', true);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        return { data: null, error: error.message, status: 400 };
      }

      return { data: data as Product[], error: null, status: 200 };
    } catch (err: any) {
      return { data: null, error: err.message || 'Product catalog query failed', status: 500 };
    }
  }

  /**
   * Fetches detailed product properties by UUID.
   */
  static async getProductById(id: string): Promise<ApiResponse<Product>> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return { data: null, error: error.message, status: 400 };
      }

      return { data: data as Product, error: null, status: 200 };
    } catch (err: any) {
      return { data: null, error: err.message || 'Product details query failed', status: 500 };
    }
  }

  /**
   * Fetches detailed product properties by SEO-friendly slug.
   * Used by /product/[slug] page for slug-based routing.
   */
  static async getProductBySlug(slug: string): Promise<ApiResponse<Product>> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (error) {
        return { data: null, error: error.message, status: 400 };
      }

      return { data: data as Product, error: null, status: 200 };
    } catch (err: any) {
      return { data: null, error: err.message || 'Product slug query failed', status: 500 };
    }
  }

  /**
   * Fetches user feedback reviews and star ratings for a specific product.
   */
  static async getProductReviews(productId: string): Promise<ApiResponse<Review[]>> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          user_id,
          profiles (
            full_name,
            avatar_url
          )
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) {
        return { data: null, error: error.message, status: 400 };
      }

      return { data: data as any[], error: null, status: 200 };
    } catch (err: any) {
      return { data: null, error: err.message || 'Product reviews query failed', status: 500 };
    }
  }

  /**
   * Queries recommendations representing "Frequently Bought Together" bundle packages
   * (returns 2 related accessories or books matching category tags).
   */
  static async getFrequentlyBoughtTogether(product: Product): Promise<ApiResponse<Product[]>> {
    try {
      // Find 2 active items in the same category but with a different subcategory or ID
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category_id', product.category_id)
        .eq('is_active', true)
        .neq('id', product.id)
        .limit(2);

      if (error) {
        return { data: null, error: error.message, status: 400 };
      }

      return { data: data as Product[], error: null, status: 200 };
    } catch (err: any) {
      return { data: null, error: err.message || 'Recommendations fetch failed', status: 500 };
    }
  }
}
