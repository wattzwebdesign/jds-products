-- Add product detail fields to Product table
-- Migration created: 2025-10-24

ALTER TABLE `Product`
ADD COLUMN `caseQty` INT NULL,
ADD COLUMN `color` VARCHAR(100) NULL,
ADD COLUMN `length` DECIMAL(10, 2) NULL,
ADD COLUMN `height` DECIMAL(10, 2) NULL,
ADD COLUMN `width` DECIMAL(10, 2) NULL,
ADD COLUMN `lastPriceChange` VARCHAR(100) NULL;
