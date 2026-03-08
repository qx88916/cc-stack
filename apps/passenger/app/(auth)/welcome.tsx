import { router } from "expo-router";
import { useEffect } from "react";
import { Image, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { images } from "@/constants";

const Welcome = () => {
  useEffect(() => {
    // Simulate splash delay - keep it snappy (2.5s feel better than 3s)
    const timer = setTimeout(() => {
      router.replace("/(auth)/signup");
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView className="flex-1 h-full items-center justify-center bg-white">
      {/* 
        Design Rationale:
        - Optical centering ensures the logo feels balanced to the eye, not just the grid.
        - Generous whitespace (negative space) builds trust and premium feel.
        - The logo is the sole hero element. No noise.
      */}
      <View className="flex-1 items-center justify-center w-full">
        <View className="w-[70%] aspect-[4/1]">
           <images.logoHorizontal width="100%" height="100%" />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Welcome;