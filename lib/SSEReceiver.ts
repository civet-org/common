import type { GenericDataProvider, ResourceContextValue } from '@civet/core';
import { EventReceiver } from '@civet/events';

export type SSEReceiverOptions<
  Resource extends ResourceContextValue<GenericDataProvider>,
  EventType = MessageEvent,
> = {
  getEvents?: (
    resource: Resource,
    type: string,
    event: MessageEvent,
  ) => Promise<EventType[]> | EventType[];
};

export type SSEOptions<
  Resource extends ResourceContextValue<GenericDataProvider>,
  EventType = MessageEvent,
> = {
  events?: string[];
  getEvents?: (
    resource: Resource,
    type: string,
    event: MessageEvent,
  ) => Promise<EventType[]> | EventType[];
};

export default class SSEReceiver<
  Resource extends ResourceContextValue<GenericDataProvider>,
  EventType = MessageEvent,
  Options extends SSEOptions<Resource, EventType> = SSEOptions<
    Resource,
    EventType
  >,
> extends EventReceiver<Resource, EventType, Options> {
  readonly eventSource: EventSource;
  private options: SSEReceiverOptions<Resource, EventType>;

  constructor(
    eventSource: EventSource,
    options: SSEReceiverOptions<Resource, EventType> = {},
  ) {
    super();
    this.eventSource = eventSource;
    this.options = options;
  }

  handleSubscribe(
    resource: Resource,
    options: Options | undefined,
    handler: (events: EventType[]) => void,
  ): () => void {
    const controller = new AbortController();

    const types = options?.events?.length ? options.events : ['message'];
    types.forEach((type) => {
      this.eventSource.addEventListener(
        type,
        async (event: MessageEvent) => {
          if (options?.getEvents)
            return handler(await options.getEvents(resource, type, event));
          if (this.options.getEvents)
            return handler(await this.options.getEvents(resource, type, event));
          return handler([event as EventType]);
        },
        { signal: controller.signal },
      );
    });

    return controller.abort.bind(controller);
  }
}

export type SSEReceiverType = InstanceType<typeof SSEReceiver>;
