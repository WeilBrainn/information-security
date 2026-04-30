<script setup lang="ts">
import { 
  generateBBS, 
  validateBBSParams, 
  runAllTests,
  getRandomBBSParams,
  BLUM_PRIMES,
  type BBSParams,
  type GenerationResult,
  type TestResults
} from '~/labs/lab2-prng'

// Состояние параметров генератора
const pValue = ref('11')
const qValue = ref('19')
const seedValue = ref('3')
const lengthValue = ref('10000')

// Результаты генерации
const generationResult = ref<GenerationResult | null>(null)
const testResults = ref<TestResults | null>(null)

// Состояние UI
const errorMessage = ref('')
const isGenerating = ref(false)
const showSteps = ref(false)
const showSequence = ref(false)
const copied = ref(false)

// Валидация параметров в реальном времени
const currentParams = computed<BBSParams>(() => ({
  p: parseInt(pValue.value) || 0,
  q: parseInt(qValue.value) || 0,
  seed: parseInt(seedValue.value) || 0
}))

// Проверяем валидность параметров
const validation = computed(() => validateBBSParams(currentParams.value))

// Вычисляем n = p * q
const nValue = computed(() => currentParams.value.p * currentParams.value.q)

// Генерация последовательности
function handleGenerate() {
  errorMessage.value = ''
  generationResult.value = null
  testResults.value = null
  
  // Проверяем параметры
  if (!validation.value.valid) {
    errorMessage.value = validation.value.errors.join('. ')
    return
  }
  
  // Проверяем длину последовательности
  const length = parseInt(lengthValue.value) || 0
  if (length < 100) {
    errorMessage.value = 'Длина последовательности должна быть не менее 100 бит'
    return
  }
  
  if (length > 100000) {
    errorMessage.value = 'Длина последовательности не должна превышать 100 000 бит'
    return
  }
  
  try {
    isGenerating.value = true
    
    // Генерируем последовательность
    generationResult.value = generateBBS(currentParams.value, length)
    
    // Запускаем тесты на случайность
    testResults.value = runAllTests(generationResult.value.sequence)
    
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Произошла ошибка при генерации'
  } finally {
    setTimeout(() => {
      isGenerating.value = false
    }, 200)
  }
}

// Установить случайные параметры
function setRandomParams() {
  const params = getRandomBBSParams()
  pValue.value = params.p.toString()
  qValue.value = params.q.toString()
  seedValue.value = params.seed.toString()
}

// Копирование последовательности в буфер
async function copySequence() {
  if (!generationResult.value) return
  
  try {
    await navigator.clipboard.writeText(generationResult.value.sequence)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    // Fallback для старых браузеров
    const textarea = document.createElement('textarea')
    textarea.value = generationResult.value.sequence
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
}

// Скачивание последовательности в файл
function downloadSequence() {
  if (!generationResult.value) return
  
  const blob = new Blob([generationResult.value.sequence], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `bbs_sequence_${generationResult.value.length}.txt`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Очистка результатов
function handleClear() {
  generationResult.value = null
  testResults.value = null
  errorMessage.value = ''
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
            <span class="lab-header__num">02</span>
            <div class="lab-header__info">
              <span class="lab-header__label">Лабораторная работа</span>
              <h1 class="lab-header__title">Генерация простых чисел (BBS)</h1>
            </div>
          </div>
        </div>
      </div>
    </header>
    
    <!-- Main content -->
    <main class="lab-main">
      <div class="container">
        <div class="prng">
          <!-- Control panel -->
          <section 
            v-motion
            :initial="{ opacity: 0, y: 20 }"
            :enter="{ opacity: 1, y: 0, transition: { duration: 400 } }"
            class="prng__panel"
          >
            <div class="prng__panel-glow"></div>
            <div class="prng__panel-content">
              <!-- Параметры генератора -->
              <div class="prng__params">
                <h3 class="prng__params-title">
                  <Icon name="ph:gear-fill" />
                  Параметры BBS
                </h3>
                
                <div class="prng__params-grid">
                  <!-- p -->
                  <div class="prng__field">
                    <label class="prng__label">
                      Число p
                      <span class="prng__label-hint">(простое, p ≡ 3 mod 4)</span>
                    </label>
                    <input
                      v-model="pValue"
                      type="number"
                      min="3"
                      class="prng__input"
                      placeholder="11"
                    />
                  </div>
                  
                  <!-- q -->
                  <div class="prng__field">
                    <label class="prng__label">
                      Число q
                      <span class="prng__label-hint">(простое, q ≡ 3 mod 4)</span>
                    </label>
                    <input
                      v-model="qValue"
                      type="number"
                      min="3"
                      class="prng__input"
                      placeholder="19"
                    />
                  </div>
                  
                  <!-- seed -->
                  <div class="prng__field">
                    <label class="prng__label">
                      Seed (x₀)
                      <span class="prng__label-hint">(взаимно прост с n)</span>
                    </label>
                    <input
                      v-model="seedValue"
                      type="number"
                      min="2"
                      class="prng__input"
                      placeholder="3"
                    />
                  </div>
                  
                  <!-- length -->
                  <div class="prng__field">
                    <label class="prng__label">
                      Длина
                      <span class="prng__label-hint">(100 - 100 000 бит)</span>
                    </label>
                    <input
                      v-model="lengthValue"
                      type="number"
                      min="100"
                      max="100000"
                      class="prng__input"
                      placeholder="10000"
                    />
                  </div>
                </div>
                
                <!-- Вычисленное значение n -->
                <div v-if="nValue > 0" class="prng__computed">
                  <span class="prng__computed-label">n = p × q =</span>
                  <span class="prng__computed-value">{{ nValue }}</span>
                </div>
                
                <!-- Ошибки валидации -->
                <div v-if="!validation.valid && validation.errors.length > 0" class="prng__validation-errors">
                  <div v-for="(error, index) in validation.errors" :key="index" class="prng__validation-error">
                    <Icon name="ph:warning-fill" />
                    {{ error }}
                  </div>
                </div>
              </div>
              
              <!-- Кнопки действий -->
              <div class="prng__actions">
                <button 
                  class="prng__btn prng__btn--primary" 
                  :disabled="isGenerating || !validation.valid"
                  @click="handleGenerate"
                >
                  <Icon name="ph:play-fill" />
                  <span>Сгенерировать</span>
                </button>
                
                <button 
                  class="prng__btn prng__btn--secondary" 
                  @click="setRandomParams"
                >
                  <Icon name="ph:shuffle-fill" />
                  <span>Случайные параметры</span>
                </button>
                
                <button 
                  class="prng__btn prng__btn--icon prng__btn--danger" 
                  title="Очистить"
                  :disabled="!generationResult"
                  @click="handleClear"
                >
                  <Icon name="ph:trash-fill" />
                </button>
              </div>
            </div>
          </section>
          
          <!-- Доступные числа Блюма -->
          <section 
            v-motion
            :initial="{ opacity: 0, y: 20 }"
            :visible="{ opacity: 1, y: 0, transition: { duration: 400 } }"
            class="prng__blum-primes"
          >
            <span class="prng__blum-label">
              <Icon name="ph:list-numbers-fill" />
              Доступные числа Блюма (p ≡ 3 mod 4):
            </span>
            <div class="prng__blum-list">
              <span v-for="prime in BLUM_PRIMES" :key="prime" class="prng__blum-item">
                {{ prime }}
              </span>
            </div>
          </section>
          
          <!-- Error message -->
          <div 
            v-if="errorMessage" 
            v-motion
            :initial="{ opacity: 0, y: -10 }"
            :enter="{ opacity: 1, y: 0 }"
            class="prng__alert"
          >
            <Icon name="ph:warning-fill" />
            <span>{{ errorMessage }}</span>
          </div>
          
          <!-- Результаты генерации -->
          <template v-if="generationResult">
            <!-- Информация о генерации -->
            <section 
              v-motion
              :initial="{ opacity: 0, y: 20 }"
              :enter="{ opacity: 1, y: 0, transition: { duration: 400 } }"
              class="prng__result-info"
            >
              <div class="prng__result-header">
                <h3>
                  <Icon name="ph:check-circle-fill" />
                  Последовательность сгенерирована
                </h3>
                <div class="prng__result-actions">
                  <button 
                    class="prng__btn prng__btn--small" 
                    title="Копировать"
                    @click="copySequence"
                  >
                    <Icon :name="copied ? 'ph:check-bold' : 'ph:copy'" />
                    {{ copied ? 'Скопировано' : 'Копировать' }}
                  </button>
                  <button 
                    class="prng__btn prng__btn--small" 
                    title="Скачать"
                    @click="downloadSequence"
                  >
                    <Icon name="ph:download-simple-fill" />
                    Скачать
                  </button>
                </div>
              </div>
              
              <div class="prng__result-stats">
                <div class="prng__stat-item">
                  <span class="prng__stat-label">Длина</span>
                  <span class="prng__stat-value">{{ generationResult.length }} бит</span>
                </div>
                <div class="prng__stat-item">
                  <span class="prng__stat-label">p</span>
                  <span class="prng__stat-value">{{ generationResult.params.p }}</span>
                </div>
                <div class="prng__stat-item">
                  <span class="prng__stat-label">q</span>
                  <span class="prng__stat-value">{{ generationResult.params.q }}</span>
                </div>
                <div class="prng__stat-item">
                  <span class="prng__stat-label">n</span>
                  <span class="prng__stat-value">{{ generationResult.n }}</span>
                </div>
                <div class="prng__stat-item">
                  <span class="prng__stat-label">seed</span>
                  <span class="prng__stat-value">{{ generationResult.params.seed }}</span>
                </div>
              </div>
            </section>
            
            <!-- Результаты тестов -->
            <section 
              v-if="testResults"
              v-motion
              :initial="{ opacity: 0, y: 20 }"
              :enter="{ opacity: 1, y: 0, transition: { duration: 400, delay: 100 } }"
              class="prng__tests"
            >
              <div class="prng__tests-header">
                <h3>
                  <Icon name="ph:exam-fill" />
                  Результаты тестирования
                </h3>
                <span 
                  class="prng__tests-badge"
                  :class="testResults.overallPassed ? 'prng__tests-badge--passed' : 'prng__tests-badge--failed'"
                >
                  <Icon :name="testResults.overallPassed ? 'ph:check-circle-fill' : 'ph:x-circle-fill'" />
                  {{ testResults.overallPassed ? 'Все тесты пройдены' : 'Есть непройденные тесты' }}
                </span>
              </div>
              
              <div class="prng__tests-grid">
                <!-- Тест 1: Монобит -->
                <div 
                  class="prng__test-card"
                  :class="testResults.monobit.passed ? 'prng__test-card--passed' : 'prng__test-card--failed'"
                >
                  <div class="prng__test-header">
                    <span class="prng__test-name">
                      <Icon :name="testResults.monobit.passed ? 'ph:check-circle-fill' : 'ph:x-circle-fill'" />
                      Монобит (частотный)
                    </span>
                  </div>
                  <p class="prng__test-desc">{{ testResults.monobit.description }}</p>
                  <div class="prng__test-details">
                    <div class="prng__test-detail">
                      <span>Единиц:</span>
                      <strong>{{ testResults.monobit.onesCount }}</strong>
                    </div>
                    <div class="prng__test-detail">
                      <span>Нулей:</span>
                      <strong>{{ testResults.monobit.zerosCount }}</strong>
                    </div>
                    <div class="prng__test-detail">
                      <span>Соотношение:</span>
                      <strong>{{ (testResults.monobit.ratio * 100).toFixed(2) }}%</strong>
                    </div>
                  </div>
                </div>
                
                <!-- Тест 2: Серии -->
                <div 
                  class="prng__test-card"
                  :class="testResults.runs.passed ? 'prng__test-card--passed' : 'prng__test-card--failed'"
                >
                  <div class="prng__test-header">
                    <span class="prng__test-name">
                      <Icon :name="testResults.runs.passed ? 'ph:check-circle-fill' : 'ph:x-circle-fill'" />
                      Тест серий
                    </span>
                  </div>
                  <p class="prng__test-desc">{{ testResults.runs.description }}</p>
                  <div class="prng__test-details">
                    <div class="prng__test-detail">
                      <span>Серий:</span>
                      <strong>{{ testResults.runs.runsCount }}</strong>
                    </div>
                    <div class="prng__test-detail">
                      <span>Ожидаемо:</span>
                      <strong>{{ testResults.runs.expectedRuns.toFixed(1) }}</strong>
                    </div>
                    <div class="prng__test-detail">
                      <span>Z-оценка:</span>
                      <strong>{{ testResults.runs.zScore.toFixed(2) }}</strong>
                    </div>
                  </div>
                </div>
                
                <!-- Тест 3: Длинные серии -->
                <div 
                  class="prng__test-card"
                  :class="testResults.longRun.passed ? 'prng__test-card--passed' : 'prng__test-card--failed'"
                >
                  <div class="prng__test-header">
                    <span class="prng__test-name">
                      <Icon :name="testResults.longRun.passed ? 'ph:check-circle-fill' : 'ph:x-circle-fill'" />
                      Длинные серии
                    </span>
                  </div>
                  <p class="prng__test-desc">{{ testResults.longRun.description }}</p>
                  <div class="prng__test-details">
                    <div class="prng__test-detail">
                      <span>Макс. серия:</span>
                      <strong>{{ testResults.longRun.maxRunLength }}</strong>
                    </div>
                    <div class="prng__test-detail">
                      <span>Допустимо:</span>
                      <strong>{{ testResults.longRun.maxAllowedLength }}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            
            <!-- Промежуточные шаги -->
            <section 
              v-motion
              :initial="{ opacity: 0, y: 20 }"
              :visible="{ opacity: 1, y: 0, transition: { duration: 400 } }"
              class="prng__section"
            >
              <button class="prng__toggle" @click="showSteps = !showSteps">
                <Icon name="ph:list-bullets-fill" />
                <span>Промежуточные шаги генерации (первые 100)</span>
                <Icon 
                  :name="showSteps ? 'ph:caret-up-bold' : 'ph:caret-down-bold'" 
                  class="prng__toggle-arrow"
                />
              </button>
              
              <Transition name="slide">
                <div v-if="showSteps" class="prng__table-wrap">
                  <table class="prng__table">
                    <thead>
                      <tr>
                        <th>№</th>
                        <th>x</th>
                        <th>Бит (x mod 2)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="step in generationResult.steps" :key="step.iteration">
                        <td class="prng__table-num">{{ step.iteration }}</td>
                        <td class="prng__table-value">{{ step.x }}</td>
                        <td class="prng__table-bit" :class="step.bit === 1 ? 'prng__table-bit--one' : 'prng__table-bit--zero'">
                          {{ step.bit }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Transition>
            </section>
            
            <!-- Просмотр последовательности -->
            <section 
              v-motion
              :initial="{ opacity: 0, y: 20 }"
              :visible="{ opacity: 1, y: 0, transition: { duration: 400 } }"
              class="prng__section"
            >
              <button class="prng__toggle" @click="showSequence = !showSequence">
                <Icon name="ph:binary-fill" />
                <span>Просмотр последовательности (первые 1000 бит)</span>
                <Icon 
                  :name="showSequence ? 'ph:caret-up-bold' : 'ph:caret-down-bold'" 
                  class="prng__toggle-arrow"
                />
              </button>
              
              <Transition name="slide">
                <div v-if="showSequence" class="prng__sequence-wrap">
                  <pre class="prng__sequence">{{ generationResult.sequence.slice(0, 1000) }}</pre>
                  <p v-if="generationResult.sequence.length > 1000" class="prng__sequence-note">
                    Показаны первые 1000 бит из {{ generationResult.sequence.length }}
                  </p>
                </div>
              </Transition>
            </section>
          </template>
          
          <!-- Algorithm info -->
          <section 
            v-motion
            :initial="{ opacity: 0, y: 20 }"
            :visible="{ opacity: 1, y: 0, transition: { duration: 400 } }"
            class="prng__about"
          >
            <div class="prng__about-header">
              <Icon name="ph:info-fill" />
              <h3>Об алгоритме BBS</h3>
            </div>
            <p class="prng__about-text">
              Blum Blum Shub (BBS) — криптографически стойкий генератор псевдослучайных чисел, 
              основанный на сложности задачи факторизации. Генератор использует два больших 
              простых числа p и q, конгруэнтных 3 по модулю 4 (числа Блюма).
            </p>
            <div class="prng__formulas">
              <div class="prng__formula">
                <span class="prng__formula-label">Модуль:</span>
                <code>n = p × q</code>
              </div>
              <div class="prng__formula">
                <span class="prng__formula-label">Итерация:</span>
                <code>x_{i+1} = x_i² mod n</code>
              </div>
              <div class="prng__formula">
                <span class="prng__formula-label">Выходной бит:</span>
                <code>b_i = x_i mod 2</code>
              </div>
            </div>
            <p class="prng__about-note">
              где <strong>p, q</strong> — простые числа Блюма, <strong>x₀</strong> — начальное значение (seed), 
              взаимно простое с n
            </p>
          </section>
        </div>
      </div>
    </main>
    
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
  max-height: 600px;
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
    gap: var(--spacing-lg);
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
    
    &:hover {
      color: var(--color-text-primary);
      border-color: var(--color-glass-border-hover);
    }
  }
  
  &__meta {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
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

// PRNG component
.prng {
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
    flex-direction: column;
    gap: var(--spacing-lg);
    padding: var(--spacing-lg);
    background: var(--color-glass);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid var(--color-glass-border);
    border-radius: inherit;
  }
  
  // Parameters
  &__params {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }
  
  &__params-title {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text-primary);
    
    .iconify {
      color: var(--color-accent);
    }
  }
  
  &__params-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: var(--spacing-md);
  }
  
  &__field {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }
  
  &__label {
    font-size: 0.813rem;
    font-weight: 500;
    color: var(--color-text-secondary);
  }
  
  &__label-hint {
    font-size: 0.688rem;
    color: var(--color-text-muted);
    font-weight: 400;
  }
  
  &__input {
    padding: 10px var(--spacing-md);
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-glass-border);
    border-radius: var(--radius-md);
    color: var(--color-text-primary);
    font-family: var(--font-mono);
    font-size: 0.938rem;
    transition: all var(--transition-normal);
    
    &:focus {
      border-color: var(--color-accent);
      box-shadow: 0 0 0 3px var(--color-accent-muted);
    }
    
    &::-webkit-inner-spin-button,
    &::-webkit-outer-spin-button {
      -webkit-appearance: none;
    }
  }
  
  &__computed {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-accent-muted);
    border: 1px solid var(--color-border-accent);
    border-radius: var(--radius-md);
    width: fit-content;
  }
  
  &__computed-label {
    font-size: 0.813rem;
    color: var(--color-text-secondary);
  }
  
  &__computed-value {
    font-family: var(--font-mono);
    font-size: 0.938rem;
    font-weight: 600;
    color: var(--color-accent);
  }
  
  &__validation-errors {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }
  
  &__validation-error {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: 0.813rem;
    color: var(--color-error);
    
    .iconify {
      font-size: 1rem;
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
    
    &--small {
      padding: var(--spacing-xs) var(--spacing-sm);
      font-size: 0.75rem;
      background: var(--color-glass);
      border: 1px solid var(--color-glass-border);
      color: var(--color-text-secondary);
      
      &:hover {
        border-color: var(--color-accent);
        color: var(--color-accent);
      }
    }
  }
  
  // Blum primes
  &__blum-primes {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    padding: var(--spacing-md);
    background: var(--color-glass);
    backdrop-filter: blur(16px);
    border: 1px solid var(--color-glass-border);
    border-radius: var(--radius-lg);
  }
  
  &__blum-label {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: 0.813rem;
    font-weight: 500;
    color: var(--color-text-secondary);
    
    .iconify {
      color: var(--color-accent);
    }
  }
  
  &__blum-list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
  }
  
  &__blum-item {
    padding: 4px 8px;
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--color-text-secondary);
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
  
  // Result info
  &__result-info {
    padding: var(--spacing-lg);
    background: var(--color-glass);
    backdrop-filter: blur(16px);
    border: 1px solid var(--color-glass-border);
    border-radius: var(--radius-lg);
  }
  
  &__result-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-md);
    
    h3 {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      font-size: 1rem;
      font-weight: 600;
      color: var(--color-success);
      
      .iconify {
        font-size: 1.25rem;
      }
    }
  }
  
  &__result-actions {
    display: flex;
    gap: var(--spacing-sm);
  }
  
  &__result-stats {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-lg);
  }
  
  &__stat-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  
  &__stat-label {
    font-size: 0.688rem;
    font-weight: 500;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  &__stat-value {
    font-family: var(--font-mono);
    font-size: 0.938rem;
    font-weight: 600;
    color: var(--color-text-primary);
  }
  
  // Tests
  &__tests {
    padding: var(--spacing-lg);
    background: var(--color-glass);
    backdrop-filter: blur(16px);
    border: 1px solid var(--color-glass-border);
    border-radius: var(--radius-lg);
  }
  
  &__tests-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
    
    h3 {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      font-size: 1rem;
      font-weight: 600;
      color: var(--color-text-primary);
      
      .iconify {
        color: var(--color-accent);
      }
    }
  }
  
  &__tests-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) var(--spacing-md);
    border-radius: 100px;
    font-size: 0.75rem;
    font-weight: 500;
    
    &--passed {
      background: rgba(52, 211, 153, 0.12);
      color: var(--color-success);
    }
    
    &--failed {
      background: rgba(248, 113, 113, 0.12);
      color: var(--color-error);
    }
  }
  
  &__tests-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: var(--spacing-md);
  }
  
  &__test-card {
    padding: var(--spacing-md);
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    
    &--passed {
      border-color: rgba(52, 211, 153, 0.3);
      
      .prng__test-name {
        color: var(--color-success);
      }
    }
    
    &--failed {
      border-color: rgba(248, 113, 113, 0.3);
      
      .prng__test-name {
        color: var(--color-error);
      }
    }
  }
  
  &__test-header {
    margin-bottom: var(--spacing-sm);
  }
  
  &__test-name {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: 0.875rem;
    font-weight: 600;
  }
  
  &__test-desc {
    font-size: 0.813rem;
    color: var(--color-text-secondary);
    line-height: 1.5;
    margin-bottom: var(--spacing-sm);
  }
  
  &__test-details {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-md);
    padding-top: var(--spacing-sm);
    border-top: 1px solid var(--color-border);
  }
  
  &__test-detail {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    
    strong {
      font-family: var(--font-mono);
      color: var(--color-text-secondary);
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
    max-height: 400px;
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
  
  &__table-value {
    color: var(--color-text-secondary);
  }
  
  &__table-bit {
    font-weight: 600;
    
    &--one {
      color: var(--color-success);
    }
    
    &--zero {
      color: var(--color-text-muted);
    }
  }
  
  // Sequence
  &__sequence-wrap {
    padding: var(--spacing-md);
    border-top: 1px solid var(--color-border);
  }
  
  &__sequence {
    padding: var(--spacing-md);
    background: var(--color-bg-tertiary);
    border-radius: var(--radius-md);
    font-family: var(--font-mono);
    font-size: 0.75rem;
    line-height: 1.8;
    color: var(--color-text-secondary);
    word-break: break-all;
    white-space: pre-wrap;
    max-height: 200px;
    overflow: auto;
  }
  
  &__sequence-note {
    margin-top: var(--spacing-sm);
    font-size: 0.75rem;
    color: var(--color-text-muted);
    text-align: center;
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
</style>
