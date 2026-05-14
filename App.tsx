/**
 * App.tsx - COM CABEÇALHO PERSONALIZADO APENAS NA HOME
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator, DrawerContentComponentProps } from '@react-navigation/drawer';
import { StatusBar, Text, Image, StyleSheet, View, TouchableOpacity } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import ConsultoresScreen from './src/screens/ConsultoresScreen';
import CustomDrawerContent from './src/components/CustomDrawerContent';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { RootDrawerParamList } from './src/types/navigation';

const Drawer = createDrawerNavigator<RootDrawerParamList>();

// Componente do cabeçalho personalizado APENAS PARA A HOME
function CustomHeader({ navigation }: any) {
  return (
    <View style={styles.customHeader}>
      <TouchableOpacity 
        onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        style={styles.menuButton}
        activeOpacity={0.7}
      >
        <Text style={styles.menuIcon}>☰</Text>
      </TouchableOpacity>
      
      <View style={styles.logoContainer}>
        <Image 
          source={require('./assets/logo_facilite.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      
      <TouchableOpacity 
        style={styles.notificationButton}
        activeOpacity={0.7}
      >
        <Text style={styles.notificationIcon}>🔔</Text>
      </TouchableOpacity>
    </View>
  );
}

// Componente de cabeçalho padrão para outras telas (sem menu e sem sino)
function DefaultHeader({ navigation, back }: any) {
  return (
    <View style={styles.defaultHeader}>
      {back ? (
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.backButtonPlaceholder} />
      )}
      <Text style={styles.defaultHeaderTitle}>FACILITE</Text>
      <View style={styles.backButtonPlaceholder} />
    </View>
  );
}

export default function App() {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FC" />
      <NavigationContainer>
        <Drawer.Navigator
          drawerContent={(props: DrawerContentComponentProps) => <CustomDrawerContent {...props} />}
          screenOptions={{
            drawerStyle: { width: 280, backgroundColor: '#F8F9FC' },
            drawerLabelStyle: { fontSize: 16, color: '#1A1A1A' },
            drawerActiveTintColor: '#2463EB',
            drawerInactiveTintColor: '#6C757D',
            headerShown: true,
          }}
        >
          <Drawer.Screen
            name="Home"
            component={HomeScreen}
            options={{
              title: 'FACILITE',
              drawerLabel: 'Início',
              header: (props: any) => <CustomHeader {...props} />, // Cabeçalho personalizado APENAS para Home
            }}
          />
          <Drawer.Screen
            name="Consultores"
            component={ConsultoresScreen}
            options={{
              drawerLabel: 'Consultores',
              headerShown: false, // Remove o cabeçalho padrão do Drawer
            }}
          />
        </Drawer.Navigator>
      </NavigationContainer>
    </>
  );
}

const styles = StyleSheet.create({
  // Estilos do cabeçalho personalizado (APENAS PARA HOME)
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    height: 140,
    backgroundColor: '#F8F9FC',
  },
  menuButton: { 
    padding: 8,
    width: 50,
    alignSelf: 'flex-start',
  },
  menuIcon: { 
    fontSize: 26,
    color: '#1A1A1A',
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 140,
  },
  logo: { 
    width: 120,
    height: 140,
    resizeMode: 'contain',
  },
  notificationButton: { 
    padding: 8,
    width: 50,
    alignItems: 'flex-end',
    alignSelf: 'flex-start',
  },
  notificationIcon: { 
    fontSize: 24,
    color: '#6C757D',
  },
  // Estilos do cabeçalho padrão (para outras telas)
  defaultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#F8F9FC',
  },
  backButton: {
    padding: 8,
    width: 44,
  },
  backIcon: {
    fontSize: 28,
    color: '#2463EB',
  },
  backButtonPlaceholder: {
    width: 44,
  },
  defaultHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
});