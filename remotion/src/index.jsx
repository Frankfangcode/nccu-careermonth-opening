import React from 'react';
import {registerRoot, Composition} from 'remotion';
import {Reveal} from './Reveal.jsx';
const Root = () => (
  <Composition id="Reveal" component={Reveal} width={1920} height={1080} fps={30} durationInFrames={360} />
);
registerRoot(Root);
