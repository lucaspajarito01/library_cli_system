export default class GetBook{
    #id
    #title;
    #id_category;
    #id_editorial;
    #id_author;
    #publication_date;
    #price;
    #quantity;
    
    constructor(data){
        this.#id = data.id;
        this.#title = data.titulo;
        this.#id_category = data.categoria;
        this.#id_editorial = data.editorial;
        this.#id_author = data.autor;
        this.#publication_date = data.fecha_de_publicacion;
        this.#price = data.precio;
        this.#quantity = data.cantidad
    }

    set id(id){this.#id = id};
    set titulo(titulo){this.#title = titulo};
    set categoria(categoria){this.#id_category = categoria};
    set editorial(editorial){this.#id_editorial= editorial};
    set autor(autor){this.#id_author= autor};
    set fecha_p(publicacion){this.#publication_date= publicacion};
    set precio(precio){this.#price= precio};
    set cantidad(cantidad){this.#quantity=cantidad}

    get id(){return this.#id};
    get titulo(){ return this.#title};
    get categoria(){ return this.#id_category};
    get editorial(){ return this.#id_editorial};
    get autor(){ return this.#id_author};
    get fecha_p(){ return this.#publication_date};
    get precio(){ return this.#price};
    get cantidad(){return this.#quantity};

    get data(){
        return{
            id: this.#id,
            titulo: this.#title,
            categoria: this.#id_category,
            editorial: this.#id_editorial,
            autor: this.#id_author,
            fecha_de_publicacion: this.#publication_date,
            precio: this.#price,
            cantidad: this.#quantity
        }
    }
}