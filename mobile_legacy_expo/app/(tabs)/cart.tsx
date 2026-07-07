import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, SafeAreaView, Modal, Dimensions, DeviceEventEmitter } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { OrderService } from '../../src/services/orderService';
import { Address, Coupon, Product } from '../../src/types';
import { DeliveryCostCalculation } from '../../src/services/api.types';

const { width } = Dimensions.get('window');

interface CartItem {
  id: string;
  product: Product;
  quantity: number;
}

const INITIAL_CART_ITEMS: CartItem[] = [
  {
    id: 'tb-ncert-m6',
    quantity: 2,
    product: {
      id: 'tb-ncert-m6',
      category_id: 'books',
      sub_category: 'textbooks',
      name: 'Mathematics Class VI',
      brand: 'NCERT',
      description: 'CBSE guide',
      price: 150,
      mrp: 180,
      stock_quantity: 45,
      image_url: '📚',
      grade_suitability: 'Class 6',
      subject_tag: 'Maths',
      is_featured: true,
      is_bestseller: true,
      is_active: true,
      created_at: '',
      updated_at: '',
    },
  },
  {
    id: 'nb-classmate-s6',
    quantity: 1,
    product: {
      id: 'nb-classmate-s6',
      category_id: 'books',
      sub_category: 'notebooks',
      name: 'Classmate Notebook Pack',
      brand: 'Classmate',
      description: 'Pack of 6',
      price: 360,
      mrp: 420,
      stock_quantity: 12,
      image_url: '📓',
      grade_suitability: 'All Grades',
      subject_tag: 'General',
      is_featured: true,
      is_bestseller: true,
      is_active: true,
      created_at: '',
      updated_at: '',
    },
  },
];

export default function CartScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [cartItems, setCartItems] = useState<CartItem[]>(INITIAL_CART_ITEMS);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState<number | null>(null);
  
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  const [deliveryDetails, setDeliveryDetails] = useState<DeliveryCostCalculation | null>(null);
  const [loading, setLoading] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);

  useEffect(() => {
    async function loadAddresses() {
      const uid = user?.id || 'mock-user-id';
      setLoading(true);
      const response = await OrderService.getUserAddresses(uid);
      
      if (response.data && response.data.length > 0) {
        setAddresses(response.data);
        setSelectedAddressIndex(0);
      } else {
        const mockAddresses: Address[] = [
          {
            id: 'addr-hazratganj',
            user_id: uid,
            label: 'Home',
            address_line1: 'Flat 402, Royal Residency',
            address_line2: 'Mahanagar',
            area: 'Mahanagar',
            city: 'Lucknow',
            state: 'UP',
            pincode: '226006',
            latitude: 26.8740,
            longitude: 80.9520,
            is_default: true,
            created_at: '',
            updated_at: '',
          },
          {
            id: 'addr-indiranagar',
            user_id: uid,
            label: 'Office',
            address_line1: 'TCS Block A, Sector 12',
            address_line2: 'Indira Nagar',
            area: 'Indira Nagar',
            city: 'Lucknow',
            state: 'UP',
            pincode: '226016',
            latitude: 26.8850,
            longitude: 80.9700,
            is_default: false,
            created_at: '',
            updated_at: '',
          },
        ];
        setAddresses(mockAddresses);
        setSelectedAddressIndex(0);
      }
      setLoading(false);
    }
    loadAddresses();
  }, [user]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('voice_add_to_cart', (payload) => {
      const catalogSnapshot = [
        {
          id: 'tb-ncert-m6',
          category_id: 'books',
          sub_category: 'textbooks',
          name: 'Mathematics Class VI',
          brand: 'NCERT',
          description: 'CBSE guide',
          price: 150,
          mrp: 180,
          stock_quantity: 45,
          image_url: '📚',
          grade_suitability: 'Class 6',
          subject_tag: 'Maths',
          is_featured: true,
          is_bestseller: true,
          is_active: true,
          created_at: '',
          updated_at: '',
        },
        {
          id: 'nb-classmate-s6',
          category_id: 'books',
          sub_category: 'notebooks',
          name: 'Classmate Notebook Pack',
          brand: 'Classmate',
          description: 'Pack of 6',
          price: 360,
          mrp: 420,
          stock_quantity: 12,
          image_url: '📓',
          grade_suitability: 'All Grades',
          subject_tag: 'General',
          is_featured: true,
          is_bestseller: true,
          is_active: true,
          created_at: '',
          updated_at: '',
        }
      ];

      const matchedProd = catalogSnapshot.find(p => p.id === payload.productId);
      if (matchedProd) {
        setCartItems((prevItems) => {
          const existing = prevItems.find(it => it.product.id === matchedProd.id);
          if (existing) {
            return prevItems.map(it => it.product.id === matchedProd.id ? { ...it, quantity: it.quantity + (payload.quantity || 1) } : it);
          } else {
            return [...prevItems, {
              id: matchedProd.id,
              product: matchedProd,
              quantity: payload.quantity || 1
            }];
          }
        });
      }
    });

    const checkSub = DeviceEventEmitter.addListener('voice_checkout', () => {
      setPaymentModalVisible(true);
    });

    return () => {
      sub.remove();
      checkSub.remove();
    };
  }, [cartItems]);

  useEffect(() => {
    async function updateDeliveryCost() {
      if (selectedAddressIndex === null || addresses.length === 0) return;
      const addr = addresses[selectedAddressIndex];
      
      const response = await OrderService.calculateDeliveryCost(addr.latitude, addr.longitude);
      if (response.data) {
        setDeliveryDetails(response.data);
      }
    }
    updateDeliveryCost();
  }, [selectedAddressIndex, addresses]);

  const handleUpdateQty = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      setCartItems(cartItems.filter((it) => it.id !== itemId));
    } else {
      setCartItems(
        cartItems.map((it) => (it.id === itemId ? { ...it, quantity: newQty } : it))
      );
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setCouponError(null);
    setCouponSuccess(null);

    const itemsTotal = getItemsTotal();
    const response = await OrderService.checkCouponCode(couponCode, itemsTotal);

    if (response.error) {
      setCouponError(response.error);
    } else if (response.data) {
      setAppliedCoupon(response.data);
      setCouponSuccess(`Coupon code '${couponCode.toUpperCase()}' applied successfully!`);
    }
  };

  const getItemsTotal = () => {
    return cartItems.reduce((acc, it) => acc + it.product.price * it.quantity, 0);
  };

  const getDiscount = () => {
    if (!appliedCoupon) return 0;
    return parseFloat(appliedCoupon.discount_amount.toString());
  };

  const getDeliveryFee = () => {
    return deliveryDetails ? deliveryDetails.deliveryFee : 0;
  };

  const getGrandTotal = () => {
    const total = getItemsTotal() + getDeliveryFee() - getDiscount();
    return total < 0 ? 0 : total;
  };

  const getDeliveryETA = () => {
    if (!deliveryDetails) return '30 mins';
    const dist = deliveryDetails.distanceKm;
    if (dist <= 1.5) return '10-15 Mins';
    if (dist <= 3.0) return '15-20 Mins';
    if (dist <= 5.0) return '20-30 Mins';
    return '30-40 Mins';
  };

  const handleCheckoutAndPay = async (method: 'COD' | 'UPI' | 'CARD') => {
    if (selectedAddressIndex === null || addresses.length === 0 || !deliveryDetails) return;
    
    setPaymentModalVisible(false);
    setPlacingOrder(true);

    const uid = user?.id || 'mock-user-id';
    const addr = addresses[selectedAddressIndex];
    const itemsTotal = getItemsTotal();
    const deliveryFee = getDeliveryFee();
    const discount = getDiscount();
    const grandTotal = getGrandTotal();

    const formattedItems = cartItems.map((it) => ({
      productId: it.product.id,
      quantity: it.quantity,
      price: it.product.price,
    }));

    const response = await OrderService.createOrder(
      uid,
      deliveryDetails.nearestStoreId,
      addr.id,
      `${addr.address_line1}, ${addr.area}, Lucknow`,
      addr.latitude,
      addr.longitude,
      deliveryDetails.distanceKm,
      itemsTotal,
      deliveryFee,
      discount,
      grandTotal,
      method,
      formattedItems
    );

    setPlacingOrder(false);
    if (response.error) {
      alert(`Checkout failed: ${response.error}`);
    } else if (response.data) {
      setCartItems([]);
      setAppliedCoupon(null);
      router.push({
        pathname: '/order-tracking' as any,
        params: { orderId: response.data.id, eta: getDeliveryETA() },
      });
    }
  };

  if (cartItems.length === 0) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🛒</Text>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySub}>Add books, registers, or toys to start shopping!</Text>
        <TouchableOpacity style={styles.shopBtn} onPress={() => router.push('/(tabs)/home')}>
          <Text style={styles.shopBtnText}>Shop Now</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const selectedAddr = selectedAddressIndex !== null ? addresses[selectedAddressIndex] : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Shopping Basket</Text>
          <Text style={styles.headerSub}>{cartItems.length} items selected</Text>
        </View>

        {/* 1. CART ITEMS LIST */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Selected Items</Text>
          {cartItems.map((item) => (
            <View key={item.id} style={styles.cartItem}>
              <View style={styles.itemAvatar}>
                <Text style={styles.itemEmoji}>{item.product.image_url}</Text>
              </View>
              <View style={styles.itemDetails}>
                <Text style={styles.itemName} numberOfLines={1}>{item.product.name}</Text>
                <Text style={styles.itemPrice}>₹{item.product.price} each</Text>
              </View>
              {/* Stepper with minimum 44x44 touch targets */}
              <View style={styles.qtyContainer}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => handleUpdateQty(item.id, item.quantity - 1)}>
                  <Text style={styles.qtyBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.qtyVal}>{item.quantity}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => handleUpdateQty(item.id, item.quantity + 1)}>
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* 2. ADDRESS SELECTION */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Deliver to Address</Text>
          {loading ? (
            <ActivityIndicator size="small" color="#6C3FD6" />
          ) : (
            <View style={styles.addressRow}>
              {addresses.map((addr, idx) => (
                <TouchableOpacity
                  key={addr.id}
                  style={[
                    styles.addressChip,
                    selectedAddressIndex === idx ? styles.addressChipSelected : null,
                  ]}
                  onPress={() => setSelectedAddressIndex(idx)}
                >
                  <Text style={styles.addressLabel}>
                    {addr.label === 'Home' ? '🏠 Home' : '💼 Office'}
                  </Text>
                  <Text style={styles.addressText} numberOfLines={1}>
                    {addr.address_line1}, {addr.area}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* 3. LUCKNOW MULTI-STORE DELIVERY ENGINE */}
        {deliveryDetails && selectedAddr && (
          <View style={styles.deliveryBox}>
            <View style={styles.deliveryHeader}>
              <Text style={styles.deliveryIcon}>⚡</Text>
              <Text style={styles.deliveryTitle}>Pustora Quick-Dispatch</Text>
            </View>
            <View style={styles.deliveryDetails}>
              <Text style={styles.etaText}>
                Delivery ETA: <Text style={styles.etaHighlight}>{getDeliveryETA()}</Text>
              </Text>
              <Text style={styles.storeText}>
                Dispatched from closest: <Text style={styles.storeHighlight}>{deliveryDetails.nearestStoreName}</Text>
              </Text>
              <View style={styles.badgeRow}>
                <Text style={styles.badge}>📍 {deliveryDetails.distanceKm} km away</Text>
                <Text style={[styles.badge, deliveryDetails.isFreeDelivery ? styles.badgeSuccess : styles.badgeInfo]}>
                  {deliveryDetails.isFreeDelivery ? 'Free Delivery' : `₹${deliveryDetails.deliveryFee} Fee`}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* 4. COUPON CODE SYSTEM */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Offers & Coupon Codes</Text>
          <View style={styles.couponForm}>
            <TextInput
              style={styles.couponInput}
              placeholder="Enter PUSTORA50, FREEBOOKS"
              placeholderTextColor="#6C5E94"
              autoCapitalize="characters"
              value={couponCode}
              onChangeText={(val) => {
                setCouponCode(val);
                setCouponError(null);
                setCouponSuccess(null);
              }}
            />
            <TouchableOpacity style={styles.couponBtn} onPress={handleApplyCoupon}>
              <Text style={styles.couponBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
          {couponError && <Text style={styles.couponError}>{couponError}</Text>}
          {couponSuccess && <Text style={styles.couponSuccess}>{couponSuccess}</Text>}
        </View>

        {/* 5. ORDER SUMMARY TOTALS */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Bill Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Item Subtotal</Text>
            <Text style={styles.summaryVal}>₹{getItemsTotal()}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Partner Fee</Text>
            <Text style={styles.summaryVal}>
              {getDeliveryFee() === 0 ? 'FREE' : `₹${getDeliveryFee()}`}
            </Text>
          </View>

          {appliedCoupon && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabelSuccess}>Coupon Discount ({appliedCoupon.code})</Text>
              <Text style={styles.summaryValSuccess}>-₹{getDiscount()}</Text>
            </View>
          )}

          <View style={[styles.summaryRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Grand Total</Text>
            <Text style={styles.grandTotalVal}>₹{getGrandTotal()}</Text>
          </View>
        </View>

      </ScrollView>

      {/* 6. PERSISTENT CHECKOUT TRIGGER BAR */}
      <View style={styles.checkoutBar}>
        <View>
          <Text style={styles.barLabel}>Amount Payable</Text>
          <Text style={styles.barVal}>₹{getGrandTotal()}</Text>
        </View>
        <TouchableOpacity 
          style={[styles.payBtn, placingOrder ? styles.payBtnDisabled : null]} 
          onPress={() => setPaymentModalVisible(true)}
          disabled={placingOrder}
        >
          {placingOrder ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.payBtnText}>Proceed to Payment</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* 7. INSTANT PAYMENT METHODS MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={paymentModalVisible}
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Payment Method</Text>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.upiOptions}>
              <TouchableOpacity style={styles.upiItem} onPress={() => handleCheckoutAndPay('UPI')}>
                <Text style={styles.upiEmoji}>📱</Text>
                <Text style={styles.upiLabel}>Pay via Google Pay / UPI</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.upiItem} onPress={() => handleCheckoutAndPay('CARD')}>
                <Text style={styles.upiEmoji}>💳</Text>
                <Text style={styles.upiLabel}>Credit / Debit Cards</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.upiItem} onPress={() => handleCheckoutAndPay('COD')}>
                <Text style={styles.upiEmoji}>💵</Text>
                <Text style={styles.upiLabel}>Cash on Delivery (COD)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F4FF',
  },
  scrollContent: {
    paddingVertical: 16,
    gap: 16,
    paddingBottom: 90,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
    backgroundColor: '#FFFFFF',
  },
  emptyEmoji: {
    fontSize: 70,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2D1B69',
  },
  emptySub: {
    fontSize: 13,
    color: '#6C5E94',
    textAlign: 'center',
  },
  shopBtn: {
    backgroundColor: '#6C3FD6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginTop: 10,
  },
  shopBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 16,
    gap: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2D1B69',
  },
  headerSub: {
    fontSize: 13,
    color: '#6C5E94',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDE8FF',
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 16,
    gap: 14,
    shadowColor: '#2D1B69',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2D1B69',
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderColor: '#F8F4FF',
    paddingBottom: 12,
  },
  itemAvatar: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#EDE8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemEmoji: {
    fontSize: 24,
  },
  itemDetails: {
    flex: 1,
    gap: 2,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2D1B69',
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6C3FD6',
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EDE8FF',
    borderRadius: 8,
    padding: 2,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6C3FD6',
  },
  qtyVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2D1B69',
  },
  addressRow: {
    flexDirection: 'row',
    gap: 10,
  },
  addressChip: {
    flex: 1,
    backgroundColor: '#F8F4FF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 4,
  },
  addressChipSelected: {
    backgroundColor: '#EDE8FF',
    borderColor: '#6C3FD6',
  },
  addressLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2D1B69',
  },
  addressText: {
    fontSize: 11,
    color: '#6C5E94',
  },
  deliveryBox: {
    backgroundColor: '#FFFBEA',
    borderWidth: 1,
    borderColor: '#EDE8FF',
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 16,
    gap: 10,
  },
  deliveryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deliveryIcon: {
    fontSize: 15,
  },
  deliveryTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2D1B69',
  },
  deliveryDetails: {
    gap: 6,
  },
  etaText: {
    fontSize: 13,
    color: '#6C5E94',
  },
  etaHighlight: {
    fontWeight: '800',
    color: '#6C3FD6',
  },
  storeText: {
    fontSize: 11,
    color: '#6C5E94',
  },
  storeHighlight: {
    fontWeight: '700',
    color: '#2D1B69',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  badge: {
    fontSize: 10,
    fontWeight: '800',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#EDE8FF',
    color: '#2D1B69',
  },
  badgeSuccess: {
    backgroundColor: '#D1FAE5',
    color: '#10B981',
  },
  badgeInfo: {
    backgroundColor: '#FEF3C7',
    color: '#D97706',
  },
  couponForm: {
    flexDirection: 'row',
    gap: 10,
  },
  couponInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#EDE8FF',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#2D1B69',
    backgroundColor: '#FFFFFF',
  },
  couponBtn: {
    backgroundColor: '#6C3FD6',
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  couponBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  couponError: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '700',
  },
  couponSuccess: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDE8FF',
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 16,
    gap: 10,
    shadowColor: '#2D1B69',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2D1B69',
    borderBottomWidth: 1,
    borderColor: '#F8F4FF',
    paddingBottom: 8,
    marginBottom: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#6C5E94',
  },
  summaryLabelSuccess: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2D1B69',
  },
  summaryValSuccess: {
    fontSize: 13,
    fontWeight: '800',
    color: '#10B981',
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderColor: '#F8F4FF',
    paddingTop: 10,
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2D1B69',
  },
  grandTotalVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#6C3FD6',
  },
  checkoutBar: {
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
  barLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6C5E94',
    textTransform: 'uppercase',
  },
  barVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#6C3FD6',
  },
  payBtn: {
    backgroundColor: '#6C3FD6',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    shadowColor: '#6C3FD6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  payBtnDisabled: {
    backgroundColor: '#9B5DE5',
    opacity: 0.8,
  },
  payBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2D1B69',
  },
  modalClose: {
    fontSize: 18,
    color: '#6C5E94',
    fontWeight: 'bold',
  },
  upiOptions: {
    gap: 10,
    marginTop: 6,
  },
  upiItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#EDE8FF',
    padding: 14,
    borderRadius: 12,
  },
  upiEmoji: {
    fontSize: 22,
  },
  upiLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2D1B69',
  },
});
