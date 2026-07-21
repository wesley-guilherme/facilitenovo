/**
 * REPOSITORY: EmpresaRepository
 *
 * FUNCAO:
 * Centraliza consultas e gravacoes da tabela de empresas atendidas.
 */

import { db } from './initDatabase';

// Tipo que representa uma empresa salva no SQLite.
export type EmpresaDB = {
  id: string;
  codigo_referencia: string;
  nome_fantasia: string;
  proprietario: string | null;
  cidade: string;
  estado: string;
  endereco: string;
  numero: string;
  email: string;
  contato: string;
  anotacoes: string | null;
  logo: string | null;
  ativo: number;
  rota: string | null;
  deleted_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export const EmpresaRepository = {

  // Lista empresas nao excluidas em ordem alfabetica.
  async listar(): Promise<EmpresaDB[]> {

  return await db.getAllAsync<EmpresaDB>(
    `SELECT *
     FROM empresas
     WHERE deleted_at IS NULL
     ORDER BY nome_fantasia ASC`
  );

},

  // Busca empresa ativa pelo codigo de referencia.
  async buscarPorCodigo(codigo: string) {
    return await db.getFirstAsync(
      `SELECT *
       FROM empresas
       WHERE codigo_referencia = ?
       AND deleted_at IS NULL`,
      [codigo]
    );
  },

  // Verifica conflito de codigo ao cadastrar nova empresa.
  async existeCodigo(codigo: string) {
    const resultado = 
      await db.getFirstAsync(
        `SELECT id
         FROM empresas
         WHERE codigo_referencia = ?
         AND deleted_at IS NULL`,
        [codigo]
    );

    return !!resultado;
  },

  // Verifica conflito de codigo ignorando a empresa em edicao.
  async existeCodigoEdicao(
  codigo: string,
  empresaId: string
) {
  const resultado =
    await db.getFirstAsync(
      `SELECT id
       FROM empresas
       WHERE codigo_referencia = ?
       AND id <> ?
       AND deleted_at IS NULL`,
      [codigo, empresaId]
    );

  return !!resultado;
},

  // Insere uma nova empresa na tabela empresas.
  async inserirEmpresa(
    valores: any[]
  ) {
    return await db.runAsync(
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
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      valores
    );
  },

  async atualizarEmpresa(
    valores: any[]
  ) {
    return await db.runAsync(
      `UPDATE empresas SET
        codigo_referencia = ?,
        nome_fantasia = ?,
        proprietario = ?,
        cidade = ?,
        estado = ?,
        endereco = ?,
        numero = ?,
        email = ?,
        contato = ?,
        anotacoes = ?,
        logo = ?,
        ativo = ?,
        updated_at = ?
      WHERE id = ?`,
      valores
    );
  },

    async limpar() {
    return await db.runAsync(
      `UPDATE consultor SET
        nome = '',
        email = '',
        whatsapp = '',
        empresa = '',
        rota = '',
        foto = '',
        updated_at = ?
      WHERE id = '1'`,
      [new Date().toISOString()]
    );
  },

  async excluir(id: string) {
    return await db.runAsync(
      `UPDATE empresas
       SET ativo = 0,
           updated_at = ?
       WHERE id = ?
       AND deleted_at IS NULL`,
      [new Date().toISOString(), id]
    );
  },

  async excluirPermanente(id: string) {
    const agora = new Date().toISOString();

    await db.runAsync(
      'DELETE FROM visitas WHERE empresa_id = ?',
      [id]
    );

    await db.runAsync(
      'DELETE FROM assinaturas WHERE empresa_id = ?',
      [id]
    );

    return await db.runAsync(
      `UPDATE empresas
       SET ativo = 0,
           deleted_at = ?,
           updated_at = ?
       WHERE id = ?`,
      [agora, agora, id]
    );
  }
};
