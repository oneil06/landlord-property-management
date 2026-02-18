'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    Crown,
    Check,
    ArrowRight,
    CreditCard,
    BarChart3,
    Users,
    FileText,
    Bell,
    Download,
    Mail,
    Shield
} from 'lucide-react'
import { usePlanStore, PlanType } from '@/lib/store/planStore'
import { useAuthStore } from '@/lib/auth'
import { PLAN_INFO, PLAN_LIMITS, formatLimit } from '@/lib/plans'

export default function BillingPage() {
    const router = useRouter()
    const { token } = useAuthStore()
    const {
        plan,
        planInfo,
        limits,
        usage,
        isOverLimit,
        overLimitFlags,
        fetchPlanData
    } = usePlanStore()

    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (token) {
            fetchPlanData(token)
        }
    }, [fetchPlanData, token])

    const handleUpgrade = async (targetPlan: PlanType) => {
        setIsLoading(true)
        // TODO: Implement Stripe checkout
        console.log('Upgrade to:', targetPlan)
        // For now, just show an alert
        alert(`Stripe checkout for ${targetPlan} will be implemented soon!`)
        setIsLoading(false)
    }

    const plans = [
        { type: 'FREE' as PlanType, ...PLAN_INFO.FREE },
        { type: 'PRO' as PlanType, ...PLAN_INFO.PRO },
        { type: 'BUSINESS' as PlanType, ...PLAN_INFO.BUSINESS },
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Billing & Plans</h1>
                    <p className="mt-1 text-gray-700">Manage your subscription and billing</p>
                </div>
            </div>

            {/* Over limit warning */}
            {isOverLimit && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-amber-800 font-semibold">You're over the Free plan limits</h3>
                            <p className="text-amber-700 text-sm mt-1">
                                You have exceeded the limits for:
                                {overLimitFlags?.properties && ' Properties'}
                                {overLimitFlags?.tenants && ', Tenants'}
                                {overLimitFlags?.teamMembers && ', Team Members'}
                                . Upgrade to regain full access.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Current Plan Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <Crown className="w-5 h-5 text-blue-600" />
                            <h2 className="text-lg font-semibold text-gray-900">Current Plan</h2>
                        </div>
                        <p className="text-3xl font-bold mt-2 text-gray-900">{planInfo?.name || 'Free'}</p>
                        <p className="mt-1 text-gray-700">{planInfo?.description}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-3xl font-bold text-gray-900">${planInfo?.price || 0}</p>
                        <p className="text-gray-700">/month</p>
                    </div>
                </div>

                {/* Usage */}
                <div className="mt-6 border-t pt-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Current Usage</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-1 text-gray-700">
                                <BarChart3 className="w-4 h-4" />
                                <span className="text-sm font-medium">Properties</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">
                                {usage?.properties || 0}
                                <span className="text-sm font-normal text-gray-700">
                                    / {limits ? formatLimit(limits.maxProperties) : 1}
                                </span>
                            </p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-1 text-gray-700">
                                <Users className="w-4 h-4" />
                                <span className="text-sm font-medium">Tenants</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">
                                {usage?.tenants || 0}
                                <span className="text-sm font-normal text-gray-700">
                                    / {limits ? formatLimit(limits.maxTenants) : 3}
                                </span>
                            </p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-1 text-gray-700">
                                <Users className="w-4 h-4" />
                                <span className="text-sm font-medium">Team Members</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">
                                {usage?.teamMembers || 0}
                                <span className="text-sm font-normal text-gray-700">
                                    / {limits ? formatLimit(limits.teamMembers) : 0}
                                </span>
                            </p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-1 text-gray-700">
                                <FileText className="w-4 h-4" />
                                <span className="text-sm font-medium">Lease Docs</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">
                                {usage?.leaseDocs || 0}
                                <span className="text-sm font-normal text-gray-700">
                                    / {limits ? formatLimit(limits.leaseDocsLimit) : 5}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Plan Comparison */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold mb-6 text-gray-900">Compare Plans</h2>

                <div className="grid md:grid-cols-3 gap-6">
                    {plans.map((p) => {
                        const isCurrentPlan = p.type === plan
                        const isUpgrade = PLAN_INFO[p.type].price > (planInfo?.price || 0)

                        return (
                            <div
                                key={p.type}
                                className={`rounded-xl border-2 p-6 ${isCurrentPlan
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200'
                                    }`}
                            >
                                {isCurrentPlan && (
                                    <span className="inline-block bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded-full mb-3">
                                        Current Plan
                                    </span>
                                )}

                                <h3 className="text-xl font-bold text-gray-900">{p.name}</h3>
                                <p className="text-sm mt-1 text-gray-700">{p.description}</p>

                                <div className="mt-4">
                                    <span className="text-4xl font-bold text-gray-900">${p.price}</span>
                                    <span className="text-gray-700">/mo</span>
                                </div>

                                <ul className="mt-6 space-y-3">
                                    <li className="flex items-center gap-2 text-sm text-gray-700">
                                        <Check className="w-4 h-4 text-green-500" />
                                        {formatLimit(p.limits.maxProperties)} properties
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-gray-700">
                                        <Check className="w-4 h-4 text-green-500" />
                                        {formatLimit(p.limits.maxTenants)} tenants
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-gray-700">
                                        {p.limits.autoReminders ? (
                                            <Check className="w-4 h-4 text-green-500" />
                                        ) : (
                                            <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                                        )}
                                        Automated reminders
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-gray-700">
                                        {p.limits.reports ? (
                                            <Check className="w-4 h-4 text-green-500" />
                                        ) : (
                                            <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                                        )}
                                        Financial reports
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-gray-700">
                                        {p.limits.exports ? (
                                            <Check className="w-4 h-4 text-green-500" />
                                        ) : (
                                            <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                                        )}
                                        Export PDF/CSV
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-gray-700">
                                        {p.limits.teamMembers > 0 ? (
                                            <Check className="w-4 h-4 text-green-500" />
                                        ) : (
                                            <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                                        )}
                                        {p.limits.teamMembers > 0 ? `${p.limits.teamMembers} team members` : 'No team members'}
                                    </li>
                                </ul>

                                {!isCurrentPlan && (
                                    <button
                                        onClick={() => handleUpgrade(p.type)}
                                        disabled={isLoading || !isUpgrade}
                                        className={`w-full mt-6 py-2 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 ${isUpgrade
                                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            }`}
                                    >
                                        {isUpgrade ? 'Upgrade' : 'Downgrade'}
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Billing History Placeholder */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <CreditCard className="w-5 h-5 text-gray-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Billing History</h2>
                </div>

                {plan === 'FREE' ? (
                    <p className="text-gray-700">No billing history yet. Upgrade to a paid plan to see your invoices.</p>
                ) : (
                    <p className="text-gray-700">Billing history will appear here once Stripe is integrated.</p>
                )}
            </div>

            {/* Manage Subscription */}
            {plan !== 'FREE' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold mb-4 text-gray-900">Manage Subscription</h2>
                    <div className="flex gap-4">
                        <button
                            onClick={() => alert('Stripe customer portal will be implemented soon!')}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                            Update Payment Method
                        </button>
                        <button
                            onClick={() => alert('Cancel subscription will be implemented soon!')}
                            className="px-4 py-2 border border-red-300 rounded-lg text-red-600 hover:bg-red-50"
                        >
                            Cancel Subscription
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}