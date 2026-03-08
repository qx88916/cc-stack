import React, { useRef, useState } from "react";
import { NativeSyntheticEvent, Text, TextInput, TextInputKeyPressEventData, View } from "react-native";

interface OTPInputProps {
  length: number;
  value: string;
  onChange: (code: string) => void;
  error?: string;
}

const OTPInput: React.FC<OTPInputProps> = ({ length, value, onChange, error }) => {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const inputRefs = useRef<TextInput[]>([]);

  const handleChange = (text: string, index: number) => {
    // Only allow digits
    const digit = text.replace(/[^0-9]/g, "");
    
    if (digit.length === 0) {
      // Handle backspace
      const newValue = value.substring(0, index) + value.substring(index + 1);
      onChange(newValue);
      
      // Move to previous input
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else {
      // Update value
      const newValue = value.substring(0, index) + digit[0] + value.substring(index + 1);
      onChange(newValue);
      
      // Move to next input
      if (index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <View>
      <View className="flex-row justify-between mb-2">
        {Array.from({ length }).map((_, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              if (ref) inputRefs.current[index] = ref;
            }}
            className={`w-12 h-14 border-2 rounded-xl text-center text-2xl font-JakartaBold ${
              focusedIndex === index
                ? "border-primary-500"
                : error
                ? "border-red-500"
                : "border-gray-300"
            } bg-white`}
            keyboardType="number-pad"
            maxLength={1}
            value={value[index] || ""}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            onFocus={() => setFocusedIndex(index)}
            onBlur={() => setFocusedIndex(null)}
            selectTextOnFocus
            accessibilityLabel={`Digit ${index + 1} of ${length}`}
          />
        ))}
      </View>
      {error ? (
        <Text className="text-red-500 text-sm mt-2">{error}</Text>
      ) : null}
    </View>
  );
};

export default OTPInput;
