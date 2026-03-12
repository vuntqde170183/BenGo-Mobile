import { Tabs } from "expo-router";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const Layout = () => (
  <Tabs
    screenOptions={{
      tabBarActiveTintColor: "#22C55E",
      tabBarInactiveTintColor: "#94a3b8",
      tabBarShowLabel: true,
      tabBarLabelStyle: {
        fontSize: 12,
        fontFamily: "Jakarta-Medium",
        marginBottom: 5,
      },
      tabBarStyle: {
        backgroundColor: "#ffffff",
        height: 80,
        borderTopWidth: 1,
        borderTopColor: "#F3F4F6",
        paddingTop: 10,
        paddingBottom: 20,
      },
    }}
  >
    <Tabs.Screen
      name="home"
      options={{
        title: "Trang chủ",
        headerShown: false,
        tabBarIcon: ({ focused, color }) => (
          <Ionicons name={focused ? "map" : "map-outline"} size={24} color={color} />
        ),
      }}
    />
    <Tabs.Screen
      name="history"
      options={{
        title: "Hoạt động",
        headerShown: false,
        tabBarIcon: ({ focused, color }) => (
          <Ionicons name={focused ? "list" : "list-outline"} size={26} color={color} />
        ),
      }}
    />
    <Tabs.Screen
      name="earnings"
      options={{
        title: "Thu nhập",
        headerShown: false,
        tabBarIcon: ({ focused, color }) => (
          <Ionicons name={focused ? "wallet" : "wallet-outline"} size={24} color={color} />
        ),
      }}
    />
    <Tabs.Screen
      name="profile"
      options={{
        title: "Tài khoản",
        headerShown: false,
        tabBarIcon: ({ focused, color }) => (
          <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
        ),
      }}
    />
  </Tabs>
);

export default Layout;
