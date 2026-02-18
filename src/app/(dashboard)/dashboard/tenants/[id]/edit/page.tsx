'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/auth'
import { ArrowLeft, Save } from 'lucide-react'

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
    phone: string
    emergencyContact?: string | null
    emergencyPhone?: string | null
    employmentInfo?: string | null
    monthlyIncome?: number | null
    moveInDate?: string | null
    moveOutDate?: string | null
    status: string
    notes?: string | null
    propertyId?: string | null
}

export default function EditTenantPage() {
    const router = useRouter()
    const params = useParams()
    const tenantId = params.id as string
    const { token } = useAuthStore()
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [properties, setProperties] = useState<Property[]>([])
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        emergencyContact: '',
        emergencyPhone: '',
        employmentInfo: '',
        monthlyIncome: '',
        moveInDate: '',
        moveOutDate: '',
        status: 'active',
        notes: '',
        propertyId: '',
    })

    useEffect(() => {
        if (tenantId) {
            fetchTenant()
            fetchProperties()
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
                const tenant = data.tenant
                setFormData({
                    firstName: tenant.firstName,
                    lastName: tenant.lastName,
                    email: tenant.email,
                    phone: tenant.phone || '',
                    emergencyContact: tenant.emergencyContact || '',
                    emergencyPhone: tenant.emergencyPhone || '',
                    employmentInfo: tenant.employmentInfo || '',
                    monthlyIncome: tenant.monthlyIncome?.toString() || '',
                    moveInDate: tenant.moveInDate ? new Date(tenant.moveInDate).toISOString().split('T')[0] : '',
                    moveOutDate: tenant.moveOutDate ? new Date(tenant.moveOutDate).toISOString().split('T')[0] : '',
                    status: tenant.status,
                    notes: tenant.notes || '',
                    propertyId: tenant.propertyId || '',
                })
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

    const fetchProperties = async () => {
        try {
            const response = await fetch('/api/properties', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            if (response.ok) {
                const data = await response.json()
                setProperties(data.properties || [])
            }
        } catch (error) {
            console.error('Failed to fetch properties:', error)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)

        try {
            const response = await fetch(`/api/tenants/${tenantId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...formData,
                    monthlyIncome: formData.monthlyIncome ? parseFloat(formData.monthlyIncome) : null,
                    propertyId: formData.propertyId || null,
                }),
            })

            if (response.ok) {
                router.push(`/dashboard/tenants/${tenantId}`)
            } else {
                const error = await response.json()
                alert(error.error || 'Failed to update tenant')
            }
        } catch (error) {
            console.error('Failed to update tenant:', error)
            alert('Failed to update tenant')
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
                    href={`/dashboard/tenants/${tenantId}`}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Edit Tenant</h1>
                    <p className="text-gray-500">Update tenant details</p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* First Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            First Name
                        </label>
                        <input
                            type="text"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            required
                        />
                    </div>

                    {/* Last Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Last Name
                        </label>
                        <input
                            type="text"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            required
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            required
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone
                        </label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            required
                        />
                    </div>

                    {/* Property */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Assigned Property
                        </label>
                        <select
                            value={formData.propertyId}
                            onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        >
                            <option value="">No Property</option>
                            {properties.map((property) => (
                                <option key={property.id} value={property.id}>
                                    {property.name} - {property.address}
                                </option>
                            ))}
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
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="pending">Pending</option>
                        </select>
                    </div>

                    {/* Emergency Contact */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Emergency Contact
                        </label>
                        <input
                            type="text"
                            value={formData.emergencyContact}
                            onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                    </div>

                    {/* Emergency Phone */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Emergency Phone
                        </label>
                        <input
                            type="tel"
                            value={formData.emergencyPhone}
                            onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                    </div>

                    {/* Employment Info */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Employment Info
                        </label>
                        <input
                            type="text"
                            value={formData.employmentInfo}
                            onChange={(e) => setFormData({ ...formData, employmentInfo: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                    </div>

                    {/* Monthly Income */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Monthly Income
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.monthlyIncome}
                            onChange={(e) => setFormData({ ...formData, monthlyIncome: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                    </div>

                    {/* Move In Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Move In Date
                        </label>
                        <input
                            type="date"
                            value={formData.moveInDate}
                            onChange={(e) => setFormData({ ...formData, moveInDate: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                    </div>

                    {/* Move Out Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Move Out Date
                        </label>
                        <input
                            type="date"
                            value={formData.moveOutDate}
                            onChange={(e) => setFormData({ ...formData, moveOutDate: e.target.value })}
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
                        href={`/dashboard/tenants/${tenantId}`}
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