import React from 'react'
import { MoreVertical } from 'lucide-react'

interface Activity {
  id: number
  user: string
  action: string
  time: string
}

interface RecentActivityProps {
  activities: Activity[]
}

const RecentActivity: React.FC<RecentActivityProps> = ({ activities }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <button className="text-gray-400 hover:text-gray-600">
          <MoreVertical className="h-5 w-5" />
        </button>
      </div>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start pb-4 border-b border-gray-100 last:border-0 last:pb-0">
            <div className="shrink-0 mt-1">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">
                  {activity.user.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-gray-900">
                <span className="font-medium">{activity.user}</span> {activity.action}
              </p>
              <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
      <button className="w-full mt-6 text-sm text-blue-600 hover:text-blue-800 font-medium py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
        View All Activity
      </button>
    </div>
  )
}

export default RecentActivity