/**
 * TELA: EmpresasScreen
 * 
 * FUNÇÃO:
 * Exibe a lista de empresas cadastradas.
 * - Pesquisa por código de referência ou nome fantasia
 * - Clique no card → Exibe detalhes (Alert)
 * - Clique na seta (✎) → Abre tela de edição
 */

import React, { useState } from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootDrawerParamList } from '../types/navigation';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = StatusBar.currentHeight || 0;

type EmpresasScreenNavigationProp = DrawerNavigationProp<RootDrawerParamList, 'Empresas'>;

// Tipo para os dados da empresa
type Empresa = {
  id: string;
  codigoReferencia: string;    // Código de referência da empresa
  nomeFantasia: string;         // Nome fantasia
  proprietario: string;         // Proprietário
  cidade: string;               // Cidade
  endereco: string;             // Endereço
  numero: string;               // Número
  email: string;                // E-mail
  contato: string;              // Contato (telefone)
  anotacoes: string;            // Anotações
  logo: string | null;          // Logo da empresa
  ativo: boolean;               // Status ativo/desativado
};

// Dados mockados (exemplo)
const MOCK_EMPRESAS: Empresa[] = [
  {
    id: '1',
    codigoReferencia: 'EMP001',
    nomeFantasia: 'Tech Solutions',
    proprietario: 'João Silva',
    cidade: 'São Paulo',
    endereco: 'Rua das Tecnologias',
    numero: '123',
    email: 'contato@techsolutions.com',
    contato: '(11) 99999-1111',
    anotacoes: 'Empresa especializada em soluções de TI',
    logo: null,
    ativo: true,
  },
  {
    id: '2',
    codigoReferencia: 'EMP002',
    nomeFantasia: 'InovaTech',
    proprietario: 'Maria Oliveira',
    cidade: 'Rio de Janeiro',
    endereco: 'Av. Inovação',
    numero: '456',
    email: 'contato@inovatech.com',
    contato: '(21) 99999-2222',
    anotacoes: 'Startup de tecnologia',
    logo: null,
    ativo: true,
  },
  {
    id: '3',
    codigoReferencia: 'EMP003',
    nomeFantasia: 'DataPro',
    proprietario: 'Carlos Souza',
    cidade: 'Belo Horizonte',
    endereco: 'Rua dos Dados',
    numero: '789',
    email: 'contato@datapro.com',
    contato: '(31) 99999-3333',
    anotacoes: 'Especialistas em análise de dados',
    logo: null,
    ativo: false,
  },
];

export default function EmpresasScreen() {
  const navigation = useNavigation<EmpresasScreenNavigationProp>();
  const [pesquisa, setPesquisa] = useState('');
  const [empresas, setEmpresas] = useState<Empresa[]>(MOCK_EMPRESAS);

  // Pesquisa por código de referência ou nome fantasia
  const empresasFiltradas = empresas.filter(empresa =>
    empresa.codigoReferencia.toLowerCase().includes(pesquisa.toLowerCase()) ||
    empresa.nomeFantasia.toLowerCase().includes(pesquisa.toLowerCase())
  );

  const handleAddEmpresa = () => {
    navigation.navigate('CadastroEmpresa');
  };

  const handleVoltar = () => {
    navigation.goBack();
  };

  const handlePesquisar = () => {
    if (pesquisa.trim() === '') {
      Alert.alert('Pesquisa', 'Digite um código ou nome para pesquisar');
    } else {
      Alert.alert('Pesquisa', `Buscando por: ${pesquisa}`);
    }
    Keyboard.dismiss(); // Fecha o teclado após pesquisar
  };

  // Detalhes da empresa ao clicar no card
  const handleEmpresaPress = (empresa: Empresa) => {
    const statusText = empresa.ativo ? '✅ Ativado' : '❌ Desativado';
    
    Alert.alert(
      'Detalhes da Empresa',
      `🏷️ Nome Fantasia: ${empresa.nomeFantasia}\n` +
      `👤 Proprietário: ${empresa.proprietario}\n` +
      `📍 Cidade: ${empresa.cidade}\n` +
      `🏠 Endereço: ${empresa.endereco}, ${empresa.numero}\n` +
      `📧 E-mail: ${empresa.email}\n` +
      `📱 Contato: ${empresa.contato}\n` +
      `🔢 Código: ${empresa.codigoReferencia}\n` +
      `📝 Anotações: ${empresa.anotacoes}\n` +
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

  // Card com foto, código, nome fantasia, contato e cidade
  const renderItem = ({ item }: { item: Empresa }) => (
    <View style={styles.card}>
      {/* Área do card (clicável para detalhes) */}
      <TouchableOpacity
        style={styles.cardContent}
        onPress={() => handleEmpresaPress(item)}
        activeOpacity={0.7}
      >
        {/* Logo da empresa */}
        <View style={styles.cardLogoContainer}>
          {item.logo ? (
            <Image source={{ uri: item.logo }} style={styles.cardLogo} />
          ) : (
            <View style={styles.cardLogoPlaceholder}>
              <Text style={styles.cardLogoPlaceholderText}>🏢</Text>
            </View>
          )}
        </View>
        
        {/* Informações da empresa */}
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
      
      {/* Botão da seta (clicável para edição) */}
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
            {/* Cabeçalho sem seta de voltar */}
            <View style={[styles.header, { paddingTop: STATUS_BAR_HEIGHT + 8 }]}>
                <View style={styles.placeholderLeft} />
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
                  returnKeyType="search"
                  onSubmitEditing={handlePesquisar}
                />
              </View>
              <TouchableOpacity style={styles.searchButton} onPress={handlePesquisar}>
                <Text style={styles.searchButtonText}>Buscar</Text>
              </TouchableOpacity>
            </View>

            {/* Botão Voltar */}
            <View style={styles.bottomContainer}>
              <TouchableOpacity style={styles.voltarButton} onPress={handleVoltar}>
                <Text style={styles.voltarButtonText}>← Voltar</Text>
              </TouchableOpacity>
            </View>

            {/* Lista de Empresas */}
            {empresasFiltradas.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Nenhuma empresa cadastrada</Text>
                <TouchableOpacity style={styles.emptyButton} onPress={handleAddEmpresa}>
                  <Text style={styles.emptyButtonText}>+ Adicionar Empresa</Text>
                </TouchableOpacity>
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

      {/* FAB (Botão flutuante +) - FORA do KeyboardAvoidingView */}
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
  // Cabeçalho sem seta de voltar
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
  placeholderLeft: {
    width: 44,  // ← ESTILO ADICIONADO
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
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F9FC',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    marginRight: 12,
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
  searchButton: {
    backgroundColor: '#2463EB',
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  voltarButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    alignSelf: 'flex-start',
  },
  voltarButtonText: {
    fontSize: 14,
    color: '#2463EB',
    fontWeight: '500',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  emptyText: {
    fontSize: 16,
    color: '#6C757D',
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: '#2463EB',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});