import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView className="flex-1 bg-gray-100">
          <View className="flex-1 items-center justify-center px-6">
            <Ionicons name="warning-outline" size={64} color="#f59e0b" />
            <Text className="text-xl font-bold text-neutral-800 mt-4 text-center">
              Something went wrong
            </Text>
            <Text className="text-sm text-neutral-500 mt-2 text-center mb-8">
              {this.state.error?.message ?? "An unexpected error occurred."}
            </Text>
            <TouchableOpacity
              onPress={this.handleReset}
              className="bg-amber-500 px-8 py-3 rounded-full"
            >
              <Text className="text-white font-bold text-base">Try Again</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
