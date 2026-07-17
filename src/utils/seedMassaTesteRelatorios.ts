import { db } from '../database/initDatabase';

const EMPRESAS_TOTAL = 60;
const DATA_INICIAL = new Date(2026, 2, 1);
const DATA_FINAL = new Date(2026, 6, 17);

const cidades = [
  ['Sao Paulo', 'SP'],
  ['Guarulhos', 'SP'],
  ['Campinas', 'SP'],
  ['Santos', 'SP'],
  ['Osasco', 'SP'],
  ['Santo Andre', 'SP'],
  ['Barueri', 'SP'],
  ['Sorocaba', 'SP'],
  ['Jundiai', 'SP'],
  ['Sao Bernardo do Campo', 'SP'],
];

const segmentos = [
  'Bebidas',
  'Mercado',
  'Distribuidora',
  'Atacado',
  'Farmacia',
  'Padaria',
  'Restaurante',
  'Auto Pecas',
  'Papelaria',
  'Confeccao',
];

const nomesBase = [
  'Matarino',
  'Santana',
  'Nova Alianca',
  'Imperial',
  'Santa Luzia',
  'Ribeiro',
  'Costa Norte',
  'Vitoria',
  'Central',
  'Monte Azul',
  'Boa Vista',
  'Primavera',
  'Alvorada',
  'Sao Jorge',
  'Estrela',
];

const solicitantes = [
  'Joao Almeida',
  'Maria Santos',
  'Carlos Ribeiro',
  'Ana Paula',
  'Roberto Lima',
  'Fernanda Costa',
  'Juliana Martins',
  'Paulo Henrique',
  'Marcos Silva',
  'Patricia Gomes',
];

const horarios = [
  ['08:00', '08:45'],
  ['09:15', '10:00'],
  ['10:30', '11:15'],
  ['13:30', '14:15'],
  ['15:00', '15:45'],
  ['16:20', '17:05'],
];

const cores = [
  '#1769AA',
  '#1B7F3A',
  '#8A4FFF',
  '#D97706',
  '#0F766E',
  '#BE123C',
  '#4338CA',
  '#047857',
];

const dataIso = (data: Date) => data.toISOString().slice(0, 10);

const dataCompacta = (data: Date) =>
  `${data.getFullYear()}${String(data.getMonth() + 1).padStart(2, '0')}${String(
    data.getDate()
  ).padStart(2, '0')}`;

const criarLogoSvg = (texto: string, cor: string, largura = 240, altura = 90) => {
  const iniciais = texto
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase();

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${largura}" height="${altura}" viewBox="0 0 ${largura} ${altura}">
      <rect width="${largura}" height="${altura}" rx="10" fill="${cor}"/>
      <circle cx="45" cy="45" r="24" fill="rgba(255,255,255,0.18)"/>
      <text x="45" y="53" text-anchor="middle" font-family="Arial" font-size="22" font-weight="700" fill="#ffffff">${iniciais}</text>
      <text x="82" y="42" font-family="Arial" font-size="22" font-weight="800" fill="#ffffff">${texto.slice(0, 15).toUpperCase()}</text>
      <text x="82" y="64" font-family="Arial" font-size="12" letter-spacing="3" fill="rgba(255,255,255,0.82)">TESTE</text>
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const criarAssinaturaSvg = (nome: string) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="360" height="120" viewBox="0 0 360 120">
      <path d="M50 70 C95 25, 110 104, 150 58 S215 44, 250 70 S310 78, 330 50" fill="none" stroke="#111827" stroke-width="4" stroke-linecap="round"/>
      <text x="180" y="105" text-anchor="middle" font-family="Arial" font-size="13" fill="#111827">${nome}</text>
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const criarEmpresa = (indice: number) => {
  const numero = indice + 1;
  const nomeBase = nomesBase[indice % nomesBase.length];
  const segmento = segmentos[indice % segmentos.length];
  const [cidade, estado] = cidades[indice % cidades.length];
  const nome = `${nomeBase} ${segmento} ${String(numero).padStart(2, '0')}`;
  const cor = cores[indice % cores.length];

  return {
    id: `seed-empresa-${String(numero).padStart(3, '0')}`,
    codigo: `TST${String(numero).padStart(3, '0')}`,
    nome,
    proprietario: solicitantes[indice % solicitantes.length],
    cidade,
    estado,
    endereco: `Rua Teste da Rota ${numero}`,
    numero: String(100 + numero),
    email: `empresa${String(numero).padStart(3, '0')}@teste.facilite.com`,
    contato: `(11) 9${String(80000000 + numero * 137).slice(1)}`,
    anotacoes: `Empresa de teste para alimentar relatorios e visitas da rota ${String(
      (indice % 6) + 1
    ).padStart(2, '0')}.`,
    rota: `Rota ${String((indice % 6) + 1).padStart(2, '0')}`,
    logo: criarLogoSvg(nome, cor),
  };
};

const criarEmpresas = () =>
  Array.from({ length: EMPRESAS_TOTAL }, (_, indice) => criarEmpresa(indice));

const listarDatas = () => {
  const datas: Date[] = [];
  const cursor = new Date(DATA_INICIAL);

  while (cursor <= DATA_FINAL) {
    datas.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return datas;
};

export const popularMassaTesteRelatorios = async () => {
  const agora = new Date().toISOString();
  const empresas = criarEmpresas();
  const datas = listarDatas();

  await db.execAsync('PRAGMA foreign_keys = OFF;');

  try {
    await db.runAsync("DELETE FROM visitas WHERE id LIKE 'seed-visita-%'");
    await db.runAsync("DELETE FROM assinaturas WHERE id LIKE 'seed-assinatura-%'");
    await db.runAsync("DELETE FROM empresas WHERE id LIKE 'seed-empresa-%'");

    for (const empresa of empresas) {
      await db.runAsync(
        `INSERT INTO empresas (
          id,
          codigo_referencia,
          nome_fantasia,
          proprietario,
          cidade,
          estado,
          endereco,
          numero,
          email,
          contato,
          anotacoes,
          logo,
          ativo,
          rota,
          deleted_at,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, NULL, ?, ?)`,
        [
          empresa.id,
          empresa.codigo,
          empresa.nome,
          empresa.proprietario,
          empresa.cidade,
          empresa.estado,
          empresa.endereco,
          empresa.numero,
          empresa.email,
          empresa.contato,
          empresa.anotacoes,
          empresa.logo,
          empresa.rota,
          agora,
          agora,
        ]
      );
    }

    let totalVisitas = 0;

    for (let diaIndice = 0; diaIndice < datas.length; diaIndice += 1) {
      const data = datas[diaIndice];
      const visitasNoDia = 4 + (diaIndice % 3);
      const dataBanco = dataIso(data);
      const dataId = dataCompacta(data);

      for (let visitaIndice = 0; visitaIndice < visitasNoDia; visitaIndice += 1) {
        const empresaIndice = (diaIndice * 7 + visitaIndice * 11) % empresas.length;
        const empresa = empresas[empresaIndice];
        const [horaInicio, horaTermino] = horarios[visitaIndice];
        const solicitante = solicitantes[(diaIndice + visitaIndice) % solicitantes.length];
        const numeroSequencial = String(totalVisitas + 1).padStart(4, '0');

        await db.runAsync(
          `INSERT INTO visitas (
            id,
            empresa_id,
            consultor_id,
            protocolo_atendimento,
            solicitante,
            data_visita,
            hora_inicio,
            hora_termino,
            descricao,
            status,
            assinatura,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            `seed-visita-${dataId}-${String(visitaIndice + 1).padStart(2, '0')}`,
            empresa.id,
            '1',
            `PROTO-${dataId}-${String(visitaIndice + 1).padStart(2, '0')}`,
            solicitante,
            dataBanco,
            horaInicio,
            horaTermino,
            `Visita de teste realizada para alimentar relatorios. Cliente: ${empresa.nome}.`,
            'CONCLUIDA',
            criarAssinaturaSvg(solicitante),
            agora,
            agora,
          ]
        );

        totalVisitas += 1;
      }
    }

    await db.runAsync(
      `UPDATE empresa_consultor SET
        logo_pequena = COALESCE(NULLIF(logo_pequena, ''), ?),
        logo_media = COALESCE(NULLIF(logo_media, ''), ?),
        nome = COALESCE(NULLIF(nome, ''), 'Facilite Consultoria Teste'),
        endereco = COALESCE(NULLIF(endereco, ''), 'Avenida Central'),
        numero = COALESCE(NULLIF(numero, ''), '500'),
        bairro = COALESCE(NULLIF(bairro, ''), 'Centro'),
        cidade = COALESCE(NULLIF(cidade, ''), 'Sao Paulo'),
        estado = COALESCE(NULLIF(estado, ''), 'SP'),
        celular = COALESCE(NULLIF(celular, ''), '(11) 99999-8888'),
        telefone = COALESCE(NULLIF(telefone, ''), '(11) 3333-4444'),
        email = COALESCE(NULLIF(email, ''), 'consultor@facilite.com'),
        mensagem_formulario = COALESCE(NULLIF(mensagem_formulario, ''), 'O solicitante esta de acordo com todas as informacoes descritas acima'),
        updated_at = ?
      WHERE id = '1'`,
      [
        criarLogoSvg('Facilite', '#1769AA', 220, 80),
        criarLogoSvg('Facilite', '#1769AA', 360, 120),
        agora,
      ]
    );

    console.log(
      `Massa de teste criada: ${empresas.length} empresas e ${totalVisitas} visitas.`
    );
  } finally {
    await db.execAsync('PRAGMA foreign_keys = ON;');
  }
};
