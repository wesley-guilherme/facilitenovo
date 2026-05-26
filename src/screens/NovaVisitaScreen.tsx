/**
 * TELA: NovaVisitaScreen
 * 
 * FUNÇÃO:
 * Formulário para registrar uma nova visita
 * - Aba 1: Informações da visita
 * - Aba 2: Assinatura digital
 * - Busca de empresas
 * - Textos predefinidos
 * - Validações e regras de negócio
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Image,
  SafeAreaView,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootDrawerParamList } from '../types/navigation';
import { useConsultor } from '../contexts/ConsultorContext';
import { useEmpresa } from '../contexts/EmpresaContext';
import * as SQLite from 'expo-sqlite';
import SignatureScreen from 'react-native-signature-canvas';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const { width, height } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = StatusBar.currentHeight || 0;
const HEADER_HEIGHT = 60;

type NovaVisitaScreenNavigationProp = DrawerNavigationProp<RootDrawerParamList, 'NovaVisita'>;

// Tipo para Empresa
type EmpresaType = {
  id: string;
  codigoReferencia: string;
  nomeFantasia: string;
  logo: string | null;
  contato: string;
  endereco: string;
  numero: string;
  cidade: string;
  estado: string;
  ativo: boolean;
};

// Tipo para Texto Predefinido
type TextoPredefinido = {
  id: string;
  texto: string;
};

export default function NovaVisitaScreen() {
  const navigation = useNavigation<NovaVisitaScreenNavigationProp>();
  const route = useRoute();
  const { consultor } = useConsultor();
  const { empresa: empresaConsultor } = useEmpresa();
  const db = SQLite.openDatabaseSync('facilite.db');
  
  // Estados das abas
  const [abaAtiva, setAbaAtiva] = useState<'info' | 'assinatura'>('info');
  
  // Estados do formulário
  const [empresaId, setEmpresaId] = useState('');
  const [empresaSelecionada, setEmpresaSelecionada] = useState<EmpresaType | null>(null);
  const [solicitante, setSolicitante] = useState('');
  const [dataVisita, setDataVisita] = useState(new Date().toISOString().split('T')[0]);
  const [horaInicio, setHoraInicio] = useState('');
  const [horaTermino, setHoraTermino] = useState('');
  const [descricao, setDescricao] = useState('');
  const [assinatura, setAssinatura] = useState<string | null>(null);
  const [textosPredefinidos, setTextosPredefinidos] = useState<TextoPredefinido[]>([]);
  const [showTextosModal, setShowTextosModal] = useState(false);
  const [buscaEmpresa, setBuscaEmpresa] = useState('');
  const [empresasEncontradas, setEmpresasEncontradas] = useState<EmpresaType[]>([]);
  const [showEmpresaModal, setShowEmpresaModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ultimaVisita, setUltimaVisita] = useState<any>(null);
  
  const signatureRef = useRef<any>(null);

  // Carregar textos predefinidos
  useEffect(() => {
    carregarTextosPredefinidos();
  }, []);

  const carregarTextosPredefinidos = async () => {
    try {
      const textos = await db.getAllAsync('SELECT id, texto FROM textos_predefinidos ORDER BY id DESC');
      setTextosPredefinidos(textos as TextoPredefinido[]);
    } catch (error) {
      console.log('Erro ao carregar textos predefinidos:', error);
    }
  };

  // Buscar empresas
  const buscarEmpresas = async () => {
    if (buscaEmpresa.trim().length < 2) {
      Alert.alert('Aviso', 'Digite pelo menos 2 caracteres para buscar');
      return;
    }
    
    setLoading(true);
    try {
      const empresas = await db.getAllAsync(
        `SELECT * FROM empresas WHERE ativo = 1 AND (codigoReferencia LIKE '%${buscaEmpresa}%' OR nomeFantasia LIKE '%${buscaEmpresa}%')`
      );
      setEmpresasEncontradas(empresas as EmpresaType[]);
      setShowEmpresaModal(true);
    } catch (error) {
      console.error('Erro ao buscar empresas:', error);
      Alert.alert('Erro', 'Não foi possível buscar as empresas');
    } finally {
      setLoading(false);
    }
  };

  const selecionarEmpresa = (empresa: EmpresaType) => {
    setEmpresaSelecionada(empresa);
    setEmpresaId(empresa.id);
    setShowEmpresaModal(false);
    carregarUltimaVisita(empresa.id);
  };

// Carregar última visita da empresa (se existir)
const carregarUltimaVisita = async (empresaId: string) => {
  try {
    const visitas = await db.getAllAsync(
      `SELECT * FROM visitas WHERE empresaId = ? ORDER BY dataVisita DESC LIMIT 1`,
      [empresaId]
    );
    if (visitas.length > 0) {
      const ultima = visitas[0] as any;
      setUltimaVisita(ultima);
      // Preencher com dados da última visita
      setSolicitante(ultima.solicitante || '');
      setDescricao(ultima.descricao || '');
      setAssinatura(ultima.assinatura || null);
    } else {
      setUltimaVisita(null);
      // Limpar campos se não houver visita anterior
      setSolicitante('');
      setDescricao('');
      setAssinatura(null);
    }
  } catch (error) {
    console.error('Erro ao carregar última visita:', error);
  }
};

  // Inserir texto predefinido
  const inserirTextoPredefinido = (texto: string) => {
    setDescricao(prev => prev ? `${prev}\n\n${texto}` : texto);
    setShowTextosModal(false);
  };

  // Validar formulário
  const validarFormulario = (): boolean => {
    if (!empresaSelecionada) {
      Alert.alert('Erro', 'Selecione uma empresa');
      return false;
    }
    if (!solicitante.trim()) {
      Alert.alert('Erro', 'Informe o nome do solicitante');
      return false;
    }
    if (!dataVisita) {
      Alert.alert('Erro', 'Informe a data da visita');
      return false;
    }
    if (!horaInicio) {
      Alert.alert('Erro', 'Informe a hora de início');
      return false;
    }
    if (!horaTermino) {
      Alert.alert('Erro', 'Informe a hora de término');
      return false;
    }
    if (!descricao.trim()) {
      Alert.alert('Erro', 'Informe a descrição do atendimento');
      return false;
    }
    return true;
  };

  // Salvar visita
  const handleSalvar = async () => {
    if (!validarFormulario()) return;
    
    if (abaAtiva === 'info') {
      setAbaAtiva('assinatura');
      return;
    }
    
    if (!assinatura) {
      Alert.alert('Erro', 'A assinatura é obrigatória');
      return;
    }
    
    setLoading(true);
    try {
      const visitaId = Date.now().toString();
      await db.runAsync(
        `INSERT INTO visitas (id, empresaId, solicitante, dataVisita, horaInicio, horaTermino, descricao, assinatura, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          visitaId,
          empresaId,
          solicitante,
          dataVisita,
          horaInicio,
          horaTermino,
          descricao,
          assinatura,
          new Date().toISOString(),
          new Date().toISOString(),
        ]
      );
      
      Alert.alert(
        'Sucesso',
        'Visita registrada com sucesso!',
        [{ text: 'OK', onPress: () => navigation.navigate('Visitas') }]
      );
    } catch (error) {
      console.error('Erro ao salvar visita:', error);
      Alert.alert('Erro', 'Não foi possível salvar a visita');
    } finally {
      setLoading(false);
    }
  };

  // Gerar nome do arquivo
  const gerarNomeArquivo = () => {
    const nomeEmpresa = empresaSelecionada?.nomeFantasia?.replace(/[^a-zA-Z0-9]/g, '_') || 'empresa';
    const dataFormatada = dataVisita.replace(/-/g, '');
    const horaFormatada = horaTermino.replace(/:/g, '');
    return `${nomeEmpresa}_${dataFormatada}_${horaFormatada}`;
  };

  // Compartilhar como imagem
  const handleCompartilhar = async () => {
    // TODO: Implementar geração de PDF/Imagem
    Alert.alert('Em breve', 'Funcionalidade de compartilhamento em desenvolvimento');
  };

  // Renderizar assinatura
  const handleSignature = (signature: string) => {
    setAssinatura(signature);
  };

  const handleClearSignature = () => {
    signatureRef.current?.clearSignature();
    setAssinatura(null);
  };

  // Aba 1: Informações
  const renderInfoAba = () => (
    <ScrollView 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      {/* Logo da Empresa */}
      <View style={styles.logoSection}>
        {empresaSelecionada?.logo ? (
          <Image source={{ uri: empresaSelecionada.logo }} style={styles.logo} />
        ) : (
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoPlaceholderIcon}>🏢</Text>
            <Text style={styles.logoPlaceholderText}>
              {empresaSelecionada ? 'Logo da Empresa' : 'Selecione uma empresa'}
            </Text>
          </View>
        )}
      </View>

      {/* Informações do Consultor */}
      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Consultor</Text>
        <Text style={styles.infoValue}>{consultor?.nome || 'Carregando...'}</Text>
      </View>

      {/* Botão Buscar Empresa */}
      <TouchableOpacity style={styles.buscarButton} onPress={buscarEmpresas}>
        <Text style={styles.buscarButtonIcon}>🔍</Text>
        <Text style={styles.buscarButtonText}>
          {empresaSelecionada ? 'Alterar Empresa' : 'Buscar Empresa'}
        </Text>
      </TouchableOpacity>

      {empresaSelecionada && (
        <View style={styles.selectedEmpresaCard}>
          <Text style={styles.selectedEmpresaCodigo}>🔢 {empresaSelecionada.codigoReferencia}</Text>
          <Text style={styles.selectedEmpresaNome}>{empresaSelecionada.nomeFantasia}</Text>
          <Text style={styles.selectedEmpresaContato}>📱 {empresaSelecionada.contato}</Text>
          <Text style={styles.selectedEmpresaEndereco}>
            📍 {empresaSelecionada.endereco}, {empresaSelecionada.numero} - {empresaSelecionada.cidade}/{empresaSelecionada.estado}
          </Text>
        </View>
      )}

      {/* Solicitante */}
      <View style={styles.field}>
        <Text style={styles.label}>Solicitante <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="Nome do solicitante"
          placeholderTextColor="#ADB5BD"
          value={solicitante}
          onChangeText={setSolicitante}
        />
      </View>

      {/* Data da Visita */}
      <View style={styles.field}>
        <Text style={styles.label}>Data da Visita <Text style={styles.required}>*</Text></Text>
        <TouchableOpacity style={styles.dateButton} onPress={() => {}}>
          <Text style={styles.dateText}>{new Date(dataVisita).toLocaleDateString('pt-BR')}</Text>
        </TouchableOpacity>
      </View>

      {/* Hora Início e Hora Término */}
      <View style={styles.row}>
        <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.label}>Hora Início <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="HH:MM"
            placeholderTextColor="#ADB5BD"
            value={horaInicio}
            onChangeText={setHoraInicio}
            keyboardType="numeric"
          />
        </View>
        <View style={[styles.field, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.label}>Hora Término <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="HH:MM"
            placeholderTextColor="#ADB5BD"
            value={horaTermino}
            onChangeText={setHoraTermino}
            keyboardType="numeric"
          />
        </View>
      </View>

      {/* Descrição do Atendimento */}
      <View style={styles.field}>
        <Text style={styles.label}>Descrição do Atendimento <Text style={styles.required}>*</Text></Text>
        <TouchableOpacity style={styles.textoPredefinidoButton} onPress={() => setShowTextosModal(true)}>
          <Text style={styles.textoPredefinidoButtonText}>📋 Inserir Texto Predefinido</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.textArea}
          placeholder="Descreva os serviços executados..."
          placeholderTextColor="#ADB5BD"
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          value={descricao}
          onChangeText={setDescricao}
        />
      </View>
    </ScrollView>
  );

  // Aba 2: Assinatura
  const renderAssinaturaAba = () => (
    <View style={styles.assinaturaContainer}>
      <Text style={styles.assinaturaTitle}>Assinatura do Cliente</Text>
      <Text style={styles.assinaturaSubtitle}>
        Peça para o cliente assinar na linha abaixo
      </Text>
      
      <View style={styles.signatureContainer}>
        <SignatureScreen
          ref={signatureRef}
          onOK={handleSignature}
          onEmpty={() => Alert.alert('Aviso', 'Por favor, assine no campo acima')}
          descriptionText=""
          clearText="Limpar"
          confirmText="Confirmar"
          webStyle={signatureWebStyle}
          style={styles.signature}
        />
      </View>
      
      <View style={styles.assinaturaBotoes}>
        <TouchableOpacity style={styles.clearButton} onPress={handleClearSignature}>
          <Text style={styles.clearButtonText}>🗑️ Limpar Assinatura</Text>
        </TouchableOpacity>
      </View>
      
      {assinatura && (
        <View style={styles.previewContainer}>
          <Text style={styles.previewTitle}>Prévia da Assinatura:</Text>
          <Image source={{ uri: assinatura }} style={styles.previewImage} />
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FC" />
      
      {/* Cabeçalho */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? 50 : STATUS_BAR_HEIGHT + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nova Visita</Text>
        <TouchableOpacity onPress={handleSalvar} style={styles.saveButton} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#2463EB" />
          ) : (
            <Text style={styles.saveText}>{abaAtiva === 'info' ? 'Próximo' : 'Salvar'}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Abas */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, abaAtiva === 'info' && styles.tabActive]}
          onPress={() => setAbaAtiva('info')}
        >
          <Text style={[styles.tabText, abaAtiva === 'info' && styles.tabTextActive]}>
            📝 Informações
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, abaAtiva === 'assinatura' && styles.tabActive]}
          onPress={() => setAbaAtiva('assinatura')}
        >
          <Text style={[styles.tabText, abaAtiva === 'assinatura' && styles.tabTextActive]}>
            ✍️ Assinatura
          </Text>
        </TouchableOpacity>
      </View>

      {/* Conteúdo da aba */}
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? HEADER_HEIGHT + STATUS_BAR_HEIGHT + 60 : HEADER_HEIGHT + STATUS_BAR_HEIGHT}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          {abaAtiva === 'info' ? renderInfoAba() : renderAssinaturaAba()}
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Modal de seleção de empresa */}
      <Modal
        visible={showEmpresaModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEmpresaModal(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowEmpresaModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecione a Empresa</Text>
            <TextInput
              style={styles.modalSearchInput}
              placeholder="Digite o código ou nome..."
              placeholderTextColor="#ADB5BD"
              value={buscaEmpresa}
              onChangeText={setBuscaEmpresa}
            />
            <TouchableOpacity style={styles.modalSearchButton} onPress={buscarEmpresas}>
              <Text style={styles.modalSearchButtonText}>Buscar</Text>
            </TouchableOpacity>
            <ScrollView style={styles.modalList}>
              {empresasEncontradas.map((empresa) => (
                <TouchableOpacity
                  key={empresa.id}
                  style={styles.modalItem}
                  onPress={() => selecionarEmpresa(empresa)}
                >
                  <Text style={styles.modalItemCodigo}>🔢 {empresa.codigoReferencia}</Text>
                  <Text style={styles.modalItemNome}>{empresa.nomeFantasia}</Text>
                  <Text style={styles.modalItemArrow}>→</Text>
                </TouchableOpacity>
              ))}
              {empresasEncontradas.length === 0 && buscaEmpresa.length >= 2 && (
                <Text style={styles.modalEmptyText}>Nenhuma empresa encontrada</Text>
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal de textos predefinidos */}
      <Modal
        visible={showTextosModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTextosModal(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowTextosModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Textos Predefinidos</Text>
            <ScrollView style={styles.modalList}>
              {textosPredefinidos.map((texto) => (
                <TouchableOpacity
                  key={texto.id}
                  style={styles.modalItem}
                  onPress={() => inserirTextoPredefinido(texto.texto)}
                >
                  <Text style={styles.modalItemTexto}>{texto.texto}</Text>
                  <Text style={styles.modalItemArrow}>→</Text>
                </TouchableOpacity>
              ))}
              {textosPredefinidos.length === 0 && (
                <Text style={styles.modalEmptyText}>Nenhum texto predefinido cadastrado</Text>
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const signatureWebStyle = `
  .m-signature-pad {
    box-shadow: none;
    border: 1px solid #E9ECEF;
    border-radius: 12px;
  }
  .m-signature-pad--body {
    border: none;
  }
  .m-signature-pad--body canvas {
    width: 100%;
    height: 100%;
  }
`;

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
    fontSize: 18,
    fontWeight: '600',
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#2463EB',
  },
  tabText: {
    fontSize: 14,
    color: '#6C757D',
  },
  tabTextActive: {
    color: '#2463EB',
    fontWeight: '600',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  logoSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPlaceholderIcon: {
    fontSize: 32,
  },
  logoPlaceholderText: {
    fontSize: 10,
    color: '#6C757D',
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  infoLabel: {
    fontSize: 12,
    color: '#6C757D',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  buscarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2463EB',
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 16,
  },
  buscarButtonIcon: {
    fontSize: 18,
    color: '#FFFFFF',
    marginRight: 8,
  },
  buscarButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  selectedEmpresaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  selectedEmpresaCodigo: {
    fontSize: 12,
    color: '#6C757D',
    marginBottom: 4,
  },
  selectedEmpresaNome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  selectedEmpresaContato: {
    fontSize: 12,
    color: '#4A4A4A',
    marginBottom: 2,
  },
  selectedEmpresaEndereco: {
    fontSize: 12,
    color: '#6C757D',
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
  required: {
    color: '#FF3B30',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1A1A1A',
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1A1A1A',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  dateButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  dateText: {
    fontSize: 15,
    color: '#1A1A1A',
  },
  row: {
    flexDirection: 'row',
  },
  textoPredefinidoButton: {
    backgroundColor: '#F8F9FC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  textoPredefinidoButtonText: {
    fontSize: 12,
    color: '#2463EB',
  },
  assinaturaContainer: {
    flex: 1,
    padding: 16,
  },
  assinaturaTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  assinaturaSubtitle: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 20,
    textAlign: 'center',
  },
  signatureContainer: {
    height: 250,
    marginBottom: 16,
  },
  signature: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  assinaturaBotoes: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  clearButton: {
    backgroundColor: '#F8F9FC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  clearButtonText: {
    fontSize: 14,
    color: '#FF3B30',
  },
  previewContainer: {
    backgroundColor: '#F8F9FC',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  previewImage: {
    width: '100%',
    height: 100,
    resizeMode: 'contain',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalSearchInput: {
    backgroundColor: '#F8F9FC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 12,
  },
  modalSearchButton: {
    backgroundColor: '#2463EB',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  modalSearchButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalList: {
    maxHeight: 400,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  modalItemCodigo: {
    fontSize: 12,
    color: '#6C757D',
    marginRight: 8,
  },
  modalItemNome: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
  },
  modalItemTexto: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
  },
  modalItemArrow: {
    fontSize: 16,
    color: '#ADB5BD',
  },
  modalEmptyText: {
    textAlign: 'center',
    color: '#6C757D',
    paddingVertical: 20,
  },
});