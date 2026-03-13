import { Stack } from "expo-router";

const Layout = () => {
  return (
    <Stack>
      <Stack.Screen name="tabs" options={{ headerShown: false }} />
      <Stack.Screen name="search-destination" options={{ headerShown: false }} />
      <Stack.Screen name="booking-setup" options={{ headerShown: false }} />
      <Stack.Screen name="driver-profile" options={{ headerShown: false }} />
      <Stack.Screen
        name="driver-registration"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="track-order/[id]"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="payment/[id]"
        options={{ headerShown: false }}
      />
    </Stack>
  );
};

export default Layout;
