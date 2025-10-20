// components/ValuationAnalysis.tsx
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
    impact: string;
    value?: string;
  }>;
  risk_table: {
    risks?: string[];
  };
  confidence: number;
  confidence_reasons?: Record<string, boolean>;
  created_at: string;
  extended_analysis?: {
    estimated_sde?: boolean;
    data_completeness?: Record<string, boolean>;
  };
};

const money = (n: number) =>
  n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

export default function ValuationAnalysis({ listingId }: { listingId: string }) {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

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

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 p-6 rounded-xl animate-pulse">
        <div className="h-6 bg-emerald-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-emerald-100 rounded w-full mb-2"></div>
        <div className="h-4 bg-emerald-100 rounded w-2/3"></div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-slate-50 border-2 border-gray-200 p-6 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="text-2xl">📊</div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 mb-2">Valuation Analysis</h3>
            <p className="text-sm text-gray-600">
              Analysis will be available within 24 hours of listing verification.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const risks = analysis.risk_table?.risks || [];

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 p-6 rounded-xl">
      <div className="flex items-start gap-3">
        <div className="text-2xl">📊</div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900">Valuation Analysis</h3>
            <span className="text-xs text-gray-600">
              Confidence: {Math.round(analysis.confidence)}%
            </span>
          </div>

          {/* Summary */}
          <p className="text-sm text-gray-700 mb-4">{analysis.ai_summary}</p>

          {/* Valuation Range */}
          <div className="bg-white rounded-lg p-4 mb-4 border border-emerald-200">
            <h4 className="font-semibold text-gray-900 mb-3">Estimated Valuation Range</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-600 mb-1">Conservative</div>
                <div className="text-2xl font-bold text-gray-900">
                  {money(analysis.valuation_low)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">Optimistic</div>
                <div className="text-2xl font-bold text-emerald-600">
                  {money(analysis.valuation_high)}
                </div>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-600">
              Multiple: {analysis.base_multiple}× base → {analysis.adjusted_multiple}× adjusted
            </div>
          </div>

          {/* Applied Adjustments - Expandable */}
          {analysis.applied_adjustments && analysis.applied_adjustments.length > 0 && (
            <div className="bg-white rounded-lg border border-emerald-200 mb-4">
              <button
                onClick={() => toggleSection('adjustments')}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-emerald-50 transition"
              >
                <span className="font-semibold text-gray-900 flex items-center gap-2">
                  ⚖️ Valuation Adjustments ({analysis.applied_adjustments.length})
                </span>
                <span className="text-emerald-600">
                  {expandedSections.adjustments ? '▼' : '▶'}
                </span>
              </button>
              {expandedSections.adjustments && (
                <div className="px-4 pb-4 space-y-2">
                  {analysis.applied_adjustments.map((adj, idx) => (
                    <div key={idx} className="bg-gray-50 p-3 rounded-lg text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-gray-900">{adj.factor}</span>
                        <span className={`font-bold ${adj.impact.startsWith('+') ? 'text-emerald-600' : 'text-red-600'}`}>
                          {adj.impact}
                        </span>
                      </div>
                      {adj.value && (
                        <p className="text-gray-600 text-xs">Value: {adj.value}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Risk Assessment - Expandable */}
          {risks.length > 0 && (
            <div className="bg-white rounded-lg border border-emerald-200 mb-4">
              <button
                onClick={() => toggleSection('risks')}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-emerald-50 transition"
              >
                <span className="font-semibold text-gray-900 flex items-center gap-2">
                  ⚠️ Risk Factors ({risks.length})
                </span>
                <span className="text-emerald-600">
                  {expandedSections.risks ? '▼' : '▶'}
                </span>
              </button>
              {expandedSections.risks && (
                <div className="px-4 pb-4 space-y-2">
                  {risks.map((risk, idx) => (
                    <div key={idx} className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r text-sm">
                      <p className="text-gray-700">{risk}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Data Completeness Notice */}
          {analysis.extended_analysis?.estimated_sde && (
            <div className="bg-yellow-50 p-3 rounded-lg mb-4 border border-yellow-200">
              <h4 className="text-xs font-semibold text-yellow-800 mb-1">⚠️ Estimation Notice</h4>
              <p className="text-xs text-yellow-700">
                SDE was estimated based on revenue margins. Actual profitability may vary.
              </p>
            </div>
          )}

          {/* Timestamp */}
          <div className="text-xs text-gray-500 text-center">
            Analyzed on {new Date(analysis.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
}
