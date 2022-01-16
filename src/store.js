import { writable } from "svelte/store";

export const isAuthenticated = writable(false);
export const user = writable({});
export const popupOpen = writable(false);
export const errors = writable([]);
export const token = writable("");
export const fruits = writable([]);
export const requestCounter = writable(0);
