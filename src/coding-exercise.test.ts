import { describe, expect, it } from 'vitest';
import { story } from 'executable-stories-vitest';


describe('When adding two numbers', () => {
  it('the result is the sum of the two numbers', async ({ task }) => {
    story.init(task);

    const number1 = 1;
    const number2 = 2;

    story.given(`want to add two numbers ${number1} and ${number2}`);

    story.when(`I add the two numbers`);

    const result = number1 + number2;
    story.then(`the result is ${result}`);
    expect(result).toBe(3);
  });
});
