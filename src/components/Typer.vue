<template>
  <span class="vue-typer">
    <span class="left">
      <Char
          class="typed"
          v-for="l in numLeftChars"
          :char="currentTextArray[l - 1]"
      />
    </span>
     <Caret
         :class="caretClasses"
         :animation="caretAnimation"
     />
    <span class="right">
       <Char
           v-for="r in numRightChars"
           :char="currentTextArray[numLeftChars + r-1]"
           :class="rightCharClasses"
       />
    </span>
  </span>
</template>

<script lang="ts">
import {defineComponent, unref} from "vue"
import {
  computed,
  nextTick,
  onMounted,
  onBeforeUnmount,
  watch,
  ref
}                               from "vue"

import {shallowEqual, shuffle} from "~/utils"
import Char                    from "./Char.vue"
import Caret                   from "./Caret.vue"
import split                   from "lodash.split"

const STATE = {
  IDLE: "idle",
  TYPING: "typing",
  ERASING: "erasing",
  COMPLETE: "complete"
} as const

const ERASE_STYLE = {
  BACKSPACE: "backspace",
  SELECT_BACK: "select-back",
  SELECT_ALL: "select-all",
  CLEAR: "clear"
} as const

type ValueOf<T> = T extends any[] ? T[number] : T[keyof T]
type StateType = typeof STATE
type EraseType = typeof ERASE_STYLE

export default defineComponent({
  name: "VueTyper",
  components: {Char, Caret},
  props: {
    /**
     * Text(s) to type.
     */
    text: {
      type: [String, Array],
      required: true,
      validator(value: string | Array<string>) {
        if (typeof value === "string")
          return value.length > 0
        return value.every(item => typeof (item as string) === "string" && item.length > 0)
      }
    },
    /**
     * Number of extra times to type 'text' after the first time.
     * 0 will type 'text' once, 1 will type twice, Infinity will type forever.
     */
    repeat: {
      type: Number,
      default: () => Infinity,
      validator: (value: number) => value >= 0
    },
    /**
     * Randomly shuffles 'text' (using Fisher-Yates algorithm) before typing it.
     * If 'repeat' > 0, 'text' will be shuffled again before each repetition.
     */
    shuffle: {
      type: Boolean,
      default: () => false
    },
    /**
     * 'typing'  - starts VueTyper off as a blank space and begins to type the first word.
     * 'erasing' - starts VueTyper off with the first word already typed, and begins to erase.
     */
    initialAction: {
      type: String,
      default: () => STATE.TYPING,
      validator: (value: string) => !!value.match(`^${STATE.TYPING}|${STATE.ERASING}$`)
    },
    /**
     * Milliseconds to wait before typing the first character.
     */
    preTypeDelay: {
      type: Number,
      default: () => 70,
      validator: (value: number) => value >= 0
    },
    /**
     * Milliseconds to wait after typing a character, until the next character is typed.
     */
    typeDelay: {
      type: Number,
      default: () => 70,
      validator: (value: number) => value >= 0
    },
    /**
     * Milliseconds to wait before performing the first erase action (backspace, highlight, etc.).
     */
    preEraseDelay: {
      type: Number,
      default: () => 2000,
      validator: (value: number) => value >= 0
    },
    /**
     * Milliseconds to wait after performing an erase action (backspace, highlight, etc.),
     * until the next erase action can start.
     */
    eraseDelay: {
      type: Number,
      default: () => 250,
      validator: (value: number) => value >= 0
    },
    /**
     * 'backspace'   - Erase one character at a time, like pressing backspace.
     * 'select-back' - Highlight back one character at a time; erase once all characters are highlighted.
     * 'select-all'  - Highlight all characters at once; erase afterwards.
     * 'clear'       - Immediately erases everything; text simply disappears.
     */
    eraseStyle: {
      type: String,
      default: () => ERASE_STYLE.SELECT_ALL,
      validator: (value: string) => {
        const keys = Object.keys(ERASE_STYLE) as (keyof EraseType)[]
        return keys.some((item) => ERASE_STYLE[item] === value)
      }
    },
    /**
     * Flag to erase everything once VueTyper is finished typing. Set to false to leave the last word visible.
     */
    eraseOnComplete: {
      type: Boolean,
      default: () => false
    },
    /**
     * Caret animation style. See Caret.vue.
     */
    caretAnimation: String
  },
  emits: ["typedChar", "typed", "erased", "completed"],
  setup(props, {emit}) {

    const state = ref<ValueOf<StateType>>(STATE.IDLE)
    const nextState = ref<(ValueOf<StateType>) | null>(null)
    const spool = ref<string[]>([])
    const spoolIndex = ref(-1)
    const previousTextIndex = ref(-1)
    const currentTextIndex = ref(-1)
    const repeatCounter = ref(0)
    const actionTimeout = ref(0)
    const actionInterval = ref(0)

    const isSelectionBasedEraseStyle = computed(() => !!(props.eraseStyle as string)
        .match(`^${ERASE_STYLE.SELECT_BACK}|${ERASE_STYLE.SELECT_ALL}$`))

    const caretClasses = computed(() => {
      const idle = state.value === STATE.IDLE
      return {
        idle,
        "pre-type": idle && nextState.value === STATE.TYPING,
        "pre-erase": idle && nextState.value === STATE.ERASING,
        typing: state.value === STATE.TYPING,
        selecting: state.value === STATE.ERASING && isSelectionBasedEraseStyle.value,
        erasing: state.value === STATE.ERASING && !isSelectionBasedEraseStyle.value,
        complete: state.value === STATE.COMPLETE
      }
    })

    const rightCharClasses = computed(() => ({
      selected: state.value === STATE.ERASING && isSelectionBasedEraseStyle.value,
      erased: state.value !== STATE.ERASING ||
          state.value === STATE.ERASING && !isSelectionBasedEraseStyle.value
    }))

    const isEraseAllStyle = computed(() => !!(props.eraseStyle as string)
        .match(`^${ERASE_STYLE.CLEAR}|${ERASE_STYLE.SELECT_ALL}$`))

    const isDoneTyping = computed(() => currentTextIndex.value >= currentTextLength.value)

    const isDoneErasing = computed(() => {
      // Selection-based erase styles must stay in the highlight stage for one iteration before erasing is finished.
      if (isSelectionBasedEraseStyle.value)
        return currentTextIndex.value <= 0 && previousTextIndex.value <= 0
      return currentTextIndex.value <= 0
    })

    const onLastWord = computed(() => spoolIndex.value === spool.value.length - 1)

    const shouldRepeat = computed(() => repeatCounter.value < props.repeat)

    const currentText = computed(() => {
      const index = unref(spoolIndex)
      if (index >= 0 && index < unref(spool).length)
        return unref(spool)[index]
      return ""
    })

    const currentTextArray = computed(() => split(currentText.value, ""))
    // NOTE: Using currentText.length will count each individual codepoint as a
    // separate character, which is likely not what you want. currentTextLength will
    // count Unicode characters made up of multiple codepoints as a single character.
    const currentTextLength = computed(() => currentTextArray.value.length)

    const numLeftChars = computed(() => currentTextIndex.value < 0 ? 0 : currentTextIndex.value)

    const numRightChars = computed(() => currentTextLength.value - numLeftChars.value)

    watch(() => props.text as string[], (newText: Array<string>, oldText: Array<string>) => {
      if (newText === oldText || shallowEqual(newText, oldText))
        return
      reset()
    })
    watch(() => props.repeat, () => reset())
    watch(() => props.shuffle, () => reset())

    onMounted(() => {
      init()
    })
    onBeforeUnmount(() => {
      cancelCurrentAction()
    })

    function init() {
      // Process the 'text' prop into a typing spool
      if (typeof (props.text as string) === "string")
        spool.value = [props.text as string]
      else {
        // Don't violate one-way binding, make a copy! Vue doesn't make a copy for us to keep things reactive
        let textCopy = (props.text as string[]).slice()
        textCopy = textCopy.filter(textToType => textToType.length > 0)
        spool.value = textCopy
      }

      repeatCounter.value = 0
      resetSpool()

      if (props.initialAction === STATE.TYPING)
        startTyping()
      else if (props.initialAction === STATE.ERASING) {
        // This is a special case when we start off in erasing mode. The first text is already considered typed, and
        // it may even be the only text in the spool. So don't jump directly into erasing mode (in-case 'repeat' and
        // 'eraseOnComplete' are configured to false), and instead jump to the "we just finished typing a word" phase.
        moveCaretToEnd()
        onTyped()
      }
    }

    function reset() {
      cancelCurrentAction()
      init()
    }

    function resetSpool() {
      spoolIndex.value = 0
      if (props.shuffle && spool.value.length > 1) {
        shuffle(spool.value)
      }
    }

    function cancelCurrentAction() {
      if (actionInterval.value) {
        clearInterval(actionInterval.value)
        actionInterval.value = 0
      }
      if (actionTimeout.value) {
        clearTimeout(actionTimeout.value)
        actionTimeout.value = 0
      }
    }

    function shiftCaret(delta: number) {
      previousTextIndex.value = currentTextIndex.value
      const newCaretIndex = currentTextIndex.value + delta
      currentTextIndex.value = Math.min(Math.max(newCaretIndex, 0), currentTextLength.value)
    }

    function moveCaretToStart() {
      previousTextIndex.value = currentTextIndex.value
      currentTextIndex.value = 0
    }

    function moveCaretToEnd() {
      previousTextIndex.value = currentTextIndex.value
      currentTextIndex.value = currentTextLength.value
    }

    function typeStep() {
      if (!isDoneTyping.value) {
        shiftCaret(1)
        const typedCharIndex = previousTextIndex.value
        const typedChar = currentTextArray.value[typedCharIndex]
        emit("typedChar", typedChar, typedCharIndex)
      }
      if (isDoneTyping.value) {
        cancelCurrentAction()
        // Ensure the last typed character is rendered before proceeding
        // Note that $nextTick is not required after typing the previous characters due to setInterval
        nextTick(onTyped)
      }
    }

    function eraseStep() {
      if (!isDoneErasing.value) {
        if (isEraseAllStyle.value) {
          moveCaretToStart()
        } else shiftCaret(-1)
      }
      if (isDoneErasing.value) {
        cancelCurrentAction()
        // Ensure every last character is 'erased' in the DOM before proceeding
        nextTick(onErased)
      }
    }

    function startTyping() {
      if (actionTimeout.value || actionInterval.value)
        return

      moveCaretToStart()
      state.value = STATE.IDLE
      nextState.value = STATE.TYPING
      actionTimeout.value = setTimeout(() => {
        state.value = STATE.TYPING
        typeStep()
        if (!isDoneTyping.value)
          actionInterval.value = setInterval(typeStep, props.typeDelay)
      }, props.preTypeDelay)
    }

    function startErasing() {
      if (actionTimeout.value || actionInterval.value) {
        return
      }
      moveCaretToEnd()
      state.value = STATE.IDLE
      nextState.value = STATE.ERASING
      actionTimeout.value = setTimeout(() => {
        state.value = STATE.ERASING
        eraseStep()

        if (!isDoneErasing.value)
          actionInterval.value = setInterval(eraseStep, props.eraseDelay)
      }, props.preEraseDelay)
    }

    function onTyped() {
      emit("typed", unref(currentText))
      if (unref(onLastWord)) {
        if (props.eraseOnComplete || unref(shouldRepeat))
          startErasing()
        else
          onComplete()
      } else
        startErasing()
    }

    function onErased() {
      emit("erased", currentText.value)
      if (onLastWord.value) {
        if (shouldRepeat.value) {
          repeatCounter.value++
          resetSpool()
          startTyping()
        } else
          onComplete()
      } else {
        spoolIndex.value++
        startTyping()
      }
    }

    function onComplete() {
      state.value = STATE.COMPLETE
      nextState.value = null
      emit("completed")
    }

    return {
      numLeftChars,
      currentTextArray,
      caretClasses,
      numRightChars,
      rightCharClasses,
      currentTextLength,
      currentTextIndex,
      state,

      moveCaretToStart,
      moveCaretToEnd,
      shiftCaret,
      typeStep,
      onTyped,
      onErased,
      onComplete
    }
  }
})
</script>
