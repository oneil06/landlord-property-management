'use client'

import { X, Crown, ArrowRight } from 'lucide-react'
import { usePlanStore, isUpgradeRequiredError, UpgradeRequiredError, PlanType } from '@/lib/store/planStore'
import { PLAN_INFO } from '@/lib/plans'
import { useRouter } from 'next/navigation'

interface UpgradeModalProps {
    isOpen?: boolean
    error?: UpgradeRequiredError | null
    onClose?: () => void
}

export function UpgradeModal({ isOpen, error, onClose }: UpgradeModalProps) {
    const router = useRouter()
    const store = usePlanStore()

    // Use props if provided, otherwise use store state
    const modalOpen = isOpen ?? store.upgradeModalOpen
    const upgradeError = error ?? store.upgradeError
    const handleClose = onClose ?? store.closeUpgradeModal

    if (!modalOpen) return null

    // Determine which plan to recommend
    const recommendedPlan: PlanType = upgradeError?.planRequired ?? 'PRO'
    const planInfo = PLAN_INFO[recommendedPlan]

    const handleUpgrade = () => {
        handleClose()
        router.push('/dashboard/billing')
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8 text-white">
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-3 mb-2">
                        <Crown className="w-8 h-8" />
                        <h2 className="text-2xl font-bold">Upgrade to Unlock</h2>
                    </div>
                    <p className="text-white/80 text-sm">
                        {upgradeError?.message || 'This feature requires a higher plan'}
                    </p>
                </div>

                {/* Content */}
                <div className="px-6 py-6">
                    {/* Current limit info */}
                    {upgradeError && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Current usage</span>
                                <span className="font-semibold">
                                    {upgradeError.currentUsage} / {upgradeError.currentLimit}
                                </span>
                            </div>
                            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-red-500 rounded-full"
                                    style={{
                                        width: `${Math.min(100, (upgradeError.currentUsage / (typeof upgradeError.currentLimit === 'number' ? upgradeError.currentLimit : 1)) * 100)}%`
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Recommended plan */}
                    <div className="border-2 border-blue-500 rounded-xl p-4 mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <h3 className="font-bold text-lg text-gray-900">{planInfo.name}</h3>
                                <p className="text-gray-700 text-sm">{planInfo.description}</p>
                            </div>
                            <div className="text-right">
                                <span className="text-3xl font-bold text-gray-900">${planInfo.price}</span>
                                <span className="text-gray-700">/mo</span>
                            </div>
                        </div>

                        <ul className="space-y-2">
                            {planInfo.features.slice(0, 4).map((feature, index) => (
                                <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                                    <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleUpgrade}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
                        >
                            Upgrade to {planInfo.name}
                            <ArrowRight className="w-4 h-4" />
                        </button>

                        <button
                            onClick={handleClose}
                            className="w-full text-gray-600 py-2 px-4 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                        >
                            Not now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Helper function to show upgrade modal from API error
export function handleApiError(error: unknown): boolean {
    if (isUpgradeRequiredError(error)) {
        usePlanStore.getState().openUpgradeModal(error)
        return true
    }
    return false
}