import React from 'react';
import { Composition } from 'remotion';
import { Demo, DEMO_FPS, DEMO_FRAMES } from './Demo';

export const Root: React.FC = () => {
  return (
    <Composition
      id="GridFailDemo"
      component={Demo}
      durationInFrames={DEMO_FRAMES}
      fps={DEMO_FPS}
      width={1920}
      height={1080}
    />
  );
};
