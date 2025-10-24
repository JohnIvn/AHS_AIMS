-- CreateTable
CREATE TABLE "Staff_Account" (
    "staff_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "contact_number" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "Staff_Account_pkey" PRIMARY KEY ("staff_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Staff_Account_email_key" ON "Staff_Account"("email");
