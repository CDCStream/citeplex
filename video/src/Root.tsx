import React from "react";
import { Composition } from "remotion";
import {
  TransitionSeries,
  linearTiming,
} from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import "./styles/global.css";
import { Intro } from "./sequences/Intro";
import { Problem } from "./sequences/Problem";
import { Dashboard } from "./sequences/Dashboard";
import { Features } from "./sequences/Features";
import { CTA } from "./sequences/CTA";
import { UrlInput } from "./sequences/UrlInput";
import { Prompts } from "./sequences/Prompts";
import { Overview } from "./sequences/Overview";
import { GapArticle } from "./sequences/GapArticle";
import { Calendar } from "./sequences/Calendar";
import { Finale } from "./sequences/Finale";

const FPS = 30;
const TRANSITION_FRAMES = 20;

const INTRO_DURATION = 5;
const PROBLEM_DURATION = 7;
const DASHBOARD_DURATION = 3;
const FEATURES_DURATION = 4;
const CTA_DURATION = 4;
const URLINPUT_DURATION = 5;
const PROMPTS_DURATION = 8;
const OVERVIEW_DURATION = 8;
const GAPARTICLE_DURATION = 28;
const CALENDAR_DURATION = 8;
const FINALE_DURATION = 7;

const TOTAL_FRAMES =
  (INTRO_DURATION + PROBLEM_DURATION + DASHBOARD_DURATION + FEATURES_DURATION + CTA_DURATION + URLINPUT_DURATION + PROMPTS_DURATION + OVERVIEW_DURATION + GAPARTICLE_DURATION + CALENDAR_DURATION + FINALE_DURATION) * FPS -
  10 * TRANSITION_FRAMES;

const CiteplexDemo: React.FC = () => {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={INTRO_DURATION * FPS}>
        <Intro />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
      />
      <TransitionSeries.Sequence durationInFrames={PROBLEM_DURATION * FPS}>
        <Problem />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
      />
      <TransitionSeries.Sequence durationInFrames={DASHBOARD_DURATION * FPS}>
        <Dashboard />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
      />
      <TransitionSeries.Sequence durationInFrames={FEATURES_DURATION * FPS}>
        <Features />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
      />
      <TransitionSeries.Sequence durationInFrames={CTA_DURATION * FPS}>
        <CTA />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
      />
      <TransitionSeries.Sequence durationInFrames={URLINPUT_DURATION * FPS}>
        <UrlInput />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
      />
      <TransitionSeries.Sequence durationInFrames={PROMPTS_DURATION * FPS}>
        <Prompts />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
      />
      <TransitionSeries.Sequence durationInFrames={OVERVIEW_DURATION * FPS}>
        <Overview />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
      />
      <TransitionSeries.Sequence durationInFrames={GAPARTICLE_DURATION * FPS}>
        <GapArticle />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
      />
      <TransitionSeries.Sequence durationInFrames={CALENDAR_DURATION * FPS}>
        <Calendar />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
      />
      <TransitionSeries.Sequence durationInFrames={FINALE_DURATION * FPS}>
        <Finale />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="CiteplexDemo"
        component={CiteplexDemo}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="Intro"
        component={Intro}
        durationInFrames={INTRO_DURATION * FPS}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="Problem"
        component={Problem}
        durationInFrames={PROBLEM_DURATION * FPS}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="Dashboard"
        component={Dashboard}
        durationInFrames={DASHBOARD_DURATION * FPS}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="Features"
        component={Features}
        durationInFrames={FEATURES_DURATION * FPS}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="CTA"
        component={CTA}
        durationInFrames={CTA_DURATION * FPS}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="UrlInput"
        component={UrlInput}
        durationInFrames={URLINPUT_DURATION * FPS}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="Prompts"
        component={Prompts}
        durationInFrames={PROMPTS_DURATION * FPS}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="Overview"
        component={Overview}
        durationInFrames={OVERVIEW_DURATION * FPS}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="Finale"
        component={Finale}
        durationInFrames={FINALE_DURATION * FPS}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="Calendar"
        component={Calendar}
        durationInFrames={CALENDAR_DURATION * FPS}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="GapArticle"
        component={GapArticle}
        durationInFrames={GAPARTICLE_DURATION * FPS}
        fps={FPS}
        width={1920}
        height={1080}
      />
    </>
  );
};
