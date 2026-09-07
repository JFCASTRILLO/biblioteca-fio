/* ==========================================================
   CONEXIÓN CON SUPABASE
   ========================================================== */

const SUPABASE_URL =
    "https://ffxnsvetxaikdpolvjym.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_nVJbKuJztCNImhywm7OS8Q_KA064589";

const clienteSupabase = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


/* ==========================================================
   ELEMENTOS
   ========================================================== */

const nombreAdmin =
    document.getElementById("nombre-admin");

const btnCerrarSesion =
    document.getElementById("btn-cerrar-sesion");

const txtBuscar =
    document.getElementById("buscar-ejemplar");

const filtroEstado =
    document.getElementById("filtro-estado");

const cuerpoTabla =
    document.getElementById("tabla-ejemplares-body");

const contador =
    document.getElementById("contador-ejemplares");


/* ==========================================================
   DATOS
   ========================================================== */

let ejemplares = [];


/* ==========================================================
   COMPROBAR ACCESO ADMIN
   ========================================================== */

async function comprobarAcceso() {

    const {
        data: datosUsuario,
        error: errorUsuario
    } =
        await clienteSupabase.auth.getUser();


    if (
        errorUsuario ||
        !datosUsuario.user
    ) {

        window.location.href =
            "index.html";

        return false;
    }


    const uid =
        datosUsuario.user.id;


    const {
        data: perfil,
        error: errorPerfil
    } =
        await clienteSupabase
            .from("usuarios")
            .select(`
                id,
                nombre,
                apellidos,
                rol,
                activo
            `)
            .eq("id", uid)
            .single();


    if (
        errorPerfil ||
        !perfil ||
        perfil.rol !== "admin" ||
        perfil.activo !== true
    ) {

        await clienteSupabase.auth.signOut();

        window.location.href =
            "index.html";

        return false;
    }


    nombreAdmin.textContent =
        perfil.nombre +
        (
            perfil.apellidos
                ? " " + perfil.apellidos
                : ""
        );


    return true;
}


/* ==========================================================
   CARGAR EJEMPLARES
   ========================================================== */

async function cargarEjemplares() {

    ejemplares = [];

    const TAMANO_BLOQUE = 1000;

    let inicio = 0;

    let seguir = true;


    while (seguir) {

        const fin =
            inicio + TAMANO_BLOQUE - 1;


        const {
            data,
            error
        } =
            await clienteSupabase
                .from("ejemplares")
                .select(`
                    id,
                    clave,
                    titulo,
                    autor,
                    editorial,
                    genero,
                    estado,
                    isbn
                `)
                .order("id", {
                    ascending: true
                })
                .range(
                    inicio,
                    fin
                );


        if (error) {

            console.error(
                "Error cargando ejemplares:",
                error
            );

            contador.textContent =
                "No se han podido cargar los ejemplares.";

            return;
        }


        ejemplares.push(...data);


        if (data.length < TAMANO_BLOQUE) {

            seguir = false;

        } else {

            inicio += TAMANO_BLOQUE;
        }
    }


    mostrarEjemplares();
}


/* ==========================================================
   MOSTRAR EJEMPLARES
   ========================================================== */

function mostrarEjemplares() {

    const texto =
        txtBuscar.value
            .trim()
            .toLowerCase();

    const estado =
        filtroEstado.value;


    const filtrados =
        ejemplares.filter(
            function (ejemplar) {

                const coincideTexto =
                    !texto ||
                    (ejemplar.titulo || "")
                        .toLowerCase()
                        .includes(texto) ||
                    (ejemplar.autor || "")
                        .toLowerCase()
                        .includes(texto) ||
                    (ejemplar.clave || "")
                        .toLowerCase()
                        .includes(texto) ||
                    (ejemplar.isbn || "")
                        .toLowerCase()
                        .includes(texto);


                const coincideEstado =
                    !estado ||
                    ejemplar.estado === estado;


                return (
                    coincideTexto &&
                    coincideEstado
                );
            }
        );


    cuerpoTabla.innerHTML = "";


    for (const ejemplar of filtrados) {

        const fila =
            document.createElement("tr");


        fila.innerHTML = `
            <td>${ejemplar.id ?? ""}</td>
            <td>${ejemplar.clave ?? ""}</td>
            <td>${ejemplar.titulo ?? ""}</td>
            <td>${ejemplar.autor ?? ""}</td>
            <td>${ejemplar.editorial ?? ""}</td>
            <td>${ejemplar.genero ?? ""}</td>
            <td>
                <span class="estado-admin estado-${(ejemplar.estado || "").toLowerCase()}">
                    ${ejemplar.estado ?? ""}
                </span>
            </td>
        `;


        cuerpoTabla.appendChild(
            fila
        );
    }


    contador.textContent =
        filtrados.length +
        " ejemplares mostrados";
}


/* ==========================================================
   FILTROS
   ========================================================== */

txtBuscar.addEventListener(
    "input",
    mostrarEjemplares
);


filtroEstado.addEventListener(
    "change",
    mostrarEjemplares
);


/* ==========================================================
   CERRAR SESIÓN
   ========================================================== */

btnCerrarSesion.addEventListener(
    "click",
    async function () {

        await clienteSupabase.auth.signOut();

        window.location.href =
            "index.html";
    }
);


/* ==========================================================
   INICIAR
   ========================================================== */

async function iniciar() {

    const acceso =
        await comprobarAcceso();

    if (!acceso) {
        return;
    }

    await cargarEjemplares();
}


iniciar();