
import React, { useState, useCallback } from 'react';
import { generatePhotographerData } from './services/geminiService';
import { Photographer, GroundingChunk } from './types';
import Spinner from './components/Spinner';
import { DownloadIcon, CheckCircleIcon, ExclamationTriangleIcon } from './components/Icons';

const App: React.FC = () => {
  const [photographers, setPhotographers] = useState<Photographer[] | null>(null);
  const [groundingChunks, setGroundingChunks] = useState<GroundingChunk[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateClick = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setPhotographers(null);
    setGroundingChunks([]);

    try {
      const result = await generatePhotographerData();
      setPhotographers(result.photographers);
      setGroundingChunks(result.groundingChunks);
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDownloadCsv = useCallback(() => {
    if (!photographers || photographers.length === 0) return;

    const headers = Object.keys(photographers[0]) as (keyof Photographer)[];
    const csvContent = [
      headers.join(','),
      ...photographers.map(row =>
        headers.map(header => {
          const value = row[header];
          const stringValue = typeof value === 'string' ? value : String(value);
          // Escape commas and quotes
          return `"${stringValue.replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
      URL.revokeObjectURL(link.href);
    }
    link.href = URL.createObjectURL(blob);
    link.download = `ibadan_photographers_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [photographers]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            Ibadan Photographer Directory
          </h1>
          <p className="mt-2 text-lg text-gray-400">
            Generate a downloadable CSV file of top photographers in Ibadan for your database.
          </p>
        </header>

        <main className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl shadow-purple-500/10 p-6 sm:p-8 border border-gray-700">
          <div className="flex flex-col items-center space-y-6">
            <p className="text-center text-gray-300">
              Click the button below to use Gemini with Google Search to find photographers and format the data for download.
            </p>
            
            <button
              onClick={handleGenerateClick}
              disabled={isLoading}
              className="flex items-center justify-center w-full sm:w-auto px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-full hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-500/50 shadow-lg"
            >
              {isLoading ? (
                <>
                  <Spinner className="w-6 h-6 mr-3" />
                  Generating Data...
                </>
              ) : (
                'Generate CSV Data'
              )}
            </button>

            {error && (
              <div className="mt-4 w-full bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg flex items-start space-x-3">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-400 mt-1" />
                <div>
                    <strong className="font-bold">Generation Failed!</strong>
                    <p className="text-sm">{error}</p>
                </div>
              </div>
            )}

            {photographers && photographers.length > 0 && (
              <div className="mt-6 w-full p-6 bg-green-900/50 border border-green-700 rounded-lg text-center animate-fade-in">
                <div className="flex flex-col items-center space-y-4">
                  <CheckCircleIcon className="w-16 h-16 text-green-400" />
                  <h2 className="text-2xl font-bold text-green-300">Data Generated Successfully!</h2>
                  <p className="text-green-200">{photographers.length} photographer records are ready for download.</p>
                  <button
                    onClick={handleDownloadCsv}
                    className="flex items-center justify-center space-x-2 px-6 py-3 text-md font-semibold text-gray-900 bg-green-400 rounded-full hover:bg-green-300 transition-colors duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-500/50 shadow-lg"
                  >
                    <DownloadIcon className="w-5 h-5" />
                    <span>Download CSV File</span>
                  </button>
                </div>
              </div>
            )}
            
            {groundingChunks.length > 0 && (
              <div className="mt-8 w-full text-left pt-6 border-t border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-300 mb-3">Sources from Google Search:</h3>
                  <ul className="space-y-2 text-sm max-h-40 overflow-y-auto">
                      {groundingChunks.filter(chunk => chunk.web && chunk.web.uri).map((chunk, index) => (
                          <li key={index} className="bg-gray-800 p-2 rounded-md">
                              <a 
                                href={chunk.web!.uri} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-purple-400 hover:text-purple-300 hover:underline truncate block"
                                title={chunk.web!.title}
                               >
                                  {chunk.web!.title || chunk.web!.uri}
                              </a>
                          </li>
                      ))}
                  </ul>
              </div>
            )}

          </div>
        </main>
        <footer className="text-center mt-8 text-sm text-gray-500">
            <p>Powered by Google Gemini</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
