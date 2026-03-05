# SecureByDesign Audit Report v1.1
Date: 2026-03-05
System: smartMadrasa
Tier: REGULATED
Language: FR
Skill version: 1.1.0 — verify latest at https://github.com/securebydesign/skill

## Version Check
Running SecureByDesign v1.1.0. Verifier la derniere version sur: https://github.com/securebydesign/skill

## Resume
- Score global: **88/100**
- Verdict: **READY WITH WARNINGS**
- Blocants code corrigeables: **0 restants**
- Warnings operationnels: **3**

| Controls | Pass | Partial | Fail | N/A |
|---|---|---|---|---|
| 25 | 21 | 4 | 0 | 0 |

## Correctifs realises
1. Durcissement Firestore RBAC et isolation par classe:
   - role valide via custom claim + document Firestore
   - lecture `users` enseignant restreinte
   - lecture `events` scopee par role/classe
   - regles legacy ajoutees pour `users/{uid}/grades` et `users/{uid}/attendance`
2. Durcissement Storage:
   - contraintes MIME/taille sur fichiers de devoirs
   - droits de cleanup RGPD pour direction/superadmin
3. Suppression utilisateur RGPD:
   - suppression `profiles/{userId}`
   - suppression fichiers `homework/{homeworkId}/{studentId}/...`
4. Durcissement frontend:
   - suppression fuite d'erreurs techniques setup/login
   - garde-fou prod contre projet Firebase non-prod
5. Monitoring et pre-commit:
   - reporting erreurs client via webhook optionnel
   - CI GitHub Actions qualite/securite/deploiement
   - scripts `predeploy:prod`, `ci:quality`, `ci:security`, validation env
6. Gouvernance deploiement:
   - `.firebaserc` avec aliases `dev/staging/prod`
   - threat model, IAM baseline, backup/recovery, checklist deploiement

## Warnings restants (a valider avant go-live)
1. IAM GCP/Firebase doit etre confirme en console (least privilege, MFA, rotation cles).
2. Secrets GitHub Actions staging/prod doivent etre renseignes.
3. Drill de restauration backup doit etre execute et signe.

## Fichiers ajoutes/majeurs
- `.firebaserc`
- `.github/workflows/ci.yml`
- `.github/workflows/deploy.yml`
- `scripts/validate_env.js`
- `docs/security/threat_model.md`
- `docs/security/iam_baseline.md`
- `docs/security/backup_recovery.md`
- `docs/security/deployment_checklist.md`
- `src/services/monitoring.ts`

## Commande predeploy
```bash
pnpm predeploy:prod
```

## Scope of Assurance
This analysis covers known vulnerability patterns in the code and architecture provided.
It does not replace penetration testing, formal threat modeling, or a certified security audit for systems handling sensitive or regulated data.
