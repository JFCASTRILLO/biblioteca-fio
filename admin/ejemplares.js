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

const modalEjemplar =
    document.getElementById("modal-ejemplar");

const btnCerrarFicha =
    document.getElementById("cerrar-ficha-ejemplar");

const fichaTitulo =
    document.getElementById("ficha-titulo");

const fichaAutor =
    document.getElementById("ficha-autor");

const fichaEstado =
    document.getElementById("ficha-estado");

const fichaId =
    document.getElementById("ficha-id");

const fichaClave =
    document.getElementById("ficha-clave");

const fichaEditorial =
    document.getElementById("ficha-editorial");

const fichaPaginas =
    document.getElementById("ficha-paginas");

const fichaGenero =
    document.getElementById("ficha-genero");

const fichaFormato =
    document.getElementById("ficha-formato");

const fichaIdioma =
    document.getElementById("ficha-idioma");

const fichaUbicacion =
    document.getElementById("ficha-ubicacion");

const fichaIsbn =
    document.getElementById("ficha-isbn");

const fichaSinopsis =
    document.getElementById("ficha-sinopsis");

const btnEditarEjemplar =
    document.getElementById("btn-editar-ejemplar");

const btnGuardarEjemplar =
    document.getElementById("btn-guardar-ejemplar");

const btnCancelarEdicion =
    document.getElementById("btn-cancelar-edicion");

const fichaEjemplar =
    document.querySelector(".ficha-ejemplar-admin");

const editarTitulo =
    document.getElementById("editar-titulo");

const editarAutor =
    document.getElementById("editar-autor");

const editarClave =
    document.getElementById("editar-clave");

const editarEditorial =
    document.getElementById("editar-editorial");

const editarPaginas =
    document.getElementById("editar-paginas");

const editarGenero =
    document.getElementById("editar-genero");

const editarFormato =
    document.getElementById("editar-formato");

const editarIdioma =
    document.getElementById("editar-idioma");

const editarUbicacion =
    document.getElementById("editar-ubicacion");

const editarIsbn =
    document.getElementById("editar-isbn");

const editarSinopsis =
    document.getElementById("editar-sinopsis");



/* ==========================================================
   DATOS
   ========================================================== */

let ejemplares = [];
let ejemplarActual = null;


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
                    paginas,
                    genero,
                    formato,
                    idioma,
                    ubicacion,
                    estado,
                    sinopsis,
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

        fila.classList.add(
            "fila-ejemplar-admin"
        );

        fila.addEventListener(
            "click",
            function () {

                abrirFichaEjemplar(
                    ejemplar
                );
            }
        );

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
   FICHA DEL EJEMPLAR
   ========================================================== */

function valorFicha(valor) {

    if (
        valor === null ||
        valor === undefined ||
        String(valor).trim() === ""
    ) {
        return "—";
    }

    return valor;
}


function abrirFichaEjemplar(ejemplar) {

    ejemplarActual = ejemplar;

    fichaTitulo.textContent =
        valorFicha(ejemplar.titulo);

    fichaAutor.textContent =
        valorFicha(ejemplar.autor);

    fichaId.textContent =
        valorFicha(ejemplar.id);

    fichaClave.textContent =
        valorFicha(ejemplar.clave);

    fichaEditorial.textContent =
        valorFicha(ejemplar.editorial);

    fichaPaginas.textContent =
        valorFicha(ejemplar.paginas);

    fichaGenero.textContent =
        valorFicha(ejemplar.genero);

    fichaFormato.textContent =
        valorFicha(ejemplar.formato);

    fichaIdioma.textContent =
        valorFicha(ejemplar.idioma);

    fichaUbicacion.textContent =
        valorFicha(ejemplar.ubicacion);

    fichaIsbn.textContent =
        valorFicha(ejemplar.isbn);

    fichaSinopsis.textContent =
        valorFicha(ejemplar.sinopsis);


    const estado =
        valorFicha(ejemplar.estado);

    fichaEstado.textContent =
        estado;

    fichaEstado.className =
        "estado-admin";

    if (
        ejemplar.estado
    ) {

        fichaEstado.classList.add(
            "estado-" +
            ejemplar.estado.toLowerCase()
        );
    }


    modalEjemplar.classList.add(
        "visible"
    );

    document.body.classList.add(
        "modal-abierto"
    );
}

   /* ==========================================================
   ACTIVAR EDICIÓN DEL EJEMPLAR
   ========================================================== */

    btnEditarEjemplar.addEventListener(
        "click",
        function () {

            btnEditarEjemplar.addEventListener(
    "click",
    function () {

        editarTitulo.value =
            fichaTitulo.textContent === "—"
                ? ""
                : fichaTitulo.textContent;

        editarAutor.value =
            fichaAutor.textContent === "—"
                ? ""
                : fichaAutor.textContent;

        editarClave.value =
            fichaClave.textContent === "—"
                ? ""
                : fichaClave.textContent;

        editarEditorial.value =
            fichaEditorial.textContent === "—"
                ? ""
                : fichaEditorial.textContent;

        editarPaginas.value =
            fichaPaginas.textContent === "—"
                ? ""
                : fichaPaginas.textContent;

        editarGenero.value =
            fichaGenero.textContent === "—"
                ? ""
                : fichaGenero.textContent;

        editarFormato.value =
            fichaFormato.textContent === "—"
                ? ""
                : fichaFormato.textContent;

        editarIdioma.value =
            fichaIdioma.textContent === "—"
                ? ""
                : fichaIdioma.textContent;

        editarUbicacion.value =
            fichaUbicacion.textContent === "—"
                ? ""
                : fichaUbicacion.textContent;

        editarIsbn.value =
            fichaIsbn.textContent === "—"
                ? ""
                : fichaIsbn.textContent;

        editarSinopsis.value =
            fichaSinopsis.textContent === "—"
                ? ""
                : fichaSinopsis.textContent;


        fichaEjemplar.classList.add(
            "modo-edicion"
        );
    }
);

        }
    );

/* ==========================================================
   CANCELAR EDICIÓN
   ========================================================== */

btnCancelarEdicion.addEventListener(
    "click",
    function () {

        fichaEjemplar.classList.remove(
            "modo-edicion"
        );

    }
);

/* ==========================================================
   GUARDAR CAMBIOS DEL EJEMPLAR
   ========================================================== */

btnGuardarEjemplar.addEventListener(
    "click",
    async function () {

        if (!ejemplarActual) {
            return;
        }


        const titulo =
            editarTitulo.value.trim();

        const autor =
            editarAutor.value.trim();

        const clave =
            editarClave.value.trim();


        if (!titulo) {

            alert(
                "El título no puede quedar vacío."
            );

            editarTitulo.focus();

            return;
        }


        if (!autor) {

            alert(
                "El autor no puede quedar vacío."
            );

            editarAutor.focus();

            return;
        }


        if (!clave) {

            alert(
                "La clave no puede quedar vacía."
            );

            editarClave.focus();

            return;
        }


        let paginas = null;

        if (
            editarPaginas.value.trim() !== ""
        ) {

            paginas =
                Number(editarPaginas.value);

            if (
                !Number.isInteger(paginas) ||
                paginas < 0
            ) {

                alert(
                    "El número de páginas no es válido."
                );

                editarPaginas.focus();

                return;
            }
        }


        const cambios = {

            titulo: titulo,

            autor: autor,

            clave: clave,

            editorial:
                editarEditorial.value.trim() || null,

            paginas: paginas,

            genero:
                editarGenero.value.trim() || null,

            formato:
                editarFormato.value.trim() || null,

            idioma:
                editarIdioma.value.trim() || null,

            ubicacion:
                editarUbicacion.value.trim() || null,

            isbn:
                editarIsbn.value.trim() || null,

            sinopsis:
                editarSinopsis.value.trim() || null,

            updated_at:
                new Date().toISOString()
        };


        btnGuardarEjemplar.disabled = true;
        btnGuardarEjemplar.textContent =
            "Guardando...";


        const { data, error } =
            await clienteSupabase
                .from("ejemplares")
                .update(cambios)
                .eq("id", ejemplarActual.id)
                .select()
                .single();


        btnGuardarEjemplar.disabled = false;
        btnGuardarEjemplar.textContent =
            "Guardar cambios";


        if (error) {

            console.error(
                "Error al actualizar ejemplar:",
                error
            );

            alert(
                "No se han podido guardar los cambios."
            );

            return;
        }


        /*
         * Actualizamos el ejemplar que tenemos
         * cargado en memoria.
         */

        Object.assign(
            ejemplarActual,
            data
        );


        /*
         * Actualizamos la ficha de consulta.
         */

        fichaTitulo.textContent =
            valorFicha(data.titulo);

        fichaAutor.textContent =
            valorFicha(data.autor);

        fichaClave.textContent =
            valorFicha(data.clave);

        fichaEditorial.textContent =
            valorFicha(data.editorial);

        fichaPaginas.textContent =
            valorFicha(data.paginas);

        fichaGenero.textContent =
            valorFicha(data.genero);

        fichaFormato.textContent =
            valorFicha(data.formato);

        fichaIdioma.textContent =
            valorFicha(data.idioma);

        fichaUbicacion.textContent =
            valorFicha(data.ubicacion);

        fichaIsbn.textContent =
            valorFicha(data.isbn);

        fichaSinopsis.textContent =
            valorFicha(data.sinopsis);


        /*
         * Salimos del modo edición.
         */

        fichaEjemplar.classList.remove(
            "modo-edicion"
        );


        /*
         * Volvemos a dibujar la tabla para que
         * los cambios aparezcan inmediatamente.
         */

        aplicarFiltros();


        alert(
            "Los cambios se han guardado correctamente."
        );

    }
);


/* ==========================================================
   CERRAR FICHA
   ========================================================== */

function cerrarFichaEjemplar() {

    modalEjemplar.classList.remove(
        "visible"
    );

    document.body.classList.remove(
        "modal-abierto"
    );
}


btnCerrarFicha.addEventListener(
    "click",
    cerrarFichaEjemplar
);


modalEjemplar.addEventListener(
    "click",
    function (event) {

        if (
            event.target === modalEjemplar
        ) {

            cerrarFichaEjemplar();
        }
    }
);


document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Escape" &&
            modalEjemplar.classList.contains("visible")
        ) {

            cerrarFichaEjemplar();
        }
    }
);


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