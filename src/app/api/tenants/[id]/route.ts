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

// GET - Get single tenant
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

        const tenant = await prisma.tenant.findFirst({
            where: { id, userId },
            include: {
                property: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                        city: true,
                        state: true,
                        zipCode: true,
                    },
                },
                leases: {
                    orderBy: { startDate: 'desc' },
                    take: 5,
                },
                maintenance: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
                _count: {
                    select: {
                        leases: true,
                        maintenance: true,
                    },
                },
            },
        })

        if (!tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
        }

        return NextResponse.json({ tenant })
    } catch (error) {
        console.error('Get tenant error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// PUT - Update tenant
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
        const existingTenant = await prisma.tenant.findFirst({
            where: { id, userId },
        })

        if (!existingTenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
        }

        const {
            firstName,
            lastName,
            email,
            phone,
            emergencyContact,
            emergencyPhone,
            employmentInfo,
            monthlyIncome,
            moveInDate,
            moveOutDate,
            status,
            notes,
            propertyId,
        } = body

        const tenant = await prisma.tenant.update({
            where: { id },
            data: {
                firstName,
                lastName,
                email,
                phone,
                emergencyContact,
                emergencyPhone,
                employmentInfo,
                monthlyIncome: monthlyIncome ? parseFloat(monthlyIncome) : null,
                moveInDate: moveInDate ? new Date(moveInDate) : null,
                moveOutDate: moveOutDate ? new Date(moveOutDate) : null,
                status,
                notes,
                propertyId: propertyId || null,
            },
            include: {
                property: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        })

        return NextResponse.json({ tenant })
    } catch (error) {
        console.error('Update tenant error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE - Delete tenant
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
        const existingTenant = await prisma.tenant.findFirst({
            where: { id, userId },
        })

        if (!existingTenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
        }

        await prisma.tenant.delete({
            where: { id },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Delete tenant error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
