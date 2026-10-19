import React from 'react';
import { AlertCircle, Activity, ShieldAlert } from 'lucide-react';

export default function RiskDashboard({ predictionResult }) {
    if (!predictionResult) {
        return (
            <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700 h-[85vh] flex items-center justify-center text-slate-400">
                <p className="text-center">Submit patient vitals or select a preset to analyze risk and view SHAP clinical explanations.</p>
            </div>
        );
    }

    const { overall_cad_risk, vessels, top_factors, disclaimer } = predictionResult;

    const getRiskBadge = (risk) => {
        if (risk > 0.6) return <span className="px-2 py-0.5 bg-red-900/50 text-red-400 border border-red-700 rounded text-xs font-semibold">Critical (&gt;60%)</span>;
        if (risk > 0.3) return <span className="px-2 py-0.5 bg-amber-900/50 text-amber-400 border border-amber-700 rounded text-xs font-semibold">Moderate (30-60%)</span>;
        return <span className="px-2 py-0.5 bg-green-900/50 text-green-400 border border-green-700 rounded text-xs font-semibold">Normal (&lt;30%)</span>;
    };

    return (
        <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700 h-[85vh] flex flex-col space-y-4 overflow-y-auto">
            <h2 className="text-xl font-bold text-cyan-400 flex items-center">
                <Activity className="w-5 h-5 mr-2" /> Clinical Risk & Explainability
            </h2>

            {/* Overall CAD Risk Card */}
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 flex items-center justify-between">
                <div>
                    <p className="text-xs text-slate-400 uppercase font-semibold">Overall CAD Status</p>
                    <p className="text-2xl font-black text-white mt-1">{(overall_cad_risk * 100).toFixed(1)}%</p>
                </div>
                <div>{getRiskBadge(overall_cad_risk)}</div>
            </div>

            {/* Vessel Breakdown */}
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                <p className="text-xs text-slate-400 uppercase font-semibold mb-3">Coronary Vessel Stenosis Risks</p>
                <div className="space-y-3">
                    {Object.entries(vessels || {}).map(([vessel, risk]) => (
                        <div key={vessel}>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium text-slate-300">{vessel} Branch</span>
                                <span className="text-slate-400">{(risk * 100).toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-500 ${risk > 0.6 ? 'bg-red-500' : risk > 0.3 ? 'bg-amber-500' : 'bg-green-500'
                                        }`}
                                    style={{ width: `${risk * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* SHAP Top Factors Breakdown */}
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 flex-1 flex flex-col">
                <p className="text-xs text-slate-400 uppercase font-semibold mb-2">Top Clinical Drivers (SHAP Attribution)</p>
                <div className="space-y-2 overflow-y-auto flex-1 pr-1">
                    {top_factors?.map((factor, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-800/80 p-2.5 rounded border border-slate-700/50 text-xs">
                            <span className="font-medium text-slate-200">{factor.feature}</span>
                            <span className={factor.effect === 'Increases Risk' ? 'text-red-400 font-semibold' : 'text-green-400 font-semibold'}>
                                {factor.effect} ({factor.impact > 0 ? `+${factor.impact}` : factor.impact})
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Mandatory Clinical Safety Disclaimer */}
            <div className="bg-amber-950/30 border border-amber-700/50 p-3 rounded-lg flex items-start space-x-2 text-xs text-amber-300">
                <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p>{disclaimer}</p>
            </div>
        </div>
    );
}