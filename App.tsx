import React, { useState, useRef, useCallback } from 'react';
import { editImageWithGemini } from './services/geminiService';
import { AppStatus } from './types';
import Button from './components/Button';
import { UploadCloudIcon, WandIcon, DownloadIcon, XIcon, PhotoIcon, SparklesIcon, RefreshIcon } from './components/Icons';

const SUGGESTED_PROMPTS = [
  "Add a cinematic retro filter",
  "Remove the background",
  "Make it look like a watercolor painting",
  "Add fireworks in the sky",
  "Enhance the lighting and contrast",
  "Turn this into a cyberpunk scene"
];

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError("Please upload a valid image file.");
      return;
    }

    // Reset state for new image
    setOriginalImage(null);
    setGeneratedImage(null);
    setError(null);
    setMimeType(file.type);
    setStatus(AppStatus.IDLE);

    const reader = new FileReader();
    reader.onloadend = () => {
      setOriginalImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!originalImage || !prompt.trim()) return;

    setStatus(AppStatus.LOADING);
    setError(null);

    try {
      const result = await editImageWithGemini(originalImage, mimeType, prompt);
      setGeneratedImage(result);
      setStatus(AppStatus.SUCCESS);
    } catch (err: any) {
      setError(err.message || "Something went wrong during generation.");
      setStatus(AppStatus.ERROR);
    }
  };

  const handleReset = () => {
    setOriginalImage(null);
    setGeneratedImage(null);
    setPrompt('');
    setStatus(AppStatus.IDLE);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `nanoedit-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-brand-500/30">
      
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-brand-500 to-purple-600 p-2 rounded-lg">
              <SparklesIcon className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-400 to-purple-400">
              NanoEdit AI
            </h1>
          </div>
          <div className="text-sm font-medium text-slate-400 hidden sm:block">
            Powered by Gemini 2.5 Flash
          </div>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-start p-4 sm:p-8 max-w-7xl mx-auto w-full gap-8">
        
        {/* Intro / Hero - Only show if no image uploaded */}
        {!originalImage && (
          <div className="text-center max-w-2xl mx-auto mt-12 mb-8 animate-fade-in-up">
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6">
              Reimagine your photos with <span className="text-brand-400">Nano Banana</span>
            </h2>
            <p className="text-lg text-slate-400 mb-8 leading-relaxed">
              Upload an image and use natural language to add filters, remove objects, or completely transform your scene.
            </p>
            
            <div className="flex justify-center">
               <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept="image/*"
              />
              <Button 
                onClick={() => fileInputRef.current?.click()} 
                className="px-8 py-4 text-lg shadow-brand-500/20"
                icon={<UploadCloudIcon />}
              >
                Upload Image to Start
              </Button>
            </div>
          </div>
        )}

        {/* Main Workspace */}
        {originalImage && (
          <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
            
            {/* Left Column: Input */}
            <div className="flex flex-col gap-6">
              
              {/* Image Preview Card */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 shadow-xl backdrop-blur-sm relative group overflow-hidden">
                <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur text-xs font-bold px-3 py-1 rounded-full text-slate-300 z-10 border border-slate-700">
                  ORIGINAL
                </div>
                <button 
                  onClick={handleReset}
                  className="absolute top-4 right-4 bg-slate-900/80 hover:bg-red-900/80 p-2 rounded-full text-slate-300 hover:text-red-200 transition-colors z-10 border border-slate-700"
                  title="Remove image"
                >
                  <XIcon className="w-4 h-4" />
                </button>
                <div className="aspect-[4/3] w-full rounded-xl overflow-hidden bg-slate-900/50 flex items-center justify-center relative">
                    <img 
                      src={originalImage} 
                      alt="Original" 
                      className="w-full h-full object-contain"
                    />
                </div>
              </div>

              {/* Prompt Controls */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 flex flex-col gap-4 shadow-xl">
                <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <WandIcon className="w-4 h-4 text-brand-400" />
                  How should Gemini edit this?
                </label>
                
                <div className="relative">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g. 'Add a pair of sunglasses' or 'Make it look like a sketch'"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all resize-none h-32"
                    disabled={status === AppStatus.LOADING}
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-slate-500">
                    {prompt.length} chars
                  </div>
                </div>

                {/* Suggestions */}
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_PROMPTS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPrompt(p)}
                      disabled={status === AppStatus.LOADING}
                      className="text-xs bg-slate-700/50 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg transition-colors border border-slate-600/50"
                    >
                      {p}
                    </button>
                  ))}
                </div>

                {error && (
                  <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-xl text-red-200 text-sm flex items-start gap-2">
                    <span className="mt-0.5">⚠️</span>
                    {error}
                  </div>
                )}

                <Button 
                  onClick={handleGenerate} 
                  isLoading={status === AppStatus.LOADING}
                  disabled={!prompt.trim()}
                  className="w-full mt-2"
                  icon={<SparklesIcon />}
                >
                  {status === AppStatus.LOADING ? 'Generating...' : 'Generate Edit'}
                </Button>
              </div>
            </div>

            {/* Right Column: Output */}
            <div className="flex flex-col gap-6">
              <div className={`h-full bg-slate-800/50 border border-slate-700 rounded-2xl p-4 shadow-xl backdrop-blur-sm relative flex flex-col transition-all duration-500 ${status === AppStatus.SUCCESS ? 'border-brand-500/30 shadow-brand-900/20' : ''}`}>
                
                <div className="absolute top-4 left-4 bg-brand-900/80 backdrop-blur text-xs font-bold px-3 py-1 rounded-full text-brand-200 z-10 border border-brand-700/50">
                  GENERATED
                </div>

                <div className="flex-grow aspect-[4/3] w-full rounded-xl overflow-hidden bg-slate-900/50 flex items-center justify-center relative border border-slate-800">
                  {generatedImage ? (
                    <img 
                      src={generatedImage} 
                      alt="Generated" 
                      className="w-full h-full object-contain animate-fade-in"
                    />
                  ) : (
                    <div className="text-slate-500 flex flex-col items-center gap-4 p-8 text-center">
                      {status === AppStatus.LOADING ? (
                         <div className="flex flex-col items-center gap-4">
                            <div className="relative">
                              <div className="w-16 h-16 border-4 border-slate-700 border-t-brand-500 rounded-full animate-spin"></div>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <SparklesIcon className="w-6 h-6 text-brand-500 animate-pulse" />
                              </div>
                            </div>
                            <p className="text-brand-200 font-medium animate-pulse">Gemini is thinking...</p>
                            <p className="text-xs text-slate-500 max-w-xs">This uses the Nano Banana model, so it's optimized for speed!</p>
                         </div>
                      ) : (
                        <>
                          <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center">
                            <PhotoIcon className="w-10 h-10 opacity-20" />
                          </div>
                          <p>Your masterpiece will appear here</p>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {generatedImage && (
                  <div className="mt-4 flex gap-3 animate-fade-in-up">
                    <Button 
                      onClick={handleDownload} 
                      variant="primary" 
                      className="flex-1"
                      icon={<DownloadIcon />}
                    >
                      Download
                    </Button>
                     <Button 
                      onClick={() => setGeneratedImage(null)} 
                      variant="ghost"
                      icon={<RefreshIcon />}
                    >
                      Clear
                    </Button>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 p-6 text-center text-slate-500 text-sm bg-slate-900">
        <p>&copy; {new Date().getFullYear()} NanoEdit AI. Built with Google Gemini 2.5 Flash.</p>
      </footer>
    </div>
  );
};

export default App;