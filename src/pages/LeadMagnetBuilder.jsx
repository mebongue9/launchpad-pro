// /src/pages/LeadMagnetBuilder.jsx
// AI-powered lead magnet generation page
// Generates ideas and content for lead magnets
// RELEVANT FILES: src/hooks/useLeadMagnets.jsx, src/hooks/useFunnels.jsx

import { useState } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useProfiles } from '../hooks/useProfiles'
import { useAudiences } from '../hooks/useAudiences'
import { useFunnels } from '../hooks/useFunnels'
import { useLeadMagnets } from '../hooks/useLeadMagnets'
import { useToast } from '../components/ui/Toast'
import { Magnet, Sparkles, Check, Loader2, FileText, Tag, ArrowRight } from 'lucide-react'

export default function LeadMagnetBuilder() {
  const { profiles } = useProfiles()
  const { audiences } = useAudiences()
  const { funnels } = useFunnels()
  const { leadMagnets, generateIdeas, generateContent, saveLeadMagnet, getExcludedTopics } = useLeadMagnets()
  const { showToast } = useToast()

  const [selectedProfile, setSelectedProfile] = useState(null)
  const [selectedAudience, setSelectedAudience] = useState(null)
  const [selectedFunnel, setSelectedFunnel] = useState(null)
  const [step, setStep] = useState(1)
  const [generating, setGenerating] = useState(false)
  const [ideas, setIdeas] = useState([])
  const [selectedIdea, setSelectedIdea] = useState(null)
  const [generatedContent, setGeneratedContent] = useState(null)
  const [saving, setSaving] = useState(false)

  const frontEndProduct = selectedFunnel
    ? funnels.find(f => f.id === selectedFunnel)?.front_end
    : null

  async function handleGenerateIdeas() {
    if (!selectedProfile || !selectedFunnel) {
      showToast('Please select a profile and funnel', 'error')
      return
    }

    setGenerating(true)
    setIdeas([])

    try {
      const profile = profiles.find(p => p.id === selectedProfile)
      const audience = audiences.find(a => a.id === selectedAudience)
      const excludedTopics = await getExcludedTopics(selectedProfile)

      const result = await generateIdeas(profile, audience, frontEndProduct, excludedTopics)
      setIdeas(result.ideas || [])
      setStep(2)
      showToast('Ideas generated!', 'success')
    } catch (error) {
      showToast(error.message || 'Failed to generate ideas', 'error')
    } finally {
      setGenerating(false)
    }
  }

  async function handleSelectIdea(idea) {
    setSelectedIdea(idea)
    setGenerating(true)

    try {
      const profile = profiles.find(p => p.id === selectedProfile)
      const audience = audiences.find(a => a.id === selectedAudience)

      const content = await generateContent(idea, profile, audience, frontEndProduct)
      setGeneratedContent({ ...content, ...idea })
      setStep(3)
      showToast('Content generated!', 'success')
    } catch (error) {
      showToast(error.message || 'Failed to generate content', 'error')
    } finally {
      setGenerating(false)
    }
  }

  async function handleSave() {
    if (!generatedContent) return

    setSaving(true)
    try {
      await saveLeadMagnet(generatedContent, selectedProfile, selectedFunnel)
      showToast('Lead magnet saved!', 'success')
      setStep(1)
      setIdeas([])
      setSelectedIdea(null)
      setGeneratedContent(null)
      setSelectedProfile(null)
      setSelectedFunnel(null)
    } catch (error) {
      showToast(error.message || 'Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  function handleBack() {
    if (step === 3) {
      setStep(2)
      setGeneratedContent(null)
    } else if (step === 2) {
      setStep(1)
      setIdeas([])
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Lead Magnet Builder</h1>
        <p className="text-gray-500 mt-1">
          Create high-converting lead magnets that feed into your funnels
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 text-sm">
        <span className={`px-3 py-1 rounded-full ${step >= 1 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
          1. Select
        </span>
        <ArrowRight className="w-4 h-4 text-gray-400" />
        <span className={`px-3 py-1 rounded-full ${step >= 2 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
          2. Choose Idea
        </span>
        <ArrowRight className="w-4 h-4 text-gray-400" />
        <span className={`px-3 py-1 rounded-full ${step >= 3 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
          3. Review & Save
        </span>
      </div>

      {/* Step 1: Selection */}
      {step === 1 && (
        <Card>
          <h2 className="text-lg font-semibold mb-4">Create New Lead Magnet</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Profile *
              </label>
              <select
                value={selectedProfile || ''}
                onChange={(e) => setSelectedProfile(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a profile...</option>
                {profiles.map(profile => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Audience
              </label>
              <select
                value={selectedAudience || ''}
                onChange={(e) => setSelectedAudience(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose an audience...</option>
                {audiences.map(audience => (
                  <option key={audience.id} value={audience.id}>
                    {audience.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Funnel *
              </label>
              <select
                value={selectedFunnel || ''}
                onChange={(e) => setSelectedFunnel(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a funnel...</option>
                {funnels.map(funnel => (
                  <option key={funnel.id} value={funnel.id}>
                    {funnel.name} - ${funnel.front_end?.price}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {frontEndProduct && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Lead magnet will lead to:</strong> {frontEndProduct.name} (${frontEndProduct.price})
              </p>
            </div>
          )}

          <Button
            onClick={handleGenerateIdeas}
            disabled={!selectedProfile || !selectedFunnel || generating}
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Ideas...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate 3 Ideas
              </>
            )}
          </Button>
        </Card>
      )}

      {/* Step 2: Choose Idea */}
      {step === 2 && ideas.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Choose Your Lead Magnet</h2>
            <Button variant="secondary" onClick={handleBack}>
              ← Back
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ideas.map((idea, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
                onClick={() => !generating && handleSelectIdea(idea)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-medium text-blue-600">{idea.keyword}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{idea.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{idea.topic}</p>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">{idea.format}</span>
                <p className="text-xs text-gray-500 mt-3 italic">{idea.why_it_works}</p>
              </div>
            ))}
          </div>

          {generating && (
            <div className="mt-4 text-center text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              Generating content...
            </div>
          )}
        </Card>
      )}

      {/* Step 3: Preview & Save */}
      {step === 3 && generatedContent && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{generatedContent.title}</h2>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleBack}>
                ← Back
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Save Lead Magnet
                  </>
                )}
              </Button>
            </div>
          </div>

          <p className="text-gray-600 mb-4">{generatedContent.subtitle}</p>

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Content Preview</h3>
            {generatedContent.sections?.map((section, index) => (
              <div key={index} className="border-l-4 border-blue-200 pl-4">
                <p className="text-xs text-blue-600 uppercase mb-1">{section.type}</p>
                <h4 className="font-medium">{section.title}</h4>
                {section.content && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-3">{section.content}</p>
                )}
              </div>
            ))}
          </div>

          {generatedContent.promotion_kit && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Promotion Kit</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Keyword</p>
                  <p className="font-medium">{generatedContent.promotion_kit.keyword}</p>
                </div>
                {generatedContent.promotion_kit.captions?.comment_version && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Instagram Caption</p>
                    <p className="text-sm text-gray-700">{generatedContent.promotion_kit.captions.comment_version}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Existing Lead Magnets */}
      {leadMagnets.length > 0 && step === 1 && (
        <Card>
          <h2 className="text-lg font-semibold mb-4">Your Lead Magnets</h2>
          <div className="space-y-3">
            {leadMagnets.map(lm => (
              <div key={lm.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <h3 className="font-medium text-gray-900">{lm.name}</h3>
                    <p className="text-sm text-gray-500">
                      Keyword: {lm.keyword} • {lm.format}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Empty State */}
      {step === 1 && leadMagnets.length === 0 && funnels.length === 0 && (
        <Card className="text-center py-12">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Magnet className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Create a Funnel First
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Lead magnets are designed to drive traffic to your front-end products.
            Create a funnel first, then generate lead magnets for it.
          </p>
        </Card>
      )}
    </div>
  )
}
