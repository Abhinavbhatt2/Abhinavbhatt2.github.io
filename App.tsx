
import React, { useState, useCallback, useRef } from 'react';
import TextAreaInput from './components/TextAreaInput';
import Button from './components/Button';
import LoadingSpinner from './components/LoadingSpinner';
import { generateAlignmentSummary, generateCoverLetter, refineResumeForATS } from './services/geminiService';
import { SparklesIcon, DocumentTextIcon, BriefcaseIcon, LightBulbIcon, UploadIcon, XCircleIcon, EnvelopeIcon, ClipboardIcon, DocumentCheckIcon, DownloadIcon } from './components/icons';
import * as mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';

// Configure pdf.js worker. The '@ts-ignore' is used because the worker import is special.
// @ts-ignore
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.4.168/build/pdf.worker.mjs`;

// Helper component for rendering markdown-like text
const MarkdownRenderer: React.FC<{ text: string }> = ({ text }) => {
  const sections = text.split(/\n\s*\n/); // Split by double newlines

  return (
    <div className="space-y-4">
      {sections.map((section, index) => {
        if (section.startsWith('**') && section.includes('**')) {
          const titleEnd = section.indexOf('**', 2);
          const title = section.substring(2, titleEnd);
          const content = section.substring(titleEnd + 2).trim();
          return (
            <div key={index}>
              <h3 className="text-lg font-semibold text-primary mb-1">{title}</h3>
              <p className="text-textDark whitespace-pre-line">{content}</p>
            </div>
          );
        }
        if (section.startsWith('* ')) { // Basic list item
            const listItems = section.split('\n').map(item => item.replace(/^\*\s*/, ''));
            return (
                <ul key={index} className="list-disc list-inside ml-4 space-y-1 text-textDark">
                    {listItems.map((item, idx) => <li key={idx}>{item}</li>)}
                </ul>
            );
        }
        const numberedListItemMatch = section.match(/^(\d+\.\s*\*?.*?\*?:\s*)/);
        if (numberedListItemMatch) {
            const heading = numberedListItemMatch[1];
            const restOfContent = section.substring(heading.length).trim();
            return (
                 <div key={index}>
                    <p className="text-textDark whitespace-pre-line">
                        <span className="font-semibold">{heading}</span>
                        {restOfContent}
                    </p>
                 </div>
            );
        }
        return <p key={index} className="text-textDark whitespace-pre-line">{section}</p>;
      })}
    </div>
  );
};


const App: React.FC = () => {
  const [resume, setResume] = useState<string>('');
  const [jobDescriptions, setJobDescriptions] = useState<string>('');
  const [summary, setSummary] = useState<string | null>(null);
  const [coverLetter, setCoverLetter] = useState<string | null>(null);
  const [refinedResume, setRefinedResume] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [jobDescError, setJobDescError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<'analyze' | 'cover-letter' | 'refine-resume' | null>(null);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearResults = () => {
    setSummary(null);
    setCoverLetter(null);
    setRefinedResume(null);
  }

  const validateInputs = (): boolean => {
    let isValid = true;
    if (!resume.trim()) {
      setResumeError("Resume content cannot be empty.");
      isValid = false;
    } else {
      setResumeError(null);
    }
    if (!jobDescriptions.trim()) {
      setJobDescError("Job description(s) cannot be empty.");
      isValid = false;
    } else {
      setJobDescError(null);
    }
    return isValid;
  };

  const handleSummarize = useCallback(async () => {
    if (!validateInputs()) return;
    setActiveAction('analyze');
    setError(null);
    clearResults();

    try {
      const result = await generateAlignmentSummary(resume, jobDescriptions);
      setSummary(result);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred.");
      }
      setSummary(null);
    } finally {
      setActiveAction(null);
    }
  }, [resume, jobDescriptions]);

  const handleGenerateCoverLetter = useCallback(async () => {
    if (!validateInputs()) return;
    setActiveAction('cover-letter');
    setError(null);
    clearResults();

    try {
        const result = await generateCoverLetter(resume, jobDescriptions);
        setCoverLetter(result);
    } catch (err: unknown) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError("An unexpected error occurred.");
        }
        setCoverLetter(null);
    } finally {
        setActiveAction(null);
    }
  }, [resume, jobDescriptions]);
  
  const handleRefineResume = useCallback(async () => {
    if (!validateInputs()) return;
    setActiveAction('refine-resume');
    setError(null);
    clearResults();

    try {
        const result = await refineResumeForATS(resume, jobDescriptions);
        setRefinedResume(result);
    } catch (err: unknown) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError("An unexpected error occurred.");
        }
        setRefinedResume(null);
    } finally {
        setActiveAction(null);
    }
  }, [resume, jobDescriptions]);

  const handleClearResume = () => {
    setResume('');
    setResumeFileName(null);
    setResumeError(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setError(null);
    setResumeError(null);
    setResume('');
    setResumeFileName(null);

    try {
        let text = '';
        if (file.type === 'application/pdf') {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                // @ts-ignore - textContent.items is present on the object
                fullText += textContent.items.map((item) => item.str).join(' ') + '\n';
            }
            text = fullText;
        } else if (file.name.endsWith('.docx')) {
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            text = result.value;
        } else {
            throw new Error("Unsupported file type. Please upload a PDF or .docx file.");
        }
        setResume(text);
        setResumeFileName(file.name);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "An unknown error occurred.";
        setError(`Failed to parse file. ${message}`);
        handleClearResume();
    } finally {
        setIsParsing(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }
  };
  
  const handleCopy = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy).then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    });
  };
  
  const handleDownloadResume = () => {
    if (!refinedResume) return;
    const blob = new Blob([refinedResume], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Refined_Resume.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getLoadingMessage = () => {
    switch (activeAction) {
        case 'analyze': return 'Analyzing alignment...';
        case 'cover-letter': return 'Generating cover letter...';
        case 'refine-resume': return 'Refining your resume for ATS...';
        default: return 'Processing...';
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-slate-50 to-blue-100 py-8 px-4 sm:px-6 lg:px-8">
      <header className="text-center mb-10">
        <div className="inline-flex items-center bg-primary text-primary-text px-4 py-2 rounded-lg shadow-md mb-2">
           <SparklesIcon className="w-8 h-8 mr-2" />
           <h1 className="text-4xl font-bold">Job Aligner AI</h1>
        </div>
        <p className="mt-2 text-lg text-textLight max-w-2xl mx-auto">
          Paste your resume and job description(s). Our AI will analyze them, provide insights, and even draft a cover letter for you.
        </p>
      </header>

      <main className="max-w-5xl mx-auto space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="bg-card p-6 rounded-xl shadow-lg">
            <div className="flex items-center mb-4">
              <DocumentTextIcon className="w-7 h-7 text-primary mr-3" />
              <h2 className="text-2xl font-semibold text-textDark">Your Resume</h2>
            </div>
            <div className="mb-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".pdf,.docx"
                className="hidden"
                aria-hidden="true"
                disabled={isParsing || activeAction !== null}
              />
              <Button onClick={() => fileInputRef.current?.click()} disabled={isParsing || activeAction !== null} variant="secondary" className="w-full !py-2">
                  <UploadIcon className="w-5 h-5 mr-2" />
                  {isParsing ? 'Parsing...' : 'Upload Resume File (.pdf, .docx)'}
              </Button>
            </div>
            {resumeFileName && !isParsing && (
              <div className="flex items-center justify-between bg-green-100 text-green-800 text-sm font-medium px-3 py-1.5 rounded-md my-2">
                <span className="truncate" title={resumeFileName}>{resumeFileName}</span>
                <button onClick={handleClearResume} className="ml-2 p-1 rounded-full text-green-900 hover:bg-green-200" aria-label="Clear resume file">
                  <XCircleIcon className="w-5 h-5" />
                </button>
              </div>
            )}
             <p className="text-center text-sm text-textLight my-2">or paste below</p>
            <TextAreaInput
              id="resume"
              label=""
              value={resume}
              onChange={(e) => { 
                setResume(e.target.value); 
                if (resumeError) setResumeError(null);
                if (resumeFileName) setResumeFileName(null);
              }}
              placeholder="Paste your full resume text here..."
              rows={12}
              error={resumeError}
            />
          </div>
          <div className="bg-card p-6 rounded-xl shadow-lg">
            <div className="flex items-center mb-4">
              <BriefcaseIcon className="w-7 h-7 text-primary mr-3" />
              <h2 className="text-2xl font-semibold text-textDark">Job Description(s)</h2>
            </div>
            <TextAreaInput
              id="jobDescriptions"
              label=""
              value={jobDescriptions}
              onChange={(e) => { setJobDescriptions(e.target.value); if (jobDescError) setJobDescError(null);}}
              placeholder="Paste one or more job descriptions here..."
              rows={15}
              error={jobDescError}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 flex-wrap">
          <Button
            onClick={handleSummarize}
            isLoading={activeAction === 'analyze'}
            disabled={isParsing || activeAction !== null}
            className="px-8 py-3 text-lg w-full sm:w-auto"
          >
            <LightBulbIcon className="w-5 h-5 mr-2" />
            Analyze & Align
          </Button>
          <Button
            onClick={handleGenerateCoverLetter}
            isLoading={activeAction === 'cover-letter'}
            disabled={isParsing || activeAction !== null}
            className="px-8 py-3 text-lg w-full sm:w-auto"
          >
            <EnvelopeIcon className="w-5 h-5 mr-2" />
            Generate Cover Letter
          </Button>
          <Button
            onClick={handleRefineResume}
            isLoading={activeAction === 'refine-resume'}
            disabled={isParsing || activeAction !== null}
            className="px-8 py-3 text-lg w-full sm:w-auto"
          >
            <DocumentCheckIcon className="w-5 h-5 mr-2" />
            Refine for ATS
          </Button>
        </div>

        {activeAction && <LoadingSpinner message={getLoadingMessage()} />}
        
        {error && (
          <div className="bg-red-100 border-l-4 border-error text-red-700 p-4 rounded-md shadow-md" role="alert">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {summary && !activeAction && (
          <div className="bg-card p-6 rounded-xl shadow-lg mt-8">
            <div className="flex items-center mb-4">
               <LightBulbIcon className="w-7 h-7 text-primary mr-3" />
               <h2 className="text-2xl font-semibold text-textDark">AI Alignment Analysis</h2>
            </div>
            <div className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none text-textDark whitespace-pre-wrap">
               <MarkdownRenderer text={summary} />
            </div>
          </div>
        )}

        {coverLetter && !activeAction && (
            <div className="bg-card p-6 rounded-xl shadow-lg mt-8">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                        <EnvelopeIcon className="w-7 h-7 text-primary mr-3" />
                        <h2 className="text-2xl font-semibold text-textDark">Generated Cover Letter</h2>
                    </div>
                     <Button onClick={() => handleCopy(coverLetter)} variant="secondary" className="!py-1.5 !px-4">
                        <ClipboardIcon className="w-5 h-5 mr-2"/>
                        {copySuccess ? 'Copied!' : 'Copy'}
                    </Button>
                </div>
                <textarea
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm bg-card text-textDark placeholder-gray-400 resize-y"
                    rows={18}
                    aria-label="Generated Cover Letter"
                />
            </div>
        )}

        {refinedResume && !activeAction && (
            <div className="bg-card p-6 rounded-xl shadow-lg mt-8">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                        <DocumentCheckIcon className="w-7 h-7 text-primary mr-3" />
                        <h2 className="text-2xl font-semibold text-textDark">ATS-Refined Resume</h2>
                    </div>
                     <Button onClick={handleDownloadResume} variant="secondary" className="!py-1.5 !px-4">
                        <DownloadIcon className="w-5 h-5 mr-2"/>
                        Download .txt
                    </Button>
                </div>
                <textarea
                    value={refinedResume}
                    onChange={(e) => setRefinedResume(e.target.value)}
                    className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm bg-card text-textDark placeholder-gray-400 resize-y"
                    rows={24}
                    aria-label="ATS-Refined Resume"
                />
            </div>
        )}
      </main>

      <footer className="text-center mt-12 py-6 border-t border-gray-300">
        <p className="text-sm text-textLight">
          Job Aligner AI &copy; {new Date().getFullYear()}. Powered by Gemini.
        </p>
      </footer>
    </div>
  );
};

export default App;
