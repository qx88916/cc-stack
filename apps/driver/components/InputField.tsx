import {
  TextInput,
  View,
  Text,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from "react-native";

import { InputFieldProps } from "@/types/type";

const InputField = ({
  label,
  secureTextEntry = false,
  labelStyle,
  containerStyle,
  inputStyle,
  className,
  ...props
}: InputFieldProps) => {
  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="my-2 w-full">
          <Text className={`text-base font-bold mb-2 text-neutral-700 ${labelStyle ?? ""}`}>
            {label}
          </Text>
          <View
            className={`flex flex-row justify-start items-center bg-neutral-100 rounded-xl border border-neutral-200 focus:border-amber-500 ${containerStyle ?? ""}`}
          >
            <TextInput
              className={`p-4 text-[15px] flex-1 text-left text-neutral-900 ${inputStyle ?? ""} ${className ?? ""}`}
              secureTextEntry={secureTextEntry}
              {...props}
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default InputField;
