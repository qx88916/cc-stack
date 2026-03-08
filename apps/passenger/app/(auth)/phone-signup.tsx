import { router } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";

import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import OTPInput from "@/components/OTPInput";
import PasswordStrengthIndicator from "@/components/PasswordStrengthIndicator";
import { icons } from "@/constants";
import { useAuth } from "@/contexts/AuthContext";

export default function PhoneSignup() {
  const { apiBaseUrl } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState({
    phone: "",
    password: "",
    name: "",
  });
  const [otp, setOtp] = useState("");
  const [errors, setErrors] = useState({ phone: "", password: "", name: "" });
  const [backendError, setBackendError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Validate Fiji phone number (7 digits, starts with 6, 7, 8, or 9)
  const validatePhone = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, "");
    return cleaned.length === 7 && /^[6789]/.test(cleaned);
  };

  const handleNextStep1 = useCallback(() => {
    const newErrors = { phone: "", password: "", name: "" };
    let hasError = false;

    const cleaned = form.phone.replace(/\D/g, "");
    if (!cleaned) {
      newErrors.phone = "Phone number is required";
      hasError = true;
    } else if (!validatePhone(cleaned)) {
      newErrors.phone = "Enter a valid Fiji mobile number (7 digits, starts with 6/7/8/9)";
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    setErrors(newErrors);
    setStep(2);
  }, [form.phone]);

  const handleNextStep2 = useCallback(() => {
    const newErrors = { phone: "", password: "", name: "" };
    let hasError = false;

    if (!form.password) {
      newErrors.password = "Password is required";
      hasError = true;
    } else if (form.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    setErrors(newErrors);
    sendOTP();
  }, [form.password]);

  const sendOTP = async () => {
    setLoading(true);
    setBackendError("");
    try {
      const cleaned = form.phone.replace(/\D/g, "");
      const response = await fetch(`${apiBaseUrl}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: `+679${cleaned}`, purpose: "signup" }),
      });
      const data = await response.json();
      if (!response.ok) {
        setBackendError(data.message || "Failed to send OTP");
        setLoading(false);
        return;
      }
      setStep(3);
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (e) {
      setBackendError("Network error. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (otp.length !== 6) {
      Alert.alert("Invalid Code", "Please enter the 6-digit code");
      return;
    }

    setLoading(true);
    setBackendError("");
    try {
      const cleaned = form.phone.replace(/\D/g, "");
      const response = await fetch(`${apiBaseUrl}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: `+679${cleaned}`,
          code: otp,
          password: form.password,
          name: form.name || "",
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setBackendError(data.message || "Invalid or expired code");
        setLoading(false);
        return;
      }
      Alert.alert("Success!", "Your account has been created");
      router.replace("/(auth)/login");
    } catch (e) {
      setBackendError("Network error. Check your connection.");
    } finally {
      setLoading(false);
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
          <Text className="text-2xl font-JakartaBold text-gray-900 mb-1">
            Sign Up with Phone
          </Text>
          <Text className="text-sm text-gray-600 font-JakartaRegular mb-6">
            Step {step} of 3
          </Text>

          {backendError && (
            <View className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
              <Text className="text-red-700 font-JakartaRegular text-sm">
                {backendError}
              </Text>
            </View>
          )}

          {step === 1 && (
            <View>
              <Text className="text-base font-JakartaBold text-gray-900 mb-3">
                📱 Enter your phone number
              </Text>
              <View className="flex-row items-center mb-6">
                <View className="bg-neutral-100 px-4 py-4 rounded-l-2xl border-2 border-r-0 border-neutral-200">
                  <Text className="text-base font-JakartaBold text-gray-700">+679</Text>
                </View>
                <InputField
                  label=""
                  placeholder="9123456"
                  keyboardType="phone-pad"
                  value={form.phone}
                  error={errors.phone}
                  onChangeText={(value) => {
                    const cleaned = value.replace(/\D/g, "").slice(0, 7);
                    setForm({ ...form, phone: cleaned });
                    if (errors.phone) setErrors({ ...errors, phone: "" });
                    if (backendError) setBackendError("");
                  }}
                  containerStyle="flex-1 mb-0"
                  inputStyle="rounded-l-none"
                  maxLength={7}
                />
              </View>
              {errors.phone && (
                <Text className="text-red-500 text-sm mb-3 -mt-4">{errors.phone}</Text>
              )}

              <CustomButton
                title="Next"
                onPress={handleNextStep1}
                className="mb-4"
                bgVariant="success"
              />
            </View>
          )}

          {step === 2 && (
            <View>
              <Text className="text-base font-JakartaBold text-gray-900 mb-3">
                🔒 Create a password
              </Text>
              <InputField
                label="Password"
                placeholder="At least 8 characters"
                icon={icons.lock}
                secureTextEntry
                value={form.password}
                error={errors.password}
                onChangeText={(value) => {
                  setForm({ ...form, password: value });
                  if (errors.password) setErrors({ ...errors, password: "" });
                  if (backendError) setBackendError("");
                }}
                containerStyle="mb-3"
              />
              <PasswordStrengthIndicator password={form.password} />
              {errors.password && (
                <Text className="text-red-500 text-sm mb-3">{errors.password}</Text>
              )}

              <InputField
                label="Name (optional)"
                placeholder="Your name"
                icon={icons.person}
                value={form.name}
                onChangeText={(value) => setForm({ ...form, name: value })}
                containerStyle="mb-6 mt-4"
              />

              <CustomButton
                title={loading ? "Sending OTP..." : "Next"}
                onPress={handleNextStep2}
                className="mb-4"
                bgVariant="success"
                disabled={loading}
                IconLeft={() => loading ? <ActivityIndicator color="white" className="mr-2" /> : null}
              />
              <TouchableOpacity onPress={() => setStep(1)}>
                <Text className="text-center text-primary-500 font-JakartaSemiBold">
                  Back
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 3 && (
            <View>
              <Text className="text-base font-JakartaBold text-gray-900 mb-1">
                ✉️ Enter verification code
              </Text>
              <Text className="text-sm text-gray-600 font-JakartaRegular mb-6">
                Sent to +679 {form.phone}
              </Text>
              <OTPInput length={6} value={otp} onChange={setOtp} />

              {resendCooldown > 0 ? (
                <Text className="text-center text-gray-500 font-JakartaMedium mt-4 mb-6">
                  Resend code in {resendCooldown}s
                </Text>
              ) : (
                <TouchableOpacity onPress={sendOTP} disabled={loading} className="mt-4 mb-6">
                  <Text className="text-center text-primary-500 font-JakartaSemiBold">
                    Resend Code
                  </Text>
                </TouchableOpacity>
              )}

              <CustomButton
                title={loading ? "Verifying..." : "Create Account"}
                onPress={verifyOTP}
                className="mb-4"
                bgVariant="success"
                disabled={loading || otp.length !== 6}
                IconLeft={() => loading ? <ActivityIndicator color="white" className="mr-2" /> : null}
              />
              <TouchableOpacity onPress={() => setStep(2)}>
                <Text className="text-center text-primary-500 font-JakartaSemiBold">
                  Back
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View className="mt-6">
            <Text className="text-center text-sm text-gray-500 font-JakartaRegular">
              Already have an account?{" "}
              <Text
                className="text-primary-500 font-JakartaSemiBold"
                onPress={() => router.push("/(auth)/login")}
              >
                Login
              </Text>
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
