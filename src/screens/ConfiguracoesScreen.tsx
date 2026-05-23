/**
 * TELA: ConfiguracoesScreen
 * 
 * FUNÇÃO:
 * Permite configurar as preferências do aplicativo:
 * - Dias para aviso de nova visita
 * - Pasta do Google Drive para anexar formulários
 * - Pasta para backup dos dados
 * - Pasta para restaurar backup
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Switch,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootDrawerParamList } from '../types/navigation';
import * as FileSystem from 'expo-file-system';
import NavegadorDePastas from '../components/NavegadorDePastas';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = StatusBar.currentHeight || 0;

type ConfiguracoesScreenNavigationProp = DrawerNavigationProp<RootDrawerParamList, 'Configuracoes'>;

// Dados das configurações (mockados - depois conectar com AsyncStorage/SQLite)
const CONFIG_INICIAL = {
  diasAviso: '30',
  pastaDrive: '/storage/emulated/0/Documents',
  pastaBackup: '/storage/emulated/0/Documents/Backup',
  pastaRestore: '/storage/emulated/0/Documents/Restore',
  notificacoesAtivas: true,
};

export default function ConfiguracoesScreen() {
  const navigation = useNavigation<ConfiguracoesScreenNavigationProp>();
  
  const [diasAviso, setDiasAviso] = useState(CONFIG_INICIAL.diasAviso);
  const [pastaDrive, setPastaDrive] = useState(CONFIG_INICIAL.pastaDrive);
  const [pastaBackup, setPastaBackup] = useState(CONFIG_INICIAL.pastaBackup);
  const [pastaRestore, setPastaRestore] = useState(CONFIG_INICIAL.pastaRestore);
  const [notificacoesAtivas, setNotificacoesAtivas] = useState(CONFIG_INICIAL.notificacoesAtivas);
  
  // Estado para controlar o modal do navegador de pastas
  const [navegadorVisible, setNavegadorVisible] = useState(false);
  const [tipoSelecao, setTipoSelecao] = useState<'drive' | 'backup' | 'restore'>('drive');

  const handleVoltar = () => {
    navigation.goBack();
  };

  const handleSalvar = () => {
    const dias = parseInt(diasAviso, 10);
    if (isNaN(dias) || dias <= 0) {
      Alert.alert('Erro', 'Digite um número válido de dias');
      return;
    }

    const configuracoes = {
      diasAviso,
      pastaDrive,
      pastaBackup,
      pastaRestore,
      notificacoesAtivas,
    };
    
    console.log('Configurações salvas:', configuracoes);
    Alert.alert('Sucesso', 'Configurações salvas com sucesso!');
  };

  // Abrir o navegador de pastas
  const abrirNavegador = (tipo: 'drive' | 'backup' | 'restore') => {
    setTipoSelecao(tipo);
    setNavegadorVisible(true);
  };

  // Selecionar pasta no navegador
  const selecionarPasta = (caminho: string) => {
    switch (tipoSelecao) {
      case 'drive':
        setPastaDrive(caminho);
        break;
      case 'backup':
        setPastaBackup(caminho);
        break;
      case 'restore':
        setPastaRestore(caminho);
        break;
    }
  };

  // Verificar se a pasta existe
  const verificarPasta = async (caminho: string): Promise<boolean> => {
    try {
      const info = await FileSystem.getInfoAsync(caminho);
      return info.exists && info.isDirectory;
    } catch (error) {
      return false;
    }
  };

  const handleFazerBackup = async () => {
    const existe = await verificarPasta(pastaBackup);
    if (!existe) {
      Alert.alert(
        'Pasta não encontrada',
        `A pasta "${pastaBackup}" não existe. Deseja criá-la?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Criar Pasta',
            onPress: async () => {
              try {
                await FileSystem.makeDirectoryAsync(pastaBackup, { intermediates: true });
                Alert.alert('Sucesso', 'Pasta criada! Faça o backup novamente.');
              } catch (error) {
                Alert.alert('Erro', 'Não foi possível criar a pasta');
              }
            }
          }
        ]
      );
      return;
    }

    Alert.alert(
      'Backup',
      'Deseja fazer backup de todos os dados do aplicativo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Fazer Backup', 
          onPress: () => {
            console.log('Backup realizado para:', pastaBackup);
            Alert.alert('Sucesso', 'Backup realizado com sucesso!');
          }
        }
      ]
    );
  };

  const handleRestaurarBackup = async () => {
    const existe = await verificarPasta(pastaRestore);
    if (!existe) {
      Alert.alert('Erro', `A pasta "${pastaRestore}" não existe. Verifique o caminho.`);
      return;
    }

    Alert.alert(
      'Restaurar Backup',
      'Deseja restaurar os dados do backup? Esta ação substituirá todos os dados atuais.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Restaurar', 
          style: 'destructive',
          onPress: () => {
            console.log('Restauração de:', pastaRestore);
            Alert.alert('Sucesso', 'Backup restaurado com sucesso!');
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FC" />
      
      <View style={[styles.header, { paddingTop: STATUS_BAR_HEIGHT + 8 }]}>
        <TouchableOpacity onPress={handleVoltar} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configurações</Text>
        <TouchableOpacity onPress={handleSalvar} style={styles.saveButton}>
          <Text style={styles.saveText}>Salvar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Seção: Aviso de Visita */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Aviso de Visita</Text>
          <Text style={styles.sectionDescription}>
            Número de dias para lembrar o consultor de visitar a empresa novamente
          </Text>
          
          <View style={styles.field}>
            <Text style={styles.label}>Dias para aviso</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 30"
              placeholderTextColor="#ADB5BD"
              keyboardType="numeric"
              value={diasAviso}
              onChangeText={setDiasAviso}
            />
            <Text style={styles.helperText}>
              Avisará após {diasAviso || '30'} dias da última visita
            </Text>
          </View>

          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Notificações ativas</Text>
            <Switch
              value={notificacoesAtivas}
              onValueChange={setNotificacoesAtivas}
              trackColor={{ false: '#E9ECEF', true: '#2463EB' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Seção: Pastas do Sistema */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📁 Pastas do Sistema</Text>
          <Text style={styles.sectionDescription}>
            Clique no botão "Selecionar" para navegar e escolher a pasta
          </Text>

          {/* Pasta para anexar formulários */}
          <View style={styles.field}>
            <Text style={styles.label}>Pasta para anexar formulários</Text>
            <TouchableOpacity 
              style={styles.pastaButton}
              onPress={() => abrirNavegador('drive')}
            >
              <Text style={styles.pastaButtonIcon}>📁</Text>
              <Text style={styles.pastaButtonText} numberOfLines={1}>
                {pastaDrive || 'Selecionar pasta'}
              </Text>
              <Text style={styles.pastaButtonArrow}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Pasta de Backup */}
          <View style={styles.field}>
            <Text style={styles.label}>Pasta de Backup</Text>
            <TouchableOpacity 
              style={styles.pastaButton}
              onPress={() => abrirNavegador('backup')}
            >
              <Text style={styles.pastaButtonIcon}>💾</Text>
              <Text style={styles.pastaButtonText} numberOfLines={1}>
                {pastaBackup || 'Selecionar pasta'}
              </Text>
              <Text style={styles.pastaButtonArrow}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleFazerBackup}>
              <Text style={styles.actionButtonText}>📂 Fazer Backup Agora</Text>
            </TouchableOpacity>
          </View>

          {/* Pasta para Restaurar Backup */}
          <View style={styles.field}>
            <Text style={styles.label}>Pasta para Restaurar Backup</Text>
            <TouchableOpacity 
              style={styles.pastaButton}
              onPress={() => abrirNavegador('restore')}
            >
              <Text style={styles.pastaButtonIcon}>🔄</Text>
              <Text style={styles.pastaButtonText} numberOfLines={1}>
                {pastaRestore || 'Selecionar pasta'}
              </Text>
              <Text style={styles.pastaButtonArrow}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.actionButtonDanger]} 
              onPress={handleRestaurarBackup}
            >
              <Text style={styles.actionButtonDangerText}>🔄 Restaurar Backup</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Seção: Informações */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ Informações</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>Versão do App: 1.0.0</Text>
            <Text style={styles.infoText}>Último backup: 19/05/2026</Text>
            <Text style={styles.infoText}>Próxima verificação: Automática</Text>
          </View>
        </View>
      </ScrollView>

      {/* Navegador de Pastas */}
      <NavegadorDePastas
        visible={navegadorVisible}
        onClose={() => setNavegadorVisible(false)}
        onSelect={selecionarPasta}
        titulo="Selecionar Pasta"
        caminhoInicial="/storage/emulated/0"
      />
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
  saveButton: {
    padding: 8,
  },
  saveText: {
    fontSize: 16,
    color: '#2463EB',
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 13,
    color: '#6C757D',
    marginBottom: 16,
    lineHeight: 18,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8F9FC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1A1A1A',
  },
  helperText: {
    fontSize: 11,
    color: '#ADB5BD',
    marginTop: 4,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 8,
  },
  switchLabel: {
    fontSize: 15,
    color: '#1A1A1A',
  },
  pastaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pastaButtonIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  pastaButtonText: {
    flex: 1,
    fontSize: 13,
    color: '#1A1A1A',
  },
  pastaButtonArrow: {
    fontSize: 20,
    color: '#ADB5BD',
    marginLeft: 8,
  },
  actionButton: {
    backgroundColor: '#2463EB',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  actionButtonDanger: {
    backgroundColor: '#FF3B30',
  },
  actionButtonDangerText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#F8F9FC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  infoText: {
    fontSize: 13,
    color: '#4A4A4A',
    marginBottom: 4,
  },
});