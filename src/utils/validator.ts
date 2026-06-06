export const ESTADOS_BRASIL = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES',
  'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR',
  'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
  'SP', 'SE', 'TO'
];

export const validarNomeFantasia = (texto: string): string => {
  if (!texto.trim()) {
    return 'Nome fantasia é obrigatório';
  }

  return '';
};

export const validarProprietario = (texto: string): string => {
  if (!texto.trim()) {
    return 'Proprietário é obrigatório';
  }

  return '';
};

export const validarCidade = (texto: string): string => {
  if (!texto.trim()) {
    return 'Cidade é obrigatória';
  }

  return '';
};

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

export const validarEndereco = (texto: string): string => {
  if (!texto.trim()) {
    return 'Endereço é obrigatório';
  }

  return '';
};

export const validarNumero = (texto: string): string => {
  if (!texto.trim()) {
    return 'Número é obrigatório';
  }

  return '';
};

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