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
import { useEmpresa } from '../contexts/EmpresaContext';
import CampoSolicitante from '../components/FormularioVisita/CampoSolicitante';
import CampoData from '../components/FormularioVisita/CampoData';
import CampoHorario from '../components/FormularioVisita/CampoHorario';
import CampoDescricao from '../components/FormularioVisita/CampoDescricao';
import type { EmpresaDB } from '../database/empresaRepository';
import { db } from '../database/initDatabase'
import { VisitasRepository, VisitaDB } from '../database/VisitasRepository';
import DateTimePicker, { DateTimePickerEvent, DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import SignatureScreen from 'react-native-signature-canvas';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { captureRef } from 'react-native-view-shot';

const { width, height } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = StatusBar.currentHeight || 0;
const HEADER_HEIGHT = 60;
const PDF_A4_WIDTH = 595;
const PDF_A4_HEIGHT = 842;

type FormularioVisitaScreenNavigationProp = DrawerNavigationProp<RootDrawerParamList, 'FormularioVisita'>;

export default function FormularioVisitaScreen() {
  const navigation = useNavigation<FormularioVisitaScreenNavigationProp>();
  const route = useRoute<any>();
  const { consultor } = useConsultor();
  const { empresa: empresaConsultor } = useEmpresa();

  
  // Estados das abas
  const [abaAtiva, setAbaAtiva] = useState<'info' | 'assinatura'>('info');
  
  // Estados do formulário
  const [empresaId, setEmpresaId] = useState('');
  const [empresaSelecionada, setEmpresaSelecionada] = useState<EmpresaDB | null>(null);
  const [protocoloAtendimento, setProtocoloAtendimento] = useState('');
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
  const [loading, setLoading] = useState(false);
  const [ultimaVisita, setUltimaVisita] = useState<VisitaDB | null>(null);
  const [showFormularioFinal, setShowFormularioFinal] = useState(false);
  const [compartilhandoPdf, setCompartilhandoPdf] = useState(false);
  const [compartilhandoPng, setCompartilhandoPng] = useState(false);
  
  const signatureRef = useRef<any>(null);
  const formularioDocumentoRef = useRef<View>(null);
  const formularioJaSalvo = !!ultimaVisita;
  const textoAcaoFormulario = formularioJaSalvo ? 'Atualizar' : 'Salvar';
  const textoBotaoPrincipal = abaAtiva === 'info' ? 'Próximo' : textoAcaoFormulario;

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
    if (!validarFormulario()) return;
    
    if (abaAtiva === 'info') {
      setAbaAtiva('assinatura');
      return;
    }
    
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

  const enderecoConsultor = () => {
    const ruaNumero = [empresaConsultor.endereco, empresaConsultor.numero]
      .filter(Boolean)
      .join(', ');
    const cidadeEstado = [empresaConsultor.cidade, empresaConsultor.estado]
      .filter(Boolean)
      .join('/');

    return [ruaNumero || 'Endereco nao informado', cidadeEstado]
      .filter(Boolean)
      .join(' - ');
  };

  const gerarLogoHtml = (marcaDagua = false) => {
    const logo = marcaDagua ? empresaConsultor.logoMedia : empresaConsultor.logoPequena;

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

  const gerarHtmlFormularioPdf = () => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          @page { margin: 18px; size: A4; }
          * { box-sizing: border-box; }
          body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #111827; background: #ffffff; }
          .document { width: 100%; border: 1px solid #D7DEEA; border-radius: 8px; overflow: hidden; padding: 0 18px 18px; }
          .top-bar { height: 8px; margin: 0 -18px 14px; background: #1769AA; }
          .header { display: flex; min-height: 110px; gap: 16px; padding-bottom: 12px; margin-bottom: 12px; border-bottom: 1px solid #E4E8F0; }
          .brand { width: 178px; display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding: 6px 0; }
          .logo-box { width: 150px; height: 52px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
          .header-logo-img { max-width: 150px; max-height: 52px; object-fit: contain; }
          .test-logo { width: 150px; height: 52px; display: flex; align-items: center; justify-content: center; gap: 9px; }
          .test-logo-icon { width: 30px; height: 30px; border-radius: 15px; background: #1769AA; color: white; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 800; }
          .test-logo-name { color: #1769AA; font-size: 20px; line-height: 22px; font-weight: 800; }
          .test-logo-sub { color: #6B7280; font-size: 9px; line-height: 11px; font-weight: 800; letter-spacing: 2px; }
          .contact { min-height: 44px; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; color: #4B5563; font-size: 11px; line-height: 15px; text-align: center; }
          .company { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 8px; text-align: center; }
          .company-name { max-width: 310px; font-size: 22px; line-height: 27px; font-weight: 800; margin-bottom: 6px; }
          .company-address { color: #4B5563; font-size: 13px; line-height: 17px; }
          .protocol { background: #EEF6FD; border-left: 5px solid #1769AA; border-radius: 8px; padding: 10px 14px; margin-bottom: 12px; }
          .protocol-label { color: #1769AA; font-size: 11px; font-weight: 800; margin-bottom: 4px; }
          .protocol-value { font-size: 18px; font-weight: 800; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 12px; margin-bottom: 12px; }
          .label { color: #6B7280; font-size: 10px; font-weight: 800; margin-bottom: 3px; }
          .value { min-height: 30px; border: 1px solid #DDE3EE; border-radius: 6px; padding: 6px 8px; background: #FAFBFD; font-size: 13px; }
          .section { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
          .rule { flex: 1; height: 1px; background: #DDE3EE; }
          .section-title { font-size: 15px; font-weight: 800; }
          .description { position: relative; min-height: 210px; border: 1px solid #DDE3EE; border-radius: 8px; padding: 14px; margin-bottom: 12px; overflow: hidden; }
          .description-text { position: relative; z-index: 1; font-size: 13px; line-height: 20px; color: #1F2937; }
          .watermark-img { position: absolute; top: 56px; left: 50%; transform: translateX(-50%); width: 300px; height: 110px; object-fit: contain; opacity: 0.07; }
          .test-watermark { position: absolute; top: 74px; left: 50%; transform: translateX(-50%); width: 310px; height: 72px; display: flex; align-items: center; justify-content: center; gap: 10px; opacity: 0.07; overflow: hidden; }
          .test-watermark-icon { width: 52px; height: 52px; border-radius: 26px; background: #1769AA; color: white; display: flex; align-items: center; justify-content: center; font-size: 36px; font-weight: 800; }
          .test-watermark-name { color: #1769AA; font-size: 48px; line-height: 52px; font-weight: 800; }
          .test-watermark-sub { color: #6B7280; font-size: 14px; line-height: 17px; font-weight: 800; letter-spacing: 4px; }
          .message { min-height: 54px; display: flex; align-items: center; justify-content: center; background: #1769AA; color: white; border-radius: 8px; padding: 10px 14px; margin-bottom: 14px; text-align: center; font-size: 12px; line-height: 17px; font-weight: 600; }
          .signature { border: 1px solid #E4E8F0; border-radius: 8px; padding: 12px 14px 12px; background: #FAFBFD; text-align: center; }
          .signature-img { width: 70%; height: 60px; object-fit: contain; }
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
              <div class="logo-box">${gerarLogoHtml(false)}</div>
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
            <div><div class="label">Consultor</div><div class="value">${escaparHtml(consultor?.nome || 'Nao informado')}</div></div>
            <div><div class="label">Data da visita</div><div class="value">${escaparHtml(dataVisita)}</div></div>
            <div><div class="label">Protocolo de atendimento</div><div class="value">${escaparHtml(protocoloAtendimento.trim() || 'Nao informado')}</div></div>
            <div><div class="label">Solicitante</div><div class="value">${escaparHtml(solicitante || 'Nao informado')}</div></div>
            <div><div class="label">Horario de inicio</div><div class="value">${escaparHtml(horaInicio || '--:--')}</div></div>
            <div><div class="label">Horario de termino</div><div class="value">${escaparHtml(horaTermino || '--:--')}</div></div>
          </section>
          <section class="section">
            <div class="rule"></div>
            <div class="section-title">DESCRIÇÃO DO ATENDIMENTO</div>
            <div class="rule"></div>
          </section>
          <section class="description">
            ${gerarLogoHtml(true)}
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
        html: gerarHtmlFormularioPdf(),
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

      if (!formularioDocumentoRef.current) {
        Alert.alert('Erro', 'Formulario ainda nao esta pronto para compartilhar');
        return;
      }

      const capturaUri = await captureRef(formularioDocumentoRef, {
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
          style={styles.input}
          placeholder="Numero do protocolo, se houver"
          placeholderTextColor="#ADB5BD"
          value={protocoloAtendimento}
          onChangeText={setProtocoloAtendimento}
        />
      </View>

      {/* Solicitante */}
      <CampoSolicitante
        value={solicitante}
  onChange={setSolicitante}
      />

      {/* Data da Visita */}
      {Platform.OS === 'web' ? (
        <View style={styles.field}>
          <Text style={styles.label}>
            Data da Visita
            <Text style={styles.required}> *</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="DD/MM/AAAA"
            value={dataVisita}
            onChangeText={setDataVisita}
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

      <Modal
        visible={showFormularioFinal}
        animationType="slide"
        transparent={false}
        onRequestClose={fecharFormularioFinal}
      >
        <SafeAreaView style={styles.documentModalContainer}>
          <View style={styles.documentModalHeader}>
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
            <View
              ref={formularioDocumentoRef}
              collapsable={false}
              style={styles.osDocument}
            >
              <View style={styles.osTopBar} />

              <View style={styles.osHeader}>
                <View style={styles.osBrandColumn}>
                  <View style={styles.osLogoBox}>
                    {empresaConsultor.logoPequena ? (
                      <Image
                        source={{ uri: empresaConsultor.logoPequena }}
                        style={styles.osLogoSmall}
                      />
                    ) : (
                      <View style={styles.osTestLogo}>
                        <View style={styles.osTestLogoIcon}>
                          <Text style={styles.osTestLogoIconText}>+</Text>
                        </View>
                        <View>
                          <Text style={styles.osTestLogoName}>FACILITE</Text>
                          <Text style={styles.osTestLogoSub}>CONSULTORIA</Text>
                        </View>
                      </View>
                    )}
                  </View>
                  <View style={styles.osContactBox}>
                    {!!empresaConsultor.telefone && (
                      <Text style={styles.osContactText}>
                        Tel: {empresaConsultor.telefone}
                      </Text>
                    )}
                    {!!empresaConsultor.celular && (
                      <Text style={styles.osContactText}>
                        Cel: {empresaConsultor.celular}
                      </Text>
                    )}
                    {!!empresaConsultor.email && (
                      <Text style={styles.osContactText}>
                        {empresaConsultor.email}
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.osCompanyHeader}>
                  <Text style={styles.osCompanyName}>
                    {empresaConsultor.nome || 'Empresa do Consultor'}
                  </Text>
                  <Text style={styles.osCompanyAddress}>
                    {[empresaConsultor.endereco, empresaConsultor.numero]
                      .filter(Boolean)
                      .join(', ') || 'Endereco nao informado'}
                    {empresaConsultor.cidade || empresaConsultor.estado
                      ? ` - ${empresaConsultor.cidade}/${empresaConsultor.estado}`
                      : ''}
                  </Text>
                </View>
              </View>

              <View style={styles.osProtocolCard}>
                <Text style={styles.osProtocolCaption}>
                  EMPRESA ATENDIDA
                </Text>
                <Text style={styles.osProtocolValue}>
                  {empresaSelecionada?.nome_fantasia || 'Nao informada'}
                </Text>
              </View>

              <View style={styles.osInfoGrid}>
                <View style={styles.osInfoItem}>
                  <Text style={styles.osInfoLabel}>Consultor</Text>
                  <Text style={styles.osInfoValue}>{consultor?.nome || 'Nao informado'}</Text>
                </View>
                <View style={styles.osInfoItem}>
                  <Text style={styles.osInfoLabel}>Data da visita</Text>
                  <Text style={styles.osInfoValue}>{dataVisita}</Text>
                </View>
                <View style={styles.osInfoItem}>
                  <Text style={styles.osInfoLabel}>Protocolo de atendimento</Text>
                  <Text style={styles.osInfoValue}>
                    {protocoloAtendimento.trim() || 'Nao informado'}
                  </Text>
                </View>
                <View style={styles.osInfoItem}>
                  <Text style={styles.osInfoLabel}>Solicitante</Text>
                  <Text style={styles.osInfoValue}>{solicitante || 'Nao informado'}</Text>
                </View>
                <View style={styles.osInfoItem}>
                  <Text style={styles.osInfoLabel}>Horario de inicio</Text>
                  <Text style={styles.osInfoValue}>{horaInicio || '--:--'}</Text>
                </View>
                <View style={styles.osInfoItem}>
                  <Text style={styles.osInfoLabel}>Horario de termino</Text>
                  <Text style={styles.osInfoValue}>{horaTermino || '--:--'}</Text>
                </View>
              </View>

              <View style={styles.osSectionHeader}>
                <View style={styles.osSectionRule} />
                <Text style={styles.osSectionTitle}>
                  DESCRIÇÃO DO ATENDIMENTO
                </Text>
                <View style={styles.osSectionRule} />
              </View>

              <View style={styles.osDescriptionBox}>
                {empresaConsultor.logoMedia ? (
                  <Image
                    source={{ uri: empresaConsultor.logoMedia }}
                    style={styles.osWatermark}
                  />
                ) : (
                  <View style={styles.osTestWatermark}>
                    <View style={styles.osTestWatermarkIcon}>
                      <Text style={styles.osTestWatermarkIconText}>+</Text>
                    </View>
                    <View>
                      <Text style={styles.osTestWatermarkName}>FACILITE</Text>
                      <Text style={styles.osTestWatermarkSub}>CONSULTORIA</Text>
                    </View>
                  </View>
                )}
                <Text style={styles.osDescriptionText}>
                  {descricao}
                </Text>
              </View>

              <View style={styles.osMessageBox}>
                <Text style={styles.osMessageText}>
                  {empresaConsultor.mensagemFormulario ||
                    'O cliente declara que os procedimentos acima relacionados foram executados e concorda com as informacoes descritas neste formulario.'}
                </Text>
              </View>

              <View style={styles.osSignatureArea}>
                <View style={styles.osSignatureBox}>
                  {assinatura && Platform.OS === 'web' && assinatura.startsWith('data:image/svg') ? (
                    <Text style={styles.osSignatureFallbackText}>
                      Assinatura confirmada
                    </Text>
                  ) : assinatura ? (
                    <Image
                      source={{ uri: assinatura }}
                      style={styles.osSignatureImage}
                    />
                  ) : null}
                  <View style={styles.osSignatureLine} />
                  <Text style={styles.osSignatureLabel}>
                    Assinatura do Cliente
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
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
  documentModalContainer: {
    flex: 1,
    backgroundColor: '#E9EEF7',
  },
  documentModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#DDE3EE',
  },
  documentModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  documentModalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  documentShareButton: {
    minWidth: 62,
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#1769AA',
  },
  documentShareButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  documentButtonDisabled: {
    opacity: 0.7,
  },
  documentCloseButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#2463EB',
  },
  documentCloseButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  documentScroll: {
    flex: 1,
  },
  documentScrollContent: {
    padding: 16,
    alignItems: 'center',
  },
  osDocument: {
    width: '100%',
    maxWidth: 760,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7DEEA',
    borderRadius: 8,
    paddingHorizontal: 22,
    paddingBottom: 22,
    overflow: 'hidden',
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  osTopBar: {
    height: 10,
    marginHorizontal: -22,
    marginBottom: 20,
    backgroundColor: '#1769AA',
  },
  osHeader: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    gap: 20,
    minHeight: 134,
    marginBottom: 18,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E8F0',
  },
  osBrandColumn: {
    width: 190,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  osLogoBox: {
    width: 160,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  osLogoSmall: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  osTestLogo: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  osTestLogoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1769AA',
  },
  osTestLogoIconText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 26,
  },
  osTestLogoName: {
    fontSize: 21,
    fontWeight: '800',
    color: '#1769AA',
    lineHeight: 23,
  },
  osTestLogoSub: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 2,
    lineHeight: 11,
  },
  osContactBox: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  osContactText: {
    fontSize: 12,
    lineHeight: 17,
    color: '#4B5563',
    textAlign: 'center',
  },
  osCompanyHeader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  osCompanyName: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
    textAlign: 'center',
    maxWidth: 310,
  },
  osCompanyAddress: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 19,
    textAlign: 'center',
  },
  osProtocolCard: {
    backgroundColor: '#EEF6FD',
    borderLeftWidth: 5,
    borderLeftColor: '#1769AA',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  osProtocolCaption: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1769AA',
    marginBottom: 4,
  },
  osProtocolValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  osInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 18,
  },
  osInfoItem: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  osInfoLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B7280',
    marginBottom: 4,
  },
  osInfoValue: {
    minHeight: 36,
    borderWidth: 1,
    borderColor: '#DDE3EE',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#FAFBFD',
  },
  osSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  osSectionRule: {
    flex: 1,
    height: 1,
    backgroundColor: '#DDE3EE',
  },
  osSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },
  osDescriptionBox: {
    minHeight: 250,
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: '#DDE3EE',
    borderRadius: 8,
    padding: 18,
    marginBottom: 18,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  osWatermark: {
    position: 'absolute',
    alignSelf: 'center',
    top: 70,
    width: 320,
    height: 120,
    opacity: 0.07,
    resizeMode: 'contain',
  },
  osTestWatermark: {
    position: 'absolute',
    alignSelf: 'center',
    top: 96,
    width: 330,
    height: 78,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    opacity: 0.07,
    overflow: 'hidden',
  },
  osTestWatermarkIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1769AA',
  },
  osTestWatermarkIconText: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '800',
    lineHeight: 44,
  },
  osTestWatermarkName: {
    fontSize: 54,
    fontWeight: '800',
    color: '#1769AA',
    lineHeight: 58,
  },
  osTestWatermarkSub: {
    fontSize: 16,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 4,
    lineHeight: 19,
  },
  osDescriptionText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#1F2937',
    flexShrink: 1,
    zIndex: 1,
  },
  osMessageBox: {
    minHeight: 66,
    alignSelf: 'stretch',
    backgroundColor: '#1769AA',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 22,
    justifyContent: 'center',
  },
  osMessageText: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
    textAlign: 'center',
    flexShrink: 1,
  },
  osSignatureArea: {
    marginTop: 4,
    alignItems: 'center',
  },
  osSignatureBox: {
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E4E8F0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: '#FAFBFD',
  },
  osSignatureImage: {
    width: '70%',
    height: 82,
    resizeMode: 'contain',
    marginBottom: -2,
  },
  osSignatureFallbackText: {
    fontSize: 23,
    color: '#111827',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  osSignatureLine: {
    width: '76%',
    borderBottomWidth: 1,
    borderBottomColor: '#111827',
    marginBottom: 8,
  },
  osSignatureLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
});
