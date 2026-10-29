-- Verissimo Pratas — dados operacionais (pedidos, estoque, cupons, sessões)
-- Não remove tabelas legadas (Aurora). Execute no banco u586160337_verissimo.

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `vp_meta` (
  `k` VARCHAR(64) NOT NULL,
  `v` TEXT NOT NULL,
  PRIMARY KEY (`k`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `vp_products` (
  `id` VARCHAR(64) NOT NULL,
  `stock` INT NOT NULL DEFAULT 0,
  `in_stock` TINYINT(1) NOT NULL DEFAULT 1,
  `status` VARCHAR(32) NOT NULL DEFAULT 'active',
  `price_cents` INT NOT NULL DEFAULT 0,
  `sale_price_cents` INT DEFAULT NULL,
  `product_json` JSON NOT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_vp_products_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `vp_orders` (
  `id` VARCHAR(64) NOT NULL,
  `order_number` VARCHAR(40) NOT NULL,
  `payload` JSON NOT NULL,
  `idempotency_key` VARCHAR(128) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_vp_orders_number` (`order_number`),
  UNIQUE KEY `uk_vp_orders_idempotency` (`idempotency_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `vp_coupons` (
  `code` VARCHAR(64) NOT NULL,
  `type` ENUM('percentual','fixed') NOT NULL DEFAULT 'percentual',
  `value_bps` INT NOT NULL COMMENT 'percentual: basis points (1000=10%); fixed: centavos',
  `min_purchase_cents` INT NOT NULL DEFAULT 0,
  `usage_limit` INT DEFAULT NULL,
  `usage_count` INT NOT NULL DEFAULT 0,
  `starts_at` DATE DEFAULT NULL,
  `expires_at` DATE DEFAULT NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `vp_admin_sessions` (
  `token_hash` CHAR(64) NOT NULL,
  `email` VARCHAR(190) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `role` VARCHAR(32) NOT NULL,
  `csrf_token` CHAR(64) NOT NULL,
  `expires_at` INT UNSIGNED NOT NULL,
  `created_at` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`token_hash`),
  KEY `idx_vp_sessions_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `vp_meta` (`k`, `v`) VALUES ('schema_version', '1')
ON DUPLICATE KEY UPDATE `v` = VALUES(`v`);

INSERT INTO `vp_coupons` (`code`, `type`, `value_bps`, `min_purchase_cents`, `usage_limit`, `active`)
VALUES
  ('VERISSIMO10', 'percentual', 1000, 10000, 100, 1),
  ('PRATA15', 'percentual', 1500, 20000, 50, 1)
ON DUPLICATE KEY UPDATE `code` = `code`;
