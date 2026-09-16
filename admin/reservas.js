/* ==========================================================
   BIBLIOTECA FIO
   ADMINISTRACIÓN - RESERVAS
   ========================================================== */


/* ==========================================================
   SUPABASE
   ========================================================== */

const SUPABASE_URL =
    "https://ffxnsvetxaikdpolvjym.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_nVJbKuJztCNImhywm7OS8Q_KA064589";


const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


const nombreAdmin =
    document.getElementById("nombre-admin");

const btnCerrarSesion =
    document.getElementById("btn-cerrar-sesion");


/* ==========================================================
   VARIABLES
   ========================================================== */

let todasLasReservas = [];
let reservasFiltradas = [];


/* ==========================================================
   INICIO
   ========================================================== */

document.addEventListener(
    "DOMContentLoaded",
    iniciarReservas
);


async function iniciarReservas() {

    try {

        /* ----------------------------------------------
           Comprobar administrador
           ---------------------------------------------- */

        const {
            data: { user },
            error: errorUsuario
        } =
            await supabaseClient.auth.getUser();


        if (errorUsuario || !user) {

            window.location.href =
                "index.html";

            return;
        }


        const {
            data: perfil,
            error: errorPerfil
        } =
            await supabaseClient
                .from("usuarios")
                .select(
                    "id,auth_user_id,nombre,apellidos,rol,activo"
                )
                .eq("auth_user_id", user.id)
                .single();


        if (
            errorPerfil ||
            !perfil ||
            perfil.rol !== "admin" ||
            perfil.activo !== true
        ) {

            await supabaseClient.auth.signOut();

            window.location.href =
                "index.html";

            return;
        }


        nombreAdmin.textContent =
            [perfil.nombre, perfil.apellidos]
                .filter(Boolean)
                .join(" ");


        /* ----------------------------------------------
           Cargar reservas
           ---------------------------------------------- */

        await cargarReservas();


        /* ----------------------------------------------
           Eventos
           ---------------------------------------------- */

        document
            .getElementById("buscar-reserva")
            .addEventListener(
                "input",
                filtrarReservas
            );


        document
            .getElementById("filtro-estado-reserva")
            .addEventListener(
                "change",
                filtrarReservas
            );


        document
            .getElementById("btn-limpiar-reservas")
            .addEventListener(
                "click",
                limpiarFiltrosReservas
            );

    }
    catch (error) {

        console.error(
            "Error iniciando reservas:",
            error
        );

        mostrarError(
            "No se ha podido iniciar el módulo de reservas."
        );
    }
}


/* ==========================================================
   CARGAR RESERVAS
   ========================================================== */

async function cargarReservas() {

    const {
        data,
        error
    } = await supabaseClient
        .from("reservas")
        .select(`
            id,
            fecha_reserva,
            fecha_disponible,
            fecha_atendida,
            fecha_cancelacion,
            estado,
            medio_contacto,
            dato_contacto,
            observaciones,

            usuario:usuarios!reservas_usuario_id_fkey (
                id,
                numero_socio,
                nombre,
                apellidos
            ),

            ejemplar:ejemplares!reservas_ejemplar_id_fkey (
                id,
                clave,
                titulo,
                autor
            )
        `)
        .order(
            "fecha_reserva",
            {
                ascending: false
            }
        )
        .order(
            "id",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(
            "Error cargando reservas:",
            error
        );

        throw error;
    }


    todasLasReservas = data || [];

    reservasFiltradas = [
        ...todasLasReservas
    ];


    mostrarReservas(
        reservasFiltradas
    );
}


/* ==========================================================
   MOSTRAR TABLA
   ========================================================== */

function mostrarReservas(lista) {

    const tbody =
        document.getElementById(
            "tabla-reservas-cuerpo"
        );


    tbody.innerHTML = "";


    if (lista.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    style="text-align:center;"
                >
                    No hay reservas registradas.
                </td>
            </tr>
        `;

        actualizarContadorReservas(0);

        return;
    }


    lista.forEach(reserva => {

        const usuario =
            reserva.usuario || {};

        const ejemplar =
            reserva.ejemplar || {};


        const nombreCompleto =
            [
                usuario.nombre,
                usuario.apellidos
            ]
            .filter(Boolean)
            .join(" ");


        const descripcionEjemplar =
            [
                ejemplar.clave,
                ejemplar.titulo
            ]
            .filter(Boolean)
            .join(" - ");


        const fila =
            document.createElement("tr");


        fila.innerHTML = `

            <td>
                ${reserva.id}
            </td>

            <td>
                ${escaparHTML(
                    usuario.numero_socio || "-"
                )}
            </td>

            <td>
                ${escaparHTML(
                    nombreCompleto || "-"
                )}
            </td>

            <td>
                ${escaparHTML(
                    descripcionEjemplar || "-"
                )}
            </td>

            <td>
                ${formatearFecha(
                    reserva.fecha_reserva
                )}
            </td>

            <td>
                <span class="
                    estado-admin
                    ${claseEstadoReserva(
                        reserva.estado
                    )}
                ">
                    ${escaparHTML(
                        reserva.estado || "-"
                    )}
                </span>
            </td>

        `;


        tbody.appendChild(fila);
    });


    actualizarContadorReservas(
        lista.length
    );
}


/* ==========================================================
   FILTROS
   ========================================================== */

function filtrarReservas() {

    const texto =
        document
            .getElementById("buscar-reserva")
            .value
            .trim()
            .toLowerCase();


    const estado =
        document
            .getElementById("filtro-estado-reserva")
            .value;


    reservasFiltradas =
        todasLasReservas.filter(
            reserva => {

                const usuario =
                    reserva.usuario || {};

                const ejemplar =
                    reserva.ejemplar || {};


                const cadenaBusqueda = [

                    reserva.id,

                    usuario.numero_socio,
                    usuario.nombre,
                    usuario.apellidos,

                    ejemplar.id,
                    ejemplar.clave,
                    ejemplar.titulo,
                    ejemplar.autor

                ]
                .filter(
                    valor =>
                        valor !== null &&
                        valor !== undefined
                )
                .join(" ")
                .toLowerCase();


                const coincideTexto =
                    !texto ||
                    cadenaBusqueda.includes(texto);


                const coincideEstado =
                    !estado ||
                    reserva.estado === estado;


                return (
                    coincideTexto &&
                    coincideEstado
                );
            }
        );


    mostrarReservas(
        reservasFiltradas
    );
}


/* ==========================================================
   LIMPIAR FILTROS
   ========================================================== */

function limpiarFiltrosReservas() {

    document
        .getElementById("buscar-reserva")
        .value = "";


    document
        .getElementById("filtro-estado-reserva")
        .value = "";


    filtrarReservas();
}


/* ==========================================================
   CONTADOR
   ========================================================== */

function actualizarContadorReservas(cantidad) {

    const contador =
        document.getElementById(
            "contador-reservas"
        );


    if (
        cantidad === todasLasReservas.length
    ) {

        contador.textContent =
            `${cantidad} reserva${
                cantidad === 1 ? "" : "s"
            } registrada${
                cantidad === 1 ? "" : "s"
            }`;

    }
    else {

        contador.textContent =
            `Mostrando ${cantidad} de ` +
            `${todasLasReservas.length} reservas`;

    }
}


/* ==========================================================
   FECHAS
   ========================================================== */

function formatearFecha(fecha) {

    if (!fecha) {
        return "-";
    }


    const partes =
        fecha.split("-");


    if (partes.length !== 3) {
        return fecha;
    }


    return (
        partes[2] +
        "/" +
        partes[1] +
        "/" +
        partes[0]
    );
}


/* ==========================================================
   ESTADOS
   ========================================================== */

function claseEstadoReserva(estado) {

    switch (estado) {

        case "ACTIVA":
            return "estado-reserva-activa";

        case "DISPONIBLE":
            return "estado-disponible";

        case "ATENDIDA":
            return "estado-devuelto";

        case "CANCELADA":
            return "estado-inactivo";

        default:
            return "";
    }
}


/* ==========================================================
   SEGURIDAD HTML
   ========================================================== */

function escaparHTML(valor) {

    return String(valor)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* ==========================================================
   CERRAR SESIÓN
   ========================================================== */

btnCerrarSesion.addEventListener(
    "click",
    async function () {

        await supabaseClient.auth.signOut();

        window.location.href =
            "index.html";
    }
);


/* ==========================================================
   ERROR
   ========================================================== */

function mostrarError(mensaje) {

    const contador =
        document.getElementById(
            "contador-reservas"
        );


    if (contador) {
        contador.textContent = mensaje;
    }
}