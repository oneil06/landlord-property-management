'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/auth'
import Link from 'next/link'
import {
    Wrench,
    Plus,
    Search,
    Filter,
    Building,
    Calendar,
    AlertTriangle,
    CheckCircle,
    Clock,
    MoreVertical,
    Pencil,
    Trash2,
    Eye,
} from 'lucide-react'

interface MaintenanceRequest {
    id: string
    title: string
    description: string
    priority: string
    status: string
    category: string
    estimatedCost: number | null
    actualCost: number | null
    scheduledDate: string | null
    completedDate: string | null
    createdAt: string
    property: { id: string; name: string; address: string }
    tenant: { id: string; firstName: string; lastName: string } | null
}

export default function MaintenancePage() {
    const { token } = useAuthStore()
    const [maintenance, setMaintenance] = useState<MaintenanceRequest[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterStatus, setFilterStatus] = useState('all')
    const [filterPriority, setFilterPriority] = useState('all')
    const [openMenu, setOpenMenu] = useState<string | null>(null)

    useEffect(() => {
        fetchMaintenance()
    }, [])

    const fetchMaintenance = async () => {
        try {
            const response = await fetch('/api/maintenance', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            if (response.ok) {
                const data = await response.json()
                setMaintenance(data.maintenance)
            }
        } catch (error) {
            console.error('Failed to fetch maintenance:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this maintenance request?')) return

        try {
            const response = await fetch(`/api/maintenance/${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            if (response.ok) {
                setMaintenance(maintenance.filter((m) => m.id !== id))
            }
        } catch (error) {
            console.error('Failed to delete maintenance:', error)
        }
    }

    const filteredMaintenance = maintenance.filter((m) => {
        const matchesSearch =
            m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.property.name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = filterStatus === 'all' || m.status === filterStatus
        const matchesPriority = filterPriority === 'all' || m.priority === filterPriority
        return matchesSearch && matchesStatus && matchesPriority
    })

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
            case 'emergency':
                return 'bg-red-100 text-red-700'
            case 'high':
                return 'bg-orange-100 text-orange-700'
            case 'medium':
                return 'bg-yellow-100 text-yellow-700'
            case 'low':
                return 'bg-green-100 text-green-700'
            default:
                return 'bg-gray-100 text-gray-700'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending':
                return <Clock className="w-4 h-4" />
            case 'in_progress':
                return <Wrench className="w-4 h-4" />
            case 'completed':
                return <CheckCircle className="w-4 h-4" />
            default:
                return <AlertTriangle className="w-4 h-4" />
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
                    <h1 className="text-2xl font-bold text-gray-900">Maintenance</h1>
                    <p className="text-gray-500">Track and manage maintenance requests</p>
                </div>
                <Link
                    href="/dashboard/maintenance/new"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    New Request
                </Link>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search maintenance requests..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none bg-white"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    <select
                        value={filterPriority}
                        onChange={(e) => setFilterPriority(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none bg-white"
                    >
                        <option value="all">All Priority</option>
                        <option value="emergency">Emergency</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                </div>
            </div>

            {/* Maintenance List */}
            {filteredMaintenance.length > 0 ? (
                <div className="space-y-4">
                    {filteredMaintenance.map((item) => (
                        <div
                            key={item.id}
                            className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-all"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="font-semibold text-gray-900">{item.title}</h3>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(item.status)}`}>
                                            {getStatusIcon(item.status)}
                                            {item.status.replace('_', ' ')}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                                            {item.priority}
                                        </span>
                                    </div>
                                    <p className="text-gray-600 text-sm mb-3">{item.description}</p>
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <Building className="w-4 h-4" />
                                            {item.property.name}
                                        </div>
                                        {item.scheduledDate && (
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                {new Date(item.scheduledDate).toLocaleDateString()}
                                            </div>
                                        )}
                                        {item.estimatedCost && (
                                            <div className="text-gray-700 font-medium">
                                                Est: ${item.estimatedCost.toLocaleString()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="relative">
                                    <button
                                        onClick={() => setOpenMenu(openMenu === item.id ? null : item.id)}
                                        className="p-2 rounded-lg hover:bg-gray-100"
                                    >
                                        <MoreVertical className="w-5 h-5 text-gray-400" />
                                    </button>
                                    {openMenu === item.id && (
                                        <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
                                            <Link
                                                href={`/dashboard/maintenance/${item.id}`}
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            >
                                                <Eye className="w-4 h-4" />
                                                View Details
                                            </Link>
                                            <Link
                                                href={`/dashboard/maintenance/${item.id}/edit`}
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            >
                                                <Pencil className="w-4 h-4" />
                                                Edit
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                    <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No maintenance requests</h3>
                    <p className="text-gray-500 mb-4">
                        {searchQuery || filterStatus !== 'all' || filterPriority !== 'all'
                            ? 'Try adjusting your search or filters'
                            : 'Get started by creating your first maintenance request'}
                    </p>
                    {!searchQuery && filterStatus === 'all' && filterPriority === 'all' && (
                        <Link
                            href="/dashboard/maintenance/new"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            New Request
                        </Link>
                    )}
                </div>
            )}
        </div>
    )
}