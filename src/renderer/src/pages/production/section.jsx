import { format } from 'date-fns'
import { debounce } from 'lodash'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { getPeriod } from '../../utils/storage'

export default function SectionProduction() {
  const params = useParams()
  const [searchParams] = useSearchParams()
  const section = searchParams.get('section')
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [saving, setSaving] = useState(false)
  const [edits, setEdits] = useState(new Map())
  const scrollContainerRef = useRef(null)
  const headerRef = useRef(null)
  const fixedColumnRef = useRef(null)

  const { year, month } = getPeriod()
  const lastDay = new Date(year, month, 0).getDate()

  // Debounced save functions
  const debouncedSaveProduction = useCallback(
    debounce(async (date, p_id, batch, carton) => {
      try {
        await window.api.setDailyProduction(date, p_id, batch, carton)
        console.log(`Auto-saved production: ${date}, Product: ${p_id}`)
      } catch (error) {
        console.error('Error auto-saving production:', error)
        setMessage({ type: 'error', text: `Failed to save production: ${error.message}` })
        hideMessage()
      }
    }, 1000),
    []
  )

  const debouncedSaveSummary = useCallback(
    debounce(async (p_id, opening, sales_target) => {
      try {
        await window.api.updateMonthlySummary(p_id, year, month, opening, sales_target)
        console.log(`Auto-saved summary for product: ${p_id}`)
      } catch (error) {
        console.error('Error auto-saving summary:', error)
        setMessage({ type: 'error', text: `Failed to save summary: ${error.message}` })
        hideMessage()
      }
    }, 1000),
    []
  )

  const debouncedSavePrice = useCallback(
    debounce(async (p_id, price) => {
      try {
        await window.api.setMonthlyPrice(p_id, year, month, price)
        console.log(`Auto-saved price for product: ${p_id}`)
      } catch (error) {
        console.error('Error auto-saving price:', error)
        setMessage({ type: 'error', text: `Failed to save price: ${error.message}` })
        hideMessage()
      }
    }, 1000),
    []
  )

  const hideMessage = () => {
    setTimeout(() => {
      setMessage({ type: '', text: '' })
    }, 3000)
  }

  const loadProducts = async (sectionId, month, year) => {
    setLoading(true)
    try {
      const data = await window.api.getDailyProduction(sectionId, month, year)
      setProducts(data)
    } catch (error) {
      console.error('Error loading products:', error)
      setMessage({ type: 'error', text: 'Failed to load products' })
      hideMessage()
    } finally {
      setLoading(false)
    }
  }

  // Handle production input change
  const handleProductionChange = (productId, date, field, value) => {
    const numValue = parseInt(value) || 0

    // First, update the state immediately for UI
    setProducts((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const updatedProductions = item.productions.map((prod) => {
            if (prod.date === date) {
              return {
                ...prod,
                [field]: numValue,
                modified: true
              }
            }
            return prod
          })

          // Recalculate stats after production change
          const totalProduction = updatedProductions.reduce(
            (sum, prod) => sum + (prod.carton || 0),
            0
          )
          const currentTotal = item.monthly_summary.opening + totalProduction
          const remainingProduction = Math.max(
            item.monthly_summary.production_target - currentTotal,
            0
          )
          const completionPercentage =
            item.monthly_summary.production_target > 0
              ? Math.min(
                  Math.round((currentTotal / item.monthly_summary.production_target) * 100),
                  100
                )
              : 0
          const floorProductionTarget = Math.max(
            item.monthly_summary.production_target - item.monthly_summary.opening,
            0
          )

          return {
            ...item,
            productions: updatedProductions,
            stats: {
              ...item.stats,
              total_production: totalProduction,
              current_total: currentTotal,
              remaining_production: remainingProduction,
              completion_percentage: completionPercentage,
              floor_production_target: floorProductionTarget
            }
          }
        }
        return item
      })
    )

    // Find the product to get both batch and carton values
    const product = products.find((p) => p.product.id === productId)
    if (product) {
      // Get the specific production entry
      const production = product.productions.find((p) => p.date === date)

      // Prepare the values to save
      const batchValue = field === 'batch' ? numValue : production?.batch || 0
      const cartonValue = field === 'carton' ? numValue : production?.carton || 0

      // Save immediately without waiting for both fields
      debouncedSaveProduction(date, productId, batchValue, cartonValue)

      console.log(
        `Saving: ${date}, Product: ${productId}, Batch: ${batchValue}, Carton: ${cartonValue}`
      )
    }

    // Update edits tracking
    const key = `production-${productId}-${date}`
    const currentEdits = edits.get(key) || { batch: 0, carton: 0 }
    const newEdits = { ...currentEdits, [field]: numValue }

    setEdits((prev) => new Map(prev.set(key, newEdits)))

    // Remove from edits after 2 seconds
    setTimeout(() => {
      setEdits((prev) => {
        const newMap = new Map(prev)
        newMap.delete(key)
        return newMap
      })
    }, 2000)
  }

  // Handle summary input change
  const handleSummaryChange = (productId, field, value) => {
    const numValue = parseInt(value) || 0

    setProducts((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const currentSummary = item.monthly_summary
          let updatedSummary = { ...currentSummary }

          if (field === 'opening') {
            updatedSummary = { ...updatedSummary, opening: numValue }
          } else if (field === 'sales_target') {
            const production_target = Math.round(numValue * 1.2) // 20% extra
            updatedSummary = {
              ...updatedSummary,
              sales_target: numValue,
              production_target: production_target
            }
          }

          // Recalculate all stats
          const totalProduction = item.productions.reduce(
            (sum, prod) => sum + (prod.carton || 0),
            0
          )
          const currentTotal = updatedSummary.opening + totalProduction
          const floorProductionTarget = Math.max(
            updatedSummary.production_target - updatedSummary.opening,
            0
          )
          const remainingProduction = Math.max(updatedSummary.production_target - currentTotal, 0)
          const completionPercentage =
            updatedSummary.production_target > 0
              ? Math.min(Math.round((currentTotal / updatedSummary.production_target) * 100), 100)
              : 0

          return {
            ...item,
            monthly_summary: updatedSummary,
            stats: {
              ...item.stats,
              total_production: totalProduction,
              current_total: currentTotal,
              floor_production_target: floorProductionTarget,
              remaining_production: remainingProduction,
              completion_percentage: completionPercentage
            }
          }
        }
        return item
      })
    )

    const key = `summary-${productId}-${field}`
    setEdits(
      (prev) =>
        new Map(
          prev.set(key, {
            type: 'summary',
            productId,
            field,
            value: numValue
          })
        )
    )

    // Get current product to send summary update
    const product = products.find((p) => p.product.id === productId)
    if (product) {
      const currentSummary = product.monthly_summary
      let opening = currentSummary.opening
      let sales_target = currentSummary.sales_target

      if (field === 'opening') {
        opening = numValue
      } else if (field === 'sales_target') {
        sales_target = numValue
      }

      debouncedSaveSummary(productId, opening, sales_target)
    }

    setTimeout(() => {
      setEdits((prev) => {
        const newMap = new Map(prev)
        newMap.delete(key)
        return newMap
      })
    }, 1500)
  }

  // Handle price change
  const handlePriceChange = (productId, value) => {
    const numValue = parseInt(value) || 0

    setProducts((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          return {
            ...item,
            product: {
              ...item.product,
              current_price: numValue
            }
          }
        }
        return item
      })
    )

    const key = `price-${productId}`
    setEdits(
      (prev) =>
        new Map(
          prev.set(key, {
            type: 'price',
            productId,
            value: numValue
          })
        )
    )

    debouncedSavePrice(productId, numValue)

    setTimeout(() => {
      setEdits((prev) => {
        const newMap = new Map(prev)
        newMap.delete(key)
        return newMap
      })
    }, 1500)
  }

  // Save all pending changes
  const saveAll = async () => {
    if (edits.size === 0) {
      setMessage({ type: 'info', text: 'No changes to save' })
      hideMessage()
      return
    }

    setSaving(true)
    let successCount = 0
    let errorCount = 0

    const editsArray = Array.from(edits.entries())

    for (const [key, edit] of editsArray) {
      try {
        if (key.startsWith('production-')) {
          const [, productId, date] = key.split('-')
          const productionEdit = edit
          await window.api.setDailyProduction(
            date,
            parseInt(productId),
            productionEdit.batch || 0,
            productionEdit.carton || 0
          )
          successCount++
        } else if (key.startsWith('summary-')) {
          const product = products.find((p) => p.product.id === edit.productId)
          if (product) {
            await window.api.updateMonthlySummary(
              edit.productId,
              year,
              month,
              product.monthly_summary.opening,
              product.monthly_summary.sales_target
            )
            successCount++
          }
        } else if (key.startsWith('price-')) {
          await window.api.setMonthlyPrice(edit.productId, year, month, edit.value)
          successCount++
        }
      } catch (error) {
        console.error(`Error saving ${key}:`, error)
        errorCount++
      }
    }

    setSaving(false)

    if (errorCount === 0) {
      setMessage({ type: 'success', text: `Successfully saved ${successCount} records` })
    } else {
      setMessage({ type: 'warning', text: `Saved ${successCount} records, ${errorCount} failed` })
    }

    setEdits(new Map())
    loadProducts(params?.sid, month, year)
    hideMessage()
  }

  // When selected section changes, load its products
  useEffect(() => {
    if (params?.sid) {
      loadProducts(params?.sid, month, year)
    }
  }, [params?.sid, year, month])

  // Get day name
  const getDayName = (day) => {
    const date = new Date(year, month - 1, day)
    return format(date, 'EEE')
  }

  // Check if day is weekend (Friday or Saturday)
  const isWeekend = (day) => {
    const date = new Date(year, month - 1, day)
    const dayOfWeek = date.getDay()
    return dayOfWeek === 5 // 5 = Friday
  }

  // Check if day is today
  const isToday = (day) => {
    const today = new Date()
    return today.getDate() === day && today.getMonth() + 1 === month && today.getFullYear() === year
  }

  // Calculate totals
  const getProductTotal = (productions) => {
    return productions.reduce(
      (total, prod) => ({
        batch: total.batch + (prod.batch || 0),
        carton: total.carton + (prod.carton || 0)
      }),
      { batch: 0, carton: 0 }
    )
  }

  const getColumnTotal = (dayIndex, field) => {
    return products.reduce((total, item) => {
      const prod = item.productions[dayIndex]
      return total + (prod?.[field] || 0)
    }, 0)
  }

  const getGrandTotals = () => {
    return products.reduce(
      (totals, item) => {
        const productTotal = getProductTotal(item.productions)
        return {
          batch: totals.batch + productTotal.batch,
          carton: totals.carton + productTotal.carton
        }
      },
      { batch: 0, carton: 0 }
    )
  }

  // Calculate section totals
  const calculateSectionTotals = () => {
    const totals = {
      production_target: 0,
      floor_target: 0,
      current_total: 0,
      remaining_production: 0,
      total_value: 0
    }

    products.forEach((item) => {
      const productTotal = getProductTotal(item.productions)
      totals.production_target += item.monthly_summary?.production_target || 0
      totals.floor_target += item.stats?.floor_production_target || 0
      totals.current_total += item.stats?.current_total || 0
      totals.remaining_production += item.stats?.remaining_production || 0
      totals.total_value += productTotal.carton * (item.product.current_price || 0)
    })

    return totals
  }

  const daysArray = Array.from({ length: lastDay }, (_, i) => i + 1)
  const sectionTotals = calculateSectionTotals()

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedSaveProduction.cancel()
      debouncedSaveSummary.cancel()
      debouncedSavePrice.cancel()
    }
  }, [debouncedSaveProduction, debouncedSaveSummary, debouncedSavePrice])

  // Sync scroll between header and content
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    const headerContainer = headerRef.current

    if (scrollContainer && headerContainer) {
      const handleScroll = () => {
        headerContainer.scrollLeft = scrollContainer.scrollLeft
      }

      scrollContainer.addEventListener('scroll', handleScroll)
      return () => scrollContainer.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Sync vertical scroll between fixed column and content
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    const fixedColumn = fixedColumnRef.current

    if (scrollContainer && fixedColumn) {
      const handleVerticalScroll = () => {
        fixedColumn.scrollTop = scrollContainer.scrollTop
      }

      scrollContainer.addEventListener('scroll', handleVerticalScroll)
      return () => scrollContainer.removeEventListener('scroll', handleVerticalScroll)
    }
  }, [])

  // Constants for consistent heights
  const ROW_HEIGHT = 120
  const HEADER_HEIGHT = 100

  return (
    <div className="flex flex-col">
      {/* Fixed Header */}
      <div className="shrink-0 mb-4">
        <div className="flex justify-between items-center pb-3 border-b border-gray-800">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{section}</h2>
            <p className="text-sm text-gray-600 mt-1">
              Production & Monthly Targets - {format(new Date(year, month - 1, 1), 'MMMM yyyy')}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              {products.length} product(s) | {lastDay} days
            </div>
            <button
              onClick={saveAll}
              disabled={saving || edits.size === 0}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded"
            >
              {saving ? 'Saving...' : `Save All (${edits.size})`}
            </button>
          </div>
        </div>

        {message.text && (
          <div
            className={`mt-3 p-3 rounded ${
              message.type === 'success'
                ? 'bg-green-100 text-green-700 border border-green-300'
                : message.type === 'error'
                  ? 'bg-red-100 text-red-700 border border-red-300'
                  : 'bg-blue-100 text-blue-700 border border-blue-300'
            }`}
          >
            {message.text}
          </div>
        )}
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-hidden flex border border-gray-300 rounded-lg bg-white">
        {/* Fixed Product Column */}
        <div className="w-96 flex flex-col border-r border-gray-300 bg-white">
          {/* Fixed Column Header */}
          <div
            className="shrink-0 border-b border-gray-300 bg-gray-50"
            style={{ height: `${HEADER_HEIGHT}px` }}
          >
            <div className="h-full flex items-center justify-center">
              <div className="font-medium text-gray-700 text-center p-2">
                <div className="text-lg">Products & Monthly Targets</div>
                <div className="text-xs text-gray-500 font-normal mt-1">
                  Price | Opening | Sales Target | Production Target
                </div>
              </div>
            </div>
          </div>

          {/* Product List - Scrollable vertically */}
          <div className="flex-1 overflow-y-auto" ref={fixedColumnRef}>
            <div>
              {products.map((item) => {
                return (
                  <div
                    key={item.product.id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    style={{ height: `${ROW_HEIGHT}px` }}
                  >
                    <div className="h-full p-3">
                      {/* Product Name */}
                      <div className="font-medium text-gray-900 text-sm truncate">
                        {item.product.name}
                      </div>

                      {/* Summary Inputs */}
                      <div className="grid grid-cols-4 gap-1">
                        <div>
                          <input
                            type="number"
                            value={item.product.current_price || 0}
                            onChange={(e) => handlePriceChange(item.product.id, e.target.value)}
                            className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            min="0"
                            placeholder="Price"
                          />
                          <div className="text-[10px] text-gray-500 text-center">Price</div>
                        </div>
                        <div>
                          <input
                            type="number"
                            value={item.monthly_summary?.opening || 0}
                            onChange={(e) =>
                              handleSummaryChange(item.product.id, 'opening', e.target.value)
                            }
                            className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            min="0"
                            placeholder="Opening"
                          />
                          <div className="text-[10px] text-gray-500 text-center">Opening</div>
                        </div>
                        <div>
                          <input
                            type="number"
                            value={item.monthly_summary?.sales_target || 0}
                            onChange={(e) =>
                              handleSummaryChange(item.product.id, 'sales_target', e.target.value)
                            }
                            className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            min="0"
                            placeholder="Sales Target"
                          />
                          <div className="text-[10px] text-gray-500 text-center">Sales Target</div>
                        </div>
                        <div>
                          <div className="w-full px-1 py-1 text-xs border border-gray-300 rounded bg-gray-100 text-center">
                            {item.monthly_summary?.production_target || 0}
                          </div>
                          <div className="text-[10px] text-gray-500 text-center">
                            P. Target (20%+)
                          </div>
                        </div>
                      </div>

                      {/* Status Bar */}
                      <div className="mt-1">
                        <div className="flex justify-between text-[10px] mb-0.5">
                          <span className="text-gray-600">
                            Daily: {item.stats?.total_production || 0}/
                            {item.stats?.floor_production_target || 0}
                          </span>
                          <span
                            className={`font-medium ${
                              (item.stats?.completion_percentage || 0) >= 100
                                ? 'text-green-600'
                                : (item.stats?.completion_percentage || 0) >= 70
                                  ? 'text-blue-600'
                                  : (item.stats?.completion_percentage || 0) >= 40
                                    ? 'text-yellow-600'
                                    : 'text-red-600'
                            }`}
                          >
                            {item.stats?.completion_percentage || 0}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full bg-green-500 transition-all duration-500"
                            style={{
                              width: `${Math.min(item.stats?.completion_percentage || 0, 100)}%`
                            }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-[9px] text-gray-500 mt-0.5">
                          <span>Production: {item.stats?.total_production || 0}</span>
                          <span>Remaining: {item.stats?.remaining_production || 0}</span>
                          <span>Total: {item.stats?.current_total || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Section Summary Row */}
              <div
                className="border-t-2 border-gray-800 bg-gray-50 font-medium"
                style={{ height: `${ROW_HEIGHT}px` }}
              >
                <div className="h-full flex flex-col justify-center p-3 border-gray-300">
                  <div className="font-medium text-gray-900 border-b border-gray-500">
                    Section Summary
                  </div>
                  <table className="font-normal text-xs">
                    <tbody>
                      <tr>
                        <td className="border-b border-gray-300">Production Target (20%+)</td>
                        <td className="text-right border-b border-gray-300 pr-1">
                          {sectionTotals.production_target}
                        </td>
                      </tr>
                      <tr>
                        <td className="border-b border-gray-300">Floor production Target</td>
                        <td className="text-right border-b border-gray-300 pr-1">
                          {sectionTotals.floor_target}
                        </td>
                      </tr>
                      <tr>
                        <td className="border-b border-gray-300">Total Production</td>
                        <td className="text-right border-b border-gray-300 pr-1">
                          {getGrandTotals().carton}
                        </td>
                      </tr>
                      <tr>
                        <td className="border-b border-gray-300">Remaining Quantity</td>
                        <td className="text-right border-b border-gray-300 pr-1">
                          {sectionTotals.remaining_production}
                        </td>
                      </tr>
                      <tr>
                        <td className="border-b border-gray-300">Total Value</td>
                        <td className="text-right border-b border-gray-300 pr-1">
                          ৳{sectionTotals.total_value}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                <p className="mt-3 text-gray-600">Loading production data...</p>
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <p className="text-lg">No products found in this section</p>
                <p className="text-sm mt-2">Add products to this section first</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto overflow-y-hidden" ref={scrollContainerRef}>
              {/* Fixed Header Row */}
              <div
                className="sticky top-0 z-20 bg-gray-50 border-b border-gray-300"
                style={{ height: `${HEADER_HEIGHT}px` }}
                ref={headerRef}
              >
                <div className="flex h-full">
                  {/* Days Header */}
                  {daysArray.map((day) => {
                    const isWeekendDay = isWeekend(day)
                    const isTodayDay = isToday(day)

                    return (
                      <div
                        key={day}
                        className={`w-36 shrink-0 border-r border-gray-300 ${
                          isWeekendDay ? 'bg-red-50' : isTodayDay ? 'bg-green-50' : 'bg-gray-50'
                        }`}
                        style={{ height: `${HEADER_HEIGHT}px` }}
                      >
                        <div className="h-full flex flex-col items-center justify-between">
                          <div className="flex flex-col items-center justify-between p-2">
                            <div
                              className={`font-medium ${isTodayDay ? 'text-green-700 font-bold' : 'text-gray-800'}`}
                            >
                              {day}
                              {isTodayDay && <span className="ml-1 text-xs">(Today)</span>}
                            </div>
                            <div
                              className={`text-xs mt-1 ${isWeekendDay ? 'text-red-600 font-medium' : 'text-gray-500'}`}
                            >
                              {getDayName(day)}
                              {isWeekendDay && <span className="ml-1">(Weekend)</span>}
                            </div>
                          </div>

                          <div className="flex w-full mt-2 text-xs border-b border-gray-300">
                            <div
                              className={`flex-1 text-center p-1 border-r border-gray-300 ${
                                isWeekendDay
                                  ? 'bg-red-100'
                                  : isTodayDay
                                    ? 'bg-green-100'
                                    : 'bg-gray-100'
                              }`}
                            >
                              Batch
                            </div>
                            <div
                              className={`flex-1 text-center p-1 ${
                                isWeekendDay
                                  ? 'bg-red-100'
                                  : isTodayDay
                                    ? 'bg-green-100'
                                    : 'bg-gray-100'
                              }`}
                            >
                              Carton
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Production Data Rows */}
              <div className="min-w-max">
                {products.map((item) => {
                  return (
                    <div
                      key={item.product.id}
                      className="flex border-b border-gray-200 hover:bg-gray-50 transition-colors"
                      style={{ height: `${ROW_HEIGHT}px` }}
                    >
                      {/* Daily Production Inputs */}
                      {item.productions.map((prod, index) => {
                        const day = index + 1
                        const isWeekendDay = isWeekend(day)
                        const isTodayDay = isToday(day)

                        return (
                          <div
                            key={prod.date}
                            className={`w-36 shrink-0 border-r border-gray-300 ${
                              isWeekendDay
                                ? 'bg-red-50 border-b border-red-200'
                                : isTodayDay
                                  ? 'bg-green-50 border-b border-green-200'
                                  : ''
                            }`}
                            style={{ height: `${ROW_HEIGHT}px` }}
                          >
                            <div className="h-full flex items-center">
                              <div className="flex w-full">
                                <div
                                  className={`flex-1 border-r border-gray-300 ${
                                    isWeekendDay ? 'bg-red-50' : isTodayDay ? 'bg-green-50' : ''
                                  }`}
                                >
                                  <input
                                    type="number"
                                    value={prod.batch || 0}
                                    onChange={(e) =>
                                      handleProductionChange(
                                        item.product.id,
                                        prod.date,
                                        'batch',
                                        e.target.value
                                      )
                                    }
                                    className={`w-full h-full text-center border-none focus:outline-none focus:ring-1 focus:ring-blue-500 bg-transparent px-2 ${
                                      isWeekendDay
                                        ? 'placeholder-red-300'
                                        : isTodayDay
                                          ? 'placeholder-green-300'
                                          : ''
                                    }`}
                                    min="0"
                                    placeholder="0"
                                  />
                                </div>
                                <div
                                  className={`flex-1 ${
                                    isWeekendDay ? 'bg-red-50' : isTodayDay ? 'bg-green-50' : ''
                                  }`}
                                >
                                  <input
                                    type="number"
                                    value={prod.carton || 0}
                                    onChange={(e) =>
                                      handleProductionChange(
                                        item.product.id,
                                        prod.date,
                                        'carton',
                                        e.target.value
                                      )
                                    }
                                    className={`w-full h-full text-center border-none focus:outline-none focus:ring-1 focus:ring-blue-500 bg-transparent px-4 ${
                                      isWeekendDay
                                        ? 'placeholder-red-300'
                                        : isTodayDay
                                          ? 'placeholder-green-300'
                                          : ''
                                    }`}
                                    min="0"
                                    placeholder="0"
                                    style={{ width: 'calc(100% + 8px)' }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}

                {/* Totals Row */}
                <div
                  className="flex border-t-2 border-gray-800 bg-gray-100"
                  style={{ height: `${ROW_HEIGHT}px` }}
                >
                  {/* Daily Totals */}
                  {daysArray.map((day, dayIndex) => {
                    const batchTotal = getColumnTotal(dayIndex, 'batch')
                    const cartonTotal = getColumnTotal(dayIndex, 'carton')
                    const isWeekendDay = isWeekend(day)
                    const isTodayDay = isToday(day)

                    return (
                      <div
                        key={day}
                        className={`w-36 shrink-0 border-r border-gray-300 ${
                          isWeekendDay ? 'bg-red-100' : isTodayDay ? 'bg-green-100' : 'bg-gray-200'
                        }`}
                        style={{ height: `${ROW_HEIGHT}px` }}
                      >
                        <div className="h-full flex items-center">
                          <div className="flex w-full">
                            <div
                              className={`flex-1 border-r border-gray-300 ${
                                isWeekendDay
                                  ? 'bg-red-100'
                                  : isTodayDay
                                    ? 'bg-green-100'
                                    : 'bg-gray-200'
                              }`}
                            >
                              <div
                                className={`h-full flex items-center justify-center font-bold ${
                                  isTodayDay ? 'text-green-700' : ''
                                }`}
                              >
                                {batchTotal}
                              </div>
                            </div>
                            <div
                              className={`flex-1 ${
                                isWeekendDay
                                  ? 'bg-red-100'
                                  : isTodayDay
                                    ? 'bg-green-100'
                                    : 'bg-gray-200'
                              }`}
                            >
                              <div
                                className={`h-full flex items-center justify-center font-bold ${
                                  isTodayDay ? 'text-green-700' : ''
                                }`}
                              >
                                {cartonTotal}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CSS for custom styling */}
      <style jsx>{`
        /* কার্টন কলামের ইনপুট ফিল্ড বড় করার জন্য */
        input[type='number'] {
          font-size: 14px;
        }

        /* Weekend days styling */
        .weekend-cell {
          background-color: #fef2f2;
        }

        .weekend-cell input {
          background-color: #fef2f2;
        }

        /* Today cell styling */
        .today-cell {
          background-color: #f0fdf4;
        }

        .today-cell input {
          background-color: #f0fdf4;
        }

        /* Wider carton column */
        .carton-column {
          width: 60% !important;
        }

        .batch-column {
          width: 40% !important;
        }
      `}</style>
    </div>
  )
}
