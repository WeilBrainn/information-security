// Лабораторная работа 3: Алгоритмы шифрования DES
// Студент: Адодин Егор
// Группа: ИТБД-124

// ==========================================
// Теория и описание алгоритма DES
// ==========================================
// DES (Data Encryption Standard) - симметричный блочный шифр
// Размер блока: 64 бита (8 байт)
// Размер ключа: 56 бит (64 бита с битами четности)
// Количество раундов: 16
// Структура: сеть Фейстеля

// ==========================================
// Интерфейсы для работы с DES
// ==========================================

// Результат шифрования/дешифрования
export interface DESResult {
  input: string           // Исходные данные (hex)
  output: string          // Результат (hex)
  key: string             // Использованный ключ (hex)
  blocks: BlockInfo[]     // Информация о блоках
  executionTime: number   // Время выполнения (мс)
  mode: 'encrypt' | 'decrypt'
}

// Информация о блоке
export interface BlockInfo {
  index: number           // Номер блока
  input: string           // Входные данные блока (hex)
  output: string          // Выходные данные блока (hex)
  rounds?: RoundInfo[]    // Информация о раундах (опционально)
}

// Информация о раунде (для лавинного эффекта)
export interface RoundInfo {
  round: number           // Номер раунда
  left: string            // Левая половина (hex)
  right: string           // Правая половина (hex)
  subkey: string          // Подключ раунда (hex)
}

// Результат анализа лавинного эффекта
export interface AvalancheResult {
  originalInput: string       // Исходный текст
  modifiedInput: string       // Изменённый текст (1 бит)
  originalOutput: string      // Зашифрованный исходный
  modifiedOutput: string      // Зашифрованный изменённый
  changedBits: number         // Кол-во изменённых бит
  totalBits: number           // Общее кол-во бит
  percentage: number          // Процент изменений
  roundByRound: RoundAvalanche[]  // Изменения по раундам
}

// Лавинный эффект по раундам
export interface RoundAvalanche {
  round: number
  changedBits: number
  percentage: number
}

// Результат анализа слабых ключей
export interface WeakKeyAnalysis {
  keyType: 'weak' | 'semi-weak' | 'normal'
  key: string
  pairedKey?: string        // Парный ключ для полуслабых ключей
  description: string
  encryptedSame: boolean  // Шифрует ли дважды в то же самое
}

// Результат сжатия
export interface CompressionResult {
  originalText: string
  encryptedText: string
  originalSize: number        // Размер в байтах
  encryptedSize: number       // Размер в байтах
  originalCompressed: number  // Сжатый размер оригинала
  encryptedCompressed: number // Сжатый размер шифротекста
  originalRatio: number       // Коэффициент сжатия оригинала
  encryptedRatio: number      // Коэффициент сжатия шифротекста
}

// ==========================================
// Таблицы перестановок и S-блоки DES
// ==========================================

// Начальная перестановка IP (Initial Permutation)
// Асимптотика: O(64) = O(1) - фиксированный размер
const IP: number[] = [
  58, 50, 42, 34, 26, 18, 10, 2,
  60, 52, 44, 36, 28, 20, 12, 4,
  62, 54, 46, 38, 30, 22, 14, 6,
  64, 56, 48, 40, 32, 24, 16, 8,
  57, 49, 41, 33, 25, 17, 9, 1,
  59, 51, 43, 35, 27, 19, 11, 3,
  61, 53, 45, 37, 29, 21, 13, 5,
  63, 55, 47, 39, 31, 23, 15, 7
]

// Финальная перестановка IP^(-1)
// Асимптотика: O(64) = O(1)
const IP_INV: number[] = [
  40, 8, 48, 16, 56, 24, 64, 32,
  39, 7, 47, 15, 55, 23, 63, 31,
  38, 6, 46, 14, 54, 22, 62, 30,
  37, 5, 45, 13, 53, 21, 61, 29,
  36, 4, 44, 12, 52, 20, 60, 28,
  35, 3, 43, 11, 51, 19, 59, 27,
  34, 2, 42, 10, 50, 18, 58, 26,
  33, 1, 41, 9, 49, 17, 57, 25
]

// Перестановка E (Expansion) - расширение 32 бит до 48
// Асимптотика: O(48) = O(1)
const E: number[] = [
  32, 1, 2, 3, 4, 5,
  4, 5, 6, 7, 8, 9,
  8, 9, 10, 11, 12, 13,
  12, 13, 14, 15, 16, 17,
  16, 17, 18, 19, 20, 21,
  20, 21, 22, 23, 24, 25,
  24, 25, 26, 27, 28, 29,
  28, 29, 30, 31, 32, 1
]

// Перестановка P (используется после S-блоков)
// Асимптотика: O(32) = O(1)
const P: number[] = [
  16, 7, 20, 21, 29, 12, 28, 17,
  1, 15, 23, 26, 5, 18, 31, 10,
  2, 8, 24, 14, 32, 27, 3, 9,
  19, 13, 30, 6, 22, 11, 4, 25
]

// S-блоки (Substitution boxes) - 8 штук по 4x16
// Каждый S-блок принимает 6 бит и выдаёт 4 бита
// Асимптотика доступа: O(1)
const S_BOXES: number[][][] = [
  // S1
  [
    [14, 4, 13, 1, 2, 15, 11, 8, 3, 10, 6, 12, 5, 9, 0, 7],
    [0, 15, 7, 4, 14, 2, 13, 1, 10, 6, 12, 11, 9, 5, 3, 8],
    [4, 1, 14, 8, 13, 6, 2, 11, 15, 12, 9, 7, 3, 10, 5, 0],
    [15, 12, 8, 2, 4, 9, 1, 7, 5, 11, 3, 14, 10, 0, 6, 13]
  ],
  // S2
  [
    [15, 1, 8, 14, 6, 11, 3, 4, 9, 7, 2, 13, 12, 0, 5, 10],
    [3, 13, 4, 7, 15, 2, 8, 14, 12, 0, 1, 10, 6, 9, 11, 5],
    [0, 14, 7, 11, 10, 4, 13, 1, 5, 8, 12, 6, 9, 3, 2, 15],
    [13, 8, 10, 1, 3, 15, 4, 2, 11, 6, 7, 12, 0, 5, 14, 9]
  ],
  // S3
  [
    [10, 0, 9, 14, 6, 3, 15, 5, 1, 13, 12, 7, 11, 4, 2, 8],
    [13, 7, 0, 9, 3, 4, 6, 10, 2, 8, 5, 14, 12, 11, 15, 1],
    [13, 6, 4, 9, 8, 15, 3, 0, 11, 1, 2, 12, 5, 10, 14, 7],
    [1, 10, 13, 0, 6, 9, 8, 7, 4, 15, 14, 3, 11, 5, 2, 12]
  ],
  // S4
  [
    [7, 13, 14, 3, 0, 6, 9, 10, 1, 2, 8, 5, 11, 12, 4, 15],
    [13, 8, 11, 5, 6, 15, 0, 3, 4, 7, 2, 12, 1, 10, 14, 9],
    [10, 6, 9, 0, 12, 11, 7, 13, 15, 1, 3, 14, 5, 2, 8, 4],
    [3, 15, 0, 6, 10, 1, 13, 8, 9, 4, 5, 11, 12, 7, 2, 14]
  ],
  // S5
  [
    [2, 12, 4, 1, 7, 10, 11, 6, 8, 5, 3, 15, 13, 0, 14, 9],
    [14, 11, 2, 12, 4, 7, 13, 1, 5, 0, 15, 10, 3, 9, 8, 6],
    [4, 2, 1, 11, 10, 13, 7, 8, 15, 9, 12, 5, 6, 3, 0, 14],
    [11, 8, 12, 7, 1, 14, 2, 13, 6, 15, 0, 9, 10, 4, 5, 3]
  ],
  // S6
  [
    [12, 1, 10, 15, 9, 2, 6, 8, 0, 13, 3, 4, 14, 7, 5, 11],
    [10, 15, 4, 2, 7, 12, 9, 5, 6, 1, 13, 14, 0, 11, 3, 8],
    [9, 14, 15, 5, 2, 8, 12, 3, 7, 0, 4, 10, 1, 13, 11, 6],
    [4, 3, 2, 12, 9, 5, 15, 10, 11, 14, 1, 7, 6, 0, 8, 13]
  ],
  // S7
  [
    [4, 11, 2, 14, 15, 0, 8, 13, 3, 12, 9, 7, 5, 10, 6, 1],
    [13, 0, 11, 7, 4, 9, 1, 10, 14, 3, 5, 12, 2, 15, 8, 6],
    [1, 4, 11, 13, 12, 3, 7, 14, 10, 15, 6, 8, 0, 5, 9, 2],
    [6, 11, 13, 8, 1, 4, 10, 7, 9, 5, 0, 15, 14, 2, 3, 12]
  ],
  // S8
  [
    [13, 2, 8, 4, 6, 15, 11, 1, 10, 9, 3, 14, 5, 0, 12, 7],
    [1, 15, 13, 8, 10, 3, 7, 4, 12, 5, 6, 11, 0, 14, 9, 2],
    [7, 11, 4, 1, 9, 12, 14, 2, 0, 6, 10, 13, 15, 3, 5, 8],
    [2, 1, 14, 7, 4, 10, 8, 13, 15, 12, 9, 0, 3, 5, 6, 11]
  ]
]

// Перестановка PC-1 для ключа (64 бита -> 56 бит, убираем биты четности)
// Асимптотика: O(56) = O(1)
const PC1: number[] = [
  57, 49, 41, 33, 25, 17, 9,
  1, 58, 50, 42, 34, 26, 18,
  10, 2, 59, 51, 43, 35, 27,
  19, 11, 3, 60, 52, 44, 36,
  63, 55, 47, 39, 31, 23, 15,
  7, 62, 54, 46, 38, 30, 22,
  14, 6, 61, 53, 45, 37, 29,
  21, 13, 5, 28, 20, 12, 4
]

// Перестановка PC-2 для подключей (56 бит -> 48 бит)
// Асимптотика: O(48) = O(1)
const PC2: number[] = [
  14, 17, 11, 24, 1, 5,
  3, 28, 15, 6, 21, 10,
  23, 19, 12, 4, 26, 8,
  16, 7, 27, 20, 13, 2,
  41, 52, 31, 37, 47, 55,
  30, 40, 51, 45, 33, 48,
  44, 49, 39, 56, 34, 53,
  46, 42, 50, 36, 29, 32
]

// Сдвиги для каждого раунда генерации подключей
// Асимптотика: O(16) = O(1)
const SHIFTS: number[] = [1, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 1]

// ==========================================
// Слабые и полуслабые ключи DES
// ==========================================

// Слабые ключи - дают одинаковые подключи во всех раундах
// Всего 4 слабых ключа
export const WEAK_KEYS: string[] = [
  '0101010101010101',  // Все биты 0
  '1F1F1F1F0E0E0E0E',  // Все биты 1 в C, 0 в D
  'E0E0E0E0F1F1F1F1',  // Все биты 0 в C, 1 в D
  'FEFEFEFEFEFEFEFE'   // Все биты 1
]

// Полуслабые ключи - пары ключей, где E_K1(E_K2(x)) = x
// Всего 6 уникальных пар (12 ключей)
// Каждые 2 соседних ключа образуют пару: [0,1], [2,3], [4,5], [6,7], [8,9], [10,11]
export const SEMI_WEAK_KEY_PAIRS: [string, string][] = [
  ['01FE01FE01FE01FE', 'FE01FE01FE01FE01'],
  ['1FE01FE00EF10EF1', 'E01FE01FF10EF10E'],
  ['01E001E001F101F1', 'E001E001F101F101'],
  ['1FFE1FFE0EFE0EFE', 'FE1FFE1FFE0EFE0E'],
  ['011F011F010E010E', '1F011F010E010E01'],
  ['E0FEE0FEF1FEF1FE', 'FEE0FEE0FEF1FEF1']
]

// Плоский список всех полуслабых ключей для быстрой проверки
export const SEMI_WEAK_KEYS: string[] = SEMI_WEAK_KEY_PAIRS.flat()

/**
 * Получить парный полуслабый ключ
 * Асимптотика: O(n), где n - количество пар (6)
 * @param key - полуслабый ключ
 * @returns парный ключ или null если ключ не полуслабый
 */
export function getPairedSemiWeakKey(key: string): string | null {
  const normalizedKey = key.toUpperCase().replace(/\s/g, '')
  
  for (const [key1, key2] of SEMI_WEAK_KEY_PAIRS) {
    if (normalizedKey === key1) return key2
    if (normalizedKey === key2) return key1
  }
  
  return null
}

// ==========================================
// Вспомогательные функции для битовых операций
// ==========================================

/**
 * Преобразование hex-строки в массив битов
 * Асимптотика: O(n), где n - длина строки
 */
function hexToBits(hex: string): number[] {
  const bits: number[] = []
  for (let i = 0; i < hex.length; i++) {
    const nibble = parseInt(hex[i], 16)
    // Извлекаем каждый бит из 4-битного nibble
    for (let j = 3; j >= 0; j--) {
      bits.push((nibble >> j) & 1)
    }
  }
  return bits
}

/**
 * Преобразование массива битов в hex-строку
 * Асимптотика: O(n), где n - количество бит
 */
function bitsToHex(bits: number[]): string {
  let hex = ''
  for (let i = 0; i < bits.length; i += 4) {
    let nibble = 0
    for (let j = 0; j < 4 && i + j < bits.length; j++) {
      nibble = (nibble << 1) | bits[i + j]
    }
    hex += nibble.toString(16).toUpperCase()
  }
  return hex
}

/**
 * Применение перестановки к массиву битов
 * Асимптотика: O(m), где m - размер таблицы перестановки
 */
function permute(bits: number[], table: number[]): number[] {
  const result: number[] = []
  for (let i = 0; i < table.length; i++) {
    // table[i] - 1 потому что индексация в таблицах с 1
    result.push(bits[table[i] - 1])
  }
  return result
}

/**
 * Циклический сдвиг влево для массива битов
 * Асимптотика: O(n), где n - размер массива
 */
function leftRotate(bits: number[], count: number): number[] {
  const len = bits.length
  const normalizedCount = count % len
  return [...bits.slice(normalizedCount), ...bits.slice(0, normalizedCount)]
}

/**
 * XOR двух массивов битов
 * Асимптотика: O(n), где n - размер массивов
 */
function xorBits(a: number[], b: number[]): number[] {
  const result: number[] = []
  const len = Math.max(a.length, b.length)
  for (let i = 0; i < len; i++) {
    result.push((a[i] || 0) ^ (b[i] || 0))
  }
  return result
}

/**
 * Подсчёт различающихся битов между двумя hex-строками
 * Асимптотика: O(n), где n - длина строки
 */
export function countDifferentBits(hex1: string, hex2: string): number {
  const bits1 = hexToBits(hex1)
  const bits2 = hexToBits(hex2)
  let count = 0
  const maxLen = Math.max(bits1.length, bits2.length)
  for (let i = 0; i < maxLen; i++) {
    if ((bits1[i] || 0) !== (bits2[i] || 0)) {
      count++
    }
  }
  return count
}

// ==========================================
// Генерация подключей
// ==========================================

/**
 * Генерация 16 подключей из основного ключа
 * Асимптотика: O(16 * 56) = O(1) - фиксированное количество операций
 */
function generateSubkeys(key: string): string[] {
  // Преобразуем ключ в биты
  const keyBits = hexToBits(key)
  
  // Применяем PC-1 (64 -> 56 бит)
  const permutedKey = permute(keyBits, PC1)
  
  // Разделяем на две половины C и D по 28 бит
  let C = permutedKey.slice(0, 28)
  let D = permutedKey.slice(28, 56)
  
  const subkeys: string[] = []
  
  // Генерируем 16 подключей
  for (let round = 0; round < 16; round++) {
    // Циклический сдвиг влево
    C = leftRotate(C, SHIFTS[round])
    D = leftRotate(D, SHIFTS[round])
    
    // Объединяем C и D
    const CD = [...C, ...D]
    
    // Применяем PC-2 (56 -> 48 бит)
    const subkey = permute(CD, PC2)
    subkeys.push(bitsToHex(subkey))
  }
  
  return subkeys
}

// ==========================================
// Функция Фейстеля (F-функция)
// ==========================================

/**
 * F-функция DES (ядро раунда)
 * Принимает 32 бита данных и 48 бит подключа
 * Асимптотика: O(48 + 32) = O(1)
 */
function feistelFunction(right: number[], subkey: number[]): number[] {
  // 1. Расширяем 32 бита до 48 через E-перестановку
  const expanded = permute(right, E)
  
  // 2. XOR с подключом
  const xored = xorBits(expanded, subkey)
  
  // 3. Пропускаем через S-блоки (48 бит -> 32 бита)
  const sBoxOutput: number[] = []
  
  for (let i = 0; i < 8; i++) {
    // Берём 6 бит для каждого S-блока
    const start = i * 6
    const b = xored.slice(start, start + 6)
    
    // Номер строки: биты 0 и 5 (первый и последний)
    const row = (b[0] << 1) | b[5]
    
    // Номер столбца: биты 1-4 (средние)
    const col = (b[1] << 3) | (b[2] << 2) | (b[3] << 1) | b[4]
    
    // Получаем значение из S-блока
    const val = S_BOXES[i][row][col]
    
    // Преобразуем в 4 бита
    for (let j = 3; j >= 0; j--) {
      sBoxOutput.push((val >> j) & 1)
    }
  }
  
  // 4. Применяем P-перестановку
  return permute(sBoxOutput, P)
}

// ==========================================
// Основные функции шифрования/дешифрования
// ==========================================

/**
 * Шифрование одного 64-битного блока
 * Асимптотика: O(16 * (48 + 32 + 64)) = O(1) - 16 раундов с фикс. операциями
 */
function encryptBlock(block: string, subkeys: string[], collectRounds: boolean = false): { output: string; rounds?: RoundInfo[] } {
  // Преобразуем блок в биты
  const bits = hexToBits(block)
  
  // Начальная перестановка IP
  const permuted = permute(bits, IP)
  
  // Разделяем на L и R по 32 бита
  let L = permuted.slice(0, 32)
  let R = permuted.slice(32, 64)
  
  const rounds: RoundInfo[] = []
  
  // 16 раундов Фейстеля
  for (let i = 0; i < 16; i++) {
    const subkeyBits = hexToBits(subkeys[i])
    
    // Сохраняем текущее состояние для анализа
    if (collectRounds) {
      rounds.push({
        round: i + 1,
        left: bitsToHex(L),
        right: bitsToHex(R),
        subkey: subkeys[i]
      })
    }
    
    // Вычисляем F(R, K)
    const fResult = feistelFunction(R, subkeyBits)
    
    // L' = R, R' = L XOR F(R, K)
    const newR = xorBits(L, fResult)
    L = R
    R = newR
  }
  
  // Финальная перестановка после обмена L и R
  const preOutput = [...R, ...L]  // Обратите внимание: R и L меняются местами!
  const output = permute(preOutput, IP_INV)
  
  return {
    output: bitsToHex(output),
    rounds: collectRounds ? rounds : undefined
  }
}

/**
 * Дешифрование одного блока (подключи в обратном порядке)
 * Асимптотика: O(1) - то же что и encryptBlock
 */
function decryptBlock(block: string, subkeys: string[], collectRounds: boolean = false): { output: string; rounds?: RoundInfo[] } {
  // Используем подключи в обратном порядке
  const reversedSubkeys = [...subkeys].reverse()
  return encryptBlock(block, reversedSubkeys, collectRounds)
}

// ==========================================
// Работа с данными и padding
// ==========================================

/**
 * Преобразование текста в hex-строку (ASCII)
 * Асимптотика: O(n), где n - длина текста
 */
export function textToHex(text: string): string {
  let hex = ''
  for (let i = 0; i < text.length; i++) {
    hex += text.charCodeAt(i).toString(16).padStart(2, '0').toUpperCase()
  }
  return hex
}

/**
 * Преобразование hex-строки в текст (UTF-8)
 * Асимптотика: O(n), где n - длина hex-строки
 */
export function hexToText(hex: string): string {
  // Преобразуем hex в массив байтов
  const bytes: number[] = []
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substr(i, 2), 16))
  }
  
  // Удаляем PKCS7 padding если есть
  if (bytes.length > 0) {
    const lastByte = bytes[bytes.length - 1]
    if (lastByte > 0 && lastByte <= 8) {
      // Проверяем что это действительно padding
      let isPadding = true
      for (let i = bytes.length - lastByte; i < bytes.length; i++) {
        if (bytes[i] !== lastByte) {
          isPadding = false
          break
        }
      }
      if (isPadding) {
        bytes.splice(bytes.length - lastByte, lastByte)
      }
    }
  }
  
  // Декодируем UTF-8
  try {
    const uint8Array = new Uint8Array(bytes)
    return new TextDecoder('utf-8', { fatal: false }).decode(uint8Array)
  } catch {
    // Fallback: фильтруем только печатаемые ASCII
    let text = ''
    for (const code of bytes) {
      if (code >= 32 && code < 127) {
        text += String.fromCharCode(code)
      }
    }
    return text
  }
}

/**
 * Дополнение данных до кратности 8 байт (PKCS7 padding)
 * Асимптотика: O(1) - добавляем максимум 8 байт
 */
function addPadding(hex: string): string {
  const blockSize = 16 // 8 байт = 16 hex символов
  const remainder = hex.length % blockSize
  const padLength = remainder === 0 ? blockSize : blockSize - remainder
  const padByte = (padLength / 2).toString(16).padStart(2, '0').toUpperCase()
  return hex + padByte.repeat(padLength / 2)
}

/**
 * Удаление PKCS7 padding
 * Асимптотика: O(1)
 */
function removePadding(hex: string): string {
  if (hex.length < 2) return hex
  const lastByte = parseInt(hex.slice(-2), 16)
  if (lastByte > 0 && lastByte <= 8) {
    const padLength = lastByte * 2
    // Проверяем что все байты padding корректны
    const padding = hex.slice(-padLength)
    const expectedPad = lastByte.toString(16).padStart(2, '0').toUpperCase().repeat(lastByte)
    if (padding.toUpperCase() === expectedPad) {
      return hex.slice(0, -padLength)
    }
  }
  return hex
}

/**
 * Разбиение данных на 64-битные блоки
 * Асимптотика: O(n/16), где n - длина hex-строки
 */
function splitIntoBlocks(hex: string): string[] {
  const blocks: string[] = []
  const paddedHex = addPadding(hex)
  for (let i = 0; i < paddedHex.length; i += 16) {
    blocks.push(paddedHex.slice(i, i + 16))
  }
  return blocks
}

// ==========================================
// Главные функции API
// ==========================================

/**
 * Шифрование данных алгоритмом DES (режим ECB)
 * Асимптотика: O(n), где n - количество блоков
 */
export function encryptDES(inputHex: string, keyHex: string, collectRounds: boolean = false): DESResult {
  const startTime = performance.now()
  
  // Валидация ключа (должен быть 16 hex символов = 64 бита)
  if (keyHex.length !== 16) {
    throw new Error('Ключ должен быть 64 бита (16 hex символов)')
  }
  
  // Генерируем подключи
  const subkeys = generateSubkeys(keyHex)
  
  // Разбиваем на блоки
  const blocks = splitIntoBlocks(inputHex)
  const blockInfos: BlockInfo[] = []
  let outputHex = ''
  
  // Шифруем каждый блок
  for (let i = 0; i < blocks.length; i++) {
    const result = encryptBlock(blocks[i], subkeys, collectRounds)
    outputHex += result.output
    blockInfos.push({
      index: i + 1,
      input: blocks[i],
      output: result.output,
      rounds: result.rounds
    })
  }
  
  const endTime = performance.now()
  
  return {
    input: inputHex,
    output: outputHex,
    key: keyHex,
    blocks: blockInfos,
    executionTime: endTime - startTime,
    mode: 'encrypt'
  }
}

/**
 * Дешифрование данных алгоритмом DES (режим ECB)
 * Асимптотика: O(n), где n - количество блоков
 */
export function decryptDES(inputHex: string, keyHex: string, collectRounds: boolean = false): DESResult {
  const startTime = performance.now()
  
  // Валидация ключа
  if (keyHex.length !== 16) {
    throw new Error('Ключ должен быть 64 бита (16 hex символов)')
  }
  
  // Генерируем подключи
  const subkeys = generateSubkeys(keyHex)
  
  // Входные данные должны быть кратны 16 hex символам (64 бита)
  if (inputHex.length % 16 !== 0) {
    throw new Error('Длина зашифрованных данных должна быть кратна 64 битам')
  }
  
  const blockInfos: BlockInfo[] = []
  let outputHex = ''
  
  // Дешифруем каждый блок
  for (let i = 0; i < inputHex.length; i += 16) {
    const block = inputHex.slice(i, i + 16)
    const result = decryptBlock(block, subkeys, collectRounds)
    outputHex += result.output
    blockInfos.push({
      index: Math.floor(i / 16) + 1,
      input: block,
      output: result.output,
      rounds: result.rounds
    })
  }
  
  // Удаляем padding
  outputHex = removePadding(outputHex)
  
  const endTime = performance.now()
  
  return {
    input: inputHex,
    output: outputHex,
    key: keyHex,
    blocks: blockInfos,
    executionTime: endTime - startTime,
    mode: 'decrypt'
  }
}

// ==========================================
// Анализ лавинного эффекта
// ==========================================

/**
 * Изменение одного бита в hex-строке
 * Асимптотика: O(n)
 */
function flipBit(hex: string, bitPosition: number): string {
  const bits = hexToBits(hex)
  if (bitPosition < bits.length) {
    bits[bitPosition] = bits[bitPosition] === 0 ? 1 : 0
  }
  return bitsToHex(bits)
}

/**
 * Анализ лавинного эффекта при изменении одного бита входа
 * Асимптотика: O(1) - два шифрования по одному блоку
 */
export function analyzeAvalanche(inputHex: string, keyHex: string, bitToFlip: number = 0): AvalancheResult {
  // Дополняем до 64 бит если нужно
  let paddedInput = inputHex.padEnd(16, '0').slice(0, 16)
  
  // Изменяем один бит
  const modifiedInput = flipBit(paddedInput, bitToFlip)
  
  // Генерируем подключи
  const subkeys = generateSubkeys(keyHex)
  
  // Шифруем оба варианта с отслеживанием раундов
  const original = encryptBlock(paddedInput, subkeys, true)
  const modified = encryptBlock(modifiedInput, subkeys, true)
  
  // Считаем различия по раундам
  const roundByRound: RoundAvalanche[] = []
  if (original.rounds && modified.rounds) {
    for (let i = 0; i < 16; i++) {
      const origState = original.rounds[i].left + original.rounds[i].right
      const modState = modified.rounds[i].left + modified.rounds[i].right
      const changed = countDifferentBits(origState, modState)
      roundByRound.push({
        round: i + 1,
        changedBits: changed,
        percentage: (changed / 64) * 100
      })
    }
  }
  
  // Финальные различия
  const changedBits = countDifferentBits(original.output, modified.output)
  const totalBits = 64
  
  return {
    originalInput: paddedInput,
    modifiedInput: modifiedInput,
    originalOutput: original.output,
    modifiedOutput: modified.output,
    changedBits,
    totalBits,
    percentage: (changedBits / totalBits) * 100,
    roundByRound
  }
}

// ==========================================
// Анализ слабых ключей
// ==========================================

/**
 * Проверка является ли ключ слабым или полуслабым
 * Асимптотика: O(1) - проверка в фиксированных списках
 */
export function analyzeKeyStrength(keyHex: string): WeakKeyAnalysis {
  const normalizedKey = keyHex.toUpperCase()
  
  // Проверяем слабые ключи
  if (WEAK_KEYS.includes(normalizedKey)) {
    return {
      keyType: 'weak',
      key: normalizedKey,
      description: 'Слабый ключ: все подключи одинаковы. E(E(x)) = x для любого x.',
      encryptedSame: true
    }
  }
  
  // Проверяем полуслабые ключи
  if (SEMI_WEAK_KEYS.includes(normalizedKey)) {
    const pairedKey = getPairedSemiWeakKey(normalizedKey)
    return {
      keyType: 'semi-weak',
      key: normalizedKey,
      pairedKey: pairedKey || undefined,
      description: `Полуслабый ключ: существует парный ключ K' такой что E_K(E_K'(x)) = x. Парный ключ: ${pairedKey}`,
      encryptedSame: false
    }
  }
  
  return {
    keyType: 'normal',
    key: normalizedKey,
    description: 'Обычный ключ: не имеет известных криптографических слабостей.',
    encryptedSame: false
  }
}

/**
 * Демонстрация свойства слабого ключа (двойное шифрование = исходный текст)
 * Асимптотика: O(1)
 */
export function demonstrateWeakKey(plaintext: string, weakKey: string): {
  original: string
  firstEncrypt: string
  secondEncrypt: string
  isIdentical: boolean
} {
  const paddedPlain = plaintext.padEnd(16, '0').slice(0, 16)
  const subkeys = generateSubkeys(weakKey)
  
  const first = encryptBlock(paddedPlain, subkeys)
  const second = encryptBlock(first.output, subkeys)
  
  return {
    original: paddedPlain,
    firstEncrypt: first.output,
    secondEncrypt: second.output,
    isIdentical: paddedPlain === second.output
  }
}

/**
 * Демонстрация свойства полуслабого ключа (E_K2(E_K1(x)) = x)
 * Асимптотика: O(1)
 */
export function demonstrateSemiWeakKey(plaintext: string, key1: string, key2: string): {
  original: string
  firstEncrypt: string
  secondEncrypt: string
  isIdentical: boolean
  key1: string
  key2: string
} {
  const paddedPlain = plaintext.padEnd(16, '0').slice(0, 16)
  const subkeys1 = generateSubkeys(key1)
  const subkeys2 = generateSubkeys(key2)
  
  // Шифруем первым ключом
  const first = encryptBlock(paddedPlain, subkeys1)
  // Шифруем вторым ключом (парным)
  const second = encryptBlock(first.output, subkeys2)
  
  return {
    original: paddedPlain,
    firstEncrypt: first.output,
    secondEncrypt: second.output,
    isIdentical: paddedPlain === second.output,
    key1,
    key2
  }
}

// ==========================================
// Анализ сжатия
// ==========================================

/**
 * Простое RLE-подобное сжатие для оценки энтропии
 * Асимптотика: O(n)
 */
function simpleCompress(data: string): number {
  if (data.length === 0) return 0
  
  let compressed = 0
  let count = 1
  let prev = data[0]
  
  for (let i = 1; i < data.length; i++) {
    if (data[i] === prev && count < 255) {
      count++
    } else {
      // Записываем: символ + счётчик (если > 1)
      compressed += count > 2 ? 3 : count
      count = 1
      prev = data[i]
    }
  }
  compressed += count > 2 ? 3 : count
  
  return compressed
}

/**
 * Анализ степени сжатия оригинального и зашифрованного текста
 * Асимптотика: O(n)
 */
export function analyzeCompression(originalText: string, keyHex: string): CompressionResult {
  // Конвертируем текст в hex
  const originalHex = textToHex(originalText)
  
  // Шифруем
  const encrypted = encryptDES(originalHex, keyHex)
  
  // Размеры в байтах
  const originalSize = originalHex.length / 2
  const encryptedSize = encrypted.output.length / 2
  
  // "Сжимаем" для оценки энтропии
  const originalCompressed = simpleCompress(originalHex)
  const encryptedCompressed = simpleCompress(encrypted.output)
  
  return {
    originalText,
    encryptedText: encrypted.output,
    originalSize,
    encryptedSize,
    originalCompressed,
    encryptedCompressed,
    originalRatio: originalCompressed / originalSize,
    encryptedRatio: encryptedCompressed / encryptedSize
  }
}

// ==========================================
// Измерение скорости
// ==========================================

/**
 * Измерение скорости шифрования/дешифрования
 * Асимптотика: O(iterations * n), где n - кол-во блоков
 */
export function measureSpeed(dataHex: string, keyHex: string, iterations: number = 100): {
  encryptTime: number
  decryptTime: number
  throughput: number // байт/сек
} {
  // Шифрование
  const encryptStart = performance.now()
  let encrypted = ''
  for (let i = 0; i < iterations; i++) {
    const result = encryptDES(dataHex, keyHex)
    encrypted = result.output
  }
  const encryptTime = (performance.now() - encryptStart) / iterations
  
  // Дешифрование
  const decryptStart = performance.now()
  for (let i = 0; i < iterations; i++) {
    decryptDES(encrypted, keyHex)
  }
  const decryptTime = (performance.now() - decryptStart) / iterations
  
  // Пропускная способность (байт/сек)
  const dataSize = dataHex.length / 2 // в байтах
  const throughput = dataSize / ((encryptTime + decryptTime) / 2 / 1000)
  
  return { encryptTime, decryptTime, throughput }
}

// ==========================================
// Валидация входных данных
// ==========================================

/**
 * Проверка корректности hex-строки
 * Асимптотика: O(n)
 */
export function isValidHex(str: string): boolean {
  return /^[0-9A-Fa-f]*$/.test(str)
}

/**
 * Валидация ключа DES
 * Асимптотика: O(1)
 */
export function validateKey(key: string): { valid: boolean; error?: string } {
  if (!key || key.length === 0) {
    return { valid: false, error: 'Ключ не может быть пустым' }
  }
  
  if (!isValidHex(key)) {
    return { valid: false, error: 'Ключ должен содержать только hex-символы (0-9, A-F)' }
  }
  
  if (key.length !== 16) {
    return { valid: false, error: `Ключ должен быть 64 бита (16 hex символов). Текущая длина: ${key.length}` }
  }
  
  return { valid: true }
}

/**
 * Генерация случайного ключа DES
 * Асимптотика: O(1)
 */
export function generateRandomKey(): string {
  let key = ''
  for (let i = 0; i < 16; i++) {
    key += Math.floor(Math.random() * 16).toString(16).toUpperCase()
  }
  return key
}
