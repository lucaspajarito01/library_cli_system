export default class SaleCreate {
  #book_id;
  #client_id;
  #quantity;
  #purchase_date;

  constructor(data) {
    this.#book_id = Number(data.id_libro ?? data.book_id);
    const rawClient = data.id_cliente ?? data.client_id;
    this.#client_id = rawClient ? Number(rawClient) : null;
    this.#quantity = Number(data.cantidad ?? data.quantity);
    this.#purchase_date = data.fecha_compra || data.purchase_date || new Date().toISOString().split('T')[0];
  }

  get id_libro() { return this.#book_id; }
  get id_cliente() { return this.#client_id; }
  get cantidad() { return this.#quantity; }
  get fecha_compra() { return this.#purchase_date; }
}
