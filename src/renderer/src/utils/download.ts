export const download = (url: string, filename?: string) => {
  // 处理 file:// 协议
  if (url.startsWith('file://')) {
    const link = document.createElement('a')
    link.href = url
    link.download = filename || url.split('/').pop() || 'download'
    document.body.appendChild(link)
    link.click()
    link.remove()
    return
  }

  // 处理 Blob URL
  if (url.startsWith('blob:')) {
    const link = document.createElement('a')
    link.href = url
    link.download = filename || `${Date.now()}_diagram.svg`
    document.body.appendChild(link)
    link.click()
    link.remove()
    return
  }

  // 处理普通 URL
  fetch(url)
    .then((response) => {
      let finalFilename = filename || 'download'

      if (!filename) {
        // 尝试从Content-Disposition头获取文件名
        const contentDisposition = response.headers.get('Content-Disposition')
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i)
          if (filenameMatch) {
            finalFilename = filenameMatch[1]
          }
        }

        // 如果URL中有文件名，使用URL中的文件名
        const urlFilename = url.split('/').pop()
        if (urlFilename && urlFilename.includes('.')) {
          finalFilename = urlFilename
        }

        // 如果文件名没有后缀，根据Content-Type添加后缀
        if (!finalFilename.includes('.')) {
          const contentType = response.headers.get('Content-Type')
          const extension = getExtensionFromMimeType(contentType)
          finalFilename += extension
        }

        // 添加时间戳以确保文件名唯一
        finalFilename = `${Date.now()}_${finalFilename}`
      }

      return response.blob().then((blob) => ({ blob, finalFilename }))
    })
    .then(({ blob, finalFilename }) => {
      const blobUrl = URL.createObjectURL(new Blob([blob]))
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = finalFilename
      document.body.appendChild(link)
      link.click()
      URL.revokeObjectURL(blobUrl)
      link.remove()
    })
}

// 辅助函数：根据MIME类型获取文件扩展名
function getExtensionFromMimeType(mimeType: string | null): string {
  if (!mimeType) return '.bin' // 默认二进制文件扩展名

  const mimeToExtension: { [key: string]: string } = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/svg+xml': '.svg',
    'application/pdf': '.pdf',
    'text/plain': '.txt',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
  }

  return mimeToExtension[mimeType] || '.bin'
}

export async function downloadImage(url, filename?: string) {
  try {
    if (!url) {
      return
    }
    const response = await fetch(url, { mode: 'cors' })
    const blob = await response.blob()
    const mime = blob.type || 'image/jpeg'
    const extension = mime.split('/')[1] || 'jpg'

    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, 0, 0)

        canvas.toBlob((blob) => {
          if (blob) {
            const link = document.createElement('a')
            link.href = URL.createObjectURL(blob)

            link.download = `${filename || new Date().getTime()}.${extension}`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(link.href)
          }
        }, mime)
      }
    }

    img.src = URL.createObjectURL(blob)
  } catch (err) {
    console.error('下载失败:', err)
  }
}
