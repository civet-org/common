import {
  Notifier,
  type GenericDataProvider,
  type ResourceContextValue,
} from '@civet/core';
import { EventReceiver } from '@civet/events';

export type SSEReceiverOptions<
  Resource extends ResourceContextValue<GenericDataProvider>,
  EventType = MessageEvent,
> = {
  events?: string[];
  getEvents?: (
    resource: Resource | undefined,
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
    resource: Resource | undefined,
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
> extends EventReceiver<EventType, Resource, Options> {
  private _eventSource: EventSource | undefined;
  private options: SSEReceiverOptions<Resource, EventType>;
  private notifier: Notifier<[]> = new Notifier();

  constructor(
    eventSource: EventSource | undefined,
    options: SSEReceiverOptions<Resource, EventType> = {},
  ) {
    super();
    this._eventSource = eventSource;
    this.options = options;
  }

  get eventSource(): EventSource | undefined {
    return this._eventSource;
  }

  setEventSource(eventSource: EventSource) {
    this._eventSource = eventSource;
    this.notifier.trigger();
  }

  handleSubscribe(
    resourceNotifier: Notifier<[Resource | undefined]>,
    options: Options | undefined,
    handler: (events: EventType[]) => void,
  ): () => void {
    let resource: Resource | undefined;
    const unsubResource = resourceNotifier.subscribe(
      (nextResource: Resource | undefined) => {
        resource = nextResource;
      },
    );

    const controller = new AbortController();
    controller.signal.addEventListener('abort', unsubResource);

    let types: string[] = [];
    if (options?.events) types = options.events;
    else if (this.options.events) types = this.options.events;
    if (types.length === 0) types = ['message'];

    let sourceController = new AbortController();
    const registerEventHandlers = () => {
      types.forEach((type) => {
        this.eventSource?.addEventListener(
          type,
          async (event: MessageEvent) => {
            if (options?.getEvents)
              return handler(await options.getEvents(resource, type, event));
            if (this.options.getEvents)
              return handler(
                await this.options.getEvents(resource, type, event),
              );
            return handler([event as EventType]);
          },
          {
            signal: AbortSignal.any([
              controller.signal,
              sourceController.signal,
            ]),
          },
        );
      });
    };
    registerEventHandlers();

    this.notifier.subscribe(() => {
      sourceController.abort();
      sourceController = new AbortController();
      registerEventHandlers();
    });

    return controller.abort.bind(controller);
  }
}

export type SSEReceiverType = InstanceType<typeof SSEReceiver>;
