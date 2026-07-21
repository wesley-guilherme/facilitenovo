/**
 * TELA: TextosPredefinidosScreen
 * 
 * FUNÇÃO:
 * Gerencia textos predefinidos para uso rápido em formulários.
 * - Lista textos salvos (apenas o texto)
 * - Adicionar novo texto (FAB)
 * - Editar texto (clique no card)
 * - Excluir texto (ícone de lixeira)
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  StatusBar,
  Modal,
  TextInput,
  Dimensions,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootDrawerParamList } from '../types/navigation';
import { TextosPredefinidosRepository } from '../database/textosPredefinidosRepository';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = StatusBar.currentHeight || 0;

// Tipo da navegacao desta tela no drawer.
type TextosPredefinidosScreenNavigationProp = DrawerNavigationProp<RootDrawerParamList, 'TextosPredefinidos'>;

type Texto = {
  id: string;
  texto: string;
  created_at: string;
  updated_at?: string | null;
};

export default function TextosPredefinidosScreen() {
  const navigation = useNavigation<TextosPredefinidosScreenNavigationProp>();
  const [textos, setTextos] = useState<Texto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTexto, setEditingTexto] = useState<Texto | null>(null);
  const [formTexto, setFormTexto] = useState('');

  // Carrega textos do banco com tratamento de erro.
  const carregarTextos = async () => {

    setLoading(true);

    try {

      const textosDb =
        await TextosPredefinidosRepository.listar();

      console.log(
        '📝 Textos carregados:',
        textosDb
      );

      setTextos(textosDb);

    } catch (error) {

      console.error(
        'Erro ao carregar textos:',
        error
      );

      setTextos([]);

    } finally {

      setLoading(false);

    }

  };

  // Recarregar quando a tela ganhar foco
  // Recarrega a lista quando a tela ganhar foco.
  useFocusEffect(
    useCallback(() => {
      carregarTextos();
    }, [])
  );

  const handleVoltar = () => {
    navigation.goBack();
  };

  // Abre modal limpo para criar novo texto.
  const openAddModal = () => {
    setEditingTexto(null);
    setFormTexto('');
    setModalVisible(true);
  };

  // Abre modal preenchido para editar texto existente.
  const openEditModal = (item: Texto) => {
    setEditingTexto(item);
    setFormTexto(item.texto);
    setModalVisible(true);
  };

  // Salva novo texto ou atualiza o texto em edicao.
  const handleSalvar = async () => {
    if (formTexto.trim() === '') {
      Alert.alert('Erro', 'Digite um texto');
      return;
    }

try {

  if (editingTexto) {

    await TextosPredefinidosRepository.atualizar([
      formTexto.trim(),
      new Date().toISOString(),
      editingTexto.id
    ]);

    Alert.alert(
      'Sucesso',
      'Texto atualizado com sucesso!'
    );

  } else {

    const novoId = Date.now().toString();

    await TextosPredefinidosRepository.inserir([
      novoId,
      formTexto.trim(),
      new Date().toISOString()
    ]);

    Alert.alert(
      'Sucesso',
      'Texto adicionado com sucesso!'
    );

  }

  setModalVisible(false);
  setFormTexto('');
  setEditingTexto(null);

  carregarTextos();

} catch (error) {

  console.error(
    'Erro ao salvar texto:',
    error
  );

  Alert.alert(
    'Erro',
    'Não foi possível salvar o texto.'
    );
  }
}

  const handleExcluir = (item: Texto) => {
    Alert.alert(
      'Excluir Texto',
      `Tem certeza que deseja excluir este texto?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await TextosPredefinidosRepository.excluir(item.id);
              Alert.alert('Sucesso', 'Texto excluído com sucesso!');
              carregarTextos(); // Recarregar lista
            } catch (error) {
              console.error('Erro ao excluir texto:', error);
              Alert.alert('Erro', 'Não foi possível excluir o texto');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Texto }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => openEditModal(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <Text style={styles.cardTexto} numberOfLines={3}>
          {item.texto}
        </Text>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleExcluir(item)}
          activeOpacity={0.7}
        >
          <Text style={styles.deleteIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FC" />
      
      {/* Cabeçalho com botão Voltar */}
      <View style={[styles.header, { paddingTop: STATUS_BAR_HEIGHT + 8 }]}>
        <TouchableOpacity onPress={handleVoltar} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Textos Predefinidos</Text>
        <View style={styles.placeholderRight} />
      </View>

      {/* Lista de Textos */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2463EB" />
          <Text style={styles.loadingText}>Carregando textos...</Text>
        </View>
      ) : textos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📝</Text>
          <Text style={styles.emptyText}>Nenhum texto predefinido</Text>
          <Text style={styles.emptySubtext}>
            Toque no botão + para adicionar
          </Text>
        </View>
      ) : (
        <FlatList
          data={textos}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB (Botão flutuante +) */}
      <TouchableOpacity
        style={styles.fab}
        onPress={openAddModal}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Modal para Adicionar/Editar Texto */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
        >
          <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
            <View style={styles.modalDismissArea}>
              <TouchableWithoutFeedback>
                <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingTexto ? '✏️ Editar Texto' : '📝 Novo Texto'}
            </Text>
            
            <TextInput
              style={styles.modalInputTexto}
              placeholder="Digite o texto predefinido..."
              placeholderTextColor="#ADB5BD"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              value={formTexto}
              onChangeText={setFormTexto}
              autoFocus={true}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setModalVisible(false);
                  setEditingTexto(null);
                  setFormTexto('');
                }}
              >
                <Text style={styles.modalButtonCancelText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleSalvar}
              >
                <Text style={styles.modalButtonConfirmText}>Salvar</Text>
              </TouchableOpacity>
            </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
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
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  card: {
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
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  cardTexto: {
    flex: 1,
    fontSize: 14,
    color: '#4A4A4A',
    lineHeight: 20,
    marginRight: 12,
  },
  deleteButton: {
    padding: 4,
  },
  deleteIcon: {
    fontSize: 20,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 24,
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalDismissArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInputTexto: {
    backgroundColor: '#F8F9FC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A1A1A',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#F8F9FC',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  modalButtonCancelText: {
    color: '#6C757D',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonConfirm: {
    backgroundColor: '#2463EB',
    marginLeft: 8,
  },
  modalButtonConfirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
