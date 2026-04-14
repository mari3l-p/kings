import { v2 as cloudinary } from 'cloudinary'
import { NextRequest, NextResponse } from 'next/server'

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()
        const file = formData.get('file') as File
        const folder = formData.get('folder') as string || 'kings'

        if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                { folder: `kings/${folder}` },
                (error, result) => {
                    if (error) reject(error)
                    else resolve(result)
                }
            ).end(buffer)
        }) as any

        return NextResponse.json({ url: result.secure_url })

    } catch (error: any) {
        console.error('Cloudinary error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}