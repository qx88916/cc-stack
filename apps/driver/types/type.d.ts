import { TextInputProps, TouchableOpacityProps } from "react-native";

export interface ButtonProps extends TouchableOpacityProps {
  title: string;
  bgVariant?: "primary" | "secondary" | "danger" | "outline" | "success";
  textVariant?: "primary" | "default" | "secondary" | "danger" | "success";
  IconLeft?: React.ComponentType<unknown>;
  IconRight?: React.ComponentType<unknown>;
  className?: string;
}

export interface InputFieldProps extends TextInputProps {
  label: string;
  secureTextEntry?: boolean;
  labelStyle?: string;
  containerStyle?: string;
  inputStyle?: string;
  className?: string;
}
