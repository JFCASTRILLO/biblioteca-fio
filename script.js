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

        mostrarEnTabla(todosLosLibros);

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

const elEstado = document.getElementById("modal-estado");

elEstado.textContent = libro.estado || "-";

elEstado.className =
    `estado-badge status-${String(libro.estado || "").toLowerCase()}`;


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