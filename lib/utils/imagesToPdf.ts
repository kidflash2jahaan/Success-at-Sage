'use client'
import jsPDF from 'jspdf'

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export async function imagesToPdf(imageFiles: File[]): Promise<File> {
  const pdf = new jsPDF({ unit: 'px', hotfixes: ['px_scaling'] })
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()

  for (let i = 0; i < imageFiles.length; i++) {
    if (i > 0) pdf.addPage()
    const url = URL.createObjectURL(imageFiles[i])
    try {
      const img = await loadImage(url)
      const imgRatio = img.naturalWidth / img.naturalHeight
      const pageRatio = pageW / pageH
      let w: number, h: number
      if (imgRatio > pageRatio) {
        w = pageW; h = pageW / imgRatio
      } else {
        h = pageH; w = pageH * imgRatio
      }
      const x = (pageW - w) / 2
      const y = (pageH - h) / 2
      pdf.addImage(img, 'JPEG', x, y, w, h)
    } finally {
      URL.revokeObjectURL(url)
    }
  }

  const blob = pdf.output('blob')
  return new File([blob], 'scanned-notes.pdf', { type: 'application/pdf' })
}

export function isImageFile(file: File) {
  return file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name)
}

export function isPdfFile(file: File) {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
}
