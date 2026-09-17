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
let ejemplaresPrestamo = [];
let ejemplarPrestamoSeleccionado = null;
let prestamoFichaSeleccionado = null;

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

        document
            .getElementById("buscar-socio-prestamo")
            .addEventListener(
                "input",
                buscarSocioPrestamo
            );

        document
            .getElementById("buscar-ejemplar-prestamo")
            .addEventListener(
                "input",
                buscarEjemplarPrestamo
            );

        document
            .getElementById("btn-registrar-prestamo")
            .addEventListener(
                "click",
                registrarNuevoPrestamo
            );

        document
            .getElementById("cerrar-ficha-prestamo")
            .addEventListener(
                "click",
                cerrarFichaPrestamo
            );

        document
            .getElementById("btn-cerrar-ficha-prestamo")
            .addEventListener(
                "click",
                cerrarFichaPrestamo
            );

        document
            .getElementById("btn-registrar-devolucion")
            .addEventListener(
                "click",
                registrarDevolucion
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
   NUEVO PRÉSTAMO
   ========================================================== */

function abrirNuevoPrestamo() {

    usuarioPrestamoSeleccionado = null;
    ejemplarPrestamoSeleccionado = null;

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

    contenedor.innerHTML = "";
    actualizarBotonRegistrarPrestamo();
}


function escaparHTMLPrestamo(valor) {

    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ==================================================
// BÚSQUEDA DE EJEMPLAR PARA NUEVO PRÉSTAMO
// ==================================================

async function buscarEjemplarPrestamo() {

    const input =
        document.getElementById("buscar-ejemplar-prestamo");

    const contenedor =
        document.getElementById("resultados-ejemplar-prestamo");

    const texto = input.value.trim();

    ejemplarPrestamoSeleccionado = null;

    document
        .getElementById("btn-registrar-prestamo")
        .disabled = true;

    if (texto.length < 2) {
        contenedor.innerHTML = "";
        return;
    }

    contenedor.innerHTML =
        '<div class="mensaje-busqueda-prestamo">' +
        'Buscando ejemplares...</div>';

    const textoSeguro = texto
        .replace(/,/g, " ")
        .replace(/\(/g, " ")
        .replace(/\)/g, " ")
        .trim();

    let consulta = supabaseClient
        .from("ejemplares")
        .select("id, clave, titulo, autor, estado")
        .eq("estado", "DISPONIBLE");

    // Si escribe solamente un número, también buscamos por ID.
    if (/^\d+$/.test(textoSeguro)) {

        consulta = consulta.or(
            `id.eq.${Number(textoSeguro)},` +
            `clave.ilike.%${textoSeguro}%,` +
            `titulo.ilike.%${textoSeguro}%,` +
            `autor.ilike.%${textoSeguro}%`
        );

    } else {

        consulta = consulta.or(
            `clave.ilike.%${textoSeguro}%,` +
            `titulo.ilike.%${textoSeguro}%,` +
            `autor.ilike.%${textoSeguro}%`
        );
    }

    const { data, error } = await consulta
        .order("titulo", { ascending: true })
        .limit(8);

    if (error) {

        console.error(
            "Error buscando ejemplar:",
            error
        );

        contenedor.innerHTML =
            '<div class="mensaje-busqueda-prestamo error">' +
            'No se han podido buscar los ejemplares.' +
            '</div>';

        return;
    }

    ejemplaresPrestamo = data || [];

    if (ejemplaresPrestamo.length === 0) {

        contenedor.innerHTML =
            '<div class="mensaje-busqueda-prestamo">' +
            'No se encontraron ejemplares disponibles.' +
            '</div>';

        return;
    }

    contenedor.innerHTML = "";

    ejemplaresPrestamo.forEach(ejemplar => {

        const boton =
            document.createElement("button");

        boton.type = "button";

        boton.className =
            "resultado-busqueda-prestamo";

        boton.innerHTML = `
            <span class="resultado-prestamo-principal">
                ${escaparHTMLPrestamo(ejemplar.clave || "")}
                — ${escaparHTMLPrestamo(ejemplar.titulo || "")}
            </span>

            <span class="resultado-prestamo-estado">
                ${escaparHTMLPrestamo(ejemplar.autor || "")}
            </span>
        `;

        boton.addEventListener(
            "click",
            () => seleccionarEjemplarPrestamo(ejemplar)
        );

        contenedor.appendChild(boton);
    });
}


function seleccionarEjemplarPrestamo(ejemplar) {

    ejemplarPrestamoSeleccionado = ejemplar;

    const input =
        document.getElementById("buscar-ejemplar-prestamo");

    const contenedor =
        document.getElementById("resultados-ejemplar-prestamo");

    input.value =
        `${ejemplar.clave} — ${ejemplar.titulo}`;

    contenedor.innerHTML = "";

    actualizarBotonRegistrarPrestamo();
}

function actualizarBotonRegistrarPrestamo() {

    const boton =
        document.getElementById("btn-registrar-prestamo");

    boton.disabled = !(
        usuarioPrestamoSeleccionado &&
        ejemplarPrestamoSeleccionado
    );
}

// ==================================================
// REGISTRAR NUEVO PRÉSTAMO
// ==================================================

async function registrarNuevoPrestamo() {

    const boton =
        document.getElementById("btn-registrar-prestamo");

    if (
        !usuarioPrestamoSeleccionado ||
        !ejemplarPrestamoSeleccionado
    ) {
        return;
    }

    const observaciones =
        document
            .getElementById("observaciones-prestamo")
            .value
            .trim();

    const usuario = usuarioPrestamoSeleccionado;
    const ejemplar = ejemplarPrestamoSeleccionado;

    try {

        // Evitar doble pulsación mientras se registra.
        boton.disabled = true;
        boton.textContent = "Registrando...";

        const {
            data,
            error
        } = await supabaseClient.rpc(
            "registrar_prestamo",
            {
                p_usuario_id: usuario.id,
                p_ejemplar_id: ejemplar.id,
                p_observaciones:
                    observaciones || null
            }
        );

        if (error) {
            throw error;
        }

        // La función devuelve el ID del préstamo creado.
        const idPrestamo =
            Array.isArray(data)
                ? data[0]?.id
                : data?.id ?? data;

        cerrarNuevoPrestamo();

        // Recargar la tabla para mostrar el préstamo recién creado.
        await cargarPrestamos();

        // Localizamos el préstamo recién creado.
        const nuevoPrestamo =
            todosLosPrestamos.find(
                prestamo =>
                    String(prestamo.id) ===
                    String(idPrestamo)
            );

        let fechaPrestamo = "";
        let fechaDevolucion = "";

        if (nuevoPrestamo) {

            fechaPrestamo =
                formatearFecha(
                    nuevoPrestamo.fecha_prestamo
                );

            fechaDevolucion =
                formatearFecha(
                    nuevoPrestamo.fecha_prevista_devolucion
                );
        }

        let mensaje =
            "Préstamo registrado correctamente.\n\n" +
            "Socio: " +
            (usuario.numero_socio || "") +
            " — " +
            [usuario.nombre, usuario.apellidos]
                .filter(Boolean)
                .join(" ") +
            "\n\n" +
            "Ejemplar: " +
            (ejemplar.clave || "") +
            " — " +
            (ejemplar.titulo || "");

        if (fechaPrestamo) {
            mensaje +=
                "\n\nFecha del préstamo: " +
                fechaPrestamo;
        }

        if (fechaDevolucion) {
            mensaje +=
                "\nDevolución prevista: " +
                fechaDevolucion;
        }

        alert(mensaje);

    }
    catch (error) {

        console.error(
            "Error registrando préstamo:",
            error
        );

        alert(
            "No se ha podido registrar el préstamo.\n\n" +
            (error.message ||
                "Se ha producido un error inesperado.")
        );
    }
    finally {

        boton.textContent =
            "Registrar préstamo";

        actualizarBotonRegistrarPrestamo();
    }
}

// ==================================================
// FICHA DEL PRÉSTAMO
// ==================================================

function abrirFichaPrestamo(prestamo) {

    prestamoFichaSeleccionado = prestamo;

    const usuario = prestamo.usuario || {};
    const ejemplar = prestamo.ejemplar || {};

    const nombreSocio =
        [
            usuario.nombre,
            usuario.apellidos
        ]
        .filter(Boolean)
        .join(" ");

    document.getElementById(
        "ficha-prestamo-id"
    ).textContent =
        prestamo.id || "-";


    document.getElementById(
        "ficha-prestamo-socio"
    ).textContent =
        [
            usuario.numero_socio,
            nombreSocio
        ]
        .filter(Boolean)
        .join(" — ") || "-";


    document.getElementById(
        "ficha-prestamo-ejemplar"
    ).textContent =
        [
            ejemplar.clave,
            ejemplar.titulo
        ]
        .filter(Boolean)
        .join(" — ") || "-";


    document.getElementById(
        "ficha-prestamo-fecha"
    ).textContent =
        formatearFecha(
            prestamo.fecha_prestamo
        );


    document.getElementById(
        "ficha-prestamo-prevista"
    ).textContent =
        formatearFecha(
            prestamo.fecha_prevista_devolucion
        );


    document.getElementById(
        "ficha-prestamo-devolucion"
    ).textContent =
        formatearFecha(
            prestamo.fecha_devolucion
        );


    const estado =
    document.getElementById(
        "ficha-prestamo-estado"
    );

        estado.textContent =
            prestamo.estado || "-";


        /* Limpiamos las clases de estado anteriores */

        estado.className = "estado-admin";


        /* Aplicamos el color correspondiente */

        if (prestamo.estado === "PRESTADO") {

            estado.classList.add(
                "estado-prestamo-prestado"
            );

        } else if (prestamo.estado === "DEVUELTO") {

            estado.classList.add(
                "estado-prestamo-devuelto"
            );
        }


    document.getElementById(
        "ficha-prestamo-observaciones"
    ).textContent =
        prestamo.observaciones || "Sin observaciones";


    actualizarSituacionPrestamo(prestamo);


    const btnDevolucion =
        document.getElementById(
            "btn-registrar-devolucion"
        );

    btnDevolucion.style.display =
        prestamo.estado === "PRESTADO"
            ? ""
            : "none";


    document
        .getElementById("modal-ficha-prestamo")
        .classList.add("visible");

    document.body.classList.add(
        "modal-abierto"
    );
}


function cerrarFichaPrestamo() {

    document
        .getElementById("modal-ficha-prestamo")
        .classList.remove("visible");

    document.body.classList.remove(
        "modal-abierto"
    );

    prestamoFichaSeleccionado = null;
}


// ==================================================
// REGISTRAR DEVOLUCIÓN
// ==================================================

async function registrarDevolucion() {

    if (!prestamoFichaSeleccionado) {
        return;
    }

    const prestamo = prestamoFichaSeleccionado;

    if (prestamo.estado !== "PRESTADO") {
        return;
    }

    const usuario = prestamo.usuario || {};
    const ejemplar = prestamo.ejemplar || {};

    const socio =
        [
            usuario.numero_socio,
            [usuario.nombre, usuario.apellidos]
                .filter(Boolean)
                .join(" ")
        ]
        .filter(Boolean)
        .join(" — ");

    const descripcionEjemplar =
        [
            ejemplar.clave,
            ejemplar.titulo
        ]
        .filter(Boolean)
        .join(" — ");


    const confirmar = window.confirm(
        "¿Registrar la devolución de este préstamo?\n\n" +
        "Socio: " + socio + "\n" +
        "Ejemplar: " + descripcionEjemplar
    );

    if (!confirmar) {
        return;
    }


    const boton =
        document.getElementById(
            "btn-registrar-devolucion"
        );


    try {

        boton.disabled = true;
        boton.textContent = "Registrando...";


        const {
            data,
            error
        } = await supabaseClient.rpc(
            "registrar_devolucion",
            {
                p_prestamo_id: prestamo.id
            }
        );


        if (error) {
            throw error;
        }


        let fechaDevolucion = "";

        if (
            Array.isArray(data) &&
            data.length > 0
        ) {
            fechaDevolucion =
                formatearFecha(
                    data[0].fecha_devolucion
                );
        }


        cerrarFichaPrestamo();

        await cargarPrestamos();


        let mensaje =
            "Devolución registrada correctamente.\n\n" +
            "Socio: " + socio + "\n\n" +
            "Ejemplar: " + descripcionEjemplar;

        if (fechaDevolucion) {
            mensaje +=
                "\n\nFecha de devolución: " +
                fechaDevolucion;
        }


        alert(mensaje);

    }
    catch (error) {

        console.error(
            "Error registrando devolución:",
            error
        );

        alert(
            "No se ha podido registrar la devolución.\n\n" +
            (
                error.message ||
                "Se ha producido un error inesperado."
            )
        );

    }
    finally {

        boton.disabled = false;
        boton.textContent =
            "Registrar devolución";

    }

}


function actualizarSituacionPrestamo(prestamo) {

    const elemento =
        document.getElementById(
            "ficha-prestamo-situacion"
        );

    if (prestamo.estado === "DEVUELTO") {

        elemento.textContent = "Devuelto";
        return;
    }

    const hoy = new Date();

    hoy.setHours(0, 0, 0, 0);

    const prevista =
        new Date(
            prestamo.fecha_prevista_devolucion +
            "T00:00:00"
        );

    if (hoy > prevista) {
        elemento.textContent = "Fuera de plazo";
    }
    else {
        elemento.textContent = "En plazo";
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

        fila.classList.add("fila-prestamo");

        fila.addEventListener(
            "click",
            () => abrirFichaPrestamo(prestamo)
        );

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