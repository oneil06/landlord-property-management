import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

// GET - Get single rent reminder
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '') ?? null
        const userId = getUserIdFromToken(token)

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params

        const reminder = await prisma.rentReminder.findFirst({
            where: { id, userId },
            include: {
                tenant: {
                    select: { id: true, firstName: true, lastName: true, email: true, phone: true },
                },
            },
        })

        if (!reminder) {
            return NextResponse.json({ error: 'Reminder not found' }, { status: 404 })
        }

        return NextResponse.json({ reminder })
    } catch (error) {
        console.error('Get rent reminder error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// PATCH - Update rent reminder status
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '') ?? null
        const userId = getUserIdFromToken(token)

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const body = await request.json()
        const { status, paidDate } = body

        // Verify ownership
        const existingReminder = await prisma.rentReminder.findFirst({
            where: { id, userId },
        })

        if (!existingReminder) {
            return NextResponse.json({ error: 'Reminder not found' }, { status: 404 })
        }

        const updateData: {
            status: string
            paidDate?: Date | null
        } = {
            status: status || existingReminder.status,
        }

        // If marking as paid, set the paid date
        if (status === 'paid') {
            updateData.paidDate = paidDate ? new Date(paidDate) : new Date()
        } else {
            updateData.paidDate = null
        }

        const reminder = await prisma.rentReminder.update({
            where: { id },
            data: updateData,
            include: {
                tenant: {
                    select: { id: true, firstName: true, lastName: true, email: true, phone: true },
                },
            },
        })

        return NextResponse.json({ reminder })
    } catch (error) {
        console.error('Update rent reminder error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE - Delete rent reminder
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '') ?? null
        const userId = getUserIdFromToken(token)

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params

        // Verify ownership
        const existingReminder = await prisma.rentReminder.findFirst({
            where: { id, userId },
        })

        if (!existingReminder) {
            return NextResponse.json({ error: 'Reminder not found' }, { status: 404 })
        }

        await prisma.rentReminder.delete({
            where: { id },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Delete rent reminder error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
