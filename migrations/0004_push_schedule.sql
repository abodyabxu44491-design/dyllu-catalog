-- Notifications sent automatically for new offers and ads; ones that start later wait for their start time
ALTER TABLE "Announcement" ADD COLUMN "sendAt" DATETIME;
ALTER TABLE "Announcement" ADD COLUMN "source" TEXT;
