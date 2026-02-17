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

// GET - List all rent reminders
export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '') ?? null
        const userId = getUserIdFromToken(token)

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')

        const where: { userId: string; status?: string } = { userId }
        if (status) where.status = status

        const reminders = await prisma.rentReminder.findMany({
            where,
            include: {
                tenant: {
                    select: { id: true, firstName: true, lastName: true, email: true, phone: true },
                },
            },
            orderBy: { dueDate: 'asc' },
        })

        // Calculate summary
        const totalPending = reminders
            .filter((r: { status: string }) => r.status === 'pending')
            .reduce((sum: number, r: { amount: number }) => sum + r.amount, 0)
        const totalPaid = reminders
            .filter((r: { status: string }) => r.status === 'paid')
            .reduce((sum: number, r: { amount: number }) => sum + r.amount, 0)
        const totalLate = reminders
            .filter((r: { status: string }) => r.status === 'late')
            .reduce((sum: number, r: { amount: number }) => sum + r.amount, 0)

        return NextResponse.json({
            reminders,
            summary: {
                totalPending,
                totalPaid,
                totalLate,
                count: reminders.length,
            },
        })
    } catch (error) {
        console.error('Get rent reminders error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST - Create new rent reminder
export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '') ?? null
        const userId = getUserIdFromToken(token)

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { tenantId, amount, dueDate, notes } = body

        if (!tenantId || !amount || !dueDate) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        const reminder = await prisma.rentReminder.create({
            data: {
                userId,
                tenantId,
                amount: parseFloat(amount),
                dueDate: new Date(dueDate),
                notes,
            },
        })

        return NextResponse.json({ reminder })
    } catch (error) {
        console.error('Create rent reminder error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}