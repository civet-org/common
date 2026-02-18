import { DataProvider, Meta, type AbortSignalProxy } from '@civet/core';

export type FetchProviderOptions<
  Item = unknown,
  MetaType extends Meta = Meta,
  ResponseType extends Item | Item[] | void = Item | Item[] | void,
> = {
  baseURL?: string;
  modifyRequest?: (
    url: URL,
    request: RequestInit,
    meta: MetaType,
  ) => Promise<void> | void;
  getResponse?: (
    url: URL,
    request: RequestInit,
    response: Response,
    meta: MetaType,
  ) => Promise<ResponseType> | ResponseType;
  handleError?: (
    url: URL,
    request: RequestInit,
    response: Response,
    meta: MetaType,
  ) => Promise<ResponseType> | ResponseType;
};

export type FetchOptions<
  Item = unknown,
  MetaType extends Meta = Meta,
  ResponseType extends Item | Item[] = Item | Item[],
> = {
  json?: boolean;
  noJson?: boolean;
  noText?: boolean;
  getResponse?: (
    url: URL,
    request: RequestInit,
    response: Response,
    meta: MetaType,
  ) => Promise<ResponseType> | ResponseType;
  handleError?: (
    url: URL,
    request: RequestInit,
    response: Response,
    meta: MetaType,
  ) => Promise<ResponseType> | ResponseType;
};

export default class FetchProvider<
  Item = unknown,
  ResponseType extends Item | Item[] = Item | Item[],
  Query extends RequestInit | undefined = RequestInit | undefined,
  MetaType extends Meta = Meta,
  Options extends FetchOptions<Item, MetaType, ResponseType> = FetchOptions<
    Item,
    MetaType,
    ResponseType
  >,
> extends DataProvider<Item, Query, Options, MetaType, ResponseType> {
  private options: FetchProviderOptions<Item, MetaType, ResponseType>;

  constructor(
    options: FetchProviderOptions<Item, MetaType, ResponseType> = {},
  ) {
    super();
    this.options = options;
  }

  handleGet(
    resource: string,
    query: Query,
    options: Options | undefined,
    meta: MetaType,
    abortSignal: AbortSignalProxy,
  ): Promise<ResponseType> {
    return this.request(resource, query, options, meta, abortSignal);
  }

  async request<
    ResponseTypeI extends ResponseType = ResponseType,
    QueryI extends Query = Query,
    OptionsI extends Options = Options,
    MetaTypeI extends MetaType = MetaType,
  >(
    resource: string,
    query: QueryI,
    options?: OptionsI | undefined,
    meta?: MetaTypeI,
    abortSignal?: AbortSignalProxy,
  ): Promise<ResponseTypeI> {
    meta = meta instanceof Meta ? meta : (new Meta(meta) as MetaTypeI);

    const controller = new AbortController();
    abortSignal?.listen(controller.abort.bind(controller));

    const url = new URL(resource, this.options.baseURL);
    const headers = new Headers(query?.headers);
    const request = { ...query, headers };
    await this.options.modifyRequest?.(url, request, meta);

    const response = await fetch(url.toString(), {
      ...request,
      signal: AbortSignal.any(
        [request.signal, controller.signal].filter((signal) => signal != null),
      ),
    });

    if (!response.ok) {
      if (options?.handleError)
        return options.handleError(
          url,
          request,
          response,
          meta,
        ) as Promise<ResponseTypeI>;
      if (this.options.handleError)
        return this.options.handleError(
          url,
          request,
          response,
          meta,
        ) as Promise<ResponseTypeI>;

      throw new Error(response.statusText);
    }

    if (options?.getResponse)
      return options.getResponse(
        url,
        request,
        response,
        meta,
      ) as Promise<ResponseTypeI>;
    if (this.options.getResponse)
      return this.options.getResponse(
        url,
        request,
        response,
        meta,
      ) as Promise<ResponseTypeI>;

    if (
      options?.json ||
      (!options?.noJson &&
        /^application\/[^+]*[+]?(json);?.*$/.test(
          response.headers.get('Content-Type') ?? '',
        ))
    )
      return response.json();

    if (!options?.noText) return response.text() as Promise<ResponseTypeI>;

    throw new Error('unprocessable response');
  }
}

export type FetchProviderType = InstanceType<typeof FetchProvider>;
