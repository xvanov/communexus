import { Redirect } from "expo-router";
import { useAuth } from "@/utils/auth/useAuth";
import { View, Text, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Index() {
  const { isReady, isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();

  if (!isReady) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#007AFF",
          paddingTop: insets.top,
        }}
      >
        <Text
          style={{
            fontSize: 32,
            fontWeight: "bold",
            color: "white",
            marginBottom: 20,
          }}
        >
          Communexus
        </Text>
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)" />;
  }

  return <Redirect href="/(tabs)" />;
}
