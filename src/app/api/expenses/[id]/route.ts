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

// GET - Get single expense
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

        const expense = await prisma.expense.findFirst({
            where: { id, userId },
            include: {
                property: {
                    select: { id: true, name: true, address: true, city: true },
                },
            },
        })

        if (!expense) {
            return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
        }

        return NextResponse.json({ expense })
    } catch (error) {
        console.error('Get expense error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// PUT - Update expense
export async function PUT(
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

        // Verify ownership
        const existing = await prisma.expense.findFirst({
            where: { id, userId },
        })

        if (!existing) {
            return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
        }

        const {
            category,
            description,
            amount,
            date,
            isRecurring,
            recurringPeriod,
            propertyId,
        } = body

        const expense = await prisma.expense.update({
            where: { id },
            data: {
                category,
                description,
                amount: amount ? parseFloat(amount) : undefined,
                date: date ? new Date(date) : undefined,
                isRecurring,
                recurringPeriod,
                propertyId: propertyId || null,
            },
        })

        return NextResponse.json({ expense })
    } catch (error) {
        console.error('Update expense error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE - Delete expense
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
        const existing = await prisma.expense.findFirst({
            where: { id, userId },
        })

        if (!existing) {
            return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
        }

        await prisma.expense.delete({
            where: { id },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Delete expense error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
