import { NextRequest, NextResponse } from 'next/server'
import {
    getUserPlan,
    getUserPlanStatus,
    getUserUsage,
    getPlanLimits,
    getOverLimitFlags,
    getPlanInfo,
    PlanType
} from '@/lib/plans'

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

// GET - Get current user's plan info, limits, and usage
export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '') ?? null
        const userId = getUserIdFromToken(token)

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get all plan-related info in parallel
        const [planStatus, usage, overLimitFlags] = await Promise.all([
            getUserPlanStatus(userId),
            getUserUsage(userId),
            getOverLimitFlags(userId),
        ])

        const plan = planStatus.plan
        const limits = getPlanLimits(plan)
        const planInfo = getPlanInfo(plan)

        // Calculate if user is over any limits
        const isOverLimit = Object.values(overLimitFlags).some(v => v)

        return NextResponse.json({
            plan,
            planInfo,
            limits,
            usage,
            overLimitFlags,
            isOverLimit,
            status: planStatus.status,
            stripeCustomerId: planStatus.stripeCustomerId,
            stripeSubscriptionId: planStatus.stripeSubscriptionId,
        })
    } catch (error) {
        console.error('Get plan info error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
