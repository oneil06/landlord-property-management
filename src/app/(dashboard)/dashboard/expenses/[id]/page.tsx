'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/auth'
import {
    DollarSign,
    ArrowLeft,
    Pencil,
    Trash2,
    Calendar,
    Home,
    RefreshCw,
    Tag,
} from 'lucide-react'

interface Expense {
    id: string
    category: string
    description: string
    amount: number
    date: Date
    isRecurring: boolean
    recurringPeriod: string | null
    property: { id: string; name: string; address: string; city: string } | null
}

export default function ExpenseDetailPage() {
    const router = useRouter()
    const params = useParams()
    const expenseId = params.id as string
    const { token } = useAuthStore()
    const [expense, setExpense] = useState<Expense | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (expenseId) {
            fetchExpense()
        }
    }, [expenseId])

    const fetchExpense = async () => {
        try {
            const response = await fetch(`/api/expenses/${expenseId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            if (response.ok) {
                const data = await response.json()
                setExpense(data.expense)
            } else {
                router.push('/dashboard/expenses')
            }
        } catch (error) {
            console.error('Failed to fetch expense:', error)
            router.push('/dashboard/expenses')
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this expense?')) return

        try {
            const response = await fetch(`/api/expenses/${expenseId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            if (response.ok) {
                router.push('/dashboard/expenses')
            }
        } catch (error) {
            console.error('Failed to delete expense:', error)
        }
    }

    const getCategoryColor = (category: string) => {
        const colors: { [key: string]: string } = {
            maintenance: 'bg-amber-100 text-amber-700',
            utilities: 'bg-blue-100 text-blue-700',
            insurance: 'bg-green-100 text-green-700',
            taxes: 'bg-purple-100 text-purple-700',
            mortgage: 'bg-red-100 text-red-700',
            repairs: 'bg-orange-100 text-orange-700',
            other: 'bg-gray-100 text-gray-700',
        }
        return colors[category] || 'bg-gray-100 text-gray-700'
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (!expense) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-gray-900">Expense not found</h2>
                <Link href="/dashboard/expenses" className="text-blue-600 hover:underline mt-4 inline-block">
                    Back to Expenses
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
                        href="/dashboard/expenses"
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{expense.description}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(expense.category)}`}>
                                {expense.category.toUpperCase()}
                            </span>
                            {expense.isRecurring && (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 flex items-center gap-1">
                                    <RefreshCw className="w-3 h-3" />
                                    {expense.recurringPeriod?.toUpperCase()}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href={`/dashboard/expenses/${expenseId}/edit`}
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

            {/* Amount Card */}
            <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-6 text-white">
                <p className="text-red-100 text-sm">Amount</p>
                <p className="text-4xl font-bold">${expense.amount.toLocaleString()}</p>
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date & Category */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Details</h2>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <Calendar className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Date</p>
                                <p className="font-medium text-gray-900">
                                    {new Date(expense.date).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Tag className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Category</p>
                                <p className="font-medium text-gray-900 capitalize">{expense.category}</p>
                            </div>
                        </div>
                        {expense.isRecurring && (
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <RefreshCw className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Recurring</p>
                                    <p className="font-medium text-gray-900 capitalize">
                                        Every {expense.recurringPeriod}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Property */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Property</h2>
                    {expense.property ? (
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Home className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <Link
                                    href={`/dashboard/properties/${expense.property.id}`}
                                    className="font-medium text-blue-600 hover:underline"
                                >
                                    {expense.property.name}
                                </Link>
                                <p className="text-sm text-gray-500">
                                    {expense.property.address}, {expense.property.city}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500">No property associated</p>
                    )}
                </div>
            </div>
        </div>
    )
}
