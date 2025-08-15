var windowHighestZIndex = 0;

var UI = {
    create: function (eltype, parent, classname) {
        var el = document.createElement(eltype);
        if (classname) el.classList = classname;
        if (parent) parent.appendChild(el);
        return el;
    },
    button: function (parent, text, classname) {
        var btn = this.create("button", parent, classname);
        if (typeof classname === "string" && classname.includes("ui-main-btn")) {
            const txt = this.create("div", btn, "ui-main-btn-filler");
            txt.textContent = text;
            btn.Filler = txt;
        } else if (typeof classname === "string" && classname.includes("ui-small-btn")) {
            const txt = this.create("div", btn, "ui-small-btn-filler");
            txt.textContent = text;
            btn.Filler = txt;
        } else if (typeof classname === "string" && classname.includes("ui-med-btn")) {
            const txt = this.create("div", btn, "ui-med-btn-filler");
            txt.textContent = text;
            btn.Filler = txt;
        } else {
            btn.textContent = text;
        }

        btn.dropBtnDecor = function () {
            let elappend = btn;
            if (btn.Filler) {
                elappend = btn.Filler;
            }

            btn.style.setProperty("transform", "scale(1.0)", "important");
            const el = UI.create('span', elappend)
            el.innerText = ">";
            el.style = "display: inline-block; transform: rotate(90deg); margin-left: 4px;";
        };

        return btn;
    },
    input: function (parent, placeholder, classname, type) {
        var input = this.create("input", parent, classname);
        input.placeholder = placeholder;
        if (type) {
            input.type = type;
        }
        return input;
    },
    sendToLLM: async function (messages, userContent, token) {
        try {
            const result = await sys.LLM.send(messages, userContent, token);
            if (result && result.responseMessage) {
                return result.responseMessage;
            } else {
                throw new Error("<!> Sin respuesta");
            }
        } catch (error) {
            console.error("<!> Error al enviar el mensaje:", error);
            throw new Error("Error al enviar el mensaje");
        }
    },
    text: function (parent, text, classname) {
        var txt = this.create("p", parent, classname);
        txt.textContent = text;
        return txt;
    },
    window: function (title) {
        const win = this.create("div", document.body, "window");
        const header = this.create("div", win, "window-header window-draggable");
        const headerbtns = this.create("div", header, "window-header-nav");
        const headertxt = this.create("div", header, "window-header-text");
        const content = this.create("div", win, "window-content");
        headertxt.textContent = title;
        windowHighestZIndex += 1;
        win.style.zIndex = windowHighestZIndex;
        win.addEventListener("mousedown", () => {
            if (parseInt(win.style.zIndex) !== windowHighestZIndex) {
                windowHighestZIndex += 1;
                win.style.zIndex = windowHighestZIndex;
            }
            UI.focusedWindow = win;
        });

        const closeBtn = this.button(headerbtns, '', "window-btn close-btn");
        const minBtn = this.button(headerbtns, '', "window-btn min-btn");
        const maxBtn = this.button(headerbtns, '', "window-btn max-btn");

        let offsetX = 0, offsetY = 0;
        let isDragging = false;

        const onPointerMove = (e) => {
            if (!isDragging) return;
            win.style.position = "absolute";
            win.style.left = `${e.clientX - offsetX}px`;
            win.style.top = `${e.clientY - offsetY}px`;
        };

        const onPointerUp = () => {
            isDragging = false;
            window.removeEventListener("pointermove", onPointerMove);
            window.removeEventListener("pointerup", onPointerUp);
        };

        const setupDraggable = (el) => {
            el.style.touchAction = "none";
            el.addEventListener("pointerdown", (e) => {
                const rect = win.getBoundingClientRect();
                offsetX = e.clientX - rect.left;
                offsetY = e.clientY - rect.top;
                isDragging = true;

                window.addEventListener("pointermove", onPointerMove);
                window.addEventListener("pointerup", onPointerUp);
            });
        };

        const updateWindow = () => {
            const draggables = win.querySelectorAll('.window-draggable');
            draggables.forEach(setupDraggable);
            win.style.left = `${(window.innerWidth - win.offsetWidth) / 2}px`;
            win.style.top = `${(window.innerHeight - win.offsetHeight) / 2}px`;
        };

        updateWindow();

        closeBtn.addEventListener("click", () => {
            win.remove();
        });

        return { win, header, content, headertxt, headerbtns, buttons: { closeBtn, minBtn, maxBtn, container: headerbtns }, updateWindow };
    },
    img: async function (parent, path, classname) {
        const blob = await fs.read(path);
        if (blob instanceof Blob) {
            const img = this.create('img', parent, classname);
            img.src = URL.createObjectURL(blob);
        } else {
            console.log(`<!> ` + path + ` no es una imagen decodificable por la interfaz de usuario de WebDesk.`);
        }
    },
    changevar: function (varname, value) {
        document.documentElement.style.setProperty(`--${varname}`, value);
    },
    remove: function (element) {
        element.remove();
    },
    truncate: function (text, maxLength, ellipsis = true) {
        if (text.length <= maxLength) return text;
        if (ellipsis) {
            return text.slice(0, maxLength - 3) + '...';
        } else {
            return text.slice(0, maxLength);
        }
    },
    rightClickMenu: function (event) {
        const menu = this.create('div', document.body, 'right-click-menu');
        menu.style.left = `${event.clientX}px`;
        menu.style.top = `${event.clientY}px`;
        menu.style.maxHeight = window.innerHeight - event.clientY - 30 + "px";
        menu.style.maxWidth = window.innerWidth - event.clientX - 30 + "px";
        console.log(event.clientX);

        setTimeout(function () {
            document.addEventListener('click', () => {
                UI.remove(menu);
            }, { once: true });
        }, 500);

        return menu;
    },
    line: function (parent) {
        UI.create('div', parent, 'group-line');
    },
    leftRightLayout: function (parent) {
        const container = this.create('div', parent, 'flexbox');
        const left = this.create('div', container, 'flexbox-left');
        const right = this.create('div', container, 'flexbox-right');
        return { left, right };
    },
    snack: function (message, duration = 5000) {
        const snackbar = this.create('div', document.body, 'snack');
        snackbar.textContent = message;
        setTimeout(() => {
            UI.remove(snackbar);
        }, duration);
        return snackbar;
    },
    focusedWindow: undefined,
    System: {
        darkMode: function () {
            UI.changevar('bg-ui-primary', '35, 35, 35');
            UI.changevar('ui-secondary', '50, 50, 50');
            UI.changevar('text', '#fff');
        },
        lightMode: function () {
            UI.changevar('bg-ui-primary', '255, 255, 255');
            UI.changevar('ui-secondary', '240, 240, 240');
            UI.changevar('text', '#000');
        },
        llmRing: function (state) {
            // My name is Connor.
            // I'm the android sent by CyberLife.
            const ring = document.querySelector('.ring');
            if (ring) {
                if (state === 'waiting') {
                    ring.style.setProperty('--color-start', '#08f');
                    ring.style.setProperty('--color-end', '#00f');
                    ring.style.setProperty('--speed', '4s');
                } else if (state === 'thinking') {
                    ring.style.setProperty('--color-start', '#fe0');
                    ring.style.setProperty('--color-end', '#fb0');
                    ring.style.setProperty('--speed', '2.5s');
                } else if (state === 'disabled') {
                    ring.style.setProperty('--color-start', '#999');
                    ring.style.setProperty('--color-end', '#999');
                    ring.style.setProperty('--speed', '2.5s');
                    sys.LLMLoaded = false;
                } else if (state === "loading") {
                    ring.style.setProperty('--color-start', '#c9f');
                    ring.style.setProperty('--color-end', '#88f');
                    ring.style.setProperty('--speed', '1s');
                } else if (state === 'error') {
                    // DEVIANT!!!!!
                    ring.style.setProperty('--color-start', '#f00');
                    ring.style.setProperty('--color-end', '#f00');
                    setTimeout(() => {
                        ring.style.setProperty('--color-start', 'rgb(0, 0, 0, 0)');
                        ring.style.setProperty('--color-end', 'rgb(0, 0, 0, 0)');
                        setTimeout(() => {
                            ring.style.setProperty('--color-start', '#f00');
                            ring.style.setProperty('--color-end', '#f00');
                            setTimeout(() => {
                                UI.System.llmRing('waiting');
                            }, 200);
                        }, 170);
                    }, 200);
                }
            }
        },
        lowgfxMode: function (lowgfx) {
            if (lowgfx === true) {
                UI.changevar('main-ui-blur', '0px');
                UI.changevar('ui-transparancy', '1');
                UI.changevar('big-shadow', 'none');
                UI.changevar('small-shadow', 'none');
            } else {
                UI.changevar('main-ui-blur', '8px');
                UI.changevar('ui-transparancy', '0.85');
                UI.changevar('big-shadow', '0 6px 12px rgba(0, 0, 0, 0.2)')
                UI.changevar('small-shadow', '1px 0 8px rgba(0, 0, 0, 0.12)');
            }
        }
    }

}
