import { JSX } from 'preact';
import { useState } from 'preact/hooks';
import { Action } from '@fathym/atomic';

type CounterProps = JSX.HTMLAttributes<HTMLDivElement>;

export const IsIsland = true;

export default function Counter(props: CounterProps) {
  const [counter, setCounter] = useState(0);

  return (
    <div {...props} class='flex flex-row mx-auto'>
      <Action onClick={() => setCounter(counter + 1)}>
        Add to Count: {counter}
      </Action>
    </div>
  );
}
