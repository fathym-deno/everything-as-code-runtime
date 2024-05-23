import { ComponentChildren, JSX } from 'preact';
import { useState } from 'preact/hooks';
import { AIMessage, BaseMessage, HumanMessage } from 'npm:@langchain/core/messages';
import Chats from './Chats.tsx';
import ChatInput from './ChatInput.tsx';

export const IsIsland = true;

export type ThinkyProps = {
  children: ComponentChildren;
} & JSX.HTMLAttributes<HTMLDivElement>;

export default function Thinky(props: ThinkyProps) {
  const [messages, setMessages] = useState([
    new AIMessage(
      "Hi there! I'm Thinky, your Fathym concierge. I'm here to guide you every step of the way.",
    ),
    new AIMessage('To get started, please sign in using the form to the left.'),
    new AIMessage(
      "Feel free to ask me any questions about Fathym. I'll do my best to guide you to the right place or provide the information you need.",
    ),
  ] as BaseMessage[]);

  const sendMessage = (msg: HumanMessage) => {
    setMessages([...messages, msg]);

    setTimeout(() => {
      setMessages((prevMessages) => [
        ...prevMessages,
        new AIMessage("I'm here to assist you with any questions you have!"),
      ]);
    }, 1000);
  };

  return (
    <div class='flex flex-col h-[calc(100vh_-_64px)]'>
      <div class='flex-grow flex overflow-y-hidden'>
        <div class='flex-1 overflow-y-auto'>{props.children}</div>

        <Chats
          activeChat='ent-chat'
          chats={{
            _: {
              'user-global-chat': 'User Global Chat',
            },
            groups: {
              'ent-chat': 'Enterprise Chat',
            },
          }}
          messages={messages}
          class='shadow-inner'
        />
      </div>

      <ChatInput onSendMessage={sendMessage} />
    </div>
  );
}
