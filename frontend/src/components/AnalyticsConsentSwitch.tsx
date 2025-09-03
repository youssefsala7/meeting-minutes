import React, { useContext, useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Info, Loader2 } from 'lucide-react';
import { AnalyticsContext } from './AnalyticsProvider';
import { Analytics } from '@/lib/analytics';

const isBrowser = typeof window !== 'undefined';
const isTauri = isBrowser && '__TAURI__' in window;

export default function AnalyticsConsentSwitch() {
  const { setIsAnalyticsOptedIn, isAnalyticsOptedIn } = useContext(AnalyticsContext);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load saved preference on mount
  useEffect(() => {
    const loadPreference = async () => {
      try {
        if (isTauri) {
          const { load } = await import('@tauri-apps/plugin-store');
          const store = await load('analytics.json', {
            autoSave: false,
            defaults: { analyticsOptedIn: false },
          });
          const saved = await store.get<boolean>('analyticsOptedIn');
          if (saved !== null && saved !== undefined) setIsAnalyticsOptedIn(saved);
        } else if (isBrowser) {
          const saved = window.localStorage.getItem('analyticsOptedIn');
          if (saved !== null) setIsAnalyticsOptedIn(saved === 'true');
        }
      } catch {
        // no-op: default stays as-is
      }
    };
    loadPreference();
  }, [setIsAnalyticsOptedIn]);

  const handleToggle = async (enabled: boolean) => {
    // Optimistic UI
    setIsAnalyticsOptedIn(enabled);
    setIsProcessing(true);

    try {
      if (isTauri) {
        const { load } = await import('@tauri-apps/plugin-store');
        const store = await load('analytics.json', {
          autoSave: false,
          defaults: { analyticsOptedIn: false },
        });
        await store.set('analyticsOptedIn', enabled);
        await store.save();
      } else if (isBrowser) {
        window.localStorage.setItem('analyticsOptedIn', String(enabled));
      }

      if (enabled) {
        const userId = await Analytics.getPersistentUserId();
        await Analytics.init();
        await Analytics.identify(userId, {
          app_version: '0.0.5',
          platform: isTauri ? 'tauri' : 'web',
          first_seen: new Date().toISOString(),
          os: isBrowser ? navigator.platform : 'unknown',
          user_agent: isBrowser ? navigator.userAgent : 'unknown',
        });
        await Analytics.startSession(userId);
        await Analytics.trackAppStarted();
      } else {
        await Analytics.disable();
      }
    } catch (err) {
      console.error('Failed to toggle analytics:', err);
      setIsAnalyticsOptedIn(!enabled); // revert optimistic update
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrivacyPolicyClick = () => {
    if (!isBrowser) return;
    window.open(
      'https://github.com/Zackriya-Solutions/meeting-minutes/blob/main/PRIVACY_POLICY.md',
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-gray-800 mb-2">Usage Analytics</h3>
        <p className="text-sm text-gray-600 mb-4">
          Help us improve Meetily by sharing anonymous usage data. No personal content is collected—everything stays on your device.
        </p>
      </div>

      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div>
          <h4 className="font-semibold text-gray-800">Enable Analytics</h4>
          <p className="text-sm text-gray-600">
            {isProcessing ? 'Updating...' : 'Anonymous usage patterns only'}
          </p>
        </div>
        <div className="flex items-center gap-2 ml-4">
          {isProcessing && <Loader2 className="w-4 h-4 animate-spin text-gray-500" />}
          <Switch checked={isAnalyticsOptedIn} onCheckedChange={handleToggle} disabled={isProcessing} />
        </div>
      </div>

      <div className="flex items-start gap-2 p-2 bg-blue-50 rounded border border-blue-200">
        <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-blue-700">
          <p className="mb-1">Your meetings, transcripts, and recordings remain completely private and local.</p>
          <button onClick={handlePrivacyPolicyClick} className="text-blue-600 hover:text-blue-800 underline hover:no-underline">
            View Privacy Policy
          </button>
        </div>
      </div>
    </div>
  );
}
