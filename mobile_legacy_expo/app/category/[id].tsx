import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, FlatList, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ProductService } from '../../src/services/productService';
import { Product } from '../../src/types';

const MOCK_BUNDLE = {
  title: 'Frequently Bought Together Combo',
  discountText: 'Save ₹55 on this study essential bundle!',
  items: [
    { emoji: '📚', name: 'Maths Class VI', price: 150 },
    { emoji: '📓', name: 'Notebook Pack', price: 360 },
    { emoji: '✏️', name: 'Writing Pencil Set', price: 45 },
  ],
  totalPrice: 500,
  mrpTotal: 555,
};

export default function CategoryScreen() {
  const router = useRouter();
  const { id: categoryId } = useLocalSearchParams<{ id: string }>();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);

  useEffect(() => {
    async function loadCategoryProducts() {
      setLoading(true);
      setErrorMsg(null);

      const response = await ProductService.getProducts({
        categoryId: categoryId,
        searchQuery: searchQuery || undefined,
        gradeSuitability: selectedGrade || undefined,
        subjectTag: selectedSubject || undefined,
        maxPrice: maxPrice || undefined,
      });

      if (response.error) {
        setErrorMsg(response.error);
      } else if (response.data) {
        setProducts(response.data);
      }
      setLoading(false);
    }
    loadCategoryProducts();
  }, [categoryId, searchQuery, selectedGrade, selectedSubject, maxPrice]);

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER SECTION */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backIcon}>◀</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            {categoryId ? categoryId.charAt(0).toUpperCase() + categoryId.slice(1) : 'Catalog'} Listing
          </Text>
        </View>

        {/* SEARCH WITHIN CATEGORY */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={`Search within ${categoryId || 'category'}...`}
            placeholderTextColor="#6C5E94"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* FILTER CHIPS (Grade / Classes) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, !selectedGrade ? styles.filterChipActive : null]}
            onPress={() => setSelectedGrade(null)}
          >
            <Text style={[styles.filterChipText, !selectedGrade ? styles.filterChipTextActive : null]}>
              All Grades
            </Text>
          </TouchableOpacity>
          {['Class 6', 'Class 10', 'High School', 'Age 4+'].map((grade) => (
            <TouchableOpacity
              key={grade}
              style={[
                styles.filterChip,
                selectedGrade === grade ? styles.filterChipActive : null,
              ]}
              onPress={() => setSelectedGrade(grade)}
            >
              <Text style={[styles.filterChipText, selectedGrade === grade ? styles.filterChipTextActive : null]}>
                🎓 {grade}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* CORE PRODUCTS GRID LIST */}
      {loading ? (
        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" color="#6C3FD6" />
        </View>
      ) : errorMsg ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyEmoji}>⚠️</Text>
          <Text style={styles.emptyTitle}>Error loading products</Text>
          <Text style={styles.emptySub}>{errorMsg}</Text>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyEmoji}>📦</Text>
          <Text style={styles.emptyTitle}>No products found</Text>
          <Text style={styles.emptySub}>Try adjusting search queries or grade tags</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.gridContainer}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            /* BUNDLES combo package */
            <View style={styles.bundleBox}>
              <Text style={styles.bundleTitle}>{MOCK_BUNDLE.title}</Text>
              <Text style={styles.bundleDiscount}>{MOCK_BUNDLE.discountText}</Text>
              
              <View style={styles.bundleItemsRow}>
                {MOCK_BUNDLE.items.map((item, idx) => (
                  <React.Fragment key={idx}>
                    <View style={styles.bundleItemAvatar}>
                      <Text style={styles.bundleItemEmoji}>{item.emoji}</Text>
                      <Text style={styles.bundleItemName} numberOfLines={1}>{item.name}</Text>
                    </View>
                    {idx < MOCK_BUNDLE.items.length - 1 && <Text style={styles.bundlePlus}>+</Text>}
                  </React.Fragment>
                ))}
              </View>

              <View style={styles.bundleFooter}>
                <View>
                  <Text style={styles.bundlePrice}>₹{MOCK_BUNDLE.totalPrice}</Text>
                  <Text style={styles.bundleMrp}>₹{MOCK_BUNDLE.mrpTotal}</Text>
                </View>
                <TouchableOpacity style={styles.bundleAddBtn}>
                  <Text style={styles.bundleAddText}>ADD BUNDLE</Text>
                </TouchableOpacity>
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.productCard}
              onPress={() => router.push(`/product/${item.id}`)}
            >
              {item.grade_suitability && (
                <View style={styles.gradeBadge}>
                  <Text style={styles.gradeText}>{item.grade_suitability}</Text>
                </View>
              )}
              <View style={styles.productImgBox}>
                <Text style={styles.productImg}>{item.image_url || '📦'}</Text>
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productBrand}>{item.brand}</Text>
                <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                <View style={styles.productFooter}>
                  <View>
                    <Text style={styles.productPrice}>₹{item.price}</Text>
                    <Text style={styles.productMrp}>₹{item.mrp}</Text>
                  </View>
                  <TouchableOpacity style={styles.addButton}>
                    <Text style={styles.addButtonText}>ADD</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F4FF',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#EDE8FF',
    paddingVertical: 12,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 16,
  },
  backButton: {
    padding: 4,
  },
  backIcon: {
    fontSize: 16,
    color: '#6C3FD6',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2D1B69',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE8FF',
    borderRadius: 10,
    paddingHorizontal: 14,
    marginHorizontal: 16,
    height: 40,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
    color: '#2D1B69',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#2D1B69',
    fontWeight: '600',
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EDE8FF',
  },
  filterChipActive: {
    backgroundColor: '#EDE8FF',
    borderColor: '#6C3FD6',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6C5E94',
  },
  filterChipTextActive: {
    color: '#6C3FD6',
  },
  loaderBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 10,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2D1B69',
  },
  emptySub: {
    fontSize: 13,
    color: '#6C5E94',
    textAlign: 'center',
  },
  gridContainer: {
    padding: 16,
    gap: 16,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
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
  bundleBox: {
    backgroundColor: '#FFFBEA',
    borderWidth: 1.5,
    borderColor: '#EDE8FF',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
    gap: 12,
  },
  bundleTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2D1B69',
  },
  bundleDiscount: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  bundleItemsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 4,
  },
  bundleItemAvatar: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDE8FF',
    width: 60,
    height: 60,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    gap: 4,
  },
  bundleItemEmoji: {
    fontSize: 22,
  },
  bundleItemName: {
    fontSize: 8,
    fontWeight: '700',
    color: '#6C5E94',
    textAlign: 'center',
  },
  bundlePlus: {
    fontSize: 16,
    color: '#6C5E94',
    fontWeight: 'bold',
  },
  bundleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#EDE8FF',
    paddingTop: 12,
    marginTop: 4,
  },
  bundlePrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2D1B69',
  },
  bundleMrp: {
    fontSize: 12,
    color: '#6C5E94',
    textDecorationLine: 'line-through',
  },
  bundleAddBtn: {
    backgroundColor: '#F5A623',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  bundleAddText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
