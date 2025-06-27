export const map = <T, K>(value: T | null | undefined, fn: (value: T) => K): K | null | undefined => {
  if (value != null) {
    return fn(value)
  } else {
    return value as null | undefined
  }
}

export const filter = <T>(value: T | null | undefined, fn: (value: T) => boolean): T | null | undefined => {
  if (value != null) {
    if (fn(value)) {
      return value
    } else {
      return null
    }
  } else {
    return value as null | undefined
  }
}
