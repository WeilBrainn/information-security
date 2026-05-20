<script setup lang="ts">
import {
  modPow,
  measureModPowTime,
  generateKeyPair,
  encryptText,
  decryptText,
  validatePlaintext,
  formatBigInt,
  getPrimesInRange,
  isProbablyPrime,
  type TimingResult,
  type ElGamalKeyPair,
  type EncryptionResult,
  type DecryptionResult
} from '~/labs/lab4-elgamal'
import Download from '../../components/download.vue'

// Состояние UI
const activeTab = ref<'timing' | 'encrypt'>('timing')

// ==========================================
// Вкладка: Измерение времени y = a^x mod n
// ==========================================
const timingA = ref(7)
const timingXBits = ref(32)
const timingNBits = ref(64)
const timingResults = ref<TimingResult[]>([])
const timingError = ref('')
const timingRunning = ref(false)

// Параметры для графика/таблицы
const selectedAValues = ref([5, 10, 15, 20, 25, 30, 35])
const selectedNBits = ref([64, 128, 256, 512])
const samplesCount = ref(5)

async function runSingleMeasurement() {
  timingError.value = ''
  
  if (timingA.value < 2 || timingA.value > 100) {
    timingError.value = 'Значение a должно быть от 2 до 100'
    return
  }
  
  try {
    timingRunning.value = true
    await new Promise(r => setTimeout(r, 10))
    
    // Генерируем случайное x нужной битовой длины
    const xMin = 1n << BigInt(timingXBits.value - 1)
    const xMax = (1n << BigInt(timingXBits.value)) - 1n
    const x = xMin + BigInt(Math.floor(Math.random() * Number(xMax - xMin)))
    
    // Генерируем n нужной битовой длины (простое число)
    let n = 1n << BigInt(timingNBits.value - 1)
    n = n + BigInt(Math.floor(Math.random() * Number(n / 2n)))
    if (n % 2n === 0n) n++
    
    // Ищем ближайшее простое
    while (!isProbablyPrime(n, 5)) {
      n += 2n
    }
    
    const result = measureModPowTime(timingA.value, x, n)
    timingResults.value.unshift(result)
    
    // Ограничиваем историю
    if (timingResults.value.length > 20) {
      timingResults.value = timingResults.value.slice(0, 20)
    }
  } catch (error) {
    timingError.value = error instanceof Error ? error.message : 'Ошибка измерения'
  } finally {
    timingRunning.value = false
  }
}

async function runBatchMeasurement() {
  timingError.value = ''
  timingResults.value = []
  
  try {
    timingRunning.value = true
    
    // Генерируем простые числа x в диапазоне 10^3 - 10^4
    const primes = getPrimesInRange(1000, 10000)
    const selectedPrimes = primes.filter((_, i) => i % Math.max(1, Math.floor(primes.length / samplesCount.value)) === 0).slice(0, samplesCount.value)
    
    for (const nBits of selectedNBits.value) {
      // Генерируем простое n
      let n = 1n << BigInt(nBits - 1)
      n = n + BigInt(Math.floor(Math.random() * Number(BigInt(nBits) * 100n)))
      if (n % 2n === 0n) n++
      while (!isProbablyPrime(n, 3)) {
        n += 2n
      }
      
      for (const a of selectedAValues.value) {
        for (const x of selectedPrimes) {
          await new Promise(r => setTimeout(r, 5)) // UI update
          
          const result = measureModPowTime(a, BigInt(x), n)
          timingResults.value.push(result)
        }
      }
    }
  } catch (error) {
    timingError.value = error instanceof Error ? error.message : 'Ошибка измерения'
  } finally {
    timingRunning.value = false
  }
}

function clearTimingResults() {
  timingResults.value = []
}

// Группировка результатов для таблицы
const groupedResults = computed(() => {
  const groups = new Map<string, TimingResult[]>()
  
  for (const r of timingResults.value) {
    const key = `${r.a}-${r.bitLength}`
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(r)
  }
  
  return Array.from(groups.entries()).map(([key, results]) => {
    const times = results.map(r => r.timeMs)
    return {
      a: results[0].a,
      nBits: results[0].bitLength,
      avgTime: times.reduce((a, b) => a + b, 0) / times.length,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      count: results.length
    }
  })
})

// ==========================================
// Вкладка: Шифрование Эль-Гамаля
// ==========================================
const keyBitLength = ref(32)
const keys = ref<ElGamalKeyPair | null>(null)
const plaintext = ref('Hello, World!')
const encryptionResult = ref<EncryptionResult | null>(null)
const decryptionResult = ref<DecryptionResult | null>(null)
const encryptError = ref('')
const isEncrypting = ref(false)
const isDecrypting = ref(false)
const showCipherDetails = ref(false)

// Ввод ASCII для ручной расшифровки
const manualAsciiInput = ref('')
const manualCiphertext = ref<ElGamalCiphertext[] | null>(null)
const manualDecryptionResult = ref<DecryptionResult | null>(null)
const manualDecryptError = ref('')

// Копирование в буфер
const copied = ref(false)

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = text
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
}

// Форматирование шифротекста в ASCII формат для копирования
function formatCiphertextAsAscii(): string {
  if (!encryptionResult.value) return ''
  return encryptionResult.value.ciphertext
    .map(c => `${c.a},${c.b}`)
    .join(';')
}

// Вставка ASCII в поле расшифровки
function pasteToDecrypt() {
  manualAsciiInput.value = formatCiphertextAsAscii()
}

// Парсинг ASCII ввода в шифротекст
function parseAsciiToCiphertext(ascii: string): ElGamalCiphertext[] | null {
  try {
    const blocks = ascii.trim().split(';').filter(b => b.length > 0)
    return blocks.map(block => {
      const [aStr, bStr] = block.split(',')
      if (!aStr || !bStr) throw new Error('Неверный формат')
      return {
        a: BigInt(aStr.trim()),
        b: BigInt(bStr.trim())
      }
    })
  } catch {
    return null
  }
}

// Расшифровка из ASCII ввода
async function handleManualDecrypt() {
  manualDecryptError.value = ''
  manualDecryptionResult.value = null
  
  if (!keys.value) {
    manualDecryptError.value = 'Сначала сгенерируйте ключи'
    return
  }
  
  if (!manualAsciiInput.value.trim()) {
    manualDecryptError.value = 'Введите ASCII шифротекст'
    return
  }
  
  const parsed = parseAsciiToCiphertext(manualAsciiInput.value)
  if (!parsed) {
    manualDecryptError.value = 'Неверный формат. Ожидается: a1,b1;a2,b2;...'
    return
  }
  
  try {
    isDecrypting.value = true
    await new Promise(r => setTimeout(r, 10))
    
    manualCiphertext.value = parsed
    manualDecryptionResult.value = decryptText(parsed, keys.value)
  } catch (error) {
    manualDecryptError.value = error instanceof Error ? error.message : 'Ошибка дешифрования'
  } finally {
    isDecrypting.value = false
  }
}

function generateKeys() {
  encryptError.value = ''
  encryptionResult.value = null
  decryptionResult.value = null
  
  try {
    keys.value = generateKeyPair(keyBitLength.value)
  } catch (error) {
    encryptError.value = error instanceof Error ? error.message : 'Ошибка генерации ключей'
  }
}

async function handleEncrypt() {
  encryptError.value = ''
  encryptionResult.value = null
  decryptionResult.value = null
  
  if (!keys.value) {
    encryptError.value = 'Сначала сгенерируйте ключи'
    return
  }
  
  if (!plaintext.value.trim()) {
    encryptError.value = 'Введите текст для шифрования'
    return
  }
  
  const validation = validatePlaintext(plaintext.value, keys.value.p)
  if (!validation.valid) {
    encryptError.value = validation.error || 'Некорректный текст'
    return
  }
  
  try {
    isEncrypting.value = true
    await new Promise(r => setTimeout(r, 10))
    
    encryptionResult.value = encryptText(plaintext.value, keys.value)
  } catch (error) {
    encryptError.value = error instanceof Error ? error.message : 'Ошибка шифрования'
  } finally {
    isEncrypting.value = false
  }
}

async function handleDecrypt() {
  encryptError.value = ''
  decryptionResult.value = null
  
  if (!keys.value) {
    encryptError.value = 'Ключи не найдены'
    return
  }
  
  if (!encryptionResult.value) {
    encryptError.value = 'Сначала зашифруйте текст'
    return
  }
  
  try {
    isDecrypting.value = true
    await new Promise(r => setTimeout(r, 10))
    
    decryptionResult.value = decryptText(encryptionResult.value.ciphertext, keys.value)
  } catch (error) {
    encryptError.value = error instanceof Error ? error.message : 'Ошибка дешифрования'
  } finally {
    isDecrypting.value = false
  }
}
</script>

<template>
  <div class="lab-page">
    <div class="lab-page__ambient"></div>
    
    <!-- Header -->
    <header class="lab-header">
      <div class="container">
        <div class="lab-header__row">
          <NuxtLink to="/" class="lab-header__back">
            <Icon name="ph:arrow-left-bold" />
            <span>Назад</span>
          </NuxtLink>
          
          <div class="lab-header__meta">
            <span class="lab-header__num">04</span>
            <div class="lab-header__info">
              <span class="lab-header__label">Лабораторная работа</span>
              <h1 class="lab-header__title">Алгоритм Эль-Гамаля</h1>
            </div>
          </div>
        </div>
      </div>
    </header>
    
    <!-- Main -->
    <main class="lab-main">
      <div class="container">
        <div class="elgamal">
          <!-- Tabs -->
          <nav class="elgamal__tabs">
            <button 
              class="elgamal__tab" 
              :class="{ 'elgamal__tab--active': activeTab === 'timing' }"
              @click="activeTab = 'timing'"
            >
              <Icon name="ph:timer-fill" />
              Измерение времени
            </button>
            <button 
              class="elgamal__tab" 
              :class="{ 'elgamal__tab--active': activeTab === 'encrypt' }"
              @click="activeTab = 'encrypt'"
            >
              <Icon name="ph:lock-simple-fill" />
              Шифрование
            </button>
          </nav>
          
          <!-- Tab: Timing -->
          <section v-if="activeTab === 'timing'" class="elgamal__section">
            <div class="elgamal__panel">
              <div class="elgamal__panel-content">
                <p class="elgamal__description">
                  <strong>Измерение времени вычисления</strong> функции <code>y = a<sup>x</sup> mod n</code>.
                  Время зависит от битовой длины параметров x и n, а также от значения основания a.
                </p>
                
                <h4>Единичное измерение</h4>
                <div class="elgamal__field-row">
                  <div class="elgamal__field">
                    <label class="elgamal__label">Основание a (5-35)</label>
                    <input v-model.number="timingA" type="number" min="2" max="100" class="elgamal__input" />
                  </div>
                  <div class="elgamal__field">
                    <label class="elgamal__label">Биты x</label>
                    <input v-model.number="timingXBits" type="number" min="8" max="64" class="elgamal__input" />
                  </div>
                  <div class="elgamal__field">
                    <label class="elgamal__label">Биты n</label>
                    <input v-model.number="timingNBits" type="number" min="32" max="512" class="elgamal__input" />
                  </div>
                </div>
                
                <div class="elgamal__actions">
                  <button 
                    class="elgamal__btn elgamal__btn--primary" 
                    :disabled="timingRunning"
                    @click="runSingleMeasurement"
                  >
                    <Icon :name="timingRunning ? 'ph:spinner' : 'ph:play-fill'" :class="{ 'animate-spin': timingRunning }" />
                    Измерить
                  </button>
                  <button 
                    class="elgamal__btn elgamal__btn--secondary" 
                    :disabled="timingRunning"
                    @click="runBatchMeasurement"
                  >
                    <Icon name="ph:chart-line-fill" />
                    Пакетное измерение
                  </button>
                  <button 
                    class="elgamal__btn elgamal__btn--icon"
                    :disabled="timingResults.length === 0"
                    @click="clearTimingResults"
                  >
                    <Icon name="ph:trash-fill" />
                  </button>
                </div>
              </div>
            </div>
            
            <div v-if="timingError" class="elgamal__alert">
              <Icon name="ph:warning-fill" />
              {{ timingError }}
            </div>
            
            <!-- Results -->
            <div v-if="timingResults.length > 0" class="elgamal__timing-results">
              <!-- Summary table -->
              <div v-if="groupedResults.length > 0" class="elgamal__result-card">
                <h3>Сводная таблица (по группам a и n)</h3>
                <div class="elgamal__table-wrap">
                  <table class="elgamal__table">
                    <thead>
                      <tr>
                        <th>a</th>
                        <th>Биты n</th>
                        <th>Среднее (мс)</th>
                        <th>Мин (мс)</th>
                        <th>Макс (мс)</th>
                        <th>Измерений</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="g in groupedResults" :key="`${g.a}-${g.nBits}`">
                        <td>{{ g.a }}</td>
                        <td>{{ g.nBits }}</td>
                        <td class="elgamal__table-mono">{{ g.avgTime.toFixed(4) }}</td>
                        <td class="elgamal__table-mono">{{ g.minTime.toFixed(4) }}</td>
                        <td class="elgamal__table-mono">{{ g.maxTime.toFixed(4) }}</td>
                        <td>{{ g.count }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              <!-- Recent results -->
              <div class="elgamal__result-card">
                <h3>Последние измерения</h3>
                <div class="elgamal__table-wrap">
                  <table class="elgamal__table">
                    <thead>
                      <tr>
                        <th>a</th>
                        <th>x</th>
                        <th>n</th>
                        <th>Биты n</th>
                        <th>Время (мс)</th>
                        <th>Результат y</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(r, i) in timingResults.slice(0, 10)" :key="i">
                        <td>{{ r.a }}</td>
                        <td class="elgamal__table-mono" :title="r.x.toString()">{{ formatBigInt(r.x, 12) }}</td>
                        <td class="elgamal__table-mono" :title="r.n.toString()">{{ formatBigInt(r.n, 12) }}</td>
                        <td>{{ r.bitLength }}</td>
                        <td class="elgamal__table-mono elgamal__table-highlight">{{ r.timeMs.toFixed(4) }}</td>
                        <td class="elgamal__table-mono" :title="r.result.toString()">{{ formatBigInt(r.result, 12) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              <!-- Chart visualization -->
              <div class="elgamal__result-card">
                <h3>Визуализация времени</h3>
                <div class="elgamal__chart">
                  <div 
                    v-for="(r, i) in timingResults.slice(0, 20)" 
                    :key="i"
                    class="elgamal__chart-bar"
                    :style="{ 
                      height: `${Math.min(100, (r.timeMs / Math.max(...timingResults.map(t => t.timeMs))) * 100)}%`,
                      backgroundColor: `hsl(${180 + r.bitLength / 5}, 70%, 50%)`
                    }"
                    :title="`a=${r.a}, n=${r.bitLength}bits, t=${r.timeMs.toFixed(4)}ms`"
                  >
                    <span class="elgamal__chart-label">{{ r.bitLength }}</span>
                  </div>
                </div>
                <p class="elgamal__chart-hint">Высота столбца = время, цвет = битовая длина n</p>
              </div>
            </div>
          </section>
          
          <!-- Tab: Encryption -->
          <section v-if="activeTab === 'encrypt'" class="elgamal__section">
            <div class="elgamal__panel">
              <div class="elgamal__panel-content">
                <p class="elgamal__description">
                  <strong>Криптосистема Эль-Гамаля</strong> — асимметричный алгоритм шифрования, 
                  основанный на сложности вычисления дискретного логарифма в конечной группе.
                </p>
                
                <!-- Key generation -->
                <div class="elgamal__keygen">
                  <h4>Генерация ключей</h4>
                  <div class="elgamal__field-row">
                    <div class="elgamal__field">
                      <label class="elgamal__label">Битовая длина модуля p</label>
                      <select v-model.number="keyBitLength" class="elgamal__select">
                        <option :value="16">16 бит (демо)</option>
                        <option :value="32">32 бита</option>
                        <option :value="64">64 бита</option>
                      </select>
                    </div>
                    <button class="elgamal__btn elgamal__btn--primary" @click="generateKeys">
                      <Icon name="ph:key-fill" />
                      Сгенерировать ключи
                    </button>
                  </div>
                  
                  <!-- Keys display -->
                  <div v-if="keys" class="elgamal__keys">
                    <div class="elgamal__key-card">
                      <h5>Публичный ключ</h5>
                      <div class="elgamal__key-row">
                        <span>p (модуль):</span>
                        <code :title="keys.p.toString()">{{ formatBigInt(keys.p, 24) }}</code>
                      </div>
                      <div class="elgamal__key-row">
                        <span>g (генератор):</span>
                        <code>{{ keys.g.toString() }}</code>
                      </div>
                      <div class="elgamal__key-row">
                        <span>y = g<sup>x</sup> mod p:</span>
                        <code :title="keys.y.toString()">{{ formatBigInt(keys.y, 24) }}</code>
                      </div>
                    </div>
                    <div class="elgamal__key-card elgamal__key-card--secret">
                      <h5>Секретный ключ</h5>
                      <div class="elgamal__key-row">
                        <span>x:</span>
                        <code :title="keys.x.toString()">{{ formatBigInt(keys.x, 24) }}</code>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Encryption -->
                <div v-if="keys" class="elgamal__crypto">
                  <h4>Шифрование / Дешифрование</h4>
                  
                  <div class="elgamal__field">
                    <label class="elgamal__label">Открытый текст (ASCII)</label>
                    <textarea v-model="plaintext" class="elgamal__textarea" rows="2" placeholder="Введите текст..."></textarea>
                  </div>
                  
                  <div class="elgamal__actions">
                    <button 
                      class="elgamal__btn elgamal__btn--primary" 
                      :disabled="isEncrypting"
                      @click="handleEncrypt"
                    >
                      <Icon :name="isEncrypting ? 'ph:spinner' : 'ph:lock-simple-fill'" :class="{ 'animate-spin': isEncrypting }" />
                      Зашифровать
                    </button>
                    <button 
                      class="elgamal__btn elgamal__btn--secondary" 
                      :disabled="isDecrypting || !encryptionResult"
                      @click="handleDecrypt"
                    >
                      <Icon :name="isDecrypting ? 'ph:spinner' : 'ph:lock-simple-open-fill'" :class="{ 'animate-spin': isDecrypting }" />
                      Расшифровать
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div v-if="encryptError" class="elgamal__alert">
              <Icon name="ph:warning-fill" />
              {{ encryptError }}
            </div>
            
            <!-- Encryption result -->
            <div v-if="encryptionResult" class="elgamal__result-card">
              <h3>Результат шифрования</h3>
              
              <div class="elgamal__result-stats">
                <div class="elgamal__stat">
                  <span class="elgamal__stat-label">Время шифрования</span>
                  <span class="elgamal__stat-value">{{ encryptionResult.encryptionTime.toFixed(3) }} мс</span>
                </div>
                <div class="elgamal__stat">
                  <span class="elgamal__stat-label">Символов</span>
                  <span class="elgamal__stat-value">{{ encryptionResult.plaintext.length }}</span>
                </div>
                <div class="elgamal__stat">
                  <span class="elgamal__stat-label">Блоков шифротекста</span>
                  <span class="elgamal__stat-value">{{ encryptionResult.ciphertext.length }}</span>
                </div>
              </div>
              
              <!-- ASCII формат для копирования -->
              <div class="elgamal__ascii-output">
                <div class="elgamal__ascii-header">
                  <span class="elgamal__ascii-label">ASCII формат шифротекста:</span>
                  <button 
                    class="elgamal__btn elgamal__btn--small"
                    @click="copyToClipboard(formatCiphertextAsAscii())"
                    :title="copied ? 'Скопировано!' : 'Копировать'"
                  >
                    <Icon :name="copied ? 'ph:check-bold' : 'ph:copy-bold'" />
                    {{ copied ? 'Скопировано' : 'Копировать' }}
                  </button>
                  <button 
                    class="elgamal__btn elgamal__btn--small elgamal__btn--accent"
                    @click="pasteToDecrypt"
                    title="Вставить в поле расшифровки"
                  >
                    <Icon name="ph:arrow-right-bold" />
                    В расшифровку
                  </button>
                </div>
                <div class="elgamal__ascii-text">{{ formatCiphertextAsAscii() }}</div>
              </div>
              
              <!-- Toggle details -->
              <button class="elgamal__toggle" @click="showCipherDetails = !showCipherDetails">
                <Icon name="ph:list-bullets-fill" />
                <span>Детали шифротекста (по символам)</span>
                <Icon :name="showCipherDetails ? 'ph:caret-up-bold' : 'ph:caret-down-bold'" />
              </button>
              
              <div v-if="showCipherDetails" class="elgamal__cipher-details">
                <div class="elgamal__table-wrap">
                  <table class="elgamal__table">
                    <thead>
                      <tr>
                        <th>№</th>
                        <th>Символ</th>
                        <th>ASCII</th>
                        <th>a = g<sup>k</sup> mod p</th>
                        <th>b = m·y<sup>k</sup> mod p</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(c, i) in encryptionResult.ciphertext" :key="i">
                        <td>{{ i + 1 }}</td>
                        <td class="elgamal__table-char">{{ encryptionResult.plaintext[i] }}</td>
                        <td>{{ encryptionResult.plaintextCodes[i] }}</td>
                        <td class="elgamal__table-mono" :title="c.a.toString()">{{ formatBigInt(c.a, 16) }}</td>
                        <td class="elgamal__table-mono" :title="c.b.toString()">{{ formatBigInt(c.b, 16) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            <!-- Manual ASCII decryption -->
            <div v-if="keys" class="elgamal__result-card">
              <h3>Расшифровка из ASCII</h3>
              <p class="elgamal__description" style="margin-bottom: 1rem;">
                Введите шифротекст в формате: <code>a1,b1;a2,b2;...</code> (числа через запятую, блоки через точку с запятой)
              </p>
              
              <div class="elgamal__field">
                <label class="elgamal__label">ASCII шифротекст</label>
                <textarea 
                  v-model="manualAsciiInput" 
                  class="elgamal__textarea" 
                  rows="3" 
                  placeholder="Вставьте ASCII шифротекст здесь..."
                ></textarea>
              </div>
              
              <div class="elgamal__actions">
                <button 
                  class="elgamal__btn elgamal__btn--secondary" 
                  :disabled="isDecrypting || !manualAsciiInput.trim()"
                  @click="handleManualDecrypt"
                >
                  <Icon :name="isDecrypting ? 'ph:spinner' : 'ph:lock-simple-open-fill'" :class="{ 'animate-spin': isDecrypting }" />
                  Расшифровать ASCII
                </button>
              </div>
              
              <div v-if="manualDecryptError" class="elgamal__alert" style="margin-top: 1rem;">
                <Icon name="ph:warning-fill" />
                {{ manualDecryptError }}
              </div>
              
              <!-- Manual decryption result -->
              <div v-if="manualDecryptionResult" class="elgamal__manual-result">
                <div class="elgamal__result-stats">
                  <div class="elgamal__stat">
                    <span class="elgamal__stat-label">Время дешифрования</span>
                    <span class="elgamal__stat-value">{{ manualDecryptionResult.decryptionTime.toFixed(3) }} мс</span>
                  </div>
                  <div class="elgamal__stat">
                    <span class="elgamal__stat-label">��локов</span>
                    <span class="elgamal__stat-value">{{ manualDecryptionResult.ciphertext.length }}</span>
                  </div>
                </div>
                
                <div class="elgamal__decrypted">
                  <span class="elgamal__decrypted-label">Расшифрованный текст:</span>
                  <div class="elgamal__decrypted-text">{{ manualDecryptionResult.decryptedText }}</div>
                </div>
                
                <div 
                  class="elgamal__verify"
                  :class="{ 'elgamal__verify--success': manualDecryptionResult.decryptedText.trim() === plaintext.trim() }"
                >
                  <Icon :name="manualDecryptionResult.decryptedText.trim() === plaintext.trim() ? 'ph:check-circle-fill' : 'ph:x-circle-fill'" />
                  {{ manualDecryptionResult.decryptedText.trim() === plaintext.trim() ? 'Текст совпадает с исходным!' : 'Текст отличается от исходного' }}
                </div>
              </div>
            </div>
            
            <!-- Decryption result -->
            <div v-if="decryptionResult" class="elgamal__result-card elgamal__result-card--success">
              <h3>Результат дешифрования</h3>
              
              <div class="elgamal__result-stats">
                <div class="elgamal__stat">
                  <span class="elgamal__stat-label">Время дешифрования</span>
                  <span class="elgamal__stat-value">{{ decryptionResult.decryptionTime.toFixed(3) }} мс</span>
                </div>
              </div>
              
              <div class="elgamal__decrypted">
                <span class="elgamal__decrypted-label">Расшифрованный текст:</span>
                <div class="elgamal__decrypted-text">{{ decryptionResult.decryptedText }}</div>
              </div>
              
              <div 
                class="elgamal__verify"
                :class="{ 'elgamal__verify--success': decryptionResult.decryptedText.trim() === plaintext.trim() }"
              >
                <Icon :name="decryptionResult.decryptedText.trim() === plaintext.trim() ? 'ph:check-circle-fill' : 'ph:x-circle-fill'" />
                {{ decryptionResult.decryptedText.trim() === plaintext.trim() ? 'Текст успешно восстановлен!' : 'Текст не совпадает с оригиналом' }}
              </div>
            </div>
          </section>
          
          <!-- Algorithm info -->
          <section class="elgamal__about">
            <div class="elgamal__about-header">
              <Icon name="ph:info-fill" />
              <h3>Об алгоритме Эль-Гамаля</h3>
            </div>
            <p class="elgamal__about-text">
              Криптосистема Эль-Гамаля (1985) — асимметричный алгоритм, основанный на сложности 
              вычисления дискретного логарифма в конечной циклической группе. Используется для 
              шифрования и создания цифровых подписей.
            </p>
            <div class="elgamal__formulas">
              <div class="elgamal__formula">
                <span class="elgamal__formula-label">Генерация ключей:</span>
                <code>y = g<sup>x</sup> mod p</code>
              </div>
              <div class="elgamal__formula">
                <span class="elgamal__formula-label">Шифрование:</span>
                <code>a = g<sup>k</sup> mod p, b = m · y<sup>k</sup> mod p</code>
              </div>
              <div class="elgamal__formula">
                <span class="elgamal__formula-label">Дешифрование:</span>
                <code>m = b · a<sup>-x</sup> mod p</code>
              </div>
            </div>
            <p class="elgamal__about-note">
              где <strong>p</strong> — простое число, <strong>g</strong> — генератор, 
              <strong>x</strong> — секретный ключ, <strong>y</strong> — публичный ключ, 
              <strong>k</strong> — случайное число для каждого сообщения.
            </p>
          </section>
        </div>
      </div>
    </main>
    
    <Download 
      title="Отчет_лабораторная_работа_4.docx"
      download="Отчет_лабораторная_работа_4.docx"
    />
    
    <footer class="lab-footer">
      <div class="container">
        <p>Адодин Егор | ИТБД-124 | РГУ им. А.Н. Косыгина | 2026</p>
      </div>
    </footer>
  </div>
</template>

<style lang="scss">
// Reuse base styles
.lab-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  
  &__ambient {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 50vh;
    background: radial-gradient(ellipse 60% 40% at 50% 0%, rgba(34, 211, 238, 0.06), transparent 70%);
    pointer-events: none;
    z-index: 0;
  }
}

.lab-header {
  position: sticky;
  top: 0;
  z-index: 100;
  padding: var(--spacing-md) 0;
  background: var(--color-glass-strong);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--color-glass-border);
  
  &__row {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    flex-wrap: wrap;
  }
  
  &__back {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-glass);
    border: 1px solid var(--color-glass-border);
    border-radius: var(--radius-md);
    color: var(--color-text-secondary);
    font-size: 0.875rem;
    transition: all var(--transition-normal);
    
    &:hover {
      color: var(--color-text-primary);
      border-color: var(--color-glass-border-hover);
    }
  }
  
  &__meta {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    flex: 1;
  }
  
  &__num {
    font-family: var(--font-mono);
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-accent);
    opacity: 0.4;
  }
  
  &__label {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  &__title {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-text-primary);
  }
}

.lab-main {
  position: relative;
  z-index: 1;
  flex: 1;
  padding: var(--spacing-xl) 0;
}

.lab-footer {
  padding: var(--spacing-lg) 0;
  background: var(--color-glass-strong);
  border-top: 1px solid var(--color-glass-border);
  text-align: center;
  
  p {
    font-size: 0.813rem;
    color: var(--color-text-muted);
  }
}

// ElGamal styles
.elgamal {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  
  // Tabs
  &__tabs {
    display: flex;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm);
    background: var(--color-glass);
    border: 1px solid var(--color-glass-border);
    border-radius: var(--radius-lg);
  }
  
  &__tab {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-sm) var(--spacing-md);
    background: transparent;
    border: none;
    border-radius: var(--radius-md);
    color: var(--color-text-secondary);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-normal);
    
    &:hover {
      color: var(--color-text-primary);
      background: var(--color-bg-tertiary);
    }
    
    &--active {
      color: var(--color-accent);
      background: var(--color-accent-muted);
    }
  }
  
  // Panel
  &__panel {
    background: var(--color-glass);
    border: 1px solid var(--color-glass-border);
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
  }
  
  &__panel-content {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    
    h4 {
      font-size: 0.875rem;
      color: var(--color-text-primary);
      margin-top: var(--spacing-sm);
    }
  }
  
  &__description {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    line-height: 1.6;
    
    strong {
      color: var(--color-text-primary);
    }
    
    code {
      font-family: var(--font-mono);
      padding: 2px 6px;
      background: var(--color-bg-tertiary);
      border-radius: var(--radius-sm);
    }
  }
  
  // Fields
  &__field {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }
  
  &__field-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-md);
    align-items: flex-end;
  }
  
  &__label {
    font-size: 0.813rem;
    font-weight: 500;
    color: var(--color-text-secondary);
  }
  
  &__input {
    padding: 10px var(--spacing-md);
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-glass-border);
    border-radius: var(--radius-md);
    color: var(--color-text-primary);
    font-size: 0.875rem;
    min-width: 100px;
    
    &:focus {
      border-color: var(--color-accent);
      outline: none;
    }
  }
  
  &__select {
    padding: 10px var(--spacing-md);
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-glass-border);
    border-radius: var(--radius-md);
    color: var(--color-text-primary);
    font-size: 0.875rem;
  }
  
  &__textarea {
    padding: var(--spacing-md);
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-glass-border);
    border-radius: var(--radius-md);
    color: var(--color-text-primary);
    font-size: 0.875rem;
    resize: vertical;
    
    &:focus {
      border-color: var(--color-accent);
      outline: none;
    }
  }
  
  // Actions
  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-sm);
  }
  
  &__btn {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-sm) var(--spacing-md);
    border: none;
    border-radius: var(--radius-md);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-normal);
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    &--primary {
      background: var(--color-accent);
      color: var(--color-bg-primary);
      
      &:hover:not(:disabled) {
        filter: brightness(1.1);
      }
    }
    
    &--secondary {
      background: var(--color-glass);
      border: 1px solid var(--color-glass-border);
      color: var(--color-text-primary);
    }
    
    &--icon {
      padding: var(--spacing-sm);
      background: var(--color-glass);
      border: 1px solid var(--color-glass-border);
      color: var(--color-text-secondary);
    }
  }
  
  // Alert
  &__alert {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-md);
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: var(--radius-md);
    color: var(--color-error);
    font-size: 0.875rem;
  }
  
  // Keys
  &__keygen {
    padding-top: var(--spacing-md);
    border-top: 1px solid var(--color-glass-border);
  }
  
  &__keys {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-md);
    margin-top: var(--spacing-md);
    
    @media (max-width: 640px) {
      grid-template-columns: 1fr;
    }
  }
  
  &__key-card {
    padding: var(--spacing-md);
    background: var(--color-bg-tertiary);
    border-radius: var(--radius-md);
    
    h5 {
      font-size: 0.813rem;
      color: var(--color-text-primary);
      margin-bottom: var(--spacing-sm);
    }
    
    &--secret {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.2);
    }
  }
  
  &__key-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-xs) 0;
    font-size: 0.75rem;
    
    span {
      color: var(--color-text-muted);
    }
    
    code {
      font-family: var(--font-mono);
      color: var(--color-text-primary);
      word-break: break-all;
    }
  }
  
  &__crypto {
    padding-top: var(--spacing-md);
    border-top: 1px solid var(--color-glass-border);
  }
  
  // Result card
  &__result-card {
    background: var(--color-glass);
    border: 1px solid var(--color-glass-border);
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
    
    h3 {
      font-size: 1rem;
      color: var(--color-text-primary);
      margin-bottom: var(--spacing-md);
    }
    
    &--success {
      border-color: var(--color-success);
      background: rgba(52, 211, 153, 0.05);
    }
  }
  
  &__result-stats {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-lg);
    margin-bottom: var(--spacing-md);
  }
  
  &__stat {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  
  &__stat-label {
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }
  
  &__stat-value {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text-primary);
  }
  
  // Table
  &__table-wrap {
    overflow-x: auto;
  }
  
  &__table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.75rem;
    
    th, td {
      padding: var(--spacing-sm);
      text-align: left;
      border-bottom: 1px solid var(--color-glass-border);
    }
    
    th {
      color: var(--color-text-muted);
      font-weight: 500;
      white-space: nowrap;
    }
  }
  
  &__table-mono {
    font-family: var(--font-mono);
  }
  
  &__table-highlight {
    color: var(--color-accent);
    font-weight: 600;
  }
  
  &__table-char {
    font-size: 1rem;
    font-weight: 600;
  }
  
  // Toggle
  &__toggle {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    width: 100%;
    padding: var(--spacing-sm) 0;
    background: transparent;
    border: none;
    color: var(--color-text-secondary);
    font-size: 0.875rem;
    cursor: pointer;
    
    &:hover {
      color: var(--color-text-primary);
    }
  }
  
  // Chart
  &__chart {
    display: flex;
    align-items: flex-end;
    gap: 4px;
    height: 120px;
    padding: var(--spacing-md) 0;
  }
  
  &__chart-bar {
    flex: 1;
    min-width: 16px;
    max-width: 40px;
    border-radius: var(--radius-sm) var(--radius-sm) 0 0;
    position: relative;
    cursor: pointer;
    transition: filter var(--transition-normal);
    
    &:hover {
      filter: brightness(1.2);
    }
  }
  
  &__chart-label {
    position: absolute;
    bottom: -18px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 0.625rem;
    color: var(--color-text-muted);
  }
  
  &__chart-hint {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    text-align: center;
    margin-top: var(--spacing-md);
  }
  
  // Decrypted
  &__decrypted {
    margin-top: var(--spacing-md);
  }
  
  &__decrypted-label {
    font-size: 0.813rem;
    color: var(--color-text-muted);
    display: block;
    margin-bottom: var(--spacing-xs);
  }
  
  &__decrypted-text {
    padding: var(--spacing-md);
    background: var(--color-bg-tertiary);
    border-radius: var(--radius-md);
    font-family: var(--font-mono);
    font-size: 1rem;
    color: var(--color-text-primary);
  }
  
  &__verify {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin-top: var(--spacing-md);
    padding: var(--spacing-md);
    background: rgba(239, 68, 68, 0.1);
    border-radius: var(--radius-md);
    color: var(--color-error);
    font-weight: 500;
    font-size: 0.875rem;
    
    &--success {
      background: rgba(52, 211, 153, 0.1);
      color: var(--color-success);
    }
  }
  
  // ASCII output
  &__ascii-output {
    margin-top: var(--spacing-md);
    padding: var(--spacing-md);
    background: var(--color-bg-tertiary);
    border-radius: var(--radius-md);
    border: 1px solid var(--color-glass-border);
  }
  
  &__ascii-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    flex-wrap: wrap;
    margin-bottom: var(--spacing-sm);
  }
  
  &__ascii-label {
    font-size: 0.813rem;
    color: var(--color-text-muted);
    flex: 1;
    min-width: 200px;
  }
  
  &__ascii-text {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--color-text-secondary);
    word-break: break-all;
    max-height: 100px;
    overflow-y: auto;
    padding: var(--spacing-sm);
    background: var(--color-bg-secondary);
    border-radius: var(--radius-sm);
  }
  
  &__manual-result {
    margin-top: var(--spacing-md);
    padding-top: var(--spacing-md);
    border-top: 1px solid var(--color-glass-border);
  }
  
  // Small button variant
  &__btn--small {
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: 0.75rem;
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
    color: var(--color-text-primary);
    
    &:hover {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.3);
    }
  }
  
  &__btn--accent {
    background: linear-gradient(135deg, rgba(34, 211, 238, 0.3), rgba(168, 85, 247, 0.3));
    border-color: rgba(34, 211, 238, 0.5);
    color: #fff;
    
    &:hover {
      background: linear-gradient(135deg, rgba(34, 211, 238, 0.4), rgba(168, 85, 247, 0.4));
      border-color: rgba(34, 211, 238, 0.6);
    }
  }
  
  // About
  &__about {
    background: var(--color-glass);
    border: 1px solid var(--color-glass-border);
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
  }
  
  &__about-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-md);
    
    .iconify {
      color: var(--color-accent);
    }
    
    h3 {
      font-size: 1rem;
      color: var(--color-text-primary);
    }
  }
  
  &__about-text {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    line-height: 1.6;
    margin-bottom: var(--spacing-md);
  }
  
  &__about-note {
    font-size: 0.813rem;
    color: var(--color-text-muted);
    margin-top: var(--spacing-md);
    
    strong {
      color: var(--color-text-secondary);
    }
  }
  
  &__formulas {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }
  
  &__formula {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: 0.875rem;
    
    code {
      font-family: var(--font-mono);
      padding: 4px 8px;
      background: var(--color-bg-tertiary);
      border-radius: var(--radius-sm);
    }
  }
  
  &__formula-label {
    color: var(--color-text-muted);
    min-width: 140px;
  }
}

// Report download section
.report-download {
  position: relative;
  z-index: 1;
  padding: var(--spacing-xl) 0;
  
  &__card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-lg);
    padding: var(--spacing-xl);
    background: var(--color-glass);
    backdrop-filter: blur(20px);
    border: 1px solid var(--color-glass-border);
    border-radius: var(--radius-lg);
    text-align: center;
    
    @media (min-width: 768px) {
      flex-direction: row;
      text-align: left;
    }
  }
  
  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 64px;
    height: 64px;
    background: linear-gradient(135deg, rgba(34, 211, 238, 0.2), rgba(168, 85, 247, 0.2));
    border-radius: var(--radius-lg);
    flex-shrink: 0;
    
    svg {
      width: 32px;
      height: 32px;
      color: #22d3ee;
    }
  }
  
  &__title {
    flex: 1;
    font-size: 1.125rem;
    font-weight: 600;
    color: #ffffff;
  }
  
  &__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 14px 28px;
    background: #ffffff;
    border: none;
    border-radius: var(--radius-md);
    font-size: 1rem;
    font-weight: 700;
    text-decoration: none;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 16px rgba(255, 255, 255, 0.15);
    flex-shrink: 0;
    white-space: nowrap;
    margin-left: auto;
    position: relative;
    overflow: hidden;
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(34, 211, 238, 0.3),
        transparent
      );
      transition: left 0.5s ease;
    }
    
    span {
      color: #0a0a0f;
      position: relative;
      z-index: 1;
    }
    
    svg {
      width: 20px;
      height: 20px;
      color: #0a0a0f;
      position: relative;
      z-index: 1;
      transition: transform 0.3s ease;
    }
    
    &:hover {
      transform: translateY(-3px) scale(1.02);
      box-shadow: 0 8px 30px rgba(255, 255, 255, 0.3);
      background: #ffffff;
      
      &::before {
        left: 100%;
      }
      
      svg {
        animation: bounce-down 0.6s ease infinite;
      }
    }
    
    &:active {
      transform: translateY(0) scale(0.98);
    }
    
    @media (max-width: 767px) {
      width: 100%;
      padding: 14px 20px;
      margin-left: 0;
    }
  }
}

@keyframes bounce-down {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(3px);
  }
}

// Lab footer
.lab-footer {
  position: relative;
  z-index: 1;
  padding: var(--spacing-lg) 0;
  background: var(--color-glass-strong);
  backdrop-filter: blur(20px);
  border-top: 1px solid var(--color-glass-border);
  text-align: center;
  
  p {
    font-size: 0.813rem;
    color: var(--color-text-muted);
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
