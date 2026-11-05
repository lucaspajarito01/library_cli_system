export default class LoanGet {
  #id;
  #book_id;
  #book_title;
  #client_id;
  #client_name;
  #client_identification;
  #loan_date;
  #return_attempt;
  #return_date;

  constructor(data) {
    this.#id = data.id;
    this.#book_id = data.book_id;
    this.#book_title = data.book_title;
    this.#client_id = data.client_id;
    this.#client_name = data.client_name;
    this.#client_identification = data.client_identification;
    this.#loan_date = data.loan_date;
    this.#return_attempt = data.return_attempt;
    this.#return_date = data.return_date;
  }

  get data() {
    return {
      id: this.#id,
      id_libro: this.#book_id,
      titulo_libro: this.#book_title,
      id_cliente: this.#client_id,
      nombre_cliente: this.#client_name,
      identificacion_cliente: this.#client_identification,
      fecha_prestamo: this.#loan_date,
      fecha_devolucion_estimada: this.#return_attempt,
      fecha_devolucion: this.#return_date,
      estado: this.#return_date ? 'Devuelto' : 'Prestado',
    };
  }
}

