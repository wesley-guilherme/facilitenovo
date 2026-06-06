/**
 * CONTEXTO: ConsultorContext
 * 
 * FUNÇÃO:
 * Compartilha os dados do consultor logado entre todas as telas do app.
 * Os dados iniciais são vazios - serão preenchidos após o primeiro cadastro/edição.
 */

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { ConsultorRepository } from '../database/consultorRepository';

export type Consultor = {
  id: string;
  nome: string;
  email: string;
  whatsapp: string;
  empresa: string;
  rota: string;
  foto: string | null;
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
};

export function ConsultorProvider({ children }: { children: ReactNode }) {
  const [consultor, setConsultor] = useState<Consultor>(CONSULTOR_INICIAL);
  useEffect(() => {
  carregarConsultor();
}, []);

  const atualizarConsultor = (dados: Partial<Consultor>) => {
    setConsultor((prev: Consultor) => ({ ...prev, ...dados }));
  };

const carregarConsultor = async () => {

  try {

    const dados =
      await ConsultorRepository.carregar();
    console.log(
  '📋 Dados carregados do banco:',
  dados
);
    if (!dados) return;

    setConsultor({
      id: String(dados.id ?? ''),
      nome: String(dados.nome ?? ''),
      email: String(dados.email ?? ''),
      whatsapp: String(dados.whatsapp ?? ''),
      empresa: String(dados.empresa ?? ''),
      rota: String(dados.rota ?? ''),
      foto: dados.foto
        ? String(dados.foto)
        : null
    });

  } catch (error) {

    console.error(
      'Erro ao carregar consultor:',
      error
    );

  }
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