'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/auth'
import {
    ArrowLeft,
    Save,
    Home,
    MapPin,
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
}

export default function EditPropertyPage() {
    const router = useRouter()
    const params = useParams()
    const propertyId = params.id as string
    const { token } = useAuthStore()
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        propertyType: 'apartment',
        bedrooms: 1,
        bathrooms: 1,
        squareFeet: '',
    })

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
                const property = data.property
                setFormData({
                    name: property.name,
                    address: property.address,
                    city: property.city,
                    state: property.state,
                    zipCode: property.zipCode,
                    propertyType: property.propertyType,
                    bedrooms: property.bedrooms,
                    bathrooms: property.bathrooms,
                    squareFeet: property.squareFeet?.toString() || '',
                })
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)

        try {
            const response = await fetch(`/api/properties/${propertyId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...formData,
                    squareFeet: formData.squareFeet ? parseInt(formData.squareFeet) : null,
                }),
            })

            if (response.ok) {
                router.push(`/dashboard/properties/${propertyId}`)
            } else {
                const error = await response.json()
                alert(error.error || 'Failed to update property')
            }
        } catch (error) {
            console.error('Failed to update property:', error)
            alert('Failed to update property')
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
                    href={`/dashboard/properties/${propertyId}`}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Edit Property</h1>
                    <p className="text-gray-500">Update property details</p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Property Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Property Name
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            required
                        />
                    </div>

                    {/* Property Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Property Type
                        </label>
                        <select
                            value={formData.propertyType}
                            onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        >
                            <option value="apartment">Apartment</option>
                            <option value="house">House</option>
                            <option value="condo">Condo</option>
                            <option value="duplex">Duplex</option>
                            <option value="townhouse">Townhouse</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    {/* Address */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Street Address
                        </label>
                        <input
                            type="text"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            required
                        />
                    </div>

                    {/* City */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            City
                        </label>
                        <input
                            type="text"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            required
                        />
                    </div>

                    {/* State */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            State
                        </label>
                        <input
                            type="text"
                            value={formData.state}
                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            required
                        />
                    </div>

                    {/* ZIP Code */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            ZIP Code
                        </label>
                        <input
                            type="text"
                            value={formData.zipCode}
                            onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            required
                        />
                    </div>

                    {/* Bedrooms */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Bedrooms
                        </label>
                        <input
                            type="number"
                            min="0"
                            value={formData.bedrooms}
                            onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value) || 0 })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            required
                        />
                    </div>

                    {/* Bathrooms */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Bathrooms
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={formData.bathrooms}
                            onChange={(e) => setFormData({ ...formData, bathrooms: parseFloat(e.target.value) || 0 })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            required
                        />
                    </div>

                    {/* Square Feet */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Square Feet (optional)
                        </label>
                        <input
                            type="number"
                            min="0"
                            value={formData.squareFeet}
                            onChange={(e) => setFormData({ ...formData, squareFeet: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-4 mt-6 pt-6 border-t border-gray-200">
                    <Link
                        href={`/dashboard/properties/${propertyId}`}
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
