import React, { useState, useEffect } from 'react';
import demoPresets from '../../../demo_presets.json';
import { 
  Users, 
  Stethoscope, 
  FlaskConical, 
  Activity, 
  CheckCircle2, 
  AlertTriangle,
  Flame,
  ArrowRight,
  Search,
  Database,
  Hash
} from 'lucide-react';

// Clinical grouping of the 55 features for high clinical ergonomics
const FEATURE_GROUPS = {
  vitals: {
    title: 'Core Vitals & History',
    icon: Stethoscope,
    fields: [
      { key: 'Age', label: 'Patient Age', unit: 'yrs', type: 'number' },
      { key: 'Sex', label: 'Sex', type: 'select', options: ['Male', 'Fmale'] },
      { key: 'Weight', label: 'Body Weight', unit: 'kg', type: 'number' },
      { key: 'Length', label: 'Height', unit: 'cm', type: 'number' },
      { key: 'BMI', label: 'BMI Index', unit: 'kg/m²', type: 'number' },
      { key: 'BP', label: 'Blood Pressure', unit: 'mmHg', type: 'number' },
      { key: 'PR', label: 'Pulse Rate', unit: 'bpm', type: 'number' },
      { key: 'HTN', label: 'Hypertension', type: 'select', options: [0, 1] },
      { key: 'DM', label: 'Diabetes Mellitus', type: 'select', options: [0, 1] },
      { key: 'Current Smoker', label: 'Current Smoker', type: 'select', options: [0, 1] },
      { key: 'EX-Smoker', label: 'Ex-Smoker', type: 'select', options: [0, 1] },
      { key: 'FH', label: 'Family History CAD', type: 'select', options: [0, 1] },
      { key: 'Obesity', label: 'Obesity', type: 'select', options: ['Y', 'N'] }
    ]
  },
  labs: {
    title: 'Lipid Panel & Biomarkers',
    icon: FlaskConical,
    fields: [
      { key: 'FBS', label: 'Fasting Blood Sugar', unit: 'mg/dL', type: 'number' },
      { key: 'LDL', label: 'LDL Cholesterol', unit: 'mg/dL', type: 'number' },
      { key: 'HDL', label: 'HDL Cholesterol', unit: 'mg/dL', type: 'number' },
      { key: 'TG', label: 'Triglycerides', unit: 'mg/dL', type: 'number' },
      { key: 'CR', label: 'Serum Creatinine', unit: 'mg/dL', type: 'number' },
      { key: 'BUN', label: 'Blood Urea Nitrogen', unit: 'mg/dL', type: 'number' },
      { key: 'ESR', label: 'ESR Rate', unit: 'mm/hr', type: 'number' },
      { key: 'HB', label: 'Hemoglobin', unit: 'g/dL', type: 'number' },
      { key: 'K', label: 'Potassium (K+)', unit: 'mEq/L', type: 'number' },
      { key: 'Na', label: 'Sodium (Na+)', unit: 'mEq/L', type: 'number' },
      { key: 'WBC', label: 'White Blood Cell Count', unit: '/mcL', type: 'number' },
      { key: 'PLT', label: 'Platelet Count', unit: '10³/mcL', type: 'number' }
    ]
  },
  ecg: {
    title: 'Symptoms & ECG Findings',
    icon: Activity,
    fields: [
      { key: 'Typical Chest Pain', label: 'Typical Angina', type: 'select', options: [0, 1] },
      { key: 'Dyspnea', label: 'Shortness of Breath', type: 'select', options: ['Y', 'N'] },
      { key: 'Function Class', label: 'NYHA Function Class', unit: '0-4', type: 'number' },
      { key: 'St Elevation', label: 'ST Elevation', type: 'select', options: [0, 1] },
      { key: 'St Depression', label: 'ST Depression', type: 'select', options: [0, 1] },
      { key: 'Tinversion', label: 'T-Wave Inversion', type: 'select', options: [0, 1] },
      { key: 'Q Wave', label: 'Pathological Q Wave', type: 'select', options: [0, 1] },
      { key: 'EF-TTE', label: 'Ejection Fraction (EF)', unit: '%', type: 'number' },
      { key: 'Region RWMA', label: 'Regional Wall Motion (RWMA)', type: 'number' },
      { key: 'Systolic Murmur', label: 'Systolic Murmur', type: 'select', options: ['Y', 'N'] },
      { key: 'Diastolic Murmur', label: 'Diastolic Murmur', type: 'select', options: ['Y', 'N'] },
      { key: 'VHD', label: 'Valvular Heart Disease', type: 'select', options: ['N', 'Mild', 'Severe'] }
    ]
  }
};

const PRESET_SUMMARIES = {
  'Patient 1 - Healthy / Low Risk': {
    id: 3,
    label: 'Case 1: Low Risk (Normal)',
    badge: 'Patent (<30%)',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    details: '66yo Female, Non-smoker, Normal Lipids, 10% LAD'
  },
  'Patient 2 - Single-Vessel (LAD) Stenosis': {
    id: 1,
    label: 'Case 2: Acute LAD ("Widowmaker")',
    badge: 'LAD Stenosis (92%)',
    badgeClass: 'bg-red-50 text-red-700 border-red-200',
    details: '55yo Male, Ex-smoker, ST Elevation + T Inversion'
  },
  'Patient 3 - Severe Multi-Vessel CAD': {
    id: 0,
    label: 'Case 3: Severe Multi-Vessel CAD',
    badge: 'Multi-Vessel (86% LAD, 77% RCA)',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-300',
    details: '50yo Male, Active Smoker, Multi-vessel occlusion'
  }
};

export default function VitalsForm({ onPredict, loading }) {
  const [formData, setFormData] = useState({});
  const [selectedPreset, setSelectedPreset] = useState('Patient 1 - Healthy / Low Risk');
  const [activeTab, setActiveTab] = useState('vitals');
  
  // Real patient records (303 records from UCI dataset)
  const [datasetPatients, setDatasetPatients] = useState([]);
  const [patientIdInput, setPatientIdInput] = useState(3);
  const [activeGroundTruth, setActiveGroundTruth] = useState(null);

  // Load all 303 real patient records from public/dataset_patients.json
  useEffect(() => {
    fetch('/dataset_patients.json')
      .then(res => res.json())
      .then(data => {
        setDatasetPatients(data);
        if (data && data.length > 3) {
          const defaultPatient = data[3]; // Patient #3 (healthy)
          setPatientIdInput(3);
          setActiveGroundTruth(defaultPatient.ground_truth);
          setFormData(defaultPatient.patient_data);
          onPredict(defaultPatient.patient_data);
        }
      })
      .catch(err => {
        console.warn('Could not load dataset_patients.json, using fallback presets', err);
        const firstKey = Object.keys(demoPresets)[0];
        if (firstKey) {
          setFormData(demoPresets[firstKey].patient_data);
          onPredict(demoPresets[firstKey].patient_data);
        }
      });
  }, []);

  // Handle changing to a specific real patient row #0 to #302
  const handleSelectPatientNumber = (num) => {
    const id = parseInt(num, 10);
    if (isNaN(id) || id < 0 || id >= (datasetPatients.length || 303)) return;

    setPatientIdInput(id);
    setSelectedPreset(''); // Custom row selected

    if (datasetPatients[id]) {
      const p = datasetPatients[id];
      setActiveGroundTruth(p.ground_truth);
      setFormData(p.patient_data);
      onPredict(p.patient_data);
    }
  };

  const handleSelectPreset = (key) => {
    setSelectedPreset(key);
    if (demoPresets[key]) {
      const data = demoPresets[key].patient_data;
      setFormData(data);
      const matched = PRESET_SUMMARIES[key];
      if (matched && datasetPatients[matched.id]) {
        setPatientIdInput(matched.id);
        setActiveGroundTruth(datasetPatients[matched.id].ground_truth);
      }
      onPredict(data);
    }
  };

  const handleChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: isNaN(value) ? value : Number(value),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onPredict(formData);
  };

  const currentGroup = FEATURE_GROUPS[activeTab];

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/90 flex flex-col h-full">
      {/* Title */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Patient Clinical Vitals
          </h2>
          <p className="text-xs text-slate-500">UCI Z-Alizadeh Sani Cohort (303 Hospital Patients)</p>
        </div>
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-100">
          55 Biomarkers
        </span>
      </div>

      {/* Real Patient Record Search Stepper (#0 to #302) */}
      <div className="mb-4 p-3 bg-slate-50/80 rounded-xl border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-sky-600" />
            Test Real Patient Record:
          </label>
          <span className="text-[10px] text-slate-500 font-mono">Row 0 to 302</span>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">#</span>
            <input
              type="number"
              min="0"
              max="302"
              value={patientIdInput}
              onChange={(e) => handleSelectPatientNumber(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg pl-7 pr-3 py-1.5 text-xs font-bold text-slate-900 focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              placeholder="e.g. 0 to 302"
            />
          </div>
          <button
            type="button"
            onClick={() => handleSelectPatientNumber(Math.max(0, patientIdInput - 1))}
            className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-xs font-bold rounded-lg text-slate-700"
          >
            ← Prev
          </button>
          <button
            type="button"
            onClick={() => handleSelectPatientNumber(Math.min(302, patientIdInput + 1))}
            className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-xs font-bold rounded-lg text-slate-700"
          >
            Next →
          </button>
        </div>

        {/* Real Hospital Ground-Truth Angiogram Comparison Card */}
        {activeGroundTruth && (
          <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
            <span className="font-semibold text-slate-600">Actual Hospital Finding:</span>
            <div className="flex space-x-1.5">
              <span className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                activeGroundTruth.LAD === 'Stenotic' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                LAD: {activeGroundTruth.LAD}
              </span>
              <span className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                activeGroundTruth.LCX === 'Stenotic' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                LCX: {activeGroundTruth.LCX}
              </span>
              <span className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                activeGroundTruth.RCA === 'Stenotic' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                RCA: {activeGroundTruth.RCA}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Patient Demo Presets Quick Cards */}
      <div className="mb-4 space-y-1.5">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Or Select Benchmark Case Study
        </label>
        <div className="space-y-1.5">
          {Object.keys(PRESET_SUMMARIES).map((presetKey) => {
            const pInfo = PRESET_SUMMARIES[presetKey];
            const isSelected = selectedPreset === presetKey;

            return (
              <button
                type="button"
                key={presetKey}
                onClick={() => handleSelectPreset(presetKey)}
                className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between shadow-2xs ${
                  isSelected 
                    ? 'bg-sky-50/80 border-sky-400 ring-1 ring-sky-300' 
                    : 'bg-white hover:bg-slate-50 border-slate-200'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-slate-900">{pInfo.label}</div>
                  <div className="text-[11px] text-slate-500">{pInfo.details}</div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${pInfo.badgeClass}`}>
                  {pInfo.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Categorized Clinical Navigation Tabs */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100/90 rounded-xl mb-4 border border-slate-200/60">
        {Object.entries(FEATURE_GROUPS).map(([tabKey, group]) => {
          const Icon = group.icon;
          const isActive = activeTab === tabKey;
          return (
            <button
              type="button"
              key={tabKey}
              onClick={() => setActiveTab(tabKey)}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition ${
                isActive 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5 text-sky-600" />
              <span className="truncate">{group.title.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Form Fields for Active Tab */}
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between overflow-hidden">
        <div className="overflow-y-auto pr-1 max-h-[300px] space-y-3">
          <div className="grid grid-cols-2 gap-2.5">
            {currentGroup.fields.map((field) => {
              const val = formData[field.key];

              return (
                <div key={field.key} className="flex flex-col">
                  <label className="text-[11px] font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span className="truncate" title={field.label}>{field.label}</span>
                    {field.unit && (
                      <span className="text-[10px] text-slate-400 font-mono font-normal">
                        {field.unit}
                      </span>
                    )}
                  </label>

                  {field.type === 'select' ? (
                    <select
                      value={val !== undefined ? val : ''}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      className="bg-white border border-slate-300 hover:border-slate-400 rounded-lg p-1.5 text-xs text-slate-800 font-medium focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:outline-none transition shadow-2xs"
                    >
                      {field.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="number"
                      step="any"
                      value={val !== undefined ? val : ''}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      className="bg-white border border-slate-300 hover:border-slate-400 rounded-lg p-1.5 text-xs text-slate-800 font-medium focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:outline-none transition shadow-2xs"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-4 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl transition duration-200 shadow-md disabled:opacity-50 flex items-center justify-center space-x-2 text-xs"
        >
          <span>{loading ? 'Evaluating Model & SHAP Explainer...' : 'Run Coronary Risk Analysis'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
