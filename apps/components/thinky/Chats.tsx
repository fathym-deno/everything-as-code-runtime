import { JSX } from 'preact';
import { useComputed, useSignal } from '@preact/signals';
import { Action, ActionStyleTypes, classSet, SlideToggle } from '@fathym/atomic';

export const IsIsland = true;

export type ChatsProps = {
  activeChat?: string;

  chats: ChatSets;

  onActiveChatSet?: (chat: string | undefined) => void;
} & JSX.HTMLAttributes<HTMLDivElement>;

export default function Chats(props: ChatsProps) {
  const activeChat = useSignal(props.activeChat);

  const isGroupsList = useSignal(false);

  const chats = useComputed(() => {
    return (isGroupsList.value ? props.chats.groups : props.chats._) || {};
  });

  const activeChatName = useComputed(() => {
    return activeChat.value
      ? props.chats._?.[activeChat.value]?.Name ||
        props.chats.groups?.[activeChat.value]?.Name
      : undefined;
  });

  const setActiveChat = (ac?: string): void => {
    activeChat.value = ac;

    props.onActiveChatSet?.(activeChat.value);
  };

  return (
    <div
      {...props}
      class={classSet(['-:flex -:flex-col -:p-2 -:max-w-sm'], props)}
    >
      {!activeChat.value
        ? (
          <>
            <div class='flex flex-row mb-2 mx-auto justify-center'>
              <span class='mx-4'>Chats</span>

              <SlideToggle
                checked={isGroupsList}
                onChange={() => (isGroupsList.value = !isGroupsList.value)}
              >
                <span class='mx-4'>Groups</span>
              </SlideToggle>
            </div>

            <div class='flex-grow overflow-y-auto'>
              {Object.keys(chats.value).map((chatId, index) => {
                const chat = chats.value[chatId];

                return (
                  <Action
                    actionStyle={ActionStyleTypes.Link}
                    key={index}
                    class='w-full text-left'
                    onClick={() => setActiveChat(chatId)}
                  >
                    {chat.Name}
                  </Action>
                );
              })}
            </div>
          </>
        )
        : (
          <>
            <div class='flex flex-row gap-2 mb-2 items-center'>
              <Action
                actionStyle={ActionStyleTypes.Link}
                onClick={() => setActiveChat()}
              >
                {'<'}
                {/* Back to list */}
              </Action>

              <h2 class='flex-1 text-xl font-bold text-center'>
                {activeChatName}
              </h2>
            </div>
          </>
        )}
    </div>
  );
}
