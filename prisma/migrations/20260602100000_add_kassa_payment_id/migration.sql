-- Add YooKassa payment id to Order
ALTER TABLE "Order" ADD COLUMN "kassaPaymentId" TEXT;
