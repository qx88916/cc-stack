import { useRouter } from "expo-router";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { images } from "@/constants";
import { SHADOW_MD } from "@/constants/theme";

export default function NotFound() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-general-500 items-center justify-center px-8">
      <Image
        source={images.noResult}
        className="w-48 h-48 mb-6"
        resizeMode="contain"
      />
      <Text className="text-2xl font-JakartaBold text-neutral-800 text-center mb-3">
        Page Not Found
      </Text>
      <Text className="text-base font-JakartaMedium text-neutral-500 text-center mb-8 leading-6">
        The page you're looking for doesn't exist or has been moved.
      </Text>
      <TouchableOpacity
        onPress={() => router.replace("/(root)/(tabs)/home")}
        className="bg-primary-500 py-4 px-12 rounded-2xl"
        style={SHADOW_MD}
      >
        <Text className="text-white font-JakartaBold text-base">Go Home</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
