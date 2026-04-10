/**
 * Utilitários de validação
 */

/**
 * Valida um email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida um CPF
 */
export function isValidCPF(cpf: string): boolean {
  cpf = cpf.replace(/[^\d]/g, '');
  
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  
  let sum = 0;
  let remainder;
  
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(9, 10))) return false;
  
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(10, 11))) return false;
  
  return true;
}

/**
 * Valida um CNPJ
 */
export function isValidCNPJ(cnpj: string): boolean {
  cnpj = cnpj.replace(/[^\d]/g, '');
  
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false;
  
  let size = cnpj.length - 2;
  let numbers = cnpj.substring(0, size);
  const digits = cnpj.substring(size);
  let sum = 0;
  let pos = size - 7;
  
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;
  
  size = size + 1;
  numbers = cnpj.substring(0, size);
  sum = 0;
  pos = size - 7;
  
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;
  
  return true;
}

/**
 * Valida um telefone brasileiro
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\(?([0-9]{2})\)?[-.\s]?([0-9]{4,5})[-.\s]?([0-9]{4})$/;
  return phoneRegex.test(phone);
}

/**
 * Valida um CEP
 */
export function isValidCEP(cep: string): boolean {
  const cepRegex = /^[0-9]{5}-?[0-9]{3}$/;
  return cepRegex.test(cep);
}

/**
 * Valida uma URL
 */
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Valida se uma string não está vazia
 */
export function isNotEmpty(value: string): boolean {
  return value.trim().length > 0;
}

/**
 * Valida o tamanho mínimo de uma string
 */
export function minLength(value: string, min: number): boolean {
  return value.length >= min;
}

/**
 * Valida o tamanho máximo de uma string
 */
export function maxLength(value: string, max: number): boolean {
  return value.length <= max;
}

/**
 * Valida se um número está dentro de um intervalo
 */
export function inRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Valida se um valor é um número
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Valida se um valor é um número positivo
 */
export function isPositiveNumber(value: number): boolean {
  return isNumber(value) && value > 0;
}

/**
 * Valida se um valor é um número negativo
 */
export function isNegativeNumber(value: number): boolean {
  return isNumber(value) && value < 0;
}

/**
 * Valida se um valor é um inteiro
 */
export function isInteger(value: number): boolean {
  return Number.isInteger(value);
}

/**
 * Valida se um valor é uma data válida
 */
export function isValidDate(value: unknown): boolean {
  if (value instanceof Date) {
    return !isNaN(value.getTime());
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return !isNaN(date.getTime());
  }
  return false;
}

/**
 * Valida se uma data está no futuro
 */
export function isFutureDate(date: Date): boolean {
  return date.getTime() > Date.now();
}

/**
 * Valida se uma data está no passado
 */
export function isPastDate(date: Date): boolean {
  return date.getTime() < Date.now();
}

/**
 * Valida se um valor é um array
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Valida se um array não está vazio
 */
export function isNonEmptyArray(value: unknown[]): boolean {
  return isArray(value) && value.length > 0;
}

/**
 * Valida se um valor é um objeto
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !isArray(value);
}

/**
 * Valida se um objeto não está vazio
 */
export function isNonEmptyObject(value: Record<string, unknown>): boolean {
  return isObject(value) && Object.keys(value).length > 0;
}

/**
 * Valida se um valor é uma string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Valida se um valor é um booleano
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Valida se um valor é nulo ou indefinido
 */
export function isNullOrUndefined(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Valida se um valor está definido (não é nulo nem indefinido)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Valida uma senha forte
 * - Pelo menos 8 caracteres
 * - Pelo menos uma letra maiúscula
 * - Pelo menos uma letra minúscula
 * - Pelo menos um número
 * - Pelo menos um caractere especial
 */
export function isStrongPassword(password: string): boolean {
  const minLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  return minLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;
}

/**
 * Valida se duas senhas são iguais
 */
export function passwordsMatch(password: string, confirmPassword: string): boolean {
  return password === confirmPassword;
}

/**
 * Valida um UUID
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Valida um código hexadecimal de cor
 */
export function isValidHexColor(color: string): boolean {
  const hexRegex = /^#?([a-f\d]{3}|[a-f\d]{6})$/i;
  return hexRegex.test(color);
}

/**
 * Valida um nome de arquivo
 */
export function isValidFilename(filename: string): boolean {
  const invalidChars = /[<>:"\/\\|?*]/;
  return !invalidChars.test(filename) && filename.length > 0 && filename.length <= 255;
}

/**
 * Valida uma extensão de arquivo
 */
export function hasValidExtension(filename: string, allowedExtensions: string[]): boolean {
  const extension = filename.split('.').pop()?.toLowerCase();
  return extension !== undefined && allowedExtensions.includes(extension);
}

/**
 * Valida um tamanho de arquivo
 */
export function isValidFileSize(sizeInBytes: number, maxSizeInMB: number): boolean {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return sizeInBytes <= maxSizeInBytes;
}

/**
 * Valida um número de cartão de crédito usando o algoritmo de Luhn
 */
export function isValidCreditCard(cardNumber: string): boolean {
  cardNumber = cardNumber.replace(/\s/g, '');
  
  if (!/^\d+$/.test(cardNumber)) return false;
  
  let sum = 0;
  let isEven = false;
  
  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber.charAt(i), 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
}

/**
 * Valida um código de segurança de cartão de crédito (CVV)
 */
export function isValidCVV(cvv: string): boolean {
  return /^\d{3,4}$/.test(cvv);
}

/**
 * Valida uma data de expiração de cartão de crédito
 */
export function isValidExpirationDate(month: string, year: string): boolean {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  const expMonth = parseInt(month, 10);
  const expYear = parseInt(year, 10);
  
  if (isNaN(expMonth) || isNaN(expYear)) return false;
  if (expMonth < 1 || expMonth > 12) return false;
  
  const fullYear = expYear < 100 ? 2000 + expYear : expYear;
  
  if (fullYear < currentYear) return false;
  if (fullYear === currentYear && expMonth < currentMonth) return false;
  
  return true;
}

/**
 * Interface para resultado de validação
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Cria um validador composto
 */
export function createValidator<T>(
  ...validators: Array<(value: T) => string | null>
): (value: T) => ValidationResult {
  return (value: T): ValidationResult => {
    const errors: string[] = [];
    
    for (const validator of validators) {
      const error = validator(value);
      if (error) {
        errors.push(error);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  };
}
