export default class GetBook {
  #id;
  #title;
  #category;
  #editorial;
  #author;
  #publicationDate;
  #price;
  #quantity;

  constructor(data) {
    this.#id = data.id;
    this.#title = data.title;
    this.#category = data.category;
    this.#editorial = data.editorial;
    this.#author = data.author;
    this.#publicationDate = data.publication_date;
    this.#price = data.price;
    this.#quantity = data.quantity;
  }

  set id(id) { this.#id = id; }
  set titulo(titulo) { this.#title = titulo; }
  set categoria(categoria) { this.#category = categoria; }
  set editorial(editorial) { this.#editorial = editorial; }
  set autor(autor) { this.#author = autor; }
  set fecha_p(publicationDate) { this.#publicationDate = publicationDate; }
  set precio(price) { this.#price = price; }
  set cantidad(quantity) { this.#quantity = quantity; }

  get id() { return this.#id; }
  get titulo() { return this.#title; }
  get categoria() { return this.#category; }
  get editorial() { return this.#editorial; }
  get autor() { return this.#author; }
  get fecha_p() { return this.#publicationDate; }
  get precio() { return this.#price; }
  get cantidad() { return this.#quantity; }

  get data() {
    return {
      id: this.#id,
      titulo: this.#title,
      categoria: this.#category,
      editorial: this.#editorial,
      autor: this.#author,
      fecha_de_publicacion: this.#publicationDate,
      precio: this.#price,
      cantidad: this.#quantity
    };
  }
}