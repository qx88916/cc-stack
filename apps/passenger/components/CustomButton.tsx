import { Text, TouchableOpacity } from "react-native";

import { ButtonProps } from "@/types/type";

const getBgVariantStyle = (variant: ButtonProps["bgVariant"]) => {
  switch (variant) {
    case "secondary":
      return "bg-secondary-500";
    case "danger":
      return "bg-danger-500";
    case "success":
      return "bg-primary-500";
    case "outline":
      return "bg-transparent border-neutral-300 border-2";
    default:
      return "bg-primary-500";
  }
};

const getTextVariantStyle = (variant: ButtonProps["textVariant"]) => {
  switch (variant) {
    case "primary":
      return "text-neutral-900";
    case "secondary":
      return "text-neutral-100";
    case "danger":
      return "text-danger-100";
    case "success":
      return "text-primary-100";
    default:
      return "text-white";
  }
};

const CustomButton = ({
  onPress,
  title,
  bgVariant = "primary",
  textVariant = "default",
  IconLeft,
  IconRight,
  className,
  ...props
}: ButtonProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`w-full rounded-2xl py-4 px-6 flex flex-row justify-center items-center ${getBgVariantStyle(bgVariant)} ${className}`}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!props.disabled }}
      {...props}
    >
      {IconLeft && <IconLeft />}
      <Text className={`text-base font-JakartaBold ${getTextVariantStyle(textVariant)}`}>
        {title}
      </Text>
      {IconRight && <IconRight />}
    </TouchableOpacity>
  );
};

export default CustomButton;
