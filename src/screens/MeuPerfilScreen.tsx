/**
 * TELA: MeuPerfilScreen
 * 
 * FUNÇÃO:
 * Exibe os dados do perfil do consultor (único usuário do app).
 * - Permite visualizar todas as informações
 * - Clique no botão Editar → Abre tela de edição
 * - Botão Voltar → Retorna para tela inicial
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
  Image,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootDrawerParamList } from '../types/navigation';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = StatusBar.currentHeight || 0;

type MeuPerfilScreenNavigationProp = DrawerNavigationProp<RootDrawerParamList, 'MeuPerfil'>;

// Dados do consultor logado (único usuário)
const CONSULTOR_LOGADO = {
  id: '1',
  nome: 'João Silva',
  email: 'joao.silva@email.com',
  telefone: '(11) 99999-1111',
  empresa: 'Tech Solutions',
  rota: 'Rota Sul',
  foto: null,
  ativo: true,
};

export default function MeuPerfilScreen() {
  const navigation = useNavigation<MeuPerfilScreenNavigationProp>();
  const [consultor, setConsultor] = useState(CONSULTOR_LOGADO);

  const handleEditarPerfil = () => {
    navigation.navigate('EditarConsultor', { consultor });
  };

  const handleVoltar = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FC" />
      
      {/* Cabeçalho com botão voltar (igual ao CadastroEmpresaScreen) */}
      <View style={[styles.header, { paddingTop: STATUS_BAR_HEIGHT + 8 }]}>
        <TouchableOpacity onPress={handleVoltar} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meu Perfil</Text>
        <View style={styles.placeholderRight} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Seção da Foto */}
        <View style={styles.fotoSection}>
          <View style={styles.fotoContainer}>
            {consultor.foto ? (
              <Image source={{ uri: consultor.foto }} style={styles.foto} />
            ) : (
              <View style={styles.fotoPlaceholder}>
                <Text style={styles.fotoPlaceholderIcon}>👤</Text>
                <Text style={styles.fotoPlaceholderText}>Sua Foto</Text>
              </View>
            )}
          </View>
        </View>

        {/* Informações do Perfil */}
        <View style={styles.infoContainer}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>📛 Nome Completo</Text>
            <Text style={styles.infoValue}>{consultor.nome}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>📧 E-mail</Text>
            <Text style={styles.infoValue}>{consultor.email}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>📱 WhatsApp</Text>
            <Text style={styles.infoValue}>{consultor.telefone}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>🏢 Empresa</Text>
            <Text style={styles.infoValue}>{consultor.empresa}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>🗺️ Rota</Text>
            <Text style={styles.infoValue}>{consultor.rota}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>✅ Status</Text>
            <Text style={[styles.infoValue, consultor.ativo ? styles.statusAtivo : styles.statusInativo]}>
              {consultor.ativo ? 'Ativo' : 'Inativo'}
            </Text>
          </View>
        </View>

        {/* Botão Editar Perfil */}
        <TouchableOpacity
          style={styles.editButton}
          onPress={handleEditarPerfil}
          activeOpacity={0.8}
        >
          <Text style={styles.editButtonText}>✎ Editar Perfil</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#F8F9FC',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  backButton: {
    padding: 8,
    width: 44,
  },
  backIcon: {
    fontSize: 30,
    color: '#1A1A1A',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  placeholderRight: {
    width: 44,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  fotoSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  fotoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  foto: {
    width: '100%',
    height: '100%',
  },
  fotoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F4FF',
  },
  fotoPlaceholderIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  fotoPlaceholderText: {
    fontSize: 12,
    color: '#6C757D',
  },
  infoContainer: {
    paddingHorizontal: 16,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  infoLabel: {
    fontSize: 12,
    color: '#6C757D',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  statusAtivo: {
    color: '#34C759',
  },
  statusInativo: {
    color: '#FF3B30',
  },
  editButton: {
    backgroundColor: '#2463EB',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 24,
    marginHorizontal: 16,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  editButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});