/**
 * UTILS: validator
 *
 * FUNCAO:
 * Valida campos obrigatorios e formatos antes de salvar cadastros.
 */

// Lista de UFs aceitas nos cadastros.
export const ESTADOS_BRASIL = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES',
  'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR',
  'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
  'SP', 'SE', 'TO'
];

// Valida nome fantasia obrigatorio.
export const validarNomeFantasia = (texto: string): string => {
  if (!texto.trim()) {
    return 'Nome fantasia é obrigatório';
  }

  return '';
};

// Valida proprietario obrigatorio.
export const validarProprietario = (texto: string): string => {
  if (!texto.trim()) {
    return 'Proprietário é obrigatório';
  }

  return '';
};

// Valida cidade obrigatoria.
export const validarCidade = (texto: string): string => {
  if (!texto.trim()) {
    return 'Cidade é obrigatória';
  }

  return '';
};

// Valida UF obrigatoria e existente.
export const validarEstado = (texto: string): string => {
  const uf = texto.trim().toUpperCase();

  if (!uf) {
    return 'Estado é obrigatório';
  }

  if (!ESTADOS_BRASIL.includes(uf)) {
    return 'UF inválida';
  }

  return '';
};

// Valida endereco obrigatorio.
export const validarEndereco = (texto: string): string => {
  if (!texto.trim()) {
    return 'Endereço é obrigatório';
  }

  return '';
};

// Valida numero obrigatorio.
export const validarNumero = (texto: string): string => {
  if (!texto.trim()) {
    return 'Número é obrigatório';
  }

  return '';
};

// Valida e-mail obrigatorio em formato basico.
export const validarEmail = (email: string): string => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email.trim()) {
    return 'E-mail é obrigatório';
  }

  if (!regex.test(email)) {
    return 'E-mail inválido';
  }

  return '';
};

// Valida celular obrigatorio com DDD + 9 digitos.
export const validarCelular = (celular: string): string => {
  const numeros = celular.replace(/\D/g, '');

  if (!numeros) {
    return 'Celular é obrigatório';
  }

  if (numeros.length !== 11) {
    return 'Celular deve ter 11 dígitos';
  }

  return '';
};

// Valida codigo obrigatorio, numerico e limitado.
export const validarCodigoReferencia = (texto: string): string => {
  const codigo = texto.trim();

  if (!codigo) {
    return 'Código de referência é obrigatório';
  }

  if (!/^\d+$/.test(codigo)) {
    return 'Código deve conter apenas números';
  }

  if (codigo.length > 10) {
    return 'Máximo de 10 dígitos';
  }

  return '';
};
