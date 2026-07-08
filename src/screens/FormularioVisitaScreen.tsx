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

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Image,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  Keyboard,
  Dimensions,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootDrawerParamList } from '../types/navigation';
import { useConsultor } from '../contexts/ConsultorContext';
import CampoEmpresa from '../components/FormularioVisita/CampoEmpresa';
import CampoSolicitante from '../components/FormularioVisita/CampoSolicitante';
import CampoData from '../components/FormularioVisita/CampoData';
import CampoHorario from '../components/FormularioVisita/CampoHorario';
import CampoDescricao from '../components/FormularioVisita/CampoDescricao';
import type { EmpresaDB } from '../database/empresaRepository';
import { db } from '../database/initDatabase'
import { VisitasRepository } from '../database/VisitasRepository';
import DateTimePicker, { DateTimePickerEvent, DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import SignatureScreen from 'react-native-signature-canvas';

const { width, height } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = StatusBar.currentHeight || 0;
const HEADER_HEIGHT = 60;

type FormularioVisitaScreenNavigationProp = DrawerNavigationProp<RootDrawerParamList, 'FormularioVisita'>;

// Tipo para Empresa

// Tipo para Texto Predefinido
type TextoPredefinido = {
  id: string;
  texto: string;
};

export default function FormularioVisitaScreen() {
  const navigation = useNavigation<FormularioVisitaScreenNavigationProp>();
  const route = useRoute<any>();
  const { consultor } = useConsultor();

  
  // Estados das abas
  const [abaAtiva, setAbaAtiva] = useState<'info' | 'assinatura'>('info');
  
  // Estados do formulário
  const [empresaId, setEmpresaId] = useState('');
  const [empresaSelecionada, setEmpresaSelecionada] = useState<EmpresaDB | null>(null);
  const [solicitante, setSolicitante] = useState('');
  const [dataVisita, setDataVisita] = useState(new Date().toLocaleDateString('pt-BR'));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [showHoraPicker, setShowHoraPicker] = useState(false);
  const [horaSelecionada, setHoraSelecionada] = useState(new Date());
  const [horaInicio, setHoraInicio] = useState('');
  const [horaTermino, setHoraTermino] = useState('');
  const [tipoHoraAtual, setTipoHoraAtual] = useState< 'inicio' | 'termino' >('inicio');
  const [descricao, setDescricao] = useState('');
  const [assinatura, setAssinatura] = useState<string | null>(null);
  const [textosPredefinidos, setTextosPredefinidos] = useState<TextoPredefinido[]>([]);
  const [showTextosModal, setShowTextosModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ultimaVisita, setUltimaVisita] = useState<any>(null);
  
  const signatureRef = useRef<any>(null);

  // Carregar textos predefinidos
  useEffect(() => {
    carregarTextosPredefinidos();
  }, []);

  useEffect(() => {
    const empresaParam = route.params?.empresa;

    if (empresaParam) {
      selecionarEmpresa(empresaParam as EmpresaDB);
    }
  }, [route.params?.empresa]);

  const formatarDataBanco = (data: Date) => {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');

    return `${ano}-${mes}-${dia}`;
  };

  const carregarTextosPredefinidos = async () => {
    try {
      const textos = await db.getAllAsync('SELECT id, texto FROM textos_predefinidos ORDER BY id DESC');
      setTextosPredefinidos(textos as TextoPredefinido[]);
    } catch (error) {
      console.log('Erro ao carregar textos predefinidos:', error);
    }
  };

  const selecionarEmpresa = (empresa: EmpresaDB) => {
    setEmpresaSelecionada(empresa);
    setEmpresaId(empresa.id);
    carregarUltimaVisita(empresa.id);
  };

  //Selecionar Data
  const selecionarData = () => {

    if (Platform.OS === 'android') {

      DateTimePickerAndroid.open({
        value: dataSelecionada,
        mode: 'date',
        maximumDate: new Date(),
        onChange: onChangeData,
      });

  } else {

    setShowDatePicker(true);

  }

};

  const onChangeData = (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {

    if (Platform.OS === 'ios') {
      setShowDatePicker(false);
    }

    if (!selectedDate)
      return;

    setDataSelecionada(selectedDate);

    setDataVisita(
      selectedDate.toLocaleDateString(
        'pt-BR'
      )
    );

  };

  //Selecionar Hora
  const selecionarHora = (
  tipo: 'inicio' | 'termino'
) => {

  if (
    Platform.OS === 'android'
  ) {

    DateTimePickerAndroid.open({

      value: horaSelecionada,

      mode: 'time',

      is24Hour: true,

      onChange: (
        event,
        selectedDate
      ) =>
        onChangeHora(
          tipo,
          event,
          selectedDate
        ),

    });

  } else {

    setTipoHoraAtual(
      tipo
    );

    setShowHoraPicker(
      true
    );

  }

};

  const onChangeHora = (
  tipo: 'inicio' | 'termino',
  event: DateTimePickerEvent,
  selectedDate?: Date
) => {

  if (
    Platform.OS === 'ios'
  ) {

    setShowHoraPicker(
      false
    );

  }

  if (
    !selectedDate
  )
    return;

  const hora =
    selectedDate
      .toLocaleTimeString(
        'pt-BR',
        {
          hour: '2-digit',
          minute: '2-digit',
        }
      );

  if (
    tipo ===
    'termino'
  ) {

    if (
      horaInicio
    ) {

      const inicio =
        horaInicio
          .split(':')
          .map(Number);

      const inicioDate =
        new Date();

      inicioDate
        .setHours(
          inicio[0],
          inicio[1]
        );

      if (
        selectedDate <
        inicioDate
      ) {

        Alert.alert(
          'Aviso',
          'O horário final não pode ser menor que o horário inicial'
        );

        return;
      }

    }

    setHoraTermino(
      hora
    );

  } else {

    setHoraInicio(
      hora
    );

  }

  setHoraSelecionada(
    selectedDate
  );

};



// Carregar última visita da empresa (se existir)
const carregarUltimaVisita = async (
  empresaId?: string
) => {

  if (
    !empresaId ||
    empresaId === '' ||
    empresaId === 'undefined' ||
    empresaId === 'null'
  ) {
    setUltimaVisita(null);
    return;
  }

try {

const visitas =
  await db.getAllAsync(
    `
    SELECT *
    FROM visitas
    WHERE empresa_id = ?
    ORDER BY data_visita DESC
    LIMIT 1
    `,
    [String(empresaId)]
  );

  setUltimaVisita(
    visitas.length > 0
      ? visitas[0]
      : null
  );

} catch(error) {

  console.error(
    'Empresa Não Carregada',
    error
  );

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

  // Limpar Formulário quando não salvar

  useFocusEffect(
  useCallback(() => {

    if (!route.params?.empresa) {
      limparFormulario();
    }

    return () => {};

  }, [route.params?.empresa])
);

  function limparFormulario() {

  setEmpresaSelecionada(null);

  setEmpresaId('');

  setSolicitante('');

  setDescricao('');

  setHoraInicio('');

  setHoraTermino('');

  setAssinatura(null);

}

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
      await VisitasRepository.inserir({
        id: visitaId,
        empresa_id: empresaId,
        consultor_id: consultor?.id || null,
        solicitante: solicitante.trim(),
        data_visita: formatarDataBanco(dataSelecionada),
        hora_inicio: horaInicio,
        hora_termino: horaTermino,
        descricao: descricao.trim(),
        status: 'CONCLUIDA',
        assinatura,
        created_at: new Date().toISOString()
      });

      if (Platform.OS === 'web') {
        navigation.navigate('Visitas');
        return;
      }
      
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
    const nomeEmpresa = empresaSelecionada?.nome_fantasia?.replace(/[^a-zA-Z0-9]/g, '_') || 'empresa';
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

  const handleConfirmarAssinaturaWeb = () => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="180">
        <rect width="100%" height="100%" fill="white"/>
        <path d="M60 105 C140 55, 190 145, 270 95 S410 80, 520 110" fill="none" stroke="#1A1A1A" stroke-width="6" stroke-linecap="round"/>
        <line x1="40" y1="135" x2="560" y2="135" stroke="#CED4DA" stroke-width="2"/>
      </svg>
    `;

    setAssinatura(
      `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
    );
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
              {empresaSelecionada ? 'Logo da Empresa' : ''}
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
    <CampoEmpresa
  value={empresaSelecionada}
  onSelect={(empresa) => {
    setEmpresaSelecionada(empresa);
    setEmpresaId(empresa.id);

    carregarUltimaVisita(empresa.id)
  }}
  
/>
<View style={{ marginBottom: 16}} />

      {empresaSelecionada && (
        <View style={styles.selectedEmpresaCard}>
          <Text style={styles.selectedEmpresaCodigo}>🔢 {empresaSelecionada.codigo_referencia}</Text>
          <Text style={styles.selectedEmpresaNome}>{empresaSelecionada.nome_fantasia}</Text>
          <Text style={styles.selectedEmpresaContato}>📱 {empresaSelecionada.contato}</Text>
          <Text style={styles.selectedEmpresaEndereco}>
            📍 {empresaSelecionada.endereco}, {empresaSelecionada.numero} - {empresaSelecionada.cidade}/{empresaSelecionada.estado}
          </Text>
        </View>
      )}

      {/* Solicitante */}
      <CampoSolicitante
        value={solicitante}
  onChange={setSolicitante}
      />

      {/* Data da Visita */}
      <CampoData
        value={dataVisita}
        onPress={selecionarData}
      />

      {/* Hora Início e Hora Término */}
      {Platform.OS === 'web' ? (
        <View style={styles.field}>
          <Text style={styles.label}>
            Horário
            <Text style={styles.required}> *</Text>
          </Text>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 1, marginRight: 8 }]}
              placeholder="Início (HH:MM)"
              value={horaInicio}
              onChangeText={setHoraInicio}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Término (HH:MM)"
              value={horaTermino}
              onChangeText={setHoraTermino}
            />
          </View>
        </View>
      ) : (
        <CampoHorario
          horaInicio={horaInicio}
          horaTermino={horaTermino}
          onHoraInicio={() => 
            selecionarHora(
              'inicio'
            )
          }
          onHoraTermino={() =>
            selecionarHora(
              'termino'
            ) 
          }
        />
      )}

      {/* Descrição do Atendimento */}
      <CampoDescricao
        value={descricao}
        onChange={setDescricao}
      />
    </ScrollView>
  );

  // Aba 2: Assinatura

const renderAssinaturaAba = () => (
  <View style={styles.assinaturaContainer}>
    <Text style={styles.assinaturaTitle}>
      Assinatura do Cliente
    </Text>

    <Text style={styles.assinaturaSubtitle}>
      Peça para o cliente assinar na linha abaixo
    </Text>

    <View style={styles.signatureContainer}>

      {Platform.OS === 'web' ? (
        <View style={styles.webSignatureFallback}>
          <TouchableOpacity
            style={styles.webSignatureButton}
            onPress={handleConfirmarAssinaturaWeb}
          >
            <Text style={styles.webSignatureButtonText}>
              Confirmar Assinatura
            </Text>
          </TouchableOpacity>
          {assinatura && (
            <Text style={styles.webSignatureConfirmed}>
              Assinatura confirmada
            </Text>
          )}
        </View>
      ) : (
        <SignatureScreen
          ref={signatureRef}
          onOK={handleSignature}
          onEmpty={() =>
            Alert.alert(
              'Aviso',
              'Peça para o cliente assinar antes de salvar'
            )
          }
          onEnd={() =>
            signatureRef.current?.readSignature()
          }
          autoClear={false}
          descriptionText=""
          clearText="Limpar"
          confirmText="Confirmar"
          webStyle={signatureWebStyle}
          style={styles.signature}
        />
      )}

    </View>

    <View style={styles.assinaturaBotoes}>
      <TouchableOpacity
        style={styles.clearButton}
        onPress={handleClearSignature}
      >
        <Text style={styles.clearButtonText}>
          🗑️ Limpar Assinatura
        </Text>
      </TouchableOpacity>
    </View>

    {assinatura && (
      <View style={styles.previewContainer}>
        <Text style={styles.previewTitle}>
          Prévia da Assinatura:
        </Text>

        <Image
          source={{ uri: assinatura }}
          style={styles.previewImage}
        />
      </View>
    )}

  </View>
);



  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FC" />
      
      {/* Cabeçalho */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? 50 : STATUS_BAR_HEIGHT + 8 }]}>
        <Pressable onPress={() => navigation.navigate('Visitas' as never)} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Nova Visita</Text>
        <Pressable onPress={handleSalvar} style={styles.saveButton} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#2463EB" />
          ) : (
            <Text style={styles.saveText}>{abaAtiva === 'info' ? 'Próximo' : 'Salvar'}</Text>
          )}
        </Pressable>
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
        {abaAtiva === 'info' ? renderInfoAba() : renderAssinaturaAba()}
      </KeyboardAvoidingView>

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

      {showDatePicker && (
        <DateTimePicker
          value={dataSelecionada}
          mode="date"
          display="default"
          onChange={onChangeData}
          maximumDate={new Date()}
        />
      )}

      {showHoraPicker && (
        <DateTimePicker
          value={horaSelecionada}
          mode="time"
          is24Hour
          onChange={(event, date) =>
            onChangeHora(
              tipoHoraAtual,
              event,
              date
            )
          }
        />
      )}
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
  webSignatureFallback: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webSignatureButton: {
    backgroundColor: '#2463EB',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  webSignatureButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  webSignatureConfirmed: {
    marginTop: 12,
    fontSize: 13,
    color: '#34C759',
    fontWeight: '600',
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
