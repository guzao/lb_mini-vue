import { reactive } from '../reactive.ts'
describe('reactive', () => {

  it('test', () => {
    expect(true).toBe(true)
  })

  it('happy path', () => {
    const origin = { foo: 10 }
    const reactiveObj = reactive(origin)

    expect(reactiveObj).not.toBe(origin)
  })
  
})