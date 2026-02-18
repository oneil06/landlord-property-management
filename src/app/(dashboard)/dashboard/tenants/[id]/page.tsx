'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/auth'
import {
    User,
    Mail,
    Phone,
    Home,
    ArrowLeft,
    Pencil,
    Trash2,
    FileText,
    Wrench,
    Calendar,
    DollarSign,
} from 'lucide-react'

interface Tenant {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string
    emergencyContact?: string | null
    emergencyPhone?: string | null
    employmentInfo?: string | null
    monthlyIncome?: number | null
    moveInDate?: Date | null
    moveOutDate?: Date | null
    status: string
    notes?: string | null
    property?: {
        id: string
        name: string
        address: string
        city: string
        state: string
        zipCode: string
    } | null
    leases?: {
        id: string
        startDate: Date
        endDate: Date
        monthlyRent: number
        status: string
    }[]
    maintenance?: {
        id: string
        title: string
        status: string
        priority: string
        createdAt: Date
    }[]
    _count?: {
        leases: number
        maintenance: number
    }
}

export default function TenantDetailPage() {
    const router = useRouter()
    const params = useParams()
    const tenantId = params.id as string
    const { token } = useAuthStore()
    const [tenant, setTenant] = useState<Tenant | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (tenantId) {
            fetchTenant()
        }
    }, [tenantId])

    const fetchTenant = async () => {
        try {
            const response = await fetch(`/api/tenants/${tenantId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            if (response.ok) {
                const data = await response.json()
                setTenant(data.tenant)
            } else {
                router.push('/dashboard/tenants')
            }
        } catch (error) {
            console.error('Failed to fetch tenant:', error)
            router.push('/dashboard/tenants')
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this tenant?')) return

        try {
            const response = await fetch(`/api/tenants/${tenantId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            if (response.ok) {
                router.push('/dashboard/tenants')
            }
        } catch (error) {
            console.error('Failed to delete tenant:', error)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (!tenant) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-gray-900">Tenant not found</h2>
                <Link href="/dashboard/tenants" className="text-blue-600 hover:underline mt-4 inline-block">
                    Back to Tenants
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
                        href="/dashboard/tenants"
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {tenant.firstName} {tenant.lastName}
                        </h1>
                        <p className="text-gray-500 flex items-center gap-1 mt-1">
                            <Mail className="w-4 h-4" />
                            {tenant.email}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href={`/dashboard/tenants/${tenantId}/edit`}
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

            {/* Tenant Avatar Placeholder */}
            <div className="h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center">
                <User className="w-16 h-16 text-blue-300" />
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Phone className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Phone</p>
                            <p className="font-medium text-gray-900">{tenant.phone || 'N/A'}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <Home className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Property</p>
                            <p className="font-medium text-gray-900">{tenant.property?.name || 'Unassigned'}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <Calendar className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Status</p>
                            <p className="font-medium text-gray-900 capitalize">{tenant.status}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <DollarSign className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Monthly Income</p>
                            <p className="font-medium text-gray-900">
                                {tenant.monthlyIncome ? `$${tenant.monthlyIncome.toLocaleString()}` : 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Info */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-500">Emergency Contact</p>
                            <p className="font-medium text-gray-900">{tenant.emergencyContact || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Emergency Phone</p>
                            <p className="font-medium text-gray-900">{tenant.emergencyPhone || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Employment Info</p>
                            <p className="font-medium text-gray-900">{tenant.employmentInfo || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Move In Date</p>
                            <p className="font-medium text-gray-900">
                                {tenant.moveInDate ? new Date(tenant.moveInDate).toLocaleDateString() : 'N/A'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Move Out Date</p>
                            <p className="font-medium text-gray-900">
                                {tenant.moveOutDate ? new Date(tenant.moveOutDate).toLocaleDateString() : 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Property Info */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Assigned Property</h2>
                    {tenant.property ? (
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-500">Property Name</p>
                                <Link
                                    href={`/dashboard/properties/${tenant.property.id}`}
                                    className="font-medium text-blue-600 hover:underline"
                                >
                                    {tenant.property.name}
                                </Link>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Address</p>
                                <p className="font-medium text-gray-900">
                                    {tenant.property.address}, {tenant.property.city}, {tenant.property.state} {tenant.property.zipCode}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500">No property assigned</p>
                    )}
                </div>
            </div>

            {/* Notes */}
            {tenant.notes && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
                    <p className="text-gray-700">{tenant.notes}</p>
                </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                    href="/dashboard/leases"
                    className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <FileText className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Leases</p>
                            <p className="text-xl font-semibold text-gray-900">{tenant._count?.leases ?? 0}</p>
                        </div>
                    </div>
                </Link>
                <Link
                    href="/dashboard/maintenance"
                    className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <Wrench className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Maintenance Requests</p>
                            <p className="text-xl font-semibold text-gray-900">{tenant._count?.maintenance ?? 0}</p>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Recent Leases */}
            {tenant.leases && tenant.leases.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Leases</h2>
                    <div className="space-y-3">
                        {tenant.leases.map((lease) => (
                            <div
                                key={lease.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                                <div>
                                    <p className="font-medium text-gray-900">
                                        ${lease.monthlyRent.toLocaleString()}/month
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {new Date(lease.startDate).toLocaleDateString()} - {new Date(lease.endDate).toLocaleDateString()}
                                    </p>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${lease.status === 'active' ? 'bg-green-100 text-green-700' :
                                        lease.status === 'expired' ? 'bg-gray-100 text-gray-700' :
                                            'bg-amber-100 text-amber-700'
                                    }`}>
                                    {lease.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}