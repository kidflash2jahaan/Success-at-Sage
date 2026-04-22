'use client'

import { useState } from 'react'

// The dynamic assets — each maps to a route under /og/.
// Previews are cache-busted with ?t=<timestamp> so clicking Generate
// always fetches a fresh image reflecting the current DB state.
const DYNAMIC_ASSETS: Array<{
  key: string
  title: string
  description: string
  w: number
  h: number
  // aspect ratio for the preview slot
  aspect: string
}> = [
  {
    key: 'ig-launch',
    title: 'IG — Launch',
    description: 'Feed post announcing the prize.',
    w: 1080,
    h: 1080,
    aspect: '1 / 1',
  },
  {
    key: 'ig-leaderboard',
    title: 'IG — Leaderboard',
    description: 'Current top 3 this month.',
    w: 1080,
    h: 1080,
    aspect: '1 / 1',
  },
  {
    key: 'ig-winner',
    title: 'IG — Winner',
    description: 'Most recent paid winner (or current leader if none yet).',
    w: 1080,
    h: 1080,
    aspect: '1 / 1',
  },
  {
    key: 'poster-stall',
    title: 'Poster — Bathroom Stall',
    description: 'Letter portrait. Print color. Tape inside stalls.',
    w: 816,
    h: 1056,
    aspect: '17 / 22',
  },
  {
    key: 'poster-door',
    title: 'Poster — Classroom Door',
    description: 'Letter landscape. High-traffic AP rooms.',
    w: 1056,
    h: 816,
    aspect: '22 / 17',
  },
]

export default function MarketingAssets({ schoolSlug }: { schoolSlug: string }) {
  const [timestamp, setTimestamp] = useState<number | null>(null)
  const hasGenerated = timestamp !== null

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-white/40 uppercase tracking-widest">
        Marketing Assets
      </h2>
      <p className="text-white/50 text-xs -mt-1 leading-relaxed">
        Posts and posters are generated live from the current leaderboard,
        prize, and deadline. Click Generate to render fresh versions.
      </p>

      {/* Static profile picture */}
      <div className="glass rounded-xl p-4 flex items-center gap-4">
        <div
          className="rounded-lg overflow-hidden flex-shrink-0"
          style={{ width: 80, height: 80 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/profile-picture.png"
            alt="Profile picture"
            width={80}
            height={80}
            style={{ width: 80, height: 80, objectFit: 'cover', display: 'block' }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white font-semibold text-sm">Profile Picture</div>
          <div className="text-white/40 text-xs mt-0.5">
            Static. Use as the Instagram profile photo — doesn&apos;t change
            month-to-month.
          </div>
        </div>
        <a
          href="/brand/profile-picture.png"
          download="profile-picture.png"
          className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 px-3 py-2 rounded-lg transition-colors font-medium"
        >
          Download
        </a>
      </div>

      {/* Generate CTA */}
      <button
        type="button"
        onClick={() => setTimestamp(Date.now())}
        className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        {hasGenerated ? 'Regenerate Assets' : 'Generate Assets'}
      </button>

      {/* Dynamic previews */}
      {hasGenerated && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
          {DYNAMIC_ASSETS.map(asset => (
            <AssetCard key={asset.key} asset={asset} timestamp={timestamp} schoolSlug={schoolSlug} />
          ))}
        </div>
      )}
    </div>
  )
}

function AssetCard({
  asset,
  timestamp,
  schoolSlug,
}: {
  asset: (typeof DYNAMIC_ASSETS)[number]
  timestamp: number
  schoolSlug: string
}) {
  const previewSrc = `/s/${schoolSlug}/og/${asset.key}?t=${timestamp}`
  const downloadSrc = `/s/${schoolSlug}/og/${asset.key}?download=1&t=${timestamp}`
  const filename = `${asset.key}.png`
  return (
    <div className="glass rounded-xl p-4 flex flex-col gap-3">
      <div
        className="rounded-lg overflow-hidden bg-black/40 border border-white/5"
        style={{ aspectRatio: asset.aspect }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewSrc}
          alt={asset.title}
          loading="lazy"
          style={{ width: '100%', height: '100%', display: 'block', objectFit: 'contain' }}
        />
      </div>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col min-w-0 flex-1">
          <div className="text-white font-semibold text-sm">{asset.title}</div>
          <div className="text-white/40 text-xs mt-0.5 leading-relaxed">
            {asset.description}
          </div>
          <div className="text-white/25 text-[10px] mt-1 font-mono">
            {asset.w}×{asset.h}
          </div>
        </div>
        <a
          href={downloadSrc}
          download={filename}
          className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 px-3 py-2 rounded-lg transition-colors font-medium flex-shrink-0"
        >
          Download
        </a>
      </div>
    </div>
  )
}
