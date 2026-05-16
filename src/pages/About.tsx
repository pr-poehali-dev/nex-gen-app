import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import Icon from '@/components/ui/icon'

const FEATURES = [
  {
    icon: 'BookOpen',
    title: 'Читай страшные истории',
    desc: 'Каталог проверенных историй в жанрах хоррор, мистика, крипипаста и психологический триллер. Только лучшее — каждая история проходит модерацию.',
  },
  {
    icon: 'PenLine',
    title: 'Предлагай свои',
    desc: 'Есть история, от которой мороз по коже? Отправляй — модераторы рассмотрят и опубликуют. Твоё имя останется в истории ShadowTales.',
  },
  {
    icon: 'MessageCircle',
    title: 'Общайся с сообществом',
    desc: 'Живой чат читателей, личные сообщения, профили участников. Обсуждай прочитанное с теми, кто понимает.',
  },
  {
    icon: 'ShieldCheck',
    title: 'Безопасная среда',
    desc: 'Модерируемая площадка без спама и треша. Только качественный контент для ценителей жанра.',
  },
]

const FAQ = [
  {
    q: 'Это бесплатно?',
    a: 'Да, полностью. Читай, предлагай истории, общайся — всё бесплатно и без рекламы внутри.',
  },
  {
    q: 'Кто публикует истории?',
    a: 'Истории предлагают сами читатели, а публикует команда модераторов после проверки. Случайного мусора не будет.',
  },
  {
    q: 'Можно ли публиковать анонимно?',
    a: 'Да. При отправке истории можно указать любой псевдоним — или не указывать вовсе.',
  },
  {
    q: 'Какие жанры принимаются?',
    a: 'Хоррор, мистика, крипипаста, психологический триллер. Истории из жизни тоже приветствуются, если они жуткие.',
  },
  {
    q: 'Как быстро рассматривают истории?',
    a: 'Обычно в течение нескольких дней. Модераторы — живые люди, не боты.',
  },
]

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className="border-b cursor-pointer"
      style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      onClick={() => setOpen(o => !o)}
    >
      <div className="flex items-center justify-between py-4 gap-4">
        <span className="text-white/80 text-sm">{q}</span>
        <Icon
          name={open ? 'ChevronUp' : 'ChevronDown'}
          size={16}
          className="flex-shrink-0 text-white/30"
        />
      </div>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="pb-4 text-white/45 text-sm leading-relaxed"
        >
          {a}
        </motion.div>
      )}
    </div>
  )
}

export default function About() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#080808', fontFamily: "'Inter', sans-serif" }}>
      {/* Фоновый градиент */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at top center, rgba(80,0,0,0.18) 0%, transparent 55%)' }}
      />

      {/* Шапка */}
      <header
        className="sticky top-0 z-20 flex items-center justify-between px-4 md:px-12 py-3 md:py-4 border-b border-white/5"
        style={{ backgroundColor: 'rgba(8,8,8,0.95)', backdropFilter: 'blur(10px)' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-white/40 hover:text-white transition-colors text-sm"
        >
          <Icon name="ArrowLeft" size={16} />
          <span className="hidden sm:inline">Назад</span>
        </button>
        <button
          onClick={() => navigate('/')}
          className="text-white text-base md:text-lg font-bold tracking-wider hover:text-red-400 transition-colors duration-200"
          style={{ fontFamily: "'Cinzel Decorative', serif" }}
        >
          ShadowTales
        </button>
        <button
          onClick={() => navigate('/catalog')}
          className="flex items-center gap-1.5 text-[#8B0000] hover:text-red-400 transition-colors text-sm"
        >
          <Icon name="BookOpen" size={16} />
          <span className="hidden sm:inline">Каталог</span>
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-4 md:px-8 py-12 md:py-20 relative">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-[#8B0000] text-xs uppercase tracking-[0.25em] mb-4">О проекте</p>
          <h1
            className="text-3xl md:text-5xl text-white mb-6 leading-tight"
            style={{ fontFamily: "'Cinzel Decorative', serif" }}
          >
            ShadowTales
          </h1>
          <p className="text-white/50 text-base md:text-lg leading-relaxed max-w-xl mx-auto">
            Площадка для тех, кто любит истории, от которых не спится. Читай, делись своим, общайся с живым сообществом.
          </p>
        </motion.div>

        {/* Миссия */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-16"
        >
          <p className="text-[#8B0000] text-xs uppercase tracking-widest mb-6">Миссия</p>
          <div
            className="relative p-6 md:p-10 rounded overflow-hidden"
            style={{ backgroundColor: 'rgba(139,0,0,0.04)', border: '1px solid rgba(139,0,0,0.18)' }}
          >
            <div
              className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l"
              style={{ backgroundColor: '#8B0000' }}
            />
            <p
              className="text-white/30 text-xs uppercase tracking-[0.3em] mb-4"
              style={{ fontFamily: "'Cinzel Decorative', serif" }}
            >
              ShadowTales
            </p>
            <p className="text-white/80 leading-loose text-sm md:text-base">
              Мы собираем лучшие страшные истории рунета в одном месте — без алгоритмов, без мусора, без лишних барьеров. Только истории, которые действительно цепляют.
            </p>
            <p className="text-white/40 leading-loose text-sm md:text-base mt-4">
              ShadowTales — это живое сообщество авторов и читателей жанра. Каждая история проходит проверку модерацией, прежде чем попасть в каталог.
            </p>
          </div>
        </motion.div>

        {/* Возможности */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mb-16"
        >
          <p className="text-[#8B0000] text-xs uppercase tracking-widest mb-6">Что можно делать</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.07 }}
                className="p-5 rounded"
                style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <Icon name={f.icon} size={18} className="text-[#8B0000] mb-3" />
                <p className="text-white/80 text-sm font-medium mb-1">{f.title}</p>
                <p className="text-white/40 text-xs leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Для кого */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mb-16"
        >
          <p className="text-[#8B0000] text-xs uppercase tracking-widest mb-6">Для кого</p>
          <div className="space-y-3">
            {[
              ['Читателей хоррора и мистики', 'Истории, которые не экранизировали — только текст, только атмосфера.'],
              ['Авторов жанра', 'Хочешь поделиться своей историей с живой аудиторией — без лишних шагов.'],
              ['Ценителей крипипасты', 'Классика и новинки рунета в одном каталоге.'],
            ].map(([title, desc]) => (
              <div
                key={title}
                className="p-4 rounded"
                style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <p className="text-white/75 text-sm font-medium mb-1">{title}</p>
                <p className="text-white/35 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-16"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/catalog')}
              className="flex-1 px-8 py-3 text-white text-sm font-medium rounded transition-all hover:opacity-90 active:scale-95"
              style={{ backgroundColor: '#8B0000' }}
            >
              Читать истории
            </button>
            <button
              onClick={() => navigate('/register')}
              className="flex-1 px-8 py-3 text-white/60 hover:text-white text-sm font-medium rounded transition-all"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}
            >
              Создать аккаунт
            </button>
          </div>
        </motion.div>

        {/* Анонсы */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.32 }}
          className="mb-16 grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <div
            className="p-5 rounded"
            style={{ backgroundColor: 'rgba(139,0,0,0.06)', border: '1px solid rgba(139,0,0,0.2)' }}
          >
            <p className="text-[#8B0000] text-xs uppercase tracking-widest mb-2">Набор открыт</p>
            <p className="text-white/75 text-sm font-medium mb-1">Ищем модераторов</p>
            <p className="text-white/40 text-xs leading-relaxed">
              Мы набираем команду модераторов — людей, которые любят жанр и готовы помогать развивать площадку. Если интересно — зарегистрируйся и подай заявку.
            </p>
          </div>
          <div
            className="p-5 rounded"
            style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <p className="text-white/30 text-xs uppercase tracking-widest mb-2">Для первых авторов</p>
            <p className="text-white/75 text-sm font-medium mb-1">Секретный бонус</p>
            <p className="text-white/40 text-xs leading-relaxed">
              Первые авторы, чьи истории будут опубликованы, получат особый бонус. Что именно — узнаешь после публикации.
            </p>
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
        >
          <p className="text-[#8B0000] text-xs uppercase tracking-widest mb-2">Вопросы и ответы</p>
          <div>
            {FAQ.map(item => (
              <FAQItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </motion.div>

        {/* Подвал */}
        <div className="mt-16 pt-8 border-t text-center" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <p className="text-white/20 text-xs">© 2026 ShadowTales</p>
        </div>
      </main>
    </div>
  )
}