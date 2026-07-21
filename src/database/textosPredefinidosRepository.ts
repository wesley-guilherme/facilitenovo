/**
 * REPOSITORY: TextosPredefinidosRepository
 *
 * FUNCAO:
 * Gerencia textos reutilizaveis usados na descricao das visitas.
 */

import { db } from './initDatabase';

// Tipo que representa um texto predefinido salvo no SQLite.
export type TextoPredefinidoDB = {
  id: string;
  texto: string;
  created_at: string;
  updated_at: string | null;
};

export const TextosPredefinidosRepository = {

  // Lista textos salvos em ordem alfabetica.
  async listar(): Promise<TextoPredefinidoDB[]> {

    return await db.getAllAsync<TextoPredefinidoDB>(
      `
      SELECT *
      FROM textos_predefinidos
      ORDER BY texto ASC
      `
    );

  },

  // Insere um novo texto predefinido.
  async inserir(
    valores: any[]
  ) {

    return await db.runAsync(
      `
      INSERT INTO textos_predefinidos(
        id,
        texto,
        created_at
      )
      VALUES (?, ?, ?)
      `,
      valores
    );

  },

  // Atualiza o conteudo de um texto existente.
  async atualizar(
    valores: any[]
  ) {

    return await db.runAsync(
      `
      UPDATE textos_predefinidos
      SET
        texto = ?,
        updated_at = ?
      WHERE id = ?
      `,
      valores
    );

  },

  // Exclui um texto predefinido pelo id.
  async excluir(id: string) {

    return await db.runAsync(
      `
      DELETE FROM textos_predefinidos
      WHERE id = ?
      `,
      [id]
    );

  }

};
