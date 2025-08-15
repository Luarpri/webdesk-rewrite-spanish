export async function launch(UI, fs, Scripts) {
    const taskbar = UI.create('div', document.body, 'taskbar');
    const left = UI.create('div', taskbar, 'window-header-nav');
    const right = UI.create('div', taskbar, 'window-header-text');
    const appBTN = UI.button(left, 'Apps', 'ui-main-btn');
    const llmBTN = UI.button(left, '', 'ring-btn');
    const contLLM = UI.create('div', llmBTN, 'waiting');
    const ring = UI.create('div', contLLM, 'ring');
    const contBTN = UI.button(right, 'Controls', 'ui-main-btn');
    if (sys.LLMLoaded === "unsupported") {
        llmBTN.style.display = "none";
    }

    let currentMenu = {
        element: null,
        type: null
    };

    function closeCurrentMenu() {
        if (currentMenu.element) {
            UI.remove(currentMenu.element);
            document.removeEventListener('mousedown', handleOutsideClick);
            currentMenu.element = null;
            currentMenu.type = null;
        }
    }

    function handleOutsideClick(e) {
        if (
            currentMenu.element &&
            !currentMenu.element.contains(e.target) &&
            !appBTN.contains(e.target) &&
            !contBTN.contains(e.target)
        ) {
            closeCurrentMenu();
        }
    }

    async function openAppMenu() {
        closeCurrentMenu();

        const menu = UI.create('div', document.body, 'taskbar-menu');
        const taskrect = taskbar.getBoundingClientRect();
        menu.style.left = taskrect.left + "px";
        menu.style.bottom = taskrect.height + taskrect.left + taskrect.left + "px";
        const name = await set.read('name');
        if (name !== null) {
            UI.text(menu, name);
        }
        const items = await fs.ls('/system/apps/Desktop.app/Items');
        for (const file of items) {
            const btn = UI.button(menu, file.name, 'ui-main-btn wide');
            btn.addEventListener('click', async () => {
                const path = await fs.read(file.path);
                const code = await fs.read(path);
                const mod = await Scripts.loadModule(code);

                if (typeof mod.launch === 'function') {
                    const appInstance = await mod.launch(UI, fs, Scripts, true);
                    console.log(appInstance);
                } else {
                    console.warn(`${file.name} has no launch() export`);
                }

                closeCurrentMenu();
            });
        }

        currentMenu.element = menu;
        currentMenu.type = "apps";
        document.addEventListener('mousedown', handleOutsideClick);
    }

    async function openLLMMenu() {
        closeCurrentMenu();
        let messages = []

        const llmGo = await fs.read('/system/llm/prompt.txt');
        messages.push({
            content: llmGo,
            role: "system"
        });

        messages.push({
            content: "Hola! Introducete a ti mismo, manten la respuesta corta (20 palabras)",
            role: "user"
        })

        const menu = UI.create('div', document.body, 'taskbar-menu');
        menu.style.width = "300px";
        const messagebox = UI.create('div', menu);
        messagebox.style.height = "400px";
        messagebox.style.overflow = "auto";

        const taskrect = taskbar.getBoundingClientRect();
        menu.style.left = taskrect.left + "px";
        menu.style.bottom = taskrect.height + taskrect.left + taskrect.left + "px";

        currentMenu.element = menu;
        currentMenu.type = "llm";
        document.addEventListener('mousedown', handleOutsideClick);

        if (sys.LLMLoaded !== true) {
            if (sys.LLMLoaded === false) {
                UI.text(messagebox, "Chloe ha sido desactivada");
                UI.text(messagebox, "Te gustaria reactivarla?");
                const button = UI.button(messagebox, 'Reactivate', 'ui-main-btn');
                button.addEventListener('click', async function () {
                    messagebox.innerHTML = "<p>Has reactivado a Chloe.</p><p>Loading...</p>";
                    set.del('chloe');
                    const ai = await fs.read('/system/llm/startup.js');
                    let model = set.read('LLMModel');
                    if (!model) model = "QSmolLM2-1.7B-Instruct-q4f32_1-MLC"
                    Scripts.loadModule(ai).then(async (mod) => {
                        let readyResolve;
                        let ready = new Promise((resolve) => {
                            readyResolve = resolve;
                        });
                        mod.main(UI, readyResolve, model);
                        ready.then(() => {
                            closeCurrentMenu();
                            llmBTN.click();
                            sys.LLMLoaded = true;
                        });
                        sys.LLM = mod;
                    });
                });
            } else {
                UI.text(messagebox, "Chloe esta cargando...");
                UI.text(messagebox, "Estara contigo en un momento");
            }

            const closeBtn = UI.button(messagebox, 'Cerrar', 'ui-main-btn');
            closeBtn.addEventListener('click', async function () {
                closeCurrentMenu();
            });
        } else {
            const layout = UI.leftRightLayout(menu);
            const input = UI.create('input', layout.left, 'ui-main-input wide');
            input.placeholder = "Ask Chloe anything...";
            const btn = UI.button(layout.right, 'Send', 'ui-med-btn');

            btn.addEventListener('click', async function () {
                UI.text(messagebox, 'You: ' + input.value);
                let llmResponseTxt = UI.text(messagebox, 'Chloe: ');
                let llmResponse = "";
                const response = await UI.sendToLLM(messages, input.value, function (token) {
                    llmResponse += token;
                    llmResponseTxt.innerText = "Chloe: " + llmResponse;
                });

                llmResponseTxt.innerText = "Chloe: " + response;
            });

            let llmResponseTxt = UI.text(messagebox, 'Chloe: ');
            let llmResponse = "";
            const response = await UI.sendToLLM(messages, input.value, function (token) {
                llmResponse += token;
                llmResponseTxt.innerText = llmResponse;
            });

            llmResponseTxt.innerText = response;
        }
    }

    async function openControlsMenu() {
        closeCurrentMenu();

        const menu = UI.create('div', document.body, 'taskbar-menu');
        const input = UI.create('input', menu, 'hide');
        input.type = "file";
        input.addEventListener("change", async function () {
            for (const file of this.files) {
                const path = `/uploads/${file.name}`;
                const isImage = file.type.startsWith("image");
                const content = isImage ? file : await file.text();

                try {
                    await fs.write(path, content, isImage ? "blob" : "text");
                    const blob = await fs.read(path);
                    if (isImage && blob instanceof Blob) {
                        const img = document.createElement("img");
                        img.src = URL.createObjectURL(blob);
                        img.style.maxWidth = "200px";
                        document.body.appendChild(img);
                    } else {
                        console.log(`Contenido del archivo: ${file.name}:`, blob);
                    }
                } catch (err) {
                    console.error(`Error al procesar ${file.name}:`, err);
                }
            }
        });

        const uploadBtn = UI.button(menu, 'Subir archivo', 'ui-main-btn wide');
        uploadBtn.addEventListener('click', () => {
            input.click();
        });

        const softBtn = UI.button(menu, 'Reiniciar sin reinicializar', 'ui-main-btn wide');
        softBtn.addEventListener('click', () => {
            document.body.innerHTML = '';
            Scripts.loadJS('/system/init.js');
        });

        const taskrect = taskbar.getBoundingClientRect();
        menu.style.right = taskrect.left + "px";
        menu.style.bottom = taskrect.height + taskrect.left + taskrect.left + "px";

        currentMenu.element = menu;
        currentMenu.type = "controls";
        document.addEventListener('mousedown', handleOutsideClick);
    }

    appBTN.addEventListener('click', async () => {
        if (currentMenu.type === "apps") {
            closeCurrentMenu();
        } else {
            await openAppMenu();
        }
    });

    llmBTN.addEventListener('click', async () => {
        if (currentMenu.type === "llm") {
            closeCurrentMenu();
        } else {
            await openLLMMenu();
        }
    });

    contBTN.addEventListener('click', async () => {
        if (currentMenu.type === "controls") {
            closeCurrentMenu();
        } else {
            await openControlsMenu();
        }
    });

    const blob = await fs.read('/system/lib/wallpaper.jpg');
    console.log(blob);
    if (blob instanceof Blob) {
        const imageUrl = URL.createObjectURL(blob);
        document.body.style.backgroundImage = `url('${imageUrl}')`;
    } else {
        console.log(`<!> /system/lib/wallpaper.jpg no es una imagen decodificable por la interfaz de usuario de WebDesk.`);
    }
    return ring;

}
