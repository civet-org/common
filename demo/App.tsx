import FetchProvider from '@/FetchProvider';
import SSEReceiver from '@/SSEReceiver';
import { ConfigProvider } from '@civet/core';
import { ConfigProvider as EventConfigProvider } from '@civet/events';
import { useState } from 'react';
import './App.css';
import DemoResource from './DemoResource';

export default function App() {
  const [dataProvider] = useState(() => new FetchProvider());
  const [eventReceiver] = useState(
    () => new SSEReceiver(new EventSource('https://sse.dev/test')),
  );

  return (
    <ConfigProvider dataProvider={dataProvider}>
      <EventConfigProvider eventReceiver={eventReceiver}>
        <DemoResource />
      </EventConfigProvider>
    </ConfigProvider>
  );
}
