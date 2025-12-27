import { ArrowRight, Code, RefreshCw, Shield } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/icon.png'

export default function Index() {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)
  const [wasRestored, setWasRestored] = useState(false)

  useEffect(() => {
    const checkRestoreStatus = async () => {
      try {
        // Check if app was just restored
        const restored = await window.api.checkRestoredStatus?.()
        if (restored) {
          setWasRestored(true)
          // Set app_initialized to true for restored apps
          localStorage.setItem('app_initialized', 'true')
          localStorage.setItem('app_was_restored', 'true')
        }
      } catch (error) {
        console.warn('Could not check restore status:', error)
      }

      const initialized = localStorage.getItem('app_initialized')
      const wasRestoredBefore = localStorage.getItem('app_was_restored')

      if (wasRestoredBefore === 'true') {
        // This was a restored app, show special message
        setWasRestored(true)
        // Clear the flag
        localStorage.removeItem('app_was_restored')
      }

      if (initialized === 'true') {
        navigate('/dashboard')
      } else {
        setChecking(false)
      }
    }

    checkRestoreStatus()
  }, [])

  const handleStartApp = () => {
    localStorage.setItem('app_initialized', 'true')
    navigate('/dashboard')
  }

  const handleRestore = () => {
    navigate('/restore')
  }

  if (checking) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
        <div className="animate-pulse">
          <div className="relative">
            <img src={logo} className="h-40 w-40 mx-auto mb-6" alt="Production History Logo" />
            <div className="absolute -inset-4 bg-linear-to-r from-gray-200 to-gray-300 rounded-full blur-xl opacity-50"></div>
          </div>
          <div className="text-center">
            <div className="h-4 bg-gray-300 rounded w-32 mx-auto mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-24 mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-100">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-10">
          {wasRestored && (
            <div className="inline-flex items-center bg-linear-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-full mb-8 shadow-lg animate-fade-in">
              <Shield className="h-5 w-5 mr-2" />
              <span className="font-semibold">✓ Database Successfully Restored!</span>
            </div>
          )}

          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Production Management
            <span className="block text-xl font-normal text-gray-600 mt-2">
              Optimize Your Manufacturing Process
            </span>
          </h1>
        </div>

        {/* Action Section */}
        <div className="bg-linear-to-r from-gray-100 to-gray-300 rounded-3xl p-12 mb-16 text-center">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!wasRestored && (
              <button
                onClick={handleRestore}
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-all duration-300 transform hover:-translate-y-1 shadow-lg"
              >
                <RefreshCw className="h-5 w-5 mr-3" />
                Restore from Backup
              </button>
            )}

            <button
              onClick={handleStartApp}
              className="inline-flex items-center justify-center px-8 py-4 bg-linear-to-r from-gray-700 to-gray-900 text-white font-semibold rounded-xl hover:from-gray-800 hover:to-black transition-all duration-300 transform hover:-translate-y-1 shadow-lg"
            >
              {wasRestored ? 'Continue with Restored Data' : 'Start New Session'}
              <ArrowRight className="h-5 w-5 ml-3" />
            </button>
          </div>
        </div>
        {/* Footer Info */}
        <div className="absolute bottom-0 right-0 flex items-center space-x-2 px-6 py-3 rounded-xl">
          <Code className="h-3 w-3 text-gray-600" />
          <span className="text-sm font-semibold text-gray-900">Powered by</span>
          <span className="text-xl font-bold tracking-wide">CodeOrbitStudio</span>
        </div>
      </main>
    </div>
  )
}
