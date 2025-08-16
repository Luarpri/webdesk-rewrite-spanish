export async function launch(UI, fs, Scripts) {
    const win = UI.window('Files');
    win.win.style.width = "600px";
    win.win.style.height = "400px";
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
    UI.create('span', sidebarcontent, 'smalltxt').textContent = "Favorites";
    const container = UI.create('div', win.content, 'window-split-content');
    const crumbs = UI.create('div', container, 'window-draggable');
    const filelist = UI.create('div', container);
    filelist.style.paddingTop = "4px";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.height = "100%";
    crumbs.style.position = "sticky";
    crumbs.style.top = "0";
    crumbs.style.zIndex = "1";
    filelist.style.paddingTop = "4px";
    filelist.style.overflowY = "auto";
    sidebar.style.display = "flex";
    sidebar.style.flexDirection = "column";
    sidebar.style.height = "100%";
    win.header.style.flex = "none";
    sidebarcontent.style.flex = "1";
    sidebarcontent.style.overflow = "auto";

    let dir;
    async function nav(path) {
        dir = await fs.ls(path);
        console.log(path);
        console.log(dir);
        filelist.innerHTML = "";
        crumbs.innerHTML = "";
        const buttonhome = UI.button(crumbs, '/', 'ui-small-btn');
        buttonhome.onclick = () => {
            nav("");
        };
        const trimmedPath = path.replace(/\/+$/, '');
        const parts = trimmedPath.split('/').filter(Boolean);

        let currentPath = '';
        const breadcrumbs = [];

        parts.forEach((part, index) => {
            currentPath += `/${part}`;
            const crumbPath = parts.slice(0, index + 1).join('/');

            const button = UI.button(crumbs, part, 'ui-small-btn');
            button.onclick = () => {
                if (crumbPath.endsWith('/')) {
                    nav(crumbPath);
                } else {
                    nav(crumbPath + "/");
                }
            };

            breadcrumbs.push(button);
        });
        dir.forEach(function (file) {
            let name;
            if (file.kind === "directory") {
                name = `📁 ` + file.name;
            } else {
                name = `📄 ` + file.name;
            }

            async function openfile() {
                if (file.kind === "directory" && (file.path.endsWith('.app') || file.path.endsWith('.app'))) {
                    const code = await fs.read(file.path + '/index.js');
                    const mod = await Scripts.loadModule(code);
                    await mod.launch(UI, fs, Scripts, true);
                } else if (file.kind === "directory") {
                    nav(file.path);
                } else {
                    if (file.path.endsWith('.png') || file.path.endsWith('.jpg') || file.path.endsWith('.jpeg') || file.path.endsWith('.gif')) {
                        fs.read(file.path).then(blob => {
                            const win = UI.window(file.name);
                            win.content.style = "backdrop-filter: blur(0px); padding: 0px";
                            win.win.style.width = "450px";
                            const img = new Image();
                            const url = URL.createObjectURL(blob);
                            img.onload = () => {
                                URL.revokeObjectURL(url);
                            };
                            img.src = url;
                            img.style = "max-width: 100%";
                            win.content.appendChild(img);
                        }).catch(err => {
                            console.error(`Error al abrir ${file.name}:`, err);
                        });
                    } else {
                        const code = await fs.read('/apps/TextEdit.app/index.js');
                        const mod = await Scripts.loadModule(code);
                        const textedit = await mod.launch(UI, fs);
                        textedit.open(file.path);
                    }
                }
            }

            const button = UI.button(filelist, name, 'files-list');
            button.addEventListener('dblclick', async function () {
                await openfile();
            });

            document.addEventListener('mousedown', function (event) {
                if (event.button === 2) {
                    event.preventDefault();
                    const contextMenu = UI.rightClickMenu(event);

                    const openButton = UI.button(contextMenu, 'Abrir', 'ui-small-btn wide');
                    openButton.onclick = async () => {
                        if (file.kind === "directory") {
                            await nav(file.path);
                        } else {
                            await openfile();
                        }
                        contextMenu.remove();
                    };

                    const deleteButton = UI.button(contextMenu, 'Borrar', 'ui-small-btn wide');
                    deleteButton.onclick = async () => {
                        await fs.rm(file.path);
                        nav(currentPath);
                        contextMenu.remove();
                    };
                }
            });
        });
    }

    document.addEventListener('keydown', async (e) => {
        if ((e.shiftKey && e.ctrlKey && e.key === 'n') && UI.focusedWindow === win.win) {
            const win2 = await launch(UI, fs, Scripts);
            win2.window.win.style.left = (win.win.offsetLeft + 20) + "px";
            win2.window.win.style.top = (win.win.offsetTop + 20) + "px";
            win2.window.click();
        }
    });

    await nav('');
    win.updateWindow();
    return {
        open: nav,
        getDir: () => dir,
        window: win
    };
}

export async function pickFile(UI, fs, Scripts) {
    return new Promise(async (resolve) => {
        const win = UI.window('Files');
        win.win.style.width = "600px";
        win.win.style.height = "400px";
        win.headertxt.innerHTML = "";
        win.content.style.padding = "0px";
        win.content.style.display = "flex";
        const sidebar = UI.create('div', win.content, 'window-split-sidebar');
        win.buttons.closeBtn.style.display = "none";
        win.content.appendChild(win.buttons.closeBtn);
        sidebar.appendChild(win.header);
        win.header.classList.add('window-header-clear');
        win.header.style.padding = "14px";
        win.header.style.paddingBottom = "4px";
        const sidebarcontent = UI.create('div', sidebar, 'content');
        sidebarcontent.style.paddingTop = "0px";
        const container = UI.create('div', win.content, 'window-split-content');
        const crumbs = UI.create('div', container, 'window-draggable');
        const filelist = UI.create('div', container);
        filelist.style.paddingTop = "4px";
        container.style.display = "flex";
        container.style.flexDirection = "column";
        container.style.height = "100%";
        crumbs.style.position = "sticky";
        crumbs.style.top = "0";
        crumbs.style.zIndex = "1";
        filelist.style.paddingTop = "4px";
        filelist.style.overflowY = "auto";
        sidebar.style.display = "flex";
        sidebar.style.flexDirection = "column";
        sidebar.style.height = "100%";
        win.header.style.flex = "none";
        sidebarcontent.style.flex = "1";
        sidebarcontent.style.overflow = "auto";

        win.header.innerHTML = "";
        UI.create('span', win.header, 'smalltxt').textContent = "Selecciona un archivo";
        const cancelButton = UI.button(win.header, 'Cancelar', 'ui-small-btn wide');
        cancelButton.onclick = () => {
            win.buttons.closeBtn.click();
            resolve(null);
        };

        let dir;
        async function nav(path) {
            dir = await fs.ls(path);
            filelist.innerHTML = "";
            crumbs.innerHTML = "";
            const buttonhome = UI.button(crumbs, '/', 'ui-small-btn');
            buttonhome.onclick = () => {
                nav("");
            };
            const trimmedPath = path.replace(/\/+$/, '');
            const parts = trimmedPath.split('/').filter(Boolean);

            let currentPath = '';
            const breadcrumbs = [];

            parts.forEach((part, index) => {
                currentPath += `/${part}`;
                const crumbPath = parts.slice(0, index + 1).join('/');

                const button = UI.button(crumbs, part, 'ui-small-btn');
                button.onclick = () => {
                    nav(crumbPath);
                };

                breadcrumbs.push(button);
            });

            dir.forEach(function (file) {
                let name;
                if (file.kind === "directory") {
                    name = `📁 ` + file.name;
                } else {
                    name = `📄 ` + file.name;
                }

                const button = UI.button(filelist, name, 'files-list');
                button.addEventListener('dblclick', async function () {
                    if (file.kind === "directory") {
                        nav(file.path);
                    } else {
                        win.buttons.closeBtn.click();
                        resolve(file.path);
                    }
                });
            });
        }
        await nav('');
        win.updateWindow();
    });
}
