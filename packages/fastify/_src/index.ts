import type * as F from "fastify"
import defaultFastify from "fastify"
import type * as http from "http"
import type * as http2 from "http2"
import type * as https from "https"

/**
 * @tsplus type effect/fastify/Fastify
 */
export interface FastifyOps {
  /**
   * Unsafely casts a module to an opaque variant
   */
  opaque<
    RawServer extends F.RawServerBase,
    RawRequest extends F.RawRequestDefaultExpression<RawServer>,
    RawReply extends F.RawReplyDefaultExpression<RawServer>,
    Logger extends F.FastifyLoggerInstance,
    TypeProvider extends F.FastifyTypeProvider,
    O extends Fastify.Context<RawServer, RawRequest, RawReply, Logger, TypeProvider> = Fastify.Context<
      RawServer,
      RawRequest,
      RawReply,
      Logger,
      TypeProvider
    >
  >(
    dsl: Fastify.API<
      RawServer,
      RawRequest,
      RawReply,
      Logger,
      TypeProvider,
      O
    >
  ): <O2 extends O>() => Fastify.API<RawServer, RawRequest, RawReply, Logger, TypeProvider, O2>

  /**
   * Make a new module
   */
  <
    Server extends http2.Http2SecureServer,
    Request extends F.RawRequestDefaultExpression<Server> = F.RawRequestDefaultExpression<Server>,
    Reply extends F.RawReplyDefaultExpression<Server> = F.RawReplyDefaultExpression<Server>,
    Logger extends F.FastifyBaseLogger = F.FastifyLoggerInstance,
    TypeProvider extends F.FastifyTypeProvider = F.FastifyTypeProviderDefault
  >(
    opts: F.FastifyHttp2SecureOptions<Server, Logger>
  ): Fastify.API<
    Server,
    Request,
    Reply,
    Logger,
    TypeProvider
  >
  <
    Server extends http2.Http2Server,
    Request extends F.RawRequestDefaultExpression<Server> = F.RawRequestDefaultExpression<Server>,
    Reply extends F.RawReplyDefaultExpression<Server> = F.RawReplyDefaultExpression<Server>,
    Logger extends F.FastifyBaseLogger = F.FastifyLoggerInstance,
    TypeProvider extends F.FastifyTypeProvider = F.FastifyTypeProviderDefault
  >(
    opts: F.FastifyHttp2Options<Server, Logger>
  ): Fastify.API<
    Server,
    Request,
    Reply,
    Logger,
    TypeProvider
  >
  <
    Server extends https.Server,
    Request extends F.RawRequestDefaultExpression<Server> = F.RawRequestDefaultExpression<Server>,
    Reply extends F.RawReplyDefaultExpression<Server> = F.RawReplyDefaultExpression<Server>,
    Logger extends F.FastifyBaseLogger = F.FastifyLoggerInstance,
    TypeProvider extends F.FastifyTypeProvider = F.FastifyTypeProviderDefault
  >(
    opts: F.FastifyHttpsOptions<Server, Logger>
  ): Fastify.API<
    Server,
    Request,
    Reply,
    Logger,
    TypeProvider
  >
  <
    Server extends http.Server,
    Request extends F.RawRequestDefaultExpression<Server> = F.RawRequestDefaultExpression<Server>,
    Reply extends F.RawReplyDefaultExpression<Server> = F.RawReplyDefaultExpression<Server>,
    Logger extends F.FastifyBaseLogger = F.FastifyLoggerInstance,
    TypeProvider extends F.FastifyTypeProvider = F.FastifyTypeProviderDefault
  >(
    opts?: F.FastifyServerOptions<Server, Logger>
  ): Fastify.API<
    Server,
    Request,
    Reply,
    Logger,
    TypeProvider
  >
}

export const Fastify: FastifyOps = Object.assign(
  function make<
    RawServer extends F.RawServerBase,
    RawRequest extends F.RawRequestDefaultExpression<RawServer>,
    RawReply extends F.RawReplyDefaultExpression<RawServer>,
    Logger extends F.FastifyLoggerInstance,
    TypeProvider extends F.FastifyTypeProvider
  >(opts?: any): Fastify.API<any, any, any, any, any> {
    const tag = Tag<
      Fastify.Context<
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
          _tag: "@effect/fastify/Fastify/Context"
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
  },
  {
    // @ts-expect-error
    opaque: (_) => () => _
  }
)

export namespace Fastify {
  export interface Context<
    RawServer extends F.RawServerBase,
    RawRequest extends F.RawRequestDefaultExpression<RawServer>,
    RawReply extends F.RawReplyDefaultExpression<RawServer>,
    Logger extends F.FastifyLoggerInstance,
    TypeProvider extends F.FastifyTypeProvider
  > {
    readonly _tag: "@effect/fastify/Fastify/Context"
    readonly instance: F.FastifyInstance<
      RawServer,
      RawRequest,
      RawReply,
      Logger,
      TypeProvider
    >
  }

  export type GetInstanceType<X extends API<any, any, any, any, any>> = X extends API<any, any, any, any, any, infer O>
    ? O
    : never

  export interface API<
    RawServer extends F.RawServerBase,
    RawRequest extends F.RawRequestDefaultExpression<RawServer>,
    RawReply extends F.RawReplyDefaultExpression<RawServer>,
    Logger extends F.FastifyLoggerInstance,
    TypeProvider extends F.FastifyTypeProvider,
    O extends Context<RawServer, RawRequest, RawReply, Logger, TypeProvider> = Context<
      RawServer,
      RawRequest,
      RawReply,
      Logger,
      TypeProvider
    >
  > {
    readonly Service: Tag<O>
    readonly Live: Layer<never, never, O>
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
    }) => Effect<Scope | O, Error, string>
  }
}
