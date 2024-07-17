import { ComponentChildren, JSX } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { useSignal } from '@preact/signals';
import { AIMessage, AIMessageChunk, BaseMessage, HumanMessage } from 'npm:@langchain/core/messages';
import { RemoteRunnable } from 'npm:@langchain/core/runnables/remote';
import Chats from './Chats.tsx';
import ChatInput from './ChatInput.tsx';
import { StringPromptValue } from 'npm:@langchain/core/prompt_values';
import ChatMessages from './ChatMessages.tsx';

export const IsIsland = true;

export type ChatSet = { Name: string; CircuitLookup: string; Inputs?: unknown };

export type ChatSets = {
  _?: { [id: string]: ChatSet };
  groups?: { [id: string]: ChatSet };
};

export type ThinkyProps = {
  activeChat?: string;

  chats: Record<string, ChatSet>;

  children: ComponentChildren;

  groupChats?: string[];

  hideChatHeader?: boolean;

  jwt: string;

  root: string;
} & JSX.HTMLAttributes<HTMLDivElement>;

export default function Thinky(props: ThinkyProps) {
  const [activeChat, setActiveChat] = useState(props.activeChat);

  const messages = useSignal<BaseMessage[]>([]);

  const sending = useSignal(!props.activeChat);

  const activeChatDef = activeChat ? props.chats[activeChat] : undefined;

  const circuit = activeChatDef
    ? new RemoteRunnable({
      url: `${props.root}${activeChatDef.CircuitLookup}`,
      options: {
        headers: { Authorization: `Bearer ${props.jwt}` },
      },
    })
    : undefined;

  const processMessageChunk = (chunk: StringPromptValue | AIMessageChunk) => {
    console.log(chunk);
    const chunkValue = chunk instanceof AIMessageChunk ? chunk.content.toString() : chunk.value;

    if (chunkValue) {
      let lastMsg = messages.value.slice(-1)[0];

      if (!(lastMsg instanceof AIMessage)) {
        messages.value = [...messages.value, new AIMessage('')];

        lastMsg = messages.value.slice(-1)[0];
      }

      lastMsg.content += chunkValue;

      setTimeout(
        () => (messages.value = [...messages.value.slice(0, -1), lastMsg]),
        0,
      );
    }
  };

  const processChat = async (input?: string) => {
    sending.value = true;

    const events = await circuit?.streamEvents(
      {
        Input: input,
        ...(activeChatDef!.Inputs ?? {}),
      },
      {
        version: 'v2',
        configurable: { thread_id: activeChat },
        recursionLimit: 100,
      },
    );

    if (events) {
      for await (const event of events) {
        if (
          event.event === 'on_chat_model_stream' ||
          event.event === 'on_llm_stream'
        ) {
          const chunk = event.data?.chunk;

          if (chunk) {
            processMessageChunk(chunk as StringPromptValue | AIMessageChunk);
          }
        }
      }

      const resp = (await circuit?.invoke(
        {},
        { configurable: { thread_id: activeChat, peek: true } },
      )) as { Messages: BaseMessage[] };

      messages.value = resp?.Messages || [];
    }

    sending.value = false;
  };

  const handleSetActiveChat = (chat: string | undefined) => {
    setActiveChat(chat);
  };

  const sendMessage = (input: string) => {
    console.log('sendMessage');
    console.log(input);

    const work = async () => {
      await processChat(input);
    };

    messages.value = [...messages.value, new HumanMessage(input)];

    setTimeout(work, 0);
  };

  useEffect(() => {
    const work = async () => {
      const resp = (await circuit?.invoke(
        {},
        { configurable: { thread_id: activeChat, peek: true } },
      )) as { Messages: BaseMessage[] };

      messages.value = resp?.Messages || [];
    };

    work();
  }, []);

  useEffect(() => {
    messages.value = [];

    processChat();
  }, [activeChat]);

  const chats = Object.keys(props.chats || {}).reduce((acc, chat) => {
    if (props.groupChats?.includes(chat)) {
      if (!acc.groups) {
        acc.groups = {};
      }

      acc.groups[chat] = props.chats[chat];
    } else {
      if (!acc._) {
        acc._ = {};
      }

      acc._[chat] = props.chats[chat];
    }

    return acc;
  }, {} as ChatSets);

  return (
    <div class='flex flex-col h-[calc(100vh_-_64px)]'>
      <div class='flex-grow flex overflow-y-hidden'>
        <div class='flex-1 overflow-y-auto'>{props.children}</div>

        <div class='flex-grow flex flex-col p-2 max-w-sm shadow-inner'>
          {!props.hideChatHeader && (
            <Chats
              activeChat={activeChat}
              chats={chats}
              onActiveChatSet={handleSetActiveChat}
              class='shadow-inner'
            />
          )}

          {activeChat && <ChatMessages messages={messages} sending={sending} />}
        </div>
      </div>

      <ChatInput sending={sending} onSendMessage={sendMessage} />
    </div>
  );
}
