'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/auth'
import {
    Wrench,
    ArrowLeft,
    Pencil,
    Trash2,
    Calendar,
    DollarSign,
    Home,
    User,
    AlertTriangle,
    CheckCircle,
    Clock,
} from 'lucide-react'

interface Maintenance {
    id: string
    title: string
    description: string | null
    priority: string
    status: string
    estimatedCost: number | null
    actualCost: number | null
    scheduledDate: Date | null
    completedDate: Date | null
    notes: string | null
    createdAt: Date
    property: { id: string; name: string; address: string; city: string } | null
    tenant: { id: string; firstName: string; lastName: string; email: string } | null
}

export default function MaintenanceDetailPage() {
    const router = useRouter()
    const params = useParams()
    const maintenanceId = params.id as string
    const { token } = useAuthStore()
    const [maintenance, setMaintenance] = useState<Maintenance | null>(null)
    const [isLoading, setIsLoading] = useState(true)

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
                setMaintenance(data.maintenance)
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

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this maintenance request?')) return

        try {
            const response = await fetch(`/api/maintenance/${maintenanceId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            if (response.ok) {
                router.push('/dashboard/maintenance')
            }
        } catch (error) {
            console.error('Failed to delete maintenance:', error)
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending':
                return <Clock className="w-5 h-5 text-yellow-500" />
            case 'in_progress':
                return <Wrench className="w-5 h-5 text-blue-500" />
            case 'completed':
                return <CheckCircle className="w-5 h-5 text-green-500" />
            case 'cancelled':
                return <AlertTriangle className="w-5 h-5 text-gray-500" />
            default:
                return <Clock className="w-5 h-5 text-gray-500" />
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-700'
            case 'in_progress':
                return 'bg-blue-100 text-blue-700'
            case 'completed':
                return 'bg-green-100 text-green-700'
            case 'cancelled':
                return 'bg-gray-100 text-gray-700'
            default:
                return 'bg-gray-100 text-gray-700'
        }
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'low':
                return 'bg-gray-100 text-gray-700'
            case 'medium':
                return 'bg-yellow-100 text-yellow-700'
            case 'high':
                return 'bg-orange-100 text-orange-700'
            case 'urgent':
                return 'bg-red-100 text-red-700'
            default:
                return 'bg-gray-100 text-gray-700'
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (!maintenance) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-gray-900">Maintenance request not found</h2>
                <Link href="/dashboard/maintenance" className="text-blue-600 hover:underline mt-4 inline-block">
                    Back to Maintenance
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard/maintenance"
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{maintenance.title}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            {getStatusIcon(maintenance.status)}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(maintenance.status)}`}>
                                {maintenance.status.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(maintenance.priority)}`}>
                                {maintenance.priority.toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href={`/dashboard/maintenance/${maintenanceId}/edit`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                        <Pencil className="w-4 h-4" />
                        Edit
                    </Link>
                    <button
                        onClick={handleDelete}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete
                    </button>
                </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Property & Tenant */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>
                    {maintenance.property ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Home className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Property</p>
                                    <Link
                                        href={`/dashboard/properties/${maintenance.property.id}`}
                                        className="font-medium text-blue-600 hover:underline"
                                    >
                                        {maintenance.property.name}
                                    </Link>
                                    <p className="text-sm text-gray-500">
                                        {maintenance.property.address}, {maintenance.property.city}
                                    </p>
                                </div>
                            </div>
                            {maintenance.tenant && (
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        <User className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Reported By</p>
                                        <Link
                                            href={`/dashboard/tenants/${maintenance.tenant.id}`}
                                            className="font-medium text-blue-600 hover:underline"
                                        >
                                            {maintenance.tenant.firstName} {maintenance.tenant.lastName}
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-gray-500">No property assigned</p>
                    )}
                </div>

                {/* Costs & Dates */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Costs & Timeline</h2>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <DollarSign className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Estimated Cost</p>
                                <p className="font-medium text-gray-900">
                                    {maintenance.estimatedCost ? `$${maintenance.estimatedCost.toLocaleString()}` : 'Not estimated'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <DollarSign className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Actual Cost</p>
                                <p className="font-medium text-gray-900">
                                    {maintenance.actualCost ? `$${maintenance.actualCost.toLocaleString()}` : 'Not recorded'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <Calendar className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Scheduled Date</p>
                                <p className="font-medium text-gray-900">
                                    {maintenance.scheduledDate
                                        ? new Date(maintenance.scheduledDate).toLocaleDateString()
                                        : 'Not scheduled'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Completed Date</p>
                                <p className="font-medium text-gray-900">
                                    {maintenance.completedDate
                                        ? new Date(maintenance.completedDate).toLocaleDateString()
                                        : 'Not completed'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Description */}
            {maintenance.description && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
                    <p className="text-gray-700">{maintenance.description}</p>
                </div>
            )}

            {/* Notes */}
            {maintenance.notes && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
                    <p className="text-gray-700">{maintenance.notes}</p>
                </div>
            )}
        </div>
    )
}
