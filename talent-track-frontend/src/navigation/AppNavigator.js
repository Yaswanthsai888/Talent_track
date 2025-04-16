import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import UserDashboard from '../screens/UserDashboard';

// Import context providers
import { AuthProvider } from '../contexts/AuthContext';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Login"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#4a4a4a',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            options={{ title: 'Sign In' }}
          />
          <Stack.Screen 
            name="Register" 
            component={RegisterScreen} 
            options={{ title: 'Create Account' }}
          />
          <Stack.Screen 
            name="UserDashboard" 
            component={UserDashboard} 
            options={{ title: 'Dashboard' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
};

export default AppNavigator;
