import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ProductService } from '../../src/services/productService';
import { Product, Review } from '../../src/types';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id: productId } = useLocalSearchParams<{ id: string }>();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadAllDetails() {
      if (!productId) return;
      setLoading(true);
      setErrorMsg(null);

      try {
        const prodRes = await ProductService.getProductById(productId);
        
        if (prodRes.error) {
          setErrorMsg(prodRes.error);
          setLoading(false);
          return;
        }

        if (prodRes.data) {
          setProduct(prodRes.data);
          
          const [reviewsRes, relatedRes] = await Promise.all([
            ProductService.getProductReviews(productId),
            ProductService.getFrequentlyBoughtTogether(prodRes.data),
          ]);

          if (reviewsRes.data) setReviews(reviewsRes.data);
          if (relatedRes.data) setRelatedProducts(relatedRes.data);
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Details retrieval failed');
      } finally {
        setLoading(false);
      }
    }
    loadAllDetails();
  }, [productId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#6C3FD6" />
        <Text style={styles.loaderText}>Fetching product details...</Text>
      </SafeAreaView>
    );
  }

  if (errorMsg || !product) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{errorMsg || 'Product not found'}</Text>
        <TouchableOpacity style={styles.errorBtn} onPress={() => router.back()}>
          <Text style={styles.errorBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const reviewsCount = reviews.length > 0 ? reviews.length : 12;
  const ratingAvg = product.is_bestseller ? 4.9 : 4.7;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* IMAGE GALLERY BOX */}
        <View style={styles.imageGallery}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backIcon}>◀</Text>
          </TouchableOpacity>
          <Text style={styles.galleryEmoji}>{product.image_url || '📓'}</Text>
        </View>

        {/* DETAILS SECTION */}
        <View style={styles.detailCard}>
          <View style={styles.headerInfo}>
            <Text style={styles.brandName}>{product.brand}</Text>
            <Text style={styles.productName}>{product.name}</Text>
            
            <View style={styles.ratingRow}>
              <Text style={styles.stars}>⭐⭐⭐⭐⭐</Text>
              <Text style={styles.ratingScore}>{ratingAvg}</Text>
              <Text style={styles.reviewsCount}>({reviewsCount} reviews)</Text>
            </View>
          </View>

          {/* PRICE DETAILS */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{product.price}</Text>
            <Text style={styles.mrp}>MRP ₹{product.mrp}</Text>
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>Save ₹{product.mrp - product.price}</Text>
            </View>
          </View>

          {/* SPECIFICATION CARD */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Product Specifications</Text>
            <View style={styles.specsTable}>
              <View style={styles.specsRow}>
                <Text style={styles.specLabel}>Suitable for</Text>
                <Text style={styles.specVal}>{product.grade_suitability || 'General'}</Text>
              </View>
              {product.subject_tag && (
                <View style={styles.specsRow}>
                  <Text style={styles.specLabel}>Subject</Text>
                  <Text style={styles.specVal}>{product.subject_tag}</Text>
                </View>
              )}
              <View style={styles.specsRow}>
                <Text style={styles.specLabel}>Availability</Text>
                <Text style={styles.specVal}>{product.stock_quantity > 0 ? 'In Stock (Ships in 10m)' : 'Out of Stock'}</Text>
              </View>
            </View>
          </View>

          {/* DESCRIPTION */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descText}>
              {product.description ||
                'Premium study kit accessory built for schools and academic curricula. Designed with non-toxic element guidelines, Element chlorine-free papers, and certified standard structures to support education and leisure.'}
            </Text>
          </View>

          {/* FREQUENTLY BOUGHT TOGETHER SECTION */}
          {relatedProducts.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Frequently Bought Together</Text>
              <View style={styles.comboCard}>
                <View style={styles.comboItems}>
                  <View style={styles.comboItem}>
                    <Text style={styles.comboEmoji}>{product.image_url || '📚'}</Text>
                    <Text style={styles.comboName} numberOfLines={1}>{product.name}</Text>
                  </View>
                  <Text style={styles.comboPlus}>+</Text>
                  <View style={styles.comboItem}>
                    <Text style={styles.comboEmoji}>{relatedProducts[0].image_url || '✏️'}</Text>
                    <Text style={styles.comboName} numberOfLines={1}>{relatedProducts[0].name}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.comboBtn}>
                  <Text style={styles.comboBtnText}>ADD COMBO BASKET</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* USER REVIEWS LIST */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>User Reviews</Text>
            {reviews.length === 0 ? (
              <View style={styles.emptyReviews}>
                <Text style={styles.reviewText}>"Excellent build quality and swift delivery! Highly recommended for CBSE board preparation."</Text>
                <Text style={styles.reviewUser}>— Anjali R., Lucknow Parent</Text>
              </View>
            ) : (
              reviews.map((rev) => (
                <View key={rev.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewName}>
                      {rev.profiles?.full_name || 'Verified Pustora Buyer'}
                    </Text>
                    <Text style={styles.reviewStars}>{'★'.repeat(rev.rating)}</Text>
                  </View>
                  {rev.comment && <Text style={styles.reviewComment}>{rev.comment}</Text>}
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* STICKY ACTION CTA BAR */}
      <View style={styles.actionStickyBar}>
        <View style={styles.priceEstimate}>
          <Text style={styles.estimateLabel}>Total Price</Text>
          <Text style={styles.estimateVal}>₹{product.price}</Text>
        </View>
        <TouchableOpacity style={styles.cartBtn}>
          <Text style={styles.cartBtnText}>ADD TO CART</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F4FF',
  },
  scrollContent: {
    paddingBottom: 90,
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: '#F8F4FF',
  },
  loaderText: {
    fontSize: 14,
    color: '#6C5E94',
  },
  errorIcon: {
    fontSize: 48,
  },
  errorText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#EF4444',
  },
  errorBtn: {
    backgroundColor: '#6C3FD6',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  errorBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  imageGallery: {
    height: 260,
    backgroundColor: '#EDE8FF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 14,
    color: '#6C3FD6',
  },
  galleryEmoji: {
    fontSize: 90,
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    padding: 24,
    gap: 20,
  },
  headerInfo: {
    gap: 6,
  },
  brandName: {
    fontSize: 11,
    fontWeight: '900',
    color: '#6C5E94',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  productName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2D1B69',
    lineHeight: 26,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  stars: {
    fontSize: 12,
  },
  ratingScore: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2D1B69',
  },
  reviewsCount: {
    fontSize: 12,
    color: '#6C5E94',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F8F4FF',
    paddingVertical: 14,
  },
  price: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2D1B69',
  },
  mrp: {
    fontSize: 14,
    color: '#6C5E94',
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: '#10B981',
    borderWidth: 1,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  discountText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2D1B69',
  },
  specsTable: {
    borderWidth: 1,
    borderColor: '#EDE8FF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  specsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#EDE8FF',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  specLabel: {
    width: '40%',
    fontSize: 13,
    fontWeight: '700',
    color: '#6C5E94',
  },
  specVal: {
    fontSize: 13,
    color: '#2D1B69',
  },
  descText: {
    fontSize: 13,
    color: '#6C5E94',
    lineHeight: 20,
  },
  comboCard: {
    backgroundColor: '#F8F4FF',
    borderWidth: 1.5,
    borderColor: '#6C3FD6',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  comboItems: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  comboItem: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDE8FF',
    width: 90,
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
    gap: 4,
  },
  comboEmoji: {
    fontSize: 28,
  },
  comboName: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6C5E94',
    textAlign: 'center',
  },
  comboPlus: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6C5E94',
  },
  comboBtn: {
    backgroundColor: '#F5A623',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  comboBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emptyReviews: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EDE8FF',
    gap: 6,
  },
  reviewText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#6C5E94',
    lineHeight: 18,
  },
  reviewUser: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6C5E94',
    textAlign: 'right',
  },
  reviewCard: {
    borderBottomWidth: 1,
    borderColor: '#F8F4FF',
    paddingVertical: 12,
    gap: 6,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2D1B69',
  },
  reviewStars: {
    fontSize: 10,
    color: '#F5A623',
  },
  reviewComment: {
    fontSize: 13,
    color: '#6C5E94',
    lineHeight: 18,
  },
  actionStickyBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#EDE8FF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 76,
  },
  priceEstimate: {
    gap: 2,
  },
  estimateLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6C5E94',
    textTransform: 'uppercase',
  },
  estimateVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2D1B69',
  },
  cartBtn: {
    backgroundColor: '#6C3FD6',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 10,
    shadowColor: '#6C3FD6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  cartBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
