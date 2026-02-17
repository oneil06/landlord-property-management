'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth'
import {
    FileText,
    ArrowLeft,
    Building,
    Users,
    DollarSign,
    Calendar,
    Loader2,
} from 'lucide-react'
import Link from 'next/link'

interface Property {
    id: string
    name: string
    address: string
    city: string
}

interface Tenant {
    id: string
    firstName: string
    lastName: string
    email: string
    property: { id: string; name: string } | null
}

export default function NewLeasePage() {
    const router = useRouter()
    const { token } = useAuthStore()
    const [isLoading, setIsLoading] = useState(false)
    const [isLoadingData, setIsLoadingData] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [properties, setProperties] = useState<Property[]>([])
    const [tenants, setTenants] = useState<Tenant[]>([])
    const [formData, setFormData] = useState({
        propertyId: '',
        tenantId: '',
        startDate: '',
        endDate: '',
        monthlyRent: '',
        securityDeposit: '',
        leaseDocument: '',
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [propertiesRes, tenantsRes] = await Promise.all([
                fetch('/api/properties', {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch('/api/tenants', {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ])

            if (propertiesRes.ok) {
                const data = await propertiesRes.json()
                setProperties(data.properties)
            }

            if (tenantsRes.ok) {
                const data = await tenantsRes.json()
                setTenants(data.tenants)
            }
        } catch (error) {
            console.error('Failed to fetch data:', error)
        } finally {
            setIsLoadingData(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/leases', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            })

            const data = await response.json()

            if (!response.ok) {
                setError(data.error || 'Failed to create lease')
                return
            }

            router.push('/dashboard/leases')
        } catch (err) {
            setError('An error occurred. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    // Filter tenants by selected property
    const filteredTenants = formData.propertyId
        ? tenants.filter(t => t.property?.id === formData.propertyId)
        : tenants

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/leases"
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Add New Lease</h1>
                    <p className="text-gray-500">Create a new lease agreement</p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {/* Property and Tenant */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Building className="w-5 h-5" />
                        Property & Tenant
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Property *
                            </label>
                            <select
                                name="propertyId"
                                value={formData.propertyId}
                                onChange={handleChange}
                                required
                                disabled={isLoadingData}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Select a property</option>
                                {properties.map((property) => (
                                    <option key={property.id} value={property.id}>
                                        {property.name} - {property.address}, {property.city}
                                    </option>
                                ))}
                            </select>
                            {properties.length === 0 && !isLoadingData && (
                                <p className="text-sm text-amber-600 mt-2">
                                    No properties found. Please add a property first.
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tenant *
                            </label>
                            <select
                                name="tenantId"
                                value={formData.tenantId}
                                onChange={handleChange}
                                required
                                disabled={isLoadingData}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Select a tenant</option>
                                {filteredTenants.map((tenant) => (
                                    <option key={tenant.id} value={tenant.id}>
                                        {tenant.firstName} {tenant.lastName}
                                    </option>
                                ))}
                            </select>
                            {tenants.length === 0 && !isLoadingData && (
                                <p className="text-sm text-amber-600 mt-2">
                                    No tenants found. Please add a tenant first.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Lease Details */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Lease Details
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Start Date *
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="date"
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                End Date *
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="date"
                                    name="endDate"
                                    value={formData.endDate}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Financial Details */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        Financial Details
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Monthly Rent *
                            </label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="number"
                                    name="monthlyRent"
                                    value={formData.monthlyRent}
                                    onChange={handleChange}
                                    required
                                    min="0"
                                    step="0.01"
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="1500.00"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Security Deposit
                            </label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="number"
                                    name="securityDeposit"
                                    value={formData.securityDeposit}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="1500.00"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Document */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Lease Document
                    </h2>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Document URL (Optional)
                        </label>
                        <input
                            type="url"
                            name="leaseDocument"
                            value={formData.leaseDocument}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="https://example.com/lease.pdf"
                        />
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                    <Link
                        href="/dashboard/leases"
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={isLoading || properties.length === 0 || tenants.length === 0}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <FileText className="w-4 h-4" />
                                Create Lease
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}