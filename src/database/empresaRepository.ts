import { db } from './initDatabase';

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
  created_at: string | null;
  updated_at: string | null;
};

export const EmpresaRepository = {

  async listar(): Promise<EmpresaDB[]> {

  return await db.getAllAsync<EmpresaDB>(
    `SELECT *
     FROM empresas
     ORDER BY nome_fantasia ASC`
  );

},

  async buscarPorCodigo(codigo: string) {
    return await db.getFirstAsync(
      'SELECT * FROM empresas WHERE codigo_referencia = ?',
      [codigo]
    );
  },

  async existeCodigo(codigo: string) {
    const resultado = 
      await db.getFirstAsync(
        'SELECT id FROM empresas WHERE codigo_referencia = ?',
        [codigo]
    );

    return !!resultado;
  },

  async existeCodigoEdicao(
  codigo: string,
  empresaId: string
) {
  const resultado =
    await db.getFirstAsync(
      `SELECT id
       FROM empresas
       WHERE codigo_referencia = ?
       AND id <> ?`,
      [codigo, empresaId]
    );

  return !!resultado;
},

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
      'UPDATE empresas SET ativo = 0 WHERE id = ?',
      [id]
    );
  }
};