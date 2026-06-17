/**
 * COMPONENTE: NavegadorDePastas
 * 
 * FUNÇÃO:
 * Permite navegar visualmente pelo sistema de arquivos do dispositivo
 * e selecionar uma pasta.
 * 
 * Usando a API legada do expo-file-system (que funciona com caminhos absolutos)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';

type ArquivoItem = {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
};

interface NavegadorDePastasProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (caminho: string) => void;
  titulo: string;
  caminhoInicial?: string;
}

// Caminhos padrão para Android e iOS
const getCaminhoRaiz = (): string => {
  if (Platform.OS === 'android') {
    return '/storage/emulated/0/';
  } else if (Platform.OS === 'ios') {
    // @ts-ignore - API legada
    return FileSystem.documentDirectory || '/';
  }
  return '/';
};

const getCaminhoDocumentos = (): string => {
  if (Platform.OS === 'android') {
    return '/storage/emulated/0/Documents/';
  } else if (Platform.OS === 'ios') {
    // @ts-ignore - API legada
    return FileSystem.documentDirectory || '/';
  }
  return '/';
};

export default function NavegadorDePastas({
  visible,
  onClose,
  onSelect,
  titulo,
  caminhoInicial,
}: NavegadorDePastasProps) {
  const [navegacaoIniciada, setNavegacaoIniciada] = useState(false);
  const [caminhoAtual, setCaminhoAtual] = useState<string | null>(null);
  const [itens, setItens] = useState<ArquivoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [caminhoHistorico, setCaminhoHistorico] = useState<string[]>([]);

  // Garantir que o caminho termine com /
  const normalizarCaminho = (caminho: string): string => {
    if (!caminho.endsWith('/')) {
      return `${caminho}/`;
    }
    return caminho;
  };

  // Carregar o conteúdo da pasta atual
  const carregarConteudo = async (caminho: string) => {
    setLoading(true);
    try {
      const caminhoNormalizado = normalizarCaminho(caminho);
      
      const info = await FileSystem.getInfoAsync(caminhoNormalizado);
      if (!info.exists) {
        Alert.alert('Erro', 'O diretório não existe');
        setLoading(false);
        return;
      }
      
      if (!info.isDirectory) {
        Alert.alert('Erro', 'O caminho não é um diretório');
        setLoading(false);
        return;
      }
      
      const arquivos = await FileSystem.readDirectoryAsync(caminhoNormalizado);
      
      const itensProcessados: ArquivoItem[] = [];
      
      for (const arquivo of arquivos) {
        const caminhoCompleto = `${caminhoNormalizado}${arquivo}`;
        try {
          const itemInfo = await FileSystem.getInfoAsync(caminhoCompleto);
          
          // CORREÇÃO: Verificar se itemInfo existe antes de acessar size
          let tamanho: number | undefined = undefined;
          if (itemInfo.exists && !itemInfo.isDirectory && 'size' in itemInfo) {
            tamanho = (itemInfo as any).size;
          }
          
          itensProcessados.push({
            name: arquivo,
            path: caminhoCompleto,
            isDirectory: itemInfo.isDirectory || false,
            size: tamanho,
          });
        } catch (error) {
          console.log('Erro ao ler item:', arquivo, error);
        }
      }
      
      itensProcessados.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });
      
      setItens(itensProcessados);
    } catch (error) {
      console.error('Erro ao carregar pasta:', error);
      Alert.alert('Erro', 'Não foi possível ler esta pasta');
    } finally {
      setLoading(false);
    }
  };

  const iniciarNavegacao = (caminho: string) => {
    setCaminhoHistorico([]);
    setCaminhoAtual(caminho);
    setNavegacaoIniciada(true);
    carregarConteudo(caminho);
  };

  const handleClose = () => {
    setNavegacaoIniciada(false);
    setCaminhoAtual(null);
    setItens([]);
    setCaminhoHistorico([]);
    onClose();
  };

  useEffect(() => {
    if (visible && navegacaoIniciada && caminhoAtual) {
      carregarConteudo(caminhoAtual);
    }
  }, [visible, navegacaoIniciada, caminhoAtual]);

  const entrarNaPasta = (item: ArquivoItem) => {
    if (item.isDirectory) {
      setCaminhoHistorico([...caminhoHistorico, caminhoAtual!]);
      setCaminhoAtual(item.path);
    }
  };

  const voltarPasta = () => {
    if (caminhoHistorico.length > 0) {
      const ultimoCaminho = caminhoHistorico[caminhoHistorico.length - 1];
      setCaminhoHistorico(caminhoHistorico.slice(0, -1));
      setCaminhoAtual(ultimoCaminho);
    }
  };

  const selecionarPastaAtual = () => {
    if (caminhoAtual) {
      onSelect(normalizarCaminho(caminhoAtual));
      handleClose();
    }
  };

  const irParaRaiz = () => {
    iniciarNavegacao(getCaminhoRaiz());
  };

  const irParaDocumentos = () => {
    iniciarNavegacao(getCaminhoDocumentos());
  };

  const renderItem = ({ item }: { item: ArquivoItem }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => entrarNaPasta(item)}
      activeOpacity={0.7}
    >
      <Text style={styles.itemIcon}>{item.isDirectory ? '📁' : '📄'}</Text>
      <Text style={styles.itemName}>{item.name}</Text>
      {!item.isDirectory && item.size && (
        <Text style={styles.itemInfo}>
          {(item.size / 1024).toFixed(1)} KB
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Cabeçalho */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Fechar</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{titulo}</Text>
            {caminhoAtual && (
              <TouchableOpacity onPress={selecionarPastaAtual} style={styles.selectButton}>
                <Text style={styles.selectButtonText}>Selecionar</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Menu inicial */}
          {!navegacaoIniciada ? (
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeIcon}>📁</Text>
              <Text style={styles.welcomeTitle}>Selecione uma pasta</Text>
              <Text style={styles.welcomeText}>
                Clique nos botões abaixo para começar a navegar
              </Text>
              
              <TouchableOpacity style={styles.welcomeButton} onPress={irParaRaiz}>
                <Text style={styles.welcomeButtonIcon}>📁</Text>
                <View style={styles.welcomeButtonTextContainer}>
                  <Text style={styles.welcomeButtonTitle}>Raiz do Armazenamento</Text>
                  <Text style={styles.welcomeButtonSubtitle}>
                    Acessar a raiz do dispositivo
                  </Text>
                </View>
                <Text style={styles.welcomeButtonArrow}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.welcomeButton} onPress={irParaDocumentos}>
                <Text style={styles.welcomeButtonIcon}>📄</Text>
                <View style={styles.welcomeButtonTextContainer}>
                  <Text style={styles.welcomeButtonTitle}>Documentos</Text>
                  <Text style={styles.welcomeButtonSubtitle}>
                    Acessar a pasta de documentos
                  </Text>
                </View>
                <Text style={styles.welcomeButtonArrow}>›</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Barra de navegação */}
              <View style={styles.navBar}>
                <TouchableOpacity onPress={voltarPasta} style={styles.navButton}>
                  <Text style={styles.navButtonText}>← Voltar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={irParaRaiz} style={styles.navButton}>
                  <Text style={styles.navButtonText}>📁 Raiz</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={irParaDocumentos} style={styles.navButton}>
                  <Text style={styles.navButtonText}>📄 Documentos</Text>
                </TouchableOpacity>
              </View>

              {/* Caminho atual */}
              <View style={styles.pathContainer}>
                <Text style={styles.pathLabel}>Caminho atual:</Text>
                <Text style={styles.pathText} numberOfLines={2}>
                  {caminhoAtual}
                </Text>
              </View>

              {/* Lista de pastas e arquivos */}
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#2463EB" />
                  <Text style={styles.loadingText}>Carregando...</Text>
                </View>
              ) : (
                <FlatList
                  data={itens}
                  renderItem={renderItem}
                  keyExtractor={(item) => item.path}
                  contentContainerStyle={styles.listContainer}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>📂 Pasta vazia</Text>
                    </View>
                  }
                />
              )}
            </>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#F8F9FC',
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#2463EB',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  selectButton: {
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  selectButtonText: {
    color: '#2463EB',
    fontSize: 14,
    fontWeight: '600',
  },
  welcomeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  welcomeIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
    marginBottom: 32,
  },
  welcomeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    width: '100%',
  },
  welcomeButtonIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  welcomeButtonTextContainer: {
    flex: 1,
  },
  welcomeButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  welcomeButtonSubtitle: {
    fontSize: 12,
    color: '#6C757D',
  },
  welcomeButtonArrow: {
    fontSize: 20,
    color: '#ADB5BD',
  },
  navBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  navButton: {
    backgroundColor: '#F8F9FC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  navButtonText: {
    fontSize: 12,
    color: '#2463EB',
  },
  pathContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F9FC',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  pathLabel: {
    fontSize: 12,
    color: '#6C757D',
    marginBottom: 4,
  },
  pathText: {
    fontSize: 12,
    color: '#1A1A1A',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  listContainer: {
    padding: 8,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  itemIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  itemName: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
  },
  itemInfo: {
    fontSize: 11,
    color: '#ADB5BD',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6C757D',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6C757D',
  },
});