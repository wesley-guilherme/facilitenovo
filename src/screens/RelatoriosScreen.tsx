/**
 * TELA: RelatoriosScreen
 * 
 * FUNÇÃO:
 * Exibe opções de relatórios disponíveis para o consultor:
 * - Clientes da Rota
 * - Visita de Clientes Por Data
 * - Clientes Que Não Visita a (n) dias
 * - Clientes Mais Visitados
 * - Clientes Menos Visitados
 * 
 * Cada opção ao ser clicada exibe o relatório correspondente.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
  TextInput,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootDrawerParamList } from '../types/navigation';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = StatusBar.currentHeight || 0;

type RelatoriosScreenNavigationProp = DrawerNavigationProp<RootDrawerParamList, 'Relatorios'>;

type RelatorioItem = {
  id: string;
  titulo: string;
  icone: string;
  cor: string;
};

const RELATORIOS: RelatorioItem[] = [
  { id: '1', titulo: 'Clientes da Rota', icone: '🗺️', cor: '#2463EB' },
  { id: '2', titulo: 'Visita de Clientes Por Data', icone: '📅', cor: '#34C759' },
  { id: '3', titulo: 'Clientes Que Não Visita', icone: '⚠️', cor: '#FF3B30' },
  { id: '4', titulo: 'Clientes Mais Visitados', icone: '📈', cor: '#FF9500' },
  { id: '5', titulo: 'Clientes Menos Visitados', icone: '📉', cor: '#5856D6' },
];

export default function RelatoriosScreen() {
  const navigation = useNavigation<RelatoriosScreenNavigationProp>();
  const [modalVisible, setModalVisible] = useState(false);
  const [dias, setDias] = useState('');
  const [selectedRelatorio, setSelectedRelatorio] = useState<RelatorioItem | null>(null);

  const handleVoltar = () => {
    navigation.goBack();
  };

  // Modal para o relatório "Clientes Que Não Visita a (n) dias"
  const handleRelatorioDias = (item: RelatorioItem) => {
    setSelectedRelatorio(item);
    setModalVisible(true);
  };

  const handleConfirmarDias = () => {
    const numeroDias = parseInt(dias, 10);
    if (isNaN(numeroDias) || numeroDias <= 0) {
      Alert.alert('Erro', 'Digite um número de dias válido');
      return;
    }
    setModalVisible(false);
    Alert.alert(
      'Relatório',
      `Clientes que não visitou nos últimos ${numeroDias} dias\n\n(Implementar consulta ao banco de dados)`
    );
    setDias('');
  };

  const handleRelatorioPress = (item: RelatorioItem) => {
    if (item.id === '3') {
      handleRelatorioDias(item);
    } else {
      Alert.alert(
        'Relatório',
        `${item.icone} ${item.titulo}\n\n(Implementar consulta ao banco de dados)`
      );
    }
  };

  const getCorPorId = (id: string) => {
    switch (id) {
      case '1': return '#2463EB';
      case '2': return '#34C759';
      case '3': return '#FF3B30';
      case '4': return '#FF9500';
      case '5': return '#5856D6';
      default: return '#2463EB';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FC" />
      
      {/* Cabeçalho com botão Voltar */}
      <View style={[styles.header, { paddingTop: STATUS_BAR_HEIGHT + 8 }]}>
        <TouchableOpacity onPress={handleVoltar} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Relatórios</Text>
        <View style={styles.placeholderRight} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {RELATORIOS.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.card, { borderLeftColor: getCorPorId(item.id), borderLeftWidth: 4 }]}
            onPress={() => handleRelatorioPress(item)}
            activeOpacity={0.7}
          >
            <View style={styles.cardContent}>
              <View style={[styles.iconContainer, { backgroundColor: getCorPorId(item.id) + '20' }]}>
                <Text style={styles.icon}>{item.icone}</Text>
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.titulo}>{item.titulo}</Text>
                {item.id === '3' && (
                  <Text style={styles.subtitulo}>
                    Definir quantidade de dias
                  </Text>
                )}
              </View>
              <Text style={styles.arrow}>→</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Modal para definir número de dias */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Clientes Que Não Visita</Text>
            <Text style={styles.modalSubtitle}>
              Informe a quantidade de dias para análise
            </Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Ex: 30"
              placeholderTextColor="#ADB5BD"
              keyboardType="numeric"
              value={dias}
              onChangeText={setDias}
              autoFocus={true}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setModalVisible(false);
                  setDias('');
                }}
              >
                <Text style={styles.modalButtonCancelText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleConfirmarDias}
              >
                <Text style={styles.modalButtonConfirmText}>Gerar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
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
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  icon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  titulo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  subtitulo: {
    fontSize: 12,
    color: '#6C757D',
    marginTop: 2,
  },
  arrow: {
    fontSize: 18,
    color: '#6C757D',
    marginLeft: 12,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
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
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: '#F8F9FC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    textAlign: 'center',
    color: '#1A1A1A',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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