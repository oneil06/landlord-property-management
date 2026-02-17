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

// GET - List all expenses
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

        const where: { userId: string; category?: string; propertyId?: string | null } = { userId }
        if (category) where.category = category
        if (propertyId) where.propertyId = propertyId

        const expenses = await prisma.expense.findMany({
            where,
            include: {
                property: { select: { id: true, name: true } },
            },
            orderBy: { date: 'desc' },
        })

        // Calculate totals
        const totalExpenses = expenses.reduce((sum: number, e: { amount: number }) => sum + e.amount, 0)
        const byCategory = expenses.reduce((acc: Record<string, number>, e: { category: string; amount: number }) => {
            acc[e.category] = (acc[e.category] || 0) + e.amount
            return acc
        }, {})

        return NextResponse.json({
            expenses,
            summary: {
                total: totalExpenses,
                byCategory,
                count: expenses.length,
            },
        })
    } catch (error) {
        console.error('Get expenses error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST - Create new expense
export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '') ?? null
        const userId = getUserIdFromToken(token)

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const {
            propertyId,
            category,
            description,
            amount,
            date,
            isRecurring,
            recurringPeriod,
        } = body

        if (!category || !description || !amount || !date) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        const expense = await prisma.expense.create({
            data: {
                userId,
                propertyId: propertyId || null,
                category,
                description,
                amount: parseFloat(amount),
                date: new Date(date),
                isRecurring: isRecurring || false,
                recurringPeriod: recurringPeriod || null,
            },
        })

        return NextResponse.json({ expense })
    } catch (error) {
        console.error('Create expense error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}