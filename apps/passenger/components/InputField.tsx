import { useState } from "react";
import {
    Image,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { icons } from "@/constants";
import { COLORS } from "@/constants/theme";
import { InputFieldProps } from "@/types/type";

const InputField = ({
  label,
  icon,
  secureTextEntry = false,
  labelStyle,
  containerStyle,
  inputStyle,
  iconStyle,
  className,
  error,
  success,
  ...props
}: InputFieldProps & { error?: string; success?: boolean }) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isPassword = secureTextEntry;
  const showPasswordToggle = isPassword;

  const getBorderColor = () => {
    if (error) return 'border-danger-500';
    if (success) return 'border-primary-500';
    if (isFocused) return 'border-primary-500';
    return 'border-neutral-200';
  };

  return (
    <View className={`my-2 w-full relative ${className ?? ''}`}>
      <View
        className={`flex flex-row justify-start items-center relative bg-white rounded-xl border-2 ${getBorderColor()} ${containerStyle}`}
      >
        {icon && (
          <Image
            source={icon}
            className={`w-5 h-5 ml-4 ${iconStyle}`}
            resizeMode="contain"
            style={{ tintColor: error ? COLORS.danger : isFocused ? COLORS.primary : COLORS.neutral400 }}
          />
        )}
        <TextInput
          className={`rounded-xl py-4 px-4 font-JakartaRegular text-base flex-1 ${inputStyle} text-left text-neutral-900`}
          secureTextEntry={isPassword && !isPasswordVisible}
          placeholderTextColor={COLORS.neutral400}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {showPasswordToggle && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            className="px-4 py-2"
            activeOpacity={0.7}
          >
            <Text className="text-primary-500 font-JakartaSemiBold text-sm">
              {isPasswordVisible ? 'Hide' : 'Show'}
            </Text>
          </TouchableOpacity>
        )}
        {success && !showPasswordToggle && (
          <View className="mr-4">
            <Image source={icons.checkmark} className="w-5 h-5" tintColor={COLORS.primary} resizeMode="contain" />
          </View>
        )}
      </View>
      {label && (
        <Text className={`absolute -top-3 left-4 bg-white px-1 text-sm font-JakartaMedium ${error ? 'text-danger-500' : success ? 'text-primary-500' : 'text-neutral-600'} z-10 ${labelStyle}`}>
          {label}
        </Text>
      )}
    </View>
  );
};

export default InputField;
