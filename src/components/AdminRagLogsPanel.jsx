// /src/components/AdminRagLogsPanel.jsx
// Admin-only panel showing real-time RAG retrieval logs
// READ-ONLY feature - does NOT modify any RAG logic
// RELEVANT FILES: rag_retrieval_logs table, src/lib/supabase.js

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, CheckCircle, XCircle, Copy, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export function AdminRagLogsPanel({ isGenerating }) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [logs, setLogs] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);
  const [generationStartTime, setGenerationStartTime] = useState(null);
  const [showPanel, setShowPanel] = useState(false);

  // Admin check
  const ADMIN_EMAILS = ['mebongue@hotmail.com'];

  useEffect(() => {
    if (!user?.email) {
      setAdminChecked(true);
      return;
    }
    setIsAdmin(ADMIN_EMAILS.includes(user.email));
    setAdminChecked(true);
  }, [user?.email]);

  // CRITICAL: Capture timestamp when generation STARTS
  useEffect(() => {
    if (isGenerating && !generationStartTime) {
      // Generation just started - capture timestamp NOW
      const now = new Date().toISOString();
      console.log('[RAG Panel] Generation started at:', now);
      setGenerationStartTime(now);
      setShowPanel(true);
      setLogs([]); // Clear old logs
    }
  }, [isGenerating, generationStartTime]);

  // Get latest log for status indicator
  const latestLog = logs[0];

  // Status based on THIS generation's logs only
  const getStatus = () => {
    if (logs.length === 0) {
      return { type: 'waiting', message: 'Checking...', color: 'gray' };
    }
    const latestLog = logs[0];
    if (!latestLog) {
      return { type: 'waiting', message: 'Checking...', color: 'gray' };
    }
    if (latestLog.chunks_retrieved === 0) {
      return { type: 'error', message: 'FAILED — No chunks retrieved', color: 'red' };
    }
    if (!latestLog.knowledge_context_passed) {
      return { type: 'error', message: 'FAILED — Context not passed to AI', color: 'red' };
    }
    return {
      type: 'success',
      message: `Working (${latestLog.chunks_retrieved} chunks retrieved)`,
      color: 'green'
    };
  };

  const status = getStatus();

  // Auto-expand on error
  useEffect(() => {
    if (status.type === 'error') {
      setExpanded(true);
    }
  }, [status.type]);

  // Fetch logs ONLY from after generation started
  const fetchLogs = async () => {
    if (!generationStartTime) {
      console.log('[RAG Panel] No start time, skipping fetch');
      return;
    }

    console.log('[RAG Panel] Fetching logs after:', generationStartTime);

    const { data, error } = await supabase
      .from('rag_retrieval_logs')
      .select('*')
      .gte('created_at', generationStartTime)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('[RAG Panel] Fetch error:', error);
      return;
    }

    console.log('[RAG Panel] Found logs:', data?.length || 0);
    if (data) setLogs(data);
  };

  // Poll for logs
  useEffect(() => {
    if (!isAdmin || !showPanel || !generationStartTime) return;

    fetchLogs(); // Immediate fetch

    const interval = setInterval(fetchLogs, 2000);
    return () => clearInterval(interval);
  }, [isAdmin, showPanel, generationStartTime]);

  // Also fetch when generation completes (one final check)
  useEffect(() => {
    if (!isGenerating && showPanel && generationStartTime) {
      // Generation just finished - do one more fetch
      setTimeout(fetchLogs, 500);
    }
  }, [isGenerating, showPanel, generationStartTime]);

  // Format timestamp
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Format scores array
  const formatScores = (scores) => {
    if (!scores || !Array.isArray(scores)) return 'N/A';
    return scores.slice(0, 5).map(s =>
      typeof s === 'object' ? s.score?.toFixed(2) : s?.toFixed(2)
    ).join(', ');
  };

  // Copy error details to clipboard
  const copyErrorDetails = (log) => {
    const details = `
Timestamp: ${log.created_at}
Function: ${log.source_function}
Query: "${log.search_query}"
Chunks in DB: ${log.total_chunks_in_db}
Chunks Retrieved: ${log.chunks_retrieved}
Similarity Threshold: ${log.similarity_threshold}
Top Scores: ${formatScores(log.top_5_scores)}
Context Passed: ${log.knowledge_context_passed}
    `.trim();

    navigator.clipboard.writeText(details);
  };

  // CRITICAL: Don't render if not admin
  if (!adminChecked || !isAdmin) return null;

  // CRITICAL: Don't render until Generate is clicked
  if (!showPanel) return null;

  // Status colors
  const statusColors = {
    green: 'bg-green-100 text-green-800 border-green-300',
    red: 'bg-red-100 text-red-800 border-red-300',
    gray: 'bg-gray-100 text-gray-600 border-gray-300'
  };

  const statusIcons = {
    success: <CheckCircle className="w-5 h-5 text-green-600" />,
    error: <XCircle className="w-5 h-5 text-red-600" />,
    waiting: <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
  };

  return (
    <div className="mt-4 space-y-2">
      {/* STATUS INDICATOR - Always visible */}
      <div className={`px-4 py-3 rounded-lg border flex items-center gap-3 ${statusColors[status.color]}`}>
        {statusIcons[status.type]}
        <span className="font-medium">RAG Status: {status.message}</span>
        {isGenerating && (
          <span className="ml-auto px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded animate-pulse">
            Live
          </span>
        )}
      </div>

      {/* COLLAPSIBLE DETAILS */}
      <div className="border rounded-lg bg-gray-50">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-4 py-2 flex items-center gap-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          View Details ({logs.length} logs from this generation)
        </button>

        {expanded && (
          <div className="px-4 pb-4 max-h-80 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-sm text-gray-500 py-2">
                {isGenerating ? 'Waiting for RAG calls...' : 'No RAG calls detected for this generation'}
              </p>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className={`text-xs font-mono p-3 rounded border ${
                      log.chunks_retrieved === 0 || !log.knowledge_context_passed
                        ? 'bg-red-50 border-red-200'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="font-semibold text-gray-700 flex justify-between">
                      <span>{formatTime(log.created_at)} — {log.source_function}</span>
                      {(log.chunks_retrieved === 0 || !log.knowledge_context_passed) && (
                        <button
                          onClick={() => copyErrorDetails(log)}
                          className="flex items-center gap-1 text-red-600 hover:text-red-800"
                        >
                          <Copy className="w-3 h-3" /> Copy
                        </button>
                      )}
                    </div>
                    <div className="mt-1 space-y-0.5 text-gray-600">
                      <div>├─ Query: "{log.search_query?.substring(0, 60)}{log.search_query?.length > 60 ? '...' : ''}"</div>
                      <div className={log.chunks_retrieved === 0 ? 'text-red-600 font-bold' : ''}>
                        ├─ Chunks Retrieved: {log.chunks_retrieved} of {log.total_chunks_in_db}
                      </div>
                      <div>├─ Threshold: {log.similarity_threshold}</div>
                      <div className={log.top_5_scores?.[0]?.score < 0.5 ? 'text-yellow-600' : ''}>
                        ├─ Top Scores: {formatScores(log.top_5_scores)}
                      </div>
                      <div className="flex items-center gap-1">
                        └─ Context Passed:
                        {log.knowledge_context_passed ? (
                          <span className="text-green-600 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> YES
                          </span>
                        ) : (
                          <span className="text-red-600 flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> NO
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
