import React from 'react';
import { X, ShieldCheck, ExternalLink, Lock, Eye, Smartphone, Scale } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenUmpConsent?: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  isOpen,
  onClose,
  onOpenUmpConsent,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0d1812] border border-[#1d3928] w-full max-w-2xl rounded-3xl p-5 shadow-2xl text-white max-h-[90vh] overflow-y-auto flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1c3626]">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-black text-amber-300 tracking-wider uppercase">Privacy Policy & Transparency</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Intro Banner */}
        <div className="bg-[#122218] border border-[#203e2b] rounded-2xl p-4 space-y-2">
          <div className="flex items-center space-x-2 text-emerald-300 font-extrabold text-sm">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>YOUR PRIVACY IS PROTECTED</span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Crapless Craps is a simulation game for entertainment and practice. We respect your privacy and process minimal data necessary for game state savings and optional rewarded video ads.
          </p>
        </div>

        {/* Core Principles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-[#15271c] p-3 rounded-2xl border border-[#234530]">
            <div className="flex items-center space-x-2 font-bold text-yellow-300 mb-1">
              <Smartphone className="w-4 h-4 text-amber-400" />
              <span>Local Device Storage</span>
            </div>
            <p className="text-zinc-300 text-[11px] leading-snug">
              Bankroll balance, dice roll statistics, and custom game settings are saved strictly on your local device. We do not store your game records on external servers.
            </p>
          </div>

          <div className="bg-[#15271c] p-3 rounded-2xl border border-[#234530]">
            <div className="flex items-center space-x-2 font-bold text-yellow-300 mb-1">
              <Eye className="w-4 h-4 text-amber-400" />
              <span>Google AdMob Integration</span>
            </div>
            <p className="text-zinc-300 text-[11px] leading-snug">
              We offer optional rewarded video ads to claim extra chips. Google AdMob uses non-personal advertising identifiers and telemetry to serve ads and prevent fraud.
            </p>
          </div>
        </div>

        {/* Google UMP Consent Section */}
        <div className="bg-[#15271c] border border-[#234530] rounded-2xl p-4 space-y-3">
          <div className="flex items-center space-x-2 text-amber-300 font-extrabold text-sm">
            <Scale className="w-4 h-4 text-amber-400" />
            <span>GDPR / CCPA & GOOGLE UMP CONSENT</span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            In compliance with Google Play Policies and European / US privacy regulations, users in applicable regions can update or modify their ad personalization preferences at any time using Google's User Messaging Platform (UMP).
          </p>
          {onOpenUmpConsent && (
            <button
              onClick={onOpenUmpConsent}
              className="w-full py-2 px-4 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Scale className="w-4 h-4" />
              <span>Manage Ad Consent Choices (Google UMP)</span>
            </button>
          )}
        </div>

        {/* Public Privacy Policy Link & Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-[#1c3626] text-xs">
          <a
            href="/privacy-policy.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300 underline flex items-center space-x-1 font-semibold"
          >
            <span>Open Web Privacy Policy</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={onClose}
            className="py-1.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded-xl cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
