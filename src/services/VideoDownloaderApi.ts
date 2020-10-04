const VIDEO_DOWNLOADER_API_URL = "https://api.video.home.ruchij.com"

export const videoExists =
    (url: string): Promise<Boolean> =>
        fetch(`${VIDEO_DOWNLOADER_API_URL}/schedule/search?video-url=${url}`)
            .then(response =>
                response.json().then(body => response.ok ? Promise.resolve(body) : Promise.reject(body))
            )
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
