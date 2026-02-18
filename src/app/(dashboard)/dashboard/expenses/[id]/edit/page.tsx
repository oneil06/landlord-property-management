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
}

export default function EditExpensePage() {
    const router = useRouter()
    const params = useParams()
    const expenseId = params.id as string
    const { token } = useAuthStore()
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [properties, setProperties] = useState<Property[]>([])
    const [formData, setFormData] = useState({
        category: 'other',
        description: '',
        amount: '',
        date: '',
        isRecurring: false,
        recurringPeriod: '',
        propertyId: '',
    })

    useEffect(() => {
        if (expenseId) {
            fetchExpense()
            fetchProperties()
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
                const expense = data.expense
                setFormData({
                    category: expense.category,
                    description: expense.description,
                    amount: expense.amount.toString(),
                    date: new Date(expense.date).toISOString().split('T')[0],
                    isRecurring: expense.isRecurring,
                    recurringPeriod: expense.recurringPeriod || '',
                    propertyId: expense.propertyId || '',
                })
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
            const response = await fetch(`/api/expenses/${expenseId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...formData,
                    amount: parseFloat(formData.amount),
                    propertyId: formData.propertyId || null,
                }),
            })

            if (response.ok) {
                router.push(`/dashboard/expenses/${expenseId}`)
            } else {
                const error = await response.json()
                alert(error.error || 'Failed to update expense')
            }
        } catch (error) {
            console.error('Failed to update expense:', error)
            alert('Failed to update expense')
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
                    href={`/dashboard/expenses/${expenseId}`}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Edit Expense</h1>
                    <p className="text-gray-500">Update expense details</p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Description */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <input
                            type="text"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            required
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Category
                        </label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        >
                            <option value="maintenance">Maintenance</option>
                            <option value="utilities">Utilities</option>
                            <option value="insurance">Insurance</option>
                            <option value="taxes">Taxes</option>
                            <option value="mortgage">Mortgage</option>
                            <option value="repairs">Repairs</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Amount
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            required
                        />
                    </div>

                    {/* Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Date
                        </label>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            required
                        />
                    </div>

                    {/* Property */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Property
                        </label>
                        <select
                            value={formData.propertyId}
                            onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        >
                            <option value="">No Property</option>
                            {properties.map((property) => (
                                <option key={property.id} value={property.id}>
                                    {property.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Recurring */}
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={formData.isRecurring}
                                onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-700">Recurring Expense</span>
                        </label>
                    </div>

                    {/* Recurring Period */}
                    {formData.isRecurring && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Recurring Period
                            </label>
                            <select
                                value={formData.recurringPeriod}
                                onChange={(e) => setFormData({ ...formData, recurringPeriod: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            >
                                <option value="">Select period</option>
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                            </select>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-4 mt-6 pt-6 border-t border-gray-200">
                    <Link
                        href={`/dashboard/expenses/${expenseId}`}
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
