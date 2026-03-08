import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import InputField from "@/components/InputField";
import { useAuth } from "@/contexts/AuthContext";

interface DriverProfile {
  name: string;
  email: string;
  phone: string;
  role: string;
  profilePhoto?: string;
  createdAt?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  vehicleColor?: string;
  plateNumber?: string;
  rating?: number;
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

const Profile = () => {
  const { session, apiBaseUrl, logout, isLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", phone: "" });

  const authHeader = { Authorization: `Bearer ${session?.token}` };

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/auth/session`, {
        headers: authHeader,
      });
      const userData = res.ok ? await res.json() : null;
      const user = userData?.user;

      setProfile({
        name: user?.name ?? session?.user?.name ?? "—",
        email: user?.email ?? session?.user?.email ?? "—",
        phone: user?.phone ?? "",
        role: user?.role ?? session?.user?.role ?? "driver",
        profilePhoto: user?.profilePhoto,
        createdAt: user?.createdAt ?? session?.user?.createdAt,
        vehicleMake: user?.driver?.vehicleMake,
        vehicleModel: user?.driver?.vehicleModel,
        vehicleYear: user?.driver?.vehicleYear,
        vehicleColor: user?.driver?.vehicleColor,
        plateNumber: user?.driver?.plateNumber,
        rating: user?.driver?.rating,
      });

      setEditForm({
        name: user?.name ?? session?.user?.name ?? "",
        phone: user?.phone ?? "",
      });
    } catch {
      setProfile({
        name: session?.user?.name ?? "—",
        email: session?.user?.email ?? "—",
        phone: "",
        role: session?.user?.role ?? "driver",
        createdAt: session?.user?.createdAt,
      });
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, session?.token]);

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace("/(auth)/welcome");
      return;
    }
    if (session) fetchProfile();
  }, [isLoading, session, fetchProfile]);

  const saveProfile = async () => {
    if (!editForm.name.trim()) {
      Alert.alert("Error", "Name is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${apiBaseUrl}/user/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({
          name: editForm.name.trim(),
          phone: editForm.phone.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message ?? "Failed to update profile");
      }
      setProfile((prev) =>
        prev
          ? { ...prev, name: editForm.name.trim(), phone: editForm.phone.trim() }
          : prev
      );
      setEditing(false);
      Alert.alert("Success", "Profile updated successfully");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not update profile";
      Alert.alert("Error", msg);
    } finally {
      setSaving(false);
    }
  };

  const pickAndUploadPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Please allow photo library access to update your profile photo.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled || !result.assets[0]) return;

    setUploadingPhoto(true);
    try {
      const asset = result.assets[0];
      const formData = new FormData();
      formData.append("photo", {
        uri: asset.uri,
        name: "profile.jpg",
        type: "image/jpeg",
      } as unknown as Blob);

      const res = await fetch(`${apiBaseUrl}/user/profile-photo`, {
        method: "PATCH",
        headers: authHeader,
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message ?? "Upload failed");
      }

      const data = await res.json();
      setProfile((prev) =>
        prev ? { ...prev, profilePhoto: data.profilePhoto ?? asset.uri } : prev
      );
      Alert.alert("Success", "Profile photo updated");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not upload photo";
      Alert.alert("Error", msg);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: logout },
    ]);
  };

  if (loading || isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#f59e0b" />
          <Text className="text-base text-neutral-500 mt-4">
            Loading profile…
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const avatarUri =
    profile?.profilePhoto ??
    `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name ?? "D")}&size=220&background=f59e0b&color=fff`;

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <ScrollView className="px-5" contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="flex-row items-center justify-between my-5">
          <Text className="text-2xl font-bold">My Profile</Text>
          <TouchableOpacity onPress={handleLogout} className="p-2">
            <Ionicons name="log-out-outline" size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>

        {/* Avatar with upload button */}
        <View className="items-center mb-6">
          <TouchableOpacity onPress={pickAndUploadPhoto} disabled={uploadingPhoto}>
            <View className="relative">
              <Image
                source={{ uri: avatarUri }}
                style={{
                  width: 110,
                  height: 110,
                  borderRadius: 55,
                  borderWidth: 2,
                  borderColor: "#e5e7eb",
                }}
                resizeMode="cover"
              />
              <View className="absolute bottom-0 right-0 w-8 h-8 bg-amber-500 rounded-full items-center justify-center border-2 border-white">
                {uploadingPhoto ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="camera" size={14} color="#fff" />
                )}
              </View>
            </View>
          </TouchableOpacity>
          <Text className="text-lg font-bold text-neutral-900 mt-3">
            {profile?.name}
          </Text>
          <Text className="text-sm text-neutral-500">{profile?.email}</Text>
          {profile?.rating != null && (
            <View className="flex-row items-center mt-1">
              <Ionicons name="star" size={14} color="#f59e0b" />
              <Text className="text-sm text-neutral-600 ml-1">
                {profile.rating.toFixed(1)} rating
              </Text>
            </View>
          )}
        </View>

        {/* Profile Fields */}
        <View className="bg-white rounded-2xl px-5 py-3 mb-4">
          {editing ? (
            <>
              <InputField
                label="Name"
                value={editForm.name}
                onChangeText={(v) => setEditForm((p) => ({ ...p, name: v }))}
              />
              <InputField
                label="Phone"
                value={editForm.phone}
                keyboardType="phone-pad"
                onChangeText={(v) => setEditForm((p) => ({ ...p, phone: v }))}
              />
              <View className="flex-row space-x-3 mt-4 mb-2">
                <TouchableOpacity
                  onPress={() => setEditing(false)}
                  className="flex-1 py-3 rounded-full bg-neutral-200 items-center"
                >
                  <Text className="font-bold text-neutral-600">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={saveProfile}
                  disabled={saving}
                  className="flex-1 py-3 rounded-full bg-amber-500 items-center"
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text className="font-bold text-white">Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <InputField label="Name" value={profile?.name ?? "—"} editable={false} />
              <InputField label="Email" value={profile?.email ?? "—"} editable={false} />
              <InputField label="Phone" value={profile?.phone || "Not set"} editable={false} />
              <InputField label="Member Since" value={formatDate(profile?.createdAt)} editable={false} />
              <TouchableOpacity
                onPress={() => setEditing(true)}
                className="mt-3 mb-2 py-3 rounded-full bg-amber-500 items-center"
              >
                <Text className="font-bold text-white">Edit Profile</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Vehicle Details */}
        {(profile?.vehicleMake || profile?.plateNumber) && (
          <View className="bg-white rounded-2xl px-5 py-4 mb-4">
            <View className="flex-row items-center mb-3">
              <Ionicons name="car-sport" size={18} color="#f59e0b" />
              <Text className="text-base font-bold text-neutral-800 ml-2">
                Vehicle Details
              </Text>
            </View>
            {profile.vehicleMake && (
              <InputField
                label="Make"
                value={`${profile.vehicleMake} ${profile.vehicleModel ?? ""}`.trim()}
                editable={false}
              />
            )}
            {profile.vehicleYear && (
              <InputField
                label="Year"
                value={String(profile.vehicleYear)}
                editable={false}
              />
            )}
            {profile.vehicleColor && (
              <InputField label="Color" value={profile.vehicleColor} editable={false} />
            )}
            {profile.plateNumber && (
              <InputField label="Plate" value={profile.plateNumber} editable={false} />
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;
