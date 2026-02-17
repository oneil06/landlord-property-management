'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/auth'
import {
    Building,
    Users,
    DollarSign,
    Wrench,
    TrendingUp,
    TrendingDown,
    Calendar,
    AlertCircle,
    ArrowRight,
} from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
    totalProperties: number
    totalTenants: number
    monthlyIncome: number
    pendingMaintenance: number
    occupancyRate: number
    upcomingPayments: number
}

interface RecentActivity {
    id: string
    type: string
    message: string
    date: string
}

export default function DashboardPage() {
    const { user, token } = useAuthStore()
    const [stats, setStats] = useState<DashboardStats>({
        totalProperties: 0,
        totalTenants: 0,
        monthlyIncome: 0,
        pendingMaintenance: 0,
        occupancyRate: 0,
        upcomingPayments: 0,
    })
    const [activities, setActivities] = useState<RecentActivity[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            const response = await fetch('/api/dashboard', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            if (response.ok) {
                const data = await response.json()
                setStats(data.stats)
                setActivities(data.activities)
            }
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const statCards = [
        {
            name: 'Total Properties',
            value: stats.totalProperties,
            icon: Building,
            color: 'from-blue-500 to-blue-600',
            href: '/dashboard/properties',
        },
        {
            name: 'Active Tenants',
            value: stats.totalTenants,
            icon: Users,
            color: 'from-green-500 to-green-600',
            href: '/dashboard/tenants',
        },
        {
            name: 'Monthly Income',
            value: `$${stats.monthlyIncome.toLocaleString()}`,
            icon: DollarSign,
            color: 'from-purple-500 to-purple-600',
            href: '/dashboard/rent',
        },
        {
            name: 'Pending Maintenance',
            value: stats.pendingMaintenance,
            icon: Wrench,
            color: 'from-orange-500 to-orange-600',
            href: '/dashboard/maintenance',
        },
    ]

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
                <h2 className="text-2xl font-bold mb-2">
                    Welcome back, {user?.name?.split(' ')[0] || 'Landlord'}!
                </h2>
                <p className="text-blue-100">
                    Here's what's happening with your properties today.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat) => (
                    <Link
                        key={stat.name}
                        href={stat.href}
                        className="bg-white rounded-xl p-6 border border-gray-100 hover:shadow-lg transition-all group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                                <stat.icon className="w-6 h-6 text-white" />
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                        <p className="text-sm text-gray-500">{stat.name}</p>
                    </Link>
                ))}
            </div>

            {/* Quick Actions & Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Actions */}
                <div className="bg-white rounded-xl p-6 border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                        <Link
                            href="/dashboard/properties/new"
                            className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                        >
                            <Building className="w-5 h-5" />
                            <span className="font-medium">Add New Property</span>
                        </Link>
                        <Link
                            href="/dashboard/tenants/new"
                            className="flex items-center gap-3 p-3 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                        >
                            <Users className="w-5 h-5" />
                            <span className="font-medium">Add New Tenant</span>
                        </Link>
                        <Link
                            href="/dashboard/maintenance/new"
                            className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors"
                        >
                            <Wrench className="w-5 h-5" />
                            <span className="font-medium">Log Maintenance</span>
                        </Link>
                        <Link
                            href="/dashboard/expenses/new"
                            className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors"
                        >
                            <DollarSign className="w-5 h-5" />
                            <span className="font-medium">Record Expense</span>
                        </Link>
                    </div>
                </div>

                {/* Occupancy Overview */}
                <div className="bg-white rounded-xl p-6 border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Occupancy Rate</h3>
                    <div className="flex items-center justify-center py-4">
                        <div className="relative w-40 h-40">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="80"
                                    cy="80"
                                    r="70"
                                    stroke="#e5e7eb"
                                    strokeWidth="12"
                                    fill="none"
                                />
                                <circle
                                    cx="80"
                                    cy="80"
                                    r="70"
                                    stroke="url(#gradient)"
                                    strokeWidth="12"
                                    fill="none"
                                    strokeDasharray={`${(stats.occupancyRate / 100) * 440} 440`}
                                    strokeLinecap="round"
                                />
                                <defs>
                                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#3b82f6" />
                                        <stop offset="100%" stopColor="#8b5cf6" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                    <span className="text-3xl font-bold text-gray-900">{stats.occupancyRate}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mt-2">
                        {stats.occupancyRate >= 80 ? (
                            <>
                                <TrendingUp className="w-4 h-4 text-green-500" />
                                <span className="text-green-600">Excellent occupancy</span>
                            </>
                        ) : (
                            <>
                                <TrendingDown className="w-4 h-4 text-orange-500" />
                                <span className="text-orange-600">Room for improvement</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Upcoming Payments */}
                <div className="bg-white rounded-xl p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Upcoming Payments</h3>
                        <Link href="/dashboard/rent" className="text-sm text-blue-600 hover:text-blue-700">
                            View all
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {stats.upcomingPayments > 0 ? (
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50">
                                <Calendar className="w-5 h-5 text-yellow-600" />
                                <div>
                                    <p className="font-medium text-gray-900">{stats.upcomingPayments} payments due</p>
                                    <p className="text-sm text-gray-500">This week</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50">
                                <Calendar className="w-5 h-5 text-green-600" />
                                <div>
                                    <p className="font-medium text-gray-900">No upcoming payments</p>
                                    <p className="text-sm text-gray-500">All caught up!</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                {activities.length > 0 ? (
                    <div className="space-y-4">
                        {activities.map((activity) => (
                            <div
                                key={activity.id}
                                className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.type === 'payment' ? 'bg-green-100 text-green-600' :
                                    activity.type === 'maintenance' ? 'bg-orange-100 text-orange-600' :
                                        'bg-blue-100 text-blue-600'
                                    }`}>
                                    {activity.type === 'payment' ? <DollarSign className="w-5 h-5" /> :
                                        activity.type === 'maintenance' ? <Wrench className="w-5 h-5" /> :
                                            <Users className="w-5 h-5" />}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">{activity.message}</p>
                                    <p className="text-sm text-gray-500">{activity.date}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No recent activity</p>
                        <p className="text-sm text-gray-400">Start adding properties and tenants to see activity here</p>
                    </div>
                )}
            </div>
        </div>
    )
}