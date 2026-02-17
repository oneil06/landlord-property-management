'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/auth'
import Link from 'next/link'
import {
    FileText,
    Plus,
    Search,
    Filter,
    Building,
    Calendar,
    Users,
    DollarSign,
    Download,
    MoreVertical,
    Eye,
    Pencil,
    Trash2,
    AlertCircle,
} from 'lucide-react'

interface Lease {
    id: string
    startDate: string
    endDate: string
    monthlyRent: number
    securityDeposit: number
    leaseDocument: string | null
    status: string
    property: { id: string; name: string; address: string }
    tenant: { id: string; firstName: string; lastName: string; email: string }
}

export default function LeasesPage() {
    const { token } = useAuthStore()
    const [leases, setLeases] = useState<Lease[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterStatus, setFilterStatus] = useState('all')
    const [openMenu, setOpenMenu] = useState<string | null>(null)

    useEffect(() => {
        fetchLeases()
    }, [])

    const fetchLeases = async () => {
        try {
            const response = await fetch('/api/leases', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            if (response.ok) {
                const data = await response.json()
                setLeases(data.leases)
            }
        } catch (error) {
            console.error('Failed to fetch leases:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this lease?')) return

        try {
            const response = await fetch(`/api/leases/${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            if (response.ok) {
                setLeases(leases.filter((l) => l.id !== id))
            }
        } catch (error) {
            console.error('Failed to delete lease:', error)
        }
    }

    const filteredLeases = leases.filter((lease) => {
        const matchesSearch =
            lease.tenant.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lease.tenant.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lease.property.name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesFilter = filterStatus === 'all' || lease.status === filterStatus
        return matchesSearch && matchesFilter
    })

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

    const isExpiringSoon = (endDate: string) => {
        const end = new Date(endDate)
        const now = new Date()
        const daysUntilExpiry = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return daysUntilExpiry > 0 && daysUntilExpiry <= 30
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
                    <h1 className="text-2xl font-bold text-gray-900">Leases</h1>
                    <p className="text-gray-500">Manage lease agreements and documents</p>
                </div>
                <Link
                    href="/dashboard/leases/new"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    Add Lease
                </Link>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search leases..."
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
                        <option value="expired">Expired</option>
                        <option value="terminated">Terminated</option>
                    </select>
                </div>
            </div>

            {/* Leases List */}
            {filteredLeases.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredLeases.map((lease) => (
                        <div
                            key={lease.id}
                            className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-all"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">
                                            {lease.tenant.firstName} {lease.tenant.lastName}
                                        </h3>
                                        <p className="text-sm text-gray-500">{lease.property.name}</p>
                                    </div>
                                </div>
                                <div className="relative">
                                    <button
                                        onClick={() => setOpenMenu(openMenu === lease.id ? null : lease.id)}
                                        className="p-1 rounded-lg hover:bg-gray-100"
                                    >
                                        <MoreVertical className="w-5 h-5 text-gray-400" />
                                    </button>
                                    {openMenu === lease.id && (
                                        <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
                                            <Link
                                                href={`/dashboard/leases/${lease.id}`}
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            >
                                                <Eye className="w-4 h-4" />
                                                View Details
                                            </Link>
                                            <Link
                                                href={`/dashboard/leases/${lease.id}/edit`}
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            >
                                                <Pencil className="w-4 h-4" />
                                                Edit
                                            </Link>
                                            {lease.leaseDocument && (
                                                <a
                                                    href={lease.leaseDocument}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                                >
                                                    <Download className="w-4 h-4" />
                                                    Download
                                                </a>
                                            )}
                                            <button
                                                onClick={() => handleDelete(lease.id)}
                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lease.status)}`}>
                                        {lease.status.charAt(0).toUpperCase() + lease.status.slice(1)}
                                    </span>
                                    {isExpiringSoon(lease.endDate) && (
                                        <span className="flex items-center gap-1 text-xs text-orange-600">
                                            <AlertCircle className="w-3 h-3" />
                                            Expiring soon
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Calendar className="w-4 h-4" />
                                    {new Date(lease.startDate).toLocaleDateString()} - {new Date(lease.endDate).toLocaleDateString()}
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                    <div>
                                        <p className="text-xs text-gray-500">Monthly Rent</p>
                                        <p className="font-semibold text-gray-900">${lease.monthlyRent.toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500">Deposit</p>
                                        <p className="font-semibold text-gray-900">${lease.securityDeposit.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No leases found</h3>
                    <p className="text-gray-500 mb-4">
                        {searchQuery || filterStatus !== 'all'
                            ? 'Try adjusting your search or filter'
                            : 'Get started by adding your first lease'}
                    </p>
                    {!searchQuery && filterStatus === 'all' && (
                        <Link
                            href="/dashboard/leases/new"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Add Lease
                        </Link>
                    )}
                </div>
            )}
        </div>
    )
}