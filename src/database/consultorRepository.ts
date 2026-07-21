/**
 * REPOSITORY: ConsultorRepository
 *
 * FUNCAO:
 * Le e atualiza o perfil unico do consultor no banco local.
 */

import { db } from './initDatabase';

// Tipo que representa o consultor salvo no SQLite.
export type ConsultorDB = {
  id: string;
  nome: string;
  email: string;
  whatsapp: string;
  empresa: string;
  rota: string;
  foto: string | null;
  created_at: string;
  updated_at: string;
};

export const ConsultorRepository = {

// Carrega o unico registro de perfil do consultor.
async carregar(): Promise<ConsultorDB | null> {

  const dados = await db.getFirstAsync<ConsultorDB>(
    'SELECT * FROM consultor LIMIT 1'
  );

  return dados;
},

  // Atualiza os dados do perfil do consultor.
  async salvar(
  valores: any[]
) {
  return await db.runAsync(
    `UPDATE consultor SET
      nome = ?,
      email = ?,
      whatsapp = ?,
      empresa = ?,
      rota = ?,
      foto = ?,
      updated_at = ?
    WHERE id = '1'`,
    valores
  );
}

};
