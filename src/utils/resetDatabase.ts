/**
 * RESET DO BANCO DE DADOS
 *
 * Recria todas as tabelas do zero usando o mesmo schema principal do app.
 * Use apenas em desenvolvimento, quando houver erro estrutural no banco local.
 */

import * as SQLite from 'expo-sqlite';

export const resetDatabase = async () => {
  const db = SQLite.openDatabaseSync('facilite.db');

  try {
    await db.execAsync(`PRAGMA foreign_keys = OFF`);

    console.log('Removendo tabelas antigas...');

    await db.execAsync(`DROP TABLE IF EXISTS empresas`);
    await db.execAsync(`DROP TABLE IF EXISTS visitas`);
    await db.execAsync(`DROP TABLE IF EXISTS configuracoes`);
    await db.execAsync(`DROP TABLE IF EXISTS textos_predefinidos`);
    await db.execAsync(`DROP TABLE IF EXISTS consultor`);
    await db.execAsync(`DROP TABLE IF EXISTS empresa_consultor`);

    console.log('Tabelas antigas removidas');

    await db.execAsync(`PRAGMA foreign_keys = ON`);

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
      )
    `);

    await db.execAsync(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_empresas_codigo_nao_excluidas
      ON empresas (codigo_referencia)
      WHERE deleted_at IS NULL
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS visitas (
        id TEXT PRIMARY KEY,
        empresa_id TEXT NOT NULL,
        consultor_id TEXT,
        protocolo_atendimento TEXT,
        solicitante TEXT NOT NULL,
        data_visita TEXT NOT NULL,
        hora_inicio TEXT NOT NULL,
        hora_termino TEXT NOT NULL,
        descricao TEXT NOT NULL,
        status TEXT DEFAULT 'RASCUNHO',
        assinatura TEXT,
        created_at TEXT,
        updated_at TEXT,
        FOREIGN KEY (empresa_id) REFERENCES empresas (id) ON DELETE CASCADE
      )
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS configuracoes (
        chave TEXT PRIMARY KEY,
        valor TEXT NOT NULL,
        updated_at TEXT
      )
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS textos_predefinidos (
        id TEXT PRIMARY KEY,
        texto TEXT NOT NULL,
        created_at TEXT,
        updated_at TEXT
      )
    `);

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
      )
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS empresa_consultor (
        id TEXT PRIMARY KEY,
        logo_pequena TEXT,
        logo_media TEXT,
        nome TEXT,
        endereco TEXT,
        numero TEXT,
        bairro TEXT,
        cidade TEXT,
        estado TEXT,
        celular TEXT,
        telefone TEXT,
        email TEXT,
        mensagem_formulario TEXT,
        created_at TEXT,
        updated_at TEXT
      )
    `);

    const agora = new Date().toISOString();

    await db.runAsync(
      'INSERT INTO configuracoes (chave, valor, updated_at) VALUES (?, ?, ?)',
      ['dias_aviso', '30', agora]
    );

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
      ['1', '', '', '', '', '', '', agora]
    );

    await db.runAsync(
      `INSERT INTO empresa_consultor (
        id,
        logo_pequena,
        logo_media,
        nome,
        endereco,
        numero,
        bairro,
        cidade,
        estado,
        celular,
        telefone,
        email,
        mensagem_formulario,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['1', '', '', '', '', '', '', '', '', '', '', '', '', agora]
    );

    console.log('Banco de dados recriado com sucesso!');
  } catch (error) {
    console.error('Erro ao recriar banco:', error);
  }

  return db;
};
