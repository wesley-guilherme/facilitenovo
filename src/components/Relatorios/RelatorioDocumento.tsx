import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type {
  RelatorioColuna,
  RelatorioLinha,
} from '../../services/relatoriosService';

type Props = {
  titulo: string;
  colunas: RelatorioColuna[];
  linhas: RelatorioLinha[];
  logoUri?: string | null;
  paginaAtual: number;
  linhasPorPagina: number;
  geradoEm: Date;
};

export const RELATORIO_DOCUMENTO_A4_WIDTH = 595;
export const RELATORIO_DOCUMENTO_A4_HEIGHT = 842;
const DOCUMENTO_PADDING_HORIZONTAL = 8;
const TABELA_WIDTH =
  RELATORIO_DOCUMENTO_A4_WIDTH - DOCUMENTO_PADDING_HORIZONTAL * 2;

const formatarData = (data: Date) => data.toLocaleDateString('pt-BR');

const formatarHora = (data: Date) =>
  data.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

export default function RelatorioDocumento({
  titulo,
  colunas,
  linhas,
  logoUri,
  paginaAtual,
  linhasPorPagina,
  geradoEm,
}: Props) {
  const totalPaginas = Math.max(Math.ceil(linhas.length / linhasPorPagina), 1);
  const paginaSegura = Math.min(Math.max(paginaAtual, 1), totalPaginas);
  const inicio = (paginaSegura - 1) * linhasPorPagina;
  const linhasPagina = linhas.slice(inicio, inicio + linhasPorPagina);

  return (
    <View style={styles.documento}>
      <View style={styles.linhaTopo} />

      <View style={styles.cabecalho}>
        <View style={styles.logoBox}>
          {logoUri ? (
            <Image source={{ uri: logoUri }} style={styles.logo} />
          ) : (
            <Text style={styles.logoTexto}>FACILITE</Text>
          )}
        </View>

        <View style={styles.tituloBox}>
          <Text style={styles.titulo}>{titulo}</Text>
        </View>

        <View style={styles.metaBox}>
          <Text style={styles.metaText}>
            PAGINA: {paginaSegura}/{totalPaginas}
          </Text>
          <Text style={styles.metaText}>
            DATA: {formatarData(geradoEm)}
          </Text>
          <Text style={styles.metaText}>
            HORA: {formatarHora(geradoEm)}
          </Text>
        </View>
      </View>

      <View style={styles.linhaDupla} />

      <View style={styles.tabela}>
        <View style={styles.tabelaCabecalho}>
          {colunas.map((coluna) => (
            <Text
              key={coluna.chave}
              style={[
                styles.cabecalhoCelula,
                { flex: coluna.flex || 1, textAlign: coluna.align || 'left' },
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {coluna.titulo}
            </Text>
          ))}
        </View>

        <View style={styles.linhasWrapper}>
          {linhasPagina.length === 0 ? (
            <View style={styles.linhaVazia}>
              <Text style={styles.linhaVaziaTexto}>
                Nenhum registro encontrado para este relatorio.
              </Text>
            </View>
          ) : (
            linhasPagina.map((linha, index) => (
              <View
                key={`${paginaSegura}-${index}`}
                style={[
                  styles.tabelaLinha,
                  index % 2 === 1 && styles.tabelaLinhaZebra,
                ]}
              >
                {colunas.map((coluna) => (
                  <Text
                    key={coluna.chave}
                    style={[
                      styles.celula,
                      {
                        flex: coluna.flex || 1,
                        textAlign: coluna.align || 'left',
                      },
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {linha[coluna.chave] || ''}
                  </Text>
                ))}
              </View>
            ))
          )}
        </View>
      </View>

      <View style={styles.rodape}>
        <View style={styles.rodapeLinha} />
        <Text style={styles.rodapeTexto}>Facilite</Text>
        <View style={styles.rodapeLinha} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  documento: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 34,
    width: RELATORIO_DOCUMENTO_A4_WIDTH,
    minHeight: RELATORIO_DOCUMENTO_A4_HEIGHT,
    position: 'relative',
  },
  linhaTopo: {
    height: 2,
    backgroundColor: '#111111',
    marginHorizontal: 4,
    marginBottom: 4,
  },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 60,
    marginBottom: 2,
  },
  logoBox: {
    width: 185,
    justifyContent: 'center',
    paddingLeft: 4,
  },
  logo: {
    width: 165,
    height: 48,
    resizeMode: 'contain',
  },
  logoTexto: {
    fontSize: 18,
    fontWeight: '800',
    color: '#087C1D',
  },
  tituloBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  titulo: {
    fontSize: 22,
    lineHeight: 25,
    fontWeight: '800',
    color: '#000000',
    textAlign: 'center',
  },
  metaBox: {
    width: 190,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 2,
  },
  metaText: {
    fontSize: 15,
    lineHeight: 19,
    color: '#000000',
    textAlign: 'right',
  },
  linhaDupla: {
    height: 4,
    borderTopWidth: 2,
    borderBottomWidth: 1,
    borderColor: '#111111',
    marginHorizontal: 4,
    marginBottom: 2,
  },
  tabela: {
    marginHorizontal: 0,
  },
  tabelaCabecalho: {
    minWidth: TABELA_WIDTH,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 2,
    borderBottomColor: '#111111',
  },
  cabecalhoCelula: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    fontSize: 12,
    fontWeight: '500',
    color: '#000000',
    minWidth: 0,
    overflow: 'hidden',
  },
  linhasWrapper: {
    minWidth: TABELA_WIDTH,
  },
  tabelaLinha: {
    flexDirection: 'row',
    minHeight: 18,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  tabelaLinhaZebra: {
    backgroundColor: '#C6DEC5',
  },
  celula: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 12,
    lineHeight: 15,
    color: '#000000',
    minWidth: 0,
    overflow: 'hidden',
  },
  linhaVazia: {
    minHeight: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  linhaVaziaTexto: {
    color: '#6B7280',
    fontSize: 13,
  },
  rodape: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  rodapeLinha: {
    flex: 1,
    height: 1,
    backgroundColor: '#111111',
  },
  rodapeTexto: {
    paddingHorizontal: 6,
    fontSize: 12,
    color: '#111111',
  },
});
