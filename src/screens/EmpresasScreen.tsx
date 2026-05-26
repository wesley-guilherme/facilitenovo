/**
 * TELA: EmpresasScreen
 * 
 * FUNÇÃO:
 * Exibe a lista de empresas cadastradas no banco de dados.
 * - Pesquisa automática por código de referência ou nome fantasia
 * - Clique no card → Exibe detalhes (Alert)
 * - Clique na seta (✎) → Abre tela de edição
 * - Botão Voltar no cabeçalho
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  SafeAreaView,
  StatusBar,
  Image,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootDrawerParamList } from '../types/navigation';
import * as SQLite from 'expo-sqlite';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = StatusBar.currentHeight || 0;

type EmpresasScreenNavigationProp = DrawerNavigationProp<RootDrawerParamList, 'Empresas'>;

// Tipo para os dados da empresa
type Empresa = {
  id: string;
  codigoReferencia: string;
  nomeFantasia: string;
  proprietario: string;
  cidade: string;
  endereco: string;
  numero: string;
  email: string;
  contato: string;
  anotacoes: string;
  logo: string | null;
  ativo: number; // 1 = ativo, 0 = inativo
};

export default function EmpresasScreen() {
  const navigation = useNavigation<EmpresasScreenNavigationProp>();
  const db = SQLite.openDatabaseSync('facilite.db');
  
  const [pesquisa, setPesquisa] = useState('');
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar empresas do banco de dados (com tratamento de erro)
  const carregarEmpresas = async () => {
    setLoading(true);
    try {
      let empresasDb: Empresa[] = []; // CORREÇÃO: tipagem explícita
      try {
        const result = await db.getAllAsync('SELECT * FROM empresas ORDER BY nomeFantasia ASC');
        empresasDb = result as Empresa[];
      } catch (tableError) {
        console.log('Tabela empresas não encontrada');
        empresasDb = [];
      }
      setEmpresas(empresasDb);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
      setEmpresas([]);
    } finally {
      setLoading(false);
    }
  };

  // Recarregar quando a tela ganhar foco
  useFocusEffect(
    useCallback(() => {
      carregarEmpresas();
    }, [])
  );

  // Pesquisa automática
  const empresasFiltradas = empresas.filter(empresa =>
    empresa.codigoReferencia?.toLowerCase().includes(pesquisa.toLowerCase()) ||
    empresa.nomeFantasia?.toLowerCase().includes(pesquisa.toLowerCase())
  );

  const handleAddEmpresa = () => {
    navigation.navigate('CadastroEmpresa');
  };

  const handleVoltar = () => {
    navigation.goBack();
  };

  // Detalhes da empresa ao clicar no card
  const handleEmpresaPress = (empresa: Empresa) => {
    const statusText = empresa.ativo === 1 ? '✅ Ativado' : '❌ Desativado';
    
    Alert.alert(
      'Detalhes da Empresa',
      `🏷️ Nome Fantasia: ${empresa.nomeFantasia || 'N/A'}\n` +
      `👤 Proprietário: ${empresa.proprietario || 'N/A'}\n` +
      `📍 Cidade: ${empresa.cidade || 'N/A'}\n` +
      `🏠 Endereço: ${empresa.endereco || 'N/A'}, ${empresa.numero || 'N/A'}\n` +
      `📧 E-mail: ${empresa.email || 'N/A'}\n` +
      `📱 Contato: ${empresa.contato || 'N/A'}\n` +
      `🔢 Código: ${empresa.codigoReferencia || 'N/A'}\n` +
      `📝 Anotações: ${empresa.anotacoes || 'N/A'}\n` +
      `✅ Status: ${statusText}`,
      [{ text: 'OK' }]
    );
  };

  // Navega para edição ao clicar na seta
  const handleEditarPress = (empresa: Empresa) => {
    navigation.navigate('EditarEmpresa', { empresa });
  };

  // Fecha o teclado ao tocar fora
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const renderItem = ({ item }: { item: Empresa }) => (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardContent}
        onPress={() => handleEmpresaPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardLogoContainer}>
          {item.logo ? (
            <Image source={{ uri: item.logo }} style={styles.cardLogo} />
          ) : (
            <View style={styles.cardLogoPlaceholder}>
              <Text style={styles.cardLogoPlaceholderText}>🏢</Text>
            </View>
          )}
        </View>
        
        <View style={styles.cardInfo}>
          <Text style={styles.cardCodigo}>🔢 {item.codigoReferencia}</Text>
          <Text style={styles.cardNome}>{item.nomeFantasia}</Text>
          <View style={styles.cardContatoContainer}>
            <Text style={styles.cardContatoIcon}>📱</Text>
            <Text style={styles.cardContato}>{item.contato}</Text>
          </View>
          <View style={styles.cardCidadeContainer}>
            <Text style={styles.cardCidadeIcon}>📍</Text>
            <Text style={styles.cardCidade}>{item.cidade}</Text>
          </View>
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.cardArrowButton}
        onPress={() => handleEditarPress(item)}
        activeOpacity={0.7}
      >
        <Text style={styles.cardArrow}>✎</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FC" />
      
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <View style={styles.flexContainer}>
            {/* Cabeçalho com botão Voltar */}
            <View style={[styles.header, { paddingTop: STATUS_BAR_HEIGHT + 8 }]}>
              <TouchableOpacity onPress={handleVoltar} style={styles.backButton}>
                <Text style={styles.backIcon}>←</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Empresas</Text>
              <View style={styles.placeholderRight} />
            </View>

            {/* Barra de Pesquisa */}
            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <Text style={styles.searchIconLeft}>🔍</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Pesquisar por código ou nome fantasia..."
                  placeholderTextColor="#ADB5BD"
                  value={pesquisa}
                  onChangeText={setPesquisa}
                  returnKeyType="done"
                  onSubmitEditing={dismissKeyboard}
                />
              </View>
            </View>

            {/* Lista de Empresas */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2463EB" />
                <Text style={styles.loadingText}>Carregando empresas...</Text>
              </View>
            ) : empresasFiltradas.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🏢</Text>
                <Text style={styles.emptyText}>Nenhuma empresa cadastrada</Text>
                <Text style={styles.emptySubtext}>
                  Toque no botão + para adicionar
                </Text>
              </View>
            ) : (
              <FlatList
                data={empresasFiltradas}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              />
            )}
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* FAB (Botão flutuante +) */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleAddEmpresa}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FC',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  flexContainer: {
    flex: 1,
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
    fontSize: 32,
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F9FC',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    paddingHorizontal: 12,
  },
  searchIconLeft: {
    fontSize: 18,
    color: '#ADB5BD',
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1A1A',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    overflow: 'hidden',
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    padding: 12,
  },
  cardLogoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F8F9FC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  cardLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  cardLogoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardLogoPlaceholderText: {
    fontSize: 28,
  },
  cardInfo: {
    flex: 1,
  },
  cardCodigo: {
    fontSize: 12,
    color: '#6C757D',
    marginBottom: 4,
  },
  cardNome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  cardContatoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  cardContatoIcon: {
    fontSize: 12,
    marginRight: 4,
    color: '#ADB5BD',
  },
  cardContato: {
    fontSize: 12,
    color: '#4A4A4A',
  },
  cardCidadeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardCidadeIcon: {
    fontSize: 12,
    marginRight: 4,
    color: '#ADB5BD',
  },
  cardCidade: {
    fontSize: 12,
    color: '#4A4A4A',
  },
  cardArrowButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FC',
    borderLeftWidth: 1,
    borderLeftColor: '#E9ECEF',
  },
  cardArrow: {
    fontSize: 20,
    color: '#2463EB',
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 48,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2463EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  fabIcon: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6C757D',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#6C757D',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 24,
    textAlign: 'center',
  },
});