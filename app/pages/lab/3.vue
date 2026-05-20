<script setup lang="ts">
import {
  encryptDES,
  decryptDES,
  textToHex,
  hexToText,
  validateKey,
  generateRandomKey,
  analyzeAvalanche,
  analyzeKeyStrength,
  demonstrateWeakKey,
  demonstrateSemiWeakKey,
  getPairedSemiWeakKey,
  analyzeCompression,
  measureSpeed,
  countDifferentBits,
  isValidHex,
  WEAK_KEYS,
  SEMI_WEAK_KEYS,
  SEMI_WEAK_KEY_PAIRS,
  type DESResult,
  type AvalancheResult,
  type WeakKeyAnalysis,
  type CompressionResult
} from '~/labs/lab3-des'
import Download from '../../components/download.vue'

// Состояние UI
const activeTab = ref<'encrypt' | 'avalanche' | 'weakkeys' | 'compression' | 'speed'>('encrypt')

// ==========================================
// Вкладка: Шифрование/Дешифрование
// ==========================================
const inputText = ref('Hello, DES!')
const keyHex = ref('133457799BBCDFF1')
const outputText = ref('')
const inputMode = ref<'text' | 'hex'>('text')
const showBlocks = ref(false)
const encryptResult = ref<DESResult | null>(null)
const errorMessage = ref('')
const isProcessing = ref(false)
const copied = ref(false)
const copiedKey = ref(false)

// Вставка результата шифрования для расшифровки
function pasteToDecrypt() {
  if (encryptResult.value && encryptResult.value.mode === 'encrypt') {
    inputText.value = encryptResult.value.output
    inputMode.value = 'hex'
    outputText.value = ''
    encryptResult.value = null
  }
}

// Валидация ключа
const keyValidation = computed(() => validateKey(keyHex.value))

// Генерация случайного ключа
function generateKey() {
  keyHex.value = generateRandomKey()
}

// Шифрование
function handleEncrypt() {
  errorMessage.value = ''
  encryptResult.value = null
  
  if (!inputText.value.trim()) {
    errorMessage.value = 'Введите текст для шифрования'
    return
  }
  
  if (!keyValidation.value.valid) {
    errorMessage.value = keyValidation.value.error || 'Неверный ключ'
    return
  }
  
  try {
    isProcessing.value = true
    const inputHex = inputMode.value === 'text' ? textToHex(inputText.value) : inputText.value
    
    if (!isValidHex(inputHex)) {
      errorMessage.value = 'Некорректный HEX формат входных данных'
      return
    }
    
    encryptResult.value = encryptDES(inputHex, keyHex.value, true)
    outputText.value = encryptResult.value.output
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Ошибка шифрования'
  } finally {
    setTimeout(() => { isProcessing.value = false }, 100)
  }
}

// Дешифрование
function handleDecrypt() {
  errorMessage.value = ''
  encryptResult.value = null
  
  if (!inputText.value.trim()) {
    errorMessage.value = 'Введите данные для дешифрования'
    return
  }
  
  if (!keyValidation.value.valid) {
    errorMessage.value = keyValidation.value.error || 'Неверный ключ'
    return
  }
  
  try {
    isProcessing.value = true
    const inputHex = inputMode.value === 'text' ? textToHex(inputText.value) : inputText.value
    
    if (!isValidHex(inputHex)) {
      errorMessage.value = 'Некорректный HEX формат входных данных'
      return
    }
    
    encryptResult.value = decryptDES(inputHex, keyHex.value, true)
    // Всегда преобразуем расшифрованный HEX в текст
    outputText.value = hexToText(encryptResult.value.output)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Ошибка дешифрования'
  } finally {
    setTimeout(() => { isProcessing.value = false }, 100)
  }
}

// Копирование
async function copyToClipboard(text: string, isKey = false) {
  try {
    await navigator.clipboard.writeText(text)
    if (isKey) {
      copiedKey.value = true
      setTimeout(() => { copiedKey.value = false }, 2000)
    } else {
      copied.value = true
      setTimeout(() => { copied.value = false }, 2000)
    }
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = text
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    if (isKey) {
      copiedKey.value = true
      setTimeout(() => { copiedKey.value = false }, 2000)
    } else {
      copied.value = true
      setTimeout(() => { copied.value = false }, 2000)
    }
  }
}

// ==========================================
// Вкладка: Лавинный эффект
// ==========================================
const avalancheInput = ref('0123456789ABCDEF')
const avalancheKey = ref('133457799BBCDFF1')
const avalancheBit = ref(0)
const avalancheResult = ref<AvalancheResult | null>(null)
const avalancheError = ref('')

function analyzeAvalancheEffect() {
  avalancheError.value = ''
  avalancheResult.value = null
  
  const keyVal = validateKey(avalancheKey.value)
  if (!keyVal.valid) {
    avalancheError.value = keyVal.error || 'Неверный ключ'
    return
  }
  
  if (!isValidHex(avalancheInput.value)) {
    avalancheError.value = 'Входные данные должны быть в HEX формате'
    return
  }
  
  try {
    avalancheResult.value = analyzeAvalanche(
      avalancheInput.value.padEnd(16, '0').slice(0, 16),
      avalancheKey.value,
      avalancheBit.value
    )
  } catch (error) {
    avalancheError.value = error instanceof Error ? error.message : 'Ошибка анализа'
  }
}

// ==========================================
// Вкладка: Слабые ключи
// ==========================================
const selectedWeakKey = ref(WEAK_KEYS[0])
const weakKeyTestPlain = ref('48454C4C4F574F52') // "HELLOWORLD" в hex
const weakKeyResult = ref<WeakKeyAnalysis | null>(null)
const weakKeyDemo = ref<{ original: string; firstEncrypt: string; secondEncrypt: string; isIdentical: boolean } | null>(null)
const semiWeakDemo = ref<{ original: string; firstEncrypt: string; secondEncrypt: string; isIdentical: boolean; key1: string; key2: string } | null>(null)
const weakKeyError = ref('')

function analyzeWeakKey() {
  weakKeyError.value = ''
  weakKeyResult.value = null
  weakKeyDemo.value = null
  semiWeakDemo.value = null
  
  try {
    weakKeyResult.value = analyzeKeyStrength(selectedWeakKey.value)
    
    if (weakKeyResult.value.keyType === 'weak') {
      weakKeyDemo.value = demonstrateWeakKey(weakKeyTestPlain.value, selectedWeakKey.value)
    } else if (weakKeyResult.value.keyType === 'semi-weak' && weakKeyResult.value.pairedKey) {
      semiWeakDemo.value = demonstrateSemiWeakKey(
        weakKeyTestPlain.value, 
        selectedWeakKey.value, 
        weakKeyResult.value.pairedKey
      )
    }
  } catch (error) {
    weakKeyError.value = error instanceof Error ? error.message : 'Ошибка анализа'
  }
}

// ==========================================
// Вкладка: Сжатие
// ==========================================
const compressionText = ref('AAAAAAAAAAAABBBBBBBBCCCCCCDDDDEEEEFFFFGGGG')
const compressionKey = ref('133457799BBCDFF1')
const compressionResult = ref<CompressionResult | null>(null)
const compressionError = ref('')

function analyzeCompressionRatio() {
  compressionError.value = ''
  compressionResult.value = null
  
  const keyVal = validateKey(compressionKey.value)
  if (!keyVal.valid) {
    compressionError.value = keyVal.error || 'Неверный ключ'
    return
  }
  
  if (!compressionText.value.trim()) {
    compressionError.value = 'Введите текст для анализа'
    return
  }
  
  try {
    compressionResult.value = analyzeCompression(compressionText.value, compressionKey.value)
  } catch (error) {
    compressionError.value = error instanceof Error ? error.message : 'Ошибка анализа'
  }
}

// ==========================================
// Вкладка: Скорость
// ==========================================
const speedDataSize = ref(1024) // байт
const speedIterations = ref(50)
const speedKey = ref('133457799BBCDFF1')
const speedResult = ref<{ encryptTime: number; decryptTime: number; throughput: number } | null>(null)
const speedError = ref('')
const speedRunning = ref(false)

async function measureDESSpeed() {
  speedError.value = ''
  speedResult.value = null
  
  const keyVal = validateKey(speedKey.value)
  if (!keyVal.valid) {
    speedError.value = keyVal.error || 'Неверный ключ'
    return
  }
  
  try {
    speedRunning.value = true
    
    // Генерируем тестовые данные
    let testData = ''
    for (let i = 0; i < speedDataSize.value; i++) {
      testData += Math.floor(Math.random() * 16).toString(16).toUpperCase()
    }
    testData += testData // Удваиваем для hex
    
    // Даём UI обновиться
    await new Promise(resolve => setTimeout(resolve, 50))
    
    speedResult.value = measureSpeed(testData, speedKey.value, speedIterations.value)
  } catch (error) {
    speedError.value = error instanceof Error ? error.message : 'Ошибка измерения'
  } finally {
    speedRunning.value = false
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
            <span class="lab-header__num">03</span>
            <div class="lab-header__info">
              <span class="lab-header__label">Лабораторная работа</span>
              <h1 class="lab-header__title">Алгоритм шифрования DES</h1>
            </div>
          </div>
        </div>
      </div>
    </header>
    
    <!-- Main -->
    <main class="lab-main">
      <div class="container">
        <div class="des">
          <!-- Tabs -->
          <nav class="des__tabs">
            <button 
              class="des__tab" 
              :class="{ 'des__tab--active': activeTab === 'encrypt' }"
              @click="activeTab = 'encrypt'"
            >
              <Icon name="ph:lock-simple-fill" />
              Шифрование
            </button>
            <button 
              class="des__tab" 
              :class="{ 'des__tab--active': activeTab === 'avalanche' }"
              @click="activeTab = 'avalanche'"
            >
              <Icon name="ph:graph-fill" />
              Лавинный эффект
            </button>
            <button 
              class="des__tab" 
              :class="{ 'des__tab--active': activeTab === 'weakkeys' }"
              @click="activeTab = 'weakkeys'"
            >
              <Icon name="ph:warning-fill" />
              Слабые ключи
            </button>
            <button 
              class="des__tab" 
              :class="{ 'des__tab--active': activeTab === 'compression' }"
              @click="activeTab = 'compression'"
            >
              <Icon name="ph:file-zip-fill" />
              Сжатие
            </button>
            <button 
              class="des__tab" 
              :class="{ 'des__tab--active': activeTab === 'speed' }"
              @click="activeTab = 'speed'"
            >
              <Icon name="ph:timer-fill" />
              Скорость
            </button>
          </nav>
          
          <!-- Tab: Encrypt/Decrypt -->
          <section v-if="activeTab === 'encrypt'" class="des__section">
            <div class="des__panel">
              <div class="des__panel-content">
                <!-- Key input -->
                <div class="des__field">
                  <label class="des__label">
                    <Icon name="ph:key-fill" />
                    Ключ (64 бита / 16 HEX символов)
                  </label>
                  <div class="des__key-row">
                    <input 
                      v-model="keyHex" 
                      type="text" 
                      class="des__input des__input--mono"
                      :class="{ 'des__input--error': !keyValidation.valid && keyHex.length > 0 }"
                      placeholder="133457799BBCDFF1"
                      maxlength="16"
                    />
                    <button class="des__btn des__btn--small" @click="generateKey">
                      <Icon name="ph:shuffle-fill" />
                      Случайный
                    </button>
                  </div>
                  <p v-if="!keyValidation.valid && keyHex.length > 0" class="des__error-hint">
                    {{ keyValidation.error }}
                  </p>
                </div>
                
                <!-- Mode toggle -->
                <div class="des__field">
                  <label class="des__label">Формат ввода</label>
                  <div class="des__toggle-group">
                    <button 
                      class="des__toggle-btn" 
                      :class="{ 'des__toggle-btn--active': inputMode === 'text' }"
                      @click="inputMode = 'text'"
                    >
                      Текст
                    </button>
                    <button 
                      class="des__toggle-btn" 
                      :class="{ 'des__toggle-btn--active': inputMode === 'hex' }"
                      @click="inputMode = 'hex'"
                    >
                      HEX
                    </button>
                  </div>
                </div>
                
                <!-- Actions -->
                <div class="des__actions">
                  <button 
                    class="des__btn des__btn--primary" 
                    :disabled="isProcessing || !keyValidation.valid"
                    @click="handleEncrypt"
                  >
                    <Icon name="ph:lock-simple-fill" />
                    Зашифровать
                  </button>
                  <button 
                    class="des__btn des__btn--secondary" 
                    :disabled="isProcessing || !keyValidation.valid"
                    @click="handleDecrypt"
                  >
                    <Icon name="ph:lock-simple-open-fill" />
                    Расшифровать
                  </button>
                </div>
              </div>
            </div>
            
            <!-- Error -->
            <div v-if="errorMessage" class="des__alert">
              <Icon name="ph:warning-fill" />
              {{ errorMessage }}
            </div>
            
            <!-- Input/Output -->
            <div class="des__workspace">
              <div class="des__box">
                <div class="des__box-header">
                  <span><Icon name="ph:text-aa-fill" /> Входные данные</span>
                </div>
                <textarea 
                  v-model="inputText" 
                  class="des__textarea" 
                  rows="4"
                  :placeholder="inputMode === 'text' ? 'Введите текст...' : 'Введите HEX данные...'"
                ></textarea>
              </div>
              
              <div class="des__box">
                <div class="des__box-header">
                  <span><Icon name="ph:shield-check-fill" /> Результат</span>
                  <button 
                    class="des__box-action" 
                    :disabled="!outputText"
                    @click="copyToClipboard(outputText)"
                  >
                    <Icon :name="copied ? 'ph:check-bold' : 'ph:copy'" />
                  </button>
                </div>
                <textarea 
                  v-model="outputText" 
                  class="des__textarea des__textarea--result" 
                  rows="4"
                  readonly
                  placeholder="Результат появится здесь..."
                ></textarea>
              </div>
            </div>
            
            <!-- Result info -->
            <div v-if="encryptResult" class="des__result-info">
              <div class="des__stat-row">
                <div class="des__stat">
                  <span class="des__stat-label">Режим</span>
                  <span class="des__stat-value">{{ encryptResult.mode === 'encrypt' ? 'Шифрование' : 'Дешифрование' }}</span>
                </div>
                <div class="des__stat">
                  <span class="des__stat-label">Время</span>
                  <span class="des__stat-value">{{ encryptResult.executionTime.toFixed(3) }} мс</span>
                </div>
                <div class="des__stat">
                  <span class="des__stat-label">Блоков</span>
                  <span class="des__stat-value">{{ encryptResult.blocks.length }}</span>
                </div>
              </div>
              
              <!-- Key and quick actions for encryption -->
              <div v-if="encryptResult.mode === 'encrypt'" class="des__quick-actions">
                <div class="des__key-display">
                  <span class="des__key-label">Ключ (HEX):</span>
                  <code class="des__key-value">{{ encryptResult.key }}</code>
                  <button 
                    class="des__btn des__btn--small"
                    @click="copyToClipboard(encryptResult.key, true)"
                  >
                    <Icon :name="copiedKey ? 'ph:check-bold' : 'ph:copy'" />
                    {{ copiedKey ? 'Скопировано' : 'Копировать ключ' }}
                  </button>
                </div>
                <div class="des__action-buttons">
                  <button 
                    class="des__btn des__btn--small des__btn--accent"
                    @click="pasteToDecrypt"
                  >
                    <Icon name="ph:arrow-right-bold" />
                    Расшифровать результат
                  </button>
                </div>
              </div>
              
              <!-- Blocks toggle -->
              <button class="des__toggle" @click="showBlocks = !showBlocks">
                <Icon name="ph:list-bullets-fill" />
                <span>Информация о блоках</span>
                <Icon :name="showBlocks ? 'ph:caret-up-bold' : 'ph:caret-down-bold'" />
              </button>
              
              <div v-if="showBlocks" class="des__blocks">
                <div v-for="block in encryptResult.blocks" :key="block.index" class="des__block-card">
                  <div class="des__block-header">Блок {{ block.index }}</div>
                  <div class="des__block-row">
                    <span>Вход:</span>
                    <code>{{ block.input }}</code>
                  </div>
                  <div class="des__block-row">
                    <span>Выход:</span>
                    <code>{{ block.output }}</code>
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          <!-- Tab: Avalanche -->
          <section v-if="activeTab === 'avalanche'" class="des__section">
            <div class="des__panel">
              <div class="des__panel-content">
                <p class="des__description">
                  <strong>Лавинный эффект</strong> — криптографическое свойство, при котором изменение одного бита 
                  входных данных приводит к изменению примерно половины битов выходных данных.
                </p>
                
                <div class="des__field">
                  <label class="des__label">Входные данные (HEX, 16 символов)</label>
                  <input v-model="avalancheInput" type="text" class="des__input des__input--mono" maxlength="16" />
                </div>
                
                <div class="des__field">
                  <label class="des__label">Ключ</label>
                  <input v-model="avalancheKey" type="text" class="des__input des__input--mono" maxlength="16" />
                </div>
                
                <div class="des__field">
                  <label class="des__label">Номер изменяемого бита (0-63)</label>
                  <input v-model.number="avalancheBit" type="number" min="0" max="63" class="des__input" />
                </div>
                
                <button class="des__btn des__btn--primary" @click="analyzeAvalancheEffect">
                  <Icon name="ph:chart-line-fill" />
                  Анализировать
                </button>
              </div>
            </div>
            
            <div v-if="avalancheError" class="des__alert">
              <Icon name="ph:warning-fill" />
              {{ avalancheError }}
            </div>
            
            <div v-if="avalancheResult" class="des__avalanche-result">
              <div class="des__result-card">
                <h3>Результаты анализа</h3>
                
                <div class="des__stat-grid">
                  <div class="des__stat-item">
                    <span class="des__stat-label">Изменённых бит</span>
                    <span class="des__stat-value des__stat-value--large">
                      {{ avalancheResult.changedBits }} / {{ avalancheResult.totalBits }}
                    </span>
                  </div>
                  <div class="des__stat-item">
                    <span class="des__stat-label">Процент изменений</span>
                    <span 
                      class="des__stat-value des__stat-value--large"
                      :class="{ 
                        'des__stat-value--good': avalancheResult.percentage >= 40 && avalancheResult.percentage <= 60,
                        'des__stat-value--bad': avalancheResult.percentage < 40 || avalancheResult.percentage > 60
                      }"
                    >
                      {{ avalancheResult.percentage.toFixed(1) }}%
                    </span>
                  </div>
                </div>
                
                <div class="des__compare">
                  <div class="des__compare-item">
                    <span class="des__compare-label">Оригинал:</span>
                    <code>{{ avalancheResult.originalInput }}</code>
                    <span class="des__compare-arrow">→</span>
                    <code>{{ avalancheResult.originalOutput }}</code>
                  </div>
                  <div class="des__compare-item">
                    <span class="des__compare-label">Изменённый:</span>
                    <code>{{ avalancheResult.modifiedInput }}</code>
                    <span class="des__compare-arrow">→</span>
                    <code>{{ avalancheResult.modifiedOutput }}</code>
                  </div>
                </div>
                
                <!-- Round by round -->
                <h4>Изменения по раундам</h4>
                <div class="des__rounds-chart">
                  <div 
                    v-for="r in avalancheResult.roundByRound" 
                    :key="r.round" 
                    class="des__round-bar"
                    :style="{ height: `${Math.max(r.percentage, 5)}%` }"
                    :title="`Раунд ${r.round}: ${r.changedBits} бит (${r.percentage.toFixed(1)}%)`"
                  >
                    <span class="des__round-label">{{ r.round }}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          <!-- Tab: Weak Keys -->
          <section v-if="activeTab === 'weakkeys'" class="des__section">
            <div class="des__panel">
              <div class="des__panel-content">
                <p class="des__description">
                  <strong>Слабые ключи DES</strong> — ключи, которые генерируют одинаковые подключи во всех 16 раундах.
                  При использовании слабого ключа двойное шифрование возвращает исходный текст: E(E(x)) = x.
                </p>
                
                <div class="des__field">
                  <label class="des__label">Выберите слабый ключ</label>
                  <select v-model="selectedWeakKey" class="des__select">
                    <optgroup label="Слабые ключи (4 шт.)">
                      <option v-for="key in WEAK_KEYS" :key="key" :value="key">{{ key }}</option>
                    </optgroup>
                    <optgroup label="Полуслабые ключи (12 шт.)">
                      <option v-for="key in SEMI_WEAK_KEYS" :key="key" :value="key">{{ key }}</option>
                    </optgroup>
                  </select>
                </div>
                
                <div class="des__field">
                  <label class="des__label">Тестовый текст (HEX)</label>
                  <input v-model="weakKeyTestPlain" type="text" class="des__input des__input--mono" maxlength="16" />
                </div>
                
                <button class="des__btn des__btn--primary" @click="analyzeWeakKey">
                  <Icon name="ph:magnifying-glass-fill" />
                  Анализировать ключ
                </button>
              </div>
            </div>
            
            <div v-if="weakKeyError" class="des__alert">
              <Icon name="ph:warning-fill" />
              {{ weakKeyError }}
            </div>
            
            <div v-if="weakKeyResult" class="des__weak-result">
              <div 
                class="des__result-card"
                :class="{
                  'des__result-card--weak': weakKeyResult.keyType === 'weak',
                  'des__result-card--semi': weakKeyResult.keyType === 'semi-weak'
                }"
              >
                <div class="des__result-badge">
                  <Icon :name="weakKeyResult.keyType === 'normal' ? 'ph:check-circle-fill' : 'ph:warning-fill'" />
                  {{ weakKeyResult.keyType === 'weak' ? 'Слабый ключ' : weakKeyResult.keyType === 'semi-weak' ? 'Полуслабый ключ' : 'Обычный ключ' }}
                </div>
                
                <p>{{ weakKeyResult.description }}</p>
                
                <!-- Показываем парный ключ для полуслабых -->
                <div v-if="weakKeyResult.keyType === 'semi-weak' && weakKeyResult.pairedKey" class="des__paired-key">
                  <div class="des__paired-key-header">
                    <Icon name="ph:link-fill" />
                    <span>Парный ключ</span>
                  </div>
                  <code class="des__paired-key-value">{{ weakKeyResult.pairedKey }}</code>
                  <button class="des__btn des__btn--sm" @click="copyToClipboard(weakKeyResult.pairedKey)">
                    <Icon name="ph:copy-fill" />
                    Копировать
                  </button>
                </div>
                
                <div v-if="weakKeyDemo" class="des__demo">
                  <h4>Демонстрация свойства слабого ключа</h4>
                  <div class="des__demo-step">
                    <span>Оригинал:</span>
                    <code>{{ weakKeyDemo.original }}</code>
                  </div>
                  <div class="des__demo-step">
                    <span>После 1-го шифрования:</span>
                    <code>{{ weakKeyDemo.firstEncrypt }}</code>
                  </div>
                  <div class="des__demo-step">
                    <span>После 2-го шифрования:</span>
                    <code>{{ weakKeyDemo.secondEncrypt }}</code>
                  </div>
                  <div class="des__demo-conclusion" :class="{ 'des__demo-conclusion--success': weakKeyDemo.isIdentical }">
                    <Icon :name="weakKeyDemo.isIdentical ? 'ph:check-circle-fill' : 'ph:x-circle-fill'" />
                    {{ weakKeyDemo.isIdentical ? 'E(E(x)) = x — свойство подтверждено!' : 'Свойство не выполняется' }}
                  </div>
                </div>
                
                <!-- Демонстрация полуслабого ключа -->
                <div v-if="semiWeakDemo" class="des__demo">
                  <h4>Демонстрация свойства полуслабого ключа</h4>
                  <div class="des__demo-step">
                    <span>Оригинал:</span>
                    <code>{{ semiWeakDemo.original }}</code>
                  </div>
                  <div class="des__demo-step">
                    <span>Шифрование ключом K1:</span>
                    <code>{{ semiWeakDemo.firstEncrypt }}</code>
                  </div>
                  <div class="des__demo-step">
                    <span>Шифрование ключом K2:</span>
                    <code>{{ semiWeakDemo.secondEncrypt }}</code>
                  </div>
                  <div class="des__demo-conclusion" :class="{ 'des__demo-conclusion--success': semiWeakDemo.isIdentical }">
                    <Icon :name="semiWeakDemo.isIdentical ? 'ph:check-circle-fill' : 'ph:x-circle-fill'" />
                    {{ semiWeakDemo.isIdentical ? 'E_K2(E_K1(x)) = x — свойство подтверждено!' : 'Свойство не выполняется' }}
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Tables -->
            <div class="des__tables">
              <div class="des__table-section">
                <h4>Слабые ключи DES</h4>
                <table class="des__table">
                  <thead>
                    <tr>
                      <th>№</th>
                      <th>Ключ (HEX)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(key, i) in WEAK_KEYS" :key="key">
                      <td>{{ i + 1 }}</td>
                      <td><code>{{ key }}</code></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div class="des__table-section">
                <h4>Полуслабые ключи DES (пары)</h4>
                <table class="des__table">
                  <thead>
                    <tr>
                      <th>№</th>
                      <th>Ключ K1</th>
                      <th>Ключ K2</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="i in 6" :key="i">
                      <td>{{ i }}</td>
                      <td><code>{{ SEMI_WEAK_KEYS[(i-1)*2] }}</code></td>
                      <td><code>{{ SEMI_WEAK_KEYS[(i-1)*2+1] }}</code></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>
          
          <!-- Tab: Compression -->
          <section v-if="activeTab === 'compression'" class="des__section">
            <div class="des__panel">
              <div class="des__panel-content">
                <p class="des__description">
                  <strong>Анализ сжатия</strong> — сравнение степени сжатия открытого текста и шифротекста.
                  Хороший шифр должен давать данные, близкие к случайным, которые плохо сжимаются.
                </p>
                
                <div class="des__field">
                  <label class="des__label">Текст для анализа</label>
                  <textarea v-model="compressionText" class="des__textarea" rows="3" placeholder="Введите текст с повторяющимися символами..."></textarea>
                </div>
                
                <div class="des__field">
                  <label class="des__label">Ключ</label>
                  <input v-model="compressionKey" type="text" class="des__input des__input--mono" maxlength="16" />
                </div>
                
                <button class="des__btn des__btn--primary" @click="analyzeCompressionRatio">
                  <Icon name="ph:file-zip-fill" />
                  Анализиловать
                </button>
              </div>
            </div>
            
            <div v-if="compressionError" class="des__alert">
              <Icon name="ph:warning-fill" />
              {{ compressionError }}
            </div>
            
            <div v-if="compressionResult" class="des__compression-result">
              <div class="des__result-card">
                <h3>Результаты сжатия</h3>
                
                <div class="des__compression-compare">
                  <div class="des__compression-item">
                    <h4>Открытый текст</h4>
                    <div class="des__compression-stat">
                      <span>Размер:</span>
                      <strong>{{ compressionResult.originalSize }} байт</strong>
                    </div>
                    <div class="des__compression-stat">
                      <span>Сжатый:</span>
                      <strong>{{ compressionResult.originalCompressed }} байт</strong>
                    </div>
                    <div class="des__compression-stat">
                      <span>Коэффициент:</span>
                      <strong>{{ (compressionResult.originalRatio * 100).toFixed(1) }}%</strong>
                    </div>
                  </div>
                  
                  <div class="des__compression-item">
                    <h4>Шифротекст</h4>
                    <div class="des__compression-stat">
                      <span>Размер:</span>
                      <strong>{{ compressionResult.encryptedSize }} байт</strong>
                    </div>
                    <div class="des__compression-stat">
                      <span>Сжатый:</span>
                      <strong>{{ compressionResult.encryptedCompressed }} байт</strong>
                    </div>
                    <div class="des__compression-stat">
                      <span>Коэффициент:</span>
                      <strong>{{ (compressionResult.encryptedRatio * 100).toFixed(1) }}%</strong>
                    </div>
                  </div>
                </div>
                
                <div class="des__compression-conclusion">
                  <Icon name="ph:info-fill" />
                  <p>
                    Открытый текст сжимается до <strong>{{ (compressionResult.originalRatio * 100).toFixed(1) }}%</strong>,
                    а шифротекст до <strong>{{ (compressionResult.encryptedRatio * 100).toFixed(1) }}%</strong>.
                    {{ compressionResult.encryptedRatio > compressionResult.originalRatio ? 
                      'Шифротекст сжимается хуже, что говорит о хорошем качестве шифрования.' :
                      'Шифротекст сжимается лучше оригинала — возможно, текст уже был случайным.' }}
                  </p>
                </div>
              </div>
            </div>
          </section>
          
          <!-- Tab: Speed -->
          <section v-if="activeTab === 'speed'" class="des__section">
            <div class="des__panel">
              <div class="des__panel-content">
                <p class="des__description">
                  <strong>Измерение скорости</strong> — оценка производительности операций шифрования и дешифрования DES.
                </p>
                
                <div class="des__field-row">
                  <div class="des__field">
                    <label class="des__label">Размер данных (байт)</label>
                    <input v-model.number="speedDataSize" type="number" min="64" max="65536" class="des__input" />
                  </div>
                  
                  <div class="des__field">
                    <label class="des__label">Итераций</label>
                    <input v-model.number="speedIterations" type="number" min="10" max="1000" class="des__input" />
                  </div>
                </div>
                
                <div class="des__field">
                  <label class="des__label">Ключ</label>
                  <input v-model="speedKey" type="text" class="des__input des__input--mono" maxlength="16" />
                </div>
                
                <button 
                  class="des__btn des__btn--primary" 
                  :disabled="speedRunning"
                  @click="measureDESSpeed"
                >
                  <Icon :name="speedRunning ? 'ph:spinner' : 'ph:timer-fill'" :class="{ 'animate-spin': speedRunning }" />
                  {{ speedRunning ? 'Измерение...' : 'Измерить скорость' }}
                </button>
              </div>
            </div>
            
            <div v-if="speedError" class="des__alert">
              <Icon name="ph:warning-fill" />
              {{ speedError }}
            </div>
            
            <div v-if="speedResult" class="des__speed-result">
              <div class="des__result-card">
                <h3>Результаты измерения</h3>
                
                <div class="des__speed-stats">
                  <div class="des__speed-stat">
                    <Icon name="ph:lock-simple-fill" />
                    <span class="des__speed-label">Шифрование</span>
                    <span class="des__speed-value">{{ speedResult.encryptTime.toFixed(3) }} мс</span>
                  </div>
                  
                  <div class="des__speed-stat">
                    <Icon name="ph:lock-simple-open-fill" />
                    <span class="des__speed-label">Дешифрование</span>
                    <span class="des__speed-value">{{ speedResult.decryptTime.toFixed(3) }} мс</span>
                  </div>
                  
                  <div class="des__speed-stat des__speed-stat--main">
                    <Icon name="ph:rocket-fill" />
                    <span class="des__speed-label">Пропускная способность</span>
                    <span class="des__speed-value">{{ (speedResult.throughput / 1024).toFixed(2) }} КБ/с</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          <!-- Algorithm info -->
          <section class="des__about">
            <div class="des__about-header">
              <Icon name="ph:info-fill" />
              <h3>Об алгоритме DES</h3>
            </div>
            <p class="des__about-text">
              DES (Data Encryption Standard) — симметричный блочный алгоритм шифрования, принятый 
              в качестве стандарта в 1977 году. Использует сеть Фейстеля с 16 раундами, 
              64-битный блок и 56-битный ключ (64 бита с битами чётности).
            </p>
            <div class="des__formulas">
              <div class="des__formula">
                <span class="des__formula-label">Раунд Фейстеля:</span>
                <code>L[i] = R[i-1], R[i] = L[i-1] ⊕ F(R[i-1], K[i])</code>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
    
    <Download 
      title="Отчет_лабораторная_работа_3.docx"
      download="Отчет_лабораторная_работа_3.docx"
    />
    
    <footer class="lab-footer">
      <div class="container">
        <p>Адодин Егор | ИТБД-124 | РГУ им. А.Н. Косыгина | 2026</p>
      </div>
    </footer>
  </div>
</template>

<style lang="scss">
// Reuse lab-page styles from lab 1/2
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

// DES specific styles
.des {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  
  // Tabs
  &__tabs {
    display: flex;
    flex-wrap: wrap;
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
  }
  
  &__description {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    line-height: 1.6;
    
    strong {
      color: var(--color-text-primary);
    }
  }
  
  // Fields
  &__field {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }
  
  &__field-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-md);
    
    @media (max-width: 480px) {
      grid-template-columns: 1fr;
    }
  }
  
  &__label {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: 0.813rem;
    font-weight: 500;
    color: var(--color-text-secondary);
    
    .iconify {
      color: var(--color-accent);
    }
  }
  
  &__key-row {
    display: flex;
    gap: var(--spacing-sm);
  }
  
  &__input {
    flex: 1;
    padding: 10px var(--spacing-md);
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-glass-border);
    border-radius: var(--radius-md);
    color: var(--color-text-primary);
    font-size: 0.875rem;
    transition: all var(--transition-normal);
    
    &:focus {
      border-color: var(--color-accent);
      box-shadow: 0 0 0 3px var(--color-accent-muted);
    }
    
    &--mono {
      font-family: var(--font-mono);
      text-transform: uppercase;
    }
    
    &--error {
      border-color: var(--color-error);
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
    font-family: var(--font-mono);
    font-size: 0.875rem;
    resize: vertical;
    
    &:focus {
      border-color: var(--color-accent);
    }
    
    &--result {
      background: var(--color-bg-secondary);
    }
  }
  
  &__error-hint {
    font-size: 0.75rem;
    color: var(--color-error);
  }
  
  // Toggle group
  &__toggle-group {
    display: flex;
    gap: var(--spacing-xs);
  }
  
  &__toggle-btn {
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-glass-border);
    border-radius: var(--radius-md);
    color: var(--color-text-secondary);
    font-size: 0.813rem;
    cursor: pointer;
    transition: all var(--transition-normal);
    
    &--active {
      background: var(--color-accent-muted);
      border-color: var(--color-accent);
      color: var(--color-accent);
    }
  }
  
  // Actions & Buttons
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
      
      &:hover:not(:disabled) {
        border-color: var(--color-glass-border-hover);
      }
    }
    
    &--small {
      padding: var(--spacing-xs) var(--spacing-sm);
      font-size: 0.75rem;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: var(--color-text-primary);
      
      &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 255, 255, 0.3);
      }
    }
    
    &--accent {
      background: linear-gradient(135deg, rgba(34, 211, 238, 0.3), rgba(168, 85, 247, 0.3));
      border: 1px solid rgba(34, 211, 238, 0.5);
      color: #fff;
      
      &:hover:not(:disabled) {
        background: linear-gradient(135deg, rgba(34, 211, 238, 0.4), rgba(168, 85, 247, 0.4));
        border-color: rgba(34, 211, 238, 0.6);
      }
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
  
  // Quick actions after encryption
  &__quick-actions {
    margin-top: var(--spacing-md);
    padding: var(--spacing-md);
    background: var(--color-bg-tertiary);
    border-radius: var(--radius-md);
    border: 1px solid var(--color-glass-border);
  }
  
  &__key-display {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    flex-wrap: wrap;
    margin-bottom: var(--spacing-sm);
  }
  
  &__key-label {
    font-size: 0.813rem;
    color: var(--color-text-muted);
  }
  
  &__key-value {
    font-family: var(--font-mono);
    font-size: 0.875rem;
    color: var(--color-accent);
    background: var(--color-bg-secondary);
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--radius-sm);
  }
  
  &__action-buttons {
    display: flex;
    gap: var(--spacing-sm);
    flex-wrap: wrap;
  }
  
  // Workspace
  &__workspace {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-lg);
    
    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }
  
  &__box {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }
  
  &__box-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    span {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      font-size: 0.813rem;
      font-weight: 500;
      color: var(--color-text-secondary);
    }
  }
  
  &__box-action {
    padding: var(--spacing-xs);
    background: transparent;
    border: none;
    color: var(--color-text-muted);
    cursor: pointer;
    
    &:hover:not(:disabled) {
      color: var(--color-accent);
    }
  }
  
  // Result info
  &__result-info {
    background: var(--color-glass);
    border: 1px solid var(--color-glass-border);
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
  }
  
  &__stat-row {
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
  
  &__blocks {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: var(--spacing-sm);
    margin-top: var(--spacing-md);
  }
  
  &__block-card {
    padding: var(--spacing-md);
    background: var(--color-bg-tertiary);
    border-radius: var(--radius-md);
  }
  
  &__block-header {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-accent);
    margin-bottom: var(--spacing-sm);
  }
  
  &__block-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    
    span {
      color: var(--color-text-muted);
    }
    
    code {
      font-family: var(--font-mono);
      color: var(--color-text-primary);
    }
  }
  
  // Result cards
  &__result-card {
    background: var(--color-glass);
    border: 1px solid var(--color-glass-border);
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
    
    h3, h4 {
      font-size: 1rem;
      color: var(--color-text-primary);
      margin-bottom: var(--spacing-md);
    }
    
    &--weak {
      border-color: var(--color-error);
      background: rgba(239, 68, 68, 0.05);
    }
    
    &--semi {
      border-color: var(--color-warning);
      background: rgba(251, 191, 36, 0.05);
    }
  }
  
  &__stat-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
  }
  
  &__stat-item {
    text-align: center;
  }
  
  &__stat-value--large {
    font-size: 1.5rem;
    font-family: var(--font-mono);
  }
  
  &__stat-value--good {
    color: var(--color-success);
  }
  
  &__stat-value--bad {
    color: var(--color-error);
  }
  
  // Compare
  &__compare {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-lg);
  }
  
  &__compare-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    flex-wrap: wrap;
    font-size: 0.813rem;
    
    code {
      font-family: var(--font-mono);
      padding: 2px 6px;
      background: var(--color-bg-tertiary);
      border-radius: var(--radius-sm);
    }
  }
  
  &__compare-label {
    color: var(--color-text-muted);
    min-width: 100px;
  }
  
  &__compare-arrow {
    color: var(--color-accent);
  }
  
  // Rounds chart
  &__rounds-chart {
    display: flex;
    align-items: flex-end;
    gap: 4px;
    height: 100px;
    padding: var(--spacing-md) 0;
  }
  
  &__round-bar {
    flex: 1;
    background: var(--color-accent);
    border-radius: var(--radius-sm) var(--radius-sm) 0 0;
    position: relative;
    min-height: 4px;
    cursor: pointer;
    transition: background var(--transition-normal);
    
    &:hover {
      background: var(--color-accent-soft);
    }
  }
  
  &__round-label {
    position: absolute;
    bottom: -20px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 0.625rem;
    color: var(--color-text-muted);
  }
  
  // Weak keys
  &__result-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) var(--spacing-sm);
    background: var(--color-warning);
    color: var(--color-bg-primary);
    border-radius: var(--radius-md);
    font-size: 0.813rem;
    font-weight: 600;
    margin-bottom: var(--spacing-md);
  }
  
  &__demo {
    margin-top: var(--spacing-lg);
    padding-top: var(--spacing-lg);
    border-top: 1px solid var(--color-glass-border);
    
    h4 {
      margin-bottom: var(--spacing-md);
    }
  }
  
  &__demo-step {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-sm);
    font-size: 0.875rem;
    
    span {
      color: var(--color-text-muted);
      min-width: 180px;
    }
    
    code {
      font-family: var(--font-mono);
      padding: 4px 8px;
      background: var(--color-bg-tertiary);
      border-radius: var(--radius-sm);
    }
  }
  
  &__demo-conclusion {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin-top: var(--spacing-md);
    padding: var(--spacing-md);
    background: rgba(239, 68, 68, 0.1);
    border-radius: var(--radius-md);
    color: var(--color-error);
    font-weight: 500;
    
    &--success {
      background: rgba(52, 211, 153, 0.1);
      color: var(--color-success);
    }
  }
  
  // Paired key display
  &__paired-key {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--spacing-sm);
    margin-top: var(--spacing-md);
    padding: var(--spacing-md);
    background: rgba(34, 211, 238, 0.1);
    border: 1px solid rgba(34, 211, 238, 0.3);
    border-radius: var(--radius-md);
  }
  
  &__paired-key-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    color: #22d3ee;
    font-weight: 500;
    
    svg {
      width: 18px;
      height: 18px;
    }
  }
  
  &__paired-key-value {
    flex: 1;
    padding: 6px 12px;
    background: var(--color-bg-tertiary);
    border-radius: var(--radius-sm);
    font-family: var(--font-mono);
    font-size: 0.875rem;
    color: #22d3ee;
    min-width: 200px;
  }
  
  // Tables
  &__tables {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-lg);
    
    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }
  
  &__table-section {
    h4 {
      font-size: 0.875rem;
      color: var(--color-text-primary);
      margin-bottom: var(--spacing-sm);
    }
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
    }
    
    code {
      font-family: var(--font-mono);
    }
  }
  
  // Compression
  &__compression-compare {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-lg);
    
    @media (max-width: 480px) {
      grid-template-columns: 1fr;
    }
  }
  
  &__compression-item {
    padding: var(--spacing-md);
    background: var(--color-bg-tertiary);
    border-radius: var(--radius-md);
    
    h4 {
      font-size: 0.875rem;
      margin-bottom: var(--spacing-sm);
    }
  }
  
  &__compression-stat {
    display: flex;
    justify-content: space-between;
    font-size: 0.813rem;
    padding: var(--spacing-xs) 0;
    
    span {
      color: var(--color-text-muted);
    }
  }
  
  &__compression-conclusion {
    display: flex;
    gap: var(--spacing-sm);
    margin-top: var(--spacing-lg);
    padding: var(--spacing-md);
    background: var(--color-accent-muted);
    border-radius: var(--radius-md);
    font-size: 0.875rem;
    
    .iconify {
      color: var(--color-accent);
      flex-shrink: 0;
    }
    
    p {
      color: var(--color-text-secondary);
    }
  }
  
  // Speed
  &__speed-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: var(--spacing-md);
  }
  
  &__speed-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-lg);
    background: var(--color-bg-tertiary);
    border-radius: var(--radius-md);
    
    .iconify {
      font-size: 1.5rem;
      color: var(--color-accent);
    }
    
    &--main {
      background: var(--color-accent-muted);
    }
  }
  
  &__speed-label {
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }
  
  &__speed-value {
    font-size: 1.25rem;
    font-weight: 700;
    font-family: var(--font-mono);
    color: var(--color-text-primary);
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
    min-width: 150px;
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

// Animation
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
