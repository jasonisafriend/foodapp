import { useState, useRef, useEffect } from 'react'
import compressImage from '../lib/compressImage'

export default function ShareFoodModal({ isOpen, onClose, onSubmit }) {
  // Lock body scroll on iOS — position:fixed is the only reliable method
  useEffect(() => {
    if (!isOpen) return
    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      document.body.style.overflow = ''
      window.scrollTo(0, scrollY)
    }
  }, [isOpen])

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [price, setPrice] = useState('')
  const [mapsUrl, setMapsUrl] = useState('')
  const [showMapsField, setShowMapsField] = useState(false)
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0]
    if (file) {
      try {
        const compressed = await compressImage(file)
        setPhoto(compressed)
        const reader = new FileReader()
        reader.onloadend = () => setPhotoPreview(reader.result)
        reader.readAsDataURL(compressed)
      } catch (err) {
        console.error('Image compression failed, using original:', err)
        setPhoto(file)
        const reader = new FileReader()
        reader.onloadend = () => setPhotoPreview(reader.result)
        reader.readAsDataURL(file)
      }
    }
  }

  const handleSubmit = async () => {
    if (!name.trim()) return
    setError(null)
    setIsSubmitting(true)
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        location: location.trim(),
        price: price ? parseFloat(price) : null,
        mapsUrl: mapsUrl.trim() || null,
        photo,
        photoPreview,
      })
      // Reset form
      setName('')
      setDescription('')
      setLocation('')
      setPrice('')
      setMapsUrl('')
      setShowMapsField(false)
      setPhoto(null)
      setPhotoPreview(null)
      onClose()
    } catch (err) {
      console.error('Failed to share food:', err)
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  const shareButton = (
    <button
      onClick={handleSubmit}
      disabled={!name.trim() || isSubmitting}
      className="flex items-center gap-2.5 h-[44px] px-4 bg-black rounded-full
        text-white text-xl cursor-pointer border-none
        hover:bg-gray-800 transition-colors
        disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {isSubmitting ? 'Sharing...' : 'Share'}
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
      </svg>
    </button>
  )

  return (
    <>
      {/* Backdrop — only visible on desktop behind the centered modal */}
      <div
        className="hidden md:block fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal — full-screen on mobile, centered overlay on desktop */}
      <div className="fixed inset-0 z-50 md:flex md:items-center md:justify-center">
        <div
          className="bg-white w-full h-full md:h-auto md:max-w-[900px] md:max-h-[90vh]
            md:rounded-[20px] overflow-y-auto overscroll-contain
            flex flex-col md:block
            animate-[slideUp_0.3s_ease-out]"
          style={{ animationName: 'slideUp' }}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white flex items-center justify-between p-4 md:px-10 md:pt-8
            border-b border-gray-100 md:border-none">
            <button
              onClick={onClose}
              className="flex items-center gap-2.5 h-[44px] px-4 border border-[#1f1f1f] rounded-full
                text-[#1c1b1f] text-xl font-normal cursor-pointer bg-transparent
                hover:bg-gray-50 transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
              </svg>
              Back
            </button>

            {/* Share button in header — desktop only */}
            <div className="hidden md:block">
              {shareButton}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mx-4 md:mx-10 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 md:flex-none flex flex-col md:flex-row gap-8 md:gap-12 p-6 md:px-10 md:pb-10
            pb-4">
            {/* Photo upload */}
            <div
              className="flex flex-col items-center justify-center bg-white border-0
                rounded-[20px] w-full md:w-[392px] h-[240px] md:h-[523px] shrink-0 cursor-pointer
                shadow-[0_2px_20px_rgba(0,0,0,0.08)]
                hover:shadow-[0_4px_30px_rgba(0,0,0,0.12)] transition-shadow"
              onClick={() => fileInputRef.current?.click()}
            >
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-full h-full object-cover rounded-[20px]"
                />
              ) : (
                <div className="flex flex-col items-center gap-8">
                  <div className="w-[44px] h-[44px] rounded-full bg-[#f5d6d6] flex items-center justify-center">
                    <svg className="w-6 h-6 text-[#23232e]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12m-3.2 0a3.2 3.2 0 1 0 6.4 0 3.2 3.2 0 1 0-6.4 0"/>
                      <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
                    </svg>
                  </div>
                  <p className="text-xl font-bold text-black">Add Photo</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>

            {/* Form */}
            <div className="flex flex-col gap-8 md:gap-12 flex-1 min-w-0">
              {/* What is it? */}
              <div className="flex flex-col gap-2">
                <label className="text-sm text-text-primary tracking-wide">
                  WHAT IS IT?
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Food"
                  className="font-['Playfair_Display'] italic font-medium text-[28px] md:text-[32px] leading-[36px] md:leading-[40px]
                    text-text-primary placeholder:text-neutral-500
                    border-none outline-none bg-transparent pb-2 md:pb-4 pl-3.5"
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm text-text-primary tracking-wide">
                    SAY SOMETHING QUICK
                  </label>
                  <span className="text-sm text-black">{description.length}/200</span>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => {
                    if (e.target.value.length <= 200) setDescription(e.target.value)
                  }}
                  placeholder="Crispy crust, gooey mozzarella, fresh basil, and perfect sauce. 10/10"
                  className="w-full h-[100px] p-4 border-[1.5px] border-dashed border-brand-100
                    rounded-lg text-[16px] text-text-primary placeholder:text-neutral-500
                    resize-none outline-none bg-white font-['Inter']"
                />
              </div>

              {/* Location */}
              <div className="flex flex-col gap-2">
                <label className="text-sm text-text-primary tracking-wide">
                  WHERE'S IT FROM?
                </label>
                <div className="flex items-center gap-2.5 p-4 border-[1.5px] border-dashed border-brand-100 rounded-lg bg-white">
                  <svg className="w-6 h-6 shrink-0 text-text-primary" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Search for a place"
                    className="flex-1 text-[16px] text-text-primary placeholder:text-neutral-500
                      border-none outline-none bg-transparent font-['Inter']"
                  />
                </div>
              </div>

              {/* Google Maps link (optional) */}
              {!showMapsField ? (
                <button
                  onClick={() => setShowMapsField(true)}
                  className="flex items-center gap-1.5 text-sm text-neutral-400
                    bg-transparent border-none cursor-pointer hover:text-neutral-600
                    transition-colors p-0 -mt-4"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                  Add Google Maps link
                </button>
              ) : (
                <div className="flex flex-col gap-2 -mt-4">
                  <label className="text-sm text-text-primary tracking-wide">
                    GOOGLE MAPS LINK <span className="text-neutral-400 font-normal">(optional)</span>
                  </label>
                  <div className="flex items-center gap-2.5 p-4 border-[1.5px] border-dashed border-brand-100 rounded-lg bg-white">
                    <svg className="w-5 h-5 shrink-0 text-text-primary" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
                    </svg>
                    <input
                      type="url"
                      value={mapsUrl}
                      onChange={(e) => setMapsUrl(e.target.value)}
                      placeholder="Paste Google Maps share link"
                      className="flex-1 text-[16px] text-text-primary placeholder:text-neutral-500
                        border-none outline-none bg-transparent font-['Inter']"
                    />
                  </div>
                </div>
              )}

              {/* Price */}
              <div className="flex flex-col gap-2">
                <label className="text-sm text-text-primary tracking-wide">
                  HOW MUCH DID IT COST?
                </label>
                <div className="flex items-center gap-2.5 p-4 border-[1.5px] border-dashed border-brand-100 rounded-lg bg-white">
                  <svg className="w-6 h-6 shrink-0 text-text-primary" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
                  </svg>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="5"
                    className="flex-1 text-[16px] text-text-primary placeholder:text-neutral-500
                      border-none outline-none bg-transparent font-['Inter']
                      [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Share button at bottom — mobile only */}
          <div className="md:hidden sticky bottom-0 bg-white border-t border-gray-100 p-4
            pb-[env(safe-area-inset-bottom,16px)]">
            <button
              onClick={handleSubmit}
              disabled={!name.trim() || isSubmitting}
              className="w-full flex items-center justify-center gap-2.5 h-[52px] bg-black rounded-full
                text-white text-xl cursor-pointer border-none
                disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Sharing...' : 'Share'}
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  )
}
