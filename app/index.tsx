import { useAuth } from '@/context/AuthContext';
import { Redirect } from 'expo-router';
import 'react-native-get-random-values';
import "../global.css";
import { View } from 'react-native';

const Home = () => {
  const { token, hasHydrated, user } = useAuth();

  if (!hasHydrated) return <View />;

  if (token) {
    if (user?.role === 'driver') {
        return <Redirect href="/(driver)/tabs/home" />
    }
    return <Redirect href="/(root)/tabs/home" />
  }

  return <Redirect href="/(auth)/welcome" />;
};

export default Home;