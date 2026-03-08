import { router } from "expo-router";
import { Alert, Text, View } from "react-native";

import CustomButton from "@/components/CustomButton";
import GoogleTextInput from "@/components/GoogleTextInput";
import RideLayout from "@/components/RideLayout";
import { icons } from "@/constants";
import { useLocationStore } from "@/store/locationStore";

const FindRide = () => {
  const {
    userLocation,
    destinationLocation,
    setUserLocation,
    setDestinationLocation,
  } = useLocationStore();

  const handleFindNow = () => {
    if (!userLocation) {
      Alert.alert("Pickup Required", "Please select a pickup location.");
      return;
    }
    if (!destinationLocation) {
      Alert.alert("Destination Required", "Please select a destination.");
      return;
    }
    router.push("/(root)/confirm-ride");
  };

  return (
    <RideLayout title="Find a Ride" snapPoints={["85%"]}>
      <View className="my-3">
        <Text className="text-lg font-JakartaSemiBold mb-3">From</Text>

        <GoogleTextInput
          icon={icons.target}
          initialLocation={userLocation?.address || ""}
          containerStyle="bg-neutral-100"
          textInputBackgroundColor="#f5f5f5"
          handlePress={(location) => setUserLocation(location)}
        />
      </View>

      <View className="my-3">
        <Text className="text-lg font-JakartaSemiBold mb-3">To</Text>

        <GoogleTextInput
          icon={icons.map}
          initialLocation={destinationLocation?.address || ""}
          containerStyle="bg-neutral-100"
          textInputBackgroundColor="transparent"
          handlePress={(location) => setDestinationLocation(location)}
        />
      </View>

      <CustomButton
        title="Find Now"
        onPress={handleFindNow}
        className="mt-5"
        disabled={!userLocation || !destinationLocation}
      />
    </RideLayout>
  );
};

export default FindRide;
