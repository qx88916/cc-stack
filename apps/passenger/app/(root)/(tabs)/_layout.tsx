import { Tabs } from "expo-router";
import { Image, ImageSourcePropType, View, Platform } from "react-native";

import { icons } from "@/constants";
import { COLORS, SHADOW_LG } from "@/constants/theme";

const TabIcon = ({
  source,
  focused,
}: {
  source: ImageSourcePropType;
  focused: boolean;
}) => (
  <View className="items-center justify-center pt-2">
    <View
      className={`rounded-full w-11 h-11 items-center justify-center ${
        focused ? "bg-primary-100" : ""
      }`}
    >
      <Image
        source={source}
        tintColor={focused ? COLORS.primary : COLORS.neutral400}
        resizeMode="contain"
        className="w-6 h-6"
      />
    </View>
  </View>
);

export default function Layout() {
  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.neutral400,
        tabBarLabelStyle: {
          fontFamily: "Jakarta-SemiBold",
          fontSize: 11,
          marginTop: -2,
          marginBottom: Platform.OS === "ios" ? 0 : 8,
        },
        tabBarStyle: {
          position: "absolute",
          bottom: Platform.OS === "ios" ? 24 : 12,
          left: 16,
          right: 16,
          backgroundColor: "#fff",
          borderRadius: 24,
          height: Platform.OS === "ios" ? 72 : 68,
          borderTopWidth: 0,
          ...SHADOW_LG,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon source={icons.home} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="rides"
        options={{
          title: "Rides",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon source={icons.list} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon source={icons.profile} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
