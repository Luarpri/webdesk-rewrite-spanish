export async function launch(UI, fs, Scripts, defaultlaunch) {
    async function open(path) {
        const bootcode = await fs.read(path);
        const debugwin = UI.window('TextEdit');
        debugwin.win.style.width = "600px";
        debugwin.win.style.height = "600px";

        const p = UI.text(debugwin.content, 'TextEdit');
        const textbox = UI.create("textarea", debugwin.content);
        textbox.placeholder = "Escribe aqui...";
        textbox.style.width = "100%";
        textbox.style.height = "400px";

        const savebutton = UI.button(debugwin.content, "Save");
        savebutton.onclick = async () => {
            const code = textbox.value;
            await fs.write(path, code, "text");
            p.textContent = 'Saved!';
            p.style.color = 'green';
            setTimeout(() => {
                p.textContent = 'TextEdit';
                p.style.color = '';
            }, 2000);
        };

        textbox.value = bootcode;

        if (textbox.value === "[object File]") {
            p.innerText = "Este archivo no es un archivo de texto, abrelo con su aplicacion correspondiente";
        }

        debugwin.updateWindow();
    }

    if (defaultlaunch) {
        const code = await fs.read('/apps/Files.app/index.js');
        const mod = await Scripts.loadModule(code);
        const path = await mod.pickFile(UI, fs);
        if (path) {
            await open(path);
        } else {
            console.warn('No file selected');
        }
    }

    return {
        open: open
    };
}