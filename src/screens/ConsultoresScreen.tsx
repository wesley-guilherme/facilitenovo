/**
 * TELA: ConsultoresScreen
 * 
 * FUNÇÃO:
 * Exibe a lista de consultores cadastrados.
 * Permite pesquisar, adicionar novo consultor e voltar para tela inicial.
 * 
 * ALTERAÇÕES:
 * - Cabeçalho fixo (não rola) - SEM seta e SEM botão +
 * - Barra de pesquisa fixa (não rola)
 * - Botão "← Voltar" abaixo da pesquisa
 * - Apenas a lista de cards rola
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
};

const MOCK_CONSULTORES: Consultor[] = [
  { id: '1', nome: 'João Silva', email: 'joao@email.com', telefone: '(11) 99999-1111', empresa: 'Tech Solutions' },
  { id: '2', nome: 'Maria Oliveira', email: 'maria@email.com', telefone: '(11) 99999-2222', empresa: 'InovaTech' },
  { id: '3', nome: 'Carlos Souza', email: 'carlos@email.com', telefone: '(11) 99999-3333', empresa: 'DataPro' },
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

  const handleConsultorPress = (consultor: Consultor) => {
    Alert.alert('Detalhes', `Nome: ${consultor.nome}\nEmail: ${consultor.email}\nTelefone: ${consultor.telefone}\nEmpresa: ${consultor.empresa}`);
  };

  const renderItem = ({ item }: { item: Consultor }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleConsultorPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <Text style={styles.cardNome}>{item.nome}</Text>
        <Text style={styles.cardEmail}>{item.email}</Text>
        <View style={styles.cardEmpresaContainer}>
          <Text style={styles.cardEmpresaIcon}>🏢</Text>
          <Text style={styles.cardEmpresa}>{item.empresa}</Text>
        </View>
      </View>
      <Text style={styles.cardArrow}>→</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FC" />
      
      {/* CORREÇÃO 1: Cabeçalho FIXO - sem seta, sem botão + */}
      <View style={[styles.header, { paddingTop: STATUS_BAR_HEIGHT + 8 }]}>
        <View style={styles.placeholderLeft} />
        <Text style={styles.headerTitle}>Consultores</Text>
        <View style={styles.placeholderRight} />
      </View>

      {/* CORREÇÃO 2: Barra de Pesquisa FIXA */}
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

      {/* CORREÇÃO 3: Botão Voltar (fixo) */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.voltarButton} onPress={handleVoltar}>
          <Text style={styles.voltarButtonText}>← Voltar</Text>
        </TouchableOpacity>
      </View>

      {/* CORREÇÃO 4: Apenas a lista de cards ROLA */}
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

      {/* FAB (Botão flutuante +) - FIXO */}
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
  // Cabeçalho FIXO (sem seta e sem botão +)
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
  // Barra de Pesquisa FIXA
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
  // Botão Voltar (fixo)
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
  // Lista ROLÁVEL
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
  cardContent: {
    flex: 1,
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
  cardArrow: {
    fontSize: 18,
    color: '#6C757D',
    marginLeft: 12,
  },
  // FAB (Botão flutuante)
  fab: {
    position: 'absolute',
    bottom: 40,
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