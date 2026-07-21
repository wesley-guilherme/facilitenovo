/**
 * TYPES: navigation
 *
 * FUNCAO:
 * Centraliza as rotas e parametros aceitos pelo Drawer Navigator.
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
  FormularioVisita: { empresa?: any};
  DetalhesVisita: { empresa: any; visita: any}

  // Adicione outras telas futuramente:
  // Empresas: undefined;
  // Visitas: undefined;
  // Relatorios: undefined;
  // Textos: undefined;
};
