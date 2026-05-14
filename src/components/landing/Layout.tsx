import { ReactNode } from 'react'
import { Squares } from "./squares-background"

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="h-screen overflow-hidden relative" style={{ backgroundColor: '#080808' }}>
      <div className="absolute inset-0 z-0 opacity-30">
        <Squares
          direction="diagonal"
          speed={0.3}
          squareSize={60}
          borderColor="#1a0000"
          hoverFillColor="#1a0000"
        />
      </div>
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
