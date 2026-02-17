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

// GET - List all tenants
export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '') ?? null
        const userId = getUserIdFromToken(token)

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const tenants = await prisma.tenant.findMany({
            where: { userId },
            include: {
                property: {
                    select: { id: true, name: true, address: true, city: true },
                },
                leases: {
                    where: { status: 'active' },
                    select: { id: true, monthlyRent: true, startDate: true, endDate: true },
                },
                _count: {
                    select: { maintenance: true, reminders: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        })

        return NextResponse.json({ tenants })
    } catch (error) {
        console.error('Get tenants error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST - Create new tenant
export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '') ?? null
        const userId = getUserIdFromToken(token)

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const {
            firstName,
            lastName,
            email,
            phone,
            propertyId,
            emergencyContact,
            emergencyPhone,
            employmentInfo,
            monthlyIncome,
            moveInDate,
            notes,
        } = body

        if (!firstName || !lastName || !email || !phone) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        const tenant = await prisma.tenant.create({
            data: {
                userId,
                firstName,
                lastName,
                email,
                phone,
                propertyId: propertyId || null,
                emergencyContact,
                emergencyPhone,
                employmentInfo,
                monthlyIncome: monthlyIncome ? parseFloat(monthlyIncome) : null,
                moveInDate: moveInDate ? new Date(moveInDate) : null,
                notes,
            },
        })

        return NextResponse.json({ tenant })
    } catch (error) {
        console.error('Create tenant error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}