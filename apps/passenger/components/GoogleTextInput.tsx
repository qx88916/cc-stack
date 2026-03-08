import { useState } from "react";
import { Image, Text, View } from "react-native";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";

import { icons } from "@/constants";
import { GoogleInputProps } from "@/types/type";

const googlePlacesApiKey = process.env.EXPO_PUBLIC_PLACES_API_KEY;

const GoogleTextInput = ({
  icon,
  initialLocation,
  containerStyle,
  textInputBackgroundColor,
  handlePress,
}: GoogleInputProps) => {
  const [error, setError] = useState<string | null>(null);

  // Check if API key is configured
  if (!googlePlacesApiKey) {
    return (
      <View
        className={`flex flex-row items-center justify-center relative z-50 rounded-xl ${containerStyle} bg-red-50 p-4`}
      >
        <Text className="text-red-600 font-JakartaMedium text-sm">
          ⚠️ Google Places API key not configured. Please add EXPO_PUBLIC_PLACES_API_KEY to your .env file.
        </Text>
      </View>
    );
  }

  return (
    <View
      className={`flex flex-row items-center justify-center relative z-50 rounded-xl ${containerStyle}`}
    >
      <GooglePlacesAutocomplete
        fetchDetails={true}
        placeholder="Search"
        debounce={200}
        styles={{
          textInputContainer: {
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 20,
            marginHorizontal: 20,
            position: "relative",
            shadowColor: "#d4d4d4",
          },
          textInput: {
            backgroundColor: textInputBackgroundColor
              ? textInputBackgroundColor
              : "white",
            fontSize: 16,
            fontWeight: "600",
            marginTop: 5,
            width: "100%",
            borderRadius: 200,
          },
          listView: {
            backgroundColor: textInputBackgroundColor
              ? textInputBackgroundColor
              : "white",
            position: "relative",
            top: 0,
            width: "100%",
            borderRadius: 10,
            shadowColor: "#d4d4d4",
            zIndex: 99,
          },
        }}
        onPress={(data, details = null) => {
          if (!details?.geometry?.location) {
            setError("Could not get location details");
            return;
          }
          handlePress({
            latitude: details.geometry.location.lat,
            longitude: details.geometry.location.lng,
            address: data.description,
          });
          setError(null);
        }}
        onFail={(error) => {
          console.error("Google Places error:", error);
          setError("Failed to search locations. Please check your API key.");
        }}
        query={{
          key: googlePlacesApiKey,
          language: "en",
        }}
        renderLeftButton={() => (
          <View className="justify-center items-center w-6 h-6">
            <Image
              source={
                icon
                  ? typeof icon === 'string'
                    ? { uri: icon }
                    : icon
                  : icons.search
              }
              className="w-6 h-6"
              resizeMode="contain"
            />
          </View>
        )}
        textInputProps={{
          placeholderTextColor: "gray",
          placeholder: initialLocation ?? "Where do you want to go?",
        }}
      />
      {error && (
        <View className="absolute bottom-[-30] left-0 right-0 px-5">
          <Text className="text-red-500 text-xs font-JakartaMedium">
            {error}
          </Text>
        </View>
      )}
    </View>
  );
};

export default GoogleTextInput;
