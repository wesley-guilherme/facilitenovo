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

  console.log('📋 CONSULTOR NO BANCO:', dados);

  return dados;
},

  async salvar(
    nome: string,
    email: string,
    whatsapp: string,
    empresa: string,
    rota: string,
    foto: string | null
  ) {

    console.log('💾 Salvando consultor...');
    
    const resultado = await db.runAsync(
      `UPDATE consultor SET
        nome = ?,
        email = ?,
        whatsapp = ?,
        empresa = ?,
        rota = ?,
        foto = ?,
        updated_at = ?
      WHERE id = '1'`,
      [
        nome,
        email,
        whatsapp,
        empresa,
        rota,
        foto,
        new Date().toISOString()
      ]
    );
       console.log('💾 Resultado UPDATE:', resultado);
     return resultado;
  }

};