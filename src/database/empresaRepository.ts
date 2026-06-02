import { db } from './initDatabase';

export const EmpresaRepository = {

  async listar() {
    return await db.getAllAsync(
      'SELECT * FROM empresas ORDER BY nome_fantasia ASC'
    );
  },

  async buscarPorCodigo(codigo: string) {
    return await db.getFirstAsync(
      'SELECT * FROM empresas WHERE codigo_referencia = ?',
      [codigo]
    );
  },

  async inserir(sql: string, valores: any[]) {
    return await db.runAsync(sql, valores);
  },

  async atualizar(sql: string, valores: any[]) {
    return await db.runAsync(sql, valores);
  },

  async excluir(id: string) {
    return await db.runAsync(
      'UPDATE empresas SET ativo = 0 WHERE id = ?',
      [id]
    );
  }
};