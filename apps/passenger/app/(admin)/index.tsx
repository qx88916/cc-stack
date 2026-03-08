import { router } from "expo-router";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import CustomButton from "@/components/CustomButton";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminScreen() {
  const { session, logout } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 p-5">
        <Text className="text-xl font-JakartaSemiBold text-general-800">Admin</Text>
        <Text className="text-general-600 mt-2">
          Logged in as {session?.user.email} (Admin)
        </Text>
        <View className="mt-8">
          <CustomButton
            title="Log out"
            onPress={() => logout()}
            className="bg-general-500"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
