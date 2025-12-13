-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ReceiptSource" AS ENUM ('WEB', 'EMAIL', 'TELEGRAM', 'API');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('EXPENSE', 'INCOME');

-- CreateEnum
CREATE TYPE "EmailJobStatus" AS ENUM ('pending', 'generating', 'sending', 'sent', 'failed');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT,
    "role" TEXT NOT NULL DEFAULT 'owner',
    "telegramChatId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "plateNumber" TEXT,
    "vin" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Receipt" (
    "id" TEXT NOT NULL,
    "legacyId" TEXT,
    "storeName" TEXT NOT NULL,
    "storeLocation" TEXT,
    "category" TEXT,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "totalAmount" DECIMAL(18,4) NOT NULL,
    "taxAmount" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'completed',
    "source" "ReceiptSource" NOT NULL,
    "type" "TransactionType" NOT NULL DEFAULT 'EXPENSE',
    "fileUrl" TEXT,
    "sheetRowId" TEXT,
    "distanceKm" DECIMAL(18,4),
    "meta" JSONB,
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "vehicleId" TEXT,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceiptItem" (
    "id" TEXT NOT NULL,
    "receiptId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "quantity" DECIMAL(18,4),
    "unitPrice" DECIMAL(18,4),
    "totalPrice" DECIMAL(18,4),
    "isEstimated" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[],
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReceiptItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricMonthly" (
    "id" TEXT NOT NULL,
    "month" VARCHAR(7) NOT NULL,
    "metricKey" TEXT NOT NULL,
    "valueNumeric" DECIMAL(24,8),
    "valueText" TEXT,
    "valueJson" JSONB,
    "unit" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetricMonthly_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndicatorDefinition" (
    "id" TEXT NOT NULL,
    "metricKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "unit" TEXT,
    "calculation" JSONB,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndicatorDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalysisReport" (
    "id" TEXT NOT NULL,
    "month" VARCHAR(7) NOT NULL,
    "model" TEXT NOT NULL,
    "role" TEXT,
    "summaryText" TEXT NOT NULL,
    "recommendations" JSONB NOT NULL,
    "vehicleInsights" JSONB,
    "spendingBreakdown" JSONB,
    "rawResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalysisReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailJob" (
    "id" TEXT NOT NULL,
    "month" VARCHAR(7) NOT NULL,
    "status" "EmailJobStatus" NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "sentAt" TIMESTAMP(3),
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_legacyId_key" ON "Receipt"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "MetricMonthly_month_metricKey_key" ON "MetricMonthly"("month", "metricKey");

-- CreateIndex
CREATE UNIQUE INDEX "IndicatorDefinition_metricKey_key" ON "IndicatorDefinition"("metricKey");

-- CreateIndex
CREATE UNIQUE INDEX "AnalysisReport_month_model_key" ON "AnalysisReport"("month", "model");

-- CreateIndex
CREATE INDEX "EmailJob_month_status_idx" ON "EmailJob"("month", "status");

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptItem" ADD CONSTRAINT "ReceiptItem_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "Receipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

