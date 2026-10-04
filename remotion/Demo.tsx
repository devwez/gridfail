import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const DEMO_FPS = 30;
export const DEMO_FRAMES = 2760; // 92s — matches voiceover.mp3 (92s)

const BG = '#0a0a0f';
const GREEN = '#7dd87d';
const MUTED = '#9b96a8';

const font = { fontFamily: 'Inter, system-ui, sans-serif' } as const;

function Caption({ text, sub }: { text: string; sub?: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const up = spring({ frame, fps, config: { damping: 20 } });
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 70,
        left: 120,
        right: 120,
        background: 'rgba(10,10,15,0.88)',
        border: '1px solid rgba(125,216,125,0.4)',
        borderRadius: 18,
        padding: '26px 36px',
        transform: `translateY(${interpolate(up, [0, 1], [40, 0])})`,
        opacity: up,
        ...font,
      }}
    >
      <div style={{ fontSize: 44, fontWeight: 600, color: '#fff' }}>{text}</div>
      {sub && (
        <div style={{ fontSize: 30, color: MUTED, marginTop: 6 }}>{sub}</div>
      )}
    </div>
  );
}

function Shot({ src, children }: { src: string; children?: React.ReactNode }) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const zoom = interpolate(frame, [0, durationInFrames], [1, 1.07]);
  return (
    <AbsoluteFill style={{ background: BG, overflow: 'hidden' }}>
      <Img
        src={staticFile(src)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'top center',
          transform: `scale(${zoom})`,
        }}
      />
      {children}
    </AbsoluteFill>
  );
}

function TitleCard({
  kicker,
  title,
  accent,
}: {
  kicker: string;
  title: string;
  accent?: string;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const up = spring({ frame, fps, config: { damping: 18 } });
  return (
    <AbsoluteFill
      style={{
        background: BG,
        alignItems: 'center',
        justifyContent: 'center',
        ...font,
      }}
    >
      <Img
        src={staticFile('mark.png')}
        style={{ width: 340, opacity: interpolate(up, [0, 1], [0, 1]) }}
      />
      <div
        style={{
          marginTop: 30,
          fontSize: 40,
          letterSpacing: 6,
          color: GREEN,
          opacity: up,
        }}
      >
        {kicker}
      </div>
      <div
        style={{
          marginTop: 16,
          fontSize: 84,
          fontWeight: 800,
          color: '#fff',
          opacity: up,
          transform: `translateY(${interpolate(up, [0, 1], [30, 0])})`,
        }}
      >
        {title}
      </div>
      {accent && (
        <div style={{ marginTop: 20, fontSize: 36, color: MUTED }}>{accent}</div>
      )}
    </AbsoluteFill>
  );
}

function TechCard() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const items = [
    'Zero backend — PWA + service worker',
    'Tesseract.js OCR, on-device',
    'LaMini-Flan-T5 answers, on-device',
    'Dexie IndexedDB — papers, cards, scores',
    'Instant first, AI upgrade in background',
  ];
  return (
    <AbsoluteFill
      style={{
        background: BG,
        padding: '140px 160px',
        ...font,
      }}
    >
      <div style={{ fontSize: 40, letterSpacing: 6, color: GREEN }}>
        UNDER THE HOOD
      </div>
      <div style={{ fontSize: 72, fontWeight: 800, color: '#fff', marginTop: 12 }}>
        Real tech, no theatre
      </div>
      <div style={{ marginTop: 50 }}>
        {items.map((t, i) => {
          const s = spring({ frame: frame - i * 12, fps, config: { damping: 20 } });
          return (
            <div
              key={t}
              style={{
                fontSize: 40,
                color: '#e8e8e8',
                padding: '18px 0',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                opacity: s,
                transform: `translateX(${interpolate(s, [0, 1], [-40, 0])})`,
              }}
            >
              <span style={{ color: GREEN, marginRight: 20 }}>▸</span>
              {t}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

export const Demo: React.FC = () => {
  return (
    <AbsoluteFill>
      {/* replace remotion/voiceover.mp3 with your recording, same name, re-render */}
      <Audio src={staticFile('voiceover.mp3')} volume={1} />
      <Sequence from={0} durationInFrames={180}>
        <TitleCard
          kicker="HACK47 OFFGRID"
          title="study when the grid fails"
          accent="GridFail — offline-first AI study kit"
        />
      </Sequence>
      <Sequence from={180} durationInFrames={420}>
        <Shot src="shots/01-library.png">
          <Caption
            text="Install once. Your library lives on the device."
            sub="Seeded matric practice sets, ready with zero signal."
          />
        </Shot>
      </Sequence>
      <Sequence from={600} durationInFrames={480}>
        <Shot src="shots/02-open.png">
          <Caption
            text="Snap a past paper. Tap Explain."
            sub="Answers land in milliseconds — labeled instant, on-device, or cloud."
          />
        </Shot>
      </Sequence>
      <Sequence from={1080} durationInFrames={480}>
        <Shot src="shots/03-study.png">
          <Caption
            text="Flashcards + quiz, weakest-first."
            sub="Cards you miss float to the top. Scores persist offline."
          />
        </Shot>
      </Sequence>
      <Sequence from={1560} durationInFrames={480}>
        <Shot src="shots/04-offline.png">
          <Caption
            text="Airplane mode. Still works."
            sub="The green OFFLINE pill is live state, not a mock."
          />
        </Shot>
      </Sequence>
      <Sequence from={2040} durationInFrames={450}>
        <TechCard />
        <Caption
          text="Zero backend. OCR, AI, storage — all on-device."
          sub="Dexie IndexedDB · Transformers.js · Tesseract, all cached offline."
        />
      </Sequence>
      <Sequence from={2490} durationInFrames={270}>
        <TitleCard
          kicker="GRIDFAIL — TRY IT LIVE"
          title="gridfail.vercel.app"
          accent="Study when the grid fails · github.com/devwez/gridfail"
        />
      </Sequence>
    </AbsoluteFill>
  );
};
