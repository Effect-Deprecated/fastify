import type * as F from "fastify"
import defaultFastify from "fastify"
import type * as http from "http"
import type * as http2 from "http2"
import type * as https from "https"

export interface FastifyInstance<
  RawServer extends F.RawServerBase,
  RawRequest extends F.RawRequestDefaultExpression<RawServer>,
  RawReply extends F.RawReplyDefaultExpression<RawServer>,
  Logger extends F.FastifyLoggerInstance,
  TypeProvider extends F.FastifyTypeProvider
> {
  readonly _tag: "FastifyInstanceService"
  readonly instance: F.FastifyInstance<
    RawServer,
    RawRequest,
    RawReply,
    Logger,
    TypeProvider
  >
}

export interface FastifyAPI<
  RawServer extends F.RawServerBase,
  RawRequest extends F.RawRequestDefaultExpression<RawServer>,
  RawReply extends F.RawReplyDefaultExpression<RawServer>,
  Logger extends F.FastifyLoggerInstance,
  TypeProvider extends F.FastifyTypeProvider
> {
  readonly Service: Tag<FastifyInstance<RawServer, RawRequest, RawReply, Logger, TypeProvider>>
  readonly Live: Layer<never, never, FastifyInstance<RawServer, RawRequest, RawReply, Logger, TypeProvider>>
  readonly listen: (opts?: {
    port?: number
    host?: string
    path?: string
    backlog?: number
    exclusive?: boolean
    readableAll?: boolean
    writableAll?: boolean
    ipv6Only?: boolean
    signal?: AbortSignal
  }) => Effect<Scope | FastifyInstance<RawServer, RawRequest, RawReply, Logger, TypeProvider>, Error, string>
}

export function fastify<
  Server extends http2.Http2SecureServer,
  Request extends F.RawRequestDefaultExpression<Server> = F.RawRequestDefaultExpression<Server>,
  Reply extends F.RawReplyDefaultExpression<Server> = F.RawReplyDefaultExpression<Server>,
  Logger extends F.FastifyBaseLogger = F.FastifyLoggerInstance,
  TypeProvider extends F.FastifyTypeProvider = F.FastifyTypeProviderDefault
>(
  opts: F.FastifyHttp2SecureOptions<Server, Logger>
): FastifyAPI<
  Server,
  Request,
  Reply,
  Logger,
  TypeProvider
>
export function fastify<
  Server extends http2.Http2Server,
  Request extends F.RawRequestDefaultExpression<Server> = F.RawRequestDefaultExpression<Server>,
  Reply extends F.RawReplyDefaultExpression<Server> = F.RawReplyDefaultExpression<Server>,
  Logger extends F.FastifyBaseLogger = F.FastifyLoggerInstance,
  TypeProvider extends F.FastifyTypeProvider = F.FastifyTypeProviderDefault
>(
  opts: F.FastifyHttp2Options<Server, Logger>
): FastifyAPI<
  Server,
  Request,
  Reply,
  Logger,
  TypeProvider
>
export function fastify<
  Server extends https.Server,
  Request extends F.RawRequestDefaultExpression<Server> = F.RawRequestDefaultExpression<Server>,
  Reply extends F.RawReplyDefaultExpression<Server> = F.RawReplyDefaultExpression<Server>,
  Logger extends F.FastifyBaseLogger = F.FastifyLoggerInstance,
  TypeProvider extends F.FastifyTypeProvider = F.FastifyTypeProviderDefault
>(
  opts: F.FastifyHttpsOptions<Server, Logger>
): FastifyAPI<
  Server,
  Request,
  Reply,
  Logger,
  TypeProvider
>
export function fastify<
  Server extends http.Server,
  Request extends F.RawRequestDefaultExpression<Server> = F.RawRequestDefaultExpression<Server>,
  Reply extends F.RawReplyDefaultExpression<Server> = F.RawReplyDefaultExpression<Server>,
  Logger extends F.FastifyBaseLogger = F.FastifyLoggerInstance,
  TypeProvider extends F.FastifyTypeProvider = F.FastifyTypeProviderDefault
>(
  opts?: F.FastifyServerOptions<Server, Logger>
): FastifyAPI<
  Server,
  Request,
  Reply,
  Logger,
  TypeProvider
>
export function fastify<
  RawServer extends F.RawServerBase,
  RawRequest extends F.RawRequestDefaultExpression<RawServer>,
  RawReply extends F.RawReplyDefaultExpression<RawServer>,
  Logger extends F.FastifyLoggerInstance,
  TypeProvider extends F.FastifyTypeProvider
>(opts?: any): FastifyAPI<any, any, any, any, any> {
  const tag = Tag<
    FastifyInstance<
      RawServer,
      RawRequest,
      RawReply,
      Logger,
      TypeProvider
    >
  >()

  const Live = Layer.fromEffectEnvironment(
    Effect.succeed(defaultFastify(opts)).map((instance: any) =>
      tag.toEnv({
        instance,
        _tag: "FastifyInstanceService"
      })
    )
  )

  function listen(opts?: {
    port?: number
    host?: string
    path?: string
    backlog?: number
    exclusive?: boolean
    readableAll?: boolean
    writableAll?: boolean
    ipv6Only?: boolean
    signal?: AbortSignal
  }) {
    return Do(($) => {
      const app = $(Effect.service(tag))

      const addr = $(
        Effect.async<never, Error, string>((resume) => {
          app.instance.listen(opts ?? {}, (err, addr) => {
            if (err) {
              resume(Effect.fail(err))
            } else {
              resume(Effect.succeed(addr))
            }
          })
        })
          .acquireRelease(() =>
            Effect.async<never, never, void>((resume) => {
              app.instance.close(() => {
                resume(Effect.unit)
              })
            })
          )
      )

      return addr
    })
  }

  return {
    Service: tag,
    Live,
    listen
  }
}
