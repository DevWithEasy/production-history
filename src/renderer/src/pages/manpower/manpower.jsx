import { useEffect, useState } from 'react'

export default function ManpowerDashboard() {
  const [loading, setLoading] = useState(false)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [yearlySummary, setYearlySummary] = useState(null)
  const [monthlyData, setMonthlyData] = useState([])
  const [sectionWiseData, setSectionWiseData] = useState([])
  const [topSections, setTopSections] = useState([])

  // Generate years list (last 5 years + next 2 years)
  const years = Array.from({ length: 6 }, (_, i) => 2025 + i)

  const months = [
    { id: 1, name: 'January', short: 'Jan', days: 31 },
    { id: 2, name: 'February', short: 'Feb', days: 28 },
    { id: 3, name: 'March', short: 'Mar', days: 31 },
    { id: 4, name: 'April', short: 'Apr', days: 30 },
    { id: 5, name: 'May', short: 'May', days: 31 },
    { id: 6, name: 'June', short: 'Jun', days: 30 },
    { id: 7, name: 'July', short: 'Jul', days: 31 },
    { id: 8, name: 'August', short: 'Aug', days: 31 },
    { id: 9, name: 'September', short: 'Sep', days: 30 },
    { id: 10, name: 'October', short: 'Oct', days: 31 },
    { id: 11, name: 'November', short: 'Nov', days: 30 },
    { id: 12, name: 'December', short: 'Dec', days: 31 }
  ]

  // Check for leap year
  const isLeapYear = (year) => {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
  }

  const loadYearlyData = async (year) => {
    setLoading(true)
    try {
      // Load yearly summary
      const yearlyData = await window.api.getYearlyManpowerSummary(year)

      // Process monthly data
      const processedMonthlyData = months.map((month) => {
        const monthData = yearlyData.monthly_summary?.find((m) => m.month === month.id) || {}

        // Calculate days in month
        let daysInMonth = month.days
        if (month.id === 2 && isLeapYear(year)) {
          daysInMonth = 29
        }

        // Calculate daily average
        const totalManpower = monthData.total_manpower || 0
        const avgDailyManpower = daysInMonth > 0 ? totalManpower / daysInMonth : 0

        return {
          ...month,
          ...monthData,
          daysInMonth,
          avgDailyManpower: Math.round(avgDailyManpower * 10) / 10
        }
      })

      setMonthlyData(processedMonthlyData)

      // Process section-wise data
      const sectionData = yearlyData.section_summary || []
      setSectionWiseData(sectionData)

      // Get top 5 sections by total manpower
      const sortedSections = [...sectionData]
        .sort((a, b) => (b.total_manpower || 0) - (a.total_manpower || 0))
        .slice(0, 5)

      setTopSections(sortedSections)

      // Calculate yearly totals
      const yearlyTotalManpower = processedMonthlyData.reduce(
        (sum, month) => sum + (month.total_manpower || 0),
        0
      )
      const yearlyTotalDays = processedMonthlyData.reduce(
        (sum, month) => sum + month.daysInMonth,
        0
      )
      const yearlyAvgDailyManpower = yearlyTotalDays > 0 ? yearlyTotalManpower / yearlyTotalDays : 0
      const totalSections = new Set(sectionData.map((s) => s.section_id)).size

      setYearlySummary({
        totalManpower: yearlyTotalManpower,
        totalDays: yearlyTotalDays,
        avgDailyManpower: Math.round(yearlyAvgDailyManpower * 10) / 10,
        sectionsCount: totalSections,
        peakMonth: processedMonthlyData.reduce((max, month) =>
          (month.total_manpower || 0) > (max.total_manpower || 0) ? month : max
        ),
        lowestMonth: processedMonthlyData.reduce((min, month) =>
          (month.total_manpower || 0) < (min.total_manpower || 0) ? month : min
        )
      })
    } catch (error) {
      console.error('Error loading yearly data:', error)
      // Set empty data
      setMonthlyData(
        months.map((month) => ({
          ...month,
          total_manpower: 0,
          daysInMonth: month.id === 2 && isLeapYear(year) ? 29 : month.days,
          avgDailyManpower: 0
        }))
      )
      setSectionWiseData([])
      setTopSections([])
      setYearlySummary(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadYearlyData(selectedYear)
  }, [selectedYear])

  const handleYearChange = (e) => {
    setSelectedYear(parseInt(e.target.value))
  }

  // Format number with commas
  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num)
  }

  // Get color based on value
  const getColorClass = (value, max) => {
    const percentage = (value / max) * 100
    if (percentage >= 80) return 'bg-red-500'
    if (percentage >= 60) return 'bg-orange-500'
    if (percentage >= 40) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  // Find max manpower for scaling
  const maxMonthlyManpower = Math.max(...monthlyData.map((m) => m.total_manpower || 0), 1)

  return (
    <div className="">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Manpower Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Yearly overview of manpower distribution and utilization
            </p>
          </div>
          <div className="w-48">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Year</label>
            <select
              value={selectedYear}
              onChange={handleYearChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              disabled={loading}
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading yearly data...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Yearly Summary Cards */}
          {yearlySummary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Manpower</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">
                      {formatNumber(yearlySummary.totalManpower)}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">man-days</p>
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
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-6.5l-2.25 1.313"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Average Daily</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">
                      {formatNumber(yearlySummary.avgDailyManpower)}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">people per day</p>
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
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Active Sections</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">
                      {yearlySummary.sectionsCount}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">sections</p>
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
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Peak Month</p>
                    <p className="text-2xl font-bold text-gray-800 mt-2">
                      {yearlySummary.peakMonth?.name}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatNumber(yearlySummary.peakMonth?.total_manpower || 0)} man-days
                    </p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg">
                    <svg
                      className="w-8 h-8 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Monthly Manpower Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                Monthly Manpower Distribution - {selectedYear}
              </h2>
              <div className="text-sm text-gray-500">
                Max: {formatNumber(maxMonthlyManpower)} man-days
              </div>
            </div>

            <div className="space-y-4">
              {monthlyData.map((month) => {
                const manpower = month.total_manpower || 0
                const percentage = (manpower / maxMonthlyManpower) * 100

                return (
                  <div key={month.id} className="flex items-center">
                    <div className="w-20 text-sm font-medium text-gray-700">{month.short}</div>
                    <div className="flex-1 ml-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">
                          {formatNumber(manpower)} man-days
                        </span>
                        <span className="text-sm text-gray-500">
                          Avg: {month.avgDailyManpower}/day
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${getColorClass(manpower, maxMonthlyManpower)} transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Sections */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Top Sections by Manpower</h2>

              {topSections.length > 0 ? (
                <div className="space-y-4">
                  {topSections.map((section, index) => {
                    const maxSectionManpower = Math.max(
                      ...topSections.map((s) => s.total_manpower || 0),
                      1
                    )
                    const percentage = ((section.total_manpower || 0) / maxSectionManpower) * 100

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
                                  : index === 2
                                    ? 'bg-orange-100 text-orange-800'
                                    : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {index + 1}
                          </span>
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium text-gray-800">
                              {section.section_name}
                            </span>
                            <span className="text-sm font-bold text-gray-700">
                              {formatNumber(section.total_manpower || 0)}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-blue-500 transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Avg: {Math.round(((section.total_manpower || 0) / 365) * 10) / 10}/day
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">No section data available</div>
              )}
            </div>

            {/* Monthly Summary Table */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Monthly Summary</h2>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                        Month
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                        Man-Days
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                        Daily Avg
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                        Days
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyData.map((month) => (
                      <tr key={month.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-800">{month.name}</div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-bold text-gray-800">
                            {formatNumber(month.total_manpower || 0)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-gray-700">{month.avgDailyManpower}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-gray-500">{month.daysInMonth}</span>
                        </td>
                      </tr>
                    ))}

                    {/* Yearly Total Row */}
                    {yearlySummary && (
                      <tr className="bg-gray-50 font-bold">
                        <td className="py-3 px-4">
                          <div className="font-bold text-gray-800">Year {selectedYear} Total</div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-blue-600">
                            {formatNumber(yearlySummary.totalManpower)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-blue-600">{yearlySummary.avgDailyManpower}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-blue-600">{yearlySummary.totalDays}</span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Section-wise Details Table */}
          {sectionWiseData.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mt-8">
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                Section-wise Manpower Details
              </h2>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                        Section
                      </th>
                      {months.map((month) => (
                        <th
                          key={month.id}
                          className="text-center py-3 px-2 text-sm font-medium text-gray-700"
                        >
                          {month.short}
                        </th>
                      ))}
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                        Yearly Total
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                        Daily Avg
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sectionWiseData.map((section) => {
                      const yearlyTotal =
                        section.monthly_data?.reduce(
                          (sum, month) => sum + (month.manpower || 0),
                          0
                        ) || 0
                      const dailyAvg = Math.round((yearlyTotal / 365) * 10) / 10

                      return (
                        <tr
                          key={section.section_id}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-800">{section.section_name}</div>
                          </td>

                          {months.map((month) => {
                            const monthData = section.monthly_data?.find(
                              (m) => m.month === month.id
                            )
                            return (
                              <td key={month.id} className="text-center py-3 px-2">
                                <span className="text-gray-700">
                                  {monthData ? formatNumber(monthData.manpower || 0) : '0'}
                                </span>
                              </td>
                            )
                          })}

                          <td className="py-3 px-4 text-right">
                            <span className="font-bold text-gray-800">
                              {formatNumber(yearlyTotal)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-gray-700">{dailyAvg}</span>
                          </td>
                        </tr>
                      )
                    })}

                    {/* Monthly Totals Row */}
                    <tr className="bg-gray-50 font-bold">
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-800">Monthly Total</div>
                      </td>

                      {months.map((month) => {
                        const monthTotal = sectionWiseData.reduce((sum, section) => {
                          const monthData = section.monthly_data?.find((m) => m.month === month.id)
                          return sum + (monthData?.manpower || 0)
                        }, 0)

                        return (
                          <td key={month.id} className="text-center py-3 px-2">
                            <span className="text-blue-600">{formatNumber(monthTotal)}</span>
                          </td>
                        )
                      })}

                      <td className="py-3 px-4 text-right">
                        <span className="text-blue-600">
                          {formatNumber(
                            sectionWiseData.reduce(
                              (sum, section) =>
                                sum +
                                (section.monthly_data?.reduce(
                                  (mSum, month) => mSum + (month.manpower || 0),
                                  0
                                ) || 0),
                              0
                            )
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-blue-600">
                          {Math.round(
                            (sectionWiseData.reduce(
                              (sum, section) =>
                                sum +
                                (section.monthly_data?.reduce(
                                  (mSum, month) => mSum + (month.manpower || 0),
                                  0
                                ) || 0),
                              0
                            ) /
                              365) *
                              10
                          ) / 10}
                        </span>
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
  )
}
