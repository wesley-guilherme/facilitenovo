import { db } from './initDatabase';

export type TextoPredefinidoDB = {
  id: string;
  texto: string;
  created_at: string;
  updated_at: string | null;
};

export const TextosPredefinidosRepository = {

  async listar(): Promise<TextoPredefinidoDB[]> {

    return await db.getAllAsync<TextoPredefinidoDB>(
      `
      SELECT *
      FROM textos_predefinidos
      ORDER BY texto ASC
      `
    );

  },

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