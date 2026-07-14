import { db } from '../database/initDatabase';

export type StatusAvisoVisita = 'normal' | 'atencao' | 'critico';

export type EmpresaAvisoVisita = {
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
  ultimaVisita: VisitaAviso | null;
  diasDesdeUltimaVisita: number;
  diasRestantes: number;
  statusAtraso: StatusAvisoVisita;
};

type EmpresaBanco = {
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

export type VisitaAviso = {
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

export type ResumoAvisosVisita = {
  diasAviso: number;
  empresas: EmpresaAvisoVisita[];
  criticas: EmpresaAvisoVisita[];
  atencao: EmpresaAvisoVisita[];
  totalPendentes: number;
};

export const criarDataLocal = (data: string) => {
  const partes = data.split('-').map(Number);

  if (partes.length === 3) {
    const [ano, mes, dia] = partes;
    return new Date(ano, mes - 1, dia);
  }

  return new Date(data);
};

export const formatarDataBR = (data: string) => {
  const partes = data.split('-');

  if (partes.length === 3) {
    const [ano, mes, dia] = partes;
    return `${dia}/${mes}/${ano}`;
  }

  return new Date(data).toLocaleDateString('pt-BR');
};

export const carregarDiasAviso = async () => {
  try {
    const config = await db.getFirstAsync<{ valor: string }>(
      'SELECT valor FROM configuracoes WHERE chave = ?',
      ['dias_aviso']
    );

    const dias = parseInt(config?.valor || '', 10);
    return Number.isFinite(dias) && dias > 0 ? dias : 30;
  } catch (error) {
    console.log('Configuracoes nao encontradas, usando padrao 30 dias');
    return 30;
  }
};

const calcularDiasDesde = (dataVisita: string) => {
  const hoje = new Date();
  const ultimaData = criarDataLocal(dataVisita);
  const diffTime = hoje.getTime() - ultimaData.getTime();

  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const classificarEmpresa = (
  empresa: EmpresaBanco,
  ultimaVisita: VisitaAviso | null,
  diasAviso: number
): EmpresaAvisoVisita => {
  if (!ultimaVisita) {
    return {
      ...empresa,
      ultimaVisita: null,
      diasDesdeUltimaVisita: 999,
      diasRestantes: 0,
      statusAtraso: 'critico',
    };
  }

  const diasDesdeUltimaVisita = calcularDiasDesde(ultimaVisita.data_visita);
  const diasRestantes = Math.max(diasAviso - diasDesdeUltimaVisita, 0);
  const inicioAtencao = Math.max(diasAviso - 10, 0);
  let statusAtraso: StatusAvisoVisita = 'normal';

  if (diasDesdeUltimaVisita >= diasAviso) {
    statusAtraso = 'critico';
  } else if (diasDesdeUltimaVisita >= inicioAtencao) {
    statusAtraso = 'atencao';
  }

  return {
    ...empresa,
    ultimaVisita,
    diasDesdeUltimaVisita,
    diasRestantes,
    statusAtraso,
  };
};

export const carregarResumoAvisosVisita = async (): Promise<ResumoAvisosVisita> => {
  const diasAviso = await carregarDiasAviso();

  const empresasDb = await db.getAllAsync<EmpresaBanco>(
    'SELECT * FROM empresas WHERE ativo = 1 AND deleted_at IS NULL ORDER BY nome_fantasia ASC'
  );

  const visitasDb = await db.getAllAsync<VisitaAviso>(
    'SELECT * FROM visitas ORDER BY data_visita DESC, hora_termino DESC'
  );

  const empresas = empresasDb.map((empresa) => {
    const visitasEmpresa = visitasDb
      .filter((visita) => visita.empresa_id === empresa.id)
      .sort((a, b) => {
        const dataA = `${a.data_visita} ${a.hora_termino || a.hora_inicio || ''}`;
        const dataB = `${b.data_visita} ${b.hora_termino || b.hora_inicio || ''}`;
        return dataB.localeCompare(dataA);
      });

    return classificarEmpresa(empresa, visitasEmpresa[0] || null, diasAviso);
  });

  const prioridadeStatus: Record<StatusAvisoVisita, number> = {
    critico: 0,
    atencao: 1,
    normal: 2,
  };

  const empresasOrdenadas = [...empresas].sort((a, b) => {
    const prioridade = prioridadeStatus[a.statusAtraso] - prioridadeStatus[b.statusAtraso];

    if (prioridade !== 0) {
      return prioridade;
    }

    if (a.statusAtraso === 'atencao') {
      return a.diasRestantes - b.diasRestantes;
    }

    return b.diasDesdeUltimaVisita - a.diasDesdeUltimaVisita;
  });

  const criticas = empresasOrdenadas
    .filter((empresa) => empresa.statusAtraso === 'critico')
    .sort((a, b) => b.diasDesdeUltimaVisita - a.diasDesdeUltimaVisita);

  const atencao = empresasOrdenadas
    .filter((empresa) => empresa.statusAtraso === 'atencao')
    .sort((a, b) => a.diasRestantes - b.diasRestantes);

  return {
    diasAviso,
    empresas: empresasOrdenadas,
    criticas,
    atencao,
    totalPendentes: criticas.length + atencao.length,
  };
};
