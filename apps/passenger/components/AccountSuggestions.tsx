import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useSavedPlacesStore } from '@/store/savedPlacesStore';
import { SHADOW_SM } from '@/constants/theme';

interface Suggestion {
  id: string;
  title: string;
  description: string;
  action: () => void;
  icon: string;
}

export default function AccountSuggestions() {
  const router = useRouter();
  const { session } = useAuth();
  const { places } = useSavedPlacesStore();

  const suggestions = useMemo(() => {
    const items: Suggestion[] = [];

    if (!session?.user?.profilePhoto) {
      items.push({
        id: 'photo',
        title: 'Add a profile photo',
        description: 'Help drivers recognize you',
        icon: '📸',
        action: () => router.push('/(root)/(tabs)/profile'),
      });
    }

    if (!session?.user?.emailVerified) {
      items.push({
        id: 'email',
        title: 'Verify your email',
        description: 'Required for account security',
        icon: '✉️',
        action: () => router.push('/(root)/verify-email'),
      });
    }

    if (!places.home) {
      items.push({
        id: 'home',
        title: 'Add home location',
        description: 'Book rides in one tap',
        icon: '🏠',
        action: () => router.push('/(root)/add-place?type=home'),
      });
    }

    if (!places.work && places.home) {
      items.push({
        id: 'work',
        title: 'Add work location',
        description: 'Quick commute booking',
        icon: '💼',
        action: () => router.push('/(root)/add-place?type=work'),
      });
    }

    return items;
  }, [session, places]);

  if (suggestions.length === 0) {
    return null;
  }

  const calculateProgress = () => {
    const total = 4;
    const completed = total - suggestions.length;
    return Math.round((completed / total) * 100);
  };

  return (
    <View className="bg-primary-100 rounded-2xl p-4 mb-4 border border-primary-200">
      <View className="flex-row items-center mb-3">
        <View className="bg-primary-500 w-11 h-11 rounded-2xl items-center justify-center mr-3">
          <Text className="text-xl text-white font-JakartaBold">✓</Text>
        </View>
        <View className="flex-1">
          <Text className="font-JakartaBold text-primary-900 text-sm">
            Let's update your account
          </Text>
          <Text className="text-primary-700 text-xs font-JakartaMedium mt-0.5">
            Improve your app experience
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View className="mb-3">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-primary-700 text-xs font-JakartaSemiBold">
            Profile {calculateProgress()}% complete
          </Text>
          <Text className="text-primary-600 font-JakartaBold text-xs">
            {suggestions.length} {suggestions.length === 1 ? 'suggestion' : 'suggestions'}
          </Text>
        </View>
        <View className="bg-primary-200 h-1.5 rounded-full overflow-hidden">
          <View
            className="bg-primary-600 h-full rounded-full"
            style={{ width: `${calculateProgress()}%` }}
          />
        </View>
      </View>

      {/* Suggestions List */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row space-x-3">
          {suggestions.map((suggestion) => (
            <TouchableOpacity
              key={suggestion.id}
              onPress={suggestion.action}
              className="bg-white rounded-2xl p-4 min-w-[180px]"
              style={SHADOW_SM}
              activeOpacity={0.7}
            >
              <Text className="text-2xl mb-2">{suggestion.icon}</Text>
              <Text className="font-JakartaBold text-neutral-800 text-sm mb-1">
                {suggestion.title}
              </Text>
              <Text className="text-neutral-500 text-xs font-JakartaMedium mb-3">
                {suggestion.description}
              </Text>
              <Text className="text-primary-500 font-JakartaBold text-xs">
                Complete →
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
