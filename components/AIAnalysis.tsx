import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

type Analysis = {
  id: string;
  ai_summary: string;
  valuation_low: number;
  valuation_high: number;
  base_multiple: number;
  adjusted_multiple: number;
  applied_adjustments: Array<{
    factor: string;
    delta: number;
    rationale: string;
  }>;
  risk_table: Array<{
    category: string;
    finding: string;
    severity: 'Low' | 'Medium' | 'High';
  }>;
  confidence: number;
  confidence_reasons?: string[];
  created_at: string;
};

const money = (n: number) =>
  n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

export default function AIAnalysis({ listingId }: { listingId: string }) {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchAnalysis();
  }, [listingId]);

  const fetchAnalysis = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('analyses')
      .select('*')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      setAnalysis(data);
    }
    setLoading(false);
  };

  const generateAnalysis = async () => {
    setGenerating(true);
    try {
      const response = await fetch(`/api/analyze/${listingId}`, {
        method: 'POST',
      });
      
      if (response.ok) {
        // Poll for results
        const pollInterval = setInterval(async () => {
          const { data } = await supabase
            .from('analyses')
            .select('*')
            .eq('listing_id', listingId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (data) {
            setAnalysis(data);
            setGenerating(false);
            clearInterval(pollInterval);
          }
        }, 3000);

        // Stop polling after 2 minutes
        setTimeout(() => {
          clearInterval(pollInterval);
          setGenerating(false);
        }, 120000);
      }
    } catch (error) {
      console.error('Generate error:', error);
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-violet-200 p-6 rounded-xl animate-pulse">
        <div className="h-6 bg-violet-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-violet-100 rounded w-full mb-2"></div>
        <div className="h-4 bg-violet-100 rounded w-2/3"></div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-violet-200 p-6 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="text-2xl">🤖</div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 mb-2">AI Valuation Analysis</h3>
            <p className="text-sm text-gray-700 mb-4">
              Get an instant AI-powered valuation based on our commercial cleaning framework.
            </p>
            <button
              onClick={generateAnalysis}
              disabled={generating}
              className="bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
            >
              {generating ? 'Generating... ⏳' : 'Generate AI Analysis →'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const severityColor = {
    Low: 'text-emerald-700 bg-emerald-100',
    Medium: 'text-yellow-700 bg-yellow-100',
    High: 'text-red-700 bg-red-100',
  };

  return (
    <div className="bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-violet-200 p-6 rounded-xl">
      <div className="flex items-start gap-3">
        <div className="text-2xl">🤖</div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900">AI Valuation Analysis</h3>
            <span className="text-xs text-gray-600">
              Confidence: {Math.round(analysis.confidence * 100)}%
            </span>
          </div>

          {/* Summary */}
          <p className="text-sm text-gray-700 mb-4">{analysis.ai_summary}</p>

          {/* Valuation Range */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white p-4 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">AI Valuation Range</div>
              <div className="text-xl font-bold text-violet-600">
                {money(analysis.valuation_low)} - {money(analysis.valuation_high)}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">Adjusted Multiple</div>
              <div className="text-xl font-bold text-gray-900">
                {analysis.adjusted_multiple.toFixed(1)}× SDE
              </div>
              <div className="text-xs text-gray-500">
                (Base: {analysis.base_multiple.toFixed(1)}×)
              </div>
            </div>
          </div>

          {/* Expand/Collapse Button */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-violet-600 hover:text-violet-700 font-semibold mb-4"
          >
            {expanded ? '▼ Hide Details' : '▶ Show Full Analysis'}
          </button>

          {/* Expanded Details */}
          {expanded && (
            <div className="space-y-4 pt-4 border-t border-violet-200">
              {/* Applied Adjustments */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Applied Adjustments</h4>
                <div className="space-y-2">
                  {analysis.applied_adjustments.map((adj, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-lg text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-gray-900">{adj.factor}</span>
                        <span className={`font-bold ${adj.delta > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {adj.delta > 0 ? '+' : ''}{adj.delta.toFixed(1)}×
                        </span>
                      </div>
                      <p className="text-gray-600">{adj.rationale}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Assessment */}
              {analysis.risk_table.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Risk Assessment</h4>
                  <div className="space-y-2">
                    {analysis.risk_table.map((risk, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-lg text-sm flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 mb-1">{risk.category}</div>
                          <p className="text-gray-600">{risk.finding}</p>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${severityColor[risk.severity]}`}>
                          {risk.severity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Confidence Reasons */}
              {analysis.confidence_reasons && analysis.confidence_reasons.length > 0 && (
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <h4 className="text-xs font-semibold text-yellow-800 mb-1">Analysis Limitations</h4>
                  <ul className="text-xs text-yellow-700 space-y-1">
                    {analysis.confidence_reasons.map((reason, idx) => (
                      <li key={idx}>• {reason}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Timestamp */}
              <div className="text-xs text-gray-500 text-center">
                Analyzed on {new Date(analysis.created_at).toLocaleDateString()} • Powered by Sosville AI
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
