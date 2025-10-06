export const getStoredUUID = () => {
    return localStorage.getItem('SurveySparrowUUID') || null;
}

export const setUUID = (uuid: string) => {
    localStorage.setItem('SurveySparrowUUID', uuid);
}