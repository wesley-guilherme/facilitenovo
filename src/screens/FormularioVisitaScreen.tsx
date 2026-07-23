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
  useWindowDimensions,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootDrawerParamList } from '../types/navigation';
import { useConsultor } from '../contexts/ConsultorContext';
import { useEmpresa } from '../contexts/EmpresaContext';
import CampoSolicitante from '../components/FormularioVisita/CampoSolicitante';
import CampoData from '../components/FormularioVisita/CampoData';
import CampoHorario from '../components/FormularioVisita/CampoHorario';
import CampoDescricao from '../components/FormularioVisita/CampoDescricao';
import FormularioAssinadoPreview from '../components/FormularioVisita/FormularioAssinadoPreview';
import type { EmpresaDB } from '../database/empresaRepository';
import { db } from '../database/initDatabase'
import { VisitasRepository, VisitaDB } from '../database/VisitasRepository';
import DateTimePicker, { DateTimePickerEvent, DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import SignatureScreen from 'react-native-signature-canvas';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { captureRef } from 'react-native-view-shot';

const STATUS_BAR_HEIGHT = StatusBar.currentHeight || 0;
const HEADER_HEIGHT = 60;
const PDF_A4_WIDTH = 595;
const PDF_A4_HEIGHT = 842;

// Tipo da navegacao desta tela no drawer.
type FormularioVisitaScreenNavigationProp = DrawerNavigationProp<RootDrawerParamList, 'FormularioVisita'>;

export default function FormularioVisitaScreen() {
  const navigation = useNavigation<FormularioVisitaScreenNavigationProp>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { consultor } = useConsultor();
  const { empresa: empresaConsultor } = useEmpresa();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const telaEmPaisagem = windowWidth > windowHeight;
  const chaveAssinatura = telaEmPaisagem
    ? `assinatura-paisagem-${Math.round(windowWidth)}x${Math.round(windowHeight)}`
    : `assinatura-retrato-${Math.round(windowWidth)}x${Math.round(windowHeight)}`;
  const alturaCampoAssinatura = telaEmPaisagem
    ? Math.min(Math.max(windowHeight - 260, 170), 260)
    : Math.min(Math.max(windowWidth * 0.62, 300), 380);

  
  // Controla se o usuario esta nos dados da visita ou na assinatura.
  const [abaAtiva, setAbaAtiva] = useState<'info' | 'assinatura'>('info');
  
  // Estados do formulário
  const [empresaId, setEmpresaId] = useState('');
  const [empresaSelecionada, setEmpresaSelecionada] = useState<EmpresaDB | null>(null);
  const [protocoloAtendimento, setProtocoloAtendimento] = useState('');
  const [solicitante, setSolicitante] = useState('');
  const [dataVisita, setDataVisita] = useState(new Date().toLocaleDateString('pt-BR'));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [dataPickerTemp, setDataPickerTemp] = useState(new Date());
  const [showHoraPicker, setShowHoraPicker] = useState(false);
  const [horaPickerTemp, setHoraPickerTemp] = useState(new Date());
  const [horaPickerKey, setHoraPickerKey] = useState(0);
  const [horaInicio, setHoraInicio] = useState('');
  const [horaTermino, setHoraTermino] = useState('');
  const [tipoHoraAtual, setTipoHoraAtual] = useState< 'inicio' | 'termino' >('inicio');
  const [descricao, setDescricao] = useState('');
  const [assinatura, setAssinatura] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ultimaVisita, setUltimaVisita] = useState<VisitaDB | null>(null);
  const [showFormularioFinal, setShowFormularioFinal] = useState(false);
  const [compartilhandoPdf, setCompartilhandoPdf] = useState(false);
  const [compartilhandoPng, setCompartilhandoPng] = useState(false);
  const [scrollAssinaturaAtivo, setScrollAssinaturaAtivo] = useState(true);
  
  // Refs usadas para assinatura, captura do documento e foco entre campos.
  const signatureRef = useRef<any>(null);
  const infoScrollRef = useRef<ScrollView>(null);
  const formularioDocumentoPngRef = useRef<View>(null);
  const protocoloInputRef = useRef<TextInput>(null);
  const solicitanteInputRef = useRef<TextInput>(null);
  const dataInputRef = useRef<TextInput>(null);
  const horaInicioInputRef = useRef<TextInput>(null);
  const horaTerminoInputRef = useRef<TextInput>(null);
  const descricaoInputRef = useRef<TextInput>(null);
  // Ajusta textos dos botoes conforme novo formulario ou atualizacao.
  const formularioJaSalvo = !!ultimaVisita;
  const textoAcaoFormulario = formularioJaSalvo ? 'Atualizar' : 'Salvar';
  const textoBotaoPrincipal = abaAtiva === 'info' ? 'Próximo' : textoAcaoFormulario;

  // Seleciona automaticamente a empresa recebida por navegacao.
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

  const obterDataDigitadaValida = () => {
    const dataNormalizada = dataVisita.trim();
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dataNormalizada);

    if (!match) {
      return null;
    }

    const dia = Number(match[1]);
    const mes = Number(match[2]);
    const ano = Number(match[3]);
    const data = new Date(ano, mes - 1, dia);

    const dataExiste =
      data.getFullYear() === ano &&
      data.getMonth() === mes - 1 &&
      data.getDate() === dia;

    if (!dataExiste) {
      return null;
    }

    return data;
  };

  const obterMinutosDaHora = (hora: string) => {
    const [horas, minutos] = hora.split(':').map(Number);

    if (Number.isNaN(horas) || Number.isNaN(minutos)) {
      return null;
    }

    return horas * 60 + minutos;
  };

  const formatarHoraDate = (data: Date) =>
    data.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });

  const horarioTerminoValido = (horaTerminoSelecionada: string) => {
    const minutosInicio = obterMinutosDaHora(horaInicio);
    const minutosTermino = obterMinutosDaHora(horaTerminoSelecionada);

    return (
      minutosInicio === null ||
      minutosTermino === null ||
      minutosTermino > minutosInicio
    );
  };

  const criarDataComHora = (hora?: string) => {
    const data = new Date();
    const minutos = hora ? obterMinutosDaHora(hora) : null;

    if (minutos !== null) {
      data.setHours(Math.floor(minutos / 60), minutos % 60, 0, 0);
      return data;
    }

    data.setSeconds(0, 0);
    return data;
  };

  const obterHoraInicialPicker = (tipo: 'inicio' | 'termino') => {
    if (tipo === 'inicio') {
      return criarDataComHora(horaInicio);
    }

    return criarDataComHora(horaTermino || horaInicio);
  };

  const obterDataVisitaBanco = () => {
    return formatarDataBanco(
      obterDataDigitadaValida() || dataSelecionada
    );
  };

  const selecionarEmpresa = (empresa: EmpresaDB) => {
    setAbaAtiva('info');
    setEmpresaSelecionada(empresa);
    setEmpresaId(empresa.id);
    carregarUltimaVisita(empresa.id);
  };

  //Selecionar Data
  const selecionarData = () => {
    Keyboard.dismiss();

    if (Platform.OS === 'android') {

      DateTimePickerAndroid.open({
        value: dataSelecionada,
        mode: 'date',
        maximumDate: new Date(),
        onChange: onChangeData,
      });

  } else {

    setDataPickerTemp(dataSelecionada);
    setTimeout(() => {
      setShowDatePicker(true);
    }, 120);

  }

};

  const onChangeData = (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {

    if (Platform.OS === 'ios') {
      if (selectedDate) {
        setDataPickerTemp(selectedDate);
      }
      return;
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

  const confirmarDataIos = () => {
    setDataSelecionada(dataPickerTemp);
    setDataVisita(dataPickerTemp.toLocaleDateString('pt-BR'));
    setShowDatePicker(false);
  };

  //Selecionar Hora
  const selecionarHora = (
  tipo: 'inicio' | 'termino'
) => {
  Keyboard.dismiss();
  const horaInicialPicker = obterHoraInicialPicker(tipo);

  if (
    Platform.OS === 'android'
  ) {

    DateTimePickerAndroid.open({

      value: horaInicialPicker,

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

    setHoraPickerTemp(
      horaInicialPicker
    );

    setHoraPickerKey((key) => key + 1);

    setTimeout(() => {
      setShowHoraPicker(
        true
      );
    }, 120);

  }

};

  const onChangeHora = (
  tipo: 'inicio' | 'termino',
  event: DateTimePickerEvent,
  selectedDate?: Date
) => {

  if (Platform.OS === 'ios') {
    if (selectedDate) {
      setHoraPickerTemp(selectedDate);
    }
    return;
  }

  if (!selectedDate) {
    return;
  }

  const hora = formatarHoraDate(selectedDate);

  if (tipo === 'termino') {
    if (horaInicio && !horarioTerminoValido(hora)) {
      Alert.alert(
        'Aviso',
        'O hor\u00e1rio final precisa ser maior que o hor\u00e1rio inicial'
      );
      return;
    }

    setHoraTermino(hora);
    return;
  }

  setHoraInicio(hora);

};

  const confirmarHoraIos = () => {
    const selectedDate = horaPickerTemp;
    const hora = formatarHoraDate(selectedDate);

    if (tipoHoraAtual === 'termino' && horaInicio && !horarioTerminoValido(hora)) {
      Alert.alert(
        'Aviso',
        'O hor\u00e1rio final precisa ser maior que o hor\u00e1rio inicial'
      );
      return;
    }

    if (tipoHoraAtual === 'termino') {
      setHoraTermino(hora);
    } else {
      setHoraInicio(hora);
    }

    setShowHoraPicker(false);
  };
const limparDadosDaVisita = () => {
  setProtocoloAtendimento('');
  setSolicitante('');
  setHoraInicio('');
  setHoraTermino('');
  setDescricao('');
  setAssinatura(null);
};

const criarDataDeBanco = (data: string) => {
  const partes = data.split('-').map(Number);

  if (partes.length === 3) {
    const [ano, mes, dia] = partes;
    return new Date(ano, mes - 1, dia);
  }

  return new Date(data);
};

const preencherComUltimaVisita = (visita: VisitaDB) => {
  const dataBanco = criarDataDeBanco(visita.data_visita);

  setSolicitante(visita.solicitante || '');
  setProtocoloAtendimento(visita.protocolo_atendimento || '');
  setDataSelecionada(dataBanco);
  setDataVisita(dataBanco.toLocaleDateString('pt-BR'));
  setHoraInicio(visita.hora_inicio || '');
  setHoraTermino(visita.hora_termino || '');
  setDescricao(visita.descricao || '');
  setAssinatura(visita.assinatura || null);
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
    limparDadosDaVisita();
    return;
  }

try {

const visita =
  await VisitasRepository.buscarUltimoFormulario(
    String(empresaId)
  );

  setUltimaVisita(
    visita
  );

  if (visita) {
    preencherComUltimaVisita(visita);
  } else {
    limparDadosDaVisita();
  }

} catch(error) {

  console.error(
    'Empresa Não Carregada',
    error
  );

}

};


  const empresaConsultorCadastrada = () => {
    return Boolean(
      empresaConsultor.nome.trim() &&
      empresaConsultor.endereco.trim() &&
      empresaConsultor.numero.trim() &&
      empresaConsultor.bairro.trim() &&
      empresaConsultor.cidade.trim() &&
      empresaConsultor.estado.trim() &&
      empresaConsultor.email.trim() &&
      empresaConsultor.logoPequena &&
      empresaConsultor.logoMedia
    );
  };

  const validarEmpresaConsultor = () => {
    if (empresaConsultorCadastrada()) {
      return true;
    }

    Alert.alert(
      'Empresa do consultor obrigatoria',
      'Cadastre a empresa do consultor com as duas logos antes de salvar ou atualizar o formulario de visita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cadastrar',
          onPress: () => navigation.navigate('EmpresaConsultor'),
        },
      ]
    );

    return false;
  };

  const consultorCadastrado = () => {
    return Boolean(
      consultor.nome.trim() &&
      consultor.email.trim() &&
      consultor.whatsapp.trim() &&
      consultor.rota.trim()
    );
  };

  const validarPerfilConsultor = () => {
    if (consultorCadastrado()) {
      return true;
    }

    Alert.alert(
      'Perfil do consultor obrigatorio',
      'Cadastre o perfil do consultor antes de salvar ou atualizar o formulario de visita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cadastrar',
          onPress: () => navigation.navigate('EditarConsultor', { consultor }),
        },
      ]
    );

    return false;
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
    if (!obterDataDigitadaValida()) {
      Alert.alert('Erro', 'Informe uma data valida no formato DD/MM/AAAA');
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

  const abrirAbaAssinatura = () => {
    if (!validarFormulario()) {
      return;
    }

    setAbaAtiva('assinatura');
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

  setAbaAtiva('info');

  limparDadosDaVisita();

  setUltimaVisita(null);

}

  // Salvar ou atualizar o formulário único da empresa
  const handleSalvar = async () => {
    if (abaAtiva === 'info') {
      abrirAbaAssinatura();
      return;
    }

    if (!validarFormulario()) return;
    
    if (!validarPerfilConsultor()) {
      return;
    }
    if (!validarEmpresaConsultor()) {
      return;
    }

    if (!assinatura) {
      Alert.alert('Erro', 'A assinatura é obrigatória');
      return;
    }
    
    setLoading(true);
    try {
      const visitaId = Date.now().toString();
      await VisitasRepository.salvarFormularioUnico({
        id: visitaId,
        empresa_id: empresaId,
        consultor_id: consultor?.id || null,
        protocolo_atendimento: protocoloAtendimento.trim() || null,
        solicitante: solicitante.trim(),
        data_visita: obterDataVisitaBanco(),
        hora_inicio: horaInicio,
        hora_termino: horaTermino,
        descricao: descricao.trim(),
        status: 'CONCLUIDA',
        assinatura,
        created_at: new Date().toISOString()
      });

      setShowFormularioFinal(true);

      if (Platform.OS === 'web') {
        return;
      }
      
      Alert.alert(
        'Sucesso',
        formularioJaSalvo
          ? 'Formulário atualizado com sucesso!'
          : 'Formulário salvo com sucesso!',
        [{ text: 'OK', onPress: () => setShowFormularioFinal(true) }]
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

  const escaparHtml = (valor?: string | null) =>
    String(valor || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/\n/g, '<br />');

  const normalizarNomeArquivo = (valor?: string | null) => {
    const normalizado = String(valor || 'empresa')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase();

    return normalizado || 'empresa';
  };

  const obterDataParaNomeArquivo = () => {
    const partes = dataVisita.split('/');

    if (partes.length === 3) {
      const [dia, mes, ano] = partes;
      return `${dia.padStart(2, '0')}${mes.padStart(2, '0')}${ano.slice(-2)}`;
    }

    return new Date()
      .toLocaleDateString('pt-BR')
      .replace(/\D/g, '')
      .slice(0, 6);
  };

  const gerarNomeArquivoPdf = () =>
    `${normalizarNomeArquivo(empresaSelecionada?.nome_fantasia)}${obterDataParaNomeArquivo()}.pdf`;

  const gerarNomeArquivoPng = () =>
    `${normalizarNomeArquivo(empresaSelecionada?.nome_fantasia)}${obterDataParaNomeArquivo()}.png`;

  const obterMimeImagem = (uri: string) => {
    const uriLimpa = uri.split('?')[0].toLowerCase();

    if (uriLimpa.endsWith('.jpg') || uriLimpa.endsWith('.jpeg')) {
      return 'image/jpeg';
    }

    if (uriLimpa.endsWith('.webp')) {
      return 'image/webp';
    }

    return 'image/png';
  };

  const resolverImagemParaPdf = async (uri?: string | null) => {
    if (!uri) {
      return null;
    }

    if (uri.startsWith('data:') || uri.startsWith('http')) {
      return uri;
    }

    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      return `data:${obterMimeImagem(uri)};base64,${base64}`;
    } catch (error) {
      console.warn('Nao foi possivel preparar imagem para PDF:', error);
      return uri;
    }
  };

  const enderecoConsultor = () => {
    const ruaNumero = [empresaConsultor.endereco, empresaConsultor.numero]
      .filter(Boolean)
      .join(', ');
    const cidadeEstado = [empresaConsultor.cidade, empresaConsultor.estado]
      .filter(Boolean)
      .join('/');

    return [ruaNumero || 'Endereço Não Informado', empresaConsultor.bairro, cidadeEstado]
      .filter(Boolean)
      .join(' - ');
  };

  const gerarLogoHtml = (marcaDagua = false, logoPdf?: string | null) => {
    const logo = logoPdf ?? (marcaDagua ? empresaConsultor.logoMedia : empresaConsultor.logoPequena);

    if (logo) {
      return `<img src="${escaparHtml(logo)}" class="${marcaDagua ? 'watermark-img' : 'header-logo-img'}" />`;
    }

    return `
      <div class="${marcaDagua ? 'test-watermark' : 'test-logo'}">
        <div class="${marcaDagua ? 'test-watermark-icon' : 'test-logo-icon'}">+</div>
        <div>
          <div class="${marcaDagua ? 'test-watermark-name' : 'test-logo-name'}">FACILITE</div>
          <div class="${marcaDagua ? 'test-watermark-sub' : 'test-logo-sub'}">CONSULTORIA</div>
        </div>
      </div>
    `;
  };

  const gerarAssinaturaHtml = () => {
    if (assinatura && !assinatura.startsWith('data:image/svg')) {
      return `<img src="${escaparHtml(assinatura)}" class="signature-img" />`;
    }

    return '<div class="signature-fallback">Assinatura confirmada</div>';
  };

  const gerarHtmlFormularioPdf = async () => {
    const logoPequenaPdf = await resolverImagemParaPdf(empresaConsultor.logoPequena);
    const logoMediaPdf = await resolverImagemParaPdf(empresaConsultor.logoMedia);

    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          @page { margin: 18px; size: A4; }
          * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #111827; background-color: #ffffff; }
          .document { width: 100%; border: 1px solid #D7DEEA; border-radius: 8px; overflow: hidden; padding: 0 18px 18px; }
          .top-bar { height: 8px; margin: 0 -18px 14px; background-color: #1769AA; }
          .header { display: flex; min-height: 110px; gap: 16px; padding-bottom: 12px; margin-bottom: 12px; border-bottom: 1px solid #E4E8F0; }
          .brand { width: 178px; display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding: 6px 0; }
          .logo-box { width: 150px; height: 52px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
          .header-logo-img { width: auto; height: auto; max-width: 150px; max-height: 52px; object-fit: contain; }
          .test-logo { width: 150px; height: 52px; display: flex; align-items: center; justify-content: center; gap: 9px; }
          .test-logo-icon { width: 30px; height: 30px; border-radius: 15px; background-color: #1769AA; color: white; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 800; }
          .test-logo-name { color: #1769AA; font-size: 20px; line-height: 22px; font-weight: 800; }
          .test-logo-sub { color: #6B7280; font-size: 9px; line-height: 11px; font-weight: 800; letter-spacing: 2px; }
          .contact { min-height: 44px; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; color: #4B5563; font-size: 11px; line-height: 15px; text-align: center; }
          .company { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 8px; text-align: center; }
          .company-name { max-width: 310px; font-size: 22px; line-height: 27px; font-weight: 800; margin-bottom: 6px; }
          .company-address { color: #4B5563; font-size: 13px; line-height: 17px; }
          .protocol { background-color: #EEF6FD; border-left: 5px solid #1769AA; border-radius: 8px; padding: 10px 14px; margin-bottom: 12px; }
          .protocol-label { color: #1769AA; font-size: 11px; font-weight: 800; margin-bottom: 4px; }
          .protocol-value { font-size: 18px; font-weight: 800; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 12px; margin-bottom: 12px; }
          .label { color: #6B7280; font-size: 10px; font-weight: 800; margin-bottom: 3px; }
          .value { min-height: 30px; border: 1px solid #DDE3EE; border-radius: 6px; padding: 6px 8px; background-color: #FAFBFD; font-size: 13px; }
          .section { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
          .rule { flex: 1; height: 1px; background-color: #DDE3EE; }
          .section-title { font-size: 15px; font-weight: 800; }
          .description { position: relative; min-height: 210px; border: 1px solid #DDE3EE; border-radius: 8px; padding: 14px; margin-bottom: 12px; overflow: hidden; }
          .description-text { position: relative; z-index: 1; font-size: 13px; line-height: 20px; color: #1F2937; }
          .watermark-img { position: absolute; top: 24px; left: 50%; margin-left: -240px; width: 480px; height: 170px; object-fit: contain; opacity: 0.09; }
          .test-watermark { position: absolute; top: 54px; left: 50%; transform: translateX(-50%); width: 480px; height: 120px; display: flex; align-items: center; justify-content: center; gap: 12px; opacity: 0.09; overflow: hidden; }
          .test-watermark-icon { width: 78px; height: 78px; border-radius: 39px; background-color: #1769AA; color: white; display: flex; align-items: center; justify-content: center; font-size: 52px; font-weight: 800; }
          .test-watermark-name { color: #1769AA; font-size: 74px; line-height: 78px; font-weight: 800; }
          .test-watermark-sub { color: #6B7280; font-size: 20px; line-height: 23px; font-weight: 800; letter-spacing: 4px; }
          .message { min-height: 54px; display: flex; align-items: center; justify-content: center; background-color: #1769AA; color: white; border-radius: 8px; padding: 10px 14px; margin-bottom: 14px; text-align: center; font-size: 12px; line-height: 17px; font-weight: 600; }
          .signature { border: 1px solid #E4E8F0; border-radius: 8px; padding: 12px 14px 12px; background-color: #FAFBFD; text-align: center; }
          .signature-img { width: 70%; height: 72px; object-fit: contain; margin-bottom: -12px; }
          .signature-fallback { font-size: 20px; color: #111827; font-style: italic; margin-bottom: 10px; }
          .signature-line { width: 76%; border-bottom: 1px solid #111827; margin: 0 auto 6px; }
          .signature-label { font-size: 12px; font-weight: 800; }
        </style>
      </head>
      <body>
        <main class="document">
          <div class="top-bar"></div>
          <section class="header">
            <div class="brand">
              <div class="logo-box">${gerarLogoHtml(false, logoPequenaPdf)}</div>
              <div class="contact">
                ${empresaConsultor.telefone ? `<div>Tel: ${escaparHtml(empresaConsultor.telefone)}</div>` : ''}
                ${empresaConsultor.celular ? `<div>Cel: ${escaparHtml(empresaConsultor.celular)}</div>` : ''}
                ${empresaConsultor.email ? `<div>${escaparHtml(empresaConsultor.email)}</div>` : ''}
              </div>
            </div>
            <div class="company">
              <div class="company-name">${escaparHtml(empresaConsultor.nome || 'Empresa do Consultor')}</div>
              <div class="company-address">${escaparHtml(enderecoConsultor())}</div>
            </div>
          </section>
          <section class="protocol">
            <div class="protocol-label">EMPRESA ATENDIDA</div>
            <div class="protocol-value">${escaparHtml(empresaSelecionada?.nome_fantasia || 'Nao informada')}</div>
          </section>
          <section class="grid">
            <div><div class="label">Consultor</div><div class="value">${escaparHtml(consultor?.nome || 'Não Informado')}</div></div>
            <div><div class="label">Data da visita</div><div class="value">${escaparHtml(dataVisita)}</div></div>
            <div><div class="label">Protocolo de Atendimento</div><div class="value">${escaparHtml(protocoloAtendimento.trim() || 'Não Informado')}</div></div>
            <div><div class="label">Solicitante</div><div class="value">${escaparHtml(solicitante || 'Não Informado')}</div></div>
            <div><div class="label">Hor&aacute;rio de In&iacute;cio</div><div class="value">${escaparHtml(horaInicio || '--:--')}</div></div>
            <div><div class="label">Hor&aacute;rio de T&eacute;rmino</div><div class="value">${escaparHtml(horaTermino || '--:--')}</div></div>
          </section>
          <section class="section">
            <div class="rule"></div>
            <div class="section-title">DESCRIÇÃO DO ATENDIMENTO</div>
            <div class="rule"></div>
          </section>
          <section class="description">
            ${gerarLogoHtml(true, logoMediaPdf)}
            <div class="description-text">${escaparHtml(descricao)}</div>
          </section>
          <section class="message">
            ${escaparHtml(empresaConsultor.mensagemFormulario || 'O cliente declara que os procedimentos acima relacionados foram executados e concorda com as informacoes descritas neste formulario.')}
          </section>
          <section class="signature">
            ${gerarAssinaturaHtml()}
            <div class="signature-line"></div>
            <div class="signature-label">Assinatura do Cliente</div>
          </section>
        </main>
      </body>
    </html>
  `;
  };

  const compartilharPdf = async () => {
    if (compartilhandoPdf) {
      return;
    }

    try {
      setCompartilhandoPdf(true);

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Erro', 'Compartilhamento nao disponivel neste dispositivo');
        return;
      }

      const pdf = await Print.printToFileAsync({
        html: await gerarHtmlFormularioPdf(),
        width: PDF_A4_WIDTH,
        height: PDF_A4_HEIGHT,
        base64: false,
      });

      const nomeArquivo = gerarNomeArquivoPdf();
      const destino = `${FileSystem.cacheDirectory}${nomeArquivo}`;

      await FileSystem.copyAsync({
        from: pdf.uri,
        to: destino,
      });

      await Sharing.shareAsync(destino, {
        mimeType: 'application/pdf',
        dialogTitle: 'Compartilhar formulario em PDF',
        UTI: 'com.adobe.pdf',
      });
    } catch (error) {
      console.error('Erro ao compartilhar PDF:', error);
      Alert.alert('Erro', 'Nao foi possivel gerar o PDF. Tente novamente.');
    } finally {
      setCompartilhandoPdf(false);
    }
  };

  const compartilharPng = async () => {
    if (compartilhandoPng) {
      return;
    }

    try {
      setCompartilhandoPng(true);

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Erro', 'Compartilhamento nao disponivel neste dispositivo');
        return;
      }

      if (!formularioDocumentoPngRef.current) {
        Alert.alert('Erro', 'Formulario ainda nao esta pronto para compartilhar');
        return;
      }

      const capturaUri = await captureRef(formularioDocumentoPngRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      const nomeArquivo = gerarNomeArquivoPng();
      const destino = `${FileSystem.cacheDirectory}${nomeArquivo}`;

      await FileSystem.copyAsync({
        from: capturaUri,
        to: destino,
      });

      await Sharing.shareAsync(destino, {
        mimeType: 'image/png',
        dialogTitle: 'Compartilhar formulario em PNG',
        UTI: 'public.png',
      });
    } catch (error) {
      console.error('Erro ao compartilhar PNG:', error);
      Alert.alert('Erro', 'Nao foi possivel gerar o PNG. Tente novamente.');
    } finally {
      setCompartilhandoPng(false);
    }
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

  const fecharFormularioFinal = () => {
    setShowFormularioFinal(false);
    navigation.navigate('Visitas');
  };

  const handleClearSignature = () => {
    signatureRef.current?.clearSignature();
    setAssinatura(null);
  };

  const scrollInfoParaCampo = (y: number) => {
    setTimeout(() => {
      infoScrollRef.current?.scrollTo({
        y,
        animated: true,
      });
    }, Platform.OS === 'ios' ? 320 : 120);
  };

  // Aba 1: Informações
  const renderInfoAba = () => (
    <ScrollView 
      ref={infoScrollRef}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'none'}
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
  

      {/* Empresa vinculada ao formulario */}
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

      <View style={styles.field}>
        <Text style={styles.label}>
          Protocolo de Atendimento
        </Text>
        <TextInput
          ref={protocoloInputRef}
          style={styles.input}
          onFocus={() => scrollInfoParaCampo(220)}
          placeholder="Numero do protocolo, se houver"
          placeholderTextColor="#ADB5BD"
          value={protocoloAtendimento}
          onChangeText={setProtocoloAtendimento}
          returnKeyType="next"
          onSubmitEditing={() => solicitanteInputRef.current?.focus()}
          blurOnSubmit={false}
        />
      </View>

      {/* Solicitante */}
      <CampoSolicitante
        value={solicitante}
        onChange={setSolicitante}
        onFocus={() => scrollInfoParaCampo(300)}
        inputRef={solicitanteInputRef}
        onSubmitEditing={() => {
          if (Platform.OS === 'web') {
            dataInputRef.current?.focus();
            return;
          }

          descricaoInputRef.current?.focus();
        }}
      />

      {/* Data da Visita */}
      {Platform.OS === 'web' ? (
        <View style={styles.field}>
          <Text style={styles.label}>
            Data da Visita
            <Text style={styles.required}> *</Text>
          </Text>
          <TextInput
            ref={dataInputRef}
            style={styles.input}
            onFocus={() => scrollInfoParaCampo(380)}
            placeholder="DD/MM/AAAA"
            value={dataVisita}
            onChangeText={setDataVisita}
            returnKeyType="next"
            onSubmitEditing={() => horaInicioInputRef.current?.focus()}
            blurOnSubmit={false}
          />
        </View>
      ) : (
        <CampoData
          value={dataVisita}
          onPress={selecionarData}
        />
      )}

      {/* Hora Início e Hora Término */}
      {Platform.OS === 'web' ? (
        <View style={styles.field}>
          <Text style={styles.label}>
            Horário
            <Text style={styles.required}> *</Text>
          </Text>
          <View style={styles.row}>
            <TextInput
              ref={horaInicioInputRef}
              style={[styles.input, { flex: 1, marginRight: 8 }]}
              placeholder="Início (HH:MM)"
              value={horaInicio}
              onChangeText={setHoraInicio}
              returnKeyType="next"
              onSubmitEditing={() => horaTerminoInputRef.current?.focus()}
              blurOnSubmit={false}
            />
            <TextInput
              ref={horaTerminoInputRef}
              style={[styles.input, { flex: 1 }]}
              placeholder="Término (HH:MM)"
              value={horaTermino}
              onChangeText={setHoraTermino}
              returnKeyType="next"
              onSubmitEditing={() => descricaoInputRef.current?.focus()}
              blurOnSubmit={false}
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
        onFocus={() => scrollInfoParaCampo(720)}
        inputRef={descricaoInputRef}
      />
    </ScrollView>
  );

  // Aba 2: Assinatura

const renderAssinaturaAba = () => (
  <ScrollView
    style={styles.assinaturaScroll}
    contentContainerStyle={[
      styles.assinaturaContainer,
      telaEmPaisagem && styles.assinaturaContainerPaisagem,
    ]}
    keyboardShouldPersistTaps="handled"
    scrollEnabled={scrollAssinaturaAtivo}
    showsVerticalScrollIndicator
  >
    <Text style={styles.assinaturaTitle}>
      Assinatura do Cliente
    </Text>

    <Text style={styles.assinaturaSubtitle}>
      Peça para o cliente assinar na linha abaixo
    </Text>

    <View style={[styles.signatureContainer, { height: alturaCampoAssinatura }]}>

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
          key={chaveAssinatura}
          ref={signatureRef}
          onOK={handleSignature}
          onEmpty={() =>
            Alert.alert(
              'Aviso',
              'Peça para o cliente assinar antes de salvar'
            )
          }
          onBegin={() => setScrollAssinaturaAtivo(false)}
          onEnd={() => {
            setScrollAssinaturaAtivo(true);
            signatureRef.current?.readSignature();
          }}
          autoClear={false}
          descriptionText=""
          clearText="Limpar"
          confirmText="Confirmar"
          rotated={telaEmPaisagem}
          scrollable={false}
          webStyle={`${signatureWebStyle}${telaEmPaisagem ? signatureLandscapeOutputFix : ''}`}
          webviewProps={{
            scrollEnabled: false,
            bounces: false,
          }}
          style={styles.signature}
        />
      )}

      <View pointerEvents="none" style={styles.signatureGuideLine} />

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

  </ScrollView>
);

  const renderFormularioAssinado = (
    opcoes?: {
      ref?: React.RefObject<View | null>;
      fixoParaPng?: boolean;
    }
  ) => (
    <FormularioAssinadoPreview
      ref={opcoes?.ref}
      empresaConsultor={empresaConsultor}
      empresaSelecionada={empresaSelecionada}
      consultor={consultor}
      dataVisita={dataVisita}
      protocoloAtendimento={protocoloAtendimento}
      solicitante={solicitante}
      horaInicio={horaInicio}
      horaTermino={horaTermino}
      descricao={descricao}
      assinatura={assinatura}
      fixoParaPng={opcoes?.fixoParaPng}
    />
  );
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FC" />
      
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.navigate('Visitas' as never)} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Formulário de Visita</Text>
        <Pressable onPress={handleSalvar} style={styles.saveButton} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#2463EB" />
          ) : (
            <Text style={styles.saveText}>{textoBotaoPrincipal}</Text>
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
          onPress={abrirAbaAssinatura}
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
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 8 : STATUS_BAR_HEIGHT + 8}
      >
        {abaAtiva === 'info' ? renderInfoAba() : renderAssinaturaAba()}
      </KeyboardAvoidingView>

      {showDatePicker && (
        <Modal
          transparent
          animationType="fade"
          visible={showDatePicker}
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.pickerModalOverlay}>
            <View style={styles.pickerModalCard}>
              <Text style={styles.pickerModalTitle}>Selecionar Data</Text>
              <DateTimePicker
                value={dataPickerTemp}
                mode="date"
                display="spinner"
                onChange={onChangeData}
                maximumDate={new Date()}
                style={styles.pickerModalPicker}
              />
              <View style={styles.pickerModalActions}>
                <Pressable
                  style={styles.pickerModalCancelButton}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.pickerModalCancelText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  style={styles.pickerModalConfirmButton}
                  onPress={confirmarDataIos}
                >
                  <Text style={styles.pickerModalConfirmText}>Confirmar</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {showHoraPicker && (
        <Modal
          transparent
          animationType="fade"
          visible={showHoraPicker}
          onRequestClose={() => setShowHoraPicker(false)}
        >
          <View style={styles.pickerModalOverlay}>
            <View style={styles.pickerModalCard}>
              <Text style={styles.pickerModalTitle}>
                {tipoHoraAtual === 'inicio'
                  ? 'Hor\u00e1rio de In\u00edcio'
                  : 'Hor\u00e1rio de T\u00e9rmino'}
              </Text>
              <DateTimePicker
                key={`hora-${tipoHoraAtual}-${horaPickerKey}`}
                value={horaPickerTemp}
                mode="time"
                display="spinner"
                is24Hour
                onChange={(event, date) =>
                  onChangeHora(
                    tipoHoraAtual,
                    event,
                    date
                  )
                }
                style={styles.pickerModalPicker}
              />
              <View style={styles.pickerModalActions}>
                <Pressable
                  style={styles.pickerModalCancelButton}
                  onPress={() => setShowHoraPicker(false)}
                >
                  <Text style={styles.pickerModalCancelText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  style={styles.pickerModalConfirmButton}
                  onPress={confirmarHoraIos}
                >
                  <Text style={styles.pickerModalConfirmText}>Confirmar</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}

      <Modal
        visible={showFormularioFinal}
        animationType="slide"
        transparent={false}
        onRequestClose={fecharFormularioFinal}
      >
        <SafeAreaView style={styles.documentModalContainer}>
          <View
            style={[
              styles.documentModalHeader,
              { paddingTop: Math.max(insets.top, 12) + 8 },
            ]}
          >
            <Text style={styles.documentModalTitle}>
              Formulario Assinado
            </Text>
            <View style={styles.documentModalActions}>
              <Pressable
                style={[
                  styles.documentShareButton,
                  compartilhandoPdf && styles.documentButtonDisabled,
                ]}
                onPress={compartilharPdf}
                disabled={compartilhandoPdf}
              >
                <Text style={styles.documentShareButtonText}>
                  {compartilhandoPdf ? 'Gerando...' : '↪ PDF'}
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.documentShareButton,
                  compartilhandoPng && styles.documentButtonDisabled,
                ]}
                onPress={compartilharPng}
                disabled={compartilhandoPng}
              >
                <Text style={styles.documentShareButtonText}>
                  {compartilhandoPng ? 'Gerando...' : '↪ PNG'}
                </Text>
              </Pressable>
              <Pressable
                style={styles.documentCloseButton}
                onPress={fecharFormularioFinal}
              >
                <Text style={styles.documentCloseButtonText}>Fechar</Text>
              </Pressable>
            </View>
          </View>

          <ScrollView
            style={styles.documentScroll}
            contentContainerStyle={styles.documentScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {renderFormularioAssinado()}
          </ScrollView>

          <View style={styles.pngCaptureLayer} pointerEvents="none">
            {renderFormularioAssinado({
              ref: formularioDocumentoPngRef,
              fixoParaPng: true,
            })}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const signatureWebStyle = `
  .m-signature-pad {
    width: 100%;
    height: 100%;
    box-shadow: none;
    border: 1px solid #E9ECEF;
    border-radius: 12px;
  }
  .m-signature-pad--body {
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    border: none;
  }
  .m-signature-pad--body canvas {
    width: 100%;
    height: 100%;
  }
  .m-signature-pad--footer {
    display: none;
  }
`;

const signatureLandscapeOutputFix = `
  </style>
  <script>
    (function () {
      function rotateSignatureToHorizontal(url) {
        var image = new Image();
        image.onload = function () {
          var output = document.createElement('canvas');
          output.width = image.height;
          output.height = image.width;

          var context = output.getContext('2d');
          context.translate(output.width, 0);
          context.rotate(Math.PI / 2);
          context.drawImage(image, 0, 0);

          window.ReactNativeWebView.postMessage(output.toDataURL('image/png'));
        };
        image.src = url;
      }

      function patchReadSignature() {
        if (window.__faciliteLandscapeSignaturePatch || typeof window.readSignature !== 'function' || !window.signaturePad) {
          return;
        }

        window.__faciliteLandscapeSignaturePatch = true;
        var originalReadSignature = window.readSignature;

        window.readSignature = function () {
          if (!window.signaturePad) {
            originalReadSignature();
            return;
          }

          if (window.signaturePad.isEmpty()) {
            window.ReactNativeWebView.postMessage('EMPTY');
            return;
          }

          rotateSignatureToHorizontal(window.signaturePad.toDataURL('image/png'));

          if (window.autoClear === true && window.signaturePad) {
            window.signaturePad.clear();
          }
        };
      }

      var patchTimer = setInterval(function () {
        patchReadSignature();

        if (window.__faciliteLandscapeSignaturePatch) {
          clearInterval(patchTimer);
        }
      }, 50);
    })();
  </script>
  <style>
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
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 280 : 80,
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
  pickerModalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.42)',
  },
  pickerModalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  pickerModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  pickerModalPicker: {
    alignSelf: 'stretch',
  },
  pickerModalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  pickerModalCancelButton: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDE3EE',
    backgroundColor: '#FFFFFF',
  },
  pickerModalConfirmButton: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#2463EB',
  },
  pickerModalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4B5563',
  },
  pickerModalConfirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  assinaturaScroll: {
    flex: 1,
  },
  assinaturaContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  assinaturaContainerPaisagem: {
    paddingTop: 10,
    paddingBottom: 72,
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
    width: '100%',
    maxHeight: 380,
    marginBottom: 16,
    position: 'relative',
  },
  signature: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  signatureGuideLine: {
    position: 'absolute',
    left: 18,
    right: 18,
    top: '78%',
    height: 2,
    backgroundColor: '#111827',
    borderRadius: 1,
    zIndex: 10,
    elevation: 10,
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
  documentModalContainer: {
    flex: 1,
    backgroundColor: '#E9EEF7',
  },
  documentModalHeader: {
    alignItems: 'stretch',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#DDE3EE',
  },
  documentModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  documentModalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  documentShareButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1769AA',
  },
  documentShareButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  documentButtonDisabled: {
    opacity: 0.7,
  },
  documentCloseButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#2463EB',
  },
  documentCloseButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  documentScroll: {
    flex: 1,
  },
  documentScrollContent: {
    padding: 16,
    alignItems: 'center',
  },
  pngCaptureLayer: {
    position: 'absolute',
    left: -10000,
    top: 0,
    width: 760,
  },
});
