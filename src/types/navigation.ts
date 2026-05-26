import { EmpresaConsultor } from './../contexts/EmpresaContext';
/**
 * TIPAGEM DAS ROTAS DO DRAWER
 * 
 * Define todos os nomes de telas disponíveis no Drawer Navigator
 * Isso permite que o TypeScript autocomplete e previna erros de digitação
 */

export type RootDrawerParamList = {
  Home: undefined;
  MeuPerfil: undefined;
  Empresas: undefined;
  CadastroEmpresa: undefined;
  EditarEmpresa: { empresa: any};
  EditarConsultor: { consultor: any };
  Relatorios: undefined;
  TextosPredefinidos: undefined;
  EmpresaConsultor: undefined;
  Configuracoes: undefined;
  FaleConosco: undefined;
  Visitas: undefined;
  NovaVisita: { empresa?: any};
  DetalhesVisita: { empresa: any; visita: any}

  // Adicione outras telas futuramente:
  // Empresas: undefined;
  // Visitas: undefined;
  // Relatorios: undefined;
  // Textos: undefined;
};