/**
 * INICIALIZAÇÃO DO BANCO DE DADOS
 *
 * Cria todas as tabelas necessárias para o aplicativo
 */

import * as SQLite from 'expo-sqlite';

// UMA ÚNICA INSTÂNCIA DO BANCO
export const db = SQLite.openDatabaseSync('facilite.db');

export const initDatabase = async () => {
  try {

    // Habilita Foreign Keys
    await db.execAsync(`
      PRAGMA foreign_keys = ON;
    `);

    console.log('✅ Foreign Keys habilitado');

    // Verificar se a tabela empresas já existe
    try {
      const tableInfo = await db.getAllAsync(
        'PRAGMA table_info(empresas)'
      );

      const hasEstado = (tableInfo as any[]).some(
        (col) => col.name === 'estado'
      );

      if (!hasEstado) {
        await db.execAsync(`
          ALTER TABLE empresas
          ADD COLUMN estado TEXT DEFAULT 'SP'
        `);

        console.log('✅ Coluna estado adicionada');
      }

    } catch (error) {
      console.log('Tabela empresas ainda não existe');
    }

    // ==========================
    // TABELA EMPRESAS
    // ==========================
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS empresas (
        id TEXT PRIMARY KEY,
        codigo_referencia TEXT NOT NULL UNIQUE,
        nome_fantasia TEXT NOT NULL,
        proprietario TEXT,
        cidade TEXT NOT NULL,
        estado TEXT DEFAULT 'SP',
        endereco TEXT NOT NULL,
        numero TEXT NOT NULL,
        email TEXT NOT NULL,
        contato TEXT NOT NULL,
        anotacoes TEXT,
        logo TEXT,
        ativo INTEGER DEFAULT 1,
        rota TEXT,
        created_at TEXT,
        updated_at TEXT
      );
    `);

    // ==========================
    // TABELA VISITAS
    // ==========================
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS visitas (
        id TEXT PRIMARY KEY,
        empresa_id TEXT NOT NULL,
        solicitante TEXT NOT NULL,
        data_visita TEXT NOT NULL,
        hora_inicio TEXT NOT NULL,
        hora_termino TEXT NOT NULL,
        descricao TEXT NOT NULL,
        status TEXT DEFAULT 'RASCUNHO',
        assinatura TEXT,
        created_at TEXT,
        updated_at TEXT,
        FOREIGN KEY (empresa_id)
          REFERENCES empresas(id)
          ON DELETE CASCADE
      );
    `);
  try {

  const tableInfo =
    await db.getAllAsync(
      'PRAGMA table_info(visitas)'
    );

  const possuiStatus =
    (tableInfo as any[]).some(
      coluna => coluna.name === 'status'
    );

  if (!possuiStatus) {

    await db.execAsync(`
      ALTER TABLE visitas
      ADD COLUMN status TEXT DEFAULT 'RASCUNHO'
    `);

    console.log(
      '✅ Coluna status adicionada em visitas'
    );

  }

} catch (error) {

  console.log(
    'Tabela visitas ainda não existe'
  );

}

    // ==========================
   // TABELA ASSINATURAS
  // ==========================
await db.execAsync(`
  CREATE TABLE IF NOT EXISTS assinaturas (
    id TEXT PRIMARY KEY,
    empresa_id TEXT NOT NULL UNIQUE,
    nome_assinante TEXT NOT NULL,
    assinatura TEXT NOT NULL,
    created_at TEXT,
    updated_at TEXT,
    FOREIGN KEY (empresa_id)
      REFERENCES empresas(id)
      ON DELETE CASCADE
  );
`);

    // ==========================
    // TABELA CONFIGURAÇÕES
    // ==========================
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS configuracoes (
        chave TEXT PRIMARY KEY,
        valor TEXT NOT NULL,
        updated_at TEXT
      );
    `);

    // ==========================
    // TABELA TEXTOS
    // ==========================
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS textos_predefinidos (
        id TEXT PRIMARY KEY,
        texto TEXT NOT NULL,
        created_at TEXT,
        updated_at TEXT
      );
    `);
  
  // ==========================
  // TABELA CONSULTOR
  // ==========================
await db.execAsync(`
  CREATE TABLE IF NOT EXISTS consultor (
    id TEXT PRIMARY KEY,
    nome TEXT,
    email TEXT,
    whatsapp TEXT,
    empresa TEXT,
    rota TEXT,
    foto TEXT,
    created_at TEXT,
    updated_at TEXT
  );
`);

// ==========================
// TABELA EMPRESA CONSULTOR
// ==========================
await db.execAsync(`
  CREATE TABLE IF NOT EXISTS empresa_consultor (
    id TEXT PRIMARY KEY,
    logo_pequena TEXT,
    logo_media TEXT,
    nome TEXT,
    endereco TEXT,
    numero TEXT,
    cidade TEXT,
    estado TEXT,
    celular TEXT,
    telefone TEXT,
    email TEXT,
    mensagem_formulario TEXT,
    created_at TEXT,
    updated_at TEXT
  );
`);

const textoExistente =
  await db.getFirstAsync(
    'SELECT id FROM textos_predefinidos LIMIT 1'
  );

console.log(
  '📝 Primeiro texto:',
  textoExistente
);

    // Configuração padrão
    const configExist = await db.getAllAsync(
      'SELECT * FROM configuracoes WHERE chave = ?',
      ['dias_aviso']
    );

    if (configExist.length === 0) {
      await db.runAsync(
        `INSERT INTO configuracoes
        (chave, valor, updated_at)
        VALUES (?, ?, ?)`,
        [
          'dias_aviso',
          '30',
          new Date().toISOString()
        ]
      );  
      console.log('✅ Configuração padrão criada');
    }
  
// Verifica se já existe consultor
    const consultorExistente = await db.getAllAsync(
      'SELECT id FROM consultor LIMIT 1'
    );

    if (consultorExistente.length === 0) {
      await db.runAsync(
        `INSERT INTO consultor (
          id,
          nome,
          email,
          whatsapp,
          empresa,
          rota,
          foto,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          '1',
          '',
          '',
          '',
          '',
          '',
          '',
          new Date().toISOString()
        ]
      );

      console.log('✅ Registro inicial do consultor criado');
    }

  const empresaConsultorExistente =
  await db.getFirstAsync(
    'SELECT id FROM empresa_consultor LIMIT 1'
  );

if (!empresaConsultorExistente) {

  await db.runAsync(
    `INSERT INTO empresa_consultor (
      id,
      logo_pequena,
      logo_media,
      nome,
      endereco,
      numero,
      cidade,
      estado,
      celular,
      telefone,
      email,
      mensagem_formulario,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      '1',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      new Date().toISOString()
    ]
  );

  console.log(
    '✅ Registro inicial empresa_consultor criado'
  );
}

const empresaConsultorDados =
  await db.getAllAsync(
    'SELECT * FROM empresa_consultor'
  );

console.log(
  '🏢 TODOS EMPRESA_CONSULTOR:',
  JSON.stringify(
    empresaConsultorDados,
    null,
    2
  )
);

const tabelas = await db.getAllAsync(
  "SELECT name FROM sqlite_master WHERE type='table'"
);

console.log(
  '📋 TABELAS DO BANCO:',
  tabelas
);

    console.log('✅ Banco inicializado com sucesso');

  } catch (error) {
    console.error('❌ Erro ao inicializar banco:', error);
  }

  return db;
};

