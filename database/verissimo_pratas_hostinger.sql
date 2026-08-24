-- =========================================================
-- Verissimo Pratas 925 — schema MySQL (Hostinger / phpMyAdmin)
-- MESMA ESTRUTURA do projeto Aurora Confeitaria (aurora_mysql.sql)
-- Charset: utf8mb4
--
-- Como usar:
-- 1) No hPanel Hostinger, banco: u586160337_verissimo
-- 2) phpMyAdmin > selecione o banco > SQL > cole e Execute
-- NÃO precisa CREATE DATABASE se a Hostinger já criou o banco.
--
-- Tabelas idênticas à Aurora:
--   admins, settings, categories, products, product_flavors,
--   product_flavor_prices, gallery, clients, orders, order_items,
--   finance, reviews, faq, product_images
-- =========================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `product_images`;
DROP TABLE IF EXISTS `order_items`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `finance`;
DROP TABLE IF EXISTS `clients`;
DROP TABLE IF EXISTS `product_flavor_prices`;
DROP TABLE IF EXISTS `product_flavors`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `gallery`;
DROP TABLE IF EXISTS `faq`;
DROP TABLE IF EXISTS `reviews`;
DROP TABLE IF EXISTS `settings`;
DROP TABLE IF EXISTS `admins`;

CREATE TABLE `admins` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(190) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_admins_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `settings` (
  `id` TINYINT UNSIGNED NOT NULL DEFAULT 1,
  `name` VARCHAR(190) NOT NULL,
  `tagline` VARCHAR(255) DEFAULT NULL,
  `logo` VARCHAR(500) DEFAULT NULL,
  `banner` VARCHAR(500) DEFAULT NULL,
  `sobre_image` VARCHAR(500) DEFAULT NULL,
  `whatsapp` VARCHAR(30) DEFAULT NULL,
  `instagram` VARCHAR(255) DEFAULT NULL,
  `instagram_user` VARCHAR(120) DEFAULT NULL,
  `facebook` VARCHAR(255) DEFAULT NULL,
  `email` VARCHAR(190) DEFAULT NULL,
  `address` VARCHAR(500) DEFAULT NULL,
  `hours` VARCHAR(255) DEFAULT NULL,
  `followers` VARCHAR(50) DEFAULT NULL,
  `posts` VARCHAR(50) DEFAULT NULL,
  `map_embed` TEXT,
  `hero_badge` VARCHAR(255) DEFAULT NULL,
  `hero_story` JSON DEFAULT NULL,
  `sobre_text1` TEXT,
  `sobre_text2` TEXT,
  `delivery_fee` DECIMAL(10,2) NOT NULL DEFAULT 7.00,
  `delivery_note` VARCHAR(255) DEFAULT 'Consulte frete para sua região',
  `data_version` INT UNSIGNED NOT NULL DEFAULT 16,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `categories` (
  `id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `slug` VARCHAR(120) NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_categories_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `products` (
  `id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(190) NOT NULL,
  `description` TEXT,
  `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `price_from` TINYINT(1) NOT NULL DEFAULT 0,
  `category_id` VARCHAR(64) NOT NULL,
  `image` MEDIUMTEXT DEFAULT NULL,
  `featured` TINYINT(1) NOT NULL DEFAULT 0,
  `slug` VARCHAR(190) NOT NULL,
  `size` VARCHAR(50) DEFAULT NULL,
  `promo_active` TINYINT(1) NOT NULL DEFAULT 0,
  `promo_price` DECIMAL(10,2) DEFAULT NULL,
  `promo_label` VARCHAR(120) DEFAULT NULL,
  `best_seller` TINYINT(1) NOT NULL DEFAULT 0,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `available` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Disponivel para pedido no site',
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_products_slug` (`slug`),
  KEY `idx_products_category` (`category_id`),
  CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `product_flavors` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` VARCHAR(64) NOT NULL,
  `flavor` VARCHAR(190) NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_pf_product` (`product_id`),
  CONSTRAINT `fk_pf_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `product_flavor_prices` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` VARCHAR(64) NOT NULL,
  `flavor` VARCHAR(190) NOT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_pfp` (`product_id`, `flavor`),
  CONSTRAINT `fk_pfp_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `gallery` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `image` VARCHAR(500) NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `clients` (
  `id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(190) NOT NULL,
  `email` VARCHAR(190) DEFAULT NULL,
  `phone` VARCHAR(30) DEFAULT NULL,
  `address` VARCHAR(500) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_clients_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `orders` (
  `id` VARCHAR(64) NOT NULL,
  `number` VARCHAR(40) NOT NULL,
  `client_id` VARCHAR(64) DEFAULT NULL,
  `client_name` VARCHAR(190) NOT NULL,
  `client_whatsapp` VARCHAR(30) DEFAULT NULL,
  `total` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `status` ENUM('novo','preparo','entrega','finalizado','cancelado') NOT NULL DEFAULT 'novo',
  `ordered_at` DATETIME NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_orders_number` (`number`),
  KEY `idx_orders_status` (`status`),
  KEY `idx_orders_client` (`client_id`),
  CONSTRAINT `fk_orders_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `order_items` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` VARCHAR(64) NOT NULL,
  `product_id` VARCHAR(64) DEFAULT NULL,
  `product_name` VARCHAR(190) NOT NULL,
  `flavor` VARCHAR(190) DEFAULT NULL,
  `qty` INT NOT NULL DEFAULT 1,
  `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  KEY `idx_oi_order` (`order_id`),
  CONSTRAINT `fk_oi_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `finance` (
  `id` VARCHAR(64) NOT NULL,
  `type` ENUM('entrada','saida') NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `entry_date` DATE NOT NULL,
  `order_id` VARCHAR(64) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_finance_date` (`entry_date`),
  KEY `idx_finance_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `reviews` (
  `id` VARCHAR(64) NOT NULL,
  `author` VARCHAR(120) NOT NULL,
  `text` TEXT NOT NULL,
  `rating` TINYINT UNSIGNED DEFAULT 5,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `faq` (
  `id` VARCHAR(64) NOT NULL,
  `question` VARCHAR(255) NOT NULL,
  `answer` TEXT NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `product_images` (
  `filename` VARCHAR(190) NOT NULL,
  `mime` VARCHAR(64) NOT NULL DEFAULT 'image/jpeg',
  `data` LONGBLOB NOT NULL,
  `bytes` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`filename`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- DADOS INICIAIS — VERISSIMO PRATAS 925 ----------

-- Admin: admin@verissimopratos.com.br / senha: Verissimo@2026 (troque depois)
INSERT INTO `admins` (`email`, `password_hash`) VALUES (
  'admin@verissimopratos.com.br',
  'Verissimo@2026'
);

INSERT INTO `settings` (
  `id`, `name`, `tagline`, `logo`, `banner`, `sobre_image`, `whatsapp`,
  `instagram`, `instagram_user`, `facebook`, `email`, `address`, `hours`,
  `followers`, `posts`, `map_embed`, `hero_badge`, `hero_story`,
  `sobre_text1`, `sobre_text2`, `delivery_fee`, `delivery_note`, `data_version`
) VALUES (
  1,
  'Verissimo Pratas 925',
  'Prata 925 · Elegância que permanece',
  '', '', '',
  '5535991240681',
  'https://www.instagram.com/verissimopratas',
  '@verissimopratas',
  'verissimopratas',
  'verissimopratass@gmail.com',
  'Boa Esperança — Brasil',
  'Atendimento via WhatsApp',
  '', '',
  '',
  'Prata 925 · Joias sofisticadas',
  '[]',
  'A Verissimo Pratas nasceu da paixão por joias em prata 925 que unem elegância atemporal e qualidade excepcional. Cada peça é selecionada com cuidado para transformar momentos em memórias.',
  'Mais do que vender joias, queremos criar experiências. Peças pensadas para o dia a dia ou ocasiões especiais, com acabamento impecável e garantia vitalícia.',
  0.00,
  'Frete grátis acima de R$ 349,00',
  16
);

INSERT INTO `categories` (`id`, `name`, `slug`, `sort_order`) VALUES
('cat-aneis',                 'Anéis',          'aneis',                 0),
('cat-brincos',               'Brincos',        'brincos',               1),
('cat-brincos-duplas',        'Duplas',         'brincos-duplas',        2),
('cat-brincos-trios',         'Trios',          'brincos-trios',         3),
('cat-colares',               'Colares',        'colares',               4),
('cat-conjuntos',             'Conjuntos',      'conjuntos',             5),
('cat-correntes',             'Correntes',      'correntes',             6),
('cat-pingentes',             'Pingentes',      'pingentes',             7),
('cat-pulseiras',             'Pulseiras',      'pulseiras',             8),
('cat-pulseiras-braceletes',  'Braceletes',     'pulseiras-braceletes',  9),
('cat-pulseiras-infantil',    'Infantil',       'pulseiras-infantil',   10),
('cat-berloques',             'Berloques',      'berloques',            11),
('cat-berloques-pulseiras',   'Pulseiras',      'berloques-pulseiras',  12),
('cat-personalizados',        'Personalizados', 'personalizados',       13),
('cat-personalizados-aneis',  'Anéis',          'personalizados-aneis', 14),
('cat-personalizados-colares','Colares',        'personalizados-colares', 15),
('cat-personalizados-pulseiras','Pulseiras',    'personalizados-pulseiras', 16),
('cat-personalizados-berloques','Berloques',    'personalizados-berloques', 17),
('cat-personalizados-chaveiros','Chaveiros',    'personalizados-chaveiros', 18),
('cat-piercings',             'Piercings',      'piercings',            19),
('cat-tornozeleiras',         'Tornozeleiras',  'tornozeleiras',         20),
('cat-masculinos',            'Masculinos',     'masculinos',           21),
('cat-masculinos-corrente',   'Corrente',       'masculinos-corrente',  22),
('cat-masculinos-pulseira',   'Pulseira',       'masculinos-pulseira',  23),
('cat-masculinos-pingente',   'Pingente',       'masculinos-pingente',  24),
('cat-acessorios',            'Acessórios',     'acessorios',           25),
('cat-novidades',             'Novidades',      'novidades',            26),
('cat-promocoes',             'Promoções',      'promocoes',            27);

INSERT INTO `products` (
  `id`, `name`, `description`, `price`, `price_from`, `category_id`, `image`,
  `featured`, `slug`, `size`, `promo_active`, `promo_price`, `promo_label`,
  `best_seller`, `active`, `available`, `sort_order`
) VALUES (
  'p1', 'Brinco Cravejado Coração Pendurado Azul Royal',
  'Brinco delicado em prata 925 com coração cravejado e pedra azul royal pendurada. Peça versátil que combina elegância e feminilidade.',
  145.00, 0, 'cat-brincos',
  'https://dcdn-us.mitiendanube.com/stores/003/936/343/products/img_7459-jpg-ae93f851c77204047a17840546062480-480-0.webp',
  1, 'brinco-cravejado-coracao-pendurado-azul-royal', '', 0, NULL, '', 1, 1, 1, 0
);

INSERT INTO `products` (
  `id`, `name`, `description`, `price`, `price_from`, `category_id`, `image`,
  `featured`, `slug`, `size`, `promo_active`, `promo_price`, `promo_label`,
  `best_seller`, `active`, `available`, `sort_order`
) VALUES (
  'p2', 'Colar Redondo Cravejado Verde Turmalina',
  'Colar em prata 925 com pingente redondo cravejado em verde turmalina. Uma peça sofisticada que ilumina qualquer look.',
  155.00, 0, 'cat-colares',
  'https://dcdn-us.mitiendanube.com/stores/003/936/343/products/img_4817-jpg-bc43e9cb0a124925e817801712489197-480-0.webp',
  1, 'colar-redondo-cravejado-verde-turmalina', '', 0, NULL, '', 1, 1, 1, 1
);

INSERT INTO `products` (
  `id`, `name`, `description`, `price`, `price_from`, `category_id`, `image`,
  `featured`, `slug`, `size`, `promo_active`, `promo_price`, `promo_label`,
  `best_seller`, `active`, `available`, `sort_order`
) VALUES (
  'p3', 'Anel Apareador Meia Aliança 2mm Translúcido',
  'Anel apareador em prata 925 com acabamento meia aliança de 2mm e pedras translúcidas. Perfeito para combinar com solitários.',
  139.00, 0, 'cat-aneis',
  'https://dcdn-us.mitiendanube.com/stores/003/936/343/products/img_7372-jpg-1625f9af83ae02340c17840446565786-480-0.webp',
  1, 'anel-apareador-meia-alianca-2mm-translucido', '', 0, NULL, '', 1, 1, 1, 2
);
INSERT INTO `product_flavors` (`product_id`, `flavor`, `sort_order`) VALUES ('p3', '14', 0);
INSERT INTO `product_flavors` (`product_id`, `flavor`, `sort_order`) VALUES ('p3', '16', 1);
INSERT INTO `product_flavors` (`product_id`, `flavor`, `sort_order`) VALUES ('p3', '18', 2);
INSERT INTO `product_flavors` (`product_id`, `flavor`, `sort_order`) VALUES ('p3', '20', 3);
INSERT INTO `product_flavors` (`product_id`, `flavor`, `sort_order`) VALUES ('p3', '22', 4);

INSERT INTO `products` (
  `id`, `name`, `description`, `price`, `price_from`, `category_id`, `image`,
  `featured`, `slug`, `size`, `promo_active`, `promo_price`, `promo_label`,
  `best_seller`, `active`, `available`, `sort_order`
) VALUES (
  'p4', 'Colar Dois Corações',
  'Colar romântico em prata 925 com dois corações entrelaçados. Simboliza conexão e afeto — ideal para presentear.',
  189.00, 0, 'cat-colares',
  'https://dcdn-us.mitiendanube.com/stores/003/936/343/products/img_4633-9c3c043dc1887f962c178078571126302-480-0.webp',
  1, 'colar-dois-coracoes', '', 0, NULL, '', 1, 1, 1, 3
);

INSERT INTO `products` (
  `id`, `name`, `description`, `price`, `price_from`, `category_id`, `image`,
  `featured`, `slug`, `size`, `promo_active`, `promo_price`, `promo_label`,
  `best_seller`, `active`, `available`, `sort_order`
) VALUES (
  'p5', 'Anel Solitário Pedra Única Azul Royal',
  'Anel solitário clássico em prata 925 com pedra azul royal. Elegância atemporal em uma peça que nunca sai de moda.',
  99.00, 0, 'cat-aneis',
  'https://dcdn-us.mitiendanube.com/stores/003/936/343/products/img_7372-jpg-1625f9af83ae02340c17840446565786-480-0.webp',
  1, 'anel-solitario-pedra-unica-azul-royal', '', 1, 79.00, 'Oferta especial', 1, 1, 1, 4
);
INSERT INTO `product_flavors` (`product_id`, `flavor`, `sort_order`) VALUES ('p5', '16', 0);
INSERT INTO `product_flavors` (`product_id`, `flavor`, `sort_order`) VALUES ('p5', '18', 1);
INSERT INTO `product_flavors` (`product_id`, `flavor`, `sort_order`) VALUES ('p5', '20', 2);
INSERT INTO `product_flavors` (`product_id`, `flavor`, `sort_order`) VALUES ('p5', '22', 3);

INSERT INTO `products` (
  `id`, `name`, `description`, `price`, `price_from`, `category_id`, `image`,
  `featured`, `slug`, `size`, `promo_active`, `promo_price`, `promo_label`,
  `best_seller`, `active`, `available`, `sort_order`
) VALUES (
  'p6', 'Trio Argola Redonda Cravejada Fecho Taraxaca',
  'Conjunto de três argolas em prata 925 cravejadas com fecho taraxaca. Versatilidade para usar juntas ou separadas.',
  319.00, 0, 'cat-brincos',
  'https://dcdn-us.mitiendanube.com/stores/003/936/343/products/img_1216-jpg-d16ce5b4c775925454177983729470-480-0.webp',
  1, 'trio-argola-redonda-cravejada-fecho-taraxaca', '', 0, NULL, '', 1, 1, 1, 5
);

INSERT INTO `products` (
  `id`, `name`, `description`, `price`, `price_from`, `category_id`, `image`,
  `featured`, `slug`, `size`, `promo_active`, `promo_price`, `promo_label`,
  `best_seller`, `active`, `available`, `sort_order`
) VALUES (
  'p7', 'Pulseira Piasstrine 25mm',
  'Pulseira em prata 925 com elos piastrine de 25mm. Peça clássica e atemporal, perfeita para uso diário.',
  129.00, 0, 'cat-pulseiras',
  'https://dcdn-us.mitiendanube.com/stores/003/936/343/products/img_7594-240e7c614ba912830107842945370455-480-0.webp',
  1, 'pulseira-piasstrine-25mm', '25mm', 0, NULL, '', 0, 1, 1, 6
);

INSERT INTO `products` (
  `id`, `name`, `description`, `price`, `price_from`, `category_id`, `image`,
  `featured`, `slug`, `size`, `promo_active`, `promo_price`, `promo_label`,
  `best_seller`, `active`, `available`, `sort_order`
) VALUES (
  'p8', 'Conjunto Coração Cravejado Vermelho',
  'Conjunto harmonioso de colar e pulseira em prata 925 com corações cravejados em vermelho. Presente perfeito.',
  299.00, 0, 'cat-conjuntos',
  'https://dcdn-us.mitiendanube.com/stores/003/936/343/products/img_4633-9c3c043dc1887f962c178078571126302-480-0.webp',
  1, 'conjunto-coracao-cravejado-vermelho', '', 1, 249.00, 'Promoção', 1, 1, 1, 7
);

INSERT INTO `products` (
  `id`, `name`, `description`, `price`, `price_from`, `category_id`, `image`,
  `featured`, `slug`, `size`, `promo_active`, `promo_price`, `promo_label`,
  `best_seller`, `active`, `available`, `sort_order`
) VALUES (
  'p9', 'Escapulário Feminino Cruz Cravejada e Espírito Santo',
  'Escapulário delicado em prata 925 com cruz cravejada e medalha do Espírito Santo. Fé e elegância em uma peça única.',
  229.00, 0, 'cat-colares',
  'https://dcdn-us.mitiendanube.com/stores/003/936/343/products/img_4817-jpg-bc43e9cb0a124925e817801712489197-480-0.webp',
  0, 'escapulario-feminino', '', 0, NULL, '', 0, 1, 1, 8
);

INSERT INTO `products` (
  `id`, `name`, `description`, `price`, `price_from`, `category_id`, `image`,
  `featured`, `slug`, `size`, `promo_active`, `promo_price`, `promo_label`,
  `best_seller`, `active`, `available`, `sort_order`
) VALUES (
  'p10', 'Anel V Cravejado Gota Translúcida',
  'Anel em formato V cravejado com gota translúcida central. Design moderno que valoriza a feminilidade com ousadia.',
  149.00, 0, 'cat-aneis',
  'https://dcdn-us.mitiendanube.com/stores/003/936/343/products/img_7372-jpg-1625f9af83ae02340c17840446565786-480-0.webp',
  1, 'anel-v-cravejado-gota-translucida', '', 0, NULL, '', 0, 1, 1, 9
);
INSERT INTO `product_flavors` (`product_id`, `flavor`, `sort_order`) VALUES ('p10', '16', 0);
INSERT INTO `product_flavors` (`product_id`, `flavor`, `sort_order`) VALUES ('p10', '18', 1);
INSERT INTO `product_flavors` (`product_id`, `flavor`, `sort_order`) VALUES ('p10', '20', 2);
INSERT INTO `product_flavors` (`product_id`, `flavor`, `sort_order`) VALUES ('p10', '21', 3);
INSERT INTO `product_flavors` (`product_id`, `flavor`, `sort_order`) VALUES ('p10', '22', 4);

INSERT INTO `products` (
  `id`, `name`, `description`, `price`, `price_from`, `category_id`, `image`,
  `featured`, `slug`, `size`, `promo_active`, `promo_price`, `promo_label`,
  `best_seller`, `active`, `available`, `sort_order`
) VALUES (
  'p11', 'Pulseira de Berloques Coração Cravejado',
  'Pulseira para berloques em prata 925 com coração cravejado. Personalize com charms e conte sua história única.',
  435.00, 0, 'cat-berloques-pulseiras',
  'https://dcdn-us.mitiendanube.com/stores/003/936/343/products/img_7594-240e7c614ba912830107842945370455-480-0.webp',
  0, 'pulseira-de-berloques-coracao-cravejado', '', 0, NULL, '', 0, 1, 1, 10
);

INSERT INTO `products` (
  `id`, `name`, `description`, `price`, `price_from`, `category_id`, `image`,
  `featured`, `slug`, `size`, `promo_active`, `promo_price`, `promo_label`,
  `best_seller`, `active`, `available`, `sort_order`
) VALUES (
  'p12', 'Brinco Cravejado Coração Pendurado Translúcido',
  'Versão translúcida do clássico brinco coração pendurado. Brinco em prata 925 que combina com qualquer estilo.',
  145.00, 0, 'cat-brincos',
  'https://dcdn-us.mitiendanube.com/stores/003/936/343/products/img_7459-jpg-ae93f851c77204047a17840546062480-480-0.webp',
  1, 'brinco-cravejado-coracao-pendurado-translucido', '', 1, 125.00, 'Oferta especial', 1, 1, 1, 11
);

INSERT INTO `reviews` (`id`, `author`, `text`, `rating`, `active`) VALUES
('r1', 'Camila R.', 'Peça linda, qualidade impecável! Chegou super rápido.', 5, 1),
('r2', 'Juliana M.', 'Entrega rápida e produto maravilhoso. Recomendo!', 5, 1),
('r3', 'Fernanda L.', 'Muito bonito, acabamento perfeito em prata 925.', 4, 1);

INSERT INTO `faq` (`id`, `question`, `answer`, `sort_order`, `active`) VALUES
('faq1', 'As peças são de prata 925?', 'Sim! Todas as joias Verissimo Pratas são fabricadas em prata 925 com garantia vitalícia.', 0, 1),
('faq2', 'Qual o prazo de entrega?', 'Enviamos em até 24 horas úteis. O prazo de entrega varia conforme sua região.', 1, 1),
('faq3', 'Frete grátis?', 'Sim, frete grátis para compras acima de R$ 349,00.', 2, 1);

INSERT INTO `gallery` (`image`, `sort_order`) VALUES
('https://dcdn-us.mitiendanube.com/stores/003/936/343/products/img_7459-jpg-ae93f851c77204047a17840546062480-480-0.webp', 0),
('https://dcdn-us.mitiendanube.com/stores/003/936/343/products/img_4817-jpg-bc43e9cb0a124925e817801712489197-480-0.webp', 1),
('https://dcdn-us.mitiendanube.com/stores/003/936/343/products/img_7372-jpg-1625f9af83ae02340c17840446565786-480-0.webp', 2),
('https://dcdn-us.mitiendanube.com/stores/003/936/343/products/img_4633-9c3c043dc1887f962c178078571126302-480-0.webp', 3),
('https://dcdn-us.mitiendanube.com/stores/003/936/343/products/img_1216-jpg-d16ce5b4c775925454177983729470-480-0.webp', 4),
('https://dcdn-us.mitiendanube.com/stores/003/936/343/products/img_7594-240e7c614ba912830107842945370455-480-0.webp', 5);

SET FOREIGN_KEY_CHECKS = 1;

-- Consultas úteis (mesmas da Aurora)
-- SELECT p.name, c.name AS categoria, p.price, p.promo_price, p.best_seller FROM products p JOIN categories c ON c.id = p.category_id WHERE p.active = 1 ORDER BY p.sort_order;
-- SELECT * FROM settings WHERE id = 1;
-- SELECT o.number, o.client_name, o.status, o.total, o.ordered_at FROM orders o ORDER BY o.ordered_at DESC;
