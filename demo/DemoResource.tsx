import { useResource } from '@civet/core';
import { useEventHandler } from '@civet/events';
import type { FetchProviderType } from '@/FetchProvider';
import type { SSEReceiverType } from '@/SSEReceiver';

export default function DemoResource() {
  const resource = useResource<FetchProviderType>({
    name: 'https://jsonplaceholder.typicode.com/todos/1',
    query: undefined,
  });

  useEventHandler<SSEReceiverType>({
    resource,
    onEvent: (event) => {
      console.log(event);
      return false;
    },
  });

  return (
    <>
      <h1>
        {resource.request} - {resource.revision}
      </h1>

      {JSON.stringify(resource.data)}
    </>
  );
}
