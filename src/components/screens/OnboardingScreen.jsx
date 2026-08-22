import { useState } from 'react'
import { Check, ChevronRight, ArrowRight } from 'lucide-react'

const DIRECTIONS = [
  { emoji: '🕊️', label: 'God',          desc: 'Spiritual discipline, prayer, connection' },
  { emoji: '💪',  label: 'Health',       desc: 'Sleep, body, energy, mind' },
  { emoji: '💰',  label: 'Wealth',       desc: 'Financial discipline, growth, freedom' },
  { emoji: '❤️',  label: 'Family',       desc: 'Presence, kindness, relationships' },
  { emoji: '💼',  label: 'Professional', desc: 'Deep work, learning, impact' },
]

const STEPS = ['welcome', 'name', 'directions', 'ready']

export default function OnboardingScreen({ onComplete }) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')

  function next() {
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else onComplete(name.trim() || 'Friend')
  }

  function finish() { onComplete(name.trim() || 'Friend') }

  return (
    <div className="min-h-screen flex flex-col items-center justify-between px-6 py-12 animate-fade-in"
      style={{ paddingTop: 'calc(3rem + env(safe-area-inset-top, 0px))', paddingBottom: 'calc(3rem + env(safe-area-inset-bottom, 0px))' }}>

      {/* Step indicators */}
      <div className="flex gap-2">
        {STEPS.map((_, i) => (
          <div key={i} className="h-1 rounded-full transition-all duration-500"
            style={{ width: i === step ? 24 : 8, background: i <= step ? '#a78bfa' : 'rgba(255,255,255,0.15)' }} />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm gap-8 text-center">

        {step === 0 && (
          <div className="space-y-6 animate-fade-in">
            <div className="w-24 h-24 rounded-[28px] mx-auto flex items-center justify-center text-5xl"
              style={{ background: 'linear-gradient(145deg, rgba(124,58,237,0.25), rgba(6,182,212,0.12))', border: '1px solid rgba(124,58,237,0.30)', backdropFilter: 'blur(20px)' }}>
              🚀
            </div>
            <div>
              <h1 className="text-4xl font-black text-white mb-2">LifeOS</h1>
              <p className="text-base font-medium" style={{ color: 'rgba(240,244,255,0.55)' }}>
                Your second brain. Your daily operating system.
              </p>
            </div>
            <div className="space-y-3 text-left">
              {['Track your 5 life directions daily', 'Build rituals from proven books', 'Your coach learns from your experiences', 'Compound your growth, visibly'].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.25)', border: '1px solid rgba(167,139,250,0.4)' }}>
                    <Check size={11} style={{ color: '#a78bfa' }} />
                  </div>
                  <p className="text-sm text-white/80">{item}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6 w-full animate-fade-in">
            <div>
              <h2 className="text-3xl font-black text-white mb-2">What's your name?</h2>
              <p className="text-sm" style={{ color: 'rgba(240,244,255,0.50)' }}>Your coach will address you personally.</p>
            </div>
            <input
              type="text"
              placeholder="Enter your name..."
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && next()}
              autoFocus
              className="w-full text-center text-xl font-semibold py-4 rounded-2xl outline-none"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                backdropFilter: 'blur(20px)',
                color: '#f0f4ff',
              }}
            />
            {name.trim() && (
              <p className="text-sm animate-fade-in" style={{ color: 'rgba(167,139,250,0.8)' }}>
                Welcome, {name}. Let's build your OS.
              </p>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5 w-full animate-fade-in">
            <div>
              <h2 className="text-3xl font-black text-white mb-2">Your 5 Directions</h2>
              <p className="text-sm" style={{ color: 'rgba(240,244,255,0.50)' }}>Every day you'll score yourself in each one. Nothing else matters more.</p>
            </div>
            <div className="space-y-2">
              {DIRECTIONS.map((d, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-2xl animate-fade-in"
                  style={{
                    animationDelay: `${i * 80}ms`,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}>
                  <span className="text-2xl">{d.emoji}</span>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-white">{d.label}</p>
                    <p className="text-[11px]" style={{ color: 'rgba(240,244,255,0.45)' }}>{d.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-6xl">✨</div>
            <div>
              <h2 className="text-3xl font-black text-white mb-3">
                {name ? `You're ready, ${name}.` : "You're ready."}
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(240,244,255,0.55)' }}>
                "Small, seemingly insignificant steps completed consistently over time will create a radical difference."
              </p>
              <p className="text-xs mt-2" style={{ color: 'rgba(167,139,250,0.7)' }}>— Darren Hardy, The Compound Effect</p>
            </div>
            <p className="text-sm" style={{ color: 'rgba(240,244,255,0.45)' }}>
              Log your first day. Start today.
            </p>
          </div>
        )}
      </div>

      {/* CTA Button */}
      <button
        onClick={step === STEPS.length - 1 ? finish : next}
        className="w-full max-w-sm flex items-center justify-center gap-2 py-4 rounded-3xl font-bold text-base text-white transition-all active:scale-[0.97]"
        style={{
          background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
          boxShadow: '0 4px 24px rgba(124,58,237,0.45), inset 0 1px 0 rgba(255,255,255,0.15)',
        }}
      >
        {step === STEPS.length - 1 ? <>Start My Journey <ArrowRight size={18} /></> : <>Continue <ChevronRight size={18} /></>}
      </button>
    </div>
  )
}
