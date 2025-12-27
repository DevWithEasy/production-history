import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Database,
  Download,
  Shield,
  Upload,
  XCircle
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Restore() {
  const navigate = useNavigate()
  const [isRestoring, setIsRestoring] = useState(false)
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('') // 'success', 'error', 'info'

  const handleGoBack = () => {
    navigate('/')
  }

  const restoreDB = async () => {
    const confirmRestore = window.confirm(
      '⚠️ IMPORTANT WARNING\n\n' +
        'All current data will be permanently replaced with backup data.\n' +
        'This action cannot be undone.\n\n' +
        'The application will restart automatically after restore.\n\n' +
        'Are you sure you want to continue?'
    )

    if (!confirmRestore) return

    setIsRestoring(true)
    setMessage('Initializing database restore process...')
    setMessageType('info')

    try {
      const res = await window.api.dbRestore()

      if (res.success) {
        setMessage('✓ Database restored successfully! Preparing to restart application...')
        setMessageType('success')

        // Show countdown animation
        let countdown = 5
        const countdownInterval = setInterval(() => {
          setMessage(
            `✓ ${res.message} Restarting in ${countdown} second${countdown !== 1 ? 's' : ''}...`
          )
          countdown--

          if (countdown < 0) {
            clearInterval(countdownInterval)
          }
        }, 1000)
      } else {
        setMessage(`✗ ${res.message}`)
        setMessageType('error')
        setIsRestoring(false)
      }
    } catch (error) {
      setMessage(`✗ Restore failed: ${error.message}`)
      setMessageType('error')
      setIsRestoring(false)
    }
  }

  const backupDB = async () => {
    setIsBackingUp(true)
    setMessage('Preparing database backup...')
    setMessageType('info')

    try {
      const res = await window.api.dbBackup()

      if (res.success) {
        setMessage(`✓ Backup successfully created at:\n${res.path}`)
        setMessageType('success')
      } else {
        setMessage(`✗ ${res.message}`)
        setMessageType('error')
      }
    } catch (error) {
      setMessage(`✗ Backup failed: ${error.message}`)
      setMessageType('error')
    } finally {
      setIsBackingUp(false)
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleGoBack}
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Home
            </button>
            <div className="flex items-center space-x-3">
              <Database className="h-6 w-6 text-gray-700" />
              <h1 className="text-xl font-bold text-gray-900">Database Management</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-linear-to-br from-gray-900 to-black rounded-2xl mb-6">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Secure Database Operations</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Safeguard your production data with regular backups and secure restoration processes.
            Your data&apos;s safety is our top priority.
          </p>
        </div>

        {/* Warning Banner */}
        <div className="bg-linear-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-2xl p-6 mb-8">
          <div className="flex items-start">
            <AlertTriangle className="h-6 w-6 text-yellow-600 mr-4 mt-1 shrink-0" />
            <div>
              <h3 className="font-bold text-yellow-800 mb-2">Important Notice</h3>
              <p className="text-yellow-700">
                Always create a backup before performing any database operations. Restoring from
                backup will replace all current data permanently. These operations cannot be undone.
              </p>
            </div>
          </div>
        </div>

        {/* Operations Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Backup Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-8">
              <div className="flex items-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-xl mr-4">
                  <Download className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Create Backup</h2>
                  <p className="text-gray-600">Save current database state</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 shrink-0" />
                  <span className="text-gray-700">Creates a complete copy of your database</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 shrink-0" />
                  <span className="text-gray-700">Safe to perform at any time</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 shrink-0" />
                  <span className="text-gray-700">Does not affect current data</span>
                </div>
              </div>

              <button
                onClick={backupDB}
                disabled={isBackingUp || isRestoring}
                className="w-full inline-flex items-center justify-center px-6 py-4 bg-linear-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-1 shadow-lg"
              >
                {isBackingUp ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Creating Backup...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5 mr-3" />
                    Create Database Backup
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Restore Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-8">
              <div className="flex items-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 text-red-600 rounded-xl mr-4">
                  <Upload className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Restore Database</h2>
                  <p className="text-gray-600">Replace current database from backup</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-red-500 mr-3 mt-0.5 shrink-0" />
                  <span className="text-gray-700 font-medium">WILL REPLACE ALL CURRENT DATA</span>
                </div>
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-red-500 mr-3 mt-0.5 shrink-0" />
                  <span className="text-gray-700">Application will restart automatically</span>
                </div>
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-red-500 mr-3 mt-0.5 shrink-0" />
                  <span className="text-gray-700">Cannot be undone</span>
                </div>
              </div>

              <button
                onClick={restoreDB}
                disabled={isRestoring || isBackingUp}
                className="w-full inline-flex items-center justify-center px-6 py-4 bg-linear-to-r from-red-600 to-red-700 text-white font-semibold rounded-xl hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-1 shadow-lg"
              >
                {isRestoring ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Restoring Database...
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5 mr-3" />
                    Restore from Backup
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <div
            className={`rounded-2xl p-6 mb-8 animate-fade-in ${
              messageType === 'success'
                ? 'bg-linear-to-r from-green-50 to-emerald-50 border border-green-200'
                : messageType === 'error'
                  ? 'bg-linear-to-r from-red-50 to-rose-50 border border-red-200'
                  : 'bg-linear-to-r from-blue-50 to-cyan-50 border border-blue-200'
            }`}
          >
            <div className="flex items-start">
              {messageType === 'success' ? (
                <CheckCircle className="h-6 w-6 text-green-600 mr-4 mt-1 shrink-0" />
              ) : messageType === 'error' ? (
                <XCircle className="h-6 w-6 text-red-600 mr-4 mt-1 shrink-0" />
              ) : (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-4 mt-1 shrink-0"></div>
              )}
              <div className="whitespace-pre-line text-gray-800 font-medium">{message}</div>
            </div>
          </div>
        )}

        {/* Information Section */}
        <div className="bg-gray-900 rounded-3xl p-8 text-white">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">100%</div>
              <div className="text-gray-300">Data Integrity</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">AES-256</div>
              <div className="text-gray-300">Encryption Standard</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">24/7</div>
              <div className="text-gray-300">Data Protection</div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <button
              onClick={handleGoBack}
              className="inline-flex items-center px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 mb-4 sm:mb-0"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Return to Home Screen
            </button>

            <div className="text-center sm:text-right">
              <div className="text-sm text-gray-600 mb-1">
                Need help? Database operations are irreversible.
              </div>
              <div className="text-xs text-gray-500">
                Developed by CodeOrbitStudio • Production Management System
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
