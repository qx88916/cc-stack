import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import CustomButton from "@/components/CustomButton";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminScreen() {
  const { session, logout } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <View className="flex-1 p-5">
        <View className="flex-row items-center mb-4">
          <Ionicons name="shield-checkmark" size={24} color="#f59e0b" />
          <Text className="text-xl font-bold text-neutral-800 ml-2">Admin</Text>
        </View>
        <Text className="text-neutral-600">
          Logged in as {session?.user.email}
        </Text>
        <View className="mt-8">
          <CustomButton title="Log out" bgVariant="danger" onPress={logout} />
        </View>
      </View>
    </SafeAreaView>
  );
}
