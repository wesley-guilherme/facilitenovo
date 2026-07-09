/**
 * INICIALIZAÇÃO DO BANCO DE DADOS
 *
 * Cria todas as tabelas necessárias para o aplicativo
 */

import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

// UMA ÚNICA INSTÂNCIA DO BANCO
const dbPromise =
  Platform.OS === 'web'
    ? SQLite.openDatabaseAsync('facilite.db')
    : Promise.resolve(SQLite.openDatabaseSync('facilite.db'));

type DatabaseWrapper = {
  execAsync: (source: string) => Promise<void>;
  getAllAsync: <T = any>(source: string, params?: any[]) => Promise<T[]>;
  getFirstAsync: <T = any>(source: string, params?: any[]) => Promise<T | null>;
  runAsync: (source: string, params?: any[]) => Promise<SQLite.SQLiteRunResult>;
};

export const db: DatabaseWrapper = {
  execAsync: async (source: string) =>
    (await dbPromise).execAsync(source),

  getAllAsync: async <T>(source: string, params?: any[]) => {
    const database = await dbPromise;
    return params === undefined
      ? database.getAllAsync<T>(source)
      : database.getAllAsync<T>(source, params);
  },

  getFirstAsync: async <T>(source: string, params?: any[]) => {
    const database = await dbPromise;
    return params === undefined
      ? database.getFirstAsync<T>(source)
      : database.getFirstAsync<T>(source, params);
  },

  runAsync: async (source: string, params?: any[]) => {
    const database = await dbPromise;
    return params === undefined
      ? database.runAsync(source)
      : database.runAsync(source, params);
  },
};

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
        codigo_referencia TEXT NOT NULL,
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
        deleted_at TEXT,
        created_at TEXT,
        updated_at TEXT
      );
    `);

    const empresasInfo = await db.getAllAsync(
      'PRAGMA table_info(empresas)'
    );

    const possuiDeletedAt = (empresasInfo as any[]).some(
      (coluna) => coluna.name === 'deleted_at'
    );

    if (!possuiDeletedAt) {
      await db.execAsync(`
        ALTER TABLE empresas
        ADD COLUMN deleted_at TEXT
      `);

      console.log('Coluna deleted_at adicionada em empresas');
    }

    const indicesEmpresas = await db.getAllAsync(
      'PRAGMA index_list(empresas)'
    );

    let possuiUniqueAntigoNoCodigo = false;

    for (const indice of indicesEmpresas as any[]) {
      if (indice.unique !== 1) {
        continue;
      }

      const colunasIndice = await db.getAllAsync(
        `PRAGMA index_info(${indice.name})`
      );

      const nomesColunas = (colunasIndice as any[]).map(
        (coluna) => coluna.name
      );

      if (
        nomesColunas.length === 1 &&
        nomesColunas[0] === 'codigo_referencia'
      ) {
        possuiUniqueAntigoNoCodigo = true;
        break;
      }
    }

    if (possuiUniqueAntigoNoCodigo) {
      await db.execAsync(`
        PRAGMA foreign_keys = OFF;

        CREATE TABLE IF NOT EXISTS empresas_nova (
          id TEXT PRIMARY KEY,
          codigo_referencia TEXT NOT NULL,
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
          deleted_at TEXT,
          created_at TEXT,
          updated_at TEXT
        );

        INSERT INTO empresas_nova (
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
        )
        SELECT
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
        FROM empresas;

        DROP TABLE empresas;
        ALTER TABLE empresas_nova RENAME TO empresas;

        PRAGMA foreign_keys = ON;
      `);

      console.log('Restricao UNIQUE antiga removida de empresas.codigo_referencia');
    }

    await db.execAsync(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_empresas_codigo_nao_excluidas
      ON empresas (codigo_referencia)
      WHERE deleted_at IS NULL;
    `);

    // ==========================
    // TABELA VISITAS
    // ==========================
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS visitas (
        id TEXT PRIMARY KEY,
        empresa_id TEXT NOT NULL,
        consultor_id TEXT,
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

  const possuiConsultor =
    (tableInfo as any[]).some(
      coluna => coluna.name === 'consultor_id'
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

  if (!possuiConsultor) {

    await db.execAsync(`
      ALTER TABLE visitas
      ADD COLUMN consultor_id TEXT
    `);

    console.log(
      'Coluna consultor_id adicionada em visitas'
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

