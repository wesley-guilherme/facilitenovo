import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { StatusBar, Text } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import CustomDrawerContent from './src/components/CustomDrawerContent';

const Drawer = createDrawerNavigator();

export default function App() {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FC" />
      <NavigationContainer>
        <Drawer.Navigator
         drawerContent={(props) => <CustomDrawerContent {...props} />}
          screenOptions={{
            drawerStyle: { width: 280, backgroundColor: '#F8F9FC' },
            drawerLabelStyle: { fontSize: 16, color: '#1A1A1A' },
            drawerActiveTintColor: '#2463EB',
            drawerInactiveTintColor: '#6C757D',
            headerShown: false,
          }}
        >
          <Drawer.Screen
            name="Home"
            component={HomeScreen}
            options={{
              title: 'FACILITE',
              drawerLabel: 'Início',
         //     drawerIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🏠</Text>,
            }}
          />
       </Drawer.Navigator>
      </NavigationContainer>
    </>
  );
}