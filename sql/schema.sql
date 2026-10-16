CREATE DATABASE IF NOT EXISTS library_cli_system
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
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
    id_editorial INT UNSIGNED NOT NULL,
    id_author INT UNSIGNED NOT NULL,
    publication_date DATE,
    price DECIMAL(10,2) UNSIGNED,
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
    quantity INT UNSIGNED NOT NULL,
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
    quantity INT UNSIGNED NOT NULL,
    total DECIMAL(10,2) UNSIGNED NOT NULL DEFAULT 0,
    purchase_date DATE NOT NULL DEFAULT (CURDATE()),
    PRIMARY KEY (id),
    CONSTRAINT fk_sales_book
        FOREIGN KEY (book_id) REFERENCES books(book_id)
) ENGINE=InnoDB;