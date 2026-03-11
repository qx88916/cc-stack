import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAPI } from '@/lib/fetch';
import InputField from '@/components/InputField';
import { icons } from '@/constants';
import { COLORS, SHADOW_SM } from '@/constants/theme';

export default function EditProfile() {
  const router = useRouter();
  const { session, refreshSession } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: session?.user?.name || '',
    phone: session?.user?.phone || '',
  });

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setLoading(true);
    try {
      await fetchAPI('/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim() || undefined,
        }),
      });

      await refreshSession();

      Alert.alert(
        'Success',
        'Your profile has been updated successfully.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to update profile. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-general-500">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
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
            <Text className="text-xl font-JakartaBold text-neutral-900">Edit Profile</Text>
            <Text className="text-xs font-JakartaMedium text-neutral-500 mt-0.5">
              Update your personal information
            </Text>
          </View>
        </View>

        {/* Form */}
        <View className="px-5 mt-2">
          <View className="bg-white rounded-2xl p-5" style={SHADOW_SM}>
            <InputField
              label="Name"
              placeholder="Enter your name"
              icon={icons.person}
              value={form.name}
              onChangeText={(value: string) => setForm({ ...form, name: value })}
            />

            <InputField
              label="Phone Number (Optional)"
              placeholder="+679 123 4567"
              icon={icons.person}
              value={form.phone}
              onChangeText={(value: string) => setForm({ ...form, phone: value })}
              keyboardType="phone-pad"
            />
          </View>

          <View className="bg-secondary-100 border border-secondary-200 p-4 rounded-2xl mt-4 flex-row items-start">
            <Image source={icons.info} className="w-4 h-4 mr-2 mt-0.5" tintColor={COLORS.secondary} resizeMode="contain" />
            <Text className="text-secondary-700 text-sm font-JakartaMedium flex-1">
              Your email address cannot be changed. If you need to update it, please contact support.
            </Text>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={loading}
            className={`py-4 rounded-2xl mt-6 ${loading ? 'bg-neutral-300' : 'bg-primary-500'}`}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-JakartaBold text-center text-base">
                Save Changes
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
