import { customAlphabet } from 'nanoid';

const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const generateCode = customAlphabet(alphabet, 6);

export function createShortCode(): string {
  return generateCode();
}
