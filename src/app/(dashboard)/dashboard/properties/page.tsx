'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/auth'
import {
    Building,
    Plus,
    MapPin,
    Bed,
    Bath,
    Users,
    MoreVertical,
    Pencil,
    Trash2,
    Eye,
    Search,
    Filter,
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
    tenants: { id: string; firstName: string; lastName: string }[]
    _count: { tenants: number; maintenance: number; expenses: number }
}

export default function PropertiesPage() {
    const router = useRouter()
    const { token } = useAuthStore()
    const [properties, setProperties] = useState<Property[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterType, setFilterType] = useState('all')
    const [openMenu, setOpenMenu] = useState<string | null>(null)

    useEffect(() => {
        fetchProperties()
    }, [])

    const fetchProperties = async () => {
        try {
            const response = await fetch('/api/properties', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            if (response.ok) {
                const data = await response.json()
                setProperties(data.properties)
            }
        } catch (error) {
            console.error('Failed to fetch properties:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this property?')) return

        try {
            const response = await fetch(`/api/properties/${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            if (response.ok) {
                setProperties(properties.filter((p) => p.id !== id))
            }
        } catch (error) {
            console.error('Failed to delete property:', error)
        }
    }

    const filteredProperties = properties.filter((property) => {
        const matchesSearch =
            property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
            property.city.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesFilter = filterType === 'all' || property.propertyType === filterType
        return matchesSearch && matchesFilter
    })

    const propertyTypes = ['all', 'apartment', 'house', 'condo', 'duplex', 'townhouse', 'other']

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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
                    <p className="text-gray-500">Manage your rental properties</p>
                </div>
                <Link
                    href="/dashboard/properties/new"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    Add Property
                </Link>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search properties..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="pl-10 pr-8 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none bg-white"
                    >
                        {propertyTypes.map((type) => (
                            <option key={type} value={type}>
                                {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Properties Grid */}
            {filteredProperties.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProperties.map((property) => (
                        <div
                            key={property.id}
                            className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all"
                        >
                            {/* Property Image Placeholder */}
                            <div className="h-40 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                                <Building className="w-16 h-16 text-blue-300" />
                            </div>

                            <div className="p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{property.name}</h3>
                                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                                            <MapPin className="w-4 h-4" />
                                            {property.city}, {property.state}
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <button
                                            onClick={() => setOpenMenu(openMenu === property.id ? null : property.id)}
                                            className="p-1 rounded-lg hover:bg-gray-100"
                                        >
                                            <MoreVertical className="w-5 h-5 text-gray-400" />
                                        </button>
                                        {openMenu === property.id && (
                                            <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
                                                <Link
                                                    href={`/dashboard/properties/${property.id}`}
                                                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    View Details
                                                </Link>
                                                <Link
                                                    href={`/dashboard/properties/${property.id}/edit`}
                                                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                    Edit
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(property.id)}
                                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                                    <div className="flex items-center gap-1">
                                        <Bed className="w-4 h-4" />
                                        {property.bedrooms} bed
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Bath className="w-4 h-4" />
                                        {property.bathrooms} bath
                                    </div>
                                    {property.squareFeet && (
                                        <div className="text-gray-400">
                                            {property.squareFeet.toLocaleString()} sqft
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                    <span className="text-xs font-medium text-gray-500 uppercase bg-gray-100 px-2 py-1 rounded">
                                        {property.propertyType}
                                    </span>
                                    <div className="flex items-center gap-1 text-sm text-gray-500">
                                        <Users className="w-4 h-4" />
                                        {property._count.tenants} tenant{property._count.tenants !== 1 ? 's' : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                    <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
                    <p className="text-gray-500 mb-4">
                        {searchQuery || filterType !== 'all'
                            ? 'Try adjusting your search or filter'
                            : 'Get started by adding your first property'}
                    </p>
                    {!searchQuery && filterType === 'all' && (
                        <Link
                            href="/dashboard/properties/new"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Add Property
                        </Link>
                    )}
                </div>
            )}
        </div>
    )
}