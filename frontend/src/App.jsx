import React, { useState } from 'react';
import VitalsForm from './components/VitalsForm';
import HeartViewer3D from './components/HeartViewer3D';
import RiskDashboard from './components/RiskDashboard';
import { Activity } from 'lucide-react';

export default function App() {
  const [predictionResult, setPredictionResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePredict = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://127.0.0.1:8000/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch prediction from FastAPI backend.');
      }

      const data = await response.json();
      setPredictionResult(data);
    } catch (err) {
      console.error(err);
      setError('Could not connect to FastAPI server. Make sure server.py is running on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 py-4 px-8 flex justify-between items-center shadow-md">
        <div className="flex items-center space-x-3">
          <div className="bg-cyan-500/10 p-2 rounded-lg border border-cyan-500/20">
            <Activity className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white">CardioRisk 3D Viz</h1>
            <p className="text-xs text-slate-400">Multimodal AI Hackathon 2026 - Track A Prototype</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-xs text-slate-400 font-medium">FastAPI Engine Connected</span>
        </div>
      </header>

      {/* Error Banner if API fails */}
      {error && (
        <div className="bg-red-900/40 border-b border-red-700 p-3 text-center text-xs text-red-300">
          {error}
        </div>
      )}

      {/* Main Dashboard Layout Grid */}
      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1700px] mx-auto w-full">
        {/* Left Column: Input Form & Presets (4 Cols) */}
        <div className="lg:col-span-4">
          <VitalsForm onPredict={handlePredict} loading={loading} />
        </div>

        {/* Center & Right Column: 3D Viewer + Clinical Analytics Dashboard (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col space-y-6">
          <HeartViewer3D vesselRisks={predictionResult?.vessels} />
          <RiskDashboard predictionResult={predictionResult} />
        </div>
      </main>
    </div>
  );
}
