/**
 * CONTEXTO: EmpresaContext
 * 
 * FUNÇÃO:
 * Compartilha os dados da empresa do consultor entre todas as telas do app.
 */

import React, { createContext, useState, useContext, ReactNode } from 'react';

export type EmpresaConsultor = {
  id: string;
  logoPequena: string | null;    // Logo pequena (upload)
  logoMedia: string | null;       // Logo média (marca d'água)
  nome: string;
  endereco: string;
  numero: string;
  cidade: string;
  estado: string;
  celular: string;                // Formato (99)-99999-9999
  telefone: string;               // Formato (99)-9999-9999
  email: string;
  mensagemFormulario: string;     // Mensagem que sai no formulário
};

type EmpresaContextData = {
  empresa: EmpresaConsultor;
  atualizarEmpresa: (dados: Partial<EmpresaConsultor>) => void;
};

const EmpresaContext = createContext<EmpresaContextData | undefined>(undefined);

// Dados iniciais da empresa
const EMPRESA_INICIAL: EmpresaConsultor = {
  id: '1',
  logoPequena: null,
  logoMedia: null,
  nome: 'Tech Solutions',
  endereco: 'Rua das Tecnologias',
  numero: '123',
  cidade: 'São Paulo',
  estado: 'SP',
  celular: '(11) 99999-1111',
  telefone: '(11) 3333-4444',
  email: 'contato@techsolutions.com',
  mensagemFormulario: 'Agradecemos pela parceria! Estamos à disposição.',
};

export function EmpresaProvider({ children }: { children: ReactNode }) {
  const [empresa, setEmpresa] = useState<EmpresaConsultor>(EMPRESA_INICIAL);

  const atualizarEmpresa = (dados: Partial<EmpresaConsultor>) => {
    setEmpresa(prev => ({ ...prev, ...dados }));
  };

  return (
    <EmpresaContext.Provider value={{ empresa, atualizarEmpresa }}>
      {children}
    </EmpresaContext.Provider>
  );
}

export function useEmpresa() {
  const context = useContext(EmpresaContext);
  if (!context) {
    throw new Error('useEmpresa must be used within a EmpresaProvider');
  }
  return context;
}