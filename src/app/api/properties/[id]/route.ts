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

// GET - Get single property
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

        const property = await prisma.property.findFirst({
            where: { id, userId },
            include: {
                tenants: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        status: true,
                    },
                },
                leases: {
                    include: {
                        tenant: { select: { firstName: true, lastName: true } },
                    },
                },
                expenses: {
                    orderBy: { date: 'desc' },
                    take: 10,
                },
                maintenance: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                    include: { tenant: { select: { firstName: true, lastName: true } } },
                },
            },
        })

        if (!property) {
            return NextResponse.json({ error: 'Property not found' }, { status: 404 })
        }

        return NextResponse.json({ property })
    } catch (error) {
        console.error('Get property error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// PUT - Update property
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
        const existingProperty = await prisma.property.findFirst({
            where: { id, userId },
        })

        if (!existingProperty) {
            return NextResponse.json({ error: 'Property not found' }, { status: 404 })
        }

        const {
            name,
            address,
            city,
            state,
            zipCode,
            propertyType,
            bedrooms,
            bathrooms,
            squareFeet,
            purchasePrice,
            purchaseDate,
            monthlyMortgage,
            notes,
        } = body

        const property = await prisma.property.update({
            where: { id },
            data: {
                name,
                address,
                city,
                state,
                zipCode,
                propertyType,
                bedrooms: parseInt(bedrooms) || 0,
                bathrooms: parseFloat(bathrooms) || 0,
                squareFeet: squareFeet ? parseInt(squareFeet) : null,
                purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
                purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
                monthlyMortgage: monthlyMortgage ? parseFloat(monthlyMortgage) : null,
                notes,
            },
        })

        return NextResponse.json({ property })
    } catch (error) {
        console.error('Update property error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE - Delete property
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
        const existingProperty = await prisma.property.findFirst({
            where: { id, userId },
        })

        if (!existingProperty) {
            return NextResponse.json({ error: 'Property not found' }, { status: 404 })
        }

        await prisma.property.delete({
            where: { id },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Delete property error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}