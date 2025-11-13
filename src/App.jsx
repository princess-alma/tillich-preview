import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import FileUploader from '@/components/FileUploader'
import ClearButton from '@/components/ClearButton'
import Preview from '@/components/Preview'
import { parseXmlText } from '@/utils/xmlParser'
import { renderParsedXml } from '@/utils/xmlRenderer.jsx'

function App() {
  const [filename, setFilename] = useState(null)
  const [xmlText, setXmlText] = useState(null)
  const [parsed, setParsed] = useState(null)
  const [renderTree, setRenderTree] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [inputKey, setInputKey] = useState(Date.now())

  async function handleFileText(text, name, readError) {
    setFilename(name)
    setError(null)
    setRenderTree(null)
    
    if (readError) {
      setError('Failed to read file: ' + readError.message)
      return
    }
    
    setLoading(true)
    setXmlText(text)
    
    // Small delay to show loading state
    setTimeout(() => {
      const { data, error } = parseXmlText(text)
      
      if (error) {
        setError(error)
        setParsed(null)
        setRenderTree(null)
      } else {
        setParsed(data)
        setRenderTree(renderParsedXml(data))
        setError(null)
      }
      
      setLoading(false)
    }, 100)
  }

  function handleClear() {
    setFilename(null)
    setXmlText(null)
    setParsed(null)
    setRenderTree(null)
    setError(null)
    setLoading(false)
    setInputKey(Date.now()) // Forces file input to reset
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <div className="text-center py-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">XML Preview</h1>
          <p className="text-gray-600 text-xl">
            Upload and preview XML files with beautiful formatting
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-900">Upload XML File</h2>
          </div>
          <div className="p-8">
            <div className="flex gap-4 items-center">
              <FileUploader onFileText={handleFileText} inputKey={inputKey} />
              <ClearButton onClear={handleClear} disabled={!filename} />
            </div>
            {filename && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900 flex items-center">
                  <span className="text-2xl mr-2">📄</span>
                  Current file: <span className="text-blue-700 ml-1">{filename}</span>
                </p>
              </div>
            )}
          </div>
        </div>

        <Preview loading={loading} error={error} filename={filename}>
          {renderTree}
        </Preview>
      </div>
    </div>
  )
}

export default App
