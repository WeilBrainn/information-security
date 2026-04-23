<script setup lang="ts">
const labs = [
  { id: 1, title: 'Шифр Цезаря', description: 'Алгоритм симметричного шифрования кириллических сообщений', status: 'done' },
  { id: 2, title: 'Лабораторная работа 2', description: 'Находится в разработке', status: 'pending' },
  { id: 3, title: 'Лабораторная работа 3', description: 'Находится в разработке', status: 'pending' },
  { id: 4, title: 'Лабораторная работа 4', description: 'Находится в разработке', status: 'pending' },
  { id: 5, title: 'Лабораторная работа 5', description: 'Находится в разработке', status: 'pending' },
]

const githubUrl = 'https://github.com/WeilBrainn/information-security'
</script>

<template>
  <div class="home">
    <!-- Ambient background -->
    <div class="home__ambient"></div>
    
    <!-- Header -->
    <header class="header">
      <div class="container">
        <nav class="header__nav">
          <div class="header__logo">
            <div class="header__logo-icon">
              <Icon name="ph:shield-check-fill" />
            </div>
            <span class="header__logo-text">InfoSec Labs</span>
          </div>
          <a :href="githubUrl" target="https://github.com/WeilBrainn/information-security" rel="noopener" class="header__link">
            <Icon name="mdi:github" />
            <span>GitHub</span>
          </a>
        </nav>
      </div>
    </header>
    
    <!-- Hero section -->
    <section class="hero">
      <div class="container">
        <div 
          v-motion
          :initial="{ opacity: 0, y: 30 }"
          :enter="{ opacity: 1, y: 0, transition: { duration: 600, ease: 'easeOut' } }"
          class="hero__content"
        >
          <div class="hero__badge">
            <Icon name="ph:buildings-fill" />
            <span>Российский государственный университет им. А.Н. Косыгина</span>
          </div>
          
          <h1 class="hero__title">
            Лабораторные работы
            <span class="hero__subtitle">по дисциплине «Информационная безопасность»</span>
          </h1>
          
          <div class="hero__card">
            <div class="hero__card-glow"></div>
            <div class="hero__card-content">
              <div class="hero__card-row">
                <span class="hero__card-label">Студент</span>
                <span class="hero__card-value">Адодин Егор</span>
              </div>
              <div class="hero__card-divider"></div>
              <div class="hero__card-row">
                <span class="hero__card-label">Группа</span>
                <span class="hero__card-value hero__card-value--accent">ИТБД-124</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    
    <!-- Labs section -->
    <section class="labs">
      <div class="container">
        <h2 
          v-motion
          :initial="{ opacity: 0 }"
          :visible="{ opacity: 1, transition: { duration: 400 } }"
          class="labs__heading"
        >
          <Icon name="ph:folder-notch-open-fill" />
          Список работ
        </h2>
        
        <div class="labs__grid">
          <NuxtLink
            v-for="(lab, index) in labs"
            :key="lab.id"
            :to="`/lab/${lab.id}`"
            v-motion
            :initial="{ opacity: 0, y: 20 }"
            :visible="{ 
              opacity: 1, 
              y: 0,
              transition: { 
                duration: 400, 
                delay: index * 100,
                ease: 'easeOut'
              } 
            }"
            class="lab-card"
            :class="{ 'lab-card--pending': lab.status === 'pending' }"
          >
            <div class="lab-card__glow"></div>
            <div class="lab-card__content">
              <div class="lab-card__header">
                <span class="lab-card__number">{{ String(lab.id).padStart(2, '0') }}</span>
                <span 
                  class="lab-card__status"
                  :class="lab.status === 'done' ? 'lab-card__status--done' : 'lab-card__status--pending'"
                >
                  <Icon :name="lab.status === 'done' ? 'ph:check-circle-fill' : 'ph:clock-fill'" />
                  {{ lab.status === 'done' ? 'Готово' : 'В работе' }}
                </span>
              </div>
              <h3 class="lab-card__title">{{ lab.title }}</h3>
              <p class="lab-card__desc">{{ lab.description }}</p>
              <div class="lab-card__footer">
                <span class="lab-card__link">
                  Открыть
                  <Icon name="ph:arrow-right-bold" />
                </span>
              </div>
            </div>
          </NuxtLink>
        </div>
      </div>
    </section>
    
    <!-- Footer -->
    <footer class="footer">
      <div class="container">
        <div class="footer__content">
          <p class="footer__copy">2026 Адодин Егор</p>
          <div class="footer__divider"></div>
          <p class="footer__info">РГУ им. А.Н. Косыгина | ИТБД-124</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<style lang="scss">
.home {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  
  &__ambient {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 60vh;
    background: 
      radial-gradient(ellipse 70% 50% at 50% 0%, rgba(34, 211, 238, 0.08), transparent 70%);
    pointer-events: none;
    z-index: 0;
  }
}

// Header
.header {
  position: sticky;
  top: 0;
  z-index: 100;
  padding: var(--spacing-md) 0;
  background: var(--color-glass-strong);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--color-glass-border);
  
  &__nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  &__logo {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }
  
  &__logo-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: var(--color-accent-muted);
    border: 1px solid var(--color-border-accent);
    border-radius: var(--radius-sm);
    color: var(--color-accent);
    font-size: 1.25rem;
  }
  
  &__logo-text {
    font-weight: 600;
    font-size: 1rem;
    color: var(--color-text-primary);
    letter-spacing: -0.01em;
  }
  
  &__link {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-glass);
    backdrop-filter: blur(10px);
    border: 1px solid var(--color-glass-border);
    border-radius: var(--radius-md);
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    transition: all var(--transition-normal);
    
    .iconify {
      font-size: 1.125rem;
    }
    
    &:hover {
      background: var(--color-bg-tertiary);
      color: var(--color-text-primary);
      border-color: var(--color-glass-border-hover);
    }
  }
}

// Hero
.hero {
  position: relative;
  z-index: 1;
  padding: var(--spacing-3xl) 0 var(--spacing-2xl);
  
  &__content {
    max-width: 700px;
  }
  
  &__badge {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-glass);
    backdrop-filter: blur(10px);
    border: 1px solid var(--color-border-accent);
    border-radius: var(--radius-md);
    font-size: 0.813rem;
    color: var(--color-accent);
    margin-bottom: var(--spacing-xl);
    
    .iconify {
      font-size: 1rem;
    }
  }
  
  &__title {
    font-size: clamp(2rem, 5vw, 2.75rem);
    font-weight: 700;
    color: var(--color-text-primary);
    margin-bottom: var(--spacing-xl);
    line-height: 1.15;
  }
  
  &__subtitle {
    display: block;
    font-size: clamp(1rem, 2.5vw, 1.25rem);
    font-weight: 400;
    color: var(--color-text-secondary);
    margin-top: var(--spacing-sm);
    letter-spacing: 0;
  }
  
  &__card {
    position: relative;
    border-radius: var(--radius-lg);
    overflow: hidden;
  }
  
  &__card-glow {
    position: absolute;
    inset: -1px;
    background: linear-gradient(135deg, var(--color-accent) 0%, transparent 50%, var(--color-accent-soft) 100%);
    opacity: 0.2;
    border-radius: inherit;
  }
  
  &__card-content {
    position: relative;
    display: flex;
    align-items: center;
    gap: var(--spacing-xl);
    padding: var(--spacing-lg) var(--spacing-xl);
    background: var(--color-glass);
    backdrop-filter: blur(16px);
    border: 1px solid var(--color-glass-border);
    border-radius: inherit;
    
    @media (max-width: 480px) {
      flex-direction: column;
      gap: var(--spacing-md);
      text-align: center;
    }
  }
  
  &__card-row {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  &__card-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  &__card-value {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text-primary);
    
    &--accent {
      font-family: var(--font-mono);
      color: var(--color-accent);
    }
  }
  
  &__card-divider {
    width: 1px;
    height: 40px;
    background: var(--color-border);
    
    @media (max-width: 480px) {
      width: 60px;
      height: 1px;
    }
  }
}

// Labs section
.labs {
  position: relative;
  z-index: 1;
  flex: 1;
  padding: var(--spacing-2xl) 0;
  
  &__heading {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: var(--spacing-xl);
    
    .iconify {
      font-size: 1.25rem;
      color: var(--color-accent);
    }
  }
  
  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: var(--spacing-lg);
    
    @media (max-width: 400px) {
      grid-template-columns: 1fr;
    }
  }
}

// Lab card
.lab-card {
  position: relative;
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: transform var(--transition-normal);
  
  &:hover {
    transform: translateY(-4px);
    
    .lab-card__glow {
      opacity: 0.15;
    }
    
    .lab-card__content {
      border-color: var(--color-glass-border-hover);
    }
    
    .lab-card__link {
      color: var(--color-accent);
      gap: var(--spacing-sm);
    }
  }
  
  &--pending {
    .lab-card__content {
      opacity: 0.7;
    }
    
    &:hover .lab-card__content {
      opacity: 0.85;
    }
  }
  
  &__glow {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 50% 0%, var(--color-accent), transparent 70%);
    opacity: 0;
    transition: opacity var(--transition-normal);
    pointer-events: none;
  }
  
  &__content {
    position: relative;
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: var(--spacing-lg);
    background: var(--color-glass);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid var(--color-glass-border);
    border-radius: inherit;
    transition: all var(--transition-normal);
  }
  
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-md);
  }
  
  &__number {
    font-family: var(--font-mono);
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-accent);
    opacity: 0.6;
  }
  
  &__status {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 100px;
    font-size: 0.75rem;
    font-weight: 500;
    
    .iconify {
      font-size: 0.875rem;
    }
    
    &--done {
      background: rgba(52, 211, 153, 0.12);
      color: var(--color-success);
    }
    
    &--pending {
      background: rgba(251, 191, 36, 0.12);
      color: var(--color-warning);
    }
  }
  
  &__title {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: var(--spacing-sm);
    line-height: 1.3;
  }
  
  &__desc {
    flex: 1;
    font-size: 0.875rem;
    color: var(--color-text-muted);
    line-height: 1.5;
    margin-bottom: var(--spacing-md);
  }
  
  &__footer {
    padding-top: var(--spacing-md);
    border-top: 1px solid var(--color-border);
  }
  
  &__link {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-secondary);
    transition: all var(--transition-normal);
    
    .iconify {
      transition: transform var(--transition-normal);
    }
  }
}

// Footer
.footer {
  position: relative;
  z-index: 1;
  padding: var(--spacing-xl) 0;
  background: var(--color-glass-strong);
  backdrop-filter: blur(20px);
  border-top: 1px solid var(--color-glass-border);
  
  &__content {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: var(--spacing-md);
    flex-wrap: wrap;
  }
  
  &__divider {
    width: 4px;
    height: 4px;
    background: var(--color-text-muted);
    border-radius: 50%;
    opacity: 0.5;
  }
  
  &__copy,
  &__info {
    font-size: 0.813rem;
    color: var(--color-text-muted);
  }
}

// Responsive
@media (max-width: 640px) {
  .hero__badge {
    font-size: 0.75rem;
    
    span {
      display: none;
    }
    
    &::after {
      content: 'РГУ им. А.Н. Косыгина';
    }
  }
  
  .header__link span {
    display: flex;
    align-items: center;
    justify-content: center;
    padding-bottom: 2px;
  }
}
</style>
