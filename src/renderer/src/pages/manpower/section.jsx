import { useEffect, useState, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getPeriod } from '../../utils/storage'
import { format } from 'date-fns'
import { debounce } from 'lodash'

export default function SectionManpower() {
  const [searchParams] = useSearchParams()
  const section = searchParams.get('section')

  const [sections, setSections] = useState([])
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
  const debouncedSaveSection = useCallback(
    debounce(async (date, s_id, mp_count) => {
      try {
        await window.api.setSectionManpower(date, s_id, mp_count)
        console.log(`Auto-saved section manpower: ${date}, Section: ${s_id}`)
      } catch (error) {
        console.error('Error auto-saving section manpower:', error)
        setMessage({ type: 'error', text: `Failed to save: ${error.message}` })
        hideMessage()
      }
    }, 1000),
    []
  )

  const debouncedSaveTotal = useCallback(
    debounce(async (date, mp_count) => {
      try {
        await window.api.setDailyTotalManpower(date, mp_count)
        console.log(`Auto-saved total manpower: ${date}`)
      } catch (error) {
        console.error('Error auto-saving total manpower:', error)
        setMessage({ type: 'error', text: `Failed to save: ${error.message}` })
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

  const loadData = async (month, year) => {
    setLoading(true)
    try {
      const data = await window.api.getSectionManpower(month, year)
      setSections(data)

      // Load total manpower
      const totalData = await loadTotalManpower(month, year)

      // Combine section data with total data
      if (totalData.length > 0) {
        // Add total row at the end
        setSections((prev) => [
          ...prev,
          {
            section: { id: 'total', name: 'TOTAL MANPOWER' },
            daily_mp: totalData,
            isTotal: true
          }
        ])
      }
    } catch (error) {
      console.error('Error loading data:', error)
      setMessage({ type: 'error', text: 'Failed to load data' })
      hideMessage()
    } finally {
      setLoading(false)
    }
  }

  const loadTotalManpower = async (month, year) => {
    try {
      const formattedMonth = month.toString().padStart(2, '0')
      const lastDay = new Date(year, month, 0).getDate()

      const allDates = []
      for (let day = 1; day <= lastDay; day++) {
        const formattedDay = day.toString().padStart(2, '0')
        allDates.push(`${year}-${formattedMonth}-${formattedDay}`)
      }

      const result = []
      for (const date of allDates) {
        try {
          const data = await window.api.getDailyTotalManpower(date)
          result.push({
            id: data?.id || null,
            date: date,
            mp_count: data?.mp_count || 0,
            exists: !!data?.id
          })
        } catch (error) {
          result.push({
            id: null,
            date: date,
            mp_count: 0,
            exists: false
          })
        }
      }

      return result
    } catch (error) {
      console.error('Error loading total manpower:', error)
      return []
    }
  }

  // Handle section manpower change
  const handleSectionChange = (sectionId, date, value) => {
    const numValue = parseInt(value) || 0

    setSections((prev) =>
      prev.map((item) => {
        if (item.section.id === sectionId) {
          return {
            ...item,
            daily_mp: item.daily_mp.map((day) => {
              if (day.date === date) {
                return {
                  ...day,
                  mp_count: numValue,
                  modified: true
                }
              }
              return day
            })
          }
        }
        return item
      })
    )

    const key = `section-${sectionId}-${date}`
    setEdits(
      (prev) => new Map(prev.set(key, { type: 'section', sectionId, date, mp_count: numValue }))
    )

    debouncedSaveSection(date, sectionId, numValue)

    setTimeout(() => {
      setEdits((prev) => {
        const newMap = new Map(prev)
        newMap.delete(key)
        return newMap
      })
    }, 1500)
  }

  // Handle total manpower change
  const handleTotalChange = (date, value) => {
    const numValue = parseInt(value) || 0

    setSections((prev) =>
      prev.map((item) => {
        if (item.isTotal) {
          return {
            ...item,
            daily_mp: item.daily_mp.map((day) => {
              if (day.date === date) {
                return {
                  ...day,
                  mp_count: numValue,
                  modified: true
                }
              }
              return day
            })
          }
        }
        return item
      })
    )

    const key = `total-${date}`
    setEdits((prev) => new Map(prev.set(key, { type: 'total', date, mp_count: numValue })))

    debouncedSaveTotal(date, numValue)

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

    for (const [, edit] of editsArray) {
      try {
        if (edit.type === 'section') {
          await window.api.setSectionManpower(edit.date, edit.sectionId, edit.mp_count)
        } else if (edit.type === 'total') {
          await window.api.setDailyTotalManpower(edit.date, edit.mp_count)
        }
        successCount++
      } catch (error) {
        console.error(`Error saving ${edit.date}:`, error)
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
    loadData(month, year)
    hideMessage()
  }

  // When month/year changes, load data
  useEffect(() => {
    loadData(month, year)
  }, [year, month])

  // Get day name
  const getDayName = (day) => {
    const date = new Date(year, month - 1, day)
    return format(date, 'EEE')
  }

  // Calculate column totals
  const getColumnTotal = (dayIndex) => {
    return sections
      .filter((item) => !item.isTotal)
      .reduce((total, item) => {
        const dayData = item.daily_mp[dayIndex]
        return total + (dayData?.mp_count || 0)
      }, 0)
  }

  // Calculate row totals (for each section)
  const getSectionTotal = (daily_mp) => {
    return daily_mp.reduce((total, day) => total + (day.mp_count || 0), 0)
  }

  // Calculate grand total
  const getGrandTotal = () => {
    return sections
      .filter((item) => !item.isTotal)
      .reduce((total, item) => total + getSectionTotal(item.daily_mp), 0)
  }

  const daysArray = Array.from({ length: lastDay }, (_, i) => i + 1)

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedSaveSection.cancel()
      debouncedSaveTotal.cancel()
    }
  }, [debouncedSaveSection, debouncedSaveTotal])

  // Constants for consistent heights
  const ROW_HEIGHT = 60
  const HEADER_HEIGHT = 80

  return (
    <div className="flex flex-col p-4">
      {/* Fixed Header */}
      <div className="shrink-0 mb-4">
        <div className="flex justify-between items-center pb-3 border-b border-gray-800">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Manpower Management</h2>
            <p className="text-sm text-gray-600 mt-1">
              {format(new Date(year, month - 1, 1), 'MMMM yyyy')}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              {sections.filter((s) => !s.isTotal).length} section(s) | {lastDay} days
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
        {/* Fixed Section Names Column */}
        <div className="w-64 flex flex-col border-r border-gray-300 bg-white">
          {/* Fixed Column Header */}
          <div
            className="shrink-0 border-b border-gray-300 bg-gray-50"
            style={{ height: `${HEADER_HEIGHT}px` }}
          >
            <div className="h-full flex items-center justify-center">
              <div className="font-medium text-gray-700 text-center p-2">
                Sections
                <div className="text-xs text-gray-500 font-normal mt-1">Daily Manpower</div>
              </div>
            </div>
          </div>

          {/* Section Names List - Scrollable vertically */}
          <div className="flex-1" ref={fixedColumnRef}>
            <div>
              {sections
                .filter((s) => !s.isTotal)
                .map((item) => {
                  const sectionTotal = getSectionTotal(item.daily_mp)
                  return (
                    <div
                      key={item.section.id}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                      style={{ height: `${ROW_HEIGHT}px` }}
                    >
                      <div className="h-full flex flex-col justify-center p-3">
                        <div className="font-medium text-gray-900 text-sm truncate">
                          {item.section.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Total: {sectionTotal} people
                        </div>
                      </div>
                    </div>
                  )
                })}

              {/* Total Row in Fixed Column */}
              {sections.find((s) => s.isTotal) && (
                <div
                  className="border-t-2 border-gray-800 bg-blue-50 font-medium"
                  style={{ height: `${ROW_HEIGHT}px` }}
                >
                  <div className="h-full flex flex-col justify-center p-3">
                    <div className="font-medium text-blue-900 text-sm">TOTAL MANPOWER</div>
                    <div className="text-xs text-blue-600 mt-1">Daily Total Manpower</div>
                  </div>
                </div>
              )}

              {/* Grand Total Row */}
              <div
                className="border-t-2 border-gray-800 bg-gray-100 font-medium"
                style={{ height: `${ROW_HEIGHT}px` }}
              >
                <div className="h-full flex items-center p-3">
                  <div>
                    <div className="font-medium text-gray-900">Section Total</div>
                    <div className="text-sm text-gray-600">Sum of all sections</div>
                  </div>
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
                <p className="mt-3 text-gray-600">Loading manpower data...</p>
              </div>
            </div>
          ) : sections.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <p className="text-lg">No sections found</p>
                <p className="text-sm mt-2">Add sections first</p>
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
                  {daysArray.map((day) => (
                    <div
                      key={day}
                      className="w-28 shrink-0 border-r border-gray-300"
                      style={{ height: `${HEADER_HEIGHT}px` }}
                    >
                      <div className="h-full flex flex-col items-center justify-center">
                        <div className="font-medium text-gray-800">{day}</div>
                        <div className="text-xs text-gray-500 mt-1">{getDayName(day)}</div>
                        <div className="text-xs font-medium mt-2 text-gray-700">Manpower</div>
                      </div>
                    </div>
                  ))}

                  {/* Total Column Header */}
                  <div
                    className="w-32 shrink-0 bg-gray-100 border-l border-gray-300"
                    style={{ height: `${HEADER_HEIGHT}px` }}
                  >
                    <div className="h-full flex flex-col items-center justify-center">
                      <div className="font-medium text-gray-800">Total</div>
                      <div className="text-xs text-gray-500 mt-1">Month</div>
                      <div className="text-xs font-medium mt-2 text-gray-700">People</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Manpower Data Rows */}
              <div className="min-w-max">
                {/* Section Rows */}
                {sections
                  .filter((s) => !s.isTotal)
                  .map((item) => {
                    const sectionTotal = getSectionTotal(item.daily_mp)

                    return (
                      <div
                        key={item.section.id}
                        className="flex border-b border-gray-200 hover:bg-gray-50 transition-colors"
                        style={{ height: `${ROW_HEIGHT}px` }}
                      >
                        {/* Daily Manpower Inputs */}
                        {item.daily_mp.map((day) => (
                          <div
                            key={day.date}
                            className="w-28 shrink-0 border-r border-gray-300"
                            style={{ height: `${ROW_HEIGHT}px` }}
                          >
                            <div className="h-full flex items-center justify-center">
                              <input
                                type="number"
                                value={day.mp_count || 0}
                                onChange={(e) =>
                                  handleSectionChange(item.section.id, day.date, e.target.value)
                                }
                                className="w-20 h-10 text-center border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-back focus:border-black"
                                min="0"
                                placeholder="0"
                              />
                            </div>
                          </div>
                        ))}

                        {/* Section Total Column */}
                        <div
                          className="w-32 shrink-0 bg-gray-50 border-l border-gray-300"
                          style={{ height: `${ROW_HEIGHT}px` }}
                        >
                          <div className="h-full flex items-center justify-center">
                            <div className="font-medium text-gray-900 text-lg">{sectionTotal}</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                {/* Total Manpower Row */}
                {sections.find((s) => s.isTotal) && (
                  <div
                    className="flex border-t-2 border-blue-300 bg-blue-50"
                    style={{ height: `${ROW_HEIGHT}px` }}
                  >
                    {sections
                      .find((s) => s.isTotal)
                      .daily_mp.map((day) => (
                        <div
                          key={day.date}
                          className="w-28 flex-shrink-0 border-r border-blue-200"
                          style={{ height: `${ROW_HEIGHT}px` }}
                        >
                          <div className="h-full flex items-center justify-center">
                            <input
                              type="number"
                              value={day.mp_count || 0}
                              onChange={(e) => handleTotalChange(day.date, e.target.value)}
                              className="w-20 h-10 text-center border border-blue-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              min="0"
                              placeholder="0"
                            />
                          </div>
                        </div>
                      ))}

                    {/* Total Manpower Column */}
                    <div
                      className="w-32 flex-shrink-0 bg-blue-100 border-l border-blue-300"
                      style={{ height: `${ROW_HEIGHT}px` }}
                    >
                      <div className="h-full flex items-center justify-center">
                        <div className="font-medium text-blue-900 text-lg">
                          {getSectionTotal(sections.find((s) => s.isTotal).daily_mp)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Column Totals Row */}
                <div
                  className="flex border-t-2 border-gray-800 bg-gray-100 font-medium"
                  style={{ height: `${ROW_HEIGHT}px` }}
                >
                  {/* Daily Column Totals */}
                  {daysArray.map((day, dayIndex) => {
                    const columnTotal = getColumnTotal(dayIndex)

                    return (
                      <div
                        key={day}
                        className="w-28 flex-shrink-0 border-r border-gray-300"
                        style={{ height: `${ROW_HEIGHT}px` }}
                      >
                        <div className="h-full flex items-center justify-center">
                          <div className="font-medium text-gray-900">{columnTotal}</div>
                        </div>
                      </div>
                    )
                  })}

                  {/* Grand Total Column */}
                  <div
                    className="w-32 flex-shrink-0 bg-gray-200 border-l border-gray-400"
                    style={{ height: `${ROW_HEIGHT}px` }}
                  >
                    <div className="h-full flex items-center justify-center">
                      <div className="font-medium text-gray-900 text-xl">{getGrandTotal()}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex-shrink-0 pt-3 mt-3 border-t border-gray-300 text-sm text-gray-600">
        <div className="flex justify-between">
          <div>Period: {format(new Date(year, month - 1, 1), 'MMMM yyyy')}</div>
          <div className="flex items-center gap-4">
            <div className="text-xs text-gray-500">
              <span className="inline-block w-3 h-3 bg-blue-100 border border-blue-300 rounded mr-1"></span>
              Section Manpower
            </div>
            <div className="text-xs text-gray-500">
              <span className="inline-block w-3 h-3 bg-blue-50 border border-blue-200 rounded mr-1"></span>
              Total Manpower
            </div>
            <div className="text-xs text-gray-500">
              <span className="inline-block w-3 h-3 bg-green-100 border border-green-300 rounded mr-1"></span>
              Auto-save enabled
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
