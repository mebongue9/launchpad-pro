// /src/components/funnel/EmailSequencePreview.jsx
// Displays and manages email sequences for a funnel
// Shows Maria Wendt style emails with subject, preview, and body
// RELEVANT FILES: src/hooks/useEmailSequences.js, src/pages/FunnelBuilder.jsx

import { useState, useEffect } from 'react'
import { useEmailSequences } from '../../hooks/useEmailSequences'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import {
  Mail,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
  Copy,
  Check
} from 'lucide-react'

function EmailCard({ email, number, expanded, onToggle }) {
  const [copied, setCopied] = useState(null)

  const copyToClipboard = async (text, field) => {
    await navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="
          w-full flex items-center justify-between
          p-4 bg-gray-50 hover:bg-gray-100
          transition-colors text-left
        "
      >
        <div className="flex items-center gap-3">
          <div className="
            w-8 h-8 rounded-full
            bg-blue-100 text-blue-600
            flex items-center justify-center
            text-sm font-semibold
          ">
            {number}
          </div>
          <div>
            <p className="font-medium text-gray-900">{email.subject}</p>
            <p className="text-sm text-gray-500">{email.preview}</p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {expanded && (
        <div className="p-4 bg-white border-t border-gray-200">
          {/* Subject Line */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-500 uppercase">Subject Line</span>
              <button
                onClick={() => copyToClipboard(email.subject, 'subject')}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                {copied === 'subject' ? (
                  <><Check className="w-3 h-3" /> Copied</>
                ) : (
                  <><Copy className="w-3 h-3" /> Copy</>
                )}
              </button>
            </div>
            <p className="font-medium text-gray-900">{email.subject}</p>
          </div>

          {/* Preview Text */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-500 uppercase">Preview Text</span>
              <button
                onClick={() => copyToClipboard(email.preview, 'preview')}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                {copied === 'preview' ? (
                  <><Check className="w-3 h-3" /> Copied</>
                ) : (
                  <><Copy className="w-3 h-3" /> Copy</>
                )}
              </button>
            </div>
            <p className="text-gray-600">{email.preview}</p>
          </div>

          {/* Body */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-500 uppercase">Email Body</span>
              <button
                onClick={() => copyToClipboard(email.body, 'body')}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                {copied === 'body' ? (
                  <><Check className="w-3 h-3" /> Copied</>
                ) : (
                  <><Copy className="w-3 h-3" /> Copy</>
                )}
              </button>
            </div>
            <div className="
              p-4 bg-gray-50 rounded-lg
              text-gray-700 text-sm
              whitespace-pre-wrap
            ">
              {email.body}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SequenceSection({ title, description, sequence, colorClass }) {
  const [expandedEmail, setExpandedEmail] = useState(null)

  if (!sequence) return null

  const emails = [
    { subject: sequence.email_1_subject, preview: sequence.email_1_preview, body: sequence.email_1_body },
    { subject: sequence.email_2_subject, preview: sequence.email_2_preview, body: sequence.email_2_body },
    { subject: sequence.email_3_subject, preview: sequence.email_3_preview, body: sequence.email_3_body }
  ].filter(e => e.subject)

  return (
    <div className="mb-6 last:mb-0">
      <div className={`flex items-center gap-2 mb-3 ${colorClass}`}>
        <Mail className="w-5 h-5" />
        <h4 className="font-semibold">{title}</h4>
      </div>
      <p className="text-sm text-gray-500 mb-4">{description}</p>

      <div className="space-y-3">
        {emails.map((email, index) => (
          <EmailCard
            key={index}
            email={email}
            number={index + 1}
            expanded={expandedEmail === index}
            onToggle={() => setExpandedEmail(expandedEmail === index ? null : index)}
          />
        ))}
      </div>
    </div>
  )
}

export default function EmailSequencePreview({ funnelId, language = 'English' }) {
  const {
    sequences,
    loading,
    generating,
    error,
    fetchSequences,
    generateSequences,
    leadMagnetSequence,
    frontEndSequence
  } = useEmailSequences()

  useEffect(() => {
    if (funnelId) {
      fetchSequences(funnelId)
    }
  }, [funnelId, fetchSequences])

  const handleGenerate = async () => {
    try {
      await generateSequences(funnelId, language)
    } catch (err) {
      console.error('Failed to generate emails:', err)
    }
  }

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-500">Loading email sequences...</span>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            Email Sequences
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Maria Wendt style emails for your funnel
          </p>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={generating}
          variant={sequences.length > 0 ? 'secondary' : 'primary'}
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : sequences.length > 0 ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerate
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Emails
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {sequences.length === 0 && !generating ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            No email sequences yet. Click "Generate Emails" to create them.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          <SequenceSection
            title="Lead Magnet Sequence"
            description="3 emails to nurture leads who downloaded your free resource"
            sequence={leadMagnetSequence}
            colorClass="text-purple-600"
          />

          <SequenceSection
            title="Front-End Sequence"
            description="3 emails to convert leads into paying customers"
            sequence={frontEndSequence}
            colorClass="text-green-600"
          />
        </div>
      )}
    </Card>
  )
}
