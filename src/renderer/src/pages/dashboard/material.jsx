import { useEffect, useState } from 'react'

function Materials() {
  const [materials, setMaterials] = useState([])
  const [editingMaterial, setEditingMaterial] = useState(null)
  const [newMaterial, setNewMaterial] = useState({
    name: '',
    price: '',
    code: '',
    unit: 'kg',
    type: 'RM'
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [searchTerm, setSearchTerm] = useState('')

  // Unit options
  const unitOptions = ['KG', 'PCS', 'RIM']

  // Type options
  const typeOptions = ['RM', 'PM']

  // Load all materials
  const loadMaterials = async () => {
    setLoading(true)
    try {
      const data = await window.api.getAllMaterials()
      setMaterials(data)
    } catch (error) {
      console.error('Error loading materials:', error)
      setMessage({ type: 'error', text: 'Failed to load materials' })
      hideMessage()
    } finally {
      setLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    loadMaterials()
  }, [])

  const hideMessage = () => {
    setTimeout(() => {
      setMessage({ type: '', text: '' })
    }, 3000)
  }

  // Add new material
  const addMaterial = async () => {
    // Validation
    if (!newMaterial.name.trim()) {
      setMessage({ type: 'error', text: 'Please enter material name' })
      hideMessage()
      return
    }

    if (!newMaterial.code.trim()) {
      setMessage({ type: 'error', text: 'Please enter material code' })
      hideMessage()
      return
    }

    if (isNaN(newMaterial.price) || newMaterial.price < 0) {
      setMessage({ type: 'error', text: 'Please enter a valid price' })
      hideMessage()
      return
    }

    setLoading(true)
    try {
      await window.api.addMaterial(
        newMaterial.name.trim(),
        parseFloat(newMaterial.price) || 0,
        newMaterial.code.trim(),
        newMaterial.unit,
        newMaterial.type
      )

      // Reset form
      setNewMaterial({
        name: '',
        price: '',
        code: '',
        unit: 'kg',
        type: 'RM'
      })

      // Reload materials
      await loadMaterials()
      setMessage({ type: 'success', text: 'Material added successfully' })
      hideMessage()
    } catch (error) {
      console.error('Error adding material:', error)
      setMessage({
        type: 'error',
        text: error.message.includes('UNIQUE')
          ? 'Material code already exists'
          : 'Failed to add material'
      })
      hideMessage()
    } finally {
      setLoading(false)
    }
  }

  // Start editing material
  const startEdit = (material) => {
    setEditingMaterial({
      id: material.id,
      name: material.name,
      price: material.price,
      code: material.code,
      unit: material.unit.toLowerCase(),
      type: material.type
    })
  }

  // Cancel editing
  const cancelEdit = () => {
    setEditingMaterial(null)
  }

  // Update material
  const updateMaterial = async () => {
    if (!editingMaterial) return

    // Validation
    if (!editingMaterial.name.trim()) {
      setMessage({ type: 'error', text: 'Please enter material name' })
      hideMessage()
      return
    }

    if (!editingMaterial.code.trim()) {
      setMessage({ type: 'error', text: 'Please enter material code' })
      hideMessage()
      return
    }

    if (isNaN(editingMaterial.price) || editingMaterial.price < 0) {
      setMessage({ type: 'error', text: 'Please enter a valid price' })
      hideMessage()
      return
    }

    setLoading(true)
    try {
      await window.api.updateMaterial(
        editingMaterial.id,
        editingMaterial.name.trim(),
        parseFloat(editingMaterial.price) || 0,
        editingMaterial.code.trim(),
        editingMaterial.unit,
        editingMaterial.type
      )

      // Reset and reload
      setEditingMaterial(null)
      await loadMaterials()
      setMessage({ type: 'success', text: 'Material updated successfully' })
      hideMessage()
    } catch (error) {
      console.error('Error updating material:', error)
      setMessage({
        type: 'error',
        text: error.message.includes('UNIQUE')
          ? 'Material code already exists'
          : 'Failed to update material'
      })
      hideMessage()
    } finally {
      setLoading(false)
    }
  }

  // Delete material
  const deleteMaterial = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
      return
    }

    setLoading(true)
    try {
      await window.api.deleteMaterial(id)
      await loadMaterials()
      setMessage({ type: 'success', text: 'Material deleted successfully' })
      hideMessage()
    } catch (error) {
      console.error('Error deleting material:', error)
      setMessage({ type: 'error', text: 'Failed to delete material' })
      hideMessage()
    } finally {
      setLoading(false)
    }
  }

  // Handle key press
  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter') {
      action()
    }
  }

  // Filter materials based on search term
  const filteredMaterials = materials.filter((material) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      material.name.toLowerCase().includes(searchLower) ||
      material.code.toLowerCase().includes(searchLower) ||
      material.type.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="bg-white p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 pb-3 border-b border-black">
        <h2 className="text-2xl font-bold text-gray-800">Materials Management</h2>
        <div className="text-sm text-gray-600">Total: {materials.length} material(s)</div>
      </div>

      {/* Message Display */}
      {message.text && (
        <div
          className={`mb-4 p-3 ${
            message.type === 'success'
              ? 'bg-green-100 text-green-700 border border-green-300'
              : 'bg-red-100 text-red-700 border border-red-300'
          }`}
        >
          {message.text}
          <button
            onClick={() => setMessage({ type: '', text: '' })}
            className="float-right text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search materials by name, code, or type..."
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            disabled={loading}
          />
          <div className="absolute left-3 top-2.5 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Add New Material Form */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">Add New Material</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Material Name *</label>
            <input
              type="text"
              value={newMaterial.name}
              onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
              onKeyPress={(e) => handleKeyPress(e, addMaterial)}
              placeholder="Enter material name"
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
            <input
              type="text"
              value={newMaterial.code}
              onChange={(e) => setNewMaterial({ ...newMaterial, code: e.target.value })}
              onKeyPress={(e) => handleKeyPress(e, addMaterial)}
              placeholder="Enter unique code"
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
            <input
              type="number"
              value={newMaterial.price}
              onChange={(e) => setNewMaterial({ ...newMaterial, price: e.target.value })}
              onKeyPress={(e) => handleKeyPress(e, addMaterial)}
              placeholder="Enter price"
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
              disabled={loading}
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
            <select
              value={newMaterial.unit}
              onChange={(e) => setNewMaterial({ ...newMaterial, unit: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
              disabled={loading}
            >
              {unitOptions.map((unit) => (
                <option key={unit} value={unit.toLowerCase()}>
                  {unit}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={newMaterial.type}
              onChange={(e) => setNewMaterial({ ...newMaterial, type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
              disabled={loading}
            >
              {typeOptions.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={addMaterial}
              disabled={loading || !newMaterial.name.trim() || !newMaterial.code.trim()}
              className="px-6 py-2 bg-black text-white font-medium rounded hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Material'}
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">* Required fields. Code must be unique.</p>
      </div>

      {/* Materials List */}
      <div className="overflow-hidden border border-gray-200 rounded-lg">
        {loading && materials.length === 0 ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            <p className="mt-2 text-gray-600">Loading materials...</p>
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchTerm
              ? 'No materials found matching your search.'
              : 'No materials found. Add your first material above.'}
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th> */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMaterials.map((material) => (
                <tr key={material.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900 font-mono">#{material.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    {editingMaterial?.id === material.id ? (
                      <input
                        type="text"
                        value={editingMaterial.name}
                        onChange={(e) =>
                          setEditingMaterial({ ...editingMaterial, name: e.target.value })
                        }
                        className="w-full px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                        autoFocus
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-900">{material.name}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingMaterial?.id === material.id ? (
                      <input
                        type="text"
                        value={editingMaterial.code}
                        onChange={(e) =>
                          setEditingMaterial({ ...editingMaterial, code: e.target.value })
                        }
                        className="w-full px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                      />
                    ) : (
                      <span className="text-sm font-mono text-gray-700">{material.code}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingMaterial?.id === material.id ? (
                      <input
                        type="number"
                        value={editingMaterial.price}
                        onChange={(e) =>
                          setEditingMaterial({ ...editingMaterial, price: e.target.value })
                        }
                        className="w-full px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                        min="0"
                        step="0.01"
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-900">
                        ৳{parseFloat(material.price).toFixed(2)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingMaterial?.id === material.id ? (
                      <select
                        value={editingMaterial.unit}
                        onChange={(e) =>
                          setEditingMaterial({ ...editingMaterial, unit: e.target.value })
                        }
                        className="w-full px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                      >
                        {unitOptions.map((unit) => (
                          <option key={unit} value={unit.toLowerCase()}>
                            {unit}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-sm text-gray-600 uppercase">{material.unit}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingMaterial?.id === material.id ? (
                      <select
                        value={editingMaterial.type}
                        onChange={(e) =>
                          setEditingMaterial({ ...editingMaterial, type: e.target.value })
                        }
                        className="w-full px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                      >
                        {typeOptions.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          material.type === 'RM'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {material.type}
                      </span>
                    )}
                  </td>
                  {/* <td className="px-6 py-4">
                    <span className="text-xs text-gray-500">
                      {new Date(material.created_at).toLocaleDateString()}
                    </span>
                  </td> */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      {editingMaterial?.id === material.id ? (
                        <>
                          <button
                            onClick={updateMaterial}
                            disabled={loading}
                            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            disabled={loading}
                            className="px-3 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50 transition-colors"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(material)}
                            disabled={loading}
                            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteMaterial(material.id, material.name)}
                            disabled={loading}
                            className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50 transition-colors"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Statistics */}
      {materials.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-6 text-sm text-gray-600">
            <div>
              <span className="font-medium">Total Materials:</span> {materials.length}
            </div>
            <div>
              <span className="font-medium">RM (Raw Material):</span>{' '}
              {materials.filter((m) => m.type === 'RM').length}
            </div>
            <div>
              <span className="font-medium">PM (Packed Material):</span>{' '}
              {materials.filter((m) => m.type === 'PM').length}
            </div>
            {searchTerm && (
              <div>
                <span className="font-medium">Showing:</span> {filteredMaterials.length} of{' '}
                {materials.length}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Materials
