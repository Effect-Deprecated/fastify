describe("Dummy", () => {
  it("dummy", async () => {
    const F = fastify()

    const program = Do(($) => {
      const addr = $(F.listen({ port: 40001, host: "0.0.0.0" }))
      return addr
    })

    const res = await program.scoped().provideSomeLayer(F.Live).unsafeRunPromise()

    assert.strictEqual(res, "http://0.0.0.0:40001")
  })
})
