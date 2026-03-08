import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  View,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ProfilePhotoUpload from "@/components/ProfilePhotoUpload";
import AccountSuggestions from "@/components/AccountSuggestions";
import { useAuth } from "@/contexts/AuthContext";
import { icons } from "@/constants";
import { COLORS, SHADOW_SM, SHADOW_MD, SHADOW_LG } from "@/constants/theme";

function formatDate(iso?: string) {
  if (!iso) return "\u2014";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return iso;
  }
}

const Profile = () => {
  const { session, isLoading, logout, refreshSession, apiBaseUrl } = useAuth();
  const router = useRouter();
  const user = session?.user;

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace("/(auth)/welcome");
    }
  }, [isLoading, session, router]);

  const handleSignOut = () => {
    logout();
    router.replace('/(auth)/login');
  };

  const handlePhotoUploaded = async (_photoUrl: string) => {
    await refreshSession();
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      Alert.alert('Error', 'Please enter your password to confirm.');
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`${apiBaseUrl}/user/account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.token}`,
        },
        body: JSON.stringify({ password: deletePassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete account');
      }

      setDeleteModalVisible(false);
      setDeletePassword('');

      Alert.alert(
        'Account Deleted',
        'Your account has been permanently deleted.',
        [{ text: 'OK', onPress: () => logout() }]
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete account. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setDeleting(false);
    }
  };

  if (isLoading || !user) {
    return (
      <SafeAreaView className="flex-1 bg-general-500">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const menuItems = [
    {
      icon: icons.person,
      label: "Edit Profile",
      onPress: () => router.push("/(root)/edit-profile"),
      tint: COLORS.primary,
      bg: "bg-primary-100",
    },
    {
      icon: icons.point,
      label: "Saved Places",
      onPress: () => router.push("/(root)/saved-places"),
      tint: COLORS.accent,
      bg: "bg-accent-100",
    },
    {
      icon: icons.list,
      label: "Ride History",
      onPress: () => router.push("/(root)/(tabs)/rides"),
      tint: COLORS.secondary,
      bg: "bg-secondary-100",
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-general-500">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-5 pt-3 pb-4">
          <Text className="text-2xl font-JakartaBold text-neutral-900">My Profile</Text>
        </View>

        {/* Account Suggestions */}
        <View className="px-5">
          <AccountSuggestions />
        </View>

        {/* Profile Card */}
        <View className="mx-5 bg-white rounded-3xl p-6 items-center mb-5" style={SHADOW_MD}>
          <ProfilePhotoUpload
            currentPhotoUrl={user.profilePhoto}
            userName={user.name || "User"}
            onPhotoUploaded={handlePhotoUploaded}
          />

          <Text className="text-xl font-JakartaBold text-neutral-900 mt-1">
            {user.name || "User"}
          </Text>
          <Text className="text-sm font-JakartaMedium text-neutral-500 mt-1">
            {user.email || "\u2014"}
          </Text>

          {/* Verified / Unverified Badge */}
          {user.emailVerified ? (
            <View className="flex-row items-center bg-primary-100 px-3 py-1.5 rounded-full mt-3">
              <Image source={icons.checkmark} className="w-3.5 h-3.5 mr-1.5" tintColor={COLORS.primary} />
              <Text className="text-xs font-JakartaSemiBold text-primary-700">Verified</Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => router.push("/(root)/verify-email")}
              className="flex-row items-center bg-accent-100 px-3 py-1.5 rounded-full mt-3"
            >
              <Text className="text-xs font-JakartaSemiBold text-accent-700">
                Verify Email
              </Text>
            </TouchableOpacity>
          )}

          {/* Info Row */}
          <View className="flex-row items-center justify-around w-full mt-5 pt-5 border-t border-neutral-100">
            <View className="items-center">
              <Text className="text-xs font-JakartaMedium text-neutral-400">Role</Text>
              <Text className="text-sm font-JakartaBold text-neutral-800 mt-0.5">
                {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Passenger"}
              </Text>
            </View>
            <View className="w-px h-8 bg-neutral-100" />
            <View className="items-center">
              <Text className="text-xs font-JakartaMedium text-neutral-400">Member Since</Text>
              <Text className="text-sm font-JakartaBold text-neutral-800 mt-0.5">
                {formatDate(user.createdAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View className="mx-5 bg-white rounded-2xl overflow-hidden mb-5" style={SHADOW_SM}>
          {menuItems.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              onPress={item.onPress}
              className={`flex-row items-center px-5 py-4 ${
                i < menuItems.length - 1 ? "border-b border-neutral-100" : ""
              }`}
              activeOpacity={0.6}
              accessibilityRole="button"
              accessibilityLabel={item.label}
            >
              <View className={`w-10 h-10 rounded-2xl ${item.bg} items-center justify-center mr-4`}>
                <Image source={item.icon} className="w-5 h-5" tintColor={item.tint} />
              </View>
              <Text className="flex-1 font-JakartaSemiBold text-neutral-800 text-base">
                {item.label}
              </Text>
              <Text className="text-neutral-300 text-lg font-JakartaBold">›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Log Out */}
        <View className="mx-5 mb-3">
          <TouchableOpacity
            onPress={handleSignOut}
            className="bg-danger-50 border border-danger-200 py-4 rounded-2xl items-center"
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Log out"
          >
            <Text className="text-danger-600 font-JakartaBold text-base">Log Out</Text>
          </TouchableOpacity>
        </View>

        {/* Delete Account */}
        <View className="mx-5">
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                'Delete Account',
                'Are you sure you want to delete your account? This action cannot be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Continue',
                    style: 'destructive',
                    onPress: () => setDeleteModalVisible(true),
                  },
                ]
              );
            }}
            className="py-3 items-center"
          >
            <Text className="text-neutral-400 font-JakartaMedium text-sm">Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Delete Account Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!deleting) {
            setDeleteModalVisible(false);
            setDeletePassword('');
          }
        }}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-white rounded-3xl p-6 w-full" style={SHADOW_LG}>
            <View className="w-14 h-14 rounded-2xl bg-danger-50 items-center justify-center self-center mb-4">
              <Text className="text-2xl">⚠️</Text>
            </View>
            <Text className="text-xl font-JakartaBold text-neutral-900 text-center mb-2">
              Confirm Deletion
            </Text>
            <Text className="text-sm font-JakartaMedium text-neutral-500 text-center mb-5">
              Enter your password to permanently delete your account. This cannot be undone.
            </Text>

            <TextInput
              placeholder="Enter your password"
              secureTextEntry
              value={deletePassword}
              onChangeText={setDeletePassword}
              editable={!deleting}
              className="border border-neutral-200 rounded-2xl px-4 py-3.5 text-base font-JakartaMedium mb-5 bg-neutral-50"
              placeholderTextColor="#9ca3af"
            />

            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={() => {
                  setDeleteModalVisible(false);
                  setDeletePassword('');
                }}
                disabled={deleting}
                className="flex-1 border border-neutral-200 py-3.5 rounded-2xl items-center bg-white"
              >
                <Text className="font-JakartaSemiBold text-neutral-700">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDeleteAccount}
                disabled={deleting || !deletePassword.trim()}
                className={`flex-1 py-3.5 rounded-2xl items-center ${
                  deleting || !deletePassword.trim() ? 'bg-danger-300' : 'bg-danger-500'
                }`}
              >
                {deleting ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text className="font-JakartaBold text-white">Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Profile;
