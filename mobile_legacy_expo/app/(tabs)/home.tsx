import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Dimensions, SafeAreaView, DeviceEventEmitter } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { Product } from '../../src/types';
import VoiceAssistantOverlay from '../../src/components/VoiceAssistantOverlay';

const { width } = Dimensions.get('window');

const MOCK_CATEGORIES = [
  { id: 'books', name: 'Books', emoji: '📚' },
  { id: 'stationery', name: 'Stationery', emoji: '✏️' },
  { id: 'toys', name: 'Toys', emoji: '🧸' },
  { id: 'gifts', name: 'Gifts', emoji: '🎁' },
  { id: 'games', name: 'Games', emoji: '🎲' },
];

const MOCK_PRODUCTS: Product[] = [
  {
    id: 'tb-ncert-m6',
    category_id: 'books',
    sub_category: 'textbooks',
    name: 'Mathematics Class VI',
    brand: 'NCERT',
    description: 'Official CBSE textbook',
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
    id: 'tb-ncert-s10',
    category_id: 'books',
    sub_category: 'textbooks',
    name: 'Science Class X',
    brand: 'NCERT',
    description: 'CBSE board guide',
    price: 195,
    mrp: 230,
    stock_quantity: 60,
    image_url: '🔬',
    grade_suitability: 'Class 10',
    subject_tag: 'Science',
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
    name: 'Classmate Notebook (Pack of 6)',
    brand: 'Classmate',
    description: 'ITC Premium notebooks',
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
  {
    id: 'toy-lego-classic',
    category_id: 'toys',
    sub_category: 'toys',
    name: 'LEGO Creative Bricks (484 Pcs)',
    brand: 'LEGO',
    description: 'Colorful building bricks',
    price: 1599,
    mrp: 1999,
    stock_quantity: 8,
    image_url: '🧱',
    grade_suitability: 'Age 4+',
    subject_tag: 'Blocks',
    is_featured: true,
    is_bestseller: false,
    is_active: true,
    created_at: '',
    updated_at: '',
  },
];

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [countdownTime, setCountdownTime] = useState({ hrs: 2, mins: 44, secs: 15 });
  const [voiceVisible, setVoiceVisible] = useState(false);

  useEffect(() => {
    const searchSub = DeviceEventEmitter.addListener('voice_search', (payload) => {
      setVoiceVisible(false);
      if (payload.query) {
        setSearchQuery(payload.query);
        router.push({
          pathname: "/category/[id]",
          params: { id: "books", search: payload.query, grade: payload.grade || '' }
        });
      }
    });

    const recommendSub = DeviceEventEmitter.addListener('voice_recommend', (payload) => {
      setVoiceVisible(false);
      router.push({
        pathname: "/category/[id]",
        params: { id: "books", search: payload.query || 'gifts', filter: 'recommend' }
      });
    });

    const addSub = DeviceEventEmitter.addListener('voice_add_to_cart', () => {
      setVoiceVisible(false);
      router.push('/(tabs)/cart');
    });

    return () => {
      searchSub.remove();
      recommendSub.remove();
      addSub.remove();
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownTime((prev) => {
        if (prev.secs > 0) {
          return { ...prev, secs: prev.secs - 1 };
        } else if (prev.mins > 0) {
          return { hrs: prev.hrs, mins: prev.mins - 1, secs: 59 };
        } else if (prev.hrs > 0) {
          return { hrs: prev.hrs - 1, mins: 59, secs: 59 };
        } else {
          clearInterval(timer);
          return prev;
        }
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatNumber = (num: number) => (num < 10 ? `0${num}` : num);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 1. LOCATION SELECTOR */}
        <View style={styles.header}>
          <View style={styles.locationSelector}>
            <Text style={styles.locIcon}>📍</Text>
            <View>
              <Text style={styles.locLabel}>Delivering in 10-30 Mins</Text>
              <Text style={styles.locAddress}>Hazratganj, Lucknow</Text>
            </View>
            <Text style={styles.arrowIcon}>▼</Text>
          </View>
          <View style={styles.profileBadge}>
            <Text style={styles.profileEmoji}>👤</Text>
          </View>
        </View>

        {/* 2. SEARCH BAR */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search original NCERT, classmate..."
              placeholderTextColor="#6C5E94"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity style={styles.micButton} onPress={() => setVoiceVisible(true)}>
              <Text style={styles.micIcon}>🎤</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. CATEGORY CHIPS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          <TouchableOpacity
            style={[styles.categoryChip, !selectedCategory ? styles.categoryChipActive : null]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[styles.categoryChipText, !selectedCategory ? styles.categoryChipTextActive : null]}>
              ✨ Deals
            </Text>
          </TouchableOpacity>
          {MOCK_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryChip,
                selectedCategory === cat.id ? styles.categoryChipActive : null,
              ]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text style={[styles.categoryChipText, selectedCategory === cat.id ? styles.categoryChipTextActive : null]}>
                {cat.emoji} {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 4. HERO BANNER CAROUSEL */}
        <View style={styles.carouselContainer}>
          <View style={styles.heroBanner}>
            <View style={styles.bannerTextContainer}>
              <Text style={styles.bannerTag}>Lucknow Zone</Text>
              <Text style={styles.bannerTitle}>Class 1 to 12 Books</Text>
              <Text style={styles.bannerDiscount}>Flat 20% Off Today</Text>
            </View>
            <Text style={styles.bannerEmoji}>🎒</Text>
          </View>
        </View>

        {/* 5. COUNTDOWN FLASH DEALS */}
        <View style={styles.flashDealsBox}>
          <View style={styles.flashHeader}>
            <View style={styles.flashTitleContainer}>
              <Text style={styles.flashIcon}>⚡</Text>
              <Text style={styles.flashTitle}>Flash Deals</Text>
            </View>
            <View style={styles.timerContainer}>
              <Text style={styles.timerText}>
                {formatNumber(countdownTime.hrs)}:{formatNumber(countdownTime.mins)}:{formatNumber(countdownTime.secs)}
              </Text>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productsScroll}>
            {MOCK_PRODUCTS.slice(0, 3).map((prod) => (
              <View key={prod.id} style={styles.productCard}>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>15% Off</Text>
                </View>
                <View style={styles.productImgBox}>
                  <Text style={styles.productImg}>{prod.image_url}</Text>
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productBrand}>{prod.brand}</Text>
                  <Text style={styles.productName} numberOfLines={2}>{prod.name}</Text>
                  <View style={styles.productFooter}>
                    <View>
                      <Text style={styles.productPrice}>₹{prod.price}</Text>
                      <Text style={styles.productMrp}>₹{prod.mrp}</Text>
                    </View>
                    <TouchableOpacity style={styles.addButton}>
                      <Text style={styles.addButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* 6. SHOP BY CATEGORY 2x3 ICON GRID */}
        <View style={styles.gridSection}>
          <Text style={styles.sectionTitle}>Shop By Category</Text>
          <View style={styles.categoryGrid}>
            {MOCK_CATEGORIES.map((cat) => (
              <TouchableOpacity key={cat.id} style={styles.gridCard} onPress={() => setSelectedCategory(cat.id)}>
                <View style={styles.gridCircle}>
                  <Text style={styles.gridEmoji}>{cat.emoji}</Text>
                </View>
                <Text style={styles.gridLabel}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.gridCard} onPress={() => setSelectedCategory(null)}>
              <View style={styles.gridCircle}>
                <Text style={styles.gridEmoji}>➕</Text>
              </View>
              <Text style={styles.gridLabel}>More</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 7. TOP PICKS FOR YOU */}
        <View style={styles.horizontalSection}>
          <Text style={styles.sectionTitle}>Bestselling Essentials</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productsScroll}>
            {MOCK_PRODUCTS.map((prod) => (
              <View key={prod.id} style={styles.productCard}>
                <View style={styles.gradeBadge}>
                  <Text style={styles.gradeText}>{prod.grade_suitability}</Text>
                </View>
                <View style={styles.productImgBox}>
                  <Text style={styles.productImg}>{prod.image_url}</Text>
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productBrand}>{prod.brand}</Text>
                  <Text style={styles.productName} numberOfLines={2}>{prod.name}</Text>
                  <View style={styles.productFooter}>
                    <View>
                      <Text style={styles.productPrice}>₹{prod.price}</Text>
                      <Text style={styles.productMrp}>₹{prod.mrp}</Text>
                    </View>
                    <TouchableOpacity style={styles.addButton}>
                      <Text style={styles.addButtonText}>ADD</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

      </ScrollView>
      <VoiceAssistantOverlay visible={voiceVisible} onClose={() => setVoiceVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F4FF', // Background: Snow White-Purple tint
  },
  scrollContent: {
    paddingVertical: 16,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EDE8FF',
    shadowColor: '#2D1B69',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  locIcon: {
    fontSize: 18,
  },
  locLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6C5E94',
    textTransform: 'uppercase',
  },
  locAddress: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2D1B69',
  },
  arrowIcon: {
    fontSize: 10,
    color: '#6C3FD6',
    marginLeft: 4,
  },
  profileBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EDE8FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EDE8FF',
  },
  profileEmoji: {
    fontSize: 18,
  },
  searchSection: {
    paddingHorizontal: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE8FF', // Lavender background, no border, 10px radius
    borderRadius: 10,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
    color: '#2D1B69',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#2D1B69',
    fontWeight: '600',
  },
  micButton: {
    backgroundColor: '#6C3FD6',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micIcon: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDE8FF',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8, // Chip radius: 8px
  },
  categoryChipActive: {
    backgroundColor: '#6C3FD6',
    borderColor: '#6C3FD6',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2D1B69',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  carouselContainer: {
    paddingHorizontal: 16,
  },
  heroBanner: {
    backgroundColor: '#9B5DE5', // Secondary Soft Violet
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 120,
    shadowColor: '#6C3FD6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  bannerTextContainer: {
    gap: 4,
  },
  bannerTag: {
    backgroundColor: '#F5A623', // Accent Golden Amber
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
    textTransform: 'uppercase',
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bannerDiscount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  bannerEmoji: {
    fontSize: 50,
  },
  flashDealsBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDE8FF',
    marginHorizontal: 16,
    borderRadius: 16,
    paddingVertical: 14,
    gap: 12,
  },
  flashHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  flashTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  flashIcon: {
    fontSize: 16,
  },
  flashTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2D1B69',
  },
  timerContainer: {
    backgroundColor: '#F5A623',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  timerText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2D1B69',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  gridSection: {
    gap: 4,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  gridCard: {
    width: '22%',
    alignItems: 'center',
    gap: 6,
  },
  gridCircle: {
    width: 56,
    height: 56,
    borderRadius: 12, // Grid radius: 12px
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDE8FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2D1B69',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
  },
  gridEmoji: {
    fontSize: 24,
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2D1B69',
    textAlign: 'center',
  },
  horizontalSection: {
    gap: 4,
  },
  productsScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  productCard: {
    width: 140,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDE8FF',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#2D1B69',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#EF4444',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    zIndex: 10,
  },
  discountText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  gradeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#EDE8FF',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    zIndex: 10,
  },
  gradeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#6C3FD6',
  },
  productImgBox: {
    height: 110,
    backgroundColor: '#EDE8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImg: {
    fontSize: 44,
  },
  productInfo: {
    padding: 10,
    gap: 4,
  },
  productBrand: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6C5E94',
    textTransform: 'uppercase',
  },
  productName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2D1B69',
    height: 32,
    lineHeight: 16,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 4,
  },
  productPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2D1B69',
  },
  productMrp: {
    fontSize: 10,
    color: '#6C5E94',
    textDecorationLine: 'line-through',
  },
  addButton: {
    borderWidth: 1.5,
    borderColor: '#6C3FD6',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  addButtonText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#6C3FD6',
  },
});
