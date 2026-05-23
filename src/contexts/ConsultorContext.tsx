/**
 * CONTEXTO: ConsultorContext
 * 
 * FUNÇÃO:
 * Compartilha os dados do consultor logado entre todas as telas do app.
 */

import React, { createContext, useState, useContext, ReactNode } from 'react';

// EXPORTAR O TIPO CORRETAMENTE
export type Consultor = {
  id: string;
  nome: string;
  email: string;
  whatsapp: string;
  empresa: string;
  rota: string;
  foto: string | null;
  ativo: boolean;
};

type ConsultorContextData = {
  consultor: Consultor;
  atualizarConsultor: (dados: Partial<Consultor>) => void;
};

const ConsultorContext = createContext<ConsultorContextData | undefined>(undefined);

// Dados iniciais do consultor logado
const CONSULTOR_INICIAL: Consultor = {
  id: '1',
  nome: 'João Silva',
  email: 'joao.silva@email.com',
  whatsapp: '(11) 99999-1111',
  empresa: 'Tech Solutions',
  rota: 'Rota Sul',
  foto: null,
  ativo: true,
};

export function ConsultorProvider({ children }: { children: ReactNode }) {
  const [consultor, setConsultor] = useState<Consultor>(CONSULTOR_INICIAL);

  const atualizarConsultor = (dados: Partial<Consultor>) => {
    setConsultor((prev: Consultor) => ({ ...prev, ...dados }));
  };

  return (
    <ConsultorContext.Provider value={{ consultor, atualizarConsultor }}>
      {children}
    </ConsultorContext.Provider>
  );
}

export function useConsultor() {
  const context = useContext(ConsultorContext);
  if (!context) {
    throw new Error('useConsultor must be used within a ConsultorProvider');
  }
  return context;
}