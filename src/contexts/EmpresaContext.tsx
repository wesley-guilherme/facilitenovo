/**
 * CONTEXTO: EmpresaContext
 *
 * FUNÇÃO:
 * Compartilha os dados da empresa do consultor entre todas as telas do app.
 */

import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect
} from 'react';

import { EmpresaConsultorRepository } from '../database/empresaConsultorRepository';

export type EmpresaConsultor = {
  id: string;
  logoPequena: string | null;
  logoMedia: string | null;
  nome: string;
  endereco: string;
  numero: string;
  cidade: string;
  estado: string;
  celular: string;
  telefone: string;
  email: string;
  mensagemFormulario: string;
};

type EmpresaContextData = {
  empresa: EmpresaConsultor;
  atualizarEmpresa: (dados: Partial<EmpresaConsultor>) => void;
  carregarEmpresa: () => Promise<void>;
};

const EmpresaContext =
  createContext<EmpresaContextData | undefined>(
    undefined
  );

// Dados iniciais vazios
const EMPRESA_INICIAL: EmpresaConsultor = {
  id: '',
  logoPequena: null,
  logoMedia: null,
  nome: '',
  endereco: '',
  numero: '',
  cidade: '',
  estado: '',
  celular: '',
  telefone: '',
  email: '',
  mensagemFormulario: '',
};

export function EmpresaProvider({
  children
}: {
  children: ReactNode;
}) {

  const [empresa, setEmpresa] =
    useState<EmpresaConsultor>(
      EMPRESA_INICIAL
    );

  useEffect(() => {
    carregarEmpresa();
  }, []);

  const atualizarEmpresa = (
    dados: Partial<EmpresaConsultor>
  ) => {
    setEmpresa(prev => ({
      ...prev,
      ...dados
    }));
  };

  const carregarEmpresa = async () => {

    try {

      const dados =
        await EmpresaConsultorRepository.carregar();

      console.log(
        '🏢 Dados empresa carregados:',
        dados
      );

      if (!dados) return;

      setEmpresa({
        id: String(dados.id ?? ''),
        logoPequena: dados.logo_pequena
          ? String(dados.logo_pequena)
          : null,
        logoMedia: dados.logo_media
          ? String(dados.logo_media)
          : null,
        nome: String(dados.nome ?? ''),
        endereco: String(dados.endereco ?? ''),
        numero: String(dados.numero ?? ''),
        cidade: String(dados.cidade ?? ''),
        estado: String(dados.estado ?? ''),
        celular: String(dados.celular ?? ''),
        telefone: String(dados.telefone ?? ''),
        email: String(dados.email ?? ''),
        mensagemFormulario: String(
          dados.mensagem_formulario ?? ''
        )
      });

    } catch (error) {

      console.error(
        'Erro ao carregar empresa:',
        error
      );

    }
  };

  return (
    <EmpresaContext.Provider
      value={{
        empresa,
        atualizarEmpresa,
        carregarEmpresa
      }}
    >
      {children}
    </EmpresaContext.Provider>
  );
}

export function useEmpresa() {

  const context =
    useContext(EmpresaContext);

  if (!context) {
    throw new Error(
      'useEmpresa must be used within a EmpresaProvider'
    );
  }

  return context;
}