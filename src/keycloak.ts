// src/keycloak.ts
import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
    url: 'http://localhost:8080/',
    realm: 'whiteboard',
    clientId: 'whiteboard-frontend',
});

const initializeKeycloak = () => {
    return new Promise<void>((resolve, reject) => {
        keycloak.init({ onLoad: 'login-required' })
            .then((authenticated) => {
                if (authenticated) {
                    resolve();
                } else {
                    reject(new Error('Not authenticated'));
                }
            })
            .catch((error) => reject(error));
    });
};

export { keycloak, initializeKeycloak };
