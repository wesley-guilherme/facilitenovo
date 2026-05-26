/**
 * CONTEXTO: ConsultorContext
 * 
 * FUNÇÃO:
 * Compartilha os dados do consultor logado entre todas as telas do app.
 * Os dados iniciais são vazios - serão preenchidos após o primeiro cadastro/edição.
 */

import React, { createContext, useState, useContext, ReactNode } from 'react';

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
  carregarConsultor: () => Promise<void>;
};

const ConsultorContext = createContext<ConsultorContextData | undefined>(undefined);

// Dados iniciais vazios (sem mock)
const CONSULTOR_INICIAL: Consultor = {
  id: '',
  nome: '',
  email: '',
  whatsapp: '',
  empresa: '',
  rota: '',
  foto: null,
  ativo: true,
};

export function ConsultorProvider({ children }: { children: ReactNode }) {
  const [consultor, setConsultor] = useState<Consultor>(CONSULTOR_INICIAL);

  const atualizarConsultor = (dados: Partial<Consultor>) => {
    setConsultor((prev: Consultor) => ({ ...prev, ...dados }));
  };

  const carregarConsultor = async () => {
    // Aqui você pode buscar os dados do banco SQLite
    // Por enquanto, mantém os dados atuais
    console.log('Carregando dados do consultor...');
  };

  return (
    <ConsultorContext.Provider value={{ consultor, atualizarConsultor, carregarConsultor }}>
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