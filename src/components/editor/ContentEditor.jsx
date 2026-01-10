// /src/components/editor/ContentEditor.jsx
// Classic WYSIWYG rich text editor for editing generated content
// Uses TinyMCE - NO semantic/block editor, NO heading styles
// RELEVANT FILES: src/pages/FunnelDetails.jsx, src/hooks/useExistingProducts.jsx

import { useRef, useState } from 'react'
import { Editor } from '@tinymce/tinymce-react'
import { X, Save, Loader2 } from 'lucide-react'
import { Button } from '../ui/Button'

export default function ContentEditor({
  isOpen,
  onClose,
  content,
  onSave,
  title = 'Edit Content',
  saving = false
}) {
  const editorRef = useRef(null)
  const [editorContent, setEditorContent] = useState(content || '')

  if (!isOpen) return null

  const handleSave = () => {
    if (editorRef.current) {
      const html = editorRef.current.getContent()
      onSave(html)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-auto p-4">
          <Editor
            apiKey="no-api-key"
            onInit={(evt, editor) => editorRef.current = editor}
            initialValue={content}
            onEditorChange={(newContent) => setEditorContent(newContent)}
            init={{
              height: 500,
              menubar: false,
              plugins: [
                'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
                'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                'insertdatetime', 'media', 'table', 'preview', 'help', 'wordcount'
              ],
              // Toolbar per vision spec - NO heading styles (H1, H2, H3)
              toolbar: 'undo redo | fontfamily fontsize | ' +
                'bold italic underline | link image | ' +
                'alignleft aligncenter alignright | ' +
                'removeformat | help',
              // Specific font sizes per task document
              fontsize_formats: '8pt 10pt 12pt 14pt 16pt 18pt 20pt 24pt 28pt 32pt 36pt 48pt',
              // Font families
              font_family_formats: 'Arial=arial,helvetica,sans-serif; ' +
                'Georgia=georgia,palatino,serif; ' +
                'Helvetica=helvetica,arial,sans-serif; ' +
                'Times New Roman=times new roman,times,serif; ' +
                'Verdana=verdana,geneva,sans-serif; ' +
                'Inter=inter,sans-serif; ' +
                'Roboto=roboto,sans-serif',
              // Disable heading formats - NO H1, H2, H3 per vision spec
              block_formats: 'Paragraph=p',
              // Image upload handler
              images_upload_handler: async (blobInfo) => {
                // For now, return blob URL. Can integrate with Supabase storage later
                return URL.createObjectURL(blobInfo.blob())
              },
              // Content styling
              content_style: `
                body {
                  font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
                  font-size: 14pt;
                  line-height: 1.6;
                  padding: 16px;
                }
                img { max-width: 100%; height: auto; }
              `,
              // Disable status bar showing element path (no semantic hints)
              elementpath: false,
              // Disable resize
              resize: false,
              // Remove branding
              branding: false,
              // Paste as plain text by default to avoid format issues
              paste_as_text: false,
              // Allow all elements for maximum formatting flexibility
              valid_elements: '*[*]',
              extended_valid_elements: '*[*]'
            }}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
