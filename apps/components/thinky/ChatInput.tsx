// deno-lint-ignore-file no-explicit-any
import { JSX } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { Signal } from '@preact/signals';
import { LoadingIcon } from '../../../build/iconset/icons/LoadingIcon.tsx';

export const IsIsland = true;

export type ChatInputProps = {
  onSendMessage?: (input: string) => void;

  sending?: Signal<boolean>;
} & JSX.HTMLAttributes<HTMLDivElement>;

export default function ChatInput(props: ChatInputProps) {
  const [input, setInput] = useState('');

  const textareaRef = useRef(null);

  const sendMessage = () => {
    if (props.sending?.value || input.trim() === '') return;

    props.onSendMessage?.(input);

    setInput('');

    resizeTextarea();
  };

  const resizeTextarea = () => {
    const textarea = textareaRef.current! as HTMLTextAreaElement;

    // const hasLines = textarea.value.includes('\n');

    // textarea.rows = hasLines ? 3 : 1;

    textarea.style.height = 'auto';

    textarea.style.height = textarea.scrollHeight < document.body.clientHeight / 2
      ? `${textarea.scrollHeight}px`
      : `${document.body.clientHeight / 2}px`;
  };

  const handleKeyPress = (e: any) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // useEffect(() => {
  //   const chatBox = document.getElementById('chat-box')!;
  //   chatBox.scrollTop = chatBox.scrollHeight;
  // }, []);

  useEffect(() => {
    resizeTextarea(); // Resize on initial render
  }, [input]);

  return (
    <div class='flex p-4 border-t dark:border-slate-600'>
      <textarea
        ref={textareaRef}
        value={input}
        onInput={(e) => {
          setInput((e.target as any).value);
          resizeTextarea();
        }}
        onKeyPress={handleKeyPress}
        rows={1}
        class='flex-grow p-2 border rounded-l-lg text-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white resize-none'
        placeholder='Type your message here...'
      />

      <button
        onClick={sendMessage}
        class='bg-blue-600 dark:bg-blue-800 text-white p-2 rounded-r-lg text-lg'
        disabled={props.sending?.value}
      >
        {!props.sending?.value
          ? (
            'Send'
          )
          : <LoadingIcon class='w-6 h-6 animate-spin' />}
      </button>
    </div>
  );
}
