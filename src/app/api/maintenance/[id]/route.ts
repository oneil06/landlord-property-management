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

// GET - Get single maintenance request
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

        const maintenance = await prisma.maintenanceRequest.findFirst({
            where: { id, userId },
            include: {
                property: {
                    select: { id: true, name: true, address: true, city: true },
                },
                tenant: {
                    select: { id: true, firstName: true, lastName: true, email: true, phone: true },
                },
            },
        })

        if (!maintenance) {
            return NextResponse.json({ error: 'Maintenance request not found' }, { status: 404 })
        }

        return NextResponse.json({ maintenance })
    } catch (error) {
        console.error('Get maintenance error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// PUT - Update maintenance request
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
        const existing = await prisma.maintenanceRequest.findFirst({
            where: { id, userId },
        })

        if (!existing) {
            return NextResponse.json({ error: 'Maintenance request not found' }, { status: 404 })
        }

        const {
            title,
            description,
            priority,
            status,
            estimatedCost,
            actualCost,
            scheduledDate,
            completedDate,
            notes,
        } = body

        const maintenance = await prisma.maintenanceRequest.update({
            where: { id },
            data: {
                title,
                description,
                priority,
                status,
                estimatedCost: estimatedCost ? parseFloat(estimatedCost) : null,
                actualCost: actualCost ? parseFloat(actualCost) : null,
                scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
                completedDate: completedDate ? new Date(completedDate) : null,
                notes,
            },
        })

        return NextResponse.json({ maintenance })
    } catch (error) {
        console.error('Update maintenance error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE - Delete maintenance request
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
        const existing = await prisma.maintenanceRequest.findFirst({
            where: { id, userId },
        })

        if (!existing) {
            return NextResponse.json({ error: 'Maintenance request not found' }, { status: 404 })
        }

        await prisma.maintenanceRequest.delete({
            where: { id },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Delete maintenance error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
