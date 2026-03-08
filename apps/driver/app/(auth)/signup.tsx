import { Link, router } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import { useAuth } from "@/contexts/AuthContext";

const CURRENT_YEAR = new Date().getFullYear();

const SignUp = () => {
  const { apiBaseUrl } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"personal" | "vehicle">("personal");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    vehicleMake: "",
    vehicleModel: "",
    vehicleYear: "",
    vehicleColor: "",
    plateNumber: "",
  });

  const validatePersonal = (): boolean => {
    if (!form.name.trim()) {
      Alert.alert("Error", "Please enter your name.");
      return false;
    }
    if (!form.email.trim()) {
      Alert.alert("Error", "Please enter your email.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      Alert.alert("Error", "Please enter a valid email address.");
      return false;
    }
    if (!form.password || form.password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters.");
      return false;
    }
    return true;
  };

  const validateVehicle = (): boolean => {
    if (!form.vehicleMake.trim()) {
      Alert.alert("Error", "Please enter the vehicle make (e.g. Toyota).");
      return false;
    }
    if (!form.vehicleModel.trim()) {
      Alert.alert("Error", "Please enter the vehicle model (e.g. HiAce).");
      return false;
    }
    if (!form.vehicleYear.trim()) {
      Alert.alert("Error", "Please enter the vehicle year.");
      return false;
    }
    const year = parseInt(form.vehicleYear, 10);
    if (isNaN(year) || year < 1990 || year > CURRENT_YEAR + 1) {
      Alert.alert(
        "Error",
        `Vehicle year must be between 1990 and ${CURRENT_YEAR + 1}.`
      );
      return false;
    }
    if (!form.vehicleColor.trim()) {
      Alert.alert("Error", "Please enter the vehicle color.");
      return false;
    }
    if (!form.plateNumber.trim()) {
      Alert.alert("Error", "Please enter the plate number.");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validatePersonal()) setStep("vehicle");
  };

  const onSignUpPress = useCallback(async () => {
    if (!validateVehicle()) return;

    setLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          password: form.password,
          name: form.name.trim(),
          role: "driver",
          phone: form.phone.trim(),
          vehicleMake: form.vehicleMake.trim(),
          vehicleModel: form.vehicleModel.trim(),
          vehicleYear: parseInt(form.vehicleYear, 10),
          vehicleColor: form.vehicleColor.trim(),
          plateNumber: form.plateNumber.trim().toUpperCase(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        Alert.alert("Sign up failed", data.message ?? "Could not create account");
        return;
      }

      await AsyncStorage.multiSet([
        ["@auth/token", data.token],
        ["@auth/user", JSON.stringify(data.user)],
      ]);

      router.replace("/(root)/(tabs)/home");
    } catch {
      Alert.alert(
        "Error",
        `Cannot reach the server. Check your connection.`
      );
    } finally {
      setLoading(false);
    }
  }, [form, apiBaseUrl]);

  const updateField = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header banner */}
        <View className="bg-amber-500 h-40 items-center justify-center px-6">
          <Ionicons
            name={step === "personal" ? "person-add" : "car-sport"}
            size={40}
            color="#fff"
          />
          <Text className="text-white text-xl font-bold mt-2">
            {step === "personal" ? "Create Driver Account" : "Vehicle Information"}
          </Text>
          <View className="flex-row mt-3">
            <View className={`w-8 h-1.5 rounded-full mr-1 ${step === "personal" ? "bg-white" : "bg-white/40"}`} />
            <View className={`w-8 h-1.5 rounded-full ${step === "vehicle" ? "bg-white" : "bg-white/40"}`} />
          </View>
        </View>

        {step === "personal" ? (
          <View className="p-6 flex-1">
            <InputField
              label="Full Name"
              placeholder="Enter your full name"
              value={form.name}
              onChangeText={updateField("name")}
            />
            <InputField
              label="Email"
              placeholder="Enter email"
              textContentType="emailAddress"
              keyboardType="email-address"
              autoCapitalize="none"
              value={form.email}
              onChangeText={updateField("email")}
            />
            <InputField
              label="Phone (optional)"
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={updateField("phone")}
            />
            <InputField
              label="Password"
              placeholder="Minimum 8 characters"
              secureTextEntry
              textContentType="password"
              value={form.password}
              onChangeText={updateField("password")}
            />
            <CustomButton
              title="Next — Vehicle Info"
              onPress={handleNext}
              className="mt-6"
            />
            <Link
              href="/login"
              className="text-base text-center text-neutral-500 mt-8"
            >
              Already have an account?{" "}
              <Text className="text-amber-500 font-bold">Log In</Text>
            </Link>
          </View>
        ) : (
          <View className="p-6 flex-1">
            <InputField
              label="Vehicle Make"
              placeholder="e.g. Toyota"
              value={form.vehicleMake}
              onChangeText={updateField("vehicleMake")}
            />
            <InputField
              label="Vehicle Model"
              placeholder="e.g. HiAce"
              value={form.vehicleModel}
              onChangeText={updateField("vehicleModel")}
            />
            <InputField
              label="Vehicle Year"
              placeholder="e.g. 2020"
              keyboardType="number-pad"
              value={form.vehicleYear}
              onChangeText={updateField("vehicleYear")}
            />
            <InputField
              label="Vehicle Color"
              placeholder="e.g. White"
              value={form.vehicleColor}
              onChangeText={updateField("vehicleColor")}
            />
            <InputField
              label="Plate Number"
              placeholder="e.g. LT 1234"
              autoCapitalize="characters"
              value={form.plateNumber}
              onChangeText={updateField("plateNumber")}
            />
            <View className="flex-row mt-6 space-x-3">
              <CustomButton
                title="Back"
                onPress={() => setStep("personal")}
                bgVariant="outline"
                textVariant="primary"
                className="flex-1"
              />
              <CustomButton
                title={loading ? "Creating…" : "Sign Up"}
                onPress={onSignUpPress}
                className="flex-1"
                disabled={loading}
              />
            </View>
            <Link
              href="/login"
              className="text-base text-center text-neutral-500 mt-8"
            >
              Already have an account?{" "}
              <Text className="text-amber-500 font-bold">Log In</Text>
            </Link>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default SignUp;
