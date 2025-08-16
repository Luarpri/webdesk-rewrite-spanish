export async function launch(UI, fs, Scripts) {
    const blob = await fs.read('/system/lib/wallpaper.jpg');
    console.log(blob);
    if (blob instanceof Blob) {
        const imageUrl = URL.createObjectURL(blob);
        document.body.style.backgroundImage = `url('${imageUrl}')`;
    } else {
        console.log(`<!> /system/lib/wallpaper.jpg is not an image decodable by WebDesk's UI.`);
    }
    const setupflexcontainer = UI.create('div', document.body, 'setup-flex-container');
    const setup = UI.create('div', setupflexcontainer, 'setup-window');
    UI.text(setup, "Welcome to WebDesk!");
    const alrSetup = await set.read('setupdone');
    if (alrSetup === "true") {
        const btn = UI.button(setup, "Salir", "ui-main-btn");
        btn.addEventListener('click', () => {
            UI.remove(setupflexcontainer);
        });
    }

    const btn = UI.button(setup, "Siguiente", "ui-main-btn");
    btn.addEventListener('click', () => {
        migratePane();
    });

    async function migratePane() {
        setup.innerHTML = '';
        UI.text(setup, "Asistente de migracion");
        const existing = await fs.read('/user/info/config.json');
        if (existing) {
            const status = UI.text(setup, "¿Copiar datos del WebDesk antiguo al nuevo? Esto puede tardar un poco; es necesario convertir los archivos.");
            const skipBtn = UI.button(setup, "Saltar", "ui-main-btn");
            skipBtn.addEventListener('click', () => {
                aiSetupPane();
            });
            const migrateBtn = UI.button(setup, "Migrar", "ui-main-btn");
            migrateBtn.addEventListener('click', async () => {
                const oldfs = document.createElement('script');
                oldfs.src = './oldfs.js';
                document.body.appendChild(oldfs);
                oldfs.onload = async () => {
                    setTimeout(async () => {
                        status.innerText = "Obteniendo rutas de archivos...";
                        const all = await fs2.getall();
                        let counter = 0;
                        all.forEach(async (file) => {
                            counter++;
                            status.innerText = counter + "/" + all.length + ": " + file;
                            if (file.startsWith('/system/' || data.path.startsWith('/apps/'))) {
                                return;
                            } else {
                                const data = await fs2.read(file);
                                if (data.startsWith('data:')) {
                                    const base64Data = data.split(',')[1];
                                    const byteCharacters = atob(base64Data);
                                    const byteNumbers = new Array(byteCharacters.length);
                                    for (let i = 0; i < byteCharacters.length; i++) {
                                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                                    }
                                    const byteArray = new Uint8Array(byteNumbers);
                                    const blob = new Blob([byteArray], { type: 'image/png' });
                                    await fs.write(file, blob, 'blob');
                                } else {
                                    await fs.write(file, data, 'text');
                                }
                            }
                        });
                    }, 1000); // not fighting with old webdesk
                }
            });
        } else {

        }
    }

    async function logIn() {
        setup.innerHTML = '';
        const changeTxt2 = UI.text(setup, "");
        changeTxt2.style.marginBottom = '10px';
        const changeTxt = UI.create('span', changeTxt2);
        changeTxt.innerText = "Hacer una cuenta WebDesk ";
        const switchBtn = UI.button(changeTxt2, "Login instead", "ui-small-btn");
        const username = UI.input(setup, "Username", "ui-main-input wide", "text");
        const password = UI.input(setup, "Password", "ui-main-input wide", "password");
        const loginBtn = UI.button(setup, "Create account", "ui-main-btn");

        function switchToLogin() {
            changeTxt.innerText = "Iniciar sesion ";
            switchBtn.Filler.innerText = "Crear cuenta";
            loginBtn.Filler.innerText = "Iniciar sesion";
            switchBtn.removeEventListener('click', switchToLogin);
            switchBtn.addEventListener('click', switchToCreation);
            loginBtn.removeEventListener('click', createAccount);
            loginBtn.addEventListener('click', loginToAccount);
        }

        function switchToCreation() {
            changeTxt.innerText = "Hacer una cuenta WebDesk ";
            switchBtn.Filler.innerText = "Iniciar sesion";
            loginBtn.Filler.innerText = "Crear cuenta";
            switchBtn.removeEventListener('click', switchToCreation);
            switchBtn.addEventListener('click', switchToLogin);
            loginBtn.removeEventListener('click', loginToAccount);
            loginBtn.addEventListener('click', createAccount);
        }

        function loginToAccount() {
            if (username && password) {
                sys.socket.emit("signin", { user: username.value, pass: password.value });
            } else {
                wm.snack("Por favor introduce nombre y usuario");
            }
        }

        function createAccount() {
            if (username && password) {
                sys.socket.emit("newacc", { user: username.value, pass: password.value });
            } else {
                wm.snack("Introduce nombre y usuario");
            }
        }

        sys.socket.on("logininstead", () => {
            const menu = UI.create('div', setup, 'cm');
            UI.text(menu, "¡Ya tienes una cuenta! ¿Iniciar sesion como: " + username.value + "?");

            const noBtn = UI.button(menu, "Cerrar", "ui-main-btn");
            noBtn.addEventListener('click', () => {
                UI.remove(menu);
            });

            const yesBtn = UI.button(menu, "Iniciar sesion", "ui-main-btn");
            yesBtn.addEventListener('click', () => {
                sys.socket.emit("signin", { user: username.value, pass: password.value });
                UI.remove(menu);
            });
        });

        sys.socket.on("token", ({ token }) => {
            fs.write('/user/info/token', token);
            console.log('<i> Token received: ' + UI.truncate(token, 7));
            llmStatus();
        });

        switchToCreation();
    }

    async function llmStatus() {
        setup.innerHTML = '';
        UI.text(setup, "Assistant");
        UI.text(setup, `¡WebDesk ahora incluye una asistente llamada Chloe! Puede resumir documentos, notificaciones, escribir ensayos básicos, etc. Tiene una luz de estado en la barra de tareas que puedes consultar:`);

        const setupR = UI.create('div', setup, 'box-group')

        const normalOpBar = UI.leftRightLayout(setupR);
        const normalOpRing = UI.create('div', normalOpBar.left, 'ring');
        normalOpRing.style.setProperty('--color-start', '#08f');
        normalOpRing.style.setProperty('--color-end', '#00f');
        normalOpRing.style.setProperty('--speed', '4s');
        normalOpBar.right.innerText = "Esperando comandos...";

        UI.line(setupR);

        const workingOpBar = UI.leftRightLayout(setupR);
        const workingOpRing = UI.create('div', workingOpBar.left, 'ring');
        workingOpRing.style.setProperty('--color-start', '#fe0');
        workingOpRing.style.setProperty('--color-end', '#fb0');
        workingOpRing.style.setProperty('--speed', '2.5s');
        workingOpBar.right.innerText = "Pensando/Generando";

        UI.line(setupR);

        const startBar = UI.leftRightLayout(setupR);
        const startRing = UI.create('div', startBar.left, 'ring');
        startRing.style.setProperty('--color-start', '#c9f');
        startRing.style.setProperty('--color-end', '#88f');
        startRing.style.setProperty('--speed', '1s');
        startBar.right.innerText = "Iniciando/Cargando";

        UI.line(setupR);

        const disabledBar = UI.leftRightLayout(setupR);
        const disabledRing = UI.create('div', disabledBar.left, 'ring');
        disabledRing.style.setProperty('--color-start', '#999');
        disabledRing.style.setProperty('--color-end', '#999');
        disabledRing.style.setProperty('--speed', '2.5s');
        disabledBar.right.innerText = "Desactivado/Apagado";

        UI.line(setupR);

        const errorBar = UI.leftRightLayout(setupR);
        const errorRing = UI.create('div', errorBar.left, 'ring');
        errorRing.style.setProperty('--color-start', '#f00');
        errorRing.style.setProperty('--color-end', '#f00');
        setInterval(() => {
            errorRing.style.setProperty('--color-start', '#f00');
            errorRing.style.setProperty('--color-end', '#f00');

            setTimeout(() => {
                errorRing.style.setProperty('--color-start', 'rgba(0, 0, 0, 0)');
                errorRing.style.setProperty('--color-end', 'rgba(0, 0, 0, 0)');
            }, 300);
        }, 600);
        errorBar.right.innerText = "Error/Problema";

        const doneBtn = UI.button(setup, "Got it", "ui-main-btn");
        const deactivateAIBtn = UI.button(setup, "Desactivar caracteristicas de IA", "ui-main-btn");
        doneBtn.addEventListener('click', () => {
            set.write('setupdone', 'true');
            window.location.reload();
        });

        function deactivateAI() {
            set.write('setupdone', 'true');
            set.write('chloe', 'deactivated');
            UI.snack('Funciones de IA desactivadas. Puedes reactivarlas en Ajustes > Administrar IA.');
            deactivateAIBtn.Filler.innerText = "Reactivar funciones de IA";
            deactivateAIBtn.removeEventListener('click', deactivateAI);
            deactivateAIBtn.addEventListener('click', reactivateAI);
        }

        function reactivateAI() {
            set.del('chloe');
            UI.snack('Funciones de IA reactivadas. Puedes desactivarlas en Ajustes > Administrar IA.');
            deactivateAIBtn.Filler.innerText = "Desactivar funciones de IA";
            deactivateAIBtn.removeEventListener('click', reactivateAI);
            deactivateAIBtn.addEventListener('click', deactivateAI);
        }

        deactivateAIBtn.addEventListener('click', deactivateAI);
    }

    logIn();
}