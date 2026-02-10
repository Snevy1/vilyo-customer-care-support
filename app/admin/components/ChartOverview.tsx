import React from 'react'
import { TrendingUp } from 'lucide-react'

const ChartOverview = () => {
  const data = [65, 59, 80, 81, 56, 55, 40, 45, 50, 70, 85, 90]
  const maxValue = Math.max(...data)
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Revenue Overview</h3>
          <p className="text-sm text-gray-600">Total performance for last 12 months</p>
        </div>
        <div className="flex items-center text-emerald-600">
          <TrendingUp className="h-5 w-5 mr-1" />
          <span className="text-sm font-medium">+12.5% from last year</span>
        </div>
      </div>
      <div className="h-64">
        <div className="flex items-end h-48 space-x-1 mt-4">
          {data.map((value, index) => {
            const height = (value / maxValue) * 100
            return (
              <div key={index} className="flex flex-col items-center flex-1">
                <div 
                  className="w-full bg-linear-to-t from-blue-500 to-blue-300 rounded-t-lg transition-all hover:opacity-80"
                  style={{ height: `${height}%` }}
                />
                <span className="text-xs text-gray-500 mt-2">
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][index]}
                </span>
              </div>
            )
          })}
        </div>
      </div>
      <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100">
        <div className="text-sm">
          <span className="text-gray-600">Avg. Revenue:</span>
          <span className="font-medium text-gray-900 ml-2">$2,845</span>
        </div>
        <div className="flex space-x-4">
          <div className="flex items-center">
            <div className="h-3 w-3 rounded-full bg-blue-500 mr-2" />
            <span className="text-sm text-gray-600">Current Year</span>
          </div>
          <div className="flex items-center">
            <div className="h-3 w-3 rounded-full bg-gray-300 mr-2" />
            <span className="text-sm text-gray-600">Previous Year</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChartOverview