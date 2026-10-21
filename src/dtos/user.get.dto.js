export default class UserGet {
    #id;
    #identification_number;
    #name;
    #phone_number;
    #address;
    #email;
    #role;    

    constructor(data){
        this.#id = data.id;
        this.#identification_number = data.identification_number;
        this.#name = data.name;
        this.#phone_number = data.phone_number;
        this.#address = data.address;
        this.#email = data.email;
        this.#role = data.role;
    }

    set id(id){this.#id = id};
    set identificacion(idenntificacion){ this.#identification_number = idenntificacion};
    set nombre(nombre){ this.#name = nombre};
    set numero_telefonico(num){this.#phone_number = num};
    set direccion( dir){this.#address = dir};
    set correo(correo){this.#email = correo};
    set rol(rol){this.#role = rol};

    get id(){return this.#id};
    get identificacion(){return this.#identification_number};
    get nombre(){return this.#name};
    get numero_telefonico(){return this.#phone_number};
    get direccion(){return this.#address};
    get correo(){return this.#email};
    get rol(){return this.#role};

    get data(){
        return{
            id: this.#id,
            identificacion: this.#identification_number,
            nombre: this.#name,
            numero_telefonico: this.#phone_number,
            direccion: this.#address,
            correo: this.#email,
            rol: this.#role
        }
    }
}