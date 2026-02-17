'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuthStore } from '@/lib/auth'
import Link from 'next/link'
import {
    DollarSign,
    Plus,
    Search,
    Filter,
    Calendar,
    CheckCircle,
    Clock,
    AlertTriangle,
    Users,
    MoreVertical,
    Check,
    X,
} from 'lucide-react'

interface RentReminder {
    id: string
    amount: number
    dueDate: string
    paidDate: string | null
    status: string
    lateFee: number | null
    notes: string | null
    tenant: {
        id: string
        firstName: string
        lastName: string
        email: string
        phone: string
    }
}

interface RentSummary {
    totalPending: number
    totalPaid: number
    totalLate: number
    count: number
}

export default function RentPage() {
    const { token } = useAuthStore()
    const [reminders, setReminders] = useState<RentReminder[]>([])
    const [summary, setSummary] = useState<RentSummary>({ totalPending: 0, totalPaid: 0, totalLate: 0, count: 0 })
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterStatus, setFilterStatus] = useState('all')
    const [openMenu, setOpenMenu] = useState<string | null>(null)
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
    const menuButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})

    useEffect(() => {
        fetchReminders()
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

    const handleMenuClick = (reminderId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        const button = menuButtonRefs.current[reminderId]
        if (button) {
            const rect = button.getBoundingClientRect()
            setMenuPosition({
                top: rect.bottom + window.scrollY,
                left: rect.right - 144
            })
        }
        setOpenMenu(openMenu === reminderId ? null : reminderId)
    }

    const fetchReminders = async () => {
        try {
            const response = await fetch('/api/rent', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            if (response.ok) {
                const data = await response.json()
                setReminders(data.reminders)
                setSummary(data.summary)
            }
        } catch (error) {
            console.error('Failed to fetch rent reminders:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleMarkPaid = async (id: string) => {
        try {
            const response = await fetch(`/api/rent/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: 'paid', paidDate: new Date().toISOString() }),
            })
            if (response.ok) {
                fetchReminders()
            }
        } catch (error) {
            console.error('Failed to update reminder:', error)
        }
    }

    const handleMarkLate = async (id: string) => {
        try {
            const response = await fetch(`/api/rent/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: 'late' }),
            })
            if (response.ok) {
                fetchReminders()
            }
        } catch (error) {
            console.error('Failed to update reminder:', error)
        }
    }

    const filteredReminders = reminders.filter((reminder) => {
        const matchesSearch =
            reminder.tenant.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            reminder.tenant.lastName.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesFilter = filterStatus === 'all' || reminder.status === filterStatus
        return matchesSearch && matchesFilter
    })

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-700'
            case 'paid':
                return 'bg-green-100 text-green-700'
            case 'late':
                return 'bg-red-100 text-red-700'
            case 'waived':
                return 'bg-gray-100 text-gray-700'
            default:
                return 'bg-gray-100 text-gray-700'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending':
                return <Clock className="w-4 h-4" />
            case 'paid':
                return <CheckCircle className="w-4 h-4" />
            case 'late':
                return <AlertTriangle className="w-4 h-4" />
            default:
                return <DollarSign className="w-4 h-4" />
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
                    <h1 className="text-2xl font-bold text-gray-900">Rent Tracking</h1>
                    <p className="text-gray-500">Track rent payments and send reminders</p>
                </div>
                <Link
                    href="/dashboard/rent/new"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    Add Reminder
                </Link>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-gray-500 text-sm">Pending</span>
                        <Clock className="w-5 h-5 text-yellow-500" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">${summary.totalPending.toLocaleString()}</p>
                    <p className="text-sm text-gray-500 mt-1">Awaiting payment</p>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-gray-500 text-sm">Collected</span>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">${summary.totalPaid.toLocaleString()}</p>
                    <p className="text-sm text-gray-500 mt-1">This month</p>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-gray-500 text-sm">Overdue</span>
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">${summary.totalLate.toLocaleString()}</p>
                    <p className="text-sm text-gray-500 mt-1">Needs attention</p>
                </div>
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
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="late">Late</option>
                    </select>
                </div>
            </div>

            {/* Reminders List */}
            {filteredReminders.length > 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 overflow-visible">
                    <div className="overflow-x-auto overflow-y-visible">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Tenant</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Due Date</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Status</th>
                                    <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">Amount</th>
                                    <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredReminders.map((reminder) => (
                                    <tr key={reminder.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                                                    {reminder.tenant.firstName[0]}{reminder.tenant.lastName[0]}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {reminder.tenant.firstName} {reminder.tenant.lastName}
                                                    </p>
                                                    <p className="text-sm text-gray-500">{reminder.tenant.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1 text-gray-600">
                                                <Calendar className="w-4 h-4" />
                                                {new Date(reminder.dueDate).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${getStatusColor(reminder.status)}`}>
                                                {getStatusIcon(reminder.status)}
                                                {reminder.status.charAt(0).toUpperCase() + reminder.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-semibold text-gray-900">
                                                ${reminder.amount.toLocaleString()}
                                            </span>
                                            {reminder.lateFee && (
                                                <p className="text-sm text-red-600">+${reminder.lateFee} late fee</p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {reminder.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleMarkPaid(reminder.id)}
                                                            className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100"
                                                            title="Mark as Paid"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleMarkLate(reminder.id)}
                                                            className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                                                            title="Mark as Late"
                                                        >
                                                            <AlertTriangle className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                                <div className="relative">
                                                    <button
                                                        ref={(el) => { menuButtonRefs.current[reminder.id] = el }}
                                                        onClick={(e) => handleMenuClick(reminder.id, e)}
                                                        className="menu-button p-2 rounded-lg hover:bg-gray-100"
                                                    >
                                                        <MoreVertical className="w-5 h-5 text-gray-400" />
                                                    </button>
                                                    {openMenu === reminder.id && (
                                                        <div
                                                            className="dropdown-menu fixed bg-white rounded-lg shadow-lg border border-gray-100 py-1 w-36"
                                                            style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }}
                                                        >
                                                            <button
                                                                onClick={() => {
                                                                    handleMarkPaid(reminder.id)
                                                                    setOpenMenu(null)
                                                                }}
                                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                                            >
                                                                <Check className="w-4 h-4" />
                                                                Mark Paid
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    handleMarkLate(reminder.id)
                                                                    setOpenMenu(null)
                                                                }}
                                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                                            >
                                                                <AlertTriangle className="w-4 h-4" />
                                                                Mark Late
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
                    <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No rent reminders</h3>
                    <p className="text-gray-500 mb-4">
                        {searchQuery || filterStatus !== 'all'
                            ? 'Try adjusting your search or filter'
                            : 'Get started by adding your first rent reminder'}
                    </p>
                    {!searchQuery && filterStatus === 'all' && (
                        <Link
                            href="/dashboard/rent/new"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Add Reminder
                        </Link>
                    )}
                </div>
            )}
        </div>
    )
}