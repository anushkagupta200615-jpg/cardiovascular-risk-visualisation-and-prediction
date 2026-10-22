import React from 'react';
import { Activity, ShieldAlert, TrendingUp, TrendingDown, HeartPulse, CheckCircle2 } from 'lucide-react';

export default function RiskDashboard({ predictionResult }) {
  if (!predictionResult) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/90 flex flex-col items-center justify-center text-center p-8 h-full min-h-[300px]">
        <div className="w-12 h-12 rounded-full bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-500 mb-3">
          <HeartPulse className="w-6 h-6 animate-pulse" />
        </div>
        <h4 className="text-sm font-bold text-slate-800">No Patient Assessment Loaded</h4>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          Select a patient preset or enter clinical vitals to run real-time inference and view SHAP feature attributions.
        </p>
      </div>
    );
  }

  const { overall_cad_risk = 0, vessels = {}, top_factors = [], disclaimer = '' } = predictionResult;

  const getRiskBadge = (risk) => {
    if (risk > 0.6) {
      return (
        <span className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
          Stenotic (Critical &gt;60%)
        </span>
      );
    }
    if (risk > 0.3) {
      return (
        <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          Moderate (30-60%)
        </span>
      );
    }
    return (
      <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-2xs">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        Patent (&lt;30%)
      </span>
    );
  };

  const cadPct = Math.round(overall_cad_risk * 100);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/90 flex flex-col space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Clinical Risk & Explainability Breakdown
            </h2>
            <p className="text-xs text-slate-500">Multimodal probability analysis & SHAP feature attributions</p>
          </div>
        </div>
        <span className="text-xs font-mono font-semibold text-slate-400">
          Model: Calibrated XGBoost + SHAP
        </span>
      </div>

      {/* Top Cards: Overall CAD Risk + Vessel Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Overall Risk Card */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-sky-50/50 border border-slate-200/80 flex flex-col justify-between shadow-2xs">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Overall CAD Probability
            </span>
            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-3xl font-black text-slate-900">{cadPct}%</span>
              <span className="text-xs text-slate-500 font-medium">Confidence</span>
            </div>
          </div>
          <div className="mt-3">{getRiskBadge(overall_cad_risk)}</div>
        </div>

        {/* Vessel Risk Cards (LAD, LCX, RCA) */}
        {Object.entries(vessels).map(([vName, vRisk]) => {
          const vPct = Math.round(vRisk * 100);
          const isHigh = vRisk > 0.6;
          const isMed = vRisk > 0.3;

          return (
            <div 
              key={vName} 
              className={`p-4 rounded-xl border flex flex-col justify-between shadow-2xs transition ${
                isHigh 
                  ? 'bg-red-50/40 border-red-200' 
                  : isMed 
                    ? 'bg-amber-50/40 border-amber-200' 
                    : 'bg-emerald-50/30 border-emerald-200'
              }`}
            >
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-slate-800">{vName} Artery</span>
                  <span className={`text-xs font-mono font-bold ${
                    isHigh ? 'text-red-700' : isMed ? 'text-amber-700' : 'text-emerald-700'
                  }`}>
                    {vPct}%
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate">
                  {vName === 'LAD' ? 'Left Anterior Descending' : vName === 'LCX' ? 'Left Circumflex' : 'Right Coronary'}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200/70 h-2 rounded-full mt-3 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-700 ${
                    isHigh ? 'bg-red-600' : isMed ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${vPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* SHAP Clinical Drivers Section */}
      <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/40">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Top Clinical Drivers (SHAP Attribution)
            </span>
            <span className="text-[10px] bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-full font-medium">
              Patient Specific
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Positive impact increases CAD likelihood
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {top_factors.map((factor, idx) => {
            const isIncrease = factor.effect === 'Increases Risk';
            return (
              <div 
                key={idx}
                className="bg-white p-3 rounded-lg border border-slate-200/80 shadow-2xs flex items-center justify-between"
              >
                <div className="space-y-0.5 truncate pr-2">
                  <div className="text-xs font-bold text-slate-800 truncate" title={factor.feature}>
                    {factor.feature}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Impact: <span className="font-mono font-semibold text-slate-600">{factor.impact > 0 ? `+${factor.impact}` : factor.impact}</span>
                  </div>
                </div>

                <div className={`px-2 py-1 rounded text-[11px] font-bold flex items-center space-x-1 whitespace-nowrap ${
                  isIncrease ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  {isIncrease ? <TrendingUp className="w-3.5 h-3.5 text-red-600" /> : <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />}
                  <span>{isIncrease ? 'Increases Risk' : 'Protective'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mandatory Clinical Safety Disclaimer */}
      <div className="bg-amber-50/70 border border-amber-200/80 p-3.5 rounded-xl flex items-start space-x-3 text-xs text-amber-800 shadow-2xs">
        <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold">Medical Decision Support Disclaimer: </span>
          <span>{disclaimer || 'Predictions are for clinical decision support and educational purposes at INNOTECH 2026. Not a substitute for formal diagnostic coronary angiography.'}</span>
        </div>
      </div>
    </div>
  );
}
