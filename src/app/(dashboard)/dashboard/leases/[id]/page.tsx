'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/auth'
import {
    FileText,
    ArrowLeft,
    Pencil,
    Trash2,
    Calendar,
    DollarSign,
    Home,
    User,
    CheckCircle,
    Clock,
    XCircle,
} from 'lucide-react'

interface Lease {
    id: string
    startDate: Date
    endDate: Date
    monthlyRent: number
    securityDeposit: number
    status: string
    property: { id: string; name: string; address: string; city: string }
    tenant: { id: string; firstName: string; lastName: string; email: string }
}

export default function LeaseDetailPage() {
    const router = useRouter()
    const params = useParams()
    const leaseId = params.id as string
    const { token } = useAuthStore()
    const [lease, setLease] = useState<Lease | null>(null)
    const [isLoading, setIsLoading] = useState(true)

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
                setLease(data.lease)
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

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this lease?')) return

        try {
            const response = await fetch(`/api/leases/${leaseId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            if (response.ok) {
                router.push('/dashboard/leases')
            }
        } catch (error) {
            console.error('Failed to delete lease:', error)
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active':
                return <CheckCircle className="w-5 h-5 text-green-500" />
            case 'expired':
                return <Clock className="w-5 h-5 text-gray-500" />
            case 'terminated':
                return <XCircle className="w-5 h-5 text-red-500" />
            default:
                return <FileText className="w-5 h-5 text-gray-500" />
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-700'
            case 'expired':
                return 'bg-gray-100 text-gray-700'
            case 'terminated':
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

    if (!lease) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-gray-900">Lease not found</h2>
                <Link href="/dashboard/leases" className="text-blue-600 hover:underline mt-4 inline-block">
                    Back to Leases
                </Link>
            </div>
        )
    }

    const daysRemaining = Math.ceil(
        (new Date(lease.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    )

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard/leases"
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Lease Details</h1>
                        <div className="flex items-center gap-2 mt-1">
                            {getStatusIcon(lease.status)}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lease.status)}`}>
                                {lease.status.toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href={`/dashboard/leases/${leaseId}/edit`}
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

            {/* Lease Summary */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <p className="text-blue-100 text-sm">Monthly Rent</p>
                        <p className="text-2xl font-bold">${lease.monthlyRent.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-blue-100 text-sm">Security Deposit</p>
                        <p className="text-2xl font-bold">${lease.securityDeposit.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-blue-100 text-sm">Lease Duration</p>
                        <p className="text-2xl font-bold">
                            {Math.ceil(
                                (new Date(lease.endDate).getTime() - new Date(lease.startDate).getTime()) /
                                (1000 * 60 * 60 * 24 * 30)
                            )} months
                        </p>
                    </div>
                    <div>
                        <p className="text-blue-100 text-sm">Days Remaining</p>
                        <p className="text-2xl font-bold">{daysRemaining > 0 ? daysRemaining : 0}</p>
                    </div>
                </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Property */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Property</h2>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Home className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <Link
                                href={`/dashboard/properties/${lease.property.id}`}
                                className="font-medium text-blue-600 hover:underline"
                            >
                                {lease.property.name}
                            </Link>
                            <p className="text-sm text-gray-500">
                                {lease.property.address}, {lease.property.city}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tenant */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Tenant</h2>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <User className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <Link
                                href={`/dashboard/tenants/${lease.tenant.id}`}
                                className="font-medium text-blue-600 hover:underline"
                            >
                                {lease.tenant.firstName} {lease.tenant.lastName}
                            </Link>
                            <p className="text-sm text-gray-500">{lease.tenant.email}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Lease Timeline</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <Calendar className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Start Date</p>
                            <p className="font-medium text-gray-900">
                                {new Date(lease.startDate).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <Calendar className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">End Date</p>
                            <p className="font-medium text-gray-900">
                                {new Date(lease.endDate).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
