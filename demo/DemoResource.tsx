import { useResource } from '@civet/core';
import type { FetchProviderType } from '@/FetchProvider';

function onEvent(event: unknown) {
  console.log(event);
  return false;
}

export default function DemoResource() {
  const resource = useResource<FetchProviderType>({
    name: 'https://jsonplaceholder.typicode.com/todos/1',
    query: undefined,
    events: { onEvent },
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
