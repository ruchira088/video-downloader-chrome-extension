export interface KeyValueStore<K, V extends NonNullable<unknown>> {
  put(key: K, value: V): Promise<V | null>

  get(key: K): Promise<V | null>

  remove(key: K): Promise<V | null>
}
