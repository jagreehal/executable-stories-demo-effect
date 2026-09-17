import { describe, expect, it } from 'vitest';
import { story } from 'executable-stories-vitest';

const TINY_PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADElEQVR42mP8z8BQDwAFgwJ/lYd9KgAAAABJRU5ErkJggg==';

story.feature({
  kind: 'ability',
  title: 'Every executable-stories-vitest API in one place',
  narrative: `
    Open this file's HTML report to see every story method the Vitest adapter
    can record: docs, step styles, attachments, and a hand-rolled trace.
  `,
  tags: ['kitchen-sink'],
  glossary: [
    {
      term: 'step',
      definition:
        'A Given/When/Then (or alias) marker that the reporter turns into a documented scenario step.',
    },
  ],
});

describe('Kitchen sink', () => {
  it('records every doc method and step keyword', ({ task }) => {
    story.init(task, {
      tags: ['docs', 'smoke'],
      ticket: 'KS-001',
      covers: ['src/kitchen-sink.story.test.ts'],
      meta: { area: 'docs', priority: 'high' },
    });

    story.note(
      'This scenario exercises every story.* doc method so the generated HTML includes all of them.',
    );
    story.tag('smoke');
    story.kv({ label: 'Ticket', value: 'KS-001' });
    story.table({
      label: 'Report config',
      columns: ['Setting', 'Value'],
      rows: [
        ['Framework', 'Vitest'],
        ['API version', '8.9'],
      ],
    });
    story.json({
      label: 'Config',
      value: { reporter: true, formats: ['html'] },
    });
    story.code({
      label: 'Snippet',
      content: 'const x = 1;\nconst y = 2;',
      lang: 'typescript',
    });
    story.table({
      label: 'Method checklist',
      columns: ['Method', 'Used'],
      rows: [
        ['story.note', 'Yes'],
        ['story.tag', 'Yes'],
        ['story.kv', 'Yes'],
        ['story.json', 'Yes'],
        ['story.code', 'Yes'],
        ['story.table', 'Yes'],
        ['story.link', 'Yes'],
        ['story.section', 'Yes'],
        ['story.mermaid', 'Yes'],
        ['story.screenshot', 'Yes'],
        ['story.video', 'Yes'],
        ['story.html', 'Yes'],
        ['story.state', 'Yes'],
        ['story.custom', 'Yes'],
      ],
    });
    story.link({
      label: 'Docs',
      url: 'https://github.com/jagreehal/executable-stories',
    });
    story.section({
      title: 'Section title',
      markdown: 'Section **markdown** content.',
    });
    story.mermaid({
      code: 'graph LR\n  A[story.init] --> B[docs]\n  B --> C[steps]',
      title: 'Simple diagram',
    });
    story.screenshot({
      path: '../screenshots/kitchen.png',
      alt: 'Kitchen sink',
    });
    story.video({
      path: '../videos/kitchen.webm',
      caption: 'Placeholder walkthrough',
    });
    story.html({
      title: 'Inline embed',
      height: 120,
      content: `<!doctype html>
<html><body style="font:14px sans-serif;margin:12px">
  <strong>story.html()</strong> embeds self-contained markup in a sandboxed iframe.
</body></html>`,
    });
    story.state({ label: 'Basket', value: { items: [], total: 0 } });
    story.state({
      label: 'Basket',
      value: { items: [{ sku: 'KS-1', qty: 1 }], total: 12 },
    });
    story.custom({ type: 'sink-meta', data: { version: 2, methods: 14 } });

    story.given('all doc methods were called', {
      note: 'Inline StoryDocs attach to this step instead of the story.',
      json: { label: 'Precondition', value: { ready: true } },
    });
    story.when('steps are recorded');
    story.then(
      'generated doc contains note, table, kv, json, code, link, section, mermaid, screenshot, video, html, state, custom',
    );
    story.and('step keywords given/when/then/and appear');
    story.but('no real screenshot or video asset is required');
    story.arrange('arrange alias works');
    story.act('act alias works');
    story.assert('assert alias works');

    expect(true).toBe(true);
  });

  it('shows a before/after table instead of kv pairs', ({ task }) => {
    story.init(task, {
      tags: ['docs', 'teaching'],
      covers: ['src/kitchen-sink.story.test.ts'],
    });

    story.given('an empty basket');
    story.when('the shopper adds a hoodie');
    story.then('the basket holds one item and the total is £12');
    story.table({
      label: 'What changed',
      columns: ['Who', 'Before', 'After'],
      rows: [
        ['Items', 'none', 'hoodie × 1'],
        ['Total', '£0', '£12'],
      ],
    });
    expect(true).toBe(true);
  });

  it('records callback steps, wrappers, and timers', ({ task }) => {
    story.init(task, {
      tags: ['callbacks'],
      ticket: 'KS-002',
    });

    const operands = story.fn('Given', 'two numbers', () => ({ a: 5, b: 3 }));

    const token = story.startTimer();
    const sum = story.when('they are added', () => operands.a + operands.b);
    story.endTimer(token);

    story.expect('the result is 8', () => {
      expect(sum).toBe(8);
    });
  });

  it('attaches a file and a hand-rolled span waterfall', ({ task }) => {
    story.init(task, {
      tags: ['attachments', 'trace'],
      ticket: 'KS-003',
      traceUrlTemplate: 'https://example.com/traces/{traceId}',
    });

    story.given('a checkout request is in flight');
    story.attach({
      name: 'cart.png',
      mediaType: 'image/png',
      body: TINY_PNG,
      encoding: 'BASE64',
      fileName: 'cart.png',
    });

    story.when('pricing and cart load finish');
    story.attachSpans(
      [
        {
          spanId: 'a',
          name: 'POST /checkout',
          startTimeMs: 0,
          durationMs: 240,
          status: 'ok',
        },
        {
          spanId: 'b',
          parentSpanId: 'a',
          name: 'pricing.applyDiscount',
          startTimeMs: 40,
          durationMs: 80,
          status: 'ok',
        },
        {
          spanId: 'c',
          parentSpanId: 'a',
          name: 'db.cart.load',
          startTimeMs: 10,
          durationMs: 95,
          status: 'ok',
        },
      ],
      { traceId: '11112222333344445555666677778888', spanId: 'a' },
    );

    story.then('the report shows an attachment and a trace waterfall');
    expect(true).toBe(true);
  });
});
