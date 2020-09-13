// const VIDEO_DOWNLOADER_API_URL = "https://webhook.site/53bc3b04-0bb1-4716-baef-43dc45c32463"
const VIDEO_DOWNLOADER_API_URL = "http://localhost:8000"

export const videoExists =
    (url: string): Promise<Boolean> =>
        fetch(`${VIDEO_DOWNLOADER_API_URL}/schedule/search?video-url=${url}`)
            .then(response => response.json())
            .then((body: { results: object[] }) => body.results.length > 0)

export const scheduleVideo =
    (url: string): Promise<boolean> =>
        fetch(`${VIDEO_DOWNLOADER_API_URL}/schedule`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({url})
        })
            .then(response => response.ok)
