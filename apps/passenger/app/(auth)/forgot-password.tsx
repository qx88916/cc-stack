import { Link, router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import OTPInput from "@/components/OTPInput";
import PasswordStrengthIndicator from "@/components/PasswordStrengthIndicator";
import { icons } from "@/constants";
import { useAuth } from "@/contexts/AuthContext";
import { isValidEmail } from "@/utils/emailHelper";

type Step = "email" | "otp" | "newPassword";

const ForgotPassword = () => {
  const { apiBaseUrl } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>("email");
  const [form, setForm] = useState({
    email: "",
    code: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({
    email: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [otpError, setOtpError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [fieldSuccess, setFieldSuccess] = useState({
    email: false,
    newPassword: false,
    confirmPassword: false,
  });

  // Real-time email validation
  useEffect(() => {
    if (form.email && isValidEmail(form.email)) {
      setFieldSuccess(prev => ({ ...prev, email: true }));
    } else {
      setFieldSuccess(prev => ({ ...prev, email: false }));
    }
  }, [form.email]);

  // Real-time password confirmation validation
  useEffect(() => {
    if (form.confirmPassword && form.newPassword === form.confirmPassword && form.newPassword.length >= 8) {
      setFieldSuccess(prev => ({ ...prev, confirmPassword: true }));
    } else {
      setFieldSuccess(prev => ({ ...prev, confirmPassword: false }));
    }
  }, [form.confirmPassword, form.newPassword]);

  const onSendCodePress = useCallback(async () => {
    // Clear errors
    setErrors({ email: "", newPassword: "", confirmPassword: "" });

    // Validate email
    if (!form.email.trim()) {
      setErrors({ ...errors, email: "Please enter your email." });
      return;
    }

    // Validate email format
    if (!isValidEmail(form.email.trim())) {
      setErrors({ ...errors, email: "Please enter a valid email address." });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${apiBaseUrl}/auth/request-password-reset`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email.trim().toLowerCase() }),
        }
      );

      const data = await response.json();
      setLoading(false);

      if (!response.ok) {
        setErrors({ ...errors, email: data.message || "Failed to send reset code" });
        return;
      }

      setCurrentStep("otp");
      setSuccessMessage("Reset code sent! Please check your email inbox.");
    } catch (e) {
      setLoading(false);
      setErrors({ ...errors, email: "Cannot reach server. Check your connection." });
      console.error(e);
    }
  }, [form.email, errors]);

  const onVerifyCodePress = useCallback(async () => {
    setLoading(true);
    setOtpError("");
    
    try {
      const response = await fetch(
        `${apiBaseUrl}/auth/verify-password-reset`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: form.email.trim().toLowerCase(),
            code: form.code,
          }),
        }
      );

      const data = await response.json();
      setLoading(false);

      if (!response.ok) {
        setOtpError(data.message || "Invalid code");
        return;
      }

      setCurrentStep("newPassword");
    } catch (e) {
      setLoading(false);
      setOtpError("Verification failed. Please try again.");
      console.error(e);
    }
  }, [form.email, form.code]);

  const onResetPasswordPress = useCallback(async () => {
    // Clear errors
    setErrors({ email: "", newPassword: "", confirmPassword: "" });

    let hasError = false;
    const newErrors = { email: "", newPassword: "", confirmPassword: "" };

    // Validate new password
    if (!form.newPassword) {
      newErrors.newPassword = "Please enter a new password.";
      hasError = true;
    } else if (form.newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters long.";
      hasError = true;
    }

    // Validate password confirmation
    if (!form.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password.";
      hasError = true;
    } else if (form.newPassword !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${apiBaseUrl}/auth/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: form.email.trim().toLowerCase(),
            code: form.code,
            newPassword: form.newPassword,
          }),
        }
      );

      const data = await response.json();
      setLoading(false);

      if (!response.ok) {
        Alert.alert("Error", data.message || "Failed to reset password");
        return;
      }

      Alert.alert(
        "Success",
        "Your password has been reset successfully. Please login with your new password.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/login"),
          },
        ]
      );
    } catch (e) {
      setLoading(false);
      Alert.alert("Error", "An unexpected error occurred");
      console.error(e);
    }
  }, [form]);

  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <ScrollView className="flex-1 bg-white" keyboardShouldPersistTaps="handled" bounces={false}>
        <View className="flex-1 bg-white">
          <View
            className="w-full bg-primary-500 justify-center items-center"
            style={{ paddingTop: insets.top + 24, paddingBottom: 48 }}
          >
            <Text className="text-4xl text-white font-JakartaBold tracking-tight">
              Cab Connect
            </Text>
          </View>

          <View className="px-6 py-8 -mt-6 bg-white rounded-t-3xl">
          {/* Step 1: Email Input */}
          {currentStep === "email" && (
            <>
              <Text className="text-3xl text-gray-900 font-JakartaBold mb-2">
                Forgot Password?
              </Text>
              <Text className="text-base text-gray-600 font-JakartaRegular mb-8">
                Enter your email to receive a reset code
              </Text>

              <View className="mb-6">
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
                  returnKeyType="done"
                  onSubmitEditing={onSendCodePress}
                />
                {errors.email ? (
                  <Text className="text-red-500 text-sm mb-4">{errors.email}</Text>
                ) : null}

                <CustomButton
                  title={loading ? "Sending..." : "Send Reset Code"}
                  onPress={onSendCodePress}
                  className="shadow-none py-4"
                  disabled={loading}
                  bgVariant="success"
                  IconLeft={() => loading ? <ActivityIndicator color="white" className="mr-2" /> : null}
                />
              </View>

              <Link
                href="/login"
                className="text-sm text-center text-gray-500 pb-8"
              >
                Remember your password?{" "}
                <Text className="text-primary-500 font-JakartaSemiBold">
                  Login
                </Text>
              </Link>
            </>
          )}

          {/* Step 2: OTP Verification */}
          {currentStep === "otp" && (
            <>
              <TouchableOpacity 
                onPress={() => setCurrentStep("email")}
                className="mb-4"
              >
                <Text className="text-primary-500 font-JakartaSemiBold">← Back</Text>
              </TouchableOpacity>

              <Text className="text-3xl text-gray-900 font-JakartaBold mb-2">
                Verify Code
              </Text>
              <Text className="text-base text-gray-600 font-JakartaRegular mb-2">
                We've sent a 6-digit code to
              </Text>
              <Text className="text-base text-primary-500 font-JakartaBold mb-8">
                {form.email}
              </Text>

              {successMessage && (
                <View className="bg-primary-100 border-l-4 border-primary-500 p-4 mb-6 rounded-r-lg flex-row items-start">
                  <Image source={icons.checkmark} className="w-4 h-4 mr-2 mt-0.5" tintColor="#10b981" resizeMode="contain" />
                  <Text className="text-primary-700 font-JakartaMedium text-sm flex-1">
                    {successMessage}
                  </Text>
                </View>
              )}

              <View className="mb-6">
                <OTPInput
                  length={6}
                  value={form.code}
                  onChange={(code) => {
                    setForm({ ...form, code });
                    setOtpError("");
                  }}
                  error={otpError}
                />

                <CustomButton
                  title={loading ? "Verifying..." : "Verify Code"}
                  onPress={onVerifyCodePress}
                  className="shadow-none py-4 mt-6"
                  disabled={loading || form.code.length !== 6}
                  bgVariant="success"
                  IconLeft={() => loading ? <ActivityIndicator color="white" className="mr-2" /> : null}
                />
              </View>

              <Link
                href="/login"
                className="text-sm text-center text-gray-500 pb-8"
              >
                Back to{" "}
                <Text className="text-primary-500 font-JakartaSemiBold">
                  Login
                </Text>
              </Link>
            </>
          )}

          {/* Step 3: New Password */}
          {currentStep === "newPassword" && (
            <>
              <TouchableOpacity 
                onPress={() => setCurrentStep("otp")}
                className="mb-4"
              >
                <Text className="text-primary-500 font-JakartaSemiBold">← Back</Text>
              </TouchableOpacity>

              <Text className="text-3xl text-gray-900 font-JakartaBold mb-2">
                Reset Password
              </Text>
              <Text className="text-base text-gray-600 font-JakartaRegular mb-8">
                Enter your new password
              </Text>

              <View className="mb-6">
                <InputField
                  label="New Password"
                  placeholder="Min. 8 characters"
                  icon={icons.lock}
                  secureTextEntry={true}
                  textContentType="newPassword"
                  value={form.newPassword}
                  error={errors.newPassword}
                  onChangeText={(value) => {
                    setForm({ ...form, newPassword: value });
                    if (errors.newPassword) setErrors({ ...errors, newPassword: "" });
                  }}
                  containerStyle="mb-1"
                  returnKeyType="next"
                />
                <PasswordStrengthIndicator password={form.newPassword} />
                {errors.newPassword ? (
                  <Text className="text-red-500 text-sm mb-3 mt-2">{errors.newPassword}</Text>
                ) : null}

                <InputField
                  label="Confirm Password"
                  placeholder="Repeat new password"
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
                  onSubmitEditing={onResetPasswordPress}
                />
                {errors.confirmPassword ? (
                  <Text className="text-red-500 text-sm mb-4">{errors.confirmPassword}</Text>
                ) : null}

                <CustomButton
                  title={loading ? "Resetting..." : "Reset Password"}
                  onPress={onResetPasswordPress}
                  className="shadow-none py-4"
                  disabled={loading}
                  bgVariant="success"
                  IconLeft={() => loading ? <ActivityIndicator color="white" className="mr-2" /> : null}
                />
              </View>
            </>
          )}
        </View>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ForgotPassword;
