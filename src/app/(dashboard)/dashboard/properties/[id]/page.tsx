'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/auth'
import {
    Home,
    MapPin,
    Bed,
    Bath,
    Users,
    Square,
    ArrowLeft,
    Pencil,
    Trash2,
    Wrench,
    DollarSign,
    FileText,
} from 'lucide-react'

interface Property {
    id: string
    name: string
    address: string
    city: string
    state: string
    zipCode: string
    propertyType: string
    bedrooms: number
    bathrooms: number
    squareFeet: number | null
    tenants?: { id: string; firstName: string; lastName: string; email: string }[]
    _count?: { tenants: number; maintenance: number; expenses: number }
}

export default function PropertyDetailPage() {
    const router = useRouter()
    const params = useParams()
    const propertyId = params.id as string
    const { token } = useAuthStore()
    const [property, setProperty] = useState<Property | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (propertyId) {
            fetchProperty()
        }
    }, [propertyId])

    const fetchProperty = async () => {
        try {
            const response = await fetch(`/api/properties/${propertyId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            if (response.ok) {
                const data = await response.json()
                setProperty(data.property)
            } else {
                router.push('/dashboard/properties')
            }
        } catch (error) {
            console.error('Failed to fetch property:', error)
            router.push('/dashboard/properties')
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this property?')) return

        try {
            const response = await fetch(`/api/properties/${propertyId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            if (response.ok) {
                router.push('/dashboard/properties')
            }
        } catch (error) {
            console.error('Failed to delete property:', error)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (!property) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-gray-900">Property not found</h2>
                <Link href="/dashboard/properties" className="text-blue-600 hover:underline mt-4 inline-block">
                    Back to Properties
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
                        href="/dashboard/properties"
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{property.name}</h1>
                        <p className="text-gray-500 flex items-center gap-1 mt-1">
                            <MapPin className="w-4 h-4" />
                            {property.address}, {property.city}, {property.state} {property.zipCode}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href={`/dashboard/properties/${propertyId}/edit`}
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

            {/* Property Image Placeholder */}
            <div className="h-64 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center">
                <Home className="w-24 h-24 text-blue-300" />
            </div>

            {/* Property Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Bed className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Bedrooms</p>
                            <p className="text-xl font-semibold text-gray-900">{property.bedrooms}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Bath className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Bathrooms</p>
                            <p className="text-xl font-semibold text-gray-900">{property.bathrooms}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Square className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Square Feet</p>
                            <p className="text-xl font-semibold text-gray-900">
                                {property.squareFeet ? property.squareFeet.toLocaleString() : 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Tenants</p>
                            <p className="text-xl font-semibold text-gray-900">{property._count?.tenants ?? 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Property Type */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Property Details</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <p className="text-sm text-gray-500">Property Type</p>
                        <p className="font-medium text-gray-900 capitalize">{property.propertyType}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">City</p>
                        <p className="font-medium text-gray-900">{property.city}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">State</p>
                        <p className="font-medium text-gray-900">{property.state}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">ZIP Code</p>
                        <p className="font-medium text-gray-900">{property.zipCode}</p>
                    </div>
                </div>
            </div>

            {/* Tenants */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Tenants</h2>
                    <Link
                        href="/dashboard/tenants/new"
                        className="text-blue-600 hover:underline text-sm font-medium"
                    >
                        Add Tenant
                    </Link>
                </div>
                {(property.tenants?.length ?? 0) > 0 ? (
                    <div className="space-y-3">
                        {property.tenants?.map((tenant) => (
                            <div
                                key={tenant.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                                <div>
                                    <p className="font-medium text-gray-900">
                                        {tenant.firstName} {tenant.lastName}
                                    </p>
                                    <p className="text-sm text-gray-500">{tenant.email}</p>
                                </div>
                                <Link
                                    href={`/dashboard/tenants`}
                                    className="text-blue-600 hover:underline text-sm"
                                >
                                    View
                                </Link>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-center py-4">No tenants assigned to this property</p>
                )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                            <p className="text-xl font-semibold text-gray-900">{property._count?.maintenance ?? 0}</p>
                        </div>
                    </div>
                </Link>
                <Link
                    href="/dashboard/expenses"
                    className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <DollarSign className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Expenses</p>
                            <p className="text-xl font-semibold text-gray-900">{property._count?.expenses ?? 0}</p>
                        </div>
                    </div>
                </Link>
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
                            <p className="text-xl font-semibold text-gray-900">{property._count?.tenants ?? 0}</p>
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    )
}
