import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { ACTIVITY_COLOR } from "@/constants/theme";

const Layout = () => {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 bg-general-500 items-center justify-center">
        <ActivityIndicator size="large" color={ACTIVITY_COLOR} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/welcome" />;
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="find-ride" options={{ headerShown: false }} />
      <Stack.Screen name="confirm-ride" options={{ headerShown: false }} />
      <Stack.Screen name="book-ride" options={{ headerShown: false }} />
      <Stack.Screen name="saved-places" options={{ headerShown: false }} />
      <Stack.Screen name="add-place" options={{ headerShown: false }} />
      <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
      <Stack.Screen name="verify-email" options={{ headerShown: false }} />
      <Stack.Screen name="verify-phone" options={{ headerShown: false }} />
      <Stack.Screen name="trip-complete" options={{ headerShown: false }} />
    </Stack>
  );
};

export default Layout;