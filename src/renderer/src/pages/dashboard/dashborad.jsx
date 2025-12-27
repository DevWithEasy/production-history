import { useEffect, useState } from 'react'
import { getPeriod, setPeriod } from '../../utils/storage'
import { format } from 'date-fns'

export default function Dashboard() {
  const years = Array.from({ length: 6 }, (_, i) => 2025 + i)

  const months = [
    { name: 'January', value: 1 },
    { name: 'February', value: 2 },
    { name: 'March', value: 3 },
    { name: 'April', value: 4 },
    { name: 'May', value: 5 },
    { name: 'June', value: 6 },
    { name: 'July', value: 7 },
    { name: 'August', value: 8 },
    { name: 'September', value: 9 },
    { name: 'October', value: 10 },
    { name: 'November', value: 11 },
    { name: 'December', value: 12 }
  ]

  const saved = getPeriod()

  const [year, setYear] = useState(saved.year)
  const [month, setMonth] = useState(saved.month)
  const [loading, setLoading] = useState(false)
  const [productionData, setProductionData] = useState(null)
  const [yearlySummary, setYearlySummary] = useState(null)
  const [topSections, setTopSections] = useState([])

  // 🔐 Save to localStorage when change
  useEffect(() => {
    setPeriod({ year, month })
    loadProductionData(year, month)
    loadYearlySummary(year)
  }, [year, month])

  const loadProductionData = async (year, month) => {
    setLoading(true)
    try {
      const data = await window.api.getMonthlyProductionSummary(year, month)
      setProductionData(data)

      // Calculate top 3 sections
      if (data?.section_wise) {
        const sortedSections = [...data.section_wise]
          .sort((a, b) => b.total_value - a.total_value)
          .slice(0, 3)
        setTopSections(sortedSections)
      }
    } catch (error) {
      console.error('Error loading production data:', error)
      setProductionData(null)
      setTopSections([])
    } finally {
      setLoading(false)
    }
  }

  const loadYearlySummary = async (year) => {
    try {
      const data = await window.api.getYearlyProductionSummary(year)
      setYearlySummary(data)
    } catch (error) {
      console.error('Error loading yearly summary:', error)
      setYearlySummary(null)
    }
  }

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Format number with commas
  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num)
  }

  // Calculate percentage
  const calculatePercentage = (value, total) => {
    if (total === 0) return 0
    return Math.round((value / total) * 100)
  }

  // Get color based on value
  const getProgressColor = (percentage) => {
    if (percentage >= 80) return 'bg-green-500'
    if (percentage >= 60) return 'bg-blue-500'
    if (percentage >= 40) return 'bg-yellow-500'
    if (percentage >= 20) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const handleBackup = async () => {
    const result = await window.api.dbBackup()

    if (result.success) {
      alert('Backup successful!\nSaved to:\n' + result.path)
    } else {
      alert(result.message || 'Backup failed')
    }
  }

  return (
    <div className="min-h-screen overflow-y-auto">
      {/* Header */}
      <div className="border-b border-gray-300 pl-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="relative">
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="appearance-none border border-gray-300 px-4 py-2 pr-8 bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  disabled={loading}
                >
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg
                    className="fill-current h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>

              <div className="relative">
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="appearance-none border border-gray-300  px-4 py-2 pr-8 bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  disabled={loading}
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg
                    className="fill-current h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <button className="p-2 bg-black text-white" onClick={handleBackup}>
            Create Backup
          </button>
        </div>

        <div className="mt-1 text-sm text-gray-600">
          View Period:{' '}
          <span className="font-semibold">
            {months[month - 1]?.name}, {year}
          </span>
          {loading && (
            <span className="ml-3 inline-flex items-center text-blue-600">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Loading...
            </span>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-2">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading production data...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Monthly Production Value */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Monthly Production</p>
                    <p className="font-bold text-gray-800 mt-2">
                      {productionData ? formatCurrency(productionData.monthly_total) : '৳0'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {productionData?.total_products || 0} products
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <svg
                      className="w-8 h-8 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Yearly Production Value */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Yearly Production</p>
                    <p className="font-bold text-gray-800 mt-2">
                      {yearlySummary ? formatCurrency(yearlySummary.yearly_total) : '৳0'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {yearlySummary?.total_months || 0} months
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <svg
                      className="w-8 h-8 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Average Daily Production */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Daily Average</p>
                    <p className="font-bold text-gray-800 mt-2">
                      {productionData ? formatCurrency(productionData.daily_average) : '৳0'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {productionData?.working_days || 0} working days
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <svg
                      className="w-8 h-8 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Top Performing Section */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Top Section</p>
                    <p className="font-bold text-gray-800 mt-2 truncate">
                      {topSections[0]?.section_name || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {topSections[0] ? formatCurrency(topSections[0].total_value) : '৳0'}
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <svg
                      className="w-8 h-8 text-yellow-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Section-wise Production */}
              <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 mb-6">
                  Section-wise Production - {months[month - 1]?.name} {year}
                </h2>

                {productionData?.section_wise && productionData.section_wise.length > 0 ? (
                  <div className="space-y-6">
                    {productionData.section_wise.map((section) => {
                      const percentage = calculatePercentage(
                        section.total_value,
                        productionData.monthly_total
                      )

                      return (
                        <div key={section.section_id} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-medium text-gray-800">{section.section_name}</h3>
                              <p className="text-sm text-gray-500">
                                {section.total_products} products •{' '}
                                {formatNumber(section.total_batch)} batches
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-gray-800">
                                {formatCurrency(section.total_value)}
                              </p>
                              <p className="text-sm text-gray-500">{percentage}% of total</p>
                            </div>
                          </div>

                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className={`h-2.5 rounded-full ${getProgressColor(percentage)} transition-all duration-500`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            ></div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-gray-500">Total Cartons</p>
                              <p className="font-semibold text-gray-800">
                                {formatNumber(section.total_carton)}
                              </p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-gray-500">Avg. Value per Product</p>
                              <p className="font-semibold text-gray-800">
                                {formatCurrency(
                                  section.total_value / Math.max(section.total_products, 1)
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No production data available for this month
                  </div>
                )}
              </div>

              {/* Top Sections & Yearly Summary */}
              <div className="space-y-8">
                {/* Top 3 Sections */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h2 className="text-xl font-bold text-gray-800 mb-6">Top Performing Sections</h2>

                  {topSections.length > 0 ? (
                    <div className="space-y-4">
                      {topSections.map((section, index) => {
                        const percentage = calculatePercentage(
                          section.total_value,
                          productionData?.monthly_total || 1
                        )

                        return (
                          <div key={section.section_id} className="flex items-center">
                            <div className="w-8 text-center">
                              <span
                                className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
                                ${
                                  index === 0
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : index === 1
                                      ? 'bg-gray-100 text-gray-800'
                                      : 'bg-orange-100 text-orange-800'
                                }`}
                              >
                                {index + 1}
                              </span>
                            </div>
                            <div className="ml-3 flex-1">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-medium text-gray-800 truncate">
                                  {section.section_name}
                                </span>
                                <span className="text-sm font-bold text-gray-700">
                                  {formatCurrency(section.total_value)}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="h-2 rounded-full bg-blue-500 transition-all duration-500"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {section.total_products} products • {percentage}% of total
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">No section data available</div>
                  )}
                </div>

                {/* Yearly Summary */}
                {yearlySummary && (
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800 mb-6">Year {year} Summary</h2>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                        <span className="text-gray-700">Total Production</span>
                        <span className="font-bold text-gray-800">
                          {formatCurrency(yearlySummary.yearly_total)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                        <span className="text-gray-700">Monthly Average</span>
                        <span className="font-bold text-gray-800">
                          {formatCurrency(yearlySummary.monthly_average)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                        <span className="text-gray-700">Best Month</span>
                        <div className="text-right">
                          <span className="font-bold text-gray-800">
                            {yearlySummary.best_month?.month_name || 'N/A'}
                          </span>
                          <p className="text-sm text-gray-500">
                            {yearlySummary.best_month
                              ? formatCurrency(yearlySummary.best_month.value)
                              : '৳0'}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Total Products</span>
                        <span className="font-bold text-gray-800">
                          {formatNumber(yearlySummary.total_products || 0)}
                        </span>
                      </div>

                      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-700">
                          <span className="font-semibold">Note:</span> Yearly data includes
                          production from all sections
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Monthly Summary Table */}
            {productionData?.daily_summary && productionData.daily_summary.length > 0 && (
              <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Daily Production Summary</h2>

                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                          Date
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                          Total Value
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                          Total Batches
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                          Total Cartons
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                          Products
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                          Daily Rank
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {productionData.daily_summary.map((day, index) => (
                        <tr key={day.date} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-800">
                              {format(new Date(day.date), 'dd MMM yyyy')}
                            </div>
                            <div className="text-xs text-gray-500">
                              {format(new Date(day.date), 'EEEE')}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="font-bold text-gray-800">
                              {formatCurrency(day.total_value)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-gray-700">{formatNumber(day.total_batch)}</span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-gray-700">{formatNumber(day.total_carton)}</span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-gray-700">{day.total_products}</span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span
                              className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold
                              ${
                                index === 0
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : index === 1
                                    ? 'bg-gray-100 text-gray-800'
                                    : index === 2
                                      ? 'bg-orange-100 text-orange-800'
                                      : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {index + 1}
                            </span>
                          </td>
                        </tr>
                      ))}

                      {/* Monthly Total Row */}
                      <tr className="bg-gray-50 font-bold">
                        <td className="py-3 px-4">
                          <div className="font-bold text-gray-800">Monthly Total</div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-blue-600">
                            {productionData ? formatCurrency(productionData.monthly_total) : '৳0'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-blue-600">
                            {formatNumber(
                              productionData?.section_wise?.reduce(
                                (sum, section) => sum + section.total_batch,
                                0
                              ) || 0
                            )}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-blue-600">
                            {formatNumber(
                              productionData?.section_wise?.reduce(
                                (sum, section) => sum + section.total_carton,
                                0
                              ) || 0
                            )}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-blue-600">
                            {productionData?.total_products || 0}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-blue-600">-</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
