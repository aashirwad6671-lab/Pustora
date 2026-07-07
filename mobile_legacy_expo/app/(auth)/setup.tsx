import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AuthService } from '../../src/services/authService';
import { useAuthStore } from '../../src/store/authStore';
import { UserRole } from '../../src/types';

interface RoleOption {
  id: UserRole;
  label: string;
  emoji: string;
  sub: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  { id: 'student', label: 'Student', emoji: '📚', sub: 'Class/Grade curriculum & stationery' },
  { id: 'parent', label: 'Parent', emoji: '🧸', sub: 'Toys, textbooks & school packs' },
  { id: 'teacher', label: 'Teacher', emoji: '🎓', sub: 'Classroom supplies & resources' },
  { id: 'general', label: 'General', emoji: '🎁', sub: 'Hobby books, games & gifts' },
];

const LUCKNOW_AREAS = [
  { name: 'Hazratganj', zip: '226001', lat: 26.8504, lng: 80.9419 },
  { name: 'Gomti Nagar', zip: '226010', lat: 26.8624, lng: 80.9987 },
  { name: 'Aliganj', zip: '226024', lat: 26.8929, lng: 80.9388 },
  { name: 'Indira Nagar', zip: '226016', lat: 26.8850, lng: 80.9700 },
];

export default function SetupScreen() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);

  // Retrieve incoming router parameters
  const { userId, phoneNumber, email } = useLocalSearchParams<{ userId: string; phoneNumber?: string; email?: string }>();

  // Form States
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [addressLine1, setAddressLine1] = useState('');
  const [selectedAreaIndex, setSelectedAreaIndex] = useState<number | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!selectedRole) {
      setErrorMsg('Please select your role context.');
      return;
    }
    if (!addressLine1.trim()) {
      setErrorMsg('Please enter your street address.');
      return;
    }
    if (selectedAreaIndex === null) {
      setErrorMsg('Please select your delivery area.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const uid = userId || 'mock-user-id';
    const phone = phoneNumber || email || '+919999999999';
    const areaDetails = LUCKNOW_AREAS[selectedAreaIndex];

    try {
      // 1. Create Supabase User Profile
      const profileRes = await AuthService.createProfile(uid, fullName.trim(), selectedRole, phone);
      if (profileRes.error) {
        setErrorMsg(profileRes.error);
        setLoading(false);
        return;
      }

      // 2. Setup User Initial Address (calculates coordinates dynamically)
      const addressRes = await AuthService.setupAddress(
        uid,
        'Home',
        addressLine1.trim(),
        areaDetails.name,
        areaDetails.zip,
        areaDetails.lat,
        areaDetails.lng,
        true
      );

      if (addressRes.error) {
        setErrorMsg(addressRes.error);
        setLoading(false);
        return;
      }

      // 3. Complete auth session establishment
      if (profileRes.data) {
        setSession(profileRes.data, 'mock-jwt-session-token');
        router.replace('/(tabs)/home');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Setup encountered unforeseen anomalies');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Onboarding Setup</Text>
            <Text style={styles.headerSub}>Customize Pustora for your specific shopping needs</Text>
          </View>

          {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

          {/* 1. Name Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. What should we call you?</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter your full name"
              placeholderTextColor="#8E8A94"
              value={fullName}
              onChangeText={(val) => {
                setFullName(val);
                setErrorMsg(null);
              }}
              editable={!loading}
            />
          </View>

          {/* 2. Role Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Choose your shopping context</Text>
            <View style={styles.roleGrid}>
              {ROLE_OPTIONS.map((role) => (
                <TouchableOpacity
                  key={role.id}
                  style={[
                    styles.roleCard,
                    selectedRole === role.id ? styles.roleCardSelected : null,
                  ]}
                  onPress={() => {
                    setSelectedRole(role.id);
                    setErrorMsg(null);
                  }}
                  disabled={loading}
                >
                  <Text style={styles.roleEmoji}>{role.emoji}</Text>
                  <Text style={styles.roleLabel}>{role.label}</Text>
                  <Text style={styles.roleSub}>{role.sub}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 3. Address Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Where should we deliver?</Text>
            <View style={styles.addressForm}>
              <TextInput
                style={styles.textInput}
                placeholder="Flat/House No, Building, Street"
                placeholderTextColor="#8E8A94"
                value={addressLine1}
                onChangeText={(val) => {
                  setAddressLine1(val);
                  setErrorMsg(null);
                }}
                editable={!loading}
              />

              <Text style={styles.subLabel}>Lucknow Delivery Area Zone</Text>
              <View style={styles.areaGrid}>
                {LUCKNOW_AREAS.map((area, idx) => (
                  <TouchableOpacity
                    key={area.name}
                    style={[
                      styles.areaChip,
                      selectedAreaIndex === idx ? styles.areaChipSelected : null,
                    ]}
                    onPress={() => {
                      setSelectedAreaIndex(idx);
                      setErrorMsg(null);
                    }}
                    disabled={loading}
                  >
                    <Text style={styles.areaChipText}>{area.name}</Text>
                    <Text style={styles.areaChipZip}>{area.zip}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, loading ? styles.submitBtnDisabled : null]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>Complete Setup</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    gap: 28,
    flexGrow: 1,
  },
  header: {
    gap: 6,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#440F79',
    fontFamily: 'Outfit-Bold',
  },
  headerSub: {
    fontSize: 14,
    color: '#8E8A94',
    lineHeight: 20,
    fontFamily: 'Nunito-Regular',
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '700',
    fontFamily: 'Nunito-Bold',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#191C1D',
    fontFamily: 'Outfit-Bold',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2DFE5',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#191C1D',
    fontFamily: 'Nunito-Regular',
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  roleCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2DFE5',
    borderRadius: 16,
    padding: 16,
    width: '48%', // Grid spacing
    alignItems: 'center',
    textAlign: 'center',
    gap: 6,
    minHeight: 130,
  },
  roleCardSelected: {
    borderColor: '#5C2D91',
    backgroundColor: 'rgba(92, 45, 145, 0.05)',
  },
  roleEmoji: {
    fontSize: 28,
  },
  roleLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#440F79',
    fontFamily: 'Outfit-Bold',
  },
  roleSub: {
    fontSize: 10,
    color: '#8E8A94',
    textAlign: 'center',
    lineHeight: 13,
    fontFamily: 'Nunito-Regular',
  },
  addressForm: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2DFE5',
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  subLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E8A94',
    textTransform: 'uppercase',
    fontFamily: 'Nunito-Bold',
    marginTop: 4,
  },
  areaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  areaChip: {
    backgroundColor: '#F3F4F5',
    borderWidth: 1,
    borderColor: 'transparent',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: '47%',
  },
  areaChipSelected: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderColor: '#FFD700',
  },
  areaChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#191C1D',
    fontFamily: 'Outfit-Bold',
  },
  areaChipZip: {
    fontSize: 10,
    color: '#8E8A94',
    fontFamily: 'Nunito-Regular',
  },
  submitBtn: {
    backgroundColor: '#5C2D91',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#5C2D91',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
    marginTop: 10,
  },
  submitBtnDisabled: {
    backgroundColor: '#7E4BB8',
    opacity: 0.8,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Outfit-Bold',
  },
});
