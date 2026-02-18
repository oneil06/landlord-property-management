'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/auth'
import { ArrowLeft, Save } from 'lucide-react'

export default function EditLeasePage() {
    const router = useRouter()
    const params = useParams()
    const leaseId = params.id as string
    const { token } = useAuthStore()
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [formData, setFormData] = useState({
        startDate: '',
        endDate: '',
        monthlyRent: '',
        securityDeposit: '',
        status: 'active',
    })

    useEffect(() => {
        if (leaseId) {
            fetchLease()
        }
    }, [leaseId])

    const fetchLease = async () => {
        try {
            const response = await fetch(`/api/leases/${leaseId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            if (response.ok) {
                const data = await response.json()
                const lease = data.lease
                setFormData({
                    startDate: new Date(lease.startDate).toISOString().split('T')[0],
                    endDate: new Date(lease.endDate).toISOString().split('T')[0],
                    monthlyRent: lease.monthlyRent.toString(),
                    securityDeposit: lease.securityDeposit.toString(),
                    status: lease.status,
                })
            } else {
                router.push('/dashboard/leases')
            }
        } catch (error) {
            console.error('Failed to fetch lease:', error)
            router.push('/dashboard/leases')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)

        try {
            const response = await fetch(`/api/leases/${leaseId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    startDate: formData.startDate,
                    endDate: formData.endDate,
                    monthlyRent: parseFloat(formData.monthlyRent),
                    securityDeposit: parseFloat(formData.securityDeposit),
                    status: formData.status,
                }),
            })

            if (response.ok) {
                router.push(`/dashboard/leases/${leaseId}`)
            } else {
                const error = await response.json()
                alert(error.error || 'Failed to update lease')
            }
        } catch (error) {
            console.error('Failed to update lease:', error)
            alert('Failed to update lease')
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href={`/dashboard/leases/${leaseId}`}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Edit Lease</h1>
                    <p className="text-gray-500">Update lease details</p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Start Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            required
                        />
                    </div>

                    {/* End Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            End Date
                        </label>
                        <input
                            type="date"
                            value={formData.endDate}
                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            required
                        />
                    </div>

                    {/* Monthly Rent */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Monthly Rent
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.monthlyRent}
                            onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            required
                        />
                    </div>

                    {/* Security Deposit */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Security Deposit
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.securityDeposit}
                            onChange={(e) => setFormData({ ...formData, securityDeposit: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            required
                        />
                    </div>

                    {/* Status */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Status
                        </label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        >
                            <option value="active">Active</option>
                            <option value="expired">Expired</option>
                            <option value="terminated">Terminated</option>
                        </select>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-4 mt-6 pt-6 border-t border-gray-200">
                    <Link
                        href={`/dashboard/leases/${leaseId}`}
                        className="px-4 py-2 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save className="w-4 h-4" />
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    )
}
