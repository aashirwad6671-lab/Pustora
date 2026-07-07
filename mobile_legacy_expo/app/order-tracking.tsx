import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const TRACKING_STEPS = [
  { title: 'Order Confirmed', description: 'Your order has been received and confirmed', emoji: '✅' },
  { title: 'Preparing Items', description: 'Store agent is packing your books & stationery', emoji: '🎒' },
  { title: 'Out for Delivery', description: 'Delivery executive is on the way to Hazratganj', emoji: '🛵' },
  { title: 'Arrived', description: 'Delivery agent has arrived at your location', emoji: '📍' }
];

export default function OrderTrackingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { orderId, eta } = params;

  const [currentStep, setCurrentStep] = useState(0);

  // Simulate progress in delivery status
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < TRACKING_STEPS.length - 1) {
          return prev + 1;
        }
        clearInterval(timer);
        return prev;
      });
    }, 8000); // Progress every 8 seconds for visual effect
    return () => clearInterval(timer);
  }, []);

  const progressPercentage = ((currentStep) / (TRACKING_STEPS.length - 1)) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/home')} style={styles.backButton}>
          <Text style={styles.backIcon}>◀ Home</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Track Order</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.orderSummary}>
            <View>
              <Text style={styles.orderLabel}>Order ID</Text>
              <Text style={styles.orderValue}>{orderId || 'PUST-84920'}</Text>
            </View>
            <View style={styles.etaBox}>
              <Text style={styles.etaLabel}>Delivery ETA</Text>
              <Text style={styles.etaValue}>{eta || '15-20 Mins'}</Text>
            </View>
          </View>
        </View>

        {/* Dispatch Partner Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Delivery Executive</Text>
          <View style={styles.partnerInfo}>
            <View style={styles.partnerAvatar}>
              <Text style={styles.partnerEmoji}>🚴</Text>
            </View>
            <View style={styles.partnerDetails}>
              <Text style={styles.partnerName}>Amit Kumar</Text>
              <Text style={styles.partnerPhone}>⚡ Verified Pustora Fleet Partner</Text>
            </View>
          </View>
        </View>

        {/* Live Stepper Tracker */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Delivery Status</Text>
          
          <View style={styles.stepperContainer}>
            <View style={styles.progressLineBackground} />
            <View style={[styles.progressLineActive, { height: `${progressPercentage}%` }]} />
            
            {TRACKING_STEPS.map((step, idx) => {
              const isActive = idx <= currentStep;
              const isCurrent = idx === currentStep;

              return (
                <View key={idx} style={styles.stepRow}>
                  <View style={[
                    styles.stepIndicator,
                    isActive ? styles.stepIndicatorActive : null,
                    isCurrent ? styles.stepIndicatorCurrent : null
                  ]}>
                    <Text style={styles.stepEmoji}>{step.emoji}</Text>
                  </View>
                  <View style={styles.stepTextContainer}>
                    <Text style={[
                      styles.stepTitle,
                      isActive ? styles.stepTitleActive : null,
                      isCurrent ? styles.stepTitleCurrent : null
                    ]}>
                      {step.title}
                    </Text>
                    <Text style={styles.stepDescription}>{step.description}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Store Detail Accent */}
        <View style={styles.storeCard}>
          <Text style={styles.storeIcon}>🏬</Text>
          <View>
            <Text style={styles.storeName}>Lucknow Central Hub</Text>
            <Text style={styles.storeAddress}>Dispatched from Hazratganj Warehouse</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.button} onPress={() => router.push('/(tabs)/home')}>
          <Text style={styles.buttonText}>Continue Shopping</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F4FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#EDE8FF',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  backButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  backIcon: {
    fontSize: 14,
    color: '#6C3FD6',
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2D1B69',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    maxWidth: Platform.OS === 'web' ? 600 : undefined,
    alignSelf: Platform.OS === 'web' ? 'center' : undefined,
    width: Platform.OS === 'web' ? '100%' : undefined,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDE8FF',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#2D1B69',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2D1B69',
    marginBottom: 4,
  },
  orderSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderLabel: {
    fontSize: 11,
    color: '#6C5E94',
    textTransform: 'uppercase',
    fontWeight: '800',
  },
  orderValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2D1B69',
    marginTop: 2,
  },
  etaBox: {
    alignItems: 'flex-end',
  },
  etaLabel: {
    fontSize: 11,
    color: '#6C5E94',
    textTransform: 'uppercase',
    fontWeight: '800',
  },
  etaValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#6C3FD6',
    marginTop: 2,
  },
  partnerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  partnerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EDE8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerEmoji: {
    fontSize: 24,
  },
  partnerDetails: {
    gap: 2,
  },
  partnerName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2D1B69',
  },
  partnerPhone: {
    fontSize: 11,
    color: '#6C5E94',
    fontWeight: '600',
  },
  stepperContainer: {
    position: 'relative',
    gap: 24,
    paddingLeft: 8,
    paddingVertical: 10,
  },
  progressLineBackground: {
    position: 'absolute',
    left: 27,
    top: 24,
    bottom: 24,
    width: 3,
    backgroundColor: '#EDE8FF',
  },
  progressLineActive: {
    position: 'absolute',
    left: 27,
    top: 24,
    width: 3,
    backgroundColor: '#6C3FD6',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  stepIndicator: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F3EFFE',
    borderWidth: 2,
    borderColor: '#EDE8FF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  stepIndicatorActive: {
    backgroundColor: '#EDE8FF',
    borderColor: '#6C3FD6',
  },
  stepIndicatorCurrent: {
    backgroundColor: '#6C3FD6',
    borderColor: '#F5A623',
  },
  stepEmoji: {
    fontSize: 18,
  },
  stepTextContainer: {
    flex: 1,
    gap: 2,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6C5E94',
  },
  stepTitleActive: {
    color: '#2D1B69',
  },
  stepTitleCurrent: {
    color: '#6C3FD6',
    fontWeight: '800',
  },
  stepDescription: {
    fontSize: 11,
    color: '#8A7FA6',
  },
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFBEA',
    borderWidth: 1,
    borderColor: '#FDE3A7',
    borderRadius: 16,
    padding: 14,
  },
  storeIcon: {
    fontSize: 24,
  },
  storeName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2D1B69',
  },
  storeAddress: {
    fontSize: 11,
    color: '#6C5E94',
  },
  button: {
    backgroundColor: '#6C3FD6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
