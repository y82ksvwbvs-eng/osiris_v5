// O.S.I.R.I.S. — Import / export archive (JSON file, base64 blob).
// Extracted verbatim from osiris-V4.html (MOD 12).
import { CONFIG } from '../core/config.js';
import { Utils }  from '../core/utils.js';
import { $ }      from '../core/dom.js';
import { AudioEngine } from '../core/audio.js';
import { State }  from '../logic/state.js';

// Late-bound (Backup → UI and Backup ↔ ShareURL peer cycle).
let UI = null, ShareURL = null;
export function bindUI(u) { UI = u; }
export function bindShareURL(s) { ShareURL = s; }

const Backup = {
    b64e: (str) => btoa(unescape(encodeURIComponent(str))),
    b64d: (str) => decodeURIComponent(escape(atob(str))),
    validate(obj) {
        if (!obj || obj.schemaVersion !== CONFIG.SCHEMA_VERSION || !Array.isArray(obj.tasks) || typeof obj.history !== 'object') throw new Error('Invalid format');
        return true;
    },
    exportFile() {
        try {
            const blob = new Blob([JSON.stringify(State.data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob), a = document.createElement('a');
            a.href = url; a.download = `osiris_v3_${Utils.todayStr()}.json`; document.body.appendChild(a); a.click(); document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 3000); AudioEngine.play('success'); UI.popToast("BACKUP ESPORTATO.");
        } catch(e) { AudioEngine.play('error'); UI.popToast("ERRORE ESPORTAZIONE.", true); }
    },
    async copyBase64() {
        try {
            const code = this.b64e(JSON.stringify(State.data));
            await navigator.clipboard.writeText(code);
            AudioEngine.play('success'); UI.popToast("CODICE COPIATO NEGLI APPUNTI.");
        } catch(e) {
            $('backup-paste-area').value = this.b64e(JSON.stringify(State.data));
            $('backup-paste-area').select(); AudioEngine.play('check'); UI.popToast("CODICE SOTTO. COPIA MANUALMENTE.", true);
        }
    },
    importFile(e) {
        const file = e.target.files && e.target.files[0]; if (!file) return;
        if (file.size > 5 * 1024 * 1024) return UI.popToast("FILE TROPPO GRANDE.", true);
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const obj = JSON.parse(ev.target.result); this.validate(obj);
                State.data = obj; State.save(); UI.closeBackupModal(); AudioEngine.play('success'); UI.popToast("ARCHIVIO RIPRISTINATO.");
            } catch(err) { AudioEngine.play('error'); UI.popToast("FILE NON VALIDO.", true); }
        }; reader.readAsText(file); e.target.value = '';
    },
    importBase64() {
        const code = $('backup-paste-area').value.trim(); if (!code) return UI.popToast("INSERISCI CODICE.", true);
        try {
            const obj = JSON.parse(this.b64d(code)); this.validate(obj);
            State.data = obj; State.save(); UI.closeBackupModal(); AudioEngine.play('success'); UI.popToast("ARCHIVIO RIPRISTINATO.");
        } catch(err) { AudioEngine.play('error'); UI.popToast("CODICE CORROTTO.", true); }
    },
    copyShareURL() { ShareURL.copy(); }
};

export { Backup };
