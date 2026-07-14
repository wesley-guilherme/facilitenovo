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
 * - A visita e acessada pelo card da empresa
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  Image,
  ScrollView,
  Dimensions,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootDrawerParamList } from '../types/navigation';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import JSZip from 'jszip';
import { db } from '../database/initDatabase';

const { width, height } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = StatusBar.currentHeight || 0;

const formatarDataBR = (data: string) => {
  const partes = data.split('-');

  if (partes.length === 3) {
    const [ano, mes, dia] = partes;
    return `${dia}/${mes}/${ano}`;
  }

  return new Date(data).toLocaleDateString('pt-BR');
};

const criarDataLocal = (data: string) => {
  const partes = data.split('-').map(Number);

  if (partes.length === 3) {
    const [ano, mes, dia] = partes;
    return new Date(ano, mes - 1, dia);
  }

  return new Date(data);
};

type VisitasScreenNavigationProp = DrawerNavigationProp<RootDrawerParamList, 'Visitas'>;

// Tipo para Empresa
type Empresa = {
  id: string;
  codigo_referencia: string;
  nome_fantasia: string;
  logo: string | null;
  cidade: string;
  endereco: string;
  numero: string;
  email: string;
  contato: string;
  rota: string;
  ativo: number;
  deleted_at?: string | null;
};

// Tipo para Visita
type Visita = {
  id: string;
  empresa_id: string;
  consultor_id?: string | null;
  protocolo_atendimento?: string | null;
  data_visita: string;
  solicitante?: string;
  hora_inicio: string;
  hora_termino: string;
  descricao: string;
  status?: string;
  assinatura: string | null;
  created_at: string;
};

type EmpresaConsultorLote = {
  logo_pequena?: string | null;
  logo_media?: string | null;
  nome?: string | null;
  endereco?: string | null;
  numero?: string | null;
  cidade?: string | null;
  estado?: string | null;
  celular?: string | null;
  telefone?: string | null;
  email?: string | null;
  mensagem_formulario?: string | null;
};

type ConsultorLote = {
  nome?: string | null;
};

type FormatoLote = 'pdf' | 'png';

type FormularioLote = {
  visita: Visita;
  empresa: Empresa;
  empresaConsultor: EmpresaConsultorLote;
  consultor: ConsultorLote | null;
};

// Tipo para Empresa com dados agregados da última visita
type EmpresaComUltimaVisita = Empresa & {
  ultimaVisita: Visita | null;
  diasDesdeUltimaVisita: number;
  statusAtraso: 'normal' | 'atencao' | 'critico';
};

export default function VisitasScreen() {
  const navigation = useNavigation<VisitasScreenNavigationProp>(); 
  const [empresas, setEmpresas] = useState<EmpresaComUltimaVisita[]>([]);
  const [pesquisa, setPesquisa] = useState('');
  const [loading, setLoading] = useState(true);
  const [diasAviso, setDiasAviso] = useState(30);
  const [gerandoRelatorio, setGerandoRelatorio] = useState(false);
  const [datasDisponiveis, setDatasDisponiveis] = useState<string[]>([]);
  const [modalDataVisible, setModalDataVisible] = useState(false);
  const [modalFormatoVisible, setModalFormatoVisible] = useState(false);
  const [dataSelecionadaLote, setDataSelecionadaLote] = useState<string | null>(null);
  const [formularioCaptura, setFormularioCaptura] = useState<FormularioLote | null>(null);
  const formularioCapturaRef = React.useRef<View>(null);

  // Carregar configurações e dados
  useFocusEffect(
    useCallback(() => {
      carregarConfiguracoes();
      carregarDados();
    }, [])
  );

  const carregarConfiguracoes = async () => {
    try {
      const result = await db.getAllAsync('SELECT valor FROM configuracoes WHERE chave = "dias_aviso"');
      if (result.length > 0) {
        setDiasAviso(parseInt((result as any[])[0].valor) || 30);
      }
    } catch (error) {
      console.log('Configurações não encontradas, usando padrão 30 dias');
    }
  };

const carregarDados = async () => {
  setLoading(true);
  try {
    // Buscar empresas ativas - com tipagem explícita
    let empresasDb: Empresa[] = [];
    try {
      const result = await db.getAllAsync(
        'SELECT * FROM empresas WHERE ativo = 1 AND deleted_at IS NULL ORDER BY nome_fantasia ASC'
      );
      empresasDb = result as Empresa[];
    } catch (tableError) {
      console.log('Tabela empresas não encontrada ou vazia');
      empresasDb = [];
    }
    
    // Buscar todas as visitas - com tipagem explícita
    let visitasDb: Visita[] = [];
    try {
      const result = await db.getAllAsync('SELECT * FROM visitas ORDER BY data_visita DESC');
      visitasDb = result as Visita[];
    } catch (tableError) {
      console.log('Tabela visitas não encontrada ou vazia');
      visitasDb = [];
    }
    
    // Se não há empresas, retorna lista vazia
    if (empresasDb.length === 0) {
      setEmpresas([]);
      setDatasDisponiveis([]);
      setLoading(false);
      return;
    }
    
    // Agrupar visitas por empresa
    const empresasComVisitas: EmpresaComUltimaVisita[] = [];
    
    for (const empresa of empresasDb) {
      // Filtrar visitas da empresa
      const visitasEmpresa = visitasDb.filter(v => v.empresa_id === empresa.id);
      
      // Ordenar por data (mais recente primeiro)
      visitasEmpresa.sort((a, b) => new Date(b.data_visita).getTime() - new Date(a.data_visita).getTime());
      
      const ultimaVisita = visitasEmpresa.length > 0 ? visitasEmpresa[0] : null;
      
      // Calcular dias desde última visita
      let diasDesdeUltimaVisita = 999;
      let statusAtraso: 'normal' | 'atencao' | 'critico' = 'normal';
      
      if (ultimaVisita) {
        const hoje = new Date();
        const ultimaData = criarDataLocal(ultimaVisita.data_visita);
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
    const datas = [...new Set(visitasDb.map(v => v.data_visita))];
    datas.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    setDatasDisponiveis(datas);
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    setEmpresas([]);
    setDatasDisponiveis([]);
  } finally {
    setLoading(false);
  }
};

  // ==================== CORREÇÃO DAS NAVEGAÇÕES ====================
  const handleVoltar = () => {
    navigation.goBack();
  };

  const handleAbrirFormularioEmpresa = (empresa: EmpresaComUltimaVisita) => {
    navigation.navigate('FormularioVisita', { empresa } as any);
  };

  // Pesquisar empresas
  const empresasFiltradas = empresas.filter(empresa =>
    empresa.codigo_referencia?.toLowerCase().includes(pesquisa.toLowerCase()) ||
    empresa.nome_fantasia?.toLowerCase().includes(pesquisa.toLowerCase())
  );

  // Agrupar empresas por data da última visita
  const agruparPorData = () => {
    const grupos: { [key: string]: EmpresaComUltimaVisita[] } = {};
    
    for (const empresa of empresasFiltradas) {
      let chave = 'Nunca visitada';
      if (empresa.ultimaVisita) {
        chave = formatarDataBR(empresa.ultimaVisita.data_visita);
      }
      
      if (!grupos[chave]) {
        grupos[chave] = [];
      }
      grupos[chave].push(empresa);
    }
    
    return grupos;
  };

  const normalizarNomeArquivo = (valor?: string | null) => {
    const normalizado = String(valor || 'empresa')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase();

    return normalizado || 'empresa';
  };

  const dataArquivo = (data: string) => {
    const partes = data.split('-');

    if (partes.length === 3) {
      const [ano, mes, dia] = partes;
      return `${dia}${mes}${ano.slice(-2)}`;
    }

    return formatarDataBR(data).replace(/\D/g, '').slice(0, 6);
  };

  const escaparHtml = (valor?: string | null) =>
    String(valor || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/\n/g, '<br />');

  const nomeFormularioLote = (
    empresa: Empresa,
    data: string,
    formato: FormatoLote
  ) => `${normalizarNomeArquivo(empresa.nome_fantasia)}${dataArquivo(data)}.${formato}`;

  const nomeZipLote = (data: string) => `${dataArquivo(data)}envio.zip`;

  const enderecoConsultorLote = (empresaConsultor: EmpresaConsultorLote) => {
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

  const gerarHtmlFormularioLote = ({
    visita,
    empresa,
    empresaConsultor,
    consultor,
  }: FormularioLote) => {
    const logoPequena = empresaConsultor.logo_pequena
      ? `<img src="${escaparHtml(empresaConsultor.logo_pequena)}" class="header-logo-img" />`
      : '<div class="test-logo"><div class="test-logo-icon">+</div><div><div class="test-logo-name">FACILITE</div><div class="test-logo-sub">CONSULTORIA</div></div></div>';
    const marcaDagua = empresaConsultor.logo_media
      ? `<img src="${escaparHtml(empresaConsultor.logo_media)}" class="watermark-img" />`
      : '<div class="test-watermark"><div class="test-watermark-icon">+</div><div><div class="test-watermark-name">FACILITE</div><div class="test-watermark-sub">CONSULTORIA</div></div></div>';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            @page { margin: 24px; size: A4; }
            * { box-sizing: border-box; }
            body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #111827; background: #ffffff; }
            .document { width: 100%; border: 1px solid #D7DEEA; border-radius: 8px; overflow: hidden; padding: 0 22px 22px; }
            .top-bar { height: 10px; margin: 0 -22px 20px; background: #1769AA; }
            .header { display: flex; min-height: 134px; gap: 20px; padding-bottom: 18px; margin-bottom: 18px; border-bottom: 1px solid #E4E8F0; }
            .brand { width: 190px; display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding: 10px 0; }
            .logo-box { width: 160px; height: 58px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
            .header-logo-img { max-width: 160px; max-height: 58px; object-fit: contain; }
            .test-logo { width: 160px; height: 58px; display: flex; align-items: center; justify-content: center; gap: 10px; }
            .test-logo-icon { width: 32px; height: 32px; border-radius: 16px; background: #1769AA; color: white; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 800; }
            .test-logo-name { color: #1769AA; font-size: 21px; line-height: 23px; font-weight: 800; }
            .test-logo-sub { color: #6B7280; font-size: 9px; line-height: 11px; font-weight: 800; letter-spacing: 2px; }
            .contact { min-height: 50px; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; color: #4B5563; font-size: 12px; line-height: 17px; text-align: center; }
            .company { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 10px; text-align: center; }
            .company-name { max-width: 310px; font-size: 24px; line-height: 30px; font-weight: 800; margin-bottom: 10px; }
            .company-address { color: #4B5563; font-size: 14px; line-height: 19px; }
            .protocol { background: #EEF6FD; border-left: 5px solid #1769AA; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; }
            .protocol-label { color: #1769AA; font-size: 11px; font-weight: 800; margin-bottom: 4px; }
            .protocol-value { font-size: 20px; font-weight: 800; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 18px; }
            .label { color: #6B7280; font-size: 11px; font-weight: 800; margin-bottom: 4px; }
            .value { min-height: 36px; border: 1px solid #DDE3EE; border-radius: 6px; padding: 8px 10px; background: #FAFBFD; font-size: 14px; }
            .section { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
            .rule { flex: 1; height: 1px; background: #DDE3EE; }
            .section-title { font-size: 15px; font-weight: 800; }
            .description { position: relative; min-height: 250px; border: 1px solid #DDE3EE; border-radius: 8px; padding: 18px; margin-bottom: 18px; overflow: hidden; }
            .description-text { position: relative; z-index: 1; font-size: 14px; line-height: 22px; color: #1F2937; }
            .watermark-img { position: absolute; top: 70px; left: 50%; transform: translateX(-50%); width: 320px; height: 120px; object-fit: contain; opacity: 0.07; }
            .test-watermark { position: absolute; top: 96px; left: 50%; transform: translateX(-50%); width: 330px; height: 78px; display: flex; align-items: center; justify-content: center; gap: 12px; opacity: 0.07; overflow: hidden; }
            .test-watermark-icon { width: 58px; height: 58px; border-radius: 29px; background: #1769AA; color: white; display: flex; align-items: center; justify-content: center; font-size: 40px; font-weight: 800; }
            .test-watermark-name { color: #1769AA; font-size: 54px; line-height: 58px; font-weight: 800; }
            .test-watermark-sub { color: #6B7280; font-size: 16px; line-height: 19px; font-weight: 800; letter-spacing: 4px; }
            .message { min-height: 66px; display: flex; align-items: center; justify-content: center; background: #1769AA; color: white; border-radius: 8px; padding: 14px 16px; margin-bottom: 22px; text-align: center; font-size: 13px; line-height: 19px; font-weight: 600; }
            .signature { border: 1px solid #E4E8F0; border-radius: 8px; padding: 16px 16px 14px; background: #FAFBFD; text-align: center; }
            .signature-img { width: 70%; height: 82px; object-fit: contain; }
            .signature-fallback { font-size: 23px; color: #111827; font-style: italic; margin-bottom: 16px; }
            .signature-line { width: 76%; border-bottom: 1px solid #111827; margin: 0 auto 8px; }
            .signature-label { font-size: 14px; font-weight: 800; }
          </style>
        </head>
        <body>
          <main class="document">
            <div class="top-bar"></div>
            <section class="header">
              <div class="brand">
                <div class="logo-box">${logoPequena}</div>
                <div class="contact">
                  ${empresaConsultor.telefone ? `<div>Tel: ${escaparHtml(empresaConsultor.telefone)}</div>` : ''}
                  ${empresaConsultor.celular ? `<div>Cel: ${escaparHtml(empresaConsultor.celular)}</div>` : ''}
                  ${empresaConsultor.email ? `<div>${escaparHtml(empresaConsultor.email)}</div>` : ''}
                </div>
              </div>
              <div class="company">
                <div class="company-name">${escaparHtml(empresaConsultor.nome || 'Empresa do Consultor')}</div>
                <div class="company-address">${escaparHtml(enderecoConsultorLote(empresaConsultor))}</div>
              </div>
            </section>
            <section class="protocol">
              <div class="protocol-label">EMPRESA ATENDIDA</div>
              <div class="protocol-value">${escaparHtml(empresa.nome_fantasia || 'Nao informada')}</div>
            </section>
            <section class="grid">
              <div><div class="label">Consultor</div><div class="value">${escaparHtml(consultor?.nome || 'Nao informado')}</div></div>
              <div><div class="label">Data da visita</div><div class="value">${escaparHtml(formatarDataBR(visita.data_visita))}</div></div>
              <div><div class="label">Protocolo de atendimento</div><div class="value">${escaparHtml(visita.protocolo_atendimento || 'Nao informado')}</div></div>
              <div><div class="label">Solicitante</div><div class="value">${escaparHtml(visita.solicitante || 'Nao informado')}</div></div>
              <div><div class="label">Horario de inicio</div><div class="value">${escaparHtml(visita.hora_inicio || '--:--')}</div></div>
              <div><div class="label">Horario de termino</div><div class="value">${escaparHtml(visita.hora_termino || '--:--')}</div></div>
            </section>
            <section class="section"><div class="rule"></div><div class="section-title">DESCRIÇÃO DO ATENDIMENTO</div><div class="rule"></div></section>
            <section class="description">
              ${marcaDagua}
              <div class="description-text">${escaparHtml(visita.descricao)}</div>
            </section>
            <section class="message">
              ${escaparHtml(empresaConsultor.mensagem_formulario || 'O cliente declara que os procedimentos acima relacionados foram executados e concorda com as informacoes descritas neste formulario.')}
            </section>
            <section class="signature">
              ${
                visita.assinatura && !visita.assinatura.startsWith('data:image/svg')
                  ? `<img src="${escaparHtml(visita.assinatura)}" class="signature-img" />`
                  : '<div class="signature-fallback">Assinatura confirmada</div>'
              }
              <div class="signature-line"></div>
              <div class="signature-label">Assinatura do Cliente</div>
            </section>
          </main>
        </body>
      </html>
    `;
  };

  const carregarDadosFormularioLote = async (data: string): Promise<FormularioLote[]> => {
    const visitasData = await db.getAllAsync<Visita>(
      `SELECT *
       FROM visitas
       WHERE data_visita = ?
       AND status <> 'RASCUNHO'
       ORDER BY hora_inicio ASC`,
      [data]
    );

    const empresaConsultor =
      await db.getFirstAsync<EmpresaConsultorLote>(
        'SELECT * FROM empresa_consultor LIMIT 1'
      ) || {};
    const consultor =
      await db.getFirstAsync<ConsultorLote>(
        'SELECT nome FROM consultor LIMIT 1'
      );

    const formularios: FormularioLote[] = [];

    for (const visita of visitasData) {
      const empresa = await db.getFirstAsync<Empresa>(
        'SELECT * FROM empresas WHERE id = ?',
        [visita.empresa_id]
      );

      if (empresa) {
        formularios.push({
          visita,
          empresa,
          empresaConsultor,
          consultor,
        });
      }
    }

    return formularios;
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
    setDataSelecionadaLote(data);
    setModalFormatoVisible(true);
  };

  const handleFecharModal = () => {
    setModalDataVisible(false);
    setModalFormatoVisible(false);
    setDataSelecionadaLote(null);
  };

  const handleSelecionarFormato = (formato: FormatoLote) => {
    if (!dataSelecionadaLote) {
      return;
    }

    setModalFormatoVisible(false);
    gerarZipParaData(dataSelecionadaLote, formato);
  };

 const gerarZipParaData = async (data: string, formato: FormatoLote) => {
  setGerandoRelatorio(true);
  try {
    const formularios = await carregarDadosFormularioLote(data);
    
    if (formularios.length === 0) {
      Alert.alert('Aviso', 'Nenhuma visita encontrada para esta data');
      return;
    }

    const zip = new JSZip();

    for (const formulario of formularios) {
      const nomeFormulario = nomeFormularioLote(
        formulario.empresa,
        data,
        formato
      );

      if (formato === 'pdf') {
        const pdf = await Print.printToFileAsync({
          html: gerarHtmlFormularioLote(formulario),
          base64: false,
        });
        const pdfBase64 = await FileSystem.readAsStringAsync(pdf.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        zip.file(nomeFormulario, pdfBase64, { base64: true });
      } else {
        setFormularioCaptura(formulario);
        await new Promise(resolve => setTimeout(resolve, 500));

        if (!formularioCapturaRef.current) {
          throw new Error('Formulario temporario nao renderizado para PNG');
        }

        const pngBase64 = await captureRef(formularioCapturaRef, {
          format: 'png',
          quality: 1,
          result: 'base64',
        });

        zip.file(nomeFormulario, pngBase64, { base64: true });
        setFormularioCaptura(null);
        await new Promise(resolve => setTimeout(resolve, 150));
      }
    }

    const zipBase64 = await zip.generateAsync({
      type: 'base64',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    const lotePath = `${FileSystem.cacheDirectory}${nomeZipLote(data)}`;

    await FileSystem.writeAsStringAsync(lotePath, zipBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const loteCompartilhavel = await Sharing.isAvailableAsync();
    if (loteCompartilhavel) {
      await Sharing.shareAsync(lotePath, {
        mimeType: 'application/zip',
        dialogTitle: `Enviar lote de visitas de ${formatarDataBR(data)}`,
        UTI: 'public.zip-archive',
      });
    } else {
      Alert.alert('Erro', 'Compartilhamento nao disponivel');
    }


  } catch (error) {
    console.error('Erro ao gerar arquivo:', error);
    Alert.alert('Erro', 'Não foi possível gerar o relatório');
  } finally {
    setFormularioCaptura(null);
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
      return `✅ Última visita: ${formatarDataBR(item.ultimaVisita.data_visita)}`;
    };
    
    return (
      <TouchableOpacity
        style={[styles.card, getCardStyle()]}
        onPress={() => handleAbrirFormularioEmpresa(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardLogoContainer}>
            {item.logo ? (
              <Image source={{ uri: item.logo }} style={styles.cardLogo} />
            ) : (
              <View style={styles.cardLogoPlaceholder}>
                <Text style={styles.cardLogoPlaceholderText}>🏢</Text>
              </View>
            )}
          </View>
          
          <View style={styles.cardInfo}>
            <Text style={styles.cardCodigo}>🔢 {item.codigo_referencia}</Text>
            <Text style={styles.cardNome}>{item.nome_fantasia}</Text>
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

  const renderFormularioCapturaPng = () => {
    if (!formularioCaptura) {
      return null;
    }

    const { visita, empresa, empresaConsultor, consultor } = formularioCaptura;

    return (
      <View style={styles.captureLayer} pointerEvents="none">
        <View
          ref={formularioCapturaRef}
          collapsable={false}
          style={styles.captureDocument}
        >
          <View style={styles.captureTopBar} />
          <View style={styles.captureHeader}>
            <View style={styles.captureBrand}>
              <View style={styles.captureLogoBox}>
                {empresaConsultor.logo_pequena ? (
                  <Image
                    source={{ uri: empresaConsultor.logo_pequena }}
                    style={styles.captureLogoImage}
                  />
                ) : (
                  <View style={styles.captureTestLogo}>
                    <View style={styles.captureTestLogoIcon}>
                      <Text style={styles.captureTestLogoIconText}>+</Text>
                    </View>
                    <View>
                      <Text style={styles.captureTestLogoName}>FACILITE</Text>
                      <Text style={styles.captureTestLogoSub}>CONSULTORIA</Text>
                    </View>
                  </View>
                )}
              </View>
              <View style={styles.captureContact}>
                {!!empresaConsultor.telefone && (
                  <Text style={styles.captureContactText}>Tel: {empresaConsultor.telefone}</Text>
                )}
                {!!empresaConsultor.celular && (
                  <Text style={styles.captureContactText}>Cel: {empresaConsultor.celular}</Text>
                )}
                {!!empresaConsultor.email && (
                  <Text style={styles.captureContactText}>{empresaConsultor.email}</Text>
                )}
              </View>
            </View>

            <View style={styles.captureCompany}>
              <Text style={styles.captureCompanyName}>
                {empresaConsultor.nome || 'Empresa do Consultor'}
              </Text>
              <Text style={styles.captureCompanyAddress}>
                {enderecoConsultorLote(empresaConsultor)}
              </Text>
            </View>
          </View>

          <View style={styles.captureProtocol}>
            <Text style={styles.captureProtocolLabel}>EMPRESA ATENDIDA</Text>
            <Text style={styles.captureProtocolValue}>{empresa.nome_fantasia}</Text>
          </View>

          <View style={styles.captureGrid}>
            {[
              ['Consultor', consultor?.nome || 'Nao informado'],
              ['Data da visita', formatarDataBR(visita.data_visita)],
              ['Protocolo de atendimento', visita.protocolo_atendimento || 'Nao informado'],
              ['Solicitante', visita.solicitante || 'Nao informado'],
              ['Horario de inicio', visita.hora_inicio || '--:--'],
              ['Horario de termino', visita.hora_termino || '--:--'],
            ].map(([label, value]) => (
              <View key={label} style={styles.captureInfoItem}>
                <Text style={styles.captureInfoLabel}>{label}</Text>
                <Text style={styles.captureInfoValue}>{value}</Text>
              </View>
            ))}
          </View>

          <View style={styles.captureSectionHeader}>
            <View style={styles.captureSectionRule} />
            <Text style={styles.captureSectionTitle}>DESCRIÇÃO DO ATENDIMENTO</Text>
            <View style={styles.captureSectionRule} />
          </View>

          <View style={styles.captureDescription}>
            {empresaConsultor.logo_media ? (
              <Image
                source={{ uri: empresaConsultor.logo_media }}
                style={styles.captureWatermark}
              />
            ) : (
              <View style={styles.captureTestWatermark}>
                <Text style={styles.captureTestWatermarkText}>FACILITE</Text>
              </View>
            )}
            <Text style={styles.captureDescriptionText}>{visita.descricao}</Text>
          </View>

          <View style={styles.captureMessage}>
            <Text style={styles.captureMessageText}>
              {empresaConsultor.mensagem_formulario ||
                'O cliente declara que os procedimentos acima relacionados foram executados e concorda com as informacoes descritas neste formulario.'}
            </Text>
          </View>

          <View style={styles.captureSignature}>
            {visita.assinatura && !visita.assinatura.startsWith('data:image/svg') ? (
              <Image source={{ uri: visita.assinatura }} style={styles.captureSignatureImage} />
            ) : (
              <Text style={styles.captureSignatureFallback}>Assinatura confirmada</Text>
            )}
            <View style={styles.captureSignatureLine} />
            <Text style={styles.captureSignatureLabel}>Assinatura do Cliente</Text>
          </View>
        </View>
      </View>
    );
  };

  const grupos = agruparPorData();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FC" />
      
      <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? 50 : STATUS_BAR_HEIGHT + 8 }]}>
        <TouchableOpacity onPress={handleVoltar} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Visitas</Text>
        <View style={styles.placeholderRight} />
      </View>

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

      <TouchableOpacity 
        style={styles.relatorioButton}
        onPress={gerarRelatorioPorData}
        disabled={gerandoRelatorio}
      >
        {gerandoRelatorio ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Text style={styles.relatorioButtonIcon}>📦</Text>
            <Text style={styles.relatorioButtonText}>Lote de Visitas por Data</Text>
          </>
        )}
      </TouchableOpacity>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2463EB" />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      ) : Object.keys(grupos).length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>Nenhuma empresa ativa cadastrada</Text>
          <Text style={styles.emptySubtext}>
            Cadastre ou ative uma empresa para abrir o formulário de visita
          </Text>
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
                    {formatarDataBR(data)}
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
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalFormatoVisible}
        onRequestClose={handleFecharModal}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleFecharModal}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Lote de Visitas</Text>
            <Text style={styles.modalSubtitle}>
              Escolha o formato dos formulários dentro do ZIP
            </Text>

            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => handleSelecionarFormato('pdf')}
            >
              <Text style={styles.modalItemIcon}>↪</Text>
              <Text style={styles.modalItemText}>PDF</Text>
              <Text style={styles.modalItemArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => handleSelecionarFormato('png')}
            >
              <Text style={styles.modalItemIcon}>↪</Text>
              <Text style={styles.modalItemText}>PNG</Text>
              <Text style={styles.modalItemArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={handleFecharModal}
            >
              <Text style={styles.modalCancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      {renderFormularioCapturaPng()}
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
  captureLayer: {
    position: 'absolute',
    left: -10000,
    top: 0,
    width: 760,
    backgroundColor: '#FFFFFF',
  },
  captureDocument: {
    width: 760,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7DEEA',
    borderRadius: 8,
    paddingHorizontal: 22,
    paddingBottom: 22,
    overflow: 'hidden',
  },
  captureTopBar: {
    height: 10,
    marginHorizontal: -22,
    marginBottom: 20,
    backgroundColor: '#1769AA',
  },
  captureHeader: {
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
  captureBrand: {
    width: 190,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  captureLogoBox: {
    width: 160,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  captureLogoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  captureTestLogo: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  captureTestLogoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1769AA',
  },
  captureTestLogoIconText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  captureTestLogoName: {
    fontSize: 21,
    fontWeight: '800',
    color: '#1769AA',
    lineHeight: 23,
  },
  captureTestLogoSub: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 2,
  },
  captureContact: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  captureContactText: {
    fontSize: 12,
    lineHeight: 17,
    color: '#4B5563',
    textAlign: 'center',
  },
  captureCompany: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  captureCompanyName: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
    textAlign: 'center',
  },
  captureCompanyAddress: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 19,
    textAlign: 'center',
  },
  captureProtocol: {
    backgroundColor: '#EEF6FD',
    borderLeftWidth: 5,
    borderLeftColor: '#1769AA',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  captureProtocolLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1769AA',
    marginBottom: 4,
  },
  captureProtocolValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  captureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 18,
  },
  captureInfoItem: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  captureInfoLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B7280',
    marginBottom: 4,
  },
  captureInfoValue: {
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
  captureSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  captureSectionRule: {
    flex: 1,
    height: 1,
    backgroundColor: '#DDE3EE',
  },
  captureSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },
  captureDescription: {
    minHeight: 250,
    borderWidth: 1,
    borderColor: '#DDE3EE',
    borderRadius: 8,
    padding: 18,
    marginBottom: 18,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  captureWatermark: {
    position: 'absolute',
    alignSelf: 'center',
    top: 70,
    width: 320,
    height: 120,
    opacity: 0.07,
    resizeMode: 'contain',
  },
  captureTestWatermark: {
    position: 'absolute',
    alignSelf: 'center',
    top: 100,
    opacity: 0.07,
  },
  captureTestWatermarkText: {
    fontSize: 54,
    fontWeight: '800',
    color: '#1769AA',
  },
  captureDescriptionText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#1F2937',
    zIndex: 1,
  },
  captureMessage: {
    minHeight: 66,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1769AA',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 22,
  },
  captureMessageText: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
    textAlign: 'center',
  },
  captureSignature: {
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
  captureSignatureImage: {
    width: '70%',
    height: 82,
    resizeMode: 'contain',
  },
  captureSignatureFallback: {
    fontSize: 23,
    color: '#111827',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  captureSignatureLine: {
    width: '76%',
    borderBottomWidth: 1,
    borderBottomColor: '#111827',
    marginBottom: 8,
  },
  captureSignatureLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
});
