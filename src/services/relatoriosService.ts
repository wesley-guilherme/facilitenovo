/**
 * SERVICE: relatoriosService
 *
 * FUNCAO:
 * Monta os dados de cada relatorio a partir das tabelas locais.
 */

import { db } from '../database/initDatabase';

// Identificadores dos relatorios disponiveis na tela.
export type RelatorioId =
  | 'clientes_rota'
  | 'visitas_data'
  | 'clientes_sem_visita'
  | 'clientes_mais_visitados'
  | 'clientes_menos_visitados';

// Define uma coluna renderizada no preview e no PDF.
export type RelatorioColuna = {
  chave: string;
  titulo: string;
  flex?: number;
  align?: 'left' | 'center' | 'right';
};

export type RelatorioLinha = Record<string, string>;

// Opcoes de filtro enviadas pelos modais dos relatorios.
export type RelatorioOpcoes = {
  dias?: number;
  dataInicial?: string;
  dataFinal?: string;
};

// Estrutura final que a tela e o PDF conseguem renderizar.
export type RelatorioDados = {
  titulo: string;
  colunas: RelatorioColuna[];
  linhas: RelatorioLinha[];
  geradoEm: Date;
  periodoAnalise?: string;
  resumoFinal?: string;
};

type EmpresaRelatorio = {
  id: string;
  codigo_referencia: string;
  nome_fantasia: string;
  cidade: string;
  estado: string;
  contato: string;
  rota: string | null;
};

type VisitaRelatorio = {
  id: string;
  data_visita: string;
  hora_inicio: string;
  hora_termino: string;
  solicitante: string;
  protocolo_atendimento: string | null;
  nome_fantasia: string;
};

type EmpresaUltimaVisita = EmpresaRelatorio & {
  ultima_visita: string | null;
};

type EmpresaContagem = EmpresaRelatorio & {
  total_visitas: number;
};

// Formata data do banco para exibicao em portugues.
const formatarDataBR = (data?: string | null) => {
  if (!data) {
    return 'Nunca';
  }

  const partes = data.split('-');

  if (partes.length === 3) {
    const [ano, mes, dia] = partes;
    return `${dia}/${mes}/${ano}`;
  }

  return new Date(data).toLocaleDateString('pt-BR');
};

// Cria Date local para evitar deslocamento por fuso horario.
const criarDataLocal = (data: string) => {
  const [ano, mes, dia] = data.split('-').map(Number);
  return new Date(ano, mes - 1, dia);
};

// Calcula dias sem visita usando apenas data, sem horario.
const diasDesde = (data?: string | null) => {
  if (!data) {
    return 9999;
  }

  const hojeBase = new Date();
  const hoje = new Date(
    hojeBase.getFullYear(),
    hojeBase.getMonth(),
    hojeBase.getDate()
  );
  const dataBase = criarDataLocal(data);
  const diff = hoje.getTime() - dataBase.getTime();

  return Math.max(Math.floor(diff / (1000 * 60 * 60 * 24)), 0);
};

// Colunas reutilizadas em relatorios baseados em clientes.
const colunasClientes = (): RelatorioColuna[] => [
  { chave: 'codigo', titulo: 'COD.', flex: 0.8 },
  { chave: 'empresa', titulo: 'CLIENTE', flex: 2.5 },
  { chave: 'cidade', titulo: 'CIDADE/UF', flex: 1.5 },
  { chave: 'contato', titulo: 'CONTATO', flex: 1.5 },
];

// Converte empresa do banco para linha de relatorio.
const mapearEmpresa = (empresa: EmpresaRelatorio): RelatorioLinha => ({
  codigo: empresa.codigo_referencia || '-',
  empresa: empresa.nome_fantasia || '-',
  cidade: `${empresa.cidade || '-'}/${empresa.estado || '-'}`,
  contato: empresa.contato || '-',
});

// Carrega e monta o relatorio solicitado pela tela.
export const carregarRelatorio = async (
  id: RelatorioId,
  opcoes?: RelatorioOpcoes
): Promise<RelatorioDados> => {
  const geradoEm = new Date();

  if (id === 'clientes_rota') {
    const empresas = await db.getAllAsync<EmpresaRelatorio>(
      `SELECT id, codigo_referencia, nome_fantasia, cidade, estado, contato, rota
       FROM empresas
       WHERE ativo = 1
       AND deleted_at IS NULL
       ORDER BY nome_fantasia ASC`
    );

    return {
      titulo: 'Clientes da Rota',
      colunas: colunasClientes(),
      linhas: empresas.map(mapearEmpresa),
      geradoEm,
      resumoFinal: `Total de clientes na rota: ${empresas.length}`,
    };
  }

  if (id === 'visitas_data') {
    const visitas = await db.getAllAsync<VisitaRelatorio>(
      `SELECT
         v.id,
         v.data_visita,
         v.hora_inicio,
         v.hora_termino,
         v.solicitante,
         v.protocolo_atendimento,
         e.nome_fantasia
       FROM visitas v
       INNER JOIN empresas e ON e.id = v.empresa_id
       WHERE v.status <> 'RASCUNHO'
       AND e.deleted_at IS NULL
       AND v.data_visita BETWEEN ? AND ?
       ORDER BY v.data_visita ASC, v.hora_inicio ASC`,
      [opcoes?.dataInicial || '0000-01-01', opcoes?.dataFinal || '9999-12-31']
    );

    return {
      titulo: 'Visita de Clientes por Data',
      periodoAnalise: `${formatarDataBR(opcoes?.dataInicial)} a ${formatarDataBR(
        opcoes?.dataFinal
      )}`,
      colunas: [
        { chave: 'data', titulo: 'DATA', flex: 0.9 },
        { chave: 'hora', titulo: 'HORARIO', flex: 0.9 },
        { chave: 'empresa', titulo: 'CLIENTE', flex: 1.8 },
        { chave: 'solicitante', titulo: 'SOLICITANTE', flex: 1.4 },
        { chave: 'protocolo', titulo: 'PROTOCOLO', flex: 1.3 },
      ],
      linhas: visitas.map((visita, index) => {
        const visitaAnterior = visitas[index - 1];
        const mudouData =
          index > 0 && visitaAnterior?.data_visita !== visita.data_visita;

        return {
          data: formatarDataBR(visita.data_visita),
          hora: visita.hora_inicio || '--:--',
          empresa: visita.nome_fantasia || '-',
          solicitante: visita.solicitante || '-',
          protocolo: visita.protocolo_atendimento || '-',
          __espacoAntes: mudouData ? '1' : '',
        };
      }),
      geradoEm,
      resumoFinal: `Total de visitas: ${visitas.length}`,
    };
  }

  if (id === 'clientes_sem_visita') {
    const dias = opcoes?.dias || 30;
    const unidadeDias = dias === 1 ? 'Dia' : 'Dias';
    const empresas = await db.getAllAsync<EmpresaUltimaVisita>(
      `SELECT
         e.id,
         e.codigo_referencia,
         e.nome_fantasia,
         e.cidade,
         e.estado,
         e.contato,
         e.rota,
         MAX(v.data_visita) AS ultima_visita
       FROM empresas e
       LEFT JOIN visitas v
         ON v.empresa_id = e.id
         AND v.status <> 'RASCUNHO'
       WHERE e.ativo = 1
       AND e.deleted_at IS NULL
       GROUP BY e.id
       ORDER BY ultima_visita ASC, e.nome_fantasia ASC`
    );

    const filtradas = empresas.filter(
      (empresa) => !empresa.ultima_visita || diasDesde(empresa.ultima_visita) >= dias
    );

    return {
      titulo: `Clientes Que Não Visita a ${dias} ${unidadeDias}`,
      colunas: [
        ...colunasClientes(),
        { chave: 'ultimaVisita', titulo: 'ULTIMA VISITA', flex: 1.2 },
        { chave: 'dias', titulo: 'DIAS', flex: 0.7, align: 'right' },
      ],
      linhas: filtradas.map((empresa) => ({
        ...mapearEmpresa(empresa),
        ultimaVisita: formatarDataBR(empresa.ultima_visita),
        dias: String(diasDesde(empresa.ultima_visita)),
      })),
      geradoEm,
      resumoFinal: `Total de clientes sem visita: ${filtradas.length}`,
    };
  }

  const direcao = id === 'clientes_mais_visitados' ? 'DESC' : 'ASC';
  const dataInicial = opcoes?.dataInicial || '0000-01-01';
  const dataFinal = opcoes?.dataFinal || '9999-12-31';
  const empresas = await db.getAllAsync<EmpresaContagem>(
    `SELECT
       e.id,
       e.codigo_referencia,
       e.nome_fantasia,
       e.cidade,
       e.estado,
       e.contato,
       e.rota,
       COUNT(v.id) AS total_visitas
     FROM empresas e
     LEFT JOIN visitas v
       ON v.empresa_id = e.id
       AND v.status <> 'RASCUNHO'
       AND v.data_visita BETWEEN ? AND ?
     WHERE e.ativo = 1
     AND e.deleted_at IS NULL
     GROUP BY e.id
     ORDER BY total_visitas ${direcao}, e.nome_fantasia ASC`,
    [dataInicial, dataFinal]
  );

  return {
    titulo:
      id === 'clientes_mais_visitados'
        ? 'Clientes Mais Visitados'
        : 'Clientes Menos Visitados',
    periodoAnalise:
      opcoes?.dataInicial && opcoes?.dataFinal
        ? `${formatarDataBR(opcoes.dataInicial)} a ${formatarDataBR(opcoes.dataFinal)}`
        : undefined,
    colunas: [
      ...colunasClientes(),
      { chave: 'total', titulo: 'VISITAS', flex: 0.8, align: 'right' },
    ],
    linhas: empresas.map((empresa) => ({
      ...mapearEmpresa(empresa),
      total: String(empresa.total_visitas || 0),
    })),
    geradoEm,
    resumoFinal: `Total de visitas no período: ${empresas.reduce(
      (total, empresa) => total + Number(empresa.total_visitas || 0),
      0
    )}`,
  };
};
