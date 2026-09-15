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

const nombreAdmin =
    document.getElementById("nombre-admin");

const btnCerrarSesion =
    document.getElementById("btn-cerrar-sesion");


/* ==========================================================
   VARIABLES
   ========================================================== */

let todosLosPrestamos = [];
let prestamosFiltrados = [];
let usuariosPrestamo = [];
let usuarioPrestamoSeleccionado = null;

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
                abrirNuevoPrestamo
            );


        document
            .getElementById("cerrar-nuevo-prestamo")
            .addEventListener(
                "click",
                cerrarNuevoPrestamo
            );


        document
            .getElementById("btn-cancelar-nuevo-prestamo")
            .addEventListener(
                "click",
                cerrarNuevoPrestamo
            );

        document.getElementById("btn-nuevo-prestamo").addEventListener("click", abrirNuevoPrestamo);

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
   NUEVO PRÉSTAMO
   ========================================================== */

function abrirNuevoPrestamo() {

    usuarioPrestamoSeleccionado = null;

    document
        .getElementById("buscar-socio-prestamo")
        .value = "";

    document
        .getElementById("buscar-ejemplar-prestamo")
        .value = "";

    document
        .getElementById("observaciones-prestamo")
        .value = "";

    document
        .getElementById("resultados-socio-prestamo")
        .innerHTML = "";

    document
        .getElementById("resultados-ejemplar-prestamo")
        .innerHTML = "";

    document
        .getElementById("btn-registrar-prestamo")
        .disabled = true;


    document
        .getElementById("modal-nuevo-prestamo")
        .classList.add("visible");

    document.body.classList.add(
        "modal-abierto"
    );


    document
        .getElementById("buscar-socio-prestamo")
        .focus();

}


function cerrarNuevoPrestamo() {

    document
        .getElementById("modal-nuevo-prestamo")
        .classList.remove("visible");

    document.body.classList.remove(
        "modal-abierto"
    );

}

// ==================================================
// BÚSQUEDA DE SOCIO PARA NUEVO PRÉSTAMO
// ==================================================

async function buscarSocioPrestamo() {

    const input = document.getElementById("buscar-socio-prestamo");
    const contenedor = document.getElementById("resultados-socio-prestamo");

    const texto = input.value.trim();

    usuarioPrestamoSeleccionado = null;
    document.getElementById("btn-registrar-prestamo").disabled = true;

    if (texto.length < 2) {
        contenedor.innerHTML = "";
        return;
    }

    contenedor.innerHTML =
        '<div class="mensaje-busqueda-prestamo">Buscando socios...</div>';

    const textoSeguro = texto
        .replace(/,/g, " ")
        .replace(/\(/g, " ")
        .replace(/\)/g, " ")
        .trim();

    const { data, error } = await supabaseClient
        .from("usuarios")
        .select("id, numero_socio, nombre, apellidos, activo, socio_activo")
        .eq("activo", true)
        .eq("socio_activo", true)
        .or(
            `numero_socio.ilike.%${textoSeguro}%,` +
            `nombre.ilike.%${textoSeguro}%,` +
            `apellidos.ilike.%${textoSeguro}%`
        )
        .order("numero_socio", { ascending: true })
        .limit(8);

    if (error) {
        console.error("Error buscando socio:", error);

        contenedor.innerHTML =
            '<div class="mensaje-busqueda-prestamo error">' +
            'No se han podido buscar los socios.' +
            '</div>';

        return;
    }

    usuariosPrestamo = data || [];

    if (usuariosPrestamo.length === 0) {
        contenedor.innerHTML =
            '<div class="mensaje-busqueda-prestamo">' +
            'No se encontraron socios habilitados para préstamo.' +
            '</div>';

        return;
    }

    contenedor.innerHTML = "";

    usuariosPrestamo.forEach(usuario => {

        const boton = document.createElement("button");

        boton.type = "button";
        boton.className = "resultado-busqueda-prestamo";

        boton.innerHTML = `
            <span class="resultado-prestamo-principal">
                ${escaparHTMLPrestamo(usuario.numero_socio || "")}
                — ${escaparHTMLPrestamo(usuario.nombre || "")}
                ${escaparHTMLPrestamo(usuario.apellidos || "")}
            </span>

            <span class="resultado-prestamo-estado">
                Socio FIO activo · Biblioteca habilitada
            </span>
        `;

        boton.addEventListener("click", () => {
            seleccionarSocioPrestamo(usuario);
        });

        contenedor.appendChild(boton);
    });
}


function seleccionarSocioPrestamo(usuario) {

    usuarioPrestamoSeleccionado = usuario;

    const input = document.getElementById("buscar-socio-prestamo");
    const contenedor = document.getElementById("resultados-socio-prestamo");

    input.value =
        `${usuario.numero_socio} — ${usuario.nombre} ${usuario.apellidos}`;

    contenedor.innerHTML = `
        <div class="socio-prestamo-seleccionado">
            <strong>Socio seleccionado:</strong>
            ${escaparHTMLPrestamo(usuario.numero_socio || "")}
            — ${escaparHTMLPrestamo(usuario.nombre || "")}
            ${escaparHTMLPrestamo(usuario.apellidos || "")}
        </div>
    `;
}


function escaparHTMLPrestamo(valor) {

    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
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
            "contador-prestamos"
        );


    if (contador) {
        contador.textContent = mensaje;
    }

}