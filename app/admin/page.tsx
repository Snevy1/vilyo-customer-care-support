import React from 'react'
import { 
  Users, 
  Cpu, 
  DollarSign, 
  TrendingUp, 
  Activity,
  ShoppingCart,
  Clock,
  ChevronRight,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import StatCard from './components/StatCard'
import RecentActivity from './components/RecentActivity'
import ChartOverview from './components/ChartOverview'
import TopProducts from './components/TopProducts'

const AdminPage = () => {
  const stats = [
  {
    title: 'Total Revenue',
    value: '$24,589',
    change: '+12.5%',
    trend: 'up',  // Make sure this is 'up' not a general string
    icon: DollarSign,
    color: 'bg-emerald-200',
    iconColor: 'text-emerald-500'
  },
  {
    title: 'Active Users',
    value: '3,248',
    change: '+8.2%',
    trend: 'up',  // Fix: Change from string to 'up'
    icon: Users,
    color: 'bg-blue-200',
    iconColor: 'text-blue-500'
  },
  {
    title: 'AI Model Runs',
    value: '12,456',
    change: '+23.1%',
    trend: 'up',  // Fix: Change from string to 'up'
    icon: Cpu,
    color: 'bg-purple-200',
    iconColor: 'text-purple-500'
  },
  {
    title: 'Conversion Rate',
    value: '4.8%',
    change: '-2.1%',
    trend: 'down',  // Fix: Change from string to 'down'
    icon: TrendingUp,
    color: 'bg-amber-200',
    iconColor: 'text-amber-500'
  }
]

  const recentActivities = [
    { id: 1, user: 'Alex Johnson', action: 'created new project', time: '2 min ago' },
    { id: 2, user: 'Sam Wilson', action: 'updated AI model settings', time: '15 min ago' },
    { id: 3, user: 'Taylor Swift', action: 'processed 500 images', time: '1 hour ago' },
    { id: 4, user: 'Chris Evans', action: 'made payment of $249', time: '2 hours ago' },
    { id: 5, user: 'Emma Watson', action: 'submitted support ticket', time: '3 hours ago' }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-zinc-600 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last quarter</option>
              <option>Year to date</option>
            </select>
          </div>
          <button className="px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center">
            Generate Report
            <ChevronRight className="ml-2 h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartOverview />
        </div>
        <div>
          <RecentActivity activities={recentActivities} />
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopProducts />
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
            <span className="px-3 py-1  text-emerald-400 text-xs font-medium rounded-full">
              All Systems Operational
            </span>
          </div>
          <div className="space-y-4">
            {[
              { name: 'API Server', status: 'operational', latency: '45ms' },
              { name: 'Database', status: 'operational', latency: '12ms' },
              { name: 'Cache Server', status: 'degraded', latency: '89ms' },
              { name: 'AI Processing', status: 'operational', latency: '210ms' }
            ].map((service, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className={`h-2 w-2 rounded-full mr-3 ${service.status === 'operational' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <span className="text-sm font-medium text-gray-900">{service.name}</span>
                </div>
                <div className="text-sm text-gray-600">{service.latency}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminPage;