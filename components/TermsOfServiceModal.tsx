import React from 'react';

interface TermsOfServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TermsOfServiceModal: React.FC<TermsOfServiceModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Terms & Privacy Policy</h2>
        </div>

        <div className="p-6 overflow-y-auto flex-grow text-sm text-gray-700 space-y-4">
          <p><strong>Last Updated: Feb 2025</strong></p>

          <p><strong>1. Acceptance of Terms</strong><br />
            By accessing or using Orchid (the "App"), you agree to be bound by these Terms of Service.</p>

          <p><strong>2. User Content (UGC) Policy</strong><br />
            - You are responsible for the content (binders, items, images) you create or share.<br />
            - You must NOT post content that is illegal, abusive, harassing, hateful, or explicit.<br />
            - We reserve the right to remove any content and ban users who violate these rules.<br />
            - Users can report objectionable content, which will be reviewed within 24 hours.<br />
            - Repeat offenders will be permanently blocked.</p>

          <p><strong>3. Privacy Policy</strong><br />
            - We collect your email and usage data to provide the service.<br />
            - You can delete your account and data at any time from the Profile settings.<br />
            - We do not sell your personal data to third parties.</p>

          <p><strong>4. Account Deletion</strong><br />
            You may delete your account at any time. This will permanently remove all your data, including binders and shared items.</p>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="w-full py-3 bg-brand-primary text-white font-bold rounded-lg hover:opacity-90 transition"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServiceModal;
