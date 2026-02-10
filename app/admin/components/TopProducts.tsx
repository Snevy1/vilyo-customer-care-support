import React from 'react'

const TopProducts = () => {
  const products = [
    { name: 'AI Image Generator', sales: 1242, revenue: '$24,840', growth: '+24%' },
    { name: 'Chat Assistant Pro', sales: 856, revenue: '$17,120', growth: '+18%' },
    { name: 'Document Analyzer', sales: 543, revenue: '$10,860', growth: '+12%' },
    { name: 'Code Optimizer', sales: 421, revenue: '$8,420', growth: '+8%' },
    { name: 'Video Processor', sales: 298, revenue: '$5,960', growth: '+5%' }
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Performing Products</h3>
      <div className="space-y-4">
        {products.map((product, index) => (
          <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-lg bg-linear-to-br bg-blue-400 flex items-center justify-center text-white font-bold">
                {product.name.charAt(0)}
              </div>
              <div className="ml-4">
                <div className="font-medium text-gray-900">{product.name}</div>
                <div className="text-sm text-gray-600">{product.sales} sales</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium text-gray-600">{product.revenue}</div>
              <div className="text-sm text-emerald-400">{product.growth}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TopProducts;