/**
 * COMPONENTE: FormularioAssinadoPreview
 *
 * FUNCAO:
 * Renderiza o documento visual do formulario assinado para preview e captura PNG.
 */

import React, { forwardRef } from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { EmpresaConsultor } from '../../contexts/EmpresaContext';
import type { Consultor } from '../../contexts/ConsultorContext';
import type { EmpresaDB } from '../../database/empresaRepository';

type FormularioAssinadoPreviewProps = {
  empresaConsultor: EmpresaConsultor;
  empresaSelecionada: EmpresaDB | null;
  consultor: Consultor | null;
  dataVisita: string;
  protocoloAtendimento: string;
  solicitante: string;
  horaInicio: string;
  horaTermino: string;
  descricao: string;
  assinatura: string | null;
  fixoParaPng?: boolean;
};

const FormularioAssinadoPreview = forwardRef<View, FormularioAssinadoPreviewProps>(
  (
    {
      empresaConsultor,
      empresaSelecionada,
      consultor,
      dataVisita,
      protocoloAtendimento,
      solicitante,
      horaInicio,
      horaTermino,
      descricao,
      assinatura,
      fixoParaPng = false,
    },
    ref
  ) => (
    <View
      ref={ref}
      collapsable={false}
      style={[
        styles.osDocument,
        fixoParaPng && styles.osDocumentPng,
      ]}
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
              .join(', ') || 'Endereço Não Informado'}
            {empresaConsultor.bairro ? ` - ${empresaConsultor.bairro}` : ''}
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
          <Text style={styles.osInfoValue}>{consultor?.nome || 'Não Informado'}</Text>
        </View>
        <View style={styles.osInfoItem}>
          <Text style={styles.osInfoLabel}>Data da visita</Text>
          <Text style={styles.osInfoValue}>{dataVisita}</Text>
        </View>
        <View style={styles.osInfoItem}>
          <Text style={styles.osInfoLabel}>Protocolo de atendimento</Text>
          <Text style={styles.osInfoValue}>
            {protocoloAtendimento.trim() || 'Não informado'}
          </Text>
        </View>
        <View style={styles.osInfoItem}>
          <Text style={styles.osInfoLabel}>Solicitante</Text>
          <Text style={styles.osInfoValue}>{solicitante || 'Não Informado'}</Text>
        </View>
        <View style={styles.osInfoItem}>
          <Text style={styles.osInfoLabel}>Horário de Início</Text>
          <Text style={styles.osInfoValue}>{horaInicio || '--:--'}</Text>
        </View>
        <View style={styles.osInfoItem}>
          <Text style={styles.osInfoLabel}>Horário de Término</Text>
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
  )
);

export default FormularioAssinadoPreview;

const styles = StyleSheet.create({
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
  osDocumentPng: {
    width: 760,
    maxWidth: 760,
    shadowOpacity: 0,
    elevation: 0,
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
