
import React, { useState, useCallback, useEffect } from 'react';
import { Store, Collection } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import { UploadIcon } from './icons/UploadIcon';
import { areStringsSimilar } from '../utils/normalization';
import { normalizeStoreName } from '../utils/textFormatter';
import TagDedupModal, { TagMergeGroup } from './TagDedupModal';
import DuplicateResolutionModal, { ResolutionAction } from './DuplicateResolutionModal';
import { parseImportFile, generateSmartMapping, normalizeData, generateCSV, FieldMapping, FileData, COLUMN_ALIASES } from '../utils/importHelpers';

interface ImportModalProps {
  isOpen: boolean;
  mode: 'import' | 'append';
  onClose: () => void;
  onComplete: (parsedStores: Omit<Store, 'collectionId' | 'addedBy' | 'favoritedBy' | 'privateNotes'>[], collectionId: string) => void;
  collections: Collection[];
  activeCollectionId: string | null;
}

const TemplateGuide = () => (
  <div className="bg-brand-bg/50 border border-brand-border rounded-2xl p-6 mb-6">
    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-primary mb-4">
      Smart Import Guide
    </h3>
    <div className="space-y-4">
      <p className="text-xs text-brand-text-secondary leading-relaxed">
        We support <strong>CSV</strong> and <strong>Instagram JSON</strong> files.
        Upload your file and we'll help you map the columns.
      </p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        {Object.entries(COLUMN_ALIASES).slice(0, 6).map(([key, aliases]) => (
          <div key={key} className="space-y-1">
            <p className="text-xs font-bold text-brand-text-primary capitalize">
              {key.replace('_', ' ')}
            </p>
            <p className="text-[10px] text-brand-text-secondary italic leading-tight">
              matches: {aliases.slice(0, 2).join(', ')}...
            </p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

type ImportStep = 'upload' | 'mapping' | 'processing' | 'dedup';

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, mode, onClose, onComplete, collections, activeCollectionId }) => {
  const [selectedCollectionId, setSelectedCollectionId] = useState(activeCollectionId || '');
  const [step, setStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>('');
  const [progress, setProgress] = useState(0);

  // Parsing & Mapping State
  const [rawFile, setRawFile] = useState<FileData | null>(null);
  const [mapping, setMapping] = useState<FieldMapping>({});

  // Dedup State
  const [dedupGroups, setDedupGroups] = useState<TagMergeGroup[]>([]);
  const [pendingStores, setPendingStores] = useState<Omit<Store, 'collectionId' | 'addedBy' | 'favoritedBy' | 'privateNotes'>[] | null>(null);
  const [conflicts, setConflicts] = useState<{ incoming: any, existing: Store }[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSelectedCollectionId(activeCollectionId || (collections.length > 0 ? collections[0].id : ''));
      resetState();
    }
  }, [isOpen, activeCollectionId, collections]);

  const resetState = () => {
    setFile(null);
    setRawFile(null);
    setMapping({});
    setError('');
    setStep('upload');
    setProgress(0);
    setDedupGroups([]);
    setPendingStores(null);
    setConflicts([]);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      processFileSelection(selectedFile);
    }
  };

  const processFileSelection = async (f: File) => {
    const isCsv = f.type === 'text/csv' || f.name.endsWith('.csv');
    const isJson = f.type === 'application/json' || f.name.endsWith('.json');

    if (!isCsv && !isJson) {
      setError('Invalid file type. Please upload a CSV or JSON file.');
      return;
    }
    setFile(f);
    setError('');

    // Auto-analyze immediately to show mapping UI
    try {
      const text = await f.text();
      const data = await parseImportFile(text, f.name);
      setRawFile(data);
      const initialMapping = generateSmartMapping(data.headers);
      setMapping(initialMapping);
      setStep('mapping');
    } catch (err: any) {
      setError(err.message || "Failed to parse file.");
    }
  };

  const downloadNormalized = () => {
    if (!rawFile || !mapping) return;
    const stores = normalizeData(rawFile.rows, mapping);
    const csvContent = generateCSV(stores);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `normalized_${rawFile.fileName.replace(/\.[^/.]+$/, "")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const confirmMappingAndImport = () => {
    if (!rawFile || !selectedCollectionId) return;

    setStep('processing');
    setProgress(20);

    setTimeout(() => { // Small delay to show simple progress
      try {
        const parsedStores = normalizeData(rawFile.rows, mapping);
        if (parsedStores.length === 0) {
          throw new Error("No valid stores found with current mapping.");
        }

        setProgress(50);
        processConflicts(parsedStores);
      } catch (err: any) {
        setError(err.message);
        setStep('mapping');
      }
    }, 500);
  };

  const processConflicts = (incomingStores: Omit<Store, 'collectionId' | 'addedBy' | 'favoritedBy' | 'privateNotes'>[]) => {
    const targetCollection = collections.find(c => c.id === selectedCollectionId);
    if (!targetCollection) { setError("Collection not found"); return; }

    const existingStores = targetCollection.stores;
    const newConflicts: { incoming: any, existing: Store }[] = [];
    const nonConflicting: any[] = [];

    incomingStores.forEach(incoming => {
      const key = normalizeStoreName(incoming.store_name);
      const match = existingStores.find(s => normalizeStoreName(s.store_name) === key);
      if (match) {
        newConflicts.push({ incoming, existing: match });
      } else {
        nonConflicting.push(incoming);
      }
    });

    if (newConflicts.length > 0) {
      setConflicts(newConflicts);
      setPendingStores(nonConflicting);
      setStep('dedup'); // Reusing existing visual wrapper, but handling conflicts
    } else {
      const groups = findSimilarTagGroups(incomingStores);
      if (groups.length > 0) {
        setPendingStores(incomingStores);
        setDedupGroups(groups);
        setStep('dedup');
      } else {
        setProgress(100);
        onComplete(incomingStores, selectedCollectionId);
      }
    }
  };

  const findSimilarTagGroups = (stores: any[]): TagMergeGroup[] => {
    const allTags = Array.from(new Set(stores.flatMap(s => s.tags)));
    const groups: TagMergeGroup[] = [];
    const processed = new Set<string>();

    for (let i = 0; i < allTags.length; i++) {
      const tag = allTags[i];
      if (processed.has(tag)) continue;
      const variants: string[] = [];
      for (let j = i + 1; j < allTags.length; j++) {
        const other = allTags[j];
        if (!processed.has(other) && areStringsSimilar(tag, other, 0.85)) {
          variants.push(other);
          processed.add(other);
        }
      }
      if (variants.length > 0) {
        groups.push({ primary: tag, variants });
        processed.add(tag);
      }
    }
    return groups;
  };

  const handleDedupConfirm = (mappings: Record<string, string>) => {
    if (!pendingStores) return;
    const cleanedStores = pendingStores.map(store => ({
      ...store,
      tags: Array.from(new Set(store.tags.map(tag => mappings[tag] || tag)))
    }));
    onComplete(cleanedStores, selectedCollectionId);
  };

  const handleResolveCollision = (action: ResolutionAction) => {
    if (conflicts.length === 0) return;
    const current = conflicts[0];
    const updatedConflicts = conflicts.slice(1);

    let resolvedStore: any = null;
    if (action === 'merge') {
      resolvedStore = {
        ...current.existing,
        tags: Array.from(new Set([...current.existing.tags, ...current.incoming.tags])),
        website: current.incoming.website || current.existing.website,
        instagram_name: current.incoming.instagram_name || current.existing.instagram_name,
        priceRange: current.incoming.priceRange || current.existing.priceRange
      };
    } else if (action === 'overwrite') {
      resolvedStore = { ...current.existing, ...current.incoming };
    }

    if (resolvedStore) {
      setPendingStores(prev => [...(prev || []), resolvedStore]);
    }
    setConflicts(updatedConflicts);

    if (updatedConflicts.length === 0) {
      const finalStores = pendingStores || [];
      const groups = findSimilarTagGroups(finalStores);
      if (groups.length > 0) {
        setDedupGroups(groups);
      } else {
        onComplete(finalStores, selectedCollectionId);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[150] transition-all" onClick={step !== 'processing' ? onClose : undefined}>
        <div className="bg-brand-surface rounded-3xl shadow-2xl w-full max-w-4xl m-4 p-8 relative overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
          {step !== 'processing' && (
            <button onClick={onClose} className="absolute top-6 right-6 text-brand-text-secondary hover:text-brand-primary z-10 p-2 hover:bg-brand-bg rounded-full transition-all">
              <CloseIcon className="size-5" />
            </button>
          )}

          {step === 'processing' ? (
            <div className="py-24 flex flex-col items-center justify-center text-center">
              <div className="relative size-24 mb-8">
                <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                  <path className="stroke-brand-border" strokeWidth="2" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="stroke-brand-primary transition-all duration-500 ease-out" strokeDasharray={`${progress}, 100`} strokeLinecap="round" strokeWidth="2" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-display font-bold text-xl text-brand-primary">{progress}%</div>
              </div>
              <h2 className="text-2xl font-display font-bold mb-2">Importing...</h2>
              <p className="text-brand-text-secondary max-w-xs text-sm">Validating records and identifying duplicates.</p>
            </div>
          ) : step === 'upload' ? (
            <>
              <h2 className="text-3xl font-bold mb-2 text-brand-text-primary font-display">{mode === 'import' ? 'Import Registry' : 'Append Data'}</h2>
              <p className="text-brand-text-secondary mb-8 text-sm">Upload CSV or JSON files. We'll handle the formatting.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-secondary mb-3">Target Collection</label>
                    <select value={selectedCollectionId} onChange={e => setSelectedCollectionId(e.target.value)} className="w-full bg-brand-bg text-brand-text-primary border border-brand-border rounded-xl p-3 focus:ring-2 focus:ring-brand-primary/20 focus:outline-none font-medium">
                      {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-secondary mb-3">Upload File</label>
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) processFileSelection(f); }}
                      className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all ${isDragging ? 'border-brand-primary bg-brand-primary/5 scale-[1.02]' : 'border-brand-border'}`}
                    >
                      <div className="flex flex-col items-center justify-center">
                        <UploadIcon />
                        <p className="text-brand-text-primary font-bold text-sm mt-4 truncate w-full">{file ? file.name : 'Drop CSV or JSON here'}</p>
                        <label className="mt-6 inline-block cursor-pointer px-6 py-2 bg-brand-primary text-white rounded-full text-xs font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
                          Browse Files
                          <input type="file" accept=".csv,.json" onChange={handleFileChange} className="hidden" />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col h-full">
                  <TemplateGuide />
                </div>
              </div>

              {error && <p className="mt-6 text-xs text-red-500 font-bold text-center bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>}
            </>
          ) : (
            // MAPPING STEP UI
            <div className="flex flex-col h-full min-h-0">
              <div className="flex-none flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-brand-text-primary font-display">Map Columns</h2>
                  <p className="text-brand-text-secondary text-sm">Match columns from <span className="font-mono text-brand-primary bg-brand-bg px-1 rounded">{file?.name}</span> to our schema.</p>
                </div>
                <button onClick={downloadNormalized} className="text-xs font-bold uppercase tracking-wider text-brand-primary hover:bg-brand-primary/10 px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Download Normalized
                </button>
              </div>

              <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar border border-brand-border rounded-xl bg-brand-bg/30 min-h-0">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-brand-bg sticky top-0 z-10">
                    <tr>
                      <th className="p-4 text-xs font-bold uppercase tracking-wider text-brand-text-secondary border-b border-brand-border w-1/3">App Field</th>
                      <th className="p-4 text-xs font-bold uppercase tracking-wider text-brand-text-secondary border-b border-brand-border">File Column</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border">
                    {Object.keys(COLUMN_ALIASES).map(field => (
                      <tr key={field} className="hover:bg-brand-surface transition-colors">
                        <td className="p-4 text-sm font-medium text-brand-text-on-surface-primary capitalize">{field.replace('_', ' ')} <span className="text-red-400 text-xs">{['store_name', 'website'].includes(field) ? '*' : ''}</span></td>
                        <td className="p-4">
                          <select
                            value={mapping[field] || ''}
                            onChange={e => setMapping({ ...mapping, [field]: e.target.value })}
                            className={`w-full p-2 rounded-lg border text-sm focus:ring-2 focus:ring-brand-primary/20 outline-none text-brand-text-on-surface-primary ${!mapping[field] && ['store_name', 'website'].includes(field) ? 'border-red-300 bg-red-50' : 'border-brand-border bg-white'}`}
                          >
                            <option value="">-- Select Column --</option>
                            {rawFile?.headers.map(h => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex-none mt-6 pt-6 border-t border-brand-border flex justify-between items-center bg-brand-surface z-20">
                {/* Footer content unchanged */}
                {error ? (
                  <p className="text-xs text-red-500 font-medium">{error}</p>
                ) : (
                  <p className="text-xs text-brand-text-secondary">
                    Found {rawFile?.rows.length} records.
                    <span className={Object.values(mapping).filter(Boolean).length < 2 ? "text-amber-500 ml-1" : "text-green-600 ml-1"}>
                      {Object.values(mapping).filter(Boolean).length} mapped columns.
                    </span>
                  </p>
                )}
                <div className="flex gap-4">
                  <button onClick={resetState} className="px-6 py-2 text-brand-text-secondary font-bold uppercase tracking-widest text-xs hover:bg-brand-bg rounded-full transition-all">Back</button>
                  <button
                    onClick={confirmMappingAndImport}
                    disabled={!mapping.store_name && !mapping.website}
                    className="px-8 py-3 bg-brand-primary text-white font-bold uppercase tracking-widest text-xs rounded-full hover:opacity-95 transition-all disabled:opacity-30 shadow-lg active:scale-95"
                  >
                    Import {rawFile?.rows.length} Stores
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Conflict Resolution Modals */}
      {conflicts.length > 0 && (
        <DuplicateResolutionModal
          incoming={conflicts[0].incoming}
          existing={conflicts[0].existing}
          onResolve={handleResolveCollision}
          onCancel={() => { setConflicts([]); setPendingStores([]); onClose(); }}
        />
      )}

      {dedupGroups.length > 0 && conflicts.length === 0 && (
        <TagDedupModal
          groups={dedupGroups}
          onConfirm={handleDedupConfirm}
          onCancel={() => pendingStores && onComplete(pendingStores, selectedCollectionId)}
        />
      )}
    </>
  );
};

export default ImportModal;
