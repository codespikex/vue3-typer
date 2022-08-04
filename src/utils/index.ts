function validNumber(num: number | unknown): num is number {
    return typeof num === "number" && !Number.isNaN(num) && Number.isFinite(num)
}

function validRange(lower: number | unknown, upper: number | unknown) {
    return validNumber(lower) && validNumber(upper) && lower <= upper
}

function swap<T extends any>(a: Array<T>, i: number, j: number) {
    if (i === j) {
        return
    }
    const temp = a[i]
    a[i] = a[j]
    a[j] = temp
}

/**
 * @param min - Minimum random int
 * @param max - Maximum random int
 * @returns a random int in the range [min, max], or -1 if either of the following conditions are met:
 *  - min and/or max are not of type 'number', NaN, or Infinity
 *  - min > max
 */
export function randomInt(min: number, max: number): number {
    if (!validRange(min, max))
        return -1

    // Since we're generating random integers, rounded the arguments to the closest int within the range
    min = Math.ceil(min)
    max = Math.floor(max)

    return Math.floor(Math.random() * (max - min + 1)) + min
}


/**
 * Performs a shallow comparison between 2 arrays.
 * @param {Array} a1
 * @param {Array} a2
 * @returns true if the array contents are strictly equal (===); false otherwise
 */
export function shallowEqual<T>(a1: Array<T>, a2: Array<T>): boolean {
    if (!Array.isArray(a1) || !Array.isArray(a2))
        return false

    if (a1.length !== a2.length)
        return false

    for (let i = 0; i < a1.length; i++) {
        if (a1[i] !== a2[i])
            return false
    }

    return true
}

/**
 * Performs an in-place shuffle.
 * Implemented using the Fisher-Yates/Knuth shuffle algorithm.
 * @param list - Array of items to shuffle in-place.
 */
export function shuffle<T>(list: Array<T>): any {
    if (!(list instanceof Array))
        return list

    for (let i = list.length - 1; i > 0; i--) {
        let randomIndex = randomInt(0, i)
        swap(list, i, randomIndex)
    }
}

