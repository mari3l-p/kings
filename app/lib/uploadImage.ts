export async function uploadImage(file: File, folder: string = 'general'): Promise<string | null> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)

    const res = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
    })

    const data = await res.json()
    console.log('Cloudinary response:', data) // 👈 agrega esto

    if (!res.ok) {
        console.error('Upload error:', data)
        return null
    }

    return data.url
}