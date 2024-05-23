import { JSX } from 'preact';
import { useComputed, useSignal } from '@preact/signals';
import { Action, ActionStyleTypes, classSet, SlideToggle } from '@fathym/atomic';
import { AIMessage, BaseMessage, HumanMessage } from 'npm:@langchain/core/messages';

export const IsIsland = true;

export type ChatsProps = {
  activeChat?: string;

  chats: { _?: { [id: string]: string }; groups?: { [id: string]: string } };

  messages: BaseMessage[];
} & JSX.HTMLAttributes<HTMLDivElement>;

export default function Chats(props: ChatsProps) {
  const activeChat = useSignal(props.activeChat);

  const isGroupsList = useSignal(false);

  const chats = useComputed(() => {
    return (isGroupsList.value ? props.chats.groups : props.chats._) || {};
  });

  const activeChatName = useComputed(() => {
    return activeChat.value
      ? props.chats._?.[activeChat.value] ||
        props.chats.groups?.[activeChat.value]
      : undefined;
  });

  const setActiveChat = (ac?: string): void => {
    activeChat.value = ac;
  };

  return (
    <div
      {...props}
      id='chat-box'
      class={classSet(['flex-grow flex flex-col p-2 max-w-sm'], props)}
    >
      {!activeChat.value
        ? (
          <div class='flex flex-row mb-2 mx-auto justify-center'>
            <span class='mx-4'>Chats</span>

            <SlideToggle
              checked={isGroupsList}
              onChange={() => (isGroupsList.value = !isGroupsList.value)}
            >
              <span class='mx-4'>Groups</span>
            </SlideToggle>
            {
              /* <Action
            class="flex-1"
            onClick={() => setActiveChat(props.activeChat)}
          >
            Chats
          </Action>

          <Action
            class="flex-1"
            onClick={() => setActiveChat(props.activeChat)}
          >
            Groups
          </Action> */
            }
          </div>
        )
        : (
          <>
            <div class='flex flex-row gap-2 mb-2'>
              <Action
                actionStyle={ActionStyleTypes.Link}
                onClick={() => setActiveChat()}
              >
                {'<'} Back to list
              </Action>
            </div>

            <h2 class='text-xl font-bold text-center'>{activeChatName}</h2>
          </>
        )}

      <div class='flex-grow overflow-y-auto'>
        {activeChat.value
          ? props.messages.map((message, index) => {
            return (
              <div
                key={index}
                class={`flex my-4 ${message instanceof AIMessage ? '' : 'justify-end'}`}
              >
                {message instanceof AIMessage && (
                  <div class='flex-shrink-0 w-12 h-12 bg-blue-600 dark:bg-blue-800 text-white rounded-full flex items-center justify-center mr-4'>
                    🐙
                  </div>
                )}

                <div
                  class={classSet([
                    'p-4 rounded-lg text-lg max-w-xs whitespace-pre-wrap',
                    message instanceof AIMessage
                      ? 'bg-blue-100 dark:bg-blue-700 dark:text-white' // text-right
                      : 'bg-gray-100 dark:bg-slate-700 dark:text-white',
                  ])}
                  dangerouslySetInnerHTML={{ __html: message.text }}
                >
                </div>

                {message instanceof HumanMessage && (
                  <div class='flex-shrink-0 w-12 h-12 bg-gray-300 dark:bg-slate-600 text-white rounded-full flex items-center justify-center ml-4'>
                    🧑
                  </div>
                )}
              </div>
            );
          })
          : Object.keys(chats.value).map((chatId, index) => {
            const chat = chats.value[chatId];

            return (
              <Action
                actionStyle={ActionStyleTypes.Link}
                key={index}
                class='w-full text-left'
                onClick={() => setActiveChat(chatId)}
              >
                {chat}
              </Action>
            );
          })}
      </div>
    </div>
  );
}
