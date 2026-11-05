export default class SaleGet {
  #id;
  #book_id;
  #book_title;
  #unit_price;
  #client_id;
  #client_name;
  #quantity;
  #total;
  #purchase_date;

  constructor(data) {
    this.#id = data.id;
    this.#book_id = data.book_id;
    this.#book_title = data.book_title;
    this.#unit_price = data.unit_price;
    this.#client_id = data.client_id;
    this.#client_name = data.client_name;
    this.#quantity = data.quantity;
    this.#total = data.total;
    this.#purchase_date = data.purchase_date;
  }

  get data() {
    return {
      id: this.#id,
      id_libro: this.#book_id,
      titulo_libro: this.#book_title,
      precio_unitario: this.#unit_price,
      id_cliente: this.#client_id,
      nombre_cliente: this.#client_name || 'Venta Mostrador',
      cantidad: this.#quantity,
      total: this.#total,
      fecha_compra: this.#purchase_date,
    };
  }
}

