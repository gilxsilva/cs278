import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { THEMES } from './constants';
import LoginScreen from './screens/Login';
import FeedScreen from './screens/FeedView';
import MapScreen from './screens/MapView';
import AddPinScreen from './screens/AddPin';
import PinDetailScreen from './screens/PinDetail';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs({ user, theme, toggleTheme }) {
  const t = THEMES[theme];
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: t.surface,
          borderTopColor: t.border,
          borderTopWidth: 1,
          height: 84,
          paddingBottom: 24,
          paddingTop: 10,
        },
        tabBarActiveTintColor: t.accent,
        tabBarInactiveTintColor: t.muted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            Feed:  focused ? 'list'     : 'list-outline',
            Map:   focused ? 'map'      : 'map-outline',
          };
          return <Ionicons name={icons[route.name]} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Feed">
        {props => <FeedScreen {...props} user={user} theme={theme} toggleTheme={toggleTheme} />}
      </Tab.Screen>
      <Tab.Screen name="Map">
        {props => <MapScreen {...props} user={user} theme={theme} toggleTheme={toggleTheme} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(undefined);
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u || null));
    return unsub;
  }, []);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');
  const handleGuestLogin = () => setUser({ uid: 'guest', displayName: 'Demo User', photoURL: null });

  if (user === undefined) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashLogo}>spot</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!user ? (
            <Stack.Screen name="Login">
              {props => <LoginScreen {...props} onGuestLogin={handleGuestLogin} />}
            </Stack.Screen>
          ) : (
            <>
              <Stack.Screen name="Main">
                {props => <MainTabs {...props} user={user} theme={theme} toggleTheme={toggleTheme} />}
              </Stack.Screen>
              <Stack.Screen name="AddPin" options={{ animation: 'slide_from_bottom' }}>
                {props => <AddPinScreen {...props} user={user} />}
              </Stack.Screen>
              <Stack.Screen name="PinDetail" options={{ animation: 'slide_from_bottom' }}>
                {props => <PinDetailScreen {...props} user={user} />}
              </Stack.Screen>
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#f5f3ee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogo: {
    fontSize: 52,
    fontWeight: '800',
    color: '#7ab800',
    letterSpacing: -2,
  },
});
