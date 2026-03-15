import { router } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import { icons, images } from "@/constants";
import { COLORS } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";

export default function PhoneLogin() {
  const { loginWithPhone } = useAuth();
  const [form, setForm] = useState({ phone: "", password: "" });
  const [errors, setErrors] = useState({ phone: "", password: "" });
  const [backendError, setBackendError] = useState("");
  const [loading, setLoading] = useState(false);

  // Validate Fiji phone number (7 digits, starts with 6, 7, 8, or 9)
  const validatePhone = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, "");
    return cleaned.length === 7 && /^[6789]/.test(cleaned);
  };

  const onLoginPress = useCallback(async () => {
    setErrors({ phone: "", password: "" });
    setBackendError("");

    let hasError = false;
    const newErrors = { phone: "", password: "" };

    const cleaned = form.phone.replace(/\D/g, "");
    if (!cleaned) {
      newErrors.phone = "Phone number is required";
      hasError = true;
    } else if (!validatePhone(cleaned)) {
      newErrors.phone = "Enter a valid Fiji mobile number (7 digits, starts with 6/7/8/9)";
      hasError = true;
    }

    if (!form.password) {
      newErrors.password = "Password is required";
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    const { error, user } = await loginWithPhone(`+679${cleaned}`, form.password);
    setLoading(false);

    if (error) {
      setBackendError(error);
      return;
    }

    if (user?.role === "admin") router.replace("/(admin)");
    else router.replace("/(root)/(tabs)/home");
  }, [form, loginWithPhone]);

  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
    <ScrollView className="flex-1 bg-white" keyboardShouldPersistTaps="handled" bounces={false}>
      <View className="flex-1 bg-white">
        <View
          className="w-full bg-primary-500 items-center justify-center"
          style={{ paddingTop: insets.top + 20, paddingBottom: 40 }}
        >
          <View style={{ width: 200, height: 50 }}>
            <images.logoHorizontal width="100%" height="100%" />
          </View>
        </View>

        <View className="px-6 py-8 -mt-5 bg-white rounded-t-3xl">
          <Text className="text-2xl font-JakartaBold text-gray-900 mb-1">
            Login with Phone
          </Text>
          <Text className="text-sm text-gray-600 font-JakartaRegular mb-6">
            Enter your phone number and password
          </Text>

          {backendError && (
            <View className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
              <View className="flex-row items-start">
                <Text className="text-red-500 text-xl mr-2">⚠️</Text>
                <View className="flex-1">
                  <Text className="text-red-800 font-JakartaBold text-sm mb-1">
                    Login Failed
                  </Text>
                  <Text className="text-red-700 font-JakartaRegular text-sm">
                    {backendError}
                  </Text>
                </View>
              </View>
            </View>
          )}

          <View className="mb-4">
            <Text className="text-sm font-JakartaSemiBold text-gray-700 mb-2">
              Phone Number
            </Text>
            <View className="flex-row items-center mb-4">
              <View
                className="bg-neutral-100 px-4 rounded-l-2xl border-2 border-r-0 justify-center"
                style={{ height: 54, borderColor: errors.phone ? COLORS.danger : COLORS.neutral200 }}
              >
                <Text className="text-base font-JakartaBold text-gray-700">+679</Text>
              </View>
              <TextInput
                placeholder="9123456"
                keyboardType="phone-pad"
                value={form.phone}
                onChangeText={(value) => {
                  const cleaned = value.replace(/\D/g, "").slice(0, 7);
                  setForm({ ...form, phone: cleaned });
                  if (errors.phone) setErrors({ ...errors, phone: "" });
                  if (backendError) setBackendError("");
                }}
                maxLength={7}
                returnKeyType="next"
                style={{
                  flex: 1,
                  height: 54,
                  backgroundColor: "white",
                  borderWidth: 2,
                  borderColor: errors.phone ? COLORS.danger : COLORS.neutral200,
                  borderLeftWidth: 0,
                  borderTopRightRadius: 16,
                  borderBottomRightRadius: 16,
                  paddingHorizontal: 16,
                  fontSize: 16,
                  color: COLORS.neutral900,
                  fontFamily: "Jakarta",
                }}
                placeholderTextColor={COLORS.neutral400}
              />
            </View>
            {errors.phone && (
              <Text className="text-red-500 text-sm mb-3 -mt-2">{errors.phone}</Text>
            )}

            <InputField
              label="Password"
              placeholder="Enter your password"
              icon={icons.lock}
              secureTextEntry
              textContentType="password"
              value={form.password}
              error={errors.password}
              onChangeText={(value) => {
                setForm({ ...form, password: value });
                if (errors.password) setErrors({ ...errors, password: "" });
                if (backendError) setBackendError("");
              }}
              containerStyle="mb-1"
              returnKeyType="done"
              onSubmitEditing={onLoginPress}
            />
            {errors.password && (
              <Text className="text-red-500 text-sm mb-3">{errors.password}</Text>
            )}
          </View>

          <CustomButton
            title={loading ? "Logging in..." : "Login"}
            onPress={onLoginPress}
            className="shadow-none py-4 mb-4"
            disabled={loading}
            bgVariant="success"
            IconLeft={() => loading ? <ActivityIndicator color="white" className="mr-2" /> : null}
          />

          <View className="mt-2 mb-6">
            <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
              <Text className="text-center text-primary-500 font-JakartaSemiBold text-sm">
                ← Use Email Instead
              </Text>
            </TouchableOpacity>
          </View>

          <View className="border-t border-gray-200 pt-6">
            <Text className="text-sm text-center text-gray-500 pb-8">
              Don't have an account?{" "}
              <Text
                className="text-primary-500 font-JakartaSemiBold"
                onPress={() => router.push("/(auth)/phone-signup")}
              >
                Sign up with phone
              </Text>
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}
