import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type {
  RelatorioColuna,
  RelatorioDados,
  RelatorioLinha,
} from './relatoriosService';

const PDF_WIDTH = 595;
const PDF_HEIGHT = 842;

export const RELATORIO_LINHAS_POR_PAGINA = 36;

const escaparHtml = (valor?: string | null) =>
  String(valor || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

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
    console.warn('Nao foi possivel preparar logo para PDF:', error);
    return uri;
  }
};

const formatarData = (data: Date) => data.toLocaleDateString('pt-BR');

const formatarHora = (data: Date) =>
  data.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

const dataArquivo = (data: Date) => {
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = String(data.getFullYear()).slice(-2);

  return `${dia}${mes}${ano}`;
};

const renderizarCabecalho = (
  titulo: string,
  logoPdf: string | null,
  pagina: number,
  totalPaginas: number,
  geradoEm: Date,
  periodoAnalise?: string
) => `
  <div class="linha-topo"></div>
  <header class="cabecalho">
    <div class="logo-box">
      ${
        logoPdf
          ? `<img src="${escaparHtml(logoPdf)}" class="logo" />`
          : '<div class="logo-texto">FACILITE</div>'
      }
    </div>
    <div class="titulo-box">
      <div class="titulo">${escaparHtml(titulo)}</div>
    </div>
    <div class="meta-box">
      <div>PAGINA: ${pagina}/${totalPaginas}</div>
      <div>DATA: ${formatarData(geradoEm)}</div>
      <div>HORA: ${formatarHora(geradoEm)}</div>
      ${
        periodoAnalise
          ? `<div>PERIODO: ${escaparHtml(periodoAnalise)}</div>`
          : ''
      }
    </div>
  </header>
  <div class="linha-dupla"></div>
`;

const renderizarColunas = (colunas: RelatorioColuna[]) => `
  <div class="tabela-cabecalho">
    ${colunas
      .map(
        (coluna) =>
          `<div class="cabecalho-celula" style="flex:${coluna.flex || 1};text-align:${
            coluna.align || 'left'
          }">${escaparHtml(coluna.titulo)}</div>`
      )
      .join('')}
  </div>
`;

const renderizarLinha = (
  linha: RelatorioLinha,
  colunas: RelatorioColuna[],
  index: number
) => `
  <div class="tabela-linha ${linha.__espacoAntes === '1' ? 'com-espaco' : ''} ${
    index % 2 === 1 ? 'zebra' : ''
  }">
    ${colunas
      .map(
        (coluna) =>
          `<div class="celula" style="flex:${coluna.flex || 1};text-align:${
            coluna.align || 'left'
          }">${escaparHtml(linha[coluna.chave])}</div>`
      )
      .join('')}
  </div>
`;

const gerarHtmlRelatorio = async (
  relatorio: RelatorioDados,
  logoUri?: string | null,
  linhasPorPagina = RELATORIO_LINHAS_POR_PAGINA
) => {
  const logoPdf = await resolverImagemParaPdf(logoUri);
  const totalPaginas = Math.max(
    Math.ceil(relatorio.linhas.length / linhasPorPagina),
    1
  );

  const paginas = Array.from({ length: totalPaginas }, (_, indice) => {
    const pagina = indice + 1;
    const inicio = indice * linhasPorPagina;
    const linhas = relatorio.linhas.slice(inicio, inicio + linhasPorPagina);

    return `
      <section class="pagina">
        ${renderizarCabecalho(
          relatorio.titulo,
          logoPdf,
          pagina,
          totalPaginas,
          relatorio.geradoEm,
          relatorio.periodoAnalise
        )}
        <main class="tabela">
          ${renderizarColunas(relatorio.colunas)}
          ${
            linhas.length === 0
              ? '<div class="linha-vazia">Nenhum registro encontrado para este relatorio.</div>'
              : linhas
                  .map((linha, index) =>
                    renderizarLinha(linha, relatorio.colunas, index)
                  )
                  .join('')
          }
        </main>
        ${
          relatorio.resumoFinal && pagina === totalPaginas
            ? `<div class="resumo-final">${escaparHtml(relatorio.resumoFinal)}</div>`
            : ''
        }
        <footer class="rodape">
          <div class="rodape-linha"></div>
          <div class="rodape-texto">Facilite</div>
          <div class="rodape-linha"></div>
        </footer>
      </section>
    `;
  });

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          @page { margin: 0; size: A4; }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            margin: 0;
            font-family: Arial, Helvetica, sans-serif;
            color: #000000;
            background: #ffffff;
          }
          .pagina {
            width: 210mm;
            height: 297mm;
            page-break-after: always;
            position: relative;
            padding: 20px 24px 42px;
          }
          .pagina:last-child {
            page-break-after: auto;
          }
          .linha-topo {
            height: 2px;
            background: #111111;
            margin-bottom: 4px;
          }
          .cabecalho {
            display: flex;
            align-items: center;
            min-height: 60px;
          }
          .logo-box {
            width: 185px;
          }
          .logo {
            max-width: 165px;
            max-height: 48px;
            object-fit: contain;
          }
          .logo-texto {
            color: #087C1D;
            font-size: 18px;
            font-weight: 800;
          }
          .titulo-box {
            flex: 1;
            text-align: center;
            padding: 0 10px;
          }
          .titulo {
            font-size: 22px;
            line-height: 25px;
            font-weight: 800;
          }
          .meta-box {
            width: 190px;
            text-align: right;
            font-size: 15px;
            line-height: 19px;
          }
          .linha-dupla {
            height: 4px;
            border-top: 2px solid #111111;
            border-bottom: 1px solid #111111;
            margin-bottom: 2px;
          }
          .tabela-cabecalho {
            display: flex;
            border-bottom: 2px solid #111111;
          }
          .cabecalho-celula {
            padding: 3px 6px;
            font-size: 12px;
            font-weight: 500;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            min-width: 0;
          }
          .tabela-linha {
            display: flex;
            min-height: 18px;
            align-items: center;
            background: #ffffff;
          }
          .tabela-linha.com-espaco {
            margin-top: 18px;
          }
          .tabela-linha.zebra {
            background: #C6DEC5;
          }
          .celula {
            padding: 2px 6px;
            font-size: 12px;
            line-height: 15px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            min-width: 0;
          }
          .linha-vazia {
            min-height: 80px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #6B7280;
            font-size: 13px;
          }
          .resumo-final {
            margin-top: 16px;
            padding-right: 8px;
            text-align: right;
            font-size: 13px;
            font-weight: 800;
          }
          .rodape {
            position: absolute;
            left: 24px;
            right: 24px;
            bottom: 20px;
            display: flex;
            align-items: center;
          }
          .rodape-linha {
            flex: 1;
            height: 1px;
            background: #111111;
          }
          .rodape-texto {
            padding: 0 6px;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        ${paginas.join('')}
      </body>
    </html>
  `;
};

export const compartilharRelatorioClientesRotaPdf = async (
  relatorio: RelatorioDados,
  logoUri?: string | null
) => {
  const disponivel = await Sharing.isAvailableAsync();

  if (!disponivel) {
    throw new Error('Compartilhamento nao disponivel neste dispositivo');
  }

  const html = await gerarHtmlRelatorio(relatorio, logoUri);
  const pdf = await Print.printToFileAsync({
    html,
    width: PDF_WIDTH,
    height: PDF_HEIGHT,
    base64: false,
  });

  const nomeArquivo = `clientesdarota${dataArquivo(relatorio.geradoEm)}.pdf`;
  const destino = `${FileSystem.cacheDirectory}${nomeArquivo}`;

  await FileSystem.copyAsync({
    from: pdf.uri,
    to: destino,
  });

  await Sharing.shareAsync(destino, {
    mimeType: 'application/pdf',
    dialogTitle: 'Compartilhar Clientes da Rota',
    UTI: 'com.adobe.pdf',
  });
};
