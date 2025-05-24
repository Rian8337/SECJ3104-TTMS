import { TTMSService } from "@/api";
import { db } from "@/database";
import { venues, VenueType } from "@/database/schema";

const ttmsService = new TTMSService();

(async () => {
    const serverVenues = await ttmsService.fetchRooms("FSKSM");

    if (!serverVenues) {
        console.error("Failed to fetch venues");
        return;
    }

    await db
        .insert(venues)
        .ignore()
        .values(
            serverVenues.map((v): typeof venues.$inferInsert => {
                let venueType: VenueType;

                switch (v.jenis) {
                    case "-":
                        venueType = VenueType.none;
                        break;

                    case "Makmal":
                        venueType = VenueType.laboratory;
                        break;

                    case "Bilik Kuliah":
                        venueType = VenueType.lectureRoom;
                        break;
                }

                return {
                    code: v.kod_ruang,
                    name: v.nama_ruang,
                    shortName: v.nama_ruang_singkatan,
                    capacity: v.kapasiti,
                    type: venueType,
                };
            })
        );

    console.log("Inserted", serverVenues.length, "venues");
})()
    .catch(console.error)
    .finally(() => {
        process.exit(0);
    });
