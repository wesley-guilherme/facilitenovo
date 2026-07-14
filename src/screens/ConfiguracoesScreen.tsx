/**
 * TELA: ConfiguracoesScreen
 * 
 * FUNÇÃO:
 * Configurações do aplicativo para o consultor:
 * - Aviso de Visita (dias para próxima visita)
 * - Backup (compartilhar via share nativo)
 * - Restaurar Dados (navegar e selecionar arquivo de backup)
 * - Dados (informações de armazenamento local)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  ScrollView,
  Switch,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootDrawerParamList } from '../types/navigation';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import  { db } from '../database/initDatabase';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = StatusBar.currentHeight || 0;

type ConfiguracoesScreenNavigationProp = DrawerNavigationProp<RootDrawerParamList, 'Configuracoes'>;

// Dados das configurações
const CONFIG_INICIAL = {
  diasAviso: '30',
  notificacoesAtivas: true,
};

export default function ConfiguracoesScreen() {
  const navigation = useNavigation<ConfiguracoesScreenNavigationProp>();  
  const [diasAviso, setDiasAviso] = useState(CONFIG_INICIAL.diasAviso);
  const [notificacoesAtivas, setNotificacoesAtivas] = useState(CONFIG_INICIAL.notificacoesAtivas);
  const [loading, setLoading] = useState(false);
  const [quantidadeOSs, setQuantidadeOSs] = useState(0);
  const [tamanhoBanco, setTamanhoBanco] = useState('0 KB');

  // Carregar informações dos dados
  useEffect(() => {
    carregarConfiguracoes();
    carregarInfoDados();
  }, []);

  const carregarConfiguracoes = async () => {
    try {
      const config = await db.getFirstAsync<{ valor: string }>(
        'SELECT valor FROM configuracoes WHERE chave = ?',
        ['dias_aviso']
      );

      if (config?.valor) {
        setDiasAviso(config.valor);
      }
    } catch (error) {
      console.log('Erro ao carregar configurações:', error);
    }
  };

 const carregarInfoDados = async () => {
  try {
    // Tentar contar OSs - se a tabela não existir, retorna 0
    let total = 0;
    try {
      const result = await db.getAllAsync('SELECT COUNT(*) as total FROM os_assinadas');
      total = (result as any[])[0]?.total || 0;
    } catch (tableError) {
      // Tabela ainda não existe - ignorar
      console.log('Tabela os_assinadas ainda não criada');
      total = 0;
    }
    setQuantidadeOSs(total);
    
    // Verificar tamanho do banco (apenas se o arquivo existe)
    const dbPath = `${Paths.document.uri}SQLite/facilite.db`;
    const dbFile = new File(dbPath);
    
    if (dbFile.exists) {
      const info = await dbFile.info();
      if (info.size) {
        const tamanhoKB = (info.size / 1024).toFixed(1);
        setTamanhoBanco(`${tamanhoKB} KB`);
      } else {
        setTamanhoBanco('0 KB');
      }
    } else {
      setTamanhoBanco('0 KB');
    }
  } catch (error) {
    console.error('Erro ao carregar informações:', error);
    setQuantidadeOSs(0);
    setTamanhoBanco('0 KB');
  }
};

  const handleVoltar = () => {
    navigation.goBack();
  };

  const handleSalvar = async () => {
    const dias = parseInt(diasAviso, 10);
    if (isNaN(dias) || dias <= 0) {
      Alert.alert('Erro', 'Digite um número válido de dias');
      return;
    }

    try {
      await db.runAsync(
        `INSERT OR REPLACE INTO configuracoes
          (chave, valor, updated_at)
         VALUES (?, ?, ?)`,
        [
          'dias_aviso',
          String(dias),
          new Date().toISOString(),
        ]
      );

      setDiasAviso(String(dias));
      Alert.alert('Sucesso', 'Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      Alert.alert('Erro', 'Não foi possível salvar as configurações');
    }
  };

  // ==================== BACKUP ====================
  const fazerBackup = async () => {
    setLoading(true);
    try {
      // 1. Buscar todos os dados do SQLite
      const tabelas = ['os_assinadas', 'consultores', 'empresas'];
      const backupData: any = {};
      
      for (const tabela of tabelas) {
        try {
          const dados = await db.getAllAsync(`SELECT * FROM ${tabela}`);
          backupData[tabela] = dados;
        } catch (error) {
          backupData[tabela] = [];
        }
      }
      
      // 2. Criar arquivo JSON com os dados
      const jsonString = JSON.stringify(backupData, null, 2);
      const backupPath = `${Paths.cache.uri}backup_facilite_${Date.now()}.json`;
      const backupFile = new File(backupPath);
      
      await backupFile.write(jsonString);
      
      // 3. Verificar se o compartilhamento está disponível
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Erro', 'Compartilhamento não disponível neste dispositivo');
        return;
      }
      
      // 4. Compartilhar o arquivo
      await Sharing.shareAsync(backupPath, {
        mimeType: 'application/json',
        dialogTitle: 'Salvar Backup - FACILITE',
        UTI: 'public.json',
      });
      
      // 5. Limpar arquivo temporário
      await backupFile.delete();
      
      Alert.alert('Backup concluído', 'Os dados foram exportados com sucesso!');
      
    } catch (error) {
      console.error('Erro ao fazer backup:', error);
      Alert.alert('Erro', 'Não foi possível fazer o backup');
    } finally {
      setLoading(false);
    }
  };

  // ==================== RESTAURAR DADOS ====================
  const restaurarBackup = async () => {
    setLoading(true);
    try {
      // 1. Abrir seletor de arquivos
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
      
      if (result.canceled) {
        setLoading(false);
        return;
      }
      
      const arquivoSelecionado = result.assets[0];
      
      // 2. Ler o conteúdo do arquivo
      const arquivo = new File(arquivoSelecionado.uri);
      const conteudo = await arquivo.text();
      const backupData = JSON.parse(conteudo);
      
      // 3. Confirmar restauração
      Alert.alert(
        'Restaurar Backup',
        'Esta ação substituirá todos os dados atuais. Tem certeza?',
        [
          { text: 'Cancelar', style: 'cancel', onPress: () => setLoading(false) },
          {
            text: 'Restaurar',
            style: 'destructive',
            onPress: async () => {
              try {
                // 4. Restaurar cada tabela
                for (const [tabela, dados] of Object.entries(backupData)) {
                  if (Array.isArray(dados) && dados.length > 0) {
                    try {
                      await db.execAsync(`DELETE FROM ${tabela}`);
                      
                      for (const item of dados as any[]) {
                        const colunas = Object.keys(item).join(', ');
                        const valores = Object.values(item).map((v: any) => {
                          if (typeof v === 'string') {
                            return `'${v.replace(/'/g, "''")}'`;
                          }
                          if (v === null || v === undefined) {
                            return 'NULL';
                          }
                          return v;
                        }).join(', ');
                        
                        await db.execAsync(`INSERT INTO ${tabela} (${colunas}) VALUES (${valores})`);
                      }
                    } catch (error) {
                      console.error(`Erro ao restaurar tabela ${tabela}:`, error);
                    }
                  }
                }
                
                await carregarInfoDados();
                Alert.alert('Sucesso', 'Dados restaurados com sucesso!');
              } catch (restoreError) {
                console.error('Erro na restauração:', restoreError);
                Alert.alert('Erro', 'Falha ao restaurar os dados');
              } finally {
                setLoading(false);
              }
            },
          },
        ]
      );
      
    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
      Alert.alert('Erro', 'Não foi possível ler o arquivo de backup');
      setLoading(false);
    }
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

        {/* Seção: Backup */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💾 Backup</Text>
          <Text style={styles.sectionDescription}>
            Exporte seus dados para fazer backup. O arquivo será gerado e você escolhe onde salvar.
          </Text>
          
          <TouchableOpacity 
            style={styles.backupButton} 
            onPress={fazerBackup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.backupButtonIcon}>📤</Text>
                <Text style={styles.backupButtonText}>Fazer Backup Agora</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Seção: Restaurar Dados */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔄 Restaurar Dados</Text>
          <Text style={styles.sectionDescription}>
            Selecione um arquivo de backup para restaurar seus dados.
          </Text>
          
          <TouchableOpacity 
            style={styles.restoreButton} 
            onPress={restaurarBackup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#2463EB" />
            ) : (
              <>
                <Text style={styles.restoreButtonIcon}>📂</Text>
                <Text style={styles.restoreButtonText}>Selecionar Backup</Text>
              </>
            )}
          </TouchableOpacity>
          
          <Text style={styles.notaText}>
            * O backup deve ser um arquivo JSON gerado pelo próprio aplicativo
          </Text>
        </View>

        {/* Seção: Dados */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🗄️ Dados</Text>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>OSs armazenadas</Text>
            <Text style={styles.infoValue}>{quantidadeOSs}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Tamanho do banco de dados</Text>
            <Text style={styles.infoValue}>{tamanhoBanco}</Text>
          </View>
          
          <Text style={styles.notaText}>
            Os dados ficam armazenados localmente no seu dispositivo.
          </Text>
        </View>
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
  backupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2463EB',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 8,
  },
  backupButtonIcon: {
    fontSize: 18,
    color: '#FFFFFF',
    marginRight: 8,
  },
  backupButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FC',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#2463EB',
  },
  restoreButtonIcon: {
    fontSize: 18,
    color: '#2463EB',
    marginRight: 8,
  },
  restoreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2463EB',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6C757D',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  notaText: {
    fontSize: 11,
    color: '#ADB5BD',
    marginTop: 12,
    lineHeight: 16,
  },
});
