namespace NodeJS {
    interface ProcessEnv {
        /**
         * The host of the database.
         */
        readonly DB_HOST?: string;

        /**
         * The port of the database.
         */
        readonly DB_PORT?: string;

        /**
         * The user to use when logging in to the database.
         */
        readonly DB_USER?: string;

        /**
         * The password to use when logging in to the database.
         */
        readonly DB_PASSWORD?: string;

        /**
         * The name of the database to use.
         */
        readonly DB_NAME?: string;

        /**
         * The secret key to use when signing cookies.
         */
        readonly COOKIE_SECRET?: string;

        /**
         * The key that is used to encrypt user sessions.
         */
        readonly SESSION_ENCRYPTION_KEY?: string;

        /**
         * The host of the upstream API.
         */
        readonly TTMS_UPSTREAM_HOST?: string;

        /**
         * The matric number to use when scraping data from upstream database.
         */
        readonly SCRAPER_MATRIC_NO?: string;

        /**
         * The password to use when scraping data from upstream database.
         */
        readonly SCRAPER_PASSWORD?: string;

        /**
         * The port for the server to listen on.
         */
        readonly SERVER_PORT?: string;
    }
}
