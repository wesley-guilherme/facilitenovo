/**
 * REPOSITORY: AssinaturasRepository
 *
 * FUNCAO:
 * Busca, salva e exclui assinaturas vinculadas a empresas.
 */

import { db } from './initDatabase';

// Tipo que representa uma assinatura salva no SQLite.
export type AssinaturaDB = {
  id: string;
  empresa_id: string;
  nome_assinante: string;
  assinatura: string;
  created_at: string;
  updated_at: string | null;
};

export const AssinaturasRepository = {

  // Busca a assinatura mais recente vinculada a empresa.
  async buscarPorEmpresa(
    empresaId: string
  ): Promise<AssinaturaDB | null> {

    return await db.getFirstAsync<AssinaturaDB>(
      `SELECT *
       FROM assinaturas
       WHERE empresa_id = ?`,
      [empresaId]
    );

  },

  // Atualiza a assinatura existente ou cria uma nova.
  async salvar(
    assinatura: AssinaturaDB
  ) {

    const existente =
      await this.buscarPorEmpresa(
        assinatura.empresa_id
      );

    if (existente) {

      return await db.runAsync(
        `UPDATE assinaturas
         SET
           nome_assinante = ?,
           assinatura = ?,
           updated_at = ?
         WHERE empresa_id = ?`,
        [
          assinatura.nome_assinante,
          assinatura.assinatura,
          new Date().toISOString(),
          assinatura.empresa_id
        ]
      );

    }

    return await db.runAsync(
      `INSERT INTO assinaturas(
        id,
        empresa_id,
        nome_assinante,
        assinatura,
        created_at
      )
      VALUES (?, ?, ?, ?, ?)`,
      [
        assinatura.id,
        assinatura.empresa_id,
        assinatura.nome_assinante,
        assinatura.assinatura,
        new Date().toISOString()
      ]
    );

  },

  // Remove a assinatura vinculada a empresa informada.
  async excluirPorEmpresa(
    empresaId: string
  ) {

    return await db.runAsync(
      `DELETE
       FROM assinaturas
       WHERE empresa_id = ?`,
      [empresaId]
    );

  },

  

};
