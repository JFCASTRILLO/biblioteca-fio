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

let socioReservaSeleccionado = null;
let ejemplarReservaSeleccionado = null;

let reservaFichaSeleccionada = null;

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

        
         document
            .getElementById("btn-nueva-reserva")
            .addEventListener(
                "click",
                abrirNuevaReserva
            );


        document
            .getElementById("cerrar-nueva-reserva")
            .addEventListener(
                "click",
                cerrarNuevaReserva
            );


        document
            .getElementById("btn-cancelar-nueva-reserva")
            .addEventListener(
                "click",
                cerrarNuevaReserva
            );

        document
            .getElementById("buscar-socio-reserva")
            .addEventListener(
                "input",
                buscarSociosReserva
            );    

        document
            .getElementById("buscar-ejemplar-reserva")
            .addEventListener(
                "input",
                buscarEjemplaresReserva
            );

        document
            .getElementById("btn-registrar-reserva")
            .addEventListener(
                "click",
                registrarNuevaReserva
            );

         document
            .getElementById("cerrar-ficha-reserva")
            .addEventListener(
                "click",
                cerrarFichaReserva
            );


        document
            .getElementById("btn-cerrar-ficha-reserva")
            .addEventListener(
                "click",
                cerrarFichaReserva
            );
            
        document
            .getElementById("btn-cancelar-reserva")
            .addEventListener(
                "click",
                cancelarReserva
            );

        document
        .getElementById("btn-prestar-reserva")
        .addEventListener(
            "click",
            registrarPrestamoReserva
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
   NUEVA RESERVA
   ========================================================== */

function abrirNuevaReserva() {

    limpiarNuevaReserva();

    document
        .getElementById("modal-nueva-reserva")
        .style.display = "flex";
}


function cerrarNuevaReserva() {

    document
        .getElementById("modal-nueva-reserva")
        .style.display = "none";

    limpiarNuevaReserva();
}


function limpiarNuevaReserva() {

    socioReservaSeleccionado = null;
    ejemplarReservaSeleccionado = null;

    document
        .getElementById("buscar-socio-reserva")
        .value = "";

    document
        .getElementById("buscar-ejemplar-reserva")
        .value = "";

    document
        .getElementById("medio-contacto-reserva")
        .value = "";

    document
        .getElementById("dato-contacto-reserva")
        .value = "";

    document
        .getElementById("observaciones-reserva")
        .value = "";


    document
        .getElementById("resultados-socio-reserva")
        .innerHTML = "";

    document
        .getElementById("resultados-ejemplar-reserva")
        .innerHTML = "";


    document
        .getElementById("btn-registrar-reserva")
        .disabled = true;
}

/* ==========================================================
   BUSCAR SOCIO PARA RESERVA
   ========================================================== */

async function buscarSociosReserva() {

    const input =
        document.getElementById(
            "buscar-socio-reserva"
        );

    const contenedor =
        document.getElementById(
            "resultados-socio-reserva"
        );

    const texto =
        input.value.trim();


    socioReservaSeleccionado = null;

    document
        .getElementById("btn-registrar-reserva")
        .disabled = true;


    if (texto.length < 2) {

        contenedor.innerHTML = "";

        return;
    }


    try {

        const termino =
            texto.replaceAll(",", " ");


        const {
            data,
            error
        } = await supabaseClient
            .from("usuarios")
            .select(`
                id,
                numero_socio,
                nombre,
                apellidos,
                activo,
                socio_activo
            `)
            .or(
                `numero_socio.ilike.%${termino}%,` +
                `nombre.ilike.%${termino}%,` +
                `apellidos.ilike.%${termino}%`
            )
            .order(
                "numero_socio",
                {
                    ascending: true
                }
            )
            .limit(10);


        if (error) {
            throw error;
        }


        mostrarResultadosSociosReserva(
            data || []
        );

    }
    catch (error) {

        console.error(
            "Error buscando socios:",
            error
        );

        contenedor.innerHTML = `
            <div class="resultado-busqueda-vacio">
                No se ha podido realizar la búsqueda.
            </div>
        `;
    }
}


/* ==========================================================
   MOSTRAR SOCIOS ENCONTRADOS
   ========================================================== */

function mostrarResultadosSociosReserva(lista) {

    const contenedor =
        document.getElementById(
            "resultados-socio-reserva"
        );


    contenedor.innerHTML = "";


    if (lista.length === 0) {

        contenedor.innerHTML = `
            <div class="resultado-busqueda-vacio">
                No se han encontrado socios.
            </div>
        `;

        return;
    }


    lista.forEach(usuario => {

        const nombreCompleto =
            [
                usuario.nombre,
                usuario.apellidos
            ]
            .filter(Boolean)
            .join(" ");


        const opcion =
            document.createElement("button");


        opcion.type = "button";

        opcion.className =
            "resultado-busqueda-prestamo";


        opcion.innerHTML = `

            <strong>
                ${escaparHTML(
                    usuario.numero_socio || "-"
                )}
            </strong>

            <span>
                ${escaparHTML(
                    nombreCompleto || "-"
                )}
            </span>

        `;


        if (
            usuario.activo !== true ||
            usuario.socio_activo !== true
        ) {

            opcion.disabled = true;

            opcion.title =
                usuario.activo !== true
                    ? "Cuenta de Biblioteca no habilitada"
                    : "No figura como socio FIO activo";
        }


        opcion.addEventListener(
            "click",
            function () {

                seleccionarSocioReserva(
                    usuario
                );
            }
        );


        contenedor.appendChild(
            opcion
        );
    });
}


/* ==========================================================
   SELECCIONAR SOCIO
   ========================================================== */

function seleccionarSocioReserva(usuario) {

    socioReservaSeleccionado =
        usuario;


    const nombreCompleto =
        [
            usuario.nombre,
            usuario.apellidos
        ]
        .filter(Boolean)
        .join(" ");


    document
        .getElementById("buscar-socio-reserva")
        .value =
            [
                usuario.numero_socio,
                nombreCompleto
            ]
            .filter(Boolean)
            .join(" — ");


    document
        .getElementById("resultados-socio-reserva")
        .innerHTML = "";


    actualizarBotonRegistrarReserva();
}


/* ==========================================================
   BOTÓN REGISTRAR RESERVA
   ========================================================== */

function actualizarBotonRegistrarReserva() {

    document
        .getElementById("btn-registrar-reserva")
        .disabled =
            !socioReservaSeleccionado ||
            !ejemplarReservaSeleccionado;
}

/* ==========================================================
   BUSCAR EJEMPLAR PARA RESERVA
   ========================================================== */

async function buscarEjemplaresReserva() {

    const input =
        document.getElementById(
            "buscar-ejemplar-reserva"
        );

    const contenedor =
        document.getElementById(
            "resultados-ejemplar-reserva"
        );

    const texto =
        input.value.trim();


    ejemplarReservaSeleccionado = null;

    actualizarBotonRegistrarReserva();


    if (texto.length < 2) {

        contenedor.innerHTML = "";

        return;
    }

    try {

        const termino =
            texto.replaceAll(",", " ");

        const {
            data,
            error
        } = await supabaseClient
            .from("ejemplares")
            .select(`
                id,
                clave,
                titulo,
                autor,
                estado
            `)
            .in(
                "estado",
                [
                    "DISPONIBLE",
                    "PRESTADO"
                ]
            )
            .or(
                `clave.ilike.%${termino}%,` +
                `titulo.ilike.%${termino}%,` +
                `autor.ilike.%${termino}%`
            )
            .order(
                "clave",
                {
                    ascending: true
                }
            )
            .limit(10);


        if (error) {
            throw error;
        }


        mostrarResultadosEjemplaresReserva(
            data || []
        );

    }
    catch (error) {

        console.error(
            "Error buscando ejemplares:",
            error
        );

        contenedor.innerHTML = `
            <div class="resultado-busqueda-vacio">
                No se ha podido realizar la búsqueda.
            </div>
        `;
    }
}


/* ==========================================================
   MOSTRAR EJEMPLARES ENCONTRADOS
   ========================================================== */

function mostrarResultadosEjemplaresReserva(lista) {

    const contenedor =
        document.getElementById(
            "resultados-ejemplar-reserva"
        );


    contenedor.innerHTML = "";


    if (lista.length === 0) {

        contenedor.innerHTML = `
            <div class="resultado-busqueda-vacio">
                No hay ejemplares disponibles o prestados que coincidan.
            </div>
        `;

        return;
    }


    lista.forEach(ejemplar => {

        const opcion =
            document.createElement("button");


        opcion.type = "button";

        opcion.className =
            "resultado-busqueda-prestamo";


        opcion.innerHTML = `

            <strong>
                ${escaparHTML(
                    ejemplar.clave || "-"
                )}
            </strong>

            <span>
                ${escaparHTML(
                    ejemplar.titulo || "-"
                )}
            </span>

            <small>
                ${escaparHTML(
                    ejemplar.autor || ""
                )}
            </small>

            <small>
                Estado: ${escaparHTML(
                    ejemplar.estado || "-"
                )}
            </small>

        `;

        opcion.addEventListener(
            "click",
            function () {

                seleccionarEjemplarReserva(
                    ejemplar
                );
            }
        );


        contenedor.appendChild(
            opcion
        );
    });
}


/* ==========================================================
   SELECCIONAR EJEMPLAR
   ========================================================== */

function seleccionarEjemplarReserva(ejemplar) {

    ejemplarReservaSeleccionado =
        ejemplar;


    document
        .getElementById("buscar-ejemplar-reserva")
        .value =
            [
                ejemplar.clave,
                ejemplar.titulo
            ]
            .filter(Boolean)
            .join(" — ");


    document
        .getElementById("resultados-ejemplar-reserva")
        .innerHTML = "";


    actualizarBotonRegistrarReserva();
}

/* ==========================================================
   REGISTRAR NUEVA RESERVA
   ========================================================== */

async function registrarNuevaReserva() {

    if (
        !socioReservaSeleccionado ||
        !ejemplarReservaSeleccionado
    ) {
        return;
    }


    const medioContacto =
        document
            .getElementById("medio-contacto-reserva")
            .value || null;


    const datoContacto =
        document
            .getElementById("dato-contacto-reserva")
            .value
            .trim() || null;


    const observaciones =
        document
            .getElementById("observaciones-reserva")
            .value
            .trim() || null;


    /* ------------------------------------------------------
       Validar contacto
       ------------------------------------------------------ */

    if (
        medioContacto &&
        !datoContacto
    ) {

        alert(
            "Debe indicar el dato de contacto."
        );

        document
            .getElementById("dato-contacto-reserva")
            .focus();

        return;
    }


    const nombreSocio =
        [
            socioReservaSeleccionado.numero_socio,

            [
                socioReservaSeleccionado.nombre,
                socioReservaSeleccionado.apellidos
            ]
            .filter(Boolean)
            .join(" ")
        ]
        .filter(Boolean)
        .join(" — ");


    const descripcionEjemplar =
        [
            ejemplarReservaSeleccionado.clave,
            ejemplarReservaSeleccionado.titulo
        ]
        .filter(Boolean)
        .join(" — ");


    const confirmar =
        window.confirm(

            "¿Registrar esta reserva?\n\n" +

            "Socio: " +
            nombreSocio +
            "\n\n" +

            "Ejemplar: " +
            descripcionEjemplar

        );


    if (!confirmar) {
        return;
    }


    const boton =
        document.getElementById(
            "btn-registrar-reserva"
        );


    try {

        boton.disabled = true;

        boton.textContent =
            "Registrando...";


        const {
            data,
            error
        } = await supabaseClient.rpc(
            "crear_reserva",
            {
                p_usuario_id:
                    socioReservaSeleccionado.id,

                p_ejemplar_id:
                    ejemplarReservaSeleccionado.id,

                p_medio_contacto:
                    medioContacto,

                p_dato_contacto:
                    datoContacto,

                p_observaciones:
                    observaciones
            }
        );


        if (error) {
            throw error;
        }


        let numeroReserva = "";


        if (
            Array.isArray(data) &&
            data.length > 0
        ) {

            numeroReserva =
                data[0].reserva_id || "";
        }


        cerrarNuevaReserva();

        await cargarReservas();


        let mensaje =
            "Reserva registrada correctamente.\n\n" +

            "Socio: " +
            nombreSocio +
            "\n\n" +

            "Ejemplar: " +
            descripcionEjemplar;


        if (numeroReserva) {

            mensaje +=
                "\n\nNº de reserva: " +
                numeroReserva;
        }


        alert(mensaje);

    }
    catch (error) {

        console.error(
            "Error registrando reserva:",
            error
        );


        alert(
            "No se ha podido registrar la reserva.\n\n" +
            (
                error.message ||
                "Se ha producido un error inesperado."
            )
        );

    }
    finally {

        boton.disabled = false;

        boton.textContent =
            "Registrar reserva";

    }
}

/* ==========================================================
   FICHA DE RESERVA
   ========================================================== */

function abrirFichaReserva(reserva) {

    reservaFichaSeleccionada =
        reserva;


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


    const socio =
        [
            usuario.numero_socio,
            nombreCompleto
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


    document
        .getElementById("ficha-reserva-id")
        .textContent =
            reserva.id || "-";


    const estadoReserva =
    document.getElementById(
        "ficha-reserva-estado"
    );

    estadoReserva.textContent =
        reserva.estado || "-";


    /* Limpiamos cualquier estado anterior */

    estadoReserva.className = "";


    /* Aplicamos la misma clase que utiliza el listado */

    const claseReserva =
        claseEstadoReserva(
            reserva.estado
        );

    if (claseReserva) {
        estadoReserva.classList.add(
            claseReserva
        );
    }


    document
        .getElementById("ficha-reserva-socio")
        .textContent =
            socio || "-";


    document
        .getElementById("ficha-reserva-ejemplar")
        .textContent =
            descripcionEjemplar || "-";


    document
        .getElementById("ficha-reserva-fecha")
        .textContent =
            formatearFecha(
                reserva.fecha_reserva
            );


    document
        .getElementById("ficha-reserva-disponible")
        .textContent =
            formatearFecha(
                reserva.fecha_disponible
            );

    /* ==========================================================
    FECHAS HISTÓRICAS DE LA RESERVA
    ========================================================== */

    const bloqueAtendida =
        document.getElementById(
            "bloque-fecha-atendida"
        );

    const bloqueCancelacion =
        document.getElementById(
            "bloque-fecha-cancelacion"
        );


    /* Ocultamos ambos bloques inicialmente */

    bloqueAtendida.style.display = "none";
    bloqueCancelacion.style.display = "none";


    /* Reserva atendida */

    if (
        reserva.estado === "ATENDIDA" &&
        reserva.fecha_atendida
    ) {

        document.getElementById(
            "ficha-reserva-fecha-atendida"
        ).textContent =
            formatearFecha(
                reserva.fecha_atendida
            );

        bloqueAtendida.style.display = "";
    }


    /* Reserva cancelada */

    if (
        reserva.estado === "CANCELADA" &&
        reserva.fecha_cancelacion
    ) {

        document.getElementById(
            "ficha-reserva-fecha-cancelacion"
        ).textContent =
            formatearFecha(
                reserva.fecha_cancelacion
            );

        bloqueCancelacion.style.display = "";
    }


    document
        .getElementById("ficha-reserva-medio-contacto")
        .textContent =
            reserva.medio_contacto || "-";


    document
        .getElementById("ficha-reserva-dato-contacto")
        .textContent =
            reserva.dato_contacto || "-";


    document
        .getElementById("ficha-reserva-observaciones")
        .textContent =
            reserva.observaciones || "-";

    
    const btnCancelar =
        document.getElementById(
            "btn-cancelar-reserva"
        );


    btnCancelar.style.display =
        (
            reserva.estado === "ACTIVA" ||
            reserva.estado === "DISPONIBLE"
        )
            ? ""
            : "none";

    const btnPrestar =
        document.getElementById(
            "btn-prestar-reserva"
        );

    btnPrestar.style.display =
        reserva.estado === "DISPONIBLE"
            ? ""
            : "none";


    document
        .getElementById("modal-ficha-reserva")
        .style.display = "flex";
}


/* ==========================================================
   CERRAR FICHA DE RESERVA
   ========================================================== */

function cerrarFichaReserva() {

    document
        .getElementById("modal-ficha-reserva")
        .style.display = "none";


    reservaFichaSeleccionada = null;
}

async function cancelarReserva() {

    if (!reservaFichaSeleccionada) {
        return;
    }

    const reserva = reservaFichaSeleccionada;

    /* Solo pueden cancelarse reservas pendientes */
    if (
        reserva.estado !== "ACTIVA" &&
        reserva.estado !== "DISPONIBLE"
    ) {
        return;
    }

    const usuario = reserva.usuario || {};
    const ejemplar = reserva.ejemplar || {};

    const nombreUsuario =
        [
            usuario.nombre,
            usuario.apellidos
        ]
        .filter(Boolean)
        .join(" ");

    const socio =
        [
            usuario.numero_socio,
            nombreUsuario
        ]
        .filter(Boolean)
        .join(" — ");

    const libro =
        [
            ejemplar.clave,
            ejemplar.titulo
        ]
        .filter(Boolean)
        .join(" — ");

    const confirmar = window.confirm(
        "¿Cancelar esta reserva?" +
        "\n\nReserva nº " + reserva.id +
        "\n\nSocio: " + (socio || "-") +
        "\n\nEjemplar: " + (libro || "-")
    );

    if (!confirmar) {
        return;
    }

    const boton =
        document.getElementById(
            "btn-cancelar-reserva"
        );

    try {

        boton.disabled = true;
        boton.textContent = "Cancelando...";

        const { data, error } =
            await supabaseClient.rpc(
                "cancelar_reserva",
                {
                    p_reserva_id: reserva.id
                }
            );

        if (error) {
            throw error;
        }

        const resultado =
            Array.isArray(data) && data.length
                ? data[0]
                : null;

        cerrarFichaReserva();

        await cargarReservas();

        let mensaje =
            "Reserva cancelada correctamente.";

        if (
            resultado &&
            resultado.siguiente_reserva_id
        ) {

            mensaje +=
                "\n\nLa siguiente reserva en espera " +
                "ha pasado a DISPONIBLE.";

        } else if (
            resultado &&
            resultado.estado_ejemplar ===
                "DISPONIBLE"
        ) {

            mensaje +=
                "\n\nEl ejemplar vuelve a estar DISPONIBLE.";
        }

        alert(mensaje);

    } catch (error) {

        console.error(
            "Error cancelando reserva:",
            error
        );

        alert(
            "No se ha podido cancelar la reserva." +
            "\n\n" +
            (
                error.message ||
                "Se ha producido un error inesperado."
            )
        );

    } finally {

        boton.disabled = false;
        boton.textContent =
            "Cancelar reserva";
    }
}

    async function registrarPrestamoReserva() {

    if (!reservaFichaSeleccionada) {
        return;
    }

    const reserva = reservaFichaSeleccionada;

    /* Solo una reserva DISPONIBLE puede convertirse en préstamo */
    if (reserva.estado !== "DISPONIBLE") {
        return;
    }

    const usuario = reserva.usuario || {};
    const ejemplar = reserva.ejemplar || {};

    const nombreUsuario =
        [
            usuario.nombre,
            usuario.apellidos
        ]
        .filter(Boolean)
        .join(" ");

    const socio =
        [
            usuario.numero_socio,
            nombreUsuario
        ]
        .filter(Boolean)
        .join(" — ");

    const libro =
        [
            ejemplar.clave,
            ejemplar.titulo
        ]
        .filter(Boolean)
        .join(" — ");

    const confirmar = window.confirm(
        "¿Registrar el préstamo de esta reserva?" +
        "\n\nReserva nº " + reserva.id +
        "\n\nSocio: " + (socio || "-") +
        "\n\nEjemplar: " + (libro || "-") +
        "\n\nEl préstamo tendrá una duración de 15 días."
    );

    if (!confirmar) {
        return;
    }

    const boton =
        document.getElementById(
            "btn-prestar-reserva"
        );

    try {

        boton.disabled = true;
        boton.textContent =
            "Registrando...";

        const { data, error } =
            await supabaseClient.rpc(
                "registrar_prestamo_reserva",
                {
                    p_reserva_id: reserva.id,
                    p_observaciones: null
                }
            );

        if (error) {
            throw error;
        }

        const resultado =
            Array.isArray(data) && data.length
                ? data[0]
                : null;

        cerrarFichaReserva();

        await cargarReservas();

        let mensaje =
            "Préstamo registrado correctamente.";

        if (resultado) {

            mensaje +=
                "\n\nPréstamo nº " +
                resultado.prestamo_id;

            if (
                resultado.fecha_prevista_devolucion
            ) {
                mensaje +=
                    "\nFecha prevista de devolución: " +
                    formatearFecha(
                        resultado.fecha_prevista_devolucion
                    );
            }
        }

        alert(mensaje);

    } catch (error) {

        console.error(
            "Error registrando préstamo desde reserva:",
            error
        );

        alert(
            "No se ha podido registrar el préstamo." +
            "\n\n" +
            (
                error.message ||
                "Se ha producido un error inesperado."
            )
        );

    } finally {

        boton.disabled = false;
        boton.textContent =
            "Registrar préstamo";
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

         fila.className =
            "fila-reserva";


        fila.addEventListener(
            "click",
            function () {

                abrirFichaReserva(
                    reserva
                );
            }
        );

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
            return "estado-reserva-disponible";

        case "ATENDIDA":
            return "estado-reserva-atendida";

        case "CANCELADA":
            return "estado-reserva-cancelada";

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