import * as feathers from 'svelte-feathers';
const icons = Object.keys(feathers);
console.log('User:', icons.includes('User'));
console.log('Settings:', icons.includes('Settings'));
console.log('Users:', icons.includes('Users'));
console.log('LogOut:', icons.includes('LogOut'));
console.log('LogIn:', icons.includes('LogIn'));
console.log('UserPlus:', icons.includes('UserPlus'));
