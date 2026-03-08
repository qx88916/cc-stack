import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, TextInput, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { icons } from '@/constants';
import { COLORS, SHADOW_SM } from '@/constants/theme';
import { getApiBaseUrl } from '@/src/config';

export default function VerifyPhone() {
  const router = useRouter();
  const { session, refreshSession } = useAuth();
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  const handleSendCode = async () => {
    if (!session?.user?.phone) {
      Alert.alert('Error', 'No phone number found');
      return;
    }

    setLoading(true);
    try {
      const apiBaseUrl = await getApiBaseUrl();

      const response = await fetch(`${apiBaseUrl}/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          phone: session.user.phone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send verification code');
      }

      setCodeSent(true);
      Alert.alert(
        'Code Sent',
        'A 6-digit verification code has been sent via SMS. (Development mode: check console)',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error sending verification code:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to send verification code. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit code');
      return;
    }

    if (!session?.user?.phone) {
      Alert.alert('Error', 'No phone number found');
      return;
    }

    setVerifying(true);
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const token = await AsyncStorage.getItem('@auth/token');
      const apiBaseUrl = await getApiBaseUrl();

      const verifyResponse = await fetch(`${apiBaseUrl}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: session.user.phone,
          code: verificationCode,
        }),
      });

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok) {
        throw new Error(verifyData.message || 'Invalid verification code');
      }

      const updateResponse = await fetch(`${apiBaseUrl}/user/verify-phone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update verification status');
      }

      await refreshSession();

      Alert.alert(
        'Success!',
        'Your phone number has been verified successfully.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error verifying code:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Invalid or expired verification code. Please try again.'
      );
    } finally {
      setVerifying(false);
    }
  };

  if (session?.user?.phoneVerified) {
    return (
      <SafeAreaView className="flex-1 bg-general-500">
        <View className="flex-1 items-center justify-center px-5">
          <View className="bg-primary-100 rounded-3xl w-20 h-20 items-center justify-center mb-6">
            <Image source={icons.checkmark} className="w-10 h-10" tintColor={COLORS.primary} />
          </View>
          <Text className="text-2xl font-JakartaBold text-neutral-900 text-center mb-2">
            Phone Verified
          </Text>
          <Text className="text-neutral-500 font-JakartaMedium text-center mb-8">
            Your phone number has been successfully verified.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-primary-500 py-4 px-10 rounded-2xl"
          >
            <Text className="text-white font-JakartaBold text-base">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-general-500">
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center px-5 pt-3 pb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-2xl bg-white items-center justify-center mr-4"
            style={SHADOW_SM}
          >
            <Image source={icons.backArrow} className="w-5 h-5" tintColor={COLORS.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-JakartaBold text-neutral-900">Verify Your Phone</Text>
            <Text className="text-xs font-JakartaMedium text-neutral-500 mt-0.5">
              We'll send you a 6-digit code via SMS
            </Text>
          </View>
        </View>

        <View className="flex-1 px-5">
          {/* Phone Display */}
          <View className="bg-white p-4 rounded-2xl mb-5" style={SHADOW_SM}>
            <Text className="text-neutral-400 text-xs font-JakartaMedium mb-1">Phone Number</Text>
            <Text className="font-JakartaBold text-base text-neutral-800">{session?.user?.phone}</Text>
          </View>

          {!codeSent ? (
            <TouchableOpacity
              onPress={handleSendCode}
              disabled={loading}
              className={`py-4 rounded-2xl ${loading ? 'bg-neutral-300' : 'bg-primary-500'}`}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-JakartaBold text-center text-base">
                  Send Verification Code
                </Text>
              )}
            </TouchableOpacity>
          ) : (
            <View>
              <View className="bg-secondary-100 border border-secondary-200 p-4 rounded-2xl mb-5">
                <Text className="font-JakartaBold text-secondary-800 mb-1 text-sm">
                  📱 Code Sent!
                </Text>
                <Text className="text-secondary-700 text-xs font-JakartaMedium">
                  Check your SMS for a 6-digit verification code. The code will expire in 10 minutes.
                </Text>
              </View>

              <View className="bg-white rounded-2xl p-5 mb-5" style={SHADOW_SM}>
                <Text className="font-JakartaBold text-sm text-neutral-800 mb-3">Enter Verification Code</Text>
                <TextInput
                  value={verificationCode}
                  onChangeText={(text) => setVerificationCode(text.replace(/[^0-9]/g, '').slice(0, 6))}
                  placeholder="000000"
                  keyboardType="number-pad"
                  maxLength={6}
                  className="bg-neutral-50 p-4 rounded-2xl text-2xl font-JakartaBold text-center tracking-widest border border-neutral-200"
                  placeholderTextColor="#d4d4d4"
                />
              </View>

              <TouchableOpacity
                onPress={handleVerifyCode}
                disabled={verifying || verificationCode.length !== 6}
                className={`py-4 rounded-2xl mb-4 ${
                  verifying || verificationCode.length !== 6 ? 'bg-neutral-300' : 'bg-primary-500'
                }`}
              >
                {verifying ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-JakartaBold text-center text-base">
                    Verify Phone
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setCodeSent(false);
                  setVerificationCode('');
                  handleSendCode();
                }}
                disabled={loading}
                className="py-3"
              >
                <Text className="text-primary-500 font-JakartaSemiBold text-center text-sm">
                  Resend Code
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {codeSent && (
            <Text className="text-neutral-400 text-xs text-center mt-3 font-JakartaMedium">
              Didn't receive the code? Try resending or check your phone's message app.
            </Text>
          )}

          {/* Benefits */}
          <View className="mt-auto pb-8 pt-6">
            <Text className="font-JakartaBold text-sm text-neutral-700 mb-3">
              Why verify your phone?
            </Text>
            {[
              'Account security and two-factor authentication',
              'Driver can contact you during pickup',
              'SMS notifications for ride updates',
            ].map((text, i) => (
              <View className="flex-row items-start mb-2.5" key={i}>
                <Text className="text-primary-500 mr-2 font-JakartaBold text-xs mt-0.5">✓</Text>
                <Text className="text-neutral-600 flex-1 text-sm font-JakartaMedium">{text}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
