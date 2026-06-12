// App.tsx — ENTRY POINT. Only providers + navigation here. No business logic (CLAUDE.md Rule #10).
import React from 'react';
import { Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppProvider, useAppContext } from './src/hooks/useAppContext';
import { colors } from './src/constants/theme';
import HomeScreen from './src/screens/HomeScreen';
import InsightsScreen from './src/screens/InsightsScreen';
import ImpulseJailScreen from './src/screens/ImpulseJailScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';

const Tab = createBottomTabNavigator();

// Build a tab-bar icon from an emoji; dims when the tab is inactive.
function tabIcon(emoji: string) {
  return ({ focused }: { focused: boolean }) => (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.4 }}>{emoji}</Text>
  );
}

// The 4 main bottom tabs shown after onboarding.
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.rose,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.cardBg, borderTopColor: colors.border, height: 64, paddingBottom: 8, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: tabIcon('🏠') }} />
      <Tab.Screen name="Insights" component={InsightsScreen} options={{ tabBarIcon: tabIcon('✿') }} />
      <Tab.Screen name="Jail" component={ImpulseJailScreen} options={{ tabBarIcon: tabIcon('🔒') }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarIcon: tabIcon('🎀') }} />
    </Tab.Navigator>
  );
}

// Picks the first screen: onboarding on first launch, otherwise the main tabs.
function RootNavigator() {
  const { onboarded, loading } = useAppContext();
  if (loading) return null; // brief blank while storage loads; a splash can go here later
  return onboarded ? <MainTabs /> : <OnboardingScreen />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
        <StatusBar style="dark" />
      </AppProvider>
    </SafeAreaProvider>
  );
}
