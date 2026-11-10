(function (root) {
  'use strict';
  const KEY = 'nkfuen.final.progress.v2';
  function cleanRecords(records, allowed) {
    const result = {};
    if (!records || typeof records !== 'object' || Array.isArray(records)) return result;
    for (const id of allowed) {
      const entry = records[id];
      if (entry && typeof entry.checked === 'boolean' && Number.isFinite(entry.at) && entry.at >= 0) {
        result[id] = { checked: entry.checked, at: Math.min(entry.at, Date.now()) };
      }
    }
    return result;
  }
  function clean(value, data) {
    const obj = value && typeof value === 'object' ? value : {};
    return { schema: 2,
      trip: cleanRecords(obj.trip, data.trip.map(x => x.id)),
      shop: cleanRecords(obj.shop, data.shop.map(x => x.id)),
      day: data.meta.dates.includes(obj.day) ? obj.day : data.meta.dates[0],
      view: obj.view === 'shop' ? 'shop' : 'trip' };
  }
  function merge(a, b) {
    const result = { ...a, trip: { ...a.trip }, shop: { ...a.shop } };
    for (const kind of ['trip', 'shop']) {
      for (const [id, entry] of Object.entries(b[kind])) {
        if (!result[kind][id] || entry.at > result[kind][id].at) result[kind][id] = entry;
      }
    }
    return result;
  }
  const api = { KEY, clean, merge };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TravelState = api;
})(typeof window !== 'undefined' ? window : globalThis);
