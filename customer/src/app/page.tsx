'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Product, Category } from '../types';
import { ProductService } from '../services/productService';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useLocationStore } from '../store/locationStore';
import { useWebVoiceAgent } from '../hooks/useWebVoiceAgent';
import VoiceAssistantOverlay from '../components/VoiceAssistantOverlay';
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import CategoryStrip from '../components/CategoryStrip';
import ProductGrid from '../components/ProductGrid';
import FlashDealsBanner from '../components/FlashDealsBanner';
import Footer from '../components/Footer';
import BestSellers from '../components/BestSellers';
import Testimonials from '../components/Testimonials';
import CartBar from '../components/CartBar';

export default function HomePage() {
  const { user, isAuthenticated, setSession } = useAuthStore();
  const { items, addItem } = useCartStore();
  const { nearestStore, distanceKm, setDeliveryAddress, fetchStores, availableStores } = useLocationStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingSlide, setOnboardingSlide] = useState(0);
  const [splashParticles, setSplashParticles] = useState<{ id: number; x: string; y: string }[]>([]);

  const demoProducts: Product[] = [
    // 🌾 Atta, Rice & Dal
    {
      id: 'atta-aashirvaad-5kg', category_id: 'atta-rice-dal', sub_category: 'flours',
      name: 'Aashirvaad Shudh Chakki Atta', brand: 'Aashirvaad', unit: '5 kg',
      description: '100% whole wheat flour with natural dietary fiber and superior aroma.',
      price: 245, mrp: 275, stock_quantity: 50, grade_suitability: '5 kg',
      subject_tag: 'Whole Wheat', image_url: 'linear-gradient(135deg, #FEF08A 0%, #EAB308 100%)',
      is_featured: true, is_bestseller: true, is_active: true, slug: 'aashirvaad-shudh-chakki-atta-5kg',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    },
    {
      id: 'rice-daawat-5kg', category_id: 'atta-rice-dal', sub_category: 'rice',
      name: 'Daawat Rozana Super Basmati Rice', brand: 'Daawat', unit: '5 kg',
      description: 'Fluffy, long grain aromatic basmati rice for daily royal meals.',
      price: 380, mrp: 450, stock_quantity: 40, grade_suitability: '5 kg',
      subject_tag: 'Basmati', image_url: 'linear-gradient(135deg, #FDE68A 0%, #D97706 100%)',
      is_featured: true, is_bestseller: true, is_active: true, slug: 'daawat-rozana-super-basmati-rice-5kg',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    },
    {
      id: 'dal-tata-toor-1kg', category_id: 'atta-rice-dal', sub_category: 'pulses',
      name: 'Tata Sampann Unpolished Toor Dal', brand: 'Tata Sampann', unit: '1 kg',
      description: 'Rich in natural protein, unpolished arhar dal with no artificial colors.',
      price: 175, mrp: 195, stock_quantity: 60, grade_suitability: '1 kg',
      subject_tag: 'Toor Dal', image_url: 'linear-gradient(135deg, #FED7AA 0%, #EA580C 100%)',
      is_featured: true, is_bestseller: true, is_active: true, slug: 'tata-sampann-toor-dal-1kg',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    },

    // 🫒 Oil, Ghee & Masala
    {
      id: 'oil-fortune-sunflower-1l', category_id: 'oil-ghee-masala', sub_category: 'cooking-oil',
      name: 'Fortune Sunlite Refined Sunflower Oil', brand: 'Fortune', unit: '1 L',
      description: 'Light, healthy cooking oil enriched with Vitamin A and Vitamin D.',
      price: 135, mrp: 160, stock_quantity: 45, grade_suitability: '1 L Pouch',
      subject_tag: 'Cooking Oil', image_url: 'linear-gradient(135deg, #FDE047 0%, #CA8A04 100%)',
      is_featured: true, is_bestseller: true, is_active: true, slug: 'fortune-sunlite-sunflower-oil-1l',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    },
    {
      id: 'ghee-amul-1l', category_id: 'oil-ghee-masala', sub_category: 'ghee',
      name: 'Amul Pure Desi Ghee', brand: 'Amul', unit: '1 L',
      description: 'Traditional granular rich aroma pure cow and buffalo milk ghee.',
      price: 595, mrp: 650, stock_quantity: 35, grade_suitability: '1 L Carton',
      subject_tag: 'Pure Ghee', image_url: 'linear-gradient(135deg, #FEF08A 0%, #B45309 100%)',
      is_featured: true, is_bestseller: true, is_active: true, slug: 'amul-pure-desi-ghee-1l',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    },
    {
      id: 'masala-catch-garam-100g', category_id: 'oil-ghee-masala', sub_category: 'spices',
      name: 'Catch Super Garam Masala', brand: 'Catch', unit: '100 g',
      description: 'Authentic blend of aromatic spices for rich Indian curries.',
      price: 75, mrp: 85, stock_quantity: 80, grade_suitability: '100 g Box',
      subject_tag: 'Spices', image_url: 'linear-gradient(135deg, #FCA5A5 0%, #DC2626 100%)',
      is_featured: false, is_bestseller: true, is_active: true, slug: 'catch-garam-masala-100g',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    },

    // 🥛 Dairy, Bread & Eggs
    {
      id: 'milk-amul-taaza-1l', category_id: 'dairy-bread-eggs', sub_category: 'milk',
      name: 'Amul Taaza Toned Fresh Milk', brand: 'Amul', unit: '1 L',
      description: 'Fresh homogenised toned milk, rich in calcium and essential vitamins.',
      price: 54, mrp: 56, stock_quantity: 100, grade_suitability: '1 L Tetra',
      subject_tag: 'Fresh Milk', image_url: 'linear-gradient(135deg, #93C5FD 0%, #2563EB 100%)',
      is_featured: true, is_bestseller: true, is_active: true, slug: 'amul-taaza-toned-milk-1l',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    },
    {
      id: 'butter-amul-500g', category_id: 'dairy-bread-eggs', sub_category: 'butter',
      name: 'Amul Pasteurised Salted Butter', brand: 'Amul', unit: '500 g',
      description: 'Utterly butterly delicious creamy table butter for breakfast toasts.',
      price: 275, mrp: 285, stock_quantity: 60, grade_suitability: '500 g',
      subject_tag: 'Table Butter', image_url: 'linear-gradient(135deg, #FEF08A 0%, #F59E0B 100%)',
      is_featured: true, is_bestseller: true, is_active: true, slug: 'amul-salted-butter-500g',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    },
    {
      id: 'bread-britannia-wheat-400g', category_id: 'dairy-bread-eggs', sub_category: 'bread',
      name: 'Britannia 100% Whole Wheat Bread', brand: 'Britannia', unit: '400 g',
      description: 'Zero maida, soft sliced healthy whole wheat loaf baked fresh daily.',
      price: 50, mrp: 55, stock_quantity: 40, grade_suitability: '400 g Pack',
      subject_tag: 'Fresh Bread', image_url: 'linear-gradient(135deg, #FDBA74 0%, #C2410C 100%)',
      is_featured: true, is_bestseller: true, is_active: true, slug: 'britannia-whole-wheat-bread-400g',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    },
    {
      id: 'eggs-farm-fresh-6pc', category_id: 'dairy-bread-eggs', sub_category: 'eggs',
      name: 'Farm Fresh White Table Eggs (Pack of 6)', brand: 'Farm Fresh', unit: '6 pcs',
      description: 'Clean, sanitized high protein farm eggs packed safely.',
      price: 55, mrp: 65, stock_quantity: 50, grade_suitability: '6 Eggs Pack',
      subject_tag: 'Farm Eggs', image_url: 'linear-gradient(135deg, #E2E8F0 0%, #94A3B8 100%)',
      is_featured: true, is_bestseller: false, is_active: true, slug: 'farm-fresh-eggs-6pc',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    },

    // 🍜 Instant & Frozen
    {
      id: 'instant-maggi-4pack', category_id: 'instant-frozen', sub_category: 'noodles',
      name: 'Maggi 2-Minute Masala Instant Noodles', brand: 'Maggi', unit: 'Pack of 4',
      description: 'Iconic masala flavor instant noodles, favorite snack ready in 2 minutes.',
      price: 56, mrp: 60, stock_quantity: 90, grade_suitability: '4 x 70g Pack',
      subject_tag: 'Instant Noodles', image_url: 'linear-gradient(135deg, #FDE047 0%, #DC2626 100%)',
      is_featured: true, is_bestseller: true, is_active: true, slug: 'maggi-2-minute-masala-noodles-4pack',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    },
    {
      id: 'frozen-mccain-fries-420g', category_id: 'instant-frozen', sub_category: 'frozen-snacks',
      name: 'McCain French Fries Crispy', brand: 'McCain', unit: '420 g',
      description: 'Crispy golden restaurant style french fries, ready to fry or bake.',
      price: 125, mrp: 145, stock_quantity: 30, grade_suitability: '420 g Pouch',
      subject_tag: 'Frozen Snack', image_url: 'linear-gradient(135deg, #FCD34D 0%, #B45309 100%)',
      is_featured: false, is_bestseller: true, is_active: true, slug: 'mccain-french-fries-420g',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    },

    // 🍫 Sweets & Chocolates
    {
      id: 'choc-cadbury-silk-150g', category_id: 'chocolates-sweets', sub_category: 'chocolates',
      name: 'Cadbury Dairy Milk Silk Chocolate Bar', brand: 'Cadbury', unit: '150 g',
      description: 'Silky smooth, melt in your mouth premium milk chocolate experience.',
      price: 165, mrp: 185, stock_quantity: 50, grade_suitability: '150 g Bar',
      subject_tag: 'Chocolate', image_url: 'linear-gradient(135deg, #C084FC 0%, #581C87 100%)',
      is_featured: true, is_bestseller: true, is_active: true, slug: 'cadbury-dairy-milk-silk-150g',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    },
    {
      id: 'sweets-haldiram-gulabjamun-1kg', category_id: 'chocolates-sweets', sub_category: 'indian-sweets',
      name: "Haldiram's Gulab Jamun Tin", brand: "Haldiram's", unit: '1 kg',
      description: 'Soft, juicy cottage cheese dumplings soaked in aromatic cardamom sugar syrup.',
      price: 230, mrp: 260, stock_quantity: 25, grade_suitability: '1 kg Tin',
      subject_tag: 'Indian Mithai', image_url: 'linear-gradient(135deg, #FED7AA 0%, #7C2D12 100%)',
      is_featured: false, is_bestseller: false, is_active: true, slug: 'haldirams-gulab-jamun-1kg',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    },

    // 🍪 Bakery & Biscuits
    {
      id: 'bisc-britannia-goodday-600g', category_id: 'bakery-biscuits', sub_category: 'cookies',
      name: 'Britannia Good Day Cashew Cookies', brand: 'Britannia', unit: '600 g',
      description: 'Rich buttery cookies packed with crunchy real cashew nuts.',
      price: 130, mrp: 150, stock_quantity: 60, grade_suitability: '600 g Family Pack',
      subject_tag: 'Cookies', image_url: 'linear-gradient(135deg, #FDE68A 0%, #D97706 100%)',
      is_featured: true, is_bestseller: true, is_active: true, slug: 'britannia-good-day-cashew-cookies-600g',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    },
    {
      id: 'bisc-parleg-gold-1kg', category_id: 'bakery-biscuits', sub_category: 'glucose',
      name: 'Parle-G Gold Glucose Biscuits', brand: 'Parle', unit: '1 kg',
      description: 'The golden original Indian chai biscuit, fortified with milk and wheat.',
      price: 110, mrp: 125, stock_quantity: 70, grade_suitability: '1 kg Value Pack',
      subject_tag: 'Biscuits', image_url: 'linear-gradient(135deg, #FBBF24 0%, #92400E 100%)',
      is_featured: false, is_bestseller: true, is_active: true, slug: 'parle-g-gold-biscuits-1kg',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    },

    // 🥤 Drinks & Juices
    {
      id: 'drink-coke-can-300ml', category_id: 'drinks-juices', sub_category: 'cold-drinks',
      name: 'Coca-Cola Soft Drink Can', brand: 'Coca-Cola', unit: '300 ml',
      description: 'Chilled refreshing sparkling cola, best companion for snacks & meals.',
      price: 40, mrp: 40, stock_quantity: 80, grade_suitability: '300 ml Can',
      subject_tag: 'Cold Drink', image_url: 'linear-gradient(135deg, #F87171 0%, #991B1B 100%)',
      is_featured: true, is_bestseller: true, is_active: true, slug: 'coca-cola-can-300ml',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    },
    {
      id: 'juice-real-mixed-1l', category_id: 'drinks-juices', sub_category: 'juices',
      name: 'Real Fruit Power Mixed Fruit Juice', brand: 'Real', unit: '1 L',
      description: 'Prepared with 9 real fruit goodness, rich in Vitamin C, no added preservatives.',
      price: 115, mrp: 135, stock_quantity: 45, grade_suitability: '1 L Tetra',
      subject_tag: 'Fruit Juice', image_url: 'linear-gradient(135deg, #FB923C 0%, #C2410C 100%)',
      is_featured: true, is_bestseller: false, is_active: true, slug: 'real-mixed-fruit-juice-1l',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    },

    // 🥨 Chips & Namkeen
    {
      id: 'chips-lays-magic-masala-50g', category_id: 'chips-namkeen', sub_category: 'chips',
      name: "Lay's India's Magic Masala Potato Chips", brand: "Lay's", unit: '50 g',
      description: 'Crispy wafer thin potato chips seasoned with aromatic Indian spices.',
      price: 20, mrp: 20, stock_quantity: 120, grade_suitability: '50 g Pouch',
      subject_tag: 'Crisps', image_url: 'linear-gradient(135deg, #60A5FA 0%, #1E40AF 100%)',
      is_featured: true, is_bestseller: true, is_active: true, slug: 'lays-magic-masala-chips-50g',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    },
    {
      id: 'namkeen-haldiram-bhujia-400g', category_id: 'chips-namkeen', sub_category: 'namkeen',
      name: "Haldiram's Nagpur Aloo Bhujia", brand: "Haldiram's", unit: '400 g',
      description: 'Crunchy potato & chickpea flour noodles with minty tangy masala.',
      price: 110, mrp: 125, stock_quantity: 85, grade_suitability: '400 g Pack',
      subject_tag: 'Namkeen', image_url: 'linear-gradient(135deg, #FDE047 0%, #CA8A04 100%)',
      is_featured: true, is_bestseller: true, is_active: true, slug: 'haldirams-aloo-bhujia-400g',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    },

    // 🧼 Cleaning Essentials
    {
      id: 'clean-lizol-citrus-500ml', category_id: 'cleaning-essentials', sub_category: 'floor-cleaner',
      name: 'Lizol Disinfectant Floor Cleaner (Citrus)', brand: 'Lizol', unit: '500 ml',
      description: 'Kills 99.9% germs, leaves long lasting citrus freshness on all floor surfaces.',
      price: 110, mrp: 125, stock_quantity: 40, grade_suitability: '500 ml Bottle',
      subject_tag: 'Disinfectant', image_url: 'linear-gradient(135deg, #FCD34D 0%, #EA580C 100%)',
      is_featured: true, is_bestseller: true, is_active: true, slug: 'lizol-disinfectant-cleaner-citrus-500ml',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    },
    {
      id: 'clean-vim-gel-750ml', category_id: 'cleaning-essentials', sub_category: 'dishwash',
      name: 'Vim Lemon Dishwash Liquid Gel', brand: 'Vim', unit: '750 ml',
      description: 'Concentrated gel with the power of 100 lemons, cuts stubborn grease easily.',
      price: 140, mrp: 165, stock_quantity: 50, grade_suitability: '750 ml Bottle',
      subject_tag: 'Dishwash Gel', image_url: 'linear-gradient(135deg, #86EFAC 0%, #15803D 100%)',
      is_featured: false, is_bestseller: true, is_active: true, slug: 'vim-dishwash-gel-lemon-750ml',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    },

    // ☕ Tea, Coffee & More
    {
      id: 'tea-tata-gold-500g', category_id: 'tea-coffee', sub_category: 'tea',
      name: 'Tata Tea Gold Premium Long Leaf Tea', brand: 'Tata Tea', unit: '500 g',
      description: 'Rich taste and irresistible aroma blended with gently rolled long tea leaves.',
      price: 295, mrp: 340, stock_quantity: 45, grade_suitability: '500 g Pack',
      subject_tag: 'Black Tea', image_url: 'linear-gradient(135deg, #FDE68A 0%, #78350F 100%)',
      is_featured: true, is_bestseller: true, is_active: true, slug: 'tata-tea-gold-500g',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    },
    {
      id: 'coffee-nescafe-classic-100g', category_id: 'tea-coffee', sub_category: 'coffee',
      name: 'Nescafé Classic 100% Pure Instant Coffee', brand: 'Nescafe', unit: '100 g',
      description: 'Start your morning with rich taste and stimulating aroma in every sip.',
      price: 310, mrp: 350, stock_quantity: 35, grade_suitability: '100 g Glass Jar',
      subject_tag: 'Instant Coffee', image_url: 'linear-gradient(135deg, #FED7AA 0%, #431407 100%)',
      is_featured: true, is_bestseller: false, is_active: true, slug: 'nescafe-classic-instant-coffee-100g',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    },
  ];

  const demoCategories: Category[] = [
    { id: 'all', name: 'All Items', emoji: '🛒', sort_order: 1, is_active: true, created_at: '' },
    { id: 'atta-rice-dal', name: 'Atta, Rice & Dal', emoji: '🌾', sort_order: 2, is_active: true, created_at: '' },
    { id: 'oil-ghee-masala', name: 'Oil, Ghee & Masala', emoji: '🫒', sort_order: 3, is_active: true, created_at: '' },
    { id: 'dairy-bread-eggs', name: 'Dairy, Bread & Eggs', emoji: '🥛', sort_order: 4, is_active: true, created_at: '' },
    { id: 'instant-frozen', name: 'Instant & Frozen', emoji: '🍜', sort_order: 5, is_active: true, created_at: '' },
    { id: 'chocolates-sweets', name: 'Sweets & Chocolates', emoji: '🍫', sort_order: 6, is_active: true, created_at: '' },
    { id: 'bakery-biscuits', name: 'Bakery & Biscuits', emoji: '🍪', sort_order: 7, is_active: true, created_at: '' },
    { id: 'drinks-juices', name: 'Drinks & Juices', emoji: '🥤', sort_order: 8, is_active: true, created_at: '' },
    { id: 'chips-namkeen', name: 'Chips & Namkeen', emoji: '🥨', sort_order: 9, is_active: true, created_at: '' },
    { id: 'cleaning-essentials', name: 'Cleaning Essentials', emoji: '🧼', sort_order: 10, is_active: true, created_at: '' },
    { id: 'tea-coffee', name: 'Tea, Coffee & More', emoji: '☕', sort_order: 11, is_active: true, created_at: '' },
  ];

  useEffect(() => {
    fetchStores();
    setCategories(demoCategories);
    loadCatalogData();

    const particles = Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      x: `${(Math.random() - 0.5) * 300}px`,
      y: `${(Math.random() - 0.5) * 300}px`,
    }));
    setSplashParticles(particles);

    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 1800);

    const handleAuthSkipped = () => {
      if (!isAuthenticated || !user?.role) {
        setShowOnboarding(true);
      }
    };
    window.addEventListener('authSkipped', handleAuthSkipped);

    return () => {
      clearTimeout(splashTimer);
      window.removeEventListener('authSkipped', handleAuthSkipped);
    };
  }, []);

  useEffect(() => {
    if (availableStores.length > 0 && !selectedStoreId) {
      const firstStore = availableStores[0];
      setSelectedStoreId(firstStore.id);
      setDeliveryAddress(firstStore.address, firstStore.latitude, firstStore.longitude);
    }
  }, [availableStores]);

  const loadCatalogData = async () => {
    setLoading(true);
    try {
      const filter: any = {};
      if (selectedCategory !== 'all') filter.categoryId = selectedCategory;
      if (searchQuery) filter.searchQuery = searchQuery;

      const response = await ProductService.getProducts(filter);
      if (response.data && response.data.length > 0) {
        setProducts(response.data);
      } else {
        let filtered = demoProducts;
        if (selectedCategory !== 'all') filtered = filtered.filter((p) => p.category_id === selectedCategory);
        if (searchQuery) {
          filtered = filtered.filter(
            (p) =>
              p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              p.brand.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        setProducts(filtered);
      }
    } catch {
      setProducts(demoProducts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCatalogData(); }, [selectedCategory, searchQuery]);

  const handleStoreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const storeId = e.target.value;
    if (storeId === 'add_address') {
      window.location.href = '/setup';
      return;
    }
    setSelectedStoreId(storeId);
    const store = availableStores.find((s) => s.id === storeId);
    if (store) setDeliveryAddress(store.address, store.latitude, store.longitude);
  };

  const handleVoiceIntent = (intent: any) => {
    if (intent.action === 'search') {
      if (intent.payload?.categoryId) setSelectedCategory(intent.payload.categoryId);
      if (intent.payload?.query) setSearchQuery(intent.payload.query);
    } else if (intent.action === 'add_to_cart') {
      const prodId = intent.payload?.productId;
      const qty = intent.payload?.quantity || 1;
      const targetProd = demoProducts.find((p) => p.id === prodId) || products.find((p) => p.id === prodId);
      if (targetProd) addItem(targetProd, qty);
    } else if (intent.action === 'checkout') {
      window.location.href = '/cart';
    }
  };

  const {
    isRecording, isAnalyzing, transcript, aiResponse, error: voiceError,
    startRecording, stopRecording, clearState: clearVoiceState,
  } = useWebVoiceAgent(handleVoiceIntent);

  const toggleVoiceRecording = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  const handleRoleSelection = () => {
    setShowOnboarding(false);
  };

  // ── BLINKIT-STYLE QUICK COMMERCE SPLASH SCREEN ──
  if (showSplash) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', position: 'relative', overflow: 'hidden', backgroundColor: '#F6F8F6',
        width: '100%',
      }}>
        {splashParticles.map((p) => (
          <span key={p.id} className="splash-particle"
            style={{ '--x': p.x, '--y': p.y, left: '50%', top: '50%', animationDelay: `${Math.random() * 0.4}s` } as React.CSSProperties}
          />
        ))}
        <div className="splash-logo-anim" style={{ zIndex: 10, textAlign: 'center', maxWidth: '380px', padding: '0 24px' }}>
          {/* Animated Bag / Lightning badge */}
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '90px', height: '90px', margin: '0 auto 18px' }}>
            <div className="grocery-pulse-ring" />
            <div style={{
              width: '90px', height: '90px', borderRadius: '26px',
              background: 'linear-gradient(135deg, #0C831F 0%, #15A029 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 14px 34px rgba(12, 131, 31, 0.35)', fontSize: '42px',
            }}>
              🛍️
            </div>
            <span style={{
              position: 'absolute', bottom: '-4px', right: '-4px',
              background: 'var(--accent)', color: '#1A1A1A', fontWeight: 900,
              fontSize: '11px', padding: '3px 8px', borderRadius: '9999px',
              border: '2px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
            }}>
              ⚡ 10m
            </span>
          </div>

          <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '2.5rem', color: 'var(--primary)', letterSpacing: '-0.5px', display: 'block', lineHeight: 1.1 }}>
            XYZ GROCERY
          </span>
          <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.18em', color: '#1C241E', fontWeight: 800, marginTop: '8px' }}>
            Instant Delivery to Your Doorstep
          </p>

          {/* Progress bar */}
          <div style={{ height: '5px', width: '160px', margin: '20px auto 12px', borderRadius: '9999px', background: '#E2E8F0', overflow: 'hidden' }}>
            <div className="grocery-progress-bar" style={{ height: '100%', background: 'linear-gradient(90deg, #0C831F, #F7C325)', borderRadius: '9999px' }} />
          </div>

          <p style={{ fontSize: '11px', color: '#555', fontWeight: 600 }}>
            Delivering fresh groceries in 10–15 mins 🚀
          </p>
        </div>
        <span style={{ position: 'absolute', bottom: '2rem', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--primary)', fontWeight: 700 }}>
          ⚡ Fresh Stock Dispatched Locally
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--background)', width: '100%' }}>

      {/* ── NAVBAR ── */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedStoreId={selectedStoreId}
        onStoreChange={handleStoreChange}
        availableStores={availableStores}
        distanceKm={distanceKm}
      />

      {/* ── MAIN CONTENT ── */}
      <main className="main-content" id="main-content">
        <div className="page-container">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', paddingTop: '28px', paddingBottom: '64px' }}>

            {/* Step 2 — Hero Section */}
            <HeroSection />

            {/* Step 3 — Category Grid */}
            <CategoryStrip
              selectedCategory={selectedCategory}
              onSelect={setSelectedCategory}
            />

            {/* Super Saver Daily Staples (Atta, Milk, Bread, Oil) */}
            <section aria-label="Super Saver Staples" id="products-section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">⚡ Daily Kitchen Staples</h2>
                  <p className="section-subtitle">Lowest everyday prices on Atta, Milk, Dal &amp; Oil</p>
                </div>
                <span className="section-badge" style={{ background: '#EBF7EE', color: 'var(--primary)', border: '1px solid #C2E8C9' }}>
                  Delivering in 10–15 mins
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                {demoProducts.slice(0, 4).map((item) => (
                  <div key={item.id} className="stitch-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '16px', background: '#fff', border: '1px solid var(--outline)' }}>
                    <div style={{ position: 'relative', height: '120px', borderRadius: '12px', background: item.image_url || 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '42px' }}>
                        {item.category_id === 'atta-rice-dal' ? '🌾' : item.category_id === 'oil-ghee-masala' ? '🫒' : '🥛'}
                      </span>
                      {item.is_bestseller && (
                        <span style={{ position: 'absolute', top: '8px', left: '8px', background: 'var(--accent)', color: '#1A1A1A', fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                          ⚡ Top Saver
                        </span>
                      )}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)' }}>{item.brand}</span>
                        {item.unit && (
                          <span style={{ fontSize: '10px', fontWeight: 700, background: '#EBF7EE', color: 'var(--primary)', padding: '1px 6px', borderRadius: '4px' }}>
                            {item.unit}
                          </span>
                        )}
                      </div>
                      <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--deep-text)', minHeight: '36px', lineHeight: 1.3 }}>
                        {item.name}
                      </h3>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
                      <div>
                        <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--deep-text)' }}>₹{item.price}</span>
                        {item.mrp > item.price && (
                          <span style={{ fontSize: '0.75rem', color: '#888', textDecoration: 'line-through', marginLeft: '6px' }}>₹{item.mrp}</span>
                        )}
                      </div>
                      <button onClick={() => addItem(item, 1)} className="product-add-btn" id={`btn-staple-add-${item.id}`} aria-label={`Add ${item.name} to cart`}>
                        Add +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Best Sellers row — below How It Works */}
            <BestSellers products={demoProducts} onAddToCart={(p) => addItem(p, 1)} />

            {/* Flash Deals Banner */}
            <FlashDealsBanner products={demoProducts} onAddToCart={(p) => addItem(p, 1)} />

            {/* Browse / Product Grid */}
            <ProductGrid products={products} loading={loading} onAddToCart={(p) => addItem(p, 1)} />

            {/* Testimonials */}
            <Testimonials />

            {/* Shop by Category Grid */}
            <section aria-label="Shop by category">
              <div className="section-header">
                <h2 className="section-title">🛍️ Shop By Category</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
                {demoCategories.map((c) => (
                  <button key={c.id} onClick={() => setSelectedCategory(c.id)} className="stitch-card stitch-card-hover"
                    style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '28px 16px', textAlign: 'center' }}>
                    <span style={{ fontSize: '2.5rem' }}>{c.emoji}</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--deep-text)' }}>{c.name}</span>
                  </button>
                ))}
              </div>
            </section>



          </div>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <Footer />

      {/* ── STICKY CART BAR ── */}
      <CartBar />

      {/* ── AI VOICE OVERLAY (modal only, no floating FAB) ── */}
      <VoiceAssistantOverlay
        isOpen={isVoiceOpen}
        isRecording={isRecording}
        isAnalyzing={isAnalyzing}
        transcript={transcript}
        aiResponse={aiResponse}
        error={voiceError}
        onClose={() => { setIsVoiceOpen(false); clearVoiceState(); }}
        onRecordToggle={toggleVoiceRecording}
      />
    </div>
  );
}
