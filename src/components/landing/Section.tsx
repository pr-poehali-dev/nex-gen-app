import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import type { SectionProps } from "@/types"

export default function Section({ id, title, subtitle, content, isActive, showButton, buttonText }: SectionProps) {
  const navigate = useNavigate()
  return (
    <section id={id} className="relative h-screen w-full snap-start flex flex-col justify-center p-8 md:p-16 lg:p-24 overflow-hidden">
      <div
        className="absolute left-0 top-0 h-full w-px opacity-20"
        style={{ background: 'linear-gradient(to bottom, transparent, #8B0000, transparent)' }}
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
        className="text-4xl md:text-6xl lg:text-[5rem] xl:text-[6rem] font-bold leading-[1.1] tracking-tight max-w-4xl text-white"
        style={{ fontFamily: "'Cinzel Decorative', serif" }}
        initial={{ opacity: 0, y: 50 }}
        animate={isActive ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7 }}
      >
        {title}
      </motion.h2>

      {content && (
        <motion.p
          className="text-lg md:text-xl lg:text-2xl max-w-2xl mt-6"
          style={{ color: '#9a9a9a', fontFamily: "'Inter', sans-serif" }}
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
          className="mt-12 md:mt-16"
        >
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/catalog')}
            className="text-[#cc0000] bg-transparent border-[#8B0000] hover:bg-[#8B0000] hover:text-white transition-all duration-300 tracking-widest uppercase text-sm"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {buttonText}
          </Button>
        </motion.div>
      )}
    </section>
  )
}