/**
 * TELA: RelatoriosScreen
 *
 * Exibe os relatorios disponiveis e renderiza a pre-visualizacao no
 * layout padrao do Facilite.
 */

import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootDrawerParamList } from '../types/navigation';
import { useEmpresa } from '../contexts/EmpresaContext';
import RelatorioDocumento, {
  RELATORIO_DOCUMENTO_A4_HEIGHT,
  RELATORIO_DOCUMENTO_A4_WIDTH,
} from '../components/Relatorios/RelatorioDocumento';
import {
  carregarRelatorio,
  RelatorioDados,
  RelatorioId,
  RelatorioOpcoes,
} from '../services/relatoriosService';
import {
  compartilharRelatorioPdf,
  paginarLinhasRelatorio,
  RELATORIO_LINHAS_POR_PAGINA,
} from '../services/relatorioPdfService';

const STATUS_BAR_HEIGHT = StatusBar.currentHeight || 0;
const LINHAS_POR_PAGINA = RELATORIO_LINHAS_POR_PAGINA;

const converterDataBRParaBanco = (valor: string) => {
  const limpa = valor.trim();
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(limpa);

  if (!match) {
    return null;
  }

  const [, diaTexto, mesTexto, anoTexto] = match;
  const dia = Number(diaTexto);
  const mes = Number(mesTexto);
  const ano = Number(anoTexto);
  const data = new Date(ano, mes - 1, dia);

  if (
    data.getFullYear() !== ano ||
    data.getMonth() !== mes - 1 ||
    data.getDate() !== dia
  ) {
    return null;
  }

  return `${anoTexto}-${mesTexto}-${diaTexto}`;
};

const formatarDataDigitada = (valor: string) => {
  const digitos = valor.replace(/\D/g, '').slice(0, 8);
  const partes = [
    digitos.slice(0, 2),
    digitos.slice(2, 4),
    digitos.slice(4, 8),
  ].filter(Boolean);

  return partes.join('/');
};

type RelatoriosScreenNavigationProp = DrawerNavigationProp<
  RootDrawerParamList,
  'Relatorios'
>;

type RelatorioItem = {
  id: RelatorioId;
  titulo: string;
  icone: string;
  cor: string;
};

const RELATORIOS: RelatorioItem[] = [
  { id: 'clientes_rota', titulo: 'Clientes da Rota', icone: '🗺️', cor: '#2463EB' },
  { id: 'visitas_data', titulo: 'Visita de Clientes Por Data', icone: '📅', cor: '#34C759' },
  { id: 'clientes_sem_visita', titulo: 'Clientes Que Não Visita a N Dias', icone: '⚠️', cor: '#FF3B30' },
  { id: 'clientes_mais_visitados', titulo: 'Clientes Mais Visitados', icone: '📈', cor: '#FF9500' },
  { id: 'clientes_menos_visitados', titulo: 'Clientes Menos Visitados', icone: '📉', cor: '#5856D6' },
];

export default function RelatoriosScreen() {
  const navigation = useNavigation<RelatoriosScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const { width: larguraTela } = useWindowDimensions();
  const { empresa } = useEmpresa();
  const [modalDiasVisible, setModalDiasVisible] = useState(false);
  const [modalPeriodoVisible, setModalPeriodoVisible] = useState(false);
  const [modalRelatorioVisible, setModalRelatorioVisible] = useState(false);
  const [dias, setDias] = useState('');
  const [dataInicial, setDataInicial] = useState('');
  const [dataFinal, setDataFinal] = useState('');
  const [selectedRelatorio, setSelectedRelatorio] = useState<RelatorioItem | null>(null);
  const [relatorioDados, setRelatorioDados] = useState<RelatorioDados | null>(null);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [loading, setLoading] = useState(false);
  const [compartilhandoPdf, setCompartilhandoPdf] = useState(false);

  const totalPaginas = relatorioDados
    ? paginarLinhasRelatorio(
        relatorioDados.linhas,
        LINHAS_POR_PAGINA,
        Boolean(relatorioDados.resumoFinal)
      ).length
    : 1;
  const escalaPreview = Math.min(
    (larguraTela - 24) / RELATORIO_DOCUMENTO_A4_WIDTH,
    1
  );
  const larguraPreview = RELATORIO_DOCUMENTO_A4_WIDTH * escalaPreview;
  const alturaPreview = RELATORIO_DOCUMENTO_A4_HEIGHT * escalaPreview;

  const handleVoltar = () => {
    navigation.goBack();
  };

  const abrirRelatorio = async (
    item: RelatorioItem,
    opcoes?: RelatorioOpcoes
  ) => {
    setLoading(true);

    try {
      const dados = await carregarRelatorio(item.id, opcoes);
      setRelatorioDados(dados);
      setSelectedRelatorio(item);
      setPaginaAtual(1);
      setModalRelatorioVisible(true);
    } catch (error) {
      console.error('Erro ao carregar relatorio:', error);
      Alert.alert('Erro', 'Nao foi possivel carregar o relatorio.');
    } finally {
      setLoading(false);
    }
  };

  const handleRelatorioPress = (item: RelatorioItem) => {
    setSelectedRelatorio(item);

    if (item.id === 'clientes_sem_visita') {
      setModalDiasVisible(true);
      return;
    }

    if (item.id === 'visitas_data' || item.id === 'clientes_mais_visitados') {
      setDataInicial('');
      setDataFinal('');
      setModalPeriodoVisible(true);
      return;
    }

    abrirRelatorio(item);
  };

  const handleConfirmarDias = () => {
    const numeroDias = parseInt(dias, 10);

    if (isNaN(numeroDias) || numeroDias <= 0) {
      Alert.alert('Erro', 'Digite um numero de dias valido');
      return;
    }

    if (!selectedRelatorio) {
      return;
    }

    setModalDiasVisible(false);
    setDias('');
    abrirRelatorio(selectedRelatorio, { dias: numeroDias });
  };

  const handleConfirmarPeriodo = () => {
    const dataInicialBanco = converterDataBRParaBanco(dataInicial);
    const dataFinalBanco = converterDataBRParaBanco(dataFinal);

    if (!dataInicialBanco || !dataFinalBanco) {
      Alert.alert('Erro', 'Digite as datas no formato DD/MM/AAAA.');
      return;
    }

    if (dataInicialBanco > dataFinalBanco) {
      Alert.alert('Erro', 'A data inicial nao pode ser maior que a data final.');
      return;
    }

    if (!selectedRelatorio) {
      return;
    }

    setModalPeriodoVisible(false);
    setDataInicial('');
    setDataFinal('');
    abrirRelatorio(selectedRelatorio, {
      dataInicial: dataInicialBanco,
      dataFinal: dataFinalBanco,
    });
  };

  const fecharRelatorio = () => {
    setModalRelatorioVisible(false);
    setRelatorioDados(null);
    setPaginaAtual(1);
    setCompartilhandoPdf(false);
  };

  const irPaginaAnterior = () => {
    setPaginaAtual((pagina) => Math.max(pagina - 1, 1));
  };

  const irProximaPagina = () => {
    setPaginaAtual((pagina) => Math.min(pagina + 1, totalPaginas));
  };

  const compartilharRelatorioSelecionado = async () => {
    if (!relatorioDados) {
      return;
    }

    try {
      setCompartilhandoPdf(true);
      await compartilharRelatorioPdf(
        relatorioDados,
        empresa.logoPequena
      );
    } catch (error) {
      console.error('Erro ao compartilhar relatorio PDF:', error);
      Alert.alert('Erro', 'Nao foi possivel gerar o PDF do relatorio.');
    } finally {
      setCompartilhandoPdf(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FC" />

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
            style={[styles.card, { borderLeftColor: item.cor }]}
            onPress={() => handleRelatorioPress(item)}
            activeOpacity={0.7}
            disabled={loading}
          >
            <View style={styles.cardContent}>
              <View style={[styles.iconContainer, { backgroundColor: `${item.cor}20` }]}>
                <Text style={styles.icon}>{item.icone}</Text>
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.titulo}>{item.titulo}</Text>
                {item.id === 'clientes_sem_visita' && (
                  <Text style={styles.subtitulo}>Definir quantidade de dias</Text>
                )}
              </View>
              {loading && selectedRelatorio?.id === item.id ? (
                <ActivityIndicator color={item.cor} />
              ) : (
                <Text style={styles.arrow}>→</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal
        animationType="fade"
        transparent
        visible={modalDiasVisible}
        onRequestClose={() => setModalDiasVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Clientes Que Nao Visita a N Dias</Text>
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
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setModalDiasVisible(false);
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
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={modalPeriodoVisible}
        onRequestClose={() => setModalPeriodoVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalKeyboardAvoiding}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
        >
          <View style={styles.modalPeriodoOverlay}>
            <View style={styles.modalPeriodoContent}>
              <Text style={styles.modalTitle}>
                {selectedRelatorio?.titulo || 'Período de Análise'}
              </Text>
              <Text style={styles.modalSubtitle}>
                Informe o período da análise
              </Text>

              <Text style={styles.modalLabel}>Data Inicial</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="DD/MM/AAAA"
                placeholderTextColor="#ADB5BD"
                keyboardType="numeric"
                value={dataInicial}
                onChangeText={(texto) => setDataInicial(formatarDataDigitada(texto))}
                maxLength={10}
              />

              <Text style={styles.modalLabel}>Data Final</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="DD/MM/AAAA"
                placeholderTextColor="#ADB5BD"
                keyboardType="numeric"
                value={dataFinal}
                onChangeText={(texto) => setDataFinal(formatarDataDigitada(texto))}
                maxLength={10}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => {
                    setModalPeriodoVisible(false);
                    setDataInicial('');
                    setDataFinal('');
                  }}
                >
                  <Text style={styles.modalButtonCancelText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonConfirm]}
                  onPress={handleConfirmarPeriodo}
                >
                  <Text style={styles.modalButtonConfirmText}>Gerar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        animationType="slide"
        visible={modalRelatorioVisible}
        onRequestClose={fecharRelatorio}
      >
        <SafeAreaView style={styles.previewContainer}>
          <View style={[styles.previewHeader, { paddingTop: insets.top + 10 }]}>
            <Text style={styles.previewTitle}>
              {relatorioDados?.titulo || selectedRelatorio?.titulo || 'Relatório'}
            </Text>
            <View style={styles.previewActions}>
              {relatorioDados && (
                <TouchableOpacity
                  style={[
                    styles.pdfButton,
                    compartilhandoPdf && styles.buttonDisabled,
                  ]}
                  onPress={compartilharRelatorioSelecionado}
                  disabled={compartilhandoPdf}
                >
                  <Text style={styles.pdfButtonText}>
                    {compartilhandoPdf ? 'Gerando...' : 'PDF'}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.closeButton} onPress={fecharRelatorio}>
                <Text style={styles.closeButtonText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={styles.previewScroll}
            contentContainerStyle={styles.previewScrollContent}
            showsVerticalScrollIndicator
          >
            {relatorioDados ? (
              <View
                style={[
                  styles.previewDocumentoFrame,
                  {
                    width: larguraPreview,
                    height: alturaPreview,
                  },
                ]}
              >
                <View
                  style={[
                    styles.previewDocumentoScale,
                    {
                      transform: [
                        {
                          translateX:
                            -(
                              RELATORIO_DOCUMENTO_A4_WIDTH *
                              (1 - escalaPreview)
                            ) / 2,
                        },
                        {
                          translateY:
                            -(
                              RELATORIO_DOCUMENTO_A4_HEIGHT *
                              (1 - escalaPreview)
                            ) / 2,
                        },
                        { scale: escalaPreview },
                      ],
                    },
                  ]}
                >
                  <RelatorioDocumento
                    titulo={relatorioDados.titulo}
                    colunas={relatorioDados.colunas}
                    linhas={relatorioDados.linhas}
                    logoUri={empresa.logoPequena}
                    paginaAtual={paginaAtual}
                    linhasPorPagina={LINHAS_POR_PAGINA}
                    geradoEm={relatorioDados.geradoEm}
                    periodoAnalise={relatorioDados.periodoAnalise}
                    resumoFinal={relatorioDados.resumoFinal}
                  />
                </View>
              </View>
            ) : (
              <ActivityIndicator color="#2463EB" />
            )}
          </ScrollView>

          <View
            style={[
              styles.paginationBar,
              { paddingBottom: Math.max(insets.bottom + 18, 28) },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.paginationButton,
                paginaAtual <= 1 && styles.paginationButtonDisabled,
              ]}
              onPress={irPaginaAnterior}
              disabled={paginaAtual <= 1}
            >
              <Text style={styles.paginationButtonText}>Anterior</Text>
            </TouchableOpacity>

            <Text style={styles.paginationText}>
              Página {paginaAtual}/{totalPaginas}
            </Text>

            <TouchableOpacity
              style={[
                styles.paginationButton,
                paginaAtual >= totalPaginas && styles.paginationButtonDisabled,
              ]}
              onPress={irProximaPagina}
              disabled={paginaAtual >= totalPaginas}
            >
              <Text style={styles.paginationButtonText}>Próxima</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
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
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '82%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 22,
  },
  modalKeyboardAvoiding: {
    flex: 1,
  },
  modalPeriodoOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  modalPeriodoContent: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '88%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 22,
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
  modalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#495057',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#F8F9FC',
    borderRadius: 8,
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
    borderRadius: 8,
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
  previewContainer: {
    flex: 1,
    backgroundColor: '#E9EEF7',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#DDE3EE',
  },
  previewTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginRight: 10,
  },
  previewActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  closeButton: {
    backgroundColor: '#2463EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pdfButton: {
    backgroundColor: '#1769AA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  pdfButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  previewScroll: {
    flex: 1,
  },
  previewScrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  previewDocumentoFrame: {
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  previewDocumentoScale: {
    width: RELATORIO_DOCUMENTO_A4_WIDTH,
    height: RELATORIO_DOCUMENTO_A4_HEIGHT,
  },
  paginationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#DDE3EE',
  },
  paginationButton: {
    backgroundColor: '#1769AA',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  paginationButtonDisabled: {
    opacity: 0.45,
  },
  paginationButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  paginationText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },
});
