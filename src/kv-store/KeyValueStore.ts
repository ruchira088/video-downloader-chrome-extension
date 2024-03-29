import { Maybe } from "monet"

export interface KeyValueStore<K, V extends {}> {
  put(key: K, value: V): Promise<Maybe<V>>

  get(key: K): Promise<Maybe<V>>

  remove(key: K): Promise<Maybe<V>>
}
