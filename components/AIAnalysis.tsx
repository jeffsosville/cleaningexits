// components/AIAnalysis.tsx
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
    finding?: string;
    risk?: string;
    severity: 'Low' | 'Medium' | 'High';
    mitigation?: string;
  }>;
  confidence: number;
  confidence_reasons?: string[];
  created_at: string;
  extended_analysis?: {
    deal_snapshot?: any;
    why_hot?: string;
    revenue_analysis?: any;
    client_portfolio?: any;
    operations_analysis?: any;
    growth_opportunities?: Array<{
      opportunity: string;
      rationale: string;
      potential_impact: string;
    }>;
    risk_factors?: Array<{
      category: string;
      risk: string;
      severity: 'Low' | 'Medium' | 'High';
      mitigation: string;
    }>;
    valuation_analysis?: any;
  };
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

  const generateAnalysis = async () => {
    setGenerating(true);
    try {
      const response = await fetch(`/api/analyze/${listingId}`, {
        method: 'POST',
      });
      
      if (response.ok) {
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

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
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

  const ext = analysis.extended_analysis;
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

          {/* Why It's Hot - New Section */}
          {ext?.why_hot && (
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg mb-4">
              <div className="flex items-start gap-2">
                <span className="text-xl">🔥</span>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Why This Is Hot</h4>
                  <p className="text-sm text-gray-700">{ext.why_hot}</p>
                </div>
              </div>
            </div>
          )}

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

          {/* Main Sections - Expandable */}
          <div className="space-y-2 mb-4">
            {/* Revenue Analysis */}
            {ext?.revenue_analysis && (
              <div className="bg-white rounded-lg border border-violet-200">
                <button
                  onClick={() => toggleSection('revenue')}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-violet-50 transition"
                >
                  <span className="font-semibold text-gray-900 flex items-center gap-2">
                    💰 Revenue Analysis
                  </span>
                  <span className="text-violet-600">
                    {expandedSections.revenue ? '▼' : '▶'}
                  </span>
                </button>
                {expandedSections.revenue && (
                  <div className="px-4 pb-4 space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-gray-600">Total Revenue:</span>
                        <span className="font-semibold ml-2">{money(ext.revenue_analysis.total_revenue)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">SDE:</span>
                        <span className="font-semibold ml-2">{money(ext.revenue_analysis.sde)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Margin:</span>
                        <span className="font-semibold ml-2">{ext.revenue_analysis.margin_percentage}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Recurring:</span>
                        <span className="font-semibold ml-2">{ext.revenue_analysis.recurring_percentage}</span>
                      </div>
                    </div>
                    {ext.revenue_analysis.key_insights && (
                      <div className="mt-3">
                        <div className="font-semibold text-gray-900 mb-1">Key Insights:</div>
                        <ul className="space-y-1">
                          {ext.revenue_analysis.key_insights.map((insight: string, i: number) => (
                            <li key={i} className="text-gray-700">• {insight}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Client Portfolio */}
            {ext?.client_portfolio && (
              <div className="bg-white rounded-lg border border-violet-200">
                <button
                  onClick={() => toggleSection('clients')}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-violet-50 transition"
                >
                  <span className="font-semibold text-gray-900 flex items-center gap-2">
                    👥 Client Portfolio
                  </span>
                  <span className="text-violet-600">
                    {expandedSections.clients ? '▼' : '▶'}
                  </span>
                </button>
                {expandedSections.clients && (
                  <div className="px-4 pb-4 space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-gray-600">Total Clients:</span>
                        <span className="font-semibold ml-2">{ext.client_portfolio.total_clients}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Retention:</span>
                        <span className="font-semibold ml-2">{ext.client_portfolio.retention_rate}</span>
                      </div>
                    </div>
                    {ext.client_portfolio.client_types && (
                      <div>
                        <span className="text-gray-600">Client Types:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {ext.client_portfolio.client_types.map((type: string, i: number) => (
                            <span key={i} className="bg-violet-100 text-violet-700 px-2 py-1 rounded text-xs font-semibold">
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {ext.client_portfolio.key_insights && (
                      <div className="mt-3">
                        <div className="font-semibold text-gray-900 mb-1">Key Insights:</div>
                        <ul className="space-y-1">
                          {ext.client_portfolio.key_insights.map((insight: string, i: number) => (
                            <li key={i} className="text-gray-700">• {insight}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Operations Analysis */}
            {ext?.operations_analysis && (
              <div className="bg-white rounded-lg border border-violet-200">
                <button
                  onClick={() => toggleSection('operations')}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-violet-50 transition"
                >
                  <span className="font-semibold text-gray-900 flex items-center gap-2">
                    ⚙️ Operations
                  </span>
                  <span className="text-violet-600">
                    {expandedSections.operations ? '▼' : '▶'}
                  </span>
                </button>
                {expandedSections.operations && (
                  <div className="px-4 pb-4 space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-gray-600">Owner Involvement:</span>
                        <span className="font-semibold ml-2">{ext.operations_analysis.owner_involvement}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Employees:</span>
                        <span className="font-semibold ml-2">{ext.operations_analysis.employee_count}</span>
                      </div>
                    </div>
                    {ext.operations_analysis.key_insights && (
                      <div className="mt-3">
                        <div className="font-semibold text-gray-900 mb-1">Key Insights:</div>
                        <ul className="space-y-1">
                          {ext.operations_analysis.key_insights.map((insight: string, i: number) => (
                            <li key={i} className="text-gray-700">• {insight}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Growth Opportunities */}
            {ext?.growth_opportunities && ext.growth_opportunities.length > 0 && (
              <div className="bg-white rounded-lg border border-violet-200">
                <button
                  onClick={() => toggleSection('growth')}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-violet-50 transition"
                >
                  <span className="font-semibold text-gray-900 flex items-center gap-2">
                    📈 Growth Opportunities
                  </span>
                  <span className="text-violet-600">
                    {expandedSections.growth ? '▼' : '▶'}
                  </span>
                </button>
                {expandedSections.growth && (
                  <div className="px-4 pb-4 space-y-3 text-sm">
                    {ext.growth_opportunities.map((opp, i) => (
                      <div key={i} className="bg-emerald-50 p-3 rounded-lg">
                        <div className="font-semibold text-emerald-900 mb-1">{opp.opportunity}</div>
                        <div className="text-gray-700 mb-1">{opp.rationale}</div>
                        <div className="text-xs text-emerald-700 font-semibold">{opp.potential_impact}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Applied Adjustments */}
          {analysis.applied_adjustments.length > 0 && (
            <div className="mb-4">
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
          )}

          {/* Risk Assessment */}
          {(analysis.risk_table.length > 0 || (ext?.risk_factors && ext.risk_factors.length > 0)) && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-900 mb-2">Risk Assessment</h4>
              <div className="space-y-2">
                {/* Show extended risk_factors if available, otherwise fall back to risk_table */}
                {(ext?.risk_factors || analysis.risk_table).map((risk, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-lg text-sm flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 mb-1">{risk.category}</div>
                      <p className="text-gray-600 mb-1">{risk.risk || risk.finding}</p>
                      {risk.mitigation && (
                        <p className="text-xs text-gray-500 italic">Mitigation: {risk.mitigation}</p>
                      )}
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
            <div className="bg-yellow-50 p-3 rounded-lg mb-4">
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
      </div>
    </div>
  );
}
