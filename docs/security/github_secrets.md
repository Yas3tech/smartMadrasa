# GitHub Secrets requis

Configurer ces secrets dans les environnements GitHub (`staging`, `prod`):

- `FIREBASE_TOKEN`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_ERROR_WEBHOOK_URL` (optionnel mais recommande)

## Notes

- Utiliser des valeurs differentes par environnement.
- Restreindre l'acces aux maintainers autorises.
- Rotation reguliere des tokens/secrets.
