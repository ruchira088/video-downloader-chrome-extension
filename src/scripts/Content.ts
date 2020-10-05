import { videoSiteHandlers } from "../handlers/VideoSiteHandler";
import { Maybe } from "monet";
import videoDownloaderApi, {
  VideoDownloaderApi,
} from "../services/VideoDownloaderApi";

window.onload = () => {
  const url = window.location.href;

  Maybe.fromNull(
    videoSiteHandlers.find((videoSiteHandler) =>
      url.startsWith(`https://${videoSiteHandler.videoSite.toLowerCase()}`)
    )
  ).forEach((videoSiteHandler) => {
    if (videoSiteHandler.isVideoPage(document)) {
      const downloadButton = createButton(document);
      downloadButton.disabled = true;

      videoSiteHandler
        .buttonContainer(document)
        .forEach((container) => container.appendChild(downloadButton));

      initializeElements(downloadButton, url);
    }
  });
};

export const createButton = (document: Document): HTMLButtonElement => {
  const downloadButton = document.createElement("button");
  downloadButton.id = "download-video-button";
  downloadButton.textContent = "Checking";

  return downloadButton;
};

const initializeDownloadButton = (
  api: VideoDownloaderApi,
  downloadButton: HTMLButtonElement,
  videoUrl: string
) =>
  api
    .videoExistsByUrl(videoUrl)
    .then((exists) => {
      if (exists) {
        downloadButton.textContent = "Already scheduled";
        downloadButton.disabled = true;
        return;
      } else {
        downloadButton.textContent = "Download";
        downloadButton.disabled = false;

        downloadButton.onclick = () => {
          downloadButton.disabled = true;

          return api
            .scheduleVideoDownload(videoUrl)
            .then(() =>
              initializeDownloadButton(api, downloadButton, videoUrl)
            );
        };
      }
    })
    .catch(({ errorMessages }: { errorMessages: string[] | undefined }) =>
      Promise.reject(
        new Error(
          Maybe.fromFalsy(errorMessages)
            .map((messages) => messages.join(", "))
            .orJust("Unknown error")
        )
      )
    );

export const initializeElements = (
  downloadButton: HTMLButtonElement,
  url: string
): Promise<void> =>
  videoDownloaderApi()
    .then((api) =>
      api
        .videoExistsByUrl(url)
        .then((exists) => {
          if (exists) {
            downloadButton.textContent = "Already scheduled";
            downloadButton.disabled = true;
            return;
          } else {
            downloadButton.textContent = "Download";
            downloadButton.disabled = false;

            downloadButton.onclick = () => {
              downloadButton.disabled = true;

              return api
                .scheduleVideoDownload(url)
                .then(() => initializeElements(downloadButton, url));
            };
          }
        })
        .catch(({ errorMessages }: { errorMessages: string[] | undefined }) =>
          Promise.reject(
            new Error(
              Maybe.fromFalsy(errorMessages)
                .map((messages) => messages.join(", "))
                .orJust("Unknown error")
            )
          )
        )
    )
    .catch((error) => {
      downloadButton.textContent = "Error";
      downloadButton.disabled = true;

      const errorSection = document.createElement("span");
      errorSection.style.marginLeft = "1em";
      errorSection.textContent = error;

      Maybe.fromFalsy(downloadButton.parentElement).forEach((parent) =>
        parent.appendChild(errorSection)
      );
    });
