import Image from 'next/image'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">

      {/* Left panel — stadium hero */}
      <div className="relative md:flex-1 h-56 md:h-auto overflow-hidden">
        <Image
          src="/stadium-hero.png"
          alt="World Cup 2026 stadium"
          fill
          className="object-cover object-center"
          priority
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-b md:bg-gradient-to-r from-black/80 via-black/60 to-black/20" />

        {/* Content over image */}
        <div className="relative z-10 flex flex-col justify-end md:justify-center h-full p-8 md:p-12 text-white">
          <div className="max-w-md space-y-6">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚽</span>
              <span className="text-sm font-semibold tracking-widest uppercase text-white/70">
                Quiniela 2026
              </span>
            </div>

            {/* Headline */}
            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl font-black leading-tight tracking-tight">
                The biggest stage.{' '}
                <span className="text-amber-400">Your predictions.</span>
              </h1>
              <p className="text-white/70 text-base md:text-lg leading-relaxed">
                Pick your champion, call every score, and battle your family and friends
                across the greatest tournament on earth.
              </p>
            </div>

            {/* Stat pills */}
            <div className="flex flex-wrap gap-2">
              {['104 matches', '48 teams', '32 nations', '1 champion'].map((s) => (
                <span
                  key={s}
                  className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 border border-white/20 backdrop-blur-sm text-white"
                >
                  {s}
                </span>
              ))}
            </div>

            {/* Dates + trophy */}
            <div className="flex items-center gap-4 pt-2">
              <div className="relative w-12 h-12 shrink-0 opacity-90">
                <Image src="/trophy.png" alt="World Cup trophy" fill className="object-contain drop-shadow-lg" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">FIFA World Cup 2026™</p>
                <p className="text-white/60 text-xs">June 11 – July 19 · USA, Canada, Mexico</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex items-center justify-center bg-background md:w-[420px] shrink-0 p-8 md:p-12">
        <div className="w-full max-w-sm">
          {children}
        </div>
      </div>

    </div>
  )
}
