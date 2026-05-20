// Лабораторная работа 4: Алгоритм Эль-Гамаля
// Студент: Адодин Егор
// Группа: ИТБД-124

// ==========================================
// Теория и описание алгоритма
// ==========================================
// Алгоритм Эль-Гамаля - асимметричная криптосистема
// Основан на сложности вычисления дискретного логарифма
// Используется для шифрования и цифровой подписи

// Формула: y = a^x mod n
// a - основание (база)
// x - показатель степени (секретный ключ)
// n - модуль (большое простое число)
// y - результат (публичный ключ)

// ==========================================
// Интерфейсы
// ==========================================

// Результат измерения времени вычисления
export interface TimingResult {
  a: number            // Основание
  x: bigint            // Показатель
  n: bigint            // Модуль
  result: bigint       // Результат y = a^x mod n
  timeMs: number       // Время вычисления в мс
  bitLength: number    // Битовая длина n
}

// Результат серии измерений
export interface TimingSeriesResult {
  measurements: TimingResult[]
  averageTime: number
  minTime: number
  maxTime: number
}

// Ключевая пара Эль-Гамаля
export interface ElGamalKeyPair {
  p: bigint           // Простое число (модуль)
  g: bigint           // Генератор (основание)
  y: bigint           // Публичный ключ: y = g^x mod p
  x: bigint           // Секретный ключ
}

// Зашифрованное сообщение
export interface ElGamalCiphertext {
  a: bigint           // a = g^k mod p
  b: bigint           // b = m * y^k mod p
}

// Результат шифрования
export interface EncryptionResult {
  plaintext: string         // Исходный текст
  plaintextCodes: number[]  // ASCII коды
  ciphertext: ElGamalCiphertext[]  // Зашифрованные блоки
  keys: ElGamalKeyPair     // Использованные ключи
  encryptionTime: number   // Время шифрования
}

// Результат дешифрования
export interface DecryptionResult {
  ciphertext: ElGamalCiphertext[]
  decryptedCodes: number[]
  decryptedText: string
  decryptionTime: number
}

// ==========================================
// Математические функции для работы с BigInt
// ==========================================

/**
 * Быстрое возведение в степень по модулю (бинарное возведение)
 * Использует алгоритм "возведение в квадрат и умножение"
 * 
 * Асимптотика: O(log(exp) * log²(mod)) 
 * - log(exp) итераций (количество бит в показателе)
 * - каждая операция умножения по модулю O(log²(mod))
 * 
 * Это ключевая функция для всего алгоритма!
 */
export function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
  // Обработка краевых случаев
  if (mod === 1n) return 0n
  if (exp === 0n) return 1n
  if (exp < 0n) {
    throw new Error('Отрицательный показатель не поддерживается')
  }
  
  let result = 1n
  base = base % mod
  
  // Основной цикл бинарного возведения в степень
  while (exp > 0n) {
    // Если текущий бит exp равен 1, умножаем результат на base
    if (exp % 2n === 1n) {
      result = (result * base) % mod
    }
    // Делим показатель на 2 (сдвиг вправо)
    exp = exp / 2n
    // Возводим base в квадрат
    base = (base * base) % mod
  }
  
  return result
}

/**
 * Вычисление НОД (наибольший общий делитель) по алгоритму Евклида
 * Асимптотика: O(log(min(a, b)))
 */
export function gcd(a: bigint, b: bigint): bigint {
  a = a < 0n ? -a : a
  b = b < 0n ? -b : b
  
  while (b !== 0n) {
    const temp = b
    b = a % b
    a = temp
  }
  
  return a
}

/**
 * Расширенный алгоритм Евклида
 * Находит x, y такие что a*x + b*y = gcd(a, b)
 * Асимптотика: O(log(min(a, b)))
 */
function extendedGcd(a: bigint, b: bigint): { gcd: bigint; x: bigint; y: bigint } {
  if (b === 0n) {
    return { gcd: a, x: 1n, y: 0n }
  }
  
  const { gcd: g, x: x1, y: y1 } = extendedGcd(b, a % b)
  return {
    gcd: g,
    x: y1,
    y: x1 - (a / b) * y1
  }
}

/**
 * Вычисление мультипликативного обратного по модулю
 * Находит такое x, что a * x ≡ 1 (mod m)
 * Асимптотика: O(log(m))
 */
export function modInverse(a: bigint, m: bigint): bigint {
  const { gcd: g, x } = extendedGcd(a, m)
  
  if (g !== 1n) {
    throw new Error(`Обратный элемент не существует: gcd(${a}, ${m}) = ${g}`)
  }
  
  // Приводим x к положительному значению
  return ((x % m) + m) % m
}

/**
 * Простой тест Миллера-Рабина для проверки простоты
 * Вероятностный алгоритм с настраиваемой точностью
 * Асимптотика: O(k * log³(n)), где k - количество раундов
 */
export function isProbablyPrime(n: bigint, k: number = 20): boolean {
  // Обработка малых чисел
  if (n < 2n) return false
  if (n === 2n || n === 3n) return true
  if (n % 2n === 0n) return false
  
  // Представляем n-1 как 2^r * d
  let r = 0n
  let d = n - 1n
  while (d % 2n === 0n) {
    r++
    d = d / 2n
  }
  
  // Проводим k раундов теста
  for (let i = 0; i < k; i++) {
    // Выбираем случайное a в диапазоне [2, n-2]
    const a = randomBigInt(2n, n - 2n)
    let x = modPow(a, d, n)
    
    if (x === 1n || x === n - 1n) continue
    
    let isPrime = false
    for (let j = 0n; j < r - 1n; j++) {
      x = modPow(x, 2n, n)
      if (x === n - 1n) {
        isPrime = true
        break
      }
    }
    
    if (!isPrime) return false
  }
  
  return true
}

/**
 * Генерация случайного BigInt в заданном диапазоне [min, max]
 * Асимптотика: O(log(max - min))
 */
export function randomBigInt(min: bigint, max: bigint): bigint {
  const range = max - min + 1n
  const bitLength = range.toString(2).length
  const byteLength = Math.ceil(bitLength / 8)
  
  // Генерируем случайные байты
  const randomBytes = new Uint8Array(byteLength)
  crypto.getRandomValues(randomBytes)
  
  // Преобразуем в BigInt
  let result = 0n
  for (const byte of randomBytes) {
    result = (result << 8n) | BigInt(byte)
  }
  
  // Приводим к диапазону
  return min + (result % range)
}

/**
 * Генерация большого простого числа заданной битовой длины
 * Асимптотика: O(bits³ * log(bits)) в среднем
 */
export function generatePrime(bits: number): bigint {
  // Для демонстрации используем предварительно вычисленные простые числа
  // В реальных приложениях нужно генерировать случайные
  
  if (bits <= 64) {
    // Маленькие простые для быстрой демонстрации
    const smallPrimes = [
      997n, 1009n, 1013n, 1019n, 1021n, 1031n, 1033n, 1039n,
      7919n, 7927n, 7933n, 7937n, 7949n, 7951n, 7963n, 7993n
    ]
    return smallPrimes[Math.floor(Math.random() * smallPrimes.length)]
  }
  
  // Для больших чисел генерируем случайное и проверяем
  let attempts = 0
  const maxAttempts = 10000
  
  while (attempts < maxAttempts) {
    // Генерируем случайное число нужной битовой длины
    const min = 1n << BigInt(bits - 1)
    const max = (1n << BigInt(bits)) - 1n
    let candidate = randomBigInt(min, max)
    
    // Делаем нечётным
    if (candidate % 2n === 0n) candidate++
    
    // Проверяем на простоту
    if (isProbablyPrime(candidate, 10)) {
      return candidate
    }
    
    attempts++
  }
  
  // Fallback на известные простые числа
  throw new Error(`Не удалось сгенерировать простое число за ${maxAttempts} попыток`)
}

/**
 * Поиск примитивного корня (генератора) для простого числа p
 * Асимптотика: O(sqrt(p) * log(p))
 */
export function findGenerator(p: bigint): bigint {
  // Для простого p порядок мультипликативной группы = p - 1
  const phi = p - 1n
  
  // Находим простые делители phi
  const factors = factorize(phi)
  
  // Проверяем кандидатов на генератор
  for (let g = 2n; g < p; g++) {
    let isGenerator = true
    
    for (const factor of factors) {
      // g является генератором, если g^((p-1)/q) != 1 для всех простых делителей q
      if (modPow(g, phi / factor, p) === 1n) {
        isGenerator = false
        break
      }
    }
    
    if (isGenerator) return g
  }
  
  throw new Error('Генератор не найден')
}

/**
 * Простая факторизация числа (для небольших чисел)
 * Асимптотика: O(sqrt(n))
 */
function factorize(n: bigint): bigint[] {
  const factors: bigint[] = []
  let d = 2n
  
  while (d * d <= n) {
    if (n % d === 0n) {
      factors.push(d)
      while (n % d === 0n) {
        n = n / d
      }
    }
    d++
  }
  
  if (n > 1n) {
    factors.push(n)
  }
  
  return factors
}

// ==========================================
// Измерение времени вычисления y = a^x mod n
// ==========================================

/**
 * Измерение времени вычисления модульной экспоненты
 * Асимптотика: O(log(x) * log²(n))
 */
export function measureModPowTime(a: number, x: bigint, n: bigint): TimingResult {
  const start = performance.now()
  const result = modPow(BigInt(a), x, n)
  const end = performance.now()
  
  return {
    a,
    x,
    n,
    result,
    timeMs: end - start,
    bitLength: n.toString(2).length
  }
}

/**
 * Генерация случайного простого числа заданной битовой длины для x
 * Использует генератор случайных чисел
 */
function generateRandomX(minBits: number, maxBits: number): bigint {
  const bits = minBits + Math.floor(Math.random() * (maxBits - minBits + 1))
  const min = 1n << BigInt(bits - 1)
  const max = (1n << BigInt(bits)) - 1n
  return randomBigInt(min, max)
}

/**
 * Проведение серии измерений для разных параметров
 * Асимптотика: O(count * log(x) * log²(n))
 */
export function runTimingExperiments(
  aValues: number[],           // Значения основания (5-35)
  xRange: { min: number; max: number },  // Диапазон для x (простые 10^3 - 10^4)
  nBitLengths: number[],       // Битовые длины n (1024, 2048)
  samplesPerConfig: number = 5 // Количество измерений на конфигурацию
): Map<string, TimingSeriesResult> {
  const results = new Map<string, TimingSeriesResult>()
  
  // Генерируем простые числа для x в диапазоне
  const xValues: bigint[] = []
  for (let i = xRange.min; i <= xRange.max; i++) {
    if (isProbablyPrime(BigInt(i), 5)) {
      xValues.push(BigInt(i))
    }
  }
  
  // Берём равномерно распределённые значения x
  const selectedX = xValues.filter((_, i) => i % Math.max(1, Math.floor(xValues.length / samplesPerConfig)) === 0).slice(0, samplesPerConfig)
  
  // Для каждой битовой длины n
  for (const nBits of nBitLengths) {
    // Генерируем простое число n нужной длины
    const n = generateLargePrimeForDemo(nBits)
    
    // Для каждого значения a
    for (const a of aValues) {
      const key = `a=${a}, n=${nBits}bits`
      const measurements: TimingResult[] = []
      
      // Для каждого значения x
      for (const x of selectedX) {
        const result = measureModPowTime(a, x, n)
        measurements.push(result)
      }
      
      // Вычисляем статистику
      const times = measurements.map(m => m.timeMs)
      results.set(key, {
        measurements,
        averageTime: times.reduce((a, b) => a + b, 0) / times.length,
        minTime: Math.min(...times),
        maxTime: Math.max(...times)
      })
    }
  }
  
  return results
}

/**
 * Генерация большого простого числа для демонстрации
 * Используем заранее известные простые числа для скорости
 */
function generateLargePrimeForDemo(bits: number): bigint {
  // Для демонстрационных целей используем псевдослучайную генерацию
  // В реальном приложении нужна криптографически стойкая генерация
  
  if (bits <= 32) {
    // Маленькие простые для быстрых тестов
    return 2147483647n // 2^31 - 1, простое Мерсенна
  }
  
  if (bits <= 64) {
    return 9223372036854775783n // Близко к 2^63
  }
  
  // Для больших битовых длин генерируем число и проверяем
  // Это упрощённая версия - в реальности нужен более надёжный алгоритм
  const base = 1n << BigInt(bits - 1)
  let candidate = base + randomBigInt(0n, base / 2n)
  
  // Делаем нечётным
  if (candidate % 2n === 0n) candidate++
  
  // Ищем ближайшее простое (вероятностно)
  let attempts = 0
  while (attempts < 1000) {
    if (isProbablyPrime(candidate, 5)) {
      return candidate
    }
    candidate += 2n
    attempts++
  }
  
  // Fallback - возвращаем достаточно большое известное простое
  // Для 1024-бит это примерное значение
  if (bits >= 1024) {
    return (1n << 1023n) + 643n // Примерное большое простое
  }
  
  return candidate
}

// ==========================================
// Генерация ключей Эль-Гамаля
// ==========================================

/**
 * Генерация ключевой пары Эль-Гамаля
 * Асимптотика: O(bits³) для генерации простого + O(sqrt(p) * log(p)) для генератора
 */
export function generateKeyPair(bitLength: number = 64): ElGamalKeyPair {
  // Генерируем простое число p
  const p = generateLargePrimeForDemo(bitLength)
  
  // Находим генератор g (примитивный корень)
  // Для упрощения берём небольшой генератор
  let g = 2n
  while (modPow(g, (p - 1n) / 2n, p) === 1n) {
    g++
  }
  
  // Генерируем секретный ключ x (случайное число от 2 до p-2)
  const x = randomBigInt(2n, p - 2n)
  
  // Вычисляем публичный ключ y = g^x mod p
  const y = modPow(g, x, p)
  
  return { p, g, y, x }
}

// ==========================================
// Шифрование и дешифрование Эль-Гамаля
// ==========================================

/**
 * Шифрование одного числа (блока)
 * Асимптотика: O(log(p) * log²(p)) = O(log³(p))
 */
function encryptBlock(m: bigint, keys: ElGamalKeyPair): ElGamalCiphertext {
  const { p, g, y } = keys
  
  // Выбираем случайное k, взаимно простое с p-1
  let k: bigint
  do {
    k = randomBigInt(2n, p - 2n)
  } while (gcd(k, p - 1n) !== 1n)
  
  // a = g^k mod p
  const a = modPow(g, k, p)
  
  // b = m * y^k mod p
  const b = (m * modPow(y, k, p)) % p
  
  return { a, b }
}

/**
 * Дешифрование одного блока
 * Асимптотика: O(log³(p))
 */
function decryptBlock(cipher: ElGamalCiphertext, keys: ElGamalKeyPair): bigint {
  const { p, x } = keys
  const { a, b } = cipher
  
  // m = b * (a^x)^(-1) mod p = b * a^(-x) mod p = b * a^(p-1-x) mod p
  // Используем малую теорему Ферма: a^(p-1) ≡ 1 (mod p)
  const aInverse = modPow(a, p - 1n - x, p)
  return (b * aInverse) % p
}

/**
 * Шифрование текста
 * Асимптотика: O(n * log³(p)), где n - длина текста
 */
export function encryptText(plaintext: string, keys: ElGamalKeyPair): EncryptionResult {
  const start = performance.now()
  
  // Преобразуем текст в ASCII коды
  const plaintextCodes: number[] = []
  for (let i = 0; i < plaintext.length; i++) {
    plaintextCodes.push(plaintext.charCodeAt(i))
  }
  
  // Шифруем каждый символ отдельно
  const ciphertext: ElGamalCiphertext[] = []
  for (const code of plaintextCodes) {
    // Проверяем что код меньше p
    if (BigInt(code) >= keys.p) {
      throw new Error(`Код символа ${code} больше модуля p`)
    }
    ciphertext.push(encryptBlock(BigInt(code), keys))
  }
  
  const end = performance.now()
  
  return {
    plaintext,
    plaintextCodes,
    ciphertext,
    keys,
    encryptionTime: end - start
  }
}

/**
 * Дешифрование текста
 * Асимптотика: O(n * log³(p)), где n - количество блоков
 */
export function decryptText(ciphertext: ElGamalCiphertext[], keys: ElGamalKeyPair): DecryptionResult {
  const start = performance.now()
  
  // Дешифруем каждый блок
  const decryptedCodes: number[] = []
  for (const cipher of ciphertext) {
    const code = decryptBlock(cipher, keys)
    decryptedCodes.push(Number(code))
  }
  
  // Преобразуем коды обратно в текст
  let decryptedText = ''
  for (const code of decryptedCodes) {
    // Включаем все печатаемые ASCII символы
    decryptedText += String.fromCharCode(code)
  }
  
  const end = performance.now()
  
  return {
    ciphertext,
    decryptedCodes,
    decryptedText,
    decryptionTime: end - start
  }
}

// ==========================================
// Дополнительные утилиты
// ==========================================

/**
 * Форматирование BigInt для отображения (сокращённо для больших чисел)
 */
export function formatBigInt(n: bigint, maxLength: number = 20): string {
  const str = n.toString()
  if (str.length <= maxLength) return str
  return `${str.slice(0, 8)}...${str.slice(-8)} (${str.length} цифр)`
}

/**
 * Получение списка простых чисел в диапазоне
 * Асимптотика: O(n * sqrt(n)), где n = max - min
 */
export function getPrimesInRange(min: number, max: number): number[] {
  const primes: number[] = []
  
  for (let n = min; n <= max; n++) {
    if (isProbablyPrime(BigInt(n), 5)) {
      primes.push(n)
    }
  }
  
  return primes
}

/**
 * Валидация входного текста для шифрования
 * Проверяем что код символа < p (поддержка Unicode включая кириллицу)
 */
export function validatePlaintext(text: string, p: bigint): { valid: boolean; error?: string } {
  if (!text || text.length === 0) {
    return { valid: false, error: 'Текст не может быть пустым' }
  }
  
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    // Проверяем только что код символа меньше модуля p
    // Это позволяет шифровать любые Unicode символы включая кириллицу
    if (BigInt(code) >= p) {
      return { valid: false, error: `Код символа "${text[i]}" (${code}) больше модуля p=${p}. Увеличьте размер ключа.` }
    }
  }
  
  return { valid: true }
}
