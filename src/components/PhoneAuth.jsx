import { useState } from 'react'
import { useAuth } from '../lib/AuthContext'

export default function PhoneAuth({ onClose }) {
  const { signInWithPhone, verifyOtp } = useAuth()
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState('phone') // 'phone' | 'otp'
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSendCode = async () => {
    if (!phone.trim()) return
    setError(null)
    setLoading(true)
    try {
      await signInWithPhone(phone.trim())
      setStep('otp')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!otp.trim()) return
    setError(null)
    setLoading(true)
    try {
      await verifyOtp(phone.trim(), otp.trim())
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
        <div className="bg-white w-full max-w-[420px] rounded-t-[20px] md:rounded-[20px] p-6 md:p-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-['Inter'] font-black text-black text-2xl">
              {step === 'phone' ? 'Sign in' : 'Enter code'}
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full
                hover:bg-gray-100 transition-colors bg-transparent border-none cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {step === 'phone' ? (
            <>
              <p className="text-sm text-neutral-500 mb-4">
                Enter your phone number and we'll text you a code.
              </p>
              <div className="flex flex-col gap-4">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 555 123 4567"
                  className="w-full h-[48px] px-4 border-[1.5px] border-dashed border-brand-100
                    rounded-lg text-base text-text-primary placeholder:text-neutral-500
                    outline-none bg-white font-['Inter']"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSendCode()}
                />
                <button
                  onClick={handleSendCode}
                  disabled={!phone.trim() || loading}
                  className="w-full h-[48px] bg-black rounded-full text-white text-base
                    font-medium cursor-pointer border-none
                    hover:bg-gray-800 transition-colors
                    disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send code'}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-neutral-500 mb-4">
                We sent a code to <span className="text-text-primary font-medium">{phone}</span>
              </p>
              <div className="flex flex-col gap-4">
                <input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  className="w-full h-[48px] px-4 border-[1.5px] border-dashed border-brand-100
                    rounded-lg text-base text-text-primary placeholder:text-neutral-500
                    outline-none bg-white font-['Inter'] tracking-[0.3em] text-center"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                />
                <button
                  onClick={handleVerify}
                  disabled={!otp.trim() || loading}
                  className="w-full h-[48px] bg-black rounded-full text-white text-base
                    font-medium cursor-pointer border-none
                    hover:bg-gray-800 transition-colors
                    disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? 'Verifying...' : 'Verify'}
                </button>
                <button
                  onClick={() => { setStep('phone'); setOtp(''); setError(null) }}
                  className="text-sm text-neutral-500 underline bg-transparent border-none
                    cursor-pointer hover:text-text-primary transition-colors"
                >
                  Use a different number
                </button>
              </div>
            </>
          )}

          {error && (
            <p className="mt-4 text-sm text-red-500">{error}</p>
          )}
        </div>
      </div>
    </>
  )
}
