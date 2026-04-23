<script setup lang="ts">
const route = useRoute()
const labId = computed(() => Number(route.params.id))

// Redirect to lab 1 if it's the specific page
if (labId.value === 1) {
  navigateTo('/lab/1', { replace: true })
}

const labTitles: Record<number, string> = {
  2: 'Лабораторная работа 2',
  3: 'Лабораторная работа 3',
  4: 'Лабораторная работа 4',
  5: 'Лабораторная работа 5',
}

const labTitle = computed(() => labTitles[labId.value] || 'Лабораторная работа')
</script>

<template>
  <div class="pending">
    <!-- Ambient background -->
    <div class="pending__ambient"></div>
    
    <!-- Header -->
    <header class="pending__header">
      <div class="container">
        <div class="pending__header-row">
          <NuxtLink to="/" class="pending__back">
            <Icon name="ph:arrow-left-bold" />
            <span>Назад</span>
          </NuxtLink>
          
          <div class="pending__meta">
            <span class="pending__num">{{ String(labId).padStart(2, '0') }}</span>
            <div class="pending__info">
              <span class="pending__label">Лабораторная работа</span>
              <h1 class="pending__title">{{ labTitle }}</h1>
            </div>
          </div>
        </div>
      </div>
    </header>
    
    <!-- Content -->
    <main class="pending__main">
      <div class="container">
        <div 
          v-motion
          :initial="{ opacity: 0, y: 25 }"
          :enter="{ opacity: 1, y: 0, transition: { duration: 500, ease: 'easeOut' } }"
          class="pending__card"
        >
          <div class="pending__card-glow"></div>
          <div class="pending__card-content">
            <div class="pending__icon">
              <Icon name="ph:code-fill" />
            </div>
            
            <h2 class="pending__heading">В разработке</h2>
            
            <p class="pending__text">
              Данная лабораторная работа ещё не завершена и будет доступна в ближайшее время.
            </p>
            
            <div class="pending__progress">
              <div class="pending__progress-bar">
                <div class="pending__progress-fill"></div>
              </div>
              <span class="pending__progress-text">Выполняется...</span>
            </div>
            
            <NuxtLink to="/" class="pending__btn">
              <Icon name="ph:arrow-left-bold" />
              Вернуться к списку
            </NuxtLink>
          </div>
        </div>
      </div>
    </main>
    
    <!-- Footer -->
    <footer class="pending__footer">
      <div class="container">
        <p>Адодин Егор | ИТБД-124 | РГУ им. А.Н. Косыгина | 2026</p>
      </div>
    </footer>
  </div>
</template>

<style lang="scss">
.pending {
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
  
  // Header
  &__header {
    position: sticky;
    top: 0;
    z-index: 100;
    padding: var(--spacing-md) 0;
    background: var(--color-glass-strong);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--color-glass-border);
  }
  
  &__header-row {
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
  
  // Main
  &__main {
    position: relative;
    z-index: 1;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-2xl) 0;
  }
  
  &__card {
    position: relative;
    max-width: 420px;
    width: 100%;
    border-radius: var(--radius-xl);
    overflow: hidden;
  }
  
  &__card-glow {
    position: absolute;
    inset: -1px;
    background: linear-gradient(135deg, var(--color-accent) 0%, transparent 50%, var(--color-accent-soft) 100%);
    opacity: 0.15;
    border-radius: inherit;
    animation: glow-pulse 3s ease-in-out infinite;
  }
  
  &__card-content {
    position: relative;
    padding: var(--spacing-2xl);
    background: var(--color-glass);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid var(--color-glass-border);
    border-radius: inherit;
    text-align: center;
  }
  
  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 72px;
    height: 72px;
    margin: 0 auto var(--spacing-lg);
    background: var(--color-accent-muted);
    border: 1px solid var(--color-border-accent);
    border-radius: var(--radius-lg);
    
    .iconify {
      font-size: 2rem;
      color: var(--color-accent);
    }
  }
  
  &__heading {
    font-size: 1.375rem;
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: var(--spacing-sm);
  }
  
  &__text {
    color: var(--color-text-secondary);
    font-size: 0.875rem;
    line-height: 1.7;
    margin-bottom: var(--spacing-xl);
  }
  
  &__progress {
    margin-bottom: var(--spacing-xl);
  }
  
  &__progress-bar {
    height: 6px;
    background: var(--color-bg-tertiary);
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: var(--spacing-sm);
  }
  
  &__progress-fill {
    width: 30%;
    height: 100%;
    background: linear-gradient(90deg, var(--color-accent-soft), var(--color-accent));
    border-radius: 3px;
    animation: progress-pulse 2s ease-in-out infinite;
  }
  
  &__progress-text {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    font-family: var(--font-mono);
  }
  
  &__btn {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: 12px var(--spacing-xl);
    background: var(--color-glass);
    border: 1px solid var(--color-glass-border);
    border-radius: var(--radius-md);
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-secondary);
    transition: all var(--transition-normal);
    
    &:hover {
      background: var(--color-accent-muted);
      border-color: var(--color-border-accent);
      color: var(--color-accent);
    }
  }
  
  // Footer
  &__footer {
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
}

@keyframes progress-pulse {
  0%, 100% { 
    opacity: 1;
    width: 30%;
  }
  50% { 
    opacity: 0.7;
    width: 35%;
  }
}

@keyframes glow-pulse {
  0%, 100% { opacity: 0.15; }
  50% { opacity: 0.25; }
}

// Responsive
@media (max-width: 640px) {
  .pending {
    &__back span {
      display: none;
    }
    
    &__num {
      display: none;
    }
    
    &__card-content {
      padding: var(--spacing-xl);
    }
  }
}
</style>
