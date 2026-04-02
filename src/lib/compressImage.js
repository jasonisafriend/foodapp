const MAX_DIMENSION = 1200
const INITIAL_QUALITY = 0.8
const TARGET_SIZE = 500 * 1024 // 500KB

/**
 * Compress an image file using the browser Canvas API.
 * Resizes to fit within MAX_DIMENSION and compresses as JPEG,
 * stepping down quality if needed to stay under TARGET_SIZE.
 */
export default function compressImage(file) {
  return new Promise((resolve, reject) => {
    // If the file is already small enough and is a JPEG, skip compression
    if (file.size <= TARGET_SIZE && file.type === 'image/jpeg') {
      resolve(file)
      return
    }

    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      // Calculate new dimensions, preserving aspect ratio
      let { width, height } = img
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round(height * (MAX_DIMENSION / width))
          width = MAX_DIMENSION
        } else {
          width = Math.round(width * (MAX_DIMENSION / height))
          height = MAX_DIMENSION
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)

      // Try progressively lower quality until we're under TARGET_SIZE
      const tryCompress = (quality) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas compression failed'))
              return
            }
            if (blob.size > TARGET_SIZE && quality > 0.4) {
              tryCompress(quality - 0.1)
            } else {
              const compressed = new File([blob], file.name.replace(/\.\w+$/, '.jpg'), {
                type: 'image/jpeg',
                lastModified: Date.now(),
              })
              resolve(compressed)
            }
          },
          'image/jpeg',
          quality,
        )
      }

      tryCompress(INITIAL_QUALITY)
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image for compression'))
    }

    img.src = url
  })
}
