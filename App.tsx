/**
 * App.tsx - COM CABEÇALHO PERSONALIZADO APENAS NA HOME
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator, DrawerContentComponentProps } from '@react-navigation/drawer';
import { StatusBar, Text, Image, StyleSheet, View, TouchableOpacity } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import ConsultoresScreen from './src/screens/ConsultoresScreen';
import CadastroConsultorScreen from './src/screens/CadastroConsultorScreen';
import EditarConsultorScreen from './src/screens/EditarConsultorScreen';
import EmpresasScreen from './src/screens/EmpresasScreen';
import CadastroEmpresaScreen from './src/screens/CadastroEmpresaScreen';
import EditarEmpresaScreen from './src/screens/EditarEmpresaScreen';
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

// Cabeçalho padrão para outras telas (sem menu hambúrguer)
function DefaultHeader() {
  return (
    <View style={styles.defaultHeader}>
      <View style={styles.placeholderLeft} />
      <Text style={styles.defaultHeaderTitle}>FACILITE</Text>
      <View style={styles.placeholderRight} />
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
          }}
        >
          <Drawer.Screen
            name="Home"
            component={HomeScreen}
            options={{
              title: 'FACILITE',
              drawerLabel: 'Início',
              header: (props: any) => <CustomHeader {...props} />,
              headerShown: true,
            }}
          />
          <Drawer.Screen
            name="Consultores"
            component={ConsultoresScreen}
            options={{
              drawerLabel: 'Consultores',
              headerShown: false,
            }}
          />
          <Drawer.Screen
            name="CadastroConsultor"
            component={CadastroConsultorScreen}
            options={{
              drawerLabel: 'Cadastro Consultor',
              headerShown: false,
            }}
          />
          <Drawer.Screen
            name="EditarConsultor"
            component={EditarConsultorScreen}
            options={{
              drawerLabel: 'Editar Consultor',
              headerShown: false,
            }}
          />
          <Drawer.Screen
            name="Empresas"
            component={EmpresasScreen}
            options={{
              drawerLabel: 'Empresas',
              headerShown: false,
            }}
          />
          <Drawer.Screen
            name="CadastroEmpresa"
            component={CadastroEmpresaScreen}
            options={{
              drawerLabel: 'Cadastro Empresa',
              headerShown: false,
            }}
          />
          <Drawer.Screen
            name="EditarEmpresa"
            component={EditarEmpresaScreen}
            options={{
              drawerLabel: 'Editar Empresa',
              headerShown: false,
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
  placeholderLeft: {
    width: 44,
  },
  defaultHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  placeholderRight: {
    width: 44,
  },
});