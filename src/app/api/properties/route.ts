import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { assertPlanAllows, isUpgradeRequiredError, UpgradeRequiredError } from '@/lib/plans'

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

// GET - List all properties
export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '') ?? null
        const userId = getUserIdFromToken(token)

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const properties = await prisma.property.findMany({
            where: { userId },
            include: {
                tenants: {
                    where: { status: 'active' },
                    select: { id: true, firstName: true, lastName: true },
                },
                _count: {
                    select: { tenants: true, maintenance: true, expenses: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        })

        return NextResponse.json({ properties })
    } catch (error) {
        console.error('Get properties error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST - Create new property
export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '') ?? null
        const userId = getUserIdFromToken(token)

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check plan limits before creating property
        await assertPlanAllows(userId, 'create_property')

        const body = await request.json()
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

        if (!name || !address || !city || !state || !zipCode || !propertyType) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        const property = await prisma.property.create({
            data: {
                userId,
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
        console.error('Create property error:', error)

        // Handle upgrade required error
        if (isUpgradeRequiredError(error)) {
            return NextResponse.json(error, { status: 402 }) // 402 Payment Required
        }

        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}