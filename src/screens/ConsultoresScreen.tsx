/**
 * TELA: ConsultoresScreen
 * 
 * FUNÇÃO:
 * Exibe a lista de consultores cadastrados.
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
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootDrawerParamList } from '../types/navigation';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = StatusBar.currentHeight || 0;

type ConsultoresScreenNavigationProp = DrawerNavigationProp<RootDrawerParamList, 'Consultores'>;

type Consultor = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  empresa: string;
  rota: string;
  ativo: boolean;
};

const MOCK_CONSULTORES: Consultor[] = [
  { 
    id: '1', 
    nome: 'João Silva', 
    email: 'joao@email.com', 
    telefone: '(11) 99999-1111', 
    empresa: 'Tech Solutions',
    rota: 'Rota Sul',
    ativo: true
  },
  { 
    id: '2', 
    nome: 'Maria Oliveira', 
    email: 'maria@email.com', 
    telefone: '(11) 99999-2222', 
    empresa: 'InovaTech',
    rota: 'Rota Norte',
    ativo: true
  },
  { 
    id: '3', 
    nome: 'Carlos Souza', 
    email: 'carlos@email.com', 
    telefone: '(11) 99999-3333', 
    empresa: 'DataPro',
    rota: 'Rota Leste',
    ativo: false  // Exemplo de desativado
  },
];

export default function ConsultoresScreen() {
  const navigation = useNavigation<ConsultoresScreenNavigationProp>();
  const [pesquisa, setPesquisa] = useState('');
  const [consultores, setConsultores] = useState<Consultor[]>(MOCK_CONSULTORES);

  const consultoresFiltrados = consultores.filter(consultor =>
    consultor.nome.toLowerCase().includes(pesquisa.toLowerCase())
  );

  const handleAddConsultor = () => {
    navigation.navigate('CadastroConsultor');
  };

  const handleVoltar = () => {
    navigation.goBack();
  };

  const handlePesquisar = () => {
    if (pesquisa.trim() === '') {
      Alert.alert('Pesquisa', 'Digite um nome para pesquisar');
    } else {
      Alert.alert('Pesquisa', `Buscando por: ${pesquisa}`);
    }
  };

  // Exibe detalhes ao clicar no card
// Exibe detalhes ao clicar no card (com as informações solicitadas)
const handleConsultorPress = (consultor: Consultor) => {
  // Determina o status do consultor (simulando - depois virá do banco)
  const status = consultor.id === '1' ? 'Ativado' : 'Ativado'; // Exemplo: todos ativados
  // Para teste com desativado, use: const status = consultor.id === '2' ? 'Desativado' : 'Ativado';
  
  Alert.alert(
    'Detalhes do Consultor',
    `📛 Nome: ${consultor.nome}\n📧 Email: ${consultor.email}\n📱 WhatsApp: ${consultor.telefone}\n🗺️ Rota: ${consultor.rota || 'Rota A'}\n✅ Status: ${status}`,
    [{ text: 'OK' }]
  );
};

  // Navega para edição ao clicar na seta
  const handleEditarPress = (consultor: Consultor) => {
    navigation.navigate('EditarConsultor', { consultor });
  };

  // RenderItem com duas áreas clicáveis
  const renderItem = ({ item }: { item: Consultor }) => (
    <View style={styles.card}>
      {/* Área do card (clicável para detalhes) */}
      <TouchableOpacity
        style={styles.cardContent}
        onPress={() => handleConsultorPress(item)}
        activeOpacity={0.7}
      >
        <Text style={styles.cardNome}>{item.nome}</Text>
        <Text style={styles.cardEmail}>{item.email}</Text>
        <View style={styles.cardEmpresaContainer}>
          <Text style={styles.cardEmpresaIcon}>🏢</Text>
          <Text style={styles.cardEmpresa}>{item.empresa}</Text>
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
      
      {/* Cabeçalho FIXO - sem seta, sem botão + */}
      <View style={[styles.header, { paddingTop: STATUS_BAR_HEIGHT + 8 }]}>
        <View style={styles.placeholderLeft} />
        <Text style={styles.headerTitle}>Consultores</Text>
        <View style={styles.placeholderRight} />
      </View>

      {/* Barra de Pesquisa FIXA */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIconLeft}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Pesquisar consultor..."
            placeholderTextColor="#ADB5BD"
            value={pesquisa}
            onChangeText={setPesquisa}
          />
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={handlePesquisar}>
          <Text style={styles.searchButtonText}>Buscar</Text>
        </TouchableOpacity>
      </View>

      {/* Botão Voltar (fixo) */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.voltarButton} onPress={handleVoltar}>
          <Text style={styles.voltarButtonText}>← Voltar</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de Consultores */}
      {consultoresFiltrados.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nenhum consultor cadastrado</Text>
          <TouchableOpacity style={styles.emptyButton} onPress={handleAddConsultor}>
            <Text style={styles.emptyButtonText}>+ Adicionar Consultor</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={consultoresFiltrados}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB (Botão flutuante +) */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleAddConsultor}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#F8F9FC',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  placeholderLeft: {
    width: 44,
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
    zIndex: 9,
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
    padding: 16,
  },
  cardNome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  cardEmail: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 4,
  },
  cardEmpresaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardEmpresaIcon: {
    fontSize: 12,
    marginRight: 4,
    color: '#ADB5BD',
  },
  cardEmpresa: {
    fontSize: 12,
    color: '#4A4A4A',
  },
  // ESTILO CORRIGIDO (adicionado)
  cardArrowButton: {
    paddingHorizontal: 20,
    paddingVertical: 16,
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