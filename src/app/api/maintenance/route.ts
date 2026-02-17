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

// GET - List all maintenance requests
export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '') ?? null
        const userId = getUserIdFromToken(token)

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const propertyId = searchParams.get('propertyId')

        const where: { userId: string; status?: string; propertyId?: string } = { userId }
        if (status) where.status = status
        if (propertyId) where.propertyId = propertyId

        const maintenance = await prisma.maintenanceRequest.findMany({
            where,
            include: {
                property: { select: { id: true, name: true, address: true } },
                tenant: { select: { id: true, firstName: true, lastName: true } },
            },
            orderBy: { createdAt: 'desc' },
        })

        return NextResponse.json({ maintenance })
    } catch (error) {
        console.error('Get maintenance error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST - Create new maintenance request
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
            title,
            description,
            priority,
            category,
            estimatedCost,
            scheduledDate,
            notes,
        } = body

        if (!propertyId || !title || !description) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        const maintenance = await prisma.maintenanceRequest.create({
            data: {
                userId,
                propertyId,
                tenantId: tenantId || null,
                title,
                description,
                priority: priority || 'medium',
                category: category || 'other',
                estimatedCost: estimatedCost ? parseFloat(estimatedCost) : null,
                scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
                notes,
            },
        })

        return NextResponse.json({ maintenance })
    } catch (error) {
        console.error('Create maintenance error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}