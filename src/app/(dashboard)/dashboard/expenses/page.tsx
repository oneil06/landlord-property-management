'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuthStore } from '@/lib/auth'
import Link from 'next/link'
import {
    Receipt,
    Plus,
    Search,
    Filter,
    Building,
    Calendar,
    DollarSign,
    TrendingUp,
    TrendingDown,
    PieChart,
    MoreVertical,
    Pencil,
    Trash2,
    RefreshCw,
    Eye,
} from 'lucide-react'

interface Expense {
    id: string
    category: string
    description: string
    amount: number
    date: string
    isRecurring: boolean
    recurringPeriod: string | null
    property: { id: string; name: string } | null
}

interface ExpenseSummary {
    total: number
    byCategory: Record<string, number>
    count: number
}

const categoryColors: Record<string, string> = {
    maintenance: 'bg-orange-100 text-orange-700',
    utilities: 'bg-blue-100 text-blue-700',
    insurance: 'bg-purple-100 text-purple-700',
    taxes: 'bg-red-100 text-red-700',
    mortgage: 'bg-green-100 text-green-700',
    repairs: 'bg-yellow-100 text-yellow-700',
    other: 'bg-gray-100 text-gray-700',
}

export default function ExpensesPage() {
    const { token } = useAuthStore()
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [summary, setSummary] = useState<ExpenseSummary>({ total: 0, byCategory: {}, count: 0 })
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterCategory, setFilterCategory] = useState('all')
    const [openMenu, setOpenMenu] = useState<string | null>(null)
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
    const menuButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})

    useEffect(() => {
        fetchExpenses()
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

    const handleMenuClick = (expenseId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        const button = menuButtonRefs.current[expenseId]
        if (button) {
            const rect = button.getBoundingClientRect()
            setMenuPosition({
                top: rect.bottom + window.scrollY,
                left: rect.right - 144
            })
        }
        setOpenMenu(openMenu === expenseId ? null : expenseId)
    }

    const fetchExpenses = async () => {
        try {
            const response = await fetch('/api/expenses', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            if (response.ok) {
                const data = await response.json()
                setExpenses(data.expenses)
                setSummary(data.summary)
            }
        } catch (error) {
            console.error('Failed to fetch expenses:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this expense?')) return

        try {
            const response = await fetch(`/api/expenses/${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            if (response.ok) {
                setExpenses(expenses.filter((e) => e.id !== id))
                fetchExpenses() // Refresh summary
            }
        } catch (error) {
            console.error('Failed to delete expense:', error)
        }
    }

    const filteredExpenses = expenses.filter((expense) => {
        const matchesSearch =
            expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            expense.category.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesFilter = filterCategory === 'all' || expense.category === filterCategory
        return matchesSearch && matchesFilter
    })

    const categories = ['all', 'maintenance', 'utilities', 'insurance', 'taxes', 'mortgage', 'repairs', 'other']

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
                    <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
                    <p className="text-gray-500">Track and manage property expenses</p>
                </div>
                <Link
                    href="/dashboard/expenses/new"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    Add Expense
                </Link>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-gray-500 text-sm">Total Expenses</span>
                        <DollarSign className="w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">${summary.total.toLocaleString()}</p>
                    <p className="text-sm text-gray-500 mt-1">{summary.count} transactions</p>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-gray-500 text-sm">Top Category</span>
                        <PieChart className="w-5 h-5 text-gray-400" />
                    </div>
                    {Object.keys(summary.byCategory).length > 0 ? (
                        <>
                            <p className="text-2xl font-bold text-gray-900 capitalize">
                                {Object.entries(summary.byCategory).sort((a, b) => b[1] - a[1])[0][0]}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                ${Object.entries(summary.byCategory).sort((a, b) => b[1] - a[1])[0][1].toLocaleString()}
                            </p>
                        </>
                    ) : (
                        <p className="text-gray-400">No data</p>
                    )}
                </div>

                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-gray-500 text-sm">Recurring</span>
                        <RefreshCw className="w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                        {expenses.filter((e) => e.isRecurring).length}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Recurring expenses</p>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search expenses..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="pl-10 pr-8 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none bg-white"
                    >
                        {categories.map((cat) => (
                            <option key={cat} value={cat}>
                                {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Expenses List */}
            {filteredExpenses.length > 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 overflow-visible">
                    <div className="overflow-x-auto overflow-y-visible">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Description</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Category</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Property</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Date</th>
                                    <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">Amount</th>
                                    <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredExpenses.map((expense) => (
                                    <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium text-gray-900">{expense.description}</p>
                                                {expense.isRecurring && (
                                                    <span title="Recurring">
                                                        <RefreshCw className="w-4 h-4 text-blue-500" />
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColors[expense.category] || 'bg-gray-100 text-gray-700'}`}>
                                                {expense.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {expense.property ? (
                                                <div className="flex items-center gap-1 text-gray-600">
                                                    <Building className="w-4 h-4" />
                                                    {expense.property.name}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">General</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1 text-gray-600">
                                                <Calendar className="w-4 h-4" />
                                                {new Date(expense.date).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-semibold text-gray-900">
                                                ${expense.amount.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <div className="relative">
                                                    <button
                                                        ref={(el) => { menuButtonRefs.current[expense.id] = el }}
                                                        onClick={(e) => handleMenuClick(expense.id, e)}
                                                        className="menu-button p-2 rounded-lg hover:bg-gray-100"
                                                    >
                                                        <MoreVertical className="w-5 h-5 text-gray-400" />
                                                    </button>
                                                    {openMenu === expense.id && (
                                                        <div
                                                            className="dropdown-menu fixed bg-white rounded-lg shadow-lg border border-gray-100 py-1 w-36"
                                                            style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }}
                                                        >
                                                            <Link
                                                                href={`/dashboard/expenses/${expense.id}`}
                                                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                                View Details
                                                            </Link>
                                                            <Link
                                                                href={`/dashboard/expenses/${expense.id}/edit`}
                                                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                                Edit
                                                            </Link>
                                                            <button
                                                                onClick={() => handleDelete(expense.id)}
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
                    <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses found</h3>
                    <p className="text-gray-500 mb-4">
                        {searchQuery || filterCategory !== 'all'
                            ? 'Try adjusting your search or filter'
                            : 'Get started by recording your first expense'}
                    </p>
                    {!searchQuery && filterCategory === 'all' && (
                        <Link
                            href="/dashboard/expenses/new"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Add Expense
                        </Link>
                    )}
                </div>
            )}
        </div>
    )
}