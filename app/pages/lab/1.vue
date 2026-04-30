<script setup lang="ts">
import { 
  encryptCaesar, 
  decryptCaesar, 
  generateAlphabetTable, 
  validateShift, 
  getTextStats,
  generateLetterMappingTable,
  type AlphabetTableItem,
  type TextStats,
  type LetterMapping
} from '~/labs/lab1-caesar'
import Download from '../../components/download.vue'

// State
const inputText = ref('')
const outputText = ref('')
const shiftValue = ref('4')
const errorMessage = ref('')
const isProcessing = ref(false)
const showTable = ref(false)
const showLetterTable = ref(true)  // Таблица побуквенного шифрования
const copied = ref(false)
const letterMappings = ref<LetterMapping[]>([])  // Данные для таблицы побуквенного шифрования

// Generate alphabet table
const alphabetTable = computed<AlphabetTableItem[]>(() => generateAlphabetTable())

// Input stats
const inputStats = computed<TextStats>(() => getTextStats(inputText.value))

// Validate shift
const shiftValidation = computed(() => validateShift(shiftValue.value))

// Encrypt handler
function handleEncrypt() {
  errorMessage.value = ''
  letterMappings.value = []
  
  if (!inputText.value.trim()) {
    errorMessage.value = 'Введите текст для шифрования'
    return
  }
  
  // Проверяем валидность сдвига
  if (!shiftValidation.value.valid) {
    errorMessage.value = shiftValidation.value.error || 'Неверное значение сдвига'
    return
  }
  
  try {
    isProcessing.value = true
    // Выполняем шифрование
    outputText.value = encryptCaesar(inputText.value, shiftValidation.value.shift)
    // Генерируем таблицу побуквенного преобразования
    letterMappings.value = generateLetterMappingTable(
      inputText.value, 
      outputText.value, 
      shiftValidation.value.shift
    )
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Произошла ошибка при шифровании'
  } finally {
    setTimeout(() => {
      isProcessing.value = false
    }, 150)
  }
}

// Decrypt handler
function handleDecrypt() {
  errorMessage.value = ''
  letterMappings.value = []
  
  if (!inputText.value.trim()) {
    errorMessage.value = 'Введите текст для дешифрования'
    return
  }
  
  // Проверяем валидность сдвига
  if (!shiftValidation.value.valid) {
    errorMessage.value = shiftValidation.value.error || 'Неверное значение сдвига'
    return
  }
  
  try {
    isProcessing.value = true
    // Выполняем дешифрование
    outputText.value = decryptCaesar(inputText.value, shiftValidation.value.shift)
    // Генерируем таблицу побуквенного преобразования
    letterMappings.value = generateLetterMappingTable(
      inputText.value, 
      outputText.value, 
      shiftValidation.value.shift
    )
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Произошла ошибка при дешифровании'
  } finally {
    setTimeout(() => {
      isProcessing.value = false
    }, 150)
  }
}

// Clear all
function handleClear() {
  inputText.value = ''
  outputText.value = ''
  errorMessage.value = ''
  letterMappings.value = []  // Очищаем таблицу побуквенного шифрования
}

// Copy to clipboard
async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = text
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  }
}

// Swap texts
function swapTexts() {
  const temp = inputText.value
  inputText.value = outputText.value
  outputText.value = temp
}
</script>

<template>
  <div class="lab-page">
    <!-- Ambient background -->
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
            <span class="lab-header__num">01</span>
            <div class="lab-header__info">
              <span class="lab-header__label">Лабораторная работа</span>
              <h1 class="lab-header__title">Шифр Цезаря</h1>
            </div>
          </div>
        </div>
      </div>
    </header>
    
    <!-- Main content -->
    <main class="lab-main">
      <div class="container">
        <div class="caesar">
          <!-- Control panel -->
          <section 
            v-motion
            :initial="{ opacity: 0, y: 20 }"
            :enter="{ opacity: 1, y: 0, transition: { duration: 400 } }"
            class="caesar__panel"
          >
            <div class="caesar__panel-glow"></div>
            <div class="caesar__panel-content">
              <div class="caesar__shift">
                <label class="caesar__label">
                  <Icon name="ph:key-fill" />
                  Ключ (сдвиг)
                </label>
                <div class="caesar__shift-input-wrap">
                  <input
                    v-model="shiftValue"
                    type="number"
                    min="0"
                    max="33"
                    class="caesar__shift-input"
                    :class="{ 'caesar__shift-input--error': shiftValidation.error && !shiftValidation.valid }"
                  />
                  <span class="caesar__shift-hint">0–33</span>
                </div>
                <p v-if="shiftValidation.error" class="caesar__error-text">
                  {{ shiftValidation.error }}
                </p>
              </div>
              
              <div class="caesar__actions">
                <button 
                  class="caesar__btn caesar__btn--primary" 
                  :disabled="isProcessing"
                  @click="handleEncrypt"
                >
                  <Icon name="ph:lock-simple-fill" />
                  <span>Зашифровать</span>
                </button>
                <button 
                  class="caesar__btn caesar__btn--secondary" 
                  :disabled="isProcessing"
                  @click="handleDecrypt"
                >
                  <Icon name="ph:lock-simple-open-fill" />
                  <span>Расшифровать</span>
                </button>
                <button 
                  class="caesar__btn caesar__btn--icon" 
                  title="Поменять местами"
                  :disabled="!outputText"
                  @click="swapTexts"
                >
                  <Icon name="ph:arrows-left-right-bold" />
                </button>
                <button 
                  class="caesar__btn caesar__btn--icon caesar__btn--danger" 
                  title="Очистить"
                  @click="handleClear"
                >
                  <Icon name="ph:trash-fill" />
                </button>
              </div>
            </div>
          </section>
          
          <!-- Error message -->
          <div 
            v-if="errorMessage" 
            v-motion
            :initial="{ opacity: 0, y: -10 }"
            :enter="{ opacity: 1, y: 0 }"
            class="caesar__alert"
          >
            <Icon name="ph:warning-fill" />
            <span>{{ errorMessage }}</span>
          </div>
          
          <!-- Text areas -->
          <section class="caesar__workspace">
            <div 
              v-motion
              :initial="{ opacity: 0, x: -15 }"
              :enter="{ opacity: 1, x: 0, transition: { duration: 400, delay: 100 } }"
              class="caesar__box"
            >
              <div class="caesar__box-header">
                <span class="caesar__box-title">
                  <Icon name="ph:text-aa-fill" />
                  Исходный текст
                </span>
                <button 
                  class="caesar__box-action" 
                  title="Копировать"
                  :disabled="!inputText"
                  @click="copyToClipboard(inputText)"
                >
                  <Icon name="ph:copy" />
                </button>
              </div>
              <textarea
                v-model="inputText"
                class="caesar__textarea"
                placeholder="Введите текст на кириллице..."
                rows="6"
              ></textarea>
              <div class="caesar__box-footer">
                <span class="caesar__stat">
                  <Icon name="ph:text-align-left" />
                  {{ inputStats.totalChars }}
                </span>
                <span class="caesar__stat caesar__stat--accent">
                  <Icon name="ph:alphabet-cyrillic" />
                  {{ inputStats.cyrillicChars }}
                </span>
              </div>
            </div>
            
            <div 
              v-motion
              :initial="{ opacity: 0, x: 15 }"
              :enter="{ opacity: 1, x: 0, transition: { duration: 400, delay: 150 } }"
              class="caesar__box caesar__box--result"
            >
              <div class="caesar__box-header">
                <span class="caesar__box-title">
                  <Icon name="ph:shield-check-fill" />
                  Результат
                </span>
                <button 
                  class="caesar__box-action" 
                  title="Копировать"
                  :disabled="!outputText"
                  @click="copyToClipboard(outputText)"
                >
                  <Icon :name="copied ? 'ph:check-bold' : 'ph:copy'" />
                </button>
              </div>
              <textarea
                v-model="outputText"
                class="caesar__textarea caesar__textarea--result"
                placeholder="Результат появится здесь..."
                rows="6"
                readonly
              ></textarea>
              <div class="caesar__box-footer">
                <span class="caesar__stat">
                  <Icon name="ph:text-align-left" />
                  {{ outputText.length }}
                </span>
              </div>
            </div>
          </section>
          
          <!-- Letter-by-letter encryption table -->
          <section 
            v-if="letterMappings.length > 0"
            v-motion
            :initial="{ opacity: 0, y: 20 }"
            :visible="{ opacity: 1, y: 0, transition: { duration: 400 } }"
            class="caesar__section"
          >
            <button class="caesar__toggle" @click="showLetterTable = !showLetterTable">
              <Icon name="ph:list-numbers-fill" />
              <span>Побуквенное преобразование ({{ letterMappings.length }} символов)</span>
              <Icon 
                :name="showLetterTable ? 'ph:caret-up-bold' : 'ph:caret-down-bold'" 
                class="caesar__toggle-arrow"
              />
            </button>
            
            <Transition name="slide">
              <div v-if="showLetterTable" class="caesar__table-wrap">
                <table class="caesar__table caesar__table--mapping">
                  <thead>
                    <tr>
                      <th>№</th>
                      <th>Исходная</th>
                      <th>Результат</th>
                      <th>Позиция (исх.)</th>
                      <th>Позиция (рез.)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="mapping in letterMappings" :key="mapping.index">
                      <td class="caesar__table-num">{{ mapping.index }}</td>
                      <td class="caesar__table-char caesar__table-char--original">{{ mapping.originalChar }}</td>
                      <td class="caesar__table-char caesar__table-char--result">{{ mapping.encryptedChar }}</td>
                      <td class="caesar__table-code">{{ mapping.originalCode || '—' }}</td>
                      <td class="caesar__table-code">{{ mapping.encryptedCode || '—' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Transition>
          </section>
          
          <!-- Alphabet table toggle -->
          <section 
            v-motion
            :initial="{ opacity: 0, y: 20 }"
            :visible="{ opacity: 1, y: 0, transition: { duration: 400 } }"
            class="caesar__section"
          >
            <button class="caesar__toggle" @click="showTable = !showTable">
              <Icon name="ph:table-fill" />
              <span>Таблица кириллического алфавита</span>
              <Icon 
                :name="showTable ? 'ph:caret-up-bold' : 'ph:caret-down-bold'" 
                class="caesar__toggle-arrow"
              />
            </button>
            
            <Transition name="slide">
              <div v-if="showTable" class="caesar__table-wrap">
                <table class="caesar__table">
                  <thead>
                    <tr>
                      <th>№</th>
                      <th>Верх.</th>
                      <th>Нижн.</th>
                      <th>Код</th>
                      <th>Код</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in alphabetTable" :key="item.index">
                      <td class="caesar__table-num">{{ item.index }}</td>
                      <td class="caesar__table-char">{{ item.upperChar }}</td>
                      <td class="caesar__table-char">{{ item.lowerChar }}</td>
                      <td class="caesar__table-code">{{ item.upperCode }}</td>
                      <td class="caesar__table-code">{{ item.lowerCode }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Transition>
          </section>
          
          <!-- Algorithm info -->
          <section 
            v-motion
            :initial="{ opacity: 0, y: 20 }"
            :visible="{ opacity: 1, y: 0, transition: { duration: 400 } }"
            class="caesar__about"
          >
            <div class="caesar__about-header">
              <Icon name="ph:info-fill" />
              <h3>Об алгоритме</h3>
            </div>
            <p class="caesar__about-text">
              Шифр Цезаря — один из древнейших методов шифрования, использовавшийся Юлием Цезарем 
              для секретной переписки. Каждая буква исходного текста заменяется буквой, 
              находящейся на фиксированном числе позиций в алфавите.
            </p>
            <div class="caesar__formulas">
              <div class="caesar__formula">
                <span class="caesar__formula-label">Шифрование:</span>
                <code>E(x) = (x + n) mod 33</code>
              </div>
              <div class="caesar__formula">
                <span class="caesar__formula-label">Дешифрование:</span>
                <code>D(x) = (x - n) mod 33</code>
              </div>
            </div>
            <p class="caesar__about-note">
              где <strong>x</strong> — позиция буквы, <strong>n</strong> — сдвиг, <strong>33</strong> — размер алфавита
            </p>
          </section>
        </div>
      </div>
    </main>
    

    <Download 
      title="Отчет_лабораторная_работа_1.docx"
      download="Отчет_лабораторная_работа_1.docx"
    />
    
    <!-- Footer -->
    <footer class="lab-footer">
      <div class="container">
        <p>Адодин Егор | ИТБД-124 | РГУ им. А.Н. Косыгина | 2026</p>
      </div>
    </footer>
  </div>
</template>

<style lang="scss">
// Transition
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  max-height: 0;
}

.slide-enter-to,
.slide-leave-from {
  max-height: 400px;
}

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
    background: 
      radial-gradient(ellipse 60% 40% at 50% 0%, rgba(34, 211, 238, 0.06), transparent 70%);
    pointer-events: none;
    z-index: 0;
  }
}

// Lab header
.lab-header {
  position: sticky;
  top: 0;
  z-index: 100;
  padding: var(--spacing-md) 0;
  background: var(--color-glass-strong);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--color-glass-border);
  
  &__row {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    flex-wrap: wrap;
    
    @media (min-width: 768px) {
      gap: var(--spacing-lg);
      flex-wrap: nowrap;
    }
  }
  
  &__back {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-glass);
    backdrop-filter: blur(10px);
    border: 1px solid var(--color-glass-border);
    border-radius: var(--radius-md);
    color: var(--color-text-secondary);
    font-size: 0.875rem;
    transition: all var(--transition-normal);
    flex-shrink: 0;
    
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
    min-width: 0;
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

// Lab main
.lab-main {
  position: relative;
  z-index: 1;
  flex: 1;
  padding: var(--spacing-xl) 0;
}

// Caesar component
.caesar {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  
  // Panel
  &__panel {
    position: relative;
    border-radius: var(--radius-lg);
    overflow: hidden;
  }
  
  &__panel-glow {
    position: absolute;
    inset: -1px;
    background: linear-gradient(135deg, var(--color-accent) 0%, transparent 60%);
    opacity: 0.08;
    border-radius: inherit;
    pointer-events: none;
  }
  
  &__panel-content {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: var(--spacing-lg);
    padding: var(--spacing-lg);
    background: var(--color-glass);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid var(--color-glass-border);
    border-radius: inherit;
  }
  
  &__shift {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
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
  
  &__shift-input-wrap {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }
  
  &__shift-input {
    width: 80px;
    padding: 10px var(--spacing-md);
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-glass-border);
    border-radius: var(--radius-md);
    color: var(--color-text-primary);
    font-family: var(--font-mono);
    font-size: 1rem;
    font-weight: 600;
    transition: all var(--transition-normal);
    
    &:focus {
      border-color: var(--color-accent);
      box-shadow: 0 0 0 3px var(--color-accent-muted);
    }
    
    &--error {
      border-color: var(--color-error);
    }
    
    &::-webkit-inner-spin-button,
    &::-webkit-outer-spin-button {
      -webkit-appearance: none;
    }
  }
  
  &__shift-hint {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    font-family: var(--font-mono);
  }
  
  &__error-text {
    font-size: 0.75rem;
    color: var(--color-error);
  }
  
  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-sm);
    margin-left: auto;
    
    @media (max-width: 600px) {
      margin-left: 0;
      width: 100%;
    }
  }
  
  &__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-xs);
    padding: 10px var(--spacing-md);
    border-radius: var(--radius-md);
    font-size: 0.875rem;
    font-weight: 500;
    transition: all var(--transition-normal);
    
    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    
    &--primary {
      background: var(--color-accent);
      color: var(--color-bg-primary);
      
      &:hover:not(:disabled) {
        filter: brightness(1.1);
        box-shadow: 0 0 20px var(--color-accent-glow);
      }
    }
    
    &--secondary {
      background: var(--color-accent-muted);
      border: 1px solid var(--color-border-accent);
      color: var(--color-accent);
      
      &:hover:not(:disabled) {
        background: rgba(34, 211, 238, 0.2);
      }
    }
    
    &--icon {
      padding: 10px;
      background: var(--color-glass);
      border: 1px solid var(--color-glass-border);
      color: var(--color-text-secondary);
      
      &:hover:not(:disabled) {
        border-color: var(--color-glass-border-hover);
        color: var(--color-text-primary);
      }
    }
    
    &--danger:hover:not(:disabled) {
      border-color: var(--color-error);
      color: var(--color-error);
    }
    
    @media (max-width: 600px) {
      &--primary,
      &--secondary {
        flex: 1;
      }
    }
  }
  
  // Alert
  &__alert {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-md);
    background: rgba(248, 113, 113, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(248, 113, 113, 0.3);
    border-radius: var(--radius-md);
    color: var(--color-error);
    font-size: 0.875rem;
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
    background: var(--color-glass);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid var(--color-glass-border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    transition: border-color var(--transition-normal);
    
    &:focus-within {
      border-color: var(--color-glass-border-hover);
    }
    
    &--result {
      .caesar__textarea {
        color: var(--color-success);
      }
    }
  }
  
  &__box-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-sm) var(--spacing-md);
    background: rgba(0, 0, 0, 0.2);
    border-bottom: 1px solid var(--color-border);
  }
  
  &__box-title {
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
  
  &__box-action {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-glass-border);
    border-radius: var(--radius-sm);
    color: var(--color-text-muted);
    transition: all var(--transition-fast);
    
    &:hover:not(:disabled) {
      color: var(--color-accent);
      border-color: var(--color-accent);
    }
    
    &:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
  }
  
  &__textarea {
    flex: 1;
    min-height: 150px;
    padding: var(--spacing-md);
    background: transparent;
    color: var(--color-text-primary);
    font-family: var(--font-mono);
    font-size: 0.938rem;
    line-height: 1.7;
    resize: vertical;
    
    &::placeholder {
      color: var(--color-text-muted);
    }
    
    &--result {
      background: rgba(52, 211, 153, 0.03);
    }
  }
  
  &__box-footer {
    display: flex;
    gap: var(--spacing-lg);
    padding: var(--spacing-sm) var(--spacing-md);
    background: rgba(0, 0, 0, 0.2);
    border-top: 1px solid var(--color-border);
  }
  
  &__stat {
    display: flex;
    align-items: center;
    gap: 4px;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--color-text-muted);
    
    &--accent {
      color: var(--color-accent);
    }
  }
  
  // Section
  &__section {
    background: var(--color-glass);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid var(--color-glass-border);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }
  
  // Toggle
  &__toggle {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    width: 100%;
    padding: var(--spacing-md);
    background: transparent;
    text-align: left;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-primary);
    transition: background var(--transition-fast);
    
    .iconify:first-child {
      color: var(--color-accent);
    }
    
    &:hover {
      background: rgba(255, 255, 255, 0.03);
    }
  }
  
  &__toggle-arrow {
    margin-left: auto;
    color: var(--color-text-muted);
  }
  
  // Table
  &__table-wrap {
    max-height: 350px;
    overflow: auto;
    border-top: 1px solid var(--color-border);
  }
  
  &__table {
    width: 100%;
    border-collapse: collapse;
    font-family: var(--font-mono);
    font-size: 0.813rem;
    
    th, td {
      padding: var(--spacing-sm) var(--spacing-md);
      text-align: center;
      border-bottom: 1px solid var(--color-border);
    }
    
    th {
      position: sticky;
      top: 0;
      background: var(--color-bg-tertiary);
      color: var(--color-text-muted);
      font-weight: 500;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    
    tbody tr {
      transition: background var(--transition-fast);
      
      &:hover {
        background: var(--color-accent-muted);
      }
    }
  }
  
  &__table-num {
    color: var(--color-text-muted);
    font-size: 0.75rem;
  }
  
  &__table-char {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-accent);
    
    // Стили для таблицы побуквенного шифрования
    &--original {
      color: var(--color-text-primary);
    }
    
    &--result {
      color: var(--color-success);
    }
  }
  
  &__table-code {
    color: var(--color-text-secondary);
    font-size: 0.75rem;
  }
  
  // Таблица побуквенного преобразования
  &__table--mapping {
    th:nth-child(4),
    th:nth-child(5),
    td:nth-child(4),
    td:nth-child(5) {
      font-family: var(--font-mono);
    }
  }
  
  // About
  &__about {
    padding: var(--spacing-lg);
    background: var(--color-glass);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid var(--color-glass-border);
    border-radius: var(--radius-lg);
  }
  
  &__about-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-md);
    
    .iconify {
      font-size: 1.125rem;
      color: var(--color-accent);
    }
    
    h3 {
      font-size: 1rem;
      font-weight: 600;
      color: var(--color-text-primary);
    }
  }
  
  &__about-text {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    line-height: 1.7;
    margin-bottom: var(--spacing-md);
  }
  
  &__formulas {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-md);
  }
  
  &__formula {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    
    &-label {
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }
    
    code {
      padding: var(--spacing-xs) var(--spacing-sm);
      background: var(--color-accent-muted);
      border: 1px solid var(--color-border-accent);
      border-radius: var(--radius-sm);
      font-family: var(--font-mono);
      font-size: 0.813rem;
      color: var(--color-accent);
    }
  }
  
  &__about-note {
    font-size: 0.813rem;
    color: var(--color-text-muted);
    
    strong {
      color: var(--color-text-secondary);
    }
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

// Responsive
@media (max-width: 480px) {
  // .lab-header__back span {
  //   display: none;
  // }
  
  // .lab-header__num {
  //   display: none;
  // }
}
</style>
