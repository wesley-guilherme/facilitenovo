/**
 * COMPONENTE: CustomDrawerContent
 * 
 * FUNÇÃO:
 * Este componente personaliza o menu lateral (drawer) que aparece quando o usuário
 * clica no ícone de hambúrguer (☰) no canto superior esquerdo da tela.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DrawerContentScrollView, DrawerNavigationProp } from '@react-navigation/drawer';
import { useConsultor } from '../contexts/ConsultorContext';
import { useEmpresa } from '../contexts/EmpresaContext';
import { useNavigation } from '@react-navigation/native';
import { RootDrawerParamList } from '../types/navigation';

type CustomDrawerContentProps = {
  navigation: DrawerNavigationProp<RootDrawerParamList>;
  state: any;
  descriptors: any;
};

export default function CustomDrawerContent(props: any) {
  const { consultor } = useConsultor();
  const { empresa } = useEmpresa();
  const navigation = useNavigation<DrawerNavigationProp<RootDrawerParamList>>();

  // Função para navegar para a tela da empresa
  const handleEmpresaPress = () => {
    navigation.navigate('EmpresaConsultor');
    props.navigation.closeDrawer(); // Fecha o drawer após navegar
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ======================================== */}
      {/* SEÇÃO 1: PERFIL DO CONSULTOR (CABEÇALHO) */}
      {/* ======================================== */}
      <View style={styles.profileContainer}>
        {/* Avatar / Foto do perfil */}
        <View style={styles.avatarPlaceholder}>
          {consultor.foto ? (
            <Image source={{ uri: consultor.foto }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>👤</Text>
          )}
        </View>
        
        {/* Nome do consultor logado */}
        <Text style={styles.nomeConsultor}>{consultor.nome}</Text>
        
        {/* E-mail do consultor */}
        <Text style={styles.emailConsultor}>{consultor.email}</Text>
        
        {/* Container da empresa - CLICÁVEL (sem ícone de edição) */}
        <TouchableOpacity 
          style={styles.empresaContainer}
          onPress={handleEmpresaPress}
          activeOpacity={0.7}
        >
          <Text style={styles.empresaIcon}>🏢</Text>
          <Text style={styles.empresaTexto}>{empresa.nome}</Text>
        </TouchableOpacity>
      </View>

      {/* Linha divisória */}
      <View style={styles.divider} />

      {/* ======================================== */}
      {/* SEÇÃO 2: ITENS DE NAVEGAÇÃO PRINCIPAIS */}
      {/* ======================================== */}
      <DrawerContentScrollView 
        {...props} 
        contentContainerStyle={styles.drawerContent} 
      />

      {/* ======================================== */}
      {/* SEÇÃO 3: RODAPÉ (CONFIGURAÇÕES, COPYRIGHT) */}
      {/* ======================================== */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.footerItem}
           onPress={() => {
             navigation.navigate('Configuracoes')
             props.navigation.closeDrawer();
            }}
        >
          <Text style={styles.footerIcon}>⚙️</Text>
          <Text style={styles.footerText}>Configurações</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.footerItem}
          onPress={() => {
            navigation.navigate('FaleConosco');
            props.navigation.closeDrawer();
          }}
        >
          <Text style={styles.footerIcon}>💬</Text>
          <Text style={styles.footerText}>Fale Conosco</Text>
        </TouchableOpacity>
        
        <View style={styles.copyrightContainer}>
          <Text style={styles.copyrightText}>Criado por: Wesley Guilherme</Text>
          <Text style={styles.copyrightText}>© Copyright 2026</Text>
          <Text style={styles.versionText}>Versão 1.0.0</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FC',
  },
  profileContainer: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2463EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 80,
    height: 80,
  },
  avatarText: {
    fontSize: 40,
  },
  nomeConsultor: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
    textAlign: 'center',
  },
  emailConsultor: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 12,
    textAlign: 'center',
  },
  empresaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  empresaIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  empresaTexto: {
    fontSize: 12,
    color: '#4A4A4A',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E9ECEF',
    marginHorizontal: 16,
    marginVertical: 8,
  },
  drawerContent: {
    paddingHorizontal: 16,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    marginTop: 20,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  footerIcon: {
    fontSize: 20,
    marginRight: 12,
    color: '#6C757D',
  },
  footerText: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  copyrightContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  copyrightText: {
    fontSize: 11,
    color: '#ADB5BD',
    textAlign: 'center',
  },
  versionText: {
    fontSize: 11,
    color: '#ADB5BD',
    textAlign: 'center',
    marginTop: 4,
  },
});