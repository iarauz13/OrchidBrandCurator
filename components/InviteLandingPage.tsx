import React, { useEffect, useState } from 'react';
import BrandLogo from './BrandLogo';

export const InviteLandingPage = () => {
  const [binderId, setBinderId] = useState('');

  useEffect(() => {
    // Simple extraction of ID from path: /invite/123
    const path = window.location.pathname;
    const id = path.split('/invite/')[1];
    if (id) setBinderId(id);
  }, []);

  const deepLink = `orchid://invite/binder/${binderId}`;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="mb-12 scale-150">
        <BrandLogo />
      </div>

      <h1 className="text-4xl font-bold font-display mb-4">You've been invited!</h1>
      <p className="text-gray-400 mb-12 text-lg max-w-md">
        A friend wants to collaborate with you on a Binder.
        <br /><br />
        Orchid's collaboration features are exclusively available on our mobile app.
      </p>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <a
          href={deepLink}
          className="bg-white text-black font-bold py-4 px-8 rounded-full hover:scale-105 transition-transform"
        >
          Open in Orchid App
        </a>

        <div className="flex gap-2 justify-center mt-4">
          {/* Placeholders for App Store badges */}
          <div className="bg-gray-800 h-12 w-32 rounded-lg flex items-center justify-center text-xs text-gray-500">
            App Store
          </div>
          <div className="bg-gray-800 h-12 w-32 rounded-lg flex items-center justify-center text-xs text-gray-500">
            Google Play
          </div>
        </div>
      </div>

      <p className="mt-12 text-sm text-gray-600">
        Already have the app? Tapping the button above will launch it.
      </p>
    </div>
  );
};
