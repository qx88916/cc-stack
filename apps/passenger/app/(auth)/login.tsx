import { Link, router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";

import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import { icons } from "@/constants";
import { useAuth } from "@/contexts/AuthContext";
import { isValidEmail } from "@/utils/emailHelper";

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [backendError, setBackendError] = useState(""); // New: For backend errors
  const [loading, setLoading] = useState(false);
  const [fieldSuccess, setFieldSuccess] = useState({
    email: false,
    password: false,
  });

  // Real-time email validation
  useEffect(() => {
    if (form.email && isValidEmail(form.email)) {
      setFieldSuccess(prev => ({ ...prev, email: true }));
    } else {
      setFieldSuccess(prev => ({ ...prev, email: false }));
    }
  }, [form.email]);

  // Real-time password validation
  useEffect(() => {
    if (form.password.length >= 8) {
      setFieldSuccess(prev => ({ ...prev, password: true }));
    } else {
      setFieldSuccess(prev => ({ ...prev, password: false }));
    }
  }, [form.password]);

  const onSignInPress = useCallback(async () => {
    // Clear previous errors
    setErrors({ email: "", password: "" });
    setBackendError(""); // Clear backend error

    let hasError = false;
    const newErrors = { email: "", password: "" };

    // Validate email
    if (!form.email.trim()) {
      newErrors.email = "Please enter your email.";
      hasError = true;
    } else if (!isValidEmail(form.email.trim())) {
      newErrors.email = "Please enter a valid email address.";
      hasError = true;
    }

    // Validate password
    if (!form.password) {
      newErrors.password = "Please enter your password.";
      hasError = true;
    }

    // If there are errors, display them and stop
    if (hasError) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    const { error, user } = await login(form.email, form.password);
    setLoading(false);
    
    if (error) {
      // Show error in banner only, not in field
      setBackendError(error);
      return;
    }
    
    if (user?.role === "admin") router.replace("/(admin)");
    else router.replace("/(root)/(tabs)/home");
  }, [form, login]);

  return (
    <ScrollView className="flex-1 bg-white" keyboardShouldPersistTaps="handled">
      <View className="flex-1 bg-white">
        <View className="relative w-full h-[200px] bg-primary-500 justify-center items-center">
          <Text className="text-5xl text-white font-JakartaBold tracking-tight">
            Cab Connect
          </Text>
        </View>

        <View className="px-6 py-8 -mt-6 bg-white rounded-t-3xl">
          <Text className="text-2xl font-JakartaBold text-gray-900 mb-1">
            Welcome Back
          </Text>
          <Text className="text-sm text-gray-600 font-JakartaRegular mb-6">
            Login to continue your journey
          </Text>

          {/* Backend Error Banner */}
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
            <InputField
              label="Email"
              placeholder="your.email@example.com"
              icon={icons.email}
              textContentType="emailAddress"
              keyboardType="email-address"
              autoCapitalize="none"
              value={form.email}
              error={errors.email}
              success={fieldSuccess.email}
              onChangeText={(value) => {
                setForm({ ...form, email: value });
                if (errors.email) setErrors({ ...errors, email: "" });
                if (backendError) setBackendError(""); // Clear backend error on change
              }}
              containerStyle="mb-1"
              returnKeyType="next"
            />
            {errors.email ? (
              <Text className="text-red-500 text-sm mb-3">{errors.email}</Text>
            ) : null}

            <InputField
              label="Password"
              placeholder="Enter your password"
              icon={icons.lock}
              secureTextEntry
              textContentType="password"
              value={form.password}
              error={errors.password}
              success={fieldSuccess.password}
              onChangeText={(value) => {
                setForm({ ...form, password: value });
                if (errors.password) setErrors({ ...errors, password: "" });
                if (backendError) setBackendError(""); // Clear backend error on change
              }}
              containerStyle="mb-1"
              returnKeyType="done"
              onSubmitEditing={onSignInPress}
            />
            {errors.password ? (
              <Text className="text-red-500 text-sm mb-3">{errors.password}</Text>
            ) : null}

            <View className="flex-row justify-end items-center mb-6 mt-2">
              <Link
                href="/forgot-password"
                className="text-sm text-primary-500 font-JakartaSemiBold"
              >
                Forgot Password?
              </Link>
            </View>
          </View>

          <CustomButton
            title={loading ? "Signing in..." : "Login"}
            onPress={onSignInPress}
            className="shadow-none py-4 mb-4"
            disabled={loading}
            bgVariant="success"
            IconLeft={() => loading ? <ActivityIndicator color="white" className="mr-2" /> : null}
          />

          <View className="flex-row items-center my-4">
            <View className="flex-1 h-px bg-gray-300" />
            <Text className="mx-4 text-sm text-gray-500 font-JakartaMedium">OR</Text>
            <View className="flex-1 h-px bg-gray-300" />
          </View>

          <TouchableOpacity
            onPress={() => router.push("/(auth)/phone-login")}
            className="border-2 border-primary-500 rounded-2xl py-4 mb-6 flex-row items-center justify-center"
            activeOpacity={0.7}
          >
            <Image source={icons.phone} className="w-5 h-5 mr-2" tintColor="#10b981" resizeMode="contain" />
            <Text className="text-primary-500 font-JakartaSemiBold text-base">
              Login with Phone Number
            </Text>
          </TouchableOpacity>

          <Link
            href="/signup"
            className="text-sm text-center text-gray-500 pb-8"
          >
            Don't have an account?{" "}
            <Text className="text-primary-500 font-JakartaSemiBold">Create an account</Text>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}
