import { useState, useEffect, useCallback } from 'react'

/**
 * Samples the top region of a food image and returns whether
 * the header area is "dark" (needs white logo/icons) or "light" (needs black).
 * Uses an offscreen canvas to sample pixels.
 */
export default function useHeaderContrast(imageUrl) {
  const [isDark, setIsDark] = useState(false)

  const analyze = useCallback(() => {
    if (!imageUrl) {
      setIsDark(false)
      return
    }

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        // Sample at small size for performance
        const sampleW = 80
        const sampleH = 20
        canvas.width = sampleW
        canvas.height = sampleH
        const ctx = canvas.getContext('2d')

        // Draw just the top strip of the image (where header sits)
        // Source: full width, top 15% of image
        const srcH = img.naturalHeight * 0.15
        ctx.drawImage(img, 0, 0, img.naturalWidth, srcH, 0, 0, sampleW, sampleH)

        const data = ctx.getImageData(0, 0, sampleW, sampleH).data
        let totalLum = 0
        const pixelCount = sampleW * sampleH

        for (let i = 0; i < data.length; i += 4) {
          // Relative luminance (sRGB)
          const r = data[i] / 255
          const g = data[i + 1] / 255
          const b = data[i + 2] / 255
          totalLum += 0.2126 * r + 0.7152 * g + 0.0722 * b
        }

        const avgLum = totalLum / pixelCount
        // Below 0.45 = dark background → need white icons
        setIsDark(avgLum < 0.45)
      } catch {
        // CORS or other error — default to dark icons on light bg
        setIsDark(false)
      }
    }
    img.onerror = () => setIsDark(false)
    img.src = imageUrl
  }, [imageUrl])

  useEffect(() => {
    analyze()
  }, [analyze])

  return isDark
}
