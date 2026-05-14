import { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="h-screen overflow-hidden relative" style={{ backgroundColor: '#080808' }}>
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center top, rgba(80,0,0,0.25) 0%, transparent 60%), radial-gradient(ellipse at center bottom, rgba(30,0,0,0.4) 0%, transparent 70%)',
        }}
      />
      <div className="relative z-20 h-full">
        {children}
      </div>
    </div>
  )
}