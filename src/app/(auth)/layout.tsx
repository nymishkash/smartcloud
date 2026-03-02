export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">SmartCloud Secrets</h1>
          <p className="text-gray-400 text-sm mt-1">Secure secrets management</p>
        </div>
        {children}
      </div>
    </div>
  )
}
