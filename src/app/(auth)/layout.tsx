export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative gradient orbs */}
      <div className="gradient-orb w-96 h-96 bg-blue-600 -top-48 -left-48" />
      <div className="gradient-orb w-80 h-80 bg-cyan-500 -bottom-40 -right-40" />
      <div className="gradient-orb w-64 h-64 bg-blue-500 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur border border-white/10 rounded-full px-4 py-2 mb-4">
            <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            <span className="text-sm font-medium text-white">SmartCloud</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Secrets Manager</h1>
          <p className="text-gray-400 text-sm mt-1">Secure secrets management with encryption</p>
        </div>
        {children}
      </div>
    </div>
  )
}
