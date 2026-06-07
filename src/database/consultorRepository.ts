import { db } from './initDatabase';

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

async carregar(): Promise<ConsultorDB | null> {

  const dados = await db.getFirstAsync<ConsultorDB>(
    'SELECT * FROM consultor LIMIT 1'
  );

  return dados;
},

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