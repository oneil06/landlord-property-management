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

export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '') ?? null
        const userId = getUserIdFromToken(token)

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get counts
        const [properties, tenants, maintenance, leases, rentReminders] = await Promise.all([
            prisma.property.count({ where: { userId } }),
            prisma.tenant.count({ where: { userId, status: 'active' } }),
            prisma.maintenanceRequest.count({ where: { userId, status: 'pending' } }),
            prisma.lease.findMany({
                where: { userId, status: 'active' },
                select: { monthlyRent: true },
            }),
            prisma.rentReminder.count({
                where: {
                    userId,
                    status: 'pending',
                    dueDate: {
                        gte: new Date(),
                        lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    },
                },
            }),
        ])

        // Calculate monthly income
        const monthlyIncome = leases.reduce((sum: number, lease: { monthlyRent: number }) => sum + lease.monthlyRent, 0)

        // Calculate occupancy rate
        const propertiesWithTenants = await prisma.property.count({
            where: {
                userId,
                tenants: {
                    some: { status: 'active' },
                },
            },
        })
        const occupancyRate = properties > 0 ? Math.round((propertiesWithTenants / properties) * 100) : 0

        // Get recent activity
        const recentPayments = await prisma.rentReminder.findMany({
            where: { userId, status: 'paid' },
            orderBy: { updatedAt: 'desc' },
            take: 3,
            include: { tenant: true },
        })

        const recentMaintenance = await prisma.maintenanceRequest.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 3,
            include: { property: true },
        })

        const activities = [
            ...recentPayments.map((p: { id: string; updatedAt: Date; tenant: { firstName: string; lastName: string } }) => ({
                id: p.id,
                type: 'payment',
                message: `Rent payment received from ${p.tenant.firstName} ${p.tenant.lastName}`,
                date: p.updatedAt.toISOString(),
            })),
            ...recentMaintenance.map((m: { id: string; createdAt: Date; title: string; property: { name: string } }) => ({
                id: m.id,
                type: 'maintenance',
                message: `Maintenance request: ${m.title} at ${m.property.name}`,
                date: m.createdAt.toISOString(),
            })),
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)

        return NextResponse.json({
            stats: {
                totalProperties: properties,
                totalTenants: tenants,
                monthlyIncome,
                pendingMaintenance: maintenance,
                occupancyRate,
                upcomingPayments: rentReminders,
            },
            activities,
        })
    } catch (error) {
        console.error('Dashboard error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}