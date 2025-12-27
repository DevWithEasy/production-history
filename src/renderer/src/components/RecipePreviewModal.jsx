/* eslint-disable react/prop-types */
import { useState } from 'react'

function RecipePreviewModal({
  visible,
  onClose,
  product,
  productArea,
  materials,
  onImport,
  importing,
  isImported
}) {
  // console.log(product)
  const [materialType, setMaterialType] = useState('RM')

  if (!visible) return null

  // Material name এবং unit পাওয়ার জন্য ফাংশন
  const getMaterialInfo = (materialId) => {
    const allMaterials = [...materials.RM, ...materials.PM]
    // প্রথমে code দিয়ে খুঁজুন, না পেলে id দিয়ে খুঁজুন
    const materialByCode = allMaterials.find((m) => m.code == materialId)
    const materialById = allMaterials.find((m) => m.id == materialId)
    const material = materialByCode || materialById

    return {
      name: material ? material.name : 'Unknown Material',
      unit: material ? material.unit : 'N/A',
      code: material ? material.code : materialId
    }
  }

  // একই ম্যাটেরিয়ালের জন্য batch এবং carton ডাটা মিলানো
  const getCombinedMaterials = () => {
    const batchMaterials = materialType === 'RM' ? product.rm || [] : product.pm || []
    const cartonMaterials =
      materialType === 'RM' ? product.carton_rm || [] : product.carton_pm || []

    const combined = []

    // প্রথমে batch materials যোগ করুন
    batchMaterials.forEach((batchItem) => {
      const cartonItem = cartonMaterials.find((item) => item.id === batchItem.id)
      const materialInfo = getMaterialInfo(batchItem.id)

      combined.push({
        id: batchItem.id,
        code: materialInfo.code,
        name: materialInfo.name,
        unit: materialInfo.unit,
        batchQty: batchItem.qty || 0,
        cartonQty: cartonItem ? cartonItem.qty : 0
      })
    })

    // যে carton materials batch-এ নেই শুধু সেগুলো যোগ করুন
    cartonMaterials.forEach((cartonItem) => {
      if (!combined.find((item) => item.id === cartonItem.id)) {
        const materialInfo = getMaterialInfo(cartonItem.id)

        combined.push({
          id: cartonItem.id,
          code: materialInfo.code,
          name: materialInfo.name,
          unit: materialInfo.unit,
          batchQty: 0,
          cartonQty: cartonItem.qty || 0
        })
      }
    })

    return combined.sort((a, b) => a.name.localeCompare(b.name))
  }

  const combinedMaterials = getCombinedMaterials()

  // টোটাল ক্যালকুলেশন
  const totalBatchQty = combinedMaterials.reduce(
    (sum, item) => sum + (parseFloat(item.batchQty) || 0),
    0
  )
  const totalCartonQty = combinedMaterials.reduce(
    (sum, item) => sum + (parseFloat(item.cartonQty) || 0),
    0
  )

  return (
    <div className="fixed inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">{product.name}</h2>
            <p className="text-sm text-gray-600">
              ID: {product.id} | Source: {productArea === 'excel' ? 'Excel File' : 'Database'} |
              Type: {materialType === 'RM' ? 'Raw Materials' : 'Packaging Materials'}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {/* Material Type Selector */}
            <div className="flex space-x-2">
              <button
                onClick={() => setMaterialType('RM')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                  materialType === 'RM'
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                }`}
              >
                RM
              </button>
              <button
                onClick={() => setMaterialType('PM')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                  materialType === 'PM'
                    ? 'bg-purple-100 text-purple-700 border border-purple-300'
                    : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                }`}
              >
                PM
              </button>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-blue-700">Total Materials</p>
              <p className="text-2xl font-bold text-blue-800">{combinedMaterials.length}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <p className="text-sm text-green-700">Total Batch Quantity</p>
              <p className="text-2xl font-bold text-green-800">{totalBatchQty.toFixed(4)}</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <p className="text-sm text-orange-700">Total Carton Quantity</p>
              <p className="text-2xl font-bold text-orange-800">{totalCartonQty.toFixed(5)}</p>
            </div>
          </div>

          {/* Combined Materials Table */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-3">
              {materialType === 'RM' ? 'Raw Materials' : 'Packaging Materials'} (
              {combinedMaterials.length})
            </h3>
            {combinedMaterials.length > 0 ? (
              <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Material
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Code
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Batch Quantity
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Carton Quantity
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {combinedMaterials.map((material, index) => {
                      const total =
                        (parseFloat(material.batchQty) || 0) + (parseFloat(material.cartonQty) || 0)
                      return (
                        <tr key={index} className="hover:bg-gray-100">
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                            {index + 1}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div>
                              <div className="font-medium">{material.name}</div>
                              <div className="text-xs text-gray-500">ID: {material.id}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                            {material.code}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              {material.unit}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div className="font-medium">{material.batchQty || '0.0000'}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div className="font-medium text-green-600">
                              {material.cartonQty || '0.00000'}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div className="font-bold text-blue-700">{total.toFixed(5)}</div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  {/* Footer with totals */}
                  <tfoot className="bg-gray-100">
                    <tr>
                      <td
                        colSpan="4"
                        className="px-4 py-3 text-right text-sm font-medium text-gray-900"
                      >
                        Totals:
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900">
                        {totalBatchQty.toFixed(4)}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-green-700">
                        {totalCartonQty.toFixed(5)}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-blue-700">
                        {(totalBatchQty + totalCartonQty).toFixed(5)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-gray-400 mb-3">
                  <svg
                    className="w-16 h-16 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <p className="text-gray-600 text-lg">
                  No {materialType === 'RM' ? 'Raw' : 'Packaging'} Materials Found
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  This product has no{' '}
                  {materialType === 'RM' ? 'raw materials' : 'packaging materials'} added
                </p>
              </div>
            )}
          </div>

          {/* Material Type Info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start space-x-3">
              <div
                className={`p-2 rounded ${materialType === 'RM' ? 'bg-blue-100' : 'bg-purple-100'}`}
              >
                <span
                  className={`text-sm font-medium ${materialType === 'RM' ? 'text-blue-700' : 'text-purple-700'}`}
                >
                  {materialType}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">
                    {materialType === 'RM' ? 'Raw Materials (RM)' : 'Packaging Materials (PM)'}
                  </span>
                  {materialType === 'RM'
                    ? ' - Ingredients and raw components used in production'
                    : ' - Packaging and finishing materials for the final product'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Showing {combinedMaterials.length} materials with batch and carton quantities
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Close
            </button>
            <div className="text-sm text-gray-600">
              {combinedMaterials.length} materials • {totalBatchQty.toFixed(4)} batch •{' '}
              {totalCartonQty.toFixed(5)} carton
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {isImported && (
              <div className="flex items-center text-green-600">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="font-medium">Recipe Imported</span>
              </div>
            )}

            {productArea === 'excel' && !isImported && (
              <button
                onClick={onImport}
                disabled={importing}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 flex items-center"
              >
                {importing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Importing...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                    Import Recipe
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RecipePreviewModal
