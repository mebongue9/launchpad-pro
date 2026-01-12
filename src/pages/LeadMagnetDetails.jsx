// /src/pages/LeadMagnetDetails.jsx
// Lead magnet details page with tabs for products, marketplace, emails, and export
// Similar structure to FunnelDetails but for lead magnets
// RELEVANT FILES: src/pages/LeadMagnetBuilder.jsx, src/hooks/useLeadMagnets.jsx

import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useLeadMagnets } from '../hooks/useLeadMagnets'
import { useToast } from '../components/ui/Toast'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import {
  ArrowLeft,
  FileText,
  ShoppingBag,
  Mail,
  Download,
  Loader2,
  Copy,
  Check,
  Tag,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Sparkles
} from 'lucide-react'

// Safe JSON parse helper - prevents crashes from invalid JSON
const safeJsonParse = (data, fallback = null) => {
  if (!data) return fallback
  if (typeof data !== 'string') return data
  try {
    return JSON.parse(data)
  } catch (e) {
    console.error('JSON parse error:', e)
    return fallback
  }
}

// Tab definitions - Order: Products → Marketplace → Emails → TLDR → Export (consistent with FunnelDetails)
const TABS = [
  { id: 'products', label: 'Products', icon: FileText },
  { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
  { id: 'emails', label: 'Emails', icon: Mail },
  { id: 'tldr', label: 'TLDR', icon: Sparkles },
  { id: 'export', label: 'Export', icon: Download }
]

// Copy button component
function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text || '')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
    >
      {copied ? (
        <><Check className="w-3 h-3" /> Copied</>
      ) : (
        <><Copy className="w-3 h-3" /> {label}</>
      )}
    </button>
  )
}

// Email card component
function EmailCard({ email, number, expanded, onToggle }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-semibold">
            {number}
          </div>
          <div>
            <p className="font-medium text-gray-900">{email.subject || 'No subject'}</p>
            <p className="text-sm text-gray-500">{email.preview_text || email.preview || 'No preview'}</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>

      {expanded && (
        <div className="p-4 bg-white border-t border-gray-200 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-500 uppercase">Subject</span>
              <CopyButton text={email.subject} />
            </div>
            <p className="font-medium text-gray-900">{email.subject || 'No subject'}</p>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-500 uppercase">Preview Text</span>
              <CopyButton text={email.preview_text || email.preview} />
            </div>
            <p className="text-gray-600">{email.preview_text || email.preview || 'No preview'}</p>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-500 uppercase">Body</span>
              <CopyButton text={email.body} />
            </div>
            <div className="p-4 bg-gray-50 rounded-lg text-gray-700 text-sm whitespace-pre-wrap max-h-60 overflow-y-auto">
              {email.body || 'No body content'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function LeadMagnetDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { leadMagnets, loading: leadMagnetsLoading, fetchLeadMagnets } = useLeadMagnets()
  const { addToast } = useToast()

  const [activeTab, setActiveTab] = useState('products')
  const [expandedChapter, setExpandedChapter] = useState(0)
  const [expandedEmail, setExpandedEmail] = useState(null)
  const [leadMagnet, setLeadMagnet] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch lead magnet with all fields
  const fetchLeadMagnetDetails = useCallback(async () => {
    if (!user || !id) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('lead_magnets')
        .select('*, profiles(name, business_name), funnels(name)')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (error) throw error
      setLeadMagnet(data)
    } catch (err) {
      console.error('Failed to fetch lead magnet:', err)
      addToast('Failed to load lead magnet', 'error')
    } finally {
      setLoading(false)
    }
  }, [user, id, addToast])

  useEffect(() => {
    fetchLeadMagnetDetails()
  }, [fetchLeadMagnetDetails])

  if (loading || leadMagnetsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!leadMagnet) {
    return (
      <div className="space-y-6">
        <div>
          <Button variant="secondary" onClick={() => navigate('/lead-magnets')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Lead Magnets
          </Button>
        </div>
        <Card className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Lead Magnet Not Found</h3>
          <p className="text-gray-500">This lead magnet doesn't exist or has been deleted.</p>
        </Card>
      </div>
    )
  }

  // Parse content safely - prevents page crash on invalid JSON
  const content = safeJsonParse(leadMagnet.content, { chapters: [] })

  // Get chapters from content
  const chapters = content?.chapters || []
  const cover = content?.cover || {}

  // Get TLDR data safely
  const tldr = safeJsonParse(leadMagnet.tldr, null)

  // Get email sequence
  const emailSequence = Array.isArray(leadMagnet.email_sequence)
    ? leadMagnet.email_sequence
    : []

  // Get marketplace data
  const marketplace = {
    title: leadMagnet.marketplace_title,
    description: leadMagnet.marketplace_description || leadMagnet.etsy_description,
    tags: leadMagnet.marketplace_tags
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={() => navigate('/lead-magnets')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{leadMagnet.name}</h1>
            <p className="text-gray-500">
              {leadMagnet.profiles?.name || 'No profile'}
              {leadMagnet.funnels?.name && ` • Funnel: ${leadMagnet.funnels.name}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{leadMagnet.keyword}</span>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{leadMagnet.format}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            {/* Chapters Section */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-500" />
                Content ({chapters.length} chapters)
              </h3>

              {chapters.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No content generated yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {chapters.map((chapter, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedChapter(expandedChapter === idx ? -1 : idx)}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold">
                            {idx + 1}
                          </div>
                          <span className="font-medium text-gray-900">
                            {chapter.title || `Chapter ${idx + 1}`}
                          </span>
                        </div>
                        {expandedChapter === idx
                          ? <ChevronUp className="w-5 h-5 text-gray-400" />
                          : <ChevronDown className="w-5 h-5 text-gray-400" />
                        }
                      </button>
                      {expandedChapter === idx && (
                        <div className="p-4 bg-white border-t border-gray-200">
                          <div className="flex justify-end mb-2">
                            <CopyButton text={chapter.content} label="Copy Content" />
                          </div>
                          <div className="text-gray-700 whitespace-pre-wrap text-sm">
                            {chapter.content || 'No content'}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Marketplace Tab */}
        {activeTab === 'marketplace' && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-green-600" />
              Marketplace Listing
            </h3>

            {!marketplace.title && !marketplace.description ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No marketplace listing generated yet.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Marketplace Title
                      <span className="text-xs text-gray-400 ml-2">
                        ({marketplace.title?.length || 0}/140 chars)
                      </span>
                    </span>
                    <CopyButton text={marketplace.title} />
                  </div>
                  <p className="p-3 bg-gray-50 rounded-lg text-gray-900 font-medium">
                    {marketplace.title || 'No title generated'}
                  </p>
                </div>

                {/* Description */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Etsy/Gumroad Description
                      <span className="text-xs text-gray-400 ml-2">
                        ({marketplace.description?.length || 0} chars)
                      </span>
                    </span>
                    <CopyButton text={marketplace.description} />
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-gray-700 text-sm whitespace-pre-wrap max-h-60 overflow-y-auto">
                    {marketplace.description || 'No description generated'}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      SEO Tags
                    </span>
                    <CopyButton text={marketplace.tags} label="Copy All" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(marketplace.tags || '').split(',').filter(tag => tag.trim()).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                    {!marketplace.tags && (
                      <p className="text-gray-500 text-sm">No tags generated</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Emails Tab */}
        {activeTab === 'emails' && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-purple-600" />
              Lead Magnet Email Sequence
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              3 emails to nurture leads who downloaded your free resource
            </p>

            {emailSequence.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No email sequence generated yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {emailSequence.map((email, idx) => (
                  <EmailCard
                    key={idx}
                    email={email}
                    number={idx + 1}
                    expanded={expandedEmail === idx}
                    onToggle={() => setExpandedEmail(expandedEmail === idx ? null : idx)}
                  />
                ))}
              </div>
            )}
          </Card>
        )}

        {/* TLDR Tab */}
        {activeTab === 'tldr' && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              TLDR Summary
            </h3>

            {!tldr ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No TLDR generated yet.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {tldr.what_it_is && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">What It Is</span>
                      <CopyButton text={tldr.what_it_is} />
                    </div>
                    <p className="p-3 bg-gray-50 rounded-lg text-gray-700">{tldr.what_it_is}</p>
                  </div>
                )}

                {tldr.who_its_for && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Who It's For</span>
                      <CopyButton text={tldr.who_its_for} />
                    </div>
                    <p className="p-3 bg-gray-50 rounded-lg text-gray-700">{tldr.who_its_for}</p>
                  </div>
                )}

                {tldr.problem_solved && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Problem Solved</span>
                      <CopyButton text={tldr.problem_solved} />
                    </div>
                    <p className="p-3 bg-gray-50 rounded-lg text-gray-700">{tldr.problem_solved}</p>
                  </div>
                )}

                {tldr.whats_inside && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">What's Inside</span>
                      <CopyButton text={Array.isArray(tldr.whats_inside) ? tldr.whats_inside.join('\n') : tldr.whats_inside} />
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      {Array.isArray(tldr.whats_inside) ? (
                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                          {tldr.whats_inside.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-700">{tldr.whats_inside}</p>
                      )}
                    </div>
                  </div>
                )}

                {tldr.key_benefits && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Key Benefits</span>
                      <CopyButton text={Array.isArray(tldr.key_benefits) ? tldr.key_benefits.join('\n') : tldr.key_benefits} />
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      {Array.isArray(tldr.key_benefits) ? (
                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                          {tldr.key_benefits.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-700">{tldr.key_benefits}</p>
                      )}
                    </div>
                  </div>
                )}

                {tldr.cta && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Call to Action</span>
                      <CopyButton text={tldr.cta} />
                    </div>
                    <p className="p-3 bg-blue-50 rounded-lg text-blue-700 font-medium">{tldr.cta}</p>
                  </div>
                )}
              </div>
            )}
          </Card>
        )}

        {/* Export Tab */}
        {activeTab === 'export' && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Download className="w-5 h-5 text-blue-600" />
              Export Options
            </h3>

            <div className="space-y-4">
              {leadMagnet.html_url && (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">HTML Version</p>
                    <p className="text-sm text-gray-500">Web-ready HTML file</p>
                  </div>
                  <a
                    href={leadMagnet.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Download HTML
                  </a>
                </div>
              )}

              {leadMagnet.pdf_url && (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">PDF Version</p>
                    <p className="text-sm text-gray-500">Print-ready PDF file</p>
                  </div>
                  <a
                    href={leadMagnet.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Download PDF
                  </a>
                </div>
              )}

              {!leadMagnet.html_url && !leadMagnet.pdf_url && (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Download className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No exports available yet.</p>
                  <p className="text-sm text-gray-400 mt-1">Generate content first to enable exports.</p>
                </div>
              )}

              {/* Captions */}
              {(leadMagnet.caption_comment || leadMagnet.caption_dm) && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-4">Social Media Captions</h4>

                  {leadMagnet.caption_comment && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-500">Comment Version</span>
                        <CopyButton text={leadMagnet.caption_comment} />
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg text-gray-700 text-sm whitespace-pre-wrap">
                        {leadMagnet.caption_comment}
                      </div>
                    </div>
                  )}

                  {leadMagnet.caption_dm && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-500">DM Version</span>
                        <CopyButton text={leadMagnet.caption_dm} />
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg text-gray-700 text-sm whitespace-pre-wrap">
                        {leadMagnet.caption_dm}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
