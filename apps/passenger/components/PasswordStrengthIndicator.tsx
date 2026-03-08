import React from "react";
import { Text, View } from "react-native";

interface PasswordStrengthIndicatorProps {
  password: string;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ password }) => {
  const getStrength = (): { strength: number; label: string; color: string } => {
    if (!password) return { strength: 0, label: "", color: "bg-gray-300" };

    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    
    // Character variety checks
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) return { strength: 1, label: "Weak", color: "bg-red-500" };
    if (strength <= 4) return { strength: 2, label: "Medium", color: "bg-yellow-500" };
    return { strength: 3, label: "Strong", color: "bg-primary-500" };
  };

  const { strength, label, color } = getStrength();

  if (!password) return null;

  return (
    <View className="mb-2">
      <View className="flex-row space-x-1 mb-1">
        {[1, 2, 3].map((level) => (
          <View
            key={level}
            className={`flex-1 h-1 rounded-full ${
              level <= strength ? color : "bg-gray-300"
            }`}
          />
        ))}
      </View>
      {label && (
        <Text className={`text-xs font-JakartaMedium ${
          strength === 1 ? "text-danger-500" : strength === 2 ? "text-accent-600" : "text-primary-600"
        }`}>
          Password strength: {label}
        </Text>
      )}
    </View>
  );
};

export default PasswordStrengthIndicator;
