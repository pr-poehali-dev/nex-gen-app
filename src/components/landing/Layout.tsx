import { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="h-screen overflow-hidden relative" style={{ backgroundColor: '#f8fafc' }}>
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center top, rgba(219,234,254,0.6) 0%, transparent 60%), radial-gradient(ellipse at center bottom, rgba(241,245,249,0.8) 0%, transparent 70%)',
        }}
      />
      <div className="relative z-20 h-full">
        {children}
      </div>
    </div>
  )
}
