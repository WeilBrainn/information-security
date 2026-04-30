// Лабораторная работа 2: Генерация псевдослучайных последовательностей
// Студент: Адодин Егор
// Группа: ИТБД-124
// Алгоритм: BBS (Blum Blum Shub)

// ==========================================
// Интерфейсы для работы с генератором
// ==========================================

// Параметры для генератора BBS
export interface BBSParams {
  p: number      // Первое простое число (должно быть конгруэнтно 3 mod 4)
  q: number      // Второе простое число (должно быть конгруэнтно 3 mod 4)
  seed: number   // Начальное значение (seed), взаимно простое с n = p * q
}

// Результат генерации последовательности
export interface GenerationResult {
  sequence: string          // Сгенерированная битовая последовательность
  length: number            // Длина последовательности
  params: BBSParams         // Использованные параметры
  n: number                 // Модуль n = p * q
  steps: GenerationStep[]   // Промежуточные шаги генерации (для отладки)
}

// Один шаг генерации
export interface GenerationStep {
  iteration: number  // Номер итерации
  x: number          // Текущее значение x
  bit: number        // Полученный бит (младший бит x)
}

// ==========================================
// Результаты тестирования
// ==========================================

// Результат теста монобит (частотный тест)
export interface MonobitTestResult {
  passed: boolean       // Пройден ли тест
  onesCount: number     // Количество единиц в последовательности
  zerosCount: number    // Количество нулей
  total: number         // Общее количество бит
  ratio: number         // Отношение единиц к общему количеству
  description: string   // Описание результата
}

// Результат теста серий (runs test)
export interface RunsTestResult {
  passed: boolean           // Пройден ли тест
  runsCount: number         // Количество серий
  expectedRuns: number      // Ожидаемое количество серий
  variance: number          // Дисперсия
  zScore: number            // Z-оценка
  description: string       // Описание результата
}

// Результат теста на длинные серии
export interface LongRunTestResult {
  passed: boolean           // Пройден ли тест
  maxRunLength: number      // Максимальная длина серии
  maxAllowedLength: number  // Максимально допустимая длина
  description: string       // Описание результата
}

// Полный результат всех тестов
export interface TestResults {
  monobit: MonobitTestResult
  runs: RunsTestResult
  longRun: LongRunTestResult
  overallPassed: boolean    // Все тесты пройдены
}

// ==========================================
// Вспомогательные математические функции
// ==========================================

// Проверка, является ли число простым
// Используем простой алгоритм перебора делителей
export function isPrime(n: number): boolean {
  // Отсекаем числа меньше 2
  if (n < 2) return false
  // 2 - простое число
  if (n === 2) return true
  // Четные числа не простые
  if (n % 2 === 0) return false
  
  // Проверяем делимость на нечетные числа до корня из n
  const sqrtN = Math.sqrt(n)
  for (let i = 3; i <= sqrtN; i += 2) {
    if (n % i === 0) return false
  }
  
  return true
}

// Проверка, является ли число Блюма (конгруэнтно 3 mod 4)
// Числа Блюма - это простые числа вида 4k + 3
export function isBlumPrime(n: number): boolean {
  return isPrime(n) && n % 4 === 3
}

// Вычисление НОД (наибольший общий делитель) по алгоритму Евклида
// Используется для проверки взаимной простоты чисел
export function gcd(a: number, b: number): number {
  // Работаем с абсолютными значениями
  a = Math.abs(a)
  b = Math.abs(b)
  
  // Алгоритм Евклида
  while (b !== 0) {
    const temp = b
    b = a % b
    a = temp
  }
  
  return a
}

// Проверка взаимной простоты двух чисел
// Числа взаимно просты, если их НОД равен 1
export function areCoprime(a: number, b: number): boolean {
  return gcd(a, b) === 1
}

// ==========================================
// Генератор BBS (Blum Blum Shub)
// ==========================================

// Генерация псевдослучайной битовой последовательности
// Алгоритм BBS: x_{n+1} = x_n^2 mod n, бит = x_n mod 2
export function generateBBS(params: BBSParams, length: number): GenerationResult {
  const { p, q, seed } = params
  
  // Вычисляем модуль n = p * q
  const n = p * q
  
  // Массив для хранения шагов генерации
  const steps: GenerationStep[] = []
  
  // Инициализируем начальное значение
  // x_0 = seed^2 mod n
  let x = (seed * seed) % n
  
  // Строка для хранения битовой последовательности
  let sequence = ''
  
  // Основной цикл генерации
  for (let i = 0; i < length; i++) {
    // Получаем младший бит текущего значения x
    const bit = x % 2
    
    // Добавляем бит в последовательность
    sequence += bit.toString()
    
    // Сохраняем шаг для отладки (первые 100 шагов)
    if (i < 100) {
      steps.push({
        iteration: i + 1,
        x: x,
        bit: bit
      })
    }
    
    // Вычисляем следующее значение: x = x^2 mod n
    x = (x * x) % n
  }
  
  return {
    sequence,
    length,
    params,
    n,
    steps
  }
}

// ==========================================
// Валидация параметров генератора
// ==========================================

// Результат валидации параметров
export interface ValidationResult {
  valid: boolean
  errors: string[]
}

// Проверка корректности параметров BBS
export function validateBBSParams(params: BBSParams): ValidationResult {
  const errors: string[] = []
  const { p, q, seed } = params
  
  // Проверяем, что p - простое число Блюма
  if (!isBlumPrime(p)) {
    if (!isPrime(p)) {
      errors.push(`p = ${p} не является простым числом`)
    } else {
      errors.push(`p = ${p} не конгруэнтно 3 (mod 4). Требуется p ≡ 3 (mod 4)`)
    }
  }
  
  // Проверяем, что q - простое число Блюма
  if (!isBlumPrime(q)) {
    if (!isPrime(q)) {
      errors.push(`q = ${q} не является простым числом`)
    } else {
      errors.push(`q = ${q} не конгруэнтно 3 (mod 4). Требуется q ≡ 3 (mod 4)`)
    }
  }
  
  // Проверяем, что p и q различны
  if (p === q) {
    errors.push('p и q должны быть различными числами')
  }
  
  // Вычисляем n для проверки seed
  const n = p * q
  
  // Проверяем, что seed положительный
  if (seed <= 1) {
    errors.push('Seed должен быть больше 1')
  }
  
  // Проверяем, что seed меньше n
  if (seed >= n) {
    errors.push(`Seed должен быть меньше n = ${n}`)
  }
  
  // Проверяем, что seed взаимно прост с n
  if (seed > 1 && !areCoprime(seed, n)) {
    errors.push(`Seed = ${seed} должен быть взаимно прост с n = ${n}`)
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

// ==========================================
// Тесты на случайность
// ==========================================

// Тест 1: Монобит (частотный тест)
// Проверяет, что количество единиц и нулей примерно одинаково
export function monobitTest(sequence: string): MonobitTestResult {
  // Подсчитываем количество единиц и нулей
  let onesCount = 0
  let zerosCount = 0
  
  for (const bit of sequence) {
    if (bit === '1') {
      onesCount++
    } else {
      zerosCount++
    }
  }
  
  const total = sequence.length
  const ratio = onesCount / total
  
  // Для случайной последовательности отношение должно быть близко к 0.5
  // Допустимый диапазон: от 0.45 до 0.55 (+-5% от идеального)
  const passed = ratio >= 0.45 && ratio <= 0.55
  
  // Формируем описание результата
  let description = ''
  if (passed) {
    description = `Тест пройден. Соотношение единиц: ${(ratio * 100).toFixed(2)}% (норма: 45-55%)`
  } else {
    description = `Тест НЕ пройден. Соотношение единиц: ${(ratio * 100).toFixed(2)}% выходит за допустимые пределы (45-55%)`
  }
  
  return {
    passed,
    onesCount,
    zerosCount,
    total,
    ratio,
    description
  }
}

// Тест 2: Тест серий (runs test)
// Серия - это последовательность одинаковых битов
// Проверяет, что количество серий соответствует ожидаемому для случайной последовательности
export function runsTest(sequence: string): RunsTestResult {
  if (sequence.length < 2) {
    return {
      passed: false,
      runsCount: 0,
      expectedRuns: 0,
      variance: 0,
      zScore: 0,
      description: 'Последовательность слишком короткая для теста серий'
    }
  }
  
  // Подсчитываем количество серий
  let runsCount = 1  // Минимум одна серия
  
  for (let i = 1; i < sequence.length; i++) {
    // Если текущий бит отличается от предыдущего, начинается новая серия
    if (sequence[i] !== sequence[i - 1]) {
      runsCount++
    }
  }
  
  // Подсчитываем количество единиц и нулей для вычисления ожидаемого значения
  let onesCount = 0
  for (const bit of sequence) {
    if (bit === '1') onesCount++
  }
  const zerosCount = sequence.length - onesCount
  const n = sequence.length
  
  // Вычисляем ожидаемое количество серий по формуле:
  // E(R) = (2 * n0 * n1) / n + 1
  const expectedRuns = (2 * onesCount * zerosCount) / n + 1
  
  // Вычисляем дисперсию по формуле:
  // Var(R) = (2 * n0 * n1 * (2 * n0 * n1 - n)) / (n^2 * (n - 1))
  const numerator = 2 * onesCount * zerosCount * (2 * onesCount * zerosCount - n)
  const denominator = n * n * (n - 1)
  const variance = denominator > 0 ? numerator / denominator : 0
  
  // Вычисляем Z-оценку
  const stdDev = Math.sqrt(variance)
  const zScore = stdDev > 0 ? (runsCount - expectedRuns) / stdDev : 0
  
  // Тест пройден, если |Z| < 1.96 (уровень значимости 5%)
  const passed = Math.abs(zScore) < 1.96
  
  // Формируем описание
  let description = ''
  if (passed) {
    description = `Тест пройден. Количество серий: ${runsCount}, ожидаемое: ${expectedRuns.toFixed(2)}, Z-оценка: ${zScore.toFixed(2)}`
  } else {
    description = `Тест НЕ пройден. Z-оценка ${zScore.toFixed(2)} выходит за допустимые пределы (±1.96)`
  }
  
  return {
    passed,
    runsCount,
    expectedRuns,
    variance,
    zScore,
    description
  }
}

// Тест 3: Тест на длинные серии
// Проверяет, что нет аномально длинных серий одинаковых битов
export function longRunTest(sequence: string): LongRunTestResult {
  // Находим максимальную длину серии
  let maxRunLength = 0
  let currentRunLength = 1
  
  for (let i = 1; i < sequence.length; i++) {
    if (sequence[i] === sequence[i - 1]) {
      // Продолжаем текущую серию
      currentRunLength++
    } else {
      // Начинается новая серия, сохраняем максимум
      maxRunLength = Math.max(maxRunLength, currentRunLength)
      currentRunLength = 1
    }
  }
  
  // Не забываем проверить последнюю серию
  maxRunLength = Math.max(maxRunLength, currentRunLength)
  
  // Для последовательности длиной n, максимально допустимая длина серии:
  // примерно log2(n) + 3 (эмпирическое правило)
  const n = sequence.length
  const maxAllowedLength = Math.floor(Math.log2(n)) + 5
  
  const passed = maxRunLength <= maxAllowedLength
  
  // Формируем описание
  let description = ''
  if (passed) {
    description = `Тест пройден. Максимальная серия: ${maxRunLength} бит (допустимо: ${maxAllowedLength})`
  } else {
    description = `Тест НЕ пройден. Максимальная серия ${maxRunLength} превышает допустимую длину ${maxAllowedLength}`
  }
  
  return {
    passed,
    maxRunLength,
    maxAllowedLength,
    description
  }
}

// ==========================================
// Запуск всех тестов
// ==========================================

// Выполнение всех трёх тестов на последовательности
export function runAllTests(sequence: string): TestResults {
  // Выполняем каждый тест
  const monobit = monobitTest(sequence)
  const runs = runsTest(sequence)
  const longRun = longRunTest(sequence)
  
  // Проверяем, все ли тесты пройдены
  const overallPassed = monobit.passed && runs.passed && longRun.passed
  
  return {
    monobit,
    runs,
    longRun,
    overallPassed
  }
}

// ==========================================
// Предустановленные простые числа Блюма
// ==========================================

// Список простых чисел Блюма для выбора пользователем
// Все они конгруэнтны 3 mod 4
export const BLUM_PRIMES = [
  3, 7, 11, 19, 23, 31, 43, 47, 59, 67, 71, 79, 83, 
  103, 107, 127, 131, 139, 151, 163, 167, 179, 191, 
  199, 211, 223, 227, 239, 251, 263, 271, 283
]

// Функция для получения случайных параметров BBS
// Генерирует валидные параметры для быстрого старта
export function getRandomBBSParams(): BBSParams {
  // Выбираем два разных простых числа Блюма
  const pIndex = Math.floor(Math.random() * BLUM_PRIMES.length)
  let qIndex = Math.floor(Math.random() * BLUM_PRIMES.length)
  
  // Убеждаемся, что p и q разные
  while (qIndex === pIndex) {
    qIndex = Math.floor(Math.random() * BLUM_PRIMES.length)
  }
  
  const p = BLUM_PRIMES[pIndex]
  const q = BLUM_PRIMES[qIndex]
  const n = p * q
  
  // Генерируем seed, взаимно простой с n
  let seed = 2
  while (!areCoprime(seed, n) && seed < n) {
    seed++
  }
  
  return { p, q, seed }
}
