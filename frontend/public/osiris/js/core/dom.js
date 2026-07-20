// O.S.I.R.I.S. — DOM element cache + $() shorthand
// Extracted verbatim from osiris-V4.html (MOD 03)
const DOM = {
    cache: {},
    get(id) { if (!this.cache[id]) this.cache[id] = document.getElementById(id); return this.cache[id]; }
};
const $ = id => DOM.get(id);

export { DOM, $ };
