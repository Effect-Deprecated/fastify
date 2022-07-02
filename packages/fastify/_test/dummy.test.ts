const Server_ = Fastify()
interface Server extends Fastify.GetInstanceType<typeof Server_> {}
const Server = Fastify.opaque(Server_)<Server>()

describe("Dummy", () => {
  it("dummy", async () => {
    const program = Do(($) => {
      const addr = $(Server.listen({ port: 40001, host: "0.0.0.0" }))
      return addr
    })

    const res = await program.scoped().provideSomeLayer(Server.Live).unsafeRunPromise()

    assert.strictEqual(res, "http://0.0.0.0:40001")
  })
})
