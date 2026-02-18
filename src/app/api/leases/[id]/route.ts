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

// GET - Get single lease
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

        const lease = await prisma.lease.findFirst({
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

        if (!lease) {
            return NextResponse.json({ error: 'Lease not found' }, { status: 404 })
        }

        return NextResponse.json({ lease })
    } catch (error) {
        console.error('Get lease error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// PUT - Update lease
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
        const existing = await prisma.lease.findFirst({
            where: { id, userId },
        })

        if (!existing) {
            return NextResponse.json({ error: 'Lease not found' }, { status: 404 })
        }

        const {
            startDate,
            endDate,
            monthlyRent,
            securityDeposit,
            status,
        } = body

        const lease = await prisma.lease.update({
            where: { id },
            data: {
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
                monthlyRent: monthlyRent ? parseFloat(monthlyRent) : undefined,
                securityDeposit: securityDeposit ? parseFloat(securityDeposit) : undefined,
                status,
            },
        })

        return NextResponse.json({ lease })
    } catch (error) {
        console.error('Update lease error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE - Delete lease
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
        const existing = await prisma.lease.findFirst({
            where: { id, userId },
        })

        if (!existing) {
            return NextResponse.json({ error: 'Lease not found' }, { status: 404 })
        }

        await prisma.lease.delete({
            where: { id },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Delete lease error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
