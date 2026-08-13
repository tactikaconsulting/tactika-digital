# Despliegue de Bazar

## App principal

- Proyecto Vercel: `tactika-bazar`
- Root directory: `apps/bazar`
- Dominio: `bazar.tactikaconsulting.com`

## Landing de asesoria

La landing de asesoria actual vive aparte. No usar este repositorio para
reemplazar `www.tactikaconsulting.com`.

## DNS

En HostGator debe existir el subdominio:

```text
Tipo: CNAME
Nombre: bazar
Valor: cname.vercel-dns.com
```

Luego se valida en Vercel desde `Settings > Domains`.
