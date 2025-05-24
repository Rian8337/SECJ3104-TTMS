/**
 * A base class for API services.
 */
export abstract class APIService {
    /**
     * The host URL for the API service.
     */
    abstract get host(): URL;

    /**
     * Fetches JSON data from the given URL.
     *
     * @param url The URL to fetch data from.
     * @returns The JSON data, `null` if the request fails.
     */
    protected async fetchJSON<T>(url: URL): Promise<T | null> {
        return fetch(url)
            .then((res) => {
                if (!res.ok) {
                    throw this.createRequestFailError(res);
                }

                return res.json() as Promise<T>;
            })
            .catch((e: unknown) => {
                console.error("Error fetching data:", e);

                return null;
            });
    }

    /**
     * Creates an error for a failed request.
     *
     * @param res The response object from the failed request.
     * @returns An error object with the status and status text.
     */
    protected createRequestFailError(res: Response): Error {
        return new Error(
            `Request failed with status ${res.status.toString()} (${res.statusText})`
        );
    }
}
