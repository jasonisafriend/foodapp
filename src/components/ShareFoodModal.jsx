import { useState, useRef, useEffect } from 'react'
import ImageCropper from './ImageCropper'
import compressImage from '../lib/compressImage'
import TagPicker from './TagPicker'
import { sanitizeTags } from '../lib/tags'

/**
 * Two-step Add Food flow:
 *   Step 1 — "Share a photo" (pick / take photo, then crop to 4:5)
 *   Step 2 — "Tell us a little more" (name, description, location, price)
 */
export default function ShareFoodModal({ isOpen, onClose, onSubmit }) {
  // Lock body scroll on iOS
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

  // Flow state: 'photo' → 'crop' → 'details'
  const [step, setStep] = useState('photo')

  // Photo state
  const [rawImageUrl, setRawImageUrl] = useState(null) // original data-url for cropper
  const [photo, setPhoto] = useState(null)             // final cropped blob
  const [photoPreview, setPhotoPreview] = useState(null) // final cropped preview url
  const fileInputRef = useRef(null)

  // Details state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [price, setPrice] = useState('')
  const [mapsUrl, setMapsUrl] = useState('')
  const [showMapsField, setShowMapsField] = useState(false)
  const [tags, setTags] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const nameRef = useRef(null)

  // Auto-resize name textarea
  useEffect(() => {
    const el = nameRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = el.scrollHeight + 'px'
    }
  }, [name])

  // Reset everything when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep('photo')
      setRawImageUrl(null)
      setPhoto(null)
      setPhotoPreview(null)
      setName('')
      setDescription('')
      setLocation('')
      setPrice('')
      setMapsUrl('')
      setShowMapsField(false)
      setTags([])
      setError(null)
    }
  }, [isOpen])

  // Handle file selection → go to crop step
  const handlePhotoChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      setRawImageUrl(reader.result)
      setStep('crop')
    }
    reader.readAsDataURL(file)
    // Reset file input so selecting the same file again works
    e.target.value = ''
  }

  // After crop → compress and go to details
  const handleCropComplete = async (blob, previewUrl) => {
    try {
      const compressed = await compressImage(new File([blob], 'photo.jpg', { type: 'image/jpeg' }))
      setPhoto(compressed)
      // Re-read compressed as preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result)
        setStep('details')
      }
      reader.readAsDataURL(compressed)
    } catch {
      // Fallback: use uncompressed
      setPhoto(new File([blob], 'photo.jpg', { type: 'image/jpeg' }))
      setPhotoPreview(previewUrl)
      setStep('details')
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
        tags: sanitizeTags(tags),
        photo,
        photoPreview,
      })
      onClose()
    } catch (err) {
      console.error('Failed to share food:', err)
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  // Single hidden file input — iOS shows its own native sheet with Camera/Library/Files options
  const fileInputs = (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      className="hidden"
      onChange={handlePhotoChange}
    />
  )

  return (
    <>
      {/* Backdrop — desktop */}
      <div
        className="hidden md:block fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal shell */}
      <div className="fixed inset-0 z-50 md:flex md:items-center md:justify-center">
        <div
          className="bg-white w-full h-full md:h-auto md:max-w-[900px] md:max-h-[90vh]
            md:rounded-[20px] overflow-hidden flex flex-col
            animate-[slideUp_0.3s_ease-out]"
          style={{ animationName: 'slideUp' }}
        >
          {/* ===== STEP 1: Share a photo ===== */}
          {step === 'photo' && (
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center px-4 py-4">
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-transparent border-none cursor-pointer"
                  style={{ backgroundColor: 'rgba(245,245,245,0.8)' }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="black" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col items-center px-4 py-4 gap-4 overflow-y-auto">
                <p className="text-[32px] font-bold font-['Arial'] leading-[40px] text-[#1f1f1f] text-center w-full">
                  Share a photo
                </p>

                {/* Photo area — tap to open native picker (iOS shows its own sheet with Camera / Library / Files) */}
                <div
                  className="w-full bg-white border border-solid border-[#f4ff20] rounded-[20px] flex flex-col items-center justify-center gap-5 cursor-pointer
                    hover:border-[#e8f200] transition-colors"
                  style={{ aspectRatio: '400 / 500' }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="Selected" className="w-full h-full object-cover rounded-[20px]" />
                  ) : (
                    <>
                      <div className="w-[44px] h-[44px] rounded-full bg-[#f5d6d6] flex items-center justify-center">
                        <svg className="w-6 h-6 text-[#23232e]" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12m-3.2 0a3.2 3.2 0 1 0 6.4 0 3.2 3.2 0 1 0-6.4 0"/>
                          <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
                        </svg>
                      </div>
                      <p className="text-xl font-bold text-black font-['Inter']">Add Photo</p>
                    </>
                  )}
                </div>

                {/* Continue button — only if photo selected */}
                {photoPreview && (
                  <button
                    onClick={() => {
                      // Re-open cropper with current raw image
                      if (rawImageUrl) setStep('crop')
                    }}
                    className="flex items-center gap-2.5 h-[44px] px-6 bg-black rounded-full
                      text-white text-xl cursor-pointer border-none
                      hover:bg-gray-800 transition-colors"
                    style={{ boxShadow: '0px 4px 4px rgba(0,0,0,0.25)' }}
                  >
                    Continue
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ===== STEP 1.5: Crop ===== */}
          {step === 'crop' && rawImageUrl && (
            <ImageCropper
              imageSrc={rawImageUrl}
              onCrop={handleCropComplete}
              onBack={() => setStep('photo')}
            />
          )}

          {/* ===== STEP 2: Tell us a little more ===== */}
          {step === 'details' && (
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center px-4 py-4">
                <button
                  onClick={() => setStep('photo')}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-transparent border-none cursor-pointer"
                  style={{ backgroundColor: 'rgba(245,245,245,0.8)' }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="black" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                  </svg>
                </button>
              </div>

              {/* Scrollable form content */}
              <div className="flex-1 overflow-y-auto overscroll-contain">
                <div className="flex flex-col gap-4 items-center px-4 py-4 pb-8">
                  <p className="text-[32px] font-bold font-['Arial'] leading-[40px] text-[#1f1f1f] text-center w-full">
                    Tell us a little more
                  </p>

                  {/* Error */}
                  {error && (
                    <div className="w-full p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  {/* WHAT IS IT? */}
                  <div className="flex flex-col gap-2 w-full">
                    <div className="flex justify-between items-center">
                      <label className="text-sm text-[#23232e] font-['Inter'] tracking-wide">
                        WHAT IS IT?
                      </label>
                      <span className="text-sm text-black font-['Inter']">{name.length}/50</span>
                    </div>
                    <div className="p-4 border-[1.5px] border-dashed border-[#bebdd5] rounded-lg bg-white">
                      <textarea
                        ref={nameRef}
                        value={name}
                        onChange={(e) => {
                          if (e.target.value.length <= 50) setName(e.target.value)
                        }}
                        placeholder="Food"
                        rows={1}
                        className="w-full font-['Playfair_Display'] italic font-medium text-[28px] md:text-[32px] leading-[36px] md:leading-[40px]
                          text-[#1f1f1f] placeholder:text-[#78788f]
                          border-none outline-none bg-transparent resize-none overflow-hidden"
                        style={{ fontSize: '28px' }}
                      />
                    </div>
                  </div>

                  {/* SAY SOMETHING QUICK */}
                  <div className="flex flex-col gap-2 w-full">
                    <div className="flex justify-between items-center">
                      <label className="text-sm text-[#23232e] font-['Inter'] tracking-wide">
                        SAY SOMETHING QUICK
                      </label>
                      <span className="text-sm text-black font-['Inter']">{description.length}/120</span>
                    </div>
                    <textarea
                      value={description}
                      onChange={(e) => {
                        if (e.target.value.length <= 120) setDescription(e.target.value)
                      }}
                      placeholder="Crispy crust, gooey mozzarella, fresh basil, and perfect sauce. 10/10"
                      className="w-full h-[80px] p-4 border-[1.5px] border-dashed border-[#bebdd5]
                        rounded-lg text-[14px] text-[#23232e] placeholder:text-[#737377]
                        resize-none outline-none bg-white font-['Inter']"
                      style={{ fontSize: '16px' }}
                    />
                  </div>

                  {/* WHERE'S IT FROM? */}
                  <div className="flex flex-col gap-2 w-full">
                    <label className="text-sm text-[#23232e] font-['Inter'] tracking-wide">
                      WHERE'S IT FROM?
                    </label>
                    <div className="flex items-center gap-2.5 p-4 border-[1.5px] border-dashed border-[#bebdd5] rounded-lg bg-white">
                      <svg className="w-6 h-6 shrink-0 text-[#23232e]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Search for a place"
                        className="flex-1 text-[14px] text-[#23232e] placeholder:text-[#78788f]
                          border-none outline-none bg-transparent font-['Inter']"
                        style={{ fontSize: '16px' }}
                      />
                    </div>
                  </div>

                  {/* Google Maps link (optional) */}
                  {!showMapsField ? (
                    <button
                      onClick={() => setShowMapsField(true)}
                      className="flex items-center gap-1.5 text-sm text-[#78788f]
                        bg-transparent border-none cursor-pointer hover:text-[#23232e]
                        transition-colors p-0 self-start -mt-2"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                      </svg>
                      Add Google Maps link
                    </button>
                  ) : (
                    <div className="flex flex-col gap-2 w-full -mt-2">
                      <label className="text-sm text-[#23232e] font-['Inter'] tracking-wide">
                        GOOGLE MAPS LINK <span className="text-[#78788f] font-normal">(optional)</span>
                      </label>
                      <div className="flex items-center gap-2.5 p-4 border-[1.5px] border-dashed border-[#bebdd5] rounded-lg bg-white">
                        <svg className="w-5 h-5 shrink-0 text-[#23232e]" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
                        </svg>
                        <input
                          type="url"
                          value={mapsUrl}
                          onChange={(e) => setMapsUrl(e.target.value)}
                          placeholder="Paste Google Maps share link"
                          className="flex-1 text-[14px] text-[#23232e] placeholder:text-[#78788f]
                            border-none outline-none bg-transparent font-['Inter']"
                          style={{ fontSize: '16px' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* HOW MUCH DID YOU SPEND? */}
                  <div className="flex flex-col gap-2 w-full">
                    <label className="text-sm text-[#23232e] font-['Inter'] tracking-wide">
                      HOW MUCH DID YOU SPEND?
                    </label>
                    <div className="flex items-center gap-2.5 p-4 border-[1.5px] border-dashed border-[#bebdd5] rounded-lg bg-white">
                      <svg className="w-6 h-6 shrink-0 text-[#23232e]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
                      </svg>
                      <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="5"
                        className="flex-1 text-[14px] text-[#23232e] placeholder:text-[#78788f]
                          border-none outline-none bg-transparent font-['Inter']
                          [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        style={{ fontSize: '16px' }}
                      />
                    </div>
                  </div>

                  {/* TAGS (OPTIONAL) */}
                  <div className="flex flex-col gap-2 w-full">
                    <label className="text-sm text-[#23232e] font-['Inter'] tracking-wide">
                      TAGS <span className="text-[#78788f] font-normal">(optional)</span>
                    </label>
                    <TagPicker value={tags} onChange={setTags} />
                  </div>

                  {/* Post button */}
                  <button
                    onClick={handleSubmit}
                    disabled={!name.trim() || isSubmitting}
                    className="flex items-center gap-2.5 h-[44px] px-6 bg-black rounded-full
                      text-white text-xl cursor-pointer border-none
                      hover:bg-gray-800 transition-colors
                      disabled:opacity-40 disabled:cursor-not-allowed mt-2"
                  >
                    {isSubmitting ? 'Posting...' : 'Post'}
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {fileInputs}

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
