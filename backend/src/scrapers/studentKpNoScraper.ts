import { retrieveStudentKpNo } from "./scrapers";

(async () => {
    await retrieveStudentKpNo();
    console.log("Done");
})()
    .catch(console.error)
    .finally(() => {
        process.exit(0);
    });
