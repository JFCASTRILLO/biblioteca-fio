/* ==========================================================
   CONEXIÓN CON SUPABASE
   ========================================================== */

const SUPABASE_URL = "https://ffxnsvetxaikdpolvjym.supabase.co";

const SUPABASE_KEY = "sb_publishable_nVJbKuJztCNImhywm7OS8Q_KA064589";

const clienteSupabase = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


/* ==========================================================
   CONFIGURACIÓN DEL CATÁLOGO
   ========================================================== */

const columnasVisibles = [
    "id",
    "titulo",
    "autor",
    "editorial",
    "genero",
    "idioma",
    "estado",
    "clave"
];

let todosLosLibros = [];
let librosVisibles = [];
let indiceLibroActual = -1;
let usuarioSocioActual = null;

const ejemplaresReservadosSocio = new Set();

/* ==========================================================
   CARGAR CATÁLOGO DESDE SUPABASE
   ========================================================== */

async function cargarLibros() {

    const contador = document.getElementById("contador");

    contador.innerText =
        "Conectando con el catálogo de la Fundación...";

    try {

        const TAMANO_BLOQUE = 1000;

        let desde = 0;
        let seguirCargando = true;
        let librosCargados = [];

        while (seguirCargando) {

            const hasta = desde + TAMANO_BLOQUE - 1;

            const { data, error } = await clienteSupabase
                .from("ejemplares")
                .select(`
                    id,
                    titulo,
                    autor,
                    editorial,
                    paginas,
                    genero,
                    formato,
                    idioma,
                    ubicacion,
                    estado,
                    sinopsis,
                    clave,
                    isbn
                `)
                .order("id", { ascending: true })
                .range(desde, hasta);

            if (error) {
                throw error;
            }

            if (!data || data.length === 0) {
                seguirCargando = false;
                break;
            }

            librosCargados.push(...data);

            if (data.length < TAMANO_BLOQUE) {
                seguirCargando = false;
            } else {
                desde += TAMANO_BLOQUE;
            }
        }


        /* --------------------------------------------------
           NORMALIZAR LOS ESTADOS
           -------------------------------------------------- */

        todosLosLibros = librosCargados.map(libro => ({
            ...libro,

            estado: libro.estado
                ? String(libro.estado).toLowerCase().trim()
                : ""
        }));


        /* --------------------------------------------------
           COMPROBAR RESULTADO
           -------------------------------------------------- */

        if (todosLosLibros.length === 0) {

            contador.innerText =
                "El catálogo FIO no contiene ejemplares.";

            return;
        }


        /* --------------------------------------------------
           ACTIVAR BUSCADOR Y FILTRO
           -------------------------------------------------- */

        document.getElementById("buscador").disabled = false;

        document.getElementById("filtro-estado").disabled = false;

        document.getElementById("btn-limpiar").disabled = false;


        /* --------------------------------------------------
           CREAR CABECERA DE LA TABLA
           -------------------------------------------------- */

        const cabecera =
            document.getElementById("tabla-cabecera");

        cabecera.innerHTML = "";

        const filaCabecera =
            document.createElement("tr");

        columnasVisibles.forEach(col => {

            const th =
                document.createElement("th");

            th.textContent =
                col.toUpperCase();

            filaCabecera.appendChild(th);

        });

        cabecera.appendChild(filaCabecera);


        /* --------------------------------------------------
           MOSTRAR TABLA
           -------------------------------------------------- */

        document.getElementById("bloque-tabla")
            .style.display = "block";

        /* La lista visible inicial es el catálogo completo */
        librosVisibles = todosLosLibros;

        mostrarEnTabla(librosVisibles);

    }

    catch (error) {

        console.error(
            "Error al cargar el catálogo desde Supabase:",
            error
        );

        contador.innerText =
            "No ha sido posible conectar con el catálogo FIO.";

    }
}

/* ==========================================================
   INICIAR CATÁLOGO
   ========================================================== */

document.addEventListener(
    "DOMContentLoaded",
    cargarLibros
);

function mostrarEnTabla(listaAMostrar) {
    const cuerpo = document.getElementById("tabla-cuerpo");
    cuerpo.innerHTML = "";
    const contadorDiv = document.getElementById("contador");

    if (listaAMostrar.length === 0) {
        contadorDiv.innerText = "Ningún ejemplar coincide con los criterios FIO.";
        cuerpo.innerHTML = `<tr><td colspan="${columnasVisibles.length}" class="sin-resultados">Sin coincidencias encontradas</td></tr>`;
        return;
    }

    contadorDiv.innerText = `Mostrando ${listaAMostrar.length} de ${todosLosLibros.length} ejemplares de la colección.`;

    const fragmento = document.createDocumentFragment();
    listaAMostrar.forEach(libro => {
        const fila = document.createElement("tr");
        fila.className = "fila-libro";
        fila.onclick = () => { abrirDetallesModal(libro); };

        columnasVisibles.forEach(col => {
            const td = document.createElement("td");
            const valor = libro[col];
            if(col === "estado") {
                td.innerHTML = `<span class="estado-tag status-${String(valor).toLowerCase()}">${String(valor).toUpperCase()}</span>`;
            } else {
                td.textContent = valor !== undefined && valor !== null ? valor : "";
            }
            fila.appendChild(td);
        });
        fragmento.appendChild(fila);
    });
    cuerpo.appendChild(fragmento);
}

function filtrarLibros() {
    // 1. Capturar el texto del buscador, pasarlo a minúsculas y quitarle los acentos
    const textoBusqueda = document.getElementById("buscador").value
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""); // Borra tildes, diéresis, etc.
        
    const estadoSeleccionado = document.getElementById("filtro-estado").value;

    const librosFiltrados = todosLosLibros.filter(libro => {
        // Validación del desplegable de estado
        const cumpleEstado = (estadoSeleccionado === "todos") || (libro.estado === estadoSeleccionado);
        
        // Validación del input de búsqueda en TODOS los campos del JSON
        const cumpleBusqueda = (textoBusqueda === "") || Object.keys(libro).some(col => {
            const valorCelda = libro[col];
            
            if (valorCelda !== undefined && valorCelda !== null) {
                // Convertir el contenido de la celda a minúsculas y quitarle los acentos temporalmente para comparar
                const celdaNormalizada = String(valorCelda)
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "");
                    
                return celdaNormalizada.includes(textoBusqueda);
            }
            return false;
        });

        return cumpleEstado && cumpleBusqueda;
    });

    // Guardar la lista actualmente visible
    librosVisibles = librosFiltrados;

    // Pintar los resultados procesados en la tabla minimalista
    mostrarEnTabla(librosVisibles);
}

function limpiarFiltros() {

    const buscador =
        document.getElementById("buscador");

    const filtroEstado =
        document.getElementById("filtro-estado");


    buscador.value = "";

    filtroEstado.value = "todos";


    librosVisibles = todosLosLibros;

    mostrarEnTabla(
        librosVisibles
    );


    buscador.focus();
}

/* ==========================================================
   AJUSTAR TAMAÑO DEL TÍTULO EN LA FICHA
   ========================================================== */

function ajustarTamanoTitulo(titulo) {

    const elementoTitulo =
        document.getElementById("modal-titulo");

    const longitud =
        String(titulo || "").length;


    elementoTitulo.classList.remove(
        "titulo-largo",
        "titulo-muy-largo"
    );


    if (longitud > 70) {

        elementoTitulo.classList.add(
            "titulo-muy-largo"
        );

    }
    else if (longitud > 45) {

        elementoTitulo.classList.add(
            "titulo-largo"
        );

    }
}


// 5. EVENTOS MODAL
function abrirDetallesModal(libro) {

indiceLibroActual =
    librosVisibles.findIndex(
        elemento => elemento.id === libro.id
    );

actualizarNavegacionModal();

const portada = document.getElementById("modal-portada");
const loader = document.getElementById("loader-portada");

document.getElementById("modal-titulo").textContent = libro.titulo;
ajustarTamanoTitulo(libro.titulo);
document.getElementById("modal-autor").textContent = libro.autor;
document.getElementById("modal-id").textContent = libro.id;
document.getElementById("modal-editorial").textContent = libro.editorial;
document.getElementById("modal-genero").textContent = libro.genero;
document.getElementById("modal-idioma").textContent = libro.idioma;
document.getElementById("modal-clave").textContent = libro.clave;
document.getElementById("modal-paginas").textContent = libro.paginas || "-";
document.getElementById("modal-formato").textContent = libro.formato || "-";
document.getElementById("modal-ubicacion").textContent = libro.ubicacion || "-";
document.getElementById("modal-isbn").textContent = libro.isbn || "-";

document.getElementById("modal-sinopsis").textContent =
    libro.sinopsis && libro.sinopsis !== "-"
        ? libro.sinopsis
        : "Sin descripción adicional.";

    actualizarAccionReserva(libro);

loader.style.display = "block";

    const { data: datosPortada } =
        clienteSupabase
            .storage
            .from("portadas")
            .getPublicUrl(
                `${libro.id}.jpg`
            );

    const rutaPortada =
        datosPortada.publicUrl;

    const imagenPrueba =
        new Image();

    imagenPrueba.onload =
        function () {

            portada.src =
                rutaPortada;

            loader.style.display =
                "none";
        };

    imagenPrueba.onerror =
        function () {

            const { data: datosNoDisponible } =
                clienteSupabase
                    .storage
                    .from("portadas")
                    .getPublicUrl(
                        "NoDisponible.jpg"
                    );

            portada.src =
                datosNoDisponible.publicUrl + "?v=2";

            loader.style.display =
                "none";
        };

    imagenPrueba.src =
        rutaPortada;
    


    document.getElementById("modal-detalles").style.display = "flex";
}

function actualizarNavegacionModal() {

    const btnAnterior =
        document.getElementById("btn-anterior-libro");

    const btnSiguiente =
        document.getElementById("btn-siguiente-libro");

    const posicion =
        document.getElementById("posicion-libro");


    if (
        !btnAnterior ||
        !btnSiguiente ||
        !posicion
    ) {
        return;
    }


    const total =
        librosVisibles.length;


    if (
        indiceLibroActual < 0 ||
        total === 0
    ) {

        posicion.textContent = "";

        btnAnterior.disabled = true;
        btnSiguiente.disabled = true;

        return;
    }


    posicion.textContent =
        (indiceLibroActual + 1) +
        " de " +
        total;


    btnAnterior.disabled =
        indiceLibroActual === 0;

    btnSiguiente.disabled =
        indiceLibroActual === total - 1;
}


function navegarLibro(direccion) {

    const nuevoIndice =
        indiceLibroActual + direccion;


    if (
        nuevoIndice < 0 ||
        nuevoIndice >= librosVisibles.length
    ) {
        return;
    }


    indiceLibroActual =
        nuevoIndice;


    abrirDetallesModal(
        librosVisibles[indiceLibroActual]
    );
}


function cerrarModal() {
    
    const contenidoModal =
            document.querySelector(".contenido-modal");

        contenidoModal.style.position = "relative";
        contenidoModal.style.left = "";
        contenidoModal.style.top = "";
        contenidoModal.style.margin = "";
        
    document.getElementById("modal-detalles").style.display = "none";
}

window.onclick = function(event) {
    const modal = document.getElementById("modal-detalles");
    if (event.target === modal) {
        modal.style.display = "none";
    }
};


/* ==========================================
   VISOR DE PORTADAS
   ========================================== */

const modalImagen =
    document.getElementById("modal-imagen");

const imagenAmpliada =
    document.getElementById("imagen-ampliada");

const portadaModal =
    document.getElementById("modal-portada");

if(portadaModal){

    portadaModal.addEventListener("click", function(){

        if(this.src.includes("NoDisponible.jpg")){
            return;
        }

        imagenAmpliada.src = this.src;

        modalImagen.style.display = "flex";
    });
}

document.querySelector(".cerrar-imagen")
?.addEventListener("click", function(){

    modalImagen.style.display = "none";
});

modalImagen?.addEventListener("click", function(e){

    if(e.target === modalImagen){

        modalImagen.style.display = "none";
    }
});

/* ==================================================
   MODAL ARRASTRABLE
   ================================================== */

let arrastrandoModal = false;

let desplazamientoX = 0;
let desplazamientoY = 0;


document.addEventListener(
    "DOMContentLoaded",
    function () {

        const asaModal =
            document.getElementById("asa-modal");

        const contenidoModal =
            document.querySelector(".contenido-modal");


        if (
            !asaModal ||
            !contenidoModal
        ) {
            return;
        }


        asaModal.addEventListener(
            "mousedown",
            function (evento) {

                arrastrandoModal = true;


                const rect =
                    contenidoModal.getBoundingClientRect();


                desplazamientoX =
                    evento.clientX - rect.left;

                desplazamientoY =
                    evento.clientY - rect.top;


                contenidoModal.style.position =
                    "fixed";

                contenidoModal.style.margin =
                    "0";

                contenidoModal.style.left =
                    rect.left + "px";

                contenidoModal.style.top =
                    rect.top + "px";


                evento.preventDefault();
            }
        );


        document.addEventListener(
            "mousemove",
            function (evento) {

                if (!arrastrandoModal) {
                    return;
                }


                let nuevaX =
                    evento.clientX -
                    desplazamientoX;

                let nuevaY =
                    evento.clientY -
                    desplazamientoY;


                const ancho =
                    contenidoModal.offsetWidth;

                const alto =
                    contenidoModal.offsetHeight;


                nuevaX =
                    Math.max(
                        0,
                        Math.min(
                            nuevaX,
                            window.innerWidth - ancho
                        )
                    );


                nuevaY =
                    Math.max(
                        0,
                        Math.min(
                            nuevaY,
                            window.innerHeight - alto
                        )
                    );


                contenidoModal.style.left =
                    nuevaX + "px";

                contenidoModal.style.top =
                    nuevaY + "px";
            }
        );


        document.addEventListener(
            "mouseup",
            function () {

                arrastrandoModal = false;
            }
        );

    }
);

async function abrirMisReservas() {

    const modal =
        document.getElementById(
            "modal-mis-reservas"
        );

    const lista =
        document.getElementById(
            "lista-mis-reservas"
        );

    const mensaje =
        document.getElementById(
            "mensaje-mis-reservas"
        );

    modal.style.display = "flex";

    lista.innerHTML = "";

    mensaje.textContent =
        "Cargando reservas...";

    mensaje.style.display = "block";


    try {

        const {
            data,
            error
        } = await clienteSupabase
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
            throw error;
        }

        ejemplaresReservadosSocio.clear();

        (data || []).forEach(reserva => {

            if (
                reserva.estado === "ACTIVA" ||
                reserva.estado === "DISPONIBLE"
            ) {

                const ejemplar =
                    reserva.ejemplar || {};

                if (ejemplar.id) {
                    ejemplaresReservadosSocio.add(
                        ejemplar.id
                    );
                }
            }
        });

        mensaje.style.display = "none";

        mostrarMisReservas(data || []);


    } catch (error) {

        console.error(
            "Error cargando reservas del socio:",
            error
        );

        mensaje.textContent =
            "No se han podido cargar tus reservas.";

        mensaje.style.display = "block";
    }
}

function mostrarMisReservas(reservas) {

    const lista =
        document.getElementById(
            "lista-mis-reservas"
        );

    lista.innerHTML = "";


    if (reservas.length === 0) {

        lista.innerHTML = `
            <div class="reserva-vacia">
                No tienes reservas registradas.
            </div>
        `;

        return;
    }


    reservas.forEach(reserva => {

        const ejemplar =
            reserva.ejemplar || {};


            let textoEstado = "";

            switch (reserva.estado) {

                case "ACTIVA":
                    textoEstado =
                        "En espera de disponibilidad";
                    break;

                case "DISPONIBLE":
                    textoEstado =
                        "Disponible para recoger";
                    break;

                case "ATENDIDA":
                    textoEstado =
                        "Reserva atendida";
                    break;

                case "CANCELADA":
                    textoEstado =
                        "Reserva cancelada";
                    break;

                default:
                    textoEstado = "";
            }


        const tarjeta =
            document.createElement("div");

        tarjeta.className =
            "tarjeta-mi-reserva";

        tarjeta.innerHTML = `
            <div class="mi-reserva-cabecera">

                <strong>
                    Reserva nº ${reserva.id}
                </strong>

                <span class="estado-mi-reserva estado-${(reserva.estado || "").toLowerCase()}">
                    ${reserva.estado || "-"}
                </span>

            </div>

            <div class="mi-reserva-titulo">
                ${ejemplar.titulo || "-"}
            </div>

            <div class="mi-reserva-datos">

                <span>
                    <strong>Clave:</strong>
                    ${ejemplar.clave || "-"}
                </span>

                <span>
                    <strong>Fecha:</strong>
                    ${formatearFechaReserva(
                        reserva.fecha_reserva
                    )}
                </span>

                ${
                    reserva.estado === "DISPONIBLE" &&
                    reserva.fecha_disponible
                        ? `
                            <span>
                                <strong>Disponible desde:</strong>
                                ${formatearFechaReserva(
                                    reserva.fecha_disponible
                                )}
                            </span>
                        `
                        : ""
                }

            </div>

            <div class="descripcion-estado-reserva">
                ${textoEstado}
            </div>

            ${
                reserva.estado === "ACTIVA" ||
                reserva.estado === "DISPONIBLE"
                    ? `
                        <div class="acciones-mi-reserva">
                            <button
                                type="button"
                                class="btn-cancelar-mi-reserva"
                                data-reserva-id="${reserva.id}"
                            >
                                Cancelar reserva
                            </button>
                        </div>
                    `
                    : ""
            }
        `;

        lista.appendChild(tarjeta);

        const botonCancelar =
            tarjeta.querySelector(
                ".btn-cancelar-mi-reserva"
            );

        if (botonCancelar) {

            botonCancelar.addEventListener(
                "click",
                function () {

                    cancelarMiReserva(
                        reserva.id,
                        ejemplar.id
                    );
                }
            );
        }

    });
}

async function cancelarMiReserva(
    reservaId,
    ejemplarId
) {

    const confirmar =
        window.confirm(
            "¿Deseas cancelar la reserva nº " +
            reservaId +
            "?"
        );

    if (!confirmar) {
        return;
    }


    try {

        const {
            error
        } = await clienteSupabase.rpc(
            "cancelar_reserva",
            {
                p_reserva_id: reservaId
            }
        );


        if (error) {
            throw error;
        }


        /* ---------------------------------------------
           CONSULTAR EL ESTADO REAL DEL EJEMPLAR
           --------------------------------------------- */

        const {
            data: ejemplarActualizado,
            error: errorEjemplar
        } = await clienteSupabase
            .from("ejemplares")
            .select("id, estado")
            .eq("id", ejemplarId)
            .single();


        if (errorEjemplar) {
            throw errorEjemplar;
        }


        /* ---------------------------------------------
           ACTUALIZAR EL EJEMPLAR EN MEMORIA
           --------------------------------------------- */

        const libroEnMemoria =
            todosLosLibros.find(
                libro =>
                    libro.id === ejemplarId
            );


        if (libroEnMemoria) {

            libroEnMemoria.estado =
                ejemplarActualizado.estado;
        }


        /*
         * librosVisibles contiene los mismos objetos en
         * condiciones normales, pero lo comprobamos para
         * mantener también esa colección sincronizada.
         */

        const libroVisible =
            librosVisibles.find(
                libro =>
                    libro.id === ejemplarId
            );


        if (libroVisible) {

            libroVisible.estado =
                ejemplarActualizado.estado;
        }


        alert(
            "Reserva cancelada correctamente."
        );


        /* Recargar Mis reservas */
        await abrirMisReservas();


    } catch (error) {

        console.error(
            "Error cancelando reserva:",
            error
        );

        alert(
            "No se ha podido cancelar la reserva.\n\n" +
            (
                error.message ||
                "Se ha producido un error inesperado."
            )
        );
    }
}


function formatearFechaReserva(fecha) {

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


function cerrarMisReservas() {

    document
        .getElementById("modal-mis-reservas")
        .style.display = "none";
}


/* ==========================================================
   ACCESO DE SOCIOS - APERTURA Y CIERRE DEL MODAL
   ========================================================== */

function abrirAccesoSocios() {

    const modal =
        document.getElementById(
            "modal-acceso-socios"
        );

    modal.style.display = "flex";

    document.getElementById(
        "mensaje-acceso-socios"
    ).style.display = "none";

    document.getElementById(
        "acceso-password"
    ).value = "";

    setTimeout(() => {
        document.getElementById(
            "acceso-email"
        ).focus();
    }, 50);
}

function cerrarAccesoSocios() {

    const modal =
        document.getElementById(
            "modal-acceso-socios"
        );

    modal.style.display = "none";

    document.getElementById(
        "acceso-password"
    ).value = "";

    document.getElementById(
        "mensaje-acceso-socios"
    ).style.display = "none";
}

document
    .getElementById("btn-acceso-socios")
    .addEventListener(
        "click",
        abrirAccesoSocios
    );


document
    .getElementById("btn-cerrar-acceso-socios")
    .addEventListener(
        "click",
        cerrarAccesoSocios
    );


document
    .getElementById("btn-cancelar-acceso")
    .addEventListener(
        "click",
        cerrarAccesoSocios
    );


document
    .getElementById("modal-acceso-socios")
    .addEventListener(
        "click",
        function (event) {

            if (event.target === this) {
                cerrarAccesoSocios();
            }

        }
    );

document
    .getElementById("btn-mis-reservas")
    .addEventListener(
        "click",
        abrirMisReservas
    );


document
    .getElementById("btn-cerrar-mis-reservas")
    .addEventListener(
        "click",
        cerrarMisReservas
    );


document
    .getElementById("btn-cerrar-lista-reservas")
    .addEventListener(
        "click",
        cerrarMisReservas
    );


document
    .getElementById("modal-mis-reservas")
    .addEventListener(
        "click",
        function (event) {

            if (event.target === this) {
                cerrarMisReservas();
            }

        }
    );


document
    .getElementById("btn-reservar-ejemplar")
    .addEventListener(
        "click",
        abrirConfirmacionReserva
    );

document
    .getElementById("btn-cerrar-confirmar-reserva")
    .addEventListener(
        "click",
        cerrarConfirmacionReserva
    );


document
    .getElementById("btn-cancelar-reserva")
    .addEventListener(
        "click",
        cerrarConfirmacionReserva
    );

document
    .getElementById("modal-confirmar-reserva")
    .addEventListener("click", function (event) {

        if (event.target === this) {
            cerrarConfirmacionReserva();
        }

    });

    document
    .getElementById("form-confirmar-reserva")
    .addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            confirmarReservaSocio();
        }
    );
   

/* ==========================================================
   ACCESO DE SOCIOS - AUTENTICACIÓN
   ========================================================== */

async function iniciarSesionSocio(event) {

    event.preventDefault();

    const email =
        document.getElementById(
            "acceso-email"
        ).value.trim();

    const password =
        document.getElementById(
            "acceso-password"
        ).value;

    const mensaje =
        document.getElementById(
            "mensaje-acceso-socios"
        );

    const boton =
        document.getElementById(
            "btn-entrar-socio"
        );


    mensaje.style.display = "none";
    mensaje.textContent = "";


    if (!email || !password) {

        mensaje.textContent =
            "Introduzca el correo electrónico y la contraseña.";

        mensaje.style.display = "block";

        return;
    }


    try {

        boton.disabled = true;
        boton.textContent = "Entrando...";


        const { data, error } =
            await clienteSupabase.auth
                .signInWithPassword({
                    email: email,
                    password: password
                });


        if (error) {
            throw error;
        }


        if (!data.user) {
            throw new Error(
                "No se ha podido identificar al usuario."
            );
        }
        
    /* ------------------------------------------------------
    BUSCAR LA FICHA DEL USUARIO EN BIBLIOTECA
    ------------------------------------------------------ */

    const { data: usuarioBiblioteca, error: errorUsuario } =
        await clienteSupabase
            .from("usuarios")
            .select(`
                id,
                numero_socio,
                nombre,
                apellidos,
                rol,
                activo,
                socio_activo,
                fecha_ultima_validacion_socio
            `)
            .eq(
                "auth_user_id",
                data.user.id
            )
            .maybeSingle();


    if (errorUsuario) {
        throw errorUsuario;
    }


    if (!usuarioBiblioteca) {

        await clienteSupabase.auth.signOut();

        throw new Error(
            "La cuenta no está vinculada a un usuario de la Biblioteca FIO."
        );
    }

        mostrarSocioEnCabecera(
            usuarioBiblioteca
        );

        mensaje.textContent =
            "Identificación correcta.";

        mensaje.style.display = "block";


        setTimeout(() => {

            cerrarAccesoSocios();

        }, 700);

    }

    catch (error) {

        console.error(
            "Error en el acceso de socios:",
            error
        );


        mensaje.textContent =
            "Correo electrónico o contraseña incorrectos.";

        mensaje.style.display = "block";

    }

    finally {

        boton.disabled = false;
        boton.textContent = "Entrar";

    }
}

document
    .getElementById("form-acceso-socios")
    .addEventListener(
        "submit",
        iniciarSesionSocio
    );

/* ==========================================================
   CABECERA - SESIÓN DEL SOCIO
   ========================================================== */

function mostrarSocioEnCabecera(usuario) {

    usuarioSocioActual = usuario;

    cargarReservasActivasSocio();

    const btnAcceso =
        document.getElementById(
            "btn-acceso-socios"
        );

    const bloqueSesion =
        document.getElementById(
            "sesion-socio"
        );

    const nombreSocio =
        document.getElementById(
            "nombre-socio-cabecera"
        );

        

    nombreSocio.textContent =
        usuario.numero_socio +
        " · " +
        usuario.nombre +
        " " +
        usuario.apellidos;


    btnAcceso.style.display = "none";

    bloqueSesion.style.display = "flex";
}


function ocultarSocioEnCabecera() {

    usuarioSocioActual = null;

    ejemplaresReservadosSocio.clear();

    document.getElementById(
        "sesion-socio"
    ).style.display = "none";

    document.getElementById(
        "btn-acceso-socios"
    ).style.display = "";
}

async function cerrarSesionSocio() {

    const { error } =
        await clienteSupabase.auth
            .signOut();


    if (error) {

        console.error(
            "Error al cerrar la sesión:",
            error
        );

        return;
    }


    ocultarSocioEnCabecera();
}


document
    .getElementById(
        "btn-cerrar-sesion-socio"
    )
    .addEventListener(
        "click",
        cerrarSesionSocio
    );

    /* ==========================================================
   RESTAURAR SESIÓN DEL SOCIO AL ABRIR LA PÁGINA
   ========================================================== */

async function restaurarSesionSocio() {

    try {

        const { data, error } =
            await clienteSupabase.auth
                .getSession();


        if (error) {
            throw error;
        }


        const sesion = data.session;


        if (!sesion || !sesion.user) {

            ocultarSocioEnCabecera();

            return;
        }


        const { data: usuarioBiblioteca, error: errorUsuario } =
            await clienteSupabase
                .from("usuarios")
                .select(`
                    id,
                    numero_socio,
                    nombre,
                    apellidos,
                    rol,
                    activo,
                    socio_activo,
                    fecha_ultima_validacion_socio
                `)
                .eq(
                    "auth_user_id",
                    sesion.user.id
                )
                .maybeSingle();


        if (errorUsuario) {
            throw errorUsuario;
        }


        if (!usuarioBiblioteca) {

            await clienteSupabase.auth
                .signOut();

            ocultarSocioEnCabecera();

            return;
        }


        mostrarSocioEnCabecera(
            usuarioBiblioteca
        );

    }

    catch (error) {

        console.error(
            "Error al restaurar la sesión del socio:",
            error
        );

        ocultarSocioEnCabecera();

    }
}

document.addEventListener(
    "DOMContentLoaded",
    restaurarSesionSocio
);


/* ==========================================================
   RESERVAS - ESTADO DEL BOTÓN EN LA FICHA DEL EJEMPLAR
   ========================================================== */

function abrirConfirmacionReserva() {

    const modal = document.getElementById(
        "modal-confirmar-reserva"
    );

    const titulo = document.getElementById(
        "titulo-confirmar-reserva"
    );

    const libro = librosVisibles[indiceLibroActual];

    if (!libro) {
        return;
    }

    titulo.textContent = libro.titulo || "";

    document.getElementById(
        "medio-contacto-reserva"
    ).value = "";

    document.getElementById(
        "dato-contacto-reserva"
    ).value = "";

    document.getElementById(
        "mensaje-confirmar-reserva"
    ).style.display = "none";

    modal.style.display = "flex";
    
}

function cerrarConfirmacionReserva() {

    const modal = document.getElementById(
        "modal-confirmar-reserva"
    );

    modal.style.display = "none";

    document.getElementById(
        "medio-contacto-reserva"
    ).value = "";

    document.getElementById(
        "dato-contacto-reserva"
    ).value = "";

    const mensaje = document.getElementById(
        "mensaje-confirmar-reserva"
    );

    mensaje.textContent = "";
    mensaje.style.display = "none";
}

async function confirmarReservaSocio() {

    const libro =
    librosVisibles[indiceLibroActual];

    if (!usuarioSocioActual || !libro) {
        return;
}

    const medioContacto =
        document
            .getElementById("medio-contacto-reserva")
            .value;

    const datoContacto =
        document
            .getElementById("dato-contacto-reserva")
            .value
            .trim();

    const mensaje =
        document.getElementById(
            "mensaje-confirmar-reserva"
        );

    /* ---------------------------------------------
       VALIDAR CONTACTO
       --------------------------------------------- */

    if (!medioContacto) {

        mensaje.textContent =
            "Seleccione un medio de contacto.";

        mensaje.style.display = "block";

        document
            .getElementById("medio-contacto-reserva")
            .focus();

        return;
    }

    if (!datoContacto) {

        mensaje.textContent =
            "Indique el dato de contacto.";

        mensaje.style.display = "block";

        document
            .getElementById("dato-contacto-reserva")
            .focus();

        return;
    }


    const boton =
        document.getElementById(
            "btn-confirmar-reserva"
        );


    try {

        boton.disabled = true;
        boton.textContent = "Reservando...";

        mensaje.textContent = "";
        mensaje.style.display = "none";


        const {
            data,
            error
        } = await clienteSupabase.rpc(
            "crear_reserva",
            {
                p_usuario_id:
                    usuarioSocioActual.id,

                p_ejemplar_id:
                    libro.id,

                p_medio_contacto:
                    medioContacto,

                p_dato_contacto:
                    datoContacto,

                p_observaciones:
                    null
            }
        );


        if (error) {
            throw error;
        }

        /*
        * Si el ejemplar estaba disponible, la reserva
        * hace que pase a RESERVADO.
        *
        * Si estaba prestado, debe continuar PRESTADO:
        * la reserva queda ACTIVA a la espera de devolución.
        */

        const estadoAnterior =
            String(libro.estado || "")
                .toUpperCase()
                .trim();

        if (estadoAnterior === "DISPONIBLE") {

            libro.estado = "RESERVADO";
        }

        actualizarAccionReserva(libro);


        let numeroReserva = "";

        if (
            Array.isArray(data) &&
            data.length > 0
        ) {
            numeroReserva =
                data[0].reserva_id || "";
        }


        cerrarConfirmacionReserva();


        let texto =
            "Reserva registrada correctamente.";

        if (numeroReserva) {
            texto +=
                "\n\nNº de reserva: " +
                numeroReserva;
        }

        alert(texto);


    } catch (error) {

        console.error(
            "Error creando reserva:",
            error
        );

        mensaje.textContent =
            error.message ||
            "No se ha podido registrar la reserva.";

        mensaje.style.display = "block";


    } finally {

        boton.disabled = false;
        boton.textContent =
            "Confirmar reserva";
    }
}

async function cargarReservasActivasSocio() {

    ejemplaresReservadosSocio.clear();

    if (!usuarioSocioActual) {
        return;
    }

    try {

        const {
            data,
            error
        } = await clienteSupabase
            .from("reservas")
            .select(`
                estado,
                ejemplar_id
            `)
            .in(
                "estado",
                [
                    "ACTIVA",
                    "DISPONIBLE"
                ]
            );

        if (error) {
            throw error;
        }

        (data || []).forEach(reserva => {

            if (reserva.ejemplar_id) {

                ejemplaresReservadosSocio.add(
                    reserva.ejemplar_id
                );
            }
        });

    } catch (error) {

        console.error(
            "Error cargando reservas activas del socio:",
            error
        );
    }
}



function actualizarAccionReserva(libro) {

    const bloque =
        document.getElementById(
            "acciones-socio-ejemplar"
        );

    const boton =
        document.getElementById(
            "btn-reservar-ejemplar"
        );

    const mensaje =
        document.getElementById(
            "mensaje-reserva-ejemplar"
        );


    /* Visitante no identificado */

    if (!usuarioSocioActual) {

        bloque.style.display = "none";

        return;
    }


    /* Socio identificado */

    bloque.style.display = "flex";

    boton.disabled = false;

    boton.style.display = "";

    mensaje.textContent = "";


    /* Cuenta de Biblioteca deshabilitada */

    if (!usuarioSocioActual.activo) {

        boton.style.display = "none";

        mensaje.textContent =
            "La cuenta de Biblioteca no está habilitada.";

        return;
    }


    /* Ya no figura como socio activo de la FIO */

    if (!usuarioSocioActual.socio_activo) {

        boton.style.display = "none";

        mensaje.textContent =
            "La reserva requiere ser socio activo de la FIO.";

        return;
    }

    if (
        ejemplaresReservadosSocio.has(
            libro.id
        )
    ) {

        boton.style.display = "none";

        mensaje.textContent =
            "Ya tienes una reserva activa para este ejemplar.";

        return;
    }


    const estado =
        String(libro.estado || "")
            .toLowerCase()
            .trim();


    if (estado === "disponible") {

        boton.textContent =
            "Reservar ejemplar";

        mensaje.textContent =
            "El ejemplar está disponible.";

        return;
    }


    if (estado === "prestado") {

        boton.textContent =
            "Reservar ejemplar";

        mensaje.textContent =
            "El ejemplar está prestado. Reserva en espera.";

        return;
    }


    if (estado === "reservado") {

        boton.style.display = "none";

        mensaje.textContent =
            "Este ejemplar ya está reservado.";

        return;
    }


    boton.style.display = "none";

    mensaje.textContent =
        "Este ejemplar no admite reservas.";
}
