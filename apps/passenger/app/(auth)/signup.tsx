import { Link, router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { ReactNativeModal } from "react-native-modal";

import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import OTPInput from "@/components/OTPInput";
import PasswordStrengthIndicator from "@/components/PasswordStrengthIndicator";
import { icons } from "@/constants";
import { useAuth } from "@/contexts/AuthContext";
import { isValidEmail, suggestEmailDomain } from "@/utils/emailHelper";

const SignUp = () => {
  const { signup, apiBaseUrl } = useAuth();
  const [loading, setLoading] = useState(false);
  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [fieldSuccess, setFieldSuccess] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  const [verification, setVerification] = useState({
    state: "default",
    error: "",
    code: "",
  });

  // Real-time email validation and suggestion
  useEffect(() => {
    if (form.email && form.email.includes('@')) {
      const suggestion = suggestEmailDomain(form.email);
      setEmailSuggestion(suggestion ?? null);
      
      // Mark email as valid
      if (isValidEmail(form.email) && !suggestion) {
        setFieldSuccess(prev => ({ ...prev, email: true }));
      } else {
        setFieldSuccess(prev => ({ ...prev, email: false }));
      }
    } else {
      setEmailSuggestion(null);
      setFieldSuccess(prev => ({ ...prev, email: false }));
    }
  }, [form.email]);

  // Real-time name validation
  useEffect(() => {
    if (form.name.trim().length >= 2) {
      setFieldSuccess(prev => ({ ...prev, name: true }));
    } else {
      setFieldSuccess(prev => ({ ...prev, name: false }));
    }
  }, [form.name]);

  // Real-time confirm password validation
  useEffect(() => {
    if (form.confirmPassword && form.password === form.confirmPassword && form.password.length >= 8) {
      setFieldSuccess(prev => ({ ...prev, confirmPassword: true }));
    } else {
      setFieldSuccess(prev => ({ ...prev, confirmPassword: false }));
    }
  }, [form.confirmPassword, form.password]);

  const onSignUpPress = useCallback(async () => {
    // Clear previous errors
    setErrors({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    });

    let hasError = false;
    const newErrors = {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    };

    // Validate name
    if (!form.name.trim()) {
      newErrors.name = "Please enter your name.";
      hasError = true;
    } else if (form.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters.";
      hasError = true;
    }
    
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
      newErrors.password = "Please enter a password.";
      hasError = true;
    } else if (form.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long.";
      hasError = true;
    }
    
    // Validate password confirmation
    if (!form.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password.";
      hasError = true;
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
      hasError = true;
    }

    // If there are errors, display them and stop
    if (hasError) {
      setErrors(newErrors);
      return;
    }
    
    setLoading(true);
    try {
      // Step 1: Send email OTP
      const response = await fetch(`${apiBaseUrl}/auth/send-email-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email.trim().toLowerCase() }),
      });
      
      const data = await response.json();
      setLoading(false);
      
      if (!response.ok) {
        // Show error inline below email field
        setErrors({ ...errors, email: data.message || "Failed to send verification code" });
        return;
      }
      
      // Step 2: Show OTP modal
      setVerification({ state: "pending", error: "", code: "" });
      
    } catch (e) {
      setLoading(false);
      setErrors({ ...errors, email: "Cannot reach server. Please check your connection." });
      console.error(e);
    }
  }, [form]);

  const onVerifyPress = useCallback(async () => {
    setLoading(true);
    try {
      // Step 1: Verify email OTP
      const verifyResponse = await fetch(`${apiBaseUrl}/auth/verify-email-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: form.email.trim().toLowerCase(), 
          code: verification.code 
        }),
      });
      
      const verifyData = await verifyResponse.json();
      
      if (!verifyResponse.ok) {
        setLoading(false);
        setVerification({ ...verification, error: verifyData.message || "Invalid code" });
        return;
      }
      
      // Step 2: Create account after successful verification
      const result = await signup(form.email, form.password, form.name, "passenger");
      setLoading(false);
      
      if (result && result.error) {
        Alert.alert("Sign up failed", result.error);
        setVerification({ ...verification, state: "default", error: "" });
        return;
      }
      
      if (result && result.user) {
        setVerification({ ...verification, state: "success" });
        if (result.user.role === "admin") router.replace("/(admin)");
        else router.replace("/(root)/(tabs)/home");
      } else {
        // Handle case where signup returns undefined or null
        setLoading(false);
        Alert.alert("Error", "Signup failed. Please try again.");
        setVerification({ ...verification, state: "default", error: "" });
      }
    } catch (e) {
      setLoading(false);
      setVerification({ ...verification, error: "Verification failed" });
      console.error("Verification error:", e);
      Alert.alert("Error", `Verification failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  }, [form, verification, signup]);

  const applySuggestion = () => {
    if (emailSuggestion) {
      setForm({ ...form, email: emailSuggestion });
      setEmailSuggestion(null);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white" keyboardShouldPersistTaps="handled">
      <View className="flex-1 bg-white">
        <View className="relative w-full h-[200px] bg-primary-500 justify-center items-center">
          <Text className="text-5xl text-white font-JakartaBold tracking-tight">
            Cab Connect
          </Text>
        </View>

        <View className="px-6 py-8 -mt-6 bg-white rounded-t-3xl">
          <Text className="text-3xl text-gray-900 font-JakartaBold mb-2">
            Create Your Account
          </Text>
          <Text className="text-base text-gray-600 font-JakartaRegular mb-8">
            Sign up to start your journey
          </Text>

          <View className="mb-6">
            <InputField
              label="Full Name"
              placeholder="Enter your full name"
              icon={icons.person}
              value={form.name}
              error={errors.name}
              success={fieldSuccess.name}
              onChangeText={(value) => {
                setForm({ ...form, name: value });
                if (errors.name) setErrors({ ...errors, name: "" });
              }}
              containerStyle="mb-1"
              autoCapitalize="words"
              returnKeyType="next"
            />
            {errors.name ? (
              <Text className="text-red-500 text-sm mb-3">{errors.name}</Text>
            ) : null}

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
              }}
              containerStyle="mb-1"
              returnKeyType="next"
            />
            {errors.email ? (
              <Text className="text-red-500 text-sm mb-3">{errors.email}</Text>
            ) : emailSuggestion ? (
              <TouchableOpacity onPress={applySuggestion} className="mb-3">
                <Text className="text-sm text-primary-500 font-JakartaMedium">
                  Did you mean <Text className="font-JakartaBold">{emailSuggestion}</Text>?
                </Text>
              </TouchableOpacity>
            ) : null}

            <InputField
              label="Password"
              placeholder="Min. 8 characters"
              icon={icons.lock}
              secureTextEntry={true}
              textContentType="newPassword"
              value={form.password}
              error={errors.password}
              onChangeText={(value) => {
                setForm({ ...form, password: value });
                if (errors.password) setErrors({ ...errors, password: "" });
              }}
              containerStyle="mb-1"
              returnKeyType="next"
            />
            <PasswordStrengthIndicator password={form.password} />
            {errors.password ? (
              <Text className="text-red-500 text-sm mb-3 mt-2">{errors.password}</Text>
            ) : null}

            <InputField
              label="Confirm Password"
              placeholder="Repeat your password"
              icon={icons.lock}
              secureTextEntry={true}
              textContentType="newPassword"
              value={form.confirmPassword}
              error={errors.confirmPassword}
              success={fieldSuccess.confirmPassword}
              onChangeText={(value) => {
                setForm({ ...form, confirmPassword: value });
                if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: "" });
              }}
              containerStyle="mb-1"
              returnKeyType="done"
              onSubmitEditing={onSignUpPress}
            />
            {errors.confirmPassword ? (
              <Text className="text-red-500 text-sm mb-3">{errors.confirmPassword}</Text>
            ) : null}

            <View className="mb-6 mt-4" />

            <CustomButton
              title={loading ? "Creating account..." : "Sign Up"}
              onPress={onSignUpPress}
              className="shadow-none py-4"
              disabled={loading}
              bgVariant="success"
              IconLeft={() => loading ? <ActivityIndicator color="white" className="mr-2" /> : null}
            />
          </View>

          <View className="flex-row justify-center items-center my-6 gap-x-3">
            <View className="flex-1 h-[1px] bg-gray-200" />
            <Text className="text-sm text-gray-400 font-JakartaMedium">Or continue with</Text>
            <View className="flex-1 h-[1px] bg-gray-200" />
          </View>

          <View className="flex-row gap-3 mb-6">
            <TouchableOpacity 
              className="flex-1 flex-row items-center justify-center bg-white border border-gray-200 rounded-lg py-3" 
              onPress={() => Alert.alert("Coming Soon", "Google sign-in will be available soon!")}
              activeOpacity={0.7}
            >
              <Image source={icons.google} className="w-5 h-5 mr-2" resizeMode="contain" />
              <Text className="font-JakartaSemiBold text-sm text-gray-700">Google</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className="flex-1 flex-row items-center justify-center bg-white border border-gray-200 rounded-lg py-3" 
              onPress={() => Alert.alert("Coming Soon", "Apple sign-in will be available soon!")}
              activeOpacity={0.7}
            >
              <Image 
                source={{ uri: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/1667px-Apple_logo_black.svg.png" }} 
                className="w-5 h-5 mr-2" 
                resizeMode="contain" 
              />
              <Text className="font-JakartaSemiBold text-sm text-gray-700">Apple</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center my-4">
            <View className="flex-1 h-px bg-gray-300" />
            <Text className="mx-4 text-sm text-gray-500 font-JakartaMedium">OR</Text>
            <View className="flex-1 h-px bg-gray-300" />
          </View>

          <TouchableOpacity
            onPress={() => router.push("/(auth)/phone-signup")}
            className="border-2 border-primary-500 rounded-2xl py-4 mb-6 flex-row items-center justify-center"
            activeOpacity={0.7}
          >
            <Image source={icons.phone} className="w-5 h-5 mr-2" tintColor="#10b981" resizeMode="contain" />
            <Text className="text-primary-500 font-JakartaSemiBold text-base">
              Sign Up with Phone Number
            </Text>
          </TouchableOpacity>

          <Link
            href="/login"
            className="text-sm text-center text-gray-500 pb-8"
          >
            Already have an account?{" "}
            <Text className="text-primary-500 font-JakartaSemiBold">Login</Text>
          </Link>
        </View>

        {/* Enhanced OTP Modal */}
        <ReactNativeModal
          isVisible={verification.state === "pending"}
          onBackdropPress={() => {}}
          onBackButtonPress={() => {}}
          animationIn="slideInUp"
          animationOut="slideOutDown"
        >
          <View className="bg-white px-7 py-9 rounded-2xl">
            <Text className="font-JakartaExtraBold text-2xl mb-2 text-center">Verification</Text>
            <Text className="font-Jakarta mb-2 text-center text-gray-600">
              We've sent a 6-digit code to{"\n"}
              <Text className="font-JakartaBold text-primary-500">{form.email}</Text>
            </Text>
            
            {__DEV__ && (
              <View className="bg-blue-50 border-l-4 border-blue-500 p-3 mb-4 rounded-r-lg">
                <Text className="text-blue-700 font-JakartaMedium text-xs text-center">
                  Dev Mode: Use code <Text className="font-JakartaBold">123456</Text>
                </Text>
              </View>
            )}
            
            <OTPInput
              length={6}
              value={verification.code}
              onChange={(code) => setVerification({ ...verification, code, error: "" })}
              error={verification.error}
            />

            <CustomButton 
              title={loading ? "Verifying..." : "Verify & Create Account"} 
              onPress={onVerifyPress} 
              className="mt-6"
              disabled={loading || verification.code.length !== 6}
              bgVariant="success"
              IconLeft={() => loading ? <ActivityIndicator color="white" className="mr-2" /> : null}
            />

            <TouchableOpacity 
              onPress={() => setVerification({ state: "default", error: "", code: "" })}
              className="mt-4"
              disabled={loading}
            >
              <Text className="text-center text-gray-500 font-JakartaMedium">Cancel</Text>
            </TouchableOpacity>
          </View>
        </ReactNativeModal>
      </View>
    </ScrollView>
  );
};

export default SignUp;
