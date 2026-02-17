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

// GET - List all leases
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

        const leases = await prisma.lease.findMany({
            where,
            include: {
                property: { select: { id: true, name: true, address: true } },
                tenant: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
            orderBy: { startDate: 'desc' },
        })

        return NextResponse.json({ leases })
    } catch (error) {
        console.error('Get leases error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST - Create new lease
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
            tenantId,
            startDate,
            endDate,
            monthlyRent,
            securityDeposit,
            leaseDocument,
        } = body

        if (!propertyId || !tenantId || !startDate || !endDate || !monthlyRent) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        const lease = await prisma.lease.create({
            data: {
                userId,
                propertyId,
                tenantId,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                monthlyRent: parseFloat(monthlyRent),
                securityDeposit: securityDeposit ? parseFloat(securityDeposit) : 0,
                leaseDocument,
            },
        })

        return NextResponse.json({ lease })
    } catch (error) {
        console.error('Create lease error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}