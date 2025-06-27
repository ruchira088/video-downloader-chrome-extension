export const map = <T, K>(value: T | null | undefined, fn: (value: T) => K): K | null | undefined => {
  if (value != null) {
    return fn(value)
  } else {
    return value as null | undefined
  }
}