import { useEffect, useState } from 'react'

function Sections() {
  const [sections, setSections] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [newSectionName, setNewSectionName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const loadSections = async () => {
    setLoading(true)
    try {
      const data = await window.api.getAllSections()
      setSections(data)
    } catch (error) {
      console.error('Error loading sections:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSections()
  }, [])

  const addSection = async () => {
    if (!newSectionName.trim()) {
      setMessage({ type: 'error', text: 'Please enter a section name' })
      return
    }

    setLoading(true)
    try {
      await window.api.addSection(newSectionName.trim())
      setNewSectionName('')
      loadSections()
      setMessage({ type: 'success', text: 'Section added successfully' })
      hideMassage()
    } catch (error) {
      console.error('Error adding section:', error)
      setMessage({ type: 'error', text: 'Failed to add section' })
      hideMassage()
    } finally {
      setLoading(false)
    }
  }
  const hideMassage = () => {
    setTimeout(() => {
      setMessage({ type: '', text: '' })
    }, 2000)
  }

  const startEdit = (section) => {
    setEditingId(section.id)
    setEditName(section.name)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
  }

  const updateSection = async () => {
    if (!editName.trim()) {
      setMessage({ type: 'error', text: 'Please enter a section name' })
      hideMassage()
      return
    }

    setLoading(true)
    try {
      await window.api.updateSection(editingId, editName.trim())
      setEditingId(null)
      setEditName('')
      loadSections()
      setMessage({ type: 'success', text: 'Section updated successfully' })
      hideMassage()
    } catch (error) {
      console.error('Error updating section:', error)
      setMessage({ type: 'error', text: 'Failed to update section' })
      hideMassage()
    } finally {
      setLoading(false)
    }
  }

  const deleteSection = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
      return
    }

    setLoading(true)
    try {
      await window.api.deleteSection(id)
      loadSections()
      setMessage({ type: 'success', text: 'Section deleted successfully' })
      hideMassage()
    } catch (error) {
      console.error('Error deleting section:', error)
      setMessage({ type: 'error', text: 'Failed to delete section' })
      hideMassage()
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter') {
      action()
    }
  }

  return (
    <div className="">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-300">
        <h2 className="text-2xl font-bold text-gray-800">Sections</h2>
        <div className="text-sm text-gray-600">Total: {sections.length} section(s)</div>
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

      {/* Add New Section Form */}
      <div className="mb-6 p-4 bg-gray-50 ">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">Add New Section</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={newSectionName}
            onChange={(e) => setNewSectionName(e.target.value)}
            onKeyPress={(e) => handleKeyPress(e, addSection)}
            placeholder="Enter section name"
            className="flex-1 px-4 py-2 border border-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black focus:border-transparent"
            disabled={loading}
          />
          <button
            onClick={addSection}
            disabled={loading || !newSectionName.trim()}
            className="px-4 py-2 bg-black text-white font-medium cursor-pointer hover:bg-black-700 focus:outline-none focus:ring-1 focus:ring-black-500 focus:ring-offset-2 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Adding...' : 'Add Section'}
          </button>
        </div>
      </div>

      {/* Sections List */}
      <div className="overflow-hidden border border-gray-200">
        {loading && sections.length === 0 ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading sections...</p>
          </div>
        ) : sections.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No sections found. Add your first section above.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Section Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sections.map((section) => (
                <tr key={section.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900 font-mono">#{section.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    {editingId === section.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyPress={(e) => handleKeyPress(e, updateSection)}
                        className="w-full px-3 py-1 border-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black focus:border-transparent"
                        autoFocus
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-900">{section.name}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      {editingId === section.id ? (
                        <>
                          <button
                            onClick={updateSection}
                            disabled={loading}
                            className="px-3 py-1 text-xs bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            disabled={loading}
                            className="px-3 py-1 text-xs bg-gray-300 text-gray-700 hover:bg-gray-400 disabled:opacity-50 transition-colors"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(section)}
                            disabled={loading}
                            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteSection(section.id, section.name)}
                            disabled={loading}
                            className="px-3 py-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 transition-colors"
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
      {sections.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <p>Tip: Click on section name to edit, or use the action buttons.</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Sections
