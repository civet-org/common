import { useResource } from '@civet/core';
import type { FetchProviderType } from '@/FetchProvider';

export default function DemoResource() {
  const resource = useResource<FetchProviderType>({
    name: 'https://jsonplaceholder.typicode.com/todos/1',
    query: undefined,
    events: {
      onEvent: (event) => {
        console.log(event);
        return false;
      },
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
