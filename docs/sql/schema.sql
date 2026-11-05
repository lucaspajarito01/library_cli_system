CREATE DATABASE IF NOT EXISTS library_cli_system;
USE library_cli_system;

CREATE TABLE IF NOT EXISTS clients (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    identification_number VARCHAR(13) NOT NULL,
    name VARCHAR(60) NOT NULL,
    phone_number VARCHAR(9) NOT NULL,
    address VARCHAR(120) NOT NULL,
    email VARCHAR(120) NOT NULL,
    role ENUM('Administrador', 'Usuario') NOT NULL DEFAULT 'Usuario',
    PRIMARY KEY (id),
    CONSTRAINT uq_clients_email UNIQUE (email),
    CONSTRAINT uq_clients_identification_number UNIQUE (identification_number)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS book_category (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    category VARCHAR(20) NOT NULL UNIQUE,
    PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS editorials (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    editorial VARCHAR(30) NOT NULL UNIQUE,
    PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS authors (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    author VARCHAR(60) NOT NULL UNIQUE,
    PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS books (
    book_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    title VARCHAR(40) NOT NULL,
    id_category INT UNSIGNED NOT NULL,
    id_editorial INT UNSIGNED NULL,
    id_author INT UNSIGNED NOT NULL,
    publication_date DATE,
    price DECIMAL(10,2) UNSIGNED NOT NULL DEFAULT 0.00,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (book_id),
    CONSTRAINT fk_books_category
        FOREIGN KEY (id_category) REFERENCES book_category(id),
    CONSTRAINT fk_books_editorial
        FOREIGN KEY (id_editorial) REFERENCES editorials(id),
    CONSTRAINT fk_books_author
        FOREIGN KEY (id_author) REFERENCES authors(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS inventory (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    book_id INT UNSIGNED NOT NULL,
    quantity INT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    CONSTRAINT uq_inventory_book UNIQUE (book_id),
    CONSTRAINT fk_inventory_book
        FOREIGN KEY (book_id) REFERENCES books(book_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS loans (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    book_id INT UNSIGNED NOT NULL,
    loan_date DATE DEFAULT (CURDATE()),
    return_attempt DATE NOT NULL,
    return_date DATE NULL,
    client_id INT UNSIGNED NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_loans_book
        FOREIGN KEY (book_id) REFERENCES books(book_id),
    CONSTRAINT fk_loans_client
        FOREIGN KEY (client_id) REFERENCES clients(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sales (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    book_id INT UNSIGNED NOT NULL,
    client_id INT UNSIGNED NULL,
    quantity INT UNSIGNED NOT NULL,
    total DECIMAL(10,2) UNSIGNED NOT NULL DEFAULT 0,
    purchase_date DATE NOT NULL DEFAULT (CURDATE()),
    PRIMARY KEY (id),
    CONSTRAINT fk_sales_book
        FOREIGN KEY (book_id) REFERENCES books(book_id),
    CONSTRAINT fk_sales_client
        FOREIGN KEY (client_id) REFERENCES clients(id)
) ENGINE=InnoDB;

-- Datos iniciales (Administrador por defecto y catálogo base)
INSERT IGNORE INTO clients (id, identification_number, name, phone_number, address, email, role)
VALUES
    (1, '1000000001', 'Administrador Principal', '300123456', 'Av. Central Oficina 101', 'admin@libreria.com', 'Administrador'),
    (2, '1000000002', 'Carlos Mendoza', '310987654', 'Calle 45 #12-30', 'carlos@correo.com', 'Usuario');

INSERT IGNORE INTO book_category (id, category) VALUES
    (1, 'Ingeniería'),
    (2, 'Literatura'),
    (3, 'Negocios');

INSERT IGNORE INTO editorials (id, editorial) VALUES
    (1, 'O''Reilly Media'),
    (2, 'Penguin Random'),
    (3, 'McGraw-Hill');

INSERT IGNORE INTO authors (id, author) VALUES
    (1, 'Robert C. Martin'),
    (2, 'Gabriel García Márquez'),
    (3, 'Eric Evans');

INSERT IGNORE INTO books (book_id, title, id_category, id_editorial, id_author, publication_date, price, activo) VALUES
    (1, 'Clean Code', 1, 1, 1, '2008-08-01', 45.00, TRUE),
    (2, 'Cien Años de Soledad', 2, 2, 2, '1967-05-30', 25.50, TRUE),
    (3, 'Domain-Driven Design', 1, 3, 3, '2003-08-30', 52.00, TRUE);

INSERT IGNORE INTO inventory (id, book_id, quantity) VALUES
    (1, 1, 12),
    (2, 2, 8),
    (3, 3, 5);
