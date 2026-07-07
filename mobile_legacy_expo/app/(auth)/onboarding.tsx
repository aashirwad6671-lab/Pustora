import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

interface OnboardingSlide {
  id: number;
  emoji: string;
  title: string;
  description: string;
}

const ONBOARDING_DATA: OnboardingSlide[] = [
  {
    id: 1,
    emoji: '⚡',
    title: 'Superfast Delivery',
    description: 'Get school textbooks, notebooks, geometry boxes, and toys delivered to your doorstep in 10-30 minutes.',
  },
  {
    id: 2,
    emoji: '📚',
    title: 'Hero Category: Study Kit',
    description: 'Find verified curricula from standard boards including Class 1-12 NCERT books, registers, craft items, and pens.',
  },
  {
    id: 3,
    emoji: '🧸',
    title: 'Toys, Gifts & Games',
    description: 'From educational board games to premium building blocks, buy everything under one single lightning-fast app.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [activeSlide, setActiveSlide] = useState(0);

  const handleNext = () => {
    if (activeSlide < ONBOARDING_DATA.length - 1) {
      setActiveSlide(activeSlide + 1);
    } else {
      // Completed onboarding, route to Login page
      router.push('/(auth)/login');
    }
  };

  const handleSkip = () => {
    router.push('/(auth)/login');
  };

  const currentSlide = ONBOARDING_DATA[activeSlide];

  return (
    <SafeAreaView style={styles.container}>
      {/* Skip Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Slide Content */}
      <View style={styles.slideContainer}>
        <View style={styles.emojiWrapper}>
          <Text style={styles.emoji}>{currentSlide.emoji}</Text>
        </View>
        <Text style={styles.title}>{currentSlide.title}</Text>
        <Text style={styles.description}>{currentSlide.description}</Text>
      </View>

      {/* Footer Controllers */}
      <View style={styles.footer}>
        {/* Pagination Dots */}
        <View style={styles.pagination}>
          {ONBOARDING_DATA.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === activeSlide ? styles.activeDot : null,
              ]}
            />
          ))}
        </View>

        {/* Action Button */}
        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>
            {activeSlide === ONBOARDING_DATA.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8E8A94',
    fontFamily: 'Nunito-Bold',
  },
  slideContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 24,
  },
  emojiWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(92, 45, 145, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 70,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    color: '#440F79',
    fontFamily: 'Outfit-Bold',
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    color: '#4B4451',
    lineHeight: 22,
    fontFamily: 'Nunito-Regular',
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 24,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2DFE5',
  },
  activeDot: {
    width: 24,
    backgroundColor: '#5C2D91',
  },
  button: {
    backgroundColor: '#5C2D91',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#5C2D91',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Outfit-Bold',
  },
});
