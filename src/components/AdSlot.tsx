import { useEffect, useRef } from 'react';

type AdSlotId = 'top-banner' | 'stories-list' | 'story-top' | 'story-bottom' | 'footer';

const SLOT_ENV: Record<AdSlotId, string> = {
  'top-banner': 'VITE_ADSTERRA_SLOT_TOP',
  'stories-list': 'VITE_ADSTERRA_SLOT_LIST',
  'story-top': 'VITE_ADSTERRA_SLOT_STORY_TOP',
  'story-bottom': 'VITE_ADSTERRA_SLOT_STORY_BOTTOM',
  footer: 'VITE_ADSTERRA_SLOT_FOOTER',
};

declare global {
  interface Window {
    atOptions?: Record<string, string | number>;
  }
}

interface AdSlotProps {
  slot: AdSlotId;
  className?: string;
}

/** Loads an Adsterra zone when `VITE_ADSTERRA_SLOT_*` is set at build time. */
export default function AdSlot({ slot, className = '' }: AdSlotProps) {
  const ref = useRef<HTMLDivElement>(null);
  const envKey = SLOT_ENV[slot];
  const adKey = import.meta.env[envKey as keyof ImportMetaEnv] as string | undefined;

  useEffect(() => {
    if (!adKey || !ref.current) return;

    const container = ref.current;
    container.innerHTML = '';

    window.atOptions = {
      key: adKey,
      format: 'iframe',
      height: slot === 'story-top' || slot === 'story-bottom' ? 90 : 250,
      width: 300,
    };

    const script = document.createElement('script');
    script.src = `https://www.adsterra.com/invoke.js?${adKey}`;
    script.async = true;
    container.appendChild(script);

    return () => {
      container.innerHTML = '';
    };
  }, [adKey, slot]);

  if (!adKey) {
    return (
      <div
        className={`ad-slot ad-slot-${slot.replace('-', '-')} ad-slot--placeholder ${className}`.trim()}
        data-adsterra={slot}
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      ref={ref}
      className={`ad-slot ad-slot-${slot} ${className}`.trim()}
      data-adsterra={slot}
      role="complementary"
      aria-label="Advertisement"
    />
  );
}