import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DriverHistory = () => {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center items-center">
        <Text className="text-2xl font-JakartaBold">Lịch sử (Driver)</Text>
        <Text className="text-gray-500 mt-2">Lịch sử chuyến đi</Text>
      </View>
    </SafeAreaView>
  );
};

export default DriverHistory;
