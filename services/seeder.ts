
import { dbService } from './db';
import { defaultRoles, defaultUsers } from '../utils/defaults';
import { companyData } from '../utils/companyData';
import type { User, Role } from '../types';

export const seedDatabase = async () => {
    // Solo ejecutar si estamos usando Firestore (Producción)
    // @ts-ignore
    const isProduction = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.PROD) || (typeof process !== 'undefined' && process.env.NODE_ENV === 'production');
    
    // Check if we are in production logic (based on dbService internals, usually detected via build flags)
    // We can also check if window.location.hostname is NOT localhost
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    // We allow seeding in local too if using Firestore emulator, but primarily for Prod
    if (!isProduction && isLocal) {
        console.log("Modo Desarrollo: Saltando sembrado automático (usando LocalStorage).");
        return;
    }

    try {
        const userService = dbService.getService<User>();
        const existingUsers = await userService.getAll('users', 1);

        if (existingUsers.length === 0) {
            console.log("Base de datos vacía detectada. Iniciando sembrado (Seeding)...");

            // 1. Roles
            const roleService = dbService.getService<Role>();
            for (const role of defaultRoles) {
                await roleService.create('roles', role);
                console.log(`Rol creado: ${role.name}`);
            }

            // 2. Usuarios
            for (const user of defaultUsers) {
                await userService.create('users', user);
                console.log(`Usuario creado: ${user.name}`);
            }

            // 3. Info Empresas (Guardada como documentos con ID fijo para fácil acceso)
            const settingsService = dbService.getService<any>();
            await settingsService.create('settings', { id: 'dizanoInfo', ...companyData.dizano });
            await settingsService.create('settings', { id: 'probenInfo', ...companyData.proben });
            
            console.log("¡Sembrado completado con éxito!");
            // Forzar recarga para que la app vea los nuevos datos si es necesario
            window.location.reload();
        } else {
            console.log("Base de datos ya inicializada.");
        }
    } catch (error) {
        console.error("Error durante el sembrado de datos:", error);
    }
};
