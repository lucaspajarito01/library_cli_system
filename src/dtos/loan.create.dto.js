export default class LoanCreate {
  #book_id;
  #client_id;
  #loan_date;
  #return_attempt;
  #return_date;

  constructor(data) {
    this.#book_id = Number(data.id_libro ?? data.book_id);
    this.#client_id = Number(data.id_cliente ?? data.client_id);
    this.#loan_date = data.fecha_prestamo || data.loan_date || new Date().toISOString().split('T')[0];
    this.#return_attempt = data.fecha_devolucion_estimada || data.return_attempt;
    this.#return_date = data.fecha_devolucion || data.return_date || null;
  }

  get id_libro() { return this.#book_id; }
  get id_cliente() { return this.#client_id; }
  get fecha_prestamo() { return this.#loan_date; }
  get fecha_devolucion_estimada() { return this.#return_attempt; }
  get fecha_devolucion() { return this.#return_date; }
}
