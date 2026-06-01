/**
 * INICIALIZAÇÃO DO BANCO DE DADOS
 * 
 * Cria todas as tabelas necessárias para o aplicativo
 */

import * as SQLite from 'expo-sqlite';

export const db = SQLite.openDatabaseSync('facilite.db');

export const initDatabase = async () => {
  
  try {
    // Verificar e adicionar coluna estado na tabela empresas se necessário
    try {
      const tableInfo = await db.getAllAsync('PRAGMA table_info(empresas)');
      const hasEstado = (tableInfo as any[]).some(col => col.name === 'estado');
      if (!hasEstado) {
        await db.execAsync('ALTER TABLE empresas ADD COLUMN estado TEXT DEFAULT "SP"');
        console.log('✅ Coluna estado adicionada à tabela empresas');
      }
    } catch (error) {
      console.log('Tabela empresas não existe ainda, será criada');
    }
    
    // Tabela de empresas
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
      )
    `);
    
    // Tabela de visitas
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS visitas (
        id TEXT PRIMARY KEY,
        empresa_id TEXT NOT NULL,
        solicitante TEXT NOT NULL,
        data_visita TEXT NOT NULL,
        hora_inicio TEXT NOT NULL,
        hora_termino TEXT NOT NULL,
        descricao TEXT NOT NULL,
        assinatura TEXT,
        created_at TEXT,
        updated_at TEXT,
        FOREIGN KEY (empresa_id) REFERENCES empresas (id) ON DELETE CASCADE
      )
    `);
    
    // Tabela de configuracoes
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS configuracoes (
        chave TEXT PRIMARY KEY,
        valor TEXT NOT NULL,
        updated_at TEXT
      )
    `);
    
    // Tabela de textos_predefinidos
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS textos_predefinidos (
        id TEXT PRIMARY KEY,
        texto TEXT NOT NULL,
        created_at TEXT,
        updated_at TEXT
      )
    `);
    
    // Inserir configuração padrão se não existir
    const configExist = await db.getAllAsync('SELECT * FROM configuracoes WHERE chave = "dias_aviso"');
    if (configExist.length === 0) {
      await db.runAsync('INSERT INTO configuracoes (chave, valor, updated_at) VALUES (?, ?, ?)', 
        ['dias_aviso', '30', new Date().toISOString()]);
    }
    
    console.log('✅ Banco de dados inicializado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
  }
  
  return db;
};