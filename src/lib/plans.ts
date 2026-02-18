// Plan types and constants - Single source of truth for subscription plans

import { prisma } from './prisma';

// Plan types
export type PlanType = 'FREE' | 'PRO' | 'BUSINESS';
export type PlanStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELED';
export type TeamRole = 'OWNER' | 'ADMIN' | 'VIEWER';

// Plan limits configuration
export interface PlanLimits {
    maxProperties: number;
    maxTenants: number;
    autoReminders: boolean;
    reports: boolean;
    exports: boolean;
    teamMembers: number;
    leaseDocsLimit: number;
    whiteLabel: boolean;
    support: string;
}

// Plan display information
export interface PlanInfo {
    name: string;
    price: number;
    priceId?: string; // Stripe price ID (to be added later)
    description: string;
    limits: PlanLimits;
    features: string[];
}

// PLAN_LIMITS - Single source of truth
export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
    FREE: {
        maxProperties: 1,
        maxTenants: 3,
        autoReminders: false,
        reports: false,
        exports: false,
        teamMembers: 0,
        leaseDocsLimit: 5,
        whiteLabel: false,
        support: 'email',
    },
    PRO: {
        maxProperties: Infinity,
        maxTenants: Infinity,
        autoReminders: true,
        reports: true,
        exports: true,
        teamMembers: 0,
        leaseDocsLimit: Infinity,
        whiteLabel: false,
        support: 'priority email',
    },
    BUSINESS: {
        maxProperties: Infinity,
        maxTenants: Infinity,
        autoReminders: true,
        reports: true,
        exports: true,
        teamMembers: 5,
        leaseDocsLimit: Infinity,
        whiteLabel: true,
        support: 'priority',
    },
};

// Plan display information for UI
export const PLAN_INFO: Record<PlanType, PlanInfo> = {
    FREE: {
        name: 'Free',
        price: 0,
        description: 'Perfect for getting started with your first property',
        limits: PLAN_LIMITS.FREE,
        features: [
            '1 property',
            '3 tenants',
            'Manual rent tracking',
            'Basic maintenance logging',
            'Email support',
        ],
    },
    PRO: {
        name: 'Pro',
        price: 19,
        description: 'For landlords managing multiple properties',
        limits: PLAN_LIMITS.PRO,
        features: [
            'Unlimited properties',
            'Unlimited tenants',
            'Automated rent reminders',
            'Financial reports (monthly/yearly)',
            'Export to PDF & CSV',
            'Priority email support',
        ],
    },
    BUSINESS: {
        name: 'Business',
        price: 49,
        description: 'For teams and property management companies',
        limits: PLAN_LIMITS.BUSINESS,
        features: [
            'Everything in Pro',
            'Up to 5 team members',
            'Role-based access (Owner, Admin, Viewer)',
            'White-label emails',
            'Priority support',
        ],
    },
};

// Upgrade required error type
export interface UpgradeRequiredError {
    code: 'UPGRADE_REQUIRED';
    planRequired: PlanType;
    feature: string;
    message: string;
    currentLimit: number | string;
    currentUsage: number;
}

// Type guard to check if an error is an UpgradeRequiredError
export function isUpgradeRequiredError(error: unknown): error is UpgradeRequiredError {
    return (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as UpgradeRequiredError).code === 'UPGRADE_REQUIRED'
    );
}

// Feature action types for enforcement
export type FeatureAction =
    | 'create_property'
    | 'create_tenant'
    | 'enable_auto_reminders'
    | 'generate_reports'
    | 'export_data'
    | 'invite_team_member';

// Helper function to get plan limits
export function getPlanLimits(plan: PlanType): PlanLimits {
    return PLAN_LIMITS[plan];
}

// Helper function to get plan info for display
export function getPlanInfo(plan: PlanType): PlanInfo {
    return PLAN_INFO[plan];
}

// Get user's current plan from database
export async function getUserPlan(userId: string): Promise<PlanType> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { plan: true },
    });

    if (!user) {
        throw new Error('User not found');
    }

    return user.plan as PlanType;
}

// Get user's plan status
export async function getUserPlanStatus(userId: string): Promise<{
    plan: PlanType;
    status: PlanStatus | null;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
}> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            plan: true,
            planStatus: true,
            stripeCustomerId: true,
            stripeSubscriptionId: true,
        },
    });

    if (!user) {
        throw new Error('User not found');
    }

    return {
        plan: user.plan as PlanType,
        status: user.planStatus as PlanStatus | null,
        stripeCustomerId: user.stripeCustomerId,
        stripeSubscriptionId: user.stripeSubscriptionId,
    };
}

// Get user's current usage counts
export async function getUserUsage(userId: string): Promise<{
    properties: number;
    tenants: number;
    teamMembers: number;
    leaseDocs: number;
}> {
    const [properties, tenants, teamMembers, leases] = await Promise.all([
        prisma.property.count({ where: { userId } }),
        prisma.tenant.count({ where: { userId } }),
        prisma.teamMember.count({ where: { teamOwnerId: userId } }),
        prisma.lease.count({ where: { userId, leaseDocument: { not: null } } }),
    ]);

    return {
        properties,
        tenants,
        teamMembers,
        leaseDocs: leases,
    };
}

// Check if user is over their plan limits (for downgrade safe mode)
export async function getOverLimitFlags(userId: string): Promise<{
    properties: boolean;
    tenants: boolean;
    teamMembers: boolean;
    leaseDocs: boolean;
}> {
    const plan = await getUserPlan(userId);
    const limits = getPlanLimits(plan);
    const usage = await getUserUsage(userId);

    return {
        properties: usage.properties > limits.maxProperties,
        tenants: usage.tenants > limits.maxTenants,
        teamMembers: usage.teamMembers > limits.teamMembers,
        leaseDocs: usage.leaseDocs > limits.leaseDocsLimit,
    };
}

// Create upgrade required error
export function createUpgradeError(
    feature: string,
    planRequired: PlanType,
    message: string,
    currentLimit: number | string,
    currentUsage: number
): UpgradeRequiredError {
    return {
        code: 'UPGRADE_REQUIRED',
        planRequired,
        feature,
        message,
        currentLimit,
        currentUsage,
    };
}

// Assert that user can perform an action (throws UpgradeRequiredError if not)
export async function assertPlanAllows(
    userId: string,
    action: FeatureAction,
    context?: { propertyId?: string }
): Promise<void> {
    const plan = await getUserPlan(userId);
    const limits = getPlanLimits(plan);
    const usage = await getUserUsage(userId);

    switch (action) {
        case 'create_property': {
            if (usage.properties >= limits.maxProperties) {
                throw createUpgradeError(
                    'properties',
                    'PRO',
                    `Free plan supports ${limits.maxProperties} property. Upgrade to Pro to add more properties.`,
                    limits.maxProperties,
                    usage.properties
                );
            }
            break;
        }

        case 'create_tenant': {
            if (usage.tenants >= limits.maxTenants) {
                throw createUpgradeError(
                    'tenants',
                    'PRO',
                    `Free plan supports ${limits.maxTenants} tenants. Upgrade to Pro to add more tenants.`,
                    limits.maxTenants,
                    usage.tenants
                );
            }
            break;
        }

        case 'enable_auto_reminders': {
            if (!limits.autoReminders) {
                throw createUpgradeError(
                    'autoReminders',
                    'PRO',
                    'Automated rent reminders are available on Pro and Business plans. Upgrade to enable this feature.',
                    0,
                    0
                );
            }
            break;
        }

        case 'generate_reports': {
            if (!limits.reports) {
                throw createUpgradeError(
                    'reports',
                    'PRO',
                    'Financial reports are available on Pro and Business plans. Upgrade to generate reports.',
                    0,
                    0
                );
            }
            break;
        }

        case 'export_data': {
            if (!limits.exports) {
                throw createUpgradeError(
                    'exports',
                    'PRO',
                    'Data export is available on Pro and Business plans. Upgrade to export your data.',
                    0,
                    0
                );
            }
            break;
        }

        case 'invite_team_member': {
            if (limits.teamMembers === 0) {
                throw createUpgradeError(
                    'teamMembers',
                    'BUSINESS',
                    'Team collaboration is available on the Business plan. Upgrade to invite team members.',
                    0,
                    0
                );
            }
            if (usage.teamMembers >= limits.teamMembers) {
                throw createUpgradeError(
                    'teamMembers',
                    'BUSINESS',
                    `Business plan supports up to ${limits.teamMembers} team members. You've reached the limit.`,
                    limits.teamMembers,
                    usage.teamMembers
                );
            }
            break;
        }

        default:
            throw new Error(`Unknown action: ${action}`);
    }
}

// Check if user can perform an action (returns boolean, doesn't throw)
export async function canUser(
    userId: string,
    action: FeatureAction
): Promise<boolean> {
    try {
        await assertPlanAllows(userId, action);
        return true;
    } catch {
        return false;
    }
}

// Get recommended plan based on usage
export function getRecommendedPlan(usage: {
    properties: number;
    tenants: number;
    teamMembers: number;
}): PlanType {
    if (usage.teamMembers > 0 || usage.properties > 10 || usage.tenants > 50) {
        return 'BUSINESS';
    }
    if (usage.properties > 1 || usage.tenants > 3) {
        return 'PRO';
    }
    return 'FREE';
}

// Format limit for display
export function formatLimit(limit: number): string {
    if (limit === Infinity || limit === Number.POSITIVE_INFINITY) {
        return 'Unlimited';
    }
    return limit.toString();
}

// Check if plan is paid
export function isPaidPlan(plan: PlanType): boolean {
    return plan !== 'FREE';
}

// Get next available plan for upgrade
export function getNextPlan(currentPlan: PlanType): PlanType | null {
    switch (currentPlan) {
        case 'FREE':
            return 'PRO';
        case 'PRO':
            return 'BUSINESS';
        case 'BUSINESS':
            return null;
        default:
            return 'PRO';
    }
}