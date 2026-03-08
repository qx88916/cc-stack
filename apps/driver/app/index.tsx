import { Redirect } from "expo-router";
import { View } from "react-native";
import { useAuth } from "@/contexts/AuthContext";

export default function Index() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return <View className="flex-1 bg-white" />;
  }

  if (!session) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (session.user.role === "admin") {
    return <Redirect href="/(admin)" />;
  }

  return <Redirect href="/(root)/(tabs)/home" />;
}
