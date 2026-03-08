import { Link, router } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const onSignInPress = useCallback(async () => {
    if (!form.email.trim() || !form.password) {
      Alert.alert("Error", "Please enter email and password.");
      return;
    }
    setLoading(true);
    const { error, user } = await login(form.email, form.password);
    setLoading(false);
    if (error) {
      Alert.alert("Login failed", error);
      return;
    }
    if (user?.role === "admin") router.replace("/(admin)");
    else router.replace("/(root)/(tabs)/home");
  }, [form, login]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header banner */}
        <View className="bg-amber-500 h-48 items-center justify-center px-6">
          <Ionicons name="car-sport" size={56} color="#fff" />
          <Text className="text-white text-2xl font-bold mt-3">
            Welcome Back
          </Text>
          <Text className="text-white/80 text-sm mt-1">
            Sign in to your driver account
          </Text>
        </View>

        <View className="p-6 flex-1">
          <InputField
            label="Email"
            placeholder="Enter email"
            textContentType="emailAddress"
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.email}
            onChangeText={(value) => setForm({ ...form, email: value })}
          />

          <InputField
            label="Password"
            placeholder="Enter password"
            secureTextEntry
            textContentType="password"
            value={form.password}
            onChangeText={(value) => setForm({ ...form, password: value })}
          />

          <CustomButton
            title={loading ? "Signing in…" : "Sign In"}
            onPress={onSignInPress}
            className="mt-6"
            disabled={loading}
          />

          <Link
            href="/signup"
            className="text-base text-center text-neutral-500 mt-8"
          >
            Don't have an account?{" "}
            <Text className="text-amber-500 font-bold">Sign Up</Text>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
