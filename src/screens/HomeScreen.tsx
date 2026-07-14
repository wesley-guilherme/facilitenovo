/**
 * TELA: HomeScreen (Tela Inicial)
 *
 * FUNCAO:
 * Exibe a tela principal do aplicativo com os cards de navegacao.
 * - Boas-vindas com o nome do consultor logado (do contexto)
 * - Cards para acessar as funcionalidades
 * - Sino com empresas que precisam de visita conforme configuracao
 */

import React, { useCallback, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootDrawerParamList } from '../types/navigation';
import { useConsultor } from '../contexts/ConsultorContext';
import {
  EmpresaAvisoVisita,
  ResumoAvisosVisita,
  carregarResumoAvisosVisita,
  formatarDataBR,
} from '../services/visitasAvisoService';

type HomeScreenNavigationProp = DrawerNavigationProp<RootDrawerParamList, 'Home'>;

const menuItems = [
  { id: 'perfil', title: 'Meu Perfil', icon: '👤' },
  { id: 'empresa', title: 'Cadastrar Empresa', icon: '🏢' },
  { id: 'visita', title: 'Visita In Loco', icon: '🏍️' },
  { id: 'relatorios', title: 'Relatórios', icon: '📊' },
  { id: 'textos', title: 'Textos Predefinidos', icon: '💬' },
];

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { consultor } = useConsultor();
  const [resumoAvisos, setResumoAvisos] = useState<ResumoAvisosVisita | null>(null);
  const [carregandoAvisos, setCarregandoAvisos] = useState(false);
  const [modalAvisosVisible, setModalAvisosVisible] = useState(false);

  const totalPendentes = resumoAvisos?.totalPendentes || 0;

  const carregarAvisos = useCallback(async () => {
    setCarregandoAvisos(true);
    try {
      const resumo = await carregarResumoAvisosVisita();
      setResumoAvisos(resumo);
    } catch (error) {
      console.error('Erro ao carregar avisos de visita:', error);
      setResumoAvisos(null);
    } finally {
      setCarregandoAvisos(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarAvisos();
    }, [carregarAvisos])
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={styles.notificationButton}
          activeOpacity={0.7}
          onPress={() => setModalAvisosVisible(true)}
        >
          <Text style={styles.notificationIcon}>🔔</Text>
          {totalPendentes > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {totalPendentes > 99 ? '99+' : totalPendentes}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      ),
    });
  }, [navigation, totalPendentes]);

  const nomeConsultor = consultor?.nome && consultor.nome.trim() !== ''
    ? consultor.nome
    : 'Consultor';

  const handleNavigate = (title: string) => {
    if (title === 'Meu Perfil') {
      navigation.navigate('MeuPerfil');
    } else if (title === 'Cadastrar Empresa') {
      navigation.navigate('Empresas');
    } else if (title === 'Relatórios') {
      navigation.navigate('Relatorios');
    } else if (title === 'Visita In Loco') {
      navigation.navigate('Visitas');
    } else if (title === 'Textos Predefinidos') {
      navigation.navigate('TextosPredefinidos');
    } else {
      Alert.alert('Navegacao', `Ir para: ${title}`);
    }
  };

  const abrirFormularioEmpresa = (empresa: EmpresaAvisoVisita) => {
    setModalAvisosVisible(false);
    navigation.navigate('FormularioVisita', { empresa });
  };

  const textoStatusEmpresa = (empresa: EmpresaAvisoVisita) => {
    if (!empresa.ultimaVisita) {
      return 'Nunca visitada';
    }

    if (empresa.statusAtraso === 'critico') {
      return `${empresa.diasDesdeUltimaVisita} dias sem visita`;
    }

    return `Faltam ${empresa.diasRestantes} dias`;
  };

  const renderEmpresaAviso = (empresa: EmpresaAvisoVisita) => (
    <TouchableOpacity
      key={empresa.id}
      style={styles.avisoItem}
      activeOpacity={0.75}
      onPress={() => abrirFormularioEmpresa(empresa)}
    >
      <View style={styles.avisoItemInfo}>
        <Text style={styles.avisoEmpresaNome}>{empresa.nome_fantasia}</Text>
        <Text style={styles.avisoEmpresaDetalhe}>
          {empresa.ultimaVisita
            ? `Ultima visita: ${formatarDataBR(empresa.ultimaVisita.data_visita)}`
            : 'Sem visita registrada'}
        </Text>
      </View>
      <Text
        style={[
          styles.avisoStatus,
          empresa.statusAtraso === 'critico' ? styles.avisoStatusCritico : styles.avisoStatusAtencao,
        ]}
      >
        {textoStatusEmpresa(empresa)}
      </Text>
    </TouchableOpacity>
  );

  const renderSecaoAvisos = (
    titulo: string,
    empresas: EmpresaAvisoVisita[],
    vazio: string
  ) => (
    <View style={styles.avisoSection}>
      <Text style={styles.avisoSectionTitle}>{titulo}</Text>
      {empresas.length > 0 ? (
        empresas.map(renderEmpresaAviso)
      ) : (
        <Text style={styles.avisoEmptyText}>{vazio}</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.welcomeArea}>
        <Text style={styles.welcomeText}>Olá, {nomeConsultor}!</Text>
        <Text style={styles.subtitleText}>O que deseja fazer hoje?</Text>
      </View>

      <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuCard}
            onPress={() => handleNavigate(item.title)}
            activeOpacity={0.7}
          >
            <View style={styles.menuCardLeft}>
              <Text style={styles.menuIconText}>{item.icon}</Text>
              <Text style={styles.menuTitle}>{item.title}</Text>
            </View>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal
        visible={modalAvisosVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalAvisosVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Visitas pendentes</Text>
                <Text style={styles.modalSubtitle}>
                  Aviso configurado para {resumoAvisos?.diasAviso || 30} dias
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setModalAvisosVisible(false)}
              >
                <Text style={styles.modalCloseText}>Fechar</Text>
              </TouchableOpacity>
            </View>

            {carregandoAvisos ? (
              <View style={styles.loadingAvisos}>
                <ActivityIndicator size="small" color="#2463EB" />
                <Text style={styles.loadingAvisosText}>Carregando...</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {renderSecaoAvisos(
                  'Críticas',
                  resumoAvisos?.criticas || [],
                  'Nenhuma empresa crítica.'
                )}
                {renderSecaoAvisos(
                  'Em atenção',
                  resumoAvisos?.atencao || [],
                  'Nenhuma empresa próxima do prazo.'
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FC' },
  welcomeArea: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24 },
  welcomeText: { fontSize: 18, fontWeight: '600', color: '#1A1A1A', marginBottom: 4 },
  subtitleText: { fontSize: 14, color: '#6C757D' },
  menuContainer: { flex: 1, paddingHorizontal: 16 },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  menuCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  menuIconText: { fontSize: 24, color: '#2463EB' },
  menuTitle: { fontSize: 16, fontWeight: '500', color: '#1A1A1A' },
  menuArrow: { fontSize: 18, color: '#6C757D' },
  notificationButton: {
    padding: 8,
    width: 50,
    alignItems: 'flex-end',
    alignSelf: 'flex-start',
  },
  notificationIcon: {
    fontSize: 24,
    color: '#6C757D',
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(17, 24, 39, 0.38)',
  },
  modalContent: {
    maxHeight: '82%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  modalCloseButton: {
    minHeight: 34,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
  },
  modalCloseText: {
    color: '#2463EB',
    fontWeight: '700',
  },
  loadingAvisos: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingAvisosText: {
    color: '#6B7280',
    fontSize: 13,
  },
  avisoSection: {
    marginBottom: 18,
  },
  avisoSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  avisoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFBFD',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  avisoItemInfo: {
    flex: 1,
  },
  avisoEmpresaNome: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 3,
  },
  avisoEmpresaDetalhe: {
    color: '#6B7280',
    fontSize: 12,
  },
  avisoStatus: {
    maxWidth: 118,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '800',
  },
  avisoStatusCritico: {
    color: '#B91C1C',
  },
  avisoStatusAtencao: {
    color: '#B45309',
  },
  avisoEmptyText: {
    color: '#6B7280',
    fontSize: 13,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
  },
});
