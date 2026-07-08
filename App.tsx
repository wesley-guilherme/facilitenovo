/**
 * App.tsx - COM CABEÇALHO PERSONALIZADO APENAS NA HOME
 */

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator, DrawerContentComponentProps } from '@react-navigation/drawer';
import { StatusBar, Text, Image, StyleSheet, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { initDatabase } from './src/database/initDatabase';
import HomeScreen from './src/screens/HomeScreen';
import MeuPerfilScreen from './src/screens/MeuPerfilScreen';
import EditarConsultorScreen from './src/screens/EditarConsultorScreen';
import EmpresasScreen from './src/screens/EmpresasScreen';
import CadastroEmpresaScreen from './src/screens/CadastroEmpresaScreen';
import EditarEmpresaScreen from './src/screens/EditarEmpresaScreen';
import VisitasScreen from './src/screens/VisitasScreen';
import FormularioVisitaScreen from './src/screens/FormularioVisitaScreen';
import RelatoriosScreen from './src/screens/RelatoriosScreen';
import TextosPredefinidosScreen from './src/screens/TextosPredefinidosScreen';
import CustomDrawerContent from './src/components/CustomDrawerContent';
import { ConsultorProvider } from './src/contexts/ConsultorContext';
import { EmpresaProvider } from './src/contexts/EmpresaContext';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { RootDrawerParamList } from './src/types/navigation';
import EmpresaConsultorScreen from './src/screens/EmpresaConsultorScreen';
import ConfiguracoesScreen from './src/screens/ConfiguracoesScreen';
import FaleConoscoScreen from './src/screens/FaleConoscoScreen';

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

export default function App() {
  const [dbReady, setDbReady] = useState(false);

  // Inicializar banco de dados
  useEffect(() => {
    initDatabase()
      .catch(console.error)
      .finally(() => setDbReady(true));
  }, []);

  if (!dbReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2463EB" />
      </View>
    );
  }

  return (
    <ConsultorProvider>
      <EmpresaProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#F8F9FC" />
        <NavigationContainer>
          <Drawer.Navigator
            drawerContent={(props: DrawerContentComponentProps) => <CustomDrawerContent {...props} />}
            screenOptions={{
              drawerStyle: { width: 280, backgroundColor: '#F8F9FC' },
              drawerLabelStyle: { fontSize: 16, color: '#1A1A1A' },
              drawerActiveTintColor: '#2463EB',
              drawerInactiveTintColor: '#6C757D',
              headerShown: false, // Desabilita cabeçalho global
            }}
          >
            <Drawer.Screen
              name="Home"
              component={HomeScreen}
              options={{
                title: 'FACILITE',
                drawerLabel: 'Início',
                header: (props: any) => <CustomHeader {...props} />,
                headerShown: true, // Só a Home tem cabeçalho personalizado
              }}
            />
            <Drawer.Screen
              name="MeuPerfil"
              component={MeuPerfilScreen}
              options={{
                drawerLabel: 'Meu Perfil',
                headerShown: false,
              }}
            />
            <Drawer.Screen
              name="EditarConsultor"
              component={EditarConsultorScreen}
              options={{
                drawerLabel: 'Editar Perfil',
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
            <Drawer.Screen
              name="Relatorios"
              component={RelatoriosScreen}
              options={{
                drawerLabel: 'Relatórios',
                headerShown: false,
              }}
            />
            <Drawer.Screen
              name="TextosPredefinidos"
              component={TextosPredefinidosScreen}
              options={{
                drawerLabel: 'Textos Predefinidos',
                headerShown: false,
              }}
            />
            <Drawer.Screen
              name="EmpresaConsultor"
              component={EmpresaConsultorScreen}
              options={{
                drawerLabel: 'Minha Empresa',
                headerShown: false,
              }}
            />
            <Drawer.Screen
              name="Configuracoes"
              component={ConfiguracoesScreen}
              options={{
                drawerLabel: 'Configurações',
                headerShown: false,
              }}
            />
            <Drawer.Screen
              name="FaleConosco"
              component={FaleConoscoScreen}
              options={{
                drawerLabel: 'Fale Conosco',
                headerShown: false,
              }}
            />
            <Drawer.Screen
              name="Visitas"
              component={VisitasScreen}
              options={{
                drawerLabel: 'Visitas',
                headerShown: false,
              }}
            />
            <Drawer.Screen
              name="FormularioVisita"
              component={FormularioVisitaScreen}
              options={{
                drawerLabel: 'Nova Visita',
                headerShown: false,
              }}
            />
          </Drawer.Navigator>
        </NavigationContainer>
      </EmpresaProvider>
    </ConsultorProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FC',
  },
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
});
