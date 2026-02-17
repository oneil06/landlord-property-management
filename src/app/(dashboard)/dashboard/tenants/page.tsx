'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/auth'
import {
    Users,
    Plus,
    Search,
    Filter,
    Mail,
    Phone,
    Building,
    MoreVertical,
    Pencil,
    Trash2,
    Eye,
    DollarSign,
    Calendar,
} from 'lucide-react'

interface Tenant {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string
    status: string
    moveInDate: string | null
    property: { id: string; name: string; address: string; city: string } | null
    leases: { id: string; monthlyRent: number; startDate: string; endDate: string }[]
    _count: { maintenance: number; reminders: number }
}

export default function TenantsPage() {
    const router = useRouter()
    const { token } = useAuthStore()
    const [tenants, setTenants] = useState<Tenant[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterStatus, setFilterStatus] = useState('all')
    const [openMenu, setOpenMenu] = useState<string | null>(null)
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
    const menuButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})

    useEffect(() => {
        fetchTenants()
    }, [])

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (openMenu) {
                const target = e.target as HTMLElement
                if (!target.closest('.dropdown-menu') && !target.closest('.menu-button')) {
                    setOpenMenu(null)
                }
            }
        }
        if (openMenu) {
            document.addEventListener('click', handleClickOutside)
            return () => document.removeEventListener('click', handleClickOutside)
        }
    }, [openMenu])

    const handleMenuClick = (tenantId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        const button = menuButtonRefs.current[tenantId]
        if (button) {
            const rect = button.getBoundingClientRect()
            setMenuPosition({
                top: rect.bottom + window.scrollY,
                left: rect.right - 144
            })
        }
        setOpenMenu(openMenu === tenantId ? null : tenantId)
    }

    const fetchTenants = async () => {
        try {
            const response = await fetch('/api/tenants', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            if (response.ok) {
                const data = await response.json()
                setTenants(data.tenants)
            }
        } catch (error) {
            console.error('Failed to fetch tenants:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this tenant?')) return

        try {
            const response = await fetch(`/api/tenants/${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            if (response.ok) {
                setTenants(tenants.filter((t) => t.id !== id))
            }
        } catch (error) {
            console.error('Failed to delete tenant:', error)
        }
    }

    const filteredTenants = tenants.filter((tenant) => {
        const matchesSearch =
            tenant.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tenant.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tenant.email.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesFilter = filterStatus === 'all' || tenant.status === filterStatus
        return matchesSearch && matchesFilter
    })

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-700'
            case 'inactive':
                return 'bg-gray-100 text-gray-700'
            case 'pending':
                return 'bg-yellow-100 text-yellow-700'
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
                    <p className="text-gray-500">Manage your tenants and their information</p>
                </div>
                <Link
                    href="/dashboard/tenants/new"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    Add Tenant
                </Link>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search tenants..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="pl-10 pr-8 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none bg-white"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="pending">Pending</option>
                    </select>
                </div>
            </div>

            {/* Tenants List */}
            {filteredTenants.length > 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 overflow-visible">
                    <div className="overflow-x-auto overflow-y-visible">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Tenant</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Property</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Rent</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Status</th>
                                    <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredTenants.map((tenant) => (
                                    <tr key={tenant.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                                                    {tenant.firstName[0]}{tenant.lastName[0]}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {tenant.firstName} {tenant.lastName}
                                                    </p>
                                                    <div className="flex items-center gap-3 text-sm text-gray-500">
                                                        <span className="flex items-center gap-1">
                                                            <Mail className="w-3 h-3" />
                                                            {tenant.email}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {tenant.property ? (
                                                <div className="flex items-center gap-2">
                                                    <Building className="w-4 h-4 text-gray-400" />
                                                    <span className="text-gray-700">{tenant.property.name}</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">Not assigned</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {tenant.leases.length > 0 ? (
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        ${tenant.leases[0].monthlyRent.toLocaleString()}/mo
                                                    </p>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">No lease</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(tenant.status)}`}>
                                                {tenant.status.charAt(0).toUpperCase() + tenant.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <div className="relative">
                                                    <button
                                                        ref={(el) => { menuButtonRefs.current[tenant.id] = el }}
                                                        onClick={(e) => handleMenuClick(tenant.id, e)}
                                                        className="menu-button p-2 rounded-lg hover:bg-gray-100"
                                                    >
                                                        <MoreVertical className="w-5 h-5 text-gray-400" />
                                                    </button>
                                                    {openMenu === tenant.id && (
                                                        <div
                                                            className="dropdown-menu fixed bg-white rounded-lg shadow-lg border border-gray-100 py-1 w-36"
                                                            style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }}
                                                        >
                                                            <Link
                                                                href={`/dashboard/tenants/${tenant.id}`}
                                                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                                View Details
                                                            </Link>
                                                            <Link
                                                                href={`/dashboard/tenants/${tenant.id}/edit`}
                                                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                                Edit
                                                            </Link>
                                                            <button
                                                                onClick={() => handleDelete(tenant.id)}
                                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                                Delete
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No tenants found</h3>
                    <p className="text-gray-500 mb-4">
                        {searchQuery || filterStatus !== 'all'
                            ? 'Try adjusting your search or filter'
                            : 'Get started by adding your first tenant'}
                    </p>
                    {!searchQuery && filterStatus === 'all' && (
                        <Link
                            href="/dashboard/tenants/new"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Add Tenant
                        </Link>
                    )}
                </div>
            )}
        </div>
    )
}