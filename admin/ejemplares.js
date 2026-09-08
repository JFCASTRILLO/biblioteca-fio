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

const fichaEstadoFisico =
    document.getElementById("ficha-estado-fisico");

const fichaUbicacion =
    document.getElementById("ficha-ubicacion");

const fichaIsbn =
    document.getElementById("ficha-isbn");

const fichaSinopsis =
    document.getElementById("ficha-sinopsis");

const fichaPortada =
    document.getElementById("ficha-portada");

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

const editarEstadoFisico =
    document.getElementById("editar-estado-fisico");

const editarUbicacion =
    document.getElementById("editar-ubicacion");

const editarIsbn =
    document.getElementById("editar-isbn");

const editarSinopsis =
    document.getElementById("editar-sinopsis");

const btnCambiarPortada =
    document.getElementById("btn-cambiar-portada");

const archivoPortada =
    document.getElementById("archivo-portada");

const btnLimpiarBusqueda =
    document.getElementById("btn-limpiar-busqueda");

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
                    estado_fisico,
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

    fichaEjemplar.classList.remove(
        "modo-edicion"
    );

    ejemplarActual = ejemplar;


    /* ==========================================================
       PORTADA
       ========================================================== */

    const { data: datosPortada } =
        clienteSupabase
            .storage
            .from("portadas")
            .getPublicUrl(
                `${ejemplar.id}.jpg`
            );

    const rutaPortada =
        datosPortada.publicUrl +
        "?v=" +
        Date.now();


    const imagenPrueba =
        new Image();


    imagenPrueba.onload =
        function () {

            fichaPortada.src =
                rutaPortada;

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

            fichaPortada.src =
                datosNoDisponible.publicUrl +
                "?v=" +
                Date.now();

        };


    imagenPrueba.src =
        rutaPortada;


    /* ==========================================================
       DATOS DEL EJEMPLAR
       ========================================================== */

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

    fichaEstadoFisico.textContent =
        valorFicha(ejemplar.estado_fisico);

    fichaUbicacion.textContent =
        valorFicha(ejemplar.ubicacion);

    fichaIsbn.textContent =
        valorFicha(ejemplar.isbn);

    fichaSinopsis.textContent =
        valorFicha(ejemplar.sinopsis);


    /* ==========================================================
       ESTADO OPERATIVO
       ========================================================== */

    const estado =
        valorFicha(ejemplar.estado);

    fichaEstado.textContent =
        estado;

    fichaEstado.className =
        "estado-admin";


    if (ejemplar.estado) {

        fichaEstado.classList.add(
            "estado-" +
            ejemplar.estado.toLowerCase()
        );

    }


    /* ==========================================================
       MOSTRAR MODAL
       ========================================================== */

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

    btnCambiarPortada.addEventListener(
        "click",
        function () {
            archivoPortada.click();
        }
    );

    async function prepararPortada(archivo) {

    const imagen =
        await createImageBitmap(archivo);

    const anchoMaximo = 1200;
    const altoMaximo = 1800;

    let ancho = imagen.width;
    let alto = imagen.height;

    const escala = Math.min(
        1,
        anchoMaximo / ancho,
        altoMaximo / alto
    );

    ancho =
        Math.round(ancho * escala);

    alto =
        Math.round(alto * escala);


    const canvas =
        document.createElement("canvas");

    canvas.width = ancho;
    canvas.height = alto;


    const contexto =
        canvas.getContext("2d");

    /*
     * Fondo blanco.
     * Es importante para imágenes PNG
     * que puedan tener transparencia.
     */

    contexto.fillStyle = "#ffffff";

    contexto.fillRect(
        0,
        0,
        ancho,
        alto
    );


    contexto.drawImage(
        imagen,
        0,
        0,
        ancho,
        alto
    );


    imagen.close();


    return new Promise(
        function (resolve, reject) {

            canvas.toBlob(
                function (blob) {

                    if (!blob) {

                        reject(
                            new Error(
                                "No se pudo convertir la imagen."
                            )
                        );

                        return;
                    }

                    resolve(blob);

                },
                "image/jpeg",
                0.88
            );

        }
    );
}




        archivoPortada.addEventListener(
        "change",
        async function () {

            const archivo =
                archivoPortada.files[0];
                
            if (!archivo) {
                return;
            }


            /* -----------------------------------------
            COMPROBAR QUE HAY UN EJEMPLAR ABIERTO
            ----------------------------------------- */

            if (!ejemplarActual) {

                alert(
                    "No se ha podido identificar el ejemplar."
                );

                archivoPortada.value = "";

                return;
            }


            /* -----------------------------------------
            VALIDAR TIPO DE IMAGEN
            ----------------------------------------- */

            const tiposPermitidos = [
                "image/jpeg",
                "image/png",
                "image/webp"
            ];

            if (!tiposPermitidos.includes(archivo.type)) {

                alert(
                    "Selecciona una imagen JPG, PNG o WEBP."
                );

                archivoPortada.value = "";

                return;
            }


            /* -----------------------------------------
            CONFIRMACIÓN
            ----------------------------------------- */

            const confirmar =
                confirm(
                    "¿Quieres guardar esta imagen como portada del ejemplar?"
                );

            if (!confirmar) {

                archivoPortada.value = "";

                return;
            }


            /* -----------------------------------------
            NOMBRE DE LA PORTADA
            ----------------------------------------- */

            const nombrePortada =
                `${ejemplarActual.id}.jpg`;


            /* -----------------------------------------
            SUBIR / REEMPLAZAR EN SUPABASE
            ----------------------------------------- */

            btnCambiarPortada.disabled = true;
            btnCambiarPortada.textContent =
                "Guardando...";

            let archivoPreparado;

            try {

                archivoPreparado =
                    await prepararPortada(archivo);

            } catch (error) {

                console.error(
                    "Error al preparar la portada:",
                    error
                );

                alert(
                    "No se ha podido preparar la imagen seleccionada."
                );

                btnCambiarPortada.disabled = false;

                btnCambiarPortada.textContent =
                    "Cambiar portada";

                archivoPortada.value = "";

                return;
            }


            const { error } =
                await clienteSupabase
                    .storage
                    .from("portadas")
                    .upload(
                        nombrePortada,
                        archivoPreparado,
                        {
                            upsert: true,
                            contentType: "image/jpeg",
                            cacheControl: "3600"
                        }
                    );


            if (error) {

                console.error(
                    "Error al guardar portada:",
                    error
                );

                alert(
                    "No se ha podido guardar la portada."
                );

                btnCambiarPortada.disabled = false;
                btnCambiarPortada.textContent =
                    "Cambiar portada";

                archivoPortada.value = "";

                return;
            }


            /* -----------------------------------------
            OBTENER URL PÚBLICA
            ----------------------------------------- */

            const { data: datosPortada } =
                clienteSupabase
                    .storage
                    .from("portadas")
                    .getPublicUrl(
                        nombrePortada
                    );


            /*
            * Añadimos un valor variable a la URL.
            * Así evitamos que el navegador muestre
            * una portada antigua almacenada en caché.
            */

            fichaPortada.src =
                datosPortada.publicUrl +
                "?v=" +
                Date.now();


            /* -----------------------------------------
            FINALIZAR
            ----------------------------------------- */

            btnCambiarPortada.disabled = false;

            btnCambiarPortada.textContent =
                "Cambiar portada";

            archivoPortada.value = "";


            alert(
                "La portada se ha guardado correctamente."
            );

        }
    );

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

        editarEstadoFisico.value =
            ejemplarActual.estado_fisico || "BUENO";

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

            estado_fisico:
                editarEstadoFisico.value,

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

        fichaEstadoFisico.textContent =
            valorFicha(data.estado_fisico);

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
            "Los datos se han guardado correctamente."
        );

        aplicarFiltros();

    }
);

btnLimpiarBusqueda.addEventListener(
    "click",
    function () {

        buscarEjemplar.value = "";

        aplicarFiltros();

        buscarEjemplar.focus();

    }
);


/* ==========================================================
   CERRAR FICHA
   ========================================================== */

function cerrarFichaEjemplar() {

    /*
     * Si la ficha estaba en modo edición,
     * salimos de ese modo.
     */

    fichaEjemplar.classList.remove(
        "modo-edicion"
    );


    /*
     * Cerramos la ventana.
     */

    modalEjemplar.classList.remove(
        "visible"
    );

    document.body.classList.remove(
        "modal-abierto"
    );


    /*
     * Dejamos de tener un ejemplar activo.
     */

    ejemplarActual = null;
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