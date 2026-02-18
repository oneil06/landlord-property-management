import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir, unlink } from 'fs/promises'
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

// GET /api/documents - List all documents for user
export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '') ?? null
        const userId = getUserIdFromToken(token)

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const category = searchParams.get('category')
        const propertyId = searchParams.get('propertyId')
        const tenantId = searchParams.get('tenantId')

        const where: {
            userId: string
            category?: string
            propertyId?: string
            tenantId?: string
        } = { userId }

        if (category) where.category = category
        if (propertyId) where.propertyId = propertyId
        if (tenantId) where.tenantId = tenantId

        const documents = await prisma.document.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json({ documents })
    } catch (error) {
        console.error('Error fetching documents:', error)
        return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }
}

// POST /api/documents - Upload a new document
export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '') ?? null
        const userId = getUserIdFromToken(token)

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const formData = await request.formData()
        const file = formData.get('file') as File | null
        const name = formData.get('name') as string | null
        const category = formData.get('category') as string | null
        const description = formData.get('description') as string | null
        const propertyId = formData.get('propertyId') as string | null
        const tenantId = formData.get('tenantId') as string | null

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(process.cwd(), 'uploads')
        if (!existsSync(uploadsDir)) {
            await mkdir(uploadsDir, { recursive: true })
        }

        // Generate unique filename
        const timestamp = Date.now()
        const originalName = file.name
        const extension = originalName.split('.').pop() || 'bin'
        const filename = `${timestamp}-${userId}.${extension}`
        const filepath = path.join(uploadsDir, filename)

        // Write file to disk
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        await writeFile(filepath, buffer)

        // Save document record to database
        const document = await prisma.document.create({
            data: {
                userId,
                name: name || originalName,
                originalName,
                mimeType: file.type,
                size: file.size,
                path: filename,
                category: category || 'general',
                description,
                propertyId: propertyId || null,
                tenantId: tenantId || null
            }
        })

        return NextResponse.json({ document }, { status: 201 })
    } catch (error) {
        console.error('Error uploading document:', error)
        return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 })
    }
}

// DELETE /api/documents - Delete a document
export async function DELETE(request: NextRequest) {
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

        // Find the document first
        const document = await prisma.document.findFirst({
            where: { id: documentId, userId }
        })

        if (!document) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 })
        }

        // Delete file from disk
        const uploadsDir = path.join(process.cwd(), 'uploads')
        const filepath = path.join(uploadsDir, document.path)
        if (existsSync(filepath)) {
            await unlink(filepath)
        }

        // Delete from database
        await prisma.document.delete({
            where: { id: documentId }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting document:', error)
        return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
    }
}

// PUT /api/documents - Update a document (name, category, description)
export async function PUT(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '') ?? null
        const userId = getUserIdFromToken(token)

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { id, name, category, description } = body

        if (!id) {
            return NextResponse.json({ error: 'Document ID required' }, { status: 400 })
        }

        // Verify the document belongs to the user
        const existingDoc = await prisma.document.findFirst({
            where: { id, userId }
        })

        if (!existingDoc) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 })
        }

        // Build update data
        const updateData: {
            name?: string
            category?: string
            description?: string | null
        } = {}

        if (name !== undefined) updateData.name = name
        if (category !== undefined) updateData.category = category
        if (description !== undefined) updateData.description = description

        // Update the document
        const document = await prisma.document.update({
            where: { id },
            data: updateData
        })

        return NextResponse.json({ document })
    } catch (error) {
        console.error('Error updating document:', error)
        return NextResponse.json({ error: 'Failed to update document' }, { status: 500 })
    }
}

// Allowed categories for validation
const ALLOWED_CATEGORIES = ['general', 'lease', 'receipt', 'maintenance', 'legal', 'other']

// PATCH /api/documents - Partial update for inline editing (name, category)
export async function PATCH(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '') ?? null
        const userId = getUserIdFromToken(token)

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { id, name, category } = body

        if (!id) {
            return NextResponse.json({ error: 'Document ID required' }, { status: 400 })
        }

        // Verify the document belongs to the user
        const existingDoc = await prisma.document.findFirst({
            where: { id, userId }
        })

        if (!existingDoc) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 })
        }

        // Build update data with validation
        const updateData: {
            name?: string
            category?: string
        } = {}

        // Validate name if provided
        if (name !== undefined) {
            const trimmedName = name.trim()
            if (!trimmedName) {
                return NextResponse.json({ error: 'Document name cannot be empty' }, { status: 400 })
            }
            if (trimmedName.length > 120) {
                return NextResponse.json({ error: 'Document name must be 120 characters or less' }, { status: 400 })
            }
            updateData.name = trimmedName
        }

        // Validate category if provided
        if (category !== undefined) {
            if (!ALLOWED_CATEGORIES.includes(category)) {
                return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
            }
            updateData.category = category
        }

        // No changes to make
        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ document: existingDoc })
        }

        // Update the document
        const document = await prisma.document.update({
            where: { id },
            data: updateData
        })

        return NextResponse.json({ document })
    } catch (error) {
        console.error('Error updating document:', error)
        return NextResponse.json({ error: 'Failed to update document' }, { status: 500 })
    }
}