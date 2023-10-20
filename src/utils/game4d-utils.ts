export type G4Dvar = number | boolean | string | G4DUNKNOWNVAR;


export type G4DUNKNOWNVAR = {
    debug_info: string,
}

// G4DUNKNOWNVAR.prototype.toString =

export class G4Droutine{

    constructor() {
        console.log("Routine has been created!");
    }
}



// type G4Dstring = {
//     name: string;
//     val: string;
// }

// type G4Dnum = {
//     name: string;
// }