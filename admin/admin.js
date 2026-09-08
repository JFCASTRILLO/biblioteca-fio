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
   ELEMENTOS DEL FORMULARIO
   ========================================================== */

const formulario =
    document.getElementById("form-login");

const txtEmail =
    document.getElementById("email");

const txtPassword =
    document.getElementById("password");

const btnLogin =
    document.getElementById("btn-login");

const mensaje =
    document.getElementById("mensaje-login");

const enlaceRecuperar =
    document.getElementById("enlace-recuperar");

/* ==========================================================
   MOSTRAR MENSAJES
   ========================================================== */

function mostrarMensaje(texto, tipo = "") {

    mensaje.textContent = texto;

    mensaje.className = "mensaje-login";

    if (tipo === "error") {
        mensaje.classList.add("mensaje-error");
    }

    if (tipo === "correcto") {
        mensaje.classList.add("mensaje-correcto");
    }
}


/* ==========================================================
   INICIAR SESIÓN
   ========================================================== */

formulario.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        const email =
            txtEmail.value.trim();

        const password =
            txtPassword.value;

        mostrarMensaje("");

        btnLogin.disabled = true;
        btnLogin.textContent =
            "Comprobando...";

        try {

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

            await comprobarAdministrador();

        } catch (error) {

            console.error(
                "Error de inicio de sesión:",
                error
            );

            mostrarMensaje(
                "Correo electrónico o contraseña incorrectos.",
                "error"
            );

        } finally {

            btnLogin.disabled = false;
            btnLogin.textContent =
                "Iniciar sesión";
        }
    }
);


/* ==========================================================
   COMPROBAR QUE EL USUARIO ES ADMINISTRADOR
   ========================================================== */

async function comprobarAdministrador() {

    const {
        data: datosUsuario,
        error: errorUsuario
    } =
        await clienteSupabase.auth.getUser();

    if (errorUsuario || !datosUsuario.user) {

        throw new Error(
            "No existe una sesión válida."
        );
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
            auth_user_id,
            nombre,
            apellidos,
            rol,
            activo
        `)
        .eq("auth_user_id", uid)
        .single();

    if (errorPerfil) {

        await clienteSupabase.auth.signOut();

        throw new Error(
            "No se ha podido consultar el perfil."
        );
    }

    if (
        perfil.rol !== "admin" ||
        perfil.activo !== true
    ) {

        await clienteSupabase.auth.signOut();

        mostrarMensaje(
            "Este usuario no tiene permisos de administración.",
            "error"
        );

        return;
    }

        mostrarMensaje(
    "Acceso autorizado. Bienvenido, " +
    perfil.nombre + ".",
    "correcto"
    );

    setTimeout(
        function () {

            window.location.href =
                "panel.html";
        },
        700
    );
}
/* ==========================================================
   RECUPERAR CONTRASEÑA
   ========================================================== */

enlaceRecuperar.addEventListener(
    "click",
    async function (event) {

        event.preventDefault();

        const email =
            txtEmail.value.trim();

        if (!email) {

            mostrarMensaje(
                "Introduce primero tu correo electrónico.",
                "error"
            );

            txtEmail.focus();

            return;
        }


        mostrarMensaje(
            "Enviando correo de recuperación..."
        );


        try {

            const { error } =
                await clienteSupabase.auth
                    .resetPasswordForEmail(
                        email,
                        {
                            redirectTo:
                                "https://jfcastrillo.github.io/biblioteca-fio/admin/cambiar-password.html"
                        }
                    );

            if (error) {
                throw error;
            }


            mostrarMensaje(
                "Te hemos enviado un correo para cambiar tu contraseña.",
                "correcto"
            );


        } catch (error) {

            console.error(
                "Error recuperando contraseña:",
                error
            );

            mostrarMensaje(
                "No se ha podido enviar el correo de recuperación.",
                "error"
            );
        }
    }
);