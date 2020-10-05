import { Maybe } from "monet";
import storageAreaKeyValueStore from "../kv-store/StorageAreaKeyValueStore";
import { StorageKey } from "../kv-store/StorageKey";
import { KeyValueStore } from "../kv-store/KeyValueStore";

const showApiServerUrl = (
  keyValueStore: KeyValueStore<string, string>,
  apiServerTextInput: HTMLInputElement
) =>
  keyValueStore.get(StorageKey.ApiServerUrl).then((result) => {
    apiServerTextInput.value = result.getOrElse("");
  });

const addButtonClickHandler = (
  keyValueStore: KeyValueStore<string, string>,
  saveButton: HTMLButtonElement,
  apiServerTextInput: HTMLInputElement
) => {
  saveButton.addEventListener("click", () => {
    keyValueStore
      .put(StorageKey.ApiServerUrl, apiServerTextInput.value)
      .then(() => showApiServerUrl(keyValueStore, apiServerTextInput));
  });
};

window.onload = () => {
  const saveButton = Maybe.fromFalsy(
    document.getElementById("save-button")
  ) as Maybe<HTMLButtonElement>;
  const apiServerTextInput = Maybe.fromFalsy(
    document.getElementById("api-server-input")
  ) as Maybe<HTMLInputElement>;

  const keyValueStore = storageAreaKeyValueStore();

  saveButton.forEach((button) => {
    apiServerTextInput.forEach((textInput) => {
      showApiServerUrl(keyValueStore, textInput).then(() =>
        addButtonClickHandler(keyValueStore, button, textInput)
      );
    });
  });
};
