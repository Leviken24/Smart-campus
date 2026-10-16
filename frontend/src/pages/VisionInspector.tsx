import React, { useEffect, useState, useRef } from 'react';
import {
  ScanEye,
  UploadCloud,
  CheckCircle2,
  XCircle,
  FileImage,
  Building,
  RefreshCw,
  AlertTriangle,
  Inbox,
} from 'lucide-react';
import { observationApi } from '@/services/api/observationApi';
import { ObservationItem, AnalyzeImageResponse } from '@/types/observation';
import { ProvenanceBadge } from '@/components/common/ProvenanceBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { DependencyNotice } from '@/components/common/DependencyNotice';
import { ApiError } from '@/services/api/client';

const MAX_FILE_SIZE_MB = 8;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const VisionInspector: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [candidateBuilding, setCandidateBuilding] = useState<string>('LIB');
  const [validationError, setValidationError] = useState<string | null>(null);

  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalyzeImageResponse | null>(null);
  const [reviewerNote, setReviewerNote] = useState<string>('Verified during facility inspection.');

  const [observations, setObservations] = useState<ObservationItem[]>([]);
  const [loadingObservations, setLoadingObservations] = useState<boolean>(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [endpointNotice, setEndpointNotice] = useState<ApiError | Error | null>(null);

  const fetchObservations = async () => {
    try {
      setLoadingObservations(true);
      setEndpointNotice(null);
      const data = await observationApi.getObservations();
      setObservations(data || []);
    } catch (err: unknown) {
      setObservations([]);
      if (err instanceof Error) {
        setEndpointNotice(err);
      }
    } finally {
      setLoadingObservations(false);
    }
  };

  useEffect(() => {
    fetchObservations();
  }, []);

  const handleFileSelect = (file: File) => {
    setValidationError(null);
    setCurrentAnalysis(null);
    setActionSuccess(null);
    setActionError(null);

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setValidationError('Invalid file type. Please upload a JPEG, PNG, or WebP image.');
      return;
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setValidationError(`File exceeds size limit of ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    try {
      setAnalyzing(true);
      setValidationError(null);
      setActionSuccess(null);
      setActionError(null);

      const res = await observationApi.analyzeImage(selectedFile, candidateBuilding);
      setCurrentAnalysis(res);
      setActionSuccess(`Computer Vision inference completed. New observation created in requires_review status.`);
      await fetchObservations();
    } catch (err: unknown) {
      setCurrentAnalysis(null);
      if (err instanceof ApiError) {
        if (err.status === 404) {
          setActionError('Computer Vision backend route (POST /api/observations/analyze-image) is awaiting backend router registration.');
        } else if (err.status === 502) {
          setActionError('Computer Vision external provider service is currently unreachable from backend.');
        } else {
          setActionError(`Inference failed (${err.status}): ${err.message}`);
        }
      } else if (err instanceof Error) {
        setActionError(err.message);
      } else {
        setActionError('Failed to execute computer vision inference.');
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReviewAction = async (newStatus: 'confirmed' | 'dismissed') => {
    if (!currentAnalysis) return;

    try {
      setActionError(null);
      await observationApi.updateObservation(currentAnalysis.observation_id, {
        status: newStatus,
        building_id: candidateBuilding,
        reviewer_note: reviewerNote,
      });
      setActionSuccess(`Observation ${currentAnalysis.observation_id} updated to ${newStatus.toUpperCase()} and synced with Digital Twin.`);
      setCurrentAnalysis(null);
      setSelectedFile(null);
      setPreviewUrl(null);
      await fetchObservations();
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 404) {
        setActionError('Observation review update endpoint (PATCH /api/observations/{id}) is awaiting backend implementation.');
      } else if (err instanceof Error) {
        setActionError(`Failed to update observation status: ${err.message}`);
      } else {
        setActionError('Failed to update observation status.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <ScanEye className="w-6 h-6 text-cyan-400" />
            Computer Vision Inspector
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Vision-to-Action pipeline: Upload campus imagery, run dedicated CV inference, and review detected anomalies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ProvenanceBadge type="observed" />
          <ProvenanceBadge type="review_pending" />
        </div>
      </div>

      {/* Backend Dependency Banner */}
      {endpointNotice && (
        <DependencyNotice
          endpoint="/api/observations"
          method="GET / POST"
          owner="Person 3 (CV Adapter) & Person 2 (Observation DB Model)"
          description="Awaiting Computer Vision inference router and observation repository. Credential handling is strictly preserved on the backend."
          error={endpointNotice}
          onRetry={fetchObservations}
        />
      )}

      {/* Success Notification */}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl border border-emerald-800/80 bg-emerald-950/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Error Notification */}
      {actionError && (
        <div className="p-3.5 rounded-xl border border-rose-800/80 bg-rose-950/40 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload & Inspection Panel (Left 7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-panel p-6">
            <h3 className="text-sm font-semibold text-slate-100 mb-4 flex items-center justify-between">
              <span>Image Upload & Analysis</span>
              <span className="text-[11px] font-mono text-slate-400">Max {MAX_FILE_SIZE_MB}MB (JPEG, PNG, WebP)</span>
            </h3>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-xl p-8 text-center cursor-pointer transition-all bg-slate-950/60 hover:bg-slate-900/60 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />

              {previewUrl ? (
                <div className="space-y-3">
                  <img
                    src={previewUrl}
                    alt="Inspection preview"
                    className="max-h-56 mx-auto rounded-lg border border-slate-700 shadow-md object-contain"
                  />
                  <p className="text-xs text-slate-300 font-mono">
                    {selectedFile?.name} ({(selectedFile ? selectedFile.size / 1024 : 0).toFixed(0)} KB)
                  </p>
                  <p className="text-[11px] text-cyan-400 group-hover:underline">
                    Click or drag new image to replace
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-slate-400 group-hover:text-cyan-400 group-hover:border-cyan-600 transition-colors">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium text-slate-200">
                    Drag and drop campus photo here, or browse files
                  </p>
                  <p className="text-xs text-slate-400">
                    Supports waste accumulation or visible leak detection
                  </p>
                </div>
              )}
            </div>

            {/* Validation Error */}
            {validationError && (
              <p className="mt-3 text-xs text-rose-400 font-medium">{validationError}</p>
            )}

            {/* Candidate Building & Action Toolbar */}
            <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-400">Target Facility:</span>
                <select
                  value={candidateBuilding}
                  onChange={(e) => setCandidateBuilding(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg text-xs px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                >
                  <option value="LIB">Library (LIB)</option>
                  <option value="ACADEMIC">Academic Block (ACADEMIC)</option>
                  <option value="RESIDENCE">Student Residence (RESIDENCE)</option>
                </select>
              </div>

              <button
                onClick={handleAnalyze}
                disabled={!selectedFile || analyzing}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-cyan-950/60"
              >
                <ScanEye className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
                {analyzing ? 'Running Dedicated Vision API...' : 'Analyze Image with Computer Vision'}
              </button>
            </div>
          </div>

          {/* Active Inference Review Card */}
          {currentAnalysis && (
            <div className="glass-panel p-6 border-amber-800/80 bg-slate-900/90 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-100">
                      Inference Result: {currentAnalysis.observation_type.replace('_', ' ').toUpperCase()}
                    </h4>
                    <ProvenanceBadge type="review_pending" size="sm" />
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    ID: {currentAnalysis.observation_id} &bull; Target: {currentAnalysis.building_id || candidateBuilding}
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  Certainty: {currentAnalysis.provider_metadata?.certainty_level ? currentAnalysis.provider_metadata.certainty_level.toUpperCase() : 'MEDIUM'}
                </span>
              </div>

              <p className="text-xs text-slate-200 p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                {currentAnalysis.description}
              </p>

              {/* Detected Labels */}
              {currentAnalysis.provider_metadata?.detected_labels && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-slate-400">Detected Labels:</span>
                  {currentAnalysis.provider_metadata.detected_labels.map((lbl) => (
                    <span
                      key={lbl}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/70 text-cyan-300 border border-cyan-800/60"
                    >
                      {lbl}
                    </span>
                  ))}
                </div>
              )}

              {/* Human Review Inputs */}
              <div className="pt-2 border-t border-slate-800 space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Reviewer Verification Note:
                  </label>
                  <input
                    type="text"
                    value={reviewerNote}
                    onChange={(e) => setReviewerNote(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => handleReviewAction('dismissed')}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                    Dismiss
                  </button>
                  <button
                    onClick={() => handleReviewAction('confirmed')}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-slate-950 transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-950/50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />
                    Confirm & Publish to Digital Twin
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Observations Audit Queue (Right 5 Cols) */}
        <div className="lg:col-span-5 glass-panel p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <FileImage className="w-4 h-4 text-cyan-400" />
                Observations Register ({observations.length})
              </h3>
              <button
                onClick={fetchObservations}
                className="text-slate-400 hover:text-slate-200 text-xs"
                title="Refresh observations"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {loadingObservations ? (
              <LoadingSpinner message="Querying registered observations..." />
            ) : observations.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <Inbox className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">
                  No visual observations recorded yet.
                </p>
                <p className="text-[11px] text-slate-500">
                  Upload an image on the left to initiate the Computer Vision pipeline.
                </p>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
                {observations.map((obs) => (
                  <div
                    key={obs.id}
                    className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-semibold text-slate-200">
                          {obs.observation_type.replace('_', ' ').toUpperCase()}
                        </span>
                        <p className="text-[10px] text-slate-400 font-mono">
                          Facility: {obs.building_id || 'Campus'} &bull; {new Date(obs.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <ProvenanceBadge type={obs.status} size="sm" />
                    </div>
                    <p className="text-slate-300 text-[11px]">{obs.description}</p>
                    {obs.reviewer_note && (
                      <p className="text-[10px] text-slate-400 italic border-l-2 border-emerald-600 pl-2">
                        Note: {obs.reviewer_note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono">
            Constitutional Rule: New CV detections initialize in requires_review state.
          </div>
        </div>
      </div>
    </div>
  );
};
