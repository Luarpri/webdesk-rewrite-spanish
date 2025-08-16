export async function launch(UI, fs, Scripts) {
    const win = UI.window('Settings');
    win.win.style.width = "500px";
    win.win.style.height = "500px";
    win.headertxt.innerHTML = "";
    win.content.style.padding = "0px";
    win.content.style.display = "flex";
    const sidebar = UI.create('div', win.content, 'window-split-sidebar');
    sidebar.appendChild(win.header);
    win.header.classList.add('window-header-clear');
    win.header.style.padding = "14px";
    win.header.style.paddingBottom = "4px";
    const sidebarcontent = UI.create('div', sidebar, 'content');
    sidebarcontent.style.paddingTop = "0px";
    UI.create('span', sidebarcontent, 'smalltxt').textContent = "Settings";

    const generalButton = UI.button(sidebarcontent, 'General', 'ui-med-btn wide');
    generalButton.addEventListener('click', () => {
        General();
    });
    const personalizeButton = UI.button(sidebarcontent, 'Personalizar', 'ui-med-btn wide');
    personalizeButton.addEventListener('click', () => {
        Personalize();
    });
    const llmButton = UI.button(sidebarcontent, 'Administar IA', 'ui-med-btn wide');
    llmButton.addEventListener('click', () => {
        Assistant();
    });

    const container = UI.create('div', win.content, 'window-split-content');
    const title = UI.create('div', container, 'window-draggable');
    const content = UI.create('div', container);
    content.style.paddingTop = "4px";
    title.classList.add('bold');

    async function getTotalCacheSize(cacheNames) {
        let totalSize = 0;

        for (const name of cacheNames) {
            const cache = await caches.open(name);
            const requests = await cache.keys();

            for (const request of requests) {
                const response = await cache.match(request);
                if (response) {
                    const cloned = response.clone();
                    const buffer = await cloned.arrayBuffer();
                    totalSize += buffer.byteLength;
                }
            }
        }

        return totalSize;
    }

    function General() {
        content.innerHTML = '';
        title.innerText = "General";
        const group1 = UI.create('div', content, 'box-group');
        const eraseBtn = UI.button(group1, 'Borrar WebDesk', 'ui-main-btn wide');
        const appearbar = UI.leftRightLayout(group1);
        appearbar.left.innerHTML = '<span class="smalltxt">Modo de bajos recursos</span>';
        const enableBtn = UI.button(appearbar.right, 'Enable', 'ui-main-btn wide');
        enableBtn.addEventListener('click', () => {
            UI.System.lowgfxMode(true);
            set.write('lowend', 'true');
        });
        const disableBtn = UI.button(appearbar.right, 'Desactivar', 'ui-main-btn wide');
        disableBtn.addEventListener('click', () => {
            UI.System.lowgfxMode(false);
            set.write('lowend');
        });
    }

    async function Assistant() {
        content.innerHTML = '';
        title.innerText = "Administrar IA";
        if (('gpu' in navigator)) {
            const group1 = UI.create('div', content, 'box-group');
            const appearbar = UI.leftRightLayout(group1);
            appearbar.left.innerHTML = '<span class="smalltxt">Caracteristicas de IA</span>';
            const enableBtn = UI.button(appearbar.right, 'Activar', 'ui-main-btn wide');
            const disableBtn = UI.button(appearbar.right, 'Desactivar', 'ui-main-btn wide');
            disableBtn.addEventListener('click', async function () {
                if (sys.LLMLoaded !== false) {
                    const areyousure = UI.create('div', document.body, 'cm');
                    UI.text(areyousure, '¿Estas seguro?', 'bold');
                    UI.text(areyousure, 'WebDesk se reiniciara si desactivas las caracteristicas de IA');
                    const yes = UI.button(areyousure, 'Desactivar', 'ui-main-btn');
                    yes.addEventListener('click', async function () {
                        set.write('chloe', 'deactivated');
                        window.location.reload();
                    });

                    const no = UI.button(areyousure, 'Cancelar', 'ui-main-btn');
                    no.addEventListener('click', async function () {
                        UI.remove(areyousure);
                    });
                } else {
                    UI.text(areyousure, 'Las caracteristicas de IA se han desactivado');
                }
            });

            enableBtn.addEventListener('click', async function () {
                if (sys.LLMLoaded === false) {
                    wd.startLLM();
                }
            });

            UI.line(group1);

            const appearbar3 = UI.leftRightLayout(group1);
            let cacheArrays = ['webllm/config', 'webllm/wasm', 'webllm/model'];
            appearbar3.left.innerHTML = `<span class="smalltxt">Calculando espacio, por favor, espere...</span>`;

            const DELETEBTN = UI.button(appearbar3.right, 'Delete LLMs', 'ui-main-btn');
            DELETEBTN.addEventListener('click', async function () {
                const areyousure = UI.create('div', document.body, 'cm');
                UI.text(areyousure, 'Are you sure?', 'bold');
                UI.text(areyousure, 'WebDesk se reiniciará una vez que se eliminen los LLM. Si las funciones de IA están activadas, se volverá a descargar el LLM predeterminado.');
                const yes = UI.button(areyousure, 'Eliminar cache', 'ui-main-btn');
                yes.addEventListener('click', async function () {
                    for (const cacheName of cacheArrays) {
                        const deleted = await caches.delete(cacheName);
                        console.log(`Cache "${cacheName}" deleted:`, deleted);
                    }

                    set.del('LLMModel');
                    window.location.reload();
                });

                const no = UI.button(areyousure, 'Cancelar', 'ui-main-btn');
                no.addEventListener('click', async function () {
                    UI.remove(areyousure);
                });
            });

            const group2 = UI.create('div', content, 'box-group');
            const appearbar2 = UI.leftRightLayout(group2);
            appearbar2.left.innerHTML = '<span class="smalltxt">LLM a usar</span>';
            let modeln = await set.read('LLMModel');
            if (modeln === undefined) modeln = "SmolLM2-1.7B-Instruct-q4f32_1-MLC";
            const dropBtn = UI.button(appearbar2.right, UI.truncate(modeln, 25), 'ui-main-btn wide');
            dropBtn.dropBtnDecor();

            dropBtn.addEventListener('click', async function () {
                const rect = dropBtn.getBoundingClientRect();
                const event = {
                    clientX: Math.floor(rect.left),
                    clientY: Math.floor(rect.bottom)
                };

                const menu = UI.rightClickMenu(event);
                menu.style.width = `${Math.floor(rect.width) - 10}px`;
                if (sys.LLMLoaded === false) {
                    UI.text(menu, 'Activa las caracteristicas de IA para elegir el LLM.', 'smalltxt');
                } else {
                    menu.style.height = "350px";
                    const models = sys.LLM.listModels();
                    const btn2 = UI.button(menu, 'Default', 'ui-small-btn wide');
                    btn2.addEventListener('click', async function () {
                        set.del('LLMModel');
                        await sys.LLM.deactivate();
                        dropBtn.Filler.innerText = UI.truncate('SmolLM2-1.7B-Instruct-q4f32_1-MLC', 25);
                        await wd.startLLM();
                    });
                    models.forEach(function (model) {
                        if (model.toLowerCase().includes("chat") || model.toLowerCase().includes("instruct")) {
                            const btn = UI.button(menu, model, 'ui-small-btn wide');
                            btn.addEventListener('click', function () {
                                const rebootmsg = UI.create('div', document.body, 'cm');
                                UI.text(rebootmsg, 'Use this model?', 'bold');
                                const match = model.match(/(\d+(?:\.\d+)?)B/i);
                                const size = match ? parseFloat(match[1]) : 0;

                                if (size < 1.1) {
                                    UI.text(rebootmsg, `Este modelo tiene conocimientos limitados y podría tener dificultades con tareas complejas. Funciona correctamente en la mayoría de los dispositivos modernos.`);
                                } else if (size > 5.1) {
                                    UI.text(rebootmsg, `Este modelo es enorme. Destacará en casi todo, pero requiere hardware de alta gama para funcionar sin problemas.`);
                                } else {
                                    UI.text(rebootmsg, `Este es un modelo de tamaño mediano. Puede realizar la mayoría de las tareas con un seguimiento preciso, pero los equipos de gama baja pueden tener dificultades.`);
                                }
                                UI.text(rebootmsg, `Cada modelo actua diferente`);

                                UI.text(rebootmsg, 'Chloe reiniciará y utilizará el nuevo modelo a partir de ahora.');
                                const reboot = UI.button(rebootmsg, 'Usar modelo', 'ui-med-btn');
                                reboot.addEventListener('click', async function () {
                                    set.write('LLMModel', model);
                                    await sys.LLM.deactivate();
                                    dropBtn.Filler.innerText = UI.truncate(model, 25);
                                    await wd.startLLM();
                                });

                                const close = UI.button(rebootmsg, `Cancelar`, 'ui-med-btn');
                                close.addEventListener('click', function () {
                                    UI.remove(rebootmsg);
                                });
                            });
                        }
                    });
                }
            });

            UI.line(group2);

            const appearbar4 = UI.leftRightLayout(group2);
            appearbar4.left.innerHTML = `<span class="smalltxt">TEN CUIDADO</span>`;

            const changePrompt = UI.button(appearbar4.right, 'Cambiar personalidad', 'ui-main-btn');
            changePrompt.addEventListener('click', async function () {
                const code = await fs.read('/apps/TextEdit.app/index.js');
                const mod = await Scripts.loadModule(code);
                const textedit = await mod.launch(UI, fs);
                textedit.open('/system/llm/prompt.txt');
            });

            await getTotalCacheSize(cacheArrays)
                .then(sizeBytes => {
                    const cacheSizeGB = (sizeBytes / (1024 ** 3)).toFixed(2);
                    appearbar3.left.innerHTML = `<span class="smalltxt">Installed LLMs: ${cacheSizeGB} GB</span>`;
                });
        } else {
            UI.text(content, `Su navegador no es compatible con WebGPU, por lo que no se pueden utilizar funciones de IA.`);
            UI.text(content, `Utilice Chrome/un navegador basado en Chrome para habilitar las funciones de IA.`);
        }
    }

    function Personalize() {
        content.innerHTML = '';
        title.innerText = "Personalizacion";
        const group1 = UI.create('div', content, 'box-group');
        const appearbar = UI.leftRightLayout(group1);
        appearbar.left.innerHTML = '<span class="smalltxt">Apariencia</span>';
        const lightBtn = UI.button(appearbar.right, 'Claro', 'ui-main-btn wide');
        lightBtn.style.margin = "0px 0px 0px 4px";
        lightBtn.addEventListener('click', () => {
            UI.System.lightMode();
            set.write('appearance', 'light');
        });
        const darkBtn = UI.button(appearbar.right, 'Oscuro', 'ui-main-btn wide');
        darkBtn.style.margin = "0px 0px 0px 4px";
        darkBtn.addEventListener('click', () => {
            UI.System.darkMode();
            set.write('appearance', 'dark');
        });

        UI.line(group1);

        const accentbar = UI.leftRightLayout(group1);
        accentbar.left.innerHTML = '<span class="smalltxt">Color primario</span>';
        // Accent color buttons based off https://developer.apple.com/design/human-interface-guidelines/color
        const colors = [
            '175,82,222',   // Morado
            '0,122,255',   // Azul
            '90,200,250',  // Azul claro
            '52,199,89',   // Verde
            '255,204,0',   // Amarillo
            '255,149,0',   // Naranja
            '255,45,85',   // Rojo
        ];
        colors.forEach(color => {
            const colorButton = UI.button(accentbar.right, '', 'accent-button');
            colorButton.style.backgroundColor = "rgb(" + color + ")";
            colorButton.addEventListener('click', () => {
                UI.changevar('ui-accent', color);
                set.write('accent', color);
            });
        });
    }

    win.updateWindow();
    return {
        General: General(),
        Asistente: Assistant(),
        Personalizar: Personalize()
    };
}