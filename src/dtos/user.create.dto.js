export default class UserCreate{
    #identification_number;
    #name;
    #phone_number;
    #address;
    #email;
    #role;

    constructor(data){
        this.#identification_number = data.identificacion;
        this.#name = data.nombre;
        this.#phone_number = data.numero_telefonico;
        this.#address = data.direccion;
        this.#email = data.correo;
        this.#role = data.rol ?? 'Usuario';
    }

    
    set identificacion(id){ this.#identification_number = id};
    set nombre(nombre){ this.#name = nombre};
    set numero_telefonico(num){this.#phone_number = num};
    set direccion( dir){this.#address = dir};
    set correo(correo){this.#email = correo};
    set rol(rol){this.#role = rol};


    get identificacion(){return this.#identification_number};
    get nombre(){return this.#name};
    get numero_telefonico(){return this.#phone_number};
    get direccion(){return this.#address};
    get correo(){return this.#email};
    get rol(){return this.#role};
}