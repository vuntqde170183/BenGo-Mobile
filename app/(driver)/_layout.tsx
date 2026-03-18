import { Stack } from "expo-router";

const Layout = () => {
  return (
    <Stack>
      <Stack.Screen name="tabs" options={{ headerShown: false }} />
      <Stack.Screen name="history/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="documents" options={{ headerShown: false }} />
      <Stack.Screen name="update-verification" options={{ headerShown: false }} />
      <Stack.Screen name="active-trip/[id]" options={{ headerShown: false }} />
    </Stack>
  );
};

export default Layout;
