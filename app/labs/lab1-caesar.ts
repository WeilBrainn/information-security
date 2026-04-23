// Лабораторная работа 1: Шифр Цезаря
// Студент: Адодин Егор
// Группа: ИТБД-124

// Кириллический алфавит (только русские буквы)
export const CYRILLIC_UPPER = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ'
export const CYRILLIC_LOWER = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя'
export const ALPHABET_SIZE = 33

// Интерфейс для символа в таблице
export interface AlphabetTableItem {
  index: number
  upperChar: string
  lowerChar: string
  upperCode: number
  lowerCode: number
}

// Генерация таблицы алфавита с кодами символов
export function generateAlphabetTable(): AlphabetTableItem[] {
  const table: AlphabetTableItem[] = []
  
  for (let i = 0; i < ALPHABET_SIZE; i++) {
    table.push({
      index: i + 1,
      upperChar: CYRILLIC_UPPER[i],
      lowerChar: CYRILLIC_LOWER[i],
      upperCode: CYRILLIC_UPPER.charCodeAt(i),
      lowerCode: CYRILLIC_LOWER.charCodeAt(i),
    })
  }
  
  return table
}

// Проверка, является ли символ кириллическим
export function isCyrillicChar(char: string): boolean {
  return CYRILLIC_UPPER.includes(char) || CYRILLIC_LOWER.includes(char)
}

// Получить индекс символа в алфавите
function getCharIndex(char: string): number {
  const upperIndex = CYRILLIC_UPPER.indexOf(char)
  if (upperIndex !== -1) return upperIndex
  
  const lowerIndex = CYRILLIC_LOWER.indexOf(char)
  if (lowerIndex !== -1) return lowerIndex
  
  return -1
}

// Определить регистр символа
function isUpperCase(char: string): boolean {
  return CYRILLIC_UPPER.includes(char)
}

// Сдвиг символа на заданное количество позиций
function shiftChar(char: string, shift: number, encrypt: boolean): string {
  if (!isCyrillicChar(char)) {
    return char // Возвращаем символ без изменений, если он не кириллический
  }
  
  const index = getCharIndex(char)
  const isUpper = isUpperCase(char)
  
  // Определяем направление сдвига
  const actualShift = encrypt ? shift : -shift
  
  // Вычисляем новый индекс с учетом цикличности
  let newIndex = (index + actualShift) % ALPHABET_SIZE
  if (newIndex < 0) {
    newIndex += ALPHABET_SIZE
  }
  
  // Возвращаем символ в соответствующем регистре
  return isUpper ? CYRILLIC_UPPER[newIndex] : CYRILLIC_LOWER[newIndex]
}

// Шифрование текста
export function encryptCaesar(text: string, shift: number): string {
  // Валидация сдвига
  if (!Number.isInteger(shift)) {
    throw new Error('Сдвиг должен быть целым числом')
  }
  
  // Нормализуем сдвиг
  const normalizedShift = ((shift % ALPHABET_SIZE) + ALPHABET_SIZE) % ALPHABET_SIZE
  
  let result = ''
  
  for (const char of text) {
    result += shiftChar(char, normalizedShift, true)
  }
  
  return result
}

// Дешифрование текста
export function decryptCaesar(text: string, shift: number): string {
  // Валидация сдвига
  if (!Number.isInteger(shift)) {
    throw new Error('Сдвиг должен быть целым числом')
  }
  
  // Нормализуем сдвиг
  const normalizedShift = ((shift % ALPHABET_SIZE) + ALPHABET_SIZE) % ALPHABET_SIZE
  
  let result = ''
  
  for (const char of text) {
    result += shiftChar(char, normalizedShift, false)
  }
  
  return result
}

// Статистика текста
export interface TextStats {
  totalChars: number
  cyrillicChars: number
  otherChars: number
  spaces: number
}

export function getTextStats(text: string): TextStats {
  let cyrillicChars = 0
  let spaces = 0
  let otherChars = 0
  
  for (const char of text) {
    if (isCyrillicChar(char)) {
      cyrillicChars++
    } else if (char === ' ') {
      spaces++
    } else {
      otherChars++
    }
  }
  
  return {
    totalChars: text.length,
    cyrillicChars,
    otherChars,
    spaces,
  }
}

// Валидация сдвига
export function validateShift(value: string): { valid: boolean; shift: number; error?: string } {
  if (value.trim() === '') {
    return { valid: false, shift: 0, error: 'Введите значение сдвига' }
  }
  
  const num = parseInt(value, 10)
  
  if (isNaN(num)) {
    return { valid: false, shift: 0, error: 'Сдвиг должен быть числом' }
  }
  
  if (num < 0 || num > 32) {
    return { valid: true, shift: num, error: `Сдвиг нормализован: ${((num % 33) + 33) % 33}` }
  }
  
  return { valid: true, shift: num }
}
