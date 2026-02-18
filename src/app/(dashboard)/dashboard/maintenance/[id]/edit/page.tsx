'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/auth'
import { ArrowLeft, Save } from 'lucide-react'

export default function EditMaintenancePage() {
    const router = useRouter()
    const params = useParams()
    const maintenanceId = params.id as string
    const { token } = useAuthStore()
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'medium',
        status: 'pending',
        estimatedCost: '',
        actualCost: '',
        scheduledDate: '',
        completedDate: '',
        notes: '',
    })

    useEffect(() => {
        if (maintenanceId) {
            fetchMaintenance()
        }
    }, [maintenanceId])

    const fetchMaintenance = async () => {
        try {
            const response = await fetch(`/api/maintenance/${maintenanceId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            if (response.ok) {
                const data = await response.json()
                const m = data.maintenance
                setFormData({
                    title: m.title,
                    description: m.description || '',
                    priority: m.priority,
                    status: m.status,
                    estimatedCost: m.estimatedCost?.toString() || '',
                    actualCost: m.actualCost?.toString() || '',
                    scheduledDate: m.scheduledDate ? new Date(m.scheduledDate).toISOString().split('T')[0] : '',
                    completedDate: m.completedDate ? new Date(m.completedDate).toISOString().split('T')[0] : '',
                    notes: m.notes || '',
                })
            } else {
                router.push('/dashboard/maintenance')
            }
        } catch (error) {
            console.error('Failed to fetch maintenance:', error)
            router.push('/dashboard/maintenance')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)

        try {
            const response = await fetch(`/api/maintenance/${maintenanceId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...formData,
                    estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : null,
                    actualCost: formData.actualCost ? parseFloat(formData.actualCost) : null,
                    scheduledDate: formData.scheduledDate || null,
                    completedDate: formData.completedDate || null,
                }),
            })

            if (response.ok) {
                router.push(`/dashboard/maintenance/${maintenanceId}`)
            } else {
                const error = await response.json()
                alert(error.error || 'Failed to update maintenance request')
            }
        } catch (error) {
            console.error('Failed to update maintenance:', error)
            alert('Failed to update maintenance request')
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
                    href={`/dashboard/maintenance/${maintenanceId}`}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Edit Maintenance Request</h1>
                    <p className="text-gray-500">Update maintenance details</p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Title */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Title
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                    </div>

                    {/* Priority */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Priority
                        </label>
                        <select
                            value={formData.priority}
                            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                        </select>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Status
                        </label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    {/* Estimated Cost */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Estimated Cost
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.estimatedCost}
                            onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                    </div>

                    {/* Actual Cost */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Actual Cost
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.actualCost}
                            onChange={(e) => setFormData({ ...formData, actualCost: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                    </div>

                    {/* Scheduled Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Scheduled Date
                        </label>
                        <input
                            type="date"
                            value={formData.scheduledDate}
                            onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                    </div>

                    {/* Completed Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Completed Date
                        </label>
                        <input
                            type="date"
                            value={formData.completedDate}
                            onChange={(e) => setFormData({ ...formData, completedDate: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                    </div>

                    {/* Notes */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Notes
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-4 mt-6 pt-6 border-t border-gray-200">
                    <Link
                        href={`/dashboard/maintenance/${maintenanceId}`}
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
