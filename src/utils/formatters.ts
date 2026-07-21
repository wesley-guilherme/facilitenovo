/**
 * UTILS: formatters
 *
 * FUNCAO:
 * Padroniza textos digitados antes de validar ou salvar no banco.
 */

// Aplica mascara brasileira para celular com 11 digitos.
export const formatarCelular = (texto: string): string => {
  let numeros = texto.replace(/\D/g, '');

  if (numeros.length > 11) {
    numeros = numeros.slice(0, 11);
  }

  if (numeros.length === 0) {
    return '';
  }

  if (numeros.length <= 2) {
    return `(${numeros}`;
  }

  if (numeros.length <= 7) {
    return `(${numeros.slice(0, 2)})-${numeros.slice(2)}`;
  }

  return `(${numeros.slice(0, 2)})-${numeros.slice(2, 7)}-${numeros.slice(7, 11)}`;
};

// Remove tudo que nao for numero.
export const somenteNumeros = (texto: string): string => {
  return texto.replace(/\D/g, '');
};

// Mantem UF com duas letras maiusculas.
export const formatarUF = (texto: string): string => {
  return texto
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 2);
};

// Remove espacos extras de textos comuns.
export const normalizarTexto = (texto: string): string => {
  return texto.trim().replace(/\s+/g, ' ');
};

// Padroniza e-mail para comparacao e salvamento.
export const normalizarEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

// Mantem apenas numeros no codigo de referencia.
export const normalizarCodigoReferencia = (codigo: string): string => {
  return codigo.replace(/\D/g, '').trim();
};

export const limitarCodigoReferencia = (
  texto: string,
  tamanhoMaximo: number = 10
): string => {
  return texto.replace(/\D/g, '').slice(0, tamanhoMaximo);
};

export const removerEspacosDuplicados = (texto: string): string => {
  return texto.replace(/\s+/g, ' ').trim();
};

export const formatarNomeEmpresa = (texto: string): string => {
  return texto
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, letra => letra.toUpperCase());
};
