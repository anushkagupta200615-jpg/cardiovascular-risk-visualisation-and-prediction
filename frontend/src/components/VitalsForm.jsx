import React, { useState, useEffect } from 'react';
import demoPresets from '../../../demo_presets.json';

export default function VitalsForm({ onPredict, loading }) {
  const [formData, setFormData] = useState({});
  const [selectedPreset, setSelectedPreset] = useState('');

  // Load the first preset by default on mount
  useEffect(() => {
    const firstKey = Object.keys(demoPresets)[0];
    if (firstKey) {
      setSelectedPreset(firstKey);
      setFormData(demoPresets[firstKey].patient_data);
    }
  }, []);

  const handlePresetChange = (e) => {
    const key = e.target.value;
    setSelectedPreset(key);
    if (demoPresets[key]) {
      setFormData(demoPresets[key].patient_data);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: isNaN(value) ? value : Number(value),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onPredict(formData);
  };

  return (
    <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700 h-[85vh] flex flex-col">
      <h2 className="text-xl font-bold mb-4 text-cyan-400">Patient Clinical Vitals</h2>

      {/* Demo Preset Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-300 mb-1">Load Demo Patient Preset</label>
        <select
          value={selectedPreset}
          onChange={handlePresetChange}
          className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-cyan-500"
        >
          {Object.keys(demoPresets).map((presetName) => (
            <option key={presetName} value={presetName}>
              {presetName}
            </option>
          ))}
        </select>
      </div>

      {/* Scrollable Form Inputs */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-2">
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(formData).map(([key, val]) => (
            <div key={key} className="flex flex-col">
              <label className="text-xs font-medium text-slate-400 mb-1 truncate">{key}</label>
              <input
                type="text"
                name={key}
                value={val !== undefined ? val : ''}
                onChange={handleChange}
                className="bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-6 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2.5 px-4 rounded-lg transition duration-200 shadow-md disabled:opacity-50"
        >
          {loading ? 'Analyzing Risk...' : 'Run Prediction & 3D Mapping'}
        </button>
      </form>
    </div>
  );
}