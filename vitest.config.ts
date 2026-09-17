import { StoryReporter } from 'executable-stories-vitest/reporter';
import type { Reporter } from 'vitest/node';
import { defineConfig } from 'vitest/config';

// Opt-in via STORY_REPORT=1 (set by `npm test`). Wallaby loads this config but runs
// tests from its own cache dir with its own runner — a live reporter instance in
// `reporters` doesn't survive that, so it stays off unless explicitly asked for.
const storyReporter = new StoryReporter({
  formats: ['html'],
  outputDir: 'reports',
  rawRunPath: 'reports/raw-run.json',
  outputName: 'executable-stories',
  output: {
    mode: 'aggregated',
    rules: [
      {
        match: '**/kitchen-sink.story.test.ts',
        mode: 'colocated',
        colocatedStyle: 'flat',
        outputName: 'kitchen-sink',
      },
      {
        match: 'src/exercises/**/*.story.test.ts',
        mode: 'colocated',
        colocatedStyle: 'flat',
      },
      {
        match: 'src/coding-exercise.test.ts',
        mode: 'colocated',
        colocatedStyle: 'flat',
        outputName: 'coding-exercise',
      },
    ],
  },
  html: {
    title: 'Executable Stories Live Demo',
  },
});

export default defineConfig({
  test: {
    reporters: process.env.STORY_REPORT
      ? ['default', storyReporter]
      : ['default'],
  },
});
