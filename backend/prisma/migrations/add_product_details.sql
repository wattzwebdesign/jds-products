-- Add product detail fields to Product table
-- Migration created: 2025-10-24

ALTER TABLE `Product`
ADD COLUMN `caseQty` INT NULL AFTER `imageUrl`,
ADD COLUMN `color` VARCHAR(100) NULL AFTER `caseQty`,
ADD COLUMN `length` DECIMAL(10, 2) NULL AFTER `color`,
ADD COLUMN `height` DECIMAL(10, 2) NULL AFTER `length`,
ADD COLUMN `width` DECIMAL(10, 2) NULL AFTER `height`,
ADD COLUMN `lastPriceChange` VARCHAR(100) NULL AFTER `width`;
