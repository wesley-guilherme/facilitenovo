import { db } from './initDatabase';

export type EmpresaConsultorDB = {
  id: string;
  logo_pequena: string | null;
  logo_media: string | null;
  nome: string;
  endereco: string;
  numero: string;
  cidade: string;
  estado: string;
  celular: string;
  telefone: string;
  email: string;
  mensagem_formulario: string;
};

export const EmpresaConsultorRepository = {
  
async carregar(): Promise<EmpresaConsultorDB | null> {

  try {

    const dados =
      await db.getFirstAsync<EmpresaConsultorDB>(
        'SELECT * FROM empresa_consultor LIMIT 1'
      );

    console.log(
      '🏢 EMPRESA CONSULTOR NO BANCO:',
      dados
    );

    return dados;

  } catch (error) {

    console.log(
      '❌ ERRO SELECT EMPRESA CONSULTOR:',
      error
    );

    return null;
  }
},

  async salvar(
    valores: any[]
  ) {

    console.log(
        '💾 Salvando empresa consultor...' 
    )
   const resultado = 
    await db.runAsync(
      `UPDATE empresa_consultor SET
        logo_pequena = ?,
        logo_media = ?,
        nome = ?,
        endereco = ?,
        numero = ?,
        cidade = ?,
        estado = ?,
        celular = ?,
        telefone = ?,
        email = ?,
        mensagem_formulario = ?,
        updated_at = ?
      WHERE id = '1'`,
      valores
    );

    console.log(
        '💾 Resultado UPDATE:',
        resultado
    );

    return resultado
  }
};