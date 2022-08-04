import VueTyper                            from "~/index"
import {mount}                             from "@vue/test-utils"
import {VueWrapper}                        from "@vue/test-utils/dist/vueWrapper"
import {ComponentPublicInstance, nextTick} from "vue"

describe("VueTyper.vue", () => {

    type TyperInstance = {
        currentTextIndex: number
        currentTextLength: number
        state: string
        moveCaretToStart(): void
        moveCaretToEnd(): void
        shiftCaret(index: number): void
        typeStep(): void
        onTyped(): void
        onErased(): void
        onComplete(): void
    }

    beforeEach(() => {
        vi.useRealTimers()
    })

    function clock() {
        vi.useFakeTimers()
        return (ms: number) => {
            vi.advanceTimersByTime(ms)
            return nextTick()
        }
    }


    type Typer = VueWrapper<ComponentPublicInstance<TyperInstance>>

    function mountTyper(props: Record<string, any>) {
        return mount<TyperInstance>(VueTyper as any, {props})
    }

    it("should have a name so it is identifiable in the Vue debugger", () => {
        expect(VueTyper.name).toEqual("VueTyper")
    })

    describe("Unicode Support", () => {
        let ctx = null as unknown as Typer

        function mount(text: string | string[]) {
            ctx = mountTyper({text})
        }

        function assertTextLength(length: number) {
            return expect(ctx.vm.currentTextLength).toEqual(length)
        }

        describe("Emojis", () => {
            const emojiTestData = {
                "1": ["💙", "⛳", "⛈"],
                "2": ["❤️", "💩"],
                "3": ["✍🏻", "🔥"],
                "4": ["👍🏻", "🤳🏻"],
                "5": ["💅🏻", "👨‍⚖️"],
                "7": ["👩🏻‍🎤", "👩🏻‍✈️"],
                "8": ["👩‍❤️‍👩", "👨‍👩‍👧"],
                "9": ["👩‍👩‍👦"],
                "11": ["👩‍❤️‍💋‍👩", "👨‍👩‍👧‍👦"]
            } as Record<string, string[]>

            for (let emojiCodepoint in emojiTestData) {
                describe(`should properly count ${emojiCodepoint} codepoint emojis`, function () {
                    let emojiList = emojiTestData[emojiCodepoint]
                    for (let emoji of emojiList) {
                        it(`${emoji}  has length 1`, function () {
                            mount(emoji)
                            assertTextLength(1)
                        })
                    }
                })
            }
        })
    })

    describe("Repeat and EraseOnComplete", () => {
        const preTypeDelay = 1,
            preEraseDelay = 1,
            typeDelay = 1,
            eraseDelay = 1

        let ctx = null as unknown as Typer

        function createOptions(repeat: number, eraseOnComplete: boolean) {
            return {text: "a", repeat, eraseOnComplete, preTypeDelay, typeDelay, preEraseDelay, eraseDelay}
        }

        it("should not repeat and should not erase final text", async () => {
            const wait = clock()
            ctx = mountTyper(createOptions(0, false))
            await wait(preTypeDelay)
            expect(ctx.vm.state).toEqual("complete")
        })

        it("should not repeat and should erase final text", async () => {
            const wait = clock()
            ctx = mountTyper(createOptions(0, true))
            await wait(preTypeDelay)
            // assert that we're not done yet, we still have to erase the final text!
            expect(ctx.vm.state).not.toEqual("complete")

            await wait(preEraseDelay + eraseDelay)
            // preEraseDelay = select-all, eraseDelay = actual erase
            expect(ctx.vm.state).toEqual("complete")
        })

        it("should repeat as many times as specified and should not erase final text", async () => {
            const wait = clock()
            ctx = mountTyper(createOptions(1, false))

            // type first time
            await wait(preTypeDelay)
            // select-all and erase first time
            await wait(preEraseDelay + eraseDelay)
            // assert that we're not done yet, we still have to repeat one more time!
            expect(ctx.vm.state).not.toEqual("complete")

            // type second time
            await wait(preTypeDelay)
            // assert that we're not done yet, we still have to erase the final text!
            expect(ctx.vm.state).toEqual("complete")
        })

        it("should repeat as many times as specified and erase final text", async () => {
            const wait = clock()
            ctx = mountTyper(createOptions(1, true))

            // type first time
            await wait(preTypeDelay)
            // select-all and erase first time
            await wait(preEraseDelay + eraseDelay)
            // assert that we're not done yet, we still have to repeat one more time!
            expect(ctx.vm.state).not.toEqual("complete")

            // type second time
            await wait(preTypeDelay)
            // assert that we're not done yet, we still have to erase the final text!
            expect(ctx.vm.state).not.toEqual("complete")

            // select-all and erase second time
            await wait(preEraseDelay + eraseDelay)
            expect(ctx.vm.state).toEqual("complete")
        })
    })

    describe("Caret", () => {
        it("should have the correct animation class", () => {

            let ctx = mountTyper({text: "abc", caretAnimation: "solid"})
            let caret = ctx.element.querySelector(".caret")
            expect(caret?.classList.contains("solid")).toBe(true)

            ctx = mountTyper({text: "abc", caretAnimation: "blink"})
            caret = ctx.element.querySelector(".caret")
            expect(caret?.classList.contains("blink")).toBe(true)

            ctx = mountTyper({text: "abc", caretAnimation: "smooth"})
            caret = ctx.element.querySelector(".caret")
            expect(caret?.classList.contains("smooth")).toBe(true)

            ctx = mountTyper({text: "abc", caretAnimation: "phase"})
            caret = ctx.element.querySelector(".caret")
            expect(caret?.classList.contains("phase")).toBe(true)

            ctx = mountTyper({text: "abc", caretAnimation: "expand"})
            caret = ctx.element.querySelector(".caret")
            expect(caret?.classList.contains("expand")).toBe(true)

        })

        it("should be positionable to the beginning", () => {
            const ctx = mountTyper({text: "abc"})
            ctx.vm.moveCaretToStart()
            expect(ctx.vm.currentTextIndex).toEqual(0)
        })

        it("should be positionable to the end", function () {
            const ctx = mountTyper({text: "abc"})
            ctx.vm.moveCaretToEnd()
            expect(ctx.vm.currentTextIndex).toEqual(3)
        })

        it("should be shiftable", function () {
            const ctx = mountTyper({text: "abc"})
            ctx.vm.moveCaretToStart()
            ctx.vm.shiftCaret(2)
            expect(ctx.vm.currentTextIndex).toEqual(2)
        })
    })

    describe("Events", () => {
        const text = "abc"
        let ctx = null as unknown as Typer

        beforeEach(() => {
            ctx = mountTyper({text})
        })

        it("should emit 'typed-char' event for each char in a typed word", async () => {
            let numTyped = 0

            let numChars = text.length
            while (numChars--) {
                ctx.vm.typeStep()
                const event = ctx.emitted("typedChar")?.[numTyped] as [string, number]
                const [char, index] = event
                expect(text.charAt(numTyped)).toEqual(char)
                expect(numTyped).toEqual(index)

                numTyped++
                if (numTyped === text.length) {
                    break
                }
            }
        })

        it("should emit 'typed' event after a word is typed", () => {
            ctx.vm.onTyped()
            expect(ctx.emitted("typed")?.[0]).toEqual([text])
        })

        it("should emit 'erased' event after a word is erased", () => {
            ctx.vm.onErased()
            expect(ctx.emitted("erased")?.[0]).toEqual([text])
        })

        it("should emit 'completed' event after all words are typed/erased", () => {
            ctx.vm.onComplete()
            expect(ctx.emitted("completed")).toEqual([[]])
        })
    })

    describe("Typing and Erasing", () => {
        function expectText(ctx: Typer, side: string, expectedText: string, expectedCharClass?: string) {
            const container = ctx.element.querySelector("." + side)
            expect(container?.classList.contains(side)).toBe(true)
            expect(container?.childElementCount).toEqual(expectedText.length)

            let child
            for (let i = 0; i < expectedText.length; i++) {
                child = container?.children[i]
                if (expectedCharClass) {
                    expect(child?.classList.contains(expectedCharClass))
                }
                expect(child?.textContent).toEqual(expectedText.charAt(i))
            }
        }

        function expectLeftText(ctx: Typer, expectedText: string) {
            expectText(ctx, "left", expectedText, "typed")
        }

        function expectRightText(ctx: Typer, expectedText: string, expectedCharClass?: string) {
            expectText(ctx, "right", expectedText, expectedCharClass)
        }

        describe("Initial Action", () => {
            it("should initialize to typing state", async () => {
                const ctx = mountTyper({
                    text: "abc",
                    initialAction: "typing"
                })

                await nextTick()
                expectLeftText(ctx, "")
                expectRightText(ctx, "abc")
            })

            it("should initialize to erasing state", async () => {
                const ctx = mountTyper({
                    text: "abc",
                    initialAction: "erasing"
                })

                await nextTick()
                expectLeftText(ctx, "abc")
                expectRightText(ctx, "")
            })
        })

        describe("Typing Delay", () => {
            const preTypeDelay = 100
            const typeDelay = 50
            let ctx = null as unknown as Typer
            let wait = null as unknown as (ms: number) => Promise<void>

            beforeEach(function () {
                wait = clock()
                ctx = mountTyper({
                    text: "abc",
                    typeDelay,
                    preTypeDelay
                })
            })

            it("should wait 'preTypeDelay' before typing the first character", async () => {
                await wait(preTypeDelay)
                expectLeftText(ctx, "a")
                expectRightText(ctx, "bc")
            })

            it("should wait 'typeDelay' before typing the second character", async () => {
                await wait(preTypeDelay + typeDelay)
                expectLeftText(ctx, "ab")
                expectRightText(ctx, "c")
            })
        })

        describe("Erasing Delay", () => {
            const preEraseDelay = 100
            const eraseDelay = 50
            let ctx = null as unknown as Typer

            let wait = null as unknown as (ms: number) => Promise<void>

            function createBeforeEach(eraseStyle: string) {
                ctx = mountTyper({
                    text: "abc",
                    initialAction: "erasing",
                    eraseStyle,
                    eraseDelay,
                    preEraseDelay
                })
            }

            describe("backspace", () => {
                beforeEach(() => {
                    wait = clock()
                    createBeforeEach("backspace")
                })

                it("should wait 'preEraseDelay' before erasing the first character", async () => {
                    await wait(preEraseDelay)
                    expectLeftText(ctx, "ab")
                    expectRightText(ctx, "c", "erased")
                })

                it("should wait 'eraseDelay' before erasing the second character", async () => {
                    await wait(preEraseDelay + eraseDelay)
                    expectLeftText(ctx, "a")
                    expectRightText(ctx, "bc", "erased")
                })
            })


            describe("select-back", () => {

                beforeEach(() => {
                    wait = clock()
                    createBeforeEach("select-back")
                })

                it("should wait 'preEraseDelay' before selecting the first character", async () => {
                    await wait(preEraseDelay)
                    expectLeftText(ctx, "ab")
                    expectRightText(ctx, "c", "erased")
                })

                it("should wait 'eraseDelay' before selecting the second character", async () => {
                    await wait(preEraseDelay + eraseDelay)
                    expectLeftText(ctx, "a")
                    expectRightText(ctx, "bc", "selected")
                })
            })

            describe("select-all", () => {

                beforeEach(() => {
                    wait = clock()
                    createBeforeEach("select-all")
                })

                it("should wait 'preEraseDelay' before selecting all characters", async () => {
                    await wait(preEraseDelay)
                    expectLeftText(ctx, "")
                    expectRightText(ctx, "abc", "selected")
                })

                it("should wait 'eraseDelay' before erasing the entire selection", async () => {
                    await wait(preEraseDelay + eraseDelay)
                    expectLeftText(ctx, "")
                    expectRightText(ctx, "abc", "erased")
                })
            })

            describe("clear", () => {

                beforeEach(() => {
                    wait = clock()
                    createBeforeEach("clear")
                })

                it("should wait 'preEraseDelay' before clearing all characters", async () => {
                    await wait(preEraseDelay)
                    expectLeftText(ctx, "")
                    expectRightText(ctx, "abc", "erased")
                })
            })
        })
    })
})
