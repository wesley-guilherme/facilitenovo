import { db } from './initDatabase';

export type VisitaDB = {
  id: string;

  empresa_id: string;

  consultor_id: string;

  data_visita: string;

  solicitante: string;

  hora_inicio: string;

  hora_termino: string;

  descricao: string;

  status: string;

  created_at: string;

  updated_at: string | null;
};

export const VisitasRepository = {

  async listar(): Promise<VisitaDB[]> {

    return await db.getAllAsync<VisitaDB>(`
      SELECT *
      FROM visitas
      ORDER BY data_visita DESC,
               hora_inicio DESC
    `);

  },

  async listarPorData(
  data: string
): Promise<VisitaDB[]> {

  return await db.getAllAsync<VisitaDB>(`

    SELECT *

    FROM visitas

    WHERE data_visita = ?

    ORDER BY hora_inicio ASC

  `,

  [data]);

},

  async listarEmpresasPendentes() {

  return await db.getAllAsync(

`SELECT

e.*,

MAX(v.data_visita) AS ultima_visita

FROM empresas e

LEFT JOIN visitas v

ON e.id = v.empresa_id

WHERE e.ativo = 1

GROUP BY e.id

ORDER BY

CASE

WHEN ultima_visita IS NULL THEN 0

ELSE 1

END,

ultima_visita ASC`

  );

},

  async carregar(id: string): Promise<VisitaDB | null> {

    return await db.getFirstAsync<VisitaDB>(`
      SELECT *
      FROM visitas
      WHERE id = ?
    `,
    [id]);

  },

  async buscarPorEmpresa(
    empresaId: string
  ): Promise<VisitaDB[]> {

    return await db.getAllAsync<VisitaDB>(`
      SELECT *
      FROM visitas
      WHERE empresa_id = ?
      ORDER BY data_visita DESC
    `,
    [empresaId]);

  },

  async buscarUltimaVisita(
    empresaId: string
  ): Promise<VisitaDB | null> {

    return await db.getFirstAsync<VisitaDB>(`
      SELECT *
      FROM visitas
      WHERE empresa_id = ?
      ORDER BY data_visita DESC,
               hora_termino DESC
      LIMIT 1
    `,
    [empresaId]);

  },

  async buscarUltimoFormulario(
  empresaId: string
): Promise<VisitaDB | null> {

  return await db.getFirstAsync<VisitaDB>(`

    SELECT *

    FROM visitas

    WHERE empresa_id = ?

      AND status <> 'RASCUNHO'

    ORDER BY

      data_visita DESC,

      hora_termino DESC

    LIMIT 1

  `,

  [empresaId]);

},

  async inserir(
    valores: any[]
  ) {

    return await db.runAsync(
      `INSERT INTO visitas(

        id,

        empresa_id,

        consultor_id,

        data_visita,

        solicitante,

        hora_inicio,

        hora_termino,

        descricao,

        status,

        created_at

      )

      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      valores
    );

  },

  async atualizar(
    valores: any[]
  ) {

    return await db.runAsync(
      `UPDATE visitas

      SET

        empresa_id = ?,

        consultor_id = ?,

        data_visita = ?,

        solicitante = ?,

        hora_inicio = ?,

        hora_termino = ?,

        descricao = ?,

        status = ?,

        updated_at = ?

      WHERE id = ?`,
      valores
    );

  },

  async excluir(
    id: string
  ) {

    return await db.runAsync(
      `DELETE
       FROM visitas
       WHERE id = ?`,
      [id]
    );

  }

};