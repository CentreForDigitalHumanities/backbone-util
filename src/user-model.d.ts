export interface StringDict {
    [key: string]: string;
}

export interface UserSettings {
    loginUrl: string;
    logoutUrl: string;
    registerUrl: string;
    confirmRegistrationUrl: string;
}

export interface User extends UserSettings {
    permissionsAttribute: string;
    registrationKeyName: string;

    login(credentials: StringDict): JQuery.jqXHR;
    logout(): JQuery.jqXHR;
    register(details: StringDict): JQuery.jqXHR;
    confirmRegistration(key: string): JQuery.jqXHR;
    hasPermission(permission: string): boolean;
}

function getUserMixin<T extends UserSettings>(settings: T) : User & T;

export default getUserMixin;
