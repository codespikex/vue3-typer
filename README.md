<p align="center">
  <img src="https://github.com/codespikex/vue3-typer/blob/main/assets/demo.gif?raw=true" alt="Vue3Typer Demo gif"/>
  <br><br>
  Vue component that simulates a user typing, selecting, and erasing text.
  <br><br>
</p>

- [Getting Started](#getting-started)
- [Usage](#usage)
- [Props](#props)
    - [text](#text)
    - [repeat](#repeat)
    - [shuffle](#shuffle)
    - [initialAction](#initialaction)
    - [preTypeDelay](#pretypedelay)
    - [typeDelay](#typedelay)
    - [preEraseDelay](#preerasedelay)
    - [eraseDelay](#erasedelay)
    - [eraseStyle](#erasestyle)
    - [eraseOnComplete](#eraseoncomplete)
    - [caretAnimation](#caretanimation)
- [Events](#events)
    - [typed](#typed)
    - [typed-char](#typed-char)
    - [erased](#erased)
    - [completed](#completed)
- [Styles](#styles)
- [Contribution Guide](#contribution-guide)
- [License](#license)

## Getting Started

> Vue3Typer has a single dependency to [lodash.split](https://github.com/lodash/lodash/blob/master/split.js) to support
> emojis and other multi-codepoint Unicode characters.

> Vue3Typer is a fork of [VueTyper](https://github.com/cngu/vue-typer) created by [cngu](https://github.com/cngu) for
> Vue 2.x.

### Prerequisites

- Vue v3.x

### Installation

#### npm

Use this method if you wish to import/require VueTyper as a module.

```bash
npm install --save vue3-typer
// or
pnpm add vue3-typer
```

#### CDN

Use this method if you wish to access VueTyper globally via `window.Vue3Typer`.

```html

<script src="https://unpkg.com/vue3-typer/dist/vue3-typer.umd.js"></script>
<link rel="stylesheet" href="https://unpkg.com/vue3-typer/dist/vue-typer.css">
```

## Usage

After installing Vue3Typer, you may choose to register it either globally or
locally. [What's the difference? See the Vue documentation here.](https://vuejs.org/guide/components/registration.html)

#### Local Registration

1. Import the Vue3Typer component directly from your Vue component file:

```ts
  // ES6
import {VueTyper} from 'vue-typer'
import "vue3-typer/dist/vue-typer.css"
// Global
const VueTyper = window.Vue3Typer.VueTyper
```

2. Register it as a local component in your Vue component options:

```ts
export default defineComponent({
    // ...
    components: {
        VueTyper
    }
})
```

3. Use vue-typer in your Vue component's template:

```html

<VueTyper text='Hello World! I was registered locally!'></VueTyper>
```

#### Global Registration

1. Import the VueTyper plugin in your application entry point:

```ts
  // ES6
import VueTyper from 'vue-typer'
import "vue3-typer/dist/vue-typer.css"
// Global
const VueTyper = window.VueTyper.default
```

2. Register the VueTyper plugin with Vue

```ts
  app.use(VueTyper)
```

3. Now you can freely use vue-typer in any Vue component template:

```html

<VueTyper text='Hello World! I was registered globally!'></VueTyper>
```

## Props

#### `text`

- **type**: `String || Array`
- **required**
- **validator**: Non-empty
- **Usage**:

  ```html
  <VueTyper text='watermelon'></VueTyper>
  ```

  Either a single string, or an ordered list of strings, for VueTyper to type. Strings will not be trimmed.

- **Note**: Dynamically changing this value after VueTyper has mounted will cause VueTyper to reset itself and start
  typing from scratch.
- **See also**: [`shuffle`](#shuffle)

#### `repeat`

- **type**: `Number`
- **default**: `Infinity`
- **validator**: Non-negative
- **Usage**:

  ```html
  <VueTyper text='watermelon' :repeat='0'></VueTyper>
  ```

  Number of _extra_ times to type `text` after the first time. Setting 0 will type `text` once; 1 will type twice;
  Infinity will type forever.

- **Note**: Dynamically changing this value after VueTyper has mounted will cause VueTyper to reset itself and start
  typing from scratch.

#### `shuffle`

- **type**: `Boolean`
- **default**: `false`
- **Usage**:

  ```html
  <VueTyper text='watermelon' :shuffle='true'></VueTyper>
  ```

  Randomly
  shuffles `text` ([using the Fisher-Yates shuffle](https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle)) before
  typing it. If `repeat > 0`, `text` will always be shuffled before repeated typings. `text` is _not_ shuffled after
  every word is typed. This implies that:
    - all strings in `text` will be typed the same number of times, but just in a shuffled order
    - the frequencies of the order of strings typed will have equal distributions, e.g.:
        - given `text=['a','b']`, a,b will be printed 50% of the time, and b,a the other 50%
        - given `text=['a','b','c']`, there are 3!=6 possible permutations, and they will each be printed 100%/6=16.7%
          of the time
    - the only scenarios where the same word can be typed twice in a row are when:
        1. `text` contains duplicate strings, or
        2. `repeat > 0`, `text` is typed where the last word is W, and the next repeat typing shuffled `text` such that
           it starts with W.

- **Note**: Dynamically changing this value after VueTyper has mounted will cause VueTyper to reset itself and start
  typing from scratch.

#### `initialAction`

- **type**: `String`
- **default**: `"typing"`
- **validator**: `"typing"` || `"erasing"`
- **Usage**:

  ```html
  <VueTyper text='watermelon' initial-action='erasing'></VueTyper>
  ```

  `typing` starts VueTyper off in the "typing" state; there will be empty space as VueTyper begins to type the first
  string in `text`.

  `erasing` starts VueTyper off in the "erasing" state; the first string in `text` will already be typed and visible as
  VueTyper begins to erase it.

#### `preTypeDelay`

- **type**: `Number`
- **default**: `70`
- **validator**: Non-negative
- **Usage**:

  ```html
  <VueTyper text='watermelon' pre-type-delay='1000'></VueTyper>
  ```

  Milliseconds to wait before typing the first character of every string in `text`.

  This is useful to have an idle period to show a blank space for a period of time before VueTyper types the first
  character.

#### `typeDelay`

- **type**: `Number`
- **default**: `70`
- **validator**: Non-negative
- **Usage**:

  ```html
  <VueTyper text='watermelon' type-delay='100'></VueTyper>
  ```

  Milliseconds to wait after typing a character, until the next character is typed.

#### `preEraseDelay`

- **type**: `Number`
- **default**: `2000`
- **validator**: Non-negative
- **Usage**:

  ```html
  <VueTyper text='watermelon' pre-erase-delay='1000'></VueTyper>
  ```

  Milliseconds to wait after a string is fully typed, until the first erase action (i.e. backspace, highlight) is
  performed.

  This is useful to have an idle period that gives users time to read the typed string before it is erased.

#### `eraseDelay`

- **type**: `Number`
- **default**: `250`
- **validator**: Non-negative
- **Usage**:

  ```html
  <VueTyper text='watermelon' erase-delay='70'></VueTyper>
  ```

  Milliseconds to wait after performing an erase action (i.e. backspace, highlight), until the next erase action can
  start.

#### `eraseStyle`

- **type**: `String`
- **default**: `"select-all"`
- **validator**: `"backspace"` || `"select-back"` || `"select-all"` || `"clear"`
- **Usage**:

  ```html
  <VueTyper text='watermelon' erase-style='backspace'></VueTyper>
  ```

  `backspace` erases one character at a time, simulating the backspace key.

  `select-back` highlights backward one character at a time, simulating Shift+LeftArrow, and erases everything once all
  characters are highlighted.

  `select-all` immediately highlights all characters at once, simulating Ctrl/Cmd+A, and erases all characters
  afterwards.

  `clear` immediately erases all characters at once; the typed string simply disappears.

#### `eraseOnComplete`

- **type**: `Boolean`
- **default**: `false`
- **Usage**:

  ```html
  <VueTyper text='watermelon' :erase-on-complete='true'></VueTyper>
  ```

  By default, after VueTyper completes all its typing (i.e. it finishes typing all strings in `text`, `repeat+1` times),
  the last typed string will not be erased and stay visible. Enabling this flag will tell VueTyper to erase the final
  string as well.

- **Note**: Has no effect if `repeat === Infinity`.

#### `caretAnimation`

- **type**: `String`
- **default**: `"blink"`
- **validator**: `"solid"` || `"blink"` || `"smooth"` || `"phase"` || `"expand"`
- **Usage**:

  ```html
  <VueTyper text='watermelon' caret-animation='smooth'></VueTyper>
  ```

  Specifies a built-in caret animation to use, similar to Sublime and VS Code animations.

- **Note**: Alternatively, custom animations can be applied via CSS.

## Events

#### `typed`

- **Event data**:
    - `String` typedString
- **Usage**:

```vue

<template>
  <VueTyper text='watermelon' @typed='onTyped'></VueTyper>
</template>
<script lang="ts" setup>
function onTyped(typedString: string) {
  // handle typed string
}
</script>
```

Emitted everytime VueTyper finishes typing a string.

#### `typed-char`

- **Event data**:
    - `String` typedChar
    - `Number` typedCharIndex
- **Usage**:

```vue

<template>
  <VueTyper text='watermelon' @typed-char='onTypedChar'></VueTyper>
</template>
<script lang="ts" setup>
function onTypedChar(typedChar: string, typedCharIndex: number) {
  // handle typed character at the given index
  // call #1: 'w', 0
  // call #2: 'a', 1
  // call #3: 't', 2
  // ...
}
</script>
```

Emitted everytime VueTyper finishes typing a single character.

#### `erased`

- **Event data**:
    - `String` erasedString
- **Usage**:

```vue

<template>
  <VueTyper text='watermelon' @erased='onErased'></VueTyper>
</template>
<script lang="ts" setup>
function onErased(erasedString: string) {
  // handle erased string
}
</script>
```

Emitted everytime VueTyper finishes erasing a string.

#### `completed`

- **Usage**:

```vue

<template>
  <VueTyper text='watermelon' @completed='onComplete'></VueTyper>
</template>
<script lang="ts" setup>
function onComplete() {
  // handle event when VueTyper has finished all typing/erasing
}
</script>
```

Emitted when VueTyper has finished typing all words in [`text`](#text), [`repeat`](#repeat)`+1` times.

- **Note**: If [`eraseOnComplete`](#eraseoncomplete) is enabled, the final typed string must also be erased before this
  event is emitted.

## Styles
To keep the separation of concern between component code and styles, VueTyper can be fully styled through CSS (as opposed to props).

The following is a skeleton selector structure to override the style of each component of VueTyper.

- **Usage**:
  ```scss
  /* SCSS */
  .vue-typer {
    /* Styles for the vue-typer container
       e.g. font-family, font-size  */
    .custom.char {
      /* Styles for each character
         e.g. color, background-color */
      &.typed {
        /* Styles specific to typed characters
           i.e. characters to the left of the caret */
      }
      &.selected {
        /* Styles specific to selected characters
           i.e. characters to the right of the caret while VueTyper's
                'eraseStyle' is set to a selection-based style */
      }
      &.erased {
        /* Styles specific to erased characters
           i.e. characters to the right of the caret while VueTyper's
                'eraseStyle' is set to a non-selection-based style */
      }
    }
    .custom.caret {
      /* Styles for the caret
         e.g. background-color, animation, display */
      &.pre-type {
        /* Styles for the caret when it is idle before typing
           i.e. before a string starts being typed, during 'preTypeDelay' */
      }
      &.pre-erase {
        /* Styles for the caret when it is idle before erasing
           i.e. before a string starts being erased, during 'preEraseDelay' */
      }
      &.idle {
        /* Styles for the caret when it is idle, but VueTyper has not yet completed typing
           i.e. when 'pre-type' or 'pre-erase' is set, but not 'complete' */
      }
      &.typing {
        /* Styles for the caret while VueTyper is typing
           i.e. when the caret is moving forwards */
      }
      &.selecting {
        /* Styles for the caret while VueTyper is selecting
           i.e. when the caret is moving backwards and 'eraseStyle' is
           set to a selection-based style */
      }
      &.erasing {
        /* Styles for the caret while VueTyper is erasing
           i.e. when the caret is moving backwards and 'eraseStyle' is
           set to a non-selection-based style */
      }
      &.complete {
        /* Styles for the idle caret when VueTyper has finished all typing/erasing */
      }
    }
  }
  ```

- **Note**: Some of the default styles above make things hidden using `display: none;`. If you wish to make it visible again, use `display: inline-block;`. Do not use `block`.

## Contribution Guide
1. Make all changes on the `dev` branch.
3. Add unit tests.
4. Update this README if necessary.
5. Submit a PR!

## Changelog
Changes for each release will be documented [here](https://github.com/codespikex/vue3-typer/releases).

## License

[MIT](http://opensource.org/licenses/MIT)

Copyright &copy; 2022, CodeSpikex. All rights reserved.
