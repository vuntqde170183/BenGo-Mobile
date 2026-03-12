import { icons } from "@/constants";
import { Tabs } from "expo-router";
import { Image, ImageSourcePropType, View, Text } from "react-native";

const TabIcon = ({ source, focused }: { source: ImageSourcePropType; focused: boolean }) => (
  <View className="items-center justify-center">
    <Image
      source={source}
      tintColor={focused ? "#22C55E" : "#94a3b8"}
      resizeMode="contain"
      className="w-6 h-6"
    />
  </View>
);

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
        height: 70,
        position: "absolute",
        borderTopWidth: 1,
        borderTopColor: "#F3F4F6",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        paddingTop: 10,
      },
    }}
  >
    <Tabs.Screen
      name="home"
      options={{
        title: "Trang chủ",
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <TabIcon focused={focused} source={icons.home} />
        ),
      }}
    />
    <Tabs.Screen
      name="history"
      options={{
        title: "Lịch sử",
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <TabIcon focused={focused} source={icons.list} />
        ),
      }}
    />
  </Tabs>
);

export default Layout;
