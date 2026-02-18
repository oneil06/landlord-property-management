import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

function getUserIdFromToken(token: string | null | undefined): string | null {
    if (!token) return null
    try {
        const decoded = Buffer.from(token, 'base64').toString('utf-8')
        const [userId] = decoded.split(':')
        return userId
    } catch {
        return null
    }
}

// GET /api/documents/download - Download a document file
export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '') ?? null
        const userId = getUserIdFromToken(token)

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const documentId = searchParams.get('id')

        if (!documentId) {
            return NextResponse.json({ error: 'Document ID required' }, { status: 400 })
        }

        // Find the document and verify ownership
        const document = await prisma.document.findFirst({
            where: { id: documentId, userId }
        })

        if (!document) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 })
        }

        // Build file path
        const uploadsDir = path.join(process.cwd(), 'uploads')
        const filepath = path.join(uploadsDir, document.path)

        // Check if file exists
        if (!existsSync(filepath)) {
            return NextResponse.json({ error: 'File not found on disk' }, { status: 404 })
        }

        // Read the file
        const fileBuffer = await readFile(filepath)

        // Return the file with appropriate headers
        // Use the renamed name if available, otherwise fall back to original name
        const downloadName = document.name || document.originalName
        // Preserve the file extension from the original name if the renamed name doesn't have one
        const originalExt = document.originalName.includes('.')
            ? '.' + document.originalName.split('.').pop()
            : ''
        const finalName = downloadName.includes('.')
            ? downloadName
            : downloadName + originalExt

        return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
                'Content-Type': document.mimeType,
                'Content-Disposition': `attachment; filename="${encodeURIComponent(finalName)}"`,
                'Content-Length': document.size.toString(),
            },
        })
    } catch (error) {
        console.error('Error downloading document:', error)
        return NextResponse.json({ error: 'Failed to download document' }, { status: 500 })
    }
}
