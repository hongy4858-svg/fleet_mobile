import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/contexts/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top', 'bottom']}>
        <StatusBar style="dark" />
        <AuthProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </AuthProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
