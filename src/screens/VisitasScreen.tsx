/**
 * TELA: VisitasScreen
 * 
 * FUNÇÃO:
 * Gerencia as visitas realizadas pelo consultor.
 * - Lista empresas ordenadas por data da última visita (mais antiga no topo)
 * - Cards com pré-visualização (foto, código, nome, última visita)
 * - Destaque em vermelho para empresas com visita atrasada (conforme configuração)
 * - Agrupamento por data
 * - Pesquisa por nome ou código
 * - Geração de relatório compactado (ZIP) das visitas por data
 * - FAB para criar nova visita
 */

import React, { useState, useEffect } from 'react';
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
  ScrollView,
  Dimensions,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootDrawerParamList } from '../types/navigation';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as SQLite from 'expo-sqlite';

const { width, height } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = StatusBar.currentHeight || 0;

type VisitasScreenNavigationProp = DrawerNavigationProp<RootDrawerParamList, 'Visitas'>;

// Tipo para Empresa
type Empresa = {
  id: string;
  codigoReferencia: string;
  nomeFantasia: string;
  logo: string | null;
  cidade: string;
  endereco: string;
  numero: string;
  email: string;
  contato: string;
  rota: string;
};

// Tipo para Visita
type Visita = {
  id: string;
  empresaId: string;
  dataVisita: string; // Formato: YYYY-MM-DD
  horaVisita: string;
  formularioAssinado: string | null; // Base64 da imagem/PDF assinado
  observacoes: string;
  textoPredefinidoId: string | null;
  createdAt: string;
};

// Tipo para Empresa com dados agregados da última visita
type EmpresaComUltimaVisita = Empresa & {
  ultimaVisita: Visita | null;
  diasDesdeUltimaVisita: number;
  statusAtraso: 'normal' | 'atencao' | 'critico';
};

// Dados mockados para teste
const MOCK_EMPRESAS: Empresa[] = [
  {
    id: '1',
    codigoReferencia: 'EMP001',
    nomeFantasia: 'Tech Solutions',
    logo: null,
    cidade: 'São Paulo',
    endereco: 'Rua das Tecnologias',
    numero: '123',
    email: 'contato@techsolutions.com',
    contato: '(11) 99999-1111',
    rota: 'Rota Sul',
  },
  {
    id: '2',
    codigoReferencia: 'EMP002',
    nomeFantasia: 'InovaTech',
    logo: null,
    cidade: 'Rio de Janeiro',
    endereco: 'Av. Inovação',
    numero: '456',
    email: 'contato@inovatech.com',
    contato: '(21) 99999-2222',
    rota: 'Rota Norte',
  },
  {
    id: '3',
    codigoReferencia: 'EMP003',
    nomeFantasia: 'DataPro',
    logo: null,
    cidade: 'Belo Horizonte',
    endereco: 'Rua dos Dados',
    numero: '789',
    email: 'contato@datapro.com',
    contato: '(31) 99999-3333',
    rota: 'Rota Leste',
  },
  {
    id: '4',
    codigoReferencia: 'EMP004',
    nomeFantasia: 'Cloud Nine',
    logo: null,
    cidade: 'Curitiba',
    endereco: 'Av. das Nuvens',
    numero: '100',
    email: 'contato@cloudnine.com',
    contato: '(41) 99999-4444',
    rota: 'Rota Oeste',
  },
  {
    id: '5',
    codigoReferencia: 'EMP005',
    nomeFantasia: 'DevSolutions',
    logo: null,
    cidade: 'Porto Alegre',
    endereco: 'Rua dos Devs',
    numero: '200',
    email: 'contato@devsolutions.com',
    contato: '(51) 99999-5555',
    rota: 'Rota Sul',
  },
];

// Dados mockados de visitas
const MOCK_VISITAS: Visita[] = [
  {
    id: '1',
    empresaId: '1',
    dataVisita: '2026-05-15',
    horaVisita: '09:30',
    formularioAssinado: null,
    observacoes: 'Visita de rotina',
    textoPredefinidoId: null,
    createdAt: '2026-05-15T09:30:00Z',
  },
  {
    id: '2',
    empresaId: '1',
    dataVisita: '2026-05-10',
    horaVisita: '14:00',
    formularioAssinado: null,
    observacoes: 'Atualização do sistema',
    textoPredefinidoId: null,
    createdAt: '2026-05-10T14:00:00Z',
  },
  {
    id: '3',
    empresaId: '2',
    dataVisita: '2026-05-12',
    horaVisita: '10:15',
    formularioAssinado: null,
    observacoes: 'Visita solicitada pelo cliente',
    textoPredefinidoId: null,
    createdAt: '2026-05-12T10:15:00Z',
  },
  {
    id: '4',
    empresaId: '2',
    dataVisita: '2026-05-05',
    horaVisita: '11:30',
    formularioAssinado: null,
    observacoes: 'Visita de rotina',
    textoPredefinidoId: null,
    createdAt: '2026-05-05T11:30:00Z',
  },
  {
    id: '5',
    empresaId: '3',
    dataVisita: '2026-05-08',
    horaVisita: '15:45',
    formularioAssinado: null,
    observacoes: 'Treinamento da equipe',
    textoPredefinidoId: null,
    createdAt: '2026-05-08T15:45:00Z',
  },
];

export default function VisitasScreen() {
  const navigation = useNavigation<VisitasScreenNavigationProp>();
  const db = SQLite.openDatabaseSync('facilite.db');
  
  const [empresas, setEmpresas] = useState<EmpresaComUltimaVisita[]>([]);
  const [pesquisa, setPesquisa] = useState('');
  const [loading, setLoading] = useState(true);
  const [diasAviso, setDiasAviso] = useState(30);
  const [gerandoRelatorio, setGerandoRelatorio] = useState(false);
  const [datasDisponiveis, setDatasDisponiveis] = useState<string[]>([]);
  const [modalDataVisible, setModalDataVisible] = useState(false);

  // Carregar configurações
  useEffect(() => {
    carregarConfiguracoes();
    carregarDatos();
  }, []);

  const carregarConfiguracoes = async () => {
    try {
      // Buscar dias de aviso das configurações
      const result = await db.getAllAsync('SELECT valor FROM configuracoes WHERE chave = "diasAviso"');
      if (result.length > 0) {
        setDiasAviso(parseInt((result as any[])[0].valor) || 30);
      }
    } catch (error) {
      console.log('Configurações não encontradas, usando padrão 30 dias');
    }
  };

  const carregarDatos = async () => {
    setLoading(true);
    try {
      // Buscar empresas
      const empresasDb = MOCK_EMPRESAS; // Temporário - depois substituir por SQLite
      
      // Buscar visitas
      const visitasDb = MOCK_VISITAS; // Temporário - depois substituir por SQLite
      
      // Agrupar visitas por empresa
      const empresasComVisitas: EmpresaComUltimaVisita[] = [];
      
      for (const empresa of empresasDb) {
        // Filtrar visitas da empresa
        const visitasEmpresa = visitasDb.filter(v => v.empresaId === empresa.id);
        
        // Ordenar por data (mais recente primeiro)
        visitasEmpresa.sort((a, b) => new Date(b.dataVisita).getTime() - new Date(a.dataVisita).getTime());
        
        const ultimaVisita = visitasEmpresa.length > 0 ? visitasEmpresa[0] : null;
        
        // Calcular dias desde última visita
        let diasDesdeUltimaVisita = 999;
        let statusAtraso: 'normal' | 'atencao' | 'critico' = 'normal';
        
        if (ultimaVisita) {
          const hoje = new Date();
          const ultimaData = new Date(ultimaVisita.dataVisita);
          const diffTime = hoje.getTime() - ultimaData.getTime();
          diasDesdeUltimaVisita = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diasDesdeUltimaVisita >= diasAviso) {
            statusAtraso = 'atencao';
          }
          if (diasDesdeUltimaVisita >= diasAviso + 15) {
            statusAtraso = 'critico';
          }
        }
        
        empresasComVisitas.push({
          ...empresa,
          ultimaVisita,
          diasDesdeUltimaVisita,
          statusAtraso,
        });
      }
      
      // Ordenar: as que estão há mais dias sem visita no topo
      empresasComVisitas.sort((a, b) => b.diasDesdeUltimaVisita - a.diasDesdeUltimaVisita);
      
      setEmpresas(empresasComVisitas);
      
      // Extrair datas disponíveis para relatório
      const datas = [...new Set(visitasDb.map(v => v.dataVisita))];
      datas.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      setDatasDisponiveis(datas);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados');
    } finally {
      setLoading(false);
    }
  };

  const handleVoltar = () => {
    navigation.goBack();
  };

  const handleNovaVisita = () => {
    navigation.navigate('NovaVisita');
  };

  // Pesquisar empresas
  const empresasFiltradas = empresas.filter(empresa =>
    empresa.codigoReferencia.toLowerCase().includes(pesquisa.toLowerCase()) ||
    empresa.nomeFantasia.toLowerCase().includes(pesquisa.toLowerCase())
  );

  // Agrupar empresas por data da última visita
  const agruparPorData = () => {
    const grupos: { [key: string]: EmpresaComUltimaVisita[] } = {};
    
    for (const empresa of empresasFiltradas) {
      let chave = 'Nunca visitada';
      if (empresa.ultimaVisita) {
        const data = new Date(empresa.ultimaVisita.dataVisita);
        chave = data.toLocaleDateString('pt-BR');
      }
      
      if (!grupos[chave]) {
        grupos[chave] = [];
      }
      grupos[chave].push(empresa);
    }
    
    return grupos;
  };

  // ==================== GERAR RELATÓRIO ====================
  const gerarRelatorioPorData = () => {
    if (datasDisponiveis.length === 0) {
      Alert.alert('Aviso', 'Não há visitas registradas para gerar relatório');
      return;
    }
    
    setModalDataVisible(true);
  };

  const handleSelecionarData = (data: string) => {
    setModalDataVisible(false);
    gerarZipParaData(data);
  };

  const handleFecharModal = () => {
    setModalDataVisible(false);
  };

  const gerarZipParaData = async (data: string) => {
    setGerandoRelatorio(true);
    try {
      // Buscar visitas da data selecionada
      const visitasData = MOCK_VISITAS.filter(v => v.dataVisita === data);
      
      if (visitasData.length === 0) {
        Alert.alert('Aviso', 'Nenhuma visita encontrada para esta data');
        return;
      }
      
      // Criar conteúdo do relatório
      let relatorioContent = `RELATÓRIO DE VISITAS - ${new Date(data).toLocaleDateString('pt-BR')}\n`;
      relatorioContent += `${'='.repeat(50)}\n\n`;
      
      for (const visita of visitasData) {
        const empresa = MOCK_EMPRESAS.find(e => e.id === visita.empresaId);
        relatorioContent += `📋 VISITA\n`;
        relatorioContent += `Empresa: ${empresa?.nomeFantasia || 'N/A'} (${empresa?.codigoReferencia || 'N/A'})\n`;
        relatorioContent += `Data: ${new Date(visita.dataVisita).toLocaleDateString('pt-BR')}\n`;
        relatorioContent += `Horário: ${visita.horaVisita}\n`;
        relatorioContent += `Observações: ${visita.observacoes}\n`;
        relatorioContent += `${'-'.repeat(30)}\n\n`;
      }
      
      // Usar a nova API com Paths.cache
      const fileName = `visitas_${data}.txt`;
      const filePath = `${Paths.cache.uri}${fileName}`;
      const arquivo = new File(filePath);
      
      await arquivo.write(relatorioContent);
      
      // Verificar se o compartilhamento está disponível
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'text/plain',
          dialogTitle: `Enviar relatório de ${new Date(data).toLocaleDateString('pt-BR')}`,
        });
      } else {
        Alert.alert('Erro', 'Compartilhamento não disponível');
      }
      
      // Limpar arquivo temporário
      await arquivo.delete();
      
    } catch (error) {
      console.error('Erro ao gerar arquivo:', error);
      Alert.alert('Erro', 'Não foi possível gerar o relatório');
    } finally {
      setGerandoRelatorio(false);
    }
  };

  // Renderizar cada card
  const renderCard = ({ item }: { item: EmpresaComUltimaVisita }) => {
    const getCardStyle = () => {
      if (item.statusAtraso === 'critico') return styles.cardCritico;
      if (item.statusAtraso === 'atencao') return styles.cardAtencao;
      return styles.cardNormal;
    };
    
    const getStatusText = () => {
      if (!item.ultimaVisita) return '🚫 Nunca visitada';
      if (item.statusAtraso === 'critico') return `⚠️ ${item.diasDesdeUltimaVisita} dias sem visita!`;
      if (item.statusAtraso === 'atencao') return `📢 ${item.diasDesdeUltimaVisita} dias sem visita`;
      return `✅ Última visita: ${new Date(item.ultimaVisita.dataVisita).toLocaleDateString('pt-BR')}`;
    };
    
    return (
      <TouchableOpacity
        style={[styles.card, getCardStyle()]}
        onPress={() => navigation.navigate('DetalhesVisita', { empresa: item, visita: item.ultimaVisita })}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          {/* Logo */}
          <View style={styles.cardLogoContainer}>
            {item.logo ? (
              <Image source={{ uri: item.logo }} style={styles.cardLogo} />
            ) : (
              <View style={styles.cardLogoPlaceholder}>
                <Text style={styles.cardLogoPlaceholderText}>🏢</Text>
              </View>
            )}
          </View>
          
          {/* Informações */}
          <View style={styles.cardInfo}>
            <Text style={styles.cardCodigo}>🔢 {item.codigoReferencia}</Text>
            <Text style={styles.cardNome}>{item.nomeFantasia}</Text>
            <View style={styles.cardContatoContainer}>
              <Text style={styles.cardContatoIcon}>📱</Text>
              <Text style={styles.cardContato}>{item.contato}</Text>
            </View>
            <Text style={[styles.cardStatus, 
              item.statusAtraso === 'critico' && styles.statusCritico,
              item.statusAtraso === 'atencao' && styles.statusAtencao
            ]}>
              {getStatusText()}
            </Text>
          </View>
          
          <Text style={styles.cardArrow}>›</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const grupos = agruparPorData();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FC" />
      
      {/* Cabeçalho */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? 50 : STATUS_BAR_HEIGHT + 8 }]}>
        <TouchableOpacity onPress={handleVoltar} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Visitas</Text>
        <View style={styles.placeholderRight} />
      </View>

      {/* Barra de Pesquisa */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIconLeft}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Pesquisar por código ou nome..."
            placeholderTextColor="#ADB5BD"
            value={pesquisa}
            onChangeText={setPesquisa}
          />
        </View>
      </View>

      {/* Botão Gerar Relatório */}
      <TouchableOpacity 
        style={styles.relatorioButton}
        onPress={gerarRelatorioPorData}
        disabled={gerandoRelatorio}
      >
        {gerandoRelatorio ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Text style={styles.relatorioButtonIcon}>📊</Text>
            <Text style={styles.relatorioButtonText}>Gerar Relatório por Data</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Lista de Visitas */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2463EB" />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      ) : Object.keys(grupos).length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>Nenhuma visita registrada</Text>
          <Text style={styles.emptySubtext}>
            Toque no botão + para registrar uma nova visita
          </Text>
          <TouchableOpacity style={styles.emptyButton} onPress={handleNovaVisita}>
            <Text style={styles.emptyButtonText}>+ Nova Visita</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        >
          {Object.entries(grupos).map(([data, empresasGrupo], index) => (
            <View key={data} style={styles.grupoContainer}>
              <View style={styles.grupoHeader}>
                <Text style={styles.grupoData}>{data === 'Nunca visitada' ? '📅 Nunca visitada' : `📅 ${data}`}</Text>
              </View>
              {empresasGrupo.map((empresa) => (
                <View key={empresa.id} style={styles.cardWrapper}>
                  {renderCard({ item: empresa })}
                </View>
              ))}
              {index < Object.keys(grupos).length - 1 && <View style={styles.grupoDivider} />}
            </View>
          ))}
        </ScrollView>
      )}

      {/* FAB (Botão flutuante +) */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleNovaVisita}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Modal para selecionar data do relatório */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalDataVisible}
        onRequestClose={handleFecharModal}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={handleFecharModal}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📅 Selecione a Data</Text>
            <Text style={styles.modalSubtitle}>
              Escolha a data das visitas para gerar o relatório
            </Text>
            
            <ScrollView style={styles.modalList}>
              {datasDisponiveis.map((data) => (
                <TouchableOpacity
                  key={data}
                  style={styles.modalItem}
                  onPress={() => handleSelecionarData(data)}
                >
                  <Text style={styles.modalItemIcon}>📋</Text>
                  <Text style={styles.modalItemText}>
                    {new Date(data).toLocaleDateString('pt-BR')}
                  </Text>
                  <Text style={styles.modalItemArrow}>→</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={handleFecharModal}
            >
              <Text style={styles.modalCancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
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
  relatorioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2463EB',
    borderRadius: 10,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginVertical: 12,
  },
  relatorioButtonIcon: {
    fontSize: 18,
    color: '#FFFFFF',
    marginRight: 8,
  },
  relatorioButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  grupoContainer: {
    marginBottom: 8,
  },
  grupoHeader: {
    paddingVertical: 8,
    marginTop: 4,
  },
  grupoData: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C757D',
  },
  grupoDivider: {
    height: 1,
    backgroundColor: '#E9ECEF',
    marginVertical: 8,
  },
  cardWrapper: {
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardNormal: {
    borderLeftColor: '#34C759',
    borderLeftWidth: 4,
  },
  cardAtencao: {
    borderLeftColor: '#FF9500',
    borderLeftWidth: 4,
    backgroundColor: '#FFF8F0',
  },
  cardCritico: {
    borderLeftColor: '#FF3B30',
    borderLeftWidth: 4,
    backgroundColor: '#FFF0F0',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  cardLogoContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F8F9FC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  cardLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  cardLogoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardLogoPlaceholderText: {
    fontSize: 24,
  },
  cardInfo: {
    flex: 1,
  },
  cardCodigo: {
    fontSize: 11,
    color: '#6C757D',
    marginBottom: 2,
  },
  cardNome: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  cardContatoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  cardContatoIcon: {
    fontSize: 10,
    marginRight: 4,
    color: '#ADB5BD',
  },
  cardContato: {
    fontSize: 11,
    color: '#4A4A4A',
  },
  cardStatus: {
    fontSize: 11,
    color: '#6C757D',
  },
  statusAtencao: {
    color: '#FF9500',
  },
  statusCritico: {
    color: '#FF3B30',
    fontWeight: '600',
  },
  cardArrow: {
    fontSize: 24,
    color: '#ADB5BD',
    marginLeft: 12,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
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
  modalList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  modalItemIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  modalItemText: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
  },
  modalItemArrow: {
    fontSize: 18,
    color: '#ADB5BD',
  },
  modalCancelButton: {
    backgroundColor: '#F8F9FC',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    marginTop: 8,
  },
  modalCancelButtonText: {
    fontSize: 16,
    color: '#6C757D',
    fontWeight: '600',
  },
});