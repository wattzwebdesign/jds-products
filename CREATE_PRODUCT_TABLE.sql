-- Create Product table for JDS Products platform
-- Run this on the production database to add product search functionality

CREATE TABLE IF NOT EXISTS `Product` (
  `id` VARCHAR(191) NOT NULL,
  `sku` VARCHAR(191) NOT NULL,
  `name` VARCHAR(500) NOT NULL,
  `description` TEXT NULL,
  `category` VARCHAR(255) NULL,
  `basePrice` DECIMAL(10, 2) NULL,
  `availableQty` INT NOT NULL DEFAULT 0,
  `localQty` INT NOT NULL DEFAULT 0,
  `imageUrl` TEXT NULL,
  `lastSynced` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Product_sku_key`(`sku`),
  INDEX `Product_sku_idx`(`sku`),
  INDEX `Product_name_idx`(`name`(191)),
  INDEX `Product_availableQty_idx`(`availableQty`),
  INDEX `Product_localQty_idx`(`localQty`),
  FULLTEXT INDEX `Product_name_description_idx`(`name`, `description`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
