import React from 'react';
import SmokeCanvas from './components/SmokeCanvas';
import { SOURCE_IMAGE_SRC } from './constants';

const App: React.FC = () => {
  return (
    <main className="w-full min-h-screen relative">
      <SmokeCanvas imageSrc={SOURCE_IMAGE_SRC} />
      
      <div className="absolute top-6 left-6 pointer-events-none mix-blend-multiply">
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Particle Dissipation</h1>
        <p className="text-xs text-gray-500 mt-1">
          Interactive HTML5 Canvas
        </p>
      </div>
    </main>
  );
};

export default App;