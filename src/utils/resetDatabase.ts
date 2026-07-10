/**
 * RESET DO BANCO DE DADOS
 * 
 * Recria todas as tabelas do zero
 * Útil para quando há erros de estrutura
 */

import * as SQLite from 'expo-sqlite';

export const resetDatabase = async () => {
  const db = SQLite.openDatabaseSync('facilite.db');
  
  try {
    // Remover todas as tabelas existentes
    console.log('🗑️ Removendo tabelas antigas...');
    
    await db.execAsync(`DROP TABLE IF EXISTS empresas`);
    await db.execAsync(`DROP TABLE IF EXISTS visitas`);
    await db.execAsync(`DROP TABLE IF EXISTS configuracoes`);
    await db.execAsync(`DROP TABLE IF EXISTS textos_predefinidos`);
    
    console.log('✅ Tabelas antigas removidas');
    
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
        deleted_at TEXT,
        created_at TEXT,
        updated_at TEXT
      )
    `);
    
    // Tabela de visitas
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
    
    // Inserir configuração padrão
    await db.runAsync('INSERT INTO configuracoes (chave, valor, updated_at) VALUES (?, ?, ?)', 
      ['dias_aviso', '30', new Date().toISOString()]);
    
    console.log('✅ Banco de dados recriado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao recriar banco:', error);
  }
  
  return db;
};
