/**
 * TIPAGEM DAS ROTAS DO DRAWER
 * 
 * Define todos os nomes de telas disponíveis no Drawer Navigator
 * Isso permite que o TypeScript autocomplete e previna erros de digitação
 */

export type RootDrawerParamList = {
  Home: undefined;
  Consultores: undefined;
  CadastroConsultor: undefined;
  EditarConsultor: { consultor: any };
  Empresas: undefined;
  CadastroEmpresa: undefined;
  EditarEmpresa: { empresa: any};
  // Adicione outras telas futuramente:
  // Empresas: undefined;
  // Visitas: undefined;
  // Relatorios: undefined;
  // Textos: undefined;
};