import { useState } from 'react'
import * as XLSX from 'xlsx'

export default function ExcelSheetReader() {
  const [loading, setLoading] = useState(false)
  const [readValue, setReadValue] = useState(null)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setLoading(true)
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result)
        const workbook = XLSX.read(data, { type: 'array' })

        const process_data = {}

        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

          const valid_data = []

          for (const row of jsonData.slice(1, 500)) {
            if (!row[0]) continue

            valid_data.push({
              code: row[0],
              name: row[1] ?? '',
              unit: row[2] ?? '',
              price: row[3] ?? 0
            })
          }

          process_data[sheetName.toLowerCase()] = valid_data.sort((a, b) => {
            const numA = parseInt(a.code.replace(/\D/g, ''), 10)
            const numB = parseInt(b.code.replace(/\D/g, ''), 10)
            return numA - numB
          })
        })

        setReadValue(process_data)
      } catch (err) {
        console.error('Excel read error:', err)
      } finally {
        setLoading(false)
      }
    }

    reader.readAsArrayBuffer(file)
  }

  // ✅ JSON Download Function
  const handleDownloadJSON = () => {
    if (!readValue) return

    const jsonString = JSON.stringify(readValue, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = 'excel-data.json'
    a.click()

    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Excel Import → JSON Download</h2>

      <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} />

      {loading && <p>Reading Excel file...</p>}

      {readValue && (
        <div style={{ marginTop: 10 }}>
          <button onClick={handleDownloadJSON}>Download JSON</button>
        </div>
      )}
    </div>
  )
}
