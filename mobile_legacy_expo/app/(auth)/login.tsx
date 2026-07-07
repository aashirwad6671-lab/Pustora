import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthService } from '../../src/services/authService';
import { useAuthStore } from '../../src/store/authStore';

export default function LoginScreen() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);

  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSendOTP = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid Gmail address.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const response = await AuthService.signInWithGmail(cleanEmail);

    setLoading(false);
    if (response.error) {
      setErrorMsg(response.error);
    } else {
      setIsOtpSent(true);
      setErrorMsg('TIP: Use test OTP "123456" to log in instantly.');
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const response = await AuthService.signInWithGmail(email, otpCode);

    setLoading(false);
    if (response.error) {
      setErrorMsg(response.error);
    } else if (response.data) {
      const { userId, isNewUser, email: userEmail } = response.data;

      if (isNewUser) {
        router.push({
          pathname: '/(auth)/setup',
          params: { userId, email: userEmail },
        });
      } else {
        const profileRes = await AuthService.getProfile(userId);
        if (profileRes.data) {
          setSession(profileRes.data, 'mock-jwt-session-token');
          router.replace('/(tabs)/home');
        } else {
          router.push({
            pathname: '/(auth)/setup',
            params: { userId, email: userEmail },
          });
        }
      }
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);

    const response = await AuthService.signInWithGoogle();

    setLoading(false);
    if (response.error) {
      setErrorMsg(response.error);
    } else if (response.data) {
      const { userId, isNewUser, email: userEmail } = response.data;

      if (userId === 'oauth-pending') {
        return;
      }

      if (isNewUser) {
        router.push({
          pathname: '/(auth)/setup',
          params: { userId, email: userEmail },
        });
      } else {
        const profileRes = await AuthService.getProfile(userId);
        if (profileRes.data) {
          setSession(profileRes.data, 'mock-jwt-session-token');
          router.replace('/(tabs)/home');
        } else {
          router.push({
            pathname: '/(auth)/setup',
            params: { userId, email: userEmail },
          });
        }
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            
            {/* Brand details */}
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>Pustora</Text>
              <Text style={styles.logoTagline}>"Har Zaroorat, Ek App"</Text>
            </View>

            {/* Dynamic header title */}
            <View style={styles.titleSection}>
              <Text style={styles.title}>
                {isOtpSent ? 'Verify Verification Code' : 'Welcome to Pustora'}
              </Text>
              <Text style={styles.subtitle}>
                {isOtpSent
                  ? `We have sent a verification code to ${email}`
                  : 'Sign in to access curriculum textbooks, stationery & classroom resources'}
              </Text>
            </View>

            {/* Form Inputs */}
            <View style={styles.formContainer}>
              {errorMsg && (
                <Text style={errorMsg.includes('TIP') ? styles.tipText : styles.errorText}>
                  {errorMsg}
                </Text>
              )}

              {!isOtpSent ? (
                /* EMAIL INPUT */
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Gmail Address</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="example@gmail.com"
                    placeholderTextColor="#6C5E94"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={(val) => {
                      setEmail(val);
                      setErrorMsg(null);
                    }}
                    editable={!loading}
                  />
                </View>
              ) : (
                /* OTP VERIFY INPUT */
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>6-Digit OTP Code</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter 6-digit OTP"
                    placeholderTextColor="#6C5E94"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={otpCode}
                    onChangeText={(val) => {
                      setOtpCode(val.replace(/[^0-9]/g, ''));
                      setErrorMsg(null);
                    }}
                    editable={!loading}
                  />
                </View>
              )}

              {/* Action Button */}
              <TouchableOpacity
                style={[styles.button, loading ? styles.buttonDisabled : null]}
                onPress={isOtpSent ? handleVerifyOTP : handleSendOTP}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>
                    {isOtpSent ? 'Verify & Sign In' : 'Continue with Gmail'}
                  </Text>
                )}
              </TouchableOpacity>

              {!isOtpSent && (
                <>
                  {/* Divider */}
                  <View style={styles.dividerContainer}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>OR</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  {/* Google OAuth Button */}
                  <TouchableOpacity
                    style={styles.googleButton}
                    onPress={handleGoogleLogin}
                    disabled={loading}
                  >
                    <Text style={styles.googleEmoji}>❤️</Text>
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                  </TouchableOpacity>
                </>
              )}

              {isOtpSent && (
                <TouchableOpacity
                  onPress={() => {
                    setIsOtpSent(false);
                    setOtpCode('');
                    setErrorMsg(null);
                  }}
                  disabled={loading}
                  style={styles.backLink}
                >
                  <Text style={styles.backLinkText}>Change Email Address</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F4FF',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 32,
    maxWidth: 480,
    alignSelf: 'center',
    width: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    gap: 4,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#6C3FD6',
    letterSpacing: 0.5,
  },
  logoTagline: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F5A623',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  titleSection: {
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2D1B69',
  },
  subtitle: {
    fontSize: 14,
    color: '#6C5E94',
    lineHeight: 20,
  },
  formContainer: {
    gap: 20,
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '700',
  },
  tipText: {
    fontSize: 13,
    color: '#6C3FD6',
    fontWeight: '700',
    backgroundColor: '#EDE8FF',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D4C5FF',
    overflow: 'hidden',
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2D1B69',
  },
  input: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EDE8FF',
    borderRadius: 10,
    fontSize: 16,
    color: '#2D1B69',
  },
  button: {
    backgroundColor: '#6C3FD6',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#6C3FD6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#9B5DE5',
    opacity: 0.8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#EDE8FF',
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#8A7FA6',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EDE8FF',
    paddingVertical: 14,
    borderRadius: 10,
    shadowColor: '#2D1B69',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  googleEmoji: {
    fontSize: 18,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2D1B69',
  },
  backLink: {
    alignItems: 'center',
  },
  backLinkText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6C3FD6',
  },
});
