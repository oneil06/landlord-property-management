'use client'

import { useState, useEffect, useCallback, DragEvent, ChangeEvent, useRef, KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth'
import {
    FileText,
    Upload,
    X,
    Trash2,
    Download,
    File,
    Image,
    FileSpreadsheet,
    FileCheck,
    Search,
    Filter,
    Folder,
    Loader2,
    Check,
    AlertCircle
} from 'lucide-react'

interface Document {
    id: string
    name: string
    originalName: string
    mimeType: string
    size: number
    path: string
    category: string
    description: string | null
    propertyId: string | null
    tenantId: string | null
    createdAt: string
    updatedAt: string
}

const CATEGORY_LABELS: Record<string, string> = {
    general: 'General',
    lease: 'Lease',
    receipt: 'Receipt',
    maintenance: 'Maintenance',
    legal: 'Legal',
    other: 'Other'
}

const CATEGORY_COLORS: Record<string, string> = {
    general: 'bg-gray-100 text-gray-700',
    lease: 'bg-blue-100 text-blue-700',
    receipt: 'bg-green-100 text-green-700',
    maintenance: 'bg-orange-100 text-orange-700',
    legal: 'bg-purple-100 text-purple-700',
    other: 'bg-gray-100 text-gray-700'
}

const ALLOWED_CATEGORIES = Object.keys(CATEGORY_LABELS)

function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function getFileIcon(mimeType: string) {
    if (mimeType.startsWith('image/')) return Image
    if (mimeType.includes('pdf')) return FileCheck
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) return FileSpreadsheet
    return File
}

// Inline Name Editor Component
function DocumentNameInlineEditor({
    document,
    token,
    onUpdate,
    onError
}: {
    document: Document
    token: string | null
    onUpdate: (updatedDoc: Document) => void
    onError: (message: string) => void
}) {
    const [isEditing, setIsEditing] = useState(false)
    const [draftName, setDraftName] = useState(document.name)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const previousName = useRef(document.name)

    // Update draft when document changes
    useEffect(() => {
        if (!isEditing) {
            setDraftName(document.name)
            previousName.current = document.name
        }
    }, [document.name, isEditing])

    // Focus and select all text when entering edit mode
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus()
            inputRef.current.select()
        }
    }, [isEditing])

    const saveName = async () => {
        const trimmedName = draftName.trim()

        // Don't save if name hasn't changed
        if (trimmedName === previousName.current) {
            setIsEditing(false)
            return
        }

        // Validate
        if (!trimmedName) {
            setError('Name cannot be empty')
            return
        }

        if (trimmedName.length > 120) {
            setError('Name must be 120 characters or less')
            return
        }

        if (!token) return

        setIsSaving(true)
        setError(null)

        try {
            const response = await fetch('/api/documents', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: document.id,
                    name: trimmedName
                })
            })

            if (response.ok) {
                const data = await response.json()
                previousName.current = trimmedName
                onUpdate(data.document)
                setIsEditing(false)
            } else {
                const errorData = await response.json()
                setError(errorData.error || 'Failed to save')
                onError(errorData.error || 'Failed to save document name')
                // Revert to previous
                setDraftName(previousName.current)
            }
        } catch (err) {
            console.error('Error saving name:', err)
            setError('Failed to save')
            onError('Failed to save document name')
            setDraftName(previousName.current)
        } finally {
            setIsSaving(false)
        }
    }

    const cancelEdit = () => {
        setDraftName(previousName.current)
        setError(null)
        setIsEditing(false)
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            saveName()
        } else if (e.key === 'Escape') {
            e.preventDefault()
            cancelEdit()
        }
    }

    if (isEditing) {
        return (
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    onBlur={() => {
                        if (!isSaving) {
                            saveName()
                        }
                    }}
                    onKeyDown={handleKeyDown}
                    disabled={isSaving}
                    maxLength={120}
                    className={`w-full px-2 py-1 text-sm font-medium border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-300 bg-red-50' : 'border-blue-300'
                        }`}
                />
                {isSaving && (
                    <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-blue-500" />
                )}
                {error && (
                    <div className="absolute left-0 top-full mt-1 text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {error}
                    </div>
                )}
            </div>
        )
    }

    return (
        <h3
            className="font-medium text-gray-900 truncate cursor-pointer hover:underline hover:text-blue-600 transition-colors"
            style={{ minHeight: '1.5rem' }}
            title="Click to edit name"
            onClick={() => setIsEditing(true)}
        >
            {document.name}
        </h3>
    )
}

// Inline Category Editor Component
function DocumentCategoryInlineEditor({
    document,
    token,
    onUpdate,
    onError
}: {
    document: Document
    token: string | null
    onUpdate: (updatedDoc: Document) => void
    onError: (message: string) => void
}) {
    const [isEditing, setIsEditing] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState(document.category)
    const [isSaving, setIsSaving] = useState(false)
    const selectRef = useRef<HTMLSelectElement>(null)
    const previousCategory = useRef(document.category)

    // Update selected when document changes
    useEffect(() => {
        if (!isEditing) {
            setSelectedCategory(document.category)
            previousCategory.current = document.category
        }
    }, [document.category, isEditing])

    // Focus when entering edit mode
    useEffect(() => {
        if (isEditing && selectRef.current) {
            selectRef.current.focus()
        }
    }, [isEditing])

    const saveCategory = async (newCategory: string) => {
        // Don't save if category hasn't changed
        if (newCategory === previousCategory.current) {
            setIsEditing(false)
            return
        }

        if (!token) return

        setIsSaving(true)

        try {
            const response = await fetch('/api/documents', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: document.id,
                    category: newCategory
                })
            })

            if (response.ok) {
                const data = await response.json()
                previousCategory.current = newCategory
                onUpdate(data.document)
                setIsEditing(false)
            } else {
                const errorData = await response.json()
                onError(errorData.error || 'Failed to save category')
                // Revert
                setSelectedCategory(previousCategory.current)
            }
        } catch (err) {
            console.error('Error saving category:', err)
            onError('Failed to save document category')
            setSelectedCategory(previousCategory.current)
        } finally {
            setIsSaving(false)
        }
    }

    const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const newCategory = e.target.value
        setSelectedCategory(newCategory)
        saveCategory(newCategory)
    }

    const handleBlur = () => {
        if (!isSaving) {
            // If no change was made, just close
            if (selectedCategory === previousCategory.current) {
                setIsEditing(false)
            }
        }
    }

    if (isEditing) {
        return (
            <div className="relative inline-block">
                <select
                    ref={selectRef}
                    value={selectedCategory}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={isSaving}
                    className="px-2 py-1 text-xs font-medium border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-6"
                    style={{ minWidth: '100px' }}
                >
                    {ALLOWED_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                            {CATEGORY_LABELS[cat]}
                        </option>
                    ))}
                </select>
                {isSaving && (
                    <Loader2 className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 animate-spin text-blue-500" />
                )}
            </div>
        )
    }

    return (
        <span
            className={`px-2 py-1 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${CATEGORY_COLORS[document.category] || CATEGORY_COLORS.general}`}
            title="Click to change category"
            onClick={(e) => {
                e.stopPropagation()
                setIsEditing(true)
            }}
        >
            {CATEGORY_LABELS[document.category] || 'General'}
        </span>
    )
}

// Toast notification component
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000)
        return () => clearTimeout(timer)
    }, [onClose])

    return (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 ${type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
            {type === 'error' ? (
                <AlertCircle className="w-5 h-5" />
            ) : (
                <Check className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">{message}</span>
            <button onClick={onClose} className="ml-2 hover:opacity-70">
                <X className="w-4 h-4" />
            </button>
        </div>
    )
}

export default function DocumentsPage() {
    const router = useRouter()
    const { token, user } = useAuthStore()
    const [documents, setDocuments] = useState<Document[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isUploading, setIsUploading] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [categoryFilter, setCategoryFilter] = useState<string>('all')
    const [isDragOver, setIsDragOver] = useState(false)
    const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

    // Redirect if not authenticated
    useEffect(() => {
        if (!token && !user) {
            router.push('/login')
        }
    }, [token, user, router])

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type })
    }

    const fetchDocuments = useCallback(async () => {
        if (!token) return

        try {
            const params = new URLSearchParams()
            if (categoryFilter !== 'all') {
                params.append('category', categoryFilter)
            }

            const response = await fetch(`/api/documents?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (response.ok) {
                const data = await response.json()
                setDocuments(data.documents || [])
            }
        } catch (error) {
            console.error('Error fetching documents:', error)
        } finally {
            setIsLoading(false)
        }
    }, [categoryFilter, token])

    useEffect(() => {
        fetchDocuments()
    }, [fetchDocuments])

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setIsDragOver(true)
    }

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setIsDragOver(false)
    }

    const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setIsDragOver(false)

        const files = e.dataTransfer.files
        if (files.length > 0) {
            await uploadFile(files[0])
        }
    }

    const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (files && files.length > 0) {
            await uploadFile(files[0])
        }
    }

    const uploadFile = async (file: File) => {
        if (!token) return

        try {
            setIsUploading(true)

            const formData = new FormData()
            formData.append('file', file)
            formData.append('name', file.name)

            // Auto-detect category from file name
            const name = file.name.toLowerCase()
            let category = 'general'
            if (name.includes('lease')) category = 'lease'
            else if (name.includes('receipt') || name.includes('invoice')) category = 'receipt'
            else if (name.includes('maintenance') || name.includes('repair')) category = 'maintenance'
            else if (name.includes('legal') || name.includes('contract')) category = 'legal'

            formData.append('category', category)

            const response = await fetch('/api/documents', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            })

            if (response.ok) {
                const data = await response.json()
                setDocuments(prev => [data.document, ...prev])
                showToast('Document uploaded successfully', 'success')
            } else {
                const error = await response.json()
                showToast(error.error || 'Failed to upload document', 'error')
            }
        } catch (error) {
            console.error('Error uploading file:', error)
            showToast('Failed to upload file', 'error')
        } finally {
            setIsUploading(false)
        }
    }

    const deleteDocument = async (documentId: string) => {
        if (!token) return

        try {
            const response = await fetch(`/api/documents?id=${documentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (response.ok) {
                setDocuments(prev => prev.filter(d => d.id !== documentId))
                setShowDeleteConfirm(null)
                setSelectedDocument(null)
                showToast('Document deleted', 'success')
            } else {
                const error = await response.json()
                showToast(error.error || 'Failed to delete document', 'error')
            }
        } catch (error) {
            console.error('Error deleting document:', error)
            showToast('Failed to delete document', 'error')
        }
    }

    const downloadDocument = async (doc: Document) => {
        if (!token) return

        try {
            const response = await fetch(`/api/documents/download?id=${doc.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                // Use the renamed name with preserved extension
                const originalExt = doc.originalName.includes('.')
                    ? '.' + doc.originalName.split('.').pop()
                    : ''
                const downloadName = doc.name.includes('.')
                    ? doc.name
                    : doc.name + originalExt
                a.download = downloadName
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)
            } else {
                showToast('Download feature requires a file serving endpoint', 'error')
            }
        } catch (error) {
            console.error('Error downloading document:', error)
            showToast('Failed to download document', 'error')
        }
    }

    const handleDocumentUpdate = (updatedDoc: Document) => {
        setDocuments(prev => prev.map(d => d.id === updatedDoc.id ? updatedDoc : d))
        if (selectedDocument?.id === updatedDoc.id) {
            setSelectedDocument(updatedDoc)
        }
    }

    const filteredDocuments = documents.filter(doc => {
        const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.originalName.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesSearch
    })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
                    <p className="text-gray-700 mt-1">Store and manage your documents and images</p>
                </div>
            </div>

            {/* Upload Area */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${isDragOver
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                    }`}
            >
                <input
                    type="file"
                    id="file-upload"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileSelect}
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                />

                {isUploading ? (
                    <div className="flex flex-col items-center">
                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                        <p className="mt-4 text-gray-700 font-medium">Uploading...</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <div className={`p-4 rounded-full ${isDragOver ? 'bg-blue-100' : 'bg-gray-100'}`}>
                            <Upload className={`w-8 h-8 ${isDragOver ? 'text-blue-500' : 'text-gray-500'}`} />
                        </div>
                        <p className="mt-4 text-lg font-medium text-gray-900">
                            {isDragOver ? 'Drop to upload' : 'Drag and drop files here'}
                        </p>
                        <p className="mt-2 text-gray-700">
                            or <span className="text-blue-600 font-medium">browse</span> to select files
                        </p>
                        <p className="mt-2 text-sm text-gray-500">
                            Supports: Images, PDFs, Word, Excel, CSV, Text files
                        </p>
                    </div>
                )}
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search documents..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-gray-400" />
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="all">All Categories</option>
                        {ALLOWED_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Documents Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
            ) : filteredDocuments.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <Folder className="w-16 h-16 text-gray-300 mx-auto" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">No documents yet</h3>
                    <p className="mt-2 text-gray-700">
                        {searchQuery || categoryFilter !== 'all'
                            ? 'No documents match your search criteria'
                            : 'Upload your first document by dragging and dropping above'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredDocuments.map((doc) => {
                        const FileIcon = getFileIcon(doc.mimeType)
                        return (
                            <div
                                key={doc.id}
                                className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className={`p-2 rounded-lg ${doc.mimeType.startsWith('image/') ? 'bg-purple-100' : 'bg-blue-100'}`}>
                                        <FileIcon className={`w-6 h-6 ${doc.mimeType.startsWith('image/') ? 'text-purple-600' : 'text-blue-600'}`} />
                                    </div>
                                    <DocumentCategoryInlineEditor
                                        document={doc}
                                        token={token}
                                        onUpdate={handleDocumentUpdate}
                                        onError={(msg) => showToast(msg, 'error')}
                                    />
                                </div>

                                <DocumentNameInlineEditor
                                    document={doc}
                                    token={token}
                                    onUpdate={handleDocumentUpdate}
                                    onError={(msg) => showToast(msg, 'error')}
                                />

                                <p className="text-sm text-gray-700 mt-1">{formatFileSize(doc.size)}</p>
                                <p className="text-xs text-gray-500 mt-2">
                                    {new Date(doc.createdAt).toLocaleDateString()}
                                </p>

                                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                                    <button
                                        onClick={() => downloadDocument(doc)}
                                        className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteConfirm(doc.id)}
                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setShowDeleteConfirm(null)}
                    />
                    <div className="relative bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
                        <h3 className="text-lg font-semibold text-gray-900">Delete Document?</h3>
                        <p className="text-gray-700 mt-2">
                            This will permanently delete this document. This action cannot be undone.
                        </p>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => deleteDocument(showDeleteConfirm)}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    )
}