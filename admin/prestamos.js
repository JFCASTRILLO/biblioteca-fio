/* ==========================================================
   BIBLIOTECA FIO
   ADMINISTRACIÓN - PRÉSTAMOS
   ========================================================== */


/* ==========================================================
   SUPABASE
   ========================================================== */

const SUPABASE_URL =
    "https://ffxnsvetxaikdpolvjym.supabase.co";

/*
 * IMPORTANTE:
 * Copia aquí exactamente la misma clave pública
 * sb_publishable_... que ya utilizas en usuarios.js
 * o ejemplares.js.
 */
const SUPABASE_KEY =
    "sb_publishable_nVJbKuJztCNImhywm7OS8Q_KA064589";


const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


/* ==========================================================
   VARIABLES
   ========================================================== */

let todosLosPrestamos = [];
let prestamosFiltrados = [];


/* ==========================================================
   INICIO
   ========================================================== */

document.addEventListener(
    "DOMContentLoaded",
    iniciarPrestamos
);


async function iniciarPrestamos() {

    try {

        /* ----------------------------------------------
           Comprobar sesión
           ---------------------------------------------- */

        const {
            data: { session },
            error: errorSesion
        } = await supabaseClient.auth.getSession();


        if (errorSesion) {
            throw errorSesion;
        }


        if (!session) {

            alert("No hay una sesión de administrador iniciada.");
            return;

        }


        /* ----------------------------------------------
           Cargar préstamos
           ---------------------------------------------- */

        await cargarPrestamos();


        /* ----------------------------------------------
           Eventos
           ---------------------------------------------- */

        document
            .getElementById("buscar-prestamo")
            .addEventListener(
                "input",
                filtrarPrestamos
            );


        document
            .getElementById("filtro-estado-prestamo")
            .addEventListener(
                "change",
                filtrarPrestamos
            );


        document
            .getElementById("btn-limpiar-prestamos")
            .addEventListener(
                "click",
                limpiarFiltrosPrestamos
            );


        document
            .getElementById("btn-nuevo-prestamo")
            .addEventListener(
                "click",
                function () {

                    alert(
                        "El alta de préstamos se incorporará en el siguiente paso."
                    );

                }
            );

    }
    catch (error) {

        console.error(
            "Error iniciando préstamos:",
            error
        );

        mostrarError(
            "No se ha podido iniciar el módulo de préstamos."
        );

    }

}


/* ==========================================================
   CARGAR PRÉSTAMOS
   ========================================================== */

async function cargarPrestamos() {

    const {
        data,
        error
    } = await supabaseClient
        .from("prestamos")
        .select(`
            id,
            fecha_prestamo,
            fecha_prevista_devolucion,
            fecha_devolucion,
            estado,
            observaciones,

            usuario:usuarios!prestamos_usuario_id_fkey (
                id,
                numero_socio,
                nombre,
                apellidos
            ),

            ejemplar:ejemplares!prestamos_ejemplar_id_fkey (
                id,
                titulo,
                autor,
                clave
            )
        `)
        .order(
            "fecha_prestamo",
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
            "Error cargando préstamos:",
            error
        );

        throw error;

    }


    todosLosPrestamos = data || [];

    prestamosFiltrados = [
        ...todosLosPrestamos
    ];


    mostrarPrestamos(
        prestamosFiltrados
    );

}


/* ==========================================================
   MOSTRAR TABLA
   ========================================================== */

function mostrarPrestamos(lista) {

    const tbody =
        document.getElementById(
            "tabla-prestamos-cuerpo"
        );


    tbody.innerHTML = "";


    if (lista.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="7"
                    style="text-align:center;">
                    No hay préstamos registrados.
                </td>
            </tr>
        `;

        actualizarContador(0);

        return;

    }


    lista.forEach(prestamo => {

        const usuario =
            prestamo.usuario || {};

        const ejemplar =
            prestamo.ejemplar || {};


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
                ${prestamo.id}
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
                    prestamo.fecha_prestamo
                )}
            </td>

            <td>
                ${formatearFecha(
                    prestamo.fecha_prevista_devolucion
                )}
            </td>

            <td>
                <span class="
                    estado-admin
                    ${claseEstadoPrestamo(
                        prestamo.estado
                    )}
                ">
                    ${escaparHTML(
                        prestamo.estado || "-"
                    )}
                </span>
            </td>

        `;


        tbody.appendChild(fila);

    });


    actualizarContador(
        lista.length
    );

}


/* ==========================================================
   FILTROS
   ========================================================== */

function filtrarPrestamos() {

    const texto =
        document
            .getElementById("buscar-prestamo")
            .value
            .trim()
            .toLowerCase();


    const estado =
        document
            .getElementById("filtro-estado-prestamo")
            .value;


    prestamosFiltrados =
        todosLosPrestamos.filter(
            prestamo => {

                const usuario =
                    prestamo.usuario || {};

                const ejemplar =
                    prestamo.ejemplar || {};


                const cadenaBusqueda = [

                    prestamo.id,

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
                    prestamo.estado === estado;


                return (
                    coincideTexto &&
                    coincideEstado
                );

            }
        );


    mostrarPrestamos(
        prestamosFiltrados
    );

}


/* ==========================================================
   LIMPIAR FILTROS
   ========================================================== */

function limpiarFiltrosPrestamos() {

    document
        .getElementById("buscar-prestamo")
        .value = "";


    document
        .getElementById("filtro-estado-prestamo")
        .value = "";


    filtrarPrestamos();

}


/* ==========================================================
   CONTADOR
   ========================================================== */

function actualizarContador(cantidad) {

    const contador =
        document.getElementById(
            "contador-prestamos"
        );


    if (
        cantidad === todosLosPrestamos.length
    ) {

        contador.textContent =
            `${cantidad} préstamo${
                cantidad === 1 ? "" : "s"
            } registrado${
                cantidad === 1 ? "" : "s"
            }`;

    }
    else {

        contador.textContent =
            `Mostrando ${cantidad} de ` +
            `${todosLosPrestamos.length} préstamos`;

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
   ESTADO
   ========================================================== */

function claseEstadoPrestamo(estado) {

    switch (estado) {

        case "PRESTADO":
            return "estado-prestado";

        case "DEVUELTO":
            return "estado-devuelto";

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
   ERROR
   ========================================================== */

function mostrarError(mensaje) {

    const contador =
        document.getElementById(
            "contador-prestamos"
        );


    if (contador) {
        contador.textContent = mensaje;
    }

}