import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import type { SectionProps } from "@/types"

export default function Section({ id, title, subtitle, content, isActive, showButton, buttonText }: SectionProps) {
  const navigate = useNavigate()
  return (
    <section id={id} className="relative h-screen w-full snap-start flex flex-col justify-center px-6 py-10 md:p-16 lg:p-24 overflow-hidden">
      <div
        className="absolute left-0 top-0 h-full w-px opacity-30"
        style={{ background: 'linear-gradient(to bottom, transparent, #bfdbfe, transparent)' }}
      />

      {subtitle && (
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={isActive ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          {subtitle}
        </motion.div>
      )}

      <motion.h2
        className="text-3xl sm:text-4xl md:text-6xl lg:text-[5rem] xl:text-[6rem] font-bold leading-[1.1] tracking-tight max-w-4xl text-zinc-900"
        style={{ fontFamily: "'Playfair Display', serif" }}
        initial={{ opacity: 0, y: 50 }}
        animate={isActive ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7 }}
      >
        {title}
      </motion.h2>

      {content && (
        <motion.p
          className="text-base md:text-xl lg:text-2xl max-w-2xl mt-4 md:mt-6 text-zinc-500"
          style={{ fontFamily: "'Inter', sans-serif" }}
          initial={{ opacity: 0, y: 50 }}
          animate={isActive ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {content}
        </motion.p>
      )}

      {showButton && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isActive ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8 md:mt-16"
        >
          <Button
            size="lg"
            onClick={() => navigate('/catalog')}
            className="bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 tracking-wide text-sm px-8 rounded-xl"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {buttonText}
          </Button>
        </motion.div>
      )}
    </section>
  )
}
