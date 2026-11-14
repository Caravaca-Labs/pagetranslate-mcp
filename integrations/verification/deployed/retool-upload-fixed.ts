import { authHeader, call, ApiError } from './_api'

// POST /upload/ — multipart upload of a document for translation.
// Upload is free and does NOT start a translation.
// Accepts PDF / DOCX / EPUB / images, up to 100 MB. XLSX and PPTX are not
// supported by the service and are rejected client-side before reaching here.

type Params = {
  apiKey: string
  fileName: string
  mimeType: string
  fileBase64: string
  requestedLanguage: string
}

export default async function (req: { params: Params }) {
  const { apiKey, fileName, mimeType, fileBase64, requestedLanguage } = req.params
  if (!apiKey) throw new ApiError('An API key is required to upload.')
  if (!fileBase64) throw new ApiError('A document file is required.')

  const data = await call<{ job_id?: string; [k: string]: unknown }>({
    path: '/upload/',
    method: 'POST',
    headers: authHeader(apiKey),
    bodyType: 'form-data',
    formData: [
      { key: 'file', file: fileBase64, filename: fileName },
      { key: 'requested_language', value: requestedLanguage },
    ],
  })

  if (!data || typeof data !== 'object' || !('job_id' in data) || !data.job_id) {
    throw new ApiError('Upload succeeded but no job id was returned by the API.')
  }
  return data
}
