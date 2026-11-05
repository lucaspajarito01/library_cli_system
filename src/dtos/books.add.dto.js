export default class BookAdd {
  #title;
  #id_category;
  #id_editorial;
  #id_author;
  #publication_date;
  #price;
  #quantity;

  constructor(data) {
    this.#title = data.titulo ?? data.title;
    this.#id_category = data.categoria ?? data.category ?? data.id_category;
    this.#id_editorial = data.editorial ?? data.id_editorial ?? null;
    this.#id_author = data.autor ?? data.author ?? data.id_author;
    this.#publication_date = data.fecha_de_publicacion || data.fecha_p || data.publication_date || null;
    this.#price = Number(data.precio ?? data.price ?? 0);
    this.#quantity = Number(data.cantidad ?? data.quantity ?? 0);
  }

  set titulo(titulo) { this.#title = titulo; }
  set categoria(categoria) { this.#id_category = categoria; }
  set editorial(editorial) { this.#id_editorial = editorial; }
  set autor(autor) { this.#id_author = autor; }
  set fecha_p(publicacion) { this.#publication_date = publicacion; }
  set precio(precio) { this.#price = precio; }
  set cantidad(cantidad) { this.#quantity = Number(cantidad); }

  get titulo() { return this.#title; }
  get categoria() { return this.#id_category; }
  get editorial() { return this.#id_editorial; }
  get autor() { return this.#id_author; }
  get fecha_p() { return this.#publication_date; }
  get precio() { return this.#price; }
  get cantidad() { return this.#quantity; }
}
