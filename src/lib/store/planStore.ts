// Plan store for managing subscription state on the client
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type PlanType = 'FREE' | 'PRO' | 'BUSINESS'
export type PlanStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELED'

export interface PlanLimits {
    maxProperties: number
    maxTenants: number
    autoReminders: boolean
    reports: boolean
    exports: boolean
    teamMembers: number
    leaseDocsLimit: number
    whiteLabel: boolean
    support: string
}

export interface PlanInfo {
    name: string
    price: number
    description: string
    limits: PlanLimits
    features: string[]
}

export interface PlanUsage {
    properties: number
    tenants: number
    teamMembers: number
    leaseDocs: number
}

export interface OverLimitFlags {
    properties: boolean
    tenants: boolean
    teamMembers: boolean
    leaseDocs: boolean
}

export interface UpgradeRequiredError {
    code: 'UPGRADE_REQUIRED'
    planRequired: PlanType
    feature: string
    message: string
    currentLimit: number | string
    currentUsage: number
}

interface PlanState {
    // Plan data
    plan: PlanType
    planInfo: PlanInfo | null
    limits: PlanLimits | null
    usage: PlanUsage | null
    overLimitFlags: OverLimitFlags | null
    isOverLimit: boolean
    status: PlanStatus | null
    stripeCustomerId: string | null
    stripeSubscriptionId: string | null

    // Loading state
    isLoading: boolean
    error: string | null

    // Modal state
    upgradeModalOpen: boolean
    upgradeError: UpgradeRequiredError | null

    // Actions
    setPlanData: (data: {
        plan: PlanType
        planInfo: PlanInfo
        limits: PlanLimits
        usage: PlanUsage
        overLimitFlags: OverLimitFlags
        isOverLimit: boolean
        status: PlanStatus | null
        stripeCustomerId: string | null
        stripeSubscriptionId: string | null
    }) => void

    setLoading: (loading: boolean) => void
    setError: (error: string | null) => void

    openUpgradeModal: (error?: UpgradeRequiredError) => void
    closeUpgradeModal: () => void

    // Feature checks
    canAddProperty: () => boolean
    canAddTenant: () => boolean
    canUseAutoReminders: () => boolean
    canUseReports: () => boolean
    canUseExports: () => boolean
    canInviteTeamMember: () => boolean

    // Fetch plan data
    fetchPlanData: (token: string) => Promise<void>
}

export const usePlanStore = create<PlanState>()(
    persist(
        (set, get) => ({
            // Initial state
            plan: 'FREE',
            planInfo: null,
            limits: null,
            usage: null,
            overLimitFlags: null,
            isOverLimit: false,
            status: null,
            stripeCustomerId: null,
            stripeSubscriptionId: null,
            isLoading: false,
            error: null,
            upgradeModalOpen: false,
            upgradeError: null,

            // Actions
            setPlanData: (data) => set({
                plan: data.plan,
                planInfo: data.planInfo,
                limits: data.limits,
                usage: data.usage,
                overLimitFlags: data.overLimitFlags,
                isOverLimit: data.isOverLimit,
                status: data.status,
                stripeCustomerId: data.stripeCustomerId,
                stripeSubscriptionId: data.stripeSubscriptionId,
            }),

            setLoading: (loading) => set({ isLoading: loading }),
            setError: (error) => set({ error }),

            openUpgradeModal: (error) => set({
                upgradeModalOpen: true,
                upgradeError: error || null
            }),
            closeUpgradeModal: () => set({
                upgradeModalOpen: false,
                upgradeError: null
            }),

            // Feature checks
            canAddProperty: () => {
                const { limits, usage } = get()
                if (!limits || !usage) return true // Default to allowing if not loaded
                return usage.properties < limits.maxProperties
            },

            canAddTenant: () => {
                const { limits, usage } = get()
                if (!limits || !usage) return true
                return usage.tenants < limits.maxTenants
            },

            canUseAutoReminders: () => {
                const { limits } = get()
                if (!limits) return false
                return limits.autoReminders
            },

            canUseReports: () => {
                const { limits } = get()
                if (!limits) return false
                return limits.reports
            },

            canUseExports: () => {
                const { limits } = get()
                if (!limits) return false
                return limits.exports
            },

            canInviteTeamMember: () => {
                const { limits, usage } = get()
                if (!limits || !usage) return false
                return limits.teamMembers > 0 && usage.teamMembers < limits.teamMembers
            },

            // Fetch plan data from API
            fetchPlanData: async (token) => {
                set({ isLoading: true, error: null })
                try {
                    const response = await fetch('/api/plan', {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    })

                    if (!response.ok) {
                        throw new Error('Failed to fetch plan data')
                    }

                    const data = await response.json()
                    set({
                        plan: data.plan,
                        planInfo: data.planInfo,
                        limits: data.limits,
                        usage: data.usage,
                        overLimitFlags: data.overLimitFlags,
                        isOverLimit: data.isOverLimit,
                        status: data.status,
                        stripeCustomerId: data.stripeCustomerId,
                        stripeSubscriptionId: data.stripeSubscriptionId,
                        isLoading: false,
                    })
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'Failed to fetch plan data',
                        isLoading: false
                    })
                }
            },
        }),
        {
            name: 'plan-storage',
            partialize: (state) => ({
                plan: state.plan,
                // Don't persist usage as it changes frequently
            }),
        }
    )
)

// Helper hook to check if an error is an upgrade required error
export function isUpgradeRequiredError(error: unknown): error is UpgradeRequiredError {
    return (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as UpgradeRequiredError).code === 'UPGRADE_REQUIRED'
    )
}
